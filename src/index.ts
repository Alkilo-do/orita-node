// ── Orita SDK ─────────────────────────────────────────────────────────────────
// The scheduling infrastructure for AI agents — Node.js / TypeScript SDK
//
// https://orita.online | https://github.com/Alkilo-do/orita-node
// ─────────────────────────────────────────────────────────────────────────────

export { OritaClient } from './client.js';
export type { OritaClientOptions } from './client.js';

export {
  OritaError,
  OritaAuthError,
  OritaNotFoundError,
  OritaSlotUnavailableError,
} from './errors.js';

export type {
  EventType,
  Slot,
  SlotsResponse,
  Booking,
  BookingParams,
  BookingsListParams,
  Profile,
  UpdateProfileParams,
} from './types.js';
