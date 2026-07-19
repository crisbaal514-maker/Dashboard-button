import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { IEventBus } from '../../core/IEventBus.js';
import type { Clock } from '../../core/Clock.js';
import type { AckCommandRequest } from '../../contracts/v1/commands/index.js';
import { logger } from '../../core/logger.js';

/**
 * ProcessAckUseCase — Procesar un ACK enviado por el dispositivo.
 *
 * Flujo:
 *  1. Validar que el comando existe
 *  2. Validar que el comando pertenece al dispositivo
 *  3. Actualizar status según el ACK: completed / failed / rejected
 *  4. Registrar resultado o error
 *
 * El dispositivo envía el ACK después de recibir, ejecutar o rechazar un comando.
 */
export class ProcessAckUseCase {
  constructor(
    private storage: StorageProvider,
    private eventBus: IEventBus,
    private clock: Clock,
  ) {}

  async execute(
    commandId: string,
    deviceId: string,
    request: AckCommandRequest,
  ): Promise<void> {
    const now = this.clock.now();
    const completedAt = now.toISOString();

    // 1. Validar comando existe
    const command = this.storage.commands.findById(commandId);
    if (!command) {
      logger.warn({ commandId }, 'ProcessAckUseCase: command not found');
      throw new Error(`Command not found: ${commandId}`);
    }

    // 2. Validar que pertenece al dispositivo
    if (command.deviceId !== deviceId) {
      logger.warn({ commandId, deviceId, ownerId: command.deviceId },
        'ProcessAckUseCase: command does not belong to device');
      throw new Error(`Command ${commandId} does not belong to device ${deviceId}`);
    }

    // 3. Actualizar según status
    const updated = this.storage.commands.processAck(commandId, {
      status: request.status,
      result: request.result ?? null,
      error: request.error ?? null,
      completedAt,
    });

    if (!updated) {
      logger.warn({ commandId, status: command.status },
        'ProcessAckUseCase: command not in deliverable state');
      throw new Error(`Command ${commandId} cannot be acknowledged (status: ${command.status})`);
    }

    logger.info(
      { commandId, deviceId, status: request.status },
      'ProcessAckUseCase: ack processed',
    );
  }
}
