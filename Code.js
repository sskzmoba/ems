// ============================================================
// SSKZM OBA EMS — System B — Code.gs
// Pass 1: Constants + doGet() + Standalone Page Builders
//         + CF backend functions required by standalone pages
// Step 6 of the Architecture Refactor Series
// ============================================================

// ── SYSTEM B IDENTIFIERS ─────────────────────────────────────

var SYSTEM_B_SHEET_ID = '1yU9DOlL7Mt6tDeA8EpUDvQj3EMj6DWPuiRXIKcExh_E';
var DEPLOY_URL        = 'https://script.google.com/macros/s/AKfycbxLGxL0GiKfExlqHN_yNMuwj5JZGd0Y5vdx6my3KAUfdH67CaEutUN2rLfzXBzw4FvJ3w/exec';
var RO_CONTACT_EMAIL  = 'ro@sskzmoba.org';    // update when RO is appointed
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
  LANDING_CONTENT:  'LandingPageContent'
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

  // ── Admins (13 cols, 0–12) ───────────────────────────────
  ADMIN_ID:0,         ADMIN_NAME:1,         ADMIN_ROLE:2,
  ADMIN_EMAIL:3,      ADMIN_TYPE:4,         ADMIN_ROLL:5,
  ADMIN_ADDED_AT:6,
  ADMIN_STATUS:7,     ADMIN_DISABLED_AT:8,  ADMIN_DISABLED_BY:9,
  ADMIN_DEPRO_ACTIVE:10, ADMIN_ACTIVATED_AT:11, ADMIN_ACTIVATED_BY:12,

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
  VOTING_RESET_REQUIRED:15
};
var COL_OBS   = {};  // Observations — 11 cols
var COL_ECDB  = {};  // ECOfficerBoardDatabase — 9 cols
var COL_SCHED = {};  // ElectionSchedule — 21 cols
var COL_TEMA  = {};  // TEMAuth — 12 cols
var COL_RPL   = {};  // ROPanelLog — 15 cols
var COL_LPC   = {};  // LandingPageContent — 7 cols

// ── EC POSTS — 21 posts in display order ─────────────────────

var EC_POSTS = [
  {name:'President',                    order:1},
  {name:'Vice President 1',             order:2},
  {name:'Vice President 2',             order:3},
  {name:'General Secretary',            order:4},
  {name:'Joint Secretary 1',            order:5},
  {name:'Joint Secretary 2',            order:6},
  {name:'Treasurer',                    order:7},
  {name:'Organising Secretary',         order:8},
  {name:'Batch Representative 1965-70', order:9},
  {name:'Batch Representative 1971-75', order:10},
  {name:'Batch Representative 1976-80', order:11},
  {name:'Batch Representative 1981-85', order:12},
  {name:'Batch Representative 1986-90', order:13},
  {name:'Batch Representative 1991-95', order:14},
  {name:'Batch Representative 1996-00', order:15},
  {name:'Batch Representative 2001-05', order:16},
  {name:'Batch Representative 2006-10', order:17},
  {name:'Batch Representative 2011-15', order:18},
  {name:'Batch Representative 2016-20', order:19},
  {name:'Batch Representative 2021-25', order:20},
  {name:'Batch Representative 2026-30', order:21}
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

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
function createElection(token, data) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
      isTrial:       row[COL.ELEC_TRIAL]       ? row[COL.ELEC_TRIAL].toString() === 'true' : false,
      vDay:          row[COL.ELEC_VDAY]        ? _toDateInputVal(row[COL.ELEC_VDAY])        : '',
      votingCloseDay:row[COL.ELEC_VOTE_CLOSE]  ? _toDateInputVal(row[COL.ELEC_VOTE_CLOSE])  : '',
      declarationDay:row[COL.ELEC_DECLARE_DAY] ? _toDateInputVal(row[COL.ELEC_DECLARE_DAY]) : ''
    }
  };
}

// ============================================================
// updateElection — saves editable fields on an election
// Access: RO_ADMIN only
// Allowed at any status — RO may correct details any time
// ============================================================
function updateElection(token, id, data) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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

  appendAdminLog(sess.identity, 'election_updated',
    'Election details updated', '', id);

  return { success: true, message: 'Saved.' };
}

// ============================================================
// deleteElection — hard delete, draft status only
// Access: RO_ADMIN only
// ============================================================
function deleteElection(token, id) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
// updateElectionStatus — advances election to a new status
// Access: RO_ADMIN only
// ============================================================
function updateElectionStatus(token, electionId, newStatus, overrideNote) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
      // Block if any appeals are pending (filed or under_review)
      if (currentStatus === 'candidates_published' && newStatus === 'active') {
        var aplRows = sheetData(SHEETS.APPEALS);
        for (var a = 0; a < aplRows.length; a++) {
          if (aplRows[a][COL_APL.ELEC_ID].toString() === electionId.toString()) {
            var aplStatus = aplRows[a][COL_APL.STATUS].toString();
            if (aplStatus === 'filed' || aplStatus === 'under_review') {
              return {
                success: false,
                message: 'Cannot activate voting — there is at least one pending appeal. ' +
                         'All appeals must be decided (upheld or dismissed) before voting can open.'
              };
            }
          }
        }
      }
      // ────────────────────────────────────────────────────────

      sh.getRange(i + 1, COL.ELEC_STATUS + 1).setValue(newStatus);
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

  // Handover checklist — hardcoded items for now (D.1 per SOP)
  var checklist = [
    { id: 'panel_published',    label: 'RO panel of 15 published to all members',        done: false },
    { id: 'vr_uploaded',       label: 'Voter roll draft uploaded to EMS',                done: false },
    { id: 'vr_app_deactivated',label: 'Voter verification app link deactivated',         done: false },
    { id: 'tem_comms',         label: 'TEM communication recorded (if applicable)',      done: false },
    { id: 'handover_submitted',label: 'Handover checklist submitted to RO',              done: false }
  ];

  // Check voter roll draft — mark done if rows exist
  var vrRows = sheetData(SHEETS.VOTER_ROLL_DRAFT);
  if (vrRows.length > 0) {
    checklist[1].done = true;
    checklist[1].note = vrRows.length + ' rows uploaded';
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
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN') {
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
function uploadVoterRollDraft(token, rows) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'EC_OFFICER' && sess.role !== 'RO_ADMIN') {
    return { success: false, message: 'Access denied.' };
  }

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

    // R15 — Tutorial page (checked before doGetNomAction delegation)
    if (action === 'tutorial') {
      return HtmlService.createHtmlOutput(buildTutorialPage())
        .setTitle('SSKZM OBA — How It Works')
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
    return buildErrorPage('EXPIRED_TOKEN',
      'The response deadline for this query has passed. Please contact the Returning Officer directly.');
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
    return standaloneShell(heading,
      '<div class="success-box">'
      + '<p style="font-size:2rem">' + (isAccept ? '✓' : '✗') + '</p>'
      + '<p>' + escHtml(res.message) + '</p>'
      + '<p class="close-note">You may close this window.</p>'
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
// R15 — buildTutorialPage
// Placeholder — full interactive content in a later pass.
// ============================================================

function buildTutorialPage() {
  return standaloneShell('How It Works',
    '<h2 style="color:#1a3a5c;margin-top:0;font-size:1.2rem">SSKZM OBA — Election System Guide</h2>'
    + '<p>The interactive guide is being prepared and will be available here shortly.</p>'
    + '<p>For guidance on using the election system, please contact the Returning Officer.</p>'
    + roContactFooter()
  );
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

    // Deadline check
    var deadline = parseDate(data[i][COL.NOM_DEADLINE]);
    if (deadline && now() > deadline) {
      var st = data[i][COL.NOM_STATUS].toString();
      if (st === 'pending_confirmation') {
        sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue('deadline_lapsed');
      }
      return { success: false,
        message: 'The nomination deadline has passed. This confirmation link is no longer valid.' };
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

    var newStatus = (propDone && secDone) ? 'pending_scrutiny' : 'pending_confirmation';
    if (propDone && secDone) {
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
      return { success: false, message: 'The response deadline has passed.' };
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
      return { success: true, message: 'You have already accepted this nomination.' };
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
    sh.getRange(i + 1, COL.NOM_STATUS         + 1).setValue('pending_confirmation');

    appendAdminLog(
      data[i][COL.NOM_CAND_ROLL].toString(),
      'candidate_consent_accepted',
      'Candidate accepted nomination for post: ' + postName,
      'consent_pending', 'pending_confirmation'
    );

    // TODO (Pass 2): trigger notification email to nominator to confirm their proposal

    return { success: true,
      message: 'You have accepted the nomination for ' + postName + '. '
        + 'The nominator has been notified to confirm their proposal.' };
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
    var role  = getAdminRole(rollNo) || 'voter';
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
    + '<p>If you wish to appeal this decision, please contact the Returning Officer.</p>'
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
      resultVis:   best[COL.ELEC_RESULT_VIS].toString()
    };
  } catch (e) {
    return { found: false, message: 'Election status unavailable.' };
  }
}

// Returns landing page content blocks from LandingPageContent sheet.
// Returns an empty object gracefully if the sheet is not yet set up.
function getLandingPageContent(electionId) {
  try {
    var rows = sheetData(SHEETS.LANDING_CONTENT);
    var content = {};
    for (var i = 0; i < rows.length; i++) {
      var key = rows[i][COL_LPC.KEY || 0].toString();
      if (key) content[key] = rows[i][COL_LPC.VALUE || 1].toString();
    }
    return { success: true, content: content };
  } catch (e) {
    return { success: false, content: {} };
  }
}

// Returns public-facing election schedule (filtered columns only).
// Carries forward from Step 3 design.
function getPublicSchedule(electionId) {
  try {
    if (!electionId) return { success: false, schedule: null };
    var rows = sheetData(SHEETS.ELECTION_SCHED);
    for (var i = 0; i < rows.length; i++) {
      // COL_SCHED populated in Pass 3 — for now return raw row
      // TODO (Pass 3): filter to public columns only using COL_SCHED
      if (rows[i][0] && rows[i][0].toString() === electionId) {
        return { success: true, schedule: rows[i] };
      }
    }
    return { success: true, schedule: null };
  } catch (e) {
    return { success: false, schedule: null };
  }
}

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
      'SchedID','ElectionID','PhaseName','PhaseCode','Status',
      'PlannedDate','ActualDate','VDayOffset','Notes',
      'SetBy','SetAt','AutoCalculated','DependsOnPhase',
      'MinDurationDays','MaxDurationDays','CanCompress','CanExtend',
      'FloorDays','CeilingDays','PublishedOnLandingPage','DisplayOrder'
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
      'ContentKey','ContentValue','ContentType','EditableBy',
      'ActiveFrom','LastUpdatedBy','LastUpdatedAt'
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
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
function addAdmin(token, data) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
  newRow[COL.ADMIN_STATUS]   = 'ACTIVE';
  // cols 8–12 left blank (disabled/activation fields — set by specific functions)

  sh.appendRow(newRow);
  appendAdminLog(sess.identity, 'admin_added',
    'Added admin: ' + data.id + ' (' + data.name + ') Role: ' + data.role,
    '', data.id);

  return { success: true };
}

// ============================================================
// disableAdmin — set admin status to DISABLED (or re-enable)
// Access: RO_ADMIN only
// ============================================================
function disableAdmin(token, adminId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  // Prevent RO from disabling themselves
  if (adminId.toString() === sess.identity.toString()) {
    return { success: false, message: 'You cannot disable your own account.' };
  }

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
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
function enableAdmin(token, adminId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  var sh = getSheet(SHEETS.ADMINS);
  if (!sh) return { success: false, message: 'Admins sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.ADMIN_ID].toString() === adminId.toString()) {
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
function activateDeputyRO(token, adminId, witnessNote) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
// deactivateDeputyRO — set DeputyROActivated=false
// Access: RO_ADMIN only
// ============================================================
function deactivateDeputyRO(token, adminId, witnessNote) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
  var allowed = ['RO_ADMIN', 'DEPUTY_RO', 'TEM'];
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
      withdrawnAt:      r[COL.NOM_WITHDRAWN_AT].toString()
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
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  var sh = getSheet(SHEETS.NOMINATIONS);
  if (!sh) return { success: false, message: 'Nominations sheet not found.' };

  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.NOM_ID].toString() !== nomId.toString()) continue;

    var status = rows[i][COL.NOM_STATUS].toString();
    var blocked = ['accepted', 'candidates_published'];
    if (blocked.indexOf(status) !== -1) {
      return { success: false, message: 'Cannot withdraw a nomination at status: ' + status };
    }
    if (status === 'withdrawn') {
      return { success: false, message: 'Nomination is already withdrawn.' };
    }

    sh.getRange(i + 1, COL.NOM_STATUS + 1).setValue('withdrawn');
    sh.getRange(i + 1, COL.NOM_WITHDRAWN_AT + 1).setValue(now().toISOString());
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
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  if (role !== 'proposer' && role !== 'seconder') {
    return { success: false, message: 'Role must be proposer or seconder.' };
  }

  var rows = sheetData(SHEETS.NOMINATIONS);
  var nom = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.NOM_ID].toString() === nomId.toString()) { nom = rows[i]; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };

  var roll  = role === 'proposer' ? nom[COL.NOM_PROP_ROLL].toString()
                                  : nom[COL.NOM_SEC_ROLL].toString();
  var confirmed = role === 'proposer'
    ? nom[COL.NOM_PROP_CONFIRMED].toString() === 'true'
    : nom[COL.NOM_SEC_CONFIRMED].toString() === 'true';

  if (confirmed) {
    return { success: false, message: 'Already confirmed — no resend needed.' };
  }
  if (!roll) {
    return { success: false, message: 'No ' + role + ' on this nomination.' };
  }

  // Look up email from Voters sheet
  var voters = sheetData(SHEETS.VOTERS);
  var email = '';
  for (var j = 0; j < voters.length; j++) {
    if (voters[j][COL.VOTER_ROLL].toString() === roll) {
      email = voters[j][COL.VOTER_EMAIL].toString();
      break;
    }
  }
  if (!email) return { success: false, message: 'Could not find email for roll: ' + roll };

  var confirmToken = role === 'proposer'
    ? nom[COL.NOM_PROP_TOKEN].toString()
    : nom[COL.NOM_SEC_TOKEN].toString();

  var confirmUrl = DEPLOY_URL + '?action=confirmNomination&nomId=' +
    nom[COL.NOM_ID] + '&role=' + role + '&token=' + confirmToken;

  var subject = 'Reminder: Please confirm your ' + role + ' role — SSKZM OBA Election';
  var body = 'Dear ' + role + ',\n\n' +
    'This is a reminder to confirm your role as ' + role + ' for the nomination of ' +
    nom[COL.NOM_CAND_NAME].toString() + ' for the post of ' +
    nom[COL.NOM_POST].toString() + '.\n\n' +
    'Please click the link below to confirm:\n' + confirmUrl + '\n\n' +
    'If you did not agree to be a ' + role + ', please ignore this email.\n\n' +
    'SSKZM OBA Elections';

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
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
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

  // Merge: saved ScrutinyLog takes precedence over auto-assess
  // (RO can override auto-assessed items if needed)
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
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
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
      break;
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

function acceptNomination(token, nomId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }

  var nomSh   = getSheet(SHEETS.NOMINATIONS);
  var nomData = nomSh.getDataRange().getValues();
  var nom = null; var nomRow = -1;
  for (var i = 1; i < nomData.length; i++) {
    if (nomData[i][COL.NOM_ID].toString() === nomId) { nom = nomData[i]; nomRow = i; break; }
  }
  if (!nom) return { success: false, message: 'Nomination not found.' };
  if (nom[COL.NOM_STATUS].toString() !== 'confirmed') {
    return { success: false, message: 'Nomination is not in confirmed status.' };
  }

  // One-post check: block if candidate already has an accepted nomination for a different post
  var candRoll = nom[COL.NOM_CAND_ROLL].toString();
  var thisPost = nom[COL.NOM_POST].toString();
  for (var k = 1; k < nomData.length; k++) {
    if (k === nomRow) continue;
    if (nomData[k][COL.NOM_CAND_ROLL].toString() === candRoll &&
        nomData[k][COL.NOM_STATUS].toString()     === 'accepted' &&
        nomData[k][COL.NOM_POST].toString()        !== thisPost) {
      return { success: false,
        message: 'Candidate already has an accepted nomination for another post.' };
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

  var postEligResult = savedItems['post_eligibility'] || 'Pending';
  if (postEligResult !== 'Yes') {
    return { success: false,
      message: 'Cannot accept: Post eligibility is marked "' + postEligResult + '". Must be Yes.' };
  }

  var tenureBarResult = savedItems['tenure_bar'] || 'Pending';
  var tenureBarOk = tenureBarResult === 'Yes' || (isBatchRep && tenureBarResult === 'N/A');
  if (!tenureBarOk) {
    return { success: false,
      message: 'Cannot accept: Consecutive tenure bar is marked "' + tenureBarResult + '".' +
               (isBatchRep ? ' Must be Yes or N/A for Batch Representative.' : ' Must be Yes.') };
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

function rejectNomination(token, nomId, reason) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var role = sess.role;
  if (role !== 'RO_ADMIN' && role !== 'DEPUTY_RO' && role !== 'TEM') {
    return { success: false, message: 'Access denied.' };
  }
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
  if (nom[COL.NOM_STATUS].toString() !== 'confirmed') {
    return { success: false, message: 'Nomination is not in confirmed status.' };
  }

  var ts = now().toISOString();
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS    + 1).setValue('rejected');
  nomSh.getRange(nomRow + 1, COL.NOM_REJECTION + 1).setValue(reason.trim());

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

function undoAcceptNomination(token, nomId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }

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
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS         + 1).setValue('confirmed');
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

function undoRejectNomination(token, nomId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }

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
  nomSh.getRange(nomRow + 1, COL.NOM_STATUS    + 1).setValue('confirmed');
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

function deleteCandidate(token, candId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }

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
        nomSh.getRange(n + 1, COL.NOM_STATUS         + 1).setValue('confirmed');
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

function recordTallyCoSign(token, electionId, confirmation) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

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

function lockECOfficers(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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

function applySheetProtections(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  var ss = SpreadsheetApp.openById(SYSTEM_B_SHEET_ID);
  var me = Session.getEffectiveUser();
  var results = [];

  var toProtect = [
    SHEETS.VOTES, SHEETS.VOTED_LOG, SHEETS.VOTERS,
    SHEETS.ADMINS, SHEETS.ADMIN_LOG, SHEETS.NOMINATIONS,
    SHEETS.SCRUTINY_LOG, SHEETS.CANDIDATES
  ];

  toProtect.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { results.push(name + ': not found'); return; }
    var existing = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    existing.forEach(function(p) { p.remove(); });
    var prot = sh.protect().setDescription('Protected at election handover');
    var editors = prot.getEditors();
    prot.removeEditors(editors);
    prot.addEditor(me);
    results.push(name + ': protected');
  });

  var otpSh = ss.getSheetByName(SHEETS.OTPS);
  if (otpSh) { otpSh.hideSheet(); results.push('OTPs: hidden'); }

  appendAdminLog(sess.identity, 'sheet_protections_applied',
    'Sheet protections applied: ' + results.join('; '), '', '');

  return { success: true, results: results };
}

// ============================================================

function recordScrutineerConfirmation(token, electionId, part, confirmationText) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  var allowed = ['RO_ADMIN','DEPUTY_RO','TEM','SCRUTINEER'];
  if (allowed.indexOf(sess.role) === -1) return { success: false, message: 'Access denied.' };

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

function recordVersionVerified(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  appendAdminLog(sess.identity, 'version_verified',
    'RO confirmed deployed version matches GitHub repository.', '', '');

  return { success: true };
}

// ============================================================

function recordGithubTransferred(token) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

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
 
  var elections = sheetData(SHEETS.ELECTIONS);
  // Priority order: active states first, then pre-vote, then post-vote
  var priority = [
    'active', 'paused', 'candidates_published',
    'scrutiny', 'nominations_open_phase2', 'nominations_open',
    'closed', 'declared', 'draft'
  ];
  var best = null;
  var bestP = priority.length;
  for (var i = 0; i < elections.length; i++) {
    var p = priority.indexOf(elections[i][COL.ELEC_STATUS].toString());
    if (p !== -1 && p < bestP) { best = elections[i]; bestP = p; }
  }
 
  if (!best) return { success: true, election: null };
 
  return {
    success: true,
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
      mode:        best[COL.ELEC_MODE].toString()
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
  // Group candidates by post, in EC_POSTS order
  var postMap = {};
  for (var j = 0; j < candRows.length; j++) {
    var row = candRows[j];
    if (row[COL.CAND_ELEC_ID].toString() !== electionId.toString()) continue;
    var post = row[COL.CAND_POST].toString();
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
  // During nominations/scrutiny: show 'confirmed' (both proposer + seconder confirmed)
  // After candidates_published: show 'accepted' only
  var elecStatus = elec[COL.ELEC_STATUS].toString();
  var showStatuses;
  if (elecStatus === 'candidates_published' || elecStatus === 'active' ||
      elecStatus === 'paused' || elecStatus === 'closed' || elecStatus === 'declared') {
    showStatuses = ['accepted'];
  } else {
    showStatuses = ['confirmed', 'accepted'];
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
    success:      true,
    posts:        posts,
    electionTitle: elec[COL.ELEC_TITLE].toString(),
    electionStatus: elecStatus
  };
}

// ============================================================
// COMPLAINTS MODULE
// ============================================================

// ============================================================
// fileComplaint — voter submits a complaint
// Access: any authenticated session
// ============================================================
function fileComplaint(token, electionId, complaintText, againstName, channel) {
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
    '',                          // AgainstRoll — blank, RO fills if needed
    againstName || '',
    complaintText.trim(),
    channel || '',
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
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
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
// updateComplaintStatus — RO updates complaint status + notes
// Access: RO_ADMIN, DEPUTY_RO
// ============================================================
function updateComplaintStatus(token, complaintId, status, roNotes, resolution) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO') {
    return { success: false, message: 'Access denied.' };
  }

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
// Access: any authenticated session
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

  var sh = getSheet(SHEETS.APPEALS);
  if (!sh) return { success: false, message: 'Appeals sheet not found.' };

  var id  = 'APL-' + new Date().getTime();
  var now = new Date();
  sh.appendRow([
    id,
    nom[COL.NOM_ELEC_ID].toString(),
    nominationId,
    nom[COL.NOM_CAND_ROLL].toString(),
    nom[COL.NOM_CAND_NAME].toString(),
    nom[COL.NOM_POST].toString(),
    now,
    appealText.trim(),
    '',           // DocLinks
    'filed',      // Status
    '',           // RONotes
    '',           // Decision
    '',           // DecidedAt
    '',           // DecidedBy
    'false',      // NomStatusUpdated
    'false'       // VotingResetRequired
  ]);

  appendAdminLog(sess.identity, 'appeal_filed',
    'Appeal filed against rejection. NomID: ' + nominationId +
    ' | Post: ' + nom[COL.NOM_POST].toString(),
    '', nom[COL.NOM_ELEC_ID].toString());

  return { success: true, appealId: id };
}

// ============================================================
// getAppeals — returns all appeals for an election
// Access: RO_ADMIN, DEPUTY_RO, SCRUTINEER
// ============================================================
function getAppeals(token, electionId) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN' && sess.role !== 'DEPUTY_RO' && sess.role !== 'SCRUTINEER') {
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
      decidedAt:   r[COL_APL.DECIDED_AT].toString()
    });
  }

  appeals.sort(function(a, b) {
    return new Date(b.filedAt) - new Date(a.filedAt);
  });

  return { success: true, appeals: appeals };
}

// ============================================================
// updateAppealDecision — RO records appeal decision
// If upheld: nomination status set back to confirmed for re-scrutiny
// Access: RO_ADMIN only (D-V6)
// ============================================================
function updateAppealDecision(token, appealId, decision, roNotes, decisionText) {
  var sess = getSession(token);
  if (!sess) return { success: false, message: 'Session expired. Please log in again.' };
  if (sess.role !== 'RO_ADMIN') return { success: false, message: 'Access denied.' };

  var validDecisions = ['filed', 'under_review', 'upheld', 'dismissed'];
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

  // If upheld — reinstate nomination to confirmed so RO can re-scrutinise
  // This is the ONLY post-rejection unlock permitted (D-V6)
  if (decision === 'upheld') {
    var nomId = appealRow[COL_APL.NOM_ID].toString();
    var nomSh = getSheet(SHEETS.NOMINATIONS);
    if (nomSh) {
      var nomRows = nomSh.getDataRange().getValues();
      for (var j = 1; j < nomRows.length; j++) {
        if (nomRows[j][COL.NOM_ID].toString() === nomId) {
          nomSh.getRange(j + 1, COL.NOM_STATUS + 1).setValue('confirmed');
          nomSh.getRange(j + 1, COL.NOM_REJECTION + 1).setValue('');
          break;
        }
      }
    }
    sh.getRange(appealRowIdx + 1, COL_APL.NOM_STATUS_UPDATED + 1).setValue('true');
    appendAdminLog(sess.identity, 'appeal_upheld_candidature_reinstated',
      'Appeal ' + appealId + ' upheld. Nomination ' + nomId +
      ' reinstated to confirmed for re-scrutiny.',
      'rejected', appealRow[COL_APL.ELEC_ID].toString());
  } else {
    appendAdminLog(sess.identity, 'appeal_decided',
      'Appeal ' + appealId + ' → ' + decision,
      appealRow[COL_APL.STATUS].toString(), appealRow[COL_APL.ELEC_ID].toString());
  }

  return { success: true };
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

  var rows = sheetData(SHEETS.VOTERS);
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

  var rows = sheetData(SHEETS.NOMINATIONS);
  var nominations = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (electionId && r[COL.NOM_ELEC_ID].toString() !== electionId.toString()) continue;
    var isCand = r[COL.NOM_CAND_ROLL].toString() === sess.identity.toString();
    var isProp = r[COL.NOM_PROP_ROLL].toString() === sess.identity.toString();
    if (!isCand && !isProp) continue;
    nominations.push({
      id:               r[COL.NOM_ID].toString(),
      post:             r[COL.NOM_POST].toString(),
      candName:         r[COL.NOM_CAND_NAME].toString(),
      candRoll:         r[COL.NOM_CAND_ROLL].toString(),
      status:           r[COL.NOM_STATUS].toString(),
      rejectionReason:  r[COL.NOM_REJECTION].toString(),
      submittedAt:      r[COL.NOM_SUBMITTED_AT].toString(),
      propConfirmed:    r[COL.NOM_PROP_CONFIRMED].toString() === 'true',
      secConfirmed:     r[COL.NOM_SEC_CONFIRMED].toString() === 'true',
      entryMethod:      r[COL.NOM_ENTRY_METHOD].toString(),
      role:             isCand ? 'candidate' : 'proposer'
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

  // 4. Look up candidate details from voter roll
  var voterRows = sheetData(SHEETS.VOTERS);
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

  var propFound = false;
  var secFound  = false;
  for (var vv = 0; vv < voterRows.length; vv++) {
    var vRoll = voterRows[vv][COL.VOTER_ROLL].toString().toUpperCase();
    if (vRoll === propRoll) propFound = true;
    if (vRoll === secRoll)  secFound  = true;
  }
  if (!propFound) return { success: false, message: 'Proposer roll number not found on voter roll.' };
  if (!secFound)  return { success: false, message: 'Seconder roll number not found on voter roll.' };

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
    'You have been listed as {ROLE} for the following nomination:\n\n' +
    'Candidate: ' + candName + '\n' +
    'Post: ' + postName + '\n' +
    'Election: ' + elec[COL.ELEC_TITLE].toString() + '\n\n' +
    'Please click the link below to confirm your role:\n{URL}\n\n' +
    'If you did not agree to this role, please ignore this email.\n\n' +
    'SSKZM OBA Elections';

  try {
    if (propEmail) {
      sendEmailViaSendGrid(propEmail,
        'Please confirm: Proposer for ' + candName + ' (' + postName + ')',
        emailBody.replace('{ROLE}', 'Proposer').replace('{URL}', propConfirmUrl));
    }
  } catch(e) {}

  try {
    if (secEmail) {
      sendEmailViaSendGrid(secEmail,
        'Please confirm: Seconder for ' + candName + ' (' + postName + ')',
        emailBody.replace('{ROLE}', 'Seconder').replace('{URL}', secConfirmUrl));
    }
  } catch(e) {}

  appendAdminLog(sess.identity, 'nomination_submitted',
    'Nomination submitted. Post: ' + postName + ' | NomID: ' + nomId,
    '', electionId);

  return { success: true, nominationId: nomId };
}
