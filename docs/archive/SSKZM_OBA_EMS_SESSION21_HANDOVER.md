# SSKZM OBA EMS — Session 21 Handover Note
*Prepared: 27 May 2026*
*Session focus: Step 6 Pass 1, Pass 2A, Pass 2B (Part 1) — System B code writing and deployment*

---

## PART 1 — SESSION SUMMARY

This session completed three major deliverables:

1. **System B created** — Apps Script project, Google Sheet, and deploy URL all live and verified
2. **Pass 1 deployed** — `doGet()` routing (all 16 routes), all standalone page builders, constants block, utility functions, CF backend functions
3. **Pass 2A deployed** — Session management, OTP, email (Brevo + MailApp fallback), voter/admin lookups, public data functions
4. **Pass 2B Part 1 deployed** — `Index.html` SPA shell + `SharedJS.html` login flow — full voter login end-to-end verified working

---

## PART 2 — SYSTEM B IDENTIFIERS (CONFIRMED)

| Item | Value |
|---|---|
| Sheet ID | `1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E` |
| Script ID | `1-cZ5jcJNPnFIRrOD6AiWXPyqYOEhHSBUHHF6_iOFv3W-CdwC0k4MyCnH` |
| Deploy URL | `https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec` |

---

## PART 3 — FILES IN CODE.GS (CURRENT STATE)

Code.gs is built in two appended passes. Do not rewrite — only append or surgically edit.

**Pass 1 contains:**
- System B identifiers and constants (`SYSTEM_B_SHEET_ID`, `DEPLOY_URL`, `SHEETS`, `COL`, `EC_POSTS`)
- New tab COL stubs (`COL_VRD`, `COL_CMP`, etc.) — empty objects, populated in later passes
- Utility functions: `getSpreadsheet`, `getSheet`, `sheetData`, `now`, `generateId`, `parseDate`, `include`, `appendAdminLog`
- `doGet()` — all 16 routes per Step 5 design
- `doGetNomAction()` — handles R05–R14
- `serveLandingPage()`
- Standalone page builders: `standaloneShell`, `escHtml`, `roContactFooter`, `buildVerifyTokenPage`, `buildConfirmRollForm`, `buildConfirmResultPage`, `buildQueryResponseForm`, `buildECResponseForm`, `buildConsentConfirmPage`, `buildConsentResultPage`, `buildTutorialPage`, `buildErrorPage`
- CF/MOD backend functions needed by doGet routes: `confirmNomination`, `submitQueryResponse`, `submitECResponse`, `confirmCandidateConsent`, `declineCandidateConsent`

**Pass 2A contains (appended after Pass 1):**
- Session management: `createSession`, `getSession`, `deleteSession`, `logout`
- Voter/admin lookups: `findVoter`, `findAdmin`, `getAdminRole`
- OTP: `generateOTP`, `hashOTP`
- `sendOTP` — MOD: adds LifeMember check (VOTER_LIFE_MEMBER col 9)
- `verifyOTP` — CF
- `sendAdminOTP` — MOD: checks ADMIN_STATUS (col 7) before sending
- `verifyAdminOTP` — MOD: re-checks ADMIN_STATUS after OTP match (race condition guard)
- `sendEmailViaSendGrid` — Brevo primary (`BREVO_API_KEY` from Script Properties), MailApp fallback
- Email template builders: `maskEmail`, `buildOTPEmail`, `buildNomConfirmEmail`, `buildConsentEmail`, `buildQueryEmail`, `buildECReferralEmail`, `buildAcceptanceEmail`, `buildRejectionEmail`
- Public data: `getPublicElectionStatus`, `getLandingPageContent`, `getPublicSchedule`

---

## PART 4 — HTML FILES (CURRENT STATE)

| File | Status | Notes |
|---|---|---|
| `LandingPage.html` | Stub — working | Shows Voter Login + How It Works buttons. Full content in later pass. |
| `Index.html` | Pass 2B Part 1 — working | SPA shell, top bar, include() wiring, App bootstrap, setMain, escHtml, showToast |
| `SharedJS.html` | Pass 2B Part 1 — working | S08 voter login, S09 OTP entry, S10 admin login, S11 admin OTP entry. Full flow verified. |
| `VoterJS.html` | Stub | `<script>// Panel stub</script>` — renders "Voter Panel — coming soon" via App.showComingSoon |
| `AdminJS.html` | Stub | Same stub |
| `ECOfficerJS.html` | Stub | Same stub |

---

## PART 5 — SHEET TABS (CURRENT STATE)

System B Sheet currently has only two tabs set up:

| Tab | Status | Notes |
|---|---|---|
| `Voters` | Created | Header row + 1 test row (TEST01 / shelleykdas@gmail.com / LifeMember=TRUE) |
| `OTPs` | Created | Header row only |

**Remaining 20 tabs to create** (per Step 3 schema): Elections, Candidates, Votes, VotedLog, Admins, AdminLog, Nominations, ScrutinyLog, NomQueries, DocStore, VoterRollDraft, Complaints, Appeals, Observations, Messages, ECOfficerBoardDatabase, ElectionSchedule, TEMAuth, ROPanelLog, LandingPageContent.

These are needed before any function touching those sheets can run. Priority order for next session: `Admins`, `Elections`, `AdminLog` — these are needed to test admin login and election status functions.

---

## PART 6 — VERIFIED WORKING (END OF SESSION 21)

| Component | Verified |
|---|---|
| `doGet()` all 16 routes | ✓ |
| Landing page serves at deploy URL | ✓ |
| `?action=login` serves SPA shell | ✓ |
| `?action=tutorial` serves tutorial placeholder | ✓ |
| Unknown actions serve error page | ✓ |
| Session create / read / delete (PropertiesService) | ✓ |
| OTP generation + SHA-256 hashing | ✓ |
| Brevo email delivery | ✓ |
| `sendOTP` — voter flow | ✓ |
| `verifyOTP` — session creation | ✓ |
| Voter login end-to-end (Roll + Email → OTP → Panel) | ✓ |
| Role routing to panel stub | ✓ |
| Apps Script authorisation (all scopes) | ✓ |

**Not yet tested:** Admin login flow (needs `Admins` tab), EC Officer login (needs `Admins` tab with EC_OFFICER role).

---

## PART 7 — KEY TECHNICAL DISCOVERIES THIS SESSION

**Apps Script iframe JS scope issue:**
`window.X` assignments inside the SPA are not visible from Chrome DevTools console because the console runs in the outer frame context. Variables declared with `var` at the top level of a `<script>` block work correctly within the app — they just can't be inspected from the console. Do not use this as a debugging method for System B. Use `google.script.run` test functions in the editor instead.

**Template evaluation vs HtmlOutput:**
`Index.html` and `LandingPage.html` must be served via `createTemplateFromFile().evaluate()` — not `createHtmlOutputFromFile()` — because they use `<?!= include('...') ?>` tags. This is already correctly implemented in `doGet()`.

**LandingPage links must use full deploy URL:**
Relative links (`?action=login`) in `LandingPage.html` cause blank page navigation in the Apps Script sandbox. All links must use the full deploy URL. Already fixed in current `LandingPage.html`.

**Authorisation scope timing:**
`UrlFetchApp` permission was not granted during initial deployment because the stub code didn't use it. It was granted during the first full `google.script.run` call from the browser. No further authorisation issues expected.

**`BREVO_API_KEY` Script Property:**
Must be set in System B's Script Properties separately from System A. Already confirmed working. Property name: `BREVO_API_KEY`.

---

## PART 8 — NEXT SESSION STARTING POINT

### Immediate next step: Pass 2B Part 2 — Panel stubs

Build the three panel HTML files with proper tab structure:

**VoterJS.html** — `VoterPanel` object with `init()`. Tabs: My Ballot, Nominations Board, My Receipts, Help. All tabs show "coming soon" placeholder content. No live data calls yet.

**AdminJS.html** — `AdminPanel` object with `init()`. Tabs vary by role:
- RO_ADMIN: Elections, Nominations, Scrutiny, Candidates, Voters, Tally, Handover, Settings
- SCRUTINEER: Tally, Handover Checklist, Tally Sign-off
- OBSERVER: Results
- DEPUTY_RO / TEM: Same as RO_ADMIN with TEM auth bar

**ECOfficerJS.html** — `ECOfficerPanel` object with `init()`. Tabs: Elections Board, Voter Roll, Nominations Board, Messages, Settings.

### After panel stubs: Sheet setup

Create remaining 20 tabs. Priority: `Admins`, `Elections`, `AdminLog` first (needed for admin login and election creation tests).

A sheet initialisation function `initSystemBSheets()` should be written to create all tabs and header rows programmatically — faster and less error-prone than manual creation.

### Then: Pass 3

Begin building live functions into the voter panel — ballot loading, vote casting, tally display. Full function list in Step 3 Backend Function Map.

---

## PART 9 — NOTHING BLOCKING NEXT SESSION

All architecture decisions remain locked from Sessions 17–20. No open questions. No pending decisions.

**Files to upload to project knowledge after this session:**
- This handover note as `SSKZM_OBA_EMS_SESSION21_HANDOVER.md`
- Updated Master Brief (System B identifiers section needs updating with confirmed IDs)

---

*End of Session 21 Handover Note*
*Prepared: 27 May 2026*
