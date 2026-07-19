import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ProcessHeartbeatUseCase } from '../../../../application/heartbeat/ProcessHeartbeatUseCase.js';
import type { HeartbeatRequest } from '../../../../contracts/v1/heartbeat/HeartbeatRequest.js';

/**
 * Heartbeat Route — POST /v1/devices/heartbeat
 *
 * Requires authentication (device token).
 * The deviceId is extracted from the token by the auth middleware (request.auth.deviceId),
 * NOT from the URL — this prevents token/deviceId mismatch.
 *
 * Siempre responde 200 OK con pendingCommands (array vacío si no hay comandos).
 * El dispositivo usa pendingCommands como canal de entrega de órdenes.
 */
export async function heartbeatRoutes(
  fastify: FastifyInstance,
  opts: { heartbeatUseCase: ProcessHeartbeatUseCase },
): Promise<void> {
  const { heartbeatUseCase } = opts;

  fastify.post(
    '/v1/devices/heartbeat',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const deviceId = request.auth!.deviceId;
      const body = request.body as HeartbeatRequest;
      const response = await heartbeatUseCase.execute(deviceId, body);

      // Siempre 200 OK con pendingCommands array
      reply.status(200).send(response);
    },
  );
}
