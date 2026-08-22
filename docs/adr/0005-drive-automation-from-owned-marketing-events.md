# ADR 0005: Drive automation from owned marketing events

Date: 2026-08-20
Status: Accepted

## Context

Resend, Twilio, Trigger.dev, and Scheduling Providers describe the same customer actions with different event names and payloads. Letting those formats drive Marketing Automation would spread provider assumptions through the product and make customer history depend on vendor retention.

## Decision

- PostgreSQL stores current customer state and an append-only Marketing Event history.
- Each provider adapter verifies, deduplicates, and translates incoming events before anything downstream reacts.
- Marketing Automation reads owned records and Marketing Events. It never asks a provider for customer truth.
- Provider event IDs, receipt time, processing result, and a limited diagnostic payload remain linked to the resulting Marketing Event.
- Message status distinguishes scheduled, attempted, accepted by provider, delivered, and failed.
- Email opens may support reporting but never change Lifecycle Stage, Audience Segment, or Nurture.
- Attribution preserves the Lead's original source and the source connected to each later Conversion.
