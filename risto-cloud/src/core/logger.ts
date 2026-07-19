import pino from 'pino';

/**
 * Application logger using Pino.
 * In development, uses pino-pretty for readable output.
 * In production, outputs JSON for log aggregation.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
});
