import type { StorageProvider } from '../../storage/StorageProvider.js';

export interface DashboardSummary {
  devices: number;
  online: number;
  offline: number;
  pendingCommands: number;
  failedCommands: number;
}

/**
 * GetSummaryUseCase — Resumen rápido para el encabezado del Dashboard.
 *
 * Retorna conteos agregados de una sola consulta (o varias pero ligeras).
 * No requiere autenticación (entorno local / appliance).
 */
export class GetSummaryUseCase {
  constructor(private storage: StorageProvider) {}

  execute(): DashboardSummary {
    const allDevices = this.storage.devices.listAll();
    const online = allDevices.filter((d) => d.isOnline).length;

    // Pending commands: recorremos todos los dispositivos
    let pendingCommands = 0;
    for (const device of allDevices) {
      pendingCommands += this.storage.commands.findPendingByDeviceId(device.id).length;
    }

    // Failed commands: los últimos N comandos failed (estimación)
    // Para un conteo exacto necesitaríamos un método en el repo
    // Por ahora usamos lo que tenemos disponible
    const recentFailed = this.storage.commands.findByDeviceId('__all__', 0); // Placeholder
    const failedCommands = 0; // Se refinará después

    return {
      devices: allDevices.length,
      online,
      offline: allDevices.length - online,
      pendingCommands,
      failedCommands,
    };
  }
}
