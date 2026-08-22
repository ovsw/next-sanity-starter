# ADR 0003: Share nurture behavior between demo and production

Date: 2026-08-19
Status: Accepted

## Context

The Tech Demo must show a fourteen-day Nurture Sequence during one presentation. A separate fast demo would prove little and would drift from the product behavior we intend to ship.

## Decision

- Demo and production share message content, stop rules, delivery, and event recording.
- A waiting interface separates two adapters. Production waits until the scheduled date. The Tech Demo waits for a Trigger.dev token that a `Run now` control completes.
- `Run now` advances one Lead's next Nurture Step. It never changes the system clock.
- Next.js verifies that the request belongs to a demo journey before it completes the server-side wait token.
- After resuming, Trigger.dev rechecks whether the Lead booked, replied, or unsubscribed before delivery.
- PostgreSQL permits only one delivery event for each Lead and Nurture Step. Button state is only a user-interface safeguard.
- The Tech Demo uses a Twilio trial account to send real SMS to approved test numbers. Automated tests use Twilio test credentials and send nothing.
