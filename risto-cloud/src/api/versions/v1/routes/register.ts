import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { RegisterDeviceUseCase } from '../../../../application/provisioning/RegisterDeviceUseCase.js';
import type { RegisterRequest } from '../../../../contracts/v1/provisioning/RegisterRequest.js';

/**
 * Register Route — POST /v1/devices/register
 *
 * No authentication required.
 * Returns 201 Created with device identity and tokens.
 */
export async function registerRoutes(
  fastify: FastifyInstance,
  opts: { registerUseCase: RegisterDeviceUseCase },
): Promise<void> {
  const { registerUseCase } = opts;

  fastify.post(
    '/v1/devices/register',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as RegisterRequest;
      const response = await registerUseCase.execute(body);
      reply.status(201).send(response);
    },
  );
}
