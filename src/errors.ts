// ── Orita SDK — Error classes ──────────────────────────────────────────────────

/**
 * Base error class for all Orita API errors.
 */
export class OritaError extends Error {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'OritaError';
    this.statusCode = statusCode;
    this.response = response;
    // Maintain proper stack trace in V8
    const ErrCtor = Error as unknown as { captureStackTrace?: (target: object, fn: unknown) => void };
    if (ErrCtor.captureStackTrace) {
      ErrCtor.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when the API key is invalid or missing (HTTP 401).
 */
export class OritaAuthError extends OritaError {
  constructor(message = 'Invalid or missing API key', response?: unknown) {
    super(message, 401, response);
    this.name = 'OritaAuthError';
  }
}

/**
 * Thrown when the requested resource is not found (HTTP 404).
 */
export class OritaNotFoundError extends OritaError {
  constructor(message = 'Resource not found', response?: unknown) {
    super(message, 404, response);
    this.name = 'OritaNotFoundError';
  }
}

/**
 * Thrown when the requested time slot is already taken (HTTP 409).
 */
export class OritaSlotUnavailableError extends OritaError {
  constructor(message = 'Slot is no longer available', response?: unknown) {
    super(message, 409, response);
    this.name = 'OritaSlotUnavailableError';
  }
}
