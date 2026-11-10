# Owner Employment and Website Search Implementation Plan

> For agentic workers: REQUIRED: load the `subagent-driven-development` Superpowers skill with `superpowers_skill` to implement this plan.

Goal: Announce Mohamed's December 2026 Owner role and make the search bar search website content instead of GitHub.
Architecture: Preserve the existing single-page static site. A deferred local search.js builds a section index from the DOM and renders safe internal results above the hero.
Tech Stack: HTML, CSS, vanilla JavaScript, installed Node 24 and Google Chrome. No dependencies or build.

## Task 1: Owner announcement and local search

Files:
- Modify index.html: employment metadata/hero/status/work/bio and search form/results markup.
- Modify styles.css: hidden search state, results layout and long-query wrapping using existing tokens.
- Create search.js: DOM-derived local section search and interactions.
- Create tests/site.test.mjs: dependency-free regression tests using real installed Chrome through the CDP pipe, or another repeatable installed-tool browser harness.
- Modify README.md: document search.js and the exact test command.

Contract:
1. Per Mohamed's follow-up, present Owner as his current employer using the title `Staff Software Engineer, Identity and Access Management`. Use present tense, not joining/incoming/starting language. Keep `Dec 2026 - Present` in employment history; omit the date from the subtitle under his name. Owner company link is https://www.owner.com/. Update title/meta description/Open Graph, hero, status, employment teaser, work intro/history/location and bio. Shopify becomes historical context, all existing accomplishments preserved. Mohamed confirmed Shopify's end month: use `Oct 2021 - Nov 2026`. Omit the technology-stack line from Location and contact. Leave resume.pdf and all other assets untouched.
2. Replace the external form action and remove tab=repositories. Form starts hidden and becomes visible only after submit/clear handlers are installed; fallback text suggests browser Find, visible until successful initialization and also without JavaScript. Honor hidden even with display:flex. Form action is local only. Label input `Search this website`; placeholder `Search this website`.
3. Give hero/services/news stable IDs, and index these plus existing substantive main sections and #credits, excluding search results, controls and nav. Text comes from DOM and includes closed details, with spaces between blocks. One entry per section, heading text and local anchor.
4. Submit prevents default, trims/splits whitespace and lowercases terms; every term must match the entry's lowercase text. Render one result per matching section in source order with a title/link and short snippet centered near a term. Use textContent/createElement, never query-derived innerHTML or regex. No fetch or outbound calls. No duplicated maintained content index.
5. Place initially hidden results section immediately inside main above hero. Heading is focusable, count/status is accessible, list semantic. On submit reveal and focus heading; handle empty and no-result queries with readable text and cleared stale results. Explicit Clear search button and clearing input remove results/status and focus input. On result activation open every matching details and enclosing details before focusing/scrolling its section; repeated links work. Focus target is programmatically focusable. Keep all site content visible outside results.
6. Reuse site styles; avoid overflow for long input/snippets on 390px mobile. No em dashes or unnecessary comments/abstractions.

Steps:
- [x] Add regression tests, run `node --test tests/site.test.mjs` and confirm relevant tests fail against current site. Include public copy/title/date/link assertions; Shopify accomplishments; local search labels/action; matching Owner, credential broker, McGill, contact and photo credits; AND/mixed-case/whitespace/no-match/empty; closed details, repeated activation, clear/focus, literal HTML-like query safety, no query network requests, mobile overflow and no-JS/script-load failure fallback.
- [x] Implement only the contract above using a small local script and existing markup/styles. Use installed Chrome CDP pipe (`--remote-debugging-pipe`, stdio descriptors 3 and 4) if managed Chrome disallows debugging ports. Tests must not install packages, depend on /tmp artifacts, or require a running external server. Ensure processes close on success/failure.
- [x] Run `node --check search.js`, `node --test tests/site.test.mjs`, and `git diff --check`. Expected all pass. Review browser-rendered desktop/mobile layout, existing anchors, console/runtime errors, and preserved credits/assets.
- [x] Update README with local preview and repeatable tests. No git add, commit, push or deployment, regardless of other workflow defaults.

Review: spec-reviewer checks this full contract, then code-reviewer checks final unstaged diff. Report accurate verification and explicitly leave PDF resume unchanged/unpublished.
