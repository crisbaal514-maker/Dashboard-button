import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { CommandRow } from '../../storage/interfaces/ICommandRepository.js';
import { logger } from '../../core/logger.js';

/**
 * GetPendingCommandsUseCase — Obtener comandos pendientes para un dispositivo.
 *
 * Se utiliza durante el heartbeat para incluir comandos en la respuesta.
 * También marca los comandos como DELIVERED automáticamente.
 */
export class GetPendingCommandsUseCase {
  constructor(private storage: StorageProvider) {}

  execute(deviceId: string): CommandRow[] {
    const pending = this.storage.commands.findPendingByDeviceId(deviceId);

    if (pending.length > 0) {
      // Marcar como delivered
      const now = new Date().toISOString();
      for (const cmd of pending) {
        this.storage.commands.markDelivered(cmd.id, { deliveredAt: now });
      }

      logger.info(
        { deviceId, count: pending.length },
        'GetPendingCommandsUseCase: commands marked as delivered',
      );
    }

    return pending;
  }
}
