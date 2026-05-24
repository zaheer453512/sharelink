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

    // Basic URL validation
    try {
      new URL(downloadUrl);
    } catch {
      return reply.status(400).send({ error: 'Invalid download URL' });
    }

    try {
      // Log download analytics (non-blocking)
      redis.hincrby('analytics:downloads', 'total', 1).catch(() => {});

      // Proxy the download
      const upstream = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.terabox.com/',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!upstream.ok) {
        return reply.status(upstream.status).send({ error: 'Upstream download failed' });
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = upstream.headers.get('content-disposition') || 'attachment; filename="video.mp4"';
      const contentLength = upstream.headers.get('content-length');

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', contentDisposition);
      reply.header('Cache-Control', 'no-cache');
      reply.header('X-Content-Type-Options', 'nosniff');
      if (contentLength) reply.header('Content-Length', contentLength);

      // Stream the response
      return reply.send(upstream.body);
    } catch (err: any) {
      app.log.error({ err }, 'Download proxy error');
      return reply.status(500).send({ error: 'Download failed', message: err.message });
    }
  });
}

// ===== HEALTH CHECK ROUTE =====
export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (_, reply) => {
    const redisStatus = await redis.ping().then(() => 'ok').catch(() => 'error');
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      version: process.env.npm_package_version || '1.0.0',
    });
  });
}
