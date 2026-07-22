# SSKZM OBA EMS — Step 3: Backend Function Map
*Prepared: 27 May 2026 — Architecture Refactor Series*
*Sessions 17 + 18 decisions locked. No code written in this step.*

---

## HOW TO READ THIS DOCUMENT

Each section groups functions by module. For existing functions, the disposition column is:

- **CF** — Carry Forward unchanged. Lift verbatim from current Code.gs.
- **MOD** — Surgical modification required. Core logic unchanged; specific additions listed.
- **DEP** — Deprecated. Do not carry forward. Reason stated.
- **DT** — Demo / Test function. Move to a separate DemoData.gs or TestFunctions.gs file; not part of production Code.gs.

For new functions, the section states: access tier(s), sheets touched, AdminLog action type logged (if any), and purpose.

**Trust architecture flags** are called out inline where a function touches the Votes/VotedLog boundary or the EC lockout architecture.

---

## PART 1 — EXISTING FUNCTIONS: COMPLETE INVENTORY AND DISPOSITION

---

### 1.1 Infrastructure / Routing

| Function | Disposition | Notes |
|---|---|---|
| `doGet(e)` | **MOD** | Add new URL actions: `consentAccept`, `consentDecline`, `complaint`, `appeal`, `observation`, `roPanel`. Route landing page, voter, and admin correctly per new tier model. |
| `include(filename)` | **CF** | No change. |
| `doGetNomAction(e)` | **MOD** | Add handlers for: `consentAccept`, `consentDecline`. Existing `confirmNom`, `submitConfirmNom`, `queryResponse`, `ecResponse`, `submitQueryResp`, `submitECResp` retained. |

---

### 1.2 Core Utility

| Function | Disposition | Notes |
|---|---|---|
| `getSheet(name)` | **CF** | No change. |
| `sheetData(name)` | **CF** | No change. |
| `generateId()` | **CF** | No change. |
| `generateOTP()` | **CF** | No change. |
| `hashOTP(otp)` | **CF** | No change. |
| `now()` | **CF** | No change. |
| `parseDate(val)` | **CF** | No change. |
| `maskEmail(email)` | **CF** | No change. |
| `escapeHtml(str)` | **CF** | No change. |
| `isElectionActive(row)` | **MOD** | Extend to read `ElectionMode` column (new col 18 on Elections). Physical mode: active check ignores StartDate/EndDate (physical is managed by TEM on-day only). |
| `getBatchGroup(batchYear)` | **CF** | No change. |
| `getECPosts()` | **MOD** | Change to read from ElectionSchedule/post config rather than hardcoded `EC_POSTS` array. Interim: keep hardcoded array but add seat count to each entry for multi-seat posts. |

---

### 1.3 Session Management

| Function | Disposition | Notes |
|---|---|---|
| `createSession(rollNo, role)` | **CF** | No change. |
| `getSession(token)` | **CF** | No change. |
| `deleteSession(token)` | **CF** | No change. |
| `logout(token)` | **CF** | No change. |

---

### 1.4 Email — Delivery Engine

| Function | Disposition | Notes |
|---|---|---|
| `sendEmailViaSendGrid(to, subject, htmlBody)` | **CF** | Name retained for backward compatibility. Engine is Brevo with MailApp fallback. No change. |

---

### 1.5 Email — Template Builders

| Function | Disposition | Notes |
|---|---|---|
| `buildOTPEmail(name, otp, purpose)` | **CF** | No change. |
| `buildVerificationEmail(name, rollNo, batch)` | **CF** | No change. Used by pre-election voter verification. |
| `buildNomConfirmEmail(voterName, candidateName, postName, confirmUrl, role, deadline)` | **CF** | This is the correct, current version. Carry forward. |
| `buildNomAckEmail(candidateName, postName, nomId, propRoll, secRoll, deadline)` | **CF** | No change. |
| `buildNomFullyConfirmedEmail(candidateName, postName, nomId)` | **CF** | No change. |
| `buildNominationConfirmEmail(...)` | **DEP** | Older duplicate of `buildNomConfirmEmail` with different signature. Merge: ensure all callers use `buildNomConfirmEmail`. Remove this version. |
| `buildConsentEmail(candName, nominatorName, postName, elecTitle, acceptUrl, declineUrl)` | **CF** | No change. |
| `buildQueryEmail(...)` | **CF** | No change. |
| `buildECReferralEmail(...)` | **CF** | No change. |
| `buildAcceptanceEmail(candidateName, postName)` | **CF** | No change. |
| `buildRejectionEmail(candidateName, postName, reason)` | **CF** | No change. |
| `buildVerifyTokenPage(voteId)` | **CF** | No change. Standalone HTML page. |
| `buildConfirmRollForm(nomId, role, token)` | **CF** | No change. |
| `buildConfirmResultPage(res, role)` | **CF** | No change. |
| `buildQueryResponseForm(queryId, token)` | **CF** | No change. |
| `buildECResponseForm(nomId, token)` | **CF** | No change. |
| `buildConsentResultPage(res, action)` | **CF** | No change. |

---

### 1.6 OTP — Send and Verify

| Function | Disposition | Notes |
|---|---|---|
| `sendOTP(rollNo, email, purpose)` | **MOD** | Add: check Voters sheet for `LifeMember` status (new col 9); if LifeMember=FALSE, return `NOT_ELIGIBLE` error with appropriate message. Everything else unchanged. |
| `sendAdminOTP(adminId, email)` | **MOD** | Add: check Admins `Status` field (new col 7). If `DISABLED`, return `ACCOUNT_DISABLED` error — do not send OTP. |
| `verifyOTP(rollNo, otp)` | **CF** | No change. Core logic correct. |
| `verifyAdminOTP(adminId, otp)` | **MOD** | Add: check Admins `Status` field after finding admin. If `DISABLED`, delete OTP row and return `ACCOUNT_DISABLED`. **Critical for EC lockout architecture.** |

---

### 1.7 Lookup Functions

| Function | Disposition | Notes |
|---|---|---|
| `findVoter(rollNo)` | **MOD** | Add `lifeMember` field to returned object (reads new Voters col 9). |
| `findAdmin(adminId)` | **MOD** | Add `status`, `disabledAt`, `disabledBy`, `deputyROActivated` fields to returned object (reads new Admins cols 7–10). |
| `getAdminRole(adminId)` | **MOD** | After finding admin, check `status === 'DISABLED'` — return `null` if disabled (same as not found, for access-denied purposes). |
| `getRoContactEmail()` | **CF** | No change. |
| `lookupVoterName(rollNo)` | **CF** | No change. |
| `checkAlumniAccess(rollNo, email)` | **CF** | No change. Reads master OBA sheet. |

---

### 1.8 Role / Permission Helpers

| Function | Disposition | Notes |
|---|---|---|
| `isRoRole(role)` | **MOD** | Currently returns true for `RO_ADMIN`, `SCRUTINEER`, `OBSERVER`. Extend to return true for `DEPUTY_RO` and `TEM` as well. `EC_OFFICER` is NOT an RO-tier role — EC_OFFICER accesses a separate, limited panel only. |
| `getVoterEligibility(batchYear, election)` | **MOD** | Add seat count awareness: for multi-seat posts (VP, Joint Secretary), eligibility logic unchanged but the returned `eligiblePosts` must not deduplicate — voter is eligible for all configured seats of that post type. Read seat count from new Candidates/post config, not hardcoded. |

---

### 1.9 Elections

| Function | Disposition | Notes |
|---|---|---|
| `getActiveElection()` | **CF** | No change. `isElectionActive` handles mode logic. |
| `getElectionForVoter()` | **CF** | No change. |
| `getElectionsForVoter()` | **CF** | No change. |
| `getAllElections(token)` | **CF** | No change. Access: RO-tier. |
| `buildElectionObj(row)` | **MOD** | Add new fields for all new Elections columns (cols 18–26): `electionMode`, `trialElection`, `bypassFloors`, `vDay`, `votingCloseDay`, `declarationDay`, `electionModePhysical`, `linkedSGMDate`, `seatConfig`. |
| `createElection(token, data)` | **MOD** | Write new columns (18–26) in appendRow. Access: `RO_ADMIN` only. AdminLog: `election_created`. |
| `updateElectionStatus(token, electionId, status, overrideNote)` | **MOD** | (1) Add `nominees_published` to valid statuses list — this is the new status between `scrutiny` and `candidates_published` when the nominations board goes public before final acceptance closes. (2) **72-hour floor**: on `candidates_published → active` transition, check `ElectionSchedule.candidatesPublishedAt`; if fewer than 72 hours have elapsed and `BypassFloors=FALSE`, block with floor error. `BypassFloors=TRUE` is only permitted when `TrialElection=TRUE`. (3) Existing min-posts threshold gate: retained unchanged. AdminLog: `status_change`. |
| `updateElectionSettings(token, electionId, settings)` | **MOD** | Extend to write new columns (18–26) when present in `settings`. Access: `RO_ADMIN`. |
| `updateElectionDates(token, electionId, startDate, endDate)` | **CF** | No change. |
| `deleteElection(token, electionId)` | **MOD** | Add: also clear rows from `VoterRollDraft`, `Complaints`, `Appeals`, `Observations`, `Messages`, `ElectionSchedule` for this electionId. Guard unchanged (no delete if active/declared). AdminLog: add `election_deleted` log entry. |
| `triggerPhase2Extension(token, electionId, overrideNote)` | **CF** | No change. AdminLog: `nomination_extension_triggered`. |
| `checkMinimumPostsThreshold(token, electionId)` | **CF** | No change. |

---

### 1.10 Candidates

| Function | Disposition | Notes |
|---|---|---|
| `getCandidatesForElection(electionId)` | **MOD** | Add seat count field to each post object. Read `SeatCount` from new Candidates col 9 (or from Elections `seatConfig`). Posts seeded from `EC_POSTS` — no change to seeding logic. |
| `getCandidatesForVoter(token, electionId)` | **CF** | No change to core logic. `getVoterEligibility` modification handles multi-seat correctly. |
| `addCandidate(token, data)` | **MOD** | Write new Candidates columns 9–12 (SeatCount, NominationId, ScrutinyAcceptedAt, ScrutinyAcceptedBy). Access: `RO_ADMIN`. |
| `deleteCandidate(token, candidateId)` | **MOD** | Block delete if election status is `candidates_published`, `active`, `closed`, or `declared`. Add AdminLog: `candidate_deleted`. |
| `importCandidates(token, electionId, rows)` | **MOD** | Block if election status is not `draft` or `scrutiny`. Add AdminLog: `candidates_imported`. |
| `checkCandidateCoverage(token, electionId)` | **CF** | No change. |
| `getFinalCandidateListSummary(token, electionId)` | **CF** | No change. |

---

### 1.11 Voting

| Function | Disposition | Notes |
|---|---|---|
| `getBallotStatus(token, electionId)` | **CF** | No change. |
| `castVote(token, electionId, postName, candidateId)` | **CF** | **⚠️ TRUST ARCHITECTURE: Do not modify this function under any circumstances.** Votes/VotedLog separation is inviolable. Physical vote entry for TEM is a separate new function (`recordPhysicalVote`) that wraps this one after TEM authorisation verification. |
| `verifyReceiptToken(voteId)` | **CF** | No change. Public, no session required. |

---

### 1.12 Tally and Results

| Function | Disposition | Notes |
|---|---|---|
| `getLiveTally(token, electionId)` | **CF** | No change. Access: RO-tier. |
| `getPublicResults(electionId)` | **CF** | No change. Public. |
| `buildTally(electionId)` | **MOD** | Add multi-seat logic: for posts with `SeatCount > 1`, mark top N candidates as elected (where N = SeatCount). Tally output per post must include `seatCount` field. Core Votes/VotedLog read logic unchanged. |
| `getDeclaredResults(token, electionId)` | **CF** | No change. Access: any session. |

---

### 1.13 Voter Management

| Function | Disposition | Notes |
|---|---|---|
| `getVoterCount(token)` | **CF** | No change. Access: RO-tier. |
| `getVotedLogSummary(token, electionId)` | **CF** | No change. Access: RO-tier. |
| `getVoterList(token, page, search)` | **MOD** | Add new Voters cols (9: LifeMember, 10: EmailVerification) to returned object for `RO_ADMIN` role. SCRUTINEER view: no change (roll, name, batch only). |
| `importVoterRoll(token, rows)` | **MOD** | **Redirect target: write to `VoterRollDraft`, not directly to `Voters`.** VoterRollDraft rows include the 3 new columns (UploadedAt, ObjectionStatus, VerificationCategory). Safety block on active election: retained. AdminLog: `voter_roll_draft_uploaded`. Access: `RO_ADMIN` and `EC_OFFICER` (EC_OFFICER can upload draft pre-handover; RO certifies post-handover). |
| `sendTestMailToAllVoters()` | **DEP** | Belongs to the separate voter verification app (outside EMS per Session 17 decisions). Remove from Code.gs. |

---

### 1.14 Nominations — Phase 1

| Function | Disposition | Notes |
|---|---|---|
| `submitNomination(token, data)` | **MOD** | Add: write new Nominations cols 29 (OnePostCheck=FALSE at submission, checked at acceptance), 30 (Phase2Flag=FALSE), 31 (DuplicateDeclined=FALSE). Check one-post-per-person rule at submission (candidate cannot be nominated for two posts simultaneously — check across active nominations). AdminLog: `nomination_submitted`. |
| `confirmNomination(nominationId, role, token, rollNo)` | **CF** | No change. Token-based, no session. |
| `resendConfirmationEmail(token, nomId, role)` | **CF** | No change. Access: `RO_ADMIN`. AdminLog: `confirmation_resent`. |
| `withdrawNomination(token, nomId)` | **MOD** | Add AdminLog: `nomination_withdrawn`. Add: if status is `accepted`, block withdrawal (post-acceptance withdrawal is a separate `requestWithdrawal` flow per SOP). Access: candidate themselves OR `RO_ADMIN`. |

---

### 1.15 Nominations — Phase 2

| Function | Disposition | Notes |
|---|---|---|
| `submitNomination_Phase2(token, data)` | **MOD** | Add: write Nominations col 30 (Phase2Flag=TRUE). Add: write col 31 (DuplicateDeclined) if prior declined nomination exists for same candidate+post. AdminLog: `phase2_nomination_submitted`. |
| `confirmCandidateConsent(nomId, token)` | **CF** | No change. Token-based. AdminLog: `candidate_consent_accepted`. |
| `declineCandidateConsent(nomId, token)` | **CF** | No change. Token-based. AdminLog: `candidate_consent_declined`. |
| `addSeconder(token, nominationId, seconderRoll)` | **CF** | No change. Access: proposer only. AdminLog: `seconder_added`. |

---

### 1.16 Nominations — Duplicate and Overlap

| Function | Disposition | Notes |
|---|---|---|
| `getNominationStatus(token, electionId)` | **DEP** | Old version. Superseded by `getMyNominations`. Remove. |
| `getNominations` (first definition, ~line 1948) | **DEP** | Duplicate function name. GAS uses the last definition. This first definition has a different object shape and is orphaned. Remove explicitly. |
| `getNominations` (second definition, ~line 3619) | **CF** | Correct, current version. Carry forward. Access: RO-tier. |
| `getMyNominations(token, electionId)` | **CF** | Correct. Access: any session. Shows nominations where caller is candidate or proposer. |

---

### 1.17 Scrutiny

| Function | Disposition | Notes |
|---|---|---|
| `scrutinizeNomination(token, nominationId, decision, reason)` | **DEP** | Old version without checklist gate. Superseded by `acceptNomination` + `rejectNomination`. Remove. **Any UI still calling this must be updated.** |
| `saveScrutinyItem(token, nomId, checkItem, checkResult, notes)` | **CF** | No change. Access: `RO_ADMIN`. |
| `sendNomQuery(token, nomId, queryText)` | **CF** | No change. Access: `RO_ADMIN`. AdminLog: implicit via email trail; add explicit `nom_query_sent` AdminLog entry. |
| `submitQueryResponse(queryId, responseToken, responseText)` | **CF** | No change. Token-based. |
| `sendECReferral(token, nomId, referralText, checkItem)` | **CF** | No change. Access: `RO_ADMIN`. |
| `submitECResponse(nomId, token, responseText)` | **CF** | No change. Token-based. |
| `acceptNomination(token, nomId)` | **MOD** | Add: write Nominations col 29 (OnePostCheck=TRUE at acceptance). Check one-post-per-person rule at acceptance — if candidate already has an accepted nomination for a different post, block. Write new Candidates cols 10 (NominationId), 11 (ScrutinyAcceptedAt), 12 (ScrutinyAcceptedBy). AdminLog: `scrutiny_decision` (existing). |
| `rejectNomination(token, nomId, reason)` | **MOD** | Add AdminLog: `scrutiny_decision` (ensure it is logged — currently missing explicit AdminLog call in this function). |
| `getScrutinyData(token, nomId)` | **CF** | No change. Access: `RO_ADMIN`. |

---

### 1.18 GDrive / Documents

| Function | Disposition | Notes |
|---|---|---|
| `getOrCreateFolder(parentFolderId, folderName)` | **CF** | No change. |
| `getCandidateFolder(electionId, candidateRoll, candidateName)` | **CF** | No change. |
| `uploadNomDocument(electionId, candidateRoll, candidateName, fileName, fileBlob)` | **CF** | No change. |
| `updateNomDocLinks(nomId, fileUrl, fileName, folderUrl)` | **CF** | No change. |
| `uploadNominationDocument(token, nomId, fileName, fileDataBase64, mimeType)` | **CF** | No change. Access: `RO_ADMIN`. AdminLog: `document_uploaded`. |
| `getNomDocuments(token, nomId)` | **CF** | No change. Access: RO-tier. |
| `uploadDocument(token, electionId, category, fileName, fileData, mimeType, notes)` | **MOD** | Add: write DocStore col 9 (`LinkedToTab`). Derive `LinkedToTab` from `category` (e.g., `nomination_support` → `Nominations`, `scrutineer_declaration` → `General`, etc.). AdminLog: `document_uploaded`. |
| `getUploadedDocuments(token, electionId, category)` | **CF** | No change. Access: RO-tier. |
| `getMyDocuments(token, electionId)` | **CF** | No change. Access: any session. |

---

### 1.19 Audit / Security

| Function | Disposition | Notes |
|---|---|---|
| `appendAdminLog(adminId, actionType, description, oldValue, newValue)` | **CF** | **⚠️ TRUST ARCHITECTURE: Core function. Do not modify. Append-only. No function may edit or delete AdminLog rows.** |
| `recordScrutineerConfirmation(token, electionId, part, confirmationText)` | **CF** | No change. Access: SCRUTINEER or RO-tier. AdminLog: `scrutineer_confirmation_A` / `scrutineer_confirmation_B`. |
| `recordTallyCoSign(token, electionId, confirmation)` | **CF** | No change. Access: SCRUTINEER or RO-tier. AdminLog: `tally_cosign`. |
| `recordROAuthorisation(token, electionId, actionToAuthorise)` | **CF** | No change. Access: `RO_ADMIN`. AdminLog: `ro_authorisation`. Returns `authorisationId` for TEM use. |
| `purgeTrialData(token, electionId, confirmPhrase)` | **MOD** | Add: also clear rows from `VoterRollDraft`, `Complaints`, `Appeals`, `Observations`, `ElectionSchedule` for this electionId. Gate: only when `TrialElection=TRUE` on the Elections row. AdminLog: `trial_data_purged`. Access: `RO_ADMIN`. |
| `applySheetProtections(token)` | **MOD** | Add the 10 new tabs to the protected set (or hide as appropriate). New tabs: VoterRollDraft (hide after certification), Complaints, Appeals, Observations, TEMAuth, ROPanelLog, ECOfficerBoardDatabase — all protect. Messages, ElectionSchedule, LandingPageContent — protect. AdminLog: `sheet_protections_applied`. |

---

### 1.20 Public Status

| Function | Disposition | Notes |
|---|---|---|
| `getObserverDashboard(token, electionId)` | **CF** | No change. Access: `OBSERVER` or `RO_ADMIN`. |
| `getPublicElectionStatus()` | **CF** | No change. Public, no session. |

---

### 1.21 Records and Reporting

| Function | Disposition | Notes |
|---|---|---|
| `generateElectionRecord(token, electionId)` | **MOD** | Add sections to the generated PDF for: Complaints log, Appeals log, Observations log, ROPanelLog summary, ElectionSchedule V-day timeline. Access: `RO_ADMIN`. AdminLog: `election_record_generated`. |

---

### 1.22 Sheet Setup

| Function | Disposition | Notes |
|---|---|---|
| `setupSecuritySheets()` | **MOD** | Extend to create all 10 new tabs with headers. Rename to `setupAllSheets()` or keep name — either is fine. |
| `_forceDocumentScope()` | **CF** | No change. OAuth scope dummy. |

---

### 1.23 Backup

| Function | Disposition | Notes |
|---|---|---|
| `performDailyBackup()` | **MOD** | Add new critical sheets to backup set: Nominations, ScrutinyLog, NomQueries, AdminLog, Complaints, Appeals. Currently only backs up Votes, VotedLog, Elections, Candidates. |
| `setupDailyBackupTrigger()` | **CF** | No change. |
| `createManualBackup()` | **CF** | No change. |

---

### 1.24 Demo / Test Functions — Move to Separate Files

The following functions are not part of production Code.gs. Move to `DemoData.gs` and `TestFunctions.gs` respectively.

**Move to DemoData.gs:**
`generateDemoData()`, `generateDemoData2()`, `generateDemoData3()`, `generateDemoData4()`,
`_clearAllSheets()`, `_setupSheetHeaders()`, `_generateDemoVoters()`, `_generateDemoAdmins()`,
`_generateDemoElection()`, `_generateDemoCandidates()`, `_generateDemoVotes()`,
`addMissingDemoCandidates()`, `addBatchRepCandidates()`, `regenerateDemoVotes()`,
`authorizeMailApp()`

**Move to TestFunctions.gs:**
`testPurge()`, `testDriveAccess()`, `testNomUpload()`, `testNomDocUpload()`,
`testNomDocUpload2()`, `testNomDocUpload3()`, `testNomDocUpload4()`, `testNomDocUpload5()`,
`testVerifyPage()`, `testVerifyPageSimple()`, `debugThresholdCheck()`, `getDeployUrl()`

---

## PART 2 — NEW FUNCTIONS REQUIRED

All new functions follow the same pattern: session-gated, every write auto-appended to AdminLog, no direct sheet interaction from UI.

---

### 2.1 Admin Management Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `addAdmin(token, adminData)` | `RO_ADMIN` | Admins | `admin_added` | Add new admin (any tier: DEPUTY_RO, TEM, SCRUTINEER, OBSERVER). EC_OFFICER added only pre-handover. |
| `disableAdmin(token, adminId)` | `RO_ADMIN` | Admins | `admin_disabled` | Set Status=DISABLED on Admins row. Does not delete. Two-layer lockout: application layer only — Google account password change is manual. |
| `getAdminList(token)` | `RO_ADMIN` | Admins | — | Returns all admins with status. |
| `getAdminLog(token, electionId)` | `RO_ADMIN`, `SCRUTINEER` | AdminLog | — | Returns AdminLog rows filtered by electionId. SCRUTINEER: read-only, all records. Essential for Scrutineer panel. |

---

### 2.2 Deputy RO Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `activateDeputyRO(token, adminId)` | `RO_ADMIN` | Admins | `deputy_ro_activated` | Set DeputyROActivated=TRUE, ActivatedAt, ActivatedBy on Admins row. |
| `deactivateDeputyRO(token, adminId)` | `RO_ADMIN` | Admins | `deputy_ro_deactivated` | Set DeputyROActivated=FALSE. If adminId is on Appeals Panel and panel is active, auto-recuse (sets observation in AdminLog). |
| `getDeputyROStatus(token)` | `RO_ADMIN`, `DEPUTY_RO` | Admins | — | Returns current Deputy RO status for all DEPUTY_RO accounts. |

---

### 2.3 TEM (Technical Election Manager) Module (new)

All TEM actions require a valid `authorisationId` issued by `recordROAuthorisation`. Every TEM action is gated by AuthID verification against AdminLog before execution.

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `verifyTEMAuthorisation(token, authId)` | `TEM` | AdminLog (read), TEMAuth | `tem_auth_verified` | Check authId exists in AdminLog as `ro_authorisation`. Write to TEMAuth: authId, verifiedAt, verifiedBy. Returns scoped action permission from auth record. |
| `getTEMAuthHistory(token, electionId)` | `RO_ADMIN`, `TEM` | TEMAuth | — | Returns all TEM authorisation events for an election. |
| `recordPhysicalVote(token, authId, electionId, postName, candidateId)` | `TEM` | Votes, VotedLog, TEMAuth | `physical_vote_recorded` | **⚠️ TRUST ARCHITECTURE: Physical vote entry. Wraps `castVote` after authId verification. The `rollNo` in VotedLog is a TEM-managed anonymous batch identifier — NOT the individual voter's roll number. TEM logs physical ballot sheet number only.** |

---

### 2.4 EC Officer Module (new)

EC_OFFICER accounts are pre-handover only. Auto-disabled at handover.

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `getECOfficerPanel(token)` | `EC_OFFICER` | Elections, VoterRollDraft, LandingPageContent | — | Returns EC Officer panel data: current election status, voter roll draft upload status, landing page content. |
| `uploadVoterRollDraft(token, rows)` | `EC_OFFICER`, `RO_ADMIN` | VoterRollDraft | `voter_roll_draft_uploaded` | Uploads draft voter roll to VoterRollDraft. Replaces current draft if one exists. Blocked if objection window is open. |
| `updateLandingPageContent(token, data)` | `EC_OFFICER`, `RO_ADMIN` | LandingPageContent | `landing_page_updated` | EC officer updates landing page content (election notice, dates, contact). |

---

### 2.5 Voter Roll Draft Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `getVoterRollDraft(token, page, search)` | `RO_ADMIN` | VoterRollDraft | — | Paginated view of draft voter roll with objection status. |
| `updateObjectionStatus(token, rollNo, objectionStatus, notes)` | `RO_ADMIN` | VoterRollDraft | `voter_roll_objection_updated` | RO records outcome of an objection (resolved_retained / resolved_removed). |
| `certifyVoterRoll(token, electionId)` | `RO_ADMIN` | Voters, VoterRollDraft, Elections | `voter_roll_certified` | Copies VoterRollDraft rows (excluding resolved_removed) to Voters. Hides VoterRollDraft. Sets Elections certified flag. Blocks if any pending objections exist. |

---

### 2.6 Handover Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `initiateHandover(token, electionId)` | `RO_ADMIN` | Elections, Admins | `handover_initiated` | Marks election as handover-in-progress. Pre-condition: EC_OFFICER accounts exist. |
| `lockECOfficers(token)` | `RO_ADMIN` | Admins | `ec_officers_locked` | Sets Status=DISABLED on all EC_OFFICER accounts. Witnessed step — logs all accounts locked in one AdminLog entry. |
| `getHandoverChecklist(token, electionId)` | `RO_ADMIN`, `SCRUTINEER` | Admins, Elections, VoterRollDraft | — | Returns handover checklist status: EC accounts locked, voter roll certified, sheet protections applied, scrutineer confirmations recorded. |

---

### 2.7 Complaints Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `fileComplaint(token, electionId, category, complaintText)` | `VOTER` (any authenticated) | Complaints | `complaint_filed` | Voter submits a Code of Conduct complaint. Assigned complaint ID. Status: `filed`. |
| `getComplaints(token, electionId)` | `RO_ADMIN`, `DEPUTY_RO` | Complaints | — | Returns all complaints for an election. |
| `updateComplaintStatus(token, complaintId, status, response)` | `RO_ADMIN`, `DEPUTY_RO` | Complaints | `complaint_updated` | RO updates complaint status and records response. |
| `getMyComplaints(token, electionId)` | any authenticated | Complaints | — | Returns complaints filed by the caller. |

---

### 2.8 Appeals Module (new)

Appeals are filed against nomination rejections only. Panel: RO + Deputy RO (if active and not recused).

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `fileAppeal(token, nominationId, appealText)` | `VOTER` (candidate only) | Appeals | `appeal_filed` | Candidate files appeal against rejection. Deadline: 48 hours from rejection notification. Status: `filed`. |
| `getAppeals(token, electionId)` | `RO_ADMIN`, `DEPUTY_RO`, `SCRUTINEER` | Appeals | — | Returns all appeals. SCRUTINEER: read-only. |
| `updateAppealDecision(token, appealId, decision, decisionText)` | `RO_ADMIN` | Appeals, Nominations, Candidates, AdminLog | `appeal_decided` | Panel records decision. If `upheld`: reinstate nomination (set Nominations status back to accepted); if candidate was removed from Candidates, re-add; logs `appeal_upheld_candidature_reinstated`. If `dismissed`: no change to nomination. **D-V6: this is the only post-candidates_published unlock permitted.** |
| `getMyAppeals(token)` | any authenticated | Appeals | — | Returns appeals filed by caller. |

---

### 2.9 Observations Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `submitObservation(token, electionId, observationText, isPrivate)` | `SCRUTINEER`, `OBSERVER` | Observations | `observation_submitted` | Submit an observation to the RO. `isPrivate=TRUE` means visible to RO only; `isPrivate=FALSE` visible to all panel members. |
| `getObservations(token, electionId)` | `RO_ADMIN`, `DEPUTY_RO`, `SCRUTINEER` | Observations | — | Returns observations. SCRUTINEER: sees non-private observations and their own. OBSERVER: sees own only. |
| `respondToObservation(token, observationId, responseText)` | `RO_ADMIN` | Observations | `observation_response_recorded` | RO records response to an observation. |

---

### 2.10 Messages Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `sendHandoverMessage(token, subject, messageText)` | `EC_OFFICER`, `RO_ADMIN` | Messages | `message_sent` | EC officer sends handover context message to RO. RO can also send acknowledgement. |
| `getMessages(token)` | `EC_OFFICER`, `RO_ADMIN` | Messages | — | Returns all messages relevant to the caller's role. |
| `acknowledgeMessage(token, messageId)` | `RO_ADMIN` | Messages | `message_acknowledged` | RO marks message as read/acknowledged. |

---

### 2.11 EC Officer Board Database Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `importECOfficerHistory(token, rows)` | `RO_ADMIN` | ECOfficerBoardDatabase | `ec_board_history_imported` | RO imports historical EC officer records (past 15 years). Replaces existing records. |
| `getECOfficerHistory(token, rollNo)` | `RO_ADMIN` | ECOfficerBoardDatabase | — | Returns tenure history for a given roll number. Used during scrutiny. |
| `checkEligibilityAutomatic(token, rollNo, postName, electionId)` | `RO_ADMIN` | ECOfficerBoardDatabase, Nominations, Elections | — | Runs automated eligibility pre-check for scrutiny. Returns: eligible / ineligible / data_gap (gaps treated as neutral per O1). Not a gate — advisory only. |

---

### 2.12 Election Schedule Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `setElectionSchedule(token, electionId, scheduleData)` | `RO_ADMIN` | ElectionSchedule | `election_schedule_set` | RO sets V-day and all derived schedule dates. 21 columns per Session 18 schema. |
| `getElectionSchedule(token, electionId)` | `RO_ADMIN`, `SCRUTINEER`, `OBSERVER` | ElectionSchedule | — | Returns full schedule. |
| `getPublicSchedule(electionId)` | PUBLIC | ElectionSchedule, LandingPageContent | — | Returns public-facing schedule (filtered columns only — no internal RO notes). |

---

### 2.13 Landing Page Content Module (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `getLandingPageContent(electionId)` | PUBLIC | LandingPageContent | — | Returns current landing page content for display. No session required. |

*(Note: `updateLandingPageContent` is in 2.4 EC Officer Module)*

---

### 2.14 RO Panel Log Module (new)

All RO actions through the admin panel are auto-logged here in addition to AdminLog. ROPanelLog is a more granular session-level log (page visits, searches, tab opens).

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `logROPanelAction(token, actionType, description, electionId)` | `RO_ADMIN`, `DEPUTY_RO`, `TEM` | ROPanelLog | — | Called by frontend on significant panel events. Not called by backend directly — frontend-initiated. |
| `getROPanelLog(token, electionId)` | `RO_ADMIN` | ROPanelLog | — | Returns RO panel session log. For audit / transparency. |

---

### 2.15 Nominations Board (Public View) (new)

| Function | Access Tier | Sheets Touched | AdminLog Action | Purpose |
|---|---|---|---|---|
| `getPublicNominationsBoard(electionId)` | PUBLIC (when status = `nominees_published` or later) | Nominations, Elections | — | Returns accepted nominations for display on public nominations board. No session required. Shows name, post, bio, photo only — no roll numbers, no proposer/seconder identity. |

---

## PART 3 — COL INDEX CONFLICT AND GAP ANALYSIS

No conflicts exist. All new columns are appended after existing columns on each modified sheet. Verified below.

### Voters (currently 9 cols, 0–8)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 9 | LifeMember | Boolean |
| +2 | 10 | EmailVerificationStatus | Enum: verified / unresponsive / undelivered |

**New COL constants:** `VOTER_LIFE_MEMBER:9`, `VOTER_EMAIL_VER:10`

---

### Elections (currently 18 cols, 0–17)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 18 | ElectionMode | Enum: electronic / physical / hybrid (hybrid reserved, not implemented — D-V8) |
| +2 | 19 | TrialElection | Boolean |
| +3 | 20 | BypassFloors | Boolean — hard-blocked when TrialElection=FALSE (D-V7) |
| +4 | 21 | VDay | DateTime ISO |
| +5 | 22 | VotingCloseDay | DateTime ISO (V-9 for electronic) |
| +6 | 23 | DeclarationDay | DateTime ISO (V-7 for electronic) |
| +7 | 24 | LinkedSGMDate | DateTime ISO |
| +8 | 25 | CertifiedVoterRollAt | DateTime ISO |
| +9 | 26 | SeatConfig | Text JSON — e.g. `{"Vice President":2,"Joint Secretary":2}` |

**New COL constants:** `ELEC_MODE:18`, `ELEC_TRIAL:19`, `ELEC_BYPASS_FLOORS:20`, `ELEC_VDAY:21`, `ELEC_VOTE_CLOSE:22`, `ELEC_DECLARE_DAY:23`, `ELEC_SGM_DATE:24`, `ELEC_CERTIFIED_AT:25`, `ELEC_SEAT_CONFIG:26`

---

### Candidates (currently 9 cols, 0–8)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 9 | SeatCount | Integer (default 1) |
| +2 | 10 | NominationId | Text — links back to Nominations sheet |
| +3 | 11 | ScrutinyAcceptedAt | DateTime ISO |
| +4 | 12 | ScrutinyAcceptedBy | Text — AdminID |

**New COL constants:** `CAND_SEAT_COUNT:9`, `CAND_NOM_ID:10`, `CAND_SCRUTINY_AT:11`, `CAND_SCRUTINY_BY:12`

---

### Admins (currently 7 cols, 0–6)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 7 | Status | Enum: ACTIVE / DISABLED |
| +2 | 8 | DisabledAt | DateTime ISO |
| +3 | 9 | DisabledBy | Text — AdminID |
| +4 | 10 | DeputyROActivated | Boolean |
| +5 | 11 | ActivatedAt | DateTime ISO |
| +6 | 12 | ActivatedBy | Text — AdminID |

**New COL constants:** `ADMIN_STATUS:7`, `ADMIN_DISABLED_AT:8`, `ADMIN_DISABLED_BY:9`, `ADMIN_DEPRO_ACTIVE:10`, `ADMIN_ACTIVATED_AT:11`, `ADMIN_ACTIVATED_BY:12`

---

### Nominations (currently 29 cols, 0–28)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 29 | OnePostCheck | Boolean |
| +2 | 30 | Phase2Flag | Boolean |
| +3 | 31 | DuplicateDeclined | Boolean |

**New COL constants:** `NOM_ONE_POST_CHECK:29`, `NOM_PHASE2_FLAG:30`, `NOM_DUP_DECLINED:31`

---

### DocStore (currently 9 cols, 0–8)
| New Col | Index | Name | Type |
|---|---|---|---|
| +1 | 9 | LinkedToTab | Enum: Nominations / Complaints / Appeals / Observations / Messages / Elections / General |

**New COL constant:** `DOC_LINKED_TAB:9`

---

### New Tabs — COL Prefix Constants (new blocks, no conflict with existing COL)

All new tab COL constants use their designated prefix from Session 18 decisions. They are defined as separate constant objects (e.g., `var COL_VRD = { ... }`) or appended to the main COL object with their prefix — decision for Step 4.

| Tab | Prefix | Columns |
|---|---|---|
| VoterRollDraft | `VRD_` | 13 cols (0–12) |
| Complaints | `CMP_` | 14 cols (0–13) |
| Appeals | `APL_` | 16 cols (0–15) |
| Observations | `OBS_` | 11 cols (0–10) |
| Messages | `MSG_` | 9 cols (0–8) |
| ECOfficerBoardDatabase | `ECDB_` | 9 cols (0–8) |
| ElectionSchedule | `SCHED_` | 21 cols (0–20) |
| TEMAuth | `TEMA_` | 12 cols (0–11) |
| ROPanelLog | `RPL_` | 15 cols (0–14) |
| LandingPageContent | `LPC_` | 7 cols (0–6) |

**Recommendation:** Keep new tab constants as separate named objects (e.g., `var COL_VRD = {...}`) rather than adding all prefixed names into the single COL object. This avoids the COL object becoming unmanageably large and makes the prefix convention explicit in code.

---

## PART 4 — FUNCTIONS WITH DUPLICATE NAME: RESOLUTION REQUIRED

| Function Name | Issue | Resolution |
|---|---|---|
| `getNominations` | Defined twice. First definition (~line 1948): different return shape, old. Second definition (~line 3619): correct, current. | **Remove first definition.** Keep second only. |
| `getNominationStatus` vs `getMyNominations` | Both serve "my nominations" purpose. `getMyNominations` is the correct, current version. | **Remove `getNominationStatus`.** |
| `buildNominationConfirmEmail` vs `buildNomConfirmEmail` | Two email builders, different signatures, same purpose. `buildNomConfirmEmail` (6-param, with deadline) is correct. | **Remove `buildNominationConfirmEmail`.** Update any callers to use `buildNomConfirmEmail`. |
| `scrutinizeNomination` vs `acceptNomination`/`rejectNomination` | Old function has no checklist gate. New functions do. | **Remove `scrutinizeNomination`.** |

---

## PART 5 — TRUST ARCHITECTURE FLAGS

The following are non-negotiable constraints that must be re-verified at the start of Step 4 (code writing):

1. **Votes / VotedLog separation:** No function may correlate these two sheets. `castVote` and `buildTally` are the only functions that touch Votes. `getBallotStatus` is the only function that reads VotedLog for individual voter state. No voter identity ever appears in Votes. No vote content ever appears in VotedLog. `recordPhysicalVote` (new) wraps `castVote` — it must not pass the physical voter's roll number as the VotedLog identifier.

2. **AdminLog append-only:** `appendAdminLog` writes only. No function reads AdminLog except `getAdminLog`, `generateElectionRecord`, `getHandoverChecklist`, and `getROPanelLog`. No function edits or deletes AdminLog rows. Ever.

3. **EC_OFFICER lockout:** `verifyAdminOTP`, `sendAdminOTP`, and `getAdminRole` all check `Status=DISABLED`. The lockout must be enforced at the session creation point — if DISABLED, no session token is issued. Application-layer lockout only; Google account password change is a manual step recorded in AdminLog.

4. **72-hour floor:** The `candidates_published → active` transition must enforce the 72-hour floor from `candidatesPublishedAt` timestamp. `BypassFloors=TRUE` is a hard block unless `TrialElection=TRUE` on the Elections row. No function may accept an override note to skip this — the override note applies only to the min-posts threshold, not the 72-hour floor.

5. **Appeal unlock scope:** `updateAppealDecision` is the only function that may reinstate a rejected nomination post-`candidates_published`. The reinstatement scope is: the single nomination identified by `nominationId` in the appeal. It must not unlock any other nomination or permit any other change to the Candidates sheet.

---

## PART 6 — FUNCTION COUNT SUMMARY

| Category | Carry Forward | Modify | Deprecate | New |
|---|---|---|---|---|
| Infrastructure / Routing | 1 | 2 | 0 | 0 |
| Utility | 7 | 3 | 0 | 0 |
| Session | 4 | 0 | 0 | 0 |
| Email delivery | 1 | 0 | 0 | 0 |
| Email templates | 13 | 0 | 1 | 4 (complaints, appeals, observations, consent ext.) |
| OTP | 2 | 2 | 0 | 0 |
| Lookup / role | 3 | 3 | 0 | 0 |
| Elections | 5 | 5 | 0 | 0 |
| Candidates | 2 | 4 | 0 | 0 |
| Voting | 3 | 0 | 0 | 1 (recordPhysicalVote) |
| Tally / results | 3 | 1 | 0 | 0 |
| Voter management | 2 | 2 | 1 | 0 |
| Nominations | 5 | 4 | 4 | 1 (getPublicNominationsBoard) |
| Scrutiny | 7 | 2 | 1 | 0 |
| GDrive / docs | 8 | 1 | 0 | 0 |
| Audit / security | 5 | 2 | 0 | 0 |
| Admin management | 0 | 0 | 0 | 4 |
| Deputy RO | 0 | 0 | 0 | 3 |
| TEM | 0 | 0 | 0 | 3 |
| EC Officer | 0 | 0 | 0 | 3 |
| Voter Roll Draft | 0 | 0 | 0 | 3 |
| Handover | 0 | 0 | 0 | 3 |
| Complaints | 0 | 0 | 0 | 4 |
| Appeals | 0 | 0 | 0 | 4 |
| Observations | 0 | 0 | 0 | 3 |
| Messages | 0 | 0 | 0 | 3 |
| EC Board DB | 0 | 0 | 0 | 3 |
| Election Schedule | 0 | 0 | 0 | 3 |
| Landing Page | 0 | 0 | 0 | 1 |
| RO Panel Log | 0 | 0 | 0 | 2 |
| Public | 2 | 1 | 0 | 0 |
| Records | 0 | 1 | 0 | 0 |
| Backup | 2 | 1 | 0 | 0 |
| Sheet setup | 1 | 1 | 0 | 0 |
| Demo / Test | — | — | — | Moved to separate files |
| **TOTAL** | **76** | **35** | **7** | **44** |

---

## PART 7 — OPEN QUESTIONS FOR SHELLEY (not blocking Step 4)

1. **`getAdminLog` access for SCRUTINEER:** Current design allows SCRUTINEER to read the full AdminLog (read-only, as per Session 17 SOP). Confirm this is still correct — or should SCRUTINEER only see their own confirmation records?

2. **`recordPhysicalVote` — VotedLog identifier for physical elections:** Physical voting is not individual-OTP-based. The TEM enters ballots on behalf of the polling station. What identifier goes into VotedLog? Options: (a) a sequential ballot number per post, (b) a TEM-assigned batch token, (c) nothing in VotedLog for physical mode. This determines the integrity check design.

3. **COL constants architecture:** Single `COL` object with all prefixed names vs separate objects per new tab (e.g., `COL_VRD`, `COL_CMP`). Recommendation is separate objects. Confirm before Step 4.

4. **`getPublicNominationsBoard` — when does it become live?** Proposed: when election status is `nominees_published` or later. Confirm the status name and trigger.

5. **EC_OFFICER — can they read VoterRollDraft after handover?** Proposed: No — EC_OFFICER accounts are DISABLED at handover, so they cannot access anything. Confirm this is the intended design.

---

*Step 3 complete. Step 4 is the UI Page Map.*
*All decisions in this document are derived from Session 17 and 18 locked architecture.*
*No code has been written. This document is a design-only deliverable.*
