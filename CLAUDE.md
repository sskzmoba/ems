# SSKZM OBA Election Management System

Google Apps Script web app + Google Sheets, built for a life-membership alumni association to run secure, auditable e-elections. You're picking this up mid-project — a working system with a live trust architecture, not a greenfield build.

## Read first, every session

1. **`/docs/BRIDGE_NOTE.md`** — current status, pending work, known gaps, trust-architecture enforcement matrix. This is not optional background reading; several of the rules below only make sense with it.
2. **`Code.js`** and the relevant `*JS.html` file for whatever you're touching — this is ground truth. If any document, including the bridge note, disagrees with what the code actually does, the code wins. Say so when you notice a conflict; don't silently resolve it in either direction.

## Non-negotiable rules

- **System A vs System B.** Two parallel Apps Script projects exist. System A is frozen — never modify it, never reference its schema when working on System B. Everything in this repo is System B. If you're ever unsure which you're looking at, stop and ask.
- **Surgical edits only.** Never rewrite a working function or section to fix something unrelated. One targeted change, verified, then move on. If a fix genuinely requires touching multiple places (it sometimes does — see the verification-category fix in the bridge note for an example that looked like a one-line swap and wasn't), each place gets its own deliberate, explained edit.
- **One change at a time.** Confirm the diagnosis and the plan before generating a large code block. Don't bundle multiple unrelated fixes into one pass without flagging that's what's happening.
- **Votes/VotedLog separation is inviolable.** Never suggest adding voter identity to the Votes sheet or vote content to VotedLog, under any circumstances, regardless of what problem it would appear to solve.
- **Check existing `COL` constants before adding new ones.** Index collisions corrupt data silently — no error, just wrong data landing in the wrong column. This has already caused at least one real bug this project (see bridge note C.1.3).
- **Flag trust-architecture impact explicitly.** If a change touches hash verification, co-sign enforcement, AuthID/TEM gating, the EC-lockout mechanism, or the Votes/VotedLog boundary, say so up front, even if the change seems small.
- **Trial-election exemptions are load-bearing, not incidental.** Several enforcement gates (schedule floors, EC-lockout-before-nominations, PreSec-checklist-before-activate, co-sign-before-declaration) are deliberately skipped when `isTrial===true`. Don't "fix" this without being asked — it's how testing works without waiting on real V-day timelines. See bridge note C.2 before touching any of these gates.
- **Verify before handing back code.** For `Code.js`: direct `acorn.parse()`. For the HTML files: extract `<script>` blocks, join, parse combined. Re-`sed` the modified lines after any edit — don't trust that a replacement landed correctly just because the tool call succeeded.
- **Larger files get full-file replacement; smaller ones get surgical find/replace.** Match the pattern already in use in a given file rather than picking one globally.

## Deployment (this matters — code changes are inert until this happens)

Two paths exist — know the difference, they are not equally consequential.

**Via the Apps Script editor UI:** Deploy → Manage Deployments → pencil icon → New Version → Deploy. **Never just Save** — this has caused real gaps before (three fixes were written, confirmed correct, and simply never deployed for a full week; see bridge note session log).

**Via clasp**, if actively configured in this environment: `clasp push` and `clasp deploy` are both available, and they are not the same kind of action.
- `clasp push` syncs local files into the Apps Script project's stored source — equivalent to saving in the online editor. It does not change what's currently live; a deployment is pinned to a specific version snapshot, not to whatever the source currently contains. Fine to run freely as part of normal iteration.
- `clasp deploy` creates/updates a live deployment version — this is the step that actually changes what voters, the RO, and Scrutineers hit when they open the app. **Treat this the same as the manual UI Deploy button: never run it as a routine part of finishing a task. Only run it when explicitly told to deploy this specific change, for this specific reason, right now.** Preparing and pushing code is not the same decision as putting it live on an election system — keep them as two separate, explicitly authorized steps, even if that means asking before running `clasp deploy` rather than assuming a push implies a deploy.

After any deploy (either path): `clasp pull` to re-sync local files with what's actually live, then git commit at the end of the session — every session, not just milestone ones.

## Session hygiene

- **`clasp pull` at the *start* of a session too, not just after deploying.** Deploys can happen outside this workflow (manual edits in the online Apps Script editor, or a session you don't remember). Starting from a stale local copy risks silently reverting someone else's fix.
- **Never write to the live Sheet or Drive directly** — not via clasp, not via any Google API or connected tool, only through the app's own functions (`Code.js`). Every write the system considers legitimate goes through `AdminLog`. A direct write, however well-intentioned, breaks the append-only audit trail this entire trust architecture depends on. If a task seems to need direct sheet access to debug something, stop and say so instead of reaching for it.
- **Before any `git add`/commit, check what's actually being staged — don't assume `.gitignore` alone covers it.** A `.gitignore` stops stray files (credential exports, CSVs, `.clasprc.json`) but does nothing about a real ID or key hardcoded inside a file that's supposed to be committed — which is exactly how `MASTER_SHEET_ID` ended up in this repo in the first place. If a diff includes anything that looks like a Sheet ID, folder ID, API key, or email address that isn't already a known constant pattern in the codebase, stop and flag it before committing, don't assume it's fine because it's already in the working file.
- **No real member data in this repo or local environment, ever.** Not a CSV from `createPreVoteBackup`, not a TEMAuth export, not a voter roll. Debug against the scratch/Internal-Test election or synthetic data only — same discipline this project has used throughout, now extended to wherever this folder lives locally, including any cloud sync it might sit inside without that being obvious.
- **When something is ambiguous, stop and ask rather than proceed on the most likely reading** — especially for anything touching trust architecture, deployment, or data. This matters more here than it would in a plain chat interface: there's no lightweight way to offer quick tappable options mid-task the way a chat UI can, so the natural pull is to just pick an interpretation and keep going. Don't. A wrong guess that's already been acted on is a much bigger problem here than a clarifying question would have been.

## Communication style

Terse and directive is preferred over padded explanation. WhatsApp-style shorthand in instructions from the user is normal, not a sign of an incomplete request. Don't restructure existing document or code organization without checking first, even if a cleaner structure seems obvious. Ground everything in the actual project documents and actual code — never interpolate plausible-sounding detail to fill a gap; say what's missing and ask instead.

## Where things stand right now

Full detail is in the bridge note, not repeated here — it goes stale fast and duplication just means two places to keep in sync. At a glance: SGM held 18 July 2026, both resolutions passed (Resolution 2 amended on the floor — SOP text needs a corresponding update, not yet done). This week's deployment closed three known gaps plus one found along the way (bridge note C.1). Two open items worth knowing about before you touch anything nearby: hardcoded `MASTER_SHEET_ID`/`GDRIVE_ROOT_FOLDER_ID` found in the repo, not yet resolved (bridge note C.3); full end-to-end test script written but not yet run (bridge note D.1).
