# ADR 0006: Use Neon for operational PostgreSQL

Date: 2026-08-20
Status: Accepted

## Context

The Tech Demo needs plain PostgreSQL, Drizzle support, isolated preview data, and a clean Vercel deployment. Supabase adds authentication, storage, realtime, and data APIs that this product does not need.

## Decision

- Use Neon for the Tech Demo and first real product version.
- Keep Drizzle migrations in the repository and use ordinary PostgreSQL features so another host can replace Neon.
- Keep Neon-specific code outside business modules.
- Revisit region and contractual requirements before storing real customer data.
