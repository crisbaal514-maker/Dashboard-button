#!/usr/bin/env node

/**
 * Risto Cloud — Entry Point
 *
 * Starts the Risto Cloud HTTP server.
 * All wiring is done by Bootstrap — this file only resolves the server and listens.
 */
import { bootstrap } from './bootstrap/Bootstrap.js';
import { logger } from './core/logger.js';

async function main(): Promise<void> {
  try {
    const container = await bootstrap();

    const config = container.resolve<{ get: (key: string, defaultValue?: string) => string }>('config');
    const server = container.resolve<{ listen: (opts: { port: number; host: string }) => Promise<void> }>('server');

    const port = parseInt(config.get('PORT', '3000'), 10);
    const host = config.get('HOST', '0.0.0.0');

    await server.listen({ port, host });

    logger.info({ port, host }, 'Risto Cloud HTTP server is listening');
  } catch (error) {
    logger.error({ error }, 'Failed to start Risto Cloud');
    process.exit(1);
  }
}

main();
