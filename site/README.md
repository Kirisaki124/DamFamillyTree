# Gia phả Họ Đàm — family tree website

Static React site (Vite) that draws the family tree from **`public/family.json`**.

```
site/
  public/family.json         ← THE DATA. Edit this to add / change people.
  public/family.schema.json  ← lets VS Code autocomplete & check family.json
  scripts/validate.ts        ← `npm run validate`
  src/                       ← the React app
```

## 1. Adding or editing a member

`family.json` is a **nested tree**: each person lists their own `children`.
The generation (đời) is worked out from how deep the person is nested, so you never type it.

To add a son to **Đàm Anh**, find `"name": "Đàm Anh"` and add an object to his `children`
(create the `children` list if he has none yet):

```json
{
  "name": "Đàm Anh",
  "sex": "M",
  "children": [
    { "name": "Đàm An", "sex": "M" },
    { "name": "Đàm Bình", "sex": "M", "birthDate": "2026" }
  ]
}
```

All fields per person (only `name` is required):

| Field       | Example                  | Notes                                   |
|-------------|--------------------------|-----------------------------------------|
| `name`      | `"Đàm An"`               | required                                |
| `sex`       | `"M"` / `"F"`            | default `"M"`; `F` = daughter           |
| `birthDate` | `"1990"`, `"Canh Ngọ"`   | free text                               |
| `deathDate` | `"15/7 âm lịch"`         | free text — shown as † on the card      |
| `spouse`    | `"Nguyễn Thị B"`         | vợ / chồng                              |
| `note`      | `"Trưởng chi"`           | free text, shown in the detail panel    |
| `children`  | `[ { ... }, { ... } ]`   | in birth order, eldest first            |

Top-level settings: `familyName` (site title), `updated` (date shown in header),
`branchGeneration` (each person in this generation gets their own colour branch, currently 17).

**Tips**
- Open the folder in VS Code: the `$schema` line gives autocomplete and red squiggles for typos.
- Watch the commas: every `{ ... }` in a list is separated by `,`, but no comma after the last one.
- Run `npm run validate` after editing — it prints exactly which person has a problem.
  If the live site gets a broken file, it shows the error list instead of the tree.

## 2. Run locally

Requires Node.js 22+ (`winget install OpenJS.NodeJS.LTS`).

```powershell
cd site
npm install        # first time only
npm run dev        # http://localhost:5173 — reloads when you save files
```

## 3. Deploy

**GitHub Pages (current setup):** pushing to `main` runs `.github/workflows/deploy.yml`,
which builds the site and publishes it automatically. Nothing to do by hand.

### Alternative: AWS S3

```powershell
npm run build      # validates family.json, type-checks, outputs dist/
```

**One-time bucket setup** (AWS console → S3):
1. Create bucket, e.g. `gia-pha-ho-dam`.
2. *Properties → Static website hosting* → Enable, index document `index.html`.
3. *Permissions* → turn off "Block all public access", then add this bucket policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow", "Principal": "*", "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::gia-pha-ho-dam/*"
     }]
   }
   ```
   (For HTTPS / a custom domain, put CloudFront in front with Origin Access Control and keep the bucket private instead.)

**Upload** (AWS CLI):
```powershell
aws s3 sync dist/ s3://gia-pha-ho-dam --delete
# family.json should never be cached, so edits show up immediately:
aws s3 cp dist/family.json s3://gia-pha-ho-dam/family.json --cache-control "no-cache" --content-type "application/json"
```

**Updating only the data later:** no rebuild is needed — the site loads `family.json` at runtime.
Edit `public/family.json`, run `npm run validate`, then upload just that file with the second command above
(using `public/family.json` as the source).

## Other scripts

- `npm run compare-xlsx` — one-off check that `family.json` matches the original Excel file
  (`scripts/expected.tsv`). New members you add will be reported as "extra" — that's expected.
- `npm run preview` — serve the built `dist/` locally, the way S3 will.
