# KQL Hunting

A searchable library of KQL threat-hunting queries and detections for Microsoft
Sentinel and Defender XDR, browsed through the MITRE ATT&CK matrix, plus a KQL
cheat sheet.

**Site:** https://olaiyatomi.github.io/kql-hunting/

## What's in it

- **Tested detections (ITD-xxx).** Generated from
  [identity-threat-detections](https://github.com/Olaiyatomi/identity-threat-detections),
  where CI replays each rule against attack and benign log fixtures in the
  Azure Data Explorer emulator on every push. The site shows each rule's test
  record next to its query.
- **Hunting queries (HQ-xxx).** Written by hand for Defender XDR, Windows
  Security events, Entra ID, Microsoft 365 and Azure activity. They are **not**
  tested in CI: run them over a short time range first and check the results in
  your own tenant.
- **Cheat sheet.** Operators, functions, joins, time handling, dynamic columns,
  common hunting patterns and performance habits, each linked to library
  queries that use them.

## Using the site

- Click a cell in the matrix to filter by technique. Click it again to clear.
- Press `/` to search. Search matches IDs, titles, technique IDs and names,
  table names and the KQL itself.
- Every view has a shareable URL, for example `#q=HQ-013` or `#tech=T1621`.

## Project layout

```
index.html              the whole site (Library and Cheat sheet views)
assets/site.css         styles, light and dark themes
assets/site.js          matrix, filters, search, highlighting, routing
data/detections.js      generated: tested detections
data/attack.js          generated: ATT&CK and ATLAS technique names
data/hunting.js         hand-written hunting queries
data/cheatsheet.js      cheat sheet content
tools/sync_detections.py  regenerates the two generated files
```

There is no build step. GitHub Pages serves the files as they are, and the
site also works when you open `index.html` straight from disk.

## Updating the tested detections

```bash
pip install pyyaml
python tools/sync_detections.py ../identity-threat-detections
```

## Adding a hunting query

Add an object to `data/hunting.js` with the next `HQ-` number. Map it to the
current ATT&CK technique and tactic (the matrix uses ATT&CK's tactic IDs, such
as `stealth` and `defense-impairment`). Run it in a real workspace before you
commit it.

## Running locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Licence

MIT. MITRE ATT&CK® and ATLAS™ are trademarks of The MITRE Corporation.
