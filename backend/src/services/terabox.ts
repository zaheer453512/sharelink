import crypto from 'crypto';
import { redis } from '../server';

// Stream URLs from xAPIverse expire in ~1-2 hrs.
// HLS Worker URLs (*.workers.dev) are additionally unstable — we skip them.
const METADATA_CACHE_TTL  = 3600;  // 1 hour
const STREAM_URL_TTL      = 1800;  // 30 min stream freshness window

const API_ENDPOINT =
  process.env.XAPIVERSE_API_ENDPOINT || 'https://xapiverse.com/api/terabox';
const API_KEY = process.env.XAPIVERSE_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamQuality {
  label: string;
  url: string;
}

export interface SubtitleTrack {
  label: string;
  lang: string;
  url: string;
}

export interface ResolvedFile {
  title: string;
  size: string;
  resolution: string;
  duration: string;
  thumbnail: string;
  streamUrl: string;
  qualities: StreamQuality[];
  downloadUrl: string;
  subtitles: SubtitleTrack[];
  cachedAt?: number;
  streamFetchedAt?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCacheKey(url: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(url.trim().toLowerCase())
    .digest('hex');
  return `terastream:resolve:v3:${hash}`; // v3 busts all old cached HLS entries
}

function isStreamFresh(fetchedAt: number | undefined): boolean {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < STREAM_URL_TTL * 1000;
}

/**
 * KEY FIX: Reject unstable HLS Worker URLs from xAPIverse.
 *
 * xAPIverse fast_stream_url values look like:
 *   https://round-mountain-2461.lelidulu.workers.dev/fast_stream?token=...m3u8
 *   https://withered-term-6150.ledepamu.workers.dev/fast_stream?token=...m3u8
 *
 * These are Cloudflare Worker proxies that serve HLS playlists, but the
 * underlying segment fetches fail with ERR_QUIC_PROTOCOL_ERROR /
 * NETWORK_IDLE_TIMEOUT. We detect and discard them, falling back to the
 * direct stream_url / video_url / download_url which are stable MP4s.
 */
function isUnstableHlsWorker(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // *.workers.dev HLS streams — unstable
    if (parsed.hostname.endsWith('.workers.dev')) return true;
    // Any URL whose path ends with .m3u8 from a workers subdomain
    if (parsed.pathname.includes('.m3u8') && parsed.hostname.includes('workers')) return true;
  } catch {
    return false;
  }
  return false;
}

/**
 * Filter quality list: remove Worker HLS entries, keep direct MP4/stable URLs.
 */
function filterQualities(raw: StreamQuality[]): StreamQuality[] {
  return raw.filter((q) => q.url && !isUnstableHlsWorker(q.url));
}

/**
 * Pick the best starting stream URL.
 * Priority: lowest stable quality first (for fast start), then fallbacks.
 */
function pickStreamUrl(
  qualities: StreamQuality[],
  fileData: any
): string {
  const PRIORITY = ['360p', '480p', '720p', '1080p', '4K', 'HD', 'SD'];

  // Try stable quality URLs in priority order
  for (const label of PRIORITY) {
    const match = qualities.find((q) => q.label === label);
    if (match?.url) return match.url;
  }

  // Any stable quality URL
  if (qualities[0]?.url) return qualities[0].url;

  // Direct non-worker stream fields from API
  const candidates = [
    fileData.stream_url,
    fileData.video_url,
    fileData.hls_url,
    fileData.direct_url,
    fileData.download_url,
    fileData.normal_dlink,
  ].filter(Boolean);

  // Prefer non-worker URLs
  const stableCandidate = candidates.find((u) => !isUnstableHlsWorker(u));
  if (stableCandidate) return stableCandidate;

  // Last resort: use whatever is available
  return candidates[0] || '';
}

// ─── URL validation ───────────────────────────────────────────────────────────

export function validateTeraBoxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveTeraBoxUrl(url: string): Promise<ResolvedFile> {
  const cacheKey = getCacheKey(url);

  // 1. Check Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ResolvedFile;
      if (isStreamFresh(parsed.streamFetchedAt)) {
        console.info('[TeraBox] Cache hit — stream still fresh');
        return parsed;
      }
      console.info('[TeraBox] Cache hit but stream stale — refreshing from API');
    }
  } catch (err) {
    console.error('[TeraBox] Redis get error:', err);
  }

  // 2. Call xAPIverse API
  if (!API_KEY) {
    throw new Error('API key not configured. Set XAPIVERSE_API_KEY.');
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xAPIverse-Key': API_KEY,
      'User-Agent': 'TeraStream/1.0',
    },
    body: JSON.stringify({ url: url.trim() }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    if (response.status === 429) throw new Error('API rate limit reached. Please try again later.');
    if (response.status === 404) throw new Error('File not found or link has expired.');
    throw new Error(`API error ${response.status}: ${errBody || 'Unknown error'}`);
  }

  const apiResponse: any = await response.json();

  // Log raw response for debugging (remove in production)
  console.log('[TeraBox] Raw API keys:', JSON.stringify(Object.keys(apiResponse)));

  const fileData = apiResponse.list?.[0] || apiResponse;

  // 3. Build quality list — FILTER OUT unstable HLS worker URLs
  const rawQualities: StreamQuality[] = Object.entries(
    fileData.fast_stream_url || {}
  ).map(([label, u]) => ({ label, url: String(u) }));

  const stableQualities = filterQualities(rawQualities);

  // Log what was filtered for visibility
  const filteredOut = rawQualities.filter((q) => isUnstableHlsWorker(q.url));
  if (filteredOut.length > 0) {
    console.warn(
      '[TeraBox] Filtered out unstable HLS worker URLs:',
      filteredOut.map((q) => q.label)
    );
  }

  const now = Date.now();

  const result: ResolvedFile = {
    title:
      fileData.file_name ||
      fileData.name ||
      fileData.title ||
      'Untitled Video',

    size: formatBytes(fileData.file_size || fileData.size || 0),

    resolution:
      fileData.resolution ||
      fileData.video_quality ||
      stableQualities[stableQualities.length - 1]?.label ||
      '',

    duration:
      typeof fileData.duration === 'string'
        ? fileData.duration
        : formatDuration(fileData.video_duration || 0),

    thumbnail: fileData.thumbnail || fileData.thumb || '',

    // Use stable stream URL — lowest quality first for fast start
    streamUrl: pickStreamUrl(stableQualities, fileData),

    // Only expose stable quality options to the frontend
    qualities: stableQualities,

    downloadUrl:
      fileData.download_url ||
      fileData.direct_url ||
      fileData.normal_dlink ||
      fileData.zip_dlink ||
      '',

    subtitles: Array.isArray(fileData.subtitles)
      ? fileData.subtitles
          .filter((s: any) => s?.url || s?.src)
          .map((s: any) => ({
            label: s.label || s.language || 'Unknown',
            lang: s.lang || s.code || 'en',
            url: s.url || s.src || '',
          }))
      : [],

    cachedAt: now,
    streamFetchedAt: now,
  };

  if (!result.streamUrl && !result.downloadUrl) {
    throw new Error('No stable streaming URL found for this file. The link may be unsupported.');
  }

  // Log what we're using
  console.info('[TeraBox] Using streamUrl:', result.streamUrl.substring(0, 80) + '...');
  console.info('[TeraBox] Stable qualities:', stableQualities.map((q) => q.label));

  // 4. Cache result
  try {
    await redis.setex(cacheKey, METADATA_CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error('[TeraBox] Redis set error:', err);
  }

  return result;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
