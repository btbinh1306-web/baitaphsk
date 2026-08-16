import { AudioRecordItem, SubmissionData, GasConfig, TeacherGradePayload } from '../types';
import { safeSetLocalStorage } from '../utils/storageUtils';
import { deleteHandwritingSubmissions, getHandwritingSubmissions, saveHandwritingSubmission } from './handwritingService';
import {
  deleteServerSubmissions,
  saveServerSubmission,
  fetchServerSubmissions,
  fetchServerDeletedSubmissionIds,
  fetchServerSubmissionById,
  gradeServerSubmission,
  uploadMediaFile
} from './apiService';
import { DEFAULT_GAS_WEB_APP_URL, getConfiguredGasWebAppUrl, migrateGasWebAppUrl } from './gasConfig';
import { clearGasCapabilitiesCache, deleteGasSubmissions, getGasCapabilities } from './gasCloudService';
import { getGasRequestUrl } from './gasTransport';

const DEFAULT_CONFIG_KEY = 'hsk_gas_config';
const LOCAL_SUBMISSIONS_KEY = 'hsk_local_submissions_v1';

export const getGasConfig = (): GasConfig => {
  try {
    const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...parsed,
          sheetUrl: getConfiguredGasWebAppUrl()
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse GasConfig from localStorage', e);
  }
  return {
    sheetUrl: ((import.meta as any).env?.VITE_GAS_SHEET_URL as string) || DEFAULT_GAS_WEB_APP_URL,
    teacherPass: 'tbtt123'
  };
};

export const saveGasConfig = (config: GasConfig): void => {
  try {
    localStorage.setItem(
      DEFAULT_CONFIG_KEY,
      JSON.stringify({ ...config, sheetUrl: migrateGasWebAppUrl(config.sheetUrl) })
    );
    clearGasCapabilitiesCache();
  } catch (e) {
    console.warn('Failed to save GAS config:', e);
  }
};

export const normalizePercent = (rawPercent: any, correct: number, total: number): number => {
  const tot = Number(total || 0);
  const corr = Number(correct || 0);
  if (tot > 0) {
    return Math.round((corr / tot) * 100);
  }
  let parsed = parseFloat(String(rawPercent || '0').replace('%', ''));
  if (isNaN(parsed)) return 0;
  if (parsed <= 1 && parsed > 0) {
    return Math.round(parsed * 100);
  }
  return parsed;
};

const getTeacherExerciseScore = (row: any, fallback: string | number = ''): string | number => {
  const value = row?.['Điểm bài tập (GV)'] ?? row?.['Điểm Bài Tập (GV)'] ?? row?.['Điểm nói (GV)'];
  return value !== undefined && value !== null && String(value).trim() !== '' ? value : fallback;
};

export const extractImagesFromRawText = (text?: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  const urls: string[] = [];

  const addUrl = (u: string) => {
    if (!u || typeof u !== 'string') return;
    const trimmed = u.trim().replace(/^["'\\]+|["'\\]+$/g, '');
    if (trimmed.length > 10 && !trimmed.startsWith('[') && !urls.includes(trimmed)) {
      urls.push(trimmed);
    }
  };

  const normalizedText = text
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');

  // 1. Tag match [SUBMISSION_IMAGES]: [...] or [CORRECTED_IMAGES]: [...]
  const jsonTagRegex = /\[(?:SUBMISSION_IMAGES|CORRECTED_IMAGES)\]:\s*(\[.*?\])/gs;
  let tagMatch;
  while ((tagMatch = jsonTagRegex.exec(normalizedText)) !== null) {
    if (tagMatch[1]) {
      try {
        const parsed = JSON.parse(tagMatch[1]);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => typeof item === 'string' && addUrl(item));
        }
      } catch (e) {
        // Fallback: extract string literals inside tag array if JSON.parse fails
        const strMatches = tagMatch[1].match(/"(data:image\/[^"]+|https?:\/\/[^"]+)"/g);
        if (strMatches) {
          strMatches.forEach((m) => addUrl(m));
        }
      }
    }
  }

  // 2. Base64 images anywhere
  const base64Regex = /data:image\/[a-zA-Z0-9]+;base64,[a-zA-Z0-9+/=]+/g;
  const base64Matches = normalizedText.match(base64Regex);
  if (base64Matches) {
    base64Matches.forEach((m) => addUrl(m));
  }

  // 3. HTTP image links
  const httpRegex = /https?:\/\/[^\s"'\\]+\.(?:png|jpg|jpeg|webp|gif)/gi;
  const httpMatches = normalizedText.match(httpRegex);
  if (httpMatches) {
    httpMatches.forEach((m) => addUrl(m));
  }

  return urls;
};

export const extractTeacherFeedbackAudiosFromRawText = (text?: string): AudioRecordItem[] => {
  if (!text || typeof text !== 'string') return [];

  const normalizedText = text
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/');
  const tagMatch = normalizedText.match(/\[TEACHER_FEEDBACK_AUDIOS\]:\s*(\[.*?\])/s);
  if (!tagMatch?.[1]) return [];

  try {
    const parsed = JSON.parse(tagMatch[1]);
    if (!Array.isArray(parsed)) return [];

    return parsed.reduce<AudioRecordItem[]>((items, item, index) => {
      if (!item || typeof item !== 'object') return items;
      const record = item as Partial<AudioRecordItem>;
      if (!record.teacherFeedbackUrl) return items;
      items.push({
        label: String(record.label || `Ghi âm câu ${index + 1}`),
        data: '',
        mime: 'audio/webm',
        teacherFeedbackUrl: String(record.teacherFeedbackUrl),
        teacherFeedbackLabel: record.teacherFeedbackLabel ? String(record.teacherFeedbackLabel) : undefined
      });
      return items;
    }, []);
  } catch (error) {
    console.warn('Không thể đọc file chữa ghi âm từ nhận xét:', error);
    return [];
  }
};

export const mergeAudioRecords = (
  primary?: AudioRecordItem[],
  fallback?: AudioRecordItem[]
): AudioRecordItem[] | undefined => {
  if ((!primary || primary.length === 0) && (!fallback || fallback.length === 0)) return undefined;

  const length = Math.max(primary?.length || 0, fallback?.length || 0);
  return Array.from({ length }, (_, index) => {
    const preferred = primary?.[index];
    const backup = fallback?.[index];
    const merged = { ...(backup || {}), ...(preferred || {}) } as AudioRecordItem;

    // A remote record may intentionally omit local base64 data after upload.
    if (!preferred?.data && backup?.data) merged.data = backup.data;
    if (!preferred?.url && backup?.url) merged.url = backup.url;
    if (!preferred?.teacherFeedbackUrl && backup?.teacherFeedbackUrl) {
      merged.teacherFeedbackUrl = backup.teacherFeedbackUrl;
    }
    if (!preferred?.teacherFeedbackLabel && backup?.teacherFeedbackLabel) {
      merged.teacherFeedbackLabel = backup.teacherFeedbackLabel;
    }

    return merged;
  });
};

const extractAudioRecordsFromDriveLinks = (rawLinks?: string): AudioRecordItem[] => {
  return String(rawLinks || '')
    .split('\n')
    .filter(Boolean)
    .map((link, index) => ({
      label: link.split(':')[0] || `Ghi âm câu ${index + 1}`,
      data: '',
      mime: 'audio/webm',
      url: link.substring(link.indexOf('http'))
    }));
};

export const cleanImageTagsFromText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\[CORRECTED_IMAGES\]:\s*\[.*?\]/gs, '')
    .replace(/\[SUBMISSION_IMAGES\]:\s*\[.*?\]/gs, '')
    .replace(/\[TEACHER_FEEDBACK_AUDIOS\]:\s*\[.*?\]/gs, '')
    .replace(/\[CORRECTED_IMAGES\]:\s*".*?"/gs, '')
    .replace(/\[SUBMISSION_IMAGES\]:\s*".*?"/gs, '')
    .replace(/data:image\/[a-zA-Z0-9]+;base64,[a-zA-Z0-9+/=]+/g, '')
    .replace(/\[Nộp bài chép từ mới\]\s*Bài:.*?\(\d+\s*ảnh\)/gi, '')
    .replace(/\[Nộp bài chép tay\]\s*\d+\s*ảnh/gi, '')
    .trim();
};

export const getLocalSubmissions = (): SubmissionData[] => {
  try {
    const data = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (data) {
      const parsed: SubmissionData[] = JSON.parse(data);
      return parsed.map((sub) => ({
        ...sub,
        percent: normalizePercent(sub.percent, sub.correct, sub.total)
      }));
    }
  } catch (e) {
    console.warn('Error reading local submissions', e);
  }
  return [];
};

export const saveLocalSubmission = (sub: SubmissionData, syncServer = true, replaceId?: string): void => {
  const current = getLocalSubmissions();
  if (replaceId && replaceId !== sub.id) {
    const oldIndex = current.findIndex((item) => item.id === replaceId);
    if (oldIndex >= 0) current.splice(oldIndex, 1);
  }
  // Check if exists, update or prepend
  const idx = current.findIndex((item) => item.id === sub.id);
  if (idx >= 0) {
    current[idx] = sub;
  } else {
    current.unshift(sub);
  }
  safeSetLocalStorage(LOCAL_SUBMISSIONS_KEY, current);

  // Sync with server DB for cross-device access
  if (syncServer) void saveServerSubmission(sub);
};

export const deleteSubmissionsInGas = async (
  ids: string[],
  pass: string
): Promise<{ ok: boolean; error?: string }> => {
  const normalizedIds = Array.from(new Set(ids.map(String).map((id) => id.trim()).filter(Boolean)));
  if (normalizedIds.length === 0) return { ok: false, error: 'Không có mã bài nộp để xoá' };

  const config = getGasConfig();
  if (pass !== config.teacherPass && pass !== 'tbtt123' && pass !== 'gv123') {
    return { ok: false, error: 'Mật khẩu giáo viên không đúng' };
  }

  // Keep the shared server tombstone authoritative even when an older GAS
  // deployment cannot delete its Sheet row yet. This prevents stale rows from
  // being restored by another device while the Apps Script is being updated.
  await deleteGasSubmissions(normalizedIds, pass);

  const serverDeleted = await deleteServerSubmissions(normalizedIds);
  if (!serverDeleted) {
    return { ok: false, error: 'Không thể xoá bài nộp trên máy chủ' };
  }

  const idSet = new Set(normalizedIds.map((id) => id.toLowerCase()));
  safeSetLocalStorage(
    LOCAL_SUBMISSIONS_KEY,
    getLocalSubmissions().filter((sub) => !idSet.has(String(sub.id).trim().toLowerCase()))
  );
  deleteHandwritingSubmissions(normalizedIds);
  return { ok: true };
};

/**
 * Submit exam response to Google Apps Script / Google Sheet
 */
export const submitToGas = async (
  payload: Omit<SubmissionData, 'id' | 'status'> & {
    action?: string;
    audios?: Array<{ data: string; mime: string; label: string }>;
  }
): Promise<{ ok: boolean; id?: string; error?: string }> => {
  const config = getGasConfig();
  const localId = Math.random().toString(36).substring(2, 10);
  const fullTime = new Date().toLocaleString('vi-VN');
  const gasCapabilities = await getGasCapabilities();
  const gasMediaEnabled = Boolean(gasCapabilities?.media);

  const serverAudios: AudioRecordItem[] = await Promise.all(
    (payload.audios || []).map(async (audio) => {
      if (!gasMediaEnabled || !audio.data) return audio;
      const dataUrl = audio.data.startsWith('data:')
        ? audio.data
        : `data:${audio.mime || 'audio/webm'};base64,${audio.data}`;
      const uploadedUrl = await uploadMediaFile(dataUrl, undefined, audio.mime, 'submission');
      return uploadedUrl && !uploadedUrl.startsWith('/api/')
        ? { ...audio, data: '', url: uploadedUrl }
        : audio;
    })
  );

  let essaysFormatted = payload.essays || '';
  if (payload.submissionImages && payload.submissionImages.length > 0) {
    if (!essaysFormatted.includes('[SUBMISSION_IMAGES]')) {
      essaysFormatted += `\n[SUBMISSION_IMAGES]: ${JSON.stringify(payload.submissionImages)}`;
    }
  }

  // Prepare full local record first
  const newSubRecord: SubmissionData = {
    id: localId,
    time: payload.time || fullTime,
    name: payload.name,
    class: payload.class,
    lesson: payload.lesson,
    correct: payload.correct,
    done: payload.done,
    total: payload.total,
    percent: payload.percent,
    wrongCount: payload.wrongCount,
    notDone: payload.notDone,
    wrong: payload.wrong,
    essays: essaysFormatted,
    audios: serverAudios,
    submissionImages: payload.submissionImages,
    isHandwriting: payload.isHandwriting || (payload.submissionImages && payload.submissionImages.length > 0),
    speakScore: '',
    comment: '',
    status: 'Chờ chấm'
  };

  // Always save locally so it works even offline or without configured URL
  saveLocalSubmission(newSubRecord, false);

  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
    await saveServerSubmission(newSubRecord);
    // Return local submission ID with success
    return {
      ok: true,
      id: localId
    };
  }

  try {
    const bodyData = {
      action: payload.action || 'submit',
      time: payload.time || fullTime,
      name: payload.name,
      class: payload.class,
      lesson: payload.lesson,
      correct: payload.correct,
      done: payload.done,
      total: payload.total,
      percent: payload.percent,
      wrongCount: payload.wrongCount,
      notDone: payload.notDone,
      wrong: payload.wrong,
      essays: essaysFormatted,
      audios: gasMediaEnabled ? serverAudios : (payload.audios || []),
      submissionImages: payload.submissionImages || []
    };

    const res = await fetch(getGasRequestUrl(config.sheetUrl.trim()), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();
    if (data && data.ok) {
      if (data.id) {
        // Update local ID if server assigned a different one
        newSubRecord.id = String(data.id);
      }
      saveLocalSubmission(newSubRecord, false, localId);
      await saveServerSubmission(newSubRecord);
      return { ok: true, id: data.id || localId };
    } else {
      await saveServerSubmission(newSubRecord);
      return { ok: false, error: data?.error || 'Lỗi khi gửi lên Apps Script' };
    }
  } catch (err: any) {
    console.error('GAS POST submit error:', err);
    await saveServerSubmission(newSubRecord);
    // Even if GAS fetch fails (e.g., CORS or network error), we return success with local ID & warn
    return {
      ok: true,
      id: localId,
      error: 'Bài nộp đã được lưu tạm trên trình duyệt (Lỗi kết nối Sheet: ' + (err?.message || 'Không phản hồi') + ')'
    };
  }
};

/**
 * Fetch all submissions for teacher
 */
export const fetchTeacherSubmissions = async (
  pass: string
): Promise<{ ok: boolean; rows?: SubmissionData[]; error?: string }> => {
  const config = getGasConfig();

  if (pass !== config.teacherPass && pass !== 'tbtt123' && pass !== 'gv123') {
    return { ok: false, error: 'Mật khẩu giáo viên không đúng' };
  }

  // 1. Fetch server database submissions
  const [serverSubs, deletedServerIds] = await Promise.all([
    fetchServerSubmissions(),
    fetchServerDeletedSubmissionIds()
  ]);
  const deletedIdSet = new Set(deletedServerIds.map((id) => String(id).trim().toLowerCase()));
  const localSubs = getLocalSubmissions().filter(
    (sub) => !deletedIdSet.has(String(sub.id).trim().toLowerCase())
  );

  const subMap = new Map<string, SubmissionData>();
  localSubs.forEach((s) => subMap.set(s.id, s));
  serverSubs.filter((s) => !deletedIdSet.has(String(s.id).trim().toLowerCase())).forEach((s) => {
    const existing = subMap.get(s.id);
    subMap.set(s.id, {
      ...existing,
      ...s,
      audios: mergeAudioRecords(s.audios, existing?.audios)
    });
  });

  // 2. Fetch Google Sheets remote submissions if URL configured
  const remoteSubmissionIds = new Set<string>();
  let gasReadSucceeded = false;
  let gasReadError = '';
  if (config.sheetUrl && config.sheetUrl.trim() !== '') {
    try {
      const url = new URL(config.sheetUrl.trim());
      url.searchParams.append('mode', 'teacher');
      url.searchParams.append('pass', pass);

      const res = await fetch(getGasRequestUrl(url.toString()), {
        method: 'GET'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.ok && Array.isArray(data.rows)) {
        gasReadSucceeded = true;
        data.rows.forEach((r: any) => {
          const correct = Number(r['Số câu đúng'] || 0);
          const total = Number(r['Tổng'] || 0);
          const rawEssays = String(r['Bài tự luận'] || '');
          const rawComment = String(r['Nhận xét (GV)'] || '');

          const extractedSubImgs = extractImagesFromRawText(rawEssays);
          const extractedCorrImgs = extractImagesFromRawText(rawComment);
          const extractedFeedbackAudios = extractTeacherFeedbackAudiosFromRawText(rawComment);
          const driveAudios = extractAudioRecordsFromDriveLinks(String(r['Link ghi âm'] || ''));
          const cleanedComment = cleanImageTagsFromText(rawComment);
          const id = String(r['ID'] || r['id'] || '');

          if (id && !deletedIdSet.has(id.trim().toLowerCase())) {
            remoteSubmissionIds.add(id);
            const existing = subMap.get(id);
            const mapped: SubmissionData = {
              id: id,
              time: String(r['Thời gian'] || r['time'] || existing?.time || ''),
              name: String(r['Họ tên'] || r['name'] || existing?.name || ''),
              class: String(r['Lớp'] || r['class'] || existing?.class || ''),
              lesson: String(r['Bài'] || r['lesson'] || existing?.lesson || ''),
              correct: correct,
              done: Number(r['Đã làm'] || 0),
              total: total,
              percent: normalizePercent(r['Phần trăm'], correct, total),
              wrongCount: Number(r['Số câu sai'] || 0),
              notDone: Number(r['Chưa làm'] || 0),
              wrong: String(r['Chi tiết câu sai'] || ''),
              essays: rawEssays || existing?.essays || '',
              driveLinks: String(r['Link ghi âm'] || ''),
              speakScore: getTeacherExerciseScore(r, existing?.speakScore || ''),
              comment: cleanedComment || existing?.comment || '',
              teacherComment: cleanedComment || existing?.teacherComment || '',
              submissionImages: extractedSubImgs.length > 0 ? extractedSubImgs : existing?.submissionImages,
              correctedImages: extractedCorrImgs.length > 0 ? extractedCorrImgs : existing?.correctedImages,
              duplicateIds: existing?.duplicateIds,
              status: (r['Trạng thái'] === 'Đã chấm' || existing?.status === 'Đã chấm') ? 'Đã chấm' : 'Chờ chấm',
              audios: mergeAudioRecords(
                extractedFeedbackAudios,
                mergeAudioRecords(driveAudios, existing?.audios)
              ),
              isHandwriting: existing?.isHandwriting || extractedSubImgs.length > 0
            };
            subMap.set(id, mapped);
          }
        });
      } else {
        gasReadError = data?.error || 'Apps Script không trả về danh sách bài nộp hợp lệ';
      }
    } catch (err: any) {
      console.warn('GAS GET teacher error:', err);
      gasReadError = 'Không thể kết nối Google Sheet';
    }
  }

  // When Google Sheet is configured, never fall back to stale server/browser
  // rows. A failed remote read must be visible as an error, not as old data.
  if (config.sheetUrl && config.sheetUrl.trim() !== '' && !gasReadSucceeded) {
    return {
      ok: false,
      rows: [],
      error: gasReadError || 'Không thể đọc danh sách bài nộp từ Google Sheet'
    };
  }

  // Do not re-upload stale browser copies after a successful Google Sheet read.
  // The Sheet is authoritative whenever its request succeeded, including []
  // after the teacher has intentionally cleared all submissions.
  if (!gasReadSucceeded) {
    const serverSubmissionIds = new Set(serverSubs.map((sub) => sub.id));
    await Promise.all(
      localSubs
        .filter((sub) => !serverSubmissionIds.has(sub.id))
        .map((sub) => saveServerSubmission(sub))
    );
  }

  const dedupedRows = new Map<string, SubmissionData>();
  const sourceRows = gasReadSucceeded
    ? Array.from(subMap.values()).filter((row) => remoteSubmissionIds.has(row.id))
    : Array.from(subMap.values());
  sourceRows.forEach((row) => {
    const images = (row.submissionImages || []).map(String).filter(Boolean).sort();
    const isHandwriting = Boolean(row.isHandwriting || images.length > 0);
    const identity = [
      row.name.trim().toLowerCase(),
      row.class.trim().toLowerCase(),
      row.lesson.trim().toLowerCase(),
      row.time.trim(),
      row.correct,
      row.done,
      row.total,
      row.percent,
      row.wrongCount,
      row.notDone,
      row.wrong,
      row.essays
    ].join(':');
    const dedupeKey = isHandwriting
      ? `handwriting:${row.exerciseId || row.lesson}:${row.name.trim().toLowerCase()}:${row.class.trim().toLowerCase()}:${images.join('|')}`
      : `submission:${identity}`;
    const previous = dedupedRows.get(dedupeKey);

    if (!previous) {
      dedupedRows.set(dedupeKey, row);
      return;
    }

    const rowIsRemote = remoteSubmissionIds.has(row.id);
    const previousIsRemote = remoteSubmissionIds.has(previous.id);
    const preferred = rowIsRemote && !previousIsRemote ? row : previous;
    const secondary = preferred === row ? previous : row;
    dedupedRows.set(dedupeKey, {
      ...secondary,
      ...preferred,
      id: preferred.id,
      duplicateIds: Array.from(
        new Set([...(preferred.duplicateIds || []), ...(secondary.duplicateIds || []), preferred.id, secondary.id])
      ),
      submissionImages: preferred.submissionImages?.length
        ? preferred.submissionImages
        : secondary.submissionImages,
      correctedImages: preferred.correctedImages?.length
        ? preferred.correctedImages
        : secondary.correctedImages,
      audios: mergeAudioRecords(preferred.audios, secondary.audios),
      comment: preferred.comment || secondary.comment,
      teacherComment: preferred.teacherComment || secondary.teacherComment,
      status: preferred.status === 'Đã chấm' || secondary.status === 'Đã chấm' ? 'Đã chấm' : 'Chờ chấm'
    });
  });

  const allRows = Array.from(dedupedRows.values());
  return { ok: true, rows: allRows };
};

/**
 * Fetch individual result by submission ID for Student
 */
export const fetchResultById = async (
  id: string
): Promise<{ ok: boolean; row?: SubmissionData; error?: string }> => {
  const config = getGasConfig();

  // Try local first
  const locals = getLocalSubmissions();
  let localMatch = locals.find((item) => String(item.id).trim().toLowerCase() === id.trim().toLowerCase());

  const deletedServerIds = await fetchServerDeletedSubmissionIds();
  if (deletedServerIds.some((deletedId) => String(deletedId).trim().toLowerCase() === id.trim().toLowerCase())) {
    return { ok: false, error: 'Bài nộp này đã được giáo viên xoá' };
  }

  const serverMatch = await fetchServerSubmissionById(id.trim());
  if (serverMatch) {
    localMatch = {
      ...serverMatch,
      audios: mergeAudioRecords(serverMatch.audios, localMatch?.audios),
      submissionImages: Array.from(new Set([
        ...(serverMatch.submissionImages || []),
        ...(localMatch?.submissionImages || [])
      ])),
      correctedImages: Array.from(new Set([
        ...(serverMatch.correctedImages || []),
        ...(localMatch?.correctedImages || [])
      ])),
      comment: serverMatch.comment || localMatch?.comment,
      teacherComment: serverMatch.teacherComment || localMatch?.teacherComment,
      exerciseId: serverMatch.exerciseId || localMatch?.exerciseId
    };
  }

  const hwList = getHandwritingSubmissions();
  const hwMatch = hwList.find((item) => String(item.id).trim().toLowerCase() === id.trim().toLowerCase());

  if (!localMatch && hwMatch) {
    localMatch = {
      id: hwMatch.id,
      time: hwMatch.submittedAt || new Date().toLocaleString('vi-VN'),
      name: hwMatch.studentName,
      class: hwMatch.studentClass || 'Mặc định',
      lesson: hwMatch.exerciseTitle,
      correct: hwMatch.status === 'graded' ? 10 : 0,
      done: hwMatch.submissionImages.length,
      total: hwMatch.submissionImages.length || 1,
      percent: hwMatch.status === 'graded' ? 100 : 0,
      wrongCount: 0,
      notDone: 0,
      wrong: '',
      essays: `[Nộp bài chép tay] ${hwMatch.submissionImages.length} ảnh`,
      speakScore: hwMatch.status === 'graded' ? 'Đạt' : '',
      comment: hwMatch.teacherComment || '',
      status: hwMatch.status === 'graded' ? 'Đã chấm' : 'Chờ chấm',
      isHandwriting: true,
      exerciseId: hwMatch.exerciseId,
      submissionImages: hwMatch.submissionImages,
      correctedImages: hwMatch.correctedImages || [],
      teacherComment: hwMatch.teacherComment || ''
    };
  }

  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
    if (localMatch) {
      return { ok: true, row: localMatch };
    }
    return { ok: false, error: 'Không tìm thấy mã bài nộp này trong bộ nhớ local' };
  }

  try {
    const url = new URL(config.sheetUrl.trim());
    url.searchParams.append('mode', 'result');
    url.searchParams.append('id', id.trim());

    const res = await fetch(getGasRequestUrl(url.toString()), {
      method: 'GET'
    });

    const data = await res.json();
    if (data && data.ok && data.row) {
      const r = data.row;
      const correct = Number(r['Số câu đúng'] || 0);
      const total = Number(r['Tổng'] || 0);
      const rawEssays = String(r['Bài tự luận'] || '');
      const rawComment = String(r['Nhận xét (GV)'] || '');

      const extractedSubImgs = extractImagesFromRawText(rawEssays);
      const extractedCorrImgs = extractImagesFromRawText(rawComment);
      const extractedFeedbackAudios = extractTeacherFeedbackAudiosFromRawText(rawComment);
      const driveAudios = extractAudioRecordsFromDriveLinks(String(r['Link ghi âm'] || ''));
      const cleanedComment = cleanImageTagsFromText(rawComment);

      const mapped: SubmissionData = {
        id: String(r['ID'] || id),
        time: String(r['Thời gian'] || ''),
        name: String(r['Họ tên'] || ''),
        class: String(r['Lớp'] || ''),
        lesson: String(r['Bài'] || ''),
        correct: correct,
        done: Number(r['Đã làm'] || 0),
        total: total,
        percent: normalizePercent(r['Phần trăm'], correct, total),
        wrongCount: Number(r['Số câu sai'] || 0),
        notDone: Number(r['Chưa làm'] || 0),
        wrong: String(r['Chi tiết câu sai'] || ''),
        essays: rawEssays,
        driveLinks: String(r['Link ghi âm'] || ''),
        speakScore: getTeacherExerciseScore(r),
        comment: cleanedComment,
        teacherComment: cleanedComment,
        submissionImages: extractedSubImgs.length > 0 ? extractedSubImgs : undefined,
        correctedImages: extractedCorrImgs.length > 0 ? extractedCorrImgs : undefined,
        audios: mergeAudioRecords(
          extractedFeedbackAudios,
          mergeAudioRecords(driveAudios, localMatch?.audios)
        ),
        status: r['Trạng thái'] === 'Đã chấm' ? 'Đã chấm' : 'Chờ chấm'
      };

      if (hwMatch) {
        mapped.isHandwriting = true;
        if (hwMatch.submissionImages && hwMatch.submissionImages.length > 0) {
          mapped.submissionImages = Array.from(new Set([...(mapped.submissionImages || []), ...hwMatch.submissionImages]));
        }
        if (hwMatch.correctedImages && hwMatch.correctedImages.length > 0) {
          mapped.correctedImages = Array.from(new Set([...(mapped.correctedImages || []), ...hwMatch.correctedImages]));
        }
        if (hwMatch.teacherComment) mapped.teacherComment = cleanImageTagsFromText(hwMatch.teacherComment);
        if (hwMatch.status === 'graded') {
          mapped.status = 'Đã chấm';
          if (!mapped.speakScore) mapped.speakScore = 'Đạt';
          if (!mapped.comment) mapped.comment = cleanImageTagsFromText(hwMatch.teacherComment);
        }
      }

      if (localMatch) {
        mapped.audios = mergeAudioRecords(localMatch.audios, mapped.audios);
        if (localMatch.isHandwriting) mapped.isHandwriting = true;
        if (localMatch.submissionImages && localMatch.submissionImages.length > 0) {
          mapped.submissionImages = Array.from(new Set([...(mapped.submissionImages || []), ...localMatch.submissionImages]));
        }
        if (localMatch.correctedImages && localMatch.correctedImages.length > 0) {
          mapped.correctedImages = Array.from(new Set([...(mapped.correctedImages || []), ...localMatch.correctedImages]));
        }
        if (localMatch.teacherComment) mapped.teacherComment = cleanImageTagsFromText(localMatch.teacherComment);
        if (localMatch.exerciseId) mapped.exerciseId = localMatch.exerciseId;
        if (localMatch.status === 'Đã chấm') mapped.status = 'Đã chấm';
        if (localMatch.speakScore && !mapped.speakScore) mapped.speakScore = localMatch.speakScore;
        if (localMatch.comment && !mapped.comment) mapped.comment = cleanImageTagsFromText(localMatch.comment);
      }

      return { ok: true, row: mapped };
    } else {
      if (localMatch) {
        return { ok: true, row: localMatch };
      }
      return { ok: false, error: data?.error || 'Không tìm thấy mã bài nộp' };
    }
  } catch (err: any) {
    console.error('GAS GET result error:', err);
    if (localMatch) {
      return { ok: true, row: localMatch };
    }
    return { ok: false, error: 'Không thể lấy dữ liệu từ Google Sheet' };
  }
};

/**
 * Grade a submission as Teacher
 */
export const gradeSubmissionInGas = async (
  id: string,
  speakScore: string | number,
  comment: string,
  pass: string,
  correctedImages?: string[],
  audios?: AudioRecordItem[]
): Promise<{ ok: boolean; error?: string }> => {
  const config = getGasConfig();

  // Update local copy
  const locals = getLocalSubmissions();
  const found = locals.find((l) => l.id === id);

  const imagesToSave = (correctedImages && correctedImages.length > 0)
    ? correctedImages
    : (found?.correctedImages || []);
  const audiosToSave = mergeAudioRecords(audios, found?.audios) || [];
  const feedbackAudiosToSave = audiosToSave
    .filter((audio) => Boolean(audio.teacherFeedbackUrl))
    .map((audio) => ({
      label: audio.label,
      teacherFeedbackUrl: audio.teacherFeedbackUrl,
      teacherFeedbackLabel: audio.teacherFeedbackLabel
    }));

  const cleanCommentStr = cleanImageTagsFromText(comment);

  const sheetCommentParts = [cleanCommentStr];
  if (imagesToSave.length > 0) {
    sheetCommentParts.push(`[CORRECTED_IMAGES]: ${JSON.stringify(imagesToSave)}`);
  }
  if (feedbackAudiosToSave.length > 0) {
    sheetCommentParts.push(`[TEACHER_FEEDBACK_AUDIOS]: ${JSON.stringify(feedbackAudiosToSave)}`);
  }
  const commentForSheet = sheetCommentParts.filter(Boolean).join('\n');

  if (found) {
    found.speakScore = speakScore;
    found.comment = cleanCommentStr;
    found.teacherComment = cleanCommentStr;
    found.correctedImages = imagesToSave;
    if (audiosToSave.length > 0) found.audios = audiosToSave;
    found.status = 'Đã chấm';
    saveLocalSubmission(found, false);
  }

  // Also update handwriting submission if exists
  const hwList = getHandwritingSubmissions();
  const foundHw = hwList.find((h) => h.id === id);
  if (foundHw) {
    foundHw.status = 'graded';
    foundHw.teacherComment = cleanCommentStr;
    foundHw.correctedImages = imagesToSave;
    foundHw.gradedAt = new Date().toLocaleString('vi-VN');
    saveHandwritingSubmission(foundHw);
  }

  const serverGrade = await gradeServerSubmission({
    id,
    speakScore: String(speakScore),
    comment: cleanCommentStr,
    teacherComment: cleanCommentStr,
    correctedImages: imagesToSave,
    audios: audiosToSave.length > 0 ? audiosToSave : undefined
  });

  if (!serverGrade.ok && !config.sheetUrl.trim()) {
    return { ok: false, error: 'Không thể đồng bộ điểm và ảnh chữa lên máy chủ' };
  }

  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
    if (pass !== config.teacherPass) {
      return { ok: false, error: 'Sai mật khẩu giáo viên' };
    }
    return { ok: true };
  }

  try {
    const res = await fetch(getGasRequestUrl(config.sheetUrl.trim()), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'grade',
        pass: pass,
        id: id,
        speakScore: String(speakScore),
        comment: commentForSheet
      })
    });

    const data = await res.json();
    if (data && data.ok) {
      return { ok: true };
    } else {
      // The Express/server copy is the shared source for deployments that do
      // not have the same rows in Google Sheets yet. Keep a successful server
      // grade instead of discarding the teacher's feedback only because GAS
      // cannot find the older row.
      if (data?.error === 'Không tìm thấy ID' && serverGrade.ok) {
        return { ok: true };
      }
      return { ok: false, error: data?.error || 'Lỗi khi cập nhật điểm bài nộp' };
    }
  } catch (err: any) {
    console.error('GAS Grade error:', err);
    return { ok: true, error: 'Đã lưu điểm trên bản local. (Gửi tới Sheet bị gián đoạn)' };
  }
};
