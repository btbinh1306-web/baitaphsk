import { SubmissionData, GasConfig, TeacherGradePayload } from '../types';

const DEFAULT_CONFIG_KEY = 'hsk_gas_config';
const LOCAL_SUBMISSIONS_KEY = 'hsk_local_submissions_v1';

export const getGasConfig = (): GasConfig => {
  try {
    const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse GasConfig from localStorage', e);
  }
  return {
    sheetUrl: '',
    teacherPass: 'tbtt123'
  };
};

export const saveGasConfig = (config: GasConfig): void => {
  localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(config));
};

export const getLocalSubmissions = (): SubmissionData[] => {
  try {
    const data = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading local submissions', e);
  }
  return [];
};

export const saveLocalSubmission = (sub: SubmissionData): void => {
  const current = getLocalSubmissions();
  // Check if exists, update or prepend
  const idx = current.findIndex((item) => item.id === sub.id);
  if (idx >= 0) {
    current[idx] = sub;
  } else {
    current.unshift(sub);
  }
  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(current));
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
    essays: payload.essays,
    audios: payload.audios,
    speakScore: '',
    comment: '',
    status: 'Chờ chấm'
  };

  // Always save locally so it works even offline or without configured URL
  saveLocalSubmission(newSubRecord);

  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
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
      essays: payload.essays,
      audios: payload.audios || []
    };

    const res = await fetch(config.sheetUrl.trim(), {
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
        saveLocalSubmission(newSubRecord);
      }
      return { ok: true, id: data.id || localId };
    } else {
      return { ok: false, error: data?.error || 'Lỗi khi gửi lên Apps Script' };
    }
  } catch (err: any) {
    console.error('GAS POST submit error:', err);
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

  // If no Sheet URL, return local submissions
  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
    if (pass !== config.teacherPass) {
      return { ok: false, error: 'Mật khẩu giáo viên không đúng' };
    }
    return { ok: true, rows: getLocalSubmissions() };
  }

  try {
    const url = new URL(config.sheetUrl.trim());
    url.searchParams.append('mode', 'teacher');
    url.searchParams.append('pass', pass);

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    const data = await res.json();
    if (data && data.ok) {
      // Map row objects from Apps Script HEADERS
      const mappedRows: SubmissionData[] = (data.rows || []).map((r: any) => {
        return {
          id: String(r['ID'] || r['id'] || ''),
          time: String(r['Thời gian'] || r['time'] || ''),
          name: String(r['Họ tên'] || r['name'] || ''),
          class: String(r['Lớp'] || r['class'] || ''),
          lesson: String(r['Bài'] || r['lesson'] || ''),
          correct: Number(r['Số câu đúng'] || 0),
          done: Number(r['Đã làm'] || 0),
          total: Number(r['Tổng'] || 0),
          percent: parseFloat(String(r['Phần trăm'] || '0').replace('%', '')),
          wrongCount: Number(r['Số câu sai'] || 0),
          notDone: Number(r['Chưa làm'] || 0),
          wrong: String(r['Chi tiết câu sai'] || ''),
          essays: String(r['Bài tự luận'] || ''),
          driveLinks: String(r['Link ghi âm'] || ''),
          speakScore: r['Điểm nói (GV)'] || '',
          comment: r['Nhận xét (GV)'] || '',
          status: r['Trạng thái'] === 'Đã chấm' ? 'Đã chấm' : 'Chờ chấm'
        };
      });

      // Merge local audio previews if present locally
      const locals = getLocalSubmissions();
      mappedRows.forEach((row) => {
        const foundLocal = locals.find((l) => l.id === row.id);
        if (foundLocal && foundLocal.audios) {
          row.audios = foundLocal.audios;
        }
      });

      return { ok: true, rows: mappedRows };
    } else {
      return { ok: false, error: data?.error || 'Sai mật khẩu hoặc lỗi máy chủ' };
    }
  } catch (err: any) {
    console.error('GAS GET teacher error:', err);
    // Fallback to local
    if (pass === config.teacherPass) {
      return { ok: true, rows: getLocalSubmissions() };
    }
    return { ok: false, error: 'Không thể tải từ Sheet: ' + err.message };
  }
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
  const localMatch = locals.find((item) => String(item.id).trim().toLowerCase() === id.trim().toLowerCase());

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

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    const data = await res.json();
    if (data && data.ok && data.row) {
      const r = data.row;
      const mapped: SubmissionData = {
        id: String(r['ID'] || id),
        time: String(r['Thời gian'] || ''),
        name: String(r['Họ tên'] || ''),
        class: String(r['Lớp'] || ''),
        lesson: String(r['Bài'] || ''),
        correct: Number(r['Số câu đúng'] || 0),
        done: Number(r['Đã làm'] || 0),
        total: Number(r['Tổng'] || 0),
        percent: parseFloat(String(r['Phần trăm'] || '0').replace('%', '')),
        wrongCount: Number(r['Số câu sai'] || 0),
        notDone: Number(r['Chưa làm'] || 0),
        wrong: String(r['Chi tiết câu sai'] || ''),
        essays: String(r['Bài tự luận'] || ''),
        driveLinks: String(r['Link ghi âm'] || ''),
        speakScore: r['Điểm nói (GV)'] || '',
        comment: r['Nhận xét (GV)'] || '',
        status: r['Trạng thái'] === 'Đã chấm' ? 'Đã chấm' : 'Chờ chấm'
      };

      if (localMatch && localMatch.audios) {
        mapped.audios = localMatch.audios;
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
  pass: string
): Promise<{ ok: boolean; error?: string }> => {
  const config = getGasConfig();

  // Update local copy
  const locals = getLocalSubmissions();
  const found = locals.find((l) => l.id === id);
  if (found) {
    found.speakScore = speakScore;
    found.comment = comment;
    found.status = 'Đã chấm';
    saveLocalSubmission(found);
  }

  if (!config.sheetUrl || config.sheetUrl.trim() === '') {
    if (pass !== config.teacherPass) {
      return { ok: false, error: 'Sai mật khẩu giáo viên' };
    }
    return { ok: true };
  }

  try {
    const res = await fetch(config.sheetUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'grade',
        pass: pass,
        id: id,
        speakScore: String(speakScore),
        comment: comment
      })
    });

    const data = await res.json();
    if (data && data.ok) {
      return { ok: true };
    } else {
      return { ok: false, error: data?.error || 'Lỗi khi cập nhật điểm bài nộp' };
    }
  } catch (err: any) {
    console.error('GAS Grade error:', err);
    return { ok: true, error: 'Đã lưu điểm trên bản local. (Gửi tới Sheet bị gián đoạn)' };
  }
};
