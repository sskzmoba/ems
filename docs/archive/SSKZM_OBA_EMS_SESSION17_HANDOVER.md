# SSKZM OBA EMS — HANDOVER NOTE FOR FRESH CHAT
## Session 17 — 26 May 2026

---

## 1. CONTEXT AND STATE OF PLAY

This project is the Election Management System (EMS) for SSKZM OBA (Sainik School Kazhakootam Old Boys Association). The system enables secure, auditable online e-elections for a geographically dispersed Life Membership of approximately 3,500+ voters.

The existing system is a working Google Apps Script / Google Sheets web application. It has been demonstrated to the EC and a Drafting Sub-Committee has completed a full SOP and Bylaw Amendment which have been submitted to the EC for vetting on 27 May 2026.

**The decision taken in Session 17:** Rather than patching the existing system to match the finalised SOP, execute a structured refactor — a new Google Apps Script project built to the SOP as specification, drawing proven functions from the existing codebase as a parts library.

The existing system remains live and untouched for the EC vetting demo. The refactored system is built in parallel as a separate deployment.

---

## 2. KEY PROJECT FILES IN PROJECT KNOWLEDGE

The following files are in project knowledge and MUST be read before any work:

- **SSKZM_OBA_MASTER_BRIEF_UPDATED.md** — single source of truth for system status, architecture, credentials, design decisions
- **SSKZM_OBA_EMS_Requirements_Locked.md** — the locked consolidated requirements list for the structured refactor (68 requirements across 11 modules) — THIS IS THE PRIMARY SPECIFICATION FOR THE REFACTOR
- **SSKZM_OBA_SESSION15_DECISIONS_LOG.md** — all decisions from Session 15
- **1_Code_gs.md** — existing Code.gs (backend functions — parts library for refactor)
- **VoteJS_html.md** — existing voter-facing UI (parts library)
- **AdminJS_html.md** — existing admin UI (parts library)
- **SSKZM_OBA_EMS_TechSpec_13_05_2026.docx** — existing tech spec (reference)
- **SSKZMOBA_ElectionsSOP_SubcommitteDraft_20052026.docx** — the submitted SOP (the constitutional specification)
- **SSKZMOBA_ElectionsBylawClause_SubcommitteeDraft_20052026.docx** — the submitted bylaw amendment

---

## 3. WHAT WAS ACCOMPLISHED IN SESSION 17

### 3.1 SOP and Bylaw Documents Finalised

Two clean final documents produced incorporating all sub-committee amendments:
- `SSKZM_OBA_SOP_Final.docx` — full 10-chapter SOP with appendices A–H
- `SSKZM_OBA_Bylaw_Amendment_Final.docx` — all 14 clauses (a)–(n)

Sub-committee amendments highlighted in blue. Submitted to EC via WhatsApp. EC vetting scheduled 27 May 2026. Public review to follow (approximately 10 days).

### 3.2 Key SOP Decisions Incorporated in Session 17

- **Section 1.5** — "increments of" deleted from extension provision
- **Section 4.1B (new)** — VP and Joint Secretary as multi-seat posts (2 seats each); single ballot item; top 2 elected; NOTA counts against all; tie by draw of lots; designation by inter-se seniority per bylaw
- **Section 4.3A (new)** — confirmed nominations visible to all voters from Phase 1 opening with disclaimer
- **Section 7.1** — "preferably be by secret ballot" → "be by secret ballot" (physical voting)
- **Section 7.2A (new)** — multi-seat post counting rule
- **Section 8.7** — deleted entirely
- **Appendix F** — vote counts for all candidates added
- **Appendix F2 (new)** — Winners Summary
- **Bylaw Clause (i)** — "Vice President (Senior)" → "Vice President (at least one)"
- **Bylaw Clause (j)** — "preferably be by secret ballot" → "be by secret ballot"
- **Appendix D** (Special GBM Instruments) — deleted; all appendices renumbered A–H

### 3.3 Three SOP Text Amendments Still Pending

These arose from design decisions made after SOP submission. To be done as targeted amendments before public review:

| # | Section | Change required |
|---|---------|----------------|
| S1 | Section 4.7 (Phase 2) | Reword to reflect unconditional opening for all posts — remove conditional language |
| S2 | Chapter 5 / Section 1.2 | Reword to reflect scrutiny running in parallel with open nomination window — gated by nomination status not election status |
| S3 | Section 2.8 / dynamic gap | Reword minimum gap provision: 72-hour hard floor; reduces if no appeals after 48 hours; extends if appeal filed until decided |

### 3.4 Section 2.5 Amendment Pending

Agreed wording for addition to Section 2.5 (Election Period — Authority and Continuity) — to be inserted into the caretaker sentence:

*"...until the incoming Executive Committee takes charge, which shall be at the earliest practicable time at a meeting convened by the outgoing Executive Committee for the purpose."*

Not yet applied to the document — noted for next SOP revision pass.

### 3.5 Consolidated Requirements List Locked

`SSKZM_OBA_EMS_Requirements_Locked.md` produced and added to project files. 68 requirements across 11 modules. This is the primary specification for the refactor. Do not start any design or code without reading this file first.

### 3.6 Refactor Decision and Approach

**Structured refactor** decided — not a blank-sheet rewrite, not a patch. Defined as:

- Proven atomic functions kept unchanged — OTP, session, vote casting, AdminLog, email, GDrive upload, tally, receipt token
- Architectural elements rebuilt cleanly — post structure, status flow, ballot model, access tiers
- New modules built fresh to SOP specification — nominations board, complaints/appeals tabs, Scrutineer appointment flow, EC officer tier, handover UIs, tutorial
- SOP is the functional specification; existing code is the parts library

### 3.7 EC Officer Access Model Decided

Option A chosen — EC officer login within the same EMS deployment, tightly scoped, time-limited, auto-disabled at handover.

**Full access and handover flow designed (for tutorial inclusion):**

**Pre-election:**
- GS, President, VP log into EMS via roll number + OTP
- System shows EC Officer panel only — no voting data, no RO functions
- GS functions: publish RO panel on landing page, deactivate voter verification app link, upload draft voter roll to VoterRollDraft tab, record TEM communication, complete EC-to-RO handover checklist (Appendix D.1)
- President/VP: read-only view of panel and handover checklist

**Handover moment (physical/video session, Scrutineers present):**
1. GS completes handover checklist in EC Officer panel; clicks "Submit Handover to RO"; AdminLog entry created; RO notified by email
2. GS logs into Google account elections.sskzmoba@gmail.com and changes password to new one in presence of Scrutineers; new password handed to RO; GS does not retain it; recorded in election record with date, time, Scrutineer names
3. RO logs into EMS using roll number + OTP; sees handover acknowledgement screen; acknowledges each checklist item; clicks "Complete Handover and Lock EC Access"
4. System disables all EC_OFFICER accounts in Admins tab; logged to AdminLog; any subsequent EC officer login attempt rejected
5. RO activates Scrutineer accounts (acceptance links sent); creates Deputy RO sealed credentials; creates/confirms TEM account; accredits Observers — all logged
6. Scrutineers witness EC lockout, sheet protections, and version verification in live session; confirm through Scrutineer panel; recorded in AdminLog

**Two-layer lockout:**
- Layer 1 (application): EC_OFFICER accounts set to DISABLED — enforced on every server-side function call
- Layer 2 (credential): Google account password changed — EC has no account access regardless of application state

---

## 4. WHAT THE FRESH CHAT MUST DO

**The task for the fresh chat is: design the refactored EMS architecture.**

Work top-down in this sequence:

### Step 1 — Data Architecture
Design all sheet tabs with full column specifications. New tabs required beyond existing 12:
- `VoterRollDraft` — pre-certification voter roll during RO objection phase
- `Complaints` — Code of Conduct complaints log
- `Appeals` — Nomination rejection appeals log
- `Observations` — Scrutineer/Observer observations to RO and RO replies
- `Messages` — EC officer handover communications
- `ECOfficerBoardDatabase` — past 15 years office bearers for eligibility auto-check
- `ElectionSchedule` — key dates per election with V-day reference

Existing tabs to be retained (with modifications noted):
- `Voters` — certified voter roll (locked after certification)
- `Elections` — add new columns for schedule dates, physical/electronic mode, multi-seat post config
- `Candidates` — add seat count field; VP/JtSec handled as grouped posts
- `Votes` — unchanged (core security — do not touch structure)
- `VotedLog` — unchanged (core security — do not touch structure)
- `Admins` — add EC_OFFICER tier, DEPUTY_RO tier, TEM tier; add DISABLED status field
- `OTPs` — unchanged
- `Nominations` — add one-post-per-person check fields; Phase 2 unconditional flag
- `ScrutinyLog` — unchanged
- `NomQueries` — unchanged
- `AdminLog` — unchanged (append-only — never modify)
- `DocStore` — unchanged

### Step 2 — Access Tier Design
Define all access tiers and their permissions:
- EC_OFFICER (GS, President, VP) — pre-handover only, auto-disabled at handover
- RO_ADMIN — full system control
- DEPUTY_RO — same as RO_ADMIN, activation-gated
- TEM — same as RO_ADMIN, AuthorisationID-gated for all actions
- SCRUTINEER — AdminLog read-only always; tally session; observation UI; checklist confirmation
- OBSERVER — participation dashboard; observation UI (read-only tally after declaration)
- VOTER — ballot; nominations board; my nominations; complaints filing
- PUBLIC — landing page only (no login required)

### Step 3 — Backend Function Map
Map every function in Code.gs by module — name, inputs, outputs, access tier required, AdminLog action type logged. No code yet — design only.

### Step 4 — UI Page Map
Map every screen in every HTML file — what it shows, what backend functions it calls, which access tier sees it.

### Step 5 — doGet() Routing Design
All URL parameters and their routing.

---

## 5. ARCHITECTURAL PRINCIPLES (NON-NEGOTIABLE)

- Every RO/TEM/EC action through UI — no direct sheet interaction for any operational task
- Every sheet write auto-logs to AdminLog — action type, actor, timestamp, old value, new value
- Votes/VotedLog separation is inviolable — no function may correlate the two sheets
- EC_OFFICER tier is pre-handover only — auto-disabled at handover, enforced server-side on every function call
- All status transitions are deliberate RO actions — nothing transitions automatically
- AdminLog is append-only — no function edits or deletes AdminLog rows under any circumstance
- Sheet protections applied before voting window opens — witnessed by Scrutineers
- Multi-seat posts (VP, Joint Secretary) handled by seat count field in post configuration — not hardcoded
- Scrutiny runs in parallel with open nomination window — gated by nomination status, not election status
- 72-hour hard floor between candidates_published and active — enforced by system, no RO override

---

## 6. FUNCTIONS TO CARRY FORWARD UNCHANGED FROM EXISTING CODE

These are proven and tested — lift directly, do not rewrite:

- `generateOTP()`, `hashOTP()`, `verifyOTP()` — OTP generation and verification
- `sendOTP()`, `sendAdminOTP()` — OTP delivery
- `createSession()`, `getSession()`, `deleteSession()` — session management
- `appendAdminLog()` — AdminLog append (core function — called by everything)
- `sendEmailViaSendGrid()` with MailApp fallback — email delivery
- `generateId()` — UUID generation
- `castVote()` — vote recording (Votes + VotedLog — do not touch)
- `generateTally()` — vote tally (extend for multi-seat)
- `verifyToken()` — receipt token verification
- `applySheetProtections()` — sheet protection
- `purgeTrialData()` — trial data reset
- `uploadToGDrive()` / GDrive folder management functions

---

## 7. KEY IDENTIFIERS AND CONSTANTS

- GDrive root folder ID: `1qDHOP9wJqQlc8j4wDBsJwCaOrpIVpv14`
- Demo RO Admin ID: `4E65B38D14984498`
- Elections email: `elections.sskzmoba@gmail.com`
- RO contact email placeholder: `ro@sskzmoba.org`
- OTP expiry: 10 minutes
- Session expiry: 8 hours
- Brevo integration built; MailApp as fallback

---

## 8. OPEN ITEMS PENDING DECISION (do not resolve without Shelley)

- O1: Past 15 years office bearers database — data partially available, being updated; gaps treated as neutral for auto-check
- O2: Voter verification app (separate EC application) — design separate from EMS refactor
- O3: Three SOP text amendments S1, S2, S3 — to be done as separate targeted pass after vetting feedback

---

## 9. WHAT IS NOT IN SCOPE FOR THE REFACTOR

- Voter roll verification app (separate EC application outside EMS)
- Email verification tool (separate EC function outside EMS)
- Resolution voting at AGM (separate system, managed by office bearers)
- GitHub publication (to be done before first live election — not part of refactor build)

---

## 10. IMMEDIATE NEXT STEPS

1. EC vetting on 27 May — Shelley to note any feedback
2. After vetting, update Requirements document with any new decisions
3. Fresh chat to begin architecture design starting with Step 1 (Data Architecture)
4. Three SOP text amendments (S1, S2, S3) to be done as separate targeted pass before public review goes out

---

*End of Session 17 Handover Note — 26 May 2026*
