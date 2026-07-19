import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ConfigProvider } from '../config/ConfigProvider.js';
import { type AuthProvider } from '../auth/AuthProvider.js';
import { type RegisterDeviceUseCase } from '../application/provisioning/RegisterDeviceUseCase.js';
import { type ProcessHeartbeatUseCase } from '../application/heartbeat/ProcessHeartbeatUseCase.js';
import { type CreateCommandUseCase } from '../application/commands/CreateCommandUseCase.js';
import { type ProcessAckUseCase } from '../application/commands/ProcessAckUseCase.js';
import { type GetSummaryUseCase } from '../application/admin/GetSummaryUseCase.js';
import { type GetDevicesUseCase } from '../application/admin/GetDevicesUseCase.js';
import { type GetDeviceDetailUseCase } from '../application/admin/GetDeviceDetailUseCase.js';
import { type GetDeviceTimelineUseCase } from '../application/admin/GetDeviceTimelineUseCase.js';
import { type GetCommandHistoryUseCase } from '../application/admin/GetCommandHistoryUseCase.js';
import { logger } from '../core/logger.js';

// Plugins
import { correlationPlugin } from './plugins/correlation.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { authPlugin } from './plugins/auth.js';

// Routes
import { healthRoutes } from './versions/v1/routes/health.js';
import { registerRoutes } from './versions/v1/routes/register.js';
import { heartbeatRoutes } from './versions/v1/routes/heartbeat.js';
import { commandRoutes } from './versions/v1/routes/commands.js';
import { adminRoutes } from './routes/admin.js';

export type AppInstance = FastifyInstance;

export interface ServerOptions {
  config: ConfigProvider;
  authProvider: AuthProvider;
  registerUseCase: RegisterDeviceUseCase;
  heartbeatUseCase: ProcessHeartbeatUseCase;
  createCommandUseCase: CreateCommandUseCase;
  processAckUseCase: ProcessAckUseCase;
  // Admin / Dashboard
  getSummaryUseCase: GetSummaryUseCase;
  getDevicesUseCase: GetDevicesUseCase;
  getDeviceDetailUseCase: GetDeviceDetailUseCase;
  getDeviceTimelineUseCase: GetDeviceTimelineUseCase;
  getCommandHistoryUseCase: GetCommandHistoryUseCase;
}

/**
 * Create and configure the Fastify server instance.
 * All dependencies are injected — no globals.
 */
export async function createServer(opts: ServerOptions): Promise<AppInstance> {
  const {
    authProvider,
    registerUseCase,
    heartbeatUseCase,
    createCommandUseCase,
    processAckUseCase,
    getSummaryUseCase,
    getDevicesUseCase,
    getDeviceDetailUseCase,
    getDeviceTimelineUseCase,
    getCommandHistoryUseCase,
  } = opts;

  const fastify = Fastify({
    logger: true,
    bodyLimit: 1024 * 64, // 64 KB — plenty for device payloads
  });

  // ── Plugins ──────────────────────────────────────────────
  await fastify.register(cors, { origin: true });

  await fastify.register(rateLimit, {
    max: 100,           // 100 requests per minute per IP (global)
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', '::1'], // Localhost exempt
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry in ${context.after}.`,
    }),
  });

  await fastify.register(correlationPlugin);

  await fastify.register(errorHandlerPlugin);

  await fastify.register(authPlugin, { authProvider });

  // ── Static files (Dashboard) ─────────────────────────────
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.resolve(__dirname, '..', 'public');
  await fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: '/',
    wildcard: false,    // Don't override API routes
  });

  // ── Dashboard root ───────────────────────────────────────
  fastify.get('/', async (_req, reply) => {
    return reply.sendFile('index.html');
  });

  // ── Device API Routes ────────────────────────────────────
  await fastify.register(healthRoutes);

  // Device routes get stricter body limits per route
  await fastify.register(
    async (instance) => {
      // Register: max 2 KB
      await instance.register(registerRoutes, { registerUseCase });
    },
    { bodyLimit: 2048 },
  );

  await fastify.register(
    async (instance) => {
      // Heartbeat: max 1 KB
      await instance.register(heartbeatRoutes, { heartbeatUseCase });
    },
    { bodyLimit: 1024 },
  );

  await fastify.register(
    async (instance) => {
      // Commands (ack): max 4 KB
      await instance.register(commandRoutes, { createCommandUseCase, processAckUseCase });
    },
    { bodyLimit: 4096 },
  );

  // ── Admin API Routes ─────────────────────────────────────
  await fastify.register(
    async (instance) => {
      await instance.register(adminRoutes, {
        getSummaryUseCase,
        getDevicesUseCase,
        getDeviceDetailUseCase,
        getDeviceTimelineUseCase,
        getCommandHistoryUseCase,
        createCommandUseCase,
      });
    },
    { bodyLimit: 8192 }, // Admin commands: max 8 KB
  );

  // ── Shutdown ─────────────────────────────────────────────
  const shutdown = async () => {
    logger.info('Shutting down HTTP server...');
    await fastify.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return fastify;
}
