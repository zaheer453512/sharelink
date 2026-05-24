import type { FastifyInstance } from 'fastify';
import { resolveTeraBoxUrl, validateTeraBoxUrl } from '../services/terabox';
import { logRequest } from '../utils/analytics';

export async function resolveRoute(app: FastifyInstance) {
  app.post<{
    Body: { url: string };
  }>('/resolve', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 10, maxLength: 2048 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            size: { type: 'string' },
            resolution: { type: 'string' },
            duration: { type: 'string' },
            thumbnail: { type: 'string' },
            streamUrl: { type: 'string' },
            downloadUrl: { type: 'string' },
            subtitles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  lang: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
            cachedAt: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { url } = request.body;

    // Validate URL format
    const trimmed = url.trim();
    if (!validateTeraBoxUrl(trimmed)) {
      return reply.status(400).send({
        error: 'Invalid link',
        message: 'Please provide a valid TeraBox share link.',
      });
    }

    try {
      const result = await resolveTeraBoxUrl(trimmed);

      // Log to analytics (non-blocking)
      logRequest({ url: trimmed, ip: request.ip, success: true }).catch(() => {});

      return reply.send(result);
    } catch (err: any) {
      app.log.error({ err, url: trimmed }, 'Resolve failed');
      logRequest({ url: trimmed, ip: request.ip, success: false, error: err.message }).catch(() => {});

      const status = err.message?.includes('not found') ? 404
        : err.message?.includes('rate limit') ? 429
        : 500;

      return reply.status(status).send({
        error: 'Resolution failed',
        message: err.message || 'Unable to process this link.',
      });
    }
  });
}
