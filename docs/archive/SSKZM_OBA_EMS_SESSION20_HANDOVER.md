# SSKZM OBA EMS — SESSION 20 HANDOVER NOTE
*To be read first in any new chat continuing the architecture work.*
*Prepared: 27 May 2026 — end of Session 19/20*

---

## HOW TO USE THIS FILE

Before doing anything in the new chat:

1. Read `SSKZM_OBA_MASTER_BRIEF_UPDATED.md` (the updated version produced this session — upload it to replace the old one if not yet done)
2. Read `SSKZM_OBA_EMS_SESSION18_HANDOVER.md`
3. Read `SSKZM_OBA_EMS_Step3_BackendFunctionMap.md`
4. Read `SSKZM_OBA_EMS_Step3_Amendments.md`
5. Read `SSKZM_OBA_EMS_Step4_UIPageMap.md`
6. Read this file in full
7. The next task is **Step 5 — doGet() Routing Design**

---

## PART 1 — WHAT WAS ACCOMPLISHED THIS SESSION

### Step 3 — Backend Function Map — COMPLETE
Full function map produced and locked. Files:
- `SSKZM_OBA_EMS_Step3_BackendFunctionMap.md`
- `SSKZM_OBA_EMS_Step3_Amendments.md`

Summary: 76 carry forward, 35 modify, 7 deprecate, 44 new functions across 14 new modules. All COL index conflicts checked — none found. Full details in Step 3 documents.

### Step 4 — UI Page Map — COMPLETE
Full screen inventory produced. File: `SSKZM_OBA_EMS_Step4_UIPageMap.md`

Summary: 55 screens across 8 access tiers. 15 carry forward, 21 modify, 19 new. File structure for System B defined (6 HTML files). 5 open questions documented in Part 11 of the Step 4 document — none are blocking Step 5.

### Master Brief — Updated
`SSKZM_OBA_MASTER_BRIEF_UPDATED.md` fully updated with 4 passes:
- Pass 1: Section 3 — Two-system architecture (3A frozen / 3B active), new SHEETS + COL constants
- Pass 2: Section 7 — Access tiers table, TEM proper login design, Deputy RO, RO Authorisations, build status
- Pass 3: Header + start instruction + Section 11 project files guide
- Pass 4: Section 13 pending items + Section 14 session log

**Action required:** Upload the new `SSKZM_OBA_MASTER_BRIEF_UPDATED.md` to project knowledge to replace the old version.

---

## PART 2 — KEY DECISIONS LOCKED THIS SESSION

### Two-System Architecture
- **System A** — frozen, no further development, emergency fallback only
- **System B** — new Apps Script project, new Sheet, new URL — all TBD (must be created before Step 6 code writing begins)
- All trials (Trial Tier 1 before July SGM, Trial Tier 2) run on System B

### TEM Architecture (from Step 3 Amendments)
- TEM has full RO_ADMIN-equivalent access
- Every write action requires valid AuthorisationID from RO
- AuthID scope: `specific_actions` (multi-select from exhaustive enum) or `ALL_ACTIONS` (blanket)
- Single-use per action slot; revocable by RO at any time
- `requiresTEMAuth(sess, authId, actionType)` internal helper gates all write functions
- `recordROAuthorisation` new signature: `(token, electionId, scope, actionTypes, notes)` — enum-validated, no free text
- `revokeROAuthorisation(token, authId)` new function
- Exhaustive `TEM_AUTHORISABLE_ACTIONS` list confirmed from Session 18 — drives RO dropdown

### Physical Mode Architecture
- EMS operational role ends at `candidates_published` for physical elections
- `recordPhysicalVote` removed from design
- `inputPhysicalResults` deferred (low priority, future)

### Mandatory Posts
- **President, Vice President, General Secretary, Treasurer**
- VP is a **group check** — at least one VP-named post filled (any post starting with "Vice President")
- No RO override; General Body resolution required to proceed

### Nominations Board
- Visible to authenticated VOTER from `nominations_open` status onward
- Only fully confirmed nominations: Phase 1 = prop + sec confirmed; Phase 2 = candidate consent accepted + prop confirmed + sec confirmed
- Phase 1 candidate consent is implicit (no separate confirmation step)
- Shows: name, post, bio, photo — no roll numbers, no proposer/seconder identity

### COL Constants Architecture
- Separate named objects per new tab: `COL_VRD`, `COL_CMP`, `COL_APL`, `COL_OBS`, `COL_MSG`, `COL_ECDB`, `COL_SCHED`, `COL_TEMA`, `COL_RPL`, `COL_LPC`
- Main `COL` object extended with new columns for modified existing tabs (no conflicts)

---

## PART 3 — STEP 5 STARTING POINT

Step 5 is the **doGet() Routing Design**. The approach:

1. Read the Step 4 UI Page Map — every screen has an ID (S01–S55)
2. Map every URL parameter combination to a screen or HTML file
3. Define the routing logic in `doGet(e)` — which `action` values route where, what parameters each expects, what HTML file is served
4. Handle error cases (invalid token, unknown action, etc.)
5. Produce the complete routing table as the Step 5 deliverable

Key inputs for Step 5:
- Current `doGet()` in `1_Code_gs.md` (System A reference — do not copy, use as reference)
- Step 4 UI Page Map — all 55 screens with their action parameters
- Step 3 function map — `doGetNomAction()` is the nomination link handler to carry forward

Do not write any code in Step 5. The output is a routing design document only. Code writing is Step 6.

**Before Step 5, answer these open questions from Step 4 Part 11 (none are blocking but all affect the routing design):**

1. Physical mode candidates list export — CSV download or GDrive PDF? (affects S39)
2. Scrutineer Confirmation Part A/B — on Handover Checklist tab or separate tab? (affects S46)
3. Observer nominations board — same S22 component or separate? (proposed: same, read-only)
4. TEM AuthID prompt — inline per-action or persistent top-bar? (proposed: persistent bar)
5. Appendix J checklist — hardcoded in UI or managed from sheet? (proposed: hardcoded for now)

---

## PART 4 — FILES PRODUCED THIS SESSION

All in project outputs. Upload to project knowledge:

| File | Action |
|---|---|
| `SSKZM_OBA_MASTER_BRIEF_UPDATED.md` | **Upload to replace old Master Brief** |
| `SSKZM_OBA_EMS_Step3_BackendFunctionMap.md` | Upload as new project file |
| `SSKZM_OBA_EMS_Step3_Amendments.md` | Upload as new project file |
| `SSKZM_OBA_EMS_Step4_UIPageMap.md` | Upload as new project file |
| `SSKZM_OBA_EMS_SESSION20_HANDOVER.md` | **This file** — upload as new project file |

---

## PART 5 — NOTHING TO RESOLVE BEFORE NEXT SESSION

All architecture decisions are closed. No open items block Step 5. The five open questions in Step 4 Part 11 are noted and can be answered at the start of Step 5 or during it — they do not block starting.

The only action that blocks Step 6 (code writing) — but not Step 5 — is creating the System B Apps Script project and Sheet. That can happen in parallel with or after Step 5.

---

*End of Session 20 Handover Note*
*Prepared: 27 May 2026*
