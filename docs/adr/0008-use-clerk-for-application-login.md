# ADR 0008: Use Clerk for application login

Date: 2026-08-20
Status: Accepted

## Context

PHXHomeLoan.com needs real login for its private team area. Application login and Microsoft calendar authorization solve different problems and must remain separate.

## Decision

- Use Clerk for application login. Use Microsoft Graph OAuth separately for calendar access.
- Use one Clerk Organization for The Highly Motivated Vercellino Team with Clerk's built-in administrator and member roles.
- The PHXHomeLoan.com database grants access using Clerk user and Organization IDs.
- Keep other Web Properties, satellite domains, cross-property login, and cross-client administration out of scope.
- Reconsider WorkOS only when a paying client requires enterprise SSO, directory sync, or bank-controlled employee access.
