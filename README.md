# orita-sdk

[![npm version](https://img.shields.io/npm/v/orita-sdk.svg)](https://www.npmjs.com/package/orita-sdk)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**Provider resolution and booking infrastructure for AI applications — official Node.js / TypeScript SDK**

[Orita](https://orita.online) finds the right provider across your network — applying license, insurance, modality, and availability constraints — then confirms the booking safely.

→ **API v2 docs:** [orita.online/developers](https://orita.online/developers)  
→ **API reference:** [orita.online/developers/reference](https://orita.online/developers/reference)  
→ **Python SDK:** [pypi.org/project/orita-sdk](https://pypi.org/project/orita-sdk)

---

## Installation

```bash
npm install orita-sdk
```

> **Requirements:** Node.js 18+. No external runtime dependencies.

---

## Quick start

```ts
import { OritaClient } from "orita-sdk";

const orita = new OritaClient({ apiKey: process.env.ORITA_API_KEY });

// 1. Resolve — find eligible providers with verified availability
const resolution = await orita.resolveScheduling({
  serviceId: "svc_therapy_initial",
  dateRange: {
    from: "2026-08-05",
    to:   "2026-08-12",
    timezone: "America/New_York"
  },
  constraints: {
    languageCodes:      { anyOf: ["es"] },
    modalityCodes:      { anyOf: ["virtual"] },
    licenseRegionCodes: { anyOf: ["US-NJ"] },
    insurancePlanCodes: { anyOf: ["aetna"] },
    acceptsNewClients:  true
  },
  preferences: {
    dayParts: ["afternoon"],
    earliestAvailable: true
  }
});

// resolution.options[0] = ranked, explained provider-time option

// 2. Hold the chosen option
const hold = await orita.holdOption(
  resolution.resolutionId,
  resolution.options[0].optionId
);

// 3. Confirm exactly once
const booking = await orita.confirmResolution(
  resolution.resolutionId,
  {
    optionId: resolution.options[0].optionId,
    holdId:   hold.holdId,
    customer: {
      name:  "James Park",
      email: "james@example.com"
    }
  },
  { idempotencyKey: "confirm-customer-991" }
);

console.log(booking.status); // "confirmed"
```

---

## Why resolution instead of direct booking

Use `resolveScheduling` when you don't know which provider to use. Orita evaluates your entire provider network, applies eligibility rules, verifies availability, and returns ranked options with explanations.

Use direct booking when you already know the provider and slot.

---

## Provider imports

```ts
const job = await orita.providerImports.create({
  mode: "upsert",
  dryRun: true,
  providers: [
    {
      externalId:         "provider-2841",
      displayName:        "Dr. Ana García",
      professionCode:     "clinical_psychologist",
      specialtyCodes:     ["anxiety", "cbt"],
      languageCodes:      ["es", "en"],
      licenseRegionCodes: ["US-NJ"],
      insurancePlanCodes: ["aetna"],
      acceptsNewClients:  true
    }
  ]
});
```

---

## Inspect every decision

```ts
const resolution = await orita.getResolution(resolutionId);
// resolution.exclusionSummary = { "INSURANCE_NOT_ACCEPTED": 3, "LANGUAGE_MISMATCH": 1 }
// resolution.options[0].matchedConstraints = [{ code: "LANGUAGE_MATCH", status: "matched" }]
```

---

## API

```ts
orita.resolveScheduling(request)
orita.getResolution(resolutionId)
orita.holdOption(resolutionId, optionId, ttlSeconds?)
orita.releaseOption(resolutionId, optionId)
orita.confirmResolution(resolutionId, request)
orita.providerImports.create(request)
orita.providerImports.get(importId)
orita.providers.list(options?)
orita.providers.create(data)
orita.bookings.get(bookingId)
orita.bookings.reschedule(bookingId, request)
orita.bookings.cancel(bookingId)
orita.rankingPolicies.simulate(policyId, request)
```

---

## Documentation

- [API v2 overview](https://orita.online/developers)
- [Eligibility rules](https://orita.online/developers/eligibility.md)
- [Provider imports](https://orita.online/developers/provider-imports.md)
- [Webhooks](https://orita.online/developers/webhooks)
- [Migration v1 → v2](https://orita.online/developers/migration-v1-v2.md)
- [Full API reference](https://orita.online/developers/reference)
- [OpenAPI](https://orita.online/openapi.json)
