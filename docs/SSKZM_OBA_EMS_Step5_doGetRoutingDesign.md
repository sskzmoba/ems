# SSKZM OBA EMS — Step 5: doGet() Routing Design
*Prepared: 27 May 2026 — Architecture Refactor Series*
*System B only. Step 4 UI Page Map must be read alongside this document.*
*No code is written in this step. This is a design document only.*

---

## HOW TO READ THIS DOCUMENT

This document defines every URL route that `doGet(e)` must handle in System B. For each route it specifies:
- The `action` parameter value (or its absence)
- All other required and optional URL parameters
- What HTML is served or what function processes the request
- How submissions work (second doGet vs `google.script.run`)
- Error cases and how they are handled

This document is the direct input to Step 6 (Code.gs and HTML writing). No routing decisions need to be made in Step 6 — everything is specified here.

---

## PART 1 — ARCHITECTURE OVERVIEW

### 1.1 Entry Points

System B has one publicly deployed URL (the Apps Script web app URL). All traffic enters through `doGet(e)`. There is no `doPost`. There are no other public entry points.

The deployed URL is referred to as `DEPLOY_URL` throughout this document. It is set at deployment time and stored as `ScriptApp.getService().getUrl()`.

### 1.2 Route Categories

| Category | Count | Description |
|---|---|---|
| Shell routes | 2 | Serve an HTML file that bootstraps the SPA |
| Token-gated standalone pages | 13 | Self-contained pages served directly by doGet |
| Error/fallback | 1 | Unknown action values |
| **Total** | **16** | |

### 1.3 Two Patterns of Submission

**Pattern A — Second doGet (used for all standalone page form submissions)**
The standalone page renders a form. The form action is `DEPLOY_URL` with parameters encoded in the URL. Submitting the form triggers a new `doGet()` call with the submission action value. The result is a new HTML page. No `google.script.run` is involved.

This is the pattern inherited from System A for `confirmNom`/`submitConfirmNom`, `queryResponse`/`submitQueryResp`, `ecResponse`/`submitECResp`. It is extended for consent pages in System B.

*Why this pattern for standalone pages:* Standalone pages are served as raw `HtmlOutput` — they do not load the Apps Script JS runtime. They cannot call `google.script.run`. Form submissions must therefore be URL-based (second doGet).

**Pattern B — google.script.run (used for all SPA interactions)**
The SPA shell (`Index.html`) loads the full Apps Script JS runtime. All data calls from within the SPA use `google.script.run.functionName(params, successCallback, failureCallback)`. No doGet routes are defined for SPA actions — they are handled entirely client-side by the SPA routing, calling server functions directly.

### 1.4 What doGet Does NOT Handle

The following are **not** doGet routes. They are server-side functions called via `google.script.run` from within the SPA:
- Login (OTP send, OTP verify, session creation)
- All ballot actions (load ballot, cast vote)
- All nomination actions (submit nomination, scrutiny, etc.)
- All admin panel actions (status transitions, voter roll management, etc.)
- All data reads (tallies, voter lists, candidate lists, etc.)

### 1.5 Defensive Defaults

- A `null` or missing `e` parameter (direct function test) → serve landing page
- Recognised action with missing required parameters → error page (not landing page)
- Unrecognised action → error page (not landing page — avoids silently masking typos in emailed links)

---

## PART 2 — COMPLETE ROUTING TABLE

| Route # | Condition | Action value | Serves | Key params | Handler function(s) |
|---|---|---|---|---|---|
| R01 | No `action` param (or `e` is null) | — | `LandingPage.html` | none | `getLandingPageContent()`, `getPublicElectionStatus()`, `getPublicSchedule()` via SPA init |
| R02 | `action === 'app'` | `app` | `Index.html` | none | SPA bootstraps; all further calls via `google.script.run` |
| R03 | `action === 'login'` | `login` | `Index.html` | none | Alias for R02 — identical output |
| R04 | `action === 'verifyToken'` | `verifyToken` | Standalone verify page | `voteId` | `buildVerifyTokenPage(voteId)` |
| R05 | `action === 'confirmNom'` | `confirmNom` | Standalone roll-entry form | `nomId`, `role`, `token` | `buildConfirmRollForm(nomId, role, token)` |
| R06 | `action === 'submitConfirmNom'` | `submitConfirmNom` | Standalone result page | `nomId`, `role`, `token`, `roll` | `confirmNomination(nomId, role, token, roll)` → `buildConfirmResultPage(res, role)` |
| R07 | `action === 'queryResponse'` | `queryResponse` | Standalone query response form | `queryId`, `token` | `buildQueryResponseForm(queryId, token)` |
| R08 | `action === 'submitQueryResp'` | `submitQueryResp` | Standalone result page | `queryId`, `token`, `resp` | `submitQueryResponse(queryId, token, resp)` → result page |
| R09 | `action === 'ecResponse'` | `ecResponse` | Standalone EC response form | `nomId`, `token` | `buildECResponseForm(nomId, token)` |
| R10 | `action === 'submitECResp'` | `submitECResp` | Standalone result page | `nomId`, `token`, `resp` | `submitECResponse(nomId, token, resp)` → result page |
| R11 | `action === 'consentAccept'` | `consentAccept` | Standalone consent confirmation page | `nomId`, `token` | `buildConsentConfirmPage(nomId, token, 'accept')` |
| R12 | `action === 'submitConsentAccept'` | `submitConsentAccept` | Standalone result page | `nomId`, `token` | `confirmCandidateConsent(nomId, token)` → `buildConsentResultPage(res, 'accept')` |
| R13 | `action === 'consentDecline'` | `consentDecline` | Standalone consent decline page | `nomId`, `token` | `buildConsentConfirmPage(nomId, token, 'decline')` |
| R14 | `action === 'submitConsentDecline'` | `submitConsentDecline` | Standalone result page | `nomId`, `token` | `declineCandidateConsent(nomId, token)` → `buildConsentResultPage(res, 'decline')` |
| R15 | `action === 'tutorial'` | `tutorial` | Standalone tutorial page | none | `buildTutorialPage()` |
| R16 | Any other `action` value | (any) | Standalone error page | — | `buildErrorPage('PAGE_NOT_FOUND')` |

---

## PART 3 — PER-ROUTE SPECIFICATION

### R01 — Landing Page (no action)

**Condition:** `!e || !e.parameter || !e.parameter.action`

**Serves:** `LandingPage.html` via `HtmlService.createTemplateFromFile('LandingPage').evaluate()`

**How it works:** LandingPage.html is a full SPA-like page that bootstraps itself. On load, it calls `google.script.run.getPublicElectionStatus()`, `getLandingPageContent(electionId)`, and `getPublicSchedule(electionId)` to populate the election timeline widget and content blocks. It also offers buttons linking to `DEPLOY_URL?action=app` (voter login and admin login) and `DEPLOY_URL?action=tutorial`.

**Parameters:** None required.

**Error cases:** None — always renders. If data calls fail, the page degrades gracefully (shows static fallback text).

**Disposition:** MOD from System A. System A's landing page is a static HTML file. System B's landing page reads live data from the `LandingPageContent` sheet.

---

### R02 / R03 — SPA Shell (action=app or action=login)

**Condition:** `e.parameter.action === 'app'` OR `e.parameter.action === 'login'`

**Serves:** `Index.html` via `HtmlService.createTemplateFromFile('Index').evaluate()`

**How it works:** Index.html is the SPA shell. It loads `SharedJS.html`, and after login routes to either `VoterJS.html`, `AdminJS.html`, or `ECOfficerJS.html` depending on the authenticated role. All subsequent interactions are via `google.script.run`.

**Parameters:** None required at the doGet level. Role routing happens after login within the SPA.

**Note on `login` alias:** `action=login` is kept as a clean alias for links in emails and on the landing page that say "Login". It is identical to `action=app`. Both serve `Index.html`. No distinction in the served HTML.

**Error cases:** None at the doGet level — always renders. Login failures are handled within the SPA.

**Disposition:** MOD from System A. System A also serves `Index.html` as the fallback for all unrecognised actions. System B explicitly gates this to `app` and `login`, and uses a separate error page for unknown actions.

---

### R04 — Vote Receipt Verification (action=verifyToken)

**Condition:** `e.parameter.action === 'verifyToken'`

**Serves:** Standalone HTML page — `buildVerifyTokenPage(voteId)`

**Parameters:**
- `voteId` (required) — the receipt token from the voter's vote confirmation email

**How it works:** Voter navigates to the verification link (provided post-declaration). The page calls `verifyToken(voteId)` server-side (within `buildVerifyTokenPage`) and renders the result inline. Shows: post name, vote recorded timestamp, confirmation that a vote was recorded. Does NOT show the candidate voted for.

**Error cases:**
- `voteId` missing or empty → renders "No token provided. Please use the full link from your vote confirmation email."
- Token not found in Votes sheet → renders "No vote found for this token. Please check the link or contact the Returning Officer."
- Election not yet declared → renders "Results have not yet been declared. Vote verification is available after declaration."

**Disposition:** CF from System A. Page content and logic unchanged. Token validation function unchanged.

---

### R05 — Nomination Confirmation Form (action=confirmNom)

**Condition:** `e.parameter.action === 'confirmNom'`

**Serves:** Standalone HTML page — `buildConfirmRollForm(nomId, role, token)`

**Parameters:**
- `nomId` (required) — nomination ID
- `role` (required) — `proposer` or `seconder`
- `token` (required) — one-time confirmation token

**How it works:** The proposer or seconder has received an email with this link. The page shows: the nomination details (candidate name, post), the role being confirmed (proposer / seconder), and a Roll Number entry field. The Roll Number is required to verify identity before confirmation is recorded. On submit, the form POSTs to R06 (`action=submitConfirmNom`) with the same `nomId`, `role`, `token`, and the entered `roll`.

**Form submission URL:** `DEPLOY_URL?action=submitConfirmNom&nomId=[nomId]&role=[role]&token=[token]&roll=[entered_roll]`

**Error cases (at display time — before the form is submitted):**
- Any of `nomId`, `role`, `token` missing → error page: "This confirmation link is incomplete. Please use the full link from your email."
- `role` not `proposer` or `seconder` → error page: "Invalid link. Please contact the Returning Officer."
- Token validation deferred to R06 (not validated at display time — to avoid double-checking and to keep R05 a pure display step)

**Disposition:** CF from System A. Logic unchanged. `buildConfirmRollForm()` carry forward.

---

### R06 — Nomination Confirmation Processing (action=submitConfirmNom)

**Condition:** `e.parameter.action === 'submitConfirmNom'`

**Serves:** Standalone result page — `buildConfirmResultPage(res, role)`

**Parameters:**
- `nomId` (required)
- `role` (required)
- `token` (required)
- `roll` (required) — Roll Number entered by the user on R05 form

**How it works:** Calls `confirmNomination(nomId, role, token, roll)`. This function validates the token, checks that the roll number matches the stored proposer/seconder roll, enforces the nomination deadline, and writes the confirmation to the Nominations sheet. Returns a result object. `buildConfirmResultPage(res, role)` renders the outcome.

**Result page content (success):** "Thank you. Your [proposer / seconder] confirmation has been recorded for [Candidate Name] for the post of [Post Name]. You may close this window."

**Result page content (already confirmed):** "You have already confirmed this nomination. No further action is needed. You may close this window."

**Result page content (failure):** Reason string from `confirmNomination()` result object + "Please contact the Returning Officer."

**Error cases:**
- Any required parameter missing → error page: "This submission is incomplete. Please use the button on the confirmation page."
- All validation errors (wrong roll, expired token, deadline lapsed, nomination inactive) → handled within `confirmNomination()` and rendered by `buildConfirmResultPage()`

**Disposition:** CF from System A. Logic unchanged. Function signature unchanged.

---

### R07 — Query Response Form (action=queryResponse)

**Condition:** `e.parameter.action === 'queryResponse'`

**Serves:** Standalone HTML page — `buildQueryResponseForm(queryId, token)`

**Parameters:**
- `queryId` (required) — query ID from NomQueries sheet
- `token` (required) — one-time query response token

**How it works:** Candidate has received an RO query email. Page shows: query text, response textarea (min 10 chars), submit button. On submit, form sends to R08 (`action=submitQueryResp`).

**Form submission URL:** `DEPLOY_URL?action=submitQueryResp&queryId=[queryId]&token=[token]&resp=[encoded_response_text]`

**Note on response text encoding:** The `resp` parameter carries free text and must be URL-encoded by the form. Apps Script `e.parameter.resp` decodes it automatically.

**Error cases (display time):**
- Missing `queryId` or `token` → error page: "This response link is incomplete. Please use the full link from your email."
- Token not found or expired → error page: "This response link has expired or is invalid. Please contact the Returning Officer."

**Disposition:** CF from System A. `buildQueryResponseForm()` carry forward.

---

### R08 — Query Response Processing (action=submitQueryResp)

**Condition:** `e.parameter.action === 'submitQueryResp'`

**Serves:** Standalone result page

**Parameters:**
- `queryId` (required)
- `token` (required)
- `resp` (required) — response text

**How it works:** Calls `submitQueryResponse(queryId, token, resp)`. Validates token, checks response text is not empty, writes response to NomQueries sheet, updates query status to `responded`, logs to AdminLog, triggers RO notification email.

**Result page (success):** "Your response has been recorded and the Returning Officer has been notified. You may close this window."

**Result page (failure):** Error message from `submitQueryResponse()`.

**Error cases:** Missing params → error page. All validation handled within `submitQueryResponse()`.

**Disposition:** CF from System A.

---

### R09 — EC Response Form (action=ecResponse)

**Condition:** `e.parameter.action === 'ecResponse'`

**Serves:** Standalone HTML page — `buildECResponseForm(nomId, token)`

**Parameters:**
- `nomId` (required) — nomination ID that was referred to EC
- `token` (required) — EC response token

**How it works:** EC contact receives referral email. Page shows: the referral details (candidate name, post, reason for referral), response textarea, submit button. On submit, form sends to R10.

**Form submission URL:** `DEPLOY_URL?action=submitECResp&nomId=[nomId]&token=[token]&resp=[encoded_response]`

**Error cases (display time):**
- Missing `nomId` or `token` → error page
- Token not found or expired → error page

**Disposition:** CF from System A.

---

### R10 — EC Response Processing (action=submitECResp)

**Condition:** `e.parameter.action === 'submitECResp'`

**Serves:** Standalone result page

**Parameters:**
- `nomId` (required)
- `token` (required)
- `resp` (required)

**How it works:** Calls `submitECResponse(nomId, token, resp)`. Validates token, writes EC response to NomQueries sheet (EC_REFERRAL type), updates status to `ec_responded`, logs to AdminLog, triggers RO notification.

**Disposition:** CF from System A.

---

### R11 — Candidate Consent Confirmation Page (action=consentAccept)

**Condition:** `e.parameter.action === 'consentAccept'`

**Serves:** Standalone consent confirmation page — `buildConsentConfirmPage(nomId, token, 'accept')`

**Parameters:**
- `nomId` (required) — nomination ID
- `token` (required) — consent token

**How it works:** Phase 2 candidate receives consent request email. This page is a **display-only confirmation step** — it does NOT process the consent yet. Shows: candidate name, post, nominator name, and a clear "Accept this nomination" button. The button triggers a navigation to R12 (`submitConsentAccept`).

**Why two steps (not immediate processing):** Email pre-fetchers and link scanners may load the `consentAccept` URL automatically when the email arrives. If the consent were processed at R11, candidates could be automatically accepted without their knowledge. R11 therefore only shows the confirmation page. R12 (triggered by an explicit button press) does the processing.

**Button URL:** `DEPLOY_URL?action=submitConsentAccept&nomId=[nomId]&token=[token]`

**Error cases (display time):**
- Missing `nomId` or `token` → error page
- Token not found → error page: "This consent link is invalid. Please contact the Returning Officer."
- Already responded → shows result directly (not an error): "You have already accepted / declined this nomination."
- Nomination inactive (withdrawn/lapsed) → "This nomination is no longer active."

**Disposition:** MOD from System A. System A processes consent immediately at R11. System B adds the two-step pattern (display → submit) to protect against email pre-fetchers. `buildConsentConfirmPage()` is a new function.

---

### R12 — Candidate Consent Accept Processing (action=submitConsentAccept)

**Condition:** `e.parameter.action === 'submitConsentAccept'`

**Serves:** Standalone result page — `buildConsentResultPage(res, 'accept')`

**Parameters:**
- `nomId` (required)
- `token` (required)

**How it works:** Calls `confirmCandidateConsent(nomId, token)`. Validates token, marks consent as `accepted`, updates nomination status to `pending_confirmation` (awaiting proposer/seconder confirmation), triggers notification to nominator to confirm their proposal.

**Result page (success):** "You have accepted the nomination for [Post Name]. The nominator has been notified to confirm their proposal. If all confirmations are received by the nomination deadline, your nomination will proceed to scrutiny."

**Disposition:** MOD from System A. Previously `consentAccept` did both display and processing. Now processing is in `submitConsentAccept`.

---

### R13 — Candidate Consent Decline Page (action=consentDecline)

**Condition:** `e.parameter.action === 'consentDecline'`

**Serves:** Standalone decline confirmation page — `buildConsentConfirmPage(nomId, token, 'decline')`

**Parameters:**
- `nomId` (required)
- `token` (required)

**How it works:** Same two-step pattern as R11. Shows: candidate name, post, nominator name, a clear "Decline this nomination" button, and a note that declining will lapse the nomination. The decline button triggers R14.

**Button URL:** `DEPLOY_URL?action=submitConsentDecline&nomId=[nomId]&token=[token]`

**Error cases:** Same as R11.

**Disposition:** MOD from System A (same two-step protection).

---

### R14 — Candidate Consent Decline Processing (action=submitConsentDecline)

**Condition:** `e.parameter.action === 'submitConsentDecline'`

**Serves:** Standalone result page — `buildConsentResultPage(res, 'decline')`

**Parameters:**
- `nomId` (required)
- `token` (required)

**How it works:** Calls `declineCandidateConsent(nomId, token)`. Marks consent as `declined`, updates nomination status to `consent_declined`, logs to AdminLog, triggers notification to nominator that nomination has lapsed.

**Result page (success):** "You have declined the nomination for [Post Name]. The nomination has lapsed. The nominator has been notified."

**Disposition:** MOD from System A (two-step protection; logic otherwise unchanged).

---

### R15 — Tutorial Page (action=tutorial)

**Condition:** `e.parameter.action === 'tutorial'`

**Serves:** Standalone tutorial page — `buildTutorialPage()`

**Parameters:** None required.

**How it works:** Returns the interactive tutorial HTML (Requirement 11.1). This is a self-contained standalone page — no login required, no live data. Contains role-specific sections (Voter, RO, Scrutineer, Observer). Linked from the landing page.

**Error cases:** None — always renders.

**Disposition:** NEW. Not in System A. `buildTutorialPage()` is a new function.

---

### R16 — Unknown Action (error fallback)

**Condition:** `e.parameter.action` is present but not any of the recognised values above

**Serves:** Standalone error page — `buildErrorPage('PAGE_NOT_FOUND')`

**How it works:** Returns a clean error page. Does not reveal which actions are valid. Does not redirect to the landing page (which could mask link errors in emailed confirmation emails).

**Error page content:** "Page not found. If you arrived here from an email link, please check the link is complete and try again. If the problem persists, contact the Returning Officer."

**Disposition:** MOD from System A. System A falls through to landing page for unknown actions. System B explicitly errors — cleaner, and surfaces broken links rather than silently showing the landing page.

---

## PART 4 — ERROR PAGE DESIGN

### 4.1 Standard Error Page Template

All standalone error pages share a common HTML template. It takes two parameters: a short error code and a human-readable message. Error codes are used for AdminLog / debugging only — they are not shown to the user.

**Visual design:** Centred, max-width 500px. SSKZM OBA header (text only — no logo dependency). Error heading in dark red `#c0392b`. Message text. "If this problem persists, contact the Returning Officer" footer. No navigation links (standalone — the user may have arrived from an email and should not be offered the SPA).

**Error codes defined:**

| Code | Used by | User-facing trigger |
|---|---|---|
| `MISSING_PARAMS` | R05, R07, R09, R11, R13 | Incomplete link (missing URL params) |
| `INVALID_TOKEN` | R05, R07, R09, R11, R13 (display-time check) | Token not found or invalid |
| `EXPIRED_TOKEN` | R05, R07, R09, R11, R13 | Token found but deadline passed |
| `ALREADY_RESPONDED` | R05, R11, R13 | Already confirmed / consented |
| `NOMINATION_INACTIVE` | R11, R13 | Nomination withdrawn, lapsed, or no longer active |
| `VOTE_NOT_FOUND` | R04 | Receipt token not in Votes sheet |
| `RESULTS_NOT_DECLARED` | R04 | Verification attempted before declaration |
| `PAGE_NOT_FOUND` | R16 | Unknown action value |
| `SYSTEM_ERROR` | All routes (catch-all) | Unhandled exception in doGet |

### 4.2 Global Exception Handler

`doGet(e)` wraps the entire routing logic in a `try/catch`. Any unhandled exception falls to `buildErrorPage('SYSTEM_ERROR', err.toString())`. The error message shown to the user is generic ("A system error occurred"); the exception text is logged to AdminLog where possible and is embedded as an HTML comment in the error page source for debugging.

---

## PART 5 — SPA SHELL NOTES (for Step 6 reference)

The two shell routes (R02/R03) serve `Index.html`. Within `Index.html`, routing between screens S08–S55 is handled entirely by client-side JavaScript — no further doGet calls are made. This section records what the SPA shell must do at load time, because it affects what `Index.html` must contain.

**At SPA load:** The shell renders a loading state, then calls `google.script.run.getSession()` to check for an existing session. If a session exists, it routes directly to the appropriate role panel. If not, it shows the login screen (S08 for voters, or the Admin Login screen for admins depending on a toggle).

**Login screen selection:** A toggle or URL hash (`#admin`) could distinguish voter vs admin login entry points at the URL level. However, since `Index.html` is served for both `action=app` and `action=login`, and since the landing page buttons direct users to the correct login, no additional URL parameter is needed. The SPA shows the voter login by default; an "Admin Panel" link on the login screen routes internally to the admin OTP flow.

**Session handling:** Sessions are established via `google.script.run` calls within the SPA. The doGet routing layer has no knowledge of session state and performs no session checks.

---

## PART 6 — SCREEN COUNT UPDATE

Option 2 for Q2 (Scrutineer Confirmation) adds one new screen:

**S56 — Scrutineer — Tally Sign-off Tab (NEW)**
- File: AdminJS.html
- Tier: SCRUTINEER
- Visible when: election status is `closed` or `declared`
- Description: Part B confirmation. Shows final tally (all posts, all candidates, vote counts). Scrutineer enters a confirmation statement and clicks "Co-sign Tally". Calls `recordTallyCoSign(token, electionId, confirmation)`. On success, shows AdminLog timestamp of co-sign and prevents re-submission.
- Backend calls: `generateTally(token, electionId)`, `recordTallyCoSign(token, electionId, confirmation)`
- Disposition: NEW (Part A was always S46; this is Part B separated out)

**Revised screen count:**

| Category | Screens | CF | MOD | NEW |
|---|---|---|---|---|
| Public / unauthenticated | 7 | 5 | 1 | 1 |
| Shared login | 5 | 3 | 2 | 0 |
| Voter | 17 | 6 | 7 | 4 |
| EC Officer | 5 | 0 | 1 | 4 |
| Admin Panel (RO/TEM/Deputy RO) | 18 | 0 | 8 | 10 |
| Scrutineer-specific | 3 | 1 | 1 | **1** |
| Observer-specific | 1 | 0 | 1 | 0 |
| **Total** | **56** | **15** | **21** | **20** |

---

## PART 7 — DECISIONS LOCKED THIS STEP

All five open questions from Step 4 Part 11 are now closed.

| # | Question | Decision |
|---|---|---|
| Q1 | S39 Physical mode candidates list export | **Both** — CSV download (frontend) AND GDrive PDF (backend generates, link returned). Two separate export buttons on S39. |
| Q2 | Scrutineer Confirmation Part A/B placement | **Option 2** — Part A on Handover Checklist tab (S46). Part B as new Tally Sign-off tab (S56). S56 added to screen inventory. |
| Q3 | Observer nominations board (S55) | **Same S22 component**, rendered read-only. No separate screen. |
| Q4 | TEM AuthID prompt placement (S35–S52) | **Persistent top-bar**, grayed until a valid AuthID is entered. One bar per session. |
| Q5 | Appendix J checklist (S52) | **Hardcoded in UI** for now. Note as future-configurable from sheet. |

**Additional System B routing change vs System A:**
- Consent pages (R11–R14) now use the two-step display-then-submit pattern to prevent email pre-fetchers from auto-triggering consent. `buildConsentConfirmPage()` is a new function.
- Unknown actions now route to an error page (not silently to landing page).
- `action=tutorial` is a new route (R15) for the public tutorial page (Requirement 11.1).

---

## PART 8 — NOTES FOR STEP 6

These notes are directly relevant to writing `doGet()` in `Code.gs`.

1. **`doGet()` structure:** Use a single `if/else if` chain on `e.parameter.action`. Do not use a `switch` — Apps Script V8 supports it but the `if/else` chain is cleaner for early-return error handling.

2. **Null guard first:** The very first line of `doGet(e)` should be `if (!e || !e.parameter) { return serveLandingPage(); }` — this handles direct function invocations during testing.

3. **`doGetNomAction()` refactor:** System A delegates all nomination/consent actions to `doGetNomAction(e)`. In System B, this helper can be retained but should be extended to handle R11–R14 (the new two-step consent routes). All nomination/consent/query routes can stay delegated to `doGetNomAction(e)`.

4. **Title strings:** Every `HtmlService.createHtmlOutput()` call must include `.setTitle('SSKZM OBA — [Page Name]')`. Titles for each page:
   - Landing page: `SSKZM OBA Elections`
   - SPA shell: `SSKZM OBA Election Management System`
   - Vote verification: `Vote Verification — SSKZM OBA`
   - Nomination confirmation: `SSKZM OBA — Confirm Nomination`
   - Query response: `SSKZM OBA — Returning Officer Query`
   - EC response: `SSKZM OBA — EC Response`
   - Consent accept: `SSKZM OBA — Nomination Consent`
   - Consent decline: `SSKZM OBA — Nomination Consent`
   - Tutorial: `SSKZM OBA — How It Works`
   - Error page: `SSKZM OBA — Page Not Found` (generic for all error codes)

5. **`XFrameOptionsMode.ALLOWALL`:** All standalone pages returned by doGet should include `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` — this is the System A pattern and avoids iframe embedding issues.

6. **SPA shell template evaluation:** `Index.html` and `LandingPage.html` must be served via `HtmlService.createTemplateFromFile('FileName').evaluate()` — not `createHtmlOutputFromFile()` — because they use `<?= include('...') ?>` tags for JS includes.

7. **Standalone pages:** `buildVerifyTokenPage()`, `buildConfirmRollForm()`, `buildConfirmResultPage()`, `buildQueryResponseForm()`, `buildECResponseForm()`, `buildConsentConfirmPage()`, `buildConsentResultPage()`, `buildTutorialPage()`, and `buildErrorPage()` all return raw HTML strings, which are wrapped in `HtmlService.createHtmlOutput(html)` within `doGet()`. These builder functions live in `Code.gs`.

8. **`buildConsentConfirmPage()` is new:** Write it in Step 6. It is a display-only page with a prominent action button. It should show enough nomination context (candidate name, post, nominator name) for the candidate to recognise the request. It must NOT fetch or display sensitive information — only what is needed for the candidate to make their decision.

9. **`buildTutorialPage()` is new:** Returns a self-contained HTML string (with embedded CSS and JS). Content is static — no sheet reads. Can be built as a placeholder in Step 6 and populated with full content in a later step.

---

## PART 9 — STANDALONE PAGE SHARED DESIGN ELEMENTS

All standalone pages (R04–R15) share these design elements regardless of content:

- **Header:** "SSKZM Old Boys Association" in dark navy `#1a3a5c`, text-only (no image dependency)
- **Max width:** 560px, centred, `margin: 40px auto`
- **Font:** Arial, sans-serif, 15px base
- **Branding accent:** Thin gold `#b8960c` top border on header area, 3px
- **Footer line:** "For assistance, contact the Returning Officer at [RO_CONTACT_EMAIL placeholder]" in grey `#888`, 0.8rem
- **No navigation:** Standalone pages have no links to the SPA — they are self-contained end-states
- **Mobile responsive:** Single-column layout, touch-friendly button sizes (min 44px tap target)

---

*Step 5 complete. Step 6 is Code.gs doGet() implementation and HTML file structure.*
*No code written in this step. Design only.*
*Prepared: 27 May 2026*
