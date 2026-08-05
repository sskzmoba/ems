# Post-Audit Changelog

Every code change deployed to the live SSKZM OBA Election Management System **since the final SOP compliance audit report** (Edify Datascience Pvt Ltd, v1.2.0, 31 July 2026 — verdict: Fully Compliant), with the deployed version, the git commit it corresponds to, and what changed and why.

This log starts *after* that report, deliberately — everything up to and including @332 was already reflected in it. What belongs here is exactly the category that needs its own transparency: changes made to a system the audit had already signed off on as fully compliant.

This file is committed to the repository, unlike the internal working notes in `docs/` — its whole purpose is to be a legible, external-facing record, so it needs its own real git history rather than living somewhere untracked.

Each entry here also has a matching, machine-readable log entry in the live system's own `AdminLog` (action type `code_deployed`) — see `logCodeDeployment` in `Code.js`. That copy is what lets anyone reviewing the live audit trail see exactly when the code changed, interleaved chronologically with the votes/nominations/decisions it may have affected. This file is the same information, written for people rather than the system.

---

## @333 — 4 August 2026
**Commit:** `69add58`

- Landing Page: RO Panel discoverability fix. The public `?action=ropanel` page existed but had no visible link from the main Landing Page (unlike Tutorial/Results/Voter Roll, which all do) — a member who missed the announcement email had no way to discover the panel or its objection window. Added a conditional button, shown only once a panel is actually published for the current AGM year. Purely additive — no existing function modified.

## @334 — 5 August 2026
**Commit:** `69add58`

- Draw of lots: multi-winner support for SOP 8.4. Previously, a tie affecting more than one seat (e.g. three candidates exactly tied for both VP seats) could be "resolved" by recording a single winner, satisfying the tie-detection check while silently leaving one seat's outcome undetermined. New shared helper `_getContestedSeatsAtCutoff` computes exactly how many winners a draw must produce; both `conductDrawOfLots` (in-system random draw) and `recordDrawOfLots` (manual/physical draw record) now require and produce that many distinct winners, rejecting a mismatched count outright. `_findRecordedDrawWinners` (renamed, plural) reads both the new and old record shapes, so historical single-winner draws stay valid.
- Verified via a dedicated mock-harness test (19/19 passing) covering the single-seat backward-compatible case, the exact multi-seat bug scenario end to end, the in-system random draw, Scrutineer witnessing, and rejection of a mismatched winner count.

## @335 — 5 August 2026
**Commit:** `69add58`

- `logCodeDeployment` — new function writing a deployment record (version, commit hash, description) directly into `AdminLog`, plus a matching "Deployment Log" card in the Admin Settings tab. This is the mechanism this changelog file itself refers to in its own introduction — going forward, every entry here has a matching `AdminLog` entry, not just a file on disk.
- Landing Page schedule note fix: the public schedule widget showed "AGM date (V-Day) is not yet confirmed... once the AGM is scheduled" even when a real, EC-set V-Day existed in draft (not yet RO-confirmed) form — conflating "not yet officially confirmed" with "not yet decided at all." Now shows the actual provisional dates, clearly marked, when a draft schedule exists; the fully-unset case is unchanged.
- Trial-run feedback fixes, from a colleague who acted as RO for the just-concluded EC trial election:
  - Toast notification duration shortened (3000ms → 1800ms) — during a fast sequence of admin actions, each new toast was re-extending before the previous one faded, making it look like it never disappeared.
  - Added a confirmation modal before conducting an in-system draw of lots — nothing previously stopped a second, accidental click from running a second draw for a post that already had one, which would silently replace the first as the recorded outcome once witnessed.

---

*Next entry gets added right after its own deployment, with a real commit reference at the time — not backfilled in bulk.*
