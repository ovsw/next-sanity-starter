---
target: PHXHomeLoan-web-prototype Refinancing.dc.html live
total_score: 16
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 4
timestamp: 2026-08-03T16-36-56Z
slug: tend-phxhomeloan-web-prototype-refinancing-dc-html
---
# Refinancing Prototype Critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Accordions respond, but jump navigation has no active state and broken links fail silently. |
| 2 | Match System / Real World | 3 | The education sequence is plainspoken; “Start Your Application” does not match its footer destination. |
| 3 | User Control and Freedom | 2 | Breadcrumbs and phone links help, but key navigation and conversion exits are misleading. |
| 4 | Consistency and Standards | 2 | Desktop styling is cohesive; mobile layouts and PHX/Vercellino/Luminate identity are inconsistent. |
| 5 | Error Prevention | 1 | Invalid anchors, misleading CTAs, and categorical financial claims invite predictable errors. |
| 6 | Recognition Rather Than Recall | 3 | Clear steps and headings help, but mobile overflow hides choices off-canvas. |
| 7 | Flexibility and Efficiency | n/a | Persuade/educational marketing surface. |
| 8 | Aesthetic and Minimalist Design | 2 | Strong desktop hierarchy; excessive mobile length and overflow undermine focus. |
| 9 | Error Recognition and Recovery | 1 | Broken or misleading links provide no diagnosis or recovery. |
| 10 | Help and Documentation | n/a | The educational page itself is the help surface. |
| **Total** |  | **16/32** | **Acceptable; major release issues remain.** |

## Design Specificity Verdict

**LLM assessment:** Moderately authored, but not convincingly PHX-specific. Source Serif, Archivo, warm paper, Jimmy's portrait, and the award treatment create a coherent advisor-led experience. The composition remains category-interchangeable: dark statistical hero, sticky jump nav, explainers, cards, comparison table, FAQ, advisor CTA, award band, and footer. More importantly, the rendered header/footer lead with the Vercellino Team and Luminate Bank while PHX Home Loan and Phoenix relevance are absent from the persuasive body.

**Deterministic scan:** The CLI found 13 source issues: seven repeated 14px radius deviations, four undocumented colors, one max-height layout transition, and one copper glow. The mask-gradient `#000` is a false positive. The repeated 14px radii are one token-drift decision, not seven UX problems. The browser detector's cream-palette and most wide-tracking/repeated-kicker warnings are false positives because Warm Paper and tracked editorial labels are canonical. Credible additions are low-contrast text (`#8A8F9C` around 2.9–3.2:1, `#9A9384` around 3.1:1, and some `#C9C2B4` text-like content around 1.8:1) and a copper shadow remaining under a runtime-teal CTA.

**Visual overlays:** Mutable injection succeeded and the disposable tab contained visible overlay nodes. The console summarized 31 anti-patterns. Subagent browser visibility is unsupported, so no reliable user-visible [Human] tab could be presented; screenshots, DOM verification, console logs, and measured widths are the fallback evidence.

## Overall Impression

This is a polished desktop editorial page with an unusually clear learning sequence. The biggest opportunity is not more visual decoration: it is making the mobile experience, public identity, and conversion promise as trustworthy as the desktop presentation.

## What's Working

- The sequence meaning → process → reasons → options → FAQ respects “educate before asking for action.”
- Desktop typography, spacing, and neutral-surface alternation feel calm and credible.
- Jimmy's portrait and the candid “even if the answer is wait” idea provide human differentiation beyond generic mortgage imagery.

## Cognitive Load

Moderate: 3 of 8 checklist failures. Single focus, grouping, one-thing-at-a-time sequencing, low working-memory demand, and progressive disclosure pass. Chunking, visual hierarchy on mobile, and minimal choices fail. Decision points exceeding four options include seven header choices, five jump links, five process steps, five FAQ questions, eight footer resources, and six social destinations. At 390px, off-canvas content compounds these choices.

## Emotional Journey

The navy hero and concrete stats open with calm authority. The five-step sequence raises reassurance, while the categorical comparison table creates an institutional valley. Jimmy's portrait restores warmth. Conversion then collapses: “Start Your Application” and “Schedule Consult” land in a fractured mobile footer with no application or scheduling interface. The award is a strong proof moment, but the ending leaves brand and next-step ambiguity.

## Priority Issues

### [P1] Mobile layout is structurally broken

**Why it matters:** At 390×844, the client width was 375px while the document width was 878px. The imported header, 680px comparison table, and four-column footer remain off-canvas, blocking navigation, comparison, and contact discovery.

**Fix:** Provide a real mobile header/menu, collapse footer columns, constrain outer containers, and make comparison scrolling local—or replace the table with goal-led stacked cards.

**Suggested command:** `$impeccable adapt`

### [P1] Primary actions do not deliver their promised outcome

**Why it matters:** “Start Your Application” and “Schedule Consult” all route to `#contact`, which is only the footer. This breaks the highest-value action and feels like a bait-and-switch.

**Fix:** Choose one truthful primary conversion—consultation, phone call, contact form, or external application—and route directly to it. Rename secondary actions to match their destinations.

**Suggested command:** `$impeccable clarify`

### [P1] Navigation and FAQ accessibility fail silently

**Why it matters:** “Costs & FAQ” targets missing `#refi-faq` instead of `#faq`. FAQ controls use generic `role="button"` containers without keyboard focus or `aria-expanded`. Multiple muted text colors fail WCAG AA contrast.

**Fix:** Correct the anchor, use native `<button>` or `<details>/<summary>` semantics with state, add an active jump-nav state, and replace failing muted text colors with compliant semantic tokens.

**Suggested command:** `$impeccable audit`

### [P1] Public identity conflicts with the product contract

**Why it matters:** The strongest trust surfaces lead with the Vercellino Team and Luminate Bank; PHX Home Loan and Phoenix relevance are not established. Visitors cannot tell which entity they are trusting.

**Fix:** Lead navigation and conversion moments with PHX Home Loan, position Jimmy as its trusted advisor, and keep Luminate/legal identity in a clear supporting role.

**Suggested command:** `$impeccable clarify`

### [P2] High-stakes claims are too categorical

**Why it matters:** “Easier to qualify for,” “Less than 10 years,” “maximum tax advantages,” hero cost/timeline figures, and similar claims can read as personalized or universal guidance even though the site does not determine qualification.

**Fix:** Cite or qualify factual figures, frame comparison rows as typical tradeoffs, and lead with visitor goals rather than implied recommendations.

**Suggested command:** `$impeccable harden`

## Persona Red Flags

**Jordan — first-timer:** “Start Your Application” does not start an application; “Costs & FAQ” fails; ARM, FHA, rate lock, equity, and qualification receive limited explanation; conflicting PHX/Vercellino/Luminate identity obscures authority.

**Riley — stress tester:** Finds the missing anchor, multiple labels sharing the same non-functional destination, categorical qualification/tax claims, page-level overflow, and FAQ state that is visual but not programmatically exposed.

**Casey — distracted mobile user:** Faces an 878px document in a 390px viewport, desktop navigation and footer off-canvas, a clipped comparison table, 12,503px page length, and conversion links that land on no usable action.

**Phoenix homeowner deciding whether refinancing is worthwhile:** Sees no Phoenix-local cue, gets generic term comparison without break-even framing, and cannot connect the advisor's “wait” promise to a working consultation path.

## Minor Observations

- Runtime correctly remaps primary copper accents to Advisor Teal, though the source still contains copper defaults and one copper glow remains.
- “Winning your dream home” reads like purchase-page copy rather than refinance motivation.
- Footer phone numbers differ (`602-908-5849` and `480-800-8387`) without explaining their roles.
- Hero statistics lack immediate source or qualification context.
- The sticky jump navigation has no current-section indication.

## Questions to Consider

- If PHX Home Loan is the public identity, why is it absent at the strongest trust and conversion moments?
- Is the real next step a consultation, a phone call, or an external application?
- Would a goal-first chooser—lower payment, pay off sooner, access equity—serve visitors better than a categorical 15-year/30-year table?
- What evidence would make the “even if the answer is wait” promise concrete?
