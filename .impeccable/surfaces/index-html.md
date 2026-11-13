---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

Scope: index.html, the whole KQL Hunting site (Library view and Cheat sheet view in one page). Visitor mode: Operate (Library), Read (Cheat sheet).

Audience and job: SOC analysts, hunters and detection engineers find a KQL query for a technique, understand it, copy it into Sentinel / Defender XDR. Proof: CI-tested detections from identity-threat-detections are badged Tested; hand-written hunting queries are badged Hunting and say they are not CI-tested.

Constraints: static GitHub Pages, no build step; data in data/*.js; works from file:// too.

## Direction contract

THESIS: The library is browsed through the ATT&CK matrix analysts already think in: the heatmap is the filter, not a decoration. Refuses the docs-sidebar-plus-card-grid arrangement every query collection ships.

OWN-WORLD: Navigator ink navy shell (#14213d) over a white work surface; a five-step blue coverage ramp (#eef3f9, #c6dbef, #6baed6, #3a6ea5, #1f4e79) shades technique cells by query count; one signal orange (#e4572e) marks selection only. Source Sans 3 for UI, JetBrains Mono for KQL, IDs and technique codes. Dense rows, 1px hairlines, 2px radii. Dark theme keeps the ramp on a navy-black ground.

STORY: The visitor sees which techniques have coverage at a glance, clicks a cell, reads a short list of matching queries, opens one, trusts it by its Tested badge and test record, copies the KQL. The Cheat sheet answers "what is the syntax for X" without leaving the site.

FIRST VIEWPORT: Navy top bar: wordmark left, search (focus with /) centre, Library and Cheat sheet tabs, GitHub link right. Under it the full-width heatmap: one column per tactic in kill-chain order, technique cells shaded by count, selected cell outlined orange, filter chips (table, product, Tested only) on the matrix header row. Below: query list left (ID, title, technique, table, badge), detail right (title, metadata, highlighted KQL with Copy, then description, tuning, false positives, triage, test record).

FORM: ATT&CK Matrix, position 1 on my ordered list (IMPECCABLE'S PICK, chosen by the user). seed:a71eb5bbf944436c. Signature interaction: cell shading recomputes live as search, table, product and Tested filters change; cells with zero matches fade, counts update, and clicking a cell scopes the list. Motion grammar: 160ms background-color transitions on cells, nothing else animates.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
