// ============================================================
// SSKZM OBA EMS — System B — Code.gs
// Pass 1: Constants + doGet() + Standalone Page Builders
//         + CF backend functions required by standalone pages
// Step 6 of the Architecture Refactor Series
// ============================================================

// ── SYSTEM B IDENTIFIERS ─────────────────────────────────────

var SYSTEM_B_SHEET_ID = PropertiesService.getScriptProperties().getProperty('SYSTEM_B_SHEET_ID');
var DEPLOY_URL        = 'https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec';
var RO_CONTACT_EMAIL  = PropertiesService.getScriptProperties().getProperty('RO_CONTACT_EMAIL') || 'ro@sskzmoba.org';
var ELECTIONS_EMAIL   = 'elections.sskzmoba@gmail.com';
var ELECTIONS_NAME    = 'SSKZM OBA Elections';
var GDRIVE_ROOT_FOLDER = '';                   // set when System B GDrive folder is created

// ── SYSTEM CONSTANTS ─────────────────────────────────────────

var OTP_EXPIRY_MINUTES  = 10;
var SESSION_EXPIRY_HOURS = 8;
var SESSION_KEY_PREFIX  = 'session_';

// ── SHEET NAMES ───────────────────────────────────────────────

var SHEETS = {
  // Frozen tabs — structure must not change
  VOTES:            'Votes',
  VOTED_LOG:        'VotedLog',
  ADMIN_LOG:        'AdminLog',
  OTPS:             'OTPs',
  // Modified existing tabs
  VOTERS:           'Voters',
  ELECTIONS:        'Elections',
  CANDIDATES:       'Candidates',
  ADMINS:           'Admins',
  NOMINATIONS:      'Nominations',
  SCRUTINY_LOG:     'ScrutinyLog',
  NOM_QUERIES:      'NomQueries',
  DOC_STORE:        'DocStore',
  // New tabs (System B only)
  VOTER_ROLL_DRAFT: 'VoterRollDraft',
  COMPLAINTS:       'Complaints',
  APPEALS:          'Appeals',
  OBSERVATIONS:     'Observations',
  MESSAGES:         'Messages',
  EC_BOARD_DB:      'ECOfficerBoardDatabase',
  ELECTION_SCHED:   'ElectionSchedule',
  TEM_AUTH:         'TEMAuth',
  RO_PANEL_LOG:     'ROPanelLog',
  LANDING_CONTENT:  'LandingPageContent',
  EC_HISTORY:       'ECHistory',
  PRESEC_CHECKLIST: 'PreSecChecklist'
};

// ── COL CONSTANTS — modified and frozen sheets ────────────────
// Each sheet's columns listed with 0-based indices.
// New tab COL objects are defined separately below.
// RULE: never re-use an index within a sheet. Check this list before adding columns.

var COL = {

  // ── Voters (11 cols, 0–10) ───────────────────────────────
  VOTER_ROLL:0,       VOTER_NAME:1,         VOTER_SURNAME:2,
  VOTER_BATCH:3,      VOTER_EMAIL:4,
  VOTER_PHONE_CC:5,   VOTER_PHONE:6,
  VOTER_PHONE2_CC:7,  VOTER_PHONE2:8,
  VOTER_LIFE_MEMBER:9, VOTER_EMAIL_VER:10,

  // ── Elections (27 cols, 0–26) ────────────────────────────
  ELEC_ID:0,          ELEC_TITLE:1,         ELEC_DESC:2,
  ELEC_STATUS:3,      ELEC_START:4,         ELEC_END:5,
  ELEC_CREATED_BY:6,  ELEC_CREATED_AT:7,
  ELEC_ORGSECY_BATCH:8, ELEC_BATCHREP_RESTRICTED:9, ELEC_ORGSECY_RESTRICTED:10,
  ELEC_RESULT_VIS:11, ELEC_NOM_DEADLINE:12, ELEC_EC_CONTACT:13,
  ELEC_NOM_PHASE:14,  ELEC_NOM_EXT_COUNT:15,
  ELEC_NOM_EXT_DEADLINE:16, ELEC_MIN_POSTS:17,
  ELEC_MODE:18,       ELEC_TRIAL:19,        ELEC_BYPASS_FLOORS:20,
  ELEC_VDAY:21,       ELEC_VOTE_CLOSE:22,   ELEC_DECLARE_DAY:23,
  ELEC_SGM_DATE:24,   ELEC_CERTIFIED_AT:25, ELEC_SEAT_CONFIG:26,
  ELEC_CAND_PUB_AT:27,ELEC_VOTES_HASH:28,
  ELEC_INTERNAL_TEST:29,  // distinct from ELEC_TRIAL — internal scratch test elections only, never shown publicly

  // ── Candidates (13 cols, 0–12) ───────────────────────────
  CAND_ID:0,          CAND_ELEC_ID:1,       CAND_POST:2,
  CAND_POST_ORDER:3,  CAND_NAME:4,          CAND_ROLL:5,
  CAND_BATCH:6,       CAND_BIO:7,           CAND_PHOTO:8,
  CAND_SEAT_COUNT:9,  CAND_NOM_ID:10,
  CAND_SCRUTINY_AT:11, CAND_SCRUTINY_BY:12,

  // ── Votes — FROZEN (5 cols, 0–4) — NO voter identity ────
  VOTE_ID:0,          VOTE_ELEC_ID:1,       VOTE_POST:2,
  VOTE_CAND_ID:3,     VOTE_CAST_AT:4,

  // ── VotedLog — FROZEN (4 cols, 0–3) — NO vote content ───
  LOG_ROLL:0,         LOG_ELEC_ID:1,        LOG_POST:2,
  LOG_TIMESTAMP:3,

  // ── Admins (14 cols, 0–12) ───────────────────────────────
  ADMIN_ID:0,         ADMIN_NAME:1,         ADMIN_ROLE:2,
  ADMIN_EMAIL:3,      ADMIN_TYPE:4,         ADMIN_ROLL:5,
  ADMIN_ADDED_AT:6,
  ADMIN_STATUS:7,     ADMIN_DISABLED_AT:8,  ADMIN_DISABLED_BY:9,
  ADMIN_DEPRO_ACTIVE:10, ADMIN_ACTIVATED_AT:11, ADMIN_ACTIVATED_BY:12, ADMIN_GMAIL:13,

  // ── OTPs — FROZEN (4 cols, 0–3) ─────────────────────────
  OTP_ROLL:0,         OTP_CODE:1,           OTP_EXPIRY:2,
  OTP_PURPOSE:3,

  // ── Nominations (32 cols, 0–31) ──────────────────────────
  NOM_ID:0,           NOM_ELEC_ID:1,        NOM_POST:2,
  NOM_CAND_ROLL:3,    NOM_CAND_NAME:4,      NOM_CAND_BATCH:5,   NOM_CAND_EMAIL:6,
  NOM_PROP_ROLL:7,    NOM_PROP_CONFIRMED:8, NOM_PROP_CONFIRMED_AT:9, NOM_PROP_TOKEN:10,
  NOM_SEC_ROLL:11,    NOM_SEC_CONFIRMED:12, NOM_SEC_CONFIRMED_AT:13, NOM_SEC_TOKEN:14,
  NOM_BIO:15,         NOM_PHOTO:16,         NOM_SUBMITTED_AT:17, NOM_DEADLINE:18,
  NOM_STATUS:19,      NOM_REJECTION:20,     NOM_WITHDRAWN_AT:21, NOM_ENTRY_METHOD:22,
  NOM_DOC_LINKS:23,   NOM_FOLDER_URL:24,
  NOM_NOMINATOR_ROLL:25, NOM_CONSENT_STATUS:26,
  NOM_CONSENT_TOKEN:27,  NOM_CONSENT_AT:28,
  NOM_ONE_POST_CHECK:29, NOM_PHASE2_FLAG:30, NOM_DUP_DECLINED:31,
  NOM_REJECTED_AT:32,

  // ── ScrutinyLog (18 cols, 0–17) — unchanged ──────────────
  SCLOG_ID:0,         SCLOG_NOM_ID:1,       SCLOG_ELEC_ID:2,
  SCLOG_CAND_ROLL:3,  SCLOG_POST:4,
  SCLOG_CHECK_ITEM:5, SCLOG_CHECK_RESULT:6, SCLOG_NOTES:7,
  SCLOG_QUERY_SENT:8, SCLOG_QUERY_TEXT:9,
  SCLOG_RESP_AT:10,   SCLOG_RESP_TEXT:11,
  SCLOG_EC_SENT:12,   SCLOG_EC_TEXT:13,
  SCLOG_EC_RESP_AT:14, SCLOG_EC_RESP:15,
  SCLOG_LOGGED_AT:16, SCLOG_LOGGED_BY:17,

  // ── NomQueries (12 cols, 0–11) — unchanged ───────────────
  QRY_ID:0,           QRY_NOM_ID:1,         QRY_ELEC_ID:2,
  QRY_CAND_ROLL:3,    QRY_POST:4,           QRY_TEXT:5,
  QRY_SENT_AT:6,      QRY_TOKEN:7,          QRY_DEADLINE:8,
  QRY_RESPONSE:9,     QRY_RESP_AT:10,       QRY_STATUS:11,

  // ── AdminLog — FROZEN (7 cols, 0–6) — append-only ────────
  ALOG_ID:0,          ALOG_ADMIN_ID:1,      ALOG_ACTION_TYPE:2,
  ALOG_DESCRIPTION:3, ALOG_OLD_VALUE:4,     ALOG_NEW_VALUE:5,
  ALOG_TIMESTAMP:6,

  // ── DocStore (10 cols, 0–9) ──────────────────────────────
  DOC_ID:0,           DOC_ELEC_ID:1,        DOC_CATEGORY:2,
  DOC_UPLOADER_ROLL:3, DOC_UPLOADER_ROLE:4, DOC_FILENAME:5,
  DOC_GDRIVE_URL:6,   DOC_UPLOADED_AT:7,    DOC_NOTES:8,
  DOC_LINKED_TAB:9
};

// ── NEW TAB COL OBJECTS ───────────────────────────────────────
// Separate objects per new tab — populated in Pass 2 when each
// tab's functions are built. Defined here so references don't error.
// Full schemas: Step 3 BackendFunctionMap + Session 18 Handover.

var COL_CMP = {
  ID:0, ELEC_ID:1, FILED_BY_ROLL:2, FILED_AT:3,
  AGAINST_ROLL:4, AGAINST_NAME:5, COMPLAINT_TEXT:6,
  CHANNEL:7, DOC_LINKS:8, STATUS:9,
  RO_NOTES:10, RESOLUTION:11, RESOLVED_AT:12, RESOLVED_BY:13
};
var COL_APL = {
  ID:0, ELEC_ID:1, NOM_ID:2, CAND_ROLL:3,
  CAND_NAME:4, POST:5, FILED_AT:6, APPEAL_TEXT:7,
  DOC_LINKS:8, STATUS:9, RO_NOTES:10, DECISION:11,
  DECIDED_AT:12, DECIDED_BY:13, NOM_STATUS_UPDATED:14,
  VOTING_RESET_REQUIRED:15,
  APPEAL_TYPE:16,      // 'rejection_appeal' | 'nomination_objection'
  OBJECTOR_ROLL:17     // populated for nomination_objection only
};
var COL_PRESEC = {
  ID:0,            ELEC_ID:1,          ITEM_CODE:2,
  COMPLETED_BY:3,  COMPLETED_ROLE:4,   COMPLETED_AT:5,
  SC1_BY:6,        SC1_AT:7,
  SC2_BY:8,        SC2_AT:9,
  NOTES:10
};
var COL_OBS = {
  OBS_ID:            0,
  ELEC_ID:           1,
  OBSERVER_ID:       2,
  OBSERVED_AT:       3,
  OBS_TYPE:          4,  // 'scrutineer' | 'observer'
  OBS_TEXT:          5,
  SEVERITY:          6,  // 'info' | 'concern' | 'urgent'
  ACKNOWLEDGED_BY:   7,
  ACKNOWLEDGED_AT:   8,
  RESPONSE_TEXT:     9,
  RESOLUTION_STATUS: 10  // 'pending' | 'responded' | 'noted'
};
var COL_ECDB  = {};  // ECOfficerBoardDatabase — 9 cols
var COL_SCHED = {
  SCHED_ID:              0,
  ELEC_ID:               1,
  SCHED_MODE:            2,  // live | trial_internal | trial_member
  VDAY:                  3,
  VOTER_ROLL_CUTOFF:     4,  // V-47
  NOM_OPEN:              5,  // V-38
  VOTER_ROLL_PUB:        6,  // V-33
  PHASE1_CLOSE:          7,  // V-31
  VOTER_ROLL_OBJ_CLOSE:  8,  // V-26
  NOM_CLOSE:             9,  // V-24
  VOTER_ROLL_CERT:       10, // V-24
  CAND_PUB:              11, // V-19
  WITHDRAWAL_DEADLINE:   12, // V-18 (D+1)
  VOTING_OPEN:           13, // V-16
  VOTING_CLOSE:          14, // V-9
  DECLARATION:           15, // V-7
  PUBLISHED:             16, // Boolean
  PUBLISHED_AT:          17,
  UPDATED_AT:            18,
  UPDATED_BY:            19,
  EXTENDED_BEYOND_VDAY:  20
};

// LandingPageContent COL constants
var COL_LPC = {
  KEY:          0,
  VALUE:        1,
  TYPE:         2,  // date | text | url | boolean
  LABEL:        3,
  PUBLIC:       4,  // Boolean
  UPDATED_BY:   5,
  UPDATED_AT:   6
};
var COL_TEMA = {
  AUTH_ID:      0,  // AuthID — UUID string
  ELECTION_ID:  1,  // ElectionID — FK → Elections
  ISSUED_BY:    2,  // IssuedBy — AdminID of RO
  ISSUED_AT:    3,  // IssuedAt — ISO datetime
  SCOPE:        4,  // Scope — 'specific_actions' | 'ALL_ACTIONS'
  ACTION_TYPES: 5,  // ActionTypes — JSON array string
  EXPIRES_AT:   6,  // ExpiresAt — ISO datetime or blank
  USED_AT:      7,  // UsedAt — ISO datetime of first use
  USED_COUNT:   8,  // UsedCount — integer
  REVOKED:      9,  // Revoked — boolean
  REVOKED_AT:   10, // RevokedAt — ISO datetime
  NOTES:        11  // Notes — free text
};  // 12 cols ✓

var COL_ECH = {
  YEAR:   0,  // Year — numeric (e.g. 2024)
  ROLL:   1,  // Roll No — member roll number
  NAME:   2,  // Name — member name
  POST:   3   // Post — EC post held that year
};  // 4 cols ✓

var COL_RPL   = {};  // ROPanelLog — 15 cols

// ── EC POSTS — 21 posts in display order ─────────────────────

var EC_POSTS = [
  {name:'President',                    order:1,  seats:1},
  {name:'Vice President',               order:2,  seats:2},
  {name:'General Secretary',            order:3,  seats:1},
  {name:'Joint Secretary',              order:4,  seats:2},
  {name:'Treasurer',                    order:5,  seats:1},
  {name:'Organising Secretary',         order:6,  seats:1},
  {name:'Batch Representative 1965-70', order:7,  seats:1},
  {name:'Batch Representative 1971-75', order:8,  seats:1},
  {name:'Batch Representative 1976-80', order:9,  seats:1},
  {name:'Batch Representative 1981-85', order:10, seats:1},
  {name:'Batch Representative 1986-90', order:11, seats:1},
  {name:'Batch Representative 1991-95', order:12, seats:1},
  {name:'Batch Representative 1996-00', order:13, seats:1},
  {name:'Batch Representative 2001-05', order:14, seats:1},
  {name:'Batch Representative 2006-10', order:15, seats:1},
  {name:'Batch Representative 2011-15', order:16, seats:1},
  {name:'Batch Representative 2016-20', order:17, seats:1},
  {name:'Batch Representative 2021-25', order:18, seats:1},
  {name:'Batch Representative 2026-30', order:19, seats:1}
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Maps a voter's batch year (e.g. 1988) to the Batch Rep bracket
// string used in EC_POSTS (e.g. "1986-90").
// Returns '' if the year falls outside all defined brackets.
function getBatchRepBracket(batchYear) {
  var yr = parseInt(batchYear);
  if (isNaN(yr)) return '';
  var brackets = [
    { from: 1965, to: 1970, label: '1965-70' },
    { from: 1971, to: 1975, label: '1971-75' },
    { from: 1976, to: 1980, label: '1976-80' },
    { from: 1981, to: 1985, label: '1981-85' },
    { from: 1986, to: 1990, label: '1986-90' },
    { from: 1991, to: 1995, label: '1991-95' },
    { from: 1996, to: 2000, label: '1996-00' },
    { from: 2001, to: 2005, label: '2001-05' },
    { from: 2006, to: 2010, label: '2006-10' },
    { from: 2011, to: 2015, label: '2011-15' },
    { from: 2016, to: 2020, label: '2016-20' },
    { from: 2021, to: 2025, label: '2021-25' },
    { from: 2026, to: 2030, label: '2026-30' }
  ];
  for (var i = 0; i < brackets.length; i++) {
    if (yr >= brackets[i].from && yr <= brackets[i].to) return brackets[i].label;
  }
  return '';
}

// ── TEM AUTHORISABLE ACTIONS — exhaustive enum ────────────────
var TEM_AUTHORISABLE_ACTIONS = {
  system: [
    'addAdmin',
    'disableAdmin',
    'enableAdmin',
    'createElection',
    'applySheetProtections',
    'removeSheetProtections',
    'setLandingPageContent',
    'lockECOfficers',
    'recordVersionVerified',
    'recordGithubTransferred'
  ],
  election: [
    'updateElectionStatus',
    'updateElectionSettings',
    'deleteElection',
    'setElectionSchedule',
    'publishSchedule',
    'acceptNomination',
    'rejectNomination',
    'undoAcceptNomination',
    'undoRejectNomination',
    'submitNominationManual',
    'publishCandidates',
    'triggerPhase2Extension',
    'deleteCandidate',
    'uploadVoterRollDraft',
    'updateObjectionStatus',
    'certifyVoterRoll',
    'addVoterToDraft',
    'updateScrutinyStatus',
    'updateScrutinyDecision',
    'recordTallyCoSign',
    'recordScrutineerConfirmation',
    'updateComplaintStatus',
    'updateAppealDecision',
    'storeAppealRuling',
    'sendConsolidatedObjectionSummary',
    'storeDocument',
    'deleteDocument',
    'purgeTrialData',
    'recordDrawOfLots',
    'generateElectionRecordPDF',
    'createPreVoteBackup',
    'replyObservation',
    'sendNominationCall',
    'sendVoterRollPublicationNotice'
  ]
};

// ── requiresTEMAuth — internal gate for all write functions ───
// Call at top of every write function after session validation.
// Non-TEM roles pass through immediately.
// TEM role: validates authId, checks scope, increments UsedCount.
function requiresTEMAuth(sess, authId, actionType, electionId) {
  if (sess.role !== 'TEM') return { pass: true };

  if (!authId) return { pass: false, message: 'AuthorisationID is required for TEM write actions.' };

  // Determine if action is system-scoped or election-scoped
  var isSystemAction = TEM_AUTHORISABLE_ACTIONS.system.indexOf(actionType) !== -1;

  var sh   = getSheet(SHEETS.TEM_AUTH);
  var rows = sh.getDataRange().getValues();
  var now  = new Date();

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[COL_TEMA.AUTH_ID].toString() !== authId.toString()) continue;

    // Found the row — run all checks
    if (row[COL_TEMA.REVOKED] === true || row[COL_TEMA.REVOKED] === 'TRUE') {
      return { pass: false, message: 'AuthorisationID has been revoked.' };
    }
    var expiresAt = row[COL_TEMA.EXPIRES_AT];
    if (expiresAt && new Date(expiresAt) < now) {
      return { pass: false, message: 'AuthorisationID has expired.' };
    }

    var scope       = row[COL_TEMA.SCOPE].toString();
    var usedCount   = parseInt(row[COL_TEMA.USED_COUNT]) || 0;
    var actionTypes = [];
    try { actionTypes = JSON.parse(row[COL_TEMA.ACTION_TYPES]); } catch(e) { actionTypes = []; }

    if (scope === 'ALL_ACTIONS') {
      if (usedCount >= 1) return { pass: false, message: 'ALL_ACTIONS authorisation already used.' };
    } else {
      // specific_actions — check actionType is covered
      if (actionTypes.indexOf(actionType) === -1) {
        return { pass: false, message: 'Action "' + actionType + '" is not in this authorisation scope.' };
      }
    }

    // Election-scoped actions: if AuthID has an ElectionID, it must match context
    // System-scoped actions: skip election matching entirely
    if (!isSystemAction) {
      var authElecId = row[COL_TEMA.ELECTION_ID].toString().trim();
      if (authElecId && electionId && authElecId !== electionId.toString()) {
        return { pass: false, message: 'AuthorisationID is not valid for this election.' };
      }
    }

    // Passed — increment UsedCount, set UsedAt on first use
    var newCount = usedCount + 1;
    sh.getRange(i + 1, COL_TEMA.USED_COUNT + 1).setValue(newCount);
    if (usedCount === 0) {
      sh.getRange(i + 1, COL_TEMA.USED_AT + 1).setValue(now.toISOString());
    }

    // Log to AdminLog
    appendAdminLog(sess.identity, 'tem_action_performed',
      'AuthID ' + authId + ' | action: ' + actionType + ' | usedCount: ' + newCount,
      'true', 'false');

    return { pass: true };
  }

  return { pass: false, message: 'AuthorisationID not found.' };
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// Returns all data rows (excludes header row 0). Returns [] if sheet missing.
function sheetData(name) {
  var sh = getSheet(name);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

function now() {
  return new Date();
}

function generateId() {
  return Utilities.getUuid();
}

// ============================================================
// calcScheduleFromVDay — derives all key election dates from
// V-Day (AGM date). Returns object with all date fields as
// ISO date strings (YYYY-MM-DD). Mode affects floor enforcement
// only — dates are always calculated regardless of mode.
// vDay: JS Date or ISO string
// ============================================================
function calcScheduleFromVDay(vDay) {
  var anchor = new Date(vDay);
  if (isNaN(anchor.getTime())) return null;

  // Helper: add/subtract days from anchor, return YYYY-MM-DD string
  function vMinus(days) {
    var d = new Date(anchor.getTime());
    d.setDate(d.getDate() - days);
    return d.toISOString().substring(0, 10);
  }
  function vPlus(days) {
    var d = new Date(anchor.getTime());
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  }

  var candPubDate = vMinus(19);

  return {
    vDay:                anchor.toISOString().substring(0, 10),
    voterRollCutoff:     vMinus(47),
    nomOpenDate:         vMinus(38),
    voterRollPubDate:    vMinus(33),
    phase1CloseDate:     vMinus(31),
    voterRollObjDeadline:vMinus(26),
    nomCloseDate:        vMinus(24),
    voterRollCertDate:   vMinus(24),
    candidatesPubDate:   candPubDate,
    withdrawalDeadline:  vMinus(18),  // end of D+1 from V-19 = V-18
    votingOpenDate:      vMinus(16),  // min 72hrs after V-19
    votingCloseDate:     vMinus(9),
    declarationDate:     vMinus(7)
  };
}

// SOP floor checks for live elections — returns array of warning objects
// Each: { field, label, severity: 'block'|'warn', message }
function checkScheduleFloors(sched) {
  var warnings = [];
  var today = new Date();
  today.setHours(0,0,0,0);

  function d(str) { return str ? new Date(str) : null; }
  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  var vDay      = d(sched.vDay);
  var candPub   = d(sched.candidatesPubDate);
  var votOpen   = d(sched.votingOpenDate);
  var votClose  = d(sched.votingCloseDate);
  var decl      = d(sched.declarationDate);
  var nomClose  = d(sched.nomCloseDate);
  var nomOpen   = d(sched.nomOpenDate);
  var p1Close   = d(sched.phase1CloseDate);

  // Hard blocks
  if (vDay && candPub && votOpen) {
    var gapCandToVoting = daysBetween(candPub, votOpen);
    if (gapCandToVoting < 3) {
      warnings.push({ field: 'votingOpenDate', severity: 'block',
        label: 'Voting Open Date',
        message: 'Voting must open at least 72 hours (3 days) after candidates are published. Current gap: ' + gapCandToVoting + ' day(s).' });
    }
  }
  if (vDay && votClose) {
    var daysToClose = daysBetween(votClose, vDay);
    if (daysToClose < 9) {
      warnings.push({ field: 'votingCloseDate', severity: 'block',
        label: 'Voting Close Date',
        message: 'Voting must close not later than V-9 (' + daysToClose + ' days before AGM). SOP minimum: 9 days.' });
    }
  }
  if (vDay && decl) {
    var daysToDecl = daysBetween(decl, vDay);
    if (daysToDecl < 7) {
      warnings.push({ field: 'declarationDate', severity: 'block',
        label: 'Declaration Date',
        message: 'Results must be declared not later than V-7 (' + daysToDecl + ' days before AGM). SOP minimum: 7 days.' });
    }
  }

  // Soft warnings (compressible under Section 1.5)
  if (nomOpen && p1Close) {
    var phase1Days = daysBetween(nomOpen, p1Close);
    if (phase1Days < 7) {
      warnings.push({ field: 'phase1CloseDate', severity: 'warn',
        label: 'Phase 1 Close',
        message: 'Phase 1 nomination window is ' + phase1Days + ' day(s). SOP standard is 7 days (compressible to 5 under Section 1.5).' });
    }
  }
  if (nomClose && candPub) {
    var scrutinyDays = daysBetween(nomClose, candPub);
    if (scrutinyDays < 5) {
      warnings.push({ field: 'candidatesPubDate', severity: 'warn',
        label: 'Scrutiny Period',
        message: 'Scrutiny period is ' + scrutinyDays + ' day(s). SOP standard is 5 days (compressible to 3 under Section 1.5).' });
    }
  }
  if (votOpen && votClose) {
    var votingDays = daysBetween(votOpen, votClose);
    if (votingDays < 7) {
      warnings.push({ field: 'votingCloseDate', severity: 'warn',
        label: 'Voting Window',
        message: 'Voting window is ' + votingDays + ' day(s). SOP standard is 7 days (compressible to 5 under Section 1.5).' });
    }
  }

  return warnings;
}
// ============================================================
// getVoterRollRows — returns the correct voter roll for validation
// During nominations (before certification): uses VoterRollDraft
// After certification (Voters sheet populated): uses Voters
// This allows nominations to validate rolls against the draft
// roll while the certified roll is being finalised (per SOP
// Appendix A: nominations open V-31, certification at V-24).
// ============================================================
function getVoterRollRows(electionId) {
  // Check if Voters sheet has data (certified roll uploaded)
  var certRows = sheetData(SHEETS.VOTERS);
  if (certRows && certRows.length > 0) {
    return { rows: certRows, source: 'certified' };
  }
  // Fall back to VoterRollDraft — map VRD cols to VOTER col positions
  var draftRows = sheetData(SHEETS.VOTER_ROLL_DRAFT);
  var mapped = draftRows.map(function(r) {
    // VRD: 0=RollNo, 1=Name, 2=Surname, 3=Batch, 4=Email
    // VOTER: COL.VOTER_ROLL=0, COL.VOTER_NAME=1, COL.VOTER_SURNAME=2,
    //        COL.VOTER_BATCH=3, COL.VOTER_EMAIL=4
    var row = [];
    row[COL.VOTER_ROLL]    = r[0] || '';
    row[COL.VOTER_NAME]    = r[1] || '';
    row[COL.VOTER_SURNAME] = r[2] || '';
    row[COL.VOTER_BATCH]   = r[3] || '';
    row[COL.VOTER_EMAIL]   = r[4] || '';
    return row;
  });
  return { rows: mapped, source: 'draft' };
}

// IST = UTC+5:30 (+330 minutes). No locale dependency — pure arithmetic.
// Example: pubAt = 2026-07-01T14:30:00Z (20:00 IST on 1 Jul)
//          D+1 IST = 2 Jul 2026 23:59:59 IST = 2026-07-02T18:29:59Z
function getISTDeadline(pubAtISO) {
  var IST_OFFSET_MS = 330 * 60 * 1000; // UTC+5:30
  var pubUtc = new Date(pubAtISO).getTime();
  if (isNaN(pubUtc)) return null;
  // Convert pub time to IST ms, get IST calendar date
  var pubIstMs = pubUtc + IST_OFFSET_MS;
  var pubIstDate = new Date(pubIstMs);
  // D+1 in IST: year, month, day+1
  var d1Year  = pubIstDate.getUTCFullYear();
  var d1Month = pubIstDate.getUTCMonth();
  var d1Day   = pubIstDate.getUTCDate() + 1;
  // End of D+1 in IST = 23:59:59 IST = 18:29:59 UTC
  var deadlineIst = Date.UTC(d1Year, d1Month, d1Day, 23, 59, 59) - IST_OFFSET_MS;
  return new Date(deadlineIst);
}

// formatISTDeadline — returns human-readable IST string for display, e.g. "2 Jul 2026, 11:59 PM"
function formatISTDeadline(pubAtISO) {
  var dl = getISTDeadline(pubAtISO);
  if (!dl) return '';
  var IST_OFFSET_MS = 330 * 60 * 1000;
  var istMs = dl.getTime() + IST_OFFSET_MS;
  var d = new Date(istMs);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', 11:59 PM';
}

// ============================================================
// checkTenureBar — checks T2 consecutive tenure bar for a member
// Rule: any non-Batch-Rep EC post for 6 consecutive years
//       → cannot stand unless absent for at least 2 years.
//       One year absence alone does not break the streak.
// Returns: { eligible: bool, consecutiveYears: int, absenceYears: int, reason: string }
// Called internally from acceptNomination. Also exposed for scrutiny display.
// ECHistory schema: Col 0=Year, Col 1=RollNo, Col 2=Name, Col 3=Post
// ============================================================
function checkTenureBar(rollNo) {
  var sh = getSheet(SHEETS.EC_HISTORY);
  if (!sh) return { eligible: true, consecutiveYears: 0, reason: 'ECHistory sheet not found — tenure bar check skipped.' };

  var rows = sheetData(SHEETS.EC_HISTORY);
  var BATCH_REP_PATTERN = /batch\s*rep/i;
  var EX_OFFICIO_PATTERN = /ex.?officio/i;

  // Collect all years this member held a non-Batch-Rep, non-Ex-Officio elected post
  // Ex Officio is appointed not elected — excluded from T2 bar per bylaw
  var serviceYears = {};
  for (var i = 0; i < rows.length; i++) {
    var rowRoll = rows[i][COL_ECH.ROLL].toString().trim().toUpperCase();
    if (rowRoll !== rollNo.toString().trim().toUpperCase()) continue;
    var post = rows[i][COL_ECH.POST].toString().trim();
    if (BATCH_REP_PATTERN.test(post)) continue;
    if (EX_OFFICIO_PATTERN.test(post)) continue; // Ex Officio excluded — appointed, not elected
    var yr = parseInt(rows[i][COL_ECH.YEAR].toString().trim(), 10);
    if (!isNaN(yr)) serviceYears[yr] = post;
  }

  var electionYear = now().getFullYear(); // 2026
  var lookback     = electionYear - 1;   // most recent completed year = 2025

  // ── T2 STREAK LOGIC ─────────────────────────────────────────
  // Bylaw: "An absence of only 1 year alone shall not be counted as a break."
  // So a single gap year within the streak does NOT break it.
  // Two or more consecutive absent years DO break it.
  // We scan backwards from lookback, tracking the streak and gaps.
  //
  // Rules:
  //   - Service year: contributes to streak, resets gapInStreak counter
  //   - 1 absent year inside the streak: allowed, counted in total streak length
  //   - 2 consecutive absent years: hard break
  //   - Leading absent years (most recent) = actual absence, not part of streak
  //
  // We first skip leading absent years (recent absence), then accumulate streak.

  // Step 1: measure recent absence (leading absent years from lookback)
  var absenceYears = 0;
  var scanFrom = lookback;
  for (var ay = lookback; ay >= lookback - 4; ay--) {
    if (!serviceYears[ay]) {
      absenceYears++;
    } else {
      scanFrom = ay; // first service year going backwards
      break;
    }
  }
  // If no service year found in last 4 years at all
  if (absenceYears > 4) {
    return {
      eligible:         true,
      consecutiveYears: 0,
      absenceYears:     absenceYears,
      reason:           'No EC service found in recent years — T2 bar does not apply.'
    };
  }

  // Step 2: from scanFrom (first service year), accumulate streak allowing 1-year gaps
  var streak          = 0;
  var streakPosts     = [];
  var gapInStreak     = 0; // consecutive absent years seen inside current streak
  var streakActive    = true;

  for (var y = scanFrom; y >= scanFrom - 9 && streakActive; y--) {
    if (serviceYears[y]) {
      streak++;
      gapInStreak = 0; // reset gap counter on service year
      streakPosts.unshift(y + ' (' + serviceYears[y] + ')');
    } else {
      gapInStreak++;
      if (gapInStreak >= 2) {
        streakActive = false; // 2+ consecutive absent years = genuine break
      } else {
        // Single gap year — bylaw says not a break; count it in streak length
        streak++;
        streakPosts.unshift(y + ' (absent — not counted as break)');
      }
    }
  }

  // Step 3: if streak ends with a gap year (shouldn't count), trim trailing gaps
  // Remove trailing 'absent' entries from streakPosts that were added last
  while (streakPosts.length > 0 &&
         streakPosts[0].indexOf('absent') !== -1 &&
         !serviceYears[parseInt(streakPosts[0], 10)]) {
    streakPosts.shift();
    streak--;
  }

  if (streak >= 6) {
    if (absenceYears >= 2) {
      return {
        eligible:         true,
        consecutiveYears: streak,
        absenceYears:     absenceYears,
        reason:           'T2 bar applies (' + streak + ' years: ' + streakPosts.join(', ') +
                          ') but qualifying 2-year absence found (' + absenceYears + ' year(s) absent). Eligible.'
      };
    }
    return {
      eligible:         false,
      consecutiveYears: streak,
      absenceYears:     absenceYears,
      reason:           'T2 Consecutive Tenure Bar: held EC post (non-Batch-Rep) for ' +
                        streak + ' years (with single-year gaps not counted as breaks) — ' +
                        streakPosts.join(', ') + '. ' +
                        'Must be absent from EC for at least 2 years before standing again. ' +
                        (absenceYears === 1
                          ? 'One-year absence alone does not qualify as a break per bylaw.'
                          : 'No qualifying 2-year absence found.')
    };
  }

  return {
    eligible:         true,
    consecutiveYears: streak,
    absenceYears:     absenceYears,
    reason:           streak > 0
      ? 'EC service: ' + streak + ' year(s) in streak (single-year gaps included per bylaw) — below T2 threshold of 6.'
      : 'No prior non-Batch-Rep EC service found in ECHistory.'
  };
}

// ============================================================
// checkPresidentEligibility — checks Rule P-A / P-B for President nominees
// Rule P-A: cumulative ≥2 years in {President, VP, GS, Joint Secretary, Treasurer}
//           in any 15-year window preceding the election. Batch Rep does NOT count.
// Rule P-B: only if candidate also served as Ex-officio — then Batch Rep counts too.
//           Ex-officio years themselves do NOT count toward the 2-year total.
// Returns: { eligible: bool, rule: 'P-A'|'P-B'|null, qualifyingYears: int, reason: string }
// ============================================================
function checkPresidentEligibility(rollNo) {
  var sh = getSheet(SHEETS.EC_HISTORY);
  if (!sh) return { eligible: true, rule: null, qualifyingYears: 0,
    reason: 'ECHistory sheet not found — President eligibility check skipped.' };

  var rows = sheetData(SHEETS.EC_HISTORY);

  var electionYear = now().getFullYear(); // 2026
  var windowStart  = electionYear - 15;  // 2011 — preceding 15 years

  // P-A qualifying posts (excluding Batch Rep and Ex-officio)
  var PA_POSTS = /president|vice.?president|general.?secretary|joint.?secretary|treasurer/i;
  // P-B additional: Batch Rep also qualifies IF candidate has Ex-officio service
  var BATCH_REP_PATTERN = /batch\s*rep/i;
  var EXOFFICIO_PATTERN = /ex.?officio/i;

  var paYears      = 0; // years in P-A qualifying posts
  var batchYears   = 0; // years as Batch Rep
  var exofficioSvc = false; // any ex-officio service ever
  var paYearsList  = [];
  var batchYearsList = [];

  var cleanRoll = rollNo.toString().trim().toUpperCase();

  for (var i = 0; i < rows.length; i++) {
    var rowRoll = rows[i][COL_ECH.ROLL].toString().trim().toUpperCase();
    if (rowRoll !== cleanRoll) continue;
    var post = rows[i][COL_ECH.POST].toString().trim();
    var yr   = parseInt(rows[i][COL_ECH.YEAR].toString().trim(), 10);
    if (isNaN(yr)) continue;

    // Check ex-officio (any year — not window-limited for P-B eligibility test)
    if (EXOFFICIO_PATTERN.test(post)) { exofficioSvc = true; continue; }

    // Only count years within the 15-year window
    if (yr < windowStart || yr >= electionYear) continue;

    if (PA_POSTS.test(post)) {
      paYears++;
      paYearsList.push(yr + ' (' + post + ')');
    } else if (BATCH_REP_PATTERN.test(post)) {
      batchYears++;
      batchYearsList.push(yr + ' (' + post + ')');
    }
  }

  // Rule P-A check
  if (paYears >= 2) {
    return {
      eligible:        true,
      rule:            'P-A',
      qualifyingYears: paYears,
      reason:          'Rule P-A satisfied: ' + paYears + ' year(s) in qualifying posts — ' +
                       paYearsList.join(', ') + '.'
    };
  }

  // Rule P-B check (only if ex-officio service exists)
  if (exofficioSvc) {
    var pbYears = paYears + batchYears; // P-B: P-A posts + Batch Rep count
    if (pbYears >= 2) {
      return {
        eligible:        true,
        rule:            'P-B',
        qualifyingYears: pbYears,
        reason:          'Rule P-B satisfied (Ex-officio pathway): ' + pbYears + ' qualifying year(s) — ' +
                         paYearsList.concat(batchYearsList).join(', ') + '. Ex-officio service confirmed.'
      };
    }
    // P-B exists but still short
    return {
      eligible:        false,
      rule:            null,
      qualifyingYears: pbYears,
      reason:          'Not eligible for President. Ex-officio service found (Rule P-B pathway), but only ' +
                       pbYears + ' qualifying year(s) found in preceding 15 years (' + windowStart + '–' +
                       (electionYear - 1) + '). Minimum 2 required. ' +
                       (paYearsList.length ? 'P-A posts: ' + paYearsList.join(', ') + '. ' : '') +
                       (batchYearsList.length ? 'Batch Rep (P-B): ' + batchYearsList.join(', ') + '.' : '')
    };
  }

  // Neither rule met
  return {
    eligible:        false,
    rule:            null,
    qualifyingYears: paYears,
    reason:          'Not eligible for President. Rule P-A: requires ≥2 years in {President, VP, GS, Joint Secretary, Treasurer} ' +
                     'within preceding 15 years (' + windowStart + '–' + (electionYear - 1) + '). ' +
                     'Found: ' + paYears + ' year(s)' + (paYearsList.length ? ' — ' + paYearsList.join(', ') : '') + '. ' +
                     'Rule P-B does not apply (no ex-officio service on record).'
  };
}

// ============================================================
// checkGSEligibility — checks General Secretary post eligibility
// Rule: EC member in ANY capacity (including Batch Rep, co-opted)
//       for cumulative ≥1 year in preceding 15 years.
// This is broader than P-A — Batch Rep counts here.
// Returns: { eligible: bool, qualifyingYears: int, reason: string }
// ============================================================
function checkGSEligibility(rollNo) {
  var sh = getSheet(SHEETS.EC_HISTORY);
  if (!sh) return { eligible: true, qualifyingYears: 0,
    reason: 'ECHistory sheet not found — GS eligibility check skipped.' };

  var rows        = sheetData(SHEETS.EC_HISTORY);
  var electionYear = now().getFullYear();
  var windowStart  = electionYear - 15;
  var cleanRoll    = rollNo.toString().trim().toUpperCase();

  var qualifyingYears = 0;
  var yearsList       = [];

  for (var i = 0; i < rows.length; i++) {
    var rowRoll = rows[i][COL_ECH.ROLL].toString().trim().toUpperCase();
    if (rowRoll !== cleanRoll) continue;
    var yr   = parseInt(rows[i][COL_ECH.YEAR].toString().trim(), 10);
    var post = rows[i][COL_ECH.POST].toString().trim();
    if (isNaN(yr) || yr < windowStart || yr >= electionYear) continue;
    // Any capacity counts — Batch Rep, co-opted, office bearer, all included
    qualifyingYears++;
    yearsList.push(yr + ' (' + post + ')');
  }

  if (qualifyingYears >= 1) {
    return {
      eligible:        true,
      qualifyingYears: qualifyingYears,
      reason:          'GS eligibility satisfied: ' + qualifyingYears + ' year(s) of EC service in any capacity ' +
                       'within preceding 15 years — ' + yearsList.join(', ') + '.'
    };
  }

  return {
    eligible:        false,
    qualifyingYears: 0,
    reason:          'Not eligible for General Secretary. Requires ≥1 year of EC service in any capacity ' +
                     '(including Batch Rep or co-opted) within preceding 15 years (' +
                     windowStart + '–' + (electionYear - 1) + '). No qualifying service found in ECHistory.'
  };
}

// ============================================================
// checkT1TenureBar — checks T1 same-post tenure bar
// Rule: 5 PURE CONSECUTIVE years in the same post → barred from
//       that specific post. No gap allowance (unlike T2).
//       Any single absent year breaks the streak and resets it.
//       Once the streak is broken, eligible to stand for that post again.
// Applies to ALL posts (Batch Reps included — T1 is post-specific, not post-type).
// Returns: { eligible: bool, consecutiveYears: int, reason: string }
// ============================================================
function checkT1TenureBar(rollNo, nomPost) {
  var sh = getSheet(SHEETS.EC_HISTORY);
  if (!sh) return { eligible: true, consecutiveYears: 0,
    reason: 'ECHistory sheet not found — T1 bar check skipped.' };

  var rows      = sheetData(SHEETS.EC_HISTORY);
  var cleanRoll = rollNo.toString().trim().toUpperCase();
  var cleanPost = nomPost.toString().trim().toLowerCase();

  var EX_OFFICIO_PATTERN_T1 = /ex.?officio/i;

  // Collect years this member held THIS specific post
  // Ex Officio excluded — appointed not elected, cannot trigger T1 bar
  var postYears = {};
  for (var i = 0; i < rows.length; i++) {
    var rowRoll = rows[i][COL_ECH.ROLL].toString().trim().toUpperCase();
    if (rowRoll !== cleanRoll) continue;
    var post = rows[i][COL_ECH.POST].toString().trim();
    if (EX_OFFICIO_PATTERN_T1.test(post)) continue;
    var postLower = post.toLowerCase();
    var yr   = parseInt(rows[i][COL_ECH.YEAR].toString().trim(), 10);
    if (isNaN(yr)) continue;
    if (postLower === cleanPost) postYears[yr] = true;
  }

  var electionYear = now().getFullYear();
  var lookback     = electionYear - 1; // most recent completed year

  // T1: PURE consecutive — first absent year backwards breaks streak. No gaps.
  var streak      = 0;
  var streakYears = [];
  for (var y = lookback; y >= lookback - 6; y--) {
    if (postYears[y]) {
      streak++;
      streakYears.unshift(y.toString());
    } else {
      break; // pure consecutive — any gap ends it
    }
  }

  if (streak >= 5) {
    return {
      eligible:        false,
      consecutiveYears: streak,
      reason:          'T1 Same-Post Tenure Bar: held post of ' + nomPost + ' for ' +
                       streak + ' consecutive years (' + streakYears.join(', ') + '). ' +
                       'Cannot stand for the same post again. ' +
                       'Any break in consecutive service would lift this bar.'
    };
  }

  return {
    eligible:        true,
    consecutiveYears: streak,
    reason:          streak > 0
      ? 'T1 check: ' + streak + ' consecutive year(s) as ' + nomPost +
        ' (' + streakYears.join(', ') + ') — below T1 threshold of 5.'
      : 'No prior service as ' + nomPost + ' found in ECHistory.'
  };
}


// EC_OFFICER may only set draft schedules (mode auto-set).
// Access: RO_ADMIN, EC_OFFICER
// ============================================================
function setElectionSchedule(token, electionId, schedData, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'EC_OFFICER') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'setElectionSchedule', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  // Verify election exists
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };

  // Determine schedule mode
  var isTrial = elec[COL.ELEC_TRIAL].toString() === 'true';
  var mode = schedData.scheduleMode || (isTrial ? 'trial_internal' : 'live');
  // EC Officer can only set trial or draft — not live
  if (sess.role === 'EC_OFFICER' && mode === 'live') mode = 'live_draft';

  // SOP floor checks for live elections
  if (mode === 'live' && schedData.vDay) {
    var floors = checkScheduleFloors(schedData);
    var blocks = floors.filter(function(w) { return w.severity === 'block'; });
    if (blocks.length > 0) {
      return { success: false,
        message: 'Schedule blocked — SOP floor violation(s): ' +
          blocks.map(function(b) { return b.message; }).join(' | '),
        warnings: floors };
    }
  }

  // Check for existing schedule row
  var schedSh = getSheet(SHEETS.ELECTION_SCHED);
  var schedRows = sheetData(SHEETS.ELECTION_SCHED);
  var existingRow = -1;
  for (var s = 0; s < schedRows.length; s++) {
    if (schedRows[s][COL_SCHED.ELEC_ID].toString() === electionId.toString()) {
      existingRow = s + 1; break; // 0-indexed data → 1-indexed sheet row (header=0)
    }
  }

  var ts = now().toISOString();
  var row = new Array(21).fill('');
  row[COL_SCHED.SCHED_ID]              = existingRow > 0 ? schedRows[existingRow - 1][COL_SCHED.SCHED_ID].toString() : generateId();
  row[COL_SCHED.ELEC_ID]               = electionId;
  row[COL_SCHED.SCHED_MODE]            = mode;
  row[COL_SCHED.VDAY]                  = schedData.vDay                 || '';
  row[COL_SCHED.VOTER_ROLL_CUTOFF]     = schedData.voterRollCutoff      || '';
  row[COL_SCHED.NOM_OPEN]              = schedData.nomOpenDate           || '';
  row[COL_SCHED.VOTER_ROLL_PUB]        = schedData.voterRollPubDate      || '';
  row[COL_SCHED.PHASE1_CLOSE]          = schedData.phase1CloseDate       || '';
  row[COL_SCHED.VOTER_ROLL_OBJ_CLOSE]  = schedData.voterRollObjDeadline  || '';
  row[COL_SCHED.NOM_CLOSE]             = schedData.nomCloseDate           || '';
  row[COL_SCHED.VOTER_ROLL_CERT]       = schedData.voterRollCertDate      || '';
  row[COL_SCHED.CAND_PUB]              = schedData.candidatesPubDate      || '';
  row[COL_SCHED.WITHDRAWAL_DEADLINE]   = schedData.withdrawalDeadline     || '';
  row[COL_SCHED.VOTING_OPEN]           = schedData.votingOpenDate         || '';
  row[COL_SCHED.VOTING_CLOSE]          = schedData.votingCloseDate        || '';
  row[COL_SCHED.DECLARATION]           = schedData.declarationDate        || '';
  row[COL_SCHED.PUBLISHED]             = existingRow > 0 ?
    schedRows[existingRow - 1][COL_SCHED.PUBLISHED].toString() : 'false';
  row[COL_SCHED.PUBLISHED_AT]          = existingRow > 0 ?
    schedRows[existingRow - 1][COL_SCHED.PUBLISHED_AT].toString() : '';
  row[COL_SCHED.UPDATED_AT]            = ts;
  row[COL_SCHED.UPDATED_BY]            = sess.identity.toString();
  row[COL_SCHED.EXTENDED_BEYOND_VDAY]  = 'false';

  if (existingRow > 0) {
    schedSh.getRange(existingRow + 1, 1, 1, 21).setValues([row]);
  } else {
    schedSh.appendRow(row);
  }

  // Sync key dates back to Elections sheet
  var elecSh = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === electionId.toString()) {
      if (schedData.vDay)           elecSh.getRange(e+1, COL.ELEC_VDAY+1).setValue(schedData.vDay);
      if (schedData.nomCloseDate)   elecSh.getRange(e+1, COL.ELEC_NOM_DEADLINE+1).setValue(schedData.nomCloseDate);
      if (schedData.votingCloseDate) elecSh.getRange(e+1, COL.ELEC_VOTE_CLOSE+1).setValue(schedData.votingCloseDate);
      if (schedData.declarationDate) elecSh.getRange(e+1, COL.ELEC_DECLARE_DAY+1).setValue(schedData.declarationDate);
      break;
    }
  }

  var warnings = (mode === 'live' && schedData.vDay) ? checkScheduleFloors(schedData) : [];

  appendAdminLog(sess.identity, 'election_schedule_set',
    'Schedule set for election ' + electionId + ' | Mode: ' + mode +
    ' | VDay: ' + (schedData.vDay || 'not set'),
    '', electionId);

  return { success: true, warnings: warnings };
}

// ============================================================
// getElectionSchedule — returns schedule for an election.
// Access: any authenticated session
// ============================================================
function getElectionSchedule(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var schedRows = sheetData(SHEETS.ELECTION_SCHED);
  for (var s = 0; s < schedRows.length; s++) {
    if (schedRows[s][COL_SCHED.ELEC_ID].toString() === electionId.toString()) {
      var r = schedRows[s];
      var fmtD = function(v) {
        if (!v || v.toString().trim() === '') return '';
        var d = new Date(v);
        if (isNaN(d.getTime())) return v.toString();
        return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      };
      return {
        success:              true,
        schedId:              r[COL_SCHED.SCHED_ID].toString(),
        electionId:           r[COL_SCHED.ELEC_ID].toString(),
        scheduleMode:         r[COL_SCHED.SCHED_MODE].toString(),
        vDay:                 fmtD(r[COL_SCHED.VDAY]),
        voterRollCutoff:      fmtD(r[COL_SCHED.VOTER_ROLL_CUTOFF]),
        nomOpenDate:          fmtD(r[COL_SCHED.NOM_OPEN]),
        voterRollPubDate:     fmtD(r[COL_SCHED.VOTER_ROLL_PUB]),
        phase1CloseDate:      fmtD(r[COL_SCHED.PHASE1_CLOSE]),
        voterRollObjDeadline: fmtD(r[COL_SCHED.VOTER_ROLL_OBJ_CLOSE]),
        nomCloseDate:         fmtD(r[COL_SCHED.NOM_CLOSE]),
        voterRollCertDate:    fmtD(r[COL_SCHED.VOTER_ROLL_CERT]),
        candidatesPubDate:    fmtD(r[COL_SCHED.CAND_PUB]),
        withdrawalDeadline:   fmtD(r[COL_SCHED.WITHDRAWAL_DEADLINE]),
        votingOpenDate:       fmtD(r[COL_SCHED.VOTING_OPEN]),
        votingCloseDate:      fmtD(r[COL_SCHED.VOTING_CLOSE]),
        declarationDate:      fmtD(r[COL_SCHED.DECLARATION]),
        published:            r[COL_SCHED.PUBLISHED].toString() === 'true',
        publishedAt:          r[COL_SCHED.PUBLISHED_AT].toString(),
        updatedAt:            r[COL_SCHED.UPDATED_AT].toString(),
        updatedBy:            r[COL_SCHED.UPDATED_BY].toString()
      };
    }
  }
  return { success: false, message: 'No schedule found for this election.' };
}

// ============================================================
// getPublicSchedule — no auth required. Returns published
// schedule for the active live election only.
// Used by Landing Page public widget.
// ============================================================
function getPublicSchedule() {
  try {
  var schedRows = sheetData(SHEETS.ELECTION_SCHED);
  var liveSchedule  = null;
  var trialSchedule = null;

  for (var s = 0; s < schedRows.length; s++) {
    var r    = schedRows[s];
    var pub  = r[COL_SCHED.PUBLISHED].toString() === 'true';
    var mode = r[COL_SCHED.SCHED_MODE].toString();
    if (!pub) continue;

    var fmtD = function(v) {
      if (!v || v.toString().trim() === '') return '';
      var d = new Date(v);
      if (isNaN(d.getTime())) return v.toString();
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    };
    var entry = {
      vDay:              fmtD(r[COL_SCHED.VDAY]),
      nomOpenDate:       fmtD(r[COL_SCHED.NOM_OPEN]),
      phase1CloseDate:   fmtD(r[COL_SCHED.PHASE1_CLOSE]),
      nomCloseDate:      fmtD(r[COL_SCHED.NOM_CLOSE]),
      candidatesPubDate: fmtD(r[COL_SCHED.CAND_PUB]),
      votingOpenDate:    fmtD(r[COL_SCHED.VOTING_OPEN]),
      votingCloseDate:   fmtD(r[COL_SCHED.VOTING_CLOSE]),
      declarationDate:   fmtD(r[COL_SCHED.DECLARATION]),
      publishedAt:       r[COL_SCHED.PUBLISHED_AT].toString(),
      elecId:            r[COL_SCHED.ELEC_ID].toString(),
      mode:              mode
    };

    if (mode === 'live' && !liveSchedule) {
      liveSchedule = entry;
      liveSchedule.isDraft = false;
    } else if (mode === 'live_draft' && !liveSchedule) {
      liveSchedule = entry;
      liveSchedule.isDraft = true;
    } else if (mode === 'trial_member' && !trialSchedule) {
      trialSchedule = entry;
      trialSchedule.isDraft = false;
    }
  }

  return {
    success:       !!(liveSchedule || trialSchedule),
    liveSchedule:  liveSchedule  || null,
    trialSchedule: trialSchedule || null
  };
  } catch(e) {
    return { success: false, error: e.toString(), message: 'getPublicSchedule error: ' + e.toString() };
  }
}

// ============================================================
// publishSchedule — marks schedule as published to Landing Page.
// EC_OFFICER: can publish live_draft only.
// RO_ADMIN: can publish live or live_draft.
// Trial schedules cannot be published.
// Access: RO_ADMIN, EC_OFFICER
// ============================================================
function publishSchedule(token, electionId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'EC_OFFICER') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'publishSchedule', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var schedSh   = getSheet(SHEETS.ELECTION_SCHED);
  var schedRows = sheetData(SHEETS.ELECTION_SCHED);
  for (var s = 0; s < schedRows.length; s++) {
    if (schedRows[s][COL_SCHED.ELEC_ID].toString() !== electionId.toString()) continue;
    var mode = schedRows[s][COL_SCHED.SCHED_MODE].toString();
    // trial_internal is never published — it is for internal RO use only
    if (mode === 'trial_internal') {
      return { success: false, message: 'Internal trial schedules cannot be published. Set schedule mode to trial_member first.' };
    }
    // EC_OFFICER cannot publish the live schedule — RO_ADMIN only
    if (sess.role === 'EC_OFFICER' && mode === 'live') {
      return { success: false, message: 'The live election schedule is managed by the Returning Officer.' };
    }
    var ts = now().toISOString();
    schedSh.getRange(s + 2, COL_SCHED.PUBLISHED + 1).setValue(true);
    schedSh.getRange(s + 2, COL_SCHED.PUBLISHED_AT + 1).setValue(ts);
    appendAdminLog(sess.identity, 'schedule_published',
      'Election schedule published to Landing Page | ElectionID: ' + electionId +
      ' | Mode: ' + mode, '', electionId);
    return { success: true };
  }
  return { success: false, message: 'No schedule found for this election.' };
}

// ============================================================
// getLandingPageContent — returns all public landing page
// content entries. No auth required.
// ============================================================
function getLandingPageContent() {
  var rows = sheetData(SHEETS.LANDING_CONTENT);
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL_LPC.KEY].toString() === '') continue;
    items.push({
      key:       rows[i][COL_LPC.KEY].toString(),
      value:     rows[i][COL_LPC.VALUE].toString(),
      type:      rows[i][COL_LPC.TYPE].toString(),
      label:     rows[i][COL_LPC.LABEL].toString(),
      public:    rows[i][COL_LPC.PUBLIC].toString() === 'true',
      updatedBy: rows[i][COL_LPC.UPDATED_BY].toString(),
      updatedAt: rows[i][COL_LPC.UPDATED_AT].toString()
    });
  }
  return { success: true, items: items };
}

// ============================================================
// setLandingPageContent — creates or updates a content entry.
// Access: RO_ADMIN, EC_OFFICER
// ============================================================
function setLandingPageContent(token, key, value, type, label, publicVisible, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'EC_OFFICER' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'setLandingPageContent');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh   = getSheet(SHEETS.LANDING_CONTENT);
  var rows = sheetData(SHEETS.LANDING_CONTENT);
  var ts   = now().toISOString();
  var existingRow = -1;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL_LPC.KEY].toString() === key) { existingRow = i + 1; break; }
  }

  var row = [key, value, type || 'text', label || key,
             publicVisible === true || publicVisible === 'true' ? true : false,
             sess.identity.toString(), ts];

  if (existingRow > 0) {
    sh.getRange(existingRow + 1, 1, 1, 7).setValues([row]);
  } else {
    sh.appendRow(row);
  }

  appendAdminLog(sess.identity, 'landing_page_content_set',
    'LandingPageContent updated | Key: ' + key + ' | Value: ' + value, '', '');
  return { success: true };
}

function parseDate(val) {
  if (!val) return null;
  var d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Used by Index.html and LandingPage.html to inline JS/CSS files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// appendAdminLog — append-only audit trail
// RULE: never edit or delete AdminLog rows — only append.
// ============================================================

function appendAdminLog(adminId, actionType, description, oldValue, newValue) {
  var sh = getSheet(SHEETS.ADMIN_LOG);
  if (!sh) return; // sheet not yet created — silent fail during setup
  sh.appendRow([
    generateId(),
    adminId    || 'SYSTEM',
    actionType || '',
    description || '',
    oldValue !== undefined && oldValue !== null ? oldValue.toString() : '',
    newValue  !== undefined && newValue !== null ? newValue.toString()  : '',
    now().toISOString()
  ]);
}

// ============================================================
// getAllElections — returns all elections for admin panel display
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER, OBSERVER
// ============================================================
function getAllElections(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var allowedRoles = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER', 'OBSERVER'];
  if (allowedRoles.indexOf(sess.role) === -1) {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.ELECTIONS);
  var elections = rows.map(function(r) {
    return {
      id:        r[COL.ELEC_ID].toString(),
      title:     r[COL.ELEC_TITLE].toString(),
      status:    r[COL.ELEC_STATUS].toString(),
      startDate: r[COL.ELEC_START] ? new Date(r[COL.ELEC_START]).toLocaleDateString('en-IN') : '',
      endDate:   r[COL.ELEC_END]   ? new Date(r[COL.ELEC_END]).toLocaleDateString('en-IN') : '',
      mode:      r[COL.ELEC_MODE]  ? r[COL.ELEC_MODE].toString() : 'electronic',
      isTrial:   r[COL.ELEC_TRIAL] ? r[COL.ELEC_TRIAL].toString() === 'true' : false
    };
  });

  return { success: true, elections: elections };
}

// ============================================================
// createElection — creates a new election record
// Access: RO_ADMIN only
// ============================================================
function createElection(token, data, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'createElection');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!data.title || data.title.trim() === '') {
    return { success: false, message: 'Election title is required.' };
  }

  var sh = getSheet(SHEETS.ELECTIONS);
  if (!sh) return { success: false, message: 'Elections sheet not found.' };

  var id = 'ELEC-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var row = [];

  // Build row — 27 columns (0–26)
  row[COL.ELEC_ID]          = id;
  row[COL.ELEC_TITLE]       = data.title.trim();
  row[COL.ELEC_DESC]        = '';
  row[COL.ELEC_STATUS]      = 'draft';
  row[COL.ELEC_START]       = '';
  row[COL.ELEC_END]         = '';
  row[COL.ELEC_CREATED_BY]  = sess.identity;
  row[COL.ELEC_CREATED_AT]  = now().toISOString();
  row[COL.ELEC_ORGSECY_BATCH]         = '';
  row[COL.ELEC_BATCHREP_RESTRICTED]   = false;
  row[COL.ELEC_ORGSECY_RESTRICTED]    = false;
  row[COL.ELEC_RESULT_VIS]            = 'post_declaration';
  row[COL.ELEC_NOM_DEADLINE]          = '';
  row[COL.ELEC_EC_CONTACT]            = '';
  row[COL.ELEC_NOM_PHASE]             = '';
  row[COL.ELEC_NOM_EXT_COUNT]         = 0;
  row[COL.ELEC_NOM_EXT_DEADLINE]      = '';
  row[COL.ELEC_MIN_POSTS]             = 0;
  row[COL.ELEC_MODE]                  = data.mode || 'electronic';
  row[COL.ELEC_TRIAL]                 = data.isTrial === true ? true : false;
  row[COL.ELEC_BYPASS_FLOORS]         = false;
  row[COL.ELEC_VDAY]                  = '';
  row[COL.ELEC_VOTE_CLOSE]            = '';
  row[COL.ELEC_DECLARE_DAY]           = '';
  row[COL.ELEC_SGM_DATE]              = '';
  row[COL.ELEC_CERTIFIED_AT]          = '';
  row[COL.ELEC_SEAT_CONFIG]           = '';
  row[COL.ELEC_INTERNAL_TEST]         = data.isInternalTest === true ? true : false;

  sh.appendRow(row);

  appendAdminLog(sess.identity, 'election_created',
    'New election created: ' + data.title.trim(), '', id);

  return { success: true, id: id, message: 'Election created successfully.' };
}

// ============================================================
// getElection — returns single election by ID
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER, OBSERVER
// ============================================================
function getElection(token, id) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var allowedRoles = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER', 'OBSERVER'];
  if (allowedRoles.indexOf(sess.role) === -1) {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.ELECTIONS);
  var row = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ELEC_ID].toString() === id.toString()) {
      row = rows[i];
      break;
    }
  }
  if (!row) return { success: false, message: 'Election not found.' };

  return {
    success: true,
    election: {
      id:            row[COL.ELEC_ID].toString(),
      title:         row[COL.ELEC_TITLE].toString(),
      description:   row[COL.ELEC_DESC]        ? row[COL.ELEC_DESC].toString()        : '',
      status:        row[COL.ELEC_STATUS].toString(),
      ecContact:     row[COL.ELEC_EC_CONTACT]  ? row[COL.ELEC_EC_CONTACT].toString()  : '',
      minPosts:      row[COL.ELEC_MIN_POSTS]   ? row[COL.ELEC_MIN_POSTS].toString()   : '',
      mode:          row[COL.ELEC_MODE]        ? row[COL.ELEC_MODE].toString()        : 'electronic',
      isTrial:       row[COL.ELEC_TRIAL]       ? row[COL.ELEC_TRIAL].toString().toLowerCase() === 'true' : false,
      vDay:          row[COL.ELEC_VDAY]        ? _toDateInputVal(row[COL.ELEC_VDAY])        : '',
      votingCloseDay:row[COL.ELEC_VOTE_CLOSE]  ? _toDateInputVal(row[COL.ELEC_VOTE_CLOSE])  : '',
      declarationDay:    row[COL.ELEC_DECLARE_DAY] ? _toDateInputVal(row[COL.ELEC_DECLARE_DAY]) : '',
      orgSecyBatch:      row[COL.ELEC_ORGSECY_BATCH]      ? row[COL.ELEC_ORGSECY_BATCH].toString().trim()      : '',
      orgSecyRestricted: row[COL.ELEC_ORGSECY_RESTRICTED] ? row[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true' : false
    }
  };
}

// ============================================================
// updateElection — saves editable fields on an election
// Access: RO_ADMIN only
// Allowed at any status — RO may correct details any time
// ============================================================
function updateElection(token, id, data, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'updateElectionSettings', id);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.ELECTIONS);
  if (!sh) return { success: false, message: 'Elections sheet not found.' };

  var rows = sh.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {   // row 0 = header
    if (rows[i][COL.ELEC_ID].toString() === id.toString()) {
      rowIndex = i + 1;                      // Sheets rows are 1-indexed
      break;
    }
  }
  if (rowIndex === -1) return { success: false, message: 'Election not found.' };

  // Write only the editable columns — surgical, one cell at a time
  if (data.description   !== undefined)
    sh.getRange(rowIndex, COL.ELEC_DESC        + 1).setValue(data.description.trim());
  if (data.ecContact     !== undefined)
    sh.getRange(rowIndex, COL.ELEC_EC_CONTACT  + 1).setValue(data.ecContact.trim());
  if (data.minPosts      !== undefined)
    sh.getRange(rowIndex, COL.ELEC_MIN_POSTS   + 1).setValue(
      data.minPosts === '' ? 0 : parseInt(data.minPosts, 10) || 0
    );
  if (data.vDay          !== undefined)
    sh.getRange(rowIndex, COL.ELEC_VDAY        + 1).setValue(data.vDay.trim());
  if (data.votingCloseDay !== undefined)
    sh.getRange(rowIndex, COL.ELEC_VOTE_CLOSE  + 1).setValue(data.votingCloseDay.trim());
  if (data.declarationDay !== undefined)
    sh.getRange(rowIndex, COL.ELEC_DECLARE_DAY + 1).setValue(data.declarationDay.trim());
  if (data.orgSecyBatch !== undefined)
    sh.getRange(rowIndex, COL.ELEC_ORGSECY_BATCH + 1).setValue(data.orgSecyBatch.toString().trim());
  if (data.orgSecyRestricted !== undefined)
    sh.getRange(rowIndex, COL.ELEC_ORGSECY_RESTRICTED + 1).setValue(data.orgSecyRestricted === true);

  appendAdminLog(sess.identity, 'election_updated',
    'Election details updated', '', id);

  return { success: true, message: 'Saved.' };
}

// ============================================================
// deleteElection — hard delete, draft status only
// Access: RO_ADMIN only
// ============================================================
function deleteElection(token, id, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'deleteElection', id);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.ELECTIONS);
  if (!sh) return { success: false, message: 'Elections sheet not found.' };

  var rows = sh.getDataRange().getValues();
  var rowIndex = -1;
  var title = '';
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ELEC_ID].toString() === id.toString()) {
      var status = rows[i][COL.ELEC_STATUS].toString();
var isTrial = rows[i][COL.ELEC_TRIAL].toString() === 'true';
if (!isTrial && status !== 'draft') {
  return { success: false, message: 'Only draft elections may be deleted.' };
}
if (isTrial && status === 'active') {
  return { success: false, message: 'Cannot delete a trial election while voting is active.' };
}
      rowIndex = i + 1;
      title = rows[i][COL.ELEC_TITLE].toString();
      break;
    }
  }
  if (rowIndex === -1) return { success: false, message: 'Election not found.' };

  sh.deleteRow(rowIndex);

  appendAdminLog(sess.identity, 'election_deleted',
    'Draft election deleted: ' + title, '', id);

  return { success: true, message: 'Election deleted.' };
}

// ============================================================
// PRE-ELECTION SECURITY VERIFICATION CHECKLIST (Appendix H)
// ============================================================

// All 20 checklist items — code, label, part, scrutineer-witnessed flag
var PRESEC_ITEMS = [
  { code:'A1', part:'A', label:'OTPs tab protected and hidden',                         star:true  },
  { code:'A2', part:'A', label:'Votes tab protected read-only',                         star:true  },
  { code:'A3', part:'A', label:'VotedLog tab protected read-only',                      star:true  },
  { code:'A4', part:'A', label:'Voters tab protected read-only',                        star:true  },
  { code:'A5', part:'A', label:'Admins tab protected against direct editing',           star:true  },
  { code:'A6', part:'A', label:'AdminLog tab protected append-only',                    star:true  },
  { code:'B1', part:'B', label:'Deployed version number recorded',                      star:true  },
  { code:'B2', part:'B', label:'Deployed version confirmed against GitHub commit',      star:true  },
  { code:'B3', part:'B', label:'No redeployment since B1 confirmed by RO',             star:false },
  { code:'C1', part:'C', label:'2-Step Verification confirmed active',                  star:false },
  { code:'C2', part:'C', label:'Recovery email confirmed functional',                   star:false },
  { code:'C3', part:'C', label:'Account access log reviewed — no unrecognised access', star:false },
  { code:'C4', part:'C', label:'Password changed at EC handover — not shared',         star:false },
  { code:'D1', part:'D', label:'Voter roll certified and row count verified',           star:false },
  { code:'D2', part:'D', label:'Candidate list complete — all posts covered',           star:false },
  { code:'D3', part:'D', label:'Mandatory posts confirmed or GB resolution on file',    star:false },
  { code:'D4', part:'D', label:'OrgSecyRestricted setting confirmed correct',           star:false },
  { code:'E1', part:'E', label:'Pre-election test vote cast and cleared',               star:false },
  { code:'E2', part:'E', label:'OTP delivery confirmed functional',                     star:false },
  { code:'E3', part:'E', label:'Session expiry confirmed functional',                   star:false },
  { code:'E4', part:'E', label:'Ballot eligibility filtering confirmed',                star:false },
  { code:'E5', part:'E', label:'Voter receipt token confirmed',                         star:false },
  { code:'E6', part:'E', label:'Nomination submission blocked at candidates_published', star:false },
  { code:'F1', part:'F', label:'Voters tab export saved to GDrive',                    star:false },
  { code:'F2', part:'F', label:'Elections tab export saved to GDrive',                 star:false },
  { code:'F3', part:'F', label:'Candidates tab export saved to GDrive',                star:false },
  { code:'F4', part:'F', label:'ScrutinyLog export saved to GDrive',                   star:false },
  { code:'F5', part:'F', label:'AdminLog export saved to GDrive',                      star:false },
  { code:'G1', part:'G', label:'Final candidate list published to all members',        star:false },
  { code:'G2', part:'G', label:'Voting window notification sent to all voters',        star:false },
  { code:'G3', part:'G', label:'Observer accreditation confirmed',                     star:false },
  { code:'G4', part:'G', label:'Scrutineer Mirror sheet shared and access confirmed with all Scrutineers', star:false }
];

// ============================================================
function getChecklistStatus(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM' && sess.role !== 'SCRUTINEER') {
    return { success: false, message: 'Access denied.' };
  }

  var sh   = getSheet(SHEETS.PRESEC_CHECKLIST);
  var rows = sh.getDataRange().getValues();

  // Build a map of itemCode → row data
  var done = {};
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_PRESEC.ELEC_ID].toString() !== electionId.toString()) continue;
    var code = rows[i][COL_PRESEC.ITEM_CODE].toString();
    done[code] = {
      completedBy:   rows[i][COL_PRESEC.COMPLETED_BY].toString(),
      completedRole: rows[i][COL_PRESEC.COMPLETED_ROLE].toString(),
      completedAt:   rows[i][COL_PRESEC.COMPLETED_AT]  ? new Date(rows[i][COL_PRESEC.COMPLETED_AT]).toISOString() : '',
      sc1By:         rows[i][COL_PRESEC.SC1_BY].toString(),
      sc1At:         rows[i][COL_PRESEC.SC1_AT] ? new Date(rows[i][COL_PRESEC.SC1_AT]).toISOString() : '',
      sc2By:         rows[i][COL_PRESEC.SC2_BY].toString(),
      sc2At:         rows[i][COL_PRESEC.SC2_AT] ? new Date(rows[i][COL_PRESEC.SC2_AT]).toISOString() : '',
      notes:         rows[i][COL_PRESEC.NOTES].toString()
    };
  }

  // Merge with master item list
  var items = PRESEC_ITEMS.map(function(item) {
    var d = done[item.code] || {};
    return {
      code:          item.code,
      part:          item.part,
      label:         item.label,
      star:          item.star,
      completedBy:   d.completedBy   || '',
      completedRole: d.completedRole || '',
      completedAt:   d.completedAt   || '',
      sc1By:         d.sc1By || '',
      sc1At:         d.sc1At || '',
      sc2By:         d.sc2By || '',
      sc2At:         d.sc2At || '',
      notes:         d.notes || ''
    };
  });

  // Compute overall readiness
  var allComplete = items.every(function(item) {
    if (!item.completedAt) return false;
    if (item.star && (!item.sc1At || !item.sc2At)) return false;
    return true;
  });

  return { success: true, items: items, allComplete: allComplete };
}

function recordChecklistItem(token, electionId, itemCode, notes) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  // Validate item code
  var validItem = null;
  for (var v = 0; v < PRESEC_ITEMS.length; v++) {
    if (PRESEC_ITEMS[v].code === itemCode) { validItem = PRESEC_ITEMS[v]; break; }
  }
  if (!validItem) return { success: false, message: 'Unknown checklist item: ' + itemCode };

  var sh   = getSheet(SHEETS.PRESEC_CHECKLIST);
  var rows = sh.getDataRange().getValues();
  var now  = new Date();

  // Check if row already exists for this election + item
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_PRESEC.ELEC_ID].toString()   !== electionId.toString()) continue;
    if (rows[i][COL_PRESEC.ITEM_CODE].toString()  !== itemCode) continue;
    // Update existing row
    sh.getRange(i + 1, COL_PRESEC.COMPLETED_BY   + 1).setValue(sess.identity);
    sh.getRange(i + 1, COL_PRESEC.COMPLETED_ROLE + 1).setValue(sess.role);
    sh.getRange(i + 1, COL_PRESEC.COMPLETED_AT   + 1).setValue(now);
    sh.getRange(i + 1, COL_PRESEC.NOTES          + 1).setValue(notes || '');
    appendAdminLog(sess.identity, 'presec_item_recorded',
      'Checklist item ' + itemCode + ' (' + validItem.label + ') marked complete.',
      '', electionId);
    return { success: true, updated: true };
  }

  // No existing row — append new
  var newRow = new Array(11).fill('');
  newRow[COL_PRESEC.ID]             = 'PSC-' + now.getTime();
  newRow[COL_PRESEC.ELEC_ID]        = electionId;
  newRow[COL_PRESEC.ITEM_CODE]      = itemCode;
  newRow[COL_PRESEC.COMPLETED_BY]   = sess.identity;
  newRow[COL_PRESEC.COMPLETED_ROLE] = sess.role;
  newRow[COL_PRESEC.COMPLETED_AT]   = now;
  newRow[COL_PRESEC.NOTES]          = notes || '';
  sh.appendRow(newRow);

  appendAdminLog(sess.identity, 'presec_item_recorded',
    'Checklist item ' + itemCode + ' (' + validItem.label + ') marked complete.',
    '', electionId);
  return { success: true, updated: false };
}

function confirmChecklistItemScrutineer(token, electionId, itemCode) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'SCRUTINEER') {
    return { success: false, message: 'Only a Scrutineer may confirm witnessed items.' };
  }

  // Validate item code and check it is a starred item
  var validItem = null;
  for (var v = 0; v < PRESEC_ITEMS.length; v++) {
    if (PRESEC_ITEMS[v].code === itemCode) { validItem = PRESEC_ITEMS[v]; break; }
  }
  if (!validItem) return { success: false, message: 'Unknown checklist item: ' + itemCode };
  if (!validItem.star) {
    return { success: false, message: 'Item ' + itemCode + ' does not require Scrutineer confirmation.' };
  }

  var sh   = getSheet(SHEETS.PRESEC_CHECKLIST);
  var rows = sh.getDataRange().getValues();
  var now  = new Date();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_PRESEC.ELEC_ID].toString()  !== electionId.toString()) continue;
    if (rows[i][COL_PRESEC.ITEM_CODE].toString() !== itemCode) continue;

    // Must be completed by RO/TEM first
    if (!rows[i][COL_PRESEC.COMPLETED_AT]) {
      return { success: false, message: 'Item ' + itemCode + ' has not been marked complete by RO/TEM yet.' };
    }

    // Slot 1 empty — fill it
    if (!rows[i][COL_PRESEC.SC1_AT]) {
      sh.getRange(i + 1, COL_PRESEC.SC1_BY + 1).setValue(sess.identity);
      sh.getRange(i + 1, COL_PRESEC.SC1_AT + 1).setValue(now);
      appendAdminLog(sess.identity, 'presec_scrutineer_confirmed',
        'Scrutineer 1 confirmed checklist item ' + itemCode + ' (' + validItem.label + ').',
        '', electionId);
      return { success: true, slot: 1 };
    }

    // Slot 1 filled by same scrutineer — block double-sign
    if (rows[i][COL_PRESEC.SC1_BY].toString() === sess.identity) {
      return { success: false, message: 'You have already confirmed item ' + itemCode + '.' };
    }

    // Slot 2 empty — fill it
    if (!rows[i][COL_PRESEC.SC2_AT]) {
      sh.getRange(i + 1, COL_PRESEC.SC2_BY + 1).setValue(sess.identity);
      sh.getRange(i + 1, COL_PRESEC.SC2_AT + 1).setValue(now);
      appendAdminLog(sess.identity, 'presec_scrutineer_confirmed',
        'Scrutineer 2 confirmed checklist item ' + itemCode + ' (' + validItem.label + ').',
        '', electionId);
      return { success: true, slot: 2 };
    }

    // Both slots filled
    return { success: false, message: 'Item ' + itemCode + ' already confirmed by two Scrutineers.' };
  }

  return { success: false, message: 'Item ' + itemCode + ' has not been recorded yet. RO/TEM must mark it complete first.' };
}

// ============================================================
// updateElectionStatus — advances election to a new status
// Access: RO_ADMIN only
// ============================================================
function computeVotesHash() {
  var sh = getSheet(SHEETS.VOTES);
  if (!sh) return '';
  var data = sh.getDataRange().getValues();
  var content = JSON.stringify(data);
  var hash = '';
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    content,
    Utilities.Charset.UTF_8
  );
  for (var b = 0; b < bytes.length; b++) {
    var byte = (bytes[b] + 256) % 256;
    var hex  = byte.toString(16);
    hash += (hex.length === 1 ? '0' : '') + hex;
  }
  return hash;
}

function updateElectionStatus(token, electionId, newStatus, overrideNote, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'updateElectionStatus', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var validStatuses = [
    'draft', 'nominations_open', 'nominations_open_phase2',
    'scrutiny', 'candidates_published', 'active',
    'paused', 'closed', 'declared'
  ];
  if (validStatuses.indexOf(newStatus) === -1) {
    return { success: false, message: 'Invalid status: ' + newStatus };
  }

  var sh = getSheet(SHEETS.ELECTIONS);
  if (!sh) return { success: false, message: 'Elections sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      var currentStatus = rows[i][COL.ELEC_STATUS].toString();
      if (currentStatus === newStatus) {
        return { success: false, message: 'Election is already at that status.' };
      }

      // ── GATE: candidates_published → active ──────────────────
      // Block if any appeals are pending (filed or under_review).
      // Exception: if ELEC_CAND_PUB_AT + 96hrs has passed, auto-close
      // undecided appeals as panel_no_response and allow advance.
      if (currentStatus === 'candidates_published' && newStatus === 'active') {
        var candPubAtStr = rows[i][COL.ELEC_CAND_PUB_AT] ? rows[i][COL.ELEC_CAND_PUB_AT].toString() : '';
        var panelDeadlineMs = candPubAtStr ? (new Date(candPubAtStr).getTime() + (96 * 60 * 60 * 1000)) : 0;
        var nowMs = now().getTime();
        var panelWindowExpired = panelDeadlineMs > 0 && nowMs > panelDeadlineMs;

        var aplRows = sheetData(SHEETS.APPEALS);
        var aplSh2  = getSheet(SHEETS.APPEALS);
        var aplData2 = aplSh2.getDataRange().getValues();
        var pendingCount = 0;

        for (var a = 0; a < aplRows.length; a++) {
          if (aplRows[a][COL_APL.ELEC_ID].toString() !== electionId.toString()) continue;
          var aplStatus = aplRows[a][COL_APL.STATUS].toString();
          if (aplStatus === 'filed' || aplStatus === 'under_review') {
            if (panelWindowExpired) {
              // Auto-close as panel_no_response
              aplSh2.getRange(a + 2, COL_APL.STATUS     + 1).setValue('panel_no_response');
              aplSh2.getRange(a + 2, COL_APL.DECIDED_AT + 1).setValue(new Date());
              aplSh2.getRange(a + 2, COL_APL.DECIDED_BY + 1).setValue('SYSTEM');
              aplSh2.getRange(a + 2, COL_APL.RO_NOTES   + 1).setValue(
                'Auto-closed: Appeals Panel did not respond within 96 hours of candidate list publication.');
              appendAdminLog(sess.identity, 'appeal_auto_closed_panel_no_response',
                'Appeal ' + aplRows[a][COL_APL.ID].toString() + ' auto-closed as panel_no_response — ' +
                '96-hour panel window expired. Nomination remains rejected.',
                aplStatus, electionId);
            } else {
              pendingCount++;
            }
          }
        }

        if (pendingCount > 0) {
          var hoursLeft = Math.ceil((panelDeadlineMs - nowMs) / (60 * 60 * 1000));
          return {
            success: false,
            message: 'Cannot activate voting — ' + pendingCount + ' appeal(s) are pending. ' +
                     'The Appeals Panel has ' + hoursLeft + ' hour(s) remaining to decide. ' +
                     'All appeals must be decided before voting can open.'
          };
        }

        // Block if any mandatory post has no candidate
        var MANDATORY_POSTS = ['President', 'Vice President', 'General Secretary', 'Treasurer'];
        var candRows2 = sheetData(SHEETS.CANDIDATES);
        var filledPosts = {};
        for (var cp = 0; cp < candRows2.length; cp++) {
          if (candRows2[cp][COL.CAND_ELEC_ID].toString() !== electionId.toString()) continue;
          var pName = candRows2[cp][COL.CAND_POST].toString().trim();
          filledPosts[pName] = true;
        }
        var vacantMandatory = [];
        for (var mp = 0; mp < MANDATORY_POSTS.length; mp++) {
          if (!filledPosts[MANDATORY_POSTS[mp]]) {
            vacantMandatory.push(MANDATORY_POSTS[mp]);
          }
        }
        if (vacantMandatory.length > 0) {
          // Check if a GB resolution document has been uploaded for this election
          var docRows = sheetData(SHEETS.DOC_STORE);
          var hasGBRes = false;
          for (var dr = 0; dr < docRows.length; dr++) {
            if (docRows[dr][COL.DOC_ELEC_ID].toString() !== electionId.toString()) continue;
            if (docRows[dr][COL.DOC_CATEGORY].toString() !== 'gb_resolution_mandatory_post') continue;
            if ((docRows[dr][COL.DOC_NOTES] || '').toString().indexOf('DELETED') === 0) continue;
            hasGBRes = true;
            break;
          }
          if (!hasGBRes) {
            return {
              success:              false,
              requiresGBResolution: true,
              vacantPosts:          vacantMandatory,
              message:              'Cannot activate voting — the following mandatory post' +
                                    (vacantMandatory.length > 1 ? 's have' : ' has') +
                                    ' no candidate: ' + vacantMandatory.join(', ') + '. ' +
                                    'Upload a General Body resolution to proceed.'
            };
          }
          // GB resolution present — log the override and allow
          appendAdminLog(sess.identity, 'mandatory_post_gb_override',
            'Voting activated with vacant mandatory post(s): ' + vacantMandatory.join(', ') +
            '. GB resolution document on file.',
            '', electionId);
        }

        // ── GATE: Pre-Election Security Verification Checklist ──
        // Skip for trial elections
        var isTrial = rows[i][COL.ELEC_TRIAL].toString() === 'true';
        if (!isTrial) {
          var clStatus = getChecklistStatus(token, electionId);
          if (!clStatus.success || !clStatus.allComplete) {
            return {
              success: false,
              requiresChecklist: true,
              message: 'Cannot activate voting — the Pre-Election Security Verification ' +
                       'Checklist (Appendix H) has not been fully completed. ' +
                       'All items must be marked done and all ★ items confirmed by two Scrutineers.'
            };
          }
        }
        // ───────────────────────────────────────────────────────
      }
      // ────────────────────────────────────────────────────────

      // ── GATE: draft → nominations_open ───────────────────────
      // Require draft voter roll to be uploaded before nominations open
      if (currentStatus === 'draft' && newStatus === 'nominations_open') {
        var isTrial2 = rows[i][COL.ELEC_TRIAL].toString() === 'true';
        if (!isTrial2) {
          var vrdRows = sheetData(SHEETS.VOTER_ROLL_DRAFT);
          if (!vrdRows || vrdRows.length === 0) {
            return {
              success: false,
              message: 'Cannot open nominations — the draft voter roll has not been uploaded. ' +
                       'The EC Officer must upload the draft voter roll before nominations can open.'
            };
          }
          // ── EC Officer lockout check ──
          var adminRows = getSheet(SHEETS.ADMINS).getDataRange().getValues();
          var ecActive = false;
          for (var ea = 0; ea < adminRows.length; ea++) {
            if (adminRows[ea][COL.ADMIN_ROLE].toString() === 'EC_OFFICER' &&
                adminRows[ea][COL.ADMIN_STATUS].toString().toUpperCase() !== 'DISABLED') {
              ecActive = true;
              break;
            }
          }
          if (ecActive) {
            return {
              success: false,
              message: 'Cannot open nominations — the EC Officer account has not been disabled. ' +
                       'Complete the handover and disable the EC Officer account before opening nominations.'
            };
          }
        }
        var orgBatch = rows[i][COL.ELEC_ORGSECY_BATCH].toString().trim();
        if (orgBatch) {
          // Auto-set restricted flag
          sh.getRange(i + 1, COL.ELEC_ORGSECY_RESTRICTED + 1).setValue(true);
          // Email all voters from the designated batch
          var voterRows = sheetData(SHEETS.VOTERS);
          var batchBracket = getBatchRepBracket(orgBatch);
          var batchLabel = batchBracket ? batchBracket : orgBatch;
          var elecTitle = rows[i][COL.ELEC_TITLE].toString();
          for (var vb = 0; vb < voterRows.length; vb++) {
            var vBatch = voterRows[vb][COL.VOTER_BATCH].toString().trim();
            var vBracket = getBatchRepBracket(vBatch);
            // Match on exact year for Org Secy (not bracket)
            if (vBatch !== orgBatch) continue;
            var vEmail = voterRows[vb][COL.VOTER_EMAIL].toString().trim();
            var vName  = voterRows[vb][COL.VOTER_NAME].toString().trim();
            if (!vEmail) continue;
            var subject = 'SSKZM OBA Election — Organising Secretary: Priority Nomination Window for Batch ' + orgBatch;
            var body =
              '<p>Dear ' + vName + ',</p>' +
              '<p>Nominations are now open for the <strong>' + elecTitle + '</strong>.</p>' +
              '<p>The post of <strong>Organising Secretary</strong> has been designated for ' +
              'Batch <strong>' + orgBatch + '</strong> for this election.</p>' +
              '<p><strong>Phase 1 (first 7 days):</strong> Only members of Batch ' + orgBatch +
              ' may nominate for or propose/second a nomination for Organising Secretary.</p>' +
              '<p><strong>Important:</strong> If no complete nomination (with proposer and seconder confirmed) ' +
              'is received from Batch ' + orgBatch + ' by the end of Phase 1, the post will be ' +
              'declared open to all Life Members for Phase 2.</p>' +
              '<p>Please log in to the election portal to submit or support a nomination.</p>' +
              '<p>SSKZM OBA Elections</p>';
            try { sendEmailViaSendGrid(vEmail, subject, body); } catch(e) {}
          }
          appendAdminLog(sess.identity, 'orgsecy_batch_restricted',
            'Org Secy restricted to batch ' + orgBatch + '. Batch email sent.',
            '', electionId);
        }
      }
      // ────────────────────────────────────────────────────────

      // ── GATE: nominations_open → nominations_open_phase2 ────
      if (currentStatus === 'nominations_open' && newStatus === 'nominations_open_phase2') {
        var orgBatchP2  = rows[i][COL.ELEC_ORGSECY_BATCH].toString().trim();
        var orgRestrP2  = rows[i][COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true';
        if (orgBatchP2 && orgRestrP2) {
          var nomRowsP2 = sheetData(SHEETS.NOMINATIONS);
          var hasCompleteP2 = false;
          for (var ncP2 = 0; ncP2 < nomRowsP2.length; ncP2++) {
            if (nomRowsP2[ncP2][COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
            if (nomRowsP2[ncP2][COL.NOM_POST].toString() !== 'Organising Secretary') continue;
            if (nomRowsP2[ncP2][COL.NOM_CAND_BATCH].toString().trim() !== orgBatchP2) continue;
            var nStatP2 = nomRowsP2[ncP2][COL.NOM_STATUS].toString();
            if (nStatP2 === 'pending_scrutiny' || nStatP2 === 'confirmed' ||
                nStatP2 === 'accepted') {
              hasCompleteP2 = true; break;
            }
          }
          // First pass — show comms panel, do NOT write to sheet yet
          if (!overrideNote || overrideNote.indexOf('orgsecy_comms_confirmed') === -1) {
            return {
              success: false,
              requiresOrgSecyComms: true,
              orgSecyLifted: !hasCompleteP2,
              orgBatch: orgBatchP2,
              message: !hasCompleteP2
                ? 'No complete Org Secy nomination from Batch ' + orgBatchP2 +
                  '. The restriction will be lifted and the post opened to all members. ' +
                  'You must communicate this to all members before Phase 2 opens.'
                : 'A complete Org Secy nomination from Batch ' + orgBatchP2 +
                  ' exists. The post remains restricted for Phase 2. ' +
                  'You must confirm before advancing.'
            };
          }
          // Second pass — RO confirmed. Now write sheet and send email.
          if (!hasCompleteP2) {
            sh.getRange(i + 1, COL.ELEC_ORGSECY_RESTRICTED + 1).setValue(false);
            appendAdminLog(sess.identity, 'orgsecy_restriction_lifted',
              'No complete Org Secy nomination from batch ' + orgBatchP2 +
              '. Restriction lifted automatically.', 'true', 'false');
            var allVoterRows = sheetData(SHEETS.VOTERS);
            var elecTitleP2  = rows[i][COL.ELEC_TITLE].toString();
            for (var avP2 = 0; avP2 < allVoterRows.length; avP2++) {
              var avEmail = allVoterRows[avP2][COL.VOTER_EMAIL].toString().trim();
              var avName  = allVoterRows[avP2][COL.VOTER_NAME].toString().trim();
              if (!avEmail) continue;
              var avSubject = 'SSKZM OBA Election — Organising Secretary now open to all members';
              var avBody =
                '<p>Dear ' + avName + ',</p>' +
                '<p>Phase 2 nominations are now open for the <strong>' + elecTitleP2 + '</strong>.</p>' +
                '<p>No complete nomination was received from Batch <strong>' + orgBatchP2 +
                '</strong> for the post of Organising Secretary during Phase 1.</p>' +
                '<p>The post of <strong>Organising Secretary is now open to all Life Members</strong> ' +
                'for Phase 2 nominations.</p>' +
                '<p>Please log in to the election portal to submit or support a nomination.</p>' +
                '<p>SSKZM OBA Elections</p>';
              try { sendEmailViaSendGrid(avEmail, avSubject, avBody); } catch(e) {}
            }
            appendAdminLog(sess.identity, 'orgsecy_open_all_email_sent',
              'Org Secy opened to all. Email sent to all voters.', '', electionId);
          } else {
            appendAdminLog(sess.identity, 'orgsecy_restriction_maintained',
              'Complete Org Secy nomination from batch ' + orgBatchP2 +
              '. Restriction maintained for Phase 2.', '', electionId);
          }
        }
      }
      // ────────────────────────────────────────────────────────

      // ── HASH: active → closed — compute and store votes hash ─
      if ((currentStatus === 'active' || currentStatus === 'paused') && newStatus === 'closed') {
        var hash = computeVotesHash();
        sh.getRange(i + 1, COL.ELEC_VOTES_HASH + 1).setValue(hash);
        appendAdminLog(sess.identity, 'votes_hash_computed',
          'Votes sheet hash computed at close: ' + hash, '', electionId);
        // Email hash to all active Scrutineers
        var scRows = getSheet(SHEETS.ADMINS).getDataRange().getValues();
        var hashSubject = 'SSKZM OBA Election — Votes Sheet Fingerprint at Close';
        var hashBody =
          '<p><strong>SSKZM OBA Election Management System</strong></p>' +
          '<p>Voting has closed for election: <strong>' + rows[i][COL.ELEC_TITLE].toString() + '</strong></p>' +
          '<p>A cryptographic fingerprint (SHA-256 hash) of the complete Votes sheet ' +
          'has been computed and is recorded in the system.</p>' +
          '<p><strong>Hash value:</strong><br><code>' + hash + '</code></p>' +
          '<p>This value will be recomputed at the time of declaration. ' +
          'If the Votes sheet has been altered after voting closed, ' +
          'the hash will not match and declaration will be blocked automatically.</p>' +
          '<p>Please retain this email as your independent record.</p>' +
          '<p>SSKZM OBA Elections</p>';
        for (var sc = 1; sc < scRows.length; sc++) {
          if (scRows[sc][COL.ADMIN_ROLE].toString() !== 'SCRUTINEER') continue;
          if (scRows[sc][COL.ADMIN_STATUS].toString().toUpperCase() !== 'ACTIVE') continue;
          var scEmail = scRows[sc][COL.ADMIN_EMAIL].toString().trim();
          if (scEmail) { try { sendEmailViaSendGrid(scEmail, hashSubject, hashBody); } catch(e) {} }
        }
      }

      // ── HASH: closed → declared — verify hash before allowing ─
      if (currentStatus === 'closed' && newStatus === 'declared') {
        var storedHash = rows[i][COL.ELEC_VOTES_HASH].toString().trim();
        // ── GATE: require at least one Scrutineer tally co-sign ─
        var isTrial3 = rows[i][COL.ELEC_TRIAL].toString() === 'true';
        if (!isTrial3) {
          var logRows3 = sheetData(SHEETS.ADMIN_LOG);
          var hasCosign = false;
          for (var lg = 0; lg < logRows3.length; lg++) {
            if (logRows3[lg][COL.LOG_ACTION].toString() === 'tally_cosign' &&
                logRows3[lg][COL.LOG_ELEC_ID].toString() === electionId.toString()) {
              hasCosign = true; break;
            }
          }
          if (!hasCosign) {
            return { success: false, message: 'Declaration blocked — no Scrutineer tally co-sign on record. At least one Scrutineer must co-sign the tally before results can be declared.' };
          }
        }
        // ─────────────────────────────────────────────────────────
        if (!storedHash) {
          return { success: false, message: 'Declaration blocked — no votes hash on record. Cannot verify Votes sheet integrity.' };
        }
        var currentHash = computeVotesHash();
        if (currentHash !== storedHash) {
          // Alert all Scrutineers immediately
          var mismatchRows = getSheet(SHEETS.ADMINS).getDataRange().getValues();
          var mismatchSubject = 'CRITICAL ALERT — SSKZM OBA Election: Votes Sheet Integrity Failure';
          var mismatchBody =
            '<p><strong>CRITICAL SECURITY ALERT — SSKZM OBA Election Management System</strong></p>' +
            '<p>A votes sheet integrity check has FAILED for election: <strong>' +
            rows[i][COL.ELEC_TITLE].toString() + '</strong></p>' +
            '<p>The cryptographic fingerprint of the Votes sheet does not match ' +
            'the fingerprint recorded when voting closed.</p>' +
            '<table style="border-collapse:collapse;font-family:monospace">' +
            '<tr><td style="padding:4px 12px 4px 0"><strong>Hash at close:</strong></td><td>' + storedHash + '</td></tr>' +
            '<tr><td style="padding:4px 12px 4px 0"><strong>Hash now:</strong></td><td>' + currentHash + '</td></tr>' +
            '</table>' +
            '<p><strong>Declaration has been blocked automatically.</strong></p>' +
            '<p>Please contact the Returning Officer and the Executive Committee immediately.</p>';
          for (var ms = 1; ms < mismatchRows.length; ms++) {
            if (mismatchRows[ms][COL.ADMIN_ROLE].toString() !== 'SCRUTINEER') continue;
            if (mismatchRows[ms][COL.ADMIN_STATUS].toString().toUpperCase() !== 'ACTIVE') continue;
            var msEmail = mismatchRows[ms][COL.ADMIN_EMAIL].toString().trim();
            if (msEmail) { try { sendEmailViaSendGrid(msEmail, mismatchSubject, mismatchBody); } catch(e) {} }
          }
          appendAdminLog(sess.identity, 'votes_hash_mismatch',
            'INTEGRITY FAILURE — hash mismatch at declaration. Stored: ' + storedHash +
            ' | Current: ' + currentHash, storedHash, electionId);
          return { success: false, message: 'Declaration blocked — Votes sheet integrity check failed. Hash mismatch detected. All Scrutineers have been alerted.' };
        }
        appendAdminLog(sess.identity, 'votes_hash_verified',
          'Votes sheet hash verified at declaration. Hash: ' + currentHash, '', electionId);
      }

      sh.getRange(i + 1, COL.ELEC_STATUS + 1).setValue(newStatus);
      if (newStatus === 'candidates_published') {
        sh.getRange(i + 1, COL.ELEC_CAND_PUB_AT + 1).setValue(now().toISOString());
      }
      appendAdminLog(sess.identity, 'election_status_changed',
        'Status: ' + currentStatus + ' → ' + newStatus +
        (overrideNote ? ' | ' + overrideNote : ''),
        currentStatus, electionId);
      return { success: true };
    }
  }
  return { success: false, message: 'Election not found.' };
}

// ============================================================
// COL constants for new tabs — populate here for EC Officer pass
// ============================================================

var COL_VRD = {
  ROLL:0, NAME:1, SURNAME:2, BATCH:3, EMAIL:4,
  PHONE_CC:5, PHONE:6, PHONE2_CC:7, PHONE2:8,
  UPLOADED_AT:9, OBJECTION_STATUS:10, OBJECTION_NOTES:11,
  VERIFICATION_CAT:12
};

var COL_MSG = {
  ID:0, ELEC_ID:1, FROM_ADMIN_ID:2, TO_ADMIN_ID:3,
  SUBJECT:4, MESSAGE_TEXT:5, SENT_AT:6,
  ACKNOWLEDGED_AT:7, ACKNOWLEDGED_BY:8
};

// ============================================================
// getECOfficerPanel — overview data for EC Officer panel
// Access: EC_OFFICER only
// ============================================================
function getECOfficerPanel(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER') return { success: false, message: 'Access denied.' };

  // Get most relevant election (highest priority non-declared)
  var priority = [
    'nominations_open', 'nominations_open_phase2', 'scrutiny',
    'candidates_published', 'active', 'paused', 'draft', 'closed', 'declared'
  ];
  var elections = sheetData(SHEETS.ELECTIONS);
  var best = null;
  var bestP = priority.length;
  for (var i = 0; i < elections.length; i++) {
    var p = priority.indexOf(elections[i][COL.ELEC_STATUS].toString());
    if (p !== -1 && p < bestP) { best = elections[i]; bestP = p; }
  }

  var election = null;
  if (best) {
    election = {
      id:      best[COL.ELEC_ID].toString(),
      title:   best[COL.ELEC_TITLE].toString(),
      status:  best[COL.ELEC_STATUS].toString(),
      isTrial: best[COL.ELEC_TRIAL].toString() === 'true'
    };
  }

  // Handover checklist — SOP Appendix D.1 items
  var checklist = [
    { id: 'panel_published',    label: 'Panel of 15 senior-most willing eligible Life Members published to all members (not less than 45 days before AGM)', done: false },
    { id: 'objection_window',   label: 'Objection window on panel completed (5 days from publication). RO identified as senior-most without valid objection.', done: false },
    { id: 'ro_appointed',       label: 'RO formally appointed and appointment communicated to all members', done: false },
    { id: 'appeals_panel',      label: 'Appeals Panel constituted and communicated to all members simultaneously with RO appointment', done: false },
    { id: 'scrutineers',        label: 'Scrutineers appointed (not less than 2) and acceptance links sent via EMS', done: false },
    { id: 'vr_verified',        label: 'Voter roll email verification exercise completed via VVA. Verification summary prepared.', done: false },
    { id: 'vr_uploaded',        label: 'Draft voter roll uploaded to EMS', done: false },
    { id: 'vr_app_deactivated', label: 'Voter verification app link deactivated at handover', done: false },
    { id: 'tem_comms',          label: 'TEM appointment communicated (if applicable), or non-appointment declaration noted', done: false },
    { id: 'schedule_shared',    label: 'Election schedule handed to RO', done: false },
    { id: 'credentials_handed', label: 'EMS login credentials handed to RO', done: false },
    { id: 'handover_submitted', label: 'Handover checklist submitted to RO and acknowledged', done: false }
  ];

  // Auto-check voter roll draft — mark done if rows exist
  var vrRows = sheetData(SHEETS.VOTER_ROLL_DRAFT);
  if (vrRows.length > 0) {
    var vrItem = checklist.filter(function(c) { return c.id === 'vr_uploaded'; })[0];
    if (vrItem) { vrItem.done = true; vrItem.note = vrRows.length + ' rows uploaded'; }
  }

  return { success: true, election: election, checklist: checklist };
}

// ============================================================
// getVoterRollDraft — returns draft rows for EC Officer view
// Access: EC_OFFICER, RO_ADMIN
// ============================================================
function getVoterRollDraft(token, page, search) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.VOTER_ROLL_DRAFT);

  // Apply search filter if provided
  if (search && search.trim() !== '') {
    var s = search.trim().toLowerCase();
    rows = rows.filter(function(r) {
      return r[COL_VRD.ROLL].toString().toLowerCase().indexOf(s) !== -1 ||
             r[COL_VRD.NAME].toString().toLowerCase().indexOf(s) !== -1 ||
             r[COL_VRD.SURNAME].toString().toLowerCase().indexOf(s) !== -1;
    });
  }

  return { success: true, rows: rows, total: rows.length };
}

// ============================================================
// uploadVoterRollDraft — replaces all rows in VoterRollDraft
// Access: EC_OFFICER, RO_ADMIN
// Blocked if RO objection window is open (status = nominations_open
// or later AND voter roll has been published)
// ============================================================
function uploadVoterRollDraft(token, rows, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'uploadVoterRollDraft', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!rows || rows.length === 0) {
    return { success: false, message: 'No data rows provided.' };
  }
Logger.log('uploadVoterRollDraft received ' + rows.length + ' rows');
Logger.log('First row: ' + JSON.stringify(rows[0]));

  var sh = getSheet(SHEETS.VOTER_ROLL_DRAFT);
  if (!sh) return { success: false, message: 'VoterRollDraft sheet not found.' };

  var ts = now().toISOString();

  // Clear existing data rows (keep header)
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
  }

  // Write new rows — pad/trim to 13 cols, inject UploadedAt
  var writeRows = rows.map(function(r) {
    var padded = new Array(13).fill('');
    // Cols 0–8: voter data from CSV
    for (var i = 0; i <= 8; i++) {
      padded[i] = (r[i] !== undefined && r[i] !== null) ? r[i].toString().trim() : '';
    }
    // Col 9: system-set upload timestamp
    padded[COL_VRD.UPLOADED_AT] = ts;
    // Col 10: objection status — default none
    padded[COL_VRD.OBJECTION_STATUS] = 'none';
    // Col 11: objection notes — empty
    padded[COL_VRD.OBJECTION_NOTES] = '';
    // Col 12: VerificationCategory — from CSV col 9
    padded[COL_VRD.VERIFICATION_CAT] =
      (r[9] !== undefined && r[9] !== null) ? r[9].toString().trim() : '';
    return padded;
  });

  if (writeRows.length > 0) {
    sh.getRange(2, 1, writeRows.length, 13).setValues(writeRows);
  }

  appendAdminLog(sess.identity, 'voter_roll_draft_uploaded',
    'Voter roll draft uploaded: ' + rows.length + ' rows', '', '');

  return { success: true, message: rows.length + ' rows uploaded.' };
}

// ============================================================
// getMessages — returns messages for EC Officer or RO
// Access: EC_OFFICER, RO_ADMIN
// ============================================================
function getMessages(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN') {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.MESSAGES);

  var messages = rows.map(function(r) {
    return {
      id:            r[COL_MSG.ID].toString(),
      elecId:        r[COL_MSG.ELEC_ID].toString(),
      fromAdminId:   r[COL_MSG.FROM_ADMIN_ID].toString(),
      toAdminId:     r[COL_MSG.TO_ADMIN_ID].toString(),
      subject:       r[COL_MSG.SUBJECT].toString(),
      messageText:   r[COL_MSG.MESSAGE_TEXT].toString(),
      sentAt:        r[COL_MSG.SENT_AT].toString(),
      acknowledgedAt:r[COL_MSG.ACKNOWLEDGED_AT].toString(),
      acknowledgedBy:r[COL_MSG.ACKNOWLEDGED_BY].toString()
    };
  });

  // Sort newest first
  messages.sort(function(a, b) {
    return b.sentAt.localeCompare(a.sentAt);
  });

  return { success: true, messages: messages };
}

// ============================================================
// sendHandoverMessage — EC sends message to RO
// Access: EC_OFFICER, RO_ADMIN (RO can reply)
// ============================================================
function sendHandoverMessage(token, subject, messageText) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN') {
    return { success: false, message: 'Access denied.' };
  }

  if (!subject || subject.trim() === '') {
    return { success: false, message: 'Subject is required.' };
  }
  if (!messageText || messageText.trim() === '') {
    return { success: false, message: 'Message text is required.' };
  }

  var sh = getSheet(SHEETS.MESSAGES);
  if (!sh) return { success: false, message: 'Messages sheet not found.' };

  // Determine recipient
  var toId = sess.role === 'EC_OFFICER' ? 'RO_ADMIN' : 'EC_OFFICER';

  var id = 'MSG-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var row = new Array(9).fill('');
  row[COL_MSG.ID]           = id;
  row[COL_MSG.ELEC_ID]      = '';   // not election-specific at this stage
  row[COL_MSG.FROM_ADMIN_ID]= sess.identity;
  row[COL_MSG.TO_ADMIN_ID]  = toId;
  row[COL_MSG.SUBJECT]      = subject.trim();
  row[COL_MSG.MESSAGE_TEXT] = messageText.trim();
  row[COL_MSG.SENT_AT]      = now().toISOString();
  row[COL_MSG.ACKNOWLEDGED_AT] = '';
  row[COL_MSG.ACKNOWLEDGED_BY] = '';

  sh.appendRow(row);

  appendAdminLog(sess.identity, 'message_sent',
    'Message sent to ' + toId + ': ' + subject.trim(), '', id);

  return { success: true, message: 'Message sent.' };
}

// ============================================================
// acknowledgeMessage — RO marks message as acknowledged
// Access: RO_ADMIN
// ============================================================
function acknowledgeMessage(token, messageId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  var sh = getSheet(SHEETS.MESSAGES);
  if (!sh) return { success: false, message: 'Messages sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_MSG.ID].toString() === messageId.toString()) {
      sh.getRange(i + 1, COL_MSG.ACKNOWLEDGED_AT + 1).setValue(now().toISOString());
      sh.getRange(i + 1, COL_MSG.ACKNOWLEDGED_BY + 1).setValue(sess.identity);
      appendAdminLog(sess.identity, 'message_acknowledged',
        'Message acknowledged: ' + rows[i][COL_MSG.SUBJECT].toString(), '', messageId);
      return { success: true };
    }
  }
  return { success: false, message: 'Message not found.' };
}

// ============================================================
// _toDateInputVal — converts a sheet date/string to YYYY-MM-DD
// for HTML date input value attribute
// ============================================================
function _toDateInputVal(val) {
  if (!val) return '';
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return '';
    var yyyy = d.getFullYear();
    var mm   = String(d.getMonth() + 1).padStart(2,'0');  // Apps Script: padStart args reversed
    var dd   = String(d.getDate()).padStart(2,'0');
    return yyyy + '-' + mm + '-' + dd;
  } catch(e) {
    return '';
  }
}

// ============================================================
// doGet — main entry point
// 16 routes per Step 5 Routing Design document.
// ============================================================

function doGet(e) {
  try {

    // Null guard — handles direct function invocations during testing
    if (!e || !e.parameter) {
      return serveLandingPage();
    }

    var action = (e.parameter.action || '').toString().trim();

    // R01 — No action parameter → Landing Page
    if (!action) {
      return serveLandingPage();
    }

    // R02 / R03 — SPA shell (voter + admin login entry point)
    if (action === 'app' || action === 'login') {
      return HtmlService.createTemplateFromFile('Index')
        .evaluate()
        .setTitle('SSKZM OBA Election Management System')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R04 — Vote receipt verification
    if (action === 'verifyToken') {
      return HtmlService.createHtmlOutput(
          buildVerifyTokenPage(e.parameter.voteId || ''))
        .setTitle('Vote Verification — SSKZM OBA')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R17a — Scrutineer acceptance display page
    if (action === 'scrutineerAccept') {
      return HtmlService.createHtmlOutput(
          buildScrutineerAcceptPage(e.parameter.id || '', e.parameter.t || ''))
        .setTitle('Scrutineer Appointment — SSKZM OBA')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R17b — Scrutineer acceptance processing route
    if (action === 'submitScrutineerAccept') {
      return HtmlService.createHtmlOutput(
          buildScrutineerAcceptResultPage(e.parameter.id || '', e.parameter.t || ''))
        .setTitle('Scrutineer Appointment — SSKZM OBA')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R15 — Tutorial page (checked before doGetNomAction delegation)
    if (action === 'tutorial') {
      return HtmlService.createHtmlOutput(buildTutorialPage())
        .setTitle('SSKZM OBA — How It Works')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R16 — Public results page
    if (action === 'results') {
      var elecId = e.parameter.electionId || '';
      return HtmlService.createHtmlOutput(buildResultsPage(elecId))
        .setTitle('Election Results — SSKZM OBA')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // R05–R14 — Nomination / query / consent actions
    var nomResult = doGetNomAction(e);
    if (nomResult) return nomResult;

    // R16 — Unknown action value
    return HtmlService.createHtmlOutput(
        buildErrorPage('PAGE_NOT_FOUND', 'Unknown action: ' + action))
      .setTitle('SSKZM OBA — Page Not Found')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    // Global exception handler — logs to AdminLog where possible
    try {
      appendAdminLog('SYSTEM', 'doget_error', err.toString(), '', '');
    } catch (logErr) {
      // Intentionally silent — do not mask the error response
    }
    return HtmlService.createHtmlOutput(
        buildErrorPage('SYSTEM_ERROR', err.toString()))
      .setTitle('SSKZM OBA — Error')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function serveLandingPage() {
  return HtmlService.createTemplateFromFile('LandingPage')
    .evaluate()
    .setTitle('SSKZM OBA Elections')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// doGetNomAction — handles R05–R14
// Returns HtmlOutput, or null if action not in this group.
// ============================================================

function doGetNomAction(e) {
  var action = (e.parameter.action || '').toString().trim();

  // ── R05 — Nomination confirmation form ──────────────────────
  if (action === 'confirmNom') {
    var nomId = e.parameter.nomId || '';
    var role  = (e.parameter.role  || '').toLowerCase();
    var token = e.parameter.token || '';
    return HtmlService.createHtmlOutput(buildConfirmRollForm(nomId, role, token))
      .setTitle('SSKZM OBA — Confirm Nomination')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R06 — Nomination confirmation processing ─────────────────
  if (action === 'submitConfirmNom') {
    var nomId = e.parameter.nomId || '';
    var role  = (e.parameter.role  || '').toLowerCase();
    var token = e.parameter.token || '';
    var roll  = (e.parameter.roll  || '').trim().toUpperCase();
    var res   = confirmNomination(nomId, role, token, roll);
    return HtmlService.createHtmlOutput(buildConfirmResultPage(res, role))
      .setTitle('SSKZM OBA — Nomination Confirmation')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R07 — Query response form ────────────────────────────────
  if (action === 'queryResponse') {
    var queryId = e.parameter.queryId || '';
    var token   = e.parameter.token   || '';
    return HtmlService.createHtmlOutput(buildQueryResponseForm(queryId, token))
      .setTitle('SSKZM OBA — Returning Officer Query')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R08 — Query response processing ─────────────────────────
  if (action === 'submitQueryResp') {
    var queryId  = e.parameter.queryId || '';
    var token    = e.parameter.token   || '';
    var respText = e.parameter.resp    || '';
    var res      = submitQueryResponse(queryId, token, respText);
    return HtmlService.createHtmlOutput(
      standaloneShell(
        'Query Response',
        res.success
          ? '<div class="success-box"><p style="font-size:2rem">✓</p>'
            + '<p>' + escHtml(res.message) + '</p>'
            + '<p class="close-note">You may close this window.</p></div>'
          : '<div class="error-box"><p>' + escHtml(res.message) + '</p>'
            + roContactFooter() + '</div>'
      ))
      .setTitle('SSKZM OBA — Query Response')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R09 — EC response form ───────────────────────────────────
  if (action === 'ecResponse') {
    var nomId = e.parameter.nomId || '';
    var token = e.parameter.token || '';
    return HtmlService.createHtmlOutput(buildECResponseForm(nomId, token))
      .setTitle('SSKZM OBA — EC Response')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R10 — EC response processing ─────────────────────────────
  if (action === 'submitECResp') {
    var nomId    = e.parameter.nomId || '';
    var token    = e.parameter.token || '';
    var respText = e.parameter.resp  || '';
    var res      = submitECResponse(nomId, token, respText);
    return HtmlService.createHtmlOutput(
      standaloneShell(
        'EC Response',
        res.success
          ? '<div class="success-box"><p style="font-size:2rem">✓</p>'
            + '<p>' + escHtml(res.message) + '</p>'
            + '<p class="close-note">You may close this window.</p></div>'
          : '<div class="error-box"><p>' + escHtml(res.message) + '</p>'
            + roContactFooter() + '</div>'
      ))
      .setTitle('SSKZM OBA — EC Response')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R11 — Consent accept confirmation page ───────────────────
  if (action === 'consentAccept') {
    var nomId = e.parameter.nomId || '';
    var token = e.parameter.token || '';
    return HtmlService.createHtmlOutput(buildConsentConfirmPage(nomId, token, 'accept'))
      .setTitle('SSKZM OBA — Nomination Consent')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R12 — Consent accept processing ─────────────────────────
  if (action === 'submitConsentAccept') {
    var nomId = e.parameter.nomId || '';
    var token = e.parameter.token || '';
    var res   = confirmCandidateConsent(nomId, token);
    return HtmlService.createHtmlOutput(buildConsentResultPage(res, 'accept'))
      .setTitle('SSKZM OBA — Nomination Consent')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R13 — Consent decline confirmation page ──────────────────
  if (action === 'consentDecline') {
    var nomId = e.parameter.nomId || '';
    var token = e.parameter.token || '';
    return HtmlService.createHtmlOutput(buildConsentConfirmPage(nomId, token, 'decline'))
      .setTitle('SSKZM OBA — Nomination Consent')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R14b — Nominee adds seconder after consent ───────────────
  if (action === 'submitNomineeSeconder') {
    var nomId      = e.parameter.nomId      || '';
    var token      = e.parameter.token      || '';
    var secRoll    = e.parameter.secRoll    || '';
    var res        = nomineeAddSeconder(nomId, token, secRoll);
    var body = res.success
      ? '<div class="success-box"><p style="font-size:2rem">✓</p>'
        + '<p>Seconder <strong>' + escHtml(res.secName || secRoll) + '</strong> has been added.</p>'
        + '<p>They will receive an email to confirm.</p>'
        + '<p class="close-note">You may now close this window.</p></div>'
      : '<div class="error-box"><p>' + escHtml(res.message || 'An error occurred.') + '</p>'
        + roContactFooter() + '</div>';
    return HtmlService.createHtmlOutput(standaloneShell('Seconder Submission', body))
      .setTitle('SSKZM OBA — Nomination')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── R14 — Consent decline processing ────────────────────────
  if (action === 'submitConsentDecline') {
    var nomId = e.parameter.nomId || '';
    var token = e.parameter.token || '';
    var res   = declineCandidateConsent(nomId, token);
    return HtmlService.createHtmlOutput(buildConsentResultPage(res, 'decline'))
      .setTitle('SSKZM OBA — Nomination Consent')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return null; // not handled here — caller routes to error page
}

// ============================================================
// STANDALONE PAGE SHARED HELPERS
// ============================================================

// Common HTML shell used by every standalone page.
function standaloneShell(pageTitle, bodyHtml) {
  return '<!DOCTYPE html><html lang="en"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + escHtml(pageTitle) + '</title>'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;font-size:15px;background:#f0f2f5;margin:0;padding:20px}'
    + '.card{max-width:560px;margin:40px auto;background:#fff;border-radius:6px;'
    +   'box-shadow:0 2px 10px rgba(0,0,0,.12);overflow:hidden}'
    + '.card-header{background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 28px}'
    + '.card-header h1{margin:0;font-size:1.05rem;font-weight:600;color:#fff;letter-spacing:.02em}'
    + '.card-header p{margin:3px 0 0;font-size:.78rem;color:rgba(255,255,255,.65)}'
    + '.card-body{padding:28px}'
    + '.success-box{text-align:center;padding:12px 0}'
    + '.success-box p{color:#1a3a5c;font-size:1rem;line-height:1.6;margin:6px 0}'
    + '.error-box p{color:#c0392b;line-height:1.6;margin:8px 0}'
    + '.close-note{color:#888 !important;font-size:.84rem !important}'
    + '.label{font-size:.78rem;color:#888;text-transform:uppercase;'
    +   'letter-spacing:.05em;margin-bottom:3px;margin-top:12px}'
    + '.value{font-size:1rem;color:#1a3a5c;font-weight:600}'
    + '.query-block{background:#f0f4f8;border-left:3px solid #1a3a5c;'
    +   'padding:12px 16px;border-radius:0 4px 4px 0;margin:14px 0;'
    +   'font-style:italic;color:#333;line-height:1.5}'
    + 'label{display:block;font-weight:600;margin-top:16px;margin-bottom:4px}'
    + 'input[type=text]{width:100%;box-sizing:border-box;padding:10px 12px;'
    +   'border:1px solid #ccc;border-radius:4px;font-size:1rem}'
    + 'textarea{width:100%;box-sizing:border-box;padding:10px 12px;'
    +   'border:1px solid #ccc;border-radius:4px;font-size:.95rem;'
    +   'min-height:120px;resize:vertical}'
    + '.btn{display:inline-block;padding:12px 32px;border:none;border-radius:4px;'
    +   'font-size:1rem;cursor:pointer;text-decoration:none;margin-top:16px;'
    +   'font-family:Arial,sans-serif}'
    + '.btn-primary{background:#1a3a5c;color:#fff}'
    + '.btn-danger{background:#c0392b;color:#fff}'
    + '.btn-primary:hover{background:#15304d}'
    + '.btn-danger:hover{background:#a93226}'
    + '.ro-contact{margin-top:20px;padding-top:14px;border-top:1px solid #eee;'
    +   'font-size:.82rem;color:#888}'
    + '@media(max-width:600px){.card{margin:16px auto}.card-body{padding:20px}}'
    + '</style></head><body>'
    + '<div class="card">'
    + '<div class="card-header">'
    + '<h1>SSKZM Old Boys Association</h1>'
    + '<p>Election Management System</p>'
    + '</div>'
    + '<div class="card-body">' + bodyHtml + '</div>'
    + '</div></body></html>';
}

// Escape HTML — prevents injection in dynamically-built standalone pages.
function escHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roContactFooter() {
  return '<p class="ro-contact">For assistance, contact the Returning Officer: '
    + '<a href="mailto:' + RO_CONTACT_EMAIL + '">' + RO_CONTACT_EMAIL + '</a></p>';
}

// ============================================================
// R04 — buildVerifyTokenPage
// ============================================================

function buildVerifyTokenPage(voteId) {
  if (!voteId) {
    return buildErrorPage('MISSING_PARAMS',
      'No verification token provided. Please use the complete link from your vote confirmation email.');
  }

  // Look up the vote
  var votes = sheetData(SHEETS.VOTES);
  var vote  = null;
  for (var i = 0; i < votes.length; i++) {
    if (votes[i][COL.VOTE_ID].toString() === voteId) { vote = votes[i]; break; }
  }

  if (!vote) {
    return standaloneShell('Vote Verification',
      '<div class="error-box">'
      + '<p><strong>No vote found for this token.</strong></p>'
      + '<p>Please check you have used the complete link from your vote confirmation email. '
      + 'If you believe this is an error, contact the Returning Officer.</p>'
      + roContactFooter()
      + '</div>'
    );
  }

  // Verify election has been declared before revealing anything
  var elecId    = vote[COL.VOTE_ELEC_ID].toString();
  var elections = sheetData(SHEETS.ELECTIONS);
  var elec      = null;
  for (var j = 0; j < elections.length; j++) {
    if (elections[j][COL.ELEC_ID].toString() === elecId) { elec = elections[j]; break; }
  }

  if (!elec || elec[COL.ELEC_STATUS].toString() !== 'declared') {
    return standaloneShell('Vote Verification',
      '<div class="error-box" style="color:#b8960c">'
      + '<p><strong>Results have not yet been declared.</strong></p>'
      + '<p>Vote verification is available after the Returning Officer formally declares the results. '
      + 'Please return after declaration.</p>'
      + '</div>'
    );
  }

  var postName  = escHtml(vote[COL.VOTE_POST].toString());
  var castAt    = escHtml(vote[COL.VOTE_CAST_AT].toString());
  var elecTitle = escHtml(elec[COL.ELEC_TITLE].toString());

  return standaloneShell('Vote Verification',
    '<div class="success-box">'
    + '<p style="font-size:2.5rem;margin-bottom:4px">✓</p>'
    + '<p style="font-size:1.1rem;font-weight:600">Vote Verified</p>'
    + '</div>'
    + '<div class="label">Election</div>'
    + '<div class="value">' + elecTitle + '</div>'
    + '<div class="label">Post</div>'
    + '<div class="value">' + postName + '</div>'
    + '<div class="label">Recorded at</div>'
    + '<div class="value" style="font-weight:normal;font-size:.9rem">' + castAt + '</div>'
    + '<p style="font-size:.84rem;color:#888;margin-top:18px;line-height:1.5">'
    + 'This confirms that a vote was recorded for the above post from this token. '
    + 'The candidate you voted for is not shown — your ballot is secret.</p>'
    + roContactFooter()
  );
}

// ============================================================
// R05 — buildConfirmRollForm (display only — no confirmation yet)
// ============================================================

function buildConfirmRollForm(nomId, role, token) {
  if (!nomId || !token || (role !== 'proposer' && role !== 'seconder')) {
    return buildErrorPage('MISSING_PARAMS',
      'This confirmation link is incomplete. Please use the full link from your email.');
  }

  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < nomRows.length; i++) {
    if (nomRows[i][COL.NOM_ID].toString() === nomId) { nom = nomRows[i]; break; }
  }

  if (!nom) {
    return buildErrorPage('INVALID_TOKEN',
      'This confirmation link is invalid. The nomination could not be found. Please contact the Returning Officer.');
  }

  var storedToken = role === 'proposer'
    ? nom[COL.NOM_PROP_TOKEN].toString()
    : nom[COL.NOM_SEC_TOKEN].toString();

  if (!storedToken || storedToken !== token) {
    return buildErrorPage('INVALID_TOKEN',
      'This confirmation link is invalid or has expired. Please contact the Returning Officer.');
  }

  // Already confirmed — show result directly without a form
  var alreadyDone = role === 'proposer'
    ? nom[COL.NOM_PROP_CONFIRMED].toString() === 'true'
    : nom[COL.NOM_SEC_CONFIRMED].toString() === 'true';

  if (alreadyDone) {
    return standaloneShell('Already Confirmed',
      '<div class="success-box">'
      + '<p style="font-size:2rem">✓</p>'
      + '<p>You have already confirmed this nomination. No further action is needed.</p>'
      + '<p class="close-note">You may close this window.</p>'
      + '</div>'
    );
  }

  var candName  = escHtml(nom[COL.NOM_CAND_NAME].toString());
  var postName  = escHtml(nom[COL.NOM_POST].toString());
  var roleLabel = role === 'proposer' ? 'Proposer' : 'Seconder';

  return standaloneShell('Confirm Nomination — ' + roleLabel,
    '<p>You have been identified as the <strong>' + roleLabel + '</strong> '
    + 'for the following nomination:</p>'
    + '<div class="label">Candidate</div>'
    + '<div class="value">' + candName + '</div>'
    + '<div class="label">Post</div>'
    + '<div class="value">' + postName + '</div>'
    + '<p style="margin-top:16px">To confirm your role, please enter your Roll Number below.</p>'
    + '<form method="GET" action="' + DEPLOY_URL + '">'
    + '<input type="hidden" name="action" value="submitConfirmNom">'
    + '<input type="hidden" name="nomId"  value="' + escHtml(nomId) + '">'
    + '<input type="hidden" name="role"   value="' + escHtml(role)  + '">'
    + '<input type="hidden" name="token"  value="' + escHtml(token) + '">'
    + '<label>Your Roll Number</label>'
    + '<input type="text" name="roll" placeholder="e.g. SSK1234" autocomplete="off" required>'
    + '<br><button type="submit" class="btn btn-primary">Confirm Nomination</button>'
    + '</form>'
    + roContactFooter()
  );
}

// ============================================================
// R06 — buildConfirmResultPage
// ============================================================

function buildConfirmResultPage(res, role) {
  var roleLabel = role === 'proposer' ? 'proposer' : 'seconder';
  if (res.success) {
    var msg = res.alreadyDone
      ? 'You have already confirmed this nomination. No further action is needed.'
      : 'Your ' + roleLabel + ' confirmation has been recorded. Thank you.';
    return standaloneShell('Nomination Confirmed',
      '<div class="success-box">'
      + '<p style="font-size:2rem">✓</p>'
      + '<p>' + escHtml(msg) + '</p>'
      + '<p class="close-note">You may close this window.</p>'
      + '</div>'
    );
  }
  return standaloneShell('Confirmation Failed',
    '<div class="error-box">'
    + '<p>' + escHtml(res.message || 'An error occurred.') + '</p>'
    + roContactFooter()
    + '</div>'
  );
}

// ============================================================
// R07 — buildQueryResponseForm
// ============================================================

function buildQueryResponseForm(queryId, token) {
  if (!queryId || !token) {
    return buildErrorPage('MISSING_PARAMS',
      'This response link is incomplete. Please use the full link from your email.');
  }

  var queries = sheetData(SHEETS.NOM_QUERIES);
  var qry = null;
  for (var i = 0; i < queries.length; i++) {
    if (queries[i][COL.QRY_ID].toString() === queryId) { qry = queries[i]; break; }
  }

  if (!qry || qry[COL.QRY_TOKEN].toString() !== token) {
    return buildErrorPage('INVALID_TOKEN',
      'This response link is invalid or has expired. Please contact the Returning Officer.');
  }

  if (qry[COL.QRY_STATUS].toString() === 'responded') {
    return standaloneShell('Already Responded',
      '<div class="success-box">'
      + '<p>You have already submitted a response to this query. No further action is needed.</p>'
      + '<p class="close-note">You may close this window.</p>'
      + '</div>'
    );
  }

  var deadline = parseDate(qry[COL.QRY_DEADLINE]);
  if (deadline && now() > deadline) {
    var qryElecId2 = qry[COL.QRY_ELEC_ID].toString();
    var elecRows2  = sheetData(SHEETS.ELECTIONS);
    var elecStatus2 = '';
    for (var ei2 = 0; ei2 < elecRows2.length; ei2++) {
      if (elecRows2[ei2][COL.ELEC_ID].toString() === qryElecId2) {
        elecStatus2 = elecRows2[ei2][COL.ELEC_STATUS].toString();
        break;
      }
    }
    if (elecStatus2 !== 'nominations_open' && elecStatus2 !== 'nominations_open_phase2') {
      return buildErrorPage('EXPIRED_TOKEN',
        'The response deadline for this query has passed. Please contact the Returning Officer directly.');
    }
  }

  var postName  = escHtml(qry[COL.QRY_POST].toString());
  var queryText = escHtml(qry[COL.QRY_TEXT].toString());

  return standaloneShell('Returning Officer Query',
    '<p>The Returning Officer has sent you a query regarding your nomination for '
    + '<strong>' + postName + '</strong>:</p>'
    + '<div class="query-block">' + queryText + '</div>'
    + '<form method="GET" action="' + DEPLOY_URL + '">'
    + '<input type="hidden" name="action"  value="submitQueryResp">'
    + '<input type="hidden" name="queryId" value="' + escHtml(queryId) + '">'
    + '<input type="hidden" name="token"   value="' + escHtml(token)   + '">'
    + '<label>Your Response</label>'
    + '<textarea name="resp" placeholder="Enter your response here..." required minlength="5"></textarea>'
    + '<br><button type="submit" class="btn btn-primary">Submit Response</button>'
    + '</form>'
    + roContactFooter()
  );
}

// ============================================================
// R09 — buildECResponseForm
// Finds EC referral by nomId + token match in NomQueries.
// ============================================================

function buildECResponseForm(nomId, token) {
  if (!nomId || !token) {
    return buildErrorPage('MISSING_PARAMS',
      'This response link is incomplete. Please use the full link from your email.');
  }

  // Find the row by nomId + token (EC referrals are stored in NomQueries)
  var queries = sheetData(SHEETS.NOM_QUERIES);
  var qry = null;
  for (var i = 0; i < queries.length; i++) {
    if (queries[i][COL.QRY_NOM_ID].toString() === nomId
        && queries[i][COL.QRY_TOKEN].toString() === token) {
      qry = queries[i];
      break;
    }
  }

  if (!qry) {
    return buildErrorPage('INVALID_TOKEN',
      'This response link is invalid or has expired. Please contact the Returning Officer.');
  }

  if (qry[COL.QRY_STATUS].toString() === 'responded') {
    return standaloneShell('Already Responded',
      '<div class="success-box">'
      + '<p>A response to this referral has already been submitted. No further action is needed.</p>'
      + '<p class="close-note">You may close this window.</p>'
      + '</div>'
    );
  }

  // Get nomination details for context
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var j = 0; j < nomRows.length; j++) {
    if (nomRows[j][COL.NOM_ID].toString() === nomId) { nom = nomRows[j]; break; }
  }

  var candName  = nom ? escHtml(nom[COL.NOM_CAND_NAME].toString()) : '(unknown)';
  var postName  = escHtml(qry[COL.QRY_POST].toString());
  var queryText = escHtml(qry[COL.QRY_TEXT].toString());

  return standaloneShell('EC Referral Response',
    '<p>The Returning Officer has referred the following matter to the Executive Committee '
    + 'regarding the nomination of <strong>' + candName + '</strong> '
    + 'for <strong>' + postName + '</strong>:</p>'
    + '<div class="query-block">' + queryText + '</div>'
    + '<form method="GET" action="' + DEPLOY_URL + '">'
    + '<input type="hidden" name="action" value="submitECResp">'
    + '<input type="hidden" name="nomId"  value="' + escHtml(nomId) + '">'
    + '<input type="hidden" name="token"  value="' + escHtml(token) + '">'
    + '<label>EC Response</label>'
    + '<textarea name="resp" placeholder="Enter the Executive Committee\'s response here..." '
    +   'required minlength="5"></textarea>'
    + '<br><button type="submit" class="btn btn-primary">Submit Response</button>'
    + '</form>'
    + roContactFooter()
  );
}

// ============================================================
// R11 / R13 — buildConsentConfirmPage
// Two-step pattern: this page DISPLAYS only.
// Processing happens in confirmCandidateConsent / declineCandidateConsent
// after the user clicks the button (R12 / R14).
// This protects against email pre-fetchers auto-triggering consent.
// ============================================================

function buildConsentConfirmPage(nomId, token, action) {
  if (!nomId || !token) {
    return buildErrorPage('MISSING_PARAMS',
      'This consent link is incomplete. Please use the full link from your email.');
  }

  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < nomRows.length; i++) {
    if (nomRows[i][COL.NOM_ID].toString() === nomId) { nom = nomRows[i]; break; }
  }

  if (!nom || nom[COL.NOM_CONSENT_TOKEN].toString() !== token) {
    return buildErrorPage('INVALID_TOKEN',
      'This consent link is invalid. Please contact the Returning Officer.');
  }

  // Already responded — show result directly
  var consentStatus = nom[COL.NOM_CONSENT_STATUS].toString();
  if (consentStatus === 'accepted') {
    return standaloneShell('Nomination Accepted',
      '<div class="success-box"><p>You have already accepted this nomination.</p>'
      + '<p class="close-note">You may close this window.</p></div>'
    );
  }
  if (consentStatus === 'declined') {
    return standaloneShell('Nomination Declined',
      '<div class="success-box"><p>You have already declined this nomination. It has lapsed.</p>'
      + '<p class="close-note">You may close this window.</p></div>'
    );
  }

  // Nomination no longer active
  var nomStatus = nom[COL.NOM_STATUS].toString();
  if (nomStatus === 'withdrawn' || nomStatus === 'consent_declined'
      || nomStatus === 'deadline_lapsed') {
    return buildErrorPage('NOMINATION_INACTIVE',
      'This nomination is no longer active. Please contact the Returning Officer.');
  }

  var candName = escHtml(nom[COL.NOM_CAND_NAME].toString());
  var postName = escHtml(nom[COL.NOM_POST].toString());

  // Look up nominator name from Voters sheet
  var nominatorRoll = nom[COL.NOM_NOMINATOR_ROLL].toString();
  var nominatorName = escHtml(nominatorRoll); // fallback to roll no
  var voters = sheetData(SHEETS.VOTERS);
  for (var j = 0; j < voters.length; j++) {
    if (voters[j][COL.VOTER_ROLL].toString() === nominatorRoll) {
      nominatorName = escHtml(
        (voters[j][COL.VOTER_NAME].toString() + ' '
          + voters[j][COL.VOTER_SURNAME].toString()).trim()
      );
      break;
    }
  }

  var isAccept    = action === 'accept';
  var submitAction = isAccept ? 'submitConsentAccept' : 'submitConsentDecline';
  var btnClass    = isAccept ? 'btn-primary' : 'btn-danger';
  var btnLabel    = isAccept ? 'Accept Nomination' : 'Decline Nomination';
  var pageTitle   = isAccept ? 'Accept Nomination?' : 'Decline Nomination?';
  var instruction = isAccept
    ? 'Click <strong>Accept Nomination</strong> to confirm your consent. '
      + 'The nominator will then be asked to confirm their proposal.'
    : 'Click <strong>Decline Nomination</strong> to decline. '
      + 'The nomination will lapse and the nominator will be notified.';

  return standaloneShell(pageTitle,
    '<p><strong>' + nominatorName + '</strong> has nominated you for:</p>'
    + '<div class="label">Post</div>'
    + '<div class="value">' + postName + '</div>'
    + '<p style="margin-top:16px">' + instruction + '</p>'
    + '<a href="' + DEPLOY_URL
    +   '?action=' + submitAction
    +   '&nomId='  + encodeURIComponent(nomId)
    +   '&token='  + encodeURIComponent(token)
    + '" class="btn ' + btnClass + '">' + btnLabel + '</a>'
    + (isAccept
      ? '<p style="margin-top:20px;font-size:.84rem;color:#888">'
        + 'If you did not expect this or do not wish to stand, use the Decline link from your email.</p>'
      : '')
    + roContactFooter()
  );
}

// ============================================================
// R12 / R14 — buildConsentResultPage
// ============================================================

function buildConsentResultPage(res, action) {
  var isAccept = action === 'accept';
  if (res.success) {
    var heading = isAccept ? 'Nomination Accepted' : 'Nomination Declined';
    // On acceptance, show seconder form if no seconder set yet
    var secForm = '';
    if (isAccept && !res.hasSec && res.nomId && res.token) {
      var submitUrl = DEPLOY_URL + '?action=submitNomineeSeconder';
      secForm =
        '<div style="margin-top:24px;background:#f0f4f8;border-radius:8px;padding:16px;">'
        + '<p style="font-weight:700;color:#1a3a5c;margin-bottom:6px;">Add a Seconder</p>'
        + '<p style="font-size:.88rem;color:#555;margin-bottom:14px;">'
        +   'Please enter the roll number of a member from your batch who will second your nomination. '
        +   'They will receive an email to confirm.'
        + '</p>'
        + '<form method="GET" action="' + submitUrl + '">'
        +   '<input type="hidden" name="nomId" value="' + escHtml(res.nomId) + '" />'
        +   '<input type="hidden" name="token" value="' + escHtml(res.token) + '" />'
        +   '<input type="text" name="secRoll" placeholder="Seconder Roll Number" '
        +     'style="width:100%;box-sizing:border-box;padding:12px;font-size:1rem;'
        +     'border:1px solid #c8d4e0;border-radius:6px;margin-bottom:12px;" required />'
        +   '<button type="submit" '
        +     'style="width:100%;padding:13px;background:#1a3a5c;color:#fff;'
        +     'border:none;border-radius:6px;font-size:1rem;font-weight:600;cursor:pointer;">'
        +     'Submit Seconder'
        +   '</button>'
        + '</form>'
        + '</div>';
    }
    return standaloneShell(heading,
      '<div class="success-box">'
      + '<p style="font-size:2rem">' + (isAccept ? '✓' : '✗') + '</p>'
      + '<p>' + escHtml(res.message) + '</p>'
      + secForm
      + (secForm ? '' : '<p class="close-note">You may close this window.</p>')
      + '</div>'
    );
  }
  return standaloneShell('Action Failed',
    '<div class="error-box">'
    + '<p>' + escHtml(res.message || 'An error occurred.') + '</p>'
    + roContactFooter()
    + '</div>'
  );
}

// ============================================================
// R17a — buildScrutineerAcceptPage
// Display-only confirmation page — defeats email pre-fetchers.
// Served at ?action=scrutineerAccept&id=xxx&t=xxx
// ============================================================
function buildScrutineerAcceptPage(adminId, acceptToken) {
  if (!adminId || !acceptToken) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid. Please contact the Returning Officer.');
  }
  var rows = sheetData(SHEETS.ADMINS);
  var adminRow = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      adminRow = rows[i];
      break;
    }
  }
  if (!adminRow) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid. Please contact the Returning Officer.');
  }
  var storedToken = adminRow[COL.ADMIN_ACTIVATED_BY].toString();
  var status = adminRow[COL.ADMIN_STATUS].toString().toUpperCase();

  if (status === 'ACTIVE') {
    return standaloneShell('Scrutineer Appointment — SSKZM OBA',
      '<div style="max-width:480px;margin:40px auto;padding:24px;font-family:sans-serif;text-align:center;">' +
      '<div style="font-size:2rem;margin-bottom:12px;">✅</div>' +
      '<h2 style="color:#1a3353;margin-bottom:8px;">Already Accepted</h2>' +
      '<p style="color:#555;">You have already accepted your appointment as Scrutineer for the SSKZM OBA election.</p>' +
      '<p style="color:#555;">No further action is needed. You may log in using your Scrutineer credentials.</p>' +
      '</div>');
  }

  if (storedToken !== acceptToken) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid or has expired. Please contact the Returning Officer.');
  }

  var name = adminRow[COL.ADMIN_NAME].toString();
  var submitUrl = DEPLOY_URL + '?action=submitScrutineerAccept&id=' +
    encodeURIComponent(adminId) + '&t=' + encodeURIComponent(acceptToken);

  var body =
    '<div style="max-width:480px;margin:40px auto;padding:24px;font-family:sans-serif;">' +
    '<h2 style="color:#1a3353;margin-bottom:4px;">Scrutineer Appointment</h2>' +
    '<p style="color:#555;margin-bottom:20px;">SSKZM Old Boys Association — Election</p>' +
    '<p style="color:#333;">Dear <strong>' + escHtml(name) + '</strong>,</p>' +
    '<p style="color:#333;">The Executive Committee has appointed you as a <strong>Scrutineer</strong> ' +
    'for this election. Scrutineers independently verify the election process and co-sign the final tally.</p>' +
    '<div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin:20px 0;">' +
    '<p style="margin:0;font-size:.9rem;color:#854d0e;font-weight:600;">Declaration of Impartiality</p>' +
    '<p style="margin:8px 0 0;font-size:.9rem;color:#78350f;">By accepting this appointment, you declare that you ' +
    'will perform your duties impartially, that you have no conflict of interest with any candidate, ' +
    'and that you will maintain the confidentiality of the process as required under the SSKZM OBA Elections SOP.</p>' +
    '</div>' +
    '<a href="' + submitUrl + '" style="display:block;background:#1a3353;color:#fff;text-align:center;' +
    'padding:14px;border-radius:8px;text-decoration:none;font-size:1rem;font-weight:600;margin-top:8px;">' +
    'I Accept this Appointment ✓</a>' +
    '<p style="font-size:.8rem;color:#999;margin-top:16px;text-align:center;">' +
    'If you did not expect this message, please contact the Returning Officer immediately. Do not click Accept.</p>' +
    '</div>';

  return standaloneShell('Scrutineer Appointment — SSKZM OBA', body);
}

// ============================================================
// R17b — buildScrutineerAcceptResultPage
// Processing route — activates account, logs, emails RO.
// Served at ?action=submitScrutineerAccept&id=xxx&t=xxx
// ============================================================
function buildScrutineerAcceptResultPage(adminId, acceptToken) {
  if (!adminId || !acceptToken) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid. Please contact the Returning Officer.');
  }
  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return buildErrorPage('SYSTEM_ERROR', 'System error. Please contact the Returning Officer.');

  var rows = sheetData(SHEETS.ADMINS);
  var rowIndex = -1;
  var adminRow = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      rowIndex = i;
      adminRow = rows[i];
      break;
    }
  }
  if (rowIndex === -1) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid. Please contact the Returning Officer.');
  }

  var status = adminRow[COL.ADMIN_STATUS].toString().toUpperCase();
  if (status === 'ACTIVE') {
    return standaloneShell('Scrutineer Appointment — SSKZM OBA',
      '<div style="max-width:480px;margin:40px auto;padding:24px;font-family:sans-serif;text-align:center;">' +
      '<div style="font-size:2rem;margin-bottom:12px;">✅</div>' +
      '<h2 style="color:#1a3353;">Already Accepted</h2>' +
      '<p style="color:#555;">Your appointment has already been recorded. No further action needed.</p>' +
      '</div>');
  }

  var storedToken = adminRow[COL.ADMIN_ACTIVATED_BY].toString();
  if (storedToken !== acceptToken) {
    return buildErrorPage('INVALID_LINK', 'This acceptance link is invalid or has expired. Please contact the Returning Officer.');
  }

  // Activate account
  var sheetRow = rowIndex + 2;
  sh.getRange(sheetRow, COL.ADMIN_STATUS + 1).setValue('ACTIVE');
  sh.getRange(sheetRow, COL.ADMIN_ACTIVATED_AT + 1).setValue(now().toISOString());
  sh.getRange(sheetRow, COL.ADMIN_ACTIVATED_BY + 1).setValue('SELF_ACCEPTED');

  var name = adminRow[COL.ADMIN_NAME].toString();
  appendAdminLog('SYSTEM', 'scrutineer_accepted',
    'Scrutineer accepted appointment: ' + adminId + ' (' + name + ')', '', adminId);

  // Notify RO
  var roRows = sheetData(SHEETS.ADMINS);
  for (var j = 0; j < roRows.length; j++) {
    if (roRows[j][COL.ADMIN_ROLE].toString() === 'RO_ADMIN' &&
        roRows[j][COL.ADMIN_STATUS].toString().toUpperCase() === 'ACTIVE') {
      var roEmail = roRows[j][COL.ADMIN_EMAIL].toString();
      var roName  = roRows[j][COL.ADMIN_NAME].toString();
      sendEmailViaSendGrid(roEmail,
        'Scrutineer Acceptance Confirmed — ' + name,
        'Dear ' + roName + ',\n\n' +
        name + ' has accepted their appointment as Scrutineer and signed the Declaration of Impartiality.\n\n' +
        'Their Scrutineer account is now active.\n\n' +
        'SSKZM OBA Election Management System');
      break;
    }
  }

  return standaloneShell('Scrutineer Appointment — SSKZM OBA',
    '<div style="max-width:480px;margin:40px auto;padding:24px;font-family:sans-serif;text-align:center;">' +
    '<div style="font-size:2.5rem;margin-bottom:12px;">✅</div>' +
    '<h2 style="color:#1a3353;margin-bottom:8px;">Appointment Accepted</h2>' +
    '<p style="color:#333;">Thank you, <strong>' + escHtml(name) + '</strong>.</p>' +
    '<p style="color:#555;">Your acceptance has been recorded as your Declaration of Impartiality. ' +
    'The Returning Officer has been notified.</p>' +
    '<p style="color:#555;">You will receive your login credentials from the Returning Officer shortly.</p>' +
    '</div>');
}

// ============================================================
// R15 — buildTutorialPage
// Full interactive tutorial — content in TutorialPage.html
// ============================================================
function buildTutorialPage() {
  var body = HtmlService.createHtmlOutputFromFile('TutorialPage').getContent();
  return standaloneShell('How It Works — SSKZM OBA Elections', body);
}

// ============================================================
// R17 — buildResultsPage
// Public declared results page. No authentication required.
// Served at ?action=results (optional ?electionId=xxx)
// ============================================================
function buildResultsPage(electionId) {
  var res = getPublicResults(electionId || '');

  if (!res.success) {
    var body =
      '<div style="text-align:center;padding:32px 0;">' +
        '<div style="font-size:2.5rem;margin-bottom:12px;">[VOTE]</div>' +
        '<div style="font-size:1rem;font-weight:700;color:#1a3a5c;margin-bottom:8px;">Results Not Yet Available</div>' +
        '<div style="font-size:.88rem;color:#6b7280;line-height:1.6;">' + escHtml(res.message) + '</div>' +
        '<div style="margin-top:24px;">' +
          '<a href="' + DEPLOY_URL + '" target="_top" style="font-size:.85rem;color:#1a3a5c;">← Back to Election Home</a>' +
        '</div>' +
      '</div>';
    return standaloneShell('Election Results — SSKZM OBA', body);
  }

  // ── Results HTML ──────────────────────────────────────────
  var html =
    '<div style="text-align:center;padding:16px 0 20px;">' +
      '<div style="font-size:2.5rem;margin-bottom:8px;">[WIN]</div>' +
      '<div style="font-size:1.1rem;font-weight:700;color:#1a3a5c;">' + escHtml(res.electionTitle) + '</div>' +
      '<div style="font-size:.82rem;color:#059669;font-weight:600;margin-top:4px;">Results Declared</div>' +
    '</div>';

  var posts = res.posts || [];
  if (posts.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:#6b7280;font-size:.9rem;">No results data available.</div>';
  } else {
    for (var i = 0; i < posts.length; i++) {
      var post      = posts[i];
      var seats     = post.seatCount || 1;
      var seatLabel = seats > 1 ? ' (' + seats + ' seats)' : '';

      html +=
        '<div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;' +
        'padding:14px 16px;margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;' +
          'margin-bottom:10px;gap:8px;">' +
            '<div style="font-size:.95rem;font-weight:700;color:#1a3a5c;">' +
              escHtml(post.post) + escHtml(seatLabel) +
            '</div>' +
            (post.turnout
              ? '<div style="font-size:.75rem;color:#6b7280;white-space:nowrap;">' + post.turnout + ' voted</div>'
              : '') +
          '</div>';

      var cands = post.candidates || [];
      if (cands.length === 0) {
        html +=
          '<div style="padding:9px 0;font-size:.85rem;color:#9ca3af;font-style:italic;">' +
          'No candidate contested this post — declared vacant. The post shall be filled by ' +
          'co-option of the incoming Executive Committee in accordance with the Bylaws.' +
          '</div>';
      }
      for (var j = 0; j < cands.length; j++) {
        var cand      = cands[j];
        var isElected = cand.elected;
        html +=
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;' +
          (j < cands.length - 1 ? 'border-bottom:1px solid #f3f4f6;' : '') + '">' +
            '<div style="width:26px;text-align:center;font-size:1rem;flex-shrink:0;">' +
              (isElected ? '✅' : '<span style="color:#d1d5db;">○</span>') +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:.9rem;font-weight:' + (isElected ? '700' : '400') + ';' +
              'color:' + (isElected ? '#065f46' : '#374151') + ';">' +
                escHtml(cand.name) +
                (isElected
                  ? ' <span style="font-size:.72rem;background:#d1fae5;color:#065f46;' +
                    'padding:2px 7px;border-radius:8px;font-weight:600;margin-left:4px;">Elected</span>'
                  : '') +
              '</div>' +
              '<div style="font-size:.75rem;color:#6b7280;">Batch ' + escHtml(cand.batch.toString()) + '</div>' +
            '</div>' +
            '<div style="font-size:.88rem;font-weight:' + (isElected ? '700' : '400') + ';' +
            'color:' + (isElected ? '#065f46' : '#6b7280') + ';flex-shrink:0;min-width:40px;text-align:right;">' +
              cand.votes + ' vote' + (cand.votes !== 1 ? 's' : '') +
            '</div>' +
          '</div>';
      }

      if (post.nota > 0) {
        html +=
          '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;' +
          'border-top:1px solid #f3f4f6;margin-top:2px;">' +
            '<div style="width:26px;text-align:center;flex-shrink:0;color:#9ca3af;">—</div>' +
            '<div style="flex:1;font-size:.82rem;color:#9ca3af;">NOTA</div>' +
            '<div style="font-size:.82rem;color:#9ca3af;flex-shrink:0;min-width:40px;text-align:right;">' +
              post.nota + ' vote' + (post.nota !== 1 ? 's' : '') +
            '</div>' +
          '</div>';
      }

      html += '</div>';
    }
  }

  // ── Token verification block ──────────────────────────────
  var verifyBase = DEPLOY_URL + '?action=verifyToken&voteId=';
  html +=
    '<div style="background:#f0f4f8;border:1px solid #c8d4e0;border-radius:8px;' +
    'padding:16px;margin-top:8px;margin-bottom:16px;">' +
      '<div style="font-size:.88rem;font-weight:700;color:#1a3a5c;margin-bottom:6px;">[SEARCH] Verify Your Vote</div>' +
      '<div style="font-size:.82rem;color:#555;margin-bottom:10px;line-height:1.5;">' +
        'Enter your vote receipt token to confirm your vote was counted.' +
      '</div>' +
      '<form method="GET" action="' + DEPLOY_URL + '" target="_blank"' +
      ' style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<input type="hidden" name="action" value="verifyToken" />' +
        '<input name="voteId" type="text" placeholder="Paste receipt token here"' +
        ' style="flex:1;min-width:0;padding:10px 12px;border:1px solid #ccc;border-radius:4px;' +
        'font-size:.88rem;box-sizing:border-box;" />' +
        '<button type="submit"' +
        ' style="padding:10px 18px;background:#1a3a5c;color:#fff;border:none;border-radius:4px;' +
        'font-size:.88rem;font-weight:600;cursor:pointer;white-space:nowrap;min-height:44px;">Verify</button>' +
      '</form>' +
    '</div>' +

    '<div style="text-align:center;padding:8px 0 4px;font-size:.75rem;color:#9ca3af;line-height:1.5;">' +
      'Vote counts are published as part of the election record per the SSKZM OBA Elections SOP.' +
    '</div>' +
    '<div style="text-align:center;margin-top:16px;margin-bottom:8px;">' +
      '<a href="' + DEPLOY_URL + '" target="_top" style="font-size:.83rem;color:#1a3a5c;">← Back to Election Home</a>' +
    '</div>';

  return standaloneShell('Election Results — SSKZM OBA', html);
}

// ============================================================
// R16 / Global — buildErrorPage
// ============================================================

function buildErrorPage(code, detail) {
  var messages = {
    MISSING_PARAMS:       'This link is incomplete. Please use the full link from your email.',
    INVALID_TOKEN:        'This link is invalid or has already been used.',
    EXPIRED_TOKEN:        'This link has expired.',
    ALREADY_RESPONDED:    'You have already responded. No further action is needed.',
    NOMINATION_INACTIVE:  'This nomination is no longer active.',
    VOTE_NOT_FOUND:       'No vote was found for this token.',
    RESULTS_NOT_DECLARED: 'Results have not yet been declared.',
    PAGE_NOT_FOUND:       'Page not found. If you arrived here from an email link, please check the link is complete and try again.',
    SYSTEM_ERROR:         'A system error occurred. Please try again or contact the Returning Officer.'
  };
  var userMsg = messages[code] || messages['SYSTEM_ERROR'];
  // Embed detail as an HTML comment — visible in source for debugging, never shown in page
  var debugComment = detail
    ? '\n<!-- DEBUG [' + code + ']: ' + (detail + '').replace(/-->/g, '- ->') + ' -->\n'
    : '';
  return standaloneShell('Page Not Found',
    debugComment
    + '<div class="error-box">'
    + '<p><strong>Something went wrong.</strong></p>'
    + '<p>' + escHtml(userMsg) + '</p>'
    + roContactFooter()
    + '</div>'
  );
}

// ============================================================
// BACKEND FUNCTIONS — called from doGetNomAction
// These are Carry Forward (CF) or Modified (MOD) from System A.
// They are placed here because they are called directly from doGet
// routes, not from google.script.run.
// ============================================================

// confirmNomination — MOD: unchanged logic; updated COL indices for System B
function confirmNomination(nomId, role, token, rollNo) {
  if (!nomId || !token || !rollNo
      || (role !== 'proposer' && role !== 'seconder')) {
    return { success: false, message: 'Invalid request. Please use the link from your email.' };
  }

  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() !== nomId) continue;

    var storedToken = role === 'proposer'
      ? data[i][COL.NOM_PROP_TOKEN].toString()
      : data[i][COL.NOM_SEC_TOKEN].toString();

    if (!storedToken || storedToken !== token) {
      return { success: false,
        message: 'This confirmation link is invalid or has expired. Please contact the Returning Officer.' };
    }

    var expectedRoll = (role === 'proposer'
      ? data[i][COL.NOM_PROP_ROLL]
      : data[i][COL.NOM_SEC_ROLL]).toString().toUpperCase();

    if (rollNo.toUpperCase() !== expectedRoll) {
      return { success: false,
        message: 'The Roll Number you entered does not match our records for this nomination. '
          + 'Please check and try again.' };
    }

    var alreadyDone = role === 'proposer'
      ? data[i][COL.NOM_PROP_CONFIRMED].toString() === 'true'
      : data[i][COL.NOM_SEC_CONFIRMED].toString() === 'true';

    if (alreadyDone) {
      return { success: true, alreadyDone: true,
        message: 'You have already confirmed this nomination.' };
    }

    // Deadline check — bypassed if election is still nominations_open (RO extension)
    var deadline = parseDate(data[i][COL.NOM_DEADLINE]);
    if (deadline && now() > deadline) {
      var nomElecId = data[i][COL.NOM_ELEC_ID].toString();
      var elecRows  = sheetData(SHEETS.ELECTIONS);
      var elecStatus = '';
      for (var ei = 0; ei < elecRows.length; ei++) {
        if (elecRows[ei][COL.ELEC_ID].toString() === nomElecId) {
          elecStatus = elecRows[ei][COL.ELEC_STATUS].toString();
          break;
        }
      }
      if (elecStatus !== 'nominations_open' && elecStatus !== 'nominations_open_phase2') {
        var st = data[i][COL.NOM_STATUS].toString();
        if (st === 'pending_confirmation') {
          sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue('deadline_lapsed');
        }
        return { success: false,
          message: 'The nomination deadline has passed. This confirmation link is no longer valid.' };
      }
    }

    var ts = now().toISOString();
    if (role === 'proposer') {
      sh.getRange(i + 1, COL.NOM_PROP_CONFIRMED    + 1).setValue('true');
      sh.getRange(i + 1, COL.NOM_PROP_CONFIRMED_AT + 1).setValue(ts);
    } else {
      sh.getRange(i + 1, COL.NOM_SEC_CONFIRMED    + 1).setValue('true');
      sh.getRange(i + 1, COL.NOM_SEC_CONFIRMED_AT + 1).setValue(ts);
    }

    // Re-read to check if both sides now confirmed
    var freshData = sh.getDataRange().getValues();
    var propDone  = freshData[i][COL.NOM_PROP_CONFIRMED].toString() === 'true';
    var secDone   = freshData[i][COL.NOM_SEC_CONFIRMED].toString()  === 'true';

    var consentOk = freshData[i][COL.NOM_PHASE2_FLAG].toString() !== 'true' ||
                    freshData[i][COL.NOM_CONSENT_STATUS].toString() === 'accepted';
    var newStatus = (propDone && secDone && consentOk) ? 'pending_scrutiny' : 'pending_confirmation';
    if (propDone && secDone && consentOk) {
      sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue('pending_scrutiny');
    }

    appendAdminLog(
      rollNo,
      'nomination_' + role + '_confirmed',
      role + ' confirmed nomination ' + nomId
        + ' for post: ' + data[i][COL.NOM_POST].toString(),
      'pending_confirmation',
      newStatus
    );

    return { success: true,
      message: 'Your ' + role + ' confirmation has been recorded. Thank you.' };
  }

  return { success: false,
    message: 'Nomination not found. Please contact the Returning Officer.' };
}

// submitQueryResponse — CF from System A; COL indices updated
function submitQueryResponse(queryId, token, respText) {
  if (!queryId || !token || !respText || respText.trim().length < 5) {
    return { success: false, message: 'Please provide a response of at least 5 characters.' };
  }

  var sh   = getSheet(SHEETS.NOM_QUERIES);
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.QRY_ID].toString() !== queryId) continue;
    if (data[i][COL.QRY_TOKEN].toString() !== token) {
      return { success: false, message: 'Invalid response token. Please use the link from your email.' };
    }
    if (data[i][COL.QRY_STATUS].toString() === 'responded') {
      return { success: true, message: 'Your response has already been recorded.' };
    }
    var deadline = parseDate(data[i][COL.QRY_DEADLINE]);
    if (deadline && now() > deadline) {
      var qryElecId3 = data[i][COL.QRY_ELEC_ID].toString();
      var elecRows3  = sheetData(SHEETS.ELECTIONS);
      var elecStatus3 = '';
      for (var ei3 = 0; ei3 < elecRows3.length; ei3++) {
        if (elecRows3[ei3][COL.ELEC_ID].toString() === qryElecId3) {
          elecStatus3 = elecRows3[ei3][COL.ELEC_STATUS].toString();
          break;
        }
      }
      if (elecStatus3 !== 'nominations_open' && elecStatus3 !== 'nominations_open_phase2') {
        return { success: false, message: 'The response deadline has passed.' };
      }
    }
    var ts = now().toISOString();
    sh.getRange(i + 1, COL.QRY_RESPONSE + 1).setValue(respText.trim());
    sh.getRange(i + 1, COL.QRY_RESP_AT  + 1).setValue(ts);
    sh.getRange(i + 1, COL.QRY_STATUS   + 1).setValue('responded');

    var nomId = data[i][COL.QRY_NOM_ID].toString();
    // Update matching ScrutinyLog row from 'referred' to 'response_received'
    // TODO (Pass 2): narrow this to the specific check item rather than first match
    var scSh   = getSheet(SHEETS.SCRUTINY_LOG);
    var scData = scSh.getDataRange().getValues();
    for (var j = 1; j < scData.length; j++) {
      if (scData[j][COL.SCLOG_NOM_ID].toString() === nomId
          && scData[j][COL.SCLOG_CHECK_RESULT].toString() === 'referred') {
        scSh.getRange(j + 1, COL.SCLOG_RESP_AT   + 1).setValue(ts);
        scSh.getRange(j + 1, COL.SCLOG_RESP_TEXT + 1).setValue(respText.trim());
        scSh.getRange(j + 1, COL.SCLOG_CHECK_RESULT + 1).setValue('response_received');
        break;
      }
    }

    appendAdminLog(
      data[i][COL.QRY_CAND_ROLL].toString(),
      'query_response_received',
      'Candidate responded to RO query for nomination ' + nomId,
      'referred', 'response_received'
    );

    return { success: true,
      message: 'Your response has been recorded. The Returning Officer has been notified.' };
  }

  return { success: false,
    message: 'Query not found. Please contact the Returning Officer.' };
}

// submitECResponse — CF from System A; matches by nomId + token
function submitECResponse(nomId, token, respText) {
  if (!nomId || !token || !respText || respText.trim().length < 5) {
    return { success: false, message: 'Please provide a response of at least 5 characters.' };
  }

  var sh   = getSheet(SHEETS.NOM_QUERIES);
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.QRY_NOM_ID].toString() !== nomId) continue;
    if (data[i][COL.QRY_TOKEN].toString()   !== token) continue;
    if (data[i][COL.QRY_STATUS].toString() === 'responded') {
      return { success: true, message: 'A response has already been recorded for this referral.' };
    }
    var ts = now().toISOString();
    sh.getRange(i + 1, COL.QRY_RESPONSE + 1).setValue(respText.trim());
    sh.getRange(i + 1, COL.QRY_RESP_AT  + 1).setValue(ts);
    sh.getRange(i + 1, COL.QRY_STATUS   + 1).setValue('responded');

    // Update ScrutinyLog EC response fields
    // TODO (Pass 2): identify the specific EC referral check row more precisely
    var scSh   = getSheet(SHEETS.SCRUTINY_LOG);
    var scData = scSh.getDataRange().getValues();
    for (var j = 1; j < scData.length; j++) {
      if (scData[j][COL.SCLOG_NOM_ID].toString() === nomId
          && scData[j][COL.SCLOG_EC_SENT].toString() !== '') {
        scSh.getRange(j + 1, COL.SCLOG_EC_RESP_AT + 1).setValue(ts);
        scSh.getRange(j + 1, COL.SCLOG_EC_RESP    + 1).setValue(respText.trim());
        scSh.getRange(j + 1, COL.SCLOG_CHECK_RESULT + 1).setValue('ec_response_received');
        break;
      }
    }

    appendAdminLog(
      'EC_CONTACT', 'ec_response_received',
      'EC responded to referral for nomination ' + nomId,
      'referred', 'ec_response_received'
    );

    return { success: true,
      message: 'The EC response has been recorded. The Returning Officer has been notified.' };
  }

  return { success: false,
    message: 'Referral not found. Please contact the Returning Officer.' };
}

// confirmCandidateConsent — MOD: adds two-step protection (this is step 2)
function confirmCandidateConsent(nomId, token) {
  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() !== nomId) continue;

    if (data[i][COL.NOM_CONSENT_TOKEN].toString() !== token) {
      return { success: false, message: 'Invalid or expired consent link.' };
    }

    var cs = data[i][COL.NOM_CONSENT_STATUS].toString();
    if (cs === 'accepted') {
      return { success: true,
        nomId:    nomId,
        token:    token,
        postName: data[i][COL.NOM_POST].toString(),
        hasSec:   data[i][COL.NOM_SEC_ROLL].toString().trim() !== '',
        message:  'You have already accepted this nomination.' };
    }
    if (cs === 'declined') {
      return { success: false,
        message: 'You have already declined this nomination. It has lapsed.' };
    }

    var ns = data[i][COL.NOM_STATUS].toString();
    if (ns === 'withdrawn' || ns === 'consent_declined') {
      return { success: false, message: 'This nomination is no longer active.' };
    }

    var ts       = now().toISOString();
    var postName = data[i][COL.NOM_POST].toString();

    sh.getRange(i + 1, COL.NOM_CONSENT_STATUS + 1).setValue('accepted');
    sh.getRange(i + 1, COL.NOM_CONSENT_AT     + 1).setValue(ts);

    var propDone = data[i][COL.NOM_PROP_CONFIRMED].toString() === 'true';
    var secDone  = data[i][COL.NOM_SEC_CONFIRMED].toString()  === 'true';
    var newStatus = (propDone && secDone) ? 'pending_scrutiny' : 'pending_confirmation';
    sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue(newStatus);

    appendAdminLog(
      data[i][COL.NOM_CAND_ROLL].toString(),
      'candidate_consent_accepted',
      'Candidate accepted nomination for post: ' + postName,
      'consent_pending', newStatus
    );

    // TODO (Pass 2): trigger notification email to nominator to confirm their proposal

    return { success: true,
      nomId:    nomId,
      token:    token,
      postName: postName,
      hasSec:   data[i][COL.NOM_SEC_ROLL].toString().trim() !== '',
      message: 'You have accepted the nomination for ' + postName + '.' };
  }

  return { success: false,
    message: 'Nomination not found. Please contact the Returning Officer.' };
}

// declineCandidateConsent — MOD: adds two-step protection (this is step 2)
function declineCandidateConsent(nomId, token) {
  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() !== nomId) continue;

    if (data[i][COL.NOM_CONSENT_TOKEN].toString() !== token) {
      return { success: false, message: 'Invalid or expired consent link.' };
    }

    var cs = data[i][COL.NOM_CONSENT_STATUS].toString();
    if (cs === 'declined') {
      return { success: true, message: 'You have already declined this nomination.' };
    }
    if (cs === 'accepted') {
      return { success: false,
        message: 'You have already accepted this nomination. '
          + 'Please contact the Returning Officer if you wish to withdraw.' };
    }

    var ts       = now().toISOString();
    var postName = data[i][COL.NOM_POST].toString();

    sh.getRange(i + 1, COL.NOM_CONSENT_STATUS + 1).setValue('declined');
    sh.getRange(i + 1, COL.NOM_CONSENT_AT     + 1).setValue(ts);
    sh.getRange(i + 1, COL.NOM_STATUS         + 1).setValue('consent_declined');

    appendAdminLog(
      data[i][COL.NOM_CAND_ROLL].toString(),
      'candidate_consent_declined',
      'Candidate declined nomination for post: ' + postName,
      'consent_pending', 'consent_declined'
    );

    // TODO (Pass 2): trigger notification email to nominator

    return { success: true,
      message: 'You have declined the nomination for ' + postName + '. '
        + 'The nomination has lapsed. The nominator has been notified.' };
  }

  return { success: false,
    message: 'Nomination not found. Please contact the Returning Officer.' };
}

// ============================================================
// END OF PASS 1
// Functions not yet built — to be added in subsequent passes:
// ── Pass 2 (session/auth/SPA bootstrap):
//    getSession, createSession, deleteSession
//    sendOTP, verifyOTP, hashOTP, generateOTP
//    sendAdminOTP
//    sendEmailViaSendGrid (+ MailApp fallback)
//    getPublicElectionStatus, getLandingPageContent, getPublicSchedule
// ── Pass 3+ (all admin panel, ballot, scrutiny functions):
//    per Step 3 Backend Function Map
// ============================================================

// ============================================================
// SSKZM OBA EMS — System B — Code.gs ADDITIONS
// Pass 2A: Session / Auth / OTP / Email / Public data functions
//
// HOW TO USE THIS FILE:
// Paste the entire contents BELOW the last line of Pass 1
// in Code.gs. Do not replace Pass 1 — append after it.
// ============================================================

// ============================================================
// SESSION MANAGEMENT
// Sessions stored in PropertiesService (Script Properties).
// Never stored in the Google Sheet — see TechSpec 8.3.
// Token is a random UUID with no relationship to voter identity.
// ============================================================

function createSession(identity, role) {
  // Prune expired sessions to keep PropertiesService within limits
  try {
    var props = PropertiesService.getScriptProperties().getProperties();
    var nowMs = now().getTime();
    for (var k in props) {
      if (k.indexOf(SESSION_KEY_PREFIX) === 0) {
        try {
          var s = JSON.parse(props[k]);
          if (new Date(s.expiresAt).getTime() < nowMs) {
            PropertiesService.getScriptProperties().deleteProperty(k);
          }
        } catch(e) {
          PropertiesService.getScriptProperties().deleteProperty(k);
        }
      }
    }
  } catch(e) { /* silent — never block session creation */ }
  var token = generateId();
  var session = {
    identity:  identity,   // rollNo for voters; adminId for admins
    role:      role,       // 'voter' | 'RO_ADMIN' | 'DEPUTY_RO' | 'TEM' |
                           // 'SCRUTINEER' | 'OBSERVER' | 'EC_OFFICER'
    createdAt: now().toISOString(),
    expiresAt: new Date(now().getTime()
                 + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
  };
  PropertiesService.getScriptProperties()
    .setProperty(SESSION_KEY_PREFIX + token, JSON.stringify(session));
  return token;
}

function getSession(token) {
  if (!token) return null;
  var raw = PropertiesService.getScriptProperties()
              .getProperty(SESSION_KEY_PREFIX + token);
  if (!raw) return null;
  try {
    var session = JSON.parse(raw);
    // Check expiry
    var expiry = parseDate(session.expiresAt);
    if (expiry && now() > expiry) {
      deleteSession(token);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function deleteSession(token) {
  if (!token) return;
  PropertiesService.getScriptProperties()
    .deleteProperty(SESSION_KEY_PREFIX + token);
}

function logout(token) {
  deleteSession(token);
  return { success: true };
}

// ============================================================
// VOTER LOOKUP HELPERS
// ============================================================

// Returns voter object or null. Roll No comparison is case-insensitive.
function findVoter(rollNo) {
  if (!rollNo) return null;
  var roll = rollNo.toString().trim().toUpperCase();
  var rows = sheetData(SHEETS.VOTERS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.VOTER_ROLL].toString().toUpperCase() === roll) {
      return {
        roll:       rows[i][COL.VOTER_ROLL].toString(),
        name:       rows[i][COL.VOTER_NAME].toString(),
        surname:    rows[i][COL.VOTER_SURNAME].toString(),
        batch:      rows[i][COL.VOTER_BATCH].toString(),
        email:      rows[i][COL.VOTER_EMAIL].toString().toLowerCase(),
        lifeMember: rows[i][COL.VOTER_LIFE_MEMBER].toString().toLowerCase() === 'true'
      };
    }
  }
  return null;
}

// Returns admin object or null. AdminId comparison is case-insensitive.
function findAdmin(adminId) {
  if (!adminId) return null;
  var id   = adminId.toString().trim().toUpperCase();
  var rows = sheetData(SHEETS.ADMINS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString().toUpperCase() === id) {
      return {
        id:          rows[i][COL.ADMIN_ID].toString(),
        name:        rows[i][COL.ADMIN_NAME].toString(),
        role:        rows[i][COL.ADMIN_ROLE].toString(),
        email:       rows[i][COL.ADMIN_EMAIL].toString().toLowerCase(),
        type:        rows[i][COL.ADMIN_TYPE].toString(),
        roll:        rows[i][COL.ADMIN_ROLL].toString(),
        addedAt:     rows[i][COL.ADMIN_ADDED_AT].toString(),
        status:      rows[i][COL.ADMIN_STATUS].toString().toUpperCase() || 'ACTIVE',
        depROActive: rows[i][COL.ADMIN_DEPRO_ACTIVE].toString().toLowerCase() === 'true'
      };
    }
  }
  return null;
}

// Returns the admin role for a given roll number, or null if not an admin.
// Used by verifyOTP to determine if a voter-login is actually an admin.
function getAdminRole(rollNo) {
  if (!rollNo) return null;
  var roll = rollNo.toString().trim().toUpperCase();
  var rows = sheetData(SHEETS.ADMINS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ROLL].toString().toUpperCase() === roll
        && rows[i][COL.ADMIN_STATUS].toString().toUpperCase() !== 'DISABLED') {
      return rows[i][COL.ADMIN_ROLE].toString();
    }
  }
  return null;
}

// ============================================================
// OTP — GENERATION, HASHING, STORAGE
// OTPs are stored as SHA-256 hashes — plaintext never written.
// See TechSpec 8.2.
// ============================================================

function generateOTP() {
  // 6-digit numeric OTP padded to 6 chars
  return ('000000' + Math.floor(Math.random() * 1000000)).slice(-6);
}

function hashOTP(otp) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    otp.toString().trim()
  ).map(function(b) {
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}

// ============================================================
// sendOTP — voter login
// MOD from System A: adds LifeMember check (new col 9).
// ============================================================

function sendOTP(rollNo, email, purpose) {
  rollNo = rollNo.toString().trim().toUpperCase();
  email  = (email || '').toString().trim().toLowerCase();

  if (!rollNo || !email) {
    return { success: false, code: 'MISSING_FIELDS',
      message: 'Please enter both your Roll Number and registered email address.' };
  }

  var voter = findVoter(rollNo);

  if (!voter) {
    return { success: false, code: 'NOT_FOUND',
      message: 'Roll Number not found on the voter roll. Please check and try again.' };
  }

  // LifeMember check — System B addition
  if (!voter.lifeMember) {
    return { success: false, code: 'NOT_ELIGIBLE',
      message: 'Your membership has not been confirmed as a Life Member. '
        + 'Only Life Members are eligible to vote. '
        + 'Please contact the Returning Officer if you believe this is an error.' };
  }

  if (!voter.email) {
    return { success: false, code: 'NO_EMAIL',
      message: 'No email address is registered for this Roll Number. '
        + 'Please contact the Returning Officer.' };
  }

  if (voter.email !== email) {
    return { success: false, code: 'EMAIL_MISMATCH',
      message: 'The email address you entered does not match our records. '
        + 'Please use your registered email address.' };
  }

  // Delete any existing OTP for this roll before issuing a new one
  var sh   = getSheet(SHEETS.OTPS);
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][COL.OTP_ROLL].toString().toUpperCase() === rollNo) {
      sh.deleteRow(i + 1);
    }
  }

  var otp    = generateOTP();
  var expiry = new Date(now().getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  // Store HASH — never plaintext
  sh.appendRow([rollNo, hashOTP(otp), expiry.toISOString(), purpose || 'login']);

  var result = sendEmailViaSendGrid(
    voter.email,
    'SSKZM OBA — Your Login OTP',
    buildOTPEmail((voter.name + ' ' + voter.surname).trim(), otp, purpose || 'login')
  );

  if (result.success) {
    return { success: true, maskedEmail: maskEmail(voter.email) };
  }
  return { success: false, code: 'SEND_FAILED',
    message: 'Could not send OTP email. Please try again or contact the Returning Officer.' };
}

// ============================================================
// verifyOTP — voter OTP check + session creation
// CF from System A. COL indices updated for System B.
// ============================================================

function verifyOTP(rollNo, otp) {
  rollNo = rollNo.toString().trim().toUpperCase();
  otp    = otp.toString().trim();

  var sh   = getSheet(SHEETS.OTPS);
  var data = sh.getDataRange().getValues();

  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (row[COL.OTP_ROLL].toString().toUpperCase() !== rollNo) continue;

    if (row[COL.OTP_CODE].toString() !== hashOTP(otp)) {
      return { success: false, message: 'Incorrect OTP. Please try again.' };
    }

    var expiry = parseDate(row[COL.OTP_EXPIRY]);
    if (expiry && now() > expiry) {
      sh.deleteRow(i + 1);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    sh.deleteRow(i + 1);

    var voter = findVoter(rollNo);
    var role  = 'voter';
    var token = createSession(rollNo, role);

    return {
      success: true,
      token:   token,
      rollNo:  rollNo,
      name:    voter ? (voter.name + ' ' + voter.surname).trim() : rollNo,
      batch:   voter ? voter.batch : '',
      role:    role
    };
  }

  return { success: false, message: 'OTP not found. Please request a new one.' };
}

// ============================================================
// sendAdminOTP — admin/RO login
// MOD from System A: checks Admins Status field (new col 7).
// If DISABLED → return ACCOUNT_DISABLED. Do not send OTP.
// ============================================================

function sendAdminOTP(adminId, email) {
  adminId = adminId.toString().trim().toUpperCase();
  email   = (email || '').toString().trim().toLowerCase();

  var admin = findAdmin(adminId);

  if (!admin) {
    return { success: false, code: 'NOT_FOUND',
      message: 'Admin ID not found. Please check your ID or contact the Returning Officer.' };
  }

  // DISABLED check — critical for EC lockout architecture
  if (admin.status === 'DISABLED') {
    return { success: false, code: 'ACCOUNT_DISABLED',
      message: 'This account has been disabled. Please contact the Returning Officer.' };
  }

  // PENDING_ACCEPTANCE check — Scrutineer must accept appointment before logging in
  if (admin.status === 'PENDING_ACCEPTANCE') {
    return { success: false, code: 'PENDING_ACCEPTANCE',
      message: 'This account is pending acceptance. Please click the acceptance link sent to your email before logging in.' };
  }

  if (!admin.email) {
    return { success: false, code: 'NO_EMAIL',
      message: 'No email address is registered for this Admin ID. '
        + 'Please contact the election administrator.' };
  }

  if (admin.email !== email) {
    return { success: false, code: 'EMAIL_MISMATCH',
      message: 'The email address you entered does not match our records for this Admin ID.' };
  }

  var sh     = getSheet(SHEETS.OTPS);
  var data   = sh.getDataRange().getValues();
  var otpKey = 'ADMIN_' + adminId;

  // Delete any existing OTP for this admin
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][COL.OTP_ROLL].toString().toUpperCase() === otpKey) {
      sh.deleteRow(i + 1);
    }
  }

  var otp    = generateOTP();
  var expiry = new Date(now().getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  sh.appendRow([otpKey, hashOTP(otp), expiry.toISOString(), 'admin_login']);

  var result = sendEmailViaSendGrid(
    admin.email,
    'SSKZM OBA — Admin Panel OTP',
    buildOTPEmail(admin.name, otp, 'ro_login')
  );

  if (result.success) {
    return { success: true, maskedEmail: maskEmail(admin.email) };
  }
  return { success: false, code: 'SEND_FAILED',
    message: 'Could not send OTP email. Please try again.' };
}

// ============================================================
// verifyAdminOTP — admin OTP check + session creation
// MOD from System A: re-checks DISABLED status after finding
// admin, before creating session. Guards against race condition
// where admin is disabled between sendAdminOTP and verifyAdminOTP.
// ============================================================

function verifyAdminOTP(adminId, otp) {
  adminId = adminId.toString().trim().toUpperCase();
  otp     = otp.toString().trim();

  var otpKey = 'ADMIN_' + adminId;
  var sh     = getSheet(SHEETS.OTPS);
  var data   = sh.getDataRange().getValues();

  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (row[COL.OTP_ROLL].toString().toUpperCase() !== otpKey) continue;

    if (row[COL.OTP_CODE].toString() !== hashOTP(otp)) {
      return { success: false, message: 'Incorrect OTP.' };
    }

    var expiry = parseDate(row[COL.OTP_EXPIRY]);
    if (expiry && now() > expiry) {
      sh.deleteRow(i + 1);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    sh.deleteRow(i + 1);

    // Re-fetch admin — re-check DISABLED in case status changed since OTP was sent
    var admin = findAdmin(adminId);
    if (!admin) {
      return { success: false,
        message: 'Admin account not found. Please contact the Returning Officer.' };
    }
    if (admin.status === 'DISABLED') {
      appendAdminLog(adminId, 'admin_login_blocked',
        'Login blocked — account disabled', '', '');
      return { success: false, code: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled. Please contact the Returning Officer.' };
    }

    // Deputy RO activation gate — must be activated by RO before login is permitted
    if (admin.role === 'DEPUTY_RO' && !admin.depROActive) {
      appendAdminLog(adminId, 'admin_login_blocked',
        'Login blocked — Deputy RO not yet activated', '', '');
      return { success: false, code: 'DEPUTY_RO_INACTIVE',
        message: 'Your Deputy RO account has not been activated yet. Please contact the Returning Officer.' };
    }

    var token = createSession(adminId, admin.role);

    appendAdminLog(adminId, 'admin_login',
      'Admin login: ' + admin.name + ' (' + admin.role + ')', '', '');

    return {
      success:  true,
      token:    token,
      adminId:  adminId,
      name:     admin.name,
      role:     admin.role,
      type:     admin.type
    };
  }

  return { success: false, message: 'OTP not found. Please request a new one.' };
}

// ============================================================
// EMAIL — delivery engine
// Primary: MailApp (active for System B — SendGrid pending resolution)
// SendGrid stub preserved for when ticket resolves.
// Function name retained as sendEmailViaSendGrid for CF compatibility.
// ============================================================

function sendEmailViaSendGrid(to, subject, htmlBody) {
  // Function name retained for CF compatibility — sends via Brevo
  try {
    var apiKey = PropertiesService.getScriptProperties()
                   .getProperty('BREVO_API_KEY') || '';

    if (apiKey) {
      var payload = {
        sender:      { name: ELECTIONS_NAME, email: 'elections@sskzmoba.org' },
        to:          [{ email: to }],
        subject:     subject,
        htmlContent: htmlBody
      };
      var response = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
        method:             'post',
        contentType:        'application/json',
        headers:            { 'api-key': apiKey },
        payload:            JSON.stringify(payload),
        muteHttpExceptions: true
      });
      var code = response.getResponseCode();
      if (code === 200 || code === 201 || code === 202) {
        return { success: true, method: 'brevo' };
      }
      Logger.log('Brevo error ' + code + ': ' + response.getContentText());
      // Fall through to MailApp
    }

    // MailApp fallback
    MailApp.sendEmail({ to: to, subject: subject, htmlBody: htmlBody,
                        name: ELECTIONS_NAME });
    return { success: true, method: 'mailapp' };

  } catch (e) {
    Logger.log('Email error: ' + e.toString());
    try {
      MailApp.sendEmail({ to: to, subject: subject, htmlBody: htmlBody,
                          name: ELECTIONS_NAME });
      return { success: true, method: 'mailapp_fallback' };
    } catch (e2) {
      appendAdminLog('SYSTEM', 'email_send_failed',
        'Failed to send to ' + to + ': ' + e2.toString(), subject, '');
      return { success: false, error: e2.toString() };
    }
  }
}

// ============================================================
// EMAIL TEMPLATE BUILDERS
// ============================================================

function maskEmail(email) {
  if (!email) return '';
  var parts  = email.split('@');
  var local  = parts[0];
  var masked = local.slice(0, 2)
    + '***'
    + (local.length > 4 ? local.slice(-1) : '');
  return masked + '@' + (parts[1] || '');
}

function buildOTPEmail(name, otp, purpose) {
  var purposeText = (purpose === 'ro_login' || purpose === 'admin_login')
    ? 'Admin Panel Login'
    : 'Election Voting';
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;'
    +   'padding:16px 24px;border-radius:6px 6px 0 0;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.1rem;">'
    +   'SSKZM Old Boys Association</h2>'
    + '<p style="color:rgba(255,255,255,.65);margin:3px 0 0;font-size:.8rem;">'
    +   'Election Management System</p>'
    + '</div>'
    + '<div style="border:1px solid #e0e0e0;border-top:none;padding:24px;'
    +   'border-radius:0 0 6px 6px;">'
    + '<p>Dear <strong>' + escHtml(name) + '</strong>,</p>'
    + '<p>Your One-Time Password for <strong>' + purposeText + '</strong> is:</p>'
    + '<div style="background:#f0f4f8;border-radius:6px;padding:20px;'
    +   'text-align:center;margin:20px 0;">'
    + '<span style="font-size:2.4rem;font-weight:700;letter-spacing:10px;'
    +   'color:#1a3a5c;">' + escHtml(otp) + '</span>'
    + '</div>'
    + '<p style="color:#666;font-size:.85rem;">Valid for <strong>'
    +   OTP_EXPIRY_MINUTES + ' minutes</strong>. '
    + 'If you did not request this, please ignore this email.</p>'
    + '<p style="color:#888;font-size:.8rem;margin-top:16px;">'
    +   'SSKZM Old Boys Association — Election Management System</p>'
    + '</div></div>';
}

function buildNomConfirmEmail(voterName, candidateName, postName, confirmUrl, role, deadline) {
  var roleLabel = role === 'proposer' ? 'proposer' : 'seconder';
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — Nomination Confirmation Required</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear <strong>' + escHtml(voterName) + '</strong>,</p>'
    + '<p>You have been listed as the <strong>' + roleLabel + '</strong> '
    + 'for the nomination of <strong>' + escHtml(candidateName) + '</strong> '
    + 'for the post of <strong>' + escHtml(postName) + '</strong>.</p>'
    + '<p>Please confirm your role by clicking the button below. '
    + 'You will be asked to enter your Roll Number to verify your identity.</p>'
    + '<p><a href="' + confirmUrl + '" style="display:inline-block;background:#1a3a5c;'
    + 'color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;">'
    + 'Confirm My ' + (role === 'proposer' ? 'Proposal' : 'Seconding') + '</a></p>'
    + '<p style="color:#888;font-size:.82rem;">This link expires at '
    + escHtml(deadline || 'the nomination deadline') + '.</p>'
    + '<p style="color:#888;font-size:.82rem;">If you did not agree to '
    + roleLabel + ' this nomination, you may ignore this email.</p>'
    + '</div></div>';
}

function buildConsentEmail(candName, nominatorName, postName, elecTitle, acceptUrl, declineUrl) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — Nomination Consent Request</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear <strong>' + escHtml(candName) + '</strong>,</p>'
    + '<p><strong>' + escHtml(nominatorName) + '</strong> has nominated you '
    + 'for the post of <strong>' + escHtml(postName) + '</strong> '
    + 'in the <strong>' + escHtml(elecTitle) + '</strong>.</p>'
    + '<p>Please indicate your consent within <strong>48 hours</strong>. '
    + 'If no response is received by the deadline, the nomination will lapse automatically.</p>'
    + '<div style="margin:24px 0;">'
    + '<a href="' + acceptUrl + '" style="display:inline-block;background:#1a3a5c;'
    + 'color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;'
    + 'margin-right:12px;">Accept Nomination</a>'
    + '<a href="' + declineUrl + '" style="display:inline-block;background:#c0392b;'
    + 'color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">'
    + 'Decline Nomination</a>'
    + '</div>'
    + '<p style="color:#888;font-size:.82rem;">If you did not expect this email, '
    + 'you may safely decline. For queries contact the Returning Officer.</p>'
    + '</div></div>';
}

function buildQueryEmail(candName, postName, queryText, responseUrl, deadline) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — Returning Officer Query</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear <strong>' + escHtml(candName) + '</strong>,</p>'
    + '<p>The Returning Officer has a query regarding your nomination '
    + 'for the post of <strong>' + escHtml(postName) + '</strong>:</p>'
    + '<div style="background:#f0f4f8;border-left:3px solid #1a3a5c;'
    + 'padding:12px 16px;margin:16px 0;font-style:italic;">'
    + escHtml(queryText) + '</div>'
    + '<p>Please respond within <strong>48 hours</strong> using the link below.</p>'
    + '<p><a href="' + responseUrl + '" style="display:inline-block;background:#1a3a5c;'
    + 'color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">'
    + 'Submit Response</a></p>'
    + '<p style="color:#888;font-size:.82rem;">Deadline: '
    + escHtml(deadline || '') + '</p>'
    + '</div></div>';
}

function buildECReferralEmail(ecContact, candName, postName, referralText, responseUrl) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — EC Referral from Returning Officer</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear ' + escHtml(ecContact) + ',</p>'
    + '<p>The Returning Officer has referred the following matter to the Executive Committee '
    + 'regarding the nomination of <strong>' + escHtml(candName) + '</strong> '
    + 'for <strong>' + escHtml(postName) + '</strong>:</p>'
    + '<div style="background:#f0f4f8;border-left:3px solid #1a3a5c;'
    + 'padding:12px 16px;margin:16px 0;font-style:italic;">'
    + escHtml(referralText) + '</div>'
    + '<p>Please respond using the link below.</p>'
    + '<p><a href="' + responseUrl + '" style="display:inline-block;background:#1a3a5c;'
    + 'color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">'
    + 'Submit EC Response</a></p>'
    + '</div></div>';
}

function buildAcceptanceEmail(candidateName, postName) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — Nomination Accepted</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear <strong>' + escHtml(candidateName) + '</strong>,</p>'
    + '<p>Your nomination for the post of <strong>' + escHtml(postName) + '</strong> '
    + 'has been accepted by the Returning Officer following scrutiny. '
    + 'You are confirmed as a candidate.</p>'
    + '<p>The candidate list will be published on the election portal.</p>'
    + '<p style="color:#888;font-size:.82rem;">SSKZM OBA Election Management System</p>'
    + '</div></div>';
}

function buildRejectionEmail(candidateName, postName, reason) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
    + '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">'
    + '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — Nomination Not Accepted</h2>'
    + '</div>'
    + '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">'
    + '<p>Dear <strong>' + escHtml(candidateName) + '</strong>,</p>'
    + '<p>Following scrutiny, your nomination for the post of '
    + '<strong>' + escHtml(postName) + '</strong> has not been accepted.</p>'
    + '<p><strong>Reason:</strong> ' + escHtml(reason) + '</p>'
    + '<p>If you wish to appeal this decision, you may file an appeal through the election portal within 48 hours of the candidate list being published. Your appeal will be reviewed by the independently constituted Appeals Panel.</p>'
    + '<p style="color:#888;font-size:.82rem;">SSKZM OBA Election Management System</p>'
    + '</div></div>';
}

// ============================================================
// PUBLIC DATA FUNCTIONS
// No session required. Called via google.script.run from
// LandingPage.html on load.
// ============================================================

// Returns the current active election's public-facing status summary.
// Used by the landing page timeline widget.
function getPublicElectionStatus() {
  try {
    var elections = sheetData(SHEETS.ELECTIONS);
    // Find most recently created non-draft, non-declared election
    // Priority: active > nominations_open > nominations_open_phase2 >
    //           scrutiny > candidates_published > closed > declared
    var priority = [
      'active', 'paused', 'nominations_open_phase2', 'nominations_open',
      'scrutiny', 'candidates_published', 'closed', 'declared', 'draft'
    ];
    var best = null;
    var bestPriority = priority.length;

    for (var i = 0; i < elections.length; i++) {
      if (elections[i][COL.ELEC_INTERNAL_TEST].toString().toLowerCase() === 'true') continue;
      var status = elections[i][COL.ELEC_STATUS].toString();
      var p = priority.indexOf(status);
      if (p !== -1 && p < bestPriority) {
        best         = elections[i];
        bestPriority = p;
      }
    }

    if (!best) {
      return { found: false, message: 'No election is currently scheduled.' };
    }

    var vvaUrl = '';
    try {
      var lpcRows = sheetData(SHEETS.LANDING_CONTENT);
      for (var k = 0; k < lpcRows.length; k++) {
        if (lpcRows[k][0].toString().trim() === 'vva_url') {
          vvaUrl = lpcRows[k][1].toString().trim();
          break;
        }
      }
    } catch (e) { vvaUrl = ''; }

    return {
      found:       true,
      electionId:  best[COL.ELEC_ID].toString(),
      title:       best[COL.ELEC_TITLE].toString(),
      status:      best[COL.ELEC_STATUS].toString(),
      mode:        best[COL.ELEC_MODE].toString(),
      trial:       best[COL.ELEC_TRIAL].toString().toLowerCase() === 'true',
      nomDeadline: best[COL.ELEC_NOM_DEADLINE].toString(),
      vDay:        best[COL.ELEC_VDAY].toString(),
      voteClose:   best[COL.ELEC_VOTE_CLOSE].toString(),
      declareDay:  best[COL.ELEC_DECLARE_DAY].toString(),
      resultVis:   best[COL.ELEC_RESULT_VIS].toString(),
      vvaUrl:      vvaUrl
    };
  } catch (e) {
    return { found: false, message: 'Election status unavailable.' };
  }
}

// getLandingPageContent and getPublicSchedule — implemented above (Step 4).
// Stubs removed to avoid duplicate function definitions.

// ============================================================
// END OF PASS 2A
// ============================================================
// Next to build (Pass 2B — HTML file stubs):
//   Index.html   — SPA shell with include() wiring
//   SharedJS.html — login flow S08-S12
//   VoterJS.html  — voter panel stub
//   AdminJS.html  — RO/TEM/Deputy RO panel stub
//   ECOfficerJS.html — EC Officer panel stub
// ============================================================

/**
 * initSystemBSheets()
 * Run ONCE from Apps Script editor to create all 22 System B tabs with headers.
 * IDEMPOTENT — safe to re-run. Skips tabs that already exist.
 * Does NOT overwrite data in existing tabs.
 * After running, check Apps Script Logs for summary.
 */
function initSystemBSheets() {
  var ss = SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
  var created = [];
  var skipped = [];

  var HEADERS = {

    // ── FROZEN TABS ──────────────────────────────────────────────
    'Votes': [
      'VoteID','ElectionID','PostName','CandidateID','CastAt'
    ],
    'VotedLog': [
      'RollNo','ElectionID','PostName','Timestamp'
    ],
    'AdminLog': [
      'ID','AdminID','ActionType','Description','OldValue','NewValue','Timestamp'
    ],
    'OTPs': [
      'RollNo','OTP','Expiry','Purpose'
    ],

    // ── MODIFIED EXISTING TABS ────────────────────────────────────
    'Voters': [
      'RollNo','Name','Surname','Batch','Email',
      'PhoneCC','Phone','Phone2CC','Phone2',
      'LifeMember','EmailVerified'
    ],
    'Elections': [
      'ID','Title','Description','Status','StartDate','EndDate',
      'CreatedBy','CreatedAt','OrgSecyBatch','BatchRepRestricted',
      'OrgSecyRestricted','ResultVisibility','NomDeadline','ECContact',
      'NomPhase','NomExtCount','NomExtDeadline','MinRequiredPosts',
      'Mode','TrialElection','BypassFloors',
      'VDay','VoteClose','DeclareDay','SGMDate','CertifiedAt','SeatConfig'
    ],
    'Candidates': [
      'ID','ElectionID','PostName','PostOrder','CandName',
      'RollNo','Batch','Bio','PhotoUrl',
      'SeatCount','NominationId','ScrutinyAcceptedAt','ScrutinyAcceptedBy'
    ],
    'Admins': [
      'AdminID','Name','Role','Email','Type','RollNo','AddedAt',
      'Status','DisabledAt','DisabledBy',
      'DeputyROActivated','ActivatedAt','ActivatedBy'
    ],
    'Nominations': [
      'NomID','ElectionID','PostName','CandRollNo','CandName',
      'CandBatch','CandEmail','PropRollNo','PropConfirmed','PropConfirmedAt',
      'PropToken','SecRollNo','SecConfirmed','SecConfirmedAt','SecToken',
      'Bio','PhotoUrl','SubmittedAt','Deadline','Status',
      'RejectionReason','WithdrawnAt','EntryMethod','DocLinks','FolderUrl',
      'NominatorRoll','ConsentStatus','ConsentToken','ConsentRespondedAt',
      'OnePostCheck','Phase2Flag','DuplicateDeclined'
    ],
    'ScrutinyLog': [
      'ID','NomID','ElectionID','PostName','CandRollNo','CandName',
      'Action','ActionBy','ActionAt','PreviousStatus','NewStatus',
      'Notes','DocLinksSnapshot','BatchVerified','EligibilityVerified',
      'ConsentVerified','OnePostVerified','FinalDecision'
    ],
    'NomQueries': [
      'QueryID','NomID','ElectionID','PostName',
      'RaisedBy','RaisedAt','QueryText','ResponseText',
      'ResponseBy','ResponseAt','Status','ResolutionNotes'
    ],
    'DocStore': [
      'DocID','NomID','ElectionID','UploadedBy','UploadedAt',
      'FileUrl','FileName','FileType','FolderUrl','LinkedToTab'
    ],

    // ── NEW TABS ──────────────────────────────────────────────────
    'VoterRollDraft': [
      'RollNo','Name','Surname','Batch','Email',
      'PhoneCC','Phone','Phone2CC','Phone2',
      'UploadedAt','ObjectionStatus','ObjectionNotes','VerificationCategory'
    ],
    'Complaints': [
      'ComplaintID','ElectionID','FiledBy','FiledAt','Subject',
      'ComplaintText','Status','AssignedTo','ResponseText',
      'ResponseAt','ResolutionNotes','ResolutionAt','EscalatedTo','EscalatedAt'
    ],
    'Appeals': [
      'AppealID','ElectionID','FiledBy','FiledAt','RelatedComplaintID',
      'AppealText','Status','ReviewedBy','ReviewedAt',
      'DecisionText','DecisionAt','DecisionBy',
      'EscalatedToEC','ECResolutionNotes','ECDecisionAt','FinalStatus'
    ],
    'Observations': [
      'ObsID','ElectionID','ObserverID','ObservedAt','ObsType',
      'ObsText','Severity','AcknowledgedBy','AcknowledgedAt',
      'ResponseText','ResolutionStatus'
    ],
    'Messages': [
      'MessageID','ElectionID','FromAdminID','ToAdminID',
      'Subject','MessageText','SentAt',
      'AcknowledgedAt','AcknowledgedBy'
    ],   // 9 cols ✓
    'ECOfficerBoardDatabase': [
      'EntryID','ElectionID','RollNo','Name','Batch',
      'Role','AppointedAt','AppointedBy','Notes'
    ],   // 9 cols ✓
    'ElectionSchedule': [
      'SchedID',              // 0  — UUID
      'ElectionID',           // 1  — FK → Elections
      'ScheduleMode',         // 2  — live | trial_internal | trial_member
      'VDay',                 // 3  — AGM date (anchor)
      'VoterRollCutoff',      // 4  — V-47
      'NomOpenDate',          // 5  — V-38
      'VoterRollPubDate',     // 6  — V-33
      'Phase1CloseDate',      // 7  — V-31
      'VoterRollObjDeadline', // 8  — V-26
      'NomCloseDate',         // 9  — V-24
      'VoterRollCertDate',    // 10 — V-24
      'CandidatesPubDate',    // 11 — V-19
      'WithdrawalDeadline',   // 12 — V-18 (D+1 from CandidatesPubDate)
      'VotingOpenDate',       // 13 — V-16
      'VotingCloseDate',      // 14 — V-9
      'DeclarationDate',      // 15 — V-7
      'PublishedToLandingPage', // 16 — Boolean
      'PublishedAt',          // 17 — ISO timestamp
      'LastUpdatedAt',        // 18 — ISO timestamp
      'LastUpdatedBy',        // 19 — AdminID
      'ExtendedBeyondVDay'    // 20 — Boolean, system-set
    ],   // 21 cols ✓
    'TEMAuth': [
      'AuthID','ElectionID','IssuedBy','IssuedAt',
      'Scope','ActionTypes','ExpiresAt','UsedAt',
      'UsedCount','Revoked','RevokedAt','Notes'
    ],   // 12 cols ✓
    'ROPanelLog': [
      'PanelLogID','ElectionID','PanelIteration','RollNo','Name',
      'Batch','PublishedAt','ObjectionFiled','ObjectionText','ObjectionFiledBy',
      'ECDecision','DecisionNotes','DecidedAt','EntryMethod','ObjectionAt'
    ],   // 15 cols ✓
    'LandingPageContent': [
      'ContentKey',      // 0 — unique key e.g. 'sgm_date', 'agm_date', 'vva_url', 'announcement'
      'ContentValue',    // 1 — the value
      'ContentType',     // 2 — date | text | url | boolean
      'Label',           // 3 — display label e.g. 'Special General Meeting'
      'PublicVisible',   // 4 — Boolean — show on Landing Page
      'LastUpdatedBy',   // 5 — AdminID or EC Officer ID
      'LastUpdatedAt'    // 6 — ISO timestamp
    ]    // 7 cols ✓
  };

  // ── Process each tab in order ─────────────────────────────────
  var tabOrder = [
    'Votes','VotedLog','AdminLog','OTPs',
    'Voters','Elections','Candidates','Admins','Nominations',
    'ScrutinyLog','NomQueries','DocStore',
    'VoterRollDraft','Complaints','Appeals','Observations','Messages',
    'ECOfficerBoardDatabase','ElectionSchedule','TEMAuth','ROPanelLog','LandingPageContent'
  ];

  tabOrder.forEach(function(tabName) {
    var existing = ss.getSheetByName(tabName);
    if (existing) {
      skipped.push(tabName);
      Logger.log('SKIP  — already exists: ' + tabName);
      return;
    }
    var sh = ss.insertSheet(tabName);
    var headers = HEADERS[tabName];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    // Freeze header row
    sh.setFrozenRows(1);
    created.push(tabName + ' (' + headers.length + ' cols)');
    Logger.log('CREATE — ' + tabName + ' [' + headers.length + ' cols]');
  });

  Logger.log('═══ initSystemBSheets COMPLETE ═══');
  Logger.log('Created : ' + created.length + ' tabs');
  Logger.log('Skipped : ' + skipped.length + ' tabs (already existed)');
  if (created.length > 0)   Logger.log('New tabs: ' + created.join(', '));
  if (skipped.length > 0)   Logger.log('Skipped : ' + skipped.join(', '));
}

// ============================================================
// getAdminList — return all admin accounts
// Access: RO_ADMIN only
// ============================================================
function getAdminList(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };

  var rows = sheetData(SHEETS.ADMINS);
  var admins = rows.map(function(r) {
    return {
      id:             r[COL.ADMIN_ID].toString(),
      name:           r[COL.ADMIN_NAME].toString(),
      role:           r[COL.ADMIN_ROLE].toString(),
      email:          r[COL.ADMIN_EMAIL].toString(),
      type:           r[COL.ADMIN_TYPE].toString(),
      rollNo:         r[COL.ADMIN_ROLL].toString(),
      addedAt:        r[COL.ADMIN_ADDED_AT] ? r[COL.ADMIN_ADDED_AT].toString() : '',
      status:         r[COL.ADMIN_STATUS]   ? r[COL.ADMIN_STATUS].toString()   : 'ACTIVE',
      disabledAt:     r[COL.ADMIN_DISABLED_AT] ? r[COL.ADMIN_DISABLED_AT].toString() : '',
      disabledBy:     r[COL.ADMIN_DISABLED_BY] ? r[COL.ADMIN_DISABLED_BY].toString() : '',
      deputyROActive: r[COL.ADMIN_DEPRO_ACTIVE] ? !!r[COL.ADMIN_DEPRO_ACTIVE] : false,
      activatedAt:    r[COL.ADMIN_ACTIVATED_AT] ? r[COL.ADMIN_ACTIVATED_AT].toString() : '',
      activatedBy:    r[COL.ADMIN_ACTIVATED_BY] ? r[COL.ADMIN_ACTIVATED_BY].toString() : ''
    };
  });
  return { success: true, admins: admins };
}

// ============================================================
// addAdmin — create a new admin account
// Access: RO_ADMIN only
// ============================================================
function addAdmin(token, data, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'addAdmin');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!data || !data.id || !data.name || !data.role || !data.email) {
    return { success: false, message: 'AdminID, Name, Role and Email are required.' };
  }

  var validRoles = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER', 'OBSERVER'];
  if (validRoles.indexOf(data.role) === -1) {
    return { success: false, message: 'Invalid role: ' + data.role };
  }

  // Check for duplicate AdminID
  var existing = sheetData(SHEETS.ADMINS);
  for (var i = 0; i < existing.length; i++) {
    if (existing[i][COL.ADMIN_ID].toString() === data.id.toString()) {
      return { success: false, message: 'AdminID already exists: ' + data.id };
    }
  }

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var newRow = new Array(13).fill('');
  newRow[COL.ADMIN_ID]       = data.id.toString().trim();
  newRow[COL.ADMIN_NAME]     = data.name.toString().trim();
  newRow[COL.ADMIN_ROLE]     = data.role;
  newRow[COL.ADMIN_EMAIL]    = data.email.toString().trim().toLowerCase();
  newRow[COL.ADMIN_TYPE]     = data.type || 'alumni';
  newRow[COL.ADMIN_ROLL]     = data.rollNo ? data.rollNo.toString().trim() : '';
  newRow[COL.ADMIN_ADDED_AT] = now().toISOString();
  newRow[COL.ADMIN_STATUS]   = (data.role === 'SCRUTINEER') ? 'PENDING_ACCEPTANCE' : 'ACTIVE';
  // cols 8–12 left blank (disabled/activation fields — set by specific functions)

  sh.appendRow(newRow);
  appendAdminLog(sess.identity, 'admin_added',
    'Added admin: ' + data.id + ' (' + data.name + ') Role: ' + data.role,
    '', data.id);

  // Auto-send acceptance link for Scrutineers
  if (data.role === 'SCRUTINEER') {
    sendScrutineerAcceptanceLink(null, data.id);
  }

  return { success: true };
}

// ============================================================
// sendScrutineerAcceptanceLink — generate and email acceptance link
// Called automatically by addAdmin for SCRUTINEER role.
// Also callable by RO_ADMIN to re-send if needed.
// Access: internal (called from addAdmin) + RO_ADMIN direct call
// ============================================================
function sendScrutineerAcceptanceLink(token, adminId) {
  var sess = null;
  if (token) {
    sess = getSession(token);
    if (!sess) return { success: false, message: 'Session expired.' };
    if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  }

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };
  var rows = sheetData(SHEETS.ADMINS);
  var rowIndex = -1;
  var adminRow = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      rowIndex = i;
      adminRow = rows[i];
      break;
    }
  }
  if (rowIndex === -1) return { success: false, message: 'Scrutineer account not found.' };
  if (adminRow[COL.ADMIN_ROLE].toString() !== 'SCRUTINEER') {
    return { success: false, message: 'Acceptance link only applicable to Scrutineers.' };
  }

  // Generate acceptance token — store in ADMIN_ACTIVATED_BY (col 12)
  var acceptToken = Utilities.getUuid();
  sh.getRange(rowIndex + 2, COL.ADMIN_ACTIVATED_BY + 1).setValue(acceptToken);

  var acceptUrl = DEPLOY_URL + '?action=scrutineerAccept&id=' +
    encodeURIComponent(adminId) + '&t=' + encodeURIComponent(acceptToken);

  var name = adminRow[COL.ADMIN_NAME].toString();
  var email = adminRow[COL.ADMIN_EMAIL].toString();

  var subject = 'SSKZM OBA Elections — Scrutineer Appointment Acceptance';
  var body = '<div style="font-family:sans-serif;max-width:520px;color:#333;">' +
    '<p>Dear <strong>' + name + '</strong>,</p>' +
    '<p>You have been appointed as a <strong>Scrutineer</strong> for the SSKZM OBA election ' +
    'by the Executive Committee.</p>' +
    '<p>By clicking the button below, you accept this appointment and confirm your ' +
    'Declaration of Impartiality as required under the Elections SOP.</p>' +
    '<p style="text-align:center;margin:28px 0;">' +
      '<a href="' + acceptUrl + '" ' +
        'style="background:#1a3353;color:#ffffff;padding:14px 28px;border-radius:6px;' +
        'text-decoration:none;font-weight:600;font-size:1rem;display:inline-block;">' +
        'Accept Appointment ✓</a></p>' +
    '<p style="font-size:.85rem;color:#6b7280;">This link is personal to you. Please do not share it.<br>' +
    'If you did not expect this message or are unable to accept, please contact the Returning Officer immediately.</p>' +
    '<p style="font-size:.85rem;color:#9ca3af;">SSKZM OBA Election Management System</p>' +
    '</div>';

  var emailResult = sendEmailViaSendGrid(email, subject, body);
  if (!emailResult.success) {
    return { success: false, message: 'Account created but acceptance email failed: ' + emailResult.message };
  }

  var caller = sess ? sess.identity : 'SYSTEM';
  appendAdminLog(caller, 'scrutineer_acceptance_link_sent',
    'Acceptance link sent to Scrutineer: ' + adminId + ' (' + name + ')', '', adminId);

  return { success: true };
}

// ============================================================
// disableAdmin — set admin status to DISABLED (or re-enable)
// Access: RO_ADMIN only
// ============================================================
function disableAdmin(token, adminId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'disableAdmin');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  // Prevent disabling own account
  if (adminId.toString() === sess.identity.toString()) {
    return { success: false, message: 'You cannot disable your own account.' };
  }

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      // TEM cannot disable RO_ADMIN accounts
      if (sess.role === 'TEM' && rows[i][COL.ADMIN_ROLE].toString() === 'RO_ADMIN') {
        return { success: false, message: 'TEM cannot disable a Returning Officer account.' };
      }
      var currentStatus = rows[i][COL.ADMIN_STATUS] ? rows[i][COL.ADMIN_STATUS].toString() : 'ACTIVE';
      sh.getRange(i + 1, COL.ADMIN_STATUS + 1).setValue('DISABLED');
      sh.getRange(i + 1, COL.ADMIN_DISABLED_AT + 1).setValue(now().toISOString());
      sh.getRange(i + 1, COL.ADMIN_DISABLED_BY + 1).setValue(sess.identity);
      appendAdminLog(sess.identity, 'admin_disabled',
        'Disabled admin: ' + adminId,
        currentStatus, 'DISABLED');
      return { success: true };
    }
  }
  return { success: false, message: 'Admin not found: ' + adminId };
}

// ============================================================
// enableAdmin — re-enable a disabled admin account
// Access: RO_ADMIN only
// ============================================================
function enableAdmin(token, adminId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'enableAdmin');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      // TEM cannot enable RO_ADMIN accounts
      if (sess.role === 'TEM' && rows[i][COL.ADMIN_ROLE].toString() === 'RO_ADMIN') {
        return { success: false, message: 'TEM cannot enable a Returning Officer account.' };
      }
      sh.getRange(i + 1, COL.ADMIN_STATUS + 1).setValue('ACTIVE');
      sh.getRange(i + 1, COL.ADMIN_DISABLED_AT + 1).setValue('');
      sh.getRange(i + 1, COL.ADMIN_DISABLED_BY + 1).setValue('');
      appendAdminLog(sess.identity, 'admin_enabled',
        'Re-enabled admin: ' + adminId,
        'DISABLED', 'ACTIVE');
      return { success: true };
    }
  }
  return { success: false, message: 'Admin not found: ' + adminId };
}

// ============================================================
// activateDeputyRO — set DeputyROActivated=true for a DEPUTY_RO account
// Access: RO_ADMIN only. Requires adminId to be role DEPUTY_RO.
// ============================================================
function activateDeputyRO(token, adminId, witnessNote, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'activateDeputyRO');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      if (rows[i][COL.ADMIN_ROLE].toString() !== 'DEPUTY_RO') {
        return { success: false, message: 'Account is not a Deputy RO account.' };
      }
      if (rows[i][COL.ADMIN_STATUS].toString() === 'DISABLED') {
        return { success: false, message: 'Cannot activate a disabled account. Enable it first.' };
      }
      sh.getRange(i + 1, COL.ADMIN_DEPRO_ACTIVE + 1).setValue(true);
      sh.getRange(i + 1, COL.ADMIN_ACTIVATED_AT + 1).setValue(now().toISOString());
      sh.getRange(i + 1, COL.ADMIN_ACTIVATED_BY + 1).setValue(sess.identity);
      appendAdminLog(sess.identity, 'deputy_ro_activated',
        'Deputy RO activated: ' + adminId +
        (witnessNote ? ' | Witness note: ' + witnessNote : ''),
        'false', 'true');
      return { success: true };
    }
  }
  return { success: false, message: 'Admin not found: ' + adminId };
}

// ============================================================
// recordNoTEMDeclaration — RO records that no TEM has been appointed
// Per SOP 2A.3: where RO elects not to appoint TEM, they record
// this decision in AdminLog before nomination window opens.
// Access: RO_ADMIN only
// ============================================================
function recordNoTEMDeclaration(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied. RO only.' };

  if (!electionId) return { success: false, message: 'Election ID required.' };

  appendAdminLog(sess.identity, 'tem_not_appointed',
    'RO declaration: No Technical Election Manager appointed for this election. ' +
    'The Returning Officer will perform all technical functions personally. ' +
    'Election ID: ' + electionId,
    '', electionId);

  return { success: true,
    message: 'Declaration recorded in AdminLog. No TEM appointment required.' };
}

// ============================================================
// sendNominationCall — RO sends nomination call to all voters
// Sends email to all voters on the Voters sheet (or draft roll
// if Voters not yet populated). Logs to AdminLog.
// Access: RO_ADMIN, TEM (TEM-gated)
// ============================================================
function sendNominationCall(token, electionId, customNote, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'sendNominationCall', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) { elec = elecRows[i]; break; }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var elecTitle = elec[COL.ELEC_TITLE].toString();
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  if (elecStatus !== 'nominations_open' && elecStatus !== 'draft') {
    return { success: false, message: 'Nomination call can only be sent when nominations are open or election is in draft.' };
  }

  var vrResult = getVoterRollRows(electionId);
  var voterRows = vrResult.rows;
  if (!voterRows || voterRows.length === 0) {
    return { success: false, message: 'No voter roll available. Upload draft voter roll first.' };
  }

  var nomDeadline = elec[COL.ELEC_NOM_DEADLINE] ? elec[COL.ELEC_NOM_DEADLINE].toString() : '';
  var ecContact   = elec[COL.ELEC_EC_CONTACT] ? elec[COL.ELEC_EC_CONTACT].toString() : '';
  var sent = 0; var failed = 0;

  for (var v = 0; v < voterRows.length; v++) {
    var email = voterRows[v][COL.VOTER_EMAIL].toString().trim();
    var name  = (voterRows[v][COL.VOTER_NAME].toString() + ' ' +
                 voterRows[v][COL.VOTER_SURNAME].toString()).trim();
    if (!email) { failed++; continue; }
    var subject = 'SSKZM OBA — Nominations Now Open: ' + elecTitle;
    var body =
      '<p>Dear ' + (name || 'Member') + ',</p>' +
      '<p>Nominations are now open for the <strong>' + elecTitle + '</strong>.</p>' +
      '<p>All Life Members on the certified voter roll are eligible to nominate, ' +
      'propose, or second a candidate for any post of the Executive Committee.</p>' +
      (nomDeadline ? '<p><strong>Nomination deadline:</strong> ' + nomDeadline + '</p>' : '') +
      '<p>Please log in to the election portal to submit or support a nomination:</p>' +
      '<p><a href="' + DEPLOY_URL + '">' + DEPLOY_URL + '</a></p>' +
      (customNote ? '<p>' + customNote + '</p>' : '') +
      (ecContact ? '<p>For queries, contact: ' + ecContact + '</p>' : '') +
      '<p>SSKZM OBA Elections</p>';
    try { sendEmailViaSendGrid(email, subject, body); sent++; } catch(e) { failed++; }
  }

  appendAdminLog(sess.identity, 'nomination_call_sent',
    'Nomination call sent to ' + sent + ' voters. Failed: ' + failed + '. Election: ' + electionId,
    '', electionId);

  return { success: true,
    message: 'Nomination call sent to ' + sent + ' voters.' + (failed > 0 ? ' ' + failed + ' failed.' : '') };
}

// ============================================================
// sendVoterRollPublicationNotice — notifies all voters that
// draft voter roll is published and objection window is open.
// Access: RO_ADMIN, TEM (TEM-gated)
// ============================================================
function sendVoterRollPublicationNotice(token, electionId, objectionDeadline, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'sendVoterRollPublicationNotice', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) { elec = elecRows[i]; break; }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var elecTitle = elec[COL.ELEC_TITLE].toString();

  var vrResult = getVoterRollRows(electionId);
  var voterRows = vrResult.rows;
  if (!voterRows || voterRows.length === 0) {
    return { success: false, message: 'No voter roll to notify. Upload draft voter roll first.' };
  }

  var ecContact = elec[COL.ELEC_EC_CONTACT] ? elec[COL.ELEC_EC_CONTACT].toString() : '';
  var sent = 0; var failed = 0;

  for (var v = 0; v < voterRows.length; v++) {
    var email = voterRows[v][COL.VOTER_EMAIL].toString().trim();
    var name  = (voterRows[v][COL.VOTER_NAME].toString() + ' ' +
                 voterRows[v][COL.VOTER_SURNAME].toString()).trim();
    var roll  = voterRows[v][COL.VOTER_ROLL].toString().trim();
    if (!email) { failed++; continue; }
    var subject = 'SSKZM OBA — Draft Voter Roll Published: Verify Your Inclusion';
    var body =
      '<p>Dear ' + (name || 'Member') + ',</p>' +
      '<p>The draft voter roll for the <strong>' + elecTitle + '</strong> has been published.</p>' +
      '<p>Your details on the roll are:</p>' +
      '<p>Name: <strong>' + name + '</strong><br>Roll No: <strong>' + roll + '</strong></p>' +
      '<p>Please verify that your details are correct. If you find an error, or if you believe ' +
      'you should be on the voter roll but are not listed, please raise an objection through ' +
      'the election portal immediately.</p>' +
      (objectionDeadline ? '<p><strong>Objection window closes:</strong> ' + objectionDeadline + '</p>' : '') +
      '<p>A member who does not raise an objection during this window may not claim ' +
      'an error in their inclusion or exclusion after the voter roll is certified.</p>' +
      '<p>Log in to verify: <a href="' + DEPLOY_URL + '">' + DEPLOY_URL + '</a></p>' +
      (ecContact ? '<p>For queries, contact: ' + ecContact + '</p>' : '') +
      '<p>SSKZM OBA Elections</p>';
    try { sendEmailViaSendGrid(email, subject, body); sent++; } catch(e) { failed++; }
  }

  appendAdminLog(sess.identity, 'voter_roll_publication_notice_sent',
    'Voter roll publication notice sent to ' + sent + ' voters. Failed: ' + failed +
    '. Objection deadline: ' + (objectionDeadline || 'not specified'),
    '', electionId);

  return { success: true,
    message: 'Publication notice sent to ' + sent + ' voters.' + (failed > 0 ? ' ' + failed + ' failed.' : '') };
}

// deactivateDeputyRO — set DeputyROActivated=false
// Access: RO_ADMIN only
// ============================================================
function deactivateDeputyRO(token, adminId, witnessNote, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'deactivateDeputyRO');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
      sh.getRange(i + 1, COL.ADMIN_DEPRO_ACTIVE + 1).setValue(false);
      sh.getRange(i + 1, COL.ADMIN_ACTIVATED_AT + 1).setValue('');
      sh.getRange(i + 1, COL.ADMIN_ACTIVATED_BY + 1).setValue('');
      appendAdminLog(sess.identity, 'deputy_ro_deactivated',
        'Deputy RO deactivated: ' + adminId +
        (witnessNote ? ' | Witness note: ' + witnessNote : ''),
        'true', 'false');
      return { success: true };
    }
  }
  return { success: false, message: 'Admin not found: ' + adminId };
}

// ============================================================
// TEM AUTHORISATION MODULE — TEM3, TEM4, TEM5
// ============================================================

// TEM3 — recordROAuthorisation
// RO issues an AuthorisationID for TEM to perform specific action(s).
// Access: RO_ADMIN only
function recordROAuthorisation(token, electionId, scope, actionTypes, notes, expiresAt) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied. RO only.' };

  // Validate scope
  if (scope !== 'specific_actions' && scope !== 'ALL_ACTIONS') {
    return { success: false, message: 'Invalid scope. Must be specific_actions or ALL_ACTIONS.' };
  }

  // Validate actionTypes
  if (scope === 'specific_actions') {
    if (!Array.isArray(actionTypes) || actionTypes.length === 0) {
      return { success: false, message: 'At least one action type is required for specific_actions scope.' };
    }
    var allActions = TEM_AUTHORISABLE_ACTIONS.system.concat(TEM_AUTHORISABLE_ACTIONS.election);
    for (var i = 0; i < actionTypes.length; i++) {
      if (allActions.indexOf(actionTypes[i]) === -1) {
        return { success: false, message: 'Unknown action type: ' + actionTypes[i] };
      }
    }
  } else {
    actionTypes = [];
  }

  var authId  = 'AUTH-' + generateId();
  var now     = new Date().toISOString();
  var sh      = getSheet(SHEETS.TEM_AUTH);

  var newRow  = new Array(12).fill('');
  newRow[COL_TEMA.AUTH_ID]      = authId;
  newRow[COL_TEMA.ELECTION_ID]  = electionId;
  newRow[COL_TEMA.ISSUED_BY]    = sess.adminId;
  newRow[COL_TEMA.ISSUED_AT]    = now;
  newRow[COL_TEMA.SCOPE]        = scope;
  newRow[COL_TEMA.ACTION_TYPES] = JSON.stringify(actionTypes);
  newRow[COL_TEMA.EXPIRES_AT]   = expiresAt || '';
  newRow[COL_TEMA.USED_AT]      = '';
  newRow[COL_TEMA.USED_COUNT]   = 0;
  newRow[COL_TEMA.REVOKED]      = false;
  newRow[COL_TEMA.REVOKED_AT]   = '';
  newRow[COL_TEMA.NOTES]        = notes || '';

  sh.appendRow(newRow);

  appendAdminLog(sess.identity, 'tem_auth_issued',
    'AuthID ' + authId + ' issued | scope: ' + scope +
    ' | actions: ' + JSON.stringify(actionTypes) +
    (notes ? ' | notes: ' + notes : ''),
    'true', 'false');

  return { success: true, authId: authId, scope: scope, actionTypes: actionTypes };
}

// TEM4 — revokeROAuthorisation
// RO revokes an AuthorisationID immediately.
// Access: RO_ADMIN only
function revokeROAuthorisation(token, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied. RO only.' };

  var sh   = getSheet(SHEETS.TEM_AUTH);
  var rows = sh.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_TEMA.AUTH_ID].toString() !== authId.toString()) continue;

    if (rows[i][COL_TEMA.REVOKED] === true || rows[i][COL_TEMA.REVOKED] === 'TRUE') {
      return { success: false, message: 'AuthorisationID is already revoked.' };
    }

    sh.getRange(i + 1, COL_TEMA.REVOKED + 1).setValue(true);
    sh.getRange(i + 1, COL_TEMA.REVOKED_AT + 1).setValue(new Date().toISOString());

    appendAdminLog(sess.identity, 'tem_auth_revoked',
      'AuthID ' + authId + ' revoked by RO.',
      'true', 'false');

    return { success: true };
  }

  return { success: false, message: 'AuthorisationID not found.' };
}

// TEM5 — getTEMAuthorisations
// Returns all AuthID rows for an election.
// Access: RO_ADMIN, TEM
function getTEMAuthorisations(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  var rows    = sheetData(SHEETS.TEM_AUTH);
  var results = [];

  var filterByElec = (electionId && electionId.toString() !== 'ALL');

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (filterByElec && row[COL_TEMA.ELECTION_ID].toString() !== electionId.toString()) continue;

    var actionTypes = [];
    try { actionTypes = JSON.parse(row[COL_TEMA.ACTION_TYPES]); } catch(e) {}

    results.push({
      authId:      row[COL_TEMA.AUTH_ID].toString(),
      issuedBy:    row[COL_TEMA.ISSUED_BY].toString(),
      issuedAt:    row[COL_TEMA.ISSUED_AT] ? new Date(row[COL_TEMA.ISSUED_AT]).toISOString() : '',
      scope:       row[COL_TEMA.SCOPE].toString(),
      actionTypes: actionTypes,
      expiresAt:   row[COL_TEMA.EXPIRES_AT] ? new Date(row[COL_TEMA.EXPIRES_AT]).toISOString() : '',
      usedAt:      row[COL_TEMA.USED_AT] ? new Date(row[COL_TEMA.USED_AT]).toISOString() : '',
      usedCount:   parseInt(row[COL_TEMA.USED_COUNT]) || 0,
      revoked:     row[COL_TEMA.REVOKED] === true || row[COL_TEMA.REVOKED] === 'TRUE',
      revokedAt:   row[COL_TEMA.REVOKED_AT] ? new Date(row[COL_TEMA.REVOKED_AT]).toISOString() : '',
      notes:       row[COL_TEMA.NOTES].toString()
    });
  }

  return { success: true, authorisations: results };
}

// ============================================================
// getVoterCount — total number of voters in the roll
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER
// ============================================================
function getVoterCount(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var rows = sheetData(SHEETS.VOTERS);
  return { success: true, count: rows.length };
}

// ============================================================
// getVoterList — paginated voter list with optional search
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER
// page: 1-based. pageSize: 50. search: string (matches Roll, Name, Batch).
// Email only returned for RO_ADMIN, DEPUTY_RO, TEM.
// ============================================================
function getVoterList(token, page, search) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var showEmail = (sess.role !== 'SCRUTINEER');
  var pageSize  = 50;
  var pageNum   = (page && page > 0) ? parseInt(page) : 1;
  var query     = search ? search.toString().trim().toLowerCase() : '';

  var rows = sheetData(SHEETS.VOTERS);

  // Filter
  var filtered = query ? rows.filter(function(r) {
    return (r[COL.VOTER_ROLL].toString().toLowerCase().indexOf(query) !== -1) ||
           (r[COL.VOTER_NAME].toString().toLowerCase().indexOf(query) !== -1) ||
           (r[COL.VOTER_SURNAME].toString().toLowerCase().indexOf(query) !== -1) ||
           (r[COL.VOTER_BATCH].toString().toLowerCase().indexOf(query) !== -1);
  }) : rows;

  var total    = filtered.length;
  var start    = (pageNum - 1) * pageSize;
  var pageRows = filtered.slice(start, start + pageSize);

  var voters = pageRows.map(function(r) {
    var v = {
      roll:        r[COL.VOTER_ROLL].toString(),
      name:        r[COL.VOTER_NAME].toString() + ' ' + r[COL.VOTER_SURNAME].toString(),
      batch:       r[COL.VOTER_BATCH].toString(),
      lifeMember:  r[COL.VOTER_LIFE_MEMBER] ? !!r[COL.VOTER_LIFE_MEMBER] : false,
      emailVerified: r[COL.VOTER_EMAIL_VER] ? r[COL.VOTER_EMAIL_VER].toString() : ''
    };
    if (showEmail) v.email = r[COL.VOTER_EMAIL].toString();
    return v;
  });

  return {
    success:   true,
    voters:    voters,
    total:     total,
    page:      pageNum,
    pageSize:  pageSize,
    pages:     Math.ceil(total / pageSize)
  };
}

// ============================================================
// getAdminLogPaginated — paginated AdminLog for Log tab
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER
// page: 1-based, pageSize: 100
// filterAction: string to match ActionType (empty = all)
// ============================================================
function getAdminLogPaginated(token, page, filterAction) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var pageSize = 100;
  var pageNum  = (page && page > 0) ? parseInt(page) : 1;
  var filter   = filterAction ? filterAction.toString().trim().toLowerCase() : '';

  var rows = sheetData(SHEETS.ADMIN_LOG);

  // Most recent first
  rows = rows.slice().reverse();

  // Filter by action type
  var filtered = filter ? rows.filter(function(r) {
    return r[COL.ALOG_ACTION_TYPE].toString().toLowerCase().indexOf(filter) !== -1;
  }) : rows;

  var total    = filtered.length;
  var start    = (pageNum - 1) * pageSize;
  var pageRows = filtered.slice(start, start + pageSize);

  var entries = pageRows.map(function(r) {
    return {
      id:          r[COL.ALOG_ID].toString(),
      adminId:     r[COL.ALOG_ADMIN_ID].toString(),
      actionType:  r[COL.ALOG_ACTION_TYPE].toString(),
      description: r[COL.ALOG_DESCRIPTION].toString(),
      oldValue:    r[COL.ALOG_OLD_VALUE].toString(),
      newValue:    r[COL.ALOG_NEW_VALUE].toString(),
      timestamp:   r[COL.ALOG_TIMESTAMP].toString()
    };
  });

  return {
    success:  true,
    entries:  entries,
    total:    total,
    page:     pageNum,
    pageSize: pageSize,
    pages:    Math.ceil(total / pageSize)
  };
}

// ============================================================
// getNominations — all nominations for an election
// Access: RO_ADMIN, DEPUTY_RO, TEM
// ============================================================
function getNominations(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var rows = sheetData(SHEETS.NOMINATIONS);
  var results = [];

  rows.forEach(function(r) {
    if (electionId && r[COL.NOM_ELEC_ID].toString() !== electionId.toString()) return;
    results.push({
      id:               r[COL.NOM_ID].toString(),
      elecId:           r[COL.NOM_ELEC_ID].toString(),
      post:             r[COL.NOM_POST].toString(),
      candRoll:         r[COL.NOM_CAND_ROLL].toString(),
      candName:         r[COL.NOM_CAND_NAME].toString(),
      candBatch:        r[COL.NOM_CAND_BATCH].toString(),
      propRoll:         r[COL.NOM_PROP_ROLL].toString(),
      propConfirmed:    r[COL.NOM_PROP_CONFIRMED].toString() === 'true',
      secRoll:          r[COL.NOM_SEC_ROLL].toString(),
      secConfirmed:     r[COL.NOM_SEC_CONFIRMED].toString() === 'true',
      status:           r[COL.NOM_STATUS].toString(),
      rejectionReason:  r[COL.NOM_REJECTION].toString(),
      submittedAt:      r[COL.NOM_SUBMITTED_AT].toString(),
      entryMethod:      r[COL.NOM_ENTRY_METHOD].toString(),
      consentStatus:    r[COL.NOM_CONSENT_STATUS].toString(),
      phase2:           r[COL.NOM_PHASE2_FLAG].toString() === 'true',
      dupDeclined:      r[COL.NOM_DUP_DECLINED].toString() === 'true',
      withdrawnAt:      r[COL.NOM_WITHDRAWN_AT].toString(),
      photo:            r[COL.NOM_PHOTO].toString(),
    });
  });

  return { success: true, nominations: results };
}

// ============================================================
// withdrawNomination — RO withdraws a nomination
// Access: RO_ADMIN only. Blocked if status is accepted or later.
// ============================================================
function withdrawNomination(token, nomId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var isRO = sess.role === 'RO_ADMIN';

  var sh = getSheet(SHEETS.NOMINATIONS);
  if (!sh) return { success: false, message: 'Nominations sheet not found.' };
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.NOM_ID].toString() !== nomId.toString()) continue;

    var status = rows[i][COL.NOM_STATUS].toString();

    // Only candidate or RO may withdraw
    var candRoll = rows[i][COL.NOM_CAND_ROLL].toString();
    if (!isRO && sess.identity.toUpperCase() !== candRoll.toUpperCase()) {
      return { success: false, message: 'Only the candidate or Returning Officer may withdraw this nomination.' };
    }

    // Blocked at active and beyond unconditionally
    var blocked = ['active', 'paused', 'closed', 'declared'];
    if (blocked.indexOf(status) !== -1) {
      return { success: false, message: 'Withdrawal is no longer permitted once voting has opened.' };
    }

    // At candidates_published: permitted only within D+1 deadline (23:59:59 IST on day after publication)
    if (status === 'candidates_published') {
      var elecRows = sheetData(SHEETS.ELECTIONS);
      var elecRow = null;
      var nomElecId = rows[i][COL.NOM_ELEC_ID].toString();
      for (var e = 0; e < elecRows.length; e++) {
        if (elecRows[e][COL.ELEC_ID].toString() === nomElecId) { elecRow = elecRows[e]; break; }
      }
      var pubAt = elecRow ? elecRow[COL.ELEC_CAND_PUB_AT].toString() : '';
      if (!pubAt) {
        return { success: false, message: 'Withdrawal deadline could not be determined. Please contact the Returning Officer.' };
      }
      var deadline = getISTDeadline(pubAt);
      if (!deadline || now() > deadline) {
        var dlStr = formatISTDeadline(pubAt);
        return { success: false, message: 'The candidature withdrawal deadline has passed (' + dlStr + ' IST). Withdrawal is no longer permitted.' };
      }
    }
    if (status === 'withdrawn') {
      return { success: false, message: 'Nomination is already withdrawn.' };
    }

    sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue('withdrawn');
    sh.getRange(i + 1, COL.NOM_WITHDRAWN_AT + 1).setValue(now().toISOString());

    // Remove from Candidates sheet if a row exists for this nomination
    var candSh = getSheet(SHEETS.CANDIDATES);
    if (candSh) {
      var candRows = candSh.getDataRange().getValues();
      for (var ci = candRows.length - 1; ci >= 1; ci--) {
        if (candRows[ci][COL.CAND_NOM_ID] &&
            candRows[ci][COL.CAND_NOM_ID].toString() === nomId.toString()) {
          candSh.deleteRow(ci + 1);
          break;
        }
      }
    }

    appendAdminLog(sess.identity, 'nomination_withdrawn',
      'Nomination withdrawn: ' + nomId + ' (' +
      rows[i][COL.NOM_CAND_NAME].toString() + ' — ' +
      rows[i][COL.NOM_POST].toString() + ')',
      status, 'withdrawn');
    return { success: true };
  }
  return { success: false, message: 'Nomination not found.' };
}

// ============================================================
// resendConfirmationEmail — resend proposer or seconder email
// Access: RO_ADMIN only
// ============================================================
function resendConfirmationEmail(token, nomId, role) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };

  if (role !== 'proposer' && role !== 'seconder' && role !== 'consent') {
    return { success: false, message: 'Role must be proposer, seconder, or consent.' };
  }

  var rows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.NOM_ID].toString() === nomId.toString()) { nom = rows[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };

  // For consent role, skip proposer/seconder roll checks — handled separately below
  var roll = '';
  var confirmed = false;
  if (role !== 'consent') {
    roll = role === 'proposer' ? nom[COL.NOM_PROP_ROLL].toString()
                               : nom[COL.NOM_SEC_ROLL].toString();
    confirmed = role === 'proposer'
      ? nom[COL.NOM_PROP_CONFIRMED].toString() === 'true'
      : nom[COL.NOM_SEC_CONFIRMED].toString() === 'true';
    if (confirmed) {
      return { success: false, message: 'Already confirmed — no resend needed.' };
    }
    if (!roll) {
      return { success: false, message: 'No ' + role + ' on this nomination.' };
    }
  }

  // Look up email from Voters sheet (not needed for consent — candidate email is in nom row)
  var voters = sheetData(SHEETS.VOTERS);
  var email = '';
  if (role !== 'consent') {
    for (var j = 0; j < voters.length; j++) {
      if (voters[j][COL.VOTER_ROLL].toString() === roll) {
        email = voters[j][COL.VOTER_EMAIL].toString();
        break;
      }
    }
    if (!email) return { success: false, message: 'Could not find email for roll: ' + roll };
  }

  var confirmToken, confirmUrl, roleLabel, subject, body;

  if (role === 'consent') {
    // Resend candidate consent email (Phase 2)
    var consentStatus = nom[COL.NOM_CONSENT_STATUS].toString();
    if (consentStatus === 'accepted') {
      return { success: false, message: 'Candidate has already given consent — no resend needed.' };
    }
    var consentToken = nom[COL.NOM_CONSENT_TOKEN].toString();
    if (!consentToken) {
      return { success: false, message: 'No consent token found for this nomination.' };
    }
    var consentUrl = DEPLOY_URL + '?action=consentAccept&nomId=' +
      encodeURIComponent(nom[COL.NOM_ID].toString()) + '&token=' +
      encodeURIComponent(consentToken);
    var consentSubject = 'Reminder: Your consent required — SSKZM OBA Election Nomination';
    var consentBody =
      '<p>Dear ' + nom[COL.NOM_CAND_NAME].toString() + ',</p>' +
      '<p>You have been nominated for the post of <strong>' + nom[COL.NOM_POST].toString() +
      '</strong> in the SSKZM OBA Election.</p>' +
      '<p>Please click the link below to accept or decline this nomination:</p>' +
      '<p><a href="' + consentUrl + '">✅ Respond to Nomination</a></p>' +
      '<p>SSKZM OBA Elections</p>';
    sendEmailViaSendGrid(nom[COL.NOM_CAND_EMAIL].toString(), consentSubject, consentBody);
    appendAdminLog(sess.identity, 'consent_email_resent',
      'Consent email resent to candidate ' + nom[COL.NOM_CAND_ROLL].toString() +
      ' for nomination ' + nomId, '', nom[COL.NOM_ELEC_ID].toString());
    return { success: true, message: 'Consent email resent to candidate.' };
  }

  confirmToken = role === 'proposer'
    ? nom[COL.NOM_PROP_TOKEN].toString()
    : nom[COL.NOM_SEC_TOKEN].toString();

  confirmUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nom[COL.NOM_ID].toString()) + '&role=' + role + '&token=' +
    encodeURIComponent(confirmToken);

  roleLabel = role === 'proposer' ? 'Proposer' : 'Seconder';
  subject = 'Reminder: Please confirm your ' + roleLabel + ' role — SSKZM OBA Election';
  body =
    '<p>Dear ' + roleLabel + ',</p>' +
    '<p>This is a reminder to confirm your role as ' + roleLabel + ' for the following nomination:</p>' +
    '<p>Candidate: <strong>' + nom[COL.NOM_CAND_NAME].toString() + '</strong><br>' +
    'Post: <strong>' + nom[COL.NOM_POST].toString() + '</strong></p>' +
    '<p>Please click the link below to confirm:</p>' +
    '<p><a href="' + confirmUrl + '">✅ Confirm as ' + roleLabel + '</a></p>' +
    '<p>If you did not agree to this role, please ignore this email.</p>' +
    '<p>SSKZM OBA Elections</p>';

  try {
    sendEmailViaSendGrid(email, subject, body);
  } catch(e) {
    return { success: false, message: 'Email send failed: ' + e.toString() };
  }

  appendAdminLog(sess.identity, 'confirmation_resent',
    'Confirmation email resent to ' + role + ': ' + roll + ' for nom: ' + nomId,
    '', role);
  return { success: true };
}

// ============================================================
// SCRUTINY FUNCTIONS
// ============================================================

function getScrutinyData(token, nomId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM' && role !== 'SCRUTINEER') {
    return { success: false, message: 'Access denied.' };
  }
  if (!nomId) return { success: false, message: 'Nomination ID required.' };

  // Load nomination row
  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };

  var nomination = {
    id:              nom[COL.NOM_ID].toString(),
    elecId:          nom[COL.NOM_ELEC_ID].toString(),
    post:            nom[COL.NOM_POST].toString(),
    candRoll:        nom[COL.NOM_CAND_ROLL].toString(),
    candName:        nom[COL.NOM_CAND_NAME].toString(),
    candBatch:       nom[COL.NOM_CAND_BATCH].toString(),
    candEmail:       nom[COL.NOM_CAND_EMAIL].toString(),
    status:          nom[COL.NOM_STATUS].toString(),
    rejectionReason: nom[COL.NOM_REJECTION].toString(),
    bio:             nom[COL.NOM_BIO].toString(),
    entryMethod:     nom[COL.NOM_ENTRY_METHOD].toString(),
    reinstated:      false   // Appeals not yet built — always false for now
  };

  // Load ScrutinyLog rows for this nomination
  var scSh   = getSheet(SHEETS.SCRUTINY_LOG);
  var scData = scSh.getDataRange().getValues();
  var savedMap = {};
  for (var j = 1; j < scData.length; j++) {
    if (scData[j][COL.SCLOG_NOM_ID].toString() !== nomId) continue;
    savedMap[scData[j][COL.SCLOG_CHECK_ITEM].toString()] = {
      checkItem:   scData[j][COL.SCLOG_CHECK_ITEM].toString(),
      checkResult: scData[j][COL.SCLOG_CHECK_RESULT].toString(),
      notes:       scData[j][COL.SCLOG_NOTES].toString()
    };
  }

  // Auto-assess items 3-6 from nomination data
  // These are known facts by the time a nomination reaches confirmed status
  var autoAssess = {
    one_post: 'Yes',   // one-post gate enforced at submission; reaching confirmed means it passed
    proposer: nom[COL.NOM_PROP_CONFIRMED].toString() === 'true' ? 'Yes' : 'No',
    seconder: nom[COL.NOM_SEC_CONFIRMED].toString()  === 'true' ? 'Yes' : 'No',
    consent:  nom[COL.NOM_CONSENT_STATUS].toString() === 'accepted' ? 'Yes' :
              nom[COL.NOM_CONSENT_STATUS].toString() === ''         ? 'N/A' : 'No'
  };

  // Auto-assess tenure_bar via ECHistory.
  // TWO checks run here:
  //   (a) T2 — any non-Batch-Rep EC post, 6 consecutive years (1-year gap allowed)
  //   (b) T1 — same post, 5 pure consecutive years (no gap allowance)
  // If EITHER bar applies, result is 'No'.
  // If already saved (manual override), leave untouched.
  // Batch Reps are exempt from T2 but NOT from T1.
  var isBatchRepAuto = nom[COL.NOM_POST].toString().toLowerCase().indexOf('batch') !== -1;
  if (!savedMap['tenure_bar']) {
    var t1Result = checkT1TenureBar(nom[COL.NOM_CAND_ROLL].toString(), nom[COL.NOM_POST].toString());
    var t2Result = isBatchRepAuto
      ? { eligible: true, reason: 'Batch Representative — T2 consecutive tenure bar does not apply.' }
      : checkTenureBar(nom[COL.NOM_CAND_ROLL].toString());

    var tenureEligible = t1Result.eligible && t2Result.eligible;
    var tenureNotes    = '';
    if (!t1Result.eligible) {
      tenureNotes += '[AUTO — T1 BAR] ' + t1Result.reason;
    }
    if (!t2Result.eligible) {
      tenureNotes += (tenureNotes ? ' | ' : '') + '[AUTO — T2 BAR] ' + t2Result.reason;
    }
    if (tenureEligible) {
      tenureNotes = '[AUTO] ' + t1Result.reason + ' | ' + t2Result.reason;
    }
    tenureNotes += ' | To override: save a manual Yes/No with explanatory notes.';

    savedMap['tenure_bar'] = {
      checkItem:   'tenure_bar',
      checkResult: tenureEligible ? 'Yes' : 'No',
      notes:       tenureNotes
    };
  }

  // Auto-assess post_eligibility for President and General Secretary.
  // President: Rules P-A / P-B via checkPresidentEligibility().
  // GS: any EC capacity ≥1 year in preceding 15 years via checkGSEligibility().
  // All other posts: remain Pending for manual Scrutineer review unless already saved.
  var nomPost = nom[COL.NOM_POST].toString().trim().toLowerCase();
  if (!savedMap['post_eligibility']) {
    if (nomPost === 'president') {
      var peResult = checkPresidentEligibility(nom[COL.NOM_CAND_ROLL].toString());
      savedMap['post_eligibility'] = {
        checkItem:   'post_eligibility',
        checkResult: peResult.eligible ? 'Yes' : 'No',
        notes:       '[AUTO] President eligibility — ' + peResult.reason +
                     ' | To override: save a manual Yes/No with explanatory notes.'
      };
    } else if (nomPost === 'general secretary') {
      var gsResult = checkGSEligibility(nom[COL.NOM_CAND_ROLL].toString());
      savedMap['post_eligibility'] = {
        checkItem:   'post_eligibility',
        checkResult: gsResult.eligible ? 'Yes' : 'No',
        notes:       '[AUTO] GS eligibility — ' + gsResult.reason +
                     ' | To override: save a manual Yes/No with explanatory notes.'
      };
    }
  }

  // Merge: savedMap takes precedence over autoAssess.
  // Any item manually saved by RO/Scrutineer in ScrutinyLog always wins.
  var checklist = [];
  var ALL_ITEMS = ['post_eligibility', 'tenure_bar', 'one_post', 'proposer', 'seconder', 'consent'];
  ALL_ITEMS.forEach(function(key) {
    if (savedMap[key]) {
      checklist.push(savedMap[key]);
    } else if (autoAssess[key]) {
      checklist.push({ checkItem: key, checkResult: autoAssess[key], notes: '' });
    } else {
      checklist.push({ checkItem: key, checkResult: 'Pending', notes: '' });
    }
  });

  return { success: true, nomination: nomination, checklist: checklist };

}

// ============================================================

function saveScrutinyItem(token, nomId, checkItem, checkResult, notes) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM' && role !== 'SCRUTINEER') {
    return { success: false, message: 'Access denied.' };
  }
  if (!nomId || !checkItem || !checkResult) {
    return { success: false, message: 'Missing required fields.' };
  }

  // Load nomination to get elecId, candRoll, post
  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };

  var elecId   = nom[COL.NOM_ELEC_ID].toString();
  var candRoll = nom[COL.NOM_CAND_ROLL].toString();
  var post     = nom[COL.NOM_POST].toString();
  var ts       = now().toISOString();

  // Upsert: update existing row for this nomId + checkItem, or append new
  var scSh   = getSheet(SHEETS.SCRUTINY_LOG);
  var scData = scSh.getDataRange().getValues();
  var found  = false;
  for (var j = 1; j < scData.length; j++) {
    if (scData[j][COL.SCLOG_NOM_ID].toString()   === nomId &&
        scData[j][COL.SCLOG_CHECK_ITEM].toString() === checkItem) {
      scSh.getRange(j + 1, COL.SCLOG_CHECK_RESULT + 1).setValue(checkResult);
      scSh.getRange(j + 1, COL.SCLOG_NOTES        + 1).setValue(notes || '');
      scSh.getRange(j + 1, COL.SCLOG_LOGGED_AT    + 1).setValue(ts);
      scSh.getRange(j + 1, COL.SCLOG_LOGGED_BY    + 1).setValue(sess.identity);
      found = true;
      // continue — update ALL matching rows (handles duplicates)
    }
  }
  if (!found) {
    var newRow = new Array(18).fill('');
    newRow[COL.SCLOG_ID]           = generateId();
    newRow[COL.SCLOG_NOM_ID]       = nomId;
    newRow[COL.SCLOG_ELEC_ID]      = elecId;
    newRow[COL.SCLOG_CAND_ROLL]    = candRoll;
    newRow[COL.SCLOG_POST]         = post;
    newRow[COL.SCLOG_CHECK_ITEM]   = checkItem;
    newRow[COL.SCLOG_CHECK_RESULT] = checkResult;
    newRow[COL.SCLOG_NOTES]        = notes || '';
    newRow[COL.SCLOG_LOGGED_AT]    = ts;
    newRow[COL.SCLOG_LOGGED_BY]    = sess.identity;
    scSh.appendRow(newRow);
  }

  return { success: true };
}

// ============================================================

function acceptNomination(token, nomId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM' && role !== 'SCRUTINEER') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'acceptNomination', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null; var nomRow = -1;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; nomRow = i; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  var nomStatus = nom[COL.NOM_STATUS].toString();
  if (nomStatus !== 'confirmed' && nomStatus !== 'pending_scrutiny') {
    return { success: false, message: 'Nomination is not ready for scrutiny.' };
  }

  // One-post check: block if candidate already has any accepted nomination in this election
  var candRoll = nom[COL.NOM_CAND_ROLL].toString();
  var thisPost = nom[COL.NOM_POST].toString();
  var thisElecId = nom[COL.NOM_ELEC_ID].toString();
  for (var k = 1; k < nomData.length; k++) {
    if (k === nomRow) continue;
    if (nomData[k][COL.NOM_CAND_ROLL].toString()  === candRoll &&
        nomData[k][COL.NOM_ELEC_ID].toString()     === thisElecId &&
        nomData[k][COL.NOM_STATUS].toString()      === 'accepted') {
      var blockedPost = nomData[k][COL.NOM_POST].toString();
      return { success: false,
        message: 'Candidate ' + nom[COL.NOM_CAND_NAME].toString() +
          ' already has an accepted nomination for "' + blockedPost +
          '" in this election. One candidate may hold only one post.' };
    }
  }

  // Gate: all checklist items must be resolved (no Pending)
  var scGateSh   = getSheet(SHEETS.SCRUTINY_LOG);
  var scGateData = scGateSh.getDataRange().getValues();
  var savedItems = {};
  for (var g = 1; g < scGateData.length; g++) {
    if (scGateData[g][COL.SCLOG_NOM_ID].toString() !== nomId) continue;
    savedItems[scGateData[g][COL.SCLOG_CHECK_ITEM].toString()] =
      scGateData[g][COL.SCLOG_CHECK_RESULT].toString();
  }
  // Auto-assessed items are always resolved; only manual items need checking
  var isBatchRep = nom[COL.NOM_POST].toString().toLowerCase().indexOf('batch') !== -1;

  // post_eligibility: use saved value if present; otherwise auto-assess same as getScrutinyData
var postEligResult = savedItems['post_eligibility'];
if (!postEligResult) {
  var nomPostLower = nom[COL.NOM_POST].toString().trim().toLowerCase();
  if (nomPostLower === 'president') {
    postEligResult = checkPresidentEligibility(nom[COL.NOM_CAND_ROLL].toString()).eligible ? 'Yes' : 'No';
  } else if (nomPostLower === 'general secretary') {
    postEligResult = checkGSEligibility(nom[COL.NOM_CAND_ROLL].toString()).eligible ? 'Yes' : 'No';
  } else {
    postEligResult = 'Pending'; // other posts require manual scrutineer decision
  }
}
if (postEligResult !== 'Yes') {
  return { success: false,
    message: 'Cannot accept: Post eligibility is marked "' + postEligResult + '". Must be Yes to proceed.' };
}

  // tenure_bar: use saved value if present; otherwise auto-assess same as getScrutinyData
var tenureBarResult = savedItems['tenure_bar'];
if (!tenureBarResult) {
  var t1r = checkT1TenureBar(nom[COL.NOM_CAND_ROLL].toString(), nom[COL.NOM_POST].toString());
  var t2r = isBatchRep
    ? { eligible: true }
    : checkTenureBar(nom[COL.NOM_CAND_ROLL].toString());
  tenureBarResult = (t1r.eligible && t2r.eligible) ? 'Yes' : 'No';
}
var tenureBarOk = tenureBarResult === 'Yes' || (isBatchRep && tenureBarResult === 'N/A');
if (!tenureBarOk) {
  return { success: false,
    message: 'Cannot accept: Consecutive tenure bar is marked "' + tenureBarResult + '".' +
             (isBatchRep ? ' Must be Yes or N/A for Batch Representative.' : ' Must be Yes.') };
}

  // ── GATE N4: manual_ro nominations require 3 supporting documents ──
  var entryMethod = nom[COL.NOM_ENTRY_METHOD].toString();
  if (entryMethod === 'manual_ro') {
    var docRowsN4 = sheetData(SHEETS.DOC_STORE);
    var manualDocCount = 0;
    for (var md = 0; md < docRowsN4.length; md++) {
      if (docRowsN4[md][COL.DOC_ELEC_ID].toString()  !== thisElecId) continue;
      if (docRowsN4[md][COL.DOC_CATEGORY].toString() !== 'manual_ro_nomination') continue;
      if ((docRowsN4[md][COL.DOC_NOTES] || '').toString().indexOf('DELETED') === 0) continue;
      // Match docs linked to this specific nomination via nomRef in DOC_NOTES
      var docNotes = docRowsN4[md][COL.DOC_NOTES].toString();
      var nomRefPrefix = 'nomRef:' + nomId + '|';
      if (docNotes.indexOf(nomRefPrefix) === 0) {
        manualDocCount++;
      }
    }
    if (manualDocCount < 3) {
      return {
        success:       false,
        requiresDocs:  true,
        docsPresent:   manualDocCount,
        docsRequired:  3,
        message:       'Cannot accept: Manual RO nomination requires 3 supporting documents. ' +
                       manualDocCount + ' document(s) uploaded so far. ' +
                       'Please upload all required documents before accepting.'
      };
    }
  }

  var ts = now().toISOString();
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS         + 1).setValue('accepted');
  nomSh.getRange(nomRow + 1, COL.NOM_ONE_POST_CHECK + 1).setValue(true);

  // Auto-create Candidates row
  var candSh  = getSheet(SHEETS.CANDIDATES);
  var postOrder = 0;
  for (var p = 0; p < EC_POSTS.length; p++) {
    if (EC_POSTS[p].name === thisPost) { postOrder = EC_POSTS[p].order; break; }
  }
  var candId = generateId();
  var newCand = new Array(13).fill('');
  newCand[COL.CAND_ID]          = candId;
  newCand[COL.CAND_ELEC_ID]     = nom[COL.NOM_ELEC_ID].toString();
  newCand[COL.CAND_POST]        = thisPost;
  newCand[COL.CAND_POST_ORDER]  = postOrder;
  newCand[COL.CAND_NAME]        = nom[COL.NOM_CAND_NAME].toString();
  newCand[COL.CAND_ROLL]        = candRoll;
  newCand[COL.CAND_BATCH]       = nom[COL.NOM_CAND_BATCH].toString();
  newCand[COL.CAND_BIO]         = nom[COL.NOM_BIO].toString();
  newCand[COL.CAND_PHOTO]       = nom[COL.NOM_PHOTO].toString();
  newCand[COL.CAND_NOM_ID]      = nomId;
  candSh.appendRow(newCand);

  appendAdminLog(sess.identity, 'scrutiny_decision',
    'Nomination accepted: ' + nom[COL.NOM_CAND_NAME].toString() + ' for ' + thisPost,
    'confirmed', 'accepted');

  // Email candidate
  var candEmail = nom[COL.NOM_CAND_EMAIL].toString();
  if (candEmail) {
    try {
      sendEmailViaSendGrid(candEmail,
        'SSKZM OBA — Your Nomination has been Accepted',
        '<p>Dear ' + nom[COL.NOM_CAND_NAME].toString() + ',</p>' +
        '<p>Your nomination for the post of <strong>' + thisPost + '</strong> ' +
        'has been accepted by the Returning Officer.</p>' +
        '<p>You will appear on the ballot when voting opens.</p>' +
        '<p>SSKZM OBA Elections</p>');
    } catch(e) { /* email failure does not block acceptance */ }
  }

  return { success: true };
}

// ============================================================
// publishCandidates — sends candidature-confirmed emails to all
// accepted candidates for an election after candidates_published.
// Called from AdminJS immediately after the scrutiny→candidates_published
// status transition. Safe to call more than once (email resends).
// Access: RO_ADMIN, TEM (with AuthID)
// ============================================================
function publishCandidates(token, electionId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'publishCandidates', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  // Verify election exists and is at candidates_published
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var e = 0; e < elecRows.length; e++) {
    if (elecRows[e][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[e]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  if (elecStatus !== 'candidates_published') {
    return { success: false, message: 'Election must be at candidates_published status. Current status: ' + elecStatus + '.' };
  }

  var elecTitle   = elec[COL.ELEC_TITLE].toString();
  var pubAt       = elec[COL.ELEC_CAND_PUB_AT] ? elec[COL.ELEC_CAND_PUB_AT].toString() : now().toISOString();
  var withdrawDl  = formatISTDeadline(pubAt); // D+1 23:59 IST

  // Collect accepted nominations for this election
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var sent = 0;
  var failed = 0;
  var notified = [];

  for (var i = 0; i < nomRows.length; i++) {
    var nom = nomRows[i];
    if (nom[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (nom[COL.NOM_STATUS].toString() !== 'accepted') continue;

    var candName  = nom[COL.NOM_CAND_NAME].toString();
    var post      = nom[COL.NOM_POST].toString();
    var candEmail = nom[COL.NOM_CAND_EMAIL].toString();

    notified.push(candName + ' (' + post + ')');

    if (!candEmail) { failed++; continue; }
    try {
      sendEmailViaSendGrid(
        candEmail,
        'SSKZM OBA — Candidate List Published: ' + elecTitle,
        '<p>Dear ' + candName + ',</p>' +
        '<p>The candidate list for <strong>' + elecTitle + '</strong> has been officially published ' +
        'by the Returning Officer.</p>' +
        '<p>You are confirmed as a candidate for the post of <strong>' + post + '</strong>.</p>' +
        '<p><strong>Candidature withdrawal deadline:</strong> ' + withdrawDl + '</p>' +
        '<p>You may withdraw your candidature through the Election Portal before this deadline.</p>' +
        '<p>SSKZM OBA Returning Officer</p>'
      );
      sent++;
    } catch(e) { failed++; }
  }

  appendAdminLog(sess.identity, 'candidates_published',
    'Candidate publication emails sent: ' + sent + ' sent, ' + failed + ' failed. ' +
    'Candidates: ' + notified.join('; '),
    '', electionId);

  return {
    success:        true,
    sent:           sent,
    failed:         failed,
    withdrawDl:     withdrawDl,
    totalCandidates: notified.length,
    message:        'Publication emails sent to ' + sent + ' candidate(s).' +
                    (failed > 0 ? ' ' + failed + ' email(s) failed (no email on record).' : '')
  };
}

// ============================================================

function rejectNomination(token, nomId, reason, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'rejectNomination', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };
  if (!reason || reason.trim().length < 5) {
    return { success: false, message: 'Rejection reason is required (minimum 5 characters).' };
  }

  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null; var nomRow = -1;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; nomRow = i; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  var nomStatus = nom[COL.NOM_STATUS].toString();
  if (nomStatus !== 'confirmed' && nomStatus !== 'pending_scrutiny') {
    return { success: false, message: 'Nomination is not ready for scrutiny.' };
  }

  var ts = now().toISOString();
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS      + 1).setValue('rejected');
  nomSh.getRange(nomRow + 1, COL.NOM_REJECTION   + 1).setValue(reason.trim());
  nomSh.getRange(nomRow + 1, COL.NOM_REJECTED_AT + 1).setValue(ts);

  // Remove candidate entry if one exists for this nomination
  var candSh   = getSheet(SHEETS.CANDIDATES);
  var candData = candSh.getDataRange().getValues();
  for (var c = candData.length - 1; c >= 1; c--) {
    if (candData[c][COL.CAND_NOM_ID].toString() === nomId) {
      candSh.deleteRow(c + 1);
      break;
    }
  }

  appendAdminLog(sess.identity, 'scrutiny_decision',
    'Nomination rejected: ' + nom[COL.NOM_CAND_NAME].toString() +
    ' for ' + nom[COL.NOM_POST].toString() + '. Reason: ' + reason.trim(),
    'confirmed', 'rejected');

  // Email candidate
  var candEmail = nom[COL.NOM_CAND_EMAIL].toString();
  if (candEmail) {
    try {
      sendEmailViaSendGrid(candEmail,
        'SSKZM OBA — Your Nomination Status',
        '<p>Dear ' + nom[COL.NOM_CAND_NAME].toString() + ',</p>' +
        '<p>Your nomination for the post of <strong>' + nom[COL.NOM_POST].toString() +
        '</strong> could not be accepted.</p>' +
        '<p><strong>Reason:</strong> ' + reason.trim() + '</p>' +
        '<p>Please contact the Returning Officer if you have questions.</p>' +
        '<p>SSKZM OBA Elections</p>');
    } catch(e) { /* email failure does not block rejection */ }
  }

  return { success: true };
}

// ============================================================

function undoAcceptNomination(token, nomId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'undoAcceptNomination', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  // Block if election is at candidates_published or beyond
  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null; var nomRow = -1;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; nomRow = i; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_STATUS].toString() !== 'accepted') {
    return { success: false, message: 'Nomination is not in accepted status.' };
  }

  // Check election status
  var elecId = nom[COL.NOM_ELEC_ID].toString();
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === elecId) {
      var elecStatus = elecData[e][COL.ELEC_STATUS].toString();
      var blocked = ['candidates_published','active','paused','closed','declared'];
      if (blocked.indexOf(elecStatus) !== -1) {
        return { success: false,
          message: 'Cannot undo: candidate list has been published. Reversal is locked.' };
      }
      break;
    }
  }

  // Revert nomination to confirmed
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS         + 1).setValue('pending_scrutiny');
  nomSh.getRange(nomRow + 1, COL.NOM_ONE_POST_CHECK + 1).setValue('');

  // Delete the auto-created Candidates row
  var candSh   = getSheet(SHEETS.CANDIDATES);
  var candData = candSh.getDataRange().getValues();
  for (var c = candData.length - 1; c >= 1; c--) {
    if (candData[c][COL.CAND_NOM_ID].toString() === nomId) {
      candSh.deleteRow(c + 1);
      break;
    }
  }

  appendAdminLog(sess.identity, 'scrutiny_undo',
    'Acceptance reversed for: ' + nom[COL.NOM_CAND_NAME].toString() +
    ' (' + nom[COL.NOM_POST].toString() + '). Nomination returned to confirmed.',
    'accepted', 'confirmed');

  return { success: true };
}

// ============================================================

function undoRejectNomination(token, nomId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'undoRejectNomination', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null; var nomRow = -1;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; nomRow = i; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_STATUS].toString() !== 'rejected') {
    return { success: false, message: 'Nomination is not in rejected status.' };
  }

  // Check election status
  var elecId = nom[COL.NOM_ELEC_ID].toString();
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === elecId) {
      var elecStatus = elecData[e][COL.ELEC_STATUS].toString();
      var blocked = ['candidates_published','active','paused','closed','declared'];
      if (blocked.indexOf(elecStatus) !== -1) {
        return { success: false,
          message: 'Cannot undo: candidate list has been published. Reversal is locked.' };
      }
      break;
    }
  }

  // Revert to confirmed, clear rejection reason
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS    + 1).setValue('pending_scrutiny');
  nomSh.getRange(nomRow + 1, COL.NOM_REJECTION + 1).setValue('');

  appendAdminLog(sess.identity, 'scrutiny_undo',
    'Rejection reversed for: ' + nom[COL.NOM_CAND_NAME].toString() +
    ' (' + nom[COL.NOM_POST].toString() + '). Nomination returned to confirmed.',
    'rejected', 'confirmed');

  return { success: true };
}
// ============================================================

function getCandidatesForElection(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  if (!electionId) return { success: false, message: 'Election ID required.' };

  // Get election status
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  var elecStatus = '';
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === electionId) {
      elecStatus = elecData[e][COL.ELEC_STATUS].toString();
      break;
    }
  }

  var candSh   = getSheet(SHEETS.CANDIDATES);
  var candData = candSh.getDataRange().getValues();
  var candidates = [];
  for (var i = 1; i < candData.length; i++) {
    if (candData[i][COL.CAND_ELEC_ID].toString() !== electionId) continue;
    candidates.push({
      id:        candData[i][COL.CAND_ID].toString(),
      elecId:    electionId,
      post:      candData[i][COL.CAND_POST].toString(),
      postOrder: candData[i][COL.CAND_POST_ORDER] || 999,
      name:      candData[i][COL.CAND_NAME].toString(),
      roll:      candData[i][COL.CAND_ROLL].toString(),
      batch:     candData[i][COL.CAND_BATCH].toString(),
      bio:       candData[i][COL.CAND_BIO].toString(),
      nomId:     candData[i][COL.CAND_NOM_ID].toString()
    });
  }

  return { success: true, candidates: candidates, elecStatus: elecStatus };
}

// ============================================================

function deleteCandidate(token, candId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'deleteCandidate', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var candSh   = getSheet(SHEETS.CANDIDATES);
  var candData = candSh.getDataRange().getValues();
  var candRow = -1; var nomId = ''; var candName = ''; var post = '';
  for (var i = 1; i < candData.length; i++) {
    if (candData[i][COL.CAND_ID].toString() === candId) {
      candRow  = i;
      nomId    = candData[i][COL.CAND_NOM_ID].toString();
      candName = candData[i][COL.CAND_NAME].toString();
      post     = candData[i][COL.CAND_POST].toString();
      break;
    }
  }
  if (candRow === -1) return { success: false, message: 'Candidate not found.' };

  // Check election status lock
  var elecId   = candData[candRow][COL.CAND_ELEC_ID].toString();
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === elecId) {
      var blocked = ['candidates_published','active','paused','closed','declared'];
      if (blocked.indexOf(elecData[e][COL.ELEC_STATUS].toString()) !== -1) {
        return { success: false,
          message: 'Cannot delete: candidate list has been published.' };
      }
      break;
    }
  }

  // Delete candidate row
  candSh.deleteRow(candRow + 1);

  // Return nomination to confirmed
  if (nomId) {
    var nomSh   = getSheet(SHEETS.NOMINATIONS);
    var nomData = nomSh.getDataRange().getValues();
    for (var n = 1; n < nomData.length; n++) {
      if (nomData[n][COL.NOM_ID].toString() === nomId) {
        nomSh.getRange(n + 1, COL.NOM_STATUS         + 1).setValue('pending_scrutiny');
        nomSh.getRange(n + 1, COL.NOM_ONE_POST_CHECK + 1).setValue('');
        break;
      }
    }
  }

  appendAdminLog(sess.identity, 'candidate_deleted',
    'Candidate deleted: ' + candName + ' for ' + post +
    '. Nomination ' + nomId + ' returned to confirmed.',
    'accepted', 'confirmed');

  return { success: true };
}

// ============================================================

function getLiveTally(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','TEM','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };
  if (!electionId) return { success: false, message: 'Election ID required.' };

  // Get election status
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  var elecStatus = ''; var elecTitle = '';
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === electionId) {
      elecStatus = elecData[e][COL.ELEC_STATUS].toString();
      elecTitle  = elecData[e][COL.ELEC_TITLE].toString();
      break;
    }
  }
  if (!elecStatus) return { success: false, message: 'Election not found.' };

  // Blackout applies during active and paused
  var blackout = (elecStatus === 'active' || elecStatus === 'paused');

  // Load candidates for this election
  var candSh   = getSheet(SHEETS.CANDIDATES);
  var candData = candSh.getDataRange().getValues();
  var candMap  = {}; // candId -> candidate object
  var postMap  = {}; // postName -> { order, candidates: [] }
  EC_POSTS.forEach(function(p) {
    postMap[p.name] = { order: p.order, seatCount: p.seats, candidates: [] };
  });
  for (var c = 1; c < candData.length; c++) {
    if (candData[c][COL.CAND_ELEC_ID].toString() !== electionId) continue;
    var cid  = candData[c][COL.CAND_ID].toString();
    var post = candData[c][COL.CAND_POST].toString();
    var cobj = {
      id:    cid,
      name:  candData[c][COL.CAND_NAME].toString(),
      roll:  candData[c][COL.CAND_ROLL].toString(),
      batch: candData[c][COL.CAND_BATCH].toString(),
      post:  post,
      votes: 0
    };
    candMap[cid] = cobj;
    if (!postMap[post]) {
      postMap[post] = { order: candData[c][COL.CAND_POST_ORDER] || 999, candidates: [] };
    }
    postMap[post].candidates.push(cobj);
  }

  // Count votes from Votes sheet (only if not blackout)
  var totalVotesCast = 0;
  if (!blackout) {
    var voteSh   = getSheet(SHEETS.VOTES);
    var voteData = voteSh.getDataRange().getValues();
    for (var v = 1; v < voteData.length; v++) {
      if (voteData[v][COL.VOTE_ELEC_ID].toString() !== electionId) continue;
      var vcid = voteData[v][COL.VOTE_CAND_ID].toString();
      if (vcid === 'NOTA') {
        totalVotesCast++;
        // NOTA counted in post totals below
      } else if (candMap[vcid]) {
        candMap[vcid].votes++;
        totalVotesCast++;
      }
    }
  }

  // Count NOTA per post and participation per post from VotedLog
  var vlogSh   = getSheet(SHEETS.VOTED_LOG);
  var vlogData = vlogSh.getDataRange().getValues();
  var postParticipation = {}; // postName -> unique voter count
  var postVoters = {};        // postName -> Set (using object as set)
  for (var l = 1; l < vlogData.length; l++) {
    if (vlogData[l][COL.LOG_ELEC_ID].toString() !== electionId) continue;
    var lpost = vlogData[l][COL.LOG_POST].toString();
    var lroll = vlogData[l][COL.LOG_ROLL].toString();
    if (!postVoters[lpost]) postVoters[lpost] = {};
    postVoters[lpost][lroll] = true;
  }
  Object.keys(postVoters).forEach(function(p) {
    postParticipation[p] = Object.keys(postVoters[p]).length;
  });

  // NOTA count per post from Votes sheet (only if not blackout)
  var postNota = {};
  if (!blackout) {
    var voteSh2   = getSheet(SHEETS.VOTES);
    var voteData2 = voteSh2.getDataRange().getValues();
    for (var v2 = 1; v2 < voteData2.length; v2++) {
      if (voteData2[v2][COL.VOTE_ELEC_ID].toString() !== electionId) continue;
      if (voteData2[v2][COL.VOTE_CAND_ID].toString() === 'NOTA') {
        var npost = voteData2[v2][COL.VOTE_POST].toString();
        postNota[npost] = (postNota[npost] || 0) + 1;
      }
    }
  }

  // Build sorted post list
  var posts = Object.keys(postMap).sort(function(a, b) {
    return postMap[a].order - postMap[b].order;
  });

  var postResults = posts.map(function(postName) {
    var group       = postMap[postName];
    var participated = postParticipation[postName] || 0;
    var nota        = postNota[postName] || 0;

    var cands = group.candidates.map(function(cand) {
      return {
        id:    cand.id,
        name:  blackout ? null : cand.name,
        roll:  blackout ? null : cand.roll,
        votes: blackout ? null : cand.votes
      };
    });

    // Sort by votes descending (only when not blackout)
    if (!blackout) {
      cands.sort(function(a, b) { return b.votes - a.votes; });
    }

    return {
      post:          postName,
      order:         group.order,
      seatCount:     group.seatCount || 1,
      participated:  participated,
      nota:          blackout ? null : nota,
      candidates:    cands,
      candCount:     cands.length
    };
  });

  // Total unique voters from VotedLog
  var allVoters = {};
  for (var l2 = 1; l2 < vlogData.length; l2++) {
    if (vlogData[l2][COL.LOG_ELEC_ID].toString() !== electionId) continue;
    allVoters[vlogData[l2][COL.LOG_ROLL].toString()] = true;
  }
  var totalParticipants = Object.keys(allVoters).length;

  return {
    success:           true,
    electionId:        electionId,
    elecTitle:         elecTitle,
    elecStatus:        elecStatus,
    blackout:          blackout,
    totalParticipants: totalParticipants,
    posts:             postResults
  };
}

// ============================================================
// getObserverDashboard
// Access: OBSERVER only. Active/paused elections only.
// Returns: per-post participation counts. NO vote distribution.
// NO individual voter info. SOP Section 7.11.
// ============================================================
function getObserverDashboard(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'OBSERVER') return { success: false, message: 'Access denied.' };

  // Find active or paused election
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var election  = null;
  var priority  = ['active', 'paused'];
  for (var p = 0; p < priority.length; p++) {
    for (var e = 0; e < elecRows.length; e++) {
      if (elecRows[e][COL.ELEC_STATUS].toString() === priority[p]) {
        election = elecRows[e];
        break;
      }
    }
    if (election) break;
  }

  if (!election) {
    return {
      success:     true,
      noActiveElec: true,
      message:     'No election is currently in the voting window. Observer access is active during voting only.'
    };
  }

  var electionId    = election[COL.ELEC_ID].toString();
  var electionTitle = election[COL.ELEC_TITLE].toString();
  var elecStatus    = election[COL.ELEC_STATUS].toString();

  // Count votes cast per post from VotedLog
  var vlogData  = getSheet(SHEETS.VOTED_LOG).getDataRange().getValues();
  var postCounts = {};
  var allVoters  = {};

  for (var i = 1; i < vlogData.length; i++) {
    if (vlogData[i][COL.LOG_ELEC_ID].toString() !== electionId) continue;
    var roll = vlogData[i][COL.LOG_ROLL].toString();
    var post = vlogData[i][COL.LOG_POST].toString();
    allVoters[roll] = true;
    if (!postCounts[post]) postCounts[post] = 0;
    postCounts[post]++;
  }

  // Total eligible voters
  var voterSh    = getSheet(SHEETS.VOTERS);
  var voterRows  = voterSh.getDataRange().getValues();
  var totalEligible = Math.max(0, voterRows.length - 1);

  var totalVoted = Object.keys(allVoters).length;
  var turnoutPct = totalEligible > 0
    ? Math.round((totalVoted / totalEligible) * 1000) / 10
    : 0;

  // Build post summary — count only, no candidate info
  var postSummary = Object.keys(postCounts).map(function(p) {
    return { post: p, votesCast: postCounts[p] };
  }).sort(function(a, b) { return a.post < b.post ? -1 : 1; });

  return {
    success:        true,
    noActiveElec:   false,
    electionId:     electionId,
    electionTitle:  electionTitle,
    status:         elecStatus,
    totalEligible:  totalEligible,
    totalVoted:     totalVoted,
    turnoutPct:     turnoutPct,
    postSummary:    postSummary,
    asOf:           now().toISOString()
  };
}

// ============================================================

function getVotedLogSummary(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','TEM','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var vlogSh   = getSheet(SHEETS.VOTED_LOG);
  var vlogData = vlogSh.getDataRange().getValues();

  var allVoters = {};
  var postVoters = {};
  for (var i = 1; i < vlogData.length; i++) {
    if (vlogData[i][COL.LOG_ELEC_ID].toString() !== electionId) continue;
    var roll = vlogData[i][COL.LOG_ROLL].toString();
    var post = vlogData[i][COL.LOG_POST].toString();
    allVoters[roll] = true;
    if (!postVoters[post]) postVoters[post] = {};
    postVoters[post][roll] = true;
  }

  var postSummary = Object.keys(postVoters).map(function(p) {
    return { post: p, count: Object.keys(postVoters[p]).length };
  });

  var voterCount = getVoterCount(token);
  var totalEligible = voterCount.success ? voterCount.count : 0;
  var totalVoted    = Object.keys(allVoters).length;

  return {
    success:        true,
    totalEligible:  totalEligible,
    totalVoted:     totalVoted,
    turnoutPct:     totalEligible > 0
                      ? Math.round((totalVoted / totalEligible) * 1000) / 10
                      : 0,
    postSummary:    postSummary
  };
}

// ============================================================

function recordTallyCoSign(token, electionId, confirmation, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','SCRUTINEER','TEM'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'recordTallyCoSign', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!confirmation || confirmation.toString().trim().length < 5) {
    return { success: false, message: 'Please enter a confirmation statement (minimum 5 characters).' };
  }

  // Only allow co-sign when election is closed or declared
  var elecSh   = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === electionId) {
      var st = elecData[e][COL.ELEC_STATUS].toString();
      if (st !== 'closed' && st !== 'declared') {
        return { success: false,
          message: 'Tally co-sign is only available after the election is closed.' };
      }
      break;
    }
  }

  appendAdminLog(sess.identity, 'tally_cosign',
    'Tally co-signed for election ' + electionId + ': ' + confirmation.toString().trim(),
    '', electionId);

  return { success: true };
}

// ============================================================

function getHandoverChecklist(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','TEM','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var logSh   = getSheet(SHEETS.ADMIN_LOG);
  var logData = logSh.getDataRange().getValues();

  var items = {
    ec_locked:            { done: false, at: '', by: '' },
    voter_roll_certified: { done: false, at: '', by: '' },
    sheet_protections:    { done: false, at: '', by: '' },
    scrutineer_part_a:    { done: false, at: '', by: '' },
    version_verified:     { done: false, at: '', by: '' },
    github_transferred:   { done: false, at: '', by: '' }
  };

  for (var i = 1; i < logData.length; i++) {
    var action  = logData[i][COL.ALOG_ACTION_TYPE].toString();
    var newVal  = logData[i][COL.ALOG_NEW_VALUE].toString();
    var at      = logData[i][COL.ALOG_TIMESTAMP].toString();
    var by      = logData[i][COL.ALOG_ADMIN_ID].toString();
    var desc    = logData[i][COL.ALOG_DESCRIPTION].toString();

    if (action === 'ec_officers_locked') {
      items.ec_locked = { done: true, at: at, by: by };
    }
    if (action === 'voter_roll_certified') {
      items.voter_roll_certified = { done: true, at: at, by: by };
    }
    if (action === 'sheet_protections_applied') {
      items.sheet_protections = { done: true, at: at, by: by };
    }
    if (action === 'scrutineer_confirmation' && newVal === electionId &&
        desc.indexOf('Part A') !== -1) {
      items.scrutineer_part_a = { done: true, at: at, by: by };
    }
    if (action === 'version_verified') {
      items.version_verified = { done: true, at: at, by: by };
    }
    if (action === 'github_org_transferred') {
      items.github_transferred = { done: true, at: at, by: by };
    }
  }

  return { success: true, items: items, role: sess.role };
}

// ============================================================

function lockECOfficers(token, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'lockECOfficers');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var adminSh   = getSheet(SHEETS.ADMINS);
  var adminData = adminSh.getDataRange().getValues();
  var count = 0;

  for (var i = 1; i < adminData.length; i++) {
    if (adminData[i][COL.ADMIN_ROLE].toString() === 'EC_OFFICER' &&
        adminData[i][COL.ADMIN_STATUS].toString() !== 'DISABLED') {
      adminSh.getRange(i + 1, COL.ADMIN_STATUS      + 1).setValue('DISABLED');
      adminSh.getRange(i + 1, COL.ADMIN_DISABLED_AT + 1).setValue(now().toISOString());
      adminSh.getRange(i + 1, COL.ADMIN_DISABLED_BY + 1).setValue(sess.identity);
      count++;
    }
  }

  appendAdminLog(sess.identity, 'ec_officers_locked',
    'All EC Officer accounts disabled at handover. Count: ' + count, '', '');

  return { success: true, count: count };
}

// ============================================================

function applySheetProtections(token, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'applySheetProtections');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var ss = SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
  var me = Session.getEffectiveUser();
  var results = [];

  // ── 13 sheets to protect (owner-only edit) ──────────────────
  var toProtect = [
    SHEETS.VOTES, SHEETS.VOTED_LOG, SHEETS.VOTERS,
    SHEETS.ADMINS, SHEETS.ADMIN_LOG, SHEETS.NOMINATIONS,
    SHEETS.SCRUTINY_LOG, SHEETS.CANDIDATES, SHEETS.ELECTIONS,
    SHEETS.APPEALS, SHEETS.COMPLAINTS, SHEETS.TEM_AUTH,
    SHEETS.VOTER_ROLL_DRAFT
  ];

  toProtect.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { results.push(name + ': not found'); return; }
    var existing = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    existing.forEach(function(p) { p.remove(); });
    var prot = sh.protect().setDescription('Protected at election handover');
    prot.removeEditors(prot.getEditors());
    prot.addEditor(me);
    results.push(name + ': protected');
  });

  // ── OTPs: hide only (not in protect list) ───────────────────
  var otpSh = ss.getSheetByName(SHEETS.OTPS);
  if (otpSh) { otpSh.hideSheet(); results.push('OTPs: hidden'); }

  // ── Install onDirectEditAudit trigger ────────────────────────
  var triggerResult = installDirectEditTrigger();
  results.push('onDirectEditAudit trigger: ' + triggerResult);

  // ── Log everything ───────────────────────────────────────────
  appendAdminLog(sess.identity, 'sheet_protections_applied',
    'Sheet protections applied. ' + results.join('; '), '', '');

  return {
    success: true,
    sheetResults: results
  };
}

function installDirectEditTrigger() {
  try {
    // Remove any existing onDirectEditAudit triggers first to avoid duplicates
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(t) {
      if (t.getHandlerFunction() === 'onDirectEditAudit') {
        ScriptApp.deleteTrigger(t);
      }
    });
    // Install fresh
    ScriptApp.newTrigger('onDirectEditAudit')
      .forSpreadsheet(SYSTEM_B_SHEET_ID)
      .onEdit()
      .create();
    return 'installed successfully';
  } catch(e) {
    return 'install failed — ' + e.message;
  }
}

function onDirectEditAudit(e) {
  try {
    var sheetName  = e.range.getSheet().getName();
    var cellRef    = e.range.getA1Notation();
    var oldValue   = e.oldValue !== undefined ? e.oldValue.toString() : '(empty)';
    var newValue   = e.value    !== undefined ? e.value.toString()    : '(empty)';
    var userEmail  = (e.user && e.user.getEmail) ? e.user.getEmail() : 'unknown';
    var timestamp  = new Date().toISOString();

    // Log to AdminLog
    appendAdminLog('SYSTEM', 'DIRECT_SHEET_EDIT',
      'Direct edit by ' + userEmail + ' on sheet [' + sheetName + '] cell ' + cellRef +
      ' | Old: ' + oldValue + ' | New: ' + newValue,
      oldValue, newValue);

    // Email all active Scrutineers
    var adminSh   = getSheet(SHEETS.ADMINS);
    var adminRows = adminSh.getDataRange().getValues();
    var subject   = 'SECURITY ALERT — SSKZM OBA Election System: Direct Sheet Edit Detected';
    var body      = '<p><strong>SECURITY ALERT — SSKZM OBA Election System</strong></p>' +
      '<p>A direct edit to the election spreadsheet has been detected.</p>' +
      '<table style="border-collapse:collapse;font-family:monospace">' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>Sheet:</strong></td><td>' + sheetName + '</td></tr>' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>Cell:</strong></td><td>' + cellRef + '</td></tr>' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>Previous value:</strong></td><td>' + oldValue + '</td></tr>' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>New value:</strong></td><td>' + newValue + '</td></tr>' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>Time (UTC):</strong></td><td>' + timestamp + '</td></tr>' +
      '<tr><td style="padding:4px 12px 4px 0"><strong>Account:</strong></td><td>' + userEmail + '</td></tr>' +
      '</table>' +
      '<p>This alert has been sent to all active Scrutineers.<br>' +
      'If this edit was not authorised, contact the Returning Officer immediately.</p>';

    for (var i = 1; i < adminRows.length; i++) {
      var r = adminRows[i];
      if (r[COL.ADMIN_ROLE].toString() !== 'SCRUTINEER') continue;
      if (r[COL.ADMIN_STATUS].toString().toUpperCase() !== 'ACTIVE') continue;
      var toEmail = r[COL.ADMIN_EMAIL].toString().trim();
      if (toEmail) {
        sendEmailViaSendGrid(toEmail, subject, body);
      }
    }
  } catch(err) {
    // Silent fail — must not throw inside a trigger handler
    appendAdminLog('SYSTEM', 'DIRECT_SHEET_EDIT_TRIGGER_ERROR',
      'onDirectEditAudit error: ' + err.message, '', '');
  }
}

function removeSheetProtections(token, reason, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'removeSheetProtections');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!reason || reason.toString().trim().length < 5) {
    return { success: false, message: 'A reason must be provided to remove protections.' };
  }

  var ss = SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
  var results = [];

  // ── Remove protections from all 13 sheets ───────────────────
  var toUnprotect = [
    SHEETS.VOTES, SHEETS.VOTED_LOG, SHEETS.VOTERS,
    SHEETS.ADMINS, SHEETS.ADMIN_LOG, SHEETS.NOMINATIONS,
    SHEETS.SCRUTINY_LOG, SHEETS.CANDIDATES, SHEETS.ELECTIONS,
    SHEETS.APPEALS, SHEETS.COMPLAINTS, SHEETS.TEM_AUTH,
    SHEETS.VOTER_ROLL_DRAFT
  ];

  toUnprotect.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { results.push(name + ': not found'); return; }
    var existing = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    existing.forEach(function(p) { p.remove(); });
    results.push(name + ': unprotected');
  });

  // ── Unhide OTPs sheet ────────────────────────────────────────
  var otpSh = ss.getSheetByName(SHEETS.OTPS);
  if (otpSh) { otpSh.showSheet(); results.push('OTPs: unhidden'); }

  // ── Remove Scrutineer viewers from spreadsheet ───────────────
  var adminSh   = getSheet(SHEETS.ADMINS);
  var adminRows = adminSh.getDataRange().getValues();
  var file      = DriveApp.getFileById(SYSTEM_B_SHEET_ID);

  for (var i = 1; i < adminRows.length; i++) {
    var r = adminRows[i];
    if (r[COL.ADMIN_ROLE].toString() !== 'SCRUTINEER') continue;

    var name = r[COL.ADMIN_NAME].toString();
  }

  // ── Delete onDirectEditAudit trigger ─────────────────────────
  var triggerRemoved = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'onDirectEditAudit') {
      ScriptApp.deleteTrigger(t);
      triggerRemoved++;
    }
  });
  results.push('onDirectEditAudit trigger: ' + (triggerRemoved > 0 ? 'removed' : 'not found'));

  // ── Log with mandatory reason ────────────────────────────────
  appendAdminLog(sess.identity, 'sheet_protections_removed',
    'Sheet protections removed. Reason: ' + reason.toString().trim() +
    ' | ' + results.join('; '), '', '');

  return { success: true, results: results };
}

// ============================================================

function recordScrutineerConfirmation(token, electionId, part, confirmationText, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','TEM','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'recordScrutineerConfirmation', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var p = (part || '').toString().toUpperCase();
  if (p !== 'A' && p !== 'B') {
    return { success: false, message: 'Part must be A or B.' };
  }
  if (!confirmationText || confirmationText.toString().trim().length < 5) {
    return { success: false, message: 'Please enter a confirmation statement.' };
  }

  appendAdminLog(sess.identity, 'scrutineer_confirmation',
    'Scrutineer confirmed Part ' + p + ' for election ' + electionId +
    ': ' + confirmationText.toString().trim(),
    '', electionId);

  return { success: true };
}

// ============================================================

function getSystemStatus(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','TEM'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  // Last AdminLog entry
  var logSh   = getSheet(SHEETS.ADMIN_LOG);
  var logData = logSh.getDataRange().getValues();
  var lastLogAt = ''; var lastLogAction = '';
  if (logData.length > 1) {
    var lastRow   = logData[logData.length - 1];
    lastLogAt     = lastRow[COL.ALOG_TIMESTAMP].toString();
    lastLogAction = lastRow[COL.ALOG_ACTION_TYPE].toString();
  }

  // Sheet protection status
  var ss = SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
  var sheetsToCheck = [
    SHEETS.VOTES, SHEETS.VOTED_LOG, SHEETS.VOTERS,
    SHEETS.ADMINS, SHEETS.ADMIN_LOG
  ];
  var protectionStatus = {};
  sheetsToCheck.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { protectionStatus[name] = 'not found'; return; }
    var prots = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    protectionStatus[name] = prots.length > 0 ? 'protected' : 'unprotected';
  });

  // Version verified — check AdminLog for most recent version_verified entry
  var versionVerifiedAt = ''; var versionVerifiedBy = '';
  for (var i = logData.length - 1; i >= 1; i--) {
    if (logData[i][COL.ALOG_ACTION_TYPE].toString() === 'version_verified') {
      versionVerifiedAt = logData[i][COL.ALOG_TIMESTAMP].toString();
      versionVerifiedBy = logData[i][COL.ALOG_ADMIN_ID].toString();
      break;
    }
  }

  return {
    success:            true,
    deployUrl:          DEPLOY_URL,
    githubUrl:          'https://github.com/sskzmoba/ems',
    lastLogAt:          lastLogAt,
    lastLogAction:      lastLogAction,
    protectionStatus:   protectionStatus,
    versionVerifiedAt:  versionVerifiedAt,
    versionVerifiedBy:  versionVerifiedBy
  };
}

// ============================================================

function recordVersionVerified(token, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'recordVersionVerified');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  appendAdminLog(sess.identity, 'version_verified',
    'RO confirmed deployed version matches GitHub repository.', '', '');

  return { success: true };
}

// ============================================================

function recordGithubTransferred(token, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'recordGithubTransferred');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  appendAdminLog(sess.identity, 'github_org_transferred',
    'RO confirmed: GitHub organisation sskzmoba ownership transferred. ' +
    'Outgoing custodian removed from organisation.', '', '');

  return { success: true };
}

// ============================================================
// VOTER PANEL BACKEND FUNCTIONS
// ============================================================
 
// ============================================================
// getElectionsForVoter — returns the most relevant election
// for the voter panel status screen.
// Access: VOTER (any valid session)
// ============================================================
function getElectionsForVoter(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // EC Officers, RO_ADMIN, TEM etc. must use their own panel — not the voter gateway
  var adminRoles = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER', 'OBSERVER', 'EC_OFFICER'];
  if (adminRoles.indexOf(sess.role) !== -1) {
    return {
      success: false,
      wrongRole: true,
      message: 'This portal is for voters only. You are logged in as ' + sess.role + '. Please use your designated panel.'
    };
  }

  // Priority order: active states first, then pre-vote, then post-vote
  var priority = [
    'active', 'paused', 'candidates_published',
    'scrutiny', 'nominations_open_phase2', 'nominations_open',
    'closed', 'declared', 'draft'
  ];
  var elections = sheetData(SHEETS.ELECTIONS);
  var best = null;
  var bestP = priority.length;
  for (var i = 0; i < elections.length; i++) {
    var p = priority.indexOf(elections[i][COL.ELEC_STATUS].toString());
    if (p !== -1 && p < bestP) { best = elections[i]; bestP = p; }
  }
 
  if (!best) return { success: true, election: null };
 
  // Look up voter's batch for client-side post filtering
  var voterBatch = '';
  var voterRows = sheetData(SHEETS.VOTERS);
  for (var vb = 0; vb < voterRows.length; vb++) {
    if (voterRows[vb][COL.VOTER_ROLL].toString() === sess.identity.toString()) {
      voterBatch = voterRows[vb][COL.VOTER_BATCH].toString();
      break;
    }
  }

  return {
    success: true,
    voterBatch: voterBatch,
    election: {
      id:          best[COL.ELEC_ID].toString(),
      title:       best[COL.ELEC_TITLE].toString(),
      status:      best[COL.ELEC_STATUS].toString(),
      isTrial:     best[COL.ELEC_TRIAL].toString() === 'true',
      nomDeadline: best[COL.ELEC_NOM_DEADLINE].toString(),
      vDay:        best[COL.ELEC_VDAY].toString(),
      voteClose:   best[COL.ELEC_VOTE_CLOSE].toString(),
      declareDay:  best[COL.ELEC_DECLARE_DAY].toString(),
      ecContact:   best[COL.ELEC_EC_CONTACT].toString(),
      resultVis:   best[COL.ELEC_RESULT_VIS].toString(),
      mode:              best[COL.ELEC_MODE].toString(),
      orgSecyBatch:      best[COL.ELEC_ORGSECY_BATCH]      ? best[COL.ELEC_ORGSECY_BATCH].toString().trim()      : '',
      orgSecyRestricted: best[COL.ELEC_ORGSECY_RESTRICTED] ? best[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true' : false
    }
  };
}
 
// ============================================================
// getCandidatesForVoter — returns candidate list for the ballot.
// Candidates are shuffled per post for display fairness.
// Access: VOTER (any valid session), election must be active/paused
// ============================================================
function getCandidatesForVoter(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
 
  // Verify election is in a state where ballot is accessible
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var status = elec[COL.ELEC_STATUS].toString();
  if (status !== 'active' && status !== 'paused') {
    return { success: false, message: 'Ballot not available — election is not currently open.' };
  }
 
  var candRows = sheetData(SHEETS.CANDIDATES);

  // Load voter roll to determine this voter's batch for Batch Rep filtering
  var voterRows  = sheetData(SHEETS.VOTERS);
  var voterBatch = '';
  for (var vi = 0; vi < voterRows.length; vi++) {
    if (voterRows[vi][COL.VOTER_ROLL].toString() === sess.identity.toString()) {
      voterBatch = voterRows[vi][COL.VOTER_BATCH].toString();
      break;
    }
  }

  // Group candidates by post, in EC_POSTS order
  var postMap = {};
  for (var j = 0; j < candRows.length; j++) {
    var row = candRows[j];
    if (row[COL.CAND_ELEC_ID].toString() !== electionId.toString()) continue;
    var post = row[COL.CAND_POST].toString();

    // Batch Rep filter: only show this voter their own batch's post
    if (post.indexOf('Batch Representative') === 0) {
      var postRange = post.replace('Batch Representative', '').trim();
      var voterBracket = getBatchRepBracket(voterBatch);
      if (voterBracket !== postRange) continue;
    }

    // Org Secy filter: if restricted, only show to designated batch voters
    if (post === 'Organising Secretary') {
      var orgBatchBallot = elec[COL.ELEC_ORGSECY_BATCH].toString().trim();
      var orgRestrBallot = elec[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true';
      if (orgBatchBallot && orgRestrBallot && voterBatch !== orgBatchBallot) continue;
    }

    if (!postMap[post]) postMap[post] = { post: post, order: row[COL.CAND_POST_ORDER], candidates: [] };
    postMap[post].candidates.push({
      id:    row[COL.CAND_ID].toString(),
      name:  row[COL.CAND_NAME].toString(),
      roll:  row[COL.CAND_ROLL].toString(),
      batch: row[COL.CAND_BATCH].toString(),
      bio:   row[COL.CAND_BIO].toString(),
      photo: row[COL.CAND_PHOTO].toString(),
      seats: parseInt(row[COL.CAND_SEAT_COUNT].toString()) || 1
    });
  }
 
  // Sort posts by order, shuffle candidates within each post
  var posts = [];
  for (var key in postMap) {
    var pg = postMap[key];
    // Fisher-Yates shuffle
    var arr = pg.candidates;
    for (var k = arr.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = arr[k]; arr[k] = arr[r]; arr[r] = tmp;
    }
    posts.push({ post: pg.post, order: parseInt(pg.order) || 99, candidates: arr,
                 seatCount: arr.length > 0 ? arr[0].seats : 1 });
  }
  posts.sort(function(a, b) { return a.order - b.order; });
 
  return { success: true, posts: posts, electionTitle: elec[COL.ELEC_TITLE].toString() };
}
 
// ============================================================
// getBallotStatus — returns which posts the voter has already voted on.
// Reads VotedLog only — no vote content, no candidate identity.
// Access: VOTER (any valid session)
// ============================================================
function getBallotStatus(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
 
  var rows = sheetData(SHEETS.VOTED_LOG);
  var voted = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.LOG_ROLL].toString()    === sess.identity.toString() &&
        rows[i][COL.LOG_ELEC_ID].toString() === electionId.toString()) {
      voted.push(rows[i][COL.LOG_POST].toString());
    }
  }
  return { success: true, votedPosts: voted };
}
 
// ============================================================
// castVote — records a single post vote.
// TRUST ARCHITECTURE: Votes and VotedLog are written in the SAME
// transaction. Votes contains NO voter identity. VotedLog contains
// NO vote content. These two sheets must never be correlated.
// Access: VOTER (any valid session), election must be active
// ============================================================
function castVote(token, electionId, postName, candidateId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
 
  // 1. Verify election is active
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  if (elec[COL.ELEC_STATUS].toString() !== 'active') {
    return { success: false, message: 'Voting is not currently open.' };
  }
 
  // 2. Check voter has not already voted on this post (idempotency guard)
  var logRows = sheetData(SHEETS.VOTED_LOG);
  for (var j = 0; j < logRows.length; j++) {
    if (logRows[j][COL.LOG_ROLL].toString()    === sess.identity.toString() &&
        logRows[j][COL.LOG_ELEC_ID].toString() === electionId.toString() &&
        logRows[j][COL.LOG_POST].toString()     === postName.toString()) {
      return { success: false, message: 'You have already voted for this post.' };
    }
  }
 
  // 3. Validate candidateId is valid for this post in this election
  //    (or is 'NOTA' or 'ABSTAIN' — always valid)
  if (candidateId !== 'NOTA' && candidateId !== 'ABSTAIN') {
    var candRows = sheetData(SHEETS.CANDIDATES);
    var validCand = false;
    for (var k = 0; k < candRows.length; k++) {
      if (candRows[k][COL.CAND_ID].toString()      === candidateId.toString() &&
          candRows[k][COL.CAND_ELEC_ID].toString() === electionId.toString() &&
          candRows[k][COL.CAND_POST].toString()     === postName.toString()) {
        validCand = true; break;
      }
    }
    if (!validCand) return { success: false, message: 'Invalid candidate selection.' };
  }
 
  // 4. Write to Votes — NO voter identity
  var voteId = 'V-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000);
  var now    = new Date();
  var votesSh = getSheet(SHEETS.VOTES);
  if (!votesSh) return { success: false, message: 'Votes sheet not found.' };
  votesSh.appendRow([voteId, electionId, postName, candidateId, now]);
 
  // 5. Write to VotedLog — NO vote content
  var logSh = getSheet(SHEETS.VOTED_LOG);
  if (!logSh) return { success: false, message: 'VotedLog sheet not found.' };
  logSh.appendRow([sess.identity, electionId, postName, now]);

  // Send receipt email to voter
  try {
    var voterRows = sheetData(SHEETS.VOTERS);
    var voterEmail = '', voterName = '';
    for (var v = 0; v < voterRows.length; v++) {
      if (voterRows[v][COL.VOTER_ROLL].toString() === sess.identity.toString()) {
        voterEmail = voterRows[v][COL.VOTER_EMAIL].toString().trim();
        voterName  = voterRows[v][COL.VOTER_NAME].toString().trim();
        break;
      }
    }
    if (voterEmail) {
      var rcptSubject = 'SSKZM OBA Election — Vote Receipt for ' + postName;
      var rcptBody =
        '<p>Dear ' + voterName + ',</p>' +
        '<p>Your vote for the post of <strong>' + postName + '</strong> has been recorded.</p>' +
        '<p><strong>Your anonymous receipt token:</strong><br>' +
        '<code style="font-size:1rem;letter-spacing:.05em;">' + voteId + '</code></p>' +
        '<p>This token is anonymous — it has no mathematical relationship to your identity ' +
        'or the candidate you voted for. After results are declared, you may use this token ' +
        'on the election portal to confirm that a vote was recorded from your session.</p>' +
        '<p>If you did not cast this vote, contact the Returning Officer immediately.</p>' +
        '<p>SSKZM OBA Elections</p>';
      sendEmailViaSendGrid(voterEmail, rcptSubject, rcptBody);
    }
  } catch(emailErr) { /* non-fatal — vote is already recorded */ }

  return { success: true, receiptToken: voteId };
}
 
// ============================================================
// getMyReceipts — returns voter's own VotedLog entries.
// Returns post names and timestamps only — no vote content.
// Access: VOTER (any valid session)
// ============================================================
function getMyReceipts(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
 
  var rows = sheetData(SHEETS.VOTED_LOG);
  var receipts = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.LOG_ROLL].toString() === sess.identity.toString()) {
      var eId = rows[i][COL.LOG_ELEC_ID].toString();
      if (!electionId || eId === electionId.toString()) {
        receipts.push({
          electionId: eId,
          post:       rows[i][COL.LOG_POST].toString(),
          votedAt:    rows[i][COL.LOG_TIMESTAMP].toString()
        });
      }
    }
  }
  return { success: true, receipts: receipts };
}
 
// ============================================================
// getNominationsBoard — returns confirmed/accepted nominations
// for the public nominations board.
// Visible from nominations_open status onward.
// No roll numbers, no proposer/seconder identity returned.
// Access: VOTER (any valid session)
// ============================================================
function getNominationsBoard(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
 
  // Verify election exists and is in a visible state
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
 
  var visibleStatuses = [
    'nominations_open', 'nominations_open_phase2',
    'scrutiny', 'candidates_published', 'active', 'paused', 'closed', 'declared'
  ];
  if (visibleStatuses.indexOf(elec[COL.ELEC_STATUS].toString()) === -1) {
    return { success: false, message: 'Nominations board not yet available.' };
  }
 
  var nomRows  = sheetData(SHEETS.NOMINATIONS);
  // Which statuses to show depends on election phase:
  // During nominations/scrutiny: show 'pending_scrutiny' (all confirmations complete)
  // After candidates_published: show 'accepted' only
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  var showStatuses;
  if (elecStatus === 'candidates_published' || elecStatus === 'active' ||
      elecStatus === 'paused' || elecStatus === 'closed' || elecStatus === 'declared') {
    showStatuses = ['accepted'];
  } else {
    showStatuses = ['confirmed', 'pending_scrutiny', 'accepted'];
  }
 
  // Group by post in EC_POSTS order
  var postMap = {};
  for (var j = 0; j < nomRows.length; j++) {
    var row = nomRows[j];
    if (row[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (showStatuses.indexOf(row[COL.NOM_STATUS].toString()) === -1) continue;
    var post = row[COL.NOM_POST].toString();
    if (!postMap[post]) {
      // Find post order from EC_POSTS
      var postOrder = 99;
      for (var p = 0; p < EC_POSTS.length; p++) {
        if (EC_POSTS[p].name === post) { postOrder = EC_POSTS[p].order; break; }
      }
      postMap[post] = { post: post, order: postOrder, nominations: [] };
    }
    postMap[post].nominations.push({
      id:     row[COL.NOM_ID].toString(),
      name:   row[COL.NOM_CAND_NAME].toString(),
      batch:  row[COL.NOM_CAND_BATCH].toString(),
      bio:    row[COL.NOM_BIO].toString(),
      status: row[COL.NOM_STATUS].toString()
      // Deliberately excludes: roll, proposer roll, seconder roll
    });
  }
 
  var posts = [];
  for (var key in postMap) { posts.push(postMap[key]); }
  posts.sort(function(a, b) { return a.order - b.order; });
 
  return {
    success:       true,
    posts:         posts,
    electionTitle: elec[COL.ELEC_TITLE].toString(),
    electionStatus: elecStatus,
    candPubAt:     elec[COL.ELEC_CAND_PUB_AT] ? elec[COL.ELEC_CAND_PUB_AT].toString() : ''
  };
}

// ============================================================
// COMPLAINTS MODULE
// ============================================================


// ============================================================
// OBSERVATIONS MODULE
// Scrutineers: submit at any time during election period
// Observers: submit during active/paused voting window only
// RO/DeputyRO/TEM: read all, reply to all
// Observations + responses form part of the election record.
// ============================================================

// submitObservation — Scrutineer or Observer submits an observation
// Access: SCRUTINEER (any open election status), OBSERVER (active/paused only)
function submitObservation(token, electionId, obsText, severity) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var allowed = ['SCRUTINEER', 'OBSERVER'];
  if (allowed.indexOf(sess.role) === -1) {
    return { success: false, message: 'Access denied. Observations can only be submitted by Scrutineers or Observers.' };
  }
  if (!obsText || obsText.trim() === '') {
    return { success: false, message: 'Observation text is required.' };
  }
  // Auto-resolve electionId if not provided
  if (!electionId) {
    var autoRows = sheetData(SHEETS.ELECTIONS);
    var openStatuses = ['nominations_open','nominations_open_phase2','scrutiny',
                        'candidates_published','active','paused'];
    for (var ae = 0; ae < autoRows.length; ae++) {
      if (openStatuses.indexOf(autoRows[ae][COL.ELEC_STATUS].toString()) !== -1) {
        electionId = autoRows[ae][COL.ELEC_ID].toString();
        break;
      }
    }
    if (!electionId) return { success: false, message: 'No active election found. Cannot submit observation.' };
  }

  var validSeverity = ['info', 'concern', 'urgent'];
  var sev = (severity && validSeverity.indexOf(severity) !== -1) ? severity : 'info';

  // Status gate for Observers — active/paused only
  if (sess.role === 'OBSERVER') {
    var elecRows = sheetData(SHEETS.ELECTIONS);
    var elecStatus = '';
    for (var e = 0; e < elecRows.length; e++) {
      if (elecRows[e][COL.ELEC_ID].toString() === electionId.toString()) {
        elecStatus = elecRows[e][COL.ELEC_STATUS].toString();
        break;
      }
    }
    if (elecStatus !== 'active' && elecStatus !== 'paused') {
      return { success: false, message: 'Observer observations can only be submitted during the active voting window.' };
    }
  }

  var sh    = getSheet(SHEETS.OBSERVATIONS);
  var obsId = 'OBS-' + generateId();
  var ts    = now().toISOString();
  var obsType = sess.role === 'SCRUTINEER' ? 'scrutineer' : 'observer';

  sh.appendRow([
    obsId,
    electionId.toString(),
    sess.identity,
    ts,
    obsType,
    obsText.trim(),
    sev,
    '', '', '', 'pending'
  ]);

  appendAdminLog(sess.identity, 'observation_submitted',
    'Observation submitted | Election: ' + electionId +
    ' | Type: ' + obsType + ' | Severity: ' + sev +
    ' | ObsID: ' + obsId, '', '');

  return { success: true, obsId: obsId };
}

// getObservations — RO/DeputyRO/TEM read all; Scrutineer/Observer read own only
function getObservations(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER', 'OBSERVER'];
  if (allowed.indexOf(sess.role) === -1) {
    return { success: false, message: 'Access denied.' };
  }

  var isAdmin = (sess.role === 'RO_ADMIN' || sess.role === 'DEPUTY_RO' || sess.role === 'TEM');
  var rows = sheetData(SHEETS.OBSERVATIONS);
  var items = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row[COL_OBS.OBS_ID].toString() === '') continue;
    if (electionId && row[COL_OBS.ELEC_ID].toString() !== electionId.toString()) continue;
    if (!isAdmin && row[COL_OBS.OBSERVER_ID].toString() !== sess.identity) continue;

    items.push({
      obsId:            row[COL_OBS.OBS_ID].toString(),
      electionId:       row[COL_OBS.ELEC_ID].toString(),
      observerId:       row[COL_OBS.OBSERVER_ID].toString(),
      observedAt:       row[COL_OBS.OBSERVED_AT].toString(),
      obsType:          row[COL_OBS.OBS_TYPE].toString(),
      obsText:          row[COL_OBS.OBS_TEXT].toString(),
      severity:         row[COL_OBS.SEVERITY].toString(),
      acknowledgedBy:   row[COL_OBS.ACKNOWLEDGED_BY].toString(),
      acknowledgedAt:   row[COL_OBS.ACKNOWLEDGED_AT].toString(),
      responseText:     row[COL_OBS.RESPONSE_TEXT].toString(),
      resolutionStatus: row[COL_OBS.RESOLUTION_STATUS].toString()
    });
  }

  // Newest first
  items.sort(function(a, b) {
    return new Date(b.observedAt) - new Date(a.observedAt);
  });

  return { success: true, items: items };
}

// replyObservation — RO/DeputyRO/TEM acknowledges and replies to an observation
// Access: RO_ADMIN, DEPUTY_RO, TEM (TEM-gated)
function replyObservation(token, obsId, responseText, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'replyObservation');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!responseText || responseText.trim() === '') {
    return { success: false, message: 'Response text is required.' };
  }

  var sh   = getSheet(SHEETS.OBSERVATIONS);
  var rows = sh.getDataRange().getValues();
  var ts   = now().toISOString();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_OBS.OBS_ID].toString() !== obsId.toString()) continue;

    sh.getRange(i + 1, COL_OBS.ACKNOWLEDGED_BY   + 1).setValue(sess.identity);
    sh.getRange(i + 1, COL_OBS.ACKNOWLEDGED_AT   + 1).setValue(ts);
    sh.getRange(i + 1, COL_OBS.RESPONSE_TEXT     + 1).setValue(responseText.trim());
    sh.getRange(i + 1, COL_OBS.RESOLUTION_STATUS + 1).setValue('responded');

    appendAdminLog(sess.identity, 'observation_replied',
      'Observation replied | ObsID: ' + obsId +
      ' | Observer: ' + rows[i][COL_OBS.OBSERVER_ID].toString(), '', '');

    return { success: true };
  }

  return { success: false, message: 'Observation not found: ' + obsId };
}

// ============================================================
// fileComplaint — voter submits a complaint
// Access: any authenticated session
// ============================================================
function fileComplaint(token, electionId, complaintText, againstName, againstRoll, channel) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  if (!complaintText || complaintText.trim() === '') {
    return { success: false, message: 'Complaint text cannot be empty.' };
  }

  var sh = getSheet(SHEETS.COMPLAINTS);
  if (!sh) return { success: false, message: 'Complaints sheet not found.' };

  var id  = 'CMP-' + new Date().getTime();
  var now = new Date();
  sh.appendRow([
    id,
    electionId || '',
    sess.identity,
    now,
    (againstRoll  || '').toString().trim().substring(0, 20),
    (againstName  || '').toString().trim().substring(0, 100),
    complaintText.trim().substring(0, 1000),
    (channel      || '').toString().trim().substring(0, 100),
    '',                          // DocLinks
    'filed',                     // Status
    '',                          // RONotes
    '',                          // Resolution
    '',                          // ResolvedAt
    ''                           // ResolvedBy
  ]);

  appendAdminLog(sess.identity, 'complaint_filed',
    'Complaint filed. ID: ' + id +
    (againstName ? ' | Against: ' + againstName : ''),
    '', electionId || '');

  return { success: true, complaintId: id };
}

// ============================================================
// getComplaints — returns all complaints for an election
// Access: RO_ADMIN, DEPUTY_RO
// ============================================================
function getComplaints(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.COMPLAINTS);
  var complaints = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (electionId && r[COL_CMP.ELEC_ID].toString() !== electionId.toString()) continue;
    complaints.push({
      id:            r[COL_CMP.ID].toString(),
      electionId:    r[COL_CMP.ELEC_ID].toString(),
      filedByRoll:   r[COL_CMP.FILED_BY_ROLL].toString(),
      filedAt:       r[COL_CMP.FILED_AT].toString(),
      againstRoll:   r[COL_CMP.AGAINST_ROLL].toString(),
      againstName:   r[COL_CMP.AGAINST_NAME].toString(),
      complaintText: r[COL_CMP.COMPLAINT_TEXT].toString(),
      channel:       r[COL_CMP.CHANNEL].toString(),
      status:        r[COL_CMP.STATUS].toString(),
      roNotes:       r[COL_CMP.RO_NOTES].toString(),
      resolution:    r[COL_CMP.RESOLUTION].toString(),
      resolvedAt:    r[COL_CMP.RESOLVED_AT].toString()
    });
  }

  // Most recent first
  complaints.sort(function(a, b) {
    return new Date(b.filedAt) - new Date(a.filedAt);
  });

  return { success: true, complaints: complaints };
}

// ============================================================
// getMyComplaints — returns complaints filed by current voter
// Access: any authenticated session
// ============================================================
function getMyComplaints(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  var rows = sheetData(SHEETS.COMPLAINTS);
  var complaints = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r[COL_CMP.FILED_BY_ROLL].toString() !== sess.identity.toString()) continue;
    if (electionId && r[COL_CMP.ELEC_ID].toString() !== electionId.toString()) continue;
    complaints.push({
      id:            r[COL_CMP.ID].toString(),
      filedAt:       r[COL_CMP.FILED_AT].toString(),
      againstName:   r[COL_CMP.AGAINST_NAME].toString(),
      complaintText: r[COL_CMP.COMPLAINT_TEXT].toString(),
      channel:       r[COL_CMP.CHANNEL].toString(),
      status:        r[COL_CMP.STATUS].toString(),
      resolution:    r[COL_CMP.RESOLUTION].toString(),
      resolvedAt:    r[COL_CMP.RESOLVED_AT].toString()
    });
  }

  complaints.sort(function(a, b) {
    return new Date(b.filedAt) - new Date(a.filedAt);
  });

  return { success: true, complaints: complaints };
}

// ============================================================
// updateComplaintStatus — RO updates complaint status + notes
// Access: RO_ADMIN, DEPUTY_RO
// ============================================================
function updateComplaintStatus(token, complaintId, status, roNotes, resolution, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'updateComplaintStatus', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var validStatuses = ['filed', 'under_review', 'resolved_upheld', 'resolved_dismissed', 'referred_to_ec'];
  if (validStatuses.indexOf(status) === -1) {
    return { success: false, message: 'Invalid status.' };
  }

  var sh = getSheet(SHEETS.COMPLAINTS);
  if (!sh) return { success: false, message: 'Complaints sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_CMP.ID].toString() === complaintId.toString()) {
      var isResolved = (status === 'resolved_upheld' || status === 'resolved_dismissed');
      sh.getRange(i + 1, COL_CMP.STATUS      + 1).setValue(status);
      sh.getRange(i + 1, COL_CMP.RO_NOTES    + 1).setValue(roNotes    || '');
      sh.getRange(i + 1, COL_CMP.RESOLUTION  + 1).setValue(resolution || '');
      if (isResolved) {
        sh.getRange(i + 1, COL_CMP.RESOLVED_AT + 1).setValue(new Date());
        sh.getRange(i + 1, COL_CMP.RESOLVED_BY + 1).setValue(sess.identity);
      }
      appendAdminLog(sess.identity, 'complaint_updated',
        'Complaint ' + complaintId + ' → ' + status,
        rows[i][COL_CMP.STATUS].toString(), complaintId);
      return { success: true };
    }
  }
  return { success: false, message: 'Complaint not found.' };
}

// ============================================================
// APPEALS MODULE
// ============================================================

// ============================================================
// fileAppeal — candidate files appeal against rejection
// Access: VOTER (own rejected nomination only)
// Panel notified by email immediately on filing.
// ============================================================
function fileAppeal(token, nominationId, appealText) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  if (!appealText || appealText.trim() === '') {
    return { success: false, message: 'Appeal text cannot be empty.' };
  }

  // Find the nomination
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < nomRows.length; i++) {
    if (nomRows[i][COL.NOM_ID].toString() === nominationId.toString()) {
      nom = nomRows[i]; break;
    }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_STATUS].toString() !== 'rejected') {
    return { success: false, message: 'Appeals can only be filed against rejected nominations.' };
  }

  // ── 48-hour appeal deadline gate ─────────────────────────────
  // Deadline = ELEC_CAND_PUB_AT + 48 hours
  // Same deadline for all candidates regardless of when rejection happened.
  // Appeal button appears immediately on rejection; window closes 48hrs after
  // candidate list publication. (Design locked Session 39.)
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecRec = null;
  for (var e = 0; e < elecRows.length; e++) {
    if (elecRows[e][COL.ELEC_ID].toString() === nom[COL.NOM_ELEC_ID].toString()) {
      elecRec = elecRows[e]; break;
    }
  }
  if (elecRec) {
    var candPubAt = elecRec[COL.ELEC_CAND_PUB_AT] ? elecRec[COL.ELEC_CAND_PUB_AT].toString() : '';
    if (candPubAt) {
      var deadlineMs = new Date(candPubAt).getTime() + (48 * 60 * 60 * 1000);
      if (now().getTime() > deadlineMs) {
        return { success: false, deadlinePassed: true,
          message: 'The appeal window has closed. Appeals must be filed within 48 hours of candidate list publication.' };
      }
    }
  }
  // ─────────────────────────────────────────────────────────────

  var sh = getSheet(SHEETS.APPEALS);
  if (!sh) return { success: false, message: 'Appeals sheet not found.' };

  var id     = 'APL-' + new Date().getTime();
  var aplNow = new Date();
  sh.appendRow([
    id,
    nom[COL.NOM_ELEC_ID].toString(),
    nominationId,
    nom[COL.NOM_CAND_ROLL].toString(),
    nom[COL.NOM_CAND_NAME].toString(),
    nom[COL.NOM_POST].toString(),
    aplNow,
    appealText.trim(),
    '',           // DocLinks
    'filed',      // Status
    '',           // RONotes
    '',           // Decision
    '',           // DecidedAt
    '',           // DecidedBy
    'false',              // NomStatusUpdated
    'false',              // VotingResetRequired
    'rejection_appeal',   // AppealType
    ''                    // ObjectorRoll (N/A for rejection appeals)
  ]);

  appendAdminLog(sess.identity, 'appeal_filed',
    'Appeal filed against rejection. NomID: ' + nominationId +
    ' | Post: ' + nom[COL.NOM_POST].toString(),
    '', nom[COL.NOM_ELEC_ID].toString());

  // ── Notify Appeals Panel immediately ─────────────────────────
  var panelEmailsProp = PropertiesService.getScriptProperties().getProperty('APPEALS_PANEL_EMAILS') || '';
  var panelEmails = panelEmailsProp.split(',');
  if (panelEmails.length > 0 && panelEmailsProp) {
    var elecTitle = elecRec ? elecRec[COL.ELEC_TITLE].toString() : nom[COL.NOM_ELEC_ID].toString();
    var panelSubject = 'SSKZM OBA Election — Appeal Filed: ' + nom[COL.NOM_POST].toString();
    var panelBody =
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">' +
      '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">' +
      '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA Elections — Appeal Filed</h2>' +
      '</div>' +
      '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">' +
      '<p>An appeal against a nomination rejection has been filed and requires the attention of the Appeals Panel.</p>' +
      '<table style="border-collapse:collapse;font-size:.93rem;width:100%;margin-bottom:16px;">' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Appeal ID</td><td>' + id + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Election</td><td>' + escHtml(elecTitle) + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Candidate</td><td>' + escHtml(nom[COL.NOM_CAND_NAME].toString()) + ' (Roll ' + escHtml(nom[COL.NOM_CAND_ROLL].toString()) + ')</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Post</td><td>' + escHtml(nom[COL.NOM_POST].toString()) + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Filed at</td><td>' + fmtIST(aplNow) + '</td></tr>' +
      '</table>' +
      '<p style="font-weight:600;color:#1a3a5c;">Grounds of Appeal:</p>' +
      '<p style="background:#f9fafb;padding:12px;border-left:3px solid #b8960c;font-size:.93rem;">' + escHtml(appealText.trim()) + '</p>' +
      '<p>Please deliberate and communicate your decision to the Returning Officer. The Returning Officer will record the decision in the Election Management System.</p>' +
      '<p style="color:#888;font-size:.82rem;">SSKZM OBA Election Management System</p>' +
      '</div></div>';
    panelEmails.forEach(function(email) {
      email = email.trim();
      if (email) { try { sendEmailViaSendGrid(email, panelSubject, panelBody); } catch(e) {} }
    });
  }
  // ─────────────────────────────────────────────────────────────

  return { success: true, appealId: id };
}

// ============================================================
// fileObjection — Life Member files third-party objection against an
//   accepted nomination. Objections are batched; Appeals Panel is NOT
//   notified at filing time. Panel receives a consolidated summary email
//   when the 48-hour window closes via sendConsolidatedObjectionSummary().
// Access: VOTER (any Life Member with valid session)
// Gate: election status = candidates_published; window open (<48hr from
//   ELEC_CAND_PUB_AT); nomination status = accepted; one objection per
//   member per nomination.
// ============================================================
function fileObjection(token, nominationId, groundsType, objectionText) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  if (!groundsType || groundsType.trim() === '') {
    return { success: false, message: 'Please select the grounds for your objection.' };
  }
  if (!objectionText || objectionText.trim() === '') {
    return { success: false, message: 'Please provide details in support of your objection.' };
  }

  // ── Locate nomination ────────────────────────────────────────
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < nomRows.length; i++) {
    if (nomRows[i][COL.NOM_ID].toString() === nominationId.toString()) {
      nom = nomRows[i]; break;
    }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_STATUS].toString() !== 'accepted') {
    return { success: false, message: 'Objections can only be filed against accepted nominations.' };
  }

  // ── Block self-objection ─────────────────────────────────────
  if (nom[COL.NOM_CAND_ROLL].toString() === sess.identity.toString()) {
    return { success: false, message: 'You cannot file an objection against your own nomination.' };
  }

  // ── Election record + status gate ───────────────────────────
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecRec = null;
  for (var e = 0; e < elecRows.length; e++) {
    if (elecRows[e][COL.ELEC_ID].toString() === nom[COL.NOM_ELEC_ID].toString()) {
      elecRec = elecRows[e]; break;
    }
  }
  if (!elecRec) return { success: false, message: 'Election record not found.' };
  if (elecRec[COL.ELEC_STATUS].toString() !== 'candidates_published') {
    return { success: false, message: 'Objections can only be filed during the candidates published phase.' };
  }

  // ── 48-hour window gate ──────────────────────────────────────
  var candPubAt = elecRec[COL.ELEC_CAND_PUB_AT] ? elecRec[COL.ELEC_CAND_PUB_AT].toString() : '';
  if (!candPubAt) return { success: false, message: 'Candidate list publication timestamp not found.' };
  var deadlineMs = new Date(candPubAt).getTime() + (48 * 60 * 60 * 1000);
  if (now().getTime() > deadlineMs) {
    return { success: false, deadlinePassed: true,
      message: 'The objection window has closed. Objections must be filed within 48 hours of candidate list publication.' };
  }

  // ── One objection per member per nomination ──────────────────
  var aplRows = sheetData(SHEETS.APPEALS);
  for (var a = 0; a < aplRows.length; a++) {
    var ar = aplRows[a];
    if (ar[COL_APL.NOM_ID].toString()       === nominationId.toString() &&
        ar[COL_APL.APPEAL_TYPE].toString()  === 'nomination_objection' &&
        ar[COL_APL.OBJECTOR_ROLL].toString()=== sess.identity.toString()) {
      return { success: false, message: 'You have already filed an objection against this nomination.' };
    }
  }

  // ── Write objection row ──────────────────────────────────────
  var sh = getSheet(SHEETS.APPEALS);
  if (!sh) return { success: false, message: 'Appeals sheet not found.' };

  var id     = 'OBJ-' + new Date().getTime();
  var objNow = new Date();
  var fullText = 'Grounds: ' + groundsType.trim() + '\n\nDetails: ' + objectionText.trim();

  sh.appendRow([
    id,
    nom[COL.NOM_ELEC_ID].toString(),
    nominationId,
    nom[COL.NOM_CAND_ROLL].toString(),
    nom[COL.NOM_CAND_NAME].toString(),
    nom[COL.NOM_POST].toString(),
    objNow,
    fullText,
    '',           // DocLinks
    'filed',      // Status
    '',           // RONotes
    '',           // Decision
    '',           // DecidedAt
    '',           // DecidedBy
    'false',      // NomStatusUpdated
    'false',      // VotingResetRequired
    'nomination_objection',
    sess.identity.toString()  // ObjectorRoll
  ]);

  appendAdminLog(sess.identity, 'objection_filed',
    'Objection filed against accepted nomination. NomID: ' + nominationId +
    ' | Candidate: ' + nom[COL.NOM_CAND_NAME].toString() +
    ' | Post: ' + nom[COL.NOM_POST].toString() +
    ' | Grounds: ' + groundsType.trim(),
    '', nom[COL.NOM_ELEC_ID].toString());

  // ── Notify RO immediately (awareness only) ───────────────────
  var roEmail = PropertiesService.getScriptProperties().getProperty('RO_CONTACT_EMAIL') || '';
  if (roEmail) {
    var elecTitle = elecRec[COL.ELEC_TITLE].toString();
    var roSubject = 'SSKZM OBA Election — Objection Filed: ' + nom[COL.NOM_POST].toString();
    var roBody =
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">' +
      '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">' +
      '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA Elections — Objection Filed</h2>' +
      '</div>' +
      '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">' +
      '<p>A third-party objection has been filed against an accepted nomination. No action is required at this stage. ' +
      'The objection window closes 48 hours after candidate list publication. ' +
      'You will receive a consolidated summary at that time if any objections remain open.</p>' +
      '<table style="border-collapse:collapse;font-size:.93rem;width:100%;margin-bottom:16px;">' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Objection ID</td><td>' + id + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Election</td><td>' + escHtml(elecTitle) + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Candidate</td><td>' + escHtml(nom[COL.NOM_CAND_NAME].toString()) + ' (Roll ' + escHtml(nom[COL.NOM_CAND_ROLL].toString()) + ')</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Post</td><td>' + escHtml(nom[COL.NOM_POST].toString()) + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Grounds</td><td>' + escHtml(groundsType.trim()) + '</td></tr>' +
      '<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#1a3a5c;white-space:nowrap;">Filed at</td><td>' + fmtIST(objNow) + '</td></tr>' +
      '</table>' +
      '<p style="color:#888;font-size:.82rem;">SSKZM OBA Election Management System</p>' +
      '</div></div>';
    try { sendEmailViaSendGrid(roEmail, roSubject, roBody); } catch(e) {}
  }

  return { success: true, objectionId: id };
}

// ============================================================
// sendConsolidatedObjectionSummary — fires when the 48-hour objection
//   window closes (triggered by RO via admin panel button).
//   Groups all filed objections by candidate and sends ONE email to
//   the Appeals Panel listing all objectors and grounds per candidate.
//   Also emails RO with the same summary for records.
// Access: RO_ADMIN, DEPUTY_RO, TEM
// ============================================================
function sendConsolidatedObjectionSummary(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  // ── Collect all filed objections for this election ───────────
  var aplRows = sheetData(SHEETS.APPEALS);
  var grouped = {};  // keyed by nomId
  for (var i = 0; i < aplRows.length; i++) {
    var r = aplRows[i];
    if (r[COL_APL.ELEC_ID].toString()    !== electionId.toString()) continue;
    if (r[COL_APL.APPEAL_TYPE].toString() !== 'nomination_objection') continue;
    if (r[COL_APL.STATUS].toString()      !== 'filed') continue;
    var nomId = r[COL_APL.NOM_ID].toString();
    if (!grouped[nomId]) {
      grouped[nomId] = {
        candName: r[COL_APL.CAND_NAME].toString(),
        candRoll: r[COL_APL.CAND_ROLL].toString(),
        post:     r[COL_APL.POST].toString(),
        objections: []
      };
    }
    grouped[nomId].objections.push({
      id:           r[COL_APL.ID].toString(),
      objectorRoll: r[COL_APL.OBJECTOR_ROLL].toString(),
      text:         r[COL_APL.APPEAL_TEXT].toString(),
      filedAt:      r[COL_APL.FILED_AT] ? fmtIST(new Date(r[COL_APL.FILED_AT].toString())) : ''
    });
  }

  var nomIds = Object.keys(grouped);
  if (nomIds.length === 0) {
    return { success: true, message: 'No open objections found for this election. No email sent.' };
  }

  // ── Fetch election record for title + deadline ───────────────
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecRec = null;
  for (var e = 0; e < elecRows.length; e++) {
    if (elecRows[e][COL.ELEC_ID].toString() === electionId.toString()) {
      elecRec = elecRows[e]; break;
    }
  }
  var elecTitle = elecRec ? elecRec[COL.ELEC_TITLE].toString() : electionId;
  var candPubAt = elecRec && elecRec[COL.ELEC_CAND_PUB_AT] ? elecRec[COL.ELEC_CAND_PUB_AT].toString() : '';
  var panelDeadline = candPubAt
    ? fmtIST(new Date(new Date(candPubAt).getTime() + (96 * 60 * 60 * 1000)))
    : 'as soon as possible';

  // ── Build email body ─────────────────────────────────────────
  var candidateBlocks = '';
  nomIds.forEach(function(nomId) {
    var g = grouped[nomId];
    candidateBlocks +=
      '<div style="margin-bottom:24px;padding:16px;border:1px solid #ddd;border-left:4px solid #b8960c;">' +
      '<p style="margin:0 0 8px;font-weight:700;color:#1a3a5c;font-size:1rem;">' +
      escHtml(g.candName) + ' (Roll ' + escHtml(g.candRoll) + ') — ' + escHtml(g.post) + '</p>' +
      '<p style="margin:0 0 8px;font-size:.88rem;color:#555;">' + g.objections.length + ' objection(s) received:</p>';
    g.objections.forEach(function(obj, idx) {
      candidateBlocks +=
        '<div style="margin-bottom:12px;padding:10px;background:#f9fafb;font-size:.9rem;">' +
        '<p style="margin:0 0 4px;font-weight:600;">Objection ' + (idx+1) + ' — ID: ' + escHtml(obj.id) + '</p>' +
        '<p style="margin:0 0 4px;color:#555;">Objector Roll: ' + escHtml(obj.objectorRoll) + ' | Filed: ' + escHtml(obj.filedAt) + '</p>' +
        '<p style="margin:0;white-space:pre-wrap;">' + escHtml(obj.text) + '</p>' +
        '</div>';
    });
    candidateBlocks += '</div>';
  });

  var subject = 'SSKZM OBA Election — Objection Window Closed: ' + nomIds.length + ' candidate(s) with objection(s)';
  var body =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
    '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">' +
    '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA Elections — Consolidated Objection Summary</h2>' +
    '</div>' +
    '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">' +
    '<p>The 48-hour objection window has closed for <strong>' + escHtml(elecTitle) + '</strong>.</p>' +
    '<p>The following objections were received and require the attention of the Appeals Panel. ' +
    'Please deliberate and communicate your decisions to the Returning Officer by <strong>' + panelDeadline + '</strong>.</p>' +
    candidateBlocks +
    '<p style="font-size:.88rem;color:#555;">Each objection must be decided as a consolidated proceeding per candidate. ' +
    'The decision of the Appeals Panel is final for the purposes of this election. ' +
    'Please communicate your decision with reasons to the Returning Officer who will record it in the system.</p>' +
    '<p style="color:#888;font-size:.82rem;">SSKZM OBA Election Management System</p>' +
    '</div></div>';

  // ── Send to Appeals Panel ────────────────────────────────────
  var panelEmailsProp = PropertiesService.getScriptProperties().getProperty('APPEALS_PANEL_EMAILS') || '';
  var panelEmails = panelEmailsProp.split(',');
  var sent = 0;
  panelEmails.forEach(function(email) {
    email = email.trim();
    if (email) { try { sendEmailViaSendGrid(email, subject, body); sent++; } catch(e) {} }
  });

  // ── Send copy to RO ──────────────────────────────────────────
  var roEmail = PropertiesService.getScriptProperties().getProperty('RO_CONTACT_EMAIL') || '';
  if (roEmail) { try { sendEmailViaSendGrid(roEmail, '[RO COPY] ' + subject, body); } catch(e) {} }

  appendAdminLog(sess.identity, 'objection_summary_sent',
    'Consolidated objection summary sent to Appeals Panel. Candidates with objections: ' + nomIds.length +
    ' | Panel recipients: ' + sent,
    '', electionId);

  return {
    success: true,
    candidatesWithObjections: nomIds.length,
    totalObjections: nomIds.reduce(function(sum, k) { return sum + grouped[k].objections.length; }, 0),
    panelRecipients: sent
  };
}

// ============================================================
// storeAppealDocument — candidate uploads supporting document for appeal
// Stored in DocStore with category 'appeal_support'; aplRef links to APL-ID
// Access: VOTER only
// ============================================================
function storeAppealDocument(token, electionId, appealId, filename, base64Data, mimeType) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'VOTER') return { success: false, message: 'Access denied.' };

  if (!electionId || !appealId || !filename || !base64Data) {
    return { success: false, message: 'Missing required fields.' };
  }
  if (base64Data.length > 7000000) {
    return { success: false, message: 'File too large. Maximum size is 5MB.' };
  }

  // Verify the appeal belongs to this voter
  var aplRows = sheetData(SHEETS.APPEALS);
  var apl = null;
  for (var a = 0; a < aplRows.length; a++) {
    if (aplRows[a][COL_APL.ID].toString() === appealId.toString()) {
      apl = aplRows[a]; break;
    }
  }
  if (!apl) return { success: false, message: 'Appeal not found.' };
  if (apl[COL_APL.CAND_ROLL].toString() !== sess.identity.toString()) {
    return { success: false, message: 'Access denied — this appeal does not belong to you.' };
  }

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecTitle = electionId;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elecTitle = elecRows[i][COL.ELEC_TITLE].toString(); break;
    }
  }

  try {
    var decoded  = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType || 'application/octet-stream', filename);
    var folder   = getOrCreateElectionFolder(electionId, elecTitle);
    var file     = folder.createFile(decoded);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var driveUrl = file.getUrl();

    var docId  = 'DOC-' + electionId + '-' + Date.now();
    var docSh  = getSheet(SHEETS.DOC_STORE);
    var newRow = [];
    newRow[COL.DOC_ID]            = docId;
    newRow[COL.DOC_ELEC_ID]       = electionId;
    newRow[COL.DOC_CATEGORY]      = 'appeal_support';
    newRow[COL.DOC_UPLOADER_ROLL] = sess.identity;
    newRow[COL.DOC_UPLOADER_ROLE] = sess.role;
    newRow[COL.DOC_FILENAME]      = filename;
    newRow[COL.DOC_GDRIVE_URL]    = driveUrl;
    newRow[COL.DOC_UPLOADED_AT]   = new Date().toISOString();
    newRow[COL.DOC_NOTES]         = 'aplRef:' + appealId;
    newRow[COL.DOC_LINKED_TAB]    = 'Appeals';
    docSh.appendRow(newRow);

    // Update DOC_LINKS field on the appeal row
    var aplSh   = getSheet(SHEETS.APPEALS);
    var aplData = aplSh.getDataRange().getValues();
    for (var r = 1; r < aplData.length; r++) {
      if (aplData[r][COL_APL.ID].toString() === appealId.toString()) {
        var existing = aplData[r][COL_APL.DOC_LINKS].toString().trim();
        var updated  = existing ? existing + ',' + docId : docId;
        aplSh.getRange(r + 1, COL_APL.DOC_LINKS + 1).setValue(updated);
        break;
      }
    }

    appendAdminLog(sess.identity, 'appeal_document_uploaded',
      'Supporting document uploaded for appeal ' + appealId + ' | File: ' + filename + ' | DocID: ' + docId,
      '', electionId);

    return { success: true, docId: docId, driveUrl: driveUrl };
  } catch(err) {
    return { success: false, message: 'Upload failed: ' + err.toString() };
  }
}

// ============================================================
// storeAppealRuling — RO uploads Appeals Panel ruling document
// Stored in DocStore with category 'appeal_ruling'; aplRef links to APL-ID
// Access: RO_ADMIN, TEM
// ============================================================
function storeAppealRuling(token, electionId, appealId, filename, base64Data, mimeType, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'storeAppealRuling', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message }; 

  if (!electionId || !appealId || !filename || !base64Data) {
    return { success: false, message: 'Missing required fields.' };
  }
  if (base64Data.length > 7000000) {
    return { success: false, message: 'File too large. Maximum size is 5MB.' };
  }

  // Verify appeal exists
  var aplRows = sheetData(SHEETS.APPEALS);
  var apl = null;
  for (var a = 0; a < aplRows.length; a++) {
    if (aplRows[a][COL_APL.ID].toString() === appealId.toString()) {
      apl = aplRows[a]; break;
    }
  }
  if (!apl) return { success: false, message: 'Appeal not found.' };

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecTitle = electionId;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elecTitle = elecRows[i][COL.ELEC_TITLE].toString(); break;
    }
  }

  try {
    var decoded  = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType || 'application/octet-stream', filename);
    var folder   = getOrCreateElectionFolder(electionId, elecTitle);
    var file     = folder.createFile(decoded);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var driveUrl = file.getUrl();

    var docId  = 'DOC-' + electionId + '-' + Date.now();
    var docSh  = getSheet(SHEETS.DOC_STORE);
    var newRow = [];
    newRow[COL.DOC_ID]            = docId;
    newRow[COL.DOC_ELEC_ID]       = electionId;
    newRow[COL.DOC_CATEGORY]      = 'appeal_ruling';
    newRow[COL.DOC_UPLOADER_ROLL] = sess.identity;
    newRow[COL.DOC_UPLOADER_ROLE] = sess.role;
    newRow[COL.DOC_FILENAME]      = filename;
    newRow[COL.DOC_GDRIVE_URL]    = driveUrl;
    newRow[COL.DOC_UPLOADED_AT]   = new Date().toISOString();
    newRow[COL.DOC_NOTES]         = 'aplRef:' + appealId;
    newRow[COL.DOC_LINKED_TAB]    = 'Appeals';
    docSh.appendRow(newRow);

    // Update DOC_LINKS field on the appeal row
    var aplSh   = getSheet(SHEETS.APPEALS);
    var aplData = aplSh.getDataRange().getValues();
    for (var r = 1; r < aplData.length; r++) {
      if (aplData[r][COL_APL.ID].toString() === appealId.toString()) {
        var existing = aplData[r][COL_APL.DOC_LINKS].toString().trim();
        var updated  = existing ? existing + ',' + docId : docId;
        aplSh.getRange(r + 1, COL_APL.DOC_LINKS + 1).setValue(updated);
        break;
      }
    }

    appendAdminLog(sess.identity, 'appeal_ruling_uploaded',
      'Appeals Panel ruling uploaded for appeal ' + appealId + ' | File: ' + filename + ' | DocID: ' + docId,
      '', electionId);

    return { success: true, docId: docId, driveUrl: driveUrl };
  } catch(err) {
    return { success: false, message: 'Upload failed: ' + err.toString() };
  }
}

// ============================================================
// getAppeals — returns all appeals for an election
// Access: RO_ADMIN, DEPUTY_RO, SCRUTINEER
// ============================================================
function getAppeals(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'SCRUTINEER' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  var rows = sheetData(SHEETS.APPEALS);
  var appeals = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (electionId && r[COL_APL.ELEC_ID].toString() !== electionId.toString()) continue;
    appeals.push({
      id:          r[COL_APL.ID].toString(),
      electionId:  r[COL_APL.ELEC_ID].toString(),
      nomId:       r[COL_APL.NOM_ID].toString(),
      candRoll:    r[COL_APL.CAND_ROLL].toString(),
      candName:    r[COL_APL.CAND_NAME].toString(),
      post:        r[COL_APL.POST].toString(),
      filedAt:     r[COL_APL.FILED_AT].toString(),
      appealText:  r[COL_APL.APPEAL_TEXT].toString(),
      status:      r[COL_APL.STATUS].toString(),
      roNotes:     r[COL_APL.RO_NOTES].toString(),
      decision:    r[COL_APL.DECISION].toString(),
      decidedAt:   r[COL_APL.DECIDED_AT].toString(),
      appealType:  r[COL_APL.APPEAL_TYPE]  ? r[COL_APL.APPEAL_TYPE].toString()  : 'rejection_appeal',
      objectorRoll:r[COL_APL.OBJECTOR_ROLL]? r[COL_APL.OBJECTOR_ROLL].toString(): ''
    });
  }

  appeals.sort(function(a, b) {
    return new Date(b.filedAt) - new Date(a.filedAt);
  });

  return { success: true, appeals: appeals };
}

// ============================================================
// updateAppealDecision — RO records Appeals Panel decision
// The Appeals Panel decides independently offline; RO records decision here.
// If upheld: nomination reinstated to pending_scrutiny + election rolled back
//            to scrutiny status so RO can re-scrutinise and re-publish.
// Candidate notified by email on upheld or dismissed.
// Access: RO_ADMIN, TEM (D-V6)
// ============================================================
function updateAppealDecision(token, appealId, decision, roNotes, decisionText, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'updateAppealDecision', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var validDecisions = ['filed', 'under_review', 'upheld', 'dismissed', 'panel_no_response'];
  if (validDecisions.indexOf(decision) === -1) {
    return { success: false, message: 'Invalid decision.' };
  }

  var sh = getSheet(SHEETS.APPEALS);
  if (!sh) return { success: false, message: 'Appeals sheet not found.' };

  var rows = sh.getDataRange().getValues();
  var appealRow = null;
  var appealRowIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL_APL.ID].toString() === appealId.toString()) {
      appealRow = rows[i]; appealRowIdx = i; break;
    }
  }
  if (!appealRow) return { success: false, message: 'Appeal not found.' };

  var isDecided = (decision === 'upheld' || decision === 'dismissed');
  sh.getRange(appealRowIdx + 1, COL_APL.STATUS   + 1).setValue(decision);
  sh.getRange(appealRowIdx + 1, COL_APL.RO_NOTES + 1).setValue(roNotes    || '');
  sh.getRange(appealRowIdx + 1, COL_APL.DECISION + 1).setValue(decisionText || '');
  if (isDecided) {
    sh.getRange(appealRowIdx + 1, COL_APL.DECIDED_AT + 1).setValue(new Date());
    sh.getRange(appealRowIdx + 1, COL_APL.DECIDED_BY + 1).setValue(sess.identity);
  }

  var elecId       = appealRow[COL_APL.ELEC_ID].toString();
  var candName     = appealRow[COL_APL.CAND_NAME].toString();
  var candRoll     = appealRow[COL_APL.CAND_ROLL].toString();
  var post         = appealRow[COL_APL.POST].toString();

  // ── If upheld: reinstate nomination + roll election back to scrutiny ──
  if (decision === 'upheld') {
    var nomId = appealRow[COL_APL.NOM_ID].toString();

    // Reinstate nomination
    var nomSh = getSheet(SHEETS.NOMINATIONS);
    if (nomSh) {
      var nomRows = nomSh.getDataRange().getValues();
      for (var j = 1; j < nomRows.length; j++) {
        if (nomRows[j][COL.NOM_ID].toString() === nomId) {
          nomSh.getRange(j + 1, COL.NOM_STATUS + 1).setValue('pending_scrutiny');
          nomSh.getRange(j + 1, COL.NOM_REJECTION + 1).setValue('');
          break;
        }
      }
    }
    sh.getRange(appealRowIdx + 1, COL_APL.NOM_STATUS_UPDATED + 1).setValue('true');

    // Roll election back: candidates_published → scrutiny
    // Clear ELEC_CAND_PUB_AT so appeal window resets after re-publication
    var elecSh   = getSheet(SHEETS.ELECTIONS);
    var elecData = elecSh.getDataRange().getValues();
    for (var e = 1; e < elecData.length; e++) {
      if (elecData[e][COL.ELEC_ID].toString() === elecId) {
        var currentElecStatus = elecData[e][COL.ELEC_STATUS].toString();
        if (currentElecStatus === 'candidates_published') {
          elecSh.getRange(e + 1, COL.ELEC_STATUS + 1).setValue('scrutiny');
          elecSh.getRange(e + 1, COL.ELEC_CAND_PUB_AT + 1).setValue('');
          appendAdminLog(sess.identity, 'election_rolled_back_for_appeal',
            'Election rolled back: candidates_published → scrutiny. Appeal ' + appealId +
            ' upheld. Nomination ' + nomId + ' reinstated. ELEC_CAND_PUB_AT cleared.',
            'candidates_published', elecId);
        }
        break;
      }
    }

    appendAdminLog(sess.identity, 'appeal_upheld_candidature_reinstated',
      'Appeal ' + appealId + ' upheld. Nomination ' + nomId +
      ' reinstated to pending_scrutiny for re-scrutiny.',
      'rejected', elecId);

  } else {
    appendAdminLog(sess.identity, 'appeal_decided',
      'Appeal ' + appealId + ' → ' + decision,
      appealRow[COL_APL.STATUS].toString(), elecId);
  }

  // ── Notify candidate by email ─────────────────────────────────
  if (isDecided) {
    // Get candidate email from Nominations sheet
    var nomRowsForEmail = sheetData(SHEETS.NOMINATIONS);
    var candEmail = '';
    var nomIdForEmail = appealRow[COL_APL.NOM_ID].toString();
    for (var n = 0; n < nomRowsForEmail.length; n++) {
      if (nomRowsForEmail[n][COL.NOM_ID].toString() === nomIdForEmail) {
        candEmail = nomRowsForEmail[n][COL.NOM_CAND_EMAIL].toString().trim();
        break;
      }
    }
    if (candEmail) {
      var isUpheld      = (decision === 'upheld');
      var appealType    = appealRow[COL_APL.APPEAL_TYPE] ? appealRow[COL_APL.APPEAL_TYPE].toString() : 'rejection_appeal';
      var isObjection   = (appealType === 'nomination_objection');
      var emailSubject  = 'SSKZM OBA Election — ' + (isObjection ? 'Objection Decision' : 'Appeal Decision') + ': ' + post;
      var emailBody     =
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">' +
        '<div style="background:#1a3a5c;border-top:3px solid #b8960c;padding:20px 24px;">' +
        '<h2 style="color:#fff;margin:0;font-size:1.05rem;">SSKZM OBA — ' + (isObjection ? 'Objection Decision' : 'Appeal Decision') + '</h2>' +
        '</div>' +
        '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;">' +
        '<p>Dear <strong>' + escHtml(candName) + '</strong>,</p>' +
        (isObjection
          ? '<p>A third-party objection was filed against your accepted nomination for the post of <strong>' + escHtml(post) + '</strong>. The Appeals Panel has considered the objection.</p>'
          : '<p>The Appeals Panel has considered your appeal against the rejection of your nomination for the post of <strong>' + escHtml(post) + '</strong>.</p>'
        ) +
        '<p><strong>Decision: ' + (isUpheld ? (isObjection ? 'Objection Upheld' : 'Appeal Upheld') : (isObjection ? 'Objection Dismissed' : 'Appeal Dismissed')) + '</strong></p>' +
        (decisionText ? '<p><strong>Reasons:</strong> ' + escHtml(decisionText) + '</p>' : '') +
        (isUpheld
          ? (isObjection
              ? '<p>Your nomination has been revoked and referred back to the Returning Officer for re-scrutiny. You will be notified of the outcome.</p>'
              : '<p>Your nomination has been reinstated and will be re-scrutinised by the Returning Officer. You will be notified of the outcome of scrutiny.</p>')
          : (isObjection
              ? '<p>The objection has been dismissed. Your candidature remains confirmed. No further action is required from you.</p>'
              : '<p>Your nomination remains rejected. The decision of the Appeals Panel is final for the purposes of this election.</p>')
        ) +
        '<p style="color:#888;font-size:.82rem;">' + (isObjection ? 'Objection' : 'Appeal') + ' ID: ' + appealId + ' | SSKZM OBA Election Management System</p>' +
        '</div></div>';
      try { sendEmailViaSendGrid(candEmail, emailSubject, emailBody); } catch(e) {}
    }
  }
  // ─────────────────────────────────────────────────────────────

  return { success: true, rolledBack: (decision === 'upheld') };
}

// ============================================================
// VOTER NOMINATION FUNCTIONS
// ============================================================

// ============================================================
// lookupVoterName — returns name for a given roll number
// Used in nomination form to verify proposer/seconder rolls
// Access: any authenticated session
// ============================================================
function lookupVoterName(token, rollNo) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  if (!rollNo || rollNo.trim() === '') {
    return { success: false, message: 'Roll number required.' };
  }

  var vr = getVoterRollRows(null);
  var rows = vr.rows;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.VOTER_ROLL].toString().trim().toUpperCase() ===
        rollNo.trim().toUpperCase()) {
      return {
        success: true,
        name: (rows[i][COL.VOTER_NAME].toString() + ' ' +
               rows[i][COL.VOTER_SURNAME].toString()).trim(),
        batch: rows[i][COL.VOTER_BATCH].toString()
      };
    }
  }
  return { success: false, message: 'Roll number not found on voter roll.' };
}

// ============================================================
// getMyNominations — returns nominations where caller is
// candidate or proposer, for the given election
// Access: any authenticated session
// ============================================================
function getMyNominations(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // Pre-load elections for deadline computation
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecMap = {};
  for (var e = 0; e < elecRows.length; e++) {
    elecMap[elecRows[e][COL.ELEC_ID].toString()] = elecRows[e];
  }

  var nowMs = now().getTime();
  var rows = sheetData(SHEETS.NOMINATIONS);
  var nominations = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (electionId && r[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    var isCand = r[COL.NOM_CAND_ROLL].toString() === sess.identity.toString();
    var isProp = r[COL.NOM_PROP_ROLL].toString() === sess.identity.toString();
    if (!isCand && !isProp) continue;

    // Compute withdrawal deadline for candidates_published elections
    var nomElecId = r[COL.NOM_ELEC_ID].toString();
    var elecRec = elecMap[nomElecId];
    var withdrawDeadline = '';
    var withdrawOpen = false;
    if (elecRec) {
      var elecStatus = elecRec[COL.ELEC_STATUS].toString();
      var pubAt = elecRec[COL.ELEC_CAND_PUB_AT] ? elecRec[COL.ELEC_CAND_PUB_AT].toString() : '';
      if (elecStatus === 'candidates_published' && pubAt) {
        var dl = getISTDeadline(pubAt);
        withdrawDeadline = formatISTDeadline(pubAt);
        withdrawOpen = dl ? nowMs <= dl.getTime() : false;
      }
    }

    // Compute appeal deadline — 48 hours after candidate list publication.
    // Same deadline for all candidates in the election. (Design locked Session 39.)
    var appealDeadlinePassed = false;
    var appealDeadlineStr    = '';
    if (elecRec) {
      var cpAt = elecRec[COL.ELEC_CAND_PUB_AT] ? elecRec[COL.ELEC_CAND_PUB_AT].toString() : '';
      if (cpAt) {
        var aDeadlineMs = new Date(cpAt).getTime() + (48 * 60 * 60 * 1000);
        appealDeadlinePassed = nowMs > aDeadlineMs;
        // Format deadline in IST for display
        var IST_OFFSET_MS = 330 * 60 * 1000;
        var aIstMs = aDeadlineMs + IST_OFFSET_MS;
        var aD = new Date(aIstMs);
        var aMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        appealDeadlineStr = aD.getUTCDate() + ' ' + aMonths[aD.getUTCMonth()] + ' ' +
                            aD.getUTCFullYear() + ', ' +
                            (aD.getUTCHours() % 12 || 12) + ':' +
                            (aD.getUTCMinutes() < 10 ? '0' : '') + aD.getUTCMinutes() +
                            (aD.getUTCHours() < 12 ? ' AM' : ' PM') + ' IST';
      }
    }

    nominations.push({
      id:               r[COL.NOM_ID].toString(),
      post:             r[COL.NOM_POST].toString(),
      candName:         r[COL.NOM_CAND_NAME].toString(),
      candRoll:         r[COL.NOM_CAND_ROLL].toString(),
      status:           r[COL.NOM_STATUS].toString(),
      rejectionReason:  r[COL.NOM_REJECTION].toString(),
      submittedAt:      r[COL.NOM_SUBMITTED_AT].toString(),
      propConfirmed:    r[COL.NOM_PROP_CONFIRMED].toString() === 'true',
      secRoll:          r[COL.NOM_SEC_ROLL].toString(),
      secConfirmed:     r[COL.NOM_SEC_CONFIRMED].toString() === 'true',
      entryMethod:      r[COL.NOM_ENTRY_METHOD].toString(),
      phase2:           r[COL.NOM_PHASE2_FLAG].toString() === 'true',
      consentStatus:    r[COL.NOM_CONSENT_STATUS].toString(),
      role:             isCand ? 'candidate' : 'proposer',
      withdrawDeadline:     withdrawDeadline,
      withdrawOpen:         withdrawOpen,
      appealDeadlinePassed: appealDeadlinePassed,
      appealDeadlineStr:    appealDeadlineStr
    });
  }

  nominations.sort(function(a, b) {
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });

  return { success: true, nominations: nominations };
}

// ============================================================
// submitNomination — Phase 1 self-nomination
// Caller is the candidate. Proposer and seconder confirmed
// by email link. One-post-per-person enforced.
// Access: VOTER
// ============================================================
function submitNomination(token, electionId, postName, propRoll, secRoll, bio) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // 1. Verify election is in nominations_open status
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  if (elecStatus !== 'nominations_open' && elecStatus !== 'nominations_open_phase2') {
    return { success: false, message: 'Nominations are not currently open.' };
  }

  // 2. Validate post name is a valid EC post
  var validPost = false;
  for (var p = 0; p < EC_POSTS.length; p++) {
    if (EC_POSTS[p].name === postName) { validPost = true; break; }
  }
  if (!validPost) return { success: false, message: 'Invalid post selected.' };

  // 3. One-post-per-person check — candidate cannot have another active nomination
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  for (var j = 0; j < nomRows.length; j++) {
    var nr = nomRows[j];
    if (nr[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (nr[COL.NOM_CAND_ROLL].toString() !== sess.identity.toString()) continue;
    var nStatus = nr[COL.NOM_STATUS].toString();
    if (nStatus === 'withdrawn' || nStatus === 'rejected' ||
        nStatus === 'consent_declined' || nStatus === 'deadline_lapsed') continue;
    return {
      success: false,
      message: 'You already have an active nomination for ' +
               nr[COL.NOM_POST].toString() + '. ' +
               'You must withdraw it before submitting a new nomination.'
    };
  }

  // 4. Look up candidate details from voter roll (draft or certified)
  var voterRows = getVoterRollRows(electionId).rows;
  var candRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString() === sess.identity.toString()) {
      candRow = voterRows[v]; break;
    }
  }
  if (!candRow) return { success: false, message: 'Your voter record could not be found.' };

  // 5. Validate proposer and seconder are on voter roll
  if (!propRoll || propRoll.trim() === '') {
    return { success: false, message: 'Proposer roll number is required.' };
  }
  if (!secRoll || secRoll.trim() === '') {
    return { success: false, message: 'Seconder roll number is required.' };
  }
  propRoll = propRoll.trim().toUpperCase();
  secRoll  = secRoll.trim().toUpperCase();

  if (propRoll === sess.identity.toUpperCase()) {
    return { success: false, message: 'You cannot be your own proposer.' };
  }
  if (secRoll === sess.identity.toUpperCase()) {
    return { success: false, message: 'You cannot be your own seconder.' };
  }
  if (propRoll === secRoll) {
    return { success: false, message: 'Proposer and seconder must be different people.' };
  }

  var propFound = false; var propBatch = '';
  var secFound  = false; var secBatch  = '';
  for (var vv = 0; vv < voterRows.length; vv++) {
    var vRoll = voterRows[vv][COL.VOTER_ROLL].toString().toUpperCase();
    if (vRoll === propRoll) { propFound = true; propBatch = voterRows[vv][COL.VOTER_BATCH].toString(); }
    if (vRoll === secRoll)  { secFound  = true; secBatch  = voterRows[vv][COL.VOTER_BATCH].toString(); }
  }
  if (!propFound) return { success: false, message: 'Proposer roll number not found on voter roll.' };
  if (!secFound)  return { success: false, message: 'Seconder roll number not found on voter roll.' };

  // Org Secy: if restricted, candidate/proposer/seconder must be from designated batch
  if (postName === 'Organising Secretary') {
    var orgBatchNom = elec[COL.ELEC_ORGSECY_BATCH].toString().trim();
    var orgRestrNom = elec[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true';
    if (orgBatchNom && orgRestrNom) {
      if (candBatch !== orgBatchNom) {
        return { success: false, message: 'The post of Organising Secretary is currently restricted to Batch ' + orgBatchNom + '. Only members of that batch may nominate for this post during Phase 1.' };
      }
      if (propBatch !== orgBatchNom) {
        return { success: false, message: 'The post of Organising Secretary is restricted to Batch ' + orgBatchNom + '. The proposer must also be from Batch ' + orgBatchNom + '.' };
      }
      if (secBatch !== orgBatchNom) {
        return { success: false, message: 'The post of Organising Secretary is restricted to Batch ' + orgBatchNom + '. The seconder must also be from Batch ' + orgBatchNom + '.' };
      }
    }
  }

  // Batch Rep: candidate, proposer and seconder must all be from the same bracket
  if (postName.indexOf('Batch Representative') === 0) {
    var candBracketCheck = getBatchRepBracket(candRow[COL.VOTER_BATCH].toString());
    if (getBatchRepBracket(propBatch) !== candBracketCheck) {
      return { success: false, message: 'For a Batch Representative nomination, the proposer must be from the same batch bracket (' + candBracketCheck + ').' };
    }
    if (getBatchRepBracket(secBatch) !== candBracketCheck) {
      return { success: false, message: 'For a Batch Representative nomination, the seconder must be from the same batch bracket (' + candBracketCheck + ').' };
    }
  }

  // 6. Generate nomination ID and tokens
  var nomId     = 'NOM-' + new Date().getTime();
  var propToken = Utilities.getUuid();
  var secToken  = Utilities.getUuid();
  var now       = new Date();

  var candName = (candRow[COL.VOTER_NAME].toString() + ' ' +
                  candRow[COL.VOTER_SURNAME].toString()).trim();
  var candBatch = candRow[COL.VOTER_BATCH].toString();
  var candEmail = candRow[COL.VOTER_EMAIL].toString();

  // 7. Write nomination row
  var sh = getSheet(SHEETS.NOMINATIONS);
  if (!sh) return { success: false, message: 'Nominations sheet not found.' };

  var deadline = elec[COL.ELEC_NOM_DEADLINE].toString();
  sh.appendRow([
    nomId,                    // NOM_ID
    electionId,               // NOM_ELEC_ID
    postName,                 // NOM_POST
    sess.identity,            // NOM_CAND_ROLL
    candName,                 // NOM_CAND_NAME
    candBatch,                // NOM_CAND_BATCH
    candEmail,                // NOM_CAND_EMAIL
    propRoll,                 // NOM_PROP_ROLL
    'false',                  // NOM_PROP_CONFIRMED
    '',                       // NOM_PROP_CONFIRMED_AT
    propToken,                // NOM_PROP_TOKEN
    secRoll,                  // NOM_SEC_ROLL
    'false',                  // NOM_SEC_CONFIRMED
    '',                       // NOM_SEC_CONFIRMED_AT
    secToken,                 // NOM_SEC_TOKEN
    bio || '',                // NOM_BIO
    '',                       // NOM_PHOTO
    now,                      // NOM_SUBMITTED_AT
    deadline,                 // NOM_DEADLINE
    'submitted',              // NOM_STATUS
    '',                       // NOM_REJECTION
    '',                       // NOM_WITHDRAWN_AT
    'phase1_online',          // NOM_ENTRY_METHOD
    '',                       // NOM_DOC_LINKS
    '',                       // NOM_FOLDER_URL
    '',                       // NOM_NOMINATOR_ROLL
    'pending',                // NOM_CONSENT_STATUS (implicit in Phase 1 but tracked)
    '',                       // NOM_CONSENT_TOKEN
    '',                       // NOM_CONSENT_AT
    'false',                  // NOM_ONE_POST_CHECK
    'false',                  // NOM_PHASE2_FLAG
    'false'                   // NOM_DUP_DECLINED
  ]);

  // 8. Send confirmation emails to proposer and seconder
  var propConfirmUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nomId) + '&role=proposer&token=' +
    encodeURIComponent(propToken);
  var secConfirmUrl  = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nomId) + '&role=seconder&token=' +
    encodeURIComponent(secToken);

  try {
    sendEmailViaSendGrid(
      candEmail,
      'Your nomination has been submitted — ' + postName,
      'Dear ' + candName + ',\n\n' +
      'Your nomination for the post of ' + postName + ' has been submitted.\n\n' +
      'Your nomination will be confirmed once your proposer and seconder ' +
      'both click their confirmation links.\n\n' +
      'Election: ' + elec[COL.ELEC_TITLE].toString() + '\n' +
      'Post: ' + postName + '\n\n' +
      'SSKZM OBA Elections'
    );
  } catch(e) { /* email failure should not block nomination submission */ }

  // Look up proposer and seconder emails for confirmation emails
  var propEmail = '';
  var secEmail  = '';
  var propName  = propRoll;
  var secName   = secRoll;
  for (var ve = 0; ve < voterRows.length; ve++) {
    var vr = voterRows[ve][COL.VOTER_ROLL].toString().toUpperCase();
    if (vr === propRoll) {
      propEmail = voterRows[ve][COL.VOTER_EMAIL].toString();
      propName  = (voterRows[ve][COL.VOTER_NAME].toString() + ' ' +
                   voterRows[ve][COL.VOTER_SURNAME].toString()).trim();
    }
    if (vr === secRoll) {
      secEmail = voterRows[ve][COL.VOTER_EMAIL].toString();
      secName  = (voterRows[ve][COL.VOTER_NAME].toString() + ' ' +
                  voterRows[ve][COL.VOTER_SURNAME].toString()).trim();
    }
  }

  var emailBody =
    'You have been listed as {ROLE} for the following nomination:<br><br>' +
    'Candidate: ' + candName + '<br>' +
    'Post: ' + postName + '<br>' +
    'Election: ' + elec[COL.ELEC_TITLE].toString() + '<br><br>' +
    'Please click the link below to confirm your role:<br><br>' +
    '<a href="{URL}">✅ Confirm as {ROLE}</a><br><br>' +
    'If you did not agree to this role, please ignore this email.<br><br>' +
    'SSKZM OBA Elections';

  try {
    if (propEmail) {
      sendEmailViaSendGrid(propEmail,
        'Please confirm: Proposer for ' + candName + ' (' + postName + ')',
        emailBody.replace(/\{ROLE\}/g, 'Proposer').replace('{URL}', propConfirmUrl));
    }
  } catch(e) {}

  try {
    if (secEmail) {
      sendEmailViaSendGrid(secEmail,
        'Please confirm: Seconder for ' + candName + ' (' + postName + ')',
        emailBody.replace(/\{ROLE\}/g, 'Seconder').replace('{URL}', secConfirmUrl));
    }
  } catch(e) {}

  appendAdminLog(sess.identity, 'nomination_submitted',
    'Nomination submitted. Post: ' + postName + ' | NomID: ' + nomId,
    '', electionId);

  return { success: true, nominationId: nomId };
}

// ============================================================
// submitNominationManual — RO manual nomination entry
// RO enters candidate, proposer, seconder on behalf of members.
// Skips email confirmation — goes straight to confirmed status.
// One-post-per-person enforced on candRoll (not sess.identity).
// Access: RO_ADMIN only
// ============================================================
function submitNominationManual(token, electionId, candRoll, postName, propRoll, secRoll, bio, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'submitNominationManual', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  // 1. Verify election is in nominations_open status
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  if (elecStatus !== 'nominations_open' && elecStatus !== 'nominations_open_phase2') {
    return { success: false, message: 'Nominations are not currently open.' };
  }

  // 2. Validate post
  var validPost = false;
  for (var p = 0; p < EC_POSTS.length; p++) {
    if (EC_POSTS[p].name === postName) { validPost = true; break; }
  }
  if (!validPost) return { success: false, message: 'Invalid post selected.' };

  // 3. Validate candRoll provided
  candRoll = (candRoll || '').toString().trim().toUpperCase();
  if (!candRoll) return { success: false, message: 'Candidate roll number is required.' };

  // 4. One-post-per-person check on candRoll
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  for (var j = 0; j < nomRows.length; j++) {
    var nr = nomRows[j];
    if (nr[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (nr[COL.NOM_CAND_ROLL].toString().toUpperCase() !== candRoll) continue;
    var nStatus = nr[COL.NOM_STATUS].toString();
    if (nStatus === 'withdrawn' || nStatus === 'rejected' ||
        nStatus === 'consent_declined' || nStatus === 'deadline_lapsed') continue;
    return { success: false,
      message: 'Candidate already has an active nomination for ' +
               nr[COL.NOM_POST].toString() + '. Withdraw it before entering a new nomination.' };
  }

  // 5. Look up candidate from voter roll (draft or certified)
  var voterRows = getVoterRollRows(electionId).rows;
  var candRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString().toUpperCase() === candRoll) {
      candRow = voterRows[v]; break;
    }
  }
  if (!candRow) return { success: false, message: 'Candidate roll number not found on voter roll.' };

  // 6. Validate proposer
  if (!propRoll || propRoll.toString().trim() === '') {
    return { success: false, message: 'Proposer roll number is required.' };
  }
  propRoll = propRoll.toString().trim().toUpperCase();
  if (propRoll === candRoll) {
    return { success: false, message: 'Candidate and proposer cannot be the same person.' };
  }
  var propRow = null;
  for (var pr = 0; pr < voterRows.length; pr++) {
    if (voterRows[pr][COL.VOTER_ROLL].toString().toUpperCase() === propRoll) {
      propRow = voterRows[pr]; break;
    }
  }
  if (!propRow) return { success: false, message: 'Proposer roll number not found on voter roll.' };

  // 7. Validate seconder (optional)
  var secRow = null;
  if (secRoll && secRoll.toString().trim() !== '') {
    secRoll = secRoll.toString().trim().toUpperCase();
    if (secRoll === candRoll) {
      return { success: false, message: 'Candidate and seconder cannot be the same person.' };
    }
    if (secRoll === propRoll) {
      return { success: false, message: 'Proposer and seconder cannot be the same person.' };
    }
    for (var sr = 0; sr < voterRows.length; sr++) {
      if (voterRows[sr][COL.VOTER_ROLL].toString().toUpperCase() === secRoll) {
        secRow = voterRows[sr]; break;
      }
    }
    if (!secRow) return { success: false, message: 'Seconder roll number not found on voter roll.' };
  } else {
    secRoll = '';
  }

  // 7b. Org Secy restriction — candidate/proposer/seconder must be from designated batch
  if (postName === 'Organising Secretary') {
    var orgBatchM = elec[COL.ELEC_ORGSECY_BATCH].toString().trim();
    var orgRestrM = elec[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true';
    if (orgBatchM && orgRestrM) {
      var candBatchM = candRow[COL.VOTER_BATCH].toString().trim();
      if (candBatchM !== orgBatchM) {
        return { success: false, message: 'Organising Secretary is restricted to Batch ' + orgBatchM + '. Candidate must be from that batch.' };
      }
      if (propRow && propRow[COL.VOTER_BATCH].toString().trim() !== orgBatchM) {
        return { success: false, message: 'Organising Secretary is restricted to Batch ' + orgBatchM + '. Proposer must also be from that batch.' };
      }
      if (secRow && secRow[COL.VOTER_BATCH].toString().trim() !== orgBatchM) {
        return { success: false, message: 'Organising Secretary is restricted to Batch ' + orgBatchM + '. Seconder must also be from that batch.' };
      }
    }
  }

  // 7c. Batch Rep restriction — candidate, proposer, seconder must be from same bracket
  if (postName.indexOf('Batch Representative') === 0) {
    var candBracketM = getBatchRepBracket(candRow[COL.VOTER_BATCH].toString());
    if (propRow && getBatchRepBracket(propRow[COL.VOTER_BATCH].toString()) !== candBracketM) {
      return { success: false, message: 'For a Batch Representative nomination, proposer must be from the same batch bracket (' + candBracketM + ').' };
    }
    if (secRow && getBatchRepBracket(secRow[COL.VOTER_BATCH].toString()) !== candBracketM) {
      return { success: false, message: 'For a Batch Representative nomination, seconder must be from the same batch bracket (' + candBracketM + ').' };
    }
  }

  // 8. Write nomination row — straight to confirmed (no email confirmation needed)
  var nomId  = generateId();
  var ts     = now().toISOString();
  var candName = (candRow[COL.VOTER_NAME].toString() + ' ' +
                  candRow[COL.VOTER_SURNAME].toString()).trim();
  var propName = (propRow[COL.VOTER_NAME].toString() + ' ' +
                  propRow[COL.VOTER_SURNAME].toString()).trim();

  var nomSh  = getSheet(SHEETS.NOMINATIONS);
  var newNom = new Array(35).fill('');
  newNom[COL.NOM_ID]             = nomId;
  newNom[COL.NOM_ELEC_ID]        = electionId;
  newNom[COL.NOM_POST]           = postName;
  newNom[COL.NOM_CAND_ROLL]      = candRoll;
  newNom[COL.NOM_CAND_NAME]      = candName;
  newNom[COL.NOM_CAND_BATCH]     = candRow[COL.VOTER_BATCH].toString();
  newNom[COL.NOM_CAND_EMAIL]     = candRow[COL.VOTER_EMAIL].toString();
  newNom[COL.NOM_PROP_ROLL]      = propRoll;
  newNom[COL.NOM_PROP_NAME]      = propName;
  newNom[COL.NOM_PROP_CONFIRMED] = true;
  newNom[COL.NOM_SEC_ROLL]       = secRoll;
  newNom[COL.NOM_SEC_NAME]       = secRow ? (secRow[COL.VOTER_NAME].toString() + ' ' +
                                              secRow[COL.VOTER_SURNAME].toString()).trim() : '';
  newNom[COL.NOM_SEC_CONFIRMED]  = secRow ? true : false;
  newNom[COL.NOM_BIO]            = (bio || '').toString().trim().substring(0, 300);
  newNom[COL.NOM_STATUS]         = 'confirmed';
  newNom[COL.NOM_SUBMITTED_AT]   = ts;
  newNom[COL.NOM_ENTRY_METHOD]   = 'manual_ro';
  newNom[COL.NOM_CONSENT_STATUS] = 'accepted';
  newNom[COL.NOM_CONSENT_AT]     = ts;
  nomSh.appendRow(newNom);

  appendAdminLog(sess.identity, 'nomination_submitted',
    'Manual RO entry: ' + candName + ' (' + candRoll + ') for ' + postName +
    ' | Proposer: ' + propRoll + ' | NomID: ' + nomId,
    '', electionId);

  return { success: true, nominationId: nomId, candName: candName, post: postName };
}

// ============================================================
// submitNomination_Phase2 — Phase 2 nomination
// Caller is the proposer. Candidate receives consent email.
// Seconder is optional at submission.
// Access: VOTER
// ============================================================
function submitNomination_Phase2(token, electionId, postName, candRoll, secRoll, bio) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // 1. Verify election is in nominations_open_phase2 status
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  if (elec[COL.ELEC_STATUS].toString() !== 'nominations_open_phase2') {
    return { success: false, message: 'Phase 2 nominations are not currently open.' };
  }

  // 2. Validate post
  var validPost = false;
  for (var p = 0; p < EC_POSTS.length; p++) {
    if (EC_POSTS[p].name === postName) { validPost = true; break; }
  }
  if (!validPost) return { success: false, message: 'Invalid post selected.' };

  // 3. Caller cannot nominate themselves via Phase 2
  candRoll = candRoll.trim().toUpperCase();
  if (candRoll === sess.identity.toUpperCase()) {
    return { success: false, message: 'Use the "Nominate Myself" form to nominate yourself.' };
  }

  // 4. Look up candidate on voter roll (draft or certified)
  var voterRows = getVoterRollRows(electionId).rows;
  var candRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString().trim().toUpperCase() === candRoll) {
      candRow = voterRows[v]; break;
    }
  }
  if (!candRow) return { success: false, message: 'Candidate roll number not found on voter roll.' };

  // 5. One-post-per-person check on the candidate
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  for (var j = 0; j < nomRows.length; j++) {
    var nr = nomRows[j];
    if (nr[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (nr[COL.NOM_CAND_ROLL].toString().toUpperCase() !== candRoll) continue;
    var nStatus = nr[COL.NOM_STATUS].toString();
    if (nStatus === 'withdrawn' || nStatus === 'rejected' ||
        nStatus === 'consent_declined' || nStatus === 'deadline_lapsed') continue;
    return {
      success: false,
      message: nr[COL.NOM_CAND_NAME].toString() + ' already has an active nomination for ' +
               nr[COL.NOM_POST].toString() + '.'
    };
  }

  // 6. Validate seconder if provided
  secRoll = secRoll ? secRoll.trim().toUpperCase() : '';
  var secRow = null;
  if (secRoll) {
    if (secRoll === candRoll) {
      return { success: false, message: 'The candidate cannot be their own seconder.' };
    }
    if (secRoll === sess.identity.toUpperCase()) {
      return { success: false, message: 'As proposer, you cannot also be the seconder.' };
    }
    for (var vs = 0; vs < voterRows.length; vs++) {
      if (voterRows[vs][COL.VOTER_ROLL].toString().trim().toUpperCase() === secRoll) {
        secRow = voterRows[vs]; break;
      }
    }
    if (!secRow) return { success: false, message: 'Seconder roll number not found on voter roll.' };
  }

  // Org Secy: if restricted, candidate/proposer/seconder must be from designated batch
  if (postName === 'Organising Secretary') {
    var orgBatchP2Nom = elec[COL.ELEC_ORGSECY_BATCH].toString().trim();
    var orgRestrP2Nom = elec[COL.ELEC_ORGSECY_RESTRICTED].toString().toLowerCase() === 'true';
    if (orgBatchP2Nom && orgRestrP2Nom) {
      var candBatchP2Nom = candRow[COL.VOTER_BATCH].toString().trim();
      if (candBatchP2Nom !== orgBatchP2Nom) {
        return { success: false, message: 'The post of Organising Secretary is currently restricted to Batch ' + orgBatchP2Nom + '.' };
      }
      var propBatchP2Nom = '';
      for (var vpoP2 = 0; vpoP2 < voterRows.length; vpoP2++) {
        if (voterRows[vpoP2][COL.VOTER_ROLL].toString().trim().toUpperCase() === sess.identity.toUpperCase()) {
          propBatchP2Nom = voterRows[vpoP2][COL.VOTER_BATCH].toString().trim(); break;
        }
      }
      if (propBatchP2Nom !== orgBatchP2Nom) {
        return { success: false, message: 'The post of Organising Secretary is restricted to Batch ' + orgBatchP2Nom + '. The proposer must also be from Batch ' + orgBatchP2Nom + '.' };
      }
      if (secRow && secRow[COL.VOTER_BATCH].toString().trim() !== orgBatchP2Nom) {
        return { success: false, message: 'The post of Organising Secretary is restricted to Batch ' + orgBatchP2Nom + '. The seconder must also be from Batch ' + orgBatchP2Nom + '.' };
      }
    }
  }

  // Batch Rep: candidate, proposer and seconder must all be from the same bracket
  if (postName.indexOf('Batch Representative') === 0) {
    var candBracketP2 = getBatchRepBracket(candRow[COL.VOTER_BATCH].toString());
    // Check proposer (sess.identity)
    var propBatchP2 = '';
    for (var vpr = 0; vpr < voterRows.length; vpr++) {
      if (voterRows[vpr][COL.VOTER_ROLL].toString().trim().toUpperCase() === sess.identity.toUpperCase()) {
        propBatchP2 = voterRows[vpr][COL.VOTER_BATCH].toString(); break;
      }
    }
    if (getBatchRepBracket(propBatchP2) !== candBracketP2) {
      return { success: false, message: 'For a Batch Representative nomination, the proposer must be from the same batch bracket (' + candBracketP2 + ').' };
    }
    // Check seconder if provided
    if (secRow && getBatchRepBracket(secRow[COL.VOTER_BATCH].toString()) !== candBracketP2) {
      return { success: false, message: 'For a Batch Representative nomination, the seconder must be from the same batch bracket (' + candBracketP2 + ').' };
    }
  }

  // 7. Prepare row data
  var nomId    = 'NOM-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var secToken = secRoll ? Utilities.getUuid() : '';
  var consentToken = Utilities.getUuid();
  var nowDate  = new Date();
  var deadline = elec[COL.ELEC_NOM_DEADLINE].toString();

  var candName  = (candRow[COL.VOTER_NAME].toString() + ' ' +
                   candRow[COL.VOTER_SURNAME].toString()).trim();
  var candBatch = candRow[COL.VOTER_BATCH].toString();
  var candEmail = candRow[COL.VOTER_EMAIL].toString();

  // Look up proposer name for emails
  var propName = sess.identity;
  for (var vp = 0; vp < voterRows.length; vp++) {
    if (voterRows[vp][COL.VOTER_ROLL].toString().trim().toUpperCase() ===
        sess.identity.toUpperCase()) {
      propName = (voterRows[vp][COL.VOTER_NAME].toString() + ' ' +
                  voterRows[vp][COL.VOTER_SURNAME].toString()).trim();
      break;
    }
  }

  // 8. Write nomination row
  var sh = getSheet(SHEETS.NOMINATIONS);
  if (!sh) return { success: false, message: 'Nominations sheet not found.' };

  sh.appendRow([
    nomId,                    // NOM_ID
    electionId,               // NOM_ELEC_ID
    postName,                 // NOM_POST
    candRoll,                 // NOM_CAND_ROLL
    candName,                 // NOM_CAND_NAME
    candBatch,                // NOM_CAND_BATCH
    candEmail,                // NOM_CAND_EMAIL
    sess.identity,            // NOM_PROP_ROLL (caller is proposer)
    'true',                   // NOM_PROP_CONFIRMED (proposer confirmed by submitting)
    nowDate,                  // NOM_PROP_CONFIRMED_AT
    '',                       // NOM_PROP_TOKEN (not needed — proposer confirmed at submit)
    secRoll,                  // NOM_SEC_ROLL
    'false',                  // NOM_SEC_CONFIRMED
    '',                       // NOM_SEC_CONFIRMED_AT
    secToken,                 // NOM_SEC_TOKEN
    bio || '',                // NOM_BIO
    '',                       // NOM_PHOTO
    nowDate,                  // NOM_SUBMITTED_AT
    deadline,                 // NOM_DEADLINE
    'consent_pending',        // NOM_STATUS
    '',                       // NOM_REJECTION
    '',                       // NOM_WITHDRAWN_AT
    'phase2_online',          // NOM_ENTRY_METHOD
    '',                       // NOM_DOC_LINKS
    '',                       // NOM_FOLDER_URL
    sess.identity,            // NOM_NOMINATOR_ROLL
    'pending',                // NOM_CONSENT_STATUS
    consentToken,             // NOM_CONSENT_TOKEN
    '',                       // NOM_CONSENT_AT
    'false',                  // NOM_ONE_POST_CHECK
    'true',                   // NOM_PHASE2_FLAG
    'false'                   // NOM_DUP_DECLINED
  ]);

  // 9. Send consent email to candidate
  var consentAcceptUrl  = DEPLOY_URL + '?action=consentAccept&nomId=' +
    encodeURIComponent(nomId) + '&token=' + encodeURIComponent(consentToken);
  var consentDeclineUrl = DEPLOY_URL + '?action=consentDecline&nomId=' +
    encodeURIComponent(nomId) + '&token=' + encodeURIComponent(consentToken);

  try {
    if (candEmail) {
      sendEmailViaSendGrid(
        candEmail,
        'You have been nominated for ' + postName + ' — action required',
        'Dear ' + candName + ',\n\n' +
        propName + ' has nominated you for the post of ' + postName + '.\n\n' +
        'Election: ' + elec[COL.ELEC_TITLE].toString() + '\n\n' +
        'Please click one of the links below:<br><br>' +
        '<a href="' + consentAcceptUrl + '">✅ ACCEPT this nomination</a><br><br>' +
        '<a href="' + consentDeclineUrl + '">❌ DECLINE this nomination</a><br><br>' +
        'If you do not respond before the nomination deadline, the nomination will lapse.<br><br>' +
        'SSKZM OBA Elections'
      );
    }
  } catch(e) {}

  // 10. Send seconder confirmation email if seconder provided
  if (secRoll && secRow) {
    var secEmail = secRow[COL.VOTER_EMAIL].toString();
    var secName  = (secRow[COL.VOTER_NAME].toString() + ' ' +
                    secRow[COL.VOTER_SURNAME].toString()).trim();
    var secConfirmUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
      encodeURIComponent(nomId) + '&role=seconder&token=' +
      encodeURIComponent(secToken);
    try {
      if (secEmail) {
        sendEmailViaSendGrid(
          secEmail,
          'Please confirm: Seconder for ' + candName + ' (' + postName + ')',
          'Dear ' + secName + ',\n\n' +
          'You have been listed as Seconder for the following nomination:\n\n' +
          'Candidate: ' + candName + '\n' +
          'Post: ' + postName + '\n' +
          'Election: ' + elec[COL.ELEC_TITLE].toString() + '\n\n' +
          'Please click the link below to confirm:<br><br>' +
          '<a href="' + secConfirmUrl + '">✅ Confirm as Seconder</a><br><br>' +
          'If you did not agree to this role, please ignore this email.<br><br>' +
          'SSKZM OBA Elections'
        );
      }
    } catch(e) {}
  }

  appendAdminLog(sess.identity, 'phase2_nomination_submitted',
    'Phase 2 nomination submitted. Candidate: ' + candRoll +
    ' | Post: ' + postName + ' | NomID: ' + nomId,
    '', electionId);

  return { success: true, nominationId: nomId,
           message: 'Nomination submitted. A consent email has been sent to ' + candName + '.' };
}

// ============================================================
// addSeconder — proposer adds a seconder to a Phase 2
// nomination that was submitted without one.
// Access: VOTER (proposer of the nomination only)
// ============================================================
function addSeconder(token, nomId, secRoll) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // 1. Find nomination
  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();
  var rowIndex = -1;
  var nom = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() === nomId) {
      rowIndex = i; nom = data[i]; break;
    }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };

  // 2. Caller must be the proposer
  if (nom[COL.NOM_PROP_ROLL].toString().toUpperCase() !== sess.identity.toUpperCase()) {
    return { success: false, message: 'Only the proposer can add a seconder.' };
  }

  // 3. Must be a Phase 2 nomination
  if (nom[COL.NOM_PHASE2_FLAG].toString() !== 'true') {
    return { success: false, message: 'This action only applies to Phase 2 nominations.' };
  }

  // 4. Seconder slot must be empty
  if (nom[COL.NOM_SEC_ROLL].toString().trim() !== '') {
    return { success: false, message: 'A seconder has already been added to this nomination.' };
  }

  // 5. Nomination must be active
  var status = nom[COL.NOM_STATUS].toString();
  if (status === 'withdrawn' || status === 'rejected' ||
      status === 'consent_declined' || status === 'deadline_lapsed') {
    return { success: false, message: 'This nomination is no longer active.' };
  }

  // 6. Validate seconder
  secRoll = secRoll.trim().toUpperCase();
  var candRoll = nom[COL.NOM_CAND_ROLL].toString().toUpperCase();
  if (secRoll === candRoll) {
    return { success: false, message: 'The candidate cannot be their own seconder.' };
  }
  if (secRoll === sess.identity.toUpperCase()) {
    return { success: false, message: 'As proposer, you cannot also be the seconder.' };
  }

  var voterRows = getVoterRollRows(nom[COL.NOM_ELEC_ID].toString()).rows;
  var secRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString().trim().toUpperCase() === secRoll) {
      secRow = voterRows[v]; break;
    }
  }
  if (!secRow) return { success: false, message: 'Seconder roll number not found on voter roll.' };

  // 7. Write seconder to sheet
  var secToken = Utilities.getUuid();
  var secName  = (secRow[COL.VOTER_NAME].toString() + ' ' +
                  secRow[COL.VOTER_SURNAME].toString()).trim();
  var secEmail = secRow[COL.VOTER_EMAIL].toString();

  sh.getRange(rowIndex + 1, COL.NOM_SEC_ROLL  + 1).setValue(secRoll);
  sh.getRange(rowIndex + 1, COL.NOM_SEC_TOKEN + 1).setValue(secToken);

  // 8. Send seconder confirmation email
  var candName = nom[COL.NOM_CAND_NAME].toString();
  var postName = nom[COL.NOM_POST].toString();
  var elecId   = nom[COL.NOM_ELEC_ID].toString();
  var secConfirmUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nomId) + '&role=seconder&token=' +
    encodeURIComponent(secToken);

  try {
    if (secEmail) {
      sendEmailViaSendGrid(
        secEmail,
        'Please confirm: Seconder for ' + candName + ' (' + postName + ')',
        'Dear ' + secName + ',\n\n' +
        'You have been listed as Seconder for the following nomination:\n\n' +
        'Candidate: ' + candName + '\n' +
        'Post: ' + postName + '\n\n' +
        'Please click the link below to confirm:<br><br>' +
          '<a href="' + secConfirmUrl + '">✅ Confirm as Seconder</a><br><br>' +
          'If you did not agree to this role, please ignore this email.<br><br>' +
          'SSKZM OBA Elections'
      );
    }
  } catch(e) {}

  appendAdminLog(sess.identity, 'seconder_added',
    'Seconder added. NomID: ' + nomId + ' | Seconder: ' + secRoll,
    '', elecId);

  return { success: true, message: 'Seconder added. A confirmation email has been sent to ' + secName + '.' };
}

// ============================================================
// nomineeAddSeconder — nominee adds seconder after consent.
// Auth: nomId + consentToken (no login required).
// ============================================================
function nomineeAddSeconder(nomId, consentToken, secRoll) {
  if (!nomId || !consentToken || !secRoll) {
    return { success: false, message: 'Missing required fields.' };
  }
  secRoll = secRoll.trim().toUpperCase();

  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();
  var rowIndex = -1; var nom = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() === nomId) { rowIndex = i; nom = data[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_CONSENT_TOKEN].toString() !== consentToken) {
    return { success: false, message: 'Invalid token.' };
  }
  if (nom[COL.NOM_CONSENT_STATUS].toString() !== 'accepted') {
    return { success: false, message: 'Consent has not been accepted yet.' };
  }
  if (nom[COL.NOM_SEC_ROLL].toString().trim() !== '') {
    return { success: false, message: 'A seconder has already been set.' };
  }

  var status = nom[COL.NOM_STATUS].toString();
  if (status === 'withdrawn' || status === 'rejected' ||
      status === 'consent_declined' || status === 'deadline_lapsed') {
    return { success: false, message: 'This nomination is no longer active.' };
  }

  var candRoll = nom[COL.NOM_CAND_ROLL].toString().toUpperCase();
  var propRoll = nom[COL.NOM_PROP_ROLL].toString().toUpperCase();
  if (secRoll === candRoll) return { success: false, message: 'You cannot be your own seconder.' };
  if (secRoll === propRoll) return { success: false, message: 'The proposer cannot also be the seconder.' };

  var voterRows = getVoterRollRows(nom[COL.NOM_ELEC_ID].toString()).rows;
  var secRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString().trim().toUpperCase() === secRoll) {
      secRow = voterRows[v]; break;
    }
  }
  if (!secRow) return { success: false, message: 'Seconder roll number not found on voter roll.' };

  // Batch Rep bracket check
  if (nom[COL.NOM_POST].toString().indexOf('Batch Representative') === 0) {
    var candBracket = getBatchRepBracket(nom[COL.NOM_CAND_BATCH].toString());
    if (getBatchRepBracket(secRow[COL.VOTER_BATCH].toString()) !== candBracket) {
      return { success: false, message: 'For a Batch Representative nomination, the seconder must be from the same batch bracket (' + candBracket + ').' };
    }
  }

  var secToken = Utilities.getUuid();
  var secName  = (secRow[COL.VOTER_NAME].toString() + ' ' +
                  secRow[COL.VOTER_SURNAME].toString()).trim();
  var secEmail = secRow[COL.VOTER_EMAIL].toString();
  var elecId   = nom[COL.NOM_ELEC_ID].toString();

  sh.getRange(rowIndex + 1, COL.NOM_SEC_ROLL  + 1).setValue(secRoll);
  sh.getRange(rowIndex + 1, COL.NOM_SEC_TOKEN + 1).setValue(secToken);

  var secUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nomId) + '&role=seconder&token=' + encodeURIComponent(secToken);
  var subject = 'Please confirm as Seconder — SSKZM OBA Election';
  var body =
    '<p>Dear ' + secName + ',</p>' +
    '<p>You have been listed as Seconder for the following nomination:</p>' +
    '<p>Candidate: <strong>' + nom[COL.NOM_CAND_NAME].toString() + '</strong><br>' +
    'Post: <strong>' + nom[COL.NOM_POST].toString() + '</strong></p>' +
    '<p><a href="' + secUrl + '">✅ Confirm as Seconder</a></p>' +
    '<p>SSKZM OBA Elections</p>';
  try { sendEmailViaSendGrid(secEmail, subject, body); } catch(e) {}

  appendAdminLog(candRoll, 'nominee_seconder_added',
    'Nominee added seconder ' + secRoll + ' for nomination ' + nomId, '', elecId);

  return { success: true, secName: secName, message: 'Seconder added. A confirmation email has been sent to ' + secName + '.' };
}

// ============================================================
// candidateAddSeconder — nominee adds seconder via voter session.
// Access: VOTER, must be the candidate on a Phase 2 nomination.
// ============================================================
function candidateAddSeconder(token, nomId, secRoll) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  secRoll = secRoll.trim().toUpperCase();
  var sh   = getSheet(SHEETS.NOMINATIONS);
  var data = sh.getDataRange().getValues();
  var rowIndex = -1; var nom = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.NOM_ID].toString() === nomId) { rowIndex = i; nom = data[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_CAND_ROLL].toString() !== sess.identity.toString()) {
    return { success: false, message: 'Only the candidate may add a seconder this way.' };
  }
  if (nom[COL.NOM_PHASE2_FLAG].toString() !== 'true') {
    return { success: false, message: 'This action only applies to Phase 2 nominations.' };
  }
  if (nom[COL.NOM_CONSENT_STATUS].toString() !== 'accepted') {
    return { success: false, message: 'Please accept the nomination first.' };
  }
  if (nom[COL.NOM_SEC_ROLL].toString().trim() !== '') {
    return { success: false, message: 'A seconder has already been added.' };
  }
  var status = nom[COL.NOM_STATUS].toString();
  if (status === 'withdrawn' || status === 'rejected' ||
      status === 'consent_declined' || status === 'deadline_lapsed') {
    return { success: false, message: 'This nomination is no longer active.' };
  }
  var candRoll = nom[COL.NOM_CAND_ROLL].toString().toUpperCase();
  var propRoll = nom[COL.NOM_PROP_ROLL].toString().toUpperCase();
  if (secRoll === candRoll) return { success: false, message: 'You cannot be your own seconder.' };
  if (secRoll === propRoll) return { success: false, message: 'The proposer cannot also be the seconder.' };

  var voterRows = getVoterRollRows(nom[COL.NOM_ELEC_ID].toString()).rows;
  var secRow = null;
  for (var v = 0; v < voterRows.length; v++) {
    if (voterRows[v][COL.VOTER_ROLL].toString().trim().toUpperCase() === secRoll) {
      secRow = voterRows[v]; break;
    }
  }
  if (!secRow) return { success: false, message: 'Seconder roll number not found on voter roll.' };

  if (nom[COL.NOM_POST].toString().indexOf('Batch Representative') === 0) {
    var candBracket = getBatchRepBracket(nom[COL.NOM_CAND_BATCH].toString());
    if (getBatchRepBracket(secRow[COL.VOTER_BATCH].toString()) !== candBracket) {
      return { success: false, message: 'For a Batch Representative nomination, the seconder must be from the same batch bracket (' + candBracket + ').' };
    }
  }

  var secToken = Utilities.getUuid();
  var secName  = (secRow[COL.VOTER_NAME].toString() + ' ' +
                  secRow[COL.VOTER_SURNAME].toString()).trim();
  var secEmail = secRow[COL.VOTER_EMAIL].toString();
  var elecId   = nom[COL.NOM_ELEC_ID].toString();

  sh.getRange(rowIndex + 1, COL.NOM_SEC_ROLL  + 1).setValue(secRoll);
  sh.getRange(rowIndex + 1, COL.NOM_SEC_TOKEN + 1).setValue(secToken);

  var secUrl = DEPLOY_URL + '?action=confirmNom&nomId=' +
    encodeURIComponent(nomId) + '&role=seconder&token=' + encodeURIComponent(secToken);
  var subject = 'Please confirm as Seconder — SSKZM OBA Election';
  var body =
    '<p>Dear ' + secName + ',</p>' +
    '<p>You have been listed as Seconder for the following nomination:</p>' +
    '<p>Candidate: <strong>' + nom[COL.NOM_CAND_NAME].toString() + '</strong><br>' +
    'Post: <strong>' + nom[COL.NOM_POST].toString() + '</strong></p>' +
    '<p><a href="' + secUrl + '">✅ Confirm as Seconder</a></p>' +
    '<p>SSKZM OBA Elections</p>';
  try { sendEmailViaSendGrid(secEmail, subject, body); } catch(e) {}

  appendAdminLog(candRoll, 'candidate_seconder_added',
    'Candidate added seconder ' + secRoll + ' for nomination ' + nomId, '', elecId);

  return { success: true, message: 'Seconder added. A confirmation email has been sent to ' + secName + '.' };
}

// ============================================================
// getDeclaredResults — public results for declared election
// Access: any authenticated session
// ============================================================
function getDeclaredResults(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };

  // Find the election — use provided ID or find most recent declared election
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  if (electionId) {
    for (var i = 0; i < elecRows.length; i++) {
      if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
        elec = elecRows[i]; break;
      }
    }
  } else {
    // Find most recently declared election
    for (var i = 0; i < elecRows.length; i++) {
      if (elecRows[i][COL.ELEC_STATUS].toString() === 'declared') {
        if (!elec || elecRows[i][COL.ELEC_CREATED_AT] > elec[COL.ELEC_CREATED_AT]) {
          elec = elecRows[i];
        }
      }
    }
  }

  if (!elec) return { success: false, message: 'No declared election found.' };
  if (elec[COL.ELEC_STATUS].toString() !== 'declared') {
    return { success: false, message: 'Results have not yet been declared.' };
  }

  var resultVis = 'full_tally';
  var showCounts = true;
  var showAll    = true;

  // Load candidates for this election
  var candRows = sheetData(SHEETS.CANDIDATES);
  var postMap  = {}; // postName -> { order, seatCount, candidates: [] }
  EC_POSTS.forEach(function(p) {
    postMap[p.name] = { order: p.order, seatCount: p.seats, candidates: [] };
  });
  for (var c = 0; c < candRows.length; c++) {
    var cr = candRows[c];
    if (cr[COL.CAND_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var post  = cr[COL.CAND_POST].toString();
    var seats = parseInt(cr[COL.CAND_SEAT_COUNT].toString()) || 1;
    if (!postMap[post]) {
      postMap[post] = {
        order:     parseInt(cr[COL.CAND_POST_ORDER] || 999),
        seatCount: seats,
        candidates: []
      };
    }
    postMap[post].candidates.push({
      id:    cr[COL.CAND_ID].toString(),
      name:  cr[COL.CAND_NAME].toString(),
      batch: cr[COL.CAND_BATCH].toString(),
      votes: 0
    });
  }

  // Count votes
  var voteRows = sheetData(SHEETS.VOTES);
  var postNota = {};
  for (var v = 0; v < voteRows.length; v++) {
    var vr = voteRows[v];
    if (vr[COL.VOTE_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var vcid  = vr[COL.VOTE_CAND_ID].toString();
    var vpost = vr[COL.VOTE_POST].toString();
    if (vcid === 'NOTA') {
      postNota[vpost] = (postNota[vpost] || 0) + 1;
    } else {
      for (var post2 in postMap) {
        for (var k = 0; k < postMap[post2].candidates.length; k++) {
          if (postMap[post2].candidates[k].id === vcid) {
            postMap[post2].candidates[k].votes++;
          }
        }
      }
    }
  }

  // Participation per post from VotedLog
  var vlogRows = sheetData(SHEETS.VOTED_LOG);
  var postVoters = {};
  for (var l = 0; l < vlogRows.length; l++) {
    var lr = vlogRows[l];
    if (lr[COL.LOG_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var lpost = lr[COL.LOG_POST].toString();
    var lroll = lr[COL.LOG_ROLL].toString();
    if (!postVoters[lpost]) postVoters[lpost] = {};
    postVoters[lpost][lroll] = true;
  }

  // Build result posts
  var posts = Object.keys(postMap).sort(function(a, b) {
    return postMap[a].order - postMap[b].order;
  });

  var postResults = posts.map(function(postName) {
    var group    = postMap[postName];
    var seats    = group.seatCount || 1;
    var nota     = postNota[postName] || 0;
    var turnout  = postVoters[postName] ? Object.keys(postVoters[postName]).length : 0;

    // Sort candidates by votes descending
    var cands = group.candidates.slice().sort(function(a, b) { return b.votes - a.votes; });

    // Mark elected (top N by seat count, unless NOTA wins)
    for (var ci = 0; ci < cands.length; ci++) {
      cands[ci].elected = (ci < seats);
    }

    return {
      post:      postName,
      seatCount: seats,
      turnout:   turnout,
      nota:      nota,
      candidates: cands.map(function(cd) {
        return {
          name:    cd.name,
          batch:   cd.batch,
          votes:   cd.votes,
          elected: cd.elected
        };
      })
    };
  });

  return {
    success:      true,
    electionId:   elec[COL.ELEC_ID].toString(),
    electionTitle: elec[COL.ELEC_TITLE].toString(),
    resultVis:    resultVis,
    posts:        postResults
  };
}

// ============================================================
// getPublicResults — unauthenticated results for declared election
// Access: PUBLIC — no session required
// Only returns data when election status = 'declared'
// electionId optional — omit to get most recent declared election
// ============================================================
function getPublicResults(electionId) {
  // Find the election
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  if (electionId) {
    for (var i = 0; i < elecRows.length; i++) {
      if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
        elec = elecRows[i]; break;
      }
    }
  } else {
    // Most recently created declared election
    for (var i = 0; i < elecRows.length; i++) {
      if (elecRows[i][COL.ELEC_STATUS].toString() === 'declared') {
        if (!elec || elecRows[i][COL.ELEC_CREATED_AT] > elec[COL.ELEC_CREATED_AT]) {
          elec = elecRows[i];
        }
      }
    }
  }

  if (!elec) return { success: false, message: 'No declared election found.' };
  if (elec[COL.ELEC_STATUS].toString() !== 'declared') {
    return { success: false, message: 'Results have not yet been declared for this election.' };
  }

  // Load candidates
  var candRows = sheetData(SHEETS.CANDIDATES);
  var postMap = {};
  EC_POSTS.forEach(function(p) {
    postMap[p.name] = { order: p.order, seatCount: p.seats, candidates: [] };
  });
  for (var c = 0; c < candRows.length; c++) {
    var cr = candRows[c];
    if (cr[COL.CAND_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var post  = cr[COL.CAND_POST].toString();
    var seats = parseInt(cr[COL.CAND_SEAT_COUNT].toString()) || 1;
    if (!postMap[post]) {
      postMap[post] = { order: parseInt(cr[COL.CAND_POST_ORDER] || 999), seatCount: seats, candidates: [] };
    }
    postMap[post].candidates.push({ id: cr[COL.CAND_ID].toString(), name: cr[COL.CAND_NAME].toString(), batch: cr[COL.CAND_BATCH].toString(), votes: 0 });
  }

  // Count votes
  var voteRows = sheetData(SHEETS.VOTES);
  var postNota = {};
  for (var v = 0; v < voteRows.length; v++) {
    var vr = voteRows[v];
    if (vr[COL.VOTE_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var vcid  = vr[COL.VOTE_CAND_ID].toString();
    var vpost = vr[COL.VOTE_POST].toString();
    if (vcid === 'NOTA') {
      postNota[vpost] = (postNota[vpost] || 0) + 1;
    } else {
      for (var post2 in postMap) {
        for (var k = 0; k < postMap[post2].candidates.length; k++) {
          if (postMap[post2].candidates[k].id === vcid) {
            postMap[post2].candidates[k].votes++;
          }
        }
      }
    }
  }

  // Participation per post from VotedLog
  var vlogRows = sheetData(SHEETS.VOTED_LOG);
  var postVoters = {};
  for (var l = 0; l < vlogRows.length; l++) {
    var lr = vlogRows[l];
    if (lr[COL.LOG_ELEC_ID].toString() !== elec[COL.ELEC_ID].toString()) continue;
    var lpost = lr[COL.LOG_POST].toString();
    var lroll = lr[COL.LOG_ROLL].toString();
    if (!postVoters[lpost]) postVoters[lpost] = {};
    postVoters[lpost][lroll] = true;
  }

  // Build post results
  var posts = Object.keys(postMap).sort(function(a, b) {
    return postMap[a].order - postMap[b].order;
  });

  var postResults = posts.map(function(postName) {
    var group   = postMap[postName];
    var seats   = group.seatCount || 1;
    var nota    = postNota[postName] || 0;
    var turnout = postVoters[postName] ? Object.keys(postVoters[postName]).length : 0;
    var cands   = group.candidates.slice().sort(function(a, b) { return b.votes - a.votes; });
    for (var ci = 0; ci < cands.length; ci++) { cands[ci].elected = (ci < seats); }
    return {
      post:      postName,
      seatCount: seats,
      turnout:   turnout,
      nota:      nota,
      candidates: cands.map(function(cd) {
        return { name: cd.name, batch: cd.batch, votes: cd.votes, elected: cd.elected };
      })
    };
  });

  return {
    success:       true,
    electionId:    elec[COL.ELEC_ID].toString(),
    electionTitle: elec[COL.ELEC_TITLE].toString(),
    posts:         postResults
  };
}

// ============================================================
// purgeTrialData — clears all transactional data for a
// trial election. Preserves Voters, Admins, Elections row,
// and AdminLog.
// Access: RO_ADMIN only. TrialElection=TRUE gate.
// ============================================================
function purgeTrialData(token, electionId, confirmPhrase, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var isRO = sess.role === 'RO_ADMIN';
  var temCheck = requiresTEMAuth(sess, authId, 'purgeTrialData', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (confirmPhrase !== 'CONFIRM PURGE') {
    return { success: false, message: 'Confirmation phrase incorrect. Type CONFIRM PURGE exactly.' };
  }

  // Verify election is a trial election
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elec = elecRows[i]; break;
    }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  if (elec[COL.ELEC_TRIAL].toString() !== 'true') {
    return { success: false, message: 'Purge is only permitted for trial elections.' };
  }

  var counts = {};
  var sheetsToPurge = [
    { key: 'Candidates',  name: SHEETS.CANDIDATES  },
    { key: 'Votes',       name: SHEETS.VOTES        },
    { key: 'VotedLog',    name: SHEETS.VOTED_LOG    },
    { key: 'Nominations', name: SHEETS.NOMINATIONS  },
    { key: 'ScrutinyLog', name: SHEETS.SCRUTINY_LOG },
    { key: 'Complaints',  name: SHEETS.COMPLAINTS   },
    { key: 'Appeals',     name: SHEETS.APPEALS      }
  ];

  for (var s = 0; s < sheetsToPurge.length; s++) {
    var sh = getSheet(sheetsToPurge[s].name);
    if (!sh) { counts[sheetsToPurge[s].key] = 0; continue; }
    var data = sh.getDataRange().getValues();
    var rowsToDelete = [];
    for (var r = 1; r < data.length; r++) {
      // Votes and VotedLog have no electionId filter —
      // for trial purge, clear ALL rows in these sheets
      if (sheetsToPurge[s].name === SHEETS.VOTES ||
          sheetsToPurge[s].name === SHEETS.VOTED_LOG) {
        rowsToDelete.push(r + 1);
      } else {
        // Check electionId in col 1 (index 1 for most sheets)
        var rowElecId = data[r][1] ? data[r][1].toString() : '';
        if (rowElecId === electionId.toString()) rowsToDelete.push(r + 1);
      }
    }
    // Delete rows bottom-up to preserve row indices
    for (var d = rowsToDelete.length - 1; d >= 0; d--) {
      sh.deleteRow(rowsToDelete[d]);
    }
    counts[sheetsToPurge[s].key] = rowsToDelete.length;
  }

  // Also clear OTPs sheet entirely (test OTPs)
  var otpSh = getSheet(SHEETS.OTPS);
  var otpCount = 0;
  if (otpSh) {
    var otpData = otpSh.getDataRange().getValues();
    otpCount = Math.max(0, otpData.length - 1);
    if (otpCount > 0) {
      otpSh.deleteRows(2, otpCount);
    }
  }
  counts['OTPs'] = otpCount;

  // Reset election status and configuration back to draft/blank
  var elecSh = getSheet(SHEETS.ELECTIONS);
  var elecData = elecSh.getDataRange().getValues();
  for (var e = 1; e < elecData.length; e++) {
    if (elecData[e][COL.ELEC_ID].toString() === electionId.toString()) {
      var eRow = e + 1;
      elecSh.getRange(eRow, COL.ELEC_STATUS             + 1).setValue('draft');
      elecSh.getRange(eRow, COL.ELEC_ORGSECY_BATCH      + 1).setValue('');
      elecSh.getRange(eRow, COL.ELEC_ORGSECY_RESTRICTED + 1).setValue(false);
      elecSh.getRange(eRow, COL.ELEC_BATCHREP_RESTRICTED+ 1).setValue(false);
      elecSh.getRange(eRow, COL.ELEC_CAND_PUB_AT        + 1).setValue('');
      elecSh.getRange(eRow, COL.ELEC_NOM_PHASE          + 1).setValue('');
      elecSh.getRange(eRow, COL.ELEC_NOM_EXT_COUNT      + 1).setValue(0);
      elecSh.getRange(eRow, COL.ELEC_NOM_EXT_DEADLINE   + 1).setValue('');
      elecSh.getRange(eRow, COL.ELEC_CERTIFIED_AT       + 1).setValue('');
      elecSh.getRange(eRow, COL.ELEC_VOTES_HASH         + 1).setValue('');
      break;
    }
  }

  appendAdminLog(sess.identity, 'trial_data_purged',
    'Trial data purged for election ' + electionId + '. ' +
    'Counts: ' + JSON.stringify(counts),
    '', electionId);

  return { success: true, counts: counts };
}

// ============================================================
// updateObjectionStatus — marks a VoterRollDraft row with an
// objection status and optional notes.
// Access: RO_ADMIN only
// Valid status: objected | resolved_retained | resolved_removed | none
// ============================================================
function updateObjectionStatus(token, rollNo, status, notes, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'updateObjectionStatus', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var allowed = ['objected', 'resolved_retained', 'resolved_removed', 'none'];
  if (allowed.indexOf(status) === -1) {
    return { success: false, message: 'Invalid status value.' };
  }
  if (!rollNo || rollNo.toString().trim() === '') {
    return { success: false, message: 'Roll number required.' };
  }

  var sh = getSheet(SHEETS.VOTER_ROLL_DRAFT);
  if (!sh) return { success: false, message: 'VoterRollDraft sheet not found.' };

  var data = sh.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL_VRD.ROLL].toString().trim() === rollNo.toString().trim()) {
      var oldStatus = data[i][COL_VRD.OBJECTION_STATUS].toString();
      sh.getRange(i + 1, COL_VRD.OBJECTION_STATUS + 1).setValue(status);
      sh.getRange(i + 1, COL_VRD.OBJECTION_NOTES + 1).setValue(notes ? notes.toString().trim() : '');
      appendAdminLog(sess.identity, 'objection_status_updated',
        'VoterRollDraft roll ' + rollNo + ': status changed from "' + oldStatus +
        '" to "' + status + '".' + (notes ? ' Notes: ' + notes : ''),
        oldStatus, status);
      found = true;
      break;
    }
  }

  if (!found) return { success: false, message: 'Roll number not found in draft.' };
  return { success: true };
}

// ============================================================
// addVoterToDraft — adds a single member to VoterRollDraft with
// status 'resolved_added' during the objection period.
// Used when a valid member is found to be missing from the draft roll.
// Prevents duplicate roll numbers.
// Access: RO_ADMIN, TEM (with AuthID)
// ============================================================
function addVoterToDraft(token, rollNo, name, surname, batch, email, notes, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'addVoterToDraft', null);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!rollNo || !rollNo.toString().trim()) return { success: false, message: 'Roll number is required.' };
  if (!name   || !name.toString().trim())   return { success: false, message: 'Name is required.' };

  var cleanRoll = rollNo.toString().trim().toUpperCase();

  // Duplicate check
  var sh   = getSheet(SHEETS.VOTER_ROLL_DRAFT);
  if (!sh) return { success: false, message: 'VoterRollDraft sheet not found.' };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL_VRD.ROLL].toString().trim().toUpperCase() === cleanRoll) {
      return { success: false, message: 'Roll number ' + cleanRoll + ' already exists in the draft roll.' };
    }
  }

  var ts  = now().toISOString();
  var newRow = new Array(13).fill('');
  newRow[COL_VRD.ROLL]              = cleanRoll;
  newRow[COL_VRD.NAME]              = name.toString().trim();
  newRow[COL_VRD.SURNAME]           = surname ? surname.toString().trim() : '';
  newRow[COL_VRD.BATCH]             = batch ? batch.toString().trim() : '';
  newRow[COL_VRD.EMAIL]             = email ? email.toString().trim() : '';
  newRow[COL_VRD.UPLOADED_AT]       = ts;
  newRow[COL_VRD.OBJECTION_STATUS]  = 'resolved_added';
  newRow[COL_VRD.OBJECTION_NOTES]   = notes ? notes.toString().trim() : '';
  newRow[COL_VRD.VERIFICATION_CAT]  = 'manual_add';

  sh.appendRow(newRow);

  appendAdminLog(sess.identity, 'voter_added_to_draft',
    'Member added to VoterRollDraft: ' + cleanRoll + ' — ' + name.toString().trim() +
    (notes ? ' | Notes: ' + notes : ''),
    '', cleanRoll);

  return { success: true, rollNo: cleanRoll };
}

// ============================================================
// certifyVoterRoll — certifies the voter roll.
// Gates:
//   1. At least one row must exist in VoterRollDraft
//   2. No rows with objection_status = 'objected' (unresolved)
// On success: copies non-removed rows to Voters sheet, logs.
// Access: RO_ADMIN only
// ============================================================
function certifyVoterRoll(token, electionId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'certifyVoterRoll', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh = getSheet(SHEETS.VOTER_ROLL_DRAFT);
  if (!sh) return { success: false, message: 'VoterRollDraft sheet not found.' };

  var data = sh.getDataRange().getValues();
  var draftRows = data.slice(1);

  if (draftRows.length === 0) {
    return { success: false, message: 'Cannot certify: voter roll draft is empty.' };
  }

  var unresolvedCount = 0;
  for (var i = 0; i < draftRows.length; i++) {
    if (draftRows[i][COL_VRD.OBJECTION_STATUS].toString() === 'objected') {
      unresolvedCount++;
    }
  }
  if (unresolvedCount > 0) {
    return {
      success: false,
      message: 'Cannot certify: ' + unresolvedCount +
        ' objection(s) unresolved. Mark each as Retained or Removed first.'
    };
  }

  var voterSh = getSheet(SHEETS.VOTERS);
  if (!voterSh) return { success: false, message: 'Voters sheet not found.' };

  var lastVoterRow = voterSh.getLastRow();
  if (lastVoterRow > 1) {
    voterSh.getRange(2, 1, lastVoterRow - 1, voterSh.getLastColumn()).clearContent();
  }

  var writeRows = [];
  var certifiedCount = 0;
  var removedCount = 0;
  for (var j = 0; j < draftRows.length; j++) {
    var r = draftRows[j];
    if (r[COL_VRD.OBJECTION_STATUS].toString() === 'resolved_removed') {
      removedCount++;
      continue;
    }
    var voterRow = new Array(14).fill('');
    voterRow[0]  = r[COL_VRD.ROLL];
    voterRow[1]  = r[COL_VRD.NAME];
    voterRow[2]  = r[COL_VRD.SURNAME];
    voterRow[3]  = r[COL_VRD.BATCH];
    voterRow[4]  = r[COL_VRD.EMAIL];
    voterRow[5]  = r[COL_VRD.PHONE_CC];
    voterRow[6]  = r[COL_VRD.PHONE];
    voterRow[7]  = r[COL_VRD.PHONE2_CC];
    voterRow[8]  = r[COL_VRD.PHONE2];
    voterRow[9]  = 'TRUE';
    voterRow[10] = 'FALSE';
    voterRow[11] = '';
    voterRow[12] = '';
    voterRow[13] = r[COL_VRD.VERIFICATION_CAT];
    writeRows.push(voterRow);
    certifiedCount++;
  }

  if (writeRows.length > 0) {
    voterSh.getRange(2, 1, writeRows.length, 14).setValues(writeRows);
  }

  appendAdminLog(sess.identity, 'voter_roll_certified',
    'Voter roll certified for election ' + (electionId || 'unspecified') + '. ' +
    certifiedCount + ' voters certified. ' + removedCount + ' removed by objection.',
    '', electionId || '');

  return { success: true, certified: certifiedCount, removed: removedCount };
}

// ============================================================
// DOCUMENT STORE MODULE
// Stores election documents in Google Drive under a structured
// folder hierarchy: SSKZM OBA Elections / {ElectionTitle}
// DocStore sheet records metadata + Drive URL for each document.
// ============================================================

function getOrCreateElectionFolder(electionId, electionTitle) {
  var ROOT_FOLDER_NAME = 'SSKZM OBA Elections';
  var rootIter = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var rootFolder;
  if (rootIter.hasNext()) {
    rootFolder = rootIter.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  }
  var subName = electionId + ' — ' + electionTitle;
  var subIter = rootFolder.getFoldersByName(subName);
  var subFolder;
  if (subIter.hasNext()) {
    subFolder = subIter.next();
  } else {
    subFolder = rootFolder.createFolder(subName);
  }
  return subFolder;
}

function storeDocument(token, electionId, category, filename, base64Data, mimeType, notes, authId, nomRef) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'storeDocument', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };
  if (!electionId || !category || !filename || !base64Data) {
    return { success: false, message: 'Missing required fields.' };
  }
  if (base64Data.length > 7000000) {
    return { success: false, message: 'File too large. Maximum size is 5MB.' };
  }

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elecTitle = electionId;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) {
      elecTitle = elecRows[i][COL.ELEC_TITLE].toString();
      break;
    }
  }

  try {
    var decoded  = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType || 'application/octet-stream',
      filename
    );
    var folder   = getOrCreateElectionFolder(electionId, elecTitle);
    var file     = folder.createFile(decoded);
    var driveUrl = file.getUrl();
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var docId  = 'DOC-' + electionId + '-' + Date.now();
    var now    = new Date().toISOString();
    var sh     = getSheet(SHEETS.DOC_STORE);
    var newRow = [];
    newRow[COL.DOC_ID]            = docId;
    newRow[COL.DOC_ELEC_ID]       = electionId;
    newRow[COL.DOC_CATEGORY]      = category;
    newRow[COL.DOC_UPLOADER_ROLL] = sess.identity;
    newRow[COL.DOC_UPLOADER_ROLE] = sess.role;
    newRow[COL.DOC_FILENAME]      = filename;
    newRow[COL.DOC_GDRIVE_URL]    = driveUrl;
    newRow[COL.DOC_UPLOADED_AT]   = now;
    var storedNotes = (nomRef ? 'nomRef:' + nomRef + '|' : '') + (notes || '');
    newRow[COL.DOC_NOTES]         = storedNotes;
    newRow[COL.DOC_LINKED_TAB]    = '';
    sh.appendRow(newRow);

    appendAdminLog(sess.identity, 'document_uploaded',
      'Document uploaded: ' + filename + ' | Category: ' + category + ' | DocID: ' + docId,
      '', electionId);

    return { success: true, docId: docId, driveUrl: driveUrl };

  } catch (err) {
    return { success: false, message: 'Upload failed: ' + err.toString() };
  }
}

// uploadNominationPhoto — voter uploads their own candidate photo
// Stores in PHOTO_FOLDER_ID GDrive folder, writes URL to NOM_PHOTO
// Access: VOTER
// ============================================================
function uploadNominationPhoto(token, electionId, base64Data, mimeType, filename) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'VOTER') return { success: false, message: 'Access denied.' };

  var allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.indexOf(mimeType) === -1) return { success: false, message: 'Only JPEG, PNG or WebP images are allowed.' };
  if (!base64Data || base64Data.length > 2700000) return { success: false, message: 'File too large. Maximum size is 2MB.' };

  // Find candidate's active nomination for this election
  var nomRows = sheetData(SHEETS.NOMINATIONS);
  var targetRow = -1;
  for (var i = 0; i < nomRows.length; i++) {
    var nr = nomRows[i];
    if (nr[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    if (nr[COL.NOM_CAND_ROLL].toString() !== sess.identity.toString()) continue;
    var st = nr[COL.NOM_STATUS].toString();
    if (st === 'withdrawn' || st === 'rejected' || st === 'consent_declined' || st === 'deadline_lapsed') continue;
    targetRow = i;
    break;
  }
  if (targetRow === -1) return { success: false, message: 'No active nomination found for this election.' };

  try {
    var folderId = PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID');
    if (!folderId) return { success: false, message: 'Photo folder not configured. Contact the RO.' };
    var folder = DriveApp.getFolderById(folderId);
    var safeFilename = 'photo_' + sess.identity + '_' + electionId + '_' + Date.now() + '.' + (mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg');
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, safeFilename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var driveUrl = file.getUrl();

    // Write URL to NOM_PHOTO column
    var sh = getSheet(SHEETS.NOMINATIONS);
    sh.getRange(targetRow + 2, COL.NOM_PHOTO + 1).setValue(driveUrl);

    appendAdminLog(sess.identity, 'nomination_photo_uploaded',
      'Photo uploaded for nomination | Election: ' + electionId + ' | File: ' + safeFilename,
      '', electionId);

    return { success: true, driveUrl: driveUrl };
  } catch (err) {
    return { success: false, message: 'Upload failed: ' + err.toString() };
  }
}

function getDocuments(token, electionId, category) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'SCRUTINEER', 'OBSERVER', 'TEM'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

  var rows = sheetData(SHEETS.DOC_STORE);
  var docs = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r[COL.DOC_ELEC_ID].toString() !== electionId.toString()) continue;
    if (category && r[COL.DOC_CATEGORY].toString() !== category) continue;
    if ((r[COL.DOC_NOTES] || '').toString().indexOf('DELETED') === 0) continue;
    docs.push({
      docId:      r[COL.DOC_ID].toString(),
      category:   r[COL.DOC_CATEGORY].toString(),
      filename:   r[COL.DOC_FILENAME].toString(),
      driveUrl:   r[COL.DOC_GDRIVE_URL].toString(),
      uploadedBy: r[COL.DOC_UPLOADER_ROLL].toString(),
      uploadedAt: r[COL.DOC_UPLOADED_AT].toString(),
      notes:      r[COL.DOC_NOTES].toString()
    });
  }
  return { success: true, docs: docs };
}

function deleteDocument(token, docId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'TEM') return { success: false, message: 'Access denied.' };
  var temCheck = requiresTEMAuth(sess, authId, 'deleteDocument');
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var sh   = getSheet(SHEETS.DOC_STORE);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.DOC_ID].toString() === docId.toString()) {
      sh.getRange(i + 1, COL.DOC_NOTES + 1).setValue(
        'DELETED by ' + sess.identity + ' at ' + new Date().toISOString()
      );
      appendAdminLog(sess.identity, 'document_deleted',
        'Document soft-deleted: ' + docId, '', rows[i][COL.DOC_ELEC_ID].toString());
      return { success: true };
    }
  }
  return { success: false, message: 'Document not found.' };
}

// ============================================================
// recordDrawOfLots — SOP Section 8.4. Records a tie-break draw
//   conducted by the RO in the presence of Scrutineers. This is
//   a write action (not derived from Votes/VotedLog) because the
//   draw itself is a physical/procedural act — the system only
//   records what happened, with full attribution.
// Access: RO_ADMIN, DEPUTY_RO, TEM (AuthID-gated)
// ============================================================
function recordDrawOfLots(token, electionId, postName, tiedCandidates, method, personsPresent, outcome, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'recordDrawOfLots', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  if (!postName || postName.trim() === '') {
    return { success: false, message: 'Post name is required.' };
  }
  if (!method || method.trim() === '') {
    return { success: false, message: 'Method of draw is required.' };
  }
  if (!personsPresent || personsPresent.trim() === '') {
    return { success: false, message: 'Persons present must be recorded.' };
  }
  if (!outcome || outcome.trim() === '') {
    return { success: false, message: 'Outcome of the draw is required.' };
  }

  var summary =
    'Post: ' + postName.trim() +
    ' | Tied candidates: ' + (tiedCandidates || '').toString().trim() +
    ' | Method: ' + method.trim() +
    ' | Persons present: ' + personsPresent.trim() +
    ' | Outcome: ' + outcome.trim();

  appendAdminLog(sess.identity, 'draw_of_lots', summary, '', electionId.toString());

  return { success: true };
}

// ============================================================
// getElectionRecordData — SOP Section 8.6. Assembles the complete
//   Election Record for a declared election from existing data
//   sources. Returns a structured object; does not yet render a
//   PDF (separate build step). Read-only — no TEM gate required.
// Access: RO_ADMIN, DEPUTY_RO, TEM, SCRUTINEER
// ============================================================
function getElectionRecordData(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM', 'SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };
  if (!electionId) return { success: false, message: 'Election ID required.' };

  // ── Election record ────────────────────────────────────────
  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) { elec = elecRows[i]; break; }
  }
  if (!elec) return { success: false, message: 'Election not found.' };
  if (elec[COL.ELEC_STATUS].toString() !== 'declared') {
    return {
      success: false,
      message: 'Election record can only be compiled after results are declared. Current status: ' +
        elec[COL.ELEC_STATUS].toString()
    };
  }

  var record = { electionId: electionId.toString() };

  // ── 1. Election summary ────────────────────────────────────
  record.election = {
    title:       elec[COL.ELEC_TITLE].toString(),
    description: elec[COL.ELEC_DESC].toString(),
    mode:        elec[COL.ELEC_MODE].toString(),
    trial:       elec[COL.ELEC_TRIAL].toString() === 'true',
    voteStart:   elec[COL.ELEC_START].toString(),
    voteClose:   elec[COL.ELEC_VOTE_CLOSE].toString(),
    declareDay:  elec[COL.ELEC_DECLARE_DAY].toString(),
    sgmDate:     elec[COL.ELEC_SGM_DATE].toString(),
    certifiedAt: elec[COL.ELEC_CERTIFIED_AT].toString(),
    candPubAt:   elec[COL.ELEC_CAND_PUB_AT].toString(),
    votesHash:   elec[COL.ELEC_VOTES_HASH].toString()
  };

  // ── 2. Certified voter roll — summary count (full roll is the Voters sheet) ──
  record.voterRoll = {
    totalCertified: sheetData(SHEETS.VOTERS).length
  };

  // ── 3. Final tally + winners summary (item 4, 6, 7) ────────
  var tallyResult = getLiveTally(token, electionId);
  record.tally = tallyResult.success ? tallyResult : { error: tallyResult.message };

  record.winnersSummary = [];
  if (tallyResult.success && tallyResult.posts) {
    tallyResult.posts.forEach(function(post) {
      var cands = post.candidates || []; // already sorted desc by getLiveTally
      var seats = post.seatCount || 1;
      var winners = cands.slice(0, seats).filter(function(c) { return c.votes > 0; });
      // Tie check at the actual seat-cutoff boundary, not 1st vs 2nd place
      var tie = !!(cands[seats - 1] && cands[seats] && cands[seats - 1].votes === cands[seats].votes);
      record.winnersSummary.push({
        post:      post.post,
        seatCount: seats,
        winners:   winners.map(function(c) { return { name: c.name, roll: c.roll, votes: c.votes }; }),
        nota:      post.nota,
        tie:       tie
      });
    });
  }

  // ── 4. Tally co-sign + votes hash verification record ──────
  var cosignLogs = [];
  var hashLogs   = [];
  var allLog     = sheetData(SHEETS.ADMIN_LOG);
  var elecIdStr  = electionId.toString();
  allLog.forEach(function(r) {
    var action = r[COL.ALOG_ACTION_TYPE].toString();
    var newVal = r[COL.ALOG_NEW_VALUE].toString();
    if (action === 'tally_cosign' && newVal === elecIdStr) cosignLogs.push(_alogRow(r));
    if ((action === 'votes_hash_verified' || action === 'votes_hash_mismatch') && newVal === elecIdStr) hashLogs.push(_alogRow(r));
  });
  record.tallyCoSigns = cosignLogs;
  record.hashVerification = hashLogs;

  // ── 5. Draw of lots (item 5) ────────────────────────────────
  record.drawOfLots = allLog
    .filter(function(r) {
      return r[COL.ALOG_ACTION_TYPE].toString() === 'draw_of_lots' &&
             r[COL.ALOG_NEW_VALUE].toString() === elecIdStr;
    })
    .map(_alogRow);

  // ── 6. ScrutinyLog — full export for this election (item 2) ─
  record.scrutinyLog = sheetData(SHEETS.SCRUTINY_LOG).filter(function(r) {
    return r[2].toString() === electionId.toString();
  }).map(function(r) {
    return {
      id: r[0], nomId: r[1], candRoll: r[3], post: r[4],
      checkItem: r[5], checkResult: r[6], notes: r[7],
      querySent: r[8], queryText: r[9], respAt: r[10], respText: r[11],
      ecSent: r[12], ecText: r[13], ecRespAt: r[14], ecResp: r[15],
      loggedAt: r[16], loggedBy: r[17]
    };
  });

  // ── 7. Final candidate list as published (item 3) ───────────
  record.candidates = sheetData(SHEETS.CANDIDATES)
    .filter(function(r) { return r[COL.CAND_ELEC_ID].toString() === electionId.toString(); })
    .map(function(r) {
      return {
        post: r[COL.CAND_POST], name: r[COL.CAND_NAME], roll: r[COL.CAND_ROLL],
        batch: r[COL.CAND_BATCH], bio: r[COL.CAND_BIO]
      };
    });

  // ── 8. AdminLog — full export (item 9) ──────────────────────
  var electionScopedLog = allLog.filter(function(r) {
    var newVal = r[COL.ALOG_NEW_VALUE].toString();
    var oldVal = r[COL.ALOG_OLD_VALUE].toString();
    var desc   = r[COL.ALOG_DESCRIPTION].toString();
    return newVal === elecIdStr || oldVal === elecIdStr || desc.indexOf(elecIdStr) !== -1;
  });
  record.adminLog = electionScopedLog.map(_alogRow);
  record.adminLogTotalSystemWide = allLog.length;

  // ── 9. Pre-Election Security Checklist (item 10) ───────────
  var checklistResult = getHandoverChecklist(token, electionId);
  record.securityChecklist = checklistResult.success ? checklistResult.items : { error: checklistResult.message };

  // ── 10. CoC complaints (item 12) ─────────────────────────────
  var complaintsResult = getComplaints(token, electionId);
  record.complaints = complaintsResult.success ? complaintsResult.complaints : [];

  // ── 11. Appeals Panel proceedings — includes OBJ-1 objections (item 14) ──
  var appealsResult = getAppeals(token, electionId);
  record.appeals = appealsResult.success ? appealsResult.appeals : [];

  // ── 12. Scrutineers and Observers with participation (item 8) ──
  var adminRows = sheetData(SHEETS.ADMINS);
  var actionCountByAdmin = {};
  allLog.forEach(function(r) {
    var id = r[COL.ALOG_ADMIN_ID].toString();
    actionCountByAdmin[id] = (actionCountByAdmin[id] || 0) + 1;
  });
  record.scrutineersAndObservers = adminRows
    .filter(function(r) {
      var role = r[COL.ADMIN_ROLE].toString();
      return role === 'SCRUTINEER' || role === 'OBSERVER';
    })
    .map(function(r) {
      var id = r[COL.ADMIN_ID].toString();
      return {
        id: id, name: r[COL.ADMIN_NAME], role: r[COL.ADMIN_ROLE],
        status: r[COL.ADMIN_STATUS], actionCount: actionCountByAdmin[id] || 0
      };
    });

  // ── 13. Known gaps — flagged explicitly rather than silently omitted ──
  record.notes = {
    technicalInterruptions: 'Not separately logged — see AdminLog entries for paused/active transitions during the voting window.',
    adminLogScope: 'AdminLog entries shown are filtered to this election on a best-effort basis (matched by election reference in the log entry). Some older or system-level action types do not carry an explicit election reference and may not appear here even if related. Total system-wide log size at time of compilation: ' + record.adminLogTotalSystemWide + ' entries.',
    vvaVerificationSummary: 'Voter Verification App summary lives in the standalone VVA project — attach separately if required.'
  };

  return { success: true, record: record };
}

// ── _alogRow — internal helper, formats one AdminLog row ──────
function _alogRow(r) {
  return {
    id: r[COL.ALOG_ID], adminId: r[COL.ALOG_ADMIN_ID], action: r[COL.ALOG_ACTION_TYPE],
    description: r[COL.ALOG_DESCRIPTION], oldValue: r[COL.ALOG_OLD_VALUE],
    newValue: r[COL.ALOG_NEW_VALUE], timestamp: r[COL.ALOG_TIMESTAMP]
  };
}
// ============================================================
// checkObjectionFiled — lets the voter-side client verify whether
//   an objection actually went through after a google.script.run
//   round-trip failure (the write can succeed server-side even
//   when the response fails to reach the browser). Used only to
//   convert a false "connection error" into the correct confirmation.
// Access: any authenticated session
// ============================================================
function checkObjectionFiled(token, nominationId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (!nominationId) return { success: false, message: 'Nomination ID required.' };

  var aplRows = sheetData(SHEETS.APPEALS);
  for (var a = 0; a < aplRows.length; a++) {
    var ar = aplRows[a];
    if (ar[COL_APL.NOM_ID].toString()        === nominationId.toString() &&
        ar[COL_APL.APPEAL_TYPE].toString()   === 'nomination_objection' &&
        ar[COL_APL.OBJECTOR_ROLL].toString() === sess.identity.toString()) {
      return { success: true, filed: true, objectionId: ar[COL_APL.ID].toString() };
    }
  }
  return { success: true, filed: false };
}

// ── _fmtISTServer ──
function _fmtISTServer(isoStr) {
  if (!isoStr) return '-';
  var ms = new Date(isoStr).getTime();
  if (isNaN(ms)) return isoStr.toString();
  var IST_OFFSET_MS = 330 * 60 * 1000;
  var d = new Date(ms + IST_OFFSET_MS);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = d.getUTCHours(), m = d.getUTCMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  var mm = m < 10 ? '0' + m : '' + m;
  return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear() +
         ', ' + h + ':' + mm + ' ' + ampm + ' IST';
}

// ── _buildElectionRecordHtml ──
function _buildElectionRecordHtml(record, generatedBy) {
  var NAVY = '#1a3a5c', GOLD = '#b8960c';
  var css =
    'body{font-family:Arial,Helvetica,sans-serif;color:#222;font-size:11px;margin:0;padding:0;}' +
    'h1{font-size:18px;color:' + NAVY + ';margin:0 0 4px;}' +
    'h2{font-size:14px;color:' + NAVY + ';border-bottom:2px solid ' + GOLD + ';' +
      'padding-bottom:4px;margin:22px 0 10px;page-break-after:avoid;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:8px;}' +
    'th{background:#f0f4f8;color:' + NAVY + ';text-align:left;padding:5px 7px;font-size:10px;border:1px solid #d9e0e7;}' +
    'td{padding:5px 7px;border:1px solid #e5e7eb;font-size:10px;vertical-align:top;}' +
    '.label{color:#555;width:180px;font-weight:bold;}' +
    '.muted{color:#888;font-style:italic;}' +
    '.banner{background:' + NAVY + ';color:#fff;padding:16px 20px;border-top:4px solid ' + GOLD + ';}' +
    '.note{background:#fef9c3;border:1px solid #fde68a;padding:8px 10px;font-size:10px;color:#92400e;margin-top:6px;}' +
    '.footer{margin-top:24px;font-size:9px;color:#888;text-align:center;}';

  var html = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';

  html += '<div class="banner"><h1 style="color:#fff;">Election Record</h1>' +
    '<div style="font-size:12px;">' + escHtml(record.election.title) + '</div>' +
    '<div style="font-size:10px;margin-top:4px;opacity:.85;">SSKZM OBA Elections - SOP Section 8.6</div></div>';

  html += '<h2>1. Election Summary</h2><table>' +
    '<tr><td class="label">Title</td><td>' + escHtml(record.election.title) + '</td></tr>' +
    '<tr><td class="label">Description</td><td>' + escHtml(record.election.description || '-') + '</td></tr>' +
    '<tr><td class="label">Mode</td><td>' + escHtml(record.election.mode) + '</td></tr>' +
    '<tr><td class="label">Trial Election</td><td>' + (record.election.trial ? 'Yes' : 'No') + '</td></tr>' +
    '<tr><td class="label">Voting Window</td><td>' + _fmtISTServer(record.election.voteStart) + ' to ' + _fmtISTServer(record.election.voteClose) + '</td></tr>' +
    '<tr><td class="label">Candidate List Published</td><td>' + _fmtISTServer(record.election.candPubAt) + '</td></tr>' +
    '<tr><td class="label">Voter Roll Certified</td><td>' + _fmtISTServer(record.election.certifiedAt) + '</td></tr>' +
    '<tr><td class="label">SGM Date</td><td>' + _fmtISTServer(record.election.sgmDate) + '</td></tr>' +
    '<tr><td class="label">Votes Sheet Hash (at close)</td><td style="font-family:monospace;font-size:9px;">' + escHtml(record.election.votesHash || '-') + '</td></tr>' +
    '<tr><td class="label">Certified Voter Roll Size</td><td>' + record.voterRoll.totalCertified + ' members</td></tr>' +
    '</table>';

  html += '<h2>2. Winners Summary (Appendix F.2)</h2><table><tr><th>Post</th><th>Winner(s) / Status</th><th>Votes</th></tr>';
  record.winnersSummary.forEach(function(w) {
    var winnerCell, votesCell;
    if (w.winners.length === 0) {
      winnerCell = '<span class="muted">No candidate contested this post — vacant</span>';
      votesCell  = '—';
    } else {
      winnerCell = w.winners.map(function(win) { return escHtml(win.name); }).join('<br>') +
        (w.tie ? ' <strong style="color:#c0392b;">(TIE for final seat - see Draw of Lots)</strong>' : '');
      votesCell  = w.winners.map(function(win) { return win.votes; }).join('<br>');
    }
    html += '<tr><td>' + escHtml(w.post) + (w.seatCount > 1 ? ' (' + w.seatCount + ' seats)' : '') +
      '</td><td>' + winnerCell + '</td><td>' + votesCell + '</td></tr>';
  });
  html += '</table>';

  html += '<h2>3. Final Candidate List as Published</h2>';
  if (record.candidates.length === 0) {
    html += '<div class="muted">No candidates on record.</div>';
  } else {
    html += '<table><tr><th>Post</th><th>Candidate</th><th>Roll No.</th><th>Batch</th></tr>';
    record.candidates.forEach(function(c) {
      html += '<tr><td>' + escHtml(c.post) + '</td><td>' + escHtml(c.name) + '</td><td>' + escHtml(c.roll) + '</td><td>' + escHtml((c.batch || '').toString()) + '</td></tr>';
    });
    html += '</table>';
  }

  html += '<h2>4. Vote Tally Co-Signature and Integrity Verification</h2>';
  html += '<table><tr><th>Event</th><th>By</th><th>Details</th><th>Timestamp</th></tr>';
  record.tallyCoSigns.forEach(function(e) {
    html += '<tr><td>Tally Co-Sign</td><td>' + escHtml(e.adminId) + '</td><td>' + escHtml(e.description) + '</td><td>' + _fmtISTServer(e.timestamp) + '</td></tr>';
  });
  record.hashVerification.forEach(function(e) {
    html += '<tr><td>' + (e.action === 'votes_hash_verified' ? 'Hash Verified' : 'HASH MISMATCH') +
      '</td><td>' + escHtml(e.adminId) + '</td><td>' + escHtml(e.description) + '</td><td>' + _fmtISTServer(e.timestamp) + '</td></tr>';
  });
  if (record.tallyCoSigns.length === 0 && record.hashVerification.length === 0) {
    html += '<tr><td colspan="4" class="muted">No co-sign or hash verification events on record.</td></tr>';
  }
  html += '</table>';

  html += '<h2>5. Record of Draw of Lots</h2>';
  if (record.drawOfLots.length === 0) {
    html += '<div class="muted">No draw of lots was conducted for this election.</div>';
  } else {
    html += '<table><tr><th>Recorded By</th><th>Details</th><th>Timestamp</th></tr>';
    record.drawOfLots.forEach(function(e) {
      html += '<tr><td>' + escHtml(e.adminId) + '</td><td>' + escHtml(e.description) + '</td><td>' + _fmtISTServer(e.timestamp) + '</td></tr>';
    });
    html += '</table>';
  }

  html += '<h2>6. Nomination Scrutiny Record</h2>';
  if (record.scrutinyLog.length === 0) {
    html += '<div class="muted">No scrutiny log entries on record.</div>';
  } else {
    html += '<table><tr><th>Candidate Roll</th><th>Post</th><th>Check Item</th><th>Result</th><th>Notes</th><th>Logged At</th><th>By</th></tr>';
    record.scrutinyLog.forEach(function(s) {
      html += '<tr><td>' + escHtml(s.candRoll) + '</td><td>' + escHtml(s.post) + '</td><td>' + escHtml(s.checkItem) +
        '</td><td>' + escHtml(s.checkResult) + '</td><td>' + escHtml(s.notes) + '</td><td>' + _fmtISTServer(s.loggedAt) +
        '</td><td>' + escHtml(s.loggedBy) + '</td></tr>';
    });
    html += '</table>';
  }

  html += '<h2>7. Code of Conduct Complaints</h2>';
  if (record.complaints.length === 0) {
    html += '<div class="muted">No complaints filed.</div>';
  } else {
    html += '<table><tr><th>Filed By</th><th>Against</th><th>Status</th><th>Decision</th><th>Filed At</th></tr>';
    record.complaints.forEach(function(cm) {
      html += '<tr><td>' + escHtml(cm.complainantRoll || '') + '</td><td>' + escHtml(cm.respondentRoll || '') +
        '</td><td>' + escHtml(cm.status || '') + '</td><td>' + escHtml(cm.decision || '') + '</td><td>' + _fmtISTServer(cm.filedAt) + '</td></tr>';
    });
    html += '</table>';
  }

  html += '<h2>8. Appeals Panel Proceedings and Decisions (including third-party objections)</h2>';
  if (record.appeals.length === 0) {
    html += '<div class="muted">No appeals or objections filed.</div>';
  } else {
    html += '<table><tr><th>Type</th><th>Candidate</th><th>Post</th><th>Filed By</th><th>Status</th><th>Decision</th><th>Filed At</th></tr>';
    record.appeals.forEach(function(a) {
      var type = a.appealType === 'nomination_objection' ? 'Third-Party Objection' : 'Rejection Appeal';
      html += '<tr><td>' + type + '</td><td>' + escHtml(a.candName) + '</td><td>' + escHtml(a.post) +
        '</td><td>' + escHtml(a.objectorRoll || '(candidate)') + '</td><td>' + escHtml(a.status) +
        '</td><td>' + escHtml(a.decision || '') + '</td><td>' + _fmtISTServer(a.filedAt) + '</td></tr>';
    });
    html += '</table>';
  }

  html += '<h2>9. Scrutineers and Observers - Participation Record</h2>';
  html += '<table><tr><th>Name / ID</th><th>Role</th><th>Status</th><th>Logged Actions</th></tr>';
  record.scrutineersAndObservers.forEach(function(s) {
    html += '<tr><td>' + escHtml(s.id) + '</td><td>' + escHtml(s.role) + '</td><td>' + escHtml(s.status) + '</td><td>' + s.actionCount + '</td></tr>';
  });
  html += '</table>';

  html += '<h2>10. Pre-Election Security Verification Checklist</h2>';
  if (record.securityChecklist && !record.securityChecklist.error) {
    html += '<table><tr><th>Item</th><th>Done</th><th>At</th><th>By</th></tr>';
    Object.keys(record.securityChecklist).forEach(function(k) {
      var item = record.securityChecklist[k];
      html += '<tr><td>' + escHtml(k) + '</td><td>' + (item.done ? 'Yes' : 'No') + '</td><td>' + _fmtISTServer(item.at) + '</td><td>' + escHtml(item.by || '') + '</td></tr>';
    });
    html += '</table>';
  } else {
    html += '<div class="muted">Checklist data unavailable.</div>';
  }

  html += '<h2>11. AdminLog - Entries for This Election (' + record.adminLog.length +
    ' of ' + record.adminLogTotalSystemWide + ' total system-wide entries)</h2>';
  html += '<table><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Description</th></tr>';
  record.adminLog.forEach(function(l) {
    html += '<tr><td>' + _fmtISTServer(l.timestamp) + '</td><td>' + escHtml(l.adminId) + '</td><td>' + escHtml(l.action) +
      '</td><td>' + escHtml(l.description) + '</td></tr>';
  });
  html += '</table>';

  html += '<h2>12. Known Gaps in This Record</h2>' +
    '<div class="note">Technical interruptions: ' + escHtml(record.notes.technicalInterruptions) + '</div>' +
    '<div class="note" style="margin-top:6px;">VVA verification summary: ' + escHtml(record.notes.vvaVerificationSummary) + '</div>' +
    '<div class="note" style="margin-top:6px;">AdminLog scope: ' + escHtml(record.notes.adminLogScope) + '</div>';

  html += '<div class="footer">Generated by ' + escHtml(generatedBy) + ' on ' + _fmtISTServer(now().toISOString()) +
    ' - SSKZM OBA Election Management System</div>';

  html += '</body></html>';
  return html;
}

// ── generateElectionRecordPDF ──
function generateElectionRecordPDF(token, electionId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'generateElectionRecordPDF', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var dataResult = getElectionRecordData(token, electionId);
  if (!dataResult.success) return { success: false, message: dataResult.message };

  var record = dataResult.record;
  var html = _buildElectionRecordHtml(record, sess.identity);

  try {
    var blob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
    var filename = 'Election Record - ' + record.election.title + ' - ' +
      Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd') + '.pdf';
    blob.setName(filename);

    var folder = getOrCreateElectionFolder(electionId, record.election.title);
    var file   = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var driveUrl = file.getUrl();

    appendAdminLog(sess.identity, 'election_record_pdf_generated',
      'Election Record PDF generated and stored: ' + filename, '', electionId);

    return { success: true, driveUrl: driveUrl, filename: filename };
  } catch (err) {
    return { success: false, message: 'PDF generation failed: ' + err.toString() };
  }
}
// ============================================================
// createPreVoteBackup - SOP Appendix H/J Part F. Exports Voters,
//   Elections, Candidates, ScrutinyLog and AdminLog sheets to CSV,
//   stores them in the election's Drive folder under a timestamped
//   Backups subfolder, and automatically records checklist items
//   F1-F5 as complete. Closes the gap between "I backed up" and
//   "the system knows I backed up."
// Access: RO_ADMIN, DEPUTY_RO, TEM (AuthID-gated)
// ============================================================
function createPreVoteBackup(token, electionId, authId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
  var temCheck = requiresTEMAuth(sess, authId, 'createPreVoteBackup', electionId);
  if (!temCheck.pass) return { success: false, message: temCheck.message };

  var elecRows = sheetData(SHEETS.ELECTIONS);
  var elec = null;
  for (var i = 0; i < elecRows.length; i++) {
    if (elecRows[i][COL.ELEC_ID].toString() === electionId.toString()) { elec = elecRows[i]; break; }
  }
  if (!elec) return { success: false, message: 'Election not found.' };

  var sheetsToBackup = [
    { key: 'F1', label: 'Voters',      name: SHEETS.VOTERS },
    { key: 'F2', label: 'Elections',   name: SHEETS.ELECTIONS },
    { key: 'F3', label: 'Candidates',  name: SHEETS.CANDIDATES },
    { key: 'F4', label: 'ScrutinyLog', name: SHEETS.SCRUTINY_LOG },
    { key: 'F5', label: 'AdminLog',    name: SHEETS.ADMIN_LOG }
  ];

  try {
    var folder = getOrCreateElectionFolder(electionId, elec[COL.ELEC_TITLE].toString());

    var backupsIter = folder.getFoldersByName('Backups');
    var backupsRoot = backupsIter.hasNext() ? backupsIter.next() : folder.createFolder('Backups');

    var ts = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd_HHmm');
    var runFolder = backupsRoot.createFolder(ts);

    var results = [];
    sheetsToBackup.forEach(function(s) {
      var sh = getSheet(s.name);
      var rowCount = 0;
      var csv = '';
      if (sh) {
        var data = sh.getDataRange().getValues();
        rowCount = data.length;
        csv = data.map(function(row) {
          return row.map(function(cell) {
            var v = (cell === null || cell === undefined) ? '' : cell.toString();
            if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) {
              v = '"' + v.replace(/"/g, '""') + '"';
            }
            return v;
          }).join(',');
        }).join('\n');
      }
      var blob = Utilities.newBlob(csv, 'text/csv', s.label + '.csv');
      var file = runFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      results.push({ key: s.key, label: s.label, url: file.getUrl(), rowCount: rowCount });

      recordChecklistItem(token, electionId, s.key,
        'Auto-backup ' + ts + ' — ' + rowCount + ' rows — ' + file.getUrl());
    });

    appendAdminLog(sess.identity, 'pre_vote_backup_created',
      'Pre-vote backup created: ' + results.length + ' sheets exported to ' + runFolder.getUrl(),
      '', electionId);

    return { success: true, folderUrl: runFolder.getUrl(), timestamp: ts, files: results };
  } catch (err) {
    return { success: false, message: 'Backup failed: ' + err.toString() };
  }
}