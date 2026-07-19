import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthProvider } from '../../auth/AuthProvider.js';
import fp from 'fastify-plugin';

/**
 * Augment Fastify's request with an `auth` property.
 * This uses declaration merging — no runtime cost.
 */
declare module 'fastify' {
  interface FastifyRequest {
    auth?: {
      deviceId: string;
      tokenId?: string;
      scopes: string[];
    };
  }
}

/**
 * AuthPlugin — Fastify plugin that hooks into onRequest.
 *
 * For routes that need auth, use:
 *   preHandler: [fastify.authenticate]
 *
 * The middleware:
 *  1. Extracts `Authorization: Bearer <token>` header
 *  2. Calls `authProvider.verifyAccessToken(token)`
 *  3. On success → sets `request.auth = { deviceId, scopes }`
 *  4. On failure → replies 401
 */
export async function authPlugin(
  fastify: FastifyInstance,
  opts: { authProvider: AuthProvider },
): Promise<void> {
  const { authProvider } = opts;

  /**
   * Decorator: `fastify.authenticate`
   * Uso: `preHandler: [fastify.authenticate]` en las rutas.
   */
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header',
        statusCode: 401,
      });
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Empty token',
        statusCode: 401,
      });
      return;
    }

    const result = await authProvider.verifyAccessToken(token);
    if (!result) {
      reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        statusCode: 401,
      });
      return;
    }

    // Attach auth context to request
    request.auth = {
      deviceId: result.deviceId,
      scopes: [], // Reserved for future use
    };
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// fastify-plugin avoids encapsulation — the decorator is visible to child contexts (routes)
export default fp(authPlugin, {
  name: 'auth',
});
