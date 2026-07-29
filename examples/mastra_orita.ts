/**
 * Orita + Mastra — Scheduling Agent
 *
 * An AI agent built with Mastra that can schedule medical appointments
 * using the Orita scheduling API.
 *
 * Requirements:
 *   npm install orita-sdk @mastra/core @ai-sdk/openai zod
 *
 * Usage:
 *   ORITA_API_KEY=orita_xxx OPENAI_API_KEY=sk-xxx npx ts-node mastra_orita.ts
 */

import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { OritaClient, OritaError } from 'orita-sdk';
import { z } from 'zod';

// ── Orita client ──────────────────────────────────────────────────────────────

const orita = new OritaClient({
  apiKey: process.env.ORITA_API_KEY ?? 'orita_8512592d89fa1b1936adaa9a6e6847db',
});

const PROVIDER_ID = process.env.ORITA_PROVIDER_ID as string | undefined;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextMonday(): string {
  const today = new Date();
  const daysUntilMonday = ((7 - today.getDay()) % 7) || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0]!;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]!;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const listEventTypesTool = createTool({
  id: 'list_event_types',
  description:
    'List all available appointment types (event types) for this account. ' +
    'Use this to find the correct eventTypeId before checking slots or booking.',
  inputSchema: z.object({
    providerId: z.string().optional().describe('Optional provider ID to scope the query.'),
  }),
  outputSchema: z.object({
    eventTypes: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          duration: z.number().optional(),
        }),
      )
      .optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const eventTypes = await orita.getEventTypes(context.providerId ?? PROVIDER_ID);
      return {
        eventTypes: eventTypes.map((e) => ({
          id: e.id,
          title: e.title,
          duration: e.duration,
        })),
      };
    } catch (err) {
      const msg = err instanceof OritaError ? err.message : String(err);
      return { error: msg };
    }
  },
});

const listProvidersTool = createTool({
  id: 'list_providers',
  description:
    'List available healthcare professionals on the platform. ' +
    'Optionally filter by specialty (e.g. "psychology", "cardiology").',
  inputSchema: z.object({
    specialty: z.string().optional().describe('Medical specialty to filter by.'),
    profession: z.string().optional().describe('Profession filter (e.g. "psychologist").'),
  }),
  outputSchema: z.object({
    providers: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          specialty: z.string(),
        }),
      )
      .optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const pros = await orita.getProfessionals({
        specialty: context.specialty,
        profession: context.profession,
      });
      return {
        providers: pros.map((p) => ({
          id: p.id,
          name: `${p.name ?? ''} ${p.lastname ?? ''}`.trim(),
          specialty: p.specialty ?? p.profession ?? 'General',
        })),
      };
    } catch (err) {
      const msg = err instanceof OritaError ? err.message : String(err);
      return { error: msg };
    }
  },
});

const checkSlotsTool = createTool({
  id: 'check_slots',
  description:
    'Check available appointment time slots for a specific event type and date. ' +
    'Returns slots with label (display text) and value (HH:MM for booking). ' +
    'Try nearby dates if no slots are found.',
  inputSchema: z.object({
    eventTypeId: z.string().describe('The Orita event type ID.'),
    date: z.string().describe('Date in YYYY-MM-DD format.'),
    providerId: z.string().optional().describe('Optional provider/professional ID.'),
  }),
  outputSchema: z.object({
    date: z.string().optional(),
    slots: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
    count: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const result = await orita.getSlots(
        context.eventTypeId,
        context.date,
        context.providerId ?? PROVIDER_ID,
      );
      return {
        date: result.date,
        slots: result.slots.map((s) => ({ label: s.label, value: s.value })),
        count: result.slots.length,
      };
    } catch (err) {
      const msg = err instanceof OritaError ? err.message : String(err);
      return { error: msg, slots: [] };
    }
  },
});

const bookAppointmentTool = createTool({
  id: 'book_appointment',
  description:
    'Book a medical appointment for a patient. ' +
    'Requires eventTypeId, date (YYYY-MM-DD), time (HH:MM from check_slots), ' +
    'and patient details. Returns confirmation with booking ID.',
  inputSchema: z.object({
    eventTypeId: z.string().describe('The Orita event type ID.'),
    date: z.string().describe('Appointment date in YYYY-MM-DD format.'),
    time: z.string().describe('Appointment time in HH:MM format (from check_slots values).'),
    clientName: z.string().describe("Patient's first name."),
    clientLastname: z.string().describe("Patient's last name."),
    clientEmail: z.string().email().describe("Patient's email address."),
    notes: z.string().optional().describe('Optional notes or reason for visit.'),
    providerId: z.string().optional().describe('Optional provider/professional ID.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    bookingId: z.string().optional(),
    status: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    patient: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const booking = await orita.book({
        eventTypeId: context.eventTypeId,
        date: context.date,
        time: context.time,
        clientName: context.clientName,
        clientLastname: context.clientLastname,
        clientEmail: context.clientEmail,
        notes: context.notes,
        providerId: context.providerId ?? PROVIDER_ID,
      });
      return {
        success: true,
        bookingId: booking.id,
        status: booking.status,
        date: booking.date ?? context.date,
        time: booking.time ?? context.time,
        patient: `${context.clientName} ${context.clientLastname} <${context.clientEmail}>`,
      };
    } catch (err) {
      const msg = err instanceof OritaError ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
});

// ── Agent ─────────────────────────────────────────────────────────────────────

const today = getTodayString();
const nextMonday = getNextMonday();

const schedulingAgent = new Agent({
  name: 'Orita Scheduling Agent',
  instructions: `You are a friendly medical appointment scheduling assistant powered by Orita.

Today is ${today}. Next Monday is ${nextMonday}.

Your workflow:
1. Understand what the patient needs (specialist type, preferred date/time).
2. Use list_event_types to find available appointment types on this account.
3. If a specific specialist is needed, use list_providers to find them.
4. Use check_slots to verify availability for the requested date.
   - If no slots on that date, try the next 2-3 business days.
   - For "morning" preference, pick slots before 12:00; for "afternoon", after 12:00.
5. Confirm all details with the patient, then use book_appointment.
6. Return a clear confirmation with the booking ID, date, time, and any next steps.

Be empathetic, concise, and professional. Always confirm details before booking.`,
  model: openai('gpt-4o'),
  tools: {
    list_event_types: listEventTypesTool,
    list_providers: listProvidersTool,
    check_slots: checkSlotsTool,
    book_appointment: bookAppointmentTool,
  },
});

// ── Example usage ─────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('Orita + Mastra — Scheduling Agent');
  console.log('='.repeat(60));

  const userMessage =
    'Hi! I need to book a psychology appointment for next Monday morning. ' +
    'My name is Ana López and my email is ana.lopez@example.com.';

  console.log(`\nUser: ${userMessage}\n`);

  const response = await schedulingAgent.generate([
    { role: 'user', content: userMessage },
  ]);

  console.log(`Agent: ${response.text}`);
  console.log('\n' + '='.repeat(60));

  // Show tool calls if any
  if (response.steps && response.steps.length > 0) {
    console.log('\nTool calls made:');
    for (const step of response.steps) {
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const call of step.toolCalls) {
          console.log(`  → ${call.toolName}(${JSON.stringify(call.args)})`);
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
