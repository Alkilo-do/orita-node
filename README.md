# orita-sdk (Node.js / TypeScript)

[![npm version](https://img.shields.io/npm/v/orita-sdk.svg)](https://www.npmjs.com/package/orita-sdk)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**The scheduling infrastructure for AI agents — official Node.js / TypeScript SDK**

[Orita](https://orita.online) is the scheduling layer purpose-built for AI agents. Connect your LLM to real calendar availability in minutes — no external dependencies, full TypeScript types.

→ **Docs & API keys:** [orita.online/developers](https://orita.online/developers)  
→ **Python SDK:** [github.com/Alkilo-do/orita-python](https://github.com/Alkilo-do/orita-python)

---

## Installation

```bash
npm install orita-sdk
# or
yarn add orita-sdk
# or
pnpm add orita-sdk
```

> **Requirements:** Node.js 18+ (uses native `fetch`). No external runtime dependencies.

---

## Quickstart

```typescript
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });

// Get available slots
const { slots } = await orita.getSlots('event-type-id', '2026-08-01');

// Book appointment
const booking = await orita.book({
  eventTypeId: 'event-type-id',
  date: '2026-08-01',
  time: slots[0].value,
  clientName: 'Ana',
  clientLastname: 'López',
  clientEmail: 'ana@example.com',
});

console.log(booking.id); // "book_xyz789"
```

---

## Authentication

Get your API key at [orita.online/developers](https://orita.online/developers). All API keys start with `orita_`.

```typescript
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({
  apiKey: 'orita_your_key_here',
  // Optional: override base URL for staging/self-hosted
  // baseUrl: 'https://staging.orita.online/api/v1',
});
```

---

## API Reference

### `getEventTypes() → Promise<EventType[]>`

List all active event types for your account.

```typescript
const eventTypes = await orita.getEventTypes();
// [{ id: "evt_abc123", title: "Initial Consultation", duration: 30, ... }]

const eventTypeId = eventTypes[0].id;
```

---

### `getSlots(eventTypeId, date) → Promise<{ slots: Slot[]; date: string; eventTypeId: string }>`

Get available time slots for a given event type on a specific date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventTypeId` | `string` | Event type ID from `getEventTypes()` |
| `date` | `string` | Date in `YYYY-MM-DD` format |

```typescript
const { slots } = await orita.getSlots('evt_abc123', '2026-08-01');
// [{ label: "09:00 AM", value: "09:00" }, { label: "09:30 AM", value: "09:30" }, ...]
```

---

### `book(params) → Promise<Booking>`

Book an appointment. Returns the created booking object.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventTypeId` | `string` | ✅ | Event type ID |
| `date` | `string` | ✅ | Date in `YYYY-MM-DD` |
| `time` | `string` | ✅ | Time in `HH:MM` (from `getSlots()`) |
| `clientName` | `string` | ✅ | Client first name |
| `clientLastname` | `string` | ✅ | Client last name |
| `clientEmail` | `string` | ✅ | Client email |
| `clientPhone` | `string` | ❌ | Client phone number |
| `clientTimezone` | `string` | ❌ | IANA timezone (e.g. `America/New_York`) |
| `notes` | `string` | ❌ | Additional notes for the professional |

```typescript
const booking = await orita.book({
  eventTypeId: 'evt_abc123',
  date: '2026-08-01',
  time: '10:00',
  clientName: 'Carlos',
  clientLastname: 'García',
  clientEmail: 'carlos@example.com',
  clientTimezone: 'America/Bogota',
  notes: 'First appointment — prefers video call',
});
// { id: "book_xyz789", status: "confirmed", date: "2026-08-01", ... }
```

---

### `getBookings(params?) → Promise<Booking[]>`

List your bookings with optional filtering.

```typescript
const confirmed = await orita.getBookings({ status: 'confirmed' });
const all = await orita.getBookings({ page: 2, limit: 50 });
```

---

### `getBooking(bookingId) → Promise<Booking>`

Retrieve a single booking by ID.

```typescript
const booking = await orita.getBooking('book_xyz789');
console.log(booking.status); // "confirmed"
```

---

### `cancelBooking(bookingId, reason?) → Promise<Booking>`

Cancel a booking by ID.

```typescript
const result = await orita.cancelBooking('book_xyz789', 'Client requested reschedule');
console.log(result.status); // "cancelled"
```

---

### `getProfile(username) → Promise<Profile>`

Fetch the **public** Capability Manifest for any professional by username. **No API key required.**

```typescript
const manifest = await orita.getProfile('dra-martinez');
console.log(manifest.eventTypes);
```

---

### `getMyProfile() → Promise<Profile>`

Get your own Capability Manifest. Requires authentication.

```typescript
const profile = await orita.getMyProfile();
console.log(profile.username);
```

---

### `updateProfile(fields) → Promise<Profile>`

Update your profile fields.

```typescript
const updated = await orita.updateProfile({
  bio: 'AI-native therapist',
  timezone: 'Europe/Madrid',
});
```

---

## Error Handling

```typescript
import {
  OritaClient,
  OritaAuthError,
  OritaNotFoundError,
  OritaSlotUnavailableError,
  OritaError,
} from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });

try {
  const booking = await orita.book({
    eventTypeId: 'evt_abc123',
    date: '2026-08-01',
    time: '10:00',
    clientName: 'Ana',
    clientLastname: 'López',
    clientEmail: 'ana@example.com',
  });
} catch (err) {
  if (err instanceof OritaAuthError) {
    console.error('Invalid API key');
  } else if (err instanceof OritaSlotUnavailableError) {
    console.error('That slot was just taken — fetch slots again');
  } else if (err instanceof OritaNotFoundError) {
    console.error('Event type not found');
  } else if (err instanceof OritaError) {
    console.error(`API error (${err.statusCode}): ${err.message}`);
  }
}
```

| Exception | HTTP Status | When |
|-----------|-------------|------|
| `OritaAuthError` | 401 | Invalid or missing API key |
| `OritaNotFoundError` | 404 | Resource not found |
| `OritaSlotUnavailableError` | 409 | Slot already taken |
| `OritaError` | Other 4xx/5xx | Generic API error |

---

## Framework Integrations

### OpenAI Agents SDK (tool use)

```typescript
import OpenAI from 'openai';
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });
const ai = new OpenAI();

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Get available appointment slots for a date',
      parameters: {
        type: 'object',
        properties: {
          eventTypeId: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['eventTypeId', 'date'],
      },
    },
  },
];

async function handleToolCall(name: string, args: Record<string, string>) {
  if (name === 'get_available_slots') {
    const { slots } = await orita.getSlots(args.eventTypeId, args.date);
    return JSON.stringify(slots);
  }
}
```

### Vercel AI SDK

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });

const getSlotsT = tool({
  description: 'Get available appointment slots for a given date',
  parameters: z.object({
    eventTypeId: z.string(),
    date: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ eventTypeId, date }) => {
    const { slots } = await orita.getSlots(eventTypeId, date);
    return slots;
  },
});

const bookAppointment = tool({
  description: 'Book an appointment for a client',
  parameters: z.object({
    eventTypeId: z.string(),
    date: z.string(),
    time: z.string(),
    clientName: z.string(),
    clientLastname: z.string(),
    clientEmail: z.string().email(),
  }),
  execute: async (params) => {
    return orita.book(params);
  },
});
```

### LangChain.js

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });

const getSlotsLc = tool(
  async ({ eventTypeId, date }) => {
    const { slots } = await orita.getSlots(eventTypeId, date);
    return slots.map((s) => `${s.label} (${s.value})`).join('\n');
  },
  {
    name: 'get_available_slots',
    description: 'Get available appointment slots for a date (YYYY-MM-DD).',
    schema: z.object({
      eventTypeId: z.string(),
      date: z.string(),
    }),
  },
);
```

---

## Full Example: Book from Available Slots

```typescript
import { OritaClient } from 'orita-sdk';

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY! });

// 1. Get event types
const eventTypes = await orita.getEventTypes();
const eventTypeId = eventTypes[0].id;

// 2. Get tomorrow's slots
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const date = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"

const { slots } = await orita.getSlots(eventTypeId, date);

// 3. Book the first available
if (slots.length > 0) {
  const booking = await orita.book({
    eventTypeId,
    date,
    time: slots[0].value,
    clientName: 'Juan',
    clientLastname: 'García',
    clientEmail: 'juan@example.com',
  });
  console.log(`✅ Booked: ${booking.id}`);
} else {
  console.log('No availability tomorrow');
}
```

---

## CommonJS support

The package ships both ESM and CJS bundles.

```javascript
// CommonJS
const { OritaClient } = require('orita-sdk');
```

---

## Links

- 🌐 **Website:** [orita.online](https://orita.online)
- 📚 **Developer docs:** [orita.online/developers](https://orita.online/developers)
- 🐍 **Python SDK:** [github.com/Alkilo-do/orita-python](https://github.com/Alkilo-do/orita-python) — `pip install orita-sdk`
- 🐛 **Issues:** [github.com/Alkilo-do/orita-node/issues](https://github.com/Alkilo-do/orita-node/issues)

---

## License

MIT © [Alkilo-do](https://github.com/Alkilo-do)
