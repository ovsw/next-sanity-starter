# ADR 0004: Version funnel content at consent

Date: 2026-08-20
Status: Accepted

## Context

Editors need to improve quiz and email content without changing what an active Lead agreed to receive. Reading the latest Sanity document at every Nurture Step would let a publish silently alter an active action plan and weaken the Consent Record.

## Decision

- Sanity owns published Marketing Funnel content. PostgreSQL owns customer activity and Consent Records.
- One Marketing Funnel editing area contains its quiz, Audience Segments, result guidance, and Nurture Sequences until real reuse justifies separate documents.
- Each Audience Segment has a permanent internal identity and an editable public name.
- A Lead starts one published Marketing Funnel Version and remains on it through the full Nurture Sequence.
- Draft edits affect nobody. Newly published content applies only to later submissions.
