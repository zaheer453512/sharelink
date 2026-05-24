import crypto from 'crypto';
import { redis } from '../server';

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '43200'); // 12 hours
const API_ENDPOINT =
  process.env.XAPIVERSE_API_ENDPOINT ||
  'https://xapiverse.com/api/terabox';
const API_KEY = process.env.XAPIVERSE_API_KEY || '';

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
  // Basic Metadata
  title: string;
  size: string;
  resolution: string;
  duration: string;
  thumbnail: string;

  // Main Streaming URL
  streamUrl: string;

  // Available Stream Qualities
  qualities: StreamQuality[];

  // Download URL
  downloadUrl: string;

  // Subtitle Tracks
  subtitles: SubtitleTrack[];

  // Cache Metadata
  cachedAt?: number;

  // Optional Future Fields
  views?: number;
  sourceUrl?: string;
  folderName?: string;
}

type TeraBoxApiResponse = {
  // Basic File Information
  file_name?: string;
  title?: string;

  // File Size
  file_size?: number;
  size?: number;

  // Video Quality / Resolution
  resolution?: string;
  video_quality?: string;

  // Video Duration
  duration?: number;
  video_duration?: number;

  // Thumbnail Images
  thumbnail?: string;
  thumb?: string;

  // Main Streaming URLs
  stream_url?: string;
  hls_url?: string;
  video_url?: string;

  // Multiple Quality Streaming URLs
  fast_stream_url?: Record<string, string>;

  // Download URLs
  download_url?: string;
  direct_url?: string;
  normal_dlink?: string;
  zip_dlink?: string;

  // Subtitle Tracks
  subtitles?: Array<{
    label?: string;
    language?: string;
    lang?: string;
    code?: string;
    url?: string;
    src?: string;
  }>;

  // Optional Future Fields
  quality?: string;
  size_formatted?: string;
  folder?: string;
  fs_id?: number;
};

/**
 * Generate a consistent cache key from a URL
 */
function getCacheKey(url: string): string {
  const hash = crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
  return `terastream:resolve:${hash}`;
}

/**
 * Validate that a URL looks like a supported TeraBox link
 */
export function validateTeraBoxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return Boolean(
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

/**
 * Resolve a TeraBox URL to streaming/download data
 * Uses Redis cache to avoid repeated API calls
 */
export async function resolveTeraBoxUrl(url: string): Promise<ResolvedFile> {
  const cacheKey = getCacheKey(url);

  // 1. Check Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ResolvedFile;
      return { ...parsed, cachedAt: parsed.cachedAt };
    }
  } catch (err) {
    console.error('Redis get error:', err);
    // Continue without cache
  }

  // 2. Call external API
  if (!API_KEY) {
    throw new Error('API key not configured. Please set XAPIVERSE_API_KEY in environment variables.');
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xAPIverse-Key': API_KEY,
      'User-Agent': 'TeraStream/1.0',
    },
    body: JSON.stringify({ url: url.trim() }),
    signal: AbortSignal.timeout(15000), // 15s timeout
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    if (response.status === 429) throw new Error('API rate limit reached. Please try again later.');
    if (response.status === 404) throw new Error('File not found or link has expired.');
    throw new Error(`API error ${response.status}: ${errBody || 'Unknown error'}`);
  }

  const apiData = (await response.json()) as TeraBoxApiResponse;

  // 3. Normalize API response
  const qualities = Object.entries(
  apiData.fast_stream_url || {}
).map(([label, url]) => ({
  label,
  url: String(url),
}));

const result: ResolvedFile = {
  // Basic Metadata
  title:
    apiData.file_name ||
    apiData.title ||
    'Untitled Video',

  size: formatBytes(
    apiData.file_size ||
    apiData.size ||
    0
  ),

  resolution:
    apiData.resolution ||
    apiData.video_quality ||
    qualities[qualities.length - 1]?.label ||
    '',

  duration: formatDuration(
    apiData.duration ||
    apiData.video_duration ||
    0
  ),

  thumbnail:
    apiData.thumbnail ||
    apiData.thumb ||
    '',

  // Main Streaming URL
  streamUrl:
    qualities.find(q => q.label === '1080p')?.url ||
    qualities.find(q => q.label === '720p')?.url ||
    qualities.find(q => q.label === '480p')?.url ||
    qualities.find(q => q.label === '360p')?.url ||
    apiData.stream_url ||
    apiData.hls_url ||
    apiData.video_url ||
    '',

  // Available Stream Qualities
  qualities,

  // Download URLs
  downloadUrl:
    apiData.download_url ||
    apiData.direct_url ||
    '',

  // Subtitle Tracks
  subtitles: Array.isArray(apiData.subtitles)
    ? apiData.subtitles
        .filter((s: any) => s?.url || s?.src)
        .map((s: any) => ({
          label:
            s.label ||
            s.language ||
            'Unknown',

          lang:
            s.lang ||
            s.code ||
            'en',

          url:
            s.url ||
            s.src ||
            '',
        }))
    : [],

  // Cache Timestamp
  cachedAt: Date.now(),
};

  if (!result.streamUrl && !result.downloadUrl) {
    throw new Error('No streaming or download URL found for this file.');
  }

  // 4. Save to Redis cache
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error('Redis set error:', err);
    // Continue without caching
  }

  return result;
}

// Helpers
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
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
