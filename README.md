# Gia phả Họ Đàm

- **Website source:** [`site/`](site/) — see [`site/README.md`](site/README.md) for how to add members.
- **Data file (edit this):** [`site/public/family.json`](site/public/family.json)
- **Markdown copy of the tree:** [`family-tree.md`](family-tree.md) (snapshot of the 04/11/2026 Excel version)

Every push to `main` rebuilds and publishes the site to GitHub Pages
(workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## Updating from the browser (no install needed)

1. Open `site/public/family.json` on github.com → click the ✏️ pencil.
2. Add the new person inside their father's `"children": [ ... ]`.
3. **Commit changes**. After ~1 minute the site updates.
   If the file has a mistake, the run in the **Actions** tab fails with the exact problem and the live site is left unchanged.
