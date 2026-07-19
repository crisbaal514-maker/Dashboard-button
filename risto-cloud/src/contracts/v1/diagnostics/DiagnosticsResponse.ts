/**
 * POST /v1/devices/:deviceId/diagnostics — Response (200 OK)
 */
export interface DiagnosticsResponse {
  /** Whether the report was accepted */
  accepted: boolean;

  /** Server timestamp */
  serverTime: string;
}
