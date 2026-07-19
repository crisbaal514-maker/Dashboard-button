import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { IEventBus } from '../../core/IEventBus.js';
import type { Clock } from '../../core/Clock.js';
import type { CreateCommandRequest, CreateCommandResponse } from '../../contracts/v1/commands/index.js';
import { CommandStatus } from '../../contracts/v1/commands/CommandStatus.js';
import { generateId } from '../../core/utils/id-generator.js';
import { logger } from '../../core/logger.js';

/**
 * CreateCommandUseCase — Crear un nuevo comando para un dispositivo.
 *
 * Flujo:
 *  1. Validar que el dispositivo existe
 *  2. Crear el comando con status PENDING
 *  3. El dispositivo lo recibirá en el próximo heartbeat
 */
export class CreateCommandUseCase {
  constructor(
    private storage: StorageProvider,
    private eventBus: IEventBus,
    private clock: Clock,
  ) {}

  async execute(
    deviceId: string,
    request: CreateCommandRequest,
  ): Promise<CreateCommandResponse> {
    const now = this.clock.now();

    // 1. Validar dispositivo existe
    const device = this.storage.devices.findById(deviceId);
    if (!device) {
      logger.warn({ deviceId }, 'CreateCommandUseCase: device not found');
      throw new Error(`Device not found: ${deviceId}`);
    }

    // 2. Crear comando PENDING
    const command = this.storage.commands.create({
      id: generateId(),
      deviceId,
      type: request.type,
      payload: request.payload ?? {},
      priority: request.priority ?? 0,
    });

    logger.info(
      { commandId: command.id, deviceId, type: request.type },
      'CreateCommandUseCase: command created',
    );

    return {
      id: command.id,
      deviceId: command.deviceId,
      type: command.type,
      payload: command.payload,
      status: CommandStatus.Pending,
      priority: command.priority,
      createdAt: command.createdAt,
    };
  }
}
