import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { EventRow } from '../../storage/interfaces/IEventRepository.js';

export type TimelineEntryType = 'event' | 'heartbeat' | 'command';

export interface TimelineEntry {
  type: TimelineEntryType;
  timestamp: string;
  label: string;
  detail: string | null;
}

/**
 * GetDeviceTimelineUseCase — Timeline cronológico de un dispositivo.
 * Combina eventos, heartbeats y comandos en una sola lista ordenada.
 */
export class GetDeviceTimelineUseCase {
  private static readonly DEFAULT_LIMIT = 50;

  constructor(private storage: StorageProvider) {}

  execute(deviceId: string, limit = GetDeviceTimelineUseCase.DEFAULT_LIMIT): TimelineEntry[] {
    const entries: TimelineEntry[] = [];

    // Eventos
    const events = this.storage.events.findByDeviceId(deviceId, { limit: 30 });
    for (const ev of events) {
      entries.push({
        type: 'event',
        timestamp: ev.timestamp ?? ev.receivedAt,
        label: this.formatEventLabel(ev.eventType),
        detail: ev.payload ? JSON.stringify(ev.payload) : null,
      });
    }

    // Heartbeats (últimos 20)
    const heartbeats = this.storage.heartbeats.findByDeviceId(deviceId, 20);
    for (const hb of heartbeats) {
      entries.push({
        type: 'heartbeat',
        timestamp: hb.receivedAt,
        label: `Heartbeat #${hb.sequence}`,
        detail: hb.rssi !== null ? `RSSI: ${hb.rssi}` : null,
      });
    }

    // Comandos (últimos 20)
    const commands = this.storage.commands.findByDeviceId(deviceId, 20);
    for (const cmd of commands) {
      entries.push({
        type: 'command',
        timestamp: cmd.createdAt,
        label: `${cmd.type}: ${cmd.status}`,
        detail: cmd.error ?? null,
      });
    }

    // Ordenar por timestamp descendente
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Limitar
    return entries.slice(0, limit);
  }

  private formatEventLabel(eventType: string): string {
    // Convertir "device.registered" → "Registered"
    const parts = eventType.split('.');
    const last = parts[parts.length - 1] ?? eventType;
    return last.charAt(0).toUpperCase() + last.slice(1);
  }
}
