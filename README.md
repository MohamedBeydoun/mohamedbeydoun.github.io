# mohamedbeydoun.com

Plain HTML and CSS, themed after ottawa.ca with photos of Barrhaven landmarks. No build step.

GitHub Pages serves the `master` branch root at mohamedbeydoun.com (`CNAME`).

- `index.html`: the whole site
- `404.html`: served by Pages for missing paths, so its links are root-absolute
- `styles.css`: shared styles
- `resume.pdf`: current CV
- `sw.js`: unregisters the service worker the old Gatsby site left in visitors' browsers; keep it at this path

Preview locally with `python3 -m http.server` and open http://localhost:8000.

Photos are from Wikimedia Commons; credits and licences are in the site footer.
