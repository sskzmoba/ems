# SSKZM OBA EMS — SESSION 18 HANDOVER NOTE
*Architecture Design Sessions — Steps 1 and 2 Complete*
*To be read first in any new chat continuing the refactor architecture work.*

---

## HOW TO USE THIS FILE

This file records all decisions taken in the Step 1 (Data Architecture) and Step 2 (Access Tier Design) sessions. Before doing anything in the new chat:

1. Read SSKZM_OBA_MASTER_BRIEF_UPDATED.md first
2. Read SSKZM_OBA_EMS_Requirements_Locked.md
3. Read this file in full
4. Do not propose anything that contradicts decisions recorded here
5. Step 3 is the Backend Function Map — that is the starting point for the new chat

---

## PART 1 — WHAT WAS ACCOMPLISHED

Steps 1 and 2 of the structured refactor architecture design are complete. The full data architecture (22 tabs, all column schemas, all COL constants prefixes) and the full access tier design (8 tiers, all permissions, all gates) are locked. The next session begins Step 3 — Backend Function Map.

---

## PART 2 — STEP 1: DATA ARCHITECTURE

### 2.1 Complete Sheet List — 22 Tabs

| # | Tab Name | Status | Columns | COL Prefix |
|---|----------|--------|---------|------------|
| 1 | Votes | FROZEN | 5 | — |
| 2 | VotedLog | FROZEN | 4 | — |
| 3 | AdminLog | FROZEN (append-only) | 7 | — |
| 4 | OTPs | FROZEN | 4 | — |
| 5 | Voters | Modified (+2) | 11 | — |
| 6 | Elections | Modified (+9) | 27 | — |
| 7 | Candidates | Modified (+4) | 13 | — |
| 8 | Admins | Modified (+6) | 13 | — |
| 9 | Nominations | Modified (+3) | 32 | — |
| 10 | ScrutinyLog | Unchanged | 18 | — |
| 11 | NomQueries | Unchanged | 12 | — |
| 12 | DocStore | Modified (+1) | 10 | — |
| 13 | VoterRollDraft | NEW | 13 | VRD_ |
| 14 | Complaints | NEW | 14 | CMP_ |
| 15 | Appeals | NEW | 16 | APL_ |
| 16 | Observations | NEW | 11 | OBS_ |
| 17 | Messages | NEW | 9 | MSG_ |
| 18 | ECOfficerBoardDatabase | NEW | 9 | ECDB_ |
| 19 | ElectionSchedule | NEW | 21 | SCHED_ |
| 20 | TEMAuth | NEW | 12 | TEMA_ |
| 21 | ROPanelLog | NEW | 15 | RPL_ |
| 22 | LandingPageContent | NEW | 7 | LPC_ |

---

### 2.2 Frozen Tabs — No Changes Ever

**Votes** (5 cols): VoteID, ElectionID, PostName, CandidateID, CastAt
- No voter identity. No changes. Ever.

**VotedLog** (4 cols): RollNo, ElectionID, PostName, Timestamp
- No vote content. No changes. Ever.

**AdminLog** (7 cols): ID, AdminID, ActionType, Description, OldValue, NewValue, Timestamp
- Append-only. No edits or deletes under any circumstance.

**OTPs** (4 cols): RollNo, OTP (SHA-256), Expiry, Purpose
- Purpose enum expanded to include: ec_officer_login | deputy_ro_login | tem_login | scrutineer_login | observer_login

---

### 2.3 Modified Existing Tabs

**Voters** — cols 0–8 unchanged, additions:
- Col 9: CertifiedAt (DateTime ISO)
- Col 10: CertifiedBy (Text — AdminID of certifying RO)

**Elections** — cols 0–17 unchanged, additions:
- Col 18: ElectionMode (Enum: electronic | physical | hybrid)
- Col 19: SeatConfig (JSON — per-post seat count)
- Col 20: MinPostsConfig (JSON — array of mandatory post names)
- Col 21: VotingOpenedAt (DateTime ISO — system-set)
- Col 22: VotingClosedAt (DateTime ISO — system-set)
- Col 23: HandoverCompletedAt (DateTime ISO)
- Col 24: TrialElection (Boolean)
- Col 25: TrialTier (Enum: null | EC_INTERNAL | NEAR_LIVE)
- Col 26: BypassFloors (Boolean — TRUE only when TrialElection=TRUE; hard-blocked otherwise)

Election status enum (full): draft | nominations_open | nominations_open_phase2 | scrutiny | candidates_published | active | paused | closed | declared | concluded

ElectionMode rules:
- electronic: VotingCloseTargetDate must be ≤ VDay-9; results declared ≤ VDay-7; system warns if breached
- physical: voting UI disabled; all other functions active
- hybrid: reserved, not implemented; returns election_mode_hybrid_not_supported

**Candidates** — cols 0–8 unchanged, additions:
- Col 9: SeatCount (Integer — from Elections.SeatConfig at scrutiny acceptance)
- Col 10: PublishedAt (DateTime ISO)
- Col 11: RemovedAt (DateTime ISO — set when removed post-publication by appeals/complaint decision)
- Col 12: RemovalReason (Enum: appeal_upheld | complaint_upheld | withdrawn | disqualified)
- Candidates with RemovedAt are excluded from ballot and tally. Rows never deleted.

**Admins** — cols 0–6 unchanged, additions:
- Col 7: Status (Enum: ACTIVE | DISABLED)
- Col 8: DisabledAt (DateTime ISO)
- Col 9: DisabledBy (Text — AdminID)
- Col 10: DeputyROActivated (Boolean — FALSE at creation; set TRUE by explicit RO action only)
- Col 11: ActivatedAt (DateTime ISO)
- Col 12: ActivatedBy (Text — AdminID of RO)

Role enum (full): EC_OFFICER | RO_ADMIN | DEPUTY_RO | TEM | SCRUTINEER | OBSERVER
EC_OFFICER sub-roles (in existing Type col): GS | PRESIDENT | VP
RollNo field: required for VOTER, EC_OFFICER, RO_ADMIN, DEPUTY_RO, SCRUTINEER; nullable for TEM (if non-alumni) and OBSERVER (if external)

**Nominations** — cols 0–28 unchanged, additions:
- Col 29: OnePostCheck (Boolean — checked at scrutiny acceptance, not submission)
- Col 30: Phase2Flag (Boolean — TRUE if submitted during nominations_open_phase2)
- Col 31: DuplicateDeclined (Boolean — TRUE if prior nomination for same candidate+post was declined; allowed pre-acceptance, blocked post-acceptance)

**DocStore** — cols 0–8 unchanged, addition:
- Col 9: LinkedToTab (Enum: Nominations | Complaints | Appeals | Observations | Messages | Elections | General)

---

### 2.4 New Tabs — Full Column Schemas

**VoterRollDraft** (13 cols) — COL prefix VRD_
Staging tab for voter roll during RO objection window. Mirrored from Voters schema plus:
- Col 0–8: RollNo, Name, Surname, Batch, Email, PhoneCC, Phone, Phone2CC, Phone2
- Col 9: UploadedAt (DateTime ISO)
- Col 10: ObjectionStatus (Enum: none | objected | resolved_retained | resolved_removed)
- Col 11: ObjectionNotes (Text)
- Col 12: VerificationCategory (Enum: verified | unresponsive | undelivered — from SOP Section 3.3)

After certification: tab hidden (not deleted). Retained as read-only historical record.

Voter roll flow:
1. EC prepares draft using separate voter verification app (outside EMS)
2. EC deactivates verification app link on cutoff date (via EC Officer panel)
3. EC exports CSV with VerificationCategory per row
4. EC uploads CSV to VoterRollDraft at handover
5. RO publishes draft for objections
6. RO manages objections in VoterRollDraft (all logged)
7. RO certifies → system copies VoterRollDraft → Voters, locks both

**Complaints** (14 cols) — COL prefix CMP_
- Col 0: ComplaintID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: FiledByRoll
- Col 3: FiledAt (DateTime ISO)
- Col 4: AgainstRoll (nullable)
- Col 5: AgainstName (Text)
- Col 6: ComplaintText
- Col 7: Channel (Text — OBA channel where violation occurred)
- Col 8: DocLinks (JSON)
- Col 9: Status (Enum: filed | under_review | resolved_upheld | resolved_dismissed | referred_to_ec)
- Col 10: RONotes
- Col 11: Resolution
- Col 12: ResolvedAt (DateTime ISO)
- Col 13: ResolvedBy (AdminID)

**Appeals** (16 cols) — COL prefix APL_
- Col 0: AppealID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: NomID (FK → Nominations)
- Col 3: CandRoll
- Col 4: CandName
- Col 5: Post
- Col 6: FiledAt (DateTime ISO)
- Col 7: AppealText
- Col 8: DocLinks (JSON)
- Col 9: Status (Enum: filed | under_review | upheld | dismissed)
- Col 10: RONotes
- Col 11: Decision
- Col 12: DecidedAt (DateTime ISO)
- Col 13: DecidedBy (AdminID)
- Col 14: NomStatusUpdated (Boolean — TRUE if upheld → Nominations row updated)
- Col 15: VotingResetRequired (Boolean — system-set; TRUE if upheld after candidates_published; triggers voter notification)

Appeals/complaints window rule (LOCKED):
- 48 hours to file complaints/appeals after candidates_published
- 48 hours for Appeals Panel to decide
- Maximum 96 hours total
- active button enabled only when: (a) 72 hours elapsed since candidates_published AND (b) no Appeals row has Status = filed or under_review
- This makes it constitutionally impossible for an appeal to be pending when voting opens
- No scenario of adding/removing candidates during active voting

**Observations** (11 cols) — COL prefix OBS_
- Col 0: ObsID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: SubmittedByRoll
- Col 3: SubmittedByRole (Enum: SCRUTINEER | OBSERVER)
- Col 4: SubmittedAt (DateTime ISO)
- Col 5: ObservationText
- Col 6: DocLinks (JSON)
- Col 7: ROReply (Text — blank until replied)
- Col 8: RORepliedAt (DateTime ISO)
- Col 9: RORepliedBy (AdminID)
- Col 10: Visibility (Enum: ro_only | all_scrutineers | all_observers | public_after_declaration)

Visibility rule: visible to submitter always. Visible to all Scrutineers/Observers of same tier automatically once RO has replied. RO sets visibility level at time of reply.
Use: Formal, serious matters that need to be on the election record. For routine communications use Messages tab.

**Messages** (9 cols) — COL prefix MSG_
- Col 0: MessageID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: FromRoll
- Col 3: FromRole (Enum: EC_OFFICER | RO_ADMIN | SCRUTINEER | OBSERVER)
- Col 4: ToRole (Enum: RO_ADMIN | EC_OFFICER | broadcast)
- Col 5: MessageText
- Col 6: DocLinks (JSON)
- Col 7: SentAt (DateTime ISO)
- Col 8: MessageType (Enum: handover_communication | tem_communication | scrutineer_communication | checklist_submission | checklist_acknowledgement | general)

Use: Routine/minor communications. EC↔RO, Scrutineer↔RO, Observer↔RO.

**ECOfficerBoardDatabase** (9 cols) — COL prefix ECDB_
Past 15 years office bearers for eligibility auto-check.
- Col 0: RecordID (UUID)
- Col 1: ElectionYear (Text — e.g. "2023-24")
- Col 2: Post
- Col 3: RollNo
- Col 4: Name
- Col 5: Batch
- Col 6: TermStartDate (Date)
- Col 7: TermEndDate (Date)
- Col 8: DataConfidence (Enum: confirmed | estimated | unknown)

Auto-check logic: system queries this tab on nomination submission. Result: eligible | ineligible | check_required (check_required when DataConfidence = unknown for any relevant year). ineligible flags nomination for RO attention — does NOT auto-reject.

**ElectionSchedule** (21 cols) — COL prefix SCHED_
One row per election. All dates V-Day referenced.
- Col 0: ScheduleID (UUID)
- Col 1: ElectionID (FK → Elections — one-to-one)
- Col 2: VDay (Date — AGM Day, the anchor for all calculations)
- Col 3: NomOpenDate
- Col 4: NomPhase2OpenDate
- Col 5: NomCloseDate
- Col 6: ScrutinyStartDate
- Col 7: VoterRollPubDate
- Col 8: VoterRollObjDeadline
- Col 9: VoterRollCertDate
- Col 10: CandidatesPublishedDate
- Col 11: WithdrawalDeadline (D+1 from CandidatesPublishedDate)
- Col 12: VotingOpenDate (not earlier than 72 hours after CandidatesPublishedDate)
- Col 13: VotingCloseTargetDate (not later than VDay-9 for electronic; system warns if breached)
- Col 14: DeclarationTargetDate (not later than VDay-7 for electronic; dynamic if phases extended)
- Col 15: ElectionPeriodEndDate
- Col 16: ExtendedBeyondVDay (Boolean — system-set when any action occurs after VDay timestamp)
- Col 17: LastUpdatedAt (DateTime ISO)
- Col 18: LastUpdatedBy (AdminID)
- Col 19: PublishedToLandingPage (Boolean)
- Col 20: PublishedAt (DateTime ISO)

V-Day timeline (electronic elections — LOCKED):
- V-Day = AGM Day (anchor, never changes)
- Voting closes: not later than V-9 (to allow tally + Scrutineer verification)
- Results declared: not later than V-7
- AGM Day (V-0): formal announcement of results; incoming EC takes charge; election record filed
- Voting window may extend beyond V-Day under Sections 2.6 and 7.6 provisions; ExtendedBeyondVDay flag set
- Landing page shows: "Last day to vote: [VotingCloseTargetDate]", "Results declaration: [DeclarationTargetDate]", "AGM Day: [VDay]" as three distinct labelled dates

**TEMAuth** (12 cols) — COL prefix TEMA_
TEM authorisation audit trail.
- Col 0: AuthID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: IssuedBy (AdminID of RO)
- Col 3: IssuedAt (DateTime ISO)
- Col 4: Scope (Enum: specific_actions | ALL_ACTIONS)
- Col 5: ActionTypes (JSON array of selected ActionType strings from exhaustive dropdown — multi-select; empty array only valid when Scope=ALL_ACTIONS)
- Col 6: ExpiresAt (DateTime ISO — null = no expiry, RO must manually revoke)
- Col 7: UsedAt (DateTime ISO — first use)
- Col 8: UsedCount (Integer)
- Col 9: Revoked (Boolean)
- Col 10: RevokedAt (DateTime ISO)
- Col 11: Notes (Text)

TEM ActionTypes exhaustive list (for RO dropdown):
System Health: verify_sheet_protections | verify_script_version | verify_github_commit_hash | check_admin_log | check_system_status | run_appendix_h_checklist
OTP/Email: troubleshoot_otp_delivery | resend_otp_manual | verify_email_delivery_log
Voter Roll: verify_voter_roll_integrity | correct_voter_roll_entry
Nominations: view_nominations_log | verify_nomination_document_upload
Voting: verify_vote_count_integrity | verify_votes_votedlog_count_match | assist_voting_pause | assist_voting_resume | extend_voting_window
Tally: open_tally_session | verify_tally_figures | assist_tally_export
Records: generate_election_record | verify_election_record_integrity
Emergency: emergency_system_restore | data_integrity_investigation

Logic: on every TEM write call, system queries TEMAuth for valid row where Revoked=FALSE, ExpiresAt>now (or null), and Scope=ALL_ACTIONS OR ActionType in ActionTypes array. If specific_actions scope: UsedCount incremented; if all uses consumed (UsedCount≥1 for single-use), reject. Read operations (view AdminLog, system status) do not require AuthorisationID.

**ROPanelLog** (15 cols) — COL prefix RPL_
RO panel of 15 publication and objection management.
- Col 0: PanelLogID (UUID)
- Col 1: ElectionID (FK → Elections)
- Col 2: PanelIteration (Integer — 1=first panel, 2=first replacement, etc.; no cap)
- Col 3: RollNo
- Col 4: Name
- Col 5: Batch
- Col 6: PublishedAt (DateTime ISO)
- Col 7: ObjectionFiled (Boolean)
- Col 8: ObjectionText
- Col 9: ObjectionFiledBy (RollNo of objector)
- Col 10: ECDecision (Enum: retained | removed | appointed)
- Col 11: DecisionNotes
- Col 12: DecidedAt (DateTime ISO)
- Col 13: EntryMethod (Enum: system_form | manual_gs)
- Col 14: ObjectionAt (DateTime ISO)

Panel objection submission: two routes — (a) system form on landing page (auto-captured to ROPanelLog); (b) email to EC (GS manually enters via EC Officer panel, EntryMethod=manual_gs). System-captured objections appear as actionable items in GS panel. President and VP see read-only view.

**LandingPageContent** (7 cols) — COL prefix LPC_
All manageable landing page content blocks as key-value pairs.
- Col 0: ContentKey (Text — unique identifier)
- Col 1: ContentValue (Text/HTML)
- Col 2: ContentType (Enum: text | html | url | boolean | date)
- Col 3: EditableBy (Enum: EC_OFFICER | RO_ADMIN | BOTH)
- Col 4: ActiveFrom (Enum: always | nominations_open | candidates_published | active | closed | declared)
- Col 5: LastUpdatedBy (AdminID)
- Col 6: LastUpdatedAt (DateTime ISO)

Landing page must show a prominent Election Process Timeline Widget at all times — all phases with status (completed/in-progress/upcoming/not-yet-scheduled) and dates. Current phase is always visible. EC manages pre-handover phases; RO manages post-handover phases. Each phase has a ContentKey for status and a ContentKey for an optional note.

---

### 2.5 SHEETS and COL Constants Block (for Code.gs)

```javascript
var SHEETS = {
  // Frozen tabs
  VOTES:               'Votes',
  VOTED_LOG:           'VotedLog',
  ADMIN_LOG:           'AdminLog',
  OTPS:                'OTPs',
  // Existing modified tabs
  VOTERS:              'Voters',
  ELECTIONS:           'Elections',
  CANDIDATES:          'Candidates',
  ADMINS:              'Admins',
  NOMINATIONS:         'Nominations',
  SCRUTINY_LOG:        'ScrutinyLog',
  NOM_QUERIES:         'NomQueries',
  DOC_STORE:           'DocStore',
  // New tabs
  VOTER_ROLL_DRAFT:    'VoterRollDraft',
  COMPLAINTS:          'Complaints',
  APPEALS:             'Appeals',
  OBSERVATIONS:        'Observations',
  MESSAGES:            'Messages',
  EC_BOARD_DB:         'ECOfficerBoardDatabase',
  ELECTION_SCHEDULE:   'ElectionSchedule',
  TEM_AUTH:            'TEMAuth',
  RO_PANEL_LOG:        'ROPanelLog',
  LANDING_CONTENT:     'LandingPageContent'
};
```

---

## PART 3 — STEP 2: ACCESS TIER DESIGN

### 3.1 Universal Rule
Every server-side function validates session + role + Status=ACTIVE before executing any business logic. No exceptions.

---

### 3.2 Eight Access Tiers

**TIER 1 — PUBLIC**
- No authentication
- Always active
- Sees: Landing page, election process timeline widget, election schedule (draft from EC pre-RO; finalised from RO post-appointment), election Code of Conduct (from nominations open), results (after declaration), tutorial link, RO appointment announcement, TEM appointment communication, voter roll objection window dates and process instructions, vote receipt verification page, SOP/Tech Spec/Nomination Form as public documents
- Does NOT see: nominations board (moved to Voter tier only), admin panels, tally, voter roll content
- Landing page pre-handover shows EC draft schedule labelled "Draft — subject to finalisation by RO"
- Landing page post-handover shows RO finalised schedule

**TIER 2 — VOTER**
- Authentication: RollNo + OTP to registered email; session token; 8-hour expiry
- Active: voter roll certification → concluded status
- Login outside window: returns election_not_active without revealing whether RollNo exists
- Sees: voter home page, nominations board (authenticated view), nomination forms (Phase 1 self / Phase 2 third-party), My Nominations dashboard + withdraw option (until deadline), ballot (eligible posts not yet voted), My vote receipts, complaints filing form (from nominations open), election Code of Conduct, SOP/Tech Spec/Nomination Form documents
- Does NOT see: other voters' info, tally/vote counts before declaration, admin panels, RO notes, rejection reasons (own rejection reason: yes via My Nominations)

**TIER 3 — EC_OFFICER**
- Sub-roles: GS | PRESIDENT | VP (stored in Admins.Type)
- Authentication: RollNo + OTP; purpose=ec_officer_login; 8-hour expiry
- Active: account creation → handover completion; Status set DISABLED at handover (application-level + Google account password change)
- Post-handover login attempt: rejected and logged as ec_officer_login_blocked_post_handover
- GS sees and can do: EC Officer panel, handover checklist (Appendix D.1 — fill and submit), voter verification app link manager (publish URL, deactivate on cutoff — logged), voter roll CSV upload to VoterRollDraft at handover, RO panel management (publish panel of 15, manage iterations, record objections and decisions, publish RO appointment), Messages (send/receive with RO), landing page content management (EC-controlled blocks), AGM notice management
- President and VP: read-only view of EC Officer panel, handover checklist status, Messages, election schedule
- All EC_OFFICER: cannot access RO admin panel, Votes, VotedLog, tally, scrutiny decisions, nominations data

**TIER 4 — RO_ADMIN**
- Single account; AdminID = RollNo
- Authentication: RollNo + OTP; purpose=admin_login; 8-hour expiry
- Active: account creation by incoming EC → ElectionPeriodEndDate + handover to incoming EC confirmed
- Full system control across all phases — see Step 2 session for complete list
- Cannot: correlate Votes and VotedLog (no function exists — architectural), edit/delete AdminLog rows, modify certified Voters without AdminLog entry, access EC_OFFICER panel

**TIER 5 — DEPUTY_RO**
- Single account; AdminID = RollNo
- Activation gate: DeputyROActivated flag (col 10 of Admins). FALSE at creation. Set TRUE by explicit RO action only. Every function call checks this flag.
- Returns deputy_ro_not_activated until flag set
- Permissions: identical to RO_ADMIN once activated
- Two-way handover: RO→Deputy RO (activation), Deputy RO→RO (deactivation — either party can trigger; sets DeputyROActivated=FALSE; logged)
- RO and Deputy RO can be simultaneously active if required
- Note: Deputy RO on Appeals Panel must recuse themselves upon activation as Deputy RO; reinstated on deactivation

**TIER 6 — TEM**
- Single account; RollNo null if non-alumni (external professional allowed)
- Authentication: same as RO_ADMIN
- Activation gate: every write call requires valid AuthorisationID from TEMAuth tab (in addition to valid session)
- Read operations (AdminLog view, system status): session alone sufficient, no AuthorisationID needed
- Two AuthorisationID modes: specific_actions (multi-select from exhaustive list) | ALL_ACTIONS (blanket)
- All TEM actions logged under their AdminID in AdminLog

**TIER 7 — SCRUTINEER**
- Up to constitutional maximum; AdminID = RollNo
- Activation gate: acceptance link sent by RO → Scrutineer clicks → system validates token → account ACTIVE; before acceptance login rejected
- Sees: AdminLog (read-only, always — primary audit function), tally session (live display + co-sign when RO opens), Appendix H checklist items assigned to Scrutineers, Observations panel (submit + own observations + other Scrutineers' observations after RO reply), Messages (routine comms with RO), nominations board, results after declaration
- Does NOT see: scrutiny decisions, nomination details, individual vote data, live vote counts during voting, voter roll beyond nominations board

**TIER 8 — OBSERVER**
- Accredited by RO; external observers may have non-RollNo AdminID
- Activation gate: accreditation link sent by RO → accepts terms → account ACTIVE
- Typically activated just before/during voting window
- Sees: participation dashboard (aggregate turnout % only, no voter identities), live tally after declaration (read-only), Observations panel (submit + own + RO replies, visibility as RO sets), Messages (routine comms with RO), nominations board, results after declaration
- Does NOT see: live vote counts during voting (turnout % only, not distribution), AdminLog, scrutiny details

---

## PART 4 — KEY LOCKED DECISIONS (do not revisit)

**D-V1:** Votes/VotedLog structural separation is inviolable. No voter identity ever in Votes. No vote content ever in VotedLog.

**D-V2:** V-Day = AGM Day. Electronic elections: voting closes V-9, results declared V-7, AGM is formal announcement only. Physical elections: V-Day = voting day.

**D-V3:** 72-hour floor from candidates_published to active is absolute. Cannot be shortened by any action of anyone. The appeals/complaints window (48hr file + 48hr decide = 96hr max) means it is constitutionally impossible for an appeal to be pending when the 72-hour floor lapses normally.

**D-V4:** AdminLog is append-only. No function shall edit or delete AdminLog rows. Ever.

**D-V5:** EC_OFFICER accounts are permanently disabled at handover. Two-layer lockout: application Status=DISABLED + Google account password change. No exceptions.

**D-V6:** RO reversal of scrutiny decisions is locked after candidates_published. The only exception is an upheld appeal/complaint decision, which creates a targeted unlock for that specific nomination only — logged as appeal_upheld_candidature_reinstated or appeal_upheld_candidature_removed.

**D-V7:** TrialElection=TRUE elections may have BypassFloors=TRUE, allowing schedule below SOP minimum floors. BypassFloors=TRUE is hard-blocked when TrialElection=FALSE.

**D-V8:** Hybrid election mode is reserved in the enum but not implemented. Returns election_mode_hybrid_not_supported.

**D-V9:** Voter roll categorisation from SOP Section 3.3: verified | unresponsive | undelivered. All three categories remain on the voter roll regardless of category — Life Membership status determines inclusion, not email verification outcome.

**D-V10:** Deputy RO on Appeals Panel recuses themselves on activation as Deputy RO; reinstated automatically on deactivation. This is a human/SOP matter but should be noted in the relevant UI.

---

## PART 5 — OPEN ITEMS (none blocking Step 3)

All design decisions are closed. No open items remain that affect the data architecture or access tier design.

The following are noted for future sessions:
- SOP public review feedback (expected 15+ days from 27 May 2026) — may require minor targeted amendments; unlikely to affect core architecture
- EC vetting feedback from 27 May 2026 meeting — to be incorporated when available
- Trial Tier 1 (EC-internal, ~20-50 voters) to be conducted before SGM on 18 July 2026
- Trial Tier 2 (near-live, all members) approximately 23-28 June 2026; trial results declared on SGM day

---

## PART 6 — STEP 3 STARTING POINT

Step 3 is the Backend Function Map. The approach:

1. Read existing Code.gs from project files (1_Code_gs.md)
2. Map every existing function — name, purpose, sheets touched, COL indices used
3. Identify which existing functions are: (a) carry forward unchanged, (b) need surgical modification, (c) deprecated
4. List all new functions required by the refactored architecture
5. Identify COL index conflicts or gaps before writing any code
6. Produce the complete function map as the Step 3 deliverable

Do not write any code in Step 3. The output is a structured map only. Code writing begins in Step 4.

---

*End of Session 18 Handover Note*
*Prepared: 26 May 2026*
