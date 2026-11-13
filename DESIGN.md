---
name: KQL Hunting
description: ATT&CK Navigator ink over a white work surface; the coverage heatmap is the filter.
colors:
  shell: "#14213d"
  shell-ink: "#ffffff"
  shell-muted: "#c3cde0"
  shell-field: "#22325a"
  shell-line: "#33466f"
  bg: "#ffffff"
  surface: "#f5f7fa"
  ink: "#14213d"
  ink-2: "#3f4b65"
  ink-3: "#59647c"
  line: "#dfe4ec"
  line-strong: "#c4ccd9"
  r0: "#f1f4f8"
  r0-ink: "#59647c"
  r1: "#6baed6"
  r1-ink: "#14213d"
  r2: "#3a6ea5"
  r2-ink: "#ffffff"
  r3: "#1f4e79"
  r3-ink: "#ffffff"
  accent: "#e4572e"
  accent-strong: "#c2410c"
  accent-strong-hover: "#a8380a"
  accent-soft: "rgba(228, 87, 46, .14)"
  pass: "#1c7a4b"
  badge-dark: "#2f6aa8"
  code-bg: "#0f1a30"
  code-ink: "#dbe4f3"
  code-line: "#22314f"
  code-chrome-muted: "#a7b3ca"
  code-control-hover: "#2d4068"
  tk-op: "#ffa07a"
  tk-fn: "#8fc3ff"
  tk-str: "#a8e0b4"
  tk-num: "#f2c66d"
  tk-com: "#8390aa"
  shell-dark: "#0a1326"
  shell-field-dark: "#17233f"
  shell-line-dark: "#26365a"
  bg-dark: "#0d1628"
  surface-dark: "#111c33"
  ink-dark: "#e4eaf5"
  ink-2-dark: "#b9c4d8"
  ink-3-dark: "#95a2bb"
  line-dark: "#213050"
  line-strong-dark: "#2f4166"
  r0-dark: "#131f38"
  r0-ink-dark: "#95a2bb"
  r1-dark: "#255181"
  r1-ink-dark: "#ffffff"
  r2-dark: "#4a8ccf"
  r2-ink-dark: "#0d1628"
  r3-dark: "#9cc7ee"
  r3-ink-dark: "#0d1628"
  accent-soft-dark: "rgba(228, 87, 46, .22)"
  pass-dark: "#5ccf8f"
  code-bg-dark: "#08101f"
  code-line-dark: "#1b2945"
typography:
  headline:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
  title-sm:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  body-sm:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.03em"
  cell:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.25
  code:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"calt\" 0, \"liga\" 0"
  mono-meta:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.6
    fontFeature: "\"calt\" 0, \"liga\" 0"
rounded:
  hairline: "1px"
  tight: "2px"
  base: "3px"
spacing:
  matrix-gap: "3px"
  pad: "24px"
  pad-compact: "16px"
components:
  matrix-cell:
    backgroundColor: "{colors.r0}"
    textColor: "{colors.r0-ink}"
    typography: "{typography.cell}"
    rounded: "{rounded.tight}"
    padding: "6px 7px"
  matrix-cell-r1:
    backgroundColor: "{colors.r1}"
    textColor: "{colors.r1-ink}"
  matrix-cell-r2:
    backgroundColor: "{colors.r2}"
    textColor: "{colors.r2-ink}"
  matrix-cell-r3:
    backgroundColor: "{colors.r3}"
    textColor: "{colors.r3-ink}"
  button-copy-primary:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.tight}"
    padding: "0 10px"
    height: "28px"
  button-copy-primary-hover:
    backgroundColor: "{colors.accent-strong-hover}"
  button-code:
    backgroundColor: "{colors.code-line}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.tight}"
    padding: "0 10px"
    height: "28px"
  button-code-hover:
    backgroundColor: "{colors.code-control-hover}"
  button-icon-shell:
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.base}"
    size: "34px"
  badge-tested:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.tight}"
    padding: "0 7px"
    height: "21px"
  badge-hunt:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tight}"
    padding: "0 7px"
    height: "21px"
  input-search:
    backgroundColor: "{colors.shell-field}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.base}"
    padding: "0 36px"
    height: "36px"
  select:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0 30px 0 10px"
    height: "32px"
  tab:
    textColor: "{colors.shell-muted}"
    padding: "0 14px"
    height: "56px"
  tab-current:
    textColor: "{colors.shell-ink}"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-ink}"
    typography: "{typography.code}"
    rounded: "{rounded.base}"
    padding: "14px 16px 16px"
---

# Design System: KQL Hunting

## Overview

**Creative North Star: "The Navigator Sheet"**

The system borrows the working material analysts already think in: the MITRE ATT&CK Navigator. An ink-navy shell bar sits over a plain white work surface, and the one expressive object on the page is the coverage matrix, a dense grid of technique cells shaded by how many queries reach them. The matrix is an instrument, not decoration; its shading recomputes live as search and filters change, and it is the only thing on the page that moves.

Everything else is quiet tooling. Rows are dense and divided by 1px hairlines, corners are barely softened (2-3px), depth is almost entirely flat, and type is a single humanist sans for interface with a monospace for anything an analyst would type or paste: KQL, query IDs, technique codes, table names. Code blocks sit on a dark navy slab in both themes so pasted KQL always reads the same way. One signal orange marks where you are (the selected cell, the current tab, keyboard focus) and nothing else.

The dark theme keeps the same world on a navy-black ground and flips the coverage ramp so that more coverage reads as brighter, not darker.

**Key Characteristics:**
- Navy shell bar over a white (or navy-black) work surface.
- Coverage heatmap with an empty state plus three shaded steps (0, 1, 2, 3+).
- One signal orange for selection, current location and focus; never a fill for surfaces.
- Dense rows, 1px hairlines, 2-3px corners, flat by default.
- Source Sans 3 for interface, JetBrains Mono with ligatures off for code and identifiers.
- Motion is limited to the matrix cells (160ms background and text color).

## Colors

A cool navy-and-blue instrument palette with a single warm signal.

### Primary
- **Navigator Ink** (shell): the top bar, the Tested badge, the toast, and body text (as ink). It is the identity color; in dark theme it deepens to Midnight Shell (shell-dark) and the Tested badge moves to Lifted Navigator Blue (badge-dark) so it stays distinct from the bar.
- **Coverage Ramp** (r0, r1, r2, r3): the heatmap scale. r0 is Empty Cell Grey for techniques with no matching query; r1 Sky Shade, r2 Navigator Blue and r3 Deep Coverage Navy carry 1, 2 and 3+ queries (the script caps the step at 3). Each step has a paired ink (r0-ink to r3-ink) chosen for contrast; use the pair, never a free text color on a ramp step. In dark theme the ramp runs dim to bright (r1-dark to r3-dark) on the navy-black ground.

### Secondary
- **Signal Orange** (accent): the selected matrix cell's outline, the current query row's inset ring, the current tab's 3px underline, the current cheat-sheet nav marker, the focus-visible outline (2px, 2px offset), the search field's focus border, the text caret, and link hover underlines. Its tint, Signal Wash (accent-soft), highlights search matches.
- **Burnt Signal** (accent-strong): the one orange that carries white text (5.2:1): the primary Copy button, the skip link and text selection. Hover deepens to Ember (accent-strong-hover).

### Tertiary
- **Proof Green** (pass): the check glyph on passing test-record rows only. Brightens to pass-dark in dark theme.

### Neutral
- **Paper White** (bg) and **Desk Grey** (surface): the work surface and the quiet tint for hovered/current rows, proof headers and notes.
- **Ink 2** and **Ink 3** (ink-2, ink-3): secondary text and muted metadata (counts, dt labels, IDs).
- **Hairline** (line) and **Strong Hairline** (line-strong): row dividers and panel borders; strong lines frame form controls and the Hunting badge.
- **Shell Field / Shell Line / Shell Muted**: the search field, shell control borders and inactive shell text inside the navy bar.
- **Code Slab** (code-bg, code-ink, code-line, code-chrome-muted, code-control-hover): the dark KQL block, its divider, its bar text and its button hover. The slab stays dark in both themes.
- **Syntax Tokens** (tk-op, tk-fn, tk-str, tk-num, tk-com): operators and keywords, function calls, strings, numbers, comments (comments also italic). Defined only for the dark code slab.

### Named Rules
**The Signal Rule.** Orange means "here": selected, current, or focused. It outlines, underlines or rings; it never fills a surface. Two fills are allowed: Burnt Signal where orange must carry white text, and the centre square of the brand mark, which pictures a selected cell.

**The Paired Ink Rule.** Every coverage step is used with its own ink. Ramp colors carry meaning (query count); do not reuse them as decorative blues.

## Typography

**Display Font:** none; the system has no display tier.
**Body Font:** Source Sans 3 (with Segoe UI, system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Cascadia Mono, Consolas, monospace)

**Character:** A plain, legible humanist sans doing all interface work at small sizes, paired with a code mono that marks everything machine-readable. Numerals are tabular throughout so counts line up.

Both families are self-hosted as variable woff2 files (latin subset) in `assets/fonts/`, with their SIL OFL licences beside them. The page makes no third-party font requests: a security reference should not report its readers' visits elsewhere, and analyst machines with restricted egress still get the right faces. Weights in use: Source Sans 3 at 400/600/700, JetBrains Mono at 400/500.

### Hierarchy
- **Headline** (700, 26px, 1.2, -0.01em; 23px at 860px and below): the open query's title in the detail pane, balanced, max 30ch.
- **Title** (700, 22px / 20px / 19px, 1.2): cheat-sheet section headings, the cheat-sheet nav heading, and the wordmark.
- **Title Small** (700, 17px then 15px, 1.2): the matrix header line and the list header. A lighter 400 ink-3 run may follow inside the same line as a subtitle.
- **Body** (400, 15px, 1.5): running text; long prose blocks cap at 75ch. Query titles in rows use 600 at 1.3.
- **Body Small** (400-600, 14px then 13px): filter labels, fact values, proof rows, notes, subtitles in rows, footer.
- **Label** (700, 13px, 0.03em, uppercase, ink-2): headings of detail sections (Description, Tuning, False positives) and, at 12px in ink-3, cheat-sheet table column heads. These are the headings themselves, not tags above other headings.
- **Cell** (400, 12px, 1.25): technique names in matrix cells, clamped to four lines; tactic heads use 700 at 12px.
- **Code** (mono 400, 13px, 1.6, tab-size 4): KQL blocks; 12px at 1.55 in cheat-sheet examples.
- **Mono Meta** (mono 500, 11-13px): query IDs, technique codes, tuning keys, expected-result counts, the detail top line.

### Named Rules
**The Literal Code Rule.** All mono text runs with ligatures and contextual alternates off ("calt" 0, "liga" 0) so `==`, `>=` and `!=` read exactly as typed. This includes mono set through the font shorthand.

**The Machine-Readable Rule.** Anything an analyst would paste or search for (KQL, IDs, technique codes, table names, function names) is set in mono; everything else is sans.

## Layout

A full-width, edge-padded application layout. The navy top bar (56px, sticky) holds the wordmark, Library and Cheat sheet tabs, a flexible search field (max 560px) and the theme and GitHub controls. In the Library view the matrix runs full width directly beneath it: one column per tactic (minimum 94px, 3px column gap, cells stacked 3px apart), scrolling horizontally with snap when it does not fit, followed by a small legend. Below, a two-pane results grid: query list left (minmax(340px, 5fr)) and a sticky, independently scrolling detail pane right (7fr). The Cheat sheet view is a 250px sticky section nav beside a reading column.

Horizontal rhythm comes from a single page gutter (pad, 24px), which drops to 16px at 860px and below. Internal gaps stay small (3, 6, 10, 12, 14px); density is deliberate.

Breakpoints: at 1100px the results grid rebalances to minmax(300px, 1fr) / 1.3fr. At 860px the top bar wraps and unsticks (search on its own row), matrix columns fix at 150px and scroll, the results and cheat-sheet layouts stack to one column, the cheat-sheet nav becomes a wrapped row of bordered links, and the cheat-sheet table collapses to stacked blocks.

## Elevation & Depth

Flat by default. Depth comes from the navy shell against the white surface, the dark code slab, the Desk Grey tint for hovered and current rows, and 1px hairlines. State is drawn with inset rings, not lift: a 1px ink ring on hovered cells, a 2px orange inset ring plus 1px outer ring on the selected cell, a 1px orange inset ring on the current query row.

### Shadow Vocabulary
- **Toast float** (`box-shadow: 0 6px 20px rgba(10, 19, 38, .25)`): the copy-confirmation toast, the only floating element.

### Named Rules
**The Ring, Not Lift Rule.** Hover, selection and current state are inset rings or tints. Nothing rises on hover.

## Shapes

Barely softened rectangles. Fields, panels, code blocks, the proof table, notes and shell controls use 3px (base); matrix cells, badges, code-bar buttons, kbd hints, cheat-sheet example blocks and match highlights use 2px (tight); legend swatches use 1px. Borders are 1px hairlines; tactic heads and cheat-sheet table heads sit on a 2px ink rule, and ATLAS tactic heads switch that rule to a 3px double line to set AI-attack columns apart. Notes use a 1px dashed strong hairline. Icons are stroked line SVGs (1.7-2.4 stroke, round caps), 11-17px.

## Components

### Buttons
Small, flat, and placed where the work is.
- **Shape:** tight corners (2px) on code-bar buttons; base corners (3px) on shell icon buttons.
- **Primary (Copy):** Burnt Signal fill with white 13px/600 text, 28px tall, 0 10px padding, optional 14px stroked icon. Hover deepens to Ember.
- **Code (secondary):** Code Line fill with white text on the code slab, same size; hover to Code Control Hover. The cheat-sheet mini copy is a transparent 26px square in Code Chrome Muted that fills on hover.
- **Shell icon button:** 34px square, 1px shell-line border, Shell Muted glyph; hover lifts glyph to white and border to Shell Muted.
- **Text button:** underlined 14px/600 ink-2 text with no chrome (Clear filters); hover turns ink with an orange underline.
- **Focus:** global 2px Signal Orange outline at 2px offset.

### Chips (badges)
- **Tested:** Navigator Ink fill, white 12px/700 text at 0.02em, 21px tall, with an 11px check glyph. In dark theme the fill moves to badge-dark.
- **Hunting:** no fill, 1px inset Strong Hairline ring, ink-2 text. The pair states proof plainly: filled means CI-tested, outlined means not.

### Cards / Containers
There are no cards. Content sits in panes divided by hairlines.
- **Proof table:** 1px hairline border, base corners, Desk Grey header, hairline-separated rows with a Proof Green check.
- **Note:** Desk Grey fill, 1px dashed Strong Hairline border, base corners, ink-2 14px text.
- **Code block:** Code Slab, base corners, a bar with label and actions above a scrollable pre.

### Inputs / Fields
- **Search (shell):** 36px Shell Field input with 1px Shell Line border, base corners, 17px stroked search glyph inset left, a `/` kbd hint right that hides on focus or when filled. Focus swaps the border to Signal Orange instead of an outline.
- **Select:** 32px, Paper White, 1px Strong Hairline border, base corners, custom chevron; hover darkens the border to ink-3.
- **Checkbox:** native, 16px, accent-color Navigator Ink (badge-dark in dark theme).

### Navigation
- **Tabs:** Shell Muted 600 text full bar height, 0 14px; hover to white; current tab white with a 3px Signal Orange bottom border.
- **Cheat-sheet nav:** a list on a 1px left hairline; each link ink-2 14px with a 2px left marker that is Strong Hairline on hover and Signal Orange (plus 600 weight) when current. At 860px it becomes wrapped bordered links with an orange border on the current one.

### Coverage Matrix (signature)
Tactic columns in kill-chain order, each headed by a 12px/700 tactic name and a muted query count over a 2px ink rule. Each technique is a full-width button cell: name clamped to four lines, then a mono meta line with the technique code and the count (the count is hidden on empty cells). Background and ink come from the coverage step; transitions run 160ms ease-out on background-color and color only. Hover draws a 1px inset ink ring; the selected cell carries the orange double ring. A legend beneath shows the four steps (0, 1, 2, 3+).

## Do's and Don'ts

### Do:
- **Do** shade coverage with r0 plus the three ramp steps, capped at 3+, each with its paired ink.
- **Do** keep Signal Orange to selection, current location and focus (outline, underline, ring, caret), and use Burnt Signal when orange must carry white text.
- **Do** set KQL, IDs, technique codes and table names in JetBrains Mono with ligatures off.
- **Do** keep code on the dark Code Slab in both themes.
- **Do** draw state with inset rings and the Desk Grey tint; keep surfaces flat.
- **Do** keep motion to the matrix cells' 160ms color transitions, and drop all transitions under prefers-reduced-motion.

### Don't:
- **Don't** fill buttons, panels or text backgrounds with Signal Orange; white text on it fails AA, and fills dilute the "here" signal (the brand mark's centre square is the one picture-of-selection exception).
- **Don't** reuse coverage ramp blues for decoration or unrelated status; they mean query count.
- **Don't** add hover lift, drop shadows or card chrome to rows, cells or panels; the toast is the only floating element.
- **Don't** animate anything other than the matrix cells.
- **Don't** blur the Tested / Hunting distinction: filled Navigator Ink for tested, outlined for not.
