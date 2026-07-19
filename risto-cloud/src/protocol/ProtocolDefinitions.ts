/** Current protocol version used by the server */
export const CURRENT_PROTOCOL_VERSION = 1;

/** Minimum protocol version accepted */
export const MIN_PROTOCOL_VERSION = 1;

/** Maximum protocol version supported */
export const MAX_PROTOCOL_VERSION = 1;

/** Header name for protocol version negotiation */
export const PROTOCOL_VERSION_HEADER = 'X-Protocol-Version';

/** Header name for API key */
export const API_KEY_HEADER = 'X-API-Key';

/** Header name for correlation ID */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/** Header name for authorization token */
export const AUTHORIZATION_HEADER = 'Authorization';

/** Bearer token prefix */
export const BEARER_PREFIX = 'Bearer ';

/** API version prefix */
export const API_VERSION = 'v1';

/** API prefix for all endpoints */
export const API_PREFIX = `/api/${API_VERSION}` as const;
