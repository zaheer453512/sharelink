import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import Redis from 'ioredis';
import { resolveRoute } from './routes/resolve';
import { downloadRoute } from './routes/download';
import healthRoute from './routes/health';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Redis connection
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('error', (err) => {
  app.log.error(err, 'Redis connection error');
});

redis.on('connect', () => {
  app.log.info('Redis connected');
});

// Plugins
app.register(helmet, {
  contentSecurityPolicy: false, // Handled by Cloudflare
});

app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
});

app.register(rateLimit, {
  global: true,
  max: 60,
  timeWindow: '1 minute',
  redis,
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait before making another request.',
  }),
});

// Internal key auth for Next.js API routes
app.addHook('onRequest', async (request, reply) => {
  const internalKey = request.headers['x-internal-key'];
  if (process.env.INTERNAL_API_KEY && internalKey !== process.env.INTERNAL_API_KEY) {
    // Only block on protected routes
    const protectedPaths = ['/api/resolve', '/api/download'];
    if (protectedPaths.includes(request.url.split('?')[0])) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  }
});

// Routes
app.register(resolveRoute, { prefix: '/api' });
app.register(downloadRoute, { prefix: '/api' });
app.register(healthRoute, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });
    app.log.info(`TeraStream backend running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
