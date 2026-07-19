import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { CommandRow } from '../../storage/interfaces/ICommandRepository.js';

export interface CommandHistoryItem {
  id: string;
  type: string;
  status: string;
  priority: number;
  error: string | null;
  createdAt: string;
  deliveredAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * GetCommandHistoryUseCase — Historial de comandos de un dispositivo.
 *
 * Nota: por ahora el repo no soporta listar comandos de todos los dispositivos,
 * así que este use case solo opera por deviceId.
 * Para un "global" habría que agregar un método al repo.
 */
export class GetCommandHistoryUseCase {
  private static readonly DEFAULT_LIMIT = 50;

  constructor(private storage: StorageProvider) {}

  execute(deviceId: string, limit = GetCommandHistoryUseCase.DEFAULT_LIMIT): CommandHistoryItem[] {
    const commands = this.storage.commands.findByDeviceId(deviceId, limit);
    return commands.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      priority: c.priority,
      error: c.error,
      createdAt: c.createdAt,
      deliveredAt: c.deliveredAt,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
    }));
  }
}
