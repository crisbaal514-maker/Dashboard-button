/**
 * CommandStatus — Enum compartido entre backend y firmware.
 *
 * Ciclo de vida completo de un comando:
 *   PENDING    → Creado en el servidor, aún no entregado
 *   DELIVERED  → El dispositivo lo recibió en un heartbeat
 *   EXECUTING  → El dispositivo comenzó a ejecutarlo
 *   COMPLETED  → El dispositivo terminó exitosamente
 *   FAILED     → El dispositivo falló al ejecutarlo
 *   REJECTED   → El dispositivo rechazó el comando (tipo desconocido)
 *
 * Uso en firmware: debe coincidir exactamente con CommandStatus en C++.
 */
export enum CommandStatus {
  Pending = 'pending',
  Delivered = 'delivered',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
  Rejected = 'rejected',
}
