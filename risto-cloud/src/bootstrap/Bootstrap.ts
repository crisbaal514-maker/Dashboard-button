import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { Container } from './Container.js';
import { EnvProvider } from '../config/EnvProvider.js';
import type { ConfigProvider } from '../config/ConfigProvider.js';
import { LocalEventBus } from '../core/LocalEventBus.js';
import type { IEventBus } from '../core/IEventBus.js';
import { SystemClock } from '../core/SystemClock.js';
import type { Clock } from '../core/Clock.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { LocalTokenProvider } from '../auth/LocalTokenProvider.js';
import type { AuthProvider } from '../auth/AuthProvider.js';
import { RegisterDeviceUseCase } from '../application/provisioning/RegisterDeviceUseCase.js';
import { ProcessHeartbeatUseCase } from '../application/heartbeat/ProcessHeartbeatUseCase.js';
import { CreateCommandUseCase } from '../application/commands/CreateCommandUseCase.js';
import { ProcessAckUseCase } from '../application/commands/ProcessAckUseCase.js';
import { GetSummaryUseCase } from '../application/admin/GetSummaryUseCase.js';
import { GetDevicesUseCase } from '../application/admin/GetDevicesUseCase.js';
import { GetDeviceDetailUseCase } from '../application/admin/GetDeviceDetailUseCase.js';
import { GetDeviceTimelineUseCase } from '../application/admin/GetDeviceTimelineUseCase.js';
import { GetCommandHistoryUseCase } from '../application/admin/GetCommandHistoryUseCase.js';
import { CleanupUseCase } from '../application/maintenance/CleanupUseCase.js';
import { createServer } from '../api/server.js';
import type { AppInstance } from '../api/server.js';
import { Scheduler } from '../core/Scheduler.js';
import { bootstrapScheduler } from './SchedulerBootstrap.js';
import { logger } from '../core/logger.js';

/**
 * Bootstrap — Application startup orchestrator.
 * All dependency injection happens here.
 * The application NEVER checks "if sqlite" or "if postgres".
 */
export async function bootstrap(): Promise<Container> {
  const container = new Container();
  const startTime = Date.now();

  logger.info('Booting Risto Cloud...');

  // 1. Configuration
  const config = new EnvProvider();
  container.register<ConfigProvider>('config', config);
  logger.info({ source: 'env' }, 'Config provider initialized');

  // 2. Clock
  const clock = new SystemClock();
  container.register<Clock>('clock', clock);
  logger.info('System clock initialized');

  // 3. Event Bus
  const eventBus = new LocalEventBus();
  container.register<IEventBus>('eventBus', eventBus);
  logger.info('Event bus initialized');

  // 3b. Ensure data directory exists (Railway needs this)
  const dbPath = config.get('DB_PATH', './data/risto-cloud.db');
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.error(`[Bootstrap] Created data directory: ${dbDir}`);
    logger.info({ dbDir }, 'Created data directory');
  }

  // 4. Storage (SQLite)
  const storage = new StorageProvider(dbPath);
  container.register<StorageProvider>('storage', storage);
  logger.info({ dbPath }, 'Storage provider initialized');

  // 5. Auth Provider
  const authProvider = new LocalTokenProvider(storage, clock);
  container.register<AuthProvider>('authProvider', authProvider);
  logger.info('Auth provider initialized');

  // 6. Use Cases — Device API
  const registerUseCase = new RegisterDeviceUseCase(storage, authProvider, eventBus, clock);
  container.register<RegisterDeviceUseCase>('registerUseCase', registerUseCase);

  const heartbeatUseCase = new ProcessHeartbeatUseCase(storage, eventBus, clock);
  container.register<ProcessHeartbeatUseCase>('heartbeatUseCase', heartbeatUseCase);

  const createCommandUseCase = new CreateCommandUseCase(storage, eventBus, clock);
  container.register<CreateCommandUseCase>('createCommandUseCase', createCommandUseCase);

  const processAckUseCase = new ProcessAckUseCase(storage, eventBus, clock);
  container.register<ProcessAckUseCase>('processAckUseCase', processAckUseCase);

  // 7. Maintenance
  const cleanupUseCase = new CleanupUseCase(storage);
  container.register<CleanupUseCase>('cleanupUseCase', cleanupUseCase);

  // 8. Use Cases — Admin / Dashboard
  const getSummaryUseCase = new GetSummaryUseCase(storage);
  container.register<GetSummaryUseCase>('getSummaryUseCase', getSummaryUseCase);

  const getDevicesUseCase = new GetDevicesUseCase(storage);
  container.register<GetDevicesUseCase>('getDevicesUseCase', getDevicesUseCase);

  const getDeviceDetailUseCase = new GetDeviceDetailUseCase(storage);
  container.register<GetDeviceDetailUseCase>('getDeviceDetailUseCase', getDeviceDetailUseCase);

  const getDeviceTimelineUseCase = new GetDeviceTimelineUseCase(storage);
  container.register<GetDeviceTimelineUseCase>('getDeviceTimelineUseCase', getDeviceTimelineUseCase);

  const getCommandHistoryUseCase = new GetCommandHistoryUseCase(storage);
  container.register<GetCommandHistoryUseCase>('getCommandHistoryUseCase', getCommandHistoryUseCase);

  logger.info('Use cases registered');

  // 9. Scheduler (background jobs)
  const scheduler = bootstrapScheduler(cleanupUseCase);
  container.register<Scheduler>('scheduler', scheduler);
  scheduler.start();
  logger.info('Scheduler started');

  // 10. HTTP Server (Fastify)
  const server = await createServer({
    config,
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
  });
  container.register<AppInstance>('server', server);
  logger.info('HTTP server created');

  const bootTime = Date.now() - startTime;
  logger.info({ bootTimeMs: bootTime }, 'Risto Cloud bootstrap complete');

  return container;
}
