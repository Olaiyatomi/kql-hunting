# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and JavaScript with no build step, served by GitHub Pages from the public repo `Olaiyatomi/kql-hunting` (site at `olaiyatomi.github.io/kql-hunting`). Query content lives in one data file. A small script in the repo regenerates the detection entries from the `identity-threat-detections` repo.

## Users

SOC analysts, threat hunters and detection engineers who write KQL in Microsoft Sentinel, Defender XDR advanced hunting, Log Analytics or Azure Data Explorer. They arrive mid-investigation or while building a rule, looking for a query they can copy, adapt and run, or to remember the syntax of an operator.

## Product Purpose

A public, free KQL reference for security work: a searchable library of hunting queries and detections, plus a cheat sheet of the operators and functions those queries rely on. Success is an analyst finding a query that fits their hunt, understanding why it works, and running it within a minute.

## Positioning

The detection entries come from Tomi Olaiya's `identity-threat-detections` repo, where every rule ships with attack and benign test data that CI replays through a real Kusto engine (the Azure Data Explorer emulator) before merge. Those entries carry that proof. Other hunting queries on the site are clearly marked as not covered by those tests.

## Operating Context

- Analysts paste queries into the Sentinel Logs blade, Defender XDR advanced hunting, or ADX. Copying a query cleanly is the core action.
- Queries are organised by MITRE ATT&CK technique (and MITRE ATLAS for AI attacks), by the log table they read (SigninLogs, AuditLogs, DeviceProcessEvents, OfficeActivity, CloudAppEvents, etc.), and by the product they run in.
- Each detection carries metadata: ID (ITD-0xx), severity, schedule, tuning knobs, false positives, triage steps and references.

## Capabilities and Constraints

- Search and filter across the library by text, tactic or technique, table and product.
- Per-query view: KQL with syntax highlighting, copy button, explanation, tuning notes, false positives, triage steps, references.
- Cheat sheet: operators, scalar and aggregation functions, time handling, joins, and common hunting patterns.
- Must work on GitHub Pages without a server or build pipeline.
- Undecided: whether community contributions are accepted via pull request.

## Brand Commitments

Author attribution: Tomi Olaiya. Source detections are MIT licensed.

## Evidence on Hand

- 14 tested detections (ITD-001 to ITD-014) in `github.com/Olaiyatomi/identity-threat-detections`, each with `rule.yml`, `query.kql` and attack/benign test fixtures.
- No user counts, testimonials or endorsements exist. Do not invent any.

## Product Principles

1. The query is the product: readable, copyable, and correct before anything else.
2. Say what is tested and what is not. Never blur proof.
3. Explain the why: every query teaches the KQL technique it uses.
4. Fast to scan under pressure; an analyst mid-incident should not wade through decoration.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard-operable filters and copy buttons, sufficient contrast for code in light and dark themes.
