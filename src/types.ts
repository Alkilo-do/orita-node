// ── Orita SDK — TypeScript types ──────────────────────────────────────────────

export interface EventType {
  id: string;
  title: string;
  slug: string;
  duration: number; // minutes
  description?: string;
  location?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  label: string; // human-readable, e.g. "09:00 AM"
  value: string; // HH:MM, e.g. "09:00"
}

export interface SlotsResponse {
  slots: Slot[];
  date: string;
  eventTypeId: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  clientName: string;
  clientLastname: string;
  clientEmail: string;
  clientPhone?: string;
  clientTimezone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingParams {
  eventTypeId: string;
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM
  clientName: string;
  clientLastname: string;
  clientEmail: string;
  clientPhone?: string;
  clientTimezone?: string;  // IANA, e.g. "America/New_York"
  notes?: string;
}

export interface BookingsListParams {
  page?: number;
  limit?: number;
  status?: 'confirmed' | 'cancelled' | 'completed' | 'pending';
}

export interface Profile {
  username: string;
  bio?: string;
  timezone?: string;
  eventTypes: EventType[];
  [key: string]: unknown;
}

export interface UpdateProfileParams {
  bio?: string;
  timezone?: string;
  [key: string]: unknown;
}

// Internal API response wrappers
export interface ApiDataResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiSlotsResponse {
  slots: Slot[];
  date?: string;
  eventTypeId?: string;
}
