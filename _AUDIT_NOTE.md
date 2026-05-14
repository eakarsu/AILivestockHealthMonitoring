# Audit Note — AILivestockHealthMonitoring

Source audit: `_AUDIT/reports/batch_05.md` § 8

## Original audit recommendations

### Missing AI endpoints (audit reported 0 `/ai/*` endpoints)
- `/ai/disease-risk-assessment`
- `/ai/breeding-advisor`
- `/ai/nutrition-optimizer`
- `/ai/health-anomaly-detector`
- `/ai/economic-forecaster`

### Missing non-AI features
- IoT integration (sensors)
- Veterinary portal
- Insurance / compliance documentation
- Mobile app
- Milk buyer integration
- Weather alerts

### Custom feature suggestions
- Vision-based health monitoring
- Agentic herd health advisor
- Environmental control optimization
- Streaming biosecurity monitor
- Breeding optimization agent
- Compliance & traceability

## Implemented in this pass
Created `backend/routes/ai.js` and registered at `/api/ai` in `server.js` (also added to AI rate limiter coverage). Adds three formal `/ai/*` endpoints called out by the audit:

1. **POST `/api/ai/disease-risk-assessment`** — herd-level outbreak risk using Animal + Vaccination context.
2. **POST `/api/ai/breeding-advisor`** — pairing recommendations using Animal + BreedingRecord history.
3. **POST `/api/ai/health-anomaly-detector`** — flags unusual vital sign / behavior patterns from HealthRecord.

All three use the existing `services/aiService.queryAI` wrapper. Local `parseJson` helper handles fenced JSON. Syntax checked.

Existing per-feature endpoints (e.g. `/api/disease-detection/ai-predict`) remain unchanged.

## Backlog (priority order)

### Mechanical
- `/ai/nutrition-optimizer` (FeedManagement model already present)
- `/ai/economic-forecaster` (FinancialRecord model already present)

### Needs creds / external SDK
- IoT sensor ingestion (MQTT, vendor APIs)
- Vision-based monitoring (vision model + image storage)
- Weather alerts (weather provider)
- Insurance carrier integrations

### Needs product decision
- Veterinary portal (auth role + record sharing scope)
- Mobile app (out of backend scope)
- Milk buyer reporting schema
- Compliance & traceability export formats (per-jurisdiction)

## Apply pass 3 (frontend)

LEFT-AS-IS. `frontend/src/pages/AIToolsPage.js` already wires all three backend `/api/ai/*` endpoints (`disease-risk-assessment`, `breeding-advisor`, `health-anomaly-detector`) via an axios instance with JWT bearer interceptor reading `localStorage.token`. Sidebar tool picker, per-tool dynamic form, loading state, and error bubble that surfaces 503 "OPENROUTER_API_KEY" messages from the backend. No changes made.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. Both items in the MECHANICAL backlog (`/api/ai/nutrition-optimizer`, `/api/ai/economic-forecaster`) are already implemented in `backend/routes/ai.js` (lines 91–134) using `aiService.queryAI` with an `ensureAIKey(res)` 503 guard, and FE is wired in `frontend/src/pages/AIToolsPage.js` (entries at lines 48 and 60 with endpoints `/ai/nutrition-optimizer` and `/ai/economic-forecaster`). Remaining backlog is NEEDS-CREDS (IoT/MQTT, vision model + image storage, weather provider, insurance carriers) or NEEDS-PRODUCT-DECISION (vet portal auth role, mobile app, milk-buyer schema, per-jurisdiction compliance exports). No changes made.
