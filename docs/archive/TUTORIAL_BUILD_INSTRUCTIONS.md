# Tutorial Page — Build Instructions
**Status:** Deferred — build after EMS is feature-complete
**Last updated:** 11 June 2026

---

## Decision to defer

The tutorial is to be built after the full EMS is feature-complete. Building it before then means documenting a moving target and will require a redo. A simple "Tutorial coming soon" placeholder should be returned by `buildTutorialPage()` in the interim so that `?action=tutorial` does not error during trials.

---

## Concept

The tutorial is a **role-based interactive walkthrough** of the actual EMS interface. It is not a simplified mock or an accordion of text explanations.

**Core idea:** Each role is selectable as a button. Tapping a role takes the user to a faithful reproduction of that role's actual panel — same tab bar, same layout, same screens — with callout overlay buttons on every significant element. Tapping a callout opens a bottom drawer explaining what that element does and why, in plain language written for senior alumni who may not be tech-savvy.

The user navigates between tabs exactly as they would in the real system. The tutorial mirrors the real interface so closely that using the tutorial is itself practice for using the system.

---

## Role tabs and panel layouts

Each role sees a specific set of tabs. The tutorial must faithfully reproduce the tab bar and default landing tab for each role.

| Role | Source panel | Tabs (in order) | Default landing tab |
|---|---|---|---|
| Voter | VoterJS.html | My Ballot · Nominations · My Receipts · Help | My Ballot |
| Returning Officer | AdminJS.html | Elections · Nominations · Scrutiny · Candidates · Voters · Tally · Handover · Admins · Log · Settings | Elections |
| Deputy RO | AdminJS.html | Elections · Nominations · Scrutiny · Candidates · Voters · Tally · Handover · Log | Elections |
| Technical Election Manager | AdminJS.html | Elections · Nominations · Scrutiny · Candidates · Voters · Tally · Log | Elections |
| Scrutineer | AdminJS.html | Tally · Handover · Scrutiny · Voted Log | Tally |
| Observer | AdminJS.html | Tally · Handover · Scrutiny · Voted Log (read-only) | Tally |
| EC Officer | ECOfficerJS.html | Overview · Voter Roll · Messages · Landing Page | Overview |

---

## Interaction pattern (confirmed working — see sample in this session)

- Role buttons across the top (horizontal scrollable bar)
- Tapping a role renders that role's panel layout
- Tab bar within the panel is navigable — tapping a tab switches to that tab's screen
- Callout buttons are overlaid on significant UI elements (action buttons, status cards, key fields)
- Tapping a callout opens a **bottom drawer** with:
  - A colour-coded tag (category)
  - A plain-language title
  - A detailed explanation (2–4 paragraphs)
  - A "Got it ✓" close button
- No external dependencies. No `google.script.run` calls. Fully static HTML.
- Mobile-first. Same navy/gold palette as the rest of the EMS.

A working sample (Voter role, 3 screens) was built in this session and confirmed as the right interaction pattern by Shelley.

---

## Content decisions and corrections

### What to include per role

**Voter**
- Login screen (Roll Number + email) → OTP entry → Ballot (candidates, NOTA, Abstain, Cast) → Receipt token → My Receipts tab → My Nominations screen → Nominations Board screen → Help tab

**Returning Officer** — the most detailed section; written for senior alumni being invited onto the RO panel
- Full pipeline in sequence: Appointment & handover → Voter roll (publish for objections → certify) → Open nominations (Phase 1, Phase 2) → Scrutiny (6-item checklist, accept/reject) → Appeals gate → Publish candidates → Activate voting → Tally (blackout explained) → Co-sign → Declare
- Emphasise: RO independence, EC lockout, why each step exists constitutionally

**Deputy RO**
- Role and when activated
- Appeals Panel chairmanship (see Appeals Panel section below)

**Technical Election Manager**
- Role, appointment, Declaration of Impartiality
- What TEM can do (with RO Authorisation ID)
- What TEM cannot do (status advances, scrutiny decisions, tally access)

**Scrutineer**
- Who they are and eligibility
- Part A confirmation (code/data verification before voting opens)
- Part B: witness voting close, tally review, co-sign
- What they can and cannot see

**Observer**
- Accreditation by RO
- What they see: candidate list, participation count, schedule, results after declaration
- What they cannot see: voter roll, how individuals voted, live tally during active voting, AdminLog

**EC Officer**
- Pre-handover duties: compile voter roll, upload draft, manage verification link, complete handover checklist
- Locked out at handover — explain why, and that it is constitutional design not a technical limitation

**Appeals Panel**
- When it convenes (candidate appeals scrutiny rejection within 48 hours)
- Composition: **Deputy RO chairs + 2 members from the published RO panel** (not Scrutineers — this was a correction from the first draft)
- RO is recused entirely
- Upheld: nomination reinstated → status reset to Confirmed → re-enters scrutiny queue → RO must re-scrutinise
- Dismissed: rejection stands, candidate notified in writing with reasons

### What NOT to include

- **GitHub organisation ownership transfer** — not relevant to the tutorial audience; noting the commit hash before handover is sufficient for trust verification purposes. GitHub org transfer is an internal admin housekeeping item.
- **Sheet protections** — internal technical detail, not meaningful to tutorial audience
- **Specific candidate counts per post** in the mandatory post gate screen — explain the concept (a mandatory post with no candidates blocks activation) without listing example post names and numbers
- "Scrutineer Part A confirmed" as a gate item on the Activate Voting screen — implementation detail, remove

### Wording corrections

- Scrutineers: "independent check on the **process**" — not "on the RO"
- Appeals Panel composition: Deputy RO chairs + **2 members from the published RO panel** — Scrutineers do not sit on the Appeals Panel

---

## Features that must be built before the tutorial is written

The tutorial must reflect the finished system. Do not write the tutorial until all of the following are complete and tested:

- [ ] Voter Roll Draft certification flow (publish for objections → manage objections → certify → copy to Voters sheet)
- [ ] VoterRollDraft certification UI in Admin panel (S41)
- [ ] My Nominations screen in Voter panel (fully live)
- [ ] Nominations Board screen in Voter panel (fully live)
- [ ] Mobile verification pass (font sizing, iframe scaling)
- [ ] ECOfficerBoardDatabase population (post eligibility / tenure bar automation)
- [ ] Trial data purge UI
- [ ] Landing page schedule widget
- [ ] EC internal trial (~20 voters) completed and issues resolved
- [ ] Full member trial (late June) completed and issues resolved

---

## File to replace when building

`buildTutorialPage()` in `Code.js` — currently a placeholder. The tutorial is a self-contained HTML string returned by this function and served at `?action=tutorial`. It requires no session, no `google.script.run` calls, and no live data.

The interim placeholder should say something like:
> "The tutorial is being prepared and will be available before the voting window opens."

---

## Reference

- Working sample (Voter role, 3 screens, drawer interaction) built in Session 27 — see `tutorial.html` in session outputs
- First full draft (all 8 roles, accordion/step format) also built in Session 27 — see same output; **do not use this as the basis for the final build** as it predates the role-faithful-layout decision and contains the corrections listed above
