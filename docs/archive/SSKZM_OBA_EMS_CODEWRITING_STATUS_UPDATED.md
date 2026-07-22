# SSKZM OBA EMS — CODE WRITING STATUS
*Read Section 6 first at the start of every new session to find the next task.*
**Updated: Session 43 — 28 June 2026**

---

## SECTION 0 — SOURCE OF TRUTH

**Live code is in the Claude Project folder AND on GitHub.**

| File | GitHub URL |
|---|---|
| `Code.js` | https://github.com/sskzmoba/ems/blob/main/Code.js |
| `Index.html` | https://github.com/sskzmoba/ems/blob/main/Index.html |
| `SharedJS.html` | https://github.com/sskzmoba/ems/blob/main/SharedJS.html |
| `AdminJS.html` | https://github.com/sskzmoba/ems/blob/main/AdminJS.html |
| `VoterJS.html` | https://github.com/sskzmoba/ems/blob/main/VoterJS.html |
| `ECOfficerJS.html` | https://github.com/sskzmoba/ems/blob/main/ECOfficerJS.html |
| `LandingPage.html` | https://github.com/sskzmoba/ems/blob/main/LandingPage.html |
| `TutorialPage.html` | https://github.com/sskzmoba/ems/blob/main/TutorialPage.html |
| `appsscript.json` | https://github.com/sskzmoba/ems/blob/main/appsscript.json |

**GitHub access note:** `raw.githubusercontent.com` and `api.github.com` are blocked by the Claude sandbox. **Working solution: upload all changed files to the Claude Project folder after each session.** Claude reads them from `/mnt/project/`.

**Sync workflow (after every editing session in Apps Script):**
```
cd Documents\sskzm-oba-ems-systemb
clasp pull
git add .
git commit -m "brief description of what changed"
git push
```
Then update the project folder files and upload this status document.

---

## SECTION 1 — SYSTEM REFERENCE

| Item | Value |
|---|---|
| **Active System** | System B only. System A frozen at `sskzmoba/ems-legacy` — do not touch. |
| **GitHub Org** | `sskzmoba` — https://github.com/sskzmoba/ems |
| **Sheet ID** | `1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E` |
| **Deploy URL** | `https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec` |
| **Test RO Admin ID** | `TEST_RO` |
| **Test RO Email** | `shelleykdas@gmail.com` |
| **Drive folder** | `SSKZM OBA Elections` (root) → `{electionId} — {electionTitle}` (per election) |
| **SGM Date** | 18 July 2026 — **20 days remaining** |
| **SGM Notice deadline** | **4 July 2026 — 6 days** |

---

## SECTION 2 — MOBILE-FIRST DESIGN MANDATE
*Locked. Applies to ALL UI work.*

**Primary access device: Mobile phone (Android and iOS).**

### Rules — apply to every screen, every panel, every form
- Touch targets: minimum **44px height** for all buttons and interactive elements
- No horizontal scrolling except tab bars (with `-webkit-overflow-scrolling: touch`)
- Font sizes: minimum **15px body**, **13px labels/captions**
- Layouts: **single column** — no side-by-side columns unless screen > 600px
- Tab bars: horizontal scroll with `white-space:nowrap`, momentum scroll
- Forms: **full width inputs**, large tap targets, correct `inputmode` and `autocomplete`
- Tables: **card layout on mobile** — never horizontal-scroll tables
- Buttons: **full width on mobile**, stacked vertically not side by side
- Spacing: minimum **16px padding** on all cards and panels

---

## SECTION 3 — HTML FILES CURRENT STATE

| File | Lines | Status | Notes |
|---|---|---|---|
| `LandingPage.html` | — | ✅ Session 34 | Full redesign. Slim status card, two-track schedule widget (official + trial tabs), status-based milestone highlight. |
| `Index.html` | — | ✅ Working | SPA shell. `setMain()`, `escHtml()`, `showToast()`, `NavMenu`, `App` object all working. |
| `SharedJS.html` | — | ✅ Working | Full voter + admin login flows verified end-to-end. |
| `VoterJS.html` | **1,548** | ✅ Session 43 | Emoji/non-ASCII sweep complete. Missing paren on ternary fixed. My Ballot, Nominations Board, My Receipts, Help, Phase 1+2 nomination forms, My Nominations dashboard. Batch Rep + Org Secy filtering. |
| `AdminJS.html` | **6,058** | ✅ Session 43 | 15 tabs (RO). Full TEM module. Landing Page content management UI in Settings. Observer dashboard. Observations module across all 5 role panels. All 3 S43 outstanding fixes confirmed in. |
| `ECOfficerJS.html` | — | ✅ Session 33 | All 4 tabs. Landing Page tab (Section A/B/C) fully built. |
| `TutorialPage.html` | **968** | ✅ Session 43 | TEM callout updates complete: TEM authorisation, TEM AuthorisationID, Landing Page tab callouts all updated to live description. |

### Index.html — key element IDs

| ID | Element | Purpose |
|---|---|---|
| `#app` | div | Outer shell — do not replace innerHTML |
| `#topbar` | div | Persistent top bar |
| `#topbar-subtitle` | span | Role label / panel name |
| `#topbar-name` | span | Logged-in user's name |
| `#btn-logout` | button | Calls `App.logout()` |
| `#main` | div | **Content area — all panels render here via `setMain()`** |
| `#toast` | div | Toast notification |

### CSS classes — use in all panels
`.panel-card`, `.panel-card-header`, `.panel-card-body`, `.tab-bar`, `.tab-btn`,
`.tab-btn.active`, `.status-badge`, `.badge-active`, `.badge-draft`, `.badge-closed`,
`.badge-declared`, `.badge-noms-open`, `.badge-scrutiny`, `.badge-trial`, `.spinner`

### Critical technical notes — do not re-learn

- **`el()` not available in included files** — always use `document.getElementById()`
- **`setMain(html)`** targets `#main` — never replace `#app` innerHTML
- **Panel `init()` functions** must never overwrite `#app` innerHTML
- **`_renderTab` pattern**: tabs with backend calls return spinner + trigger async load; tabs that render synchronously must return HTML string directly
- **Deployment**: every change needs new deployment version at `/exec`
- **LandingPage links**: must use full deploy URL — relative links cause blank page
- **Standalone page links**: use `target="_top"` on all `<a>` tags in `standaloneShell()` pages
- **`<script>` blocks in `standaloneShell()`**: GAS sanitiser strips `<script>` tags — use plain HTML forms or `target="_top"` links
- **`EC_POSTS` is server-side only** — never reference in client-side JS; hardcode post list in browser code
- **`isRO` scope**: must be defined inside each function that uses it — `var isRO = (App.role === 'RO_ADMIN' || App.role === 'TEM')` is the current pattern (widened Session 41)
- **`NavMenu.switchTab(tabId)`** — public method; calls `_select` internally
- **DriveApp scope**: declared in `appsscript.json`. Requires running a DriveApp function interactively in editor to grant permission before deployment picks it up.
- **Emoji/surrogate pairs**: All multi-codepoint emoji (above U+FFFF) are banned from JS string context in GAS. Replace with text labels. Single BMP chars (—, …, ←, →, ✓, ✗) are fine.

---

## SECTION 4 — SHEET TABS STATE

System B Sheet: `1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E`

| # | Tab Name | Status | Notes |
|---|---|---|---|
| 1 | Sheet1 | ✓ Unused | Default sheet — ignore |
| 2 | ElectionSchedule | ✅ Session 33 | 21-col single-row schema. setElectionSchedule, getElectionSchedule, getPublicSchedule, publishSchedule all live. |
| 3 | Votes | ✓ Working | FROZEN — no voter identity ever |
| 4 | VotedLog | ✓ Working | FROZEN — no vote content ever |
| 5 | AdminLog | ✓ Working | Entries being written |
| 6 | Elections | ✓ Working | Col I=ELEC_ORGSECY_BATCH, Col K=ELEC_ORGSECY_RESTRICTED, Col AB=ELEC_VOTES_HASH. Header added manually Session 40. |
| 7 | Candidates | ✓ Working | Live — withdrawal bug fixed Session 36 |
| 8 | Admins | ✓ Working | Col N=AdminGmail (ADMIN_GMAIL index 13). Header added manually Session 40. TEST_RO + trial accounts present. |
| 9 | Nominations | ✓ Working | Col AG=RejectedAt. Header added manually Session 40. Trial nominations present. |
| 10 | ScrutinyLog | ✓ Working | Active. Stale row for Mithunraj (3318) NOM-1782639012034 — ID `86aa9381-4f30...` tenure_bar=No — **delete manually if not already done.** |
| 11 | NomQueries | ✓ Created | Header only |
| 12 | DocStore | ✅ Session 43 | nomRef:{nomId}| prefix in DOC_NOTES for per-nomination linking. 3 docs required per manual_ro nomination. |
| 13 | VoterRollDraft | ✓ Working | Upload tested. 21 EC members certified. |
| 14 | Complaints | ✓ Working | Live — tested Session 26 |
| 15 | Appeals | ✓ Working | Live — tested Session 26 |
| 16 | Observations | ✅ Session 43 | COL_OBS populated (11 cols). submitObservation, getObservations, replyObservation all live. |
| 17 | Messages | ✓ Working | EC Officer messages tested |
| 18 | ECOfficerBoardDatabase | ✓ Created | Header only — module not yet built |
| 19 | TEMAuth | ✅ Session 40 | 12-col schema. COL_TEMA constants. recordROAuthorisation, revokeROAuthorisation, getTEMAuthorisations all live. |
| 20 | ROPanelLog | ✓ Created | Header only — module not yet built |
| 21 | LandingPageContent | ✅ Session 33 | getLandingPageContent, setLandingPageContent live. Management UI in Admin Settings tab live (Session 43). |

---

## SECTION 5 — ADMIN PANEL — TABS AND MODULES

### RO_ADMIN panel — 15 tabs

| Tab | Status | Notes |
|---|---|---|
| elections | ✅ | Full CRUD. Status transitions with gates. |
| nominations | ✅ Session 43 | Manual entry selector fix confirmed in. `confirmed` status in showStatuses confirmed in. |
| scrutiny | ✅ Session 43 | Ex Officio excluded from tenure bar. Duplicate row fix. auto-assess fallback in acceptNomination. `_saveCheckItemNotes` data-result fix confirmed in. Doc uploader card per nomination. |
| candidates | ✅ | Candidate management. publishCandidates callable. |
| voting | ✅ | Live tally + co-sign. |
| voters | ✅ | Voter roll + certify. |
| complaints | ✅ | Full lifecycle. |
| appeals | ✅ | Full lifecycle. |
| documents | ✅ | Upload/list/delete per election and per nomination. |
| messages | ✅ | EC Officer board + handover checklist. |
| auth | ✅ Session 40 | RO issues AuthIDs to TEM. TEMAuth sheet. |
| settings | ✅ Session 43 | Sheet protections, system status, version verify, GitHub transfer, Landing Page content management (7 keys). |
| observations | ✅ Session 43 | Submit (if Scrutineer/Observer), pending banner, inline reply with TEM auth gate. |
| schedule | ✅ | Schedule calculator and publisher. |
| admin-log | ✅ | Paginated log viewer. |

### TEM panel — tab set matches RO except: no `auth` tab, no `admin-log` tab
### DEPUTY_RO panel — same as RO except: no `auth` tab
### SCRUTINEER panel — tabs: scrutiny, documents, messages, observations
### OBSERVER panel — tabs: dashboard (Observer dashboard), observations

### Observer dashboard
- `getObserverDashboard` — OBSERVER only, active/paused elections only
- Returns: turnout %, total voted, total eligible, per-post vote counts
- NO voter identities, NO vote distribution — SOP 7.11 compliant
- 60-second auto-refresh. Timer clears on navigation.

### TEM — top bar AuthID persistent selector
- `getTEMAuthId()` reads selected AuthID from top bar
- All TEM write functions gated via `requiresTEMAuth()`
- `replyObservation` added to `TEM_AUTHORISABLE_ACTIONS.election`

---

## SECTION 6 — CURRENT BUILD QUEUE (Session 44 priority order)

### ⚠️ PRE-START VERIFICATION (before any build work)
These items were given as inline editor instructions in Session 43. All three are **confirmed in the uploaded project files**:
- [x] Fix 1: `_renderNominationsShell` selector — `elections.find(...)` — **CONFIRMED** (line 1852 AdminJS)
- [x] Fix 2: `getNominationsBoard` `showStatuses` includes `'confirmed'` — **CONFIRMED** (line 7184 Code.js)
- [x] Fix 3: `_saveCheckItemNotes` / `_setCheckResult` `data-result` attribute pattern — **CONFIRMED** (lines 4141-4156 AdminJS)
- [ ] ScrutinyLog stale row: delete `86aa9381-4f30-42e5-bdf8-3661b4e7cf90` manually — **VERIFY IN SHEET**

### BUILD QUEUE

| Priority | Item | ID | Pre-req | Notes |
|---|---|---|---|---|
| **1** | **Candidate photo upload** | PHOTO-1 | — | `NOM_PHOTO` col exists (index 16). `CAND_PHOTO` col exists (index 8). `getCandidatesForVoter` returns `photo` field. Nomination form has no upload field. Ballot has no photo display. Required for Tier 2 trial. Build: (a) photo upload in nomination form (VoterJS); (b) `uploadCandidatePhoto` backend function; (c) bio+photo popup on ballot card (VoterJS). |
| **2** | **Third-party nomination objection flow** | OBJ-1 | — | **Pre-live blocker.** 48-hour window from `ELEC_CAND_PUB_AT`. Locked design: objections routed to Appeals Panel, consolidated proceedings. Needs: SOP clause (Fourth Edition) + backend + UI. Not yet started. |
| **3** | **Election Record PDF** | G1 | Tier 2 trial done | Full export: AdminLog, tally, VotedLog summary, complaints/appeals, observations. No backend or UI yet. |
| **4** | **SOP Fourth Edition** | SOP-4 | OBJ-1 design locked | 7 amendments drafted. Pending EC circulation. Must include objection flow clause. |
| **5** | **`triggerPhase2Extension`** | PHASE2-EXT | — | In TEM_AUTHORISABLE_ACTIONS enum. RO manages manually (don't advance status if mandatory post vacant). Build deferred — not a blocker. |

### NON-BUILD BLOCKERS

| Item | Deadline | Status |
|---|---|---|
| SGM formal notice | **4 July 2026** | Not issued |
| Tier 2 full-member trial | **30 June 2026 (overdue — reassess)** | Blocked on PHOTO-1 |
| Independent code audit | Pre-live gate | Auditor pool: Thiruvananthapuram ISACA/CDAC. Appointment authority question pending. |
| VVA campaign completion | Before Tier 2 trial | VVA live, campaign in progress |
| ScrutinyLog stale row deletion | Immediate | Manual — see above |

---

## SECTION 7 — LOCKED DESIGN DECISIONS (permanent record)

| Decision | Detail | Session |
|---|---|---|
| Votes/VotedLog separation | ABSOLUTE — no voter identity in Votes, no vote content in VotedLog, ever | Core |
| Appeal window anchor | `ELEC_CAND_PUB_AT + 48 hours` — IMMUTABLE. Never change to `NOM_REJECTED_AT`. | 39 |
| TEM model | Full system login. Every write gated by RO-issued AuthorisationID. Screen-share model retired. | 40 |
| Deputy RO activation | Gated at login — no token issued if inactive. Existing sessions survive. | 43 |
| Ex Officio — tenure bar | Never counts toward T1 or T2 streak. Only for President P-B pathway. | 43 |
| Doc upload — per nomination | 3 docs per `manual_ro` nomination ID. nomRef stored as `nomRef:{nomId}\|` prefix in DOC_NOTES. | 43 |
| Observer dashboard | Participation counts only. No voter identities, no vote distribution. OBSERVER only during active/paused. | 43 |
| Observations access | SCRUTINEER: any open election status. OBSERVER: active/paused only. | 43 |
| Objection flow | Third-party objections → Appeals Panel. 48-hour window from ELEC_CAND_PUB_AT. Consolidated proceedings. | 39 |
| `onDirectEditAudit` trigger | Must be installed manually via Apps Script UI — not programmatically. | 39 |
| `appsscript.json` OAuth scopes | Do not modify explicit scope declarations — causes problems. | standing |
| T1 tenure bar | Pure consecutive, no gap allowance (unlike T2 where one absent year is absorbed). | standing |
| `triggerPhase2Extension` | Not a blocker. RO simply holds status if mandatory post vacant. Build deferred. | 43 |

---

## SECTION 8 — TRUST ARCHITECTURE (do not erode)

- SHA-256 votes hash computed at `active → closed`, verified at `closed → declared`
- `onDirectEditAudit` installable trigger logs + emails Scrutineers on any direct sheet edit
- Scrutineers hold Gmail accounts for independent sheet view and Version History access
- Scrutineer share applied automatically by `applySheetProtections`
- Known residual risk: script owner can delete `onDirectEditAudit` trigger without Cloud audit trail (default GCP project, no Data Access audit logging) — accepted risk, documented

---

## SECTION 9 — FILE SIZES (end of Session 43)

| File | Lines |
|---|---|
| `Code.js` | **9,432** |
| `AdminJS.html` | **6,058** |
| `VoterJS.html` | **1,548** |
| `TutorialPage.html` | **968** |

---

## SECTION 10 — BACKEND FUNCTIONS — COMPLETE LIST

| Function | Status | Notes |
|---|---|---|
| `getAllElections` | ✓ | |
| `createElection` | ✓ S41 | TEM role gate |
| `getElection` | ✓ | Returns orgSecyBatch, orgSecyRestricted |
| `updateElection` | ✓ S41 | TEM role gate |
| `deleteElection` | ✓ S41 | TEM role gate |
| `updateElectionStatus` | ✓ S41 | TEM role gate. Appeals gate + mandatory posts + PreSec checklist gate |
| `getPublicElectionStatus` | ✓ | |
| `getECOfficerPanel` | ✓ | |
| `getVoterRollDraft` | ✓ S41 | TEM role gate |
| `uploadVoterRollDraft` | ✓ S41 | TEM role gate |
| `getMessages` | ✓ | |
| `sendHandoverMessage` | ✓ | |
| `acknowledgeMessage` | ✓ | |
| `getScrutinyData` | ✓ | |
| `saveScrutinyItem` | ✓ S43 | Duplicate-row bug fixed: break removed from upsert loop |
| `acceptNomination` | ✓ S43 | Auto-assess fallback: tenure_bar + post_eligibility assessed from service history if no ScrutinyLog entry |
| `rejectNomination` | ✓ | |
| `undoAcceptNomination` | ✓ | |
| `undoRejectNomination` | ✓ | |
| `getCandidatesForElection` | ✓ | |
| `deleteCandidate` | ✓ S41 | TEM role gate. Action string bug fixed |
| `getLiveTally` | ✓ | |
| `getVotedLogSummary` | ✓ | |
| `recordTallyCoSign` | ✓ | |
| `getHandoverChecklist` | ✓ | |
| `lockECOfficers` | ✓ S41 | TEM role gate |
| `applySheetProtections` | ✓ S41 | TEM role gate |
| `removeSheetProtections` | ✓ S41 | TEM role gate |
| `recordScrutineerConfirmation` | ✓ | |
| `getSystemStatus` | ✓ | |
| `recordVersionVerified` | ✓ S41 | TEM role gate |
| `recordGithubTransferred` | ✓ S41 | TEM role gate |
| `getElectionsForVoter` | ✓ S43 | Bug fixed: `elections` variable declared before use |
| `getCandidatesForVoter` | ✓ | Returns `photo` field |
| `getBallotStatus` | ✓ | |
| `castVote` | ✓ | Trust architecture preserved |
| `getMyReceipts` | ✓ | |
| `getNominationsBoard` | ✓ S43 | showStatuses includes `'confirmed'` — manual nominations now visible |
| `fileComplaint` | ✓ | |
| `getComplaints` | ✓ S41 | TEM role gate |
| `getMyComplaints` | ✓ | |
| `updateComplaintStatus` | ✓ S41 | TEM role gate |
| `fileAppeal` | ✓ | |
| `getAppeals` | ✓ S41 | TEM role gate |
| `updateAppealDecision` | ✓ S41 | TEM role gate |
| `lookupVoterName` | ✓ | |
| `getMyNominations` | ✓ | Returns consentStatus, withdrawDeadline, withdrawOpen |
| `submitNomination` | ✓ | Batch Rep + Org Secy eligibility checks |
| `submitNomination_Phase2` | ✓ | |
| `addSeconder` | ✓ | |
| `candidateAddSeconder` | ✓ | |
| `nomineeAddSeconder` | ✓ | |
| `resendConfirmationEmail` | ✓ S41 | TEM role gate |
| `sendScrutineerAcceptanceLink` | ✓ S41 | TEM role gate |
| `confirmCandidateConsent` | ✓ | Bug fixed S37 |
| `declineCandidateConsent` | ✓ | |
| `withdrawNomination` | ✓ | |
| `purgeTrialData` | ✓ | TrialElection gate, CONFIRM PURGE phrase |
| `updateObjectionStatus` | ✓ S41 | TEM role gate |
| `certifyVoterRoll` | ✓ S41 | TEM role gate |
| `getAdminList` | ✓ S41 | TEM role gate |
| `addAdmin` | ✓ S41 | TEM role gate. TEM frontend restricted to SCRUTINEER+OBSERVER |
| `disableAdmin` | ✓ S41 | TEM role gate. Hard guard: TEM cannot target RO_ADMIN |
| `enableAdmin` | ✓ S41 | TEM role gate. Hard guard: TEM cannot target RO_ADMIN |
| `updateScrutineerGmail` | ✓ S41 | TEM role gate |
| `activateDeputyRO` | ✓ | RO_ADMIN only |
| `deactivateDeputyRO` | ✓ | RO_ADMIN only |
| `recordROAuthorisation` | ✓ S40 | RO_ADMIN only |
| `revokeROAuthorisation` | ✓ S40 | RO_ADMIN only |
| `getTEMAuthorisations` | ✓ S41 | RO_ADMIN + TEM. Blank electionId returns all rows |
| `requiresTEMAuth` | ✓ S40 | Internal gate. Called in 34+ write functions |
| `getVoterCount` | ✓ | |
| `getVoterList` | ✓ | |
| `getAdminLogPaginated` | ✓ | |
| `getNominations` | ✓ | |
| `getPublicResults` | ✓ S32 | No auth, declared elections only |
| `getDeclaredResults` | ✓ | |
| `getOrCreateElectionFolder` | ✓ S32 | |
| `storeDocument` | ✓ S43 | Accepts optional `nomRef` param. Stored as `nomRef:{nomId}\|` prefix in DOC_NOTES. N4 gate counts per-nomination docs only. |
| `getDocuments` | ✓ | |
| `deleteDocument` | ✓ S41 | TEM role gate |
| `calcScheduleFromVDay` | ✓ S33 | |
| `checkScheduleFloors` | ✓ S33 | |
| `setElectionSchedule` | ✓ S33 | |
| `getElectionSchedule` | ✓ S33 | |
| `getPublicSchedule` | ✓ S33 | |
| `publishSchedule` | ✓ S33 | |
| `getLandingPageContent` | ✓ S33 | |
| `setLandingPageContent` | ✓ S43 | TEM role gate. Admin Settings UI live. |
| `submitNominationManual` | ✓ S43 | TEM role gate. 7b Org Secy + 7c Batch Rep restriction checks added (were missing vs online path). |
| `getChecklistStatus` | ✓ S37 | |
| `recordChecklistItem` | ✓ S37 | |
| `confirmChecklistItemScrutineer` | ✓ S37 | |
| `computeVotesHash` | ✓ S39 | |
| `installDirectEditTrigger` | ✓ S39 | Deduplicates before install |
| `onDirectEditAudit` | ✓ S39 | Logs to AdminLog, emails Scrutineers |
| `publishCandidates` | ✓ S41 | Line 5777 Code.js |
| `addVoterToDraft` | ✓ S41 | Line 9166 Code.js. `resolved_added` status. |
| `getObserverDashboard` | ✓ S43 | OBSERVER only. active/paused elections. Turnout + per-post counts. No identities. |
| `submitObservation` | ✓ S43 | Line 7238. SCRUTINEER (any open) / OBSERVER (active/paused). Severity: info/concern/urgent. |
| `getObservations` | ✓ S43 | Line 7294. Admins see all; Scrutineer/Observer see own only. |
| `replyObservation` | ✓ S43 | Line 7338. RO/DeputyRO/TEM only. TEM-gated. In TEM_AUTHORISABLE_ACTIONS. |
| `checkTenureBar` | ✓ S43 | Line 597. T2 tenure bar. Ex Officio excluded. |
| `checkT1TenureBar` | ✓ S43 | Line 882. T1 consecutive bar. Ex Officio excluded. |
| `checkPresidentEligibility` | ✓ S43 | Line 730. |
| `checkGSEligibility` | ✓ S43 | Line 831. |
| `verifyOTP` | ✓ S43 | Deputy RO gate added: `DEPUTY_RO_INACTIVE` returned if depROActive=false. |
| `uploadCandidatePhoto` | 🔴 NOT BUILT | PHOTO-1 build item. |
| `triggerPhase2Extension` | 🔴 NOT BUILT | In enum. Deferred. |
| `updateScrutinyStatus` | 🔴 NOT BUILT | In enum. |
| `updateScrutinyDecision` | 🔴 NOT BUILT | In enum. |

---

## SECTION 11 — TEST MATRIX (regression — run before Tier 2 trial)

### Group A — Voter flows
| # | Test | Expected |
|---|---|---|
| A1 | Voter login → My Ballot (no active election) | "No active election" message |
| A2 | Voter login → My Ballot (active) → cast vote | Ballot renders, vote recorded, receipt shown |
| A3 | Voter tries to vote twice | "Already voted" message |
| A4 | Submit nomination (Phase 1) — all restriction checks | Batch Rep + Org Secy restrictions enforced |
| A5 | Nominations Board — all candidates visible | `confirmed`, `pending_scrutiny`, `accepted` all shown |

### Group B — Admin flows
| # | Test | Expected |
|---|---|---|
| B1 | RO login. All 15 tabs render. | No blank panels, no JS errors |
| B2 | Scrutiny tab — accept nomination with no ScrutinyLog entry | Auto-assess fires; tenure_bar and post_eligibility assessed automatically |
| B3 | Manual nomination entry — Org Secy + Batch Rep restrictions enforced | Matches online path |
| B4 | Observer login → Dashboard tab | Turnout + per-post bars render. Auto-refreshes at 60s. |
| B5 | Scrutineer submits observation | Observation appears in admin Observations tab |
| B6 | RO replies to observation (with TEM AuthID if TEM) | Reply appears in green block under observation |
| B7 | Settings tab → Landing Page content → edit a key → save | Value updates in LandingPageContent sheet |

### Group C — TEM flows
| # | Test | Expected |
|---|---|---|
| C1 | RO issues AuthID → TEM refreshes top bar | New AuthID in selector |
| C2 | TEM performs write action → AdminLog | Entry shows TEM AdminID + AuthID reference |
| C3 | Deputy RO login when depROActive=false | `DEPUTY_RO_INACTIVE` error, no token issued |

### Group D — Trust architecture
| # | Test | Expected |
|---|---|---|
| D1 | Direct sheet edit with protections active | `onDirectEditAudit` fires, Scrutineers emailed |
| D2 | Close election → check Elections ELEC_VOTES_HASH | Populated. Matches manual recompute. |


---

## Session 46 — 30 June 2026

### Completed This Session

**LandingPage.html**
- Draft status message fixed — `draft` now shows "Preparation in progress" / "The election is being set up. Details will be published in due course." instead of misleading "Election in progress" fallback

**Code.js**
- FIX-2 ✅ `purgeTrialData` clears `ELEC_VOTES_HASH`
- FIX-3 ✅ `applySheetProtections` — Scrutineer Gmail sharing fully removed
- FIX-9 ✅ Handover gate at `draft → nominations_open` — blocks if any EC_OFFICER account not DISABLED (non-trial only)
- Scrutineer Gmail — `updateScrutineerGmail` function removed; Gmail validation removed from `applySheetProtections`; `updateScrutineerGmail` removed from TEM auth list
- Appeals build (full):
  - `buildRejectionEmail` — directs candidate to portal + Appeals Panel (not RO)
  - `fileAppeal` — Appeals Panel notified by email immediately on filing (reads `APPEALS_PANEL_EMAILS` Script Property, comma-separated)
  - `storeAppealDocument` — new function; candidate uploads supporting doc to DocStore (category: `appeal_support`)
  - `storeAppealRuling` — new function; RO uploads Appeals Panel ruling to DocStore (category: `appeal_ruling`); TEM auth gated
  - `updateAppealDecision` — reframed as recording Panel decision; on uphold: election rolled back `candidates_published → scrutiny`, `ELEC_CAND_PUB_AT` cleared, nomination reinstated to `pending_scrutiny`; candidate notified by email on upheld/dismissed; returns `rolledBack` flag
  - `candidates_published → active` gate — auto-closes undecided appeals as `panel_no_response` after 96hrs from `ELEC_CAND_PUB_AT`; shows hours remaining if within window
  - `panel_no_response` added to `validDecisions`
  - `storeAppealRuling` added to TEM auth list

**AdminJS.html**
- Scrutineer Gmail — `_loadScrutineerGmails`, `_saveScrutineerGmail` functions removed; Gmail UI block removed from `_renderHandoverShell`; `updateScrutineerGmail` removed from TEM auth checkbox list
- Appeals tab:
  - `panel_no_response` status label ("Panel No Response", pink) + dropdown option added
  - Pending warning updated with 96hr panel deadline explanation
  - Ruling upload UI — `📎 Upload Ruling Document` button per appeal
  - `_uploadRuling` function added
  - `_saveAppeal` — upheld shows confirmation prompt listing consequences; toast distinguishes rollback from normal save
  - `storeAppealRuling` added to TEM auth checkbox list

**VoterJS.html**
- Appeal form — optional supporting document upload field added (PDF/image/Word, 5MB max)
- `_submitAppeal` — uploads doc to DocStore via `storeAppealDocument` after appeal filed

### Script Properties Required Before Live
- `APPEALS_PANEL_EMAILS` — comma-separated email addresses of Appeals Panel members
- `RO_CONTACT_EMAIL` — RO contact email (already noted from Session 45)

### Outstanding (Carried Forward)
- FIX-8 — Photo upload silent failure (deferred, optional feature)
- FIX-13 — Declaration emails (design agreed, build deferred)
- OBJ-1 — Third-party nomination objection flow (pre-live constitutional blocker)
- F6 — Appeals document upload (now partially addressed via storeAppealDocument)
- UI-1, UI-6, FIX-4, FIX-7b — non-blockers

### File Sizes (End of Session 46)
| File | Lines |
|---|---|
| Code.js | 9,953 |
| AdminJS.html | 6,193 |
| VoterJS.html | 1,644 |
| ECOfficerJS.html | 888 |
| TutorialPage.html | 968 |
| LandingPage.html | 616 |

---

## Session 47 — late June 2026

### Completed This Session
- OBJ-1 ✅ Third-party nomination objection flow — fully designed and built (last identified pre-live constitutional blocker)
  - `fileObjection` — third-party objection against an accepted nomination; 48hr window from `ELEC_CAND_PUB_AT`; one objection per member per nomination enforced; self-objection blocked; RO notified by email
  - Mirrors the appeals flow; routes to the Appeals Panel via consolidated RO-triggered summary emails
  - UI built in both `AdminJS.html` (Appeals tab — objections shown alongside appeals, tagged and counted separately) and `VoterJS.html` (objection button on Nominations Board + modal)
- Scrutineer Mirror Sheet created (ID: `1HGRmRLMSFsUjCPiP1ZNSfi6zbunZW0r6IieQeLPVqgM`) — IMPORTRANGE formulas mirroring 14 tabs live, excludes Votes/OTPs/Admins

### File Sizes (End of Session 47)
| File | Lines |
|---|---|
| Code.js | ~10,232 |
| AdminJS.html | ~6,245 |
| VoterJS.html | ~1,780 |

---

## Session 48 — 30 June 2026 (Tier 2 trial smoke test + Election Record build)

### Context
Live smoke test of the EMS conducted on a disposable "PRE TRIAL" election (`ELEC-5B7B9B96`), run in parallel with the real Tier 2 Trial Election's invitations already going out. Full pipeline exercised end-to-end: manual nomination → scrutiny → third-party objection → upheld → re-rejection → appeal → publish → voting → close → declare. Numerous real bugs surfaced and fixed live during testing, alongside the planned Election Record/PDF build.

### New Features Built
**Election Record (SOP §8.6)**
- `getElectionRecordData` — assembles the complete Election Record from existing data sources (voter roll, final tally, winners summary, tally co-signs, hash verification, draw of lots, ScrutinyLog, final candidate list, AdminLog, security checklist, complaints, appeals/objections, Scrutineer/Observer participation). Gated to `status === 'declared'`.
- `generateElectionRecordPDF` — renders the assembled record to a formatted PDF (`HtmlService...getAs('application/pdf')` — first PDF-generating function in this codebase) and stores it in the election's Drive folder. TEM-AuthID gated.
- `_buildElectionRecordHtml`, `_fmtISTServer` — supporting helpers for the PDF
- AdminJS: "Election Record" section in the Handover tab — Compile button (data preview) + Generate PDF button, both gated to `declared` status

**Draw of Lots (SOP §8.4)**
- `recordDrawOfLots` — RO/TEM records a tie-break draw (post, tied candidates, method, persons present, outcome) to AdminLog as a distinct, queryable action type. TEM-AuthID gated.
- AdminJS: Draw of Lots form in the Handover tab, visible when election status is `closed` or `declared`

**Pre-Vote Backup (SOP Appendix H/J Part F)**
- `createPreVoteBackup` — exports Voters/Elections/Candidates/ScrutinyLog/AdminLog to CSV, stores in `[Election Folder]/Backups/[timestamp]/`, auto-completes PreSec checklist items F1–F5 with the backup's Drive link in notes. TEM-AuthID gated.
- AdminJS: "Run Pre-Vote Backup" button inserted at the top of PreSec checklist Part F

**Internal test election isolation**
- New `ELEC_INTERNAL_TEST` COL constant (distinct from `ELEC_TRIAL`, which must remain publicly visible since real trial elections use it) — manually-flagged scratch elections are excluded from `getPublicElectionStatus`'s public landing-page scan
- `createElection` defaults `ELEC_INTERNAL_TEST` to `false`

**Voter-side robustness**
- `checkObjectionFiled` — lets the voter client verify an objection actually recorded after a false "connection error" (google.script.run round-trip failure with a successful server-side write); `_submitObjection`'s failure handler now checks this before alarming the voter

### Bugs Found and Fixed During Smoke Test
- **Vacant-post omission (5 independent occurrences)** — `getLiveTally`, `getPublicResults`, `getDeclaredResults`, and `buildResultsPage` never seeded their post list from the canonical `EC_POSTS` array; posts with zero surviving candidates were silently omitted from all results/tally views instead of shown as vacant. Fixed in all four backend functions (pre-seed `postMap` from `EC_POSTS`) plus three frontend rendering points (public results page, in-portal voter results, RO/Scrutineer Tally tab) with explicit "declared vacant — to be filled by co-option" messaging. Tally tab messaging is stage-aware (only says "vacant" once `closed`/`declared`; says "not currently nominated" earlier, since nominations may still be open).
- **Multi-seat (VP, Joint Secretary) winner display** — Tally tab hardcoded `isWinner = (idx === 0 && votes > 0)`, ignoring `seatCount`; Election Record Winners Summary only ever picked the single top candidate. `getLiveTally` now returns `seatCount` per post; both views now correctly elect the top N candidates per seat count; tie detection moved to the actual seat-cutoff boundary (`cands[seats-1]` vs `cands[seats]`) instead of always comparing 1st vs 2nd place.
- **AdminLog scope** — Election Record was pulling the *entire* system-wide AdminLog into every election's record (768+ entries from testing alone). Now filtered to entries traceable to the specific election (best-effort match on `newValue`/`oldValue`/description containing the electionId), with an explicit "best-effort, not guaranteed-complete" caveat since not every historical action type carries an election reference. `votes_hash_mismatch` logging fixed to carry `electionId` (previously carried the hash value instead, same as its sibling `votes_hash_verified`).
- **Objection button non-functional** — `VoterJS.html`'s objection modal buttons used bare unqualified `onclick="_showObjModal(...)"` instead of the required `VoterPanel._showObjModal(...)` namespace (file is IIFE-wrapped); silently threw `ReferenceError` on click. Fixed for all three functions (`_showObjModal`, `_closeObjModal`, `_submitObjection`) and added to `VoterPanel`'s exposed return object.
- **Stale election-status cache blocking rejection-appeal** — `showMyNominations()` only fetched the election object once per session and reused it on every subsequent visit, even after a status change (e.g. an upheld objection rolling `candidates_published` back to `scrutiny`). Now refetches fresh every time.
- **Nominations dropdown not re-evaluating** — `_onNomElecChange` updated the selected election ID and refreshed the list, but never re-rendered the shell, so the Manual Entry button's visibility (gated on `nominations_open`) stayed stuck reflecting whichever election loaded first. Fixed to re-render the shell on every change; dropdown `<option>` now also marks the correct `selected` attribute.
- **Verify-vote link resolved to sandboxed iframe URL** — receipt's "Verify this vote" link used `window.location.href`, which inside Apps Script's HtmlService resolves to the internal `googleusercontent.com` sandbox proxy, not the real deployment URL — produced a blank page. Added `App.deployUrl` (server-templated `<?= DEPLOY_URL ?>` in `Index.html`); VoterJS now uses it with a fallback.
- **Handover tab election selection reset on every revisit** — `_loadHandover()` always defaulted to `elections[0]` (sheet/creation order), discarding whatever election the RO had actually selected, including a fully-built but invisible Draw of Lots/Election Record section sitting under the wrong (draft) election. Now remembers the previous selection if still valid.
- **TEM Auth checklist drift** — `_temActionCheckboxes()` in `AdminJS.html` is a hand-maintained duplicate of `TEM_AUTHORISABLE_ACTIONS` in `Code.js`; `recordDrawOfLots` was missing from the UI list after being added to the enforcement list earlier in the same session. Synced; `generateElectionRecordPDF` and `createPreVoteBackup` added to both lists from the start this time. **Known structural issue, not fully resolved** — see Outstanding below.
- **PreSec checklist showing no election context** — screen displayed checklist data for whichever election was last opened via Elections→Manage with zero indication of which election that was; RO could mistake one election's completed checklist for another's. Added explicit "Showing checklist for: [Election] [status]" banner. Selection itself is still implicit (no dropdown) — see Outstanding below.
- **Manual nomination document upload silently orphaned** (found, not fixed — workaround exists) — the manual nomination form's document uploader runs before the nomination has an ID to link to (`nomRef` omitted), so documents upload but are never attributable to the nomination; Scrutiny page's own uploader (correctly passing `nomRef`) is the only path that actually works. Recommended fix: remove the non-functional uploader from the manual nomination form entirely.

### Outstanding (Carried Forward)
- FIX-8 / PHOTO-1 — Photo upload (tracked under two different IDs with conflicting priority — needs reconciling into one decision: build vs. defer for trial)
- FIX-13 — Declaration emails (design agreed, build deferred)
- Manual nomination document linking — see bug list above; fix not yet built
- TEM Auth checklist / `TEM_AUTHORISABLE_ACTIONS` structural drift — UI list should derive from a single shared source instead of being manually duplicated; band-aided again this session, not structurally resolved
- VoterJS portal has no link to public Results page (`?action=results`) once declared — only reachable via the public Landing Page
- PreSec checklist has no explicit election selector dropdown — banner added as a safety fix, selection still implicit/sticky
- SOP gap: no clause for the third-party nomination objection flow (OBJ-1 built in Session 47, SOP never updated to match) — pending EC circulation
- SOP gap: no cycle limit on repeated objection→appeal cycles for the same nomination — policy decision needed (recommended: Appeals Panel ruling final for the current election, covering both re-objection and re-appeal, not just re-appeal)
- Independent code audit — Terms of Reference drafted, auditor sourcing identified, remains a pre-live gate per Tech Spec §7.3
- Git consolidated commit — done this session; standing practice (commit at end of every session) to continue

### File Sizes (End of Session 48)
| File | Lines |
|---|---|
| Code.js | 10,808 |
| AdminJS.html | 6,547 |
| VoterJS.html | 1,798 |
| Index.html | 625 |
| ECOfficerJS.html | 888 |
| TutorialPage.html | 968 |
| LandingPage.html | 618 |
