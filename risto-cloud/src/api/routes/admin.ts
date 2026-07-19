import type { FastifyInstance } from 'fastify';
import type { GetSummaryUseCase } from '../../application/admin/GetSummaryUseCase.js';
import type { GetDevicesUseCase } from '../../application/admin/GetDevicesUseCase.js';
import type { GetDeviceDetailUseCase } from '../../application/admin/GetDeviceDetailUseCase.js';
import type { GetDeviceTimelineUseCase } from '../../application/admin/GetDeviceTimelineUseCase.js';
import type { GetCommandHistoryUseCase } from '../../application/admin/GetCommandHistoryUseCase.js';
import type { CreateCommandUseCase } from '../../application/commands/CreateCommandUseCase.js';
import { logger } from '../../core/logger.js';

export interface AdminRouteOptions {
  getSummaryUseCase: GetSummaryUseCase;
  getDevicesUseCase: GetDevicesUseCase;
  getDeviceDetailUseCase: GetDeviceDetailUseCase;
  getDeviceTimelineUseCase: GetDeviceTimelineUseCase;
  getCommandHistoryUseCase: GetCommandHistoryUseCase;
  createCommandUseCase: CreateCommandUseCase;
}

/**
 * Admin routes — API del Dashboard.
 *
 * Separadas de /v1/devices/* para dejar claro qué consume un ESP32
 * y qué consume la interfaz de administración.
 */
export async function adminRoutes(fastify: FastifyInstance, opts: AdminRouteOptions): Promise<void> {
  const {
    getSummaryUseCase,
    getDevicesUseCase,
    getDeviceDetailUseCase,
    getDeviceTimelineUseCase,
    getCommandHistoryUseCase,
    createCommandUseCase,
  } = opts;

  // ── GET /admin/api/summary ──────────────────────────────────
  fastify.get('/admin/api/summary', async (_request, reply) => {
    try {
      const summary = getSummaryUseCase.execute();
      return reply.send(summary);
    } catch (err) {
      logger.error({ err }, 'Error fetching dashboard summary');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ── GET /admin/api/devices ──────────────────────────────────
  fastify.get('/admin/api/devices', async (_request, reply) => {
    try {
      const devices = getDevicesUseCase.execute();
      return reply.send(devices);
    } catch (err) {
      logger.error({ err }, 'Error fetching devices list');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ── GET /admin/api/devices/:id ──────────────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/admin/api/devices/:id',
    async (request, reply) => {
      try {
        const detail = getDeviceDetailUseCase.execute(request.params.id);
        if (!detail) {
          return reply.status(404).send({ error: 'Device not found' });
        }
        return reply.send(detail);
      } catch (err) {
        logger.error({ err, deviceId: request.params.id }, 'Error fetching device detail');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // ── GET /admin/api/devices/:id/events ──────────────────────
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/admin/api/devices/:id/events',
    async (request, reply) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
        const timeline = getDeviceTimelineUseCase.execute(request.params.id, limit);
        return reply.send(timeline);
      } catch (err) {
        logger.error({ err, deviceId: request.params.id }, 'Error fetching device timeline');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // ── GET /admin/api/devices/:id/commands ────────────────────
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/admin/api/devices/:id/commands',
    async (request, reply) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
        const commands = getCommandHistoryUseCase.execute(request.params.id, limit);
        return reply.send(commands);
      } catch (err) {
        logger.error({ err, deviceId: request.params.id }, 'Error fetching command history');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // ── POST /admin/api/commands ────────────────────────────────
  // Igual que POST /v1/commands pero desde la interfaz de admin.
  fastify.post<{
    Body: { deviceId: string; type: string; payload?: Record<string, unknown> };
  }>('/admin/api/commands', async (request, reply) => {
    try {
      const { deviceId, type, payload } = request.body;
      if (!deviceId || !type) {
        return reply.status(400).send({ error: 'deviceId and type are required' });
      }
      const req: { type: string; payload?: Record<string, unknown>; priority?: number } = { type };
      if (payload !== undefined) req.payload = payload;
      const command = await createCommandUseCase.execute(deviceId, req);
      return reply.status(201).send(command);
    } catch (err) {
      logger.error({ err }, 'Error creating command from admin');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
