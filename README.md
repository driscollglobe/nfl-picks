# NFL Picks Lab

Private interactive dashboard for the NFL ATS model in the parent folder.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use Model Lab to change the edge threshold,
EPA/ELWAY blend, home field, rest, bye, travel, and quarterback assumptions.
The interface recalculates scenarios in the browser; it does not modify the
recorded `picks.csv` history.

The parent project writes `lib/model-data.json` whenever
`python weekly.py --update` or `python weekly.py --picks` completes. You can
also regenerate it directly from the parent folder with:

```bash
.venv/bin/python web_export.py
```

## Verify

```bash
npm run lint
npm run build
```

Keep this repository private. Its generated model bundle contains derived
Silver Bulletin ELWAY subscription values.
