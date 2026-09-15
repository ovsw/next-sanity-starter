# Build flow policy

Read this file before writing a feature spec, splitting work into tickets,
implementing a ticket, or using TDD.

## Architectural decisions

Mark every ticket and every item in a spec's Implementation Decisions with:

`Architectural: yes|no — <reason>`

Use `yes` when the work does any of the following:

- changes a stored shape, including a Sanity schema, Page Builder fields, or a
  GROQ result;
- adds, moves, or removes a seam that other code calls through;
- adds a domain term or changes its meaning;
- adds a dependency or the first instance of a pattern that other code will
  copy; or
- makes a choice that would force other tickets to change if chosen
  differently.

Make an architectural decision in the spec. Record it in an ADR when it is
hard to reverse. A ticket points to that decision. If implementation needs an
architectural choice that the spec does not make, stop and ask the user.

## Testing decisions

A spec names what will be tested and why. Use the root `AGENTS.md` fast
verification policy. TDD drives only the slices that need tests. Build other
slices directly.

Test logic rather than appearance. Do not test layout, spacing, color, copy,
or the fact that a component renders. The user gives the visual verdict.

## Implementation completion

- Trace the affected behavior and stored shapes before editing.
- Run the typecheck and focused tests for the changed logic.
- Reserve `pnpm verify` for the release or pull-request gate. It includes
  functional tests in headless Chrome without capture artifacts.
- Do not start a review unless the user asks for one in the current task.
- Commit on the current ticket branch, then report what changed, what was
  checked, and any open questions.

## Pull-request structure

Use one pull request per ticket. Each ticket must remain green when merged to
`main` by itself. Branch from `main`; do not stack ticket branches.

The pull-request body includes `Closes #<ticket>` and `Part of #<spec>`. The
spec closes when its last ticket merges.

When tickets cannot remain green independently, use one integration branch and
one pull request. Gate that pull request with a final integration ticket.

## Review routing

The user decides when to run a review. When requested, route it by risk:

| Work | Review route |
| --- | --- |
| Architectural, data, authorization, or migration work | One pull-request review |
| Non-architectural logic | One CLI review before filing the pull request |
| Appearance, copy, or content | User inspection |

Apply the root `AGENTS.md` limit of one CodeRabbit review per pull request.
