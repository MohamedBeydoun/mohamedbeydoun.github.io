# mohamedbeydoun.com

Plain HTML, CSS, and vanilla JavaScript, themed after ottawa.ca with photos of Barrhaven landmarks. No build step.

GitHub Pages serves the `master` branch root at mohamedbeydoun.com (`CNAME`).

- `index.html`: the whole site
- `404.html`: served by Pages for missing paths, so its links are root-absolute
- `styles.css`: shared styles
- `search.js`: local website-content search, indexed directly from the page, including closed accordions
- `resume.pdf`: current CV
- `sw.js`: unregisters the service worker the old Gatsby site left in visitors' browsers; keep it at this path

Preview locally with `python3 -m http.server` and open http://localhost:8000.

Search covers the page's HTML content, not linked PDFs or GitHub repositories. Queries stay in the browser. Without JavaScript, the header suggests the browser's Find command.

Run regression tests with `node --test tests/site.test.mjs` (Node 24+ and an installed Google Chrome). Tests start their own local server and isolated headless browser, with no package installs. On macOS, the default Chrome path is used; elsewhere, set `CHROME_PATH` to the Chrome executable.

Photos are from Wikimedia Commons; credits and licences are in the site footer.
