import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import fp from 'fastify-plugin';

/**
 * CorrelationPlugin — Ensures every request has a correlation ID.
 *
 * - If the client sends `X-Correlation-ID`, it is preserved.
 * - If not, a UUID is generated.
 * - The correlation ID is attached to the request logger for structured logging.
 * - The response includes `X-Correlation-ID` header.
 */
export async function correlationPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) || randomUUID();

    // Attach to request for downstream use
    (request as { correlationId?: string }).correlationId = correlationId;

    // Set response header
    reply.header('X-Correlation-ID', correlationId);

    // Augment the request logger with correlationId
    request.log = request.log.child({ correlationId });
  });
}

export default fp(correlationPlugin, {
  name: 'correlation',
});
