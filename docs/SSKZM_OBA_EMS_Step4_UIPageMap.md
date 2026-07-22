# SSKZM OBA EMS — Step 4: UI Page Map
*Prepared: 27 May 2026 — Architecture Refactor Series*
*System B only. Step 3 Backend Function Map must be read alongside this document.*

---

## HOW TO READ THIS DOCUMENT

Each screen entry shows:
- **Screen ID** — used in Step 5 doGet routing
- **Screen name** — as the user sees it
- **File** — which HTML file it lives in
- **Tier(s)** — which access tiers see this screen
- **Description** — what it shows and what the user can do
- **Backend calls** — functions called (from Step 3 map)
- **Disposition** — CF (carry forward from System A), MOD (modify from System A), NEW (new for System B)

Disposition applies to the screen design and its backend calls. CF screens still call System B backend functions (new COL schema) but the UI logic is essentially unchanged.

---

## PART 1 — FILE STRUCTURE (System B)

System B uses six HTML files. All JS is included via `include()` — no external bundles.

| File | Purpose | Serves |
|---|---|---|
| `Index.html` | Main app shell — single entry point after login | All authenticated tiers |
| `LandingPage.html` | Public landing page | PUBLIC + unauthenticated entry |
| `VoterJS.html` | Voter-facing screens (included into Index) | VOTER |
| `AdminJS.html` | Admin panel (included into Index) | RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER, OBSERVER |
| `ECOfficerJS.html` | EC Officer panel (included into Index) | EC_OFFICER |
| `SharedJS.html` | Shared login flows, utilities (included into both templates) | All |

**Routing logic in `doGet()`:**
- No `action` parameter → serve `LandingPage.html`
- `action=login` or `action=app` → serve `Index.html` (routes internally by role after login)
- All nomination/consent/query action links → handled in `doGet()` directly, return standalone HTML pages
- `action=verifyToken` → standalone vote verification page

---

## PART 2 — PUBLIC / UNAUTHENTICATED SCREENS

These screens require no login. Served directly from `doGet()` or from `LandingPage.html`.

---

### S01 — Landing Page
**File:** LandingPage.html
**Tier:** PUBLIC
**Description:** Main public face of the EMS. Shows current election status, election timeline widget (all phases with dates, current phase highlighted), links to voter login and admin panel login. EC manages pre-handover content blocks; RO manages post-handover blocks via `LandingPageContent` sheet.
**Backend calls:** `getPublicElectionStatus()`, `getLandingPageContent(electionId)`, `getPublicSchedule(electionId)`
**Disposition:** MOD — existing landing page is rebuilt to read from LandingPageContent sheet and show ElectionSchedule timeline widget.

---

### S02 — Vote Receipt Verification Page
**File:** Standalone page (returned directly by `doGet()`)
**Tier:** PUBLIC
**Description:** Voter enters receipt token, system confirms a vote was recorded for that post. Does not reveal candidate chosen. Shows: token input, result (found / not found), post name, timestamp. Displayed on declaration.
**Backend calls:** `verifyReceiptToken(voteId)`
**Disposition:** CF — page design unchanged.

---

### S03 — Nomination Confirmation Page (Proposer / Seconder)
**File:** Standalone page (returned by `doGet()` on `action=confirmNom`)
**Tier:** PUBLIC (token-gated)
**Description:** Proposer or seconder clicks email link → enters Roll No to verify identity → confirms their role. Two steps: roll number form, then result page.
**Backend calls:** `confirmNomination(nominationId, role, token, rollNo)` (via `doGetNomAction`)
**Disposition:** CF — no change needed.

---

### S04 — Query Response Page (Candidate responds to RO query)
**File:** Standalone page (`action=queryResponse`)
**Tier:** PUBLIC (token-gated)
**Description:** Candidate receives RO query email → clicks link → enters response text → submits. Shows query text, response textarea, submit button.
**Backend calls:** `submitQueryResponse(queryId, responseToken, responseText)`
**Disposition:** CF — no change needed.

---

### S05 — EC Response Page (EC responds to RO referral)
**File:** Standalone page (`action=ecResponse`)
**Tier:** PUBLIC (token-gated)
**Description:** EC contact receives referral email → clicks link → enters response → submits. Shows referral text, response textarea.
**Backend calls:** `submitECResponse(nomId, token, responseText)`
**Disposition:** CF — no change needed.

---

### S06 — Candidate Consent Accept Page
**File:** Standalone page (`action=consentAccept`)
**Tier:** PUBLIC (token-gated)
**Description:** Phase 2 candidate receives consent request email → clicks Accept → result page shown.
**Backend calls:** `confirmCandidateConsent(nomId, token)`
**Disposition:** CF — no change needed.

---

### S07 — Candidate Consent Decline Page
**File:** Standalone page (`action=consentDecline`)
**Tier:** PUBLIC (token-gated)
**Description:** Phase 2 candidate clicks Decline → result page shown. Nomination lapses.
**Backend calls:** `declineCandidateConsent(nomId, token)`
**Disposition:** CF — no change needed.

---

## PART 3 — SHARED LOGIN SCREENS

Served from `Index.html` before session is established.

---

### S08 — Voter Login Step 1 (Roll No + Email)
**File:** SharedJS.html (rendered into Index)
**Tier:** Pre-authentication (any voter)
**Description:** Roll Number input + Registered Email input + Send OTP button. Shows links to Admin login and Documents page.
**Backend calls:** `sendOTP(rollNo, email, 'login')`
**Disposition:** MOD — adds LifeMember check (if NOT_ELIGIBLE error returned, show appropriate message and RO contact).

---

### S09 — Voter Login Step 2 (OTP Entry)
**File:** SharedJS.html
**Tier:** Pre-authentication
**Description:** Masked email confirmation, 6-digit OTP input, Verify button, Back button.
**Backend calls:** `verifyOTP(rollNo, otp)`
**Disposition:** CF — no change needed.

---

### S10 — Admin Login Step 1 (Admin ID + Email)
**File:** SharedJS.html
**Tier:** Pre-authentication (all admin tiers)
**Description:** Admin ID input + Registered Email input + Send OTP button. Single entry point for EC_OFFICER, RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER, OBSERVER. Back to voter login link.
**Backend calls:** `sendAdminOTP(adminId, email)` — now checks DISABLED status
**Disposition:** MOD — DISABLED accounts return specific error message ("Account has been deactivated. Contact the Returning Officer.").

---

### S11 — Admin Login Step 2 (OTP Entry)
**File:** SharedJS.html
**Tier:** Pre-authentication
**Description:** Masked email confirmation, OTP input, Verify button.
**Backend calls:** `verifyAdminOTP(adminId, otp)` — checks DISABLED after OTP match
**Disposition:** MOD — DISABLED check added; clear error message returned.

---

### S12 — Session Expired / Error Screen
**File:** SharedJS.html
**Tier:** Any
**Description:** Shown when session token is invalid or expired. Auto-redirects to login after 3 seconds.
**Backend calls:** None (client-side only)
**Disposition:** CF — no change needed.

---

## PART 4 — VOTER SCREENS

Rendered by VoterJS.html after successful VOTER login. Routing based on election status.

---

### S13 — Election Picker
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Shown when multiple elections are visible. Grid of election cards showing title, status badge, dates, CTA button. Voter selects election to enter.
**Backend calls:** `getElectionsForVoter()`
**Disposition:** CF — no change needed.

---

### S14 — No Election / Pre-Election Holding Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Shown when no election is active or visible. If a declared election exists, redirects to results. Otherwise shows "No election scheduled" message.
**Backend calls:** `getElectionsForVoter()`, `getDeclaredResults(token, null)`
**Disposition:** CF — no change needed.

---

### S15 — Nominations Open Screen (Phase 1)
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Election status card showing nominations are open. Buttons: Nominate Myself, Nominations Board, My Nominations. Shows nomination deadline.
**Backend calls:** `getElectionsForVoter()`
**Disposition:** MOD — add Nominations Board button (links to S22). Add Complaints button (links to S26).

---

### S16 — Nominations Open Phase 2 Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Election status card. Buttons: Nominate a Member, Nominations Board, My Nominations.
**Backend calls:** `getElectionsForVoter()`
**Disposition:** MOD — add Nominations Board button.

---

### S17 — Scrutiny Holding Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Status card: "Nominations Under Scrutiny." Buttons: My Nominations, Nominations Board (shows confirmed nominations only).
**Backend calls:** `getElectionsForVoter()`
**Disposition:** MOD — add Nominations Board button.

---

### S18 — Candidates Published Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Status card with candidate list and voting countdown. Buttons: View Candidates (Nominations Board), My Nominations. Shows voting open date/time.
**Backend calls:** `getElectionsForVoter()`, `getCandidatesForElection(electionId)` (for preview count)
**Disposition:** MOD — add countdown timer to voting open. Add Nominations Board link. Add withdrawal option if within withdrawal window.

---

### S19 — Active Ballot
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Full ballot. Progress bar (posts voted / total). Per-post cards with shuffled candidates (photo, name, roll, batch, bio). Vote, NOTA, Abstain options per post. Confirmation modal before submission. Receipt token banner after each vote. Voted posts show checkmark.
**Backend calls:** `getCandidatesForVoter(token, electionId)`, `getBallotStatus(token, electionId)`, `castVote(token, electionId, postName, candidateId)`
**Disposition:** MOD — add multi-seat display (for VP, Joint Secretary with SeatCount > 1, show "elect N" instruction). Receipt banner unchanged.

---

### S20 — Ballot Complete Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** "Thank you for voting!" completion card. Shows voter name, roll, total posts voted, anonymity reminder.
**Backend calls:** None (client-side, triggered when all posts done)
**Disposition:** CF — no change needed.

---

### S21 — Voting Paused Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Status card: "Voting Temporarily Paused." Shows RO contact email if set.
**Backend calls:** `getElectionsForVoter()`
**Disposition:** CF — no change needed.

---

### S22 — Nominations Board
**File:** VoterJS.html
**Tier:** VOTER (and PUBLIC after declaration)
**Description:** Publicly visible list of confirmed nominations. Visible from `nominations_open` status onward. Shows: post name, candidate name, bio, photo. No roll numbers, no proposer/seconder identity. Grouped by post in EC_POSTS order. Phase 1 consent implicit — shown as soon as prop+sec confirmed. Phase 2 — shown when candidate consent accepted + prop + sec confirmed. Back button.
**Backend calls:** `getNominationsBoard(token, electionId)` (new)
**Disposition:** NEW — does not exist in System A.

---

### S23 — Nomination Form (Phase 1 — Self-nomination)
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Post selector (posts already nominated disabled), Proposer Roll No (with look-up), Seconder Roll No (with look-up), Bio textarea, Declaration checkbox, Submit button. Eligibility declaration required before submission.
**Backend calls:** `getElectionForVoter()`, `getMyNominations(token, electionId)`, `lookupVoterName(rollNo)`, `submitNomination(token, data)`
**Disposition:** MOD — post list read from `getECPosts()` not hardcoded. One-post check at submission returns clear error.

---

### S24 — Nomination Form (Phase 2 — Nominate another)
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Post selector, Candidate Roll No (with look-up), Seconder Roll No (optional, with look-up), Bio textarea, Submit button. You are recorded as proposer.
**Backend calls:** `getElectionForVoter()`, `getECPosts()`, `lookupVoterName(rollNo)`, `submitNomination_Phase2(token, data)`
**Disposition:** CF — minor: post list from `getECPosts()`.

---

### S25 — My Nominations Dashboard
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Lists all nominations where caller is candidate or proposer. Per-nomination card: post, status badge, proposer/seconder confirmed indicators, submitted date, rejection reason (if rejected). Actions: Withdraw (within withdrawal window), Add Seconder (for Phase 2 pending confirmation), + New Nomination button. Status labels in plain English.
**Backend calls:** `getElectionForVoter()`, `getMyNominations(token, electionId)`, `withdrawNomination(token, nomId)`, `addSeconder(token, nominationId, seconderRoll)`
**Disposition:** MOD — add Add Seconder action. Add withdrawal deadline lock (disable withdraw if past deadline).

---

### S26 — Complaints Filing Form
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Voter files a Code of Conduct complaint. Fields: complaint category (dropdown), complaint text (textarea), Submit button. Confirmation message with reference ID after submission.
**Backend calls:** `getElectionForVoter()`, `fileComplaint(token, electionId, category, complaintText)`, `getMyComplaints(token, electionId)` (to show filed complaints)
**Disposition:** NEW — does not exist in System A.

---

### S27 — Voting Closed Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Status card: "Voting window has closed. Results will be declared by the Returning Officer."
**Backend calls:** `getElectionsForVoter()`
**Disposition:** CF — no change needed.

---

### S28 — Declared Results Screen
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Per-post results cards. Elected candidate starred. Vote counts shown per result visibility setting (winners only / counts / full tally). NOTA row shown if NOTA votes exist. Receipt token verification link at bottom.
**Backend calls:** `getDeclaredResults(token, electionId)`
**Disposition:** MOD — add multi-seat elected display (top N candidates marked as elected for posts with SeatCount > 1).

---

### S29 — Documents Page
**File:** VoterJS.html
**Tier:** VOTER
**Description:** Links to published election documents (SOP, nomination form, candidate list). Read-only. Documents served from GDrive links in DocStore.
**Backend calls:** `getUploadedDocuments(token, electionId, 'election_record')` (and other public categories)
**Disposition:** MOD — extend to show election schedule and current phase timeline.

---

## PART 5 — EC OFFICER SCREENS

Rendered by ECOfficerJS.html after EC_OFFICER login. Auto-disabled at handover — server enforces.

---

### S30 — EC Officer Panel — Overview
**File:** ECOfficerJS.html
**Tier:** EC_OFFICER
**Description:** Landing panel for EC Officer login. Shows current election setup status, handover checklist progress, recent messages from/to RO. Tab bar: Overview | Voter Roll Draft | Landing Page | Messages | Email Verification.
**Backend calls:** `getECOfficerPanel(token)`, `getMessages(token)`, `getHandoverChecklist(token, electionId)`
**Disposition:** NEW

---

### S31 — EC Officer Panel — Voter Roll Draft Upload
**File:** ECOfficerJS.html
**Tier:** EC_OFFICER
**Description:** Upload CSV with voter roll draft. Shows current upload status, row count, verification category breakdown. Upload button replaces previous draft. Blocked if objection window is open. Shows upload history.
**Backend calls:** `uploadVoterRollDraft(token, rows)`, `getVoterRollDraft(token, 1, '')` (summary)
**Disposition:** NEW

---

### S32 — EC Officer Panel — Landing Page Content Editor
**File:** ECOfficerJS.html
**Tier:** EC_OFFICER
**Description:** Editable content blocks for the public landing page — election notice text, key dates, contact details, any blocks marked EditableBy=EC_OFFICER or BOTH. Save button per block. Preview link.
**Backend calls:** `getLandingPageContent(electionId)`, `updateLandingPageContent(token, data)`
**Disposition:** NEW

---

### S33 — EC Officer Panel — Handover Messages
**File:** ECOfficerJS.html
**Tier:** EC_OFFICER
**Description:** Compose and send handover messages to RO. List of sent/received messages with acknowledged status. Subject + body text. Send button.
**Backend calls:** `sendHandoverMessage(token, subject, messageText)`, `getMessages(token)`, `acknowledgeMessage(token, messageId)`
**Disposition:** NEW

---

### S34 — EC Officer Panel — Email Verification Tool
**File:** ECOfficerJS.html
**Tier:** EC_OFFICER
**Description:** Status-gated tool (active only pre-handover). Voter enters Roll No + email to check if they are on the voter roll and if email matches. Returns: found / not found / email mismatch — no sensitive data shown. Auto-disabled at handover (EC_OFFICER accounts DISABLED).
**Backend calls:** `checkAlumniAccess(rollNo, email)` (reads master OBA sheet)
**Disposition:** MOD — currently on landing page in System A. Moved to EC Officer panel per Section 4.11 decision.

---

## PART 6 — ADMIN PANEL SCREENS (RO_ADMIN / DEPUTY_RO / TEM)

Rendered by AdminJS.html. All three tiers see the same tab bar. TEM's write actions are gated by AuthorisationID — the UI shows an AuthID input where required.

**TEM UI note:** When a TEM session is active, every write action button shows an additional "AuthorisationID" input field before the action can be submitted. Read-only tabs and views show no AuthID prompt. The RO Authorisations tab is visible to RO_ADMIN only (not TEM or DEPUTY_RO).

---

### S35 — Admin Panel — Elections Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** Table of all elections (title, status, dates, actions). Create New Election button. Per-election Manage button opens management modal: status selector (full status flow), eligibility settings (BatchRep restriction, OrgSecy restriction + batch year, result visibility, min required posts, EC contact email), voting dates, V-day, election mode, trial flag. Delete button (non-active/declared only). Threshold override modal for mandatory posts gate.
**Backend calls:** `getAllElections(token)`, `createElection(token, data)`, `updateElectionStatus(token, electionId, status, overrideNote)`, `updateElectionSettings(token, electionId, settings)`, `updateElectionDates(token, electionId, startDate, endDate)`, `deleteElection(token, electionId)`, `checkCandidateCoverage(token, electionId)`, `checkMinimumPostsThreshold(token, electionId)`
**Disposition:** MOD — add V-day field, ElectionMode selector (electronic / physical), TrialElection toggle, BypassFloors toggle (only enabled when TrialElection=TRUE). Status flow extended with new statuses. VP group check logic in threshold display.

---

### S36 — Admin Panel — Election Schedule Sub-panel
**File:** AdminJS.html (within Elections tab or separate sub-tab)
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** V-day based schedule builder. RO sets V-day and system derives or RO sets: voting close, declaration day, linked SGM date, nomination deadline, scrutiny window. All shown as V minus N days. Save button.
**Backend calls:** `setElectionSchedule(token, electionId, scheduleData)`, `getElectionSchedule(token, electionId)`
**Disposition:** NEW

---

### S37 — Admin Panel — Nominations Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** Election selector. Table of all nominations (post, candidate, proposer ✓/⏳, seconder ✓/⏳, method icon, status badge). Actions per row: Scrutinise (if confirmed/accepted), Resend proposer/seconder email, Withdraw. Manual Entry button (nominations_open statuses only). Phase 2 Extension button.
**Backend calls:** `getAllElections(token)`, `getNominations(token, electionId)`, `withdrawNomination(token, nomId)`, `resendConfirmationEmail(token, nomId, role)`, `triggerPhase2Extension(token, electionId, overrideNote)`, `submitNomination(token, data)` (manual RO entry)
**Disposition:** MOD — add Phase 2 Extension button. Remove CSV import (deprecated). Add consent status column for Phase 2 nominations. Add DuplicateDeclined indicator.

---

### S38 — Admin Panel — Scrutiny Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** Election selector. Two sections: Pending Scrutiny (confirmed nominations awaiting checklist) and Completed (accepted/rejected). Clicking a nomination opens the detail panel: candidate info grid, full scrutiny checklist (7 criteria, Yes/No/N/A/Pending buttons, notes field, ⓘ bylaw reference button), query panel, EC referral panel, document upload slots (3 for manual_ro), accept/reject buttons with gate enforcement. Eligibility auto-check display (from ECOfficerBoardDatabase).
**Backend calls:** `getNominations(token, electionId)`, `getScrutinyData(token, nomId)`, `saveScrutinyItem(token, nomId, checkItem, checkResult, notes)`, `sendNomQuery(token, nomId, queryText)`, `sendECReferral(token, nomId, referralText, checkItem)`, `acceptNomination(token, nomId)`, `rejectNomination(token, nomId, reason)`, `uploadNominationDocument(token, nomId, fileName, fileDataBase64, mimeType)`, `getNomDocuments(token, nomId)`, `checkEligibilityAutomatic(token, rollNo, postName, electionId)` (advisory, new)
**Disposition:** MOD — add eligibility auto-check advisory panel. Add `rejectNomination` AdminLog (missing in System A). Add appeal reinstatement display (if nomination was reinstated by appeal, show banner).

---

### S39 — Admin Panel — Candidates Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** Election selector. Final candidate list grouped by post (order, seat count, candidate rows). Per-post: contested/uncontested/vacant status. Actions: delete candidate (blocked post-candidates_published). Candidate list summary report button. Physical mode candidates list export button.
**Backend calls:** `getAllElections(token)`, `getCandidatesForElection(electionId)`, `getFinalCandidateListSummary(token, electionId)`, `deleteCandidate(token, candidateId)`
**Disposition:** MOD — add seat count display per post. Add contested/uncontested/vacant badge. Add physical mode export button. Remove add/import buttons (all candidates come from accepted nominations).

---

### S40 — Admin Panel — Voter List Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM (full — email shown), SCRUTINEER (Roll, Name, Batch only)
**Description:** Paginated voter list (50/page) with search. Roll No, Name, Batch, Email (RO only), LifeMember status, EmailVerificationStatus. CSV upload for voter roll import (redirects to VoterRollDraft in System B). Total count display.
**Backend calls:** `getVoterList(token, page, search)`, `getVoterCount(token)`, `importVoterRoll(token, rows)` (now writes to VoterRollDraft)
**Disposition:** MOD — add LifeMember and EmailVerificationStatus columns. Import now targets VoterRollDraft with clear labelling.

---

### S41 — Admin Panel — Voter Roll Draft Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN
**Description:** Shown during voter roll certification phase. Table of VoterRollDraft rows with objection status per row. Filters: all / objected / pending. Per-row action: update objection status (retained / removed) with notes. Certification button (blocked if any unresolved objections). Certification logs to AdminLog and copies approved rows to Voters.
**Backend calls:** `getVoterRollDraft(token, page, search)`, `updateObjectionStatus(token, rollNo, status, notes)`, `certifyVoterRoll(token, electionId)`
**Disposition:** NEW

---

### S42 — Admin Panel — Tally Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER
**Description:** Live tally (RO/TEM/DEPUTY_RO: full tally with candidate names and vote counts; blackout during active status — shows participation only). Post-close: full tally with winner marking. Tally co-sign button (SCRUTINEER + RO). Per-post participation vs votes cast vs abstentions. Voted Log summary (unique voters, % turnout). Tally export / Election Record generation button (RO only).
**Backend calls:** `getLiveTally(token, electionId)`, `getVotedLogSummary(token, electionId)`, `getVoterCount(token)`, `recordTallyCoSign(token, electionId, confirmation)`, `generateElectionRecord(token, electionId)`
**Disposition:** MOD — add multi-seat winner marking (top N per SeatCount). Add participation vs votes vs abstentions three-way display. Tally blackout during active status carried forward.

---

### S43 — Admin Panel — AdminLog Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER (full read — no filter)
**Description:** Paginated AdminLog table (100/page). Columns: Timestamp, AdminID, ActionType, Description, OldValue, NewValue. Filter by ActionType. Filter by election ID. Export to CSV button. Read-only — no edit/delete. Prominent "append-only audit record" notice.
**Backend calls:** `getAdminLog(token, electionId)` (new)
**Disposition:** NEW (not yet built in System A for SCRUTINEER; exists implicitly in election record PDF only).

---

### S44 — Admin Panel — Admins Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN only (DEPUTY_RO and TEM cannot manage admins)
**Description:** Table of all admin accounts (AdminID, Name, Role, Email, RollNo, Status, DeputyROActivated). Actions: Add Admin (form modal — all tiers), Disable Admin (with confirmation). Deputy RO section: Activate / Deactivate buttons (witnessed action — confirmation modal with AdminLog note prompt).
**Backend calls:** `getAdminList(token)`, `addAdmin(token, adminData)`, `disableAdmin(token, adminId)`, `activateDeputyRO(token, adminId)`, `deactivateDeputyRO(token, adminId)`
**Disposition:** NEW

---

### S45 — Admin Panel — TEM Authorisations Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN only
**Description:** Issue new AuthorisationID: scope selector (Specific Actions / ALL ACTIONS), multi-select dropdown of all TEM_AUTHORISABLE_ACTIONS grouped by category, optional expiry, notes field, Issue button → returns AuthID to display/copy. Active AuthIDs table: AuthID, IssuedAt, Scope, ActionTypes, UsedCount, Status, Revoke button. History of all authorisations.
**Backend calls:** `recordROAuthorisation(token, electionId, scope, actionTypes, notes)`, `revokeROAuthorisation(token, authId)`, `getTEMAuthHistory(token, electionId)`
**Disposition:** NEW

---

### S46 — Admin Panel — Handover Checklist Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, SCRUTINEER
**Description:** Interactive checklist for EC → RO handover. Items: EC_OFFICER accounts locked (Disable All EC Accounts button for RO), voter roll certified, sheet protections applied, scrutineer confirmations Part A recorded, version verified. Each item shows: status (done / pending), action button where applicable, AdminLog timestamp when done. Scrutineer Part A / Part B confirmation buttons (SCRUTINEER role).
**Backend calls:** `getHandoverChecklist(token, electionId)`, `lockECOfficers(token)`, `applySheetProtections(token)`, `recordScrutineerConfirmation(token, electionId, part, confirmationText)`, `getAdminLog(token, electionId)` (to confirm actions done)
**Disposition:** NEW

---

### S47 — Admin Panel — Complaints Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO, TEM
**Description:** Table of all complaints (ID, filed by, category, status, filed at). Per-complaint detail: complaint text, update status (under review / resolved / dismissed), response text field. AdminLog shows all updates.
**Backend calls:** `getComplaints(token, electionId)`, `updateComplaintStatus(token, complaintId, status, response)`
**Disposition:** NEW

---

### S48 — Admin Panel — Appeals Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, DEPUTY_RO
**Description:** Table of appeals (nomination ID, candidate, post, status, filed at). Per-appeal detail: appeal text, nomination rejection reason, nomination history from ScrutinyLog. Decision panel: Upheld / Dismissed, decision text. Upheld decision automatically reinstates nomination and candidate (with D-V6 warning prompt). AdminLog records all.
**Backend calls:** `getAppeals(token, electionId)`, `updateAppealDecision(token, appealId, decision, decisionText)`
**Disposition:** NEW

---

### S49 — Admin Panel — Observations Tab
**File:** AdminJS.html (also visible in SCRUTINEER / OBSERVER panels)
**Tier:** RO_ADMIN, DEPUTY_RO, TEM (full), SCRUTINEER (submit + own + non-private), OBSERVER (own + RO replies)
**Description:** Submit new observation (text, private toggle). Table of observations (from date, submitter, text preview, RO reply status). Click to expand full observation + RO reply. RO respond button (RO only).
**Backend calls:** `submitObservation(token, electionId, observationText, isPrivate)`, `getObservations(token, electionId)`, `respondToObservation(token, observationId, responseText)`
**Disposition:** NEW

---

### S50 — Admin Panel — Messages Tab
**File:** AdminJS.html (also visible in EC_OFFICER panel as S33)
**Tier:** RO_ADMIN, DEPUTY_RO (read), TEM (read)
**Description:** Thread view of handover messages between EC and RO. Acknowledge button per message (RO). Shows acknowledged status and timestamp.
**Backend calls:** `getMessages(token)`, `acknowledgeMessage(token, messageId)`
**Disposition:** NEW

---

### S51 — Admin Panel — EC Board Database Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN only
**Description:** View/import past 15 years EC officer history for eligibility checking. Table: Roll No, Name, Post, Year, ElectionID. CSV import button. Gap indicator (O1: gaps treated as neutral).
**Backend calls:** `getECOfficerHistory(token, rollNo)`, `importECOfficerHistory(token, rows)`
**Disposition:** NEW

---

### S52 — Admin Panel — System / Version Tab
**File:** AdminJS.html
**Tier:** RO_ADMIN, TEM
**Description:** Shows deployed script version, GitHub commit hash comparison, sheet protection status, last AdminLog timestamp. Appendix J checklist runner. Manual backup trigger.
**Backend calls:** `getDeployUrl()`, `applySheetProtections(token)`, `createManualBackup()`
**Disposition:** MOD — add GitHub commit hash comparison field. Add Appendix J checklist items.

---

## PART 7 — SCRUTINEER PANEL SCREENS

Scrutineer sees a restricted tab bar: AdminLog | Scrutiny (read-only) | Live Tally | Voted Log | Voter List | Observations | Handover Checklist | Messages.

---

### S53 — Scrutineer — Scrutiny Read-Only View
**File:** AdminJS.html
**Tier:** SCRUTINEER
**Description:** Read-only view of finalised nominations (accepted and rejected). No checklist interaction — checklist items shown read-only. No accept/reject buttons. No query panel. Shows: candidate, post, status, rejection reason (if rejected), scrutiny checklist decisions.
**Backend calls:** `getNominations(token, electionId)`, `getScrutinyData(token, nomId)` (read-only render)
**Disposition:** MOD — extend to show checklist items read-only. Currently shows only nomination list.

---

### S54 — Scrutineer — Voted Log Tab
**File:** AdminJS.html
**Tier:** SCRUTINEER
**Description:** VotedLog summary — unique voter count, per-post participation count. No individual voter identities shown beyond what VotedLog contains (Roll No, Post, Timestamp). This IS the participation integrity check screen.
**Backend calls:** `getVotedLogSummary(token, electionId)`, `getVoterCount(token)`
**Disposition:** CF — no change needed.

---

## PART 8 — OBSERVER PANEL SCREENS

Observer sees: Live Dashboard | Nominations Board (read-only) | Results (after declaration) | Observations | Messages.

---

### S55 — Observer — Live Dashboard
**File:** AdminJS.html
**Tier:** OBSERVER
**Description:** Real-time turnout display (aggregate %, per-post participation counts, voted vs abstained per post). Three integrity checks (A, B, C). Server time sync bar. Auto-refresh 60s. No live vote distribution — participation only.
**Backend calls:** `getObserverDashboard(token, electionId)`, `getAllElections(token)`
**Disposition:** MOD — add ElectionSchedule display (current phase, time remaining). Integrity check display unchanged.

---

## PART 9 — TOKEN-GATED STANDALONE PAGES (doGet handlers)

These are not role-tier pages — they are URL-accessed pages with one-time tokens embedded in the link. They return standalone HTML pages, not the SPA shell.

| Screen ID | Action param | Description | Backend call |
|---|---|---|---|
| S02 | `verifyToken` | Vote receipt verification | `buildVerifyTokenPage(voteId)` |
| S03 | `confirmNom` + `submitConfirmNom` | Proposer/seconder confirmation | `confirmNomination(...)` |
| S04 | `queryResponse` + `submitQueryResp` | Candidate query response | `submitQueryResponse(...)` |
| S05 | `ecResponse` + `submitECResp` | EC referral response | `submitECResponse(...)` |
| S06 | `consentAccept` | Candidate consent accept | `confirmCandidateConsent(...)` |
| S07 | `consentDecline` | Candidate consent decline | `declineCandidateConsent(...)` |

All six carry forward unchanged from System A.

---

## PART 10 — SCREEN COUNT SUMMARY

| Category | Screens | CF | MOD | NEW |
|---|---|---|---|---|
| Public / unauthenticated | 7 | 5 | 1 | 1 |
| Shared login | 5 | 3 | 2 | 0 |
| Voter | 17 | 6 | 7 | 4 |
| EC Officer | 5 | 0 | 1 | 4 |
| Admin Panel (RO/TEM/Deputy RO) | 18 | 0 | 8 | 10 |
| Scrutineer-specific | 2 | 1 | 1 | 0 |
| Observer-specific | 1 | 0 | 1 | 0 |
| **Total** | **55** | **15** | **21** | **19** |

---

## PART 11 — OPEN ITEMS FOR SHELLEY (not blocking Step 5)

1. **Physical mode candidates list export (S39):** What format — CSV download or a generated PDF? This determines whether it's a frontend download or a GDrive file generation.

2. **Scrutineer Confirmation (S46):** Part A is the pre-vote confirmation (code/data verified). Part B is the post-count confirmation (tally verified). Should these appear on the Handover Checklist tab or as a separate Scrutineer Confirmation tab? Currently proposed as part of S46.

3. **Observer nominations board (S55):** Should Observers see the full Nominations Board (same as S22), or only a read-only version accessible from their dashboard? Proposed: same S22 component, rendered read-only.

4. **TEM AuthID prompt placement (S35–S52):** The AuthID input before each write action could be: (a) an inline input field that appears above the action button when TEM is logged in, or (b) a persistent AuthID entry bar at the top of the panel that TEM enters once per session for a given scope. Option (b) is cleaner for TEM UX when scope=ALL_ACTIONS. Proposed: option (b) — persistent bar, grayed when no valid AuthID entered.

5. **Appendix J checklist (S52):** The checklist items are in the SOP. Do you want these hardcoded in the UI or managed from a sheet? Proposed: hardcoded in UI for now, noted as future configurable.

---

*Step 4 complete. Step 5 is the doGet() Routing Design.*
*No code written in this step. Design only.*
