// ── Orita SDK — OritaClient ────────────────────────────────────────────────────

import {
  OritaError,
  OritaAuthError,
  OritaNotFoundError,
  OritaSlotUnavailableError,
} from './errors.js';
import type {
  Booking,
  BookingParams,
  BookingsListParams,
  EventType,
  Profile,
  Slot,
  UpdateProfileParams,
} from './types.js';

const DEFAULT_BASE_URL = 'https://orita.online/api/v1';

export interface OritaClientOptions {
  /**
   * Your Orita API key (must start with `orita_`).
   * Get yours at https://orita.online/developers
   */
  apiKey: string;
  /**
   * Override the base URL (for self-hosted or staging environments).
   * @default "https://orita.online/api/v1"
   */
  baseUrl?: string;
}

export class OritaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OritaClientOptions) {
    const { apiKey, baseUrl = DEFAULT_BASE_URL } = options;
    if (!apiKey.startsWith('orita_')) {
      throw new OritaAuthError("API key must start with 'orita_'");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string>; body?: unknown } = {},
  ): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new OritaError(
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new OritaError(`Invalid JSON response (HTTP ${res.status})`);
    }

    if (res.status === 401) {
      const msg =
        (json as { error?: string })?.error ?? 'Invalid or missing API key';
      throw new OritaAuthError(msg, json);
    }
    if (res.status === 404) {
      const msg = (json as { error?: string })?.error ?? 'Resource not found';
      throw new OritaNotFoundError(msg, json);
    }
    if (res.status === 409) {
      const msg =
        (json as { error?: string })?.error ?? 'Slot is no longer available';
      throw new OritaSlotUnavailableError(msg, json);
    }
    if (!res.ok) {
      const msg = (json as { error?: string })?.error ?? `HTTP ${res.status}`;
      throw new OritaError(msg, res.status, json);
    }

    return json as T;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * List all active event types for your account.
   *
   * @example
   * const eventTypes = await orita.getEventTypes();
   * // [{ id: "evt_abc123", title: "Initial Consultation", duration: 30, ... }]
   */
  async getEventTypes(): Promise<EventType[]> {
    const res = await this.request<{ data: EventType[] }>('GET', '/event-types');
    return res.data;
  }

  /**
   * Get available time slots for an event type on a given date.
   *
   * @param eventTypeId - Event type ID from `getEventTypes()`
   * @param date - Date in `YYYY-MM-DD` format
   *
   * @example
   * const { slots } = await orita.getSlots('evt_abc123', '2026-08-01');
   * // [{ label: "09:00 AM", value: "09:00" }, ...]
   */
  async getSlots(eventTypeId: string, date: string): Promise<{ slots: Slot[]; date: string; eventTypeId: string }> {
    const res = await this.request<{ slots: Slot[]; date: string; eventTypeId: string }>(
      'GET',
      '/slots',
      { params: { eventTypeId, date } },
    );
    return res;
  }

  /**
   * Book an appointment. Returns the created booking object.
   *
   * @example
   * const booking = await orita.book({
   *   eventTypeId: 'evt_abc123',
   *   date: '2026-08-01',
   *   time: '10:00',
   *   clientName: 'Ana',
   *   clientLastname: 'López',
   *   clientEmail: 'ana@example.com',
   * });
   * console.log(booking.id); // "book_xyz789"
   */
  async book(params: BookingParams): Promise<Booking> {
    const body: Record<string, unknown> = {
      eventTypeId: params.eventTypeId,
      date: params.date,
      time: params.time,
      clientName: params.clientName,
      clientLastname: params.clientLastname,
      clientEmail: params.clientEmail,
    };
    if (params.clientPhone) body.clientPhone = params.clientPhone;
    if (params.clientTimezone) body.clientTimezone = params.clientTimezone;
    if (params.notes) body.notes = params.notes;

    const res = await this.request<{ data: Booking }>('POST', '/bookings', { body });
    return res.data;
  }

  /**
   * List your bookings with optional filtering.
   *
   * @example
   * const bookings = await orita.getBookings({ status: 'confirmed' });
   */
  async getBookings(params: BookingsListParams = {}): Promise<Booking[]> {
    const query: Record<string, string> = {};
    if (params.page !== undefined) query.page = String(params.page);
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.status) query.status = params.status;

    const res = await this.request<{ data: Booking[] }>('GET', '/bookings', { params: query });
    return res.data;
  }

  /**
   * Retrieve a single booking by ID.
   *
   * @example
   * const booking = await orita.getBooking('book_xyz789');
   * console.log(booking.status); // "confirmed"
   */
  async getBooking(bookingId: string): Promise<Booking> {
    const res = await this.request<{ data: Booking }>('GET', `/bookings/${bookingId}`);
    return res.data;
  }

  /**
   * Cancel a booking by ID.
   *
   * @param bookingId - The booking ID to cancel
   * @param reason - Optional cancellation reason
   *
   * @example
   * const result = await orita.cancelBooking('book_xyz789', 'Client requested reschedule');
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const body: Record<string, unknown> = {};
    if (reason) body.reason = reason;

    const res = await this.request<{ data: Booking }>(
      'POST',
      `/bookings/${bookingId}/cancel`,
      { body: Object.keys(body).length ? body : undefined },
    );
    return res.data;
  }

  /**
   * Get your own Capability Manifest (your profile).
   * Requires authentication.
   *
   * @example
   * const profile = await orita.getMyProfile();
   * console.log(profile.username);
   */
  async getMyProfile(): Promise<Profile> {
    const res = await this.request<{ data: Profile }>('GET', '/profile');
    return res.data;
  }

  /**
   * Update your profile fields.
   *
   * @example
   * const updated = await orita.updateProfile({ bio: 'AI-native therapist' });
   */
  async updateProfile(fields: UpdateProfileParams): Promise<Profile> {
    const res = await this.request<{ data: Profile }>('PUT', '/profile', { body: fields });
    return res.data;
  }

  /**
   * Fetch the **public** Capability Manifest for any professional by username.
   * No API key is needed for this request.
   *
   * @param username - The professional's username (e.g. "dra-martinez")
   *
   * @example
   * const manifest = await orita.getProfile('dra-martinez');
   * console.log(manifest.eventTypes);
   */
  async getProfile(username: string): Promise<Profile> {
    const url = this.buildUrl('/profile', { username });

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      throw new OritaError(
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new OritaError(`Invalid JSON response (HTTP ${res.status})`);
    }

    if (res.status === 404) {
      throw new OritaNotFoundError(`Professional '${username}' not found`, json);
    }
    if (!res.ok) {
      const msg = (json as { error?: string })?.error ?? `HTTP ${res.status}`;
      throw new OritaError(msg, res.status, json);
    }

    return (json as { data: Profile }).data;
  }
}
