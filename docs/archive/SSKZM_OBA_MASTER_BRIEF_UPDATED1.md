Here is the complete updated Master Brief:

---

# SSKZM OBA ELECTION SYSTEM — MASTER BRIEF
*Single source of truth for all new chats. Read this first. Last updated: 11 June 2026 — Session 27. Two-system architecture in effect. System B is the active system. See Section 3 before any development work.*

---

## 🤖 CLAUDE USAGE EFFICIENCY — READ FIRST FOR EVERY NEW CHAT

**Context:** This project is developed using Claude (personal subscription). Usage limits are a real constraint — the user runs multiple projects. Every chat session must be efficient.

### Rules for Claude in every session
- **Start every chat** by searching project knowledge and reading this Master Brief first — do not ask questions that are answered here
- **Establish system context immediately** — confirm whether the session is working on System A (frozen fallback — do not modify) or System B (active development) before doing anything
- **Architecture documents take precedence** — for any question about schemas, functions, roles, or design decisions from Session 17 onward, the Step 3 documents (`SSKZM_OBA_EMS_Step3_BackendFunctionMap.md` and `SSKZM_OBA_EMS_Step3_Amendments.md`) are authoritative. Where this Master Brief conflicts with those documents, the Step 3 documents win.
- **Be surgical** — never rewrite working code sections to fix unrelated issues
- **One task per exchange** — confirm understanding before generating large code blocks
- **Flag early** when a session is getting long — suggest a clean stopping point and what to note before starting a new chat
- **Never pad responses** — no unnecessary explanation, no restating what was just said
- **When approaching usage limits** — warn the user with: *"⚠️ Usage note: suggest wrapping up this task and starting a fresh chat for the next one. Before closing, note: [what to carry forward]."*
- **Prefer targeted edits** over full file pastes — show only the changed function/block with clear location markers
- **If a task needs large code** — confirm the plan in one exchange, generate code in the next, keep them separate
- **Never reference System A code or schema when working on System B** — they are separate codebases with different schemas

### How to start a new chat efficiently
Paste this at the start of any new chat:

> *"This is the SSKZM OBA Election Management System project. Read SSKZM_OBA_MASTER_BRIEF_UPDATED1.md first, then SSKZM_OBA_EMS_CODEWRITING_STATUS_UPDATED.md. All work targets System B only. Confirm today's task from Section 6 of the codewriting status."*

### Document authority hierarchy (highest to lowest)
1. This Master Brief (Section 14 session log) — most recent decisions and locked changes
2. Codewriting Status (Section 6) — current build state and next task
3. Step 3 Amendments sheet — architecture decisions from Session 19
4. Step 3 Backend Function Map — locked function architecture from Session 19
5. Session 18 Handover Note — locked data architecture and access tier design
6. Session 15 Decisions Log — SOP and bylaw decisions

---

## SECTION 1 — SYSTEM IDENTITY

**Project:** SSKZM Old Boys Association — Election Management System
**Platform:** Google Apps Script (Web App) + Google Sheets

### Account Architecture

| Account | Purpose | Holds |
|---------|---------|-------|
| Workspace account (OBA) | Permanent institutional documents + VVA | SOP, Tech Spec, Nomination Form PDF, all permanent OBA documents. **Also hosts VVA GAS project and master membership sheet.** |
| `elections.sskzmoba@gmail.com` | Election operations | Google Sheet, Apps Script, Web App, candidate document uploads. **Handed to RO at appointment.** |
| `sskzmobakazak@gmail.com` | Main OBA institutional email | Day-to-day comms. Also recovery email for elections account. |
| `oldboysassociationsskzm@gmail.com` | Spare — freed up | Nothing. GDrive folder transferred to elections account. |

### elections.sskzmoba@gmail.com — Account Recovery Details
| Field | Value |
|-------|-------|
| Recovery Phone | `+91 9188942505` (SSKZM OBA official phone) |
| Recovery Email | `sskzmobakazak@gmail.com` (OBA official) |
| Password storage | Sealed envelope — President + General Secretary |

### Documents in GDrive (elections.sskzmoba@gmail.com)
- `Doc1_EMS_TechSpec_Full_SecondEdition_April2026.docx` ✅
- `Draft SOP_Elections.pdf` ✅
- `SSKZM_OBA_Nomination_Form_2026.pdf` ✅

---

## SECTION 2 — CURRENT SYSTEM STATUS

### Phase A — Voting System ✅ COMPLETE (System B)
- Voter login with Roll No + OTP to registered email
- Eligibility-filtered ballot (bylaw-compliant post restrictions)
- Secret ballot — Votes and VotedLog structurally separated, no correlation possible
- Voter receipt token after voting
- Results declaration by RO with visibility controls
- RO Admin panel — all tabs working

### Phase B — Nominations & Scrutiny ✅ COMPLETE (System B)
- Online nominations — candidate self-nominates (Phase 1) with proposer/seconder confirmation via email link
- Nomination form in Voter Panel — post selector, proposer/seconder lookup, bio, declaration, submit
- My Nominations dashboard — status tracking, prop/sec confirmed indicators, withdraw option
- Nominations board — read-only, grouped by post, voter-facing from nominations_open
- Complaints module — file, view, update status, RO notes, resolution
- Appeals module — file, view, record decision, upheld reinstates nomination (D-V6 compliant)
- Scrutiny tab — 6-item checklist, auto-assess, accept/reject gate, undo
- Candidates tab — grouped by post, contested/uncontested/vacant, delete with lock
- All election status transitions wired — draft through declared, with correct gates

### Phase C — Public Status Page 🟡 PARTIAL (System B)
Landing page stub working. Full rebuild needed — election status widget, login button, How It Works link. VVA live widget integration to be added during landing page rebuild.

### Phase D — Resolution Voting 🔴 NOT STARTED
AGM-day resolution voting. Non-anonymous. Attendance-gated. Managed by office bearers, not RO.

### Phase E — Pilot Election 🔴 NOT STARTED
Full dry run before first live election. **PRE-LIVE MANDATORY.** Runs on System B.

### Phase F — Landing Page 🔴 NEEDS REBUILD (System B)
Current LandingPage.html is a minimal stub (two buttons only). Full rebuild required before trial — election status widget, Login to Vote button, How It Works / Tutorial link, VVA live widget, mobile-first design.

### Phase G — Voter Verification App ✅ COMPLETE
Standalone GAS web app deployed from OBA main Workspace account. Fully built and tested — 11 June 2026.
- Public portal: live summary widget, roll status lookup, full member roll, email update flow
- GS management panel: OTP login, dashboard, send emails, member roll, add member, update log, duplicate audit, CSV export, campaign controls
- Brevo webhook for automatic bounce capture
- CSV export in exact EMS VoterRollDraft format
- Connected to EMS landing page via public JSON endpoint (`?action=summary`)
- Master sheet VV columns: BE(LifeMemberDate), BF(VV_Status), BG(VV_Token), BH(VV_SentDate), BI(VV_ResponseDate), BJ(VV_UpdateToken), BK(VV_UpdateEmail), BL(VV_UpdateRequested), BM(VV_Notes)
- Script Properties required: `BREVO_API_KEY`, `GS_ADMIN_EMAIL`, `MASTER_SHEET_ID`, `VVA_CAMPAIGN_OPEN`, `VVA_ROLL_FROZEN`, `VVA_CUTOFF_DATE` (set when EC announces)

---

## SECTION 3 — TECHNICAL ARCHITECTURE

### ⚠️ TWO-SYSTEM ARCHITECTURE — READ BEFORE ANY DEVELOPMENT WORK

This project operates two distinct systems. **Every development session must establish at the outset which system it is working on.** Never apply changes intended for System B to System A or vice versa.

| | System A | System B |
|---|---|---|
| **Status** | Frozen — fallback only | Active development |
| **Purpose** | Emergency backup if System B has a pre-election crisis | All trials, all live elections |
| **Modifications** | None. Ever. | All Step 3/4/5 work targets this |
| **Apps Script** | Existing project | New project — 1-cZ5jcJNPnFIRrOD6AiWXPyqYOEhHSBUHHF6_iOFv3W-CdwC0k4MyCnH |
| **Google Sheet** | `18g7VpbA4nrSVGew9WRQ3rTs8PLJsmxubv4ztJ4KJG4Q` | `1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E` |
| **Web App URL** | `https://script.google.com/macros/s/AKfycbw12PQMkv-BGhWt0sl8N847uNbVxDMgkkG8CNSIIaMWN_NULV-ZMaXKT6qfen_RPnK0/exec` | `https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec` |
| **Tab count** | 12 | 22 |
| **GitHub** | `sskzmoba/ems-legacy` (archived) | `sskzmoba/ems` |

---

### 3A — System A (Frozen Fallback)

*Do not reference System A schema in any new development. Listed here for emergency reference only.*

**Sheet list (12 tabs):** Voters, Elections, Candidates, Votes, VotedLog, Admins, OTPs, Nominations, ScrutinyLog, NomQueries, AdminLog, DocStore.

**Demo credentials (System A):**
- Voter (clean ballot): Roll `DEMO01`, email → personal email
- Voter (voted): Roll `SSK006`, batch 1990
- RO Admin ID: `4E65B38D14984498`

**GDrive Root Folder ID (System A):** `1qDHOP9wJqQlc8j4wDBsJwCaOrpIVpv14`

---

### 3B — System B (Active — All Development Here)

**Sheet list (22 tabs):**

| # | Tab | Status | Cols |
|---|---|---|---|
| 1 | Votes | FROZEN | 5 |
| 2 | VotedLog | FROZEN | 4 |
| 3 | AdminLog | FROZEN (append-only) | 7 |
| 4 | OTPs | FROZEN | 4 |
| 5 | Voters | Modified (+2) | 11 |
| 6 | Elections | Modified (+9) | 27 |
| 7 | Candidates | Modified (+4) | 13 |
| 8 | Admins | Modified (+6) | 13 |
| 9 | Nominations | Modified (+3) | 32 |
| 10 | ScrutinyLog | Unchanged | 18 |
| 11 | NomQueries | Unchanged | 12 |
| 12 | DocStore | Modified (+1) | 10 |
| 13 | VoterRollDraft | NEW | 13 |
| 14 | Complaints | NEW | 14 |
| 15 | Appeals | NEW | 16 |
| 16 | Observations | NEW | 11 |
| 17 | Messages | NEW | 9 |
| 18 | ECOfficerBoardDatabase | NEW | 9 |
| 19 | ElectionSchedule | NEW | 21 |
| 20 | TEMAuth | NEW | 12 |
| 21 | ROPanelLog | NEW | 15 |
| 22 | LandingPageContent | NEW | 7 |

**SHEETS object (System B):**
```javascript
var SHEETS = {
  VOTERS: 'Voters', ELECTIONS: 'Elections', CANDIDATES: 'Candidates',
  VOTES: 'Votes', VOTED_LOG: 'VotedLog', ADMINS: 'Admins', OTPS: 'OTPs',
  NOMINATIONS: 'Nominations', SCRUTINY_LOG: 'ScrutinyLog',
  NOM_QUERIES: 'NomQueries', ADMIN_LOG: 'AdminLog', DOC_STORE: 'DocStore',
  VOTER_ROLL_DRAFT: 'VoterRollDraft', COMPLAINTS: 'Complaints',
  APPEALS: 'Appeals', OBSERVATIONS: 'Observations', MESSAGES: 'Messages',
  EC_BOARD_DB: 'ECOfficerBoardDatabase', ELECTION_SCHED: 'ElectionSchedule',
  TEM_AUTH: 'TEMAuth', RO_PANEL_LOG: 'ROPanelLog', LANDING_CONTENT: 'LandingPageContent'
};
```

**COL constants — new tab objects (populated in Code.js):**
- `COL_CMP` — Complaints (14 cols) ✅ populated Session 26
- `COL_APL` — Appeals (16 cols) ✅ populated Session 26
- `COL_VRD` — VoterRollDraft (13 cols) ✅ populated
- `COL_MSG` — Messages (9 cols) ✅ populated
- `COL_OBS`, `COL_ECDB`, `COL_SCHED`, `COL_TEMA`, `COL_RPL`, `COL_LPC` — empty `{}` pending build

**Election status flow (System B):**
`draft → nominations_open → nominations_open_phase2 → scrutiny → candidates_published → active → paused → closed → declared`

Physical mode elections stop at `candidates_published`.

**Key constants (System B):**
```javascript
var SYSTEM_B_SHEET_ID = '1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E';
var DEPLOY_URL = 'https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec';
var RO_CONTACT_EMAIL = 'ro@sskzmoba.org';
var ELECTIONS_EMAIL = 'elections.sskzmoba@gmail.com';
var OTP_EXPIRY_MINUTES = 10;
var SESSION_EXPIRY_HOURS = 8;
```

**Mandatory posts:** President, Vice President (group check — at least one VP seat filled), General Secretary, Treasurer.

**EC Posts (21):** President, VP1, VP2, General Secretary, Joint Secretary 1, Joint Secretary 2, Treasurer, Organising Secretary, Batch Reps 1965-70 through 2026-30 (13 batch groups).

---

## SECTION 4 — TRUST ARCHITECTURE & SECURITY PRINCIPLES
*These principles must never be diluted in any future development.*

### 4.1 Structural Vote Anonymity
The Votes sheet contains **zero voter identity information** — only VoteID, ElectionID, PostName, CandidateID, CastAt. The VotedLog contains **zero vote content** — only Roll No, ElectionID, PostName, Timestamp. The two sheets can never be correlated. This is enforced by architecture, not policy.

### 4.2 RO Independence
From date of RO formal appointment, EC has **no access** to the election app. EC_OFFICER accounts are auto-disabled at handover — enforced server-side on every function call.

### 4.3 Open Source Code
Complete codebase to be published on public GitHub repository before first live election. GitHub org: `sskzmoba`, repo: `sskzmoba/ems` (currently private — make public before first live election).

### 4.4 Independent Code Audit
Before first election, codebase reviewed by technically competent person with no connection to Association and no connection to any candidate. Written audit report published to all members before voting window opens.

### 4.5 Voter Receipt Token
On voting, voter receives a unique anonymous token — random string with no mathematical relationship to voter identity or vote content.

### 4.6 Scrutineer Access
Full AdminLog read-only from beginning of election period. Scrutiny tab read-only (finalised nominations only). Live tally. VotedLog. Voter list (Roll, Name, Batch only). Tally co-sign.

### 4.7 Live Observer Dashboard
Read-only live participation dashboard — aggregate turnout % per post only.

### 4.8 GitHub / Version Control
Repo: `sskzmoba/ems` — currently private. Make public before first live election.

### 4.9 Digital Authentication
All formal acts performed through the system (primary) or authenticated email (secondary).

### 4.10 Sheet-Level Protection
`applySheetProtections(token)` implemented. UI trigger built in Settings tab. ✅

### 4.11 Clean EC/EMS Boundary
EC_OFFICER tier: pre-handover only — voter roll draft upload, landing page content, handover messages. Auto-disabled at handover.

### 4.12 Trust Architecture Decisions (locked)
- **D-V1:** Votes/VotedLog separation — inviolable. No function may correlate them. Ever.
- **D-V2:** V-Day = AGM Day. Electronic elections: voting closes V-9, results declared V-7.
- **D-V3:** 72-hour floor from candidates_published to active — absolute. Cannot be shortened.
- **D-V4:** AdminLog append-only. No function shall edit or delete AdminLog rows. Ever.
- **D-V5:** EC_OFFICER accounts permanently disabled at handover. Two-layer lockout.
- **D-V6:** RO reversal locked after candidates_published. Only exception: upheld appeal — targeted unlock for that specific nomination only, logged as `appeal_upheld_candidature_reinstated`. ✅ Implemented Session 26.
- **D-V7:** TrialElection=TRUE elections may have BypassFloors=TRUE. Hard-blocked when TrialElection=FALSE.
- **D-V8:** Hybrid election mode reserved but not implemented.
- **D-V9:** Voter roll categorisation: verified | unresponsive | undelivered. All three remain on roll.
- **D-V10:** Deputy RO on Appeals Panel recuses on activation; reinstated on deactivation.

---

## SECTION 5 — NOMINATIONS ARCHITECTURE

### Phase 1 Flow ✅ Built Session 26
Candidate submits form → proposer/seconder confirmation emails → both confirm → nomination complete → scrutiny. Candidate consent is implicit in Phase 1.

### Phase 2 Flow 🔴 Not yet built in System B
Nominator proposes candidate → candidate receives 48-hour consent email → on consent → seconder required → both confirm → scrutiny.

### manual_ro Flow (SOP Section 4.8) 🟡 Partial
RO entry UI exists in Nominations tab. Document upload gate (3 docs required before acceptance) not yet built.

### Nominations Board Visibility ✅ Built Session 25
Visible from `nominations_open`. Shows confirmed/accepted nominations only. Name, post, bio, batch — no roll numbers, no proposer/seconder identity.

### One-Post-Per-Person Rule
- At `submitNomination`: ✅ enforced Session 26
- At `acceptNomination`: 🔴 not yet enforced
- At Phase 2 consent acceptance: 🔴 not yet built

### Withdrawal Rules
- Withdrawal button in My Nominations: ✅ built Session 26
- Deadline lock (D+1 from candidates_published): 🔴 not yet built

---

## SECTION 6 — SOP STATUS

**Current file:** `SSKZMOBA_ElectionsSOP_SubcommitteDraft_20052026.docx` in project files
**Status:** Third Edition — Draft for Sub-Committee Review
**Next version:** Fourth Edition — to be produced incorporating all Session 15 amendments
**Authority:** SSKZM OBA Bylaws Article IV

### Chapters and Status
| Chapter | Title | Status |
|---------|-------|--------|
| Preamble | Authority, Scope, Relationship to Bylaws | 🔴 Amendments pending (Session 15) |
| Ch 1 | Election Calendar | 🔴 Amendments pending (Session 15) |
| Ch 2 | Returning Officer | 🔴 Amendments pending (Session 15) |
| Ch 2A | TEM, Scrutineers, Observers | 🔴 Amendments pending (Session 15) |
| Ch 3 | Voter Roll | 🔴 Amendments pending (Session 15) |
| Ch 4 | Nominations | 🔴 Amendments pending (Session 15) |
| Ch 5 | Scrutiny | 🔴 Amendments pending (Session 15) |
| Ch 6 | Campaign and Code of Conduct | 🔴 Amendments pending (Session 15) |
| Ch 7 | Voting | 🔴 Amendments pending (Session 15) |
| Ch 8 | Results | 🔴 Amendments pending (Session 15) |
| Ch 9 | Remote and Hybrid AGM | 🔴 Amendments pending (Session 15) |
| Ch 10 | Records and Archive | ✅ No changes |
| Appendix A | Model Calendar | 🔴 Amendments pending (Session 15) |
| Appendix B | Nomination Form | ✅ No changes |
| Appendix C | Scrutiny Checklist | 🔴 One new item (Session 15) |
| Appendix D | Proposed Bylaw Amendment | 🔴 Full rewrite (Session 15) |
| Appendix E | Special GBM Instruments | 🔴 Minor amendment (Session 15) |
| Appendix F | RO Handover Checklist | 🔴 Amendments pending (Session 15) |
| Appendix G | Declaration of Impartiality | 🔴 Split into G1 (TEM) and G2 (Scrutineers) |
| Appendix H | Results Declaration Template | ✅ No changes |
| Appendix I | Glossary | 🔴 One amendment (Session 15) |
| Appendix J | Pre-Election Security Checklist | 🔴 D3 rewrite (Session 15) |

### Key SOP Decisions Resolved (Session 15)
- External RO provision — **REMOVED**
- Scrutineers appointed by EC — **CONFIRMED**
- TEM appointment optional, objection window retained if appointed — **CONFIRMED**
- Results declared 10 days before AGM (electronic elections) — **CONFIRMED**
- EC handover at AGM after formal announcement — **CONFIRMED**
- Mandatory posts (President, Vice President, General Secretary, Treasurer) — election halts if unfilled, no RO override — **CONFIRMED**. Vice President is a group check.
- Voting mode decoupled from AGM mode — **CONFIRMED**
- Bylaw Appendix D — full principle-based rewrite — **CONFIRMED**

### Key SOP Decisions Still Open
- Ch 4 — Org Secy voter eligibility boundary — sub-committee to decide
- Section 2.3 — RO objection criteria — sub-committee to draft criteria list
- Section 7.6 Stage 3/4 — caretaker EC powers — General Body to specify at AGM

---

## SECTION 7 — ROLES, ACCESS AND OPERATIONAL MODEL

### 7.1 Admin Role Tiers — System B

| Role | Access | Who holds it | Gate |
|---|---|---|---|
| `EC_OFFICER` | Pre-handover panel only: voter roll draft upload, landing page content, handover messages. Auto-disabled at handover. | General Secretary, President, Vice President | Status=ACTIVE |
| `RO_ADMIN` | Full system — all tabs, all functions, all elections | Returning Officer | Valid session |
| `DEPUTY_RO` | Identical to RO_ADMIN when activated | Deputy RO | Valid session + DeputyROActivated=TRUE |
| `TEM` | Read: full. Write: requires valid AuthorisationID per action | Technical Election Manager (optional) | Valid session + AuthorisationID |
| `SCRUTINEER` | AdminLog read-only, Scrutiny read-only, Live Tally, VotedLog, Voter list, Tally co-sign, Observations | Appointed Scrutineers | Valid session |
| `OBSERVER` | Live participation dashboard, Nominations board, Results after declaration, own Observations | Accredited Observers | Valid session |
| `VOTER` | Ballot (active), Nominations board, My Nominations, Complaints, Nomination form | Life Members on certified voter roll | Valid session |
| `PUBLIC` | Landing page, public election status, vote receipt verification | Anyone | No login |

---

### 7A — UI/UX DESIGN MANDATE
*Locked: 28 May 2026. Mobile-First — Non-Negotiable.*

Primary access device for all users is mobile phone. Admin panel may be used on PC but must work smoothly on mobile.

**Rules — enforced in all code:**
- Touch targets: minimum 44px height
- No horizontal scrolling except tab bars (with `-webkit-overflow-scrolling: touch`)
- Font sizes: minimum 15px body, 13px labels/captions
- Layout: single column below 600px viewport
- Tab bars: horizontal scroll, `white-space:nowrap`
- Form inputs: full width, correct `inputmode` and `autocomplete`
- Tables: card layout on mobile — never horizontal-scroll data tables
- Buttons: full width on mobile, stacked vertically
- Card padding: minimum 16px

Every screen must be verified at 375px viewport width before being considered complete.

---

### 7.2 Technical Election Manager (TEM)
TEM has a proper system login. Every write action requires a valid AuthorisationID issued by RO beforehand. Full design: Section 3B above and Session 18 Handover Note.

### 7.3 Scrutineer Access
Full AdminLog read-only from beginning of election period. Default landing tab on login: Scrutiny.

### 7.4 Scrutineer Appointment Flow 🔴 NOT YET BUILT
8-step flow: EC decides → RO enters → acceptance link → Scrutineer accepts (constitutes Declaration of Impartiality) → system notifies → credentials activated.

### 7.5 Deputy Returning Officer
Dedicated `DEPUTY_RO` tier. Inactive until explicitly activated by RO. Activation witnessed and logged. Deputy RO on Appeals Panel recuses on activation; reinstated on deactivation.

### 7.6 Observer Access
Live participation dashboard — aggregate turnout % per post, no voter identities, no vote distribution.

### 7.7 RO Authorisations
`recordROAuthorisation(token, electionId, scope, actionTypes, notes)` — issues AuthID. `revokeROAuthorisation(token, authId)` — revokes. `requiresTEMAuth(sess, authId, actionType)` — internal gate on all TEM write functions.

### 7.8 Build Status Summary — System B

| Feature | Status |
|---|---|
| `RO_ADMIN` login and full panel (12 tabs) | ✅ Complete Session 22–26 |
| `VOTER` login and full panel | ✅ Complete Session 25–26 |
| `EC_OFFICER` login and full panel (4 tabs) | ✅ Complete Session 23 |
| `SCRUTINEER` login, scrutiny read-only, tally, AdminLog | ✅ Complete |
| `OBSERVER` login + live dashboard | ✅ Complete |
| `TEM` proper login tier + AuthorisationID gate | 🔴 Not yet built |
| `DEPUTY_RO` activation-gated tier | 🟡 Activation/deactivation UI built; full gate not complete |
| Scrutineer Confirmation UI (Part A / Part B) | 🔴 Not yet built |
| Scrutineer digital acceptance flow | 🔴 Not yet built |
| Complaints module | ✅ Complete Session 26 |
| Appeals module | ✅ Complete Session 26 |
| Observations module | 🔴 Not yet built |
| Messages module (Admin side) | 🔴 Not yet built |
| ECOfficerBoardDatabase module | 🔴 Not yet built |
| ElectionSchedule module | 🔴 Not yet built |
| LandingPageContent module | 🔴 Not yet built |
| ROPanelLog module | 🔴 Not yet built |
| VoterRollDraft certification tab | 🔴 Not yet built |
| TEM Authorisation tab (S45) | 🔴 Not yet built |
| One-post-per-person at acceptNomination | 🔴 Not yet built |
| Mandatory posts hard-block | 🔴 Not yet built |
| Candidature withdrawal deadline lock | 🔴 Not yet built |
| Nomination extension mechanism | 🔴 Not yet built |
| Stage compression logic | 🔴 Not yet built |
| Scrutiny query panel (S38 Layer 2) | 🔴 Not yet built |
| EC referral panel (S38 Layer 2) | 🔴 Not yet built |
| manual_ro document upload gate | 🔴 Not yet built |
| Phase 2 nominations (voter panel) | 🔴 Not yet built |
| Landing page full rebuild | 🔴 Not yet built |
| Tutorial page | 🔴 Not yet built |
| Pre-election Appendix J system-guided checklist | 🔴 Not yet built |
| Email verification tool on landing page | 🔴 Not yet built |
| Election Record PDF generation | 🔴 Not yet built (System A had this) |
| Tenure bar check against ECOfficerBoardDatabase | 🔴 Not yet built |
| purgeTrialData | ✅ Complete Session 26 |
| Sheet protections UI trigger | ✅ Complete Session 24 |
| Script version verification | ✅ Complete Session 24 |
| RO undo/reversal functions | ✅ Complete Session 24 |

---

## SECTION 8 — BYLAW AMENDMENT

### Current Clause (the problem)
> Article IV Section 1A (iii): *"The Returning Officer shall be the seniormost old boy present on the day of voting."*

### Proposed Replacement — Principle-Based Rewrite (Session 15)
Full principle-based rewrite of all clauses. All operational detail removed to Operating Procedures (SOP). See Session 15 Decisions Log for complete approved text of each clause.

**Clauses:** (a) RO Selection, (b) Deputy RO, (c) TEM, (d) Scrutineers and Observers, (e) Voter Roll, (f) Nominations, (g) Scrutiny, (h) Appeals Panel, (i) Uncontested Posts, (j) Voting, (k) Results, (l) Candidate Eligibility, (m) Caretaker EC (NEW), (n) Operating Procedures (NEW).

### Process to Adopt Amendment
1. Sub-committee finalises SOP and amendment text — May/June 2026
2. EC approves draft — June 2026
3. Special GBM — 2/3 majority (quorum 50 Life Members)
4. Certified copy filed with Registrar within 14 days

---

## SECTION 9 — CONSTITUTIONAL FRAMEWORK REFERENCE

### Bylaws Background
- **Original registration:** 2015
- **Amendment 1:** AGM 20 July 2024
- **Amendment 2:** AGM 19 July 2025 — EC tenure 1 year; Remote AGM and e-voting permitted

### Key Eligibility Rules
- **President — Rule P-A:** Must have held EC post for 2+ years in preceding 15 years.
- **General Secretary:** EC member in any capacity for 1+ year in preceding 15 years.
- **Organising Secretary:** Designated batch. Max 5 consecutive years (T1).
- **Batch Representatives:** Must belong to relevant batch group.
- **Tenure Bar T1:** Same post 5 consecutive years → cannot stand for that post.
- **Tenure Bar T2:** Any non-Batch-Rep EC posts 6 consecutive years → cannot stand for any post until 2-year absence.
- **Voter eligibility:** Life Members only.

### Quorum
- AGM: 100 Life Members present and voting
- Special GBM: 50 Life Members present and voting

---

## SECTION 10 — DECISIONS LOG

| Decision | Rationale |
|----------|-----------|
| Google Apps Script over other platforms | Zero hosting cost, runs on Association's own Google account, accessible to any member for audit |
| Votes and VotedLog as separate sheets | Structural anonymity — impossible to link vote to voter even with full sheet access |
| OTP to registered email only | Cost, deliverability, quota adequate for OBA membership size |
| Model B nominations | Reduces clerical burden on RO; candidate takes ownership |
| No vendor | Proprietary black box; data on vendor servers; recurring cost; self-built is auditable |
| Open source on GitHub before first election | Transforms trust from assurance to verification |
| RO selected by seniority panel | Preserves seniority principle; RO identity known well in advance |
| TEM appointed by RO, not EC | EC has no involvement in technical operation after RO appointment |
| Technology-agnostic voting clause | Bylaw will not become outdated as technology changes |
| V-day minus timeline | SOP is future-proof; AGM date varies each year |
| Dedicated `elections.sskzmoba@gmail.com` | EC lockout at RO appointment requires standalone account |
| Import Candidates tab removed (Session 14) | All candidates generated from accepted nominations only |
| manual_ro entry method (Session 14) | Replaces old submitNominationManual; three-document gate enforces SOP 4.8 |
| Scrutineer read-only scrutiny view (Session 14) | Transparency without mid-scrutiny interference |
| External RO removed (Session 15) | Alumni association — external person cannot grasp community nuances |
| Scrutineers appointed by EC not RO (Session 15) | Greater independence |
| Principle-based bylaw drafting (Session 15) | Operational detail in SOP — bylaw not amended every time process changes |
| Voting mode decoupled from AGM mode (Session 15) | Electronic voting preferred for wider participation |
| Results 10 days before AGM — electronic only (Session 15) | Enables smooth handover |
| EC handover at AGM after formal announcement (Session 15) | Incoming EC takes charge on AGM day |
| Mandatory posts hard-block — no RO override (Session 15) | President/VP/GS/Treasurer must be filled; only GB can authorise proceeding without |
| Continuous extensions for mandatory posts (Session 15) | Every opportunity must be exhausted before election halts |
| Scrutineer full AdminLog read-only (Session 15) | Maximum transparency |
| Caretaker EC in bylaw (Session 15) | SOP cannot override bylaw on EC tenure; constitutional anchor required |
| Stage compression allowed (Session 15) | RO flexibility to recover lost time |
| Two-system architecture (Sessions 17–18) | System A frozen as fallback; System B built fresh |
| TEM proper login tier (Session 18) | Screen-share model superseded; TEM has own credentials with AuthorisationID gate |
| Physical mode boundary at candidates_published (Session 19) | EMS operational role ends at candidate list |
| Vice President mandatory post as group check (Session 19) | At least one VP seat must be filled |
| Mobile-first mandate (Session 22) | Primary access device is mobile phone; all UI built and tested at 375px |
| Tally blackout all roles incl. RO_ADMIN (Session 24) | No role has tally access during active/paused |
| Handover checklist 6 items incl. GitHub org transfer (Session 24) | GitHub transfer added as security measure |
| Version verification is RO attestation not automated hash (Session 24) | Browser-based attestation model |
| Scrutiny checklist 6 items (Session 24) | Life Member status dropped — enforced at voter roll level, not scrutiny |
| Complaints and Appeals gates (Session 26) | candidates_published → active blocked if pending appeals exist (D-V6 enforcement) |
| All status transitions wired with per-status messages (Session 26) | Full election pipeline controllable from UI |
| purgeTrialData — TrialElection gate (Session 26) | Purge only permitted on elections where TrialElection=TRUE |

---

## SECTION 11 — PROJECT FILES GUIDE

### Architecture and Design Documents *(read these first for any System B work)*
| File | Purpose | Authority |
|---|---|---|
| `SSKZM_OBA_EMS_Step3_Amendments.md` | Post-document Q&A decisions — TEM redesign, physical mode, nominations board, VP terminology | **Highest** |
| `SSKZM_OBA_EMS_Step3_BackendFunctionMap.md` | Complete function map — carry forward / modify / deprecate / new | Locked |
| `SSKZM_OBA_EMS_SESSION18_HANDOVER.md` | Data architecture (22 tabs) and access tier design | Locked |
| `SSKZM_OBA_EMS_SESSION17_HANDOVER.md` | Refactor scope and principles | Reference |

### Master Documents
| File | Purpose |
|---|---|
| `SSKZM_OBA_MASTER_BRIEF_UPDATED1.md` | **This file** — master context |
| `SSKZM_OBA_EMS_CODEWRITING_STATUS_UPDATED.md` | Rolling build status — read Section 6 first every session |
| `SSKZM_OBA_SESSION15_DECISIONS_LOG.md` | Complete Q&A decisions from Session 15 |
| `SSKZM_OBA_EMS_Requirements_Locked.md` | Locked requirements list |

### Live Code Files *(upload to project folder after every session)*
| File | Status |
|---|---|
| `Code.js` | ✅ Current — Session 26 |
| `AdminJS.html` | ✅ Current — Session 26 |
| `VoterJS.html` | ✅ Current — Session 26 |
| `Index.html` | ✅ Current — Session 25 |
| `ECOfficerJS.html` | ✅ Current — Session 23 |
| `SharedJS.html` | ✅ Current — Session 21 |
| `LandingPage.html` | 🔴 Stub — needs full rebuild |

### System A Code *(reference only — do not modify, do not apply to System B)*
`1_Code_gs.md`, `AdminJS_html.md`, `VoteJS_html.md`, `index_html.docx`

### SOP, Bylaw and Constitutional Documents
`SSKZMOBA_ElectionsSOP_SubcommitteDraft_20052026.docx`, `SSKZMOBA_ElectionsBylawClause_SubcommitteeDraft_20052026.docx`, `SSKZM_OBA_ByeLaw.pdf`, `SSKZM_OBA_EMS_TechSpec_13_05_2026.docx`

---

## SECTION 12 — VENDOR COMPARISON REFERENCE

| Vendor | Pricing | Key Concern |
|--------|---------|-------------|
| Right2Vote | ₹10K base + ₹25/voter | Contract bars legal challenge; data on vendor server |
| eVote | ₹55/member + ₹20K setup | Recurring cost |
| n-Gauge | Custom quote | Oversized for OBA |
| ElectionBuddy | USD $299–$599 | Foreign vendor; USD pricing |

**Common concerns:** Member data on third-party servers; proprietary code; recurring cost; vendor dependency.

---

## SECTION 13 — PENDING ITEMS & NEXT STEPS

### 🔴 IMMEDIATE — Before June 20 Trial
- [ ] Landing page full rebuild — election status widget, Login to Vote button, Tutorial link
- [ ] Tutorial page — How to Vote guide, role-specific, publicly accessible
- [ ] Voter roll loaded with real member data before trial
- [ ] End-to-end trial run — full pipeline from create election to declare results

### 🔴 SYSTEM B — CODE PENDING

**Architecture steps:**
- [x] Step 1: Data Architecture ✅ Session 18
- [x] Step 2: Access Tier Design ✅ Session 18
- [x] Step 3: Backend Function Map ✅ Session 19
- [x] Step 4: UI Page Map ✅ Session 20
- [x] Step 5: doGet() Routing Design ✅ Session 20
- [x] Step 6: Code writing ✅ Sessions 21–26 ongoing

**New modules pending:**
- [ ] TEM tier — full AuthorisationID gate, TEMAuth sheet, RO authorisation panel
- [ ] Deputy RO tier — full activation gate, Appeals Panel recusal logic
- [ ] Voter Roll Draft — objection management, certification flow
- [ ] Observations module
- [ ] Messages module (Admin-side — RO reads EC Officer messages)
- [ ] ECOfficerBoardDatabase module — import, lookup, auto-eligibility check
- [ ] ElectionSchedule module — V-day framework, public schedule
- [ ] LandingPageContent module
- [ ] ROPanelLog module

**Scrutiny and nominations pending:**
- [ ] Scrutineer digital acceptance flow (Section 7.4)
- [ ] Scrutineer Confirmation UI (Part A / Part B)
- [ ] One-post-per-person check at `acceptNomination`
- [ ] Mandatory posts hard-block (candidates_published → active)
- [ ] Candidature withdrawal deadline lock (D+1 from publication)
- [ ] Nomination extension mechanism — continuous for mandatory posts
- [ ] Stage compression logic
- [ ] Tenure bar check against ECOfficerBoardDatabase
- [ ] `acceptNomination` manual_ro document gate
- [ ] Scrutiny query panel (S38 Layer 2)
- [ ] EC referral panel (S38 Layer 2)
- [ ] Phase 2 nominations — voter panel (nominate another member)
- [ ] Phase 2 consent flow — add seconder action in My Nominations

**Infrastructure pending:**
- [ ] Pre-election Appendix J system-guided checklist
- [ ] Email verification tool on landing page — pre-handover, auto-disabled at handover
- [ ] Election Record PDF generation
- [ ] Observer Panel — dashboard, results view

### 🔴 SOP AND BYLAW
- [ ] Master Amendment Sheet (docx) — integrating all amendments + Session 15 decisions
- [ ] Colour-coded SOP (docx) — Fourth Edition
- [ ] Sub-committee sign-off on final SOP before EC submission
- [ ] EC approval of SOP and bylaw amendment
- [ ] Special GBM — bylaw amendment ratification (18 July 2026)

### 🟡 PRE-LIVE ELECTION
- [ ] Trial — all members, trial voting starts ~20 June 2026, results declared at SGM 18 July 2026
- [ ] Phase D — Resolution voting
- [ ] Phase E — Pilot election (mandatory before first live election)
- [ ] Three-point code verification protocol
- [ ] GitHub repo — make public before first live election
- [ ] Independent code audit
- [ ] Brevo upgrade to Starter plan for election month
- [ ] Brevo account transfer to OBA email
- [ ] README pushed to GitHub

### 🟢 HOUSEKEEPING
- [ ] Logo image file ID — pending from EC (needed for System B landing page)
- [ ] `BUILDING_GDRIVE_ID` — building image file ID — pending from EC
- [ ] Sub-committee members added to System B Voters and Admins sheets when ready
- [ ] Section 2.3 — RO objection criteria — sub-committee to draft
- [ ] Caretaker EC powers — General Body to specify at AGM
- [ ] Org Secy voter eligibility boundary — sub-committee to decide
- [ ] Appendix E (EMS Tutorial) — to be completed after Phase E pilot with screenshots

---

## SECTION 14 — SESSION LOG

### ✅ Sessions 1–8 (26 April – 2 May 2026)
Migration, Phase A voting, Phase B nominations, security hardening sprint, Phase 2 nominations, Observer dashboard, ballot enhancements (Abstain/NOTA), post-vote confirmation email, token verification page, landing page v1.

### ✅ Session 9 — 2 May 2026
Documentation. Landing page v2 produced.

### ✅ Session 10 — 3 May 2026
Phase F GAS integration. `checkAlumniAccess()`. `doGet()` routing. LandingPage.html in Apps Script.

### ✅ Session 11 — 4 May 2026
Mobile responsive CSS. Home button. Sub-committee onboarding model decided.

### ✅ Session 12 — 7 May 2026
SOP Round 1 updates. Tech Spec Section 1.8 updated.

### ✅ Session 13 — 13 May 2026
Voter Roll CSV Upload UI. Voter List paginated view. Scrutineer Voter List tab. SOP 4.8 (RO Manual Nomination Entry) added.

### ✅ Session 14 — 15 May 2026
Import Candidates tab removed. manual_ro nomination form. Scrutineer read-only scrutiny view. Tally blackout.

### ✅ Session 15 — 18 May 2026
Full sub-committee Q&A. All SOP and bylaw amendment decisions taken. Complete decisions log produced.

### ✅ Sessions 16–18 — May 2026
Refactor decision. Two-system architecture established. Step 1 (Data Architecture) and Step 2 (Access Tier Design) completed and locked.

### ✅ Session 19 — 27 May 2026
Step 3: Backend Function Map completed and locked. 44 new functions specified. TEM redesigned as proper login tier. Physical mode boundary confirmed.

### ✅ Session 20 — May 2026
Step 4: UI Page Map completed. Step 5: doGet() Routing Design completed. All 16 routes specified.

### ✅ Session 21 — 28 May 2026
Code writing begins — System B. All 22 sheet tabs created. Admin login verified end-to-end. SPA shell and login flows working.

### ✅ Sessions 22–24 — 6 June 2026
Admin Panel fully complete — all 10 tabs built and tested. 18 new backend functions. Voter Panel identified as next priority. Mobile-first mandate locked.

### ✅ Session 25 — 11 June 2026
Voter Panel full build. VoterJS.html rebuilt from stub — My Ballot (status-driven + active ballot), Nominations Board, My Receipts, Help tabs all live. 6 new backend functions: `getElectionsForVoter`, `getCandidatesForVoter`, `getBallotStatus`, `castVote`, `getMyReceipts`, `getNominationsBoard`. `NavMenu.switchTab()` added to Index.html.

### ✅ Session 26 — 11 June 2026
Complaints module, Appeals module, status transition gates, nomination form, purge function. New backend functions (10): `fileComplaint`, `getComplaints`, `updateComplaintStatus`, `fileAppeal`, `getAppeals`, `updateAppealDecision`, `lookupVoterName`, `getMyNominations`, `submitNomination`, `purgeTrialData`. Key completions: Complaints and Appeals tabs in AdminJS; `candidates_published → active` gate blocks pending appeals; all election status transitions wired with per-status messages; nomination form in VoterJS with proposer/seconder lookup and email confirmation; My Nominations dashboard with withdraw; purgeTrialData with CONFIRM PURGE gate; `isRO` scoping bug fixed in `_renderManageScreen`; `EC_POSTS` client-side bug fixed. Pending before trial: landing page rebuild, tutorial page, voter roll with real member data, end-to-end test run.

### ✅ Session 27 — 11 June 2026
**Voter Verification App (VVA) — fully designed, built, and tested.**
New standalone GAS project deployed from OBA main Workspace account. Connected to master membership sheet via `MASTER_SHEET_ID` Script Property (standalone project architecture). Three files: `Code.js` (50 functions, 1,348 lines), `Index.html` (public portal), `Admin.html` (GS management panel).

Key design decisions locked this session:
- VVA is a standalone GAS project (not bound) — connects to master sheet via `SpreadsheetApp.openById()`
- GS panel authentication: email OTP via Brevo, 10-minute expiry, 4-hour session token in Script Cache
- Brevo webhook built for automatic bounce/failed delivery capture
- Single Brevo account shared with EMS — Starter 20k plan (~$19/month) for campaign period
- `LIFE_MEMBER_DATE` column added at BE (index 56) — `Before 01 Jun 2026` default for existing members via one-time initialisation; cutoff logic uses this for post-cutoff enrollment filtering
- `email_not_found` status added as distinct state for members with blank EMAIL1
- `DEPARTED` filter: any value starting with `Yes` (case-insensitive) — handles all date variants
- `LIFE_MEMBER` filter: value `1` only
- Freeze roll uses `VVA_ROLL_FROZEN` Script Property + `VVA_CUTOFF_DATE` — not VVA-open state
- One duplicate email found in master sheet during audit — resolved by GS before campaign
- EMS VoterRollDraft CSV column mapping confirmed: cols 0–8 voter data + col 9 VerificationCategory
- VVA status → EMS VerificationCategory mapping: verified→verified, no_response→unresponsive, failed_delivery/email_not_found→undelivered

All tests passed: sync, OTP login, single email send, confirmation link, public lookup, email update flow, duplicate audit, CSV export.

*End of Master Brief — 11 June 2026 — Session 27*