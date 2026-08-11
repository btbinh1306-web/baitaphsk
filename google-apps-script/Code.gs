// HSK Baitap cloud bridge: Google Sheet + Google Drive
// Deploy this script as a Web app and use the /exec URL in the app.

var SUBMISSION_FOLDER_ID = '1S39P7i1nXiX6JeSXXRiS4Y1I4zIJr_qw';
var LESSON_FOLDER_ID = '1MK2ZlsjR7sCguyLMZT0pt5KLLS0X2bN9';
var GV_PASSWORD = 'tbtt123';

var HEADERS = [
  'ID', 'Thời gian', 'Họ tên', 'Lớp', 'Bài', 'Số câu đúng', 'Đã làm', 'Tổng', 'Phần trăm',
  'Số câu sai', 'Chưa làm', 'Chi tiết câu sai', 'Bài tự luận', 'Link ghi âm',
  'Điểm bài tập (GV)', 'Nhận xét (GV)', 'Trạng thái'
];

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || '';

  if (action === 'capabilities') {
    return json_({
      ok: true,
      capabilities: {
        lessons: true,
        media: true,
        submissions: true
      }
    });
  }

  if (action === 'list_exams') return listExams_();

  if (params.mode === 'teacher') return listTeacherSubmissions_(params.pass);
  if (params.mode === 'result') return findResult_(params.id);

  return json_({ ok: true, msg: 'HSK cloud bridge is running' });
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (data.action === 'capabilities') {
      return json_({ ok: true, capabilities: { lessons: true, media: true, submissions: true } });
    }
    if (data.action === 'upload_media') return uploadMedia_(data);
    if (data.action === 'save_exam') return saveExam_(data.exam);
    if (data.action === 'delete_exam') return deleteExam_(data.id);
    if (data.action === 'grade') return gradeSubmission_(data);

    return saveSubmission_(data);
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}

function getFolder_(folderId) {
  if (!folderId || folderId.indexOf('DÁN_') >= 0) return null;
  return DriveApp.getFolderById(folderId);
}

function safeFileName_(name) {
  return String(name || 'file').replace(/[\\/:*?"<>|#%{}]/g, '_').slice(0, 140);
}

function downloadUrl_(fileId, resourceKey) {
  var url = 'https://drive.google.com/uc?export=media&id=' + encodeURIComponent(fileId);
  if (resourceKey) url += '&resourcekey=' + encodeURIComponent(resourceKey);
  return url;
}

function driveFileId_(value) {
  var match = String(value || '').match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? (match[1] || match[2]) : '';
}

function resolveDriveMediaUrl_(value) {
  var fileId = driveFileId_(value);
  if (!fileId) return value;

  var resourceKey = '';
  try {
    resourceKey = DriveApp.getFileById(fileId).getResourceKey() || '';
  } catch (error) {
    // Keep the file ID URL when the file is no longer accessible to the script owner.
  }
  return downloadUrl_(fileId, resourceKey);
}

function normalizeDriveLinks_(value) {
  if (Array.isArray(value)) return value.map(normalizeDriveLinks_);
  if (value && typeof value === 'object') {
    var copy = {};
    Object.keys(value).forEach(function(key) {
      copy[key] = normalizeDriveLinks_(value[key]);
    });
    return copy;
  }
  if (typeof value !== 'string') return value;

  return value.replace(/https?:\/\/(?:drive\.google\.com|drive\.usercontent\.google\.com)\/[^\s"'\\]+/g, function(url) {
    return resolveDriveMediaUrl_(url);
  });
}

function makeDriveFile_(folderId, fileData, fileName, mimeType) {
  var folder = getFolder_(folderId);
  if (!folder) throw new Error('Chưa cấu hình thư mục Google Drive');

  var raw = String(fileData || '');
  var marker = raw.indexOf('base64,');
  if (marker >= 0) raw = raw.slice(marker + 7);
  var bytes = Utilities.base64Decode(raw);
  var name = safeFileName_(fileName || ('hsk_' + new Date().getTime() + '.bin'));
  var blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', name);
  var file = folder.createFile(blob);

  // The app has no student Google login, so media needs a viewer URL.
  // The file ID is only returned through the app API and the sheet.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingError) {
    // Domain policies may reject public sharing; keep the file and report its Drive URL.
  }

  var resourceKey = '';
  try {
    resourceKey = file.getResourceKey() || '';
  } catch (resourceKeyError) {
    // Older files or restricted domains may not expose a resource key.
  }

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    resourceKey: resourceKey,
    url: downloadUrl_(file.getId(), resourceKey),
    driveUrl: file.getUrl()
  };
}

function uploadMedia_(data) {
  var isSubmission = data.folder === 'submission' || data.folder === 'correction';
  var result = makeDriveFile_(
    isSubmission ? SUBMISSION_FOLDER_ID : LESSON_FOLDER_ID,
    data.fileData || data.data,
    data.fileName,
    data.mimeType || data.mime
  );
  return json_({ ok: true, media: result, url: result.url, fileId: result.fileId });
}

function saveExam_(exam) {
  if (!exam || !exam.id) return json_({ ok: false, error: 'Thiếu ID bài soạn' });
  var folder = getFolder_(LESSON_FOLDER_ID);
  if (!folder) return json_({ ok: false, error: 'Chưa cấu hình thư mục HSK_SOANBAI' });

  exam = normalizeDriveLinks_(exam);

  var fileName = 'exam_' + safeFileName_(exam.id) + '.json';
  var files = folder.getFilesByName(fileName);
  var content = JSON.stringify(exam, null, 2);
  var file = files.hasNext() ? files.next() : null;
  if (file) {
    file.setContent(content);
  } else {
    file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  }

  return json_({ ok: true, exam: exam, fileId: file.getId() });
}

function deleteExam_(id) {
  if (!id) return json_({ ok: false, error: 'Thiếu ID bài soạn' });
  var folder = getFolder_(LESSON_FOLDER_ID);
  if (!folder) return json_({ ok: false, error: 'Chưa cấu hình thư mục HSK_SOANBAI' });

  var files = folder.getFilesByName('exam_' + safeFileName_(id) + '.json');
  var deleted = false;
  while (files.hasNext()) {
    files.next().setTrashed(true);
    deleted = true;
  }
  return json_({ ok: true, deleted: deleted, id: String(id) });
}

function listExams_() {
  var folder = getFolder_(LESSON_FOLDER_ID);
  if (!folder) return json_({ ok: false, error: 'Chưa cấu hình thư mục HSK_SOANBAI' });

  var exams = [];
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (!/\.json$/i.test(file.getName())) continue;
    try {
      var exam = JSON.parse(file.getBlob().getDataAsString());
      if (exam && exam.id) exams.push(normalizeDriveLinks_(exam));
    } catch (error) {
      // Ignore unrelated or malformed files in the lesson folder.
    }
  }
  return json_({ ok: true, exams: exams });
}

function decodeMediaItems_(items, folderId, prefix) {
  var links = [];
  (items || []).forEach(function(item, index) {
    try {
      if (typeof item === 'string' && item.indexOf('data:') === 0) {
        var mime = (item.match(/^data:([^;]+);base64,/) || [])[1] || 'application/octet-stream';
        var extension = mime.indexOf('/') >= 0 ? '.' + mime.split('/')[1].replace('jpeg', 'jpg') : '.bin';
        var saved = makeDriveFile_(folderId, item, prefix + '_' + (index + 1) + extension, mime);
        links.push(saved.url);
      } else if (item && item.data) {
        var media = makeDriveFile_(
          folderId,
          item.data,
          item.fileName || (prefix + '_' + (index + 1) + '.bin'),
          item.mime || item.mimeType
        );
        links.push(item.label ? item.label + ': ' + media.url : media.url);
      } else if (item && item.url) {
        links.push(item.label ? item.label + ': ' + item.url : item.url);
      } else if (typeof item === 'string' && item) {
        links.push(item);
      }
    } catch (error) {
      links.push('(lỗi lưu file ' + (index + 1) + ')');
    }
  });
  return links;
}

function saveSubmission_(data) {
  var sheet = sheet_();
  ensureHeader_(sheet);

  var imageLinks = decodeMediaItems_(data.submissionImages || [], SUBMISSION_FOLDER_ID, 'bai_lam');
  var audioLinks = decodeMediaItems_(data.audios || [], SUBMISSION_FOLDER_ID, 'ghi_am');
  var essays = String(data.essays || '');

  if (imageLinks.length && essays.indexOf('[SUBMISSION_IMAGES]') < 0) {
    essays += '\n[SUBMISSION_IMAGES]: ' + JSON.stringify(imageLinks);
  }

  var id = Utilities.getUuid().slice(0, 8);
  sheet.appendRow([
    id,
    data.time || new Date().toLocaleString('vi-VN'),
    data.name || '',
    data.class || '',
    data.lesson || '',
    data.correct || 0,
    data.done || 0,
    data.total || 0,
    String(data.percent || 0) + '%',
    data.wrongCount || 0,
    data.notDone || 0,
    data.wrong || '',
    essays,
    audioLinks.join('\n'),
    '',
    '',
    'Chờ chấm'
  ]);

  return json_({ ok: true, id: id, submissionImages: imageLinks, audioLinks: audioLinks });
}

function listTeacherSubmissions_(pass) {
  if (String(pass || '') !== String(GV_PASSWORD)) return json_({ ok: false, error: 'Sai mật khẩu' });
  var sheet = sheet_();
  ensureHeader_(sheet);
  var rows = sheet.getDataRange().getValues();
  var head = rows.shift() || HEADERS;
  var list = rows.map(function(row) {
    var item = {};
    head.forEach(function(key, index) { item[key] = normalizeDriveLinks_(row[index]); });
    return item;
  });
  return json_({ ok: true, rows: list });
}

function findResult_(id) {
  var sheet = sheet_();
  ensureHeader_(sheet);
  var rows = sheet.getDataRange().getValues();
  var head = rows.shift() || HEADERS;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      var item = {};
      head.forEach(function(key, index) { item[key] = normalizeDriveLinks_(rows[i][index]); });
      return json_({ ok: true, row: item });
    }
  }
  return json_({ ok: false, error: 'Không tìm thấy mã này' });
}

function gradeSubmission_(data) {
  if (String(data.pass || '') !== String(GV_PASSWORD)) return json_({ ok: false, error: 'Sai mật khẩu' });
  var sheet = sheet_();
  ensureHeader_(sheet);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.getRange(i + 1, 15).setValue(data.speakScore || '');
      sheet.getRange(i + 1, 16).setValue(data.comment || '');
      sheet.getRange(i + 1, 17).setValue('Đã chấm');
      return json_({ ok: true });
    }
  }
  return json_({ ok: false, error: 'Không tìm thấy ID' });
}
