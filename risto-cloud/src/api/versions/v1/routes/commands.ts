import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateCommandUseCase } from '../../../../application/commands/CreateCommandUseCase.js';
import type { ProcessAckUseCase } from '../../../../application/commands/ProcessAckUseCase.js';
import type { CreateCommandRequest } from '../../../../contracts/v1/commands/CreateCommandRequest.js';
import type { AckCommandRequest } from '../../../../contracts/v1/commands/AckCommandRequest.js';

/**
 * Commands Routes
 *
 * POST /v1/devices/{deviceId}/commands          — Crear comando (admin)
 * POST /v1/devices/commands/{commandId}/ack     — ACK del dispositivo
 *
 * Nota: El endpoint de ACK usa autenticación del dispositivo (Bearer token),
 * por lo que el deviceId se extrae del token, no de la URL.
 * Esto evita token/deviceId mismatch.
 */
export async function commandRoutes(
  fastify: FastifyInstance,
  opts: {
    createCommandUseCase: CreateCommandUseCase;
    processAckUseCase: ProcessAckUseCase;
  },
): Promise<void> {
  const { createCommandUseCase, processAckUseCase } = opts;

  /**
   * POST /v1/devices/{deviceId}/commands
   * Crear un nuevo comando (requiere auth de administrador — por ahora usa device auth)
   */
  fastify.post<{ Params: { deviceId: string }; Body: CreateCommandRequest }>(
    '/v1/devices/:deviceId/commands',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
      const { deviceId } = request.params;
      const body = request.body as CreateCommandRequest;

      if (!body.type || typeof body.type !== 'string' || body.type.trim().length === 0) {
        reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'type is required and must be a non-empty string',
          statusCode: 400,
        });
        return;
      }

      const result = await createCommandUseCase.execute(deviceId, body);
      reply.status(201).send(result);
    },
  );

  /**
   * POST /v1/devices/commands/{commandId}/ack
   * Dispositivo confirma ejecución de comando (requiere auth de dispositivo)
   */
  fastify.post<{ Params: { commandId: string }; Body: AckCommandRequest }>(
    '/v1/devices/commands/:commandId/ack',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { commandId: string } }>, reply: FastifyReply) => {
      const deviceId = request.auth!.deviceId;
      const { commandId } = request.params;
      const body = request.body as AckCommandRequest;

      if (!body.status || !['completed', 'failed', 'rejected'].includes(body.status)) {
        reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'status must be one of: completed, failed, rejected',
          statusCode: 400,
        });
        return;
      }

      await processAckUseCase.execute(commandId, deviceId, body);
      reply.status(200).send({ status: 'ok' });
    },
  );
}
