import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../core/logger.js';
import fp from 'fastify-plugin';

/**
 * ErrorHandlerPlugin — Centralized error handler for Fastify.
 *
 * Translates domain errors (e.g., "Device not found: xxx") into
 * proper HTTP responses WITHOUT try/catch in route handlers.
 *
 * Usage: throw in a UseCase, the framework catches it here.
 */
export async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const correlationId = (request as { correlationId?: string }).correlationId;

      // Fastify validation errors (400)
      if ('validation' in error && error.validation) {
        reply.status(400).send({
          error: 'VALIDATION',
          message: error.message,
          statusCode: 400,
          correlationId,
        });
        return;
      }

      // Fastify 404
      if ('statusCode' in error && (error as { statusCode?: number }).statusCode === 404) {
        reply.status(404).send({
          error: 'NOT_FOUND',
          message: error.message || 'Route not found',
          statusCode: 404,
          correlationId,
        });
        return;
      }

      // Domain: "not found" errors
      if (error.message?.toLowerCase().includes('not found')) {
        reply.status(404).send({
          error: 'NOT_FOUND',
          message: error.message,
          statusCode: 404,
          correlationId,
        });
        return;
      }

      // Domain: "unauthorized" / "invalid" / "revoked"
      if (
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('invalid') ||
        error.message?.toLowerCase().includes('revoked')
      ) {
        reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: error.message,
          statusCode: 401,
          correlationId,
        });
        return;
      }

      // Domain: "conflict" / "already exists"
      if (error.message?.toLowerCase().includes('conflict') || error.message?.toLowerCase().includes('already exists')) {
        reply.status(409).send({
          error: 'CONFLICT',
          message: error.message,
          statusCode: 409,
          correlationId,
        });
        return;
      }

      // Unhandled errors → 500
      logger.error(
        { error: error.message, stack: error.stack, correlationId },
        'Unhandled error',
      );

      reply.status(500).send({
        error: 'INTERNAL',
        message: 'Internal server error',
        statusCode: 500,
        correlationId,
      });
    },
  );
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
});
