/**
 * exe.pro.bd — Google Apps Script Backend (Download Counter & Maintainer Alerts)
 *
 * Required Notice: Copyright (c) 2026 Md. Istiak Islam (hireistiak@gmail.com)
 * Licensed under the PolyForm Noncommercial License 1.0.0.
 * Commercial use, resale, or removal of attribution is prohibited without written permission.
 */

var CONFIG = {
  CONTACT_EMAIL: 'hireistiak@gmail.com',
  PUBLIC_TOKEN: 'exe-pro-bd-public-v1',
  REQUIRE_PUBLIC_TOKEN: true,
  MAX_PAYLOAD_BYTES: 4096,
  MAX_DAILY_EMAILS: 45,
  MAX_LOG_ROWS: 500,
  COUNTS_SHEET: 'counts',
  ALLOWED_SHEET: 'allowed',
  LOGS_SHEET: 'logs',
  DL_COOLDOWN_SECONDS_PER_ID: 5,
  DL_MAX_PER_MINUTE_GLOBAL: 120,
  EMAIL_COOLDOWN_SECONDS_PER_SENDER: 600,
  EMAIL_MAX_PER_HOUR_GLOBAL: 12
};

/**
 * Default server-side allowlist of software IDs.
 * If an "allowed" sheet tab exists in the bound spreadsheet, IDs from column A
 * of that sheet are merged with this constant list. Unknown IDs are rejected
 * so arbitrary rows cannot be created in the spreadsheet.
 */
var ALLOWED_SOFTWARE_IDS = [
  'vscode',
  'firefox',
  'brave',
  'tor-browser',
  'vlc',
  'mpv',
  'foobar2000',
  'git-scm',
  'nodejs',
  'bitwarden',
  'keepassxc',
  'wireguard',
  'libreoffice',
  'obsidian',
  'sumatrapdf',
  'blender',
  'gimp',
  'inkscape',
  '7zip',
  'rufus',
  'powertoys',
  'telegram',
  'signal',
  'thunderbird'
];

var ALLOWED_ACTIONS = {
  download: true,
  request: true,
  report: true
};

/**
 * GET handler: returns only { softwareId: count } pairs for allowed IDs.
 */
function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return createJsonResponse({});
    }

    var allowedMap = getAllowedIdMap_(ss);
    var sheet = ss.getSheetByName(CONFIG.COUNTS_SHEET);
    if (!sheet) {
      return createJsonResponse({});
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createJsonResponse({});
    }

    var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var result = {};

    for (var i = 0; i < rows.length; i++) {
      var rawId = String(rows[i][0] || '').trim();
      var rawCount = Number(rows[i][1]);
      if (
        rawId &&
        allowedMap[rawId] === true &&
        !isNaN(rawCount) &&
        isFinite(rawCount) &&
        rawCount >= 0
      ) {
        result[rawId] = Math.floor(rawCount);
      }
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({});
  }
}

/**
 * POST handler: accepts only whitelisted actions ("download", "request", "report").
 */
function doPost(e) {
  try {
    if (!e || !e.postData || typeof e.postData.contents !== 'string') {
      return createErrorResponse_('Invalid request');
    }

    var rawBody = e.postData.contents;
    if (rawBody.length === 0 || rawBody.length > CONFIG.MAX_PAYLOAD_BYTES) {
      logSuspiciousEvent_('OVERSIZED_OR_EMPTY_BODY', 'Length: ' + rawBody.length);
      return createErrorResponse_('Invalid request');
    }

    var payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      logSuspiciousEvent_('MALFORMED_JSON', rawBody.slice(0, 120));
      return createErrorResponse_('Invalid request');
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return createErrorResponse_('Invalid request');
    }

    var action = sanitizeText_(payload.action, 20);
    if (!ALLOWED_ACTIONS[action]) {
      logSuspiciousEvent_('INVALID_ACTION', action);
      return createErrorResponse_('Invalid request');
    }

    if (CONFIG.REQUIRE_PUBLIC_TOKEN && payload.clientToken !== undefined) {
      if (String(payload.clientToken) !== CONFIG.PUBLIC_TOKEN) {
        logSuspiciousEvent_('TOKEN_MISMATCH', action);
        return createErrorResponse_('Invalid request');
      }
    }

    if (action === 'download') {
      return handleDownloadIncrement_(payload);
    }

    return handleSubmissionEmail_(action, payload);
  } catch (err) {
    return createErrorResponse_('Request processing failed');
  }
}

/**
 * Validates and increments the download count for a whitelisted software ID.
 */
function handleDownloadIncrement_(payload) {
  var softwareId = sanitizeIdentifier_(payload.id, 48);
  if (!softwareId) {
    return createErrorResponse_('Invalid request');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return createErrorResponse_('Service unavailable');
  }

  var allowedMap = getAllowedIdMap_(ss);
  if (allowedMap[softwareId] !== true) {
    logSuspiciousEvent_('UNKNOWN_SOFTWARE_ID', softwareId);
    return createErrorResponse_('Invalid request');
  }

  var cache = CacheService.getScriptCache();
  if (cache) {
    var idThrottleKey = 'dl_id_' + softwareId;
    if (cache.get(idThrottleKey)) {
      return createJsonResponse({ ok: true, throttled: true });
    }

    var minuteBucket = 'dl_global_' + Math.floor(Date.now() / 60000);
    var globalCount = Number(cache.get(minuteBucket) || '0');
    if (globalCount >= CONFIG.DL_MAX_PER_MINUTE_GLOBAL) {
      logSuspiciousEvent_('GLOBAL_DL_THROTTLE', 'Per-minute cap reached');
      return createErrorResponse_('Rate limit exceeded');
    }

    cache.put(idThrottleKey, '1', CONFIG.DL_COOLDOWN_SECONDS_PER_ID);
    cache.put(minuteBucket, String(globalCount + 1), 70);
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return createErrorResponse_('Server busy');
  }

  try {
    var sheet = getOrCreateCountsSheet_(ss);
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var currentCount = 0;

    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === softwareId) {
          targetRow = i + 2;
          currentCount = Math.max(0, Math.floor(Number(data[i][1]) || 0));
          break;
        }
      }
    }

    var nextCount = currentCount + 1;
    var timestamp = new Date().toISOString();

    if (targetRow > 0) {
      sheet.getRange(targetRow, 2, 1, 2).setValues([[nextCount, timestamp]]);
    } else {
      sheet.appendRow([softwareId, nextCount, timestamp]);
    }

    return createJsonResponse({ ok: true, id: softwareId, count: nextCount });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Validates and emails software requests or broken-link reports with strict quotas.
 */
function handleSubmissionEmail_(action, payload) {
  var honeypot = sanitizeText_(payload.honeypot, 100);
  if (honeypot.length > 0) {
    logSuspiciousEvent_('HONEYPOT_TRIGGERED', action);
    return createJsonResponse({ ok: true });
  }

  var softwareName = sanitizeText_(payload.softwareName, 100);
  if (softwareName.length < 2) {
    return createErrorResponse_('Invalid request');
  }

  var note = sanitizeText_(payload.note, 500);
  var pageUrl = sanitizeHttpUrl_(payload.pageUrl, 300);

  var cache = CacheService.getScriptCache();
  if (cache) {
    var hourBucket = 'email_global_' + Math.floor(Date.now() / 3600000);
    var hourlyCount = Number(cache.get(hourBucket) || '0');
    if (hourlyCount >= CONFIG.EMAIL_MAX_PER_HOUR_GLOBAL) {
      logSuspiciousEvent_('GLOBAL_EMAIL_THROTTLE', action);
      return createErrorResponse_('Rate limit exceeded');
    }

    var dedupeKey = 'dedupe_' + computeSimpleHash_(action + '|' + softwareName.toLowerCase() + '|' + note.toLowerCase());
    if (cache.get(dedupeKey)) {
      return createErrorResponse_('Duplicate submission');
    }

    cache.put(hourBucket, String(hourlyCount + 1), 3700);
    cache.put(dedupeKey, '1', 3600);
  }

  var subject = '';
  var htmlRows = [];

  if (action === 'request') {
    var ratingNum = Math.min(5, Math.max(1, Math.floor(Number(payload.rating) || 5)));
    var officialUrl = sanitizeHttpUrl_(payload.officialUrl, 300);
    var senderEmail = sanitizeEmail_(payload.email, 120);

    if (payload.email && String(payload.email).trim().length > 0 && !senderEmail) {
      return createErrorResponse_('Invalid email format');
    }

    if (cache && senderEmail) {
      var senderKey = 'email_sender_' + computeSimpleHash_(senderEmail);
      if (cache.get(senderKey)) {
        return createErrorResponse_('Rate limit exceeded');
      }
      cache.put(senderKey, '1', CONFIG.EMAIL_COOLDOWN_SECONDS_PER_SENDER);
    }

    subject = sanitizeSubject_('[Software Request] ' + softwareName + ' (' + ratingNum + '/5)');
    htmlRows = [
      ['Action', 'Software Request'],
      ['Software Name', escapeHtml_(softwareName)],
      ['User Rating', escapeHtml_(String(ratingNum) + ' / 5 Stars')],
      ['Official Link', escapeHtml_(officialUrl || 'Not provided')],
      ['Requester Email', escapeHtml_(senderEmail || 'Not provided')],
      ['Notes', escapeHtml_(note || 'Not provided')],
      ['Source Page', escapeHtml_(pageUrl || 'Not provided')],
      ['Timestamp (UTC)', escapeHtml_(new Date().toISOString())]
    ];
  } else {
    var softwareId = sanitizeIdentifier_(payload.softwareId, 48);
    var reason = sanitizeText_(payload.reason, 80) || 'Broken Link';

    subject = sanitizeSubject_('[Broken Link Report] ' + softwareName + ' — ' + reason);
    htmlRows = [
      ['Action', 'Broken Link Report'],
      ['Software Name', escapeHtml_(softwareName)],
      ['Software ID', escapeHtml_(softwareId || 'Unknown')],
      ['Reason', escapeHtml_(reason)],
      ['Additional Details', escapeHtml_(note || 'Not provided')],
      ['Source Page', escapeHtml_(pageUrl || 'Not provided')],
      ['Timestamp (UTC)', escapeHtml_(new Date().toISOString())]
    ];
  }

  if (!consumeDailyEmailQuota_()) {
    logSuspiciousEvent_('DAILY_EMAIL_CAP_REACHED', subject);
    return createErrorResponse_('Service temporarily at capacity');
  }

  if (MailApp.getRemainingDailyQuota() < 2) {
    return createErrorResponse_('Service temporarily at capacity');
  }

  var htmlBody = buildHtmlEmailTable_(subject, htmlRows);
  var plainBody = htmlRows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');

  MailApp.sendEmail({
    to: CONFIG.CONTACT_EMAIL,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    noReply: true
  });

  return createJsonResponse({ ok: true });
}

/**
 * Enforces a daily email cap in ScriptProperties to protect the owner's MailApp quota.
 */
function consumeDailyEmailQuota_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;

  try {
    var props = PropertiesService.getScriptProperties();
    var todayKey = new Date().toISOString().slice(0, 10);
    var savedDay = props.getProperty('EMAIL_QUOTA_DAY') || '';
    var used = Number(props.getProperty('EMAIL_QUOTA_COUNT') || '0');

    if (savedDay !== todayKey) {
      used = 0;
    }

    if (used >= CONFIG.MAX_DAILY_EMAILS) {
      return false;
    }

    props.setProperties({
      EMAIL_QUOTA_DAY: todayKey,
      EMAIL_QUOTA_COUNT: String(used + 1)
    });
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns an object map of allowed software IDs from the constant list and optional "allowed" sheet.
 */
function getAllowedIdMap_(ss) {
  var map = {};
  for (var i = 0; i < ALLOWED_SOFTWARE_IDS.length; i++) {
    map[ALLOWED_SOFTWARE_IDS[i]] = true;
  }

  if (ss) {
    var allowedSheet = ss.getSheetByName(CONFIG.ALLOWED_SHEET);
    if (allowedSheet && allowedSheet.getLastRow() >= 1) {
      var values = allowedSheet.getRange(1, 1, allowedSheet.getLastRow(), 1).getValues();
      for (var j = 0; j < values.length; j++) {
        var id = sanitizeIdentifier_(values[j][0], 48);
        if (id && id !== 'id') {
          map[id] = true;
        }
      }
    }
  }
  return map;
}

function getOrCreateCountsSheet_(ss) {
  var sheet = ss.getSheetByName(CONFIG.COUNTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.COUNTS_SHEET);
    sheet.appendRow(['id', 'count', 'updatedAt']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'count', 'updatedAt']);
  }
  return sheet;
}

/**
 * Appends suspicious requests to a capped "logs" sheet without exposing internal details to clients.
 */
function logSuspiciousEvent_(eventType, detail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(1500)) return;

    try {
      var sheet = ss.getSheetByName(CONFIG.LOGS_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.LOGS_SHEET);
        sheet.appendRow(['timestamp', 'eventType', 'detail']);
      }

      sheet.appendRow([
        new Date().toISOString(),
        sanitizeText_(eventType, 40),
        sanitizeText_(detail, 200)
      ]);

      var totalRows = sheet.getLastRow();
      if (totalRows > CONFIG.MAX_LOG_ROWS + 1) {
        sheet.deleteRows(2, totalRows - (CONFIG.MAX_LOG_ROWS + 1));
      }
    } finally {
      lock.releaseLock();
    }
  } catch (ignore) {}
}

function sanitizeText_(val, maxLen) {
  if (val === undefined || val === null) return '';
  var clean = String(val)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, maxLen || 200);
}

function sanitizeIdentifier_(val, maxLen) {
  var clean = sanitizeText_(val, maxLen || 48).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(clean)) return '';
  return clean;
}

function sanitizeEmail_(val, maxLen) {
  var clean = sanitizeText_(val, maxLen || 120).toLowerCase();
  if (!clean) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return '';
  return clean;
}

function sanitizeHttpUrl_(val, maxLen) {
  var clean = sanitizeText_(val, maxLen || 300);
  if (!clean) return '';
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(clean)) return '';
  return clean;
}

function sanitizeSubject_(val) {
  return String(val || '')
    .replace(/[\r\n\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function escapeHtml_(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function computeSimpleHash_(str) {
  var h = 2166136261;
  var s = String(str || '');
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function buildHtmlEmailTable_(heading, rows) {
  var trs = rows
    .map(function (r) {
      return (
        '<tr>' +
        '<td style="padding:8px 12px;border:1px solid #E2E2D8;font-weight:600;background:#F7F7F2;width:160px;">' +
        escapeHtml_(r[0]) +
        '</td>' +
        '<td style="padding:8px 12px;border:1px solid #E2E2D8;">' +
        r[1] +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  return (
    '<div style="font-family:Inter,Arial,sans-serif;color:#14181F;max-width:640px;">' +
    '<h2 style="font-size:18px;margin-bottom:12px;">' +
    escapeHtml_(heading) +
    '</h2>' +
    '<table style="border-collapse:collapse;width:100%;font-size:14px;">' +
    trs +
    '</table>' +
    '</div>'
  );
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function createErrorResponse_(genericMessage) {
  return createJsonResponse({
    ok: false,
    error: String(genericMessage || 'Invalid request')
  });
}
