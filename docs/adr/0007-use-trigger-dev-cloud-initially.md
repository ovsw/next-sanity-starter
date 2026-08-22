# ADR 0007: Use Trigger.dev Cloud initially

Date: 2026-08-20
Status: Accepted

## Context

The product needs long waits, retries, and the Tech Demo's externally completed wait tokens. Trigger.dev Cloud checkpoints waiting runs, while self-hosting would make us operate its database, Redis, workers, storage, backups, and monitoring.

## Decision

- Use Trigger.dev Cloud Free for the Tech Demo and Cloud for the first real product version.
- Send opaque Contact, Appointment, and Nurture IDs to Trigger.dev. Do not put personal data in task payloads, tags, or logs.
- Keep durable customer history and idempotency records in PostgreSQL rather than Trigger.dev run history.
- Upgrade only when staging, concurrency, or longer diagnosis history requires it.
- Revisit hosting and data location after confirming the client's bank-tooling and privacy requirements.
