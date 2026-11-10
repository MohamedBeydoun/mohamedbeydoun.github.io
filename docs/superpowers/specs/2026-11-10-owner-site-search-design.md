# Owner employment and local website search

Approved by Mohamed in conversation on November 10, 2026.

## Employment

Present Owner as the current employer with the role Staff Software Engineer, Identity and Access Management, matching the previous Shopify presentation. Update title, description/Open Graph metadata, hero, service update, employment service teaser, work introduction/history/location, and personal bio. Per Mohamed's follow-up, use present tense rather than joining/incoming/starting wording despite the future start date. Keep `Dec 2026 - Present` only in employment history; the subtitle under his name contains only role and company. Link Owner to https://www.owner.com/. Preserve Shopify projects and their accomplishments. Mohamed confirmed Shopify ends in November 2026: use `Oct 2021 - Nov 2026`. Do not include a technology-stack line under Location and contact; technologies remain in skills and project history. Keep location as Barrhaven, Ottawa and avoid deriving personal location from job eligibility. Do not alter resume.pdf.

## Search

Replace GitHub repository search with dependency-free JavaScript search of substantive HTML content on this page. Keep the existing visual language and static GitHub Pages deployment. Index main content sections, including the hero, news, services and photo credits. Exclude navigation, search UI/results, and script/style content. Read collapsed accordion content. Derive index text from the DOM so there is no duplicate hand-maintained index.

Submit shows one result per matching section above the hero, including section title, plain-text snippet around a match, and a local anchor. Match all whitespace-separated terms case-insensitively. Normalize block whitespace, including separating adjacent blocks. Query data must never be parsed as HTML or a regular expression. On result activation, open all matching details and their ancestors, then focus/scroll the section. Repeated activation works.

Provide a labeled input, accessible results heading and count/status, keyboard-operable links and explicit clear control, visible focus, no-results and empty-query feedback. Clear removes stale results and returns focus to the input. No remote search requests or external form destination. Search form starts hidden, and is revealed only after its handler is installed; a fallback message suggests browser Find when JavaScript is unavailable or fails. CSS must honor the form's hidden state despite its flex layout.

## Boundaries and verification

No new dependencies, build process, fuzzy matching, PDF indexing, URL query persistence, automatic employment-date switching, redesign, CV editing, staging, commits, pushes, or deployments. Preserve credits, existing asset links, CNAME, .nojekyll, verification meta and sw.js. Verify employment copy plus empty, whitespace, case-insensitive/multi-term, no-match, HTML-like query, closed-details and repeated-result behavior in a real browser. Check keyboard focus, 390px mobile overflow, script-disabled/failure fallback, and absence of query-triggered network requests. Use installed Node and Chrome only.
