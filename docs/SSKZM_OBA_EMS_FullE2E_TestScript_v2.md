# SSKZM OBA EMS — Full End-to-End Test Script (v2)

Prepared 24 July 2026. Supersedes `SSKZM_OBA_EMS_FullE2E_TestScript.docx` (14 Jul 2026,
pre-SGM) **for the purpose of comprehensive feature testing** — that script stays as
historical record of the specific bugs it verified; this one covers the full lifecycle
plus everything built since, including today's candidate-photo-upload fix.

Run this on a call with TEM and both Scrutineers, same as the prior script. Two
elections are used — one full trial run, one narrow non-trial run solely to prove
five gates that trial elections skip.

| Field | Value |
|---|---|
| Election A ID (fill in) | |
| Election B ID (fill in) | |
| Session Date/Time | |
| RO | Shelley K Das |
| TEM | |
| Scrutineer 1 | |
| Scrutineer 2 | |

## Voter roster (Election A)

**Important — how this roster replaces the current roll.** `VoterRollDraft`/`Voters`
are global, not scoped per election — whatever's in them right now is what every
election's nominations validate against. The roll currently holds real data from the
Tier 2 trial election. That data is already safely archived (Election Record
downloaded, scrutiny-stage backups exist), so it's fine to fully replace it — but it
must be a genuine **replace**, not an append: `getPublicVoterRoll`/`getVoterRollRows`
show the entire draft unfiltered by objection status (marking old rows "removed"
doesn't hide them from view, only from certification), so simply adding rows on top
would leave real member names/rolls visible on the public voter-roll page during
testing.

**Do this as EC Officer** (CSV bulk-upload is the only UI path that actually replaces
the draft — `addVoterToDraft` in the RO panel only appends one row at a time and
would leave the old real rows mixed in): Voter Roll → Upload Draft Roll, using the
CSV below. This clears `VoterRollDraft` and replaces it with exactly these 24 rows.

```csv
RollNo,Name,Surname,Batch,Email,PhoneCC,Phone,Phone2CC,Phone2,VerificationCategory
T1001,Aarav,Nair,1985,shelleykdas@gmail.com,+91,9000000001,,,verified
T1002,Meera,Iyer,1990,shelleykdas@outlook.com,+91,9000000002,,,verified
T1003,Rohan,Menon,2015,shelleykdas@yahoo.com,+91,9000000003,,,verified
T2001,Test,ProposerPresident,1980,dummy2001@example.test,+91,9000002001,,,verified
T2002,Test,SeconderPresident,1982,dummy2002@example.test,+91,9000002002,,,verified
T2003,Test,CandidateVP,1988,dummy2003@example.test,+91,9000002003,,,verified
T2004,Test,ProposerVP,1989,dummy2004@example.test,+91,9000002004,,,verified
T2005,Test,SeconderVP,1991,dummy2005@example.test,+91,9000002005,,,verified
T2006,Test,ProposerGenSec,1992,dummy2006@example.test,+91,9000002006,,,verified
T2007,Test,SeconderGenSec,1993,dummy2007@example.test,+91,9000002007,,,verified
T2008,Test,CandidateTreasurer,1994,dummy2008@example.test,+91,9000002008,,,verified
T2009,Test,ProposerTreasurer,1995,dummy2009@example.test,+91,9000002009,,,verified
T2010,Test,SeconderTreasurer,1996,dummy2010@example.test,+91,9000002010,,,verified
T2011,Test,CandidateOrgSecy,2010,dummy2011@example.test,+91,9000002011,,,verified
T2012,Test,ProposerOrgSecy,2010,dummy2012@example.test,+91,9000002012,,,verified
T2013,Test,SeconderOrgSecy,2010,dummy2013@example.test,+91,9000002013,,,verified
T2014,Test,CandidateBatchRepA,1998,dummy2014@example.test,+91,9000002014,,,verified
T2015,Test,ProposerBatchRepA,1997,dummy2015@example.test,+91,9000002015,,,verified
T2016,Test,SeconderBatchRepA,2000,dummy2016@example.test,+91,9000002016,,,verified
T2017,Test,CandidateBatchRepB,1999,dummy2017@example.test,+91,9000002017,,,verified
T2018,Test,ProposerBatchRepB,1996,dummy2018@example.test,+91,9000002018,,,verified
T2019,Test,SeconderBatchRepB,1998,dummy2019@example.test,+91,9000002019,,,verified
T2020,Test,WrongBracketVoter,2003,dummy2020@example.test,+91,9000002020,,,verified
T2021,Test,DeclineCandidate,1985,dummy2021@example.test,+91,9000002021,,,verified
T2022,Test,ProposerDeclineCand,1986,dummy2022@example.test,+91,9000002022,,,verified
T2023,Test,TurnoutVoterA,2005,dummy2023@example.test,+91,9000002023,,,verified
T2024,Test,TurnoutVoterB,2012,dummy2024@example.test,+91,9000002024,,,verified
```

| Roll | Batch | Email | Role in this test |
|---|---|---|---|
| T1001 | 1985 | shelleykdas@gmail.com | **Real #1** — President candidate (Phase 1, self-nom, photo, rejected → appeal → upheld) |
| T1002 | 1990 | shelleykdas@outlook.com | **Real #2** — General Secretary candidate (Phase 2, consent, photo via retry) |
| T1003 | 2015 | shelleykdas@yahoo.com | **Real #3** — votes only (abstain/NOTA/tie-vote), files complaint + objection |
| T2001 | 1980 | dummy2001@example.test | Proposer — President (T1001) |
| T2002 | 1982 | dummy2002@example.test | Seconder — President (T1001) |
| T2003 | 1988 | dummy2003@example.test | Vice President candidate (manual entry, **with** photo) |
| T2004 | 1989 | dummy2004@example.test | Proposer — VP (T2003) |
| T2005 | 1991 | dummy2005@example.test | Seconder — VP (T2003) |
| T2006 | 1992 | dummy2006@example.test | Proposer (Phase 2 nominator) — Gen Sec (T1002) |
| T2007 | 1993 | dummy2007@example.test | Seconder — Gen Sec (T1002), added via "add seconder later" |
| T2008 | 1994 | dummy2008@example.test | Treasurer candidate (manual entry, **no** photo — retrofit later); also the objection target |
| T2009 | 1995 | dummy2009@example.test | Proposer — Treasurer (T2008) |
| T2010 | 1996 | dummy2010@example.test | Seconder — Treasurer (T2008) |
| T2011 | 2010 | dummy2011@example.test | Organising Secretary candidate (restricted-batch case, batch = OrgSecyBatch) |
| T2012 | 2010 | dummy2012@example.test | Proposer — Org Secy (T2011), same restricted batch |
| T2013 | 2010 | dummy2013@example.test | Seconder — Org Secy (T2011), same restricted batch |
| T2014 | 1998 | dummy2014@example.test | Batch Rep 1996-00 candidate **A** (Phase 1 self-nom, photo) — tie side 1 |
| T2015 | 1997 | dummy2015@example.test | Proposer — Batch Rep A (T2014), bracket 1996-00 |
| T2016 | 2000 | dummy2016@example.test | Seconder — Batch Rep A (T2014), bracket 1996-00 |
| T2017 | 1999 | dummy2017@example.test | Batch Rep 1996-00 candidate **B** (manual entry) — tie side 2 |
| T2018 | 1996 | dummy2018@example.test | Proposer — Batch Rep B (T2017), bracket 1996-00 |
| T2019 | 1998 | dummy2019@example.test | Seconder — Batch Rep B (T2017), bracket 1996-00 |
| T2020 | 2003 | dummy2020@example.test | Wrong-bracket voter (2001-05) — deliberate mismatch attempt against Batch Rep A/B |
| T2021 | 1985 | dummy2021@example.test | Phase 2 "decline consent" candidate target (never accepted) |
| T2022 | 1986 | dummy2022@example.test | Proposer (Phase 2 nominator) — decline-test candidate (T2021) |
| T2023 | 2005 | dummy2023@example.test | General turnout / NOTA-padding voter |
| T2024 | 2012 | dummy2024@example.test | General turnout voter; casts the other tie-breaking vote on Batch Rep 1996-00 |

Dummy emails are placeholders — never real addresses. Every confirmation step for a
dummy identity (proposer/seconder confirm, Phase-2 consent) is completed by RO/TEM
directly via the **unchecked "Send email"** checkbox (default for trial elections) →
"share this link manually" → open the link → type that dummy's roll number as the
second factor. No dummy inbox is ever needed.

---

## Part 0 — Pre-flight

*Who: RO*

- [ ] 1. Confirm latest `Code.js`/`AdminJS.html`/`VoterJS.html` are deployed (Deploy →
      Manage Deployments — version number matches today's deploy).
      **Expected:** version visible matches the deployment made today.
- [ ] 2. `clasp pull` — confirm no diff between local and deployed.
      **Expected:** clean pull, no unexpected changes.
- [ ] 3. Create **Election A**: title "TEST — Full E2E v2", Mode Electronic, Trial
      Election = Yes, Internal Test Election = Yes.
      **Expected:** both "Trial" and "Internal Test" badges appear on the election.
- [ ] 4. Create **Election B**: title "TEST — Gate Verification (do not advance)",
      Trial Election = **No**, Internal Test Election = Yes.
      **Expected:** "Internal Test" badge only, no "Trial" badge.

---

## Part 1 — Voter roll draft build (Election A)

*Who: EC Officer for step 1 (only role with the bulk-replace UI), RO/TEM after*

- [ ] 1. As EC Officer: Voter Roll → Upload Draft Roll, using the CSV block above.
      This **replaces** `VoterRollDraft` entirely — the current real Tier 2 data is
      gone from the draft in this one action (already safely archived — Election
      Record downloaded, scrutiny-stage backups exist).
      **Expected:** exactly 24 rows in the draft list, all matching the roster
      table, no leftover real names/rolls from Tier 2.
- [ ] 2. Pick any one dummy row (e.g. T2023) and mark it **Objected** via the
      per-row status dropdown, with a note.
      **Expected:** row shows "Objected" status.
- [ ] 3. Attempt **Certify Voter Roll**.
      **Expected:** blocked — "Cannot certify: 1 objection(s) unresolved. Mark each
      as Retained or Removed first."
- [ ] 4. Resolve the objection on T2023 as **Retain**.
      **Expected:** objection cleared, no longer blocks certification.
- [ ] 5. **Do not certify yet** — Part 3 needs the roll in draft state first.

---

## Part 2 — Draft voter roll editing (this session's feature)

*Who: RO/TEM*

- [ ] 1. Edit T2020's name/surname and email via the draft-roll edit form.
      **Expected:** saves correctly, AdminLog entry records what changed.
- [ ] 2. Edit T2015's batch from 1997 to 2002 (crosses the 1996-00 → 2001-05 bracket
      boundary) — T2015 is an active proposer on Batch Rep candidate T2014's
      nomination.
      **Expected:** blocked. Message explicitly names withdraw-and-renominate as
      the remedy, not just "resolve the nomination first."
- [ ] 3. Revert T2015's batch back to 1997.
      **Expected:** saves cleanly, no lingering block.

---

## Part 3 — Public voter roll page (SOP 3.4, pre-certification)

*Who: anyone, logged out*

- [ ] 1. Visit `?action=voterroll` while the roll is still in draft (not yet
      certified).
      **Expected:** "Draft Voter Roll" heading, objection-deadline banner (if a
      schedule is set) or no banner (if not), every roster row's Roll/Name/Batch
      only — **no email column anywhere**, search box filters correctly.
- [ ] 2. Confirm the remedy copy names the RO as the contact (not EC/VVA), matching
      `roContactFooter()`.
      **Expected:** RO contact line appears, matches every other public page.
- [ ] 3. **Certify the voter roll now** (`certifyVoterRoll`), before any nomination
      testing begins. This must happen here, not later: `Voters` (once certified)
      takes priority over `VoterRollDraft` in every roll lookup system-wide — if the
      Tier 2 roll was ever certified, its real data would otherwise silently
      override this synthetic roster for every nomination/candidate lookup from
      Part 4 onward. Certifying now fully replaces `Voters` with exactly these 24
      rows.
      **Expected:** `Voters` count = 24, matches the synthetic roster exactly, no
      leftover Tier 2 entries.

---

## Part 4 — Phase 1 nominations (self-nomination)

*Who: T1001 (real), T2003/T2014 (dummy, entered as if self — see note)*

- [ ] 1. Log in as **T1001** (shelleykdas@gmail.com, real OTP). Nominate Myself for
      **President**, proposer T2001, seconder T2002. Enter a bio under 30 characters
      first.
      **Expected:** blocked client-side before submission, clear message.
- [ ] 2. Enter a valid bio (30+ chars). Attach a photo. Confirm the live preview
      (thumbnail + "Photo ready to upload") appears **immediately** on file selection,
      before submitting.
      **Expected:** preview shows without submitting.
- [ ] 3. Submit.
      **Expected:** success card shows; no photo-upload warning (upload succeeded).
      Photo later shows correctly as an actual image (not a broken link) once
      accepted onto the ballot.
- [ ] 4. As RO, use "Send email" **unchecked** → grab T2001's proposer-confirm link,
      open it, type roll `T2001` as the second factor, confirm. Repeat for T2002
      (seconder).
      **Expected:** both confirmations succeed; nomination status becomes
      `pending_scrutiny`.
- [ ] 5. Log in as **T2014** (dummy — RO opens the nomination form directly using
      this roll's OTP-bypassed test path is **not** available; instead, RO
      completes this nomination via **Manual Entry** naming T2014 as candidate,
      **not** as a live self-nomination login — see Part 6 for the manual-entry
      photo test instead). *(Note: only real-email identities can literally log in
      themselves; dummy self-nominations are simulated via Manual Entry — this
      keeps Part 4's live self-nomination proof scoped to T1001, and Part 6 covers
      manual entry separately with T2014's counterpart T2017.)*

**Verifies:** bio validation (client+server), live photo preview wiring, successful
upload + embeddable URL, Phase 1 flow end-to-end.

---

## Part 5 — Phase 2 nominations

*Who: T2006/T2022 (dummy, via manual-link relay), T1002 (real)*

- [ ] 1. As RO, use Manual-link relay to have "T2006" submit a Phase 2 nomination
      (Nominate Another Member) for **General Secretary**, candidate **T1002**, no
      seconder yet. (Since T2006 is dummy, RO performs this submission directly on
      the Nominations tab using T2006's roll as the proposer of record.)
      **Expected:** nomination created, status `consent_pending`; consent email
      logically due to T1002.
- [ ] 2. Log in as **T1002** (shelleykdas@outlook.com, real OTP). Open the consent
      link (RO shares manually, unchecked-email path). Accept consent.
      **Expected:** status remains `consent_pending` until seconder also confirms
      (no seconder yet) — or moves to `pending_scrutiny` if this is the last
      requirement; confirm actual behavior matches Code.js's documented status
      chain.
- [ ] 3. Use **Add Seconder** (from My Nominations, as T1002, or RO on their
      behalf) to add **T2007** as seconder.
      **Expected:** seconder-confirm link generated for T2007.
- [ ] 4. RO relays T2007's confirm link (unchecked-email), types roll `T2007`,
      confirms.
      **Expected:** nomination reaches `pending_scrutiny`.
- [ ] 5. Still logged in as **T1002**: open **My Nominations**, use the new **"Add
      Photo"** affordance (since Phase 2 has no photo step at submission). Upload a
      photo.
      **Expected:** thumbnail appears in My Nominations immediately after upload;
      no silent failure.
- [ ] 6. Separately: as RO, submit a second Phase 2 nomination — proposer
      **T2022**, candidate **T2021** — then, as RO, use the **Decline** consent
      link for T2021 (simulating T2021 declining).
      **Expected:** status becomes `consent_declined` (terminal); confirm T2021 is
      now free to be re-nominated if desired (not required to actually re-nominate,
      just confirm no lingering block).
- [ ] 7. Attempt a nomination where proposer is **T2020** (batch 2003, bracket
      2001-05) and candidate is **T2014** (batch 1998, bracket 1996-00) for
      **Batch Representative 1996-00**.
      **Expected:** rejected — "proposer must be from the same batch bracket
      (1996-00)."

**Verifies:** Phase 2 full lifecycle, consent accept/decline, add-seconder-later,
My Nominations photo retry (today's fix), Batch Rep bracket mismatch.

---

## Part 6 — Manual RO entry

*Who: RO/TEM*

- [ ] 1. Manual Entry: candidate **T2003** (Vice President), proposer **T2004**,
      seconder **T2005**, bio 30+ chars, **attach a photo** in the same form before
      submitting.
      **Expected:** nomination created with `entryMethod=manual_ro`; photo uploads
      successfully as part of the same action (today's fix — capturing
      `nominationId` and chaining the photo upload).
- [ ] 2. Manual Entry: candidate **T2008** (Treasurer), proposer **T2009**,
      seconder **T2010**, bio 30+ chars, **no photo** this time.
      **Expected:** nomination created, no photo.
- [ ] 3. Manual Entry: candidate **T2017** (Batch Rep 1996-00, tie side B), proposer
      **T2018**, seconder **T2019**.
      **Expected:** created successfully — same bracket, no rejection.
- [ ] 4. Manual Entry: candidate **T2011** (Organising Secretary), proposer
      **T2012**, seconder **T2013** — first confirm the election's Org Secy
      restricted batch is set to **2010** before this step.
      **Expected:** created successfully (all three are batch 2010).
- [ ] 5. Attempt **Accept** on T2008 (Treasurer) before uploading any of its 3
      required supporting documents (category `manual_ro_nomination`).
      **Expected:** blocked — "requires 3 supporting documents."
- [ ] 6. Upload 3 supporting documents against T2008's nomination. Retry Accept.
      **Expected:** succeeds once all 3 are present.
- [ ] 7. From the Nominations list, use the new **"Upload/Replace Photo"** retrofit
      button on T2008 (which still has no photo) to attach one now.
      **Expected:** thumbnail appears on the list immediately.

**Verifies:** manual-entry photo-at-submission (today's fix), 3-doc gate before
accept, retrofit photo button (today's fix), Org Secy restricted-batch valid case.

---

## Part 7 — Handover / Admins / Settings restructuring (this week)

*Who: RO and a DEPUTY_RO test login if available*

- [ ] 1. Confirm the **EC Officer Lockout** panel now lives under Admins, not
      Handover.
      **Expected:** panel present under Admins, absent from Handover.
- [ ] 2. Confirm sheet-protection and GitHub-transfer action cards now live under
      Settings.
      **Expected:** present under Settings, absent from Handover.
- [ ] 3. Confirm Handover tab now shows only Draw of Lots + Election Record.
      **Expected:** matches — nothing else present.
- [ ] 4. If a DEPUTY_RO login is available, confirm parity for Admins and Settings
      tabs.
      **Expected:** DEPUTY_RO sees the same panels RO does in both tabs.

---

## Part 8 — Scrutiny

*Who: RO/TEM*

- [ ] 1. Run `saveScrutinyItem` checks (post eligibility, tenure bar) for each
      pending nomination not auto-assessed.
      **Expected:** results recorded per nomination.
- [ ] 2. Accept: T2003 (VP), T1002 (Gen Sec), T2008 (Treasurer, after Part 6 step
      6-7), T2011 (Org Secy), **both** T2014 and T2017 (Batch Rep 1996-00 — this is
      the deliberate tie).
      **Expected:** all succeed; both Batch Rep 1996-00 candidates now show
      `accepted`.
- [ ] 3. Reject **T1001** (President) with a reason of 5+ characters (deliberate,
      to exercise the appeal flow next).
      **Expected:** rejected, reason recorded, candidate emailed (or link shown).
- [ ] 4. Exercise `undoAcceptNomination` on one arbitrary accepted nomination, then
      redo the accept.
      **Expected:** reverts to `pending_scrutiny`, Candidates row removed; re-accept
      restores it.

**Verifies:** scrutiny checklist gate, one-post rule, undo paths, deliberate tie
setup for Part 12's draw of lots.

---

## Part 9 — Publication, objections, appeals, complaints

*Who: T1001 (real), T1003 (real), RO*

- [ ] 1. `publishCandidates`.
      **Expected:** candidate-list-published notice fires; nominations board now
      shows accepted candidates only.
- [ ] 2. Log in as **T1001** (real). File an **appeal** against their own rejection.
      **Expected:** appeal recorded, Appeals Panel notified.
- [ ] 3. As RO: upload a ruling document, then mark the appeal **Upheld**.
      **Expected:** nomination reinstated to `pending_scrutiny`; election status
      rolls back from `candidates_published` to `scrutiny`; `CandidatesPublishedAt`
      cleared.
- [ ] 4. Re-scrutinize and **accept** T1001 (President). Re-run `publishCandidates`.
      **Expected:** T1001 now shows as an accepted, published candidate.
- [ ] 5. Log in as **T1003** (real). File a nomination-**objection** against
      T2008 (Treasurer, now accepted).
      **Expected:** objection recorded; Appeals Panel notified only via the
      batched consolidated summary at window close, not immediately per-objection.
- [ ] 6. Still as T1003: file a **complaint** (any content/target).
      **Expected:** complaint recorded with status `filed`; confirm election status
      is completely unaffected by this — no gate anywhere checks Complaints.

**Verifies:** appeal-upheld rollback (`candidates_published → scrutiny`),
objection vs. complaint distinction, complaints never block advancement.

---

## Part 10 — Mandatory-posts + PreSec gates

*Who: RO/TEM*

- [ ] 1. Before all four mandatory posts (President, Vice President, General
      Secretary, Treasurer) have an accepted candidate, attempt to move to
      `active` (open voting).
      **Expected:** blocked, names the empty post(s).
- [ ] 2. Once all four are filled (per Parts 6/8/9 above), retry.
      **Expected:** mandatory-posts gate passes.
- [ ] 3. Confirm the PreSec Security Checklist gate is **skipped** for this trial
      election (expected behavior, not a bug — confirm it does *not* block).
      **Expected:** no PreSec block on a trial election.

---

## Part 11 — Voting

*Who: T1001, T1002, T1003 (real), T2023, T2024 (dummy, RO relays their vote per
their instructions since they have no real inbox — note dummy voters cannot
literally cast their own vote without a real login; substitute two more real-email
sessions if you want genuinely independent dummy voting, otherwise RO documents
these as "simulated on behalf of" in the sign-off notes)*

- [ ] 1. Activate voting (`updateElectionStatus → active`).
- [ ] 2. Log in as **T1003** (real). **Abstain** on one post (e.g. Organising
      Secretary), cast **NOTA** on another (e.g. Vice President), and vote for a
      candidate on Batch Rep 1996-00 (pick T2014 or T2017 — this is one side of
      the tie).
      **Expected:** abstain returns success with no Votes/VotedLog row written
      (confirm via AdminLog / sheet inspection is RO-only, not a raw sheet read by
      you — just confirm via re-visiting the ballot that the post is still votable).
- [ ] 3. Return to the ballot as T1003 and confirm the abstained post **can still
      be voted** (no idempotency lock from an abstain) — cast NOTA or a real vote
      there now.
      **Expected:** succeeds; abstain never locked the post.
- [ ] 4. Cast the second, opposite tie-breaking vote on Batch Rep 1996-00 (the
      candidate T1003 did *not* vote for) from another real or RO-relayed session.
      **Expected:** 1-1 tie exists on this post once voting closes.
- [ ] 5. Confirm every confirmation dialog encountered is an in-page modal, not a
      native browser `confirm()` popup.
      **Expected:** in-page modals throughout.

**Verifies:** Abstain fix (return-and-revote), NOTA, roll-number-bearing ballot,
deliberate tie for Part 12.

---

## Part 12 — Close + draw of lots

*Who: RO/TEM triggers, both Scrutineers witness*

- [ ] 1. Close voting.
      **Expected:** `ELEC_VOTES_HASH` computed, emailed to active Scrutineers.
- [ ] 2. Run `conductDrawOfLots` (in-system randomiser) on the tied Batch Rep
      1996-00 post.
      **Expected:** a winner is picked, raw random value logged for auditability.
- [ ] 3. Both Scrutineers each call `confirmDrawOfLotsScrutineer` once (two-slot
      witness pattern).
      **Expected:** both confirmations recorded; a third attempt (same Scrutineer
      again) is rejected; the draw would be treated as final only once both slots
      are filled.
- [ ] 4. Confirm the legacy manual `recordDrawOfLots` form is still present and
      usable as an alternative (SOP §8.4 — RO's choice of method), even though you
      used the randomiser here.
      **Expected:** form exists, unaffected by having used the other method.

---

## Part 13 — Tally co-sign

*Who: RO/TEM attempts (expect block), both Scrutineers co-sign*

- [ ] 1. Attempt to have RO or TEM co-sign the tally.
      **Expected:** blocked — `recordTallyCoSign` is SCRUTINEER-role only.
- [ ] 2. Both active Scrutineers co-sign with a confirmation statement (5+ chars
      each).
      **Expected:** both recorded; live-tally dashboard shows both as cosigned.

---

## Part 14 — Declare + public leak check + Election Record

*Who: RO/TEM declares; anyone checks the public page logged out*

- [ ] 1. Declare results (`updateElectionStatus → declared`).
      **Expected:** `sendResultsDeclaredNotice` fires; hash re-verified against the
      Votes sheet, matches.
- [ ] 2. Log out completely (or use a private/incognito window). Open the public
      results page directly — both the default "most recent declared" view and, if
      you know Election A's ID, by ID directly in the URL.
      **Expected:** Election A's results **never** appear either way — it's
      `isInternalTest=true`, filtered from `getPublicResults` regardless of
      declared status. (If a real declared election exists separately, that one
      still displays correctly.)
- [ ] 3. Generate `generateElectionRecordPDF`.
      **Expected:** PDF produced; spot-check it includes: final tally + winners,
      tie detection on Batch Rep 1996-00, tally co-sign log, hash-verification log,
      draw-of-lots log, full scrutiny log, complaints, appeals (incl. the upheld
      one and the objection), and the known-gaps notes section.

**Verifies:** public-results internal-test leak filter, Election Record completeness.

---

## Part 15 — Gate-verification election (Election B, non-trial, never advanced)

*Who: RO/TEM — every step here is expected to FAIL/block*

- [ ] 1. Set a schedule on Election B with a voting-close date **less than V-9**
      from today (a deliberate floor violation) and attempt to save it live
      (`scheduleMode: 'live'`).
      **Expected:** blocked by `checkScheduleFloors`.
- [ ] 2. Attempt to open nominations (`draft → nominations_open`) on Election B
      **without** locking EC Officers first.
      **Expected:** blocked — EC-lockout-before-nominations gate fires (this gate
      is skipped only for trial elections; Election B is non-trial).
- [ ] 3. Attempt the same transition **without** a draft voter roll uploaded.
      **Expected:** blocked — draft-roll-required gate fires.
- [ ] 4. Get Election B to `candidates_published` by whatever minimal path is
      needed (or confirm this step is impractical without real data — if so, note
      it and skip to step 5 using a documented assumption instead of building out
      a full nomination set on Election B), then attempt to activate voting
      **without** completing the PreSec Security Checklist.
      **Expected:** blocked — PreSec-checklist-before-activate gate fires.
- [ ] 5. If voting was reached, close it, then attempt to declare **without** all
      active Scrutineers co-signing.
      **Expected:** blocked — co-sign-before-declare gate fires, names the
      outstanding Scrutineer(s).

**Verifies:** all five gates that Election A (trial) could never prove, per
BRIDGE_NOTE.md C.2/D.1.

---

## Part 16 — Cleanup

*Who: RO/TEM, with TEM AuthID and the confirmation phrase*

- [ ] 1. On Election A: **Purge Trial Data**, typing `CONFIRM PURGE`.
      **Expected:** Candidates/Votes/VotedLog/Nominations/ScrutinyLog/Complaints/
      Appeals/OTPs cleared for Election A; election resets to `draft`. Voter roll,
      Admins, and TEM config remain untouched.
- [ ] 2. On Election B: since it never had transactional data, either delete it or
      leave it in `draft` — no purge needed (and `purgeTrialData` would refuse it
      anyway, being non-trial).

**Note on the voter roll itself**: `purgeTrialData` never touches `VoterRollDraft`/
`Voters`, and there's no dedicated function to clear them — the synthetic 24-row
roster will remain in the system after this cleanup. That's expected, not a gap to
fix now: when the real election process restarts from a fresh VVA export, the EC
Officer's `uploadVoterRollDraft` upload will fully replace the draft again (same
mechanism used in Part 1), and the next `certifyVoterRoll` will fully replace
`Voters` again — exactly the reset this test relied on to safely supersede the old
Tier 2 data in the first place. No manual roll cleanup is required before then.

---

## Sign-Off

Record Pass/Fail and notes for each Part above, then sign below.

| Role | Name | Signature | Date/Time |
|---|---|---|---|
| RO | Shelley K Das | | |
| TEM | | | |
| Scrutineer 1 | | | |
| Scrutineer 2 | | | |

---

## Not covered by this script (deliberately out of scope)

- Automated/"auto-mode" execution — this is a manual, human-executed script. A
  separate follow-on (Playwright browser automation against the deployed URL) is a
  distinct, larger piece of work to scope only if/when requested.
- Full 19-post coverage — this script exercises a representative subset (4
  mandatory posts + Organising Secretary + one Batch Rep bracket with a deliberate
  tie) rather than nominating for all 13 Batch Rep brackets, to keep manual data
  entry proportionate. Extend the roster table above if full-post coverage is
  wanted later.
