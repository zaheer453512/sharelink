import crypto from 'crypto';
import { redis } from '../server';

// ─── KEY FIX: Stream URLs expire in ~1-2 hrs on TeraBox CDN.
// Cache only metadata; never cache the raw stream/download URLs.
// We store a short-lived "url-to-resolved-data" mapping and
// always re-fetch if the stream portion is stale.
const METADATA_CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600');   // 1 hour max
const STREAM_URL_TTL     = parseInt(process.env.STREAM_URL_TTL_SECONDS || '1800'); // 30 min — conservative

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
  // NEW: unix timestamp when stream URLs were fetched
  streamFetchedAt?: number;
  views?: number;
  sourceUrl?: string;
  folderName?: string;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function getCacheKey(url: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(url.trim().toLowerCase())
    .digest('hex');
  return `terastream:resolve:v2:${hash}`; // v2 to bust old 12-hr cached entries
}

/**
 * Is the cached stream URL still usable?
 * Returns false if it was fetched more than STREAM_URL_TTL seconds ago.
 */
function isStreamFresh(cachedAt: number | undefined): boolean {
  if (!cachedAt) return false;
  return Date.now() - cachedAt < STREAM_URL_TTL * 1000;
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

  // 1. Check Redis — but ONLY use cached stream URLs if still fresh
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ResolvedFile;

      if (isStreamFresh(parsed.streamFetchedAt)) {
        // Stream URLs still valid — return as-is
        return parsed;
      }

      // Stream URLs stale — fall through to re-fetch from API.
      // We'll keep the metadata (title, size etc.) but replace stream URLs.
      console.info('[TeraBox] Cache hit but stream URLs stale — refreshing…');
    }
  } catch (err) {
    console.error('[TeraBox] Redis get error:', err);
  }

  // 2. Call external API
  if (!API_KEY) {
    throw new Error(
      'API key not configured. Please set XAPIVERSE_API_KEY in environment variables.'
    );
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
    if (response.status === 429)
      throw new Error('API rate limit reached. Please try again later.');
    if (response.status === 404)
      throw new Error('File not found or link has expired.');
    throw new Error(`API error ${response.status}: ${errBody || 'Unknown error'}`);
  }

  const apiResponse: any = await response.json();
  console.log('[TeraBox] API response keys:', Object.keys(apiResponse));

  const fileData = apiResponse.list?.[0] || apiResponse;

  // 3. Normalize qualities
  const qualities: StreamQuality[] = Object.entries(
    fileData.fast_stream_url || {}
  ).map(([label, u]) => ({
    label,
    url: String(u),
  }));

  // Quality priority order for streamUrl:
  // Pick the LOWEST quality available as default so it starts fast.
  // Users can switch up via the quality selector.
  const QUALITY_PRIORITY = ['360p', '480p', '720p', '1080p'];

  const bestStartUrl =
    QUALITY_PRIORITY.map((q) => qualities.find((x) => x.label === q)?.url)
      .find(Boolean) ||
    fileData.stream_url ||
    fileData.hls_url ||
    fileData.video_url ||
    '';

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
      qualities[qualities.length - 1]?.label ||
      '',

    duration:
      typeof fileData.duration === 'string'
        ? fileData.duration
        : formatDuration(fileData.video_duration || 0),

    thumbnail: fileData.thumbnail || fileData.thumb || '',

    streamUrl: bestStartUrl,

    qualities,

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
    streamFetchedAt: now, // track when stream URLs were fetched
  };

  if (!result.streamUrl && !result.downloadUrl) {
    throw new Error('No streaming or download URL found for this file.');
  }

  // 4. Save to Redis with shorter TTL
  try {
    await redis.setex(cacheKey, METADATA_CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error('[TeraBox] Redis set error:', err);
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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