# SSKZM OBA EMS — BRIDGE NOTE
*Consolidates and supersedes SSKZM_OBA_MASTER_BRIEF_UPDATED1.md (frozen at Session 27, 11 June), SSKZM_OBA_EMS_CODEWRITING_STATUS_UPDATED.md (frozen at Session 43, 28 June), and SESSION_HANDOVER_2026-07-14.md, bringing the project state up to 22 July 2026. Read this first. Where this note conflicts with any older document, this note wins — except Code.js itself, which remains ground truth over every document including this one.*

*Prepared for migration from Claude Project (claude.ai) to VS Code + Claude Code.*

---

## DOCUMENT AUTHORITY HIERARCHY (supersedes the hierarchy in the old Master Brief)

1. **Code.js / AdminJS.html / VoterJS.html / SharedJS.html / ECOfficerJS.html / LandingPage.html / TutorialPage.html / Index.html** — ground truth for anything about current runtime behaviour. If this note and the code disagree, trust the code and flag the discrepancy.
2. **This Bridge Note** — current status, pending work, known gaps.
3. **The adopted SOP and Bylaw Amendment** — constitutional/governance reference. *(See Part B.2 — confirm final adopted text before relying on the sub-committee draft still in project knowledge.)*
4. **Step 3 Backend Function Map + Step 3 Amendments** (27 May) — architecture rationale, still valid where not superseded by later code changes.
5. **Step 4 UI Page Map / Step 5 doGet Routing Design** (27 May) — screen and routing design, still valid.
6. **Session 18 Handover** (27 May) — original data architecture and access-tier design.
7. Everything else in `/docs/archive` — historical only. See Part F.

---

## PART A — DURABLE REFERENCE

### A.1 System Identity & Account Architecture

**Project:** SSKZM Old Boys Association — Election Management System
**Platform:** Google Apps Script (Web App) + Google Sheets

| Account | Purpose | Holds |
|---|---|---|
| Workspace account (OBA) | Permanent institutional documents + VVA | SOP, Tech Spec, Nomination Form PDF, all permanent OBA documents. Also hosts VVA GAS project and master membership sheet. |
| `elections.sskzmoba@gmail.com` | Election operations | Google Sheet, Apps Script, Web App, candidate document uploads. Handed to RO at appointment. |
| `sskzmobakazak@gmail.com` | Main OBA institutional email | Day-to-day comms. Also recovery email for elections account. |
| `oldboysassociationsskzm@gmail.com` | Spare — freed up | Nothing. GDrive folder transferred to elections account. |

**`elections.sskzmoba@gmail.com` — Account Recovery**
| Field | Value |
|---|---|
| Recovery Phone | `+91 9188942505` |
| Recovery Email | `sskzmobakazak@gmail.com` |
| Password storage | Sealed envelope — President + General Secretary |

### A.2 Two-System Architecture

**System A is frozen. Never modify it. All active development targets System B.**

| | System A | System B |
|---|---|---|
| Status | Frozen — fallback only | Active development |
| Apps Script project | Existing project | `1-cZ5jcJNPnFIRrOD6AiWXPyqYOEhHSBUHHF6_iOFv3W-CdwC0k4MyCnH` |
| Google Sheet | `18g7VpbA4nrSVGew9WRQ3rTs8PLJsmxubv4ztJ4KJG4Q` | `1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E` |
| Web App URL | `.../AKfycbw12PQMkv-BGhWt0sl8N847uNbVxDMgkkG8CNSIIaMWN_NULV-ZMaXKT6qfen_RPnK0/exec` | `.../AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec` |
| Tab count | 12 | 22 |
| GitHub | `sskzmoba/ems-legacy` (archived) | `sskzmoba/ems` |

Standard deploy sequence: Apps Script editor → Deploy → Manage Deployments → pencil → New Version → Deploy (never just Save) → `clasp pull` → git commit at end of session.

---

## PART B — GOVERNANCE STATUS

### B.1 SGM Outcome — 18 July 2026

Held 1400–1600 hrs IST, hybrid (physical + Google Meet, livestreamed). Quorum of 50 Life Members verified per Article IV, Section 3(ii). President Capt KM Breeze Antony in the chair; GS Lt Col Shelley K Das presented resolutions and, with the Technical Team, the system/trial overview.

**Resolution 1 — Bylaw Amendment to Article IV, Section 1A(iii).** Moved by Col Sajjad M, seconded by Gp Capt Padmaraj. **Passed unanimously.**

**Resolution 2 — Adoption of the SOP for Conduct of Elections. Passed unanimously, as amended on the floor.** Moved by Lt Cdr Cibin V Charley, seconded by Shri Ram Mohan G.

> **Floor amendment (Item 5b) — action required, see D.2:** the resolution as originally drafted had future EC amendments to the SOP go to the AGM merely "for information." Members agreed on the floor that since the SOP is itself being adopted by the General Body, future EC amendments to it must instead go to the AGM **for ratification**. Resolution 2 passed in this amended form. **The SOP document's own clause governing EC's amendment power needs to be updated to say "ratification," not "information," to match what was actually adopted** — the sub-committee draft in project knowledge predates this and will not reflect it.

**Other floor discussion (Item 5), noted for record, no action required:**
- *(a) Caretaker EC clause / Registrar notification* — a member questioned the legality of the Caretaker EC clause given the Bylaws' Registrar-notification requirement. Resolved on the floor: the amendment is within the General Body's lawful authority, will itself be filed with the Registrar once adopted, and the Caretaker clause is an extreme-contingency provision, not a routine mechanism.
- *(c) Timing relative to the AGM* — queried why this went through an SGM rather than waiting for the AGM. Resolved: the streamlined procedure needed to be in place *before* the AGM (which under the Bylaws must occur on or before 30 September), so it could not wait.

**Trial resolution-voting at the SGM itself:** the President noted in his address that online attendance registration and resolution voting were trialled alongside the physical process at this SGM, and that this "met with partial success," with shortcomings to be rectified before full implementation at the AGM. **Open item — needs your input, not yet documented anywhere:** what specifically didn't work. This corresponds to Phase D (Resolution Voting) in the old Master Brief status table, previously marked "NOT STARTED" — it has now been attempted at least once, informally, outside the main EMS. Worth a short write-up of what broke before this is picked up as a coding task.

### B.2 SOP / Bylaw Document Pointers — action required

Project knowledge currently holds `SSKZMOBA_ElectionsSOP_SubcommitteDraft_20052026.docx` and `SSKZMOBA_ElectionsBylawClause_SubcommitteeDraft_20052026.docx`, both dated 20 May — **pre-SGM sub-committee drafts.** Now that both resolutions have passed (Resolution 2 with the floor amendment above), **confirm whether a final adopted-text version exists and supersede these drafts with it** before Claude Code — or anyone — treats the SOP as authoritative for a sync check.

### B.3 Known SOP↔Code Sync Gaps (Tech Spec Appendix G)

- **OBJ-1 objection flow** — built in code, absent from the SOP's Appeals Panel clause 2A.12.
- **Phase 2 Extension scope mismatch** — SOP describes an extension scoped to mandatory posts only; live code (`triggerPhase2Extension`) reopens all posts election-wide.

SOP catches up to code, not the reverse — these are documented gaps, not bugs, per your own stated principle.

---

## PART C — TECHNICAL STATUS

### C.1 Deployment State as of 22 July 2026

System B is live and current. This week (Sessions ~50–51, 14–22 July) saw five deployment rounds on top of the 14 July handover baseline:

1. **`getElectionsForVoter`** — filters `ELEC_INTERNAL_TEST`, closing the voter-picker leak.
2. **`getPublicResults`** — filters `ELEC_INTERNAL_TEST` on both direct-electionId and default-declared lookup, closing the unauthenticated public leak (the more serious half of the pair).
3. **Verification-category fix** — added missing `COL.VOTER_VERIFICATION_CAT` (Voters col 13); `getVoterList` now reads the real category written at certification instead of the always-`FALSE` `VOTER_EMAIL_VER` (col 10).
4. **Bio mandatory, 30-char minimum** — enforced server-side across all three nomination paths (`submitNomination`, `submitNominationManual`, `submitNomination_Phase2`) and client-side in both VoterJS forms and the AdminJS manual-entry form.
5. **"Internal Test Election?" toggle added to AdminJS.html** — previously referenced in the PreSec guide (item E1) but had no UI control at all; `isInternalTest` now flows from `createElection` through to `getAllElections`/`getElection`, with a purple badge in both the elections list and detail view.
6. **`initSystemBSheets` header fix** — the bootstrap function's Elections/Voters/TEMAuth header lists were stale relative to live `COL` constants (missing `CandPubAt`/`VotesHash`/`InternalTest` on Elections; missing the reserved cols + `VerificationCategory` on Voters; missing `ConsumedActions` on TEMAuth). Fixed — this function is also what any external sandbox (see C.5) relies on to bootstrap correctly.

All confirmed deployed, `clasp pull`led, and git-committed as of this note.

### C.2 Trust Architecture — What's Enforced, and Where It's Trial-Exempt

This matters a lot for test planning — several gates are deliberately skipped for trial elections, and this determines what a trial/scratch election can and can't prove:

| Gate | Enforced on trial elections? | Notes |
|---|---|---|
| Vote hash computed at close, re-verified at declaration | **Yes — unconditional** | SHA-256 over Votes rows scoped per-election. Mismatch blocks declaration and alerts all active Scrutineers by email. |
| Co-sign restricted to SCRUTINEER role (no self-certification) | **Yes — unconditional** | RO/TEM cannot co-sign their own tally. |
| Co-sign required *before* declaration is allowed | **No — trial-exempt** | The action works on a trial election; the gate blocking declaration until everyone's signed does not. |
| Mandatory posts (President/VP/GS/Treasurer) must be filled before activation | **Yes — unconditional** | GB-resolution override path exists for genuine vacancy. |
| Schedule date floors (V-38/V-24/V-9/V-7/72-hour) | **No — trial-exempt, and structurally unreachable** | Only enforced when `scheduleMode==='live'`; the UI doesn't even offer `live` as an option once an election is marked Trial. |
| EC-lockout required before nominations open | **No — trial-exempt** | |
| Draft voter roll required before nominations open | **No — trial-exempt** | |
| PreSec Security Checklist required before activation | **No — trial-exempt, by design** | Real security verification shouldn't gate throwaway test runs. |

**Practical consequence:** the full end-to-end scratch-election script (Trial=Yes, Internal Test=Yes) can prove hash verification, co-sign self-cert blocking, and mandatory posts. It **cannot** prove that the schedule floors, EC-lockout, draft-roll-required, PreSec-checklist, or co-sign-before-declaration gates actually block anything — that needs a second, minimal, throwaway **non-trial** election that stays in `draft` status the whole time (draft elections are already excluded from every voter-facing surface regardless of trial/internal-test flags) and gets deleted afterward.

### C.3 Known Code/Spec Mismatches Found This Week

- **Fixed:** Internal Test toggle missing from UI (C.1.5); stale `initSystemBSheets` headers (C.1.6).
- **Unresolved, pending your confirmation of source file:** `GDRIVE_ROOT_FOLDER_ID` and `MASTER_SHEET_ID` found hardcoded (not via Script Properties) in a snippet from the GitHub repo — contradicts the documented Session 27 decision that `MASTER_SHEET_ID` should be a Script Property, and contradicts the pattern the rest of Code.js actually follows (`SYSTEM_B_SHEET_ID`, `BREVO_API_KEY`, etc. are all Script Properties, never hardcoded). **Action: check Sheet/folder sharing permissions immediately** (independent of any code fix) given the repo has already been shared with an external audit firm; then migrate to Script Properties.
- **Confirmed stale, not live:** `security_hardening_additions.md` in project knowledge contains an older, weaker `recordTallyCoSign` (no SCRUTINEER-only restriction) — superseded by the live version, but worth not treating that file as reference for anything going forward. Archived, see Part F.
- **Confirmed dead code, not a bug:** `BypassFloors` column on Elections — written once at creation (always `false`), never read anywhere. The trial/floor-bypass behaviour that actually ships is via `scheduleMode`, not this column.
- **Confirmed built (contradicts old docs marking it "not built"):** mandatory-posts hard block, draw-of-lots randomiser with two-slot Scrutineer witness confirmation, and `generateElectionRecordPDF` (SOP §8.6) are all live in Code.js despite older status documents saying otherwise. Trust Code.js.
- **Still genuinely not built:** `ECOfficerBoardDatabase` and `ROPanelLog` tabs exist as headers only, no functionality behind them.

### C.4 Data Layer Notes

- **Voters sheet is global, not per-election** — no ElectionID column. `certifyVoterRoll` clears and overwrites it entirely. Certifying a scratch/test election's draft roll **will destroy** whatever real certified roll is currently there. `createPreVoteBackup` (exports Voters/Elections/Candidates/ScrutinyLog/AdminLog to CSV in Drive) is the safety net — run it before any roll-certification testing.
- **Votes hash, by contrast, is correctly scoped per-election** — `computeVotesHash` filters to the specific electionId.
- **VoterRollDraft vs. certified Voters** — most nomination/voting testing only needs the draft roll (`getVoterRollRows()` falls back to it automatically pre-certification); you don't need to certify at all unless specifically testing the verification-badge fix or the certification-triggered EC-lockout gate.

### C.5 Audit Sandbox (for the external technical audit firm)

A setup guide was produced (`SSKZM_OBA_EMS_Audit_Sandbox_Setup_Guide.docx`, sent to the audit firm) describing how they stand up a fully isolated instance: their own blank Sheet, their own Apps Script project, `SYSTEM_B_SHEET_ID` pointed at their Sheet, `BREVO_API_KEY` deliberately left unset (email falls through to `MailApp`, sent as their own account — no API key needed), `initSystemBSheets()` run once to bootstrap structure, and one manual first-admin-row seed in their Admins tab (chicken-and-egg: `addAdmin()` requires an existing session to call). No SSKZM OBA credential, key, spreadsheet, or member data is involved. Confirm this firm is under appropriate NDA/engagement terms if not already locked down.

---

## PART D — PENDING ACTIONS

### D.1 Pure Coding

- **TEM Auth checklist drift** — `_temActionCheckboxes` in AdminJS.html is a hand-maintained duplicate of `TEM_AUTHORISABLE_ACTIONS` in Code.js; these drift (e.g. `recordDrawOfLots` was missing from the UI after being added server-side). Refactor so the UI list derives from one shared source.
- **Results-page link missing from voter portal** — VoterJS.html's My Receipts view has no link to the public Results page once an election is declared; the token-paste verification form is only reachable via the Landing Page.
- **PreSec checklist election selector** — `_openPresecChecklist` has no explicit dropdown, silently defaults to the last election opened elsewhere. The amber "Showing checklist for: X" banner is a safety fix but selection is still implicit.
- **`MASTER_SHEET_ID` / `GDRIVE_ROOT_FOLDER_ID`** — move to Script Properties once source file is confirmed (C.3).
- **Run the full E2E scratch-election test script** — drafted, not yet executed. Covers the full lifecycle plus in-context verification of this week's fixes.
- **Build and run the throwaway non-trial gate-verification election** — separate from the above, proves the five trial-exempt gates in C.2 actually block.

### D.2 Administrative / Housekeeping

- **Confirm Sheet/folder sharing permissions** on `MASTER_SHEET_ID` and `GDRIVE_ROOT_FOLDER_ID` — urgent, independent of the code fix, given the repo is already with the audit firm.
- **Update the SOP's EC-amendment clause** from "for information" to "for ratification" at the next AGM, per the Resolution 2 floor amendment (B.1) — and confirm/locate the final adopted SOP/Bylaw text to supersede the sub-committee drafts (B.2).
- **Document what went wrong** in the SGM's trial online resolution-voting (B.1) before treating Phase D as a coding priority.
- **Independent technical audit** — ToR drafted, sandbox setup guide sent (C.5); sequential audit timeline doesn't fit the 40–47 day SGM-to-voting-open window, so parallelise with the bug-fix pass, targeting completion before V-47.
- **Live election RO selection** via seniority panel + objection window, per bylaw.
- **Back up Voters sheet** (`createPreVoteBackup`) before any further roll-certification testing (C.4).

---

## PART E — SESSION LOG ADDENDUM (Session 44 → 22 July 2026)

*Kept brief — full detail lives in `SESSION_HANDOVER_2026-07-14.md` (archived alongside this note, not superseded, just no longer the first thing to read) and in this week's chat transcript.*

- **Sessions ~44–50 (through 11 July):** Tier 2 member-wide trial election run and declared (3,112-member certified roll). Trust architecture completed: tally co-sign restricted to Scrutineer role, five TEM functions gated behind AuthID, `ConsumedActions` single-use enforcement added to TEMAuth. PreSec checklist confirm-step, resend-candidate-publication-emails, two missing mass emails, toast-positioning fix, in-system draw-of-lots feature, native-confirm→modal replacements. PreSec RO Reference Guide produced (docx + in-app modal).
- **14 July handover:** identified three fixes written but not deployed (internal-test leak, bio validation, verification-category bug).
- **This week (15–22 July):** the three gaps deployed; Internal Test toggle gap found and fixed; full E2E test script drafted; voter roll / schedule / gate-enforcement planning; hash/co-sign verification confirmed against live code; `.env`/audit-sandbox questions resolved; `initSystemBSheets` staleness found and fixed; `GDRIVE_ROOT_FOLDER_ID`/`MASTER_SHEET_ID` hardcoding flagged; SGM held 18 July, both resolutions passed (Resolution 2 amended on the floor); this bridge note produced ahead of migrating the coding workflow to VS Code + Claude Code.

---

## PART F — ARCHIVE

Move these to `/docs/archive` — historical only, not needed for forward work, one superseded on a point that could actively mislead if used as reference:

| File | Why archived |
|---|---|
| `SSKZM_OBA_ELECTION_APP_development_guide.docx` | April sprint plan, fully overtaken |
| `security_hardening_additions.md` | **Caution if reopened** — contains an older, weaker `recordTallyCoSign` and the instruction that led to the `GDRIVE_ROOT_FOLDER_ID` hardcoding flagged in C.3 |
| `SSKZM_OBA_EMS_Requirements_Locked.md` | Superseded by Step 3/4/5 |
| `SSKZM_OBA_EMS_SESSION17_HANDOVER.md` | Folded into Step 3/4/5 and Session 18 Handover |
| `SSKZM_OBA_EMS_SESSION20_HANDOVER.md` | Same date cluster as Step 3/4/5, folded in |
| `SSKZM_OBA_EMS_SESSION21_HANDOVER.md` | Code-writing kickoff note, historical |
| `SSKZM_OBA_SESSION15_DECISIONS_LOG.md` | SOP/Bylaw decision rationale — only needed if back editing SOP/Bylaw text |
| `SSKZM_OBA_EMS_TechSpec_13_05_2026.docx` | Pre-dates most of the trust-architecture work; note this file is plain text despite its `.docx` extension |
| `SSKZM_OBA_EMS_LandingPage_Draft_v3.html` | Old draft — **do not confuse with the live `LandingPage.html`** |
| `TUTORIAL_BUILD_INSTRUCTIONS.md` | Still deferred; bring back out when Tutorial page is next up |
| `SSKZM_OBA_MASTER_BRIEF_UPDATED1.md` | Superseded by this note — Parts A.1/A.2 above are its still-valid content, carried forward verbatim |
| `SSKZM_OBA_EMS_CODEWRITING_STATUS_UPDATED.md` | Superseded by this note |
| `SESSION_HANDOVER_2026-07-14.md` | Superseded by this note's Part E, but keep for full session-44-ish detail if needed |
