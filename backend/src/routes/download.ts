import type { FastifyInstance } from 'fastify';
import { redis } from '../server';

// ===== DOWNLOAD ROUTE =====
export async function downloadRoute(app: FastifyInstance) {
  app.get<{
    Querystring: { id: string };
  }>('/download', async (request, reply) => {
    const { id } = request.query;
    if (!id) return reply.status(400).send({ error: 'Missing download ID' });

    const downloadUrl = decodeURIComponent(id);

    try {
      new URL(downloadUrl);
    } catch {
      return reply.status(400).send({ error: 'Invalid download URL' });
    }

    try {
      redis.hincrby('analytics:downloads', 'total', 1).catch(() => {});

      // ── KEY FIX: Forward Range header for seekable downloads ──
      // Without this, browsers can't seek in downloaded videos and
      // some players stall waiting for range support.
      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.terabox.com/',
      };

      const rangeHeader = request.headers['range'];
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }

      const upstream = await fetch(downloadUrl, {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(30000),
      });

      // Accept both 200 and 206 (partial content) as success
      if (!upstream.ok && upstream.status !== 206) {
        return reply
          .status(upstream.status)
          .send({ error: 'Upstream download failed' });
      }

      const contentType =
        upstream.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition =
        upstream.headers.get('content-disposition') ||
        'attachment; filename="video.mp4"';
      const contentLength = upstream.headers.get('content-length');
      const contentRange  = upstream.headers.get('content-range');
      const acceptRanges  = upstream.headers.get('accept-ranges');

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', contentDisposition);
      reply.header('Cache-Control', 'no-cache');
      reply.header('X-Content-Type-Options', 'nosniff');
      // ── Pass through range headers so seekable streaming works ──
      if (contentLength)  reply.header('Content-Length', contentLength);
      if (contentRange)   reply.header('Content-Range', contentRange);
      if (acceptRanges)   reply.header('Accept-Ranges', acceptRanges);

      // Use 206 status if upstream returned partial content
      if (upstream.status === 206) {
        reply.status(206);
      }

      return reply.send(upstream.body);
    } catch (err: any) {
      app.log.error({ err }, 'Download proxy error');
      return reply
        .status(500)
        .send({ error: 'Download failed', message: err.message });
    }
  });
}

// ===== STREAM PROXY ROUTE =====
// NEW: A dedicated proxy endpoint for video streaming.
// This solves CORS issues when TeraBox CDN blocks browser-direct requests,
// and adds proper Range support for Video.js seeking.
export async function streamProxyRoute(app: FastifyInstance) {
  app.get<{
    Querystring: { url: string };
  }>('/stream', async (request, reply) => {
    const { url: rawUrl } = request.query;
    if (!rawUrl)
      return reply.status(400).send({ error: 'Missing stream URL' });

    const streamUrl = decodeURIComponent(rawUrl);

    try {
      new URL(streamUrl);
    } catch {
      return reply.status(400).send({ error: 'Invalid stream URL' });
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':  'https://www.terabox.com/',
        'Origin':   'https://www.terabox.com',
      };

      // Forward Range header — critical for video seeking
      const rangeHeader = request.headers['range'];
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }

      const upstream = await fetch(streamUrl, {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(60000), // 60s for large video chunks
      });

      if (!upstream.ok && upstream.status !== 206) {
        app.log.warn(
          { status: upstream.status, url: streamUrl },
          'Stream proxy upstream error'
        );
        return reply
          .status(upstream.status)
          .send({ error: 'Stream unavailable' });
      }

      // ── CORS headers so browser can receive the stream ──
      const origin = request.headers['origin'];
      const allowedOrigin =
        process.env.FRONTEND_URL || 'http://localhost:3000';
      reply.header(
        'Access-Control-Allow-Origin',
        origin === allowedOrigin ? origin : allowedOrigin
      );
      reply.header('Access-Control-Allow-Headers', 'Range');
      reply.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

      // ── Forward all relevant response headers ──
      const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag',
      ];
      for (const h of headersToForward) {
        const val = upstream.headers.get(h);
        if (val) reply.header(h, val);
      }

      // Cache streams briefly at CDN/browser level
      reply.header('Cache-Control', 'public, max-age=300');

      if (upstream.status === 206) {
        reply.status(206);
      }

      return reply.send(upstream.body);
    } catch (err: any) {
      app.log.error({ err }, 'Stream proxy error');
      return reply
        .status(500)
        .send({ error: 'Stream proxy failed', message: err.message });
    }
  });
}

// ===== HEALTH CHECK =====
export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (_, reply) => {
    const redisStatus = await redis
      .ping()
      .then(() => 'ok')
      .catch(() => 'error');
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      version: process.env.npm_package_version || '1.0.0',
    });
  });
}