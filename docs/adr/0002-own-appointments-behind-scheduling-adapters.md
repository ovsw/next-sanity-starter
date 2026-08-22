# ADR 0002: Own appointments behind scheduling adapters

Date: 2026-08-19
Status: Accepted

## Context

PHXHomeLoan.com needs a consistent Consultation flow across clients without making a Scheduling Provider the source of customer history. Jimmy currently uses Microsoft Bookings in Luminate Bank's Microsoft 365 tenant. Microsoft Bookings cannot send the booking events we need through webhooks or carry our contact ID through the booking, so an integration would need Power Automate or polling and would match records by email.

## Decision

- PostgreSQL owns every Appointment, including its contact, status, attribution, provider, and provider reference.
- Marketing Automation reads Appointment records, never a provider API.
- One provider adapter turns booking, rescheduling, and cancellation events into the same internal Appointment operations.
- Cal.com is the first adapter and carries our contact ID in provider metadata.
- A future Microsoft Bookings adapter may match by email, but that uncertainty stays inside the adapter.
- Trigger.dev sends reminders. Scheduling Provider emails do not drive the Consultation flow.
- Reschedule and cancellation links start from our Appointment ID and resolve through the active adapter.

## Open question

Ask Jimmy whether Luminate Bank requires loan originators to use bank-approved scheduling or communication tools for supervision, recordkeeping, or data handling. If it does, add the Microsoft Bookings adapter without changing downstream Appointment or Marketing Automation behavior.
