# Governed veterinary health monitoring operations

## Supported local boundary

The production-shaped path is `/api/governed-veterinary-monitoring`. It persists consented animal/herd identity, source-versioned and unit-bearing observations, device calibration evidence, advisory decisions with veterinarian ownership and visible uncertainty, medication safety metadata, emergency escalation, owned follow-up, missing-data disposition, and versioned validation.

The workflow is explicitly non-diagnostic: diagnosis and autonomous treatment fields fail validation. The generated disease-risk gap endpoint and other gap routes are unmounted.

## Veterinary, privacy, and safety gate

JWT and tenant configuration fail closed. Veterinarian, herd manager, animal-health officer, or admin roles can independently approve; creators cannot self-approve. Export/events are creator/approver/admin scoped. Approved state is required before any external operation. Consent revocation, missing data, contraindication cases, false-negative/calibration metrics, bias strata, and escalation cases are fail-closed inputs.

No local record authorizes diagnosis, medication, treatment, quarantine, slaughter, or emergency action. A licensed veterinarian and applicable jurisdictional rules remain mandatory.

## Lifecycle

- `./start.sh check` validates configuration without external access.
- `./start.sh start` uses preinstalled dependencies and performs no install, schema mutation, seeding, port killing, or service management.
- `ALLOW_SCHEMA_MIGRATION=true DATABASE_URL=... ./start.sh migrate` is the explicit schema command.
- Demo seed data is destructive, forbidden in production, and requires explicit authorization plus a caller-supplied password.

Generated prototypes are opt-in outside production; gap routes stay unmounted.

## External systems and failure

Veterinary records, laboratory, imaging, IoT devices, pharmacy, scheduling, and notification names are outbox boundaries only. A reviewed worker must enforce consent, animal/site mappings, calibration, timestamps, pharmacy rules, secret references, checkpoints, idempotency, bounded retry, and delivery/deletion receipts. After five failures work dead-letters. Hardware readings, lab/imaging results, prescriptions, clinical decisions, and erasure completion fail closed without authoritative systems and veterinarian approval.

## Verification

Run `node --test backend/governance/tests/*.test.js`, exhaustive syntax checks for changed JavaScript, and `bash -n start.sh`. CI covers clinical-boundary validation, follow-up and safety fixtures, tenant/RBAC, migrations, idempotency, failure handling, and lifecycle safety without animals, devices, providers, databases, or treatment actions.

