import express from 'express';
import path from 'path';
import fs from 'fs';
import { Readable } from 'node:stream';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Configure body parser limits for large payloads (base64 images & audio)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.text({ type: 'text/plain', limit: '50mb' }));

// Ensure data_store directory exists
const DATA_DIR = path.join(process.cwd(), 'data_store');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const CUSTOM_EXAMS_FILE = path.join(DATA_DIR, 'custom_exams.json');
const DELETED_EXAMS_FILE = path.join(DATA_DIR, 'deleted_exam_ids.json');
const HANDWRITING_EXERCISES_FILE = path.join(DATA_DIR, 'handwriting_exercises.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const DELETED_SUBMISSIONS_FILE = path.join(DATA_DIR, 'deleted_submission_ids.json');

// Helper functions for reading/writing JSON files
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

function normalizeSubmissionId(id: unknown): string {
  return String(id || '').trim().toLowerCase();
}

function getDeletedSubmissionIds(): string[] {
  return Array.from(
    new Set(
      readJsonFile<unknown[]>(DELETED_SUBMISSIONS_FILE, [])
        .map(normalizeSubmissionId)
        .filter(Boolean)
    )
  );
}

// Media file upload & serving
app.use('/api/media', express.static(UPLOADS_DIR));

function getGasProxyTarget(req: express.Request): URL | null {
  const rawTarget = typeof req.query.target === 'string' ? req.query.target.trim() : '';
  if (!rawTarget) return null;

  try {
    const target = new URL(rawTarget);
    const isAllowedPath = /^\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(target.pathname);
    if (target.protocol !== 'https:' || target.hostname !== 'script.google.com' || !isAllowedPath) {
      return null;
    }

    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'target' || typeof value !== 'string') return;
      target.searchParams.set(key, value);
    });
    return target;
  } catch {
    return null;
  }
}

async function proxyGoogleAppsScript(req: express.Request, res: express.Response): Promise<void> {
  const target = getGasProxyTarget(req);
  if (!target) {
    res.status(400).json({ ok: false, error: 'Invalid Google Apps Script target' });
    return;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: req.method === 'POST'
        ? { 'Content-Type': 'text/plain;charset=utf-8' }
        : undefined,
      body: req.method === 'POST'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
        : undefined
    });
    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(upstream.status).setHeader('Content-Type', contentType).send(body);
  } catch (err: any) {
    console.error('Google Apps Script proxy error:', err);
    res.status(502).json({ ok: false, error: 'Không thể kết nối Google Sheet' });
  }
}

app.get('/api/gas', proxyGoogleAppsScript);
app.post('/api/gas', proxyGoogleAppsScript);

// Proxy public Google Drive media through this server so deployed browsers do
// not have to load Drive's cross-origin redirect directly. Range headers are
// forwarded so native audio controls can seek normally.
app.get('/api/media/drive', async (req, res) => {
  try {
    const fileId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    const resourceKey = typeof req.query.resourcekey === 'string' ? req.query.resourcekey.trim() : '';
    const kind = req.query.kind === 'image' ? 'image' : 'audio';

    if (!/^[a-zA-Z0-9_-]{25,60}$/.test(fileId)) {
      res.status(400).json({ ok: false, error: 'Invalid Google Drive file ID' });
      return;
    }

    const upstreamUrl = new URL(
      kind === 'image'
        ? 'https://drive.google.com/thumbnail'
        : 'https://drive.usercontent.google.com/download'
    );
    upstreamUrl.searchParams.set('id', fileId);
    if (kind === 'image') {
      upstreamUrl.searchParams.set('sz', 'w2000');
    } else {
      upstreamUrl.searchParams.set('export', 'media');
    }
    if (resourceKey) upstreamUrl.searchParams.set('resourcekey', resourceKey);

    const headers: Record<string, string> = {};
    if (typeof req.headers.range === 'string') headers.Range = req.headers.range;

    const upstream = await fetch(upstreamUrl, { headers });
    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status).json({ ok: false, error: 'Google Drive media is unavailable' });
      return;
    }

    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    for (const headerName of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(headerName);
      if (value) res.setHeader(headerName, value);
    }

    if (!upstream.body) {
      res.end();
      return;
    }
    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch (err: any) {
    console.error('Drive media proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ ok: false, error: 'Could not load media from Google Drive' });
    } else {
      res.end();
    }
  }
});

app.post('/api/media/upload', (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData) {
      res.status(400).json({ ok: false, error: 'Missing fileData' });
      return;
    }

    let base64Content = fileData;
    if (fileData.includes('base64,')) {
      base64Content = fileData.split('base64,')[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    
    // Generate unique filename
    const ext = fileName ? path.extname(fileName) : (mimeType?.includes('audio') ? '.mp3' : '.jpg');
    const safeName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/api/media/${safeName}`;
    res.json({ ok: true, url: publicUrl, fileName: safeName });
  } catch (err: any) {
    console.error('Media upload error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

// --- API ENDPOINTS FOR CUSTOM EXAMS ---
app.get('/api/custom-exams', (req, res) => {
  const exams = readJsonFile<any[]>(CUSTOM_EXAMS_FILE, []);
  res.json({ ok: true, exams });
});

app.post('/api/custom-exams', (req, res) => {
  try {
    const newExam = req.body;
    if (!newExam || !newExam.id) {
      res.status(400).json({ ok: false, error: 'Invalid exam payload' });
      return;
    }

    const currentExams = readJsonFile<any[]>(CUSTOM_EXAMS_FILE, []);
    const idx = currentExams.findIndex((e) => e.id === newExam.id);
    let updatedExams: any[];

    if (idx >= 0) {
      currentExams[idx] = newExam;
      updatedExams = currentExams;
    } else {
      updatedExams = [newExam, ...currentExams];
    }

    writeJsonFile(CUSTOM_EXAMS_FILE, updatedExams);

    // Also remove from deleted IDs if present
    const deletedIds = readJsonFile<string[]>(DELETED_EXAMS_FILE, []);
    const updatedDeleted = deletedIds.filter((id) => id !== newExam.id);
    writeJsonFile(DELETED_EXAMS_FILE, updatedDeleted);

    res.json({ ok: true, exam: newExam, exams: updatedExams });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-exams/:id', (req, res) => {
  try {
    const examId = req.params.id;
    const currentExams = readJsonFile<any[]>(CUSTOM_EXAMS_FILE, []);
    const updatedExams = currentExams.filter((e) => e.id !== examId);
    writeJsonFile(CUSTOM_EXAMS_FILE, updatedExams);

    const deletedIds = readJsonFile<string[]>(DELETED_EXAMS_FILE, []);
    if (!deletedIds.includes(examId)) {
      deletedIds.push(examId);
      writeJsonFile(DELETED_EXAMS_FILE, deletedIds);
    }

    res.json({ ok: true, deletedId: examId, exams: updatedExams, deletedIds });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/deleted-exam-ids', (req, res) => {
  const deletedIds = readJsonFile<string[]>(DELETED_EXAMS_FILE, []);
  res.json({ ok: true, deletedIds });
});

// --- API ENDPOINTS FOR HANDWRITING EXERCISES ---
app.get('/api/handwriting-exercises', (req, res) => {
  const exercises = readJsonFile<any[]>(HANDWRITING_EXERCISES_FILE, []);
  res.json({ ok: true, exercises });
});

app.post('/api/handwriting-exercises', (req, res) => {
  try {
    const exercise = req.body;
    if (!exercise || !exercise.id) {
      res.status(400).json({ ok: false, error: 'Invalid handwriting exercise payload' });
      return;
    }

    const currentExercises = readJsonFile<any[]>(HANDWRITING_EXERCISES_FILE, []);
    const index = currentExercises.findIndex((item) => String(item.id) === String(exercise.id));
    if (index >= 0) {
      currentExercises[index] = exercise;
    } else {
      currentExercises.unshift(exercise);
    }

    const saved = writeJsonFile(HANDWRITING_EXERCISES_FILE, currentExercises);
    if (!saved) {
      res.status(500).json({ ok: false, error: 'Could not save handwriting exercise' });
      return;
    }

    res.json({ ok: true, exercise });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/handwriting-exercises/:id', (req, res) => {
  try {
    const exerciseId = req.params.id;
    const currentExercises = readJsonFile<any[]>(HANDWRITING_EXERCISES_FILE, []);
    const updatedExercises = currentExercises.filter((item) => String(item.id) !== String(exerciseId));
    const saved = writeJsonFile(HANDWRITING_EXERCISES_FILE, updatedExercises);
    if (!saved) {
      res.status(500).json({ ok: false, error: 'Could not delete handwriting exercise' });
      return;
    }

    res.json({ ok: true, deletedId: exerciseId, exercises: updatedExercises });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- API ENDPOINTS FOR SUBMISSIONS ---
app.get('/api/deleted-submission-ids', (req, res) => {
  res.json({ ok: true, deletedIds: getDeletedSubmissionIds() });
});

app.get('/api/submissions', (req, res) => {
  const deletedIds = new Set(getDeletedSubmissionIds());
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []).filter(
    (submission) => !deletedIds.has(normalizeSubmissionId(submission.id))
  );
  res.json({ ok: true, submissions });
});

app.get('/api/submissions/:id', (req, res) => {
  const subId = String(req.params.id).trim().toLowerCase();
  if (getDeletedSubmissionIds().includes(subId)) {
    res.status(404).json({ ok: false, error: 'Submission deleted' });
    return;
  }
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  const match = submissions.find((s) => String(s.id).trim().toLowerCase() === subId);

  if (match) {
    res.json({ ok: true, submission: match });
  } else {
    res.status(404).json({ ok: false, error: 'Submission not found' });
  }
});

app.post('/api/submissions', (req, res) => {
  try {
    const subData = req.body;
    if (!subData) {
      res.status(400).json({ ok: false, error: 'Empty submission data' });
      return;
    }

    const currentSubs = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    const subId = subData.id || Math.random().toString(36).substring(2, 10);
    if (getDeletedSubmissionIds().includes(normalizeSubmissionId(subId))) {
      res.status(410).json({ ok: false, error: 'Submission was deleted' });
      return;
    }
    const updatedSub = { ...subData, id: subId };

    const idx = currentSubs.findIndex((s) => String(s.id) === String(subId));
    if (idx >= 0) {
      currentSubs[idx] = { ...currentSubs[idx], ...updatedSub };
    } else {
      currentSubs.unshift(updatedSub);
    }

    writeJsonFile(SUBMISSIONS_FILE, currentSubs);
    res.json({ ok: true, id: subId, submission: updatedSub });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/submissions/grade', (req, res) => {
  try {
    const { id, speakScore, comment, teacherComment, correctedImages, audios } = req.body;
    if (!id) {
      res.status(400).json({ ok: false, error: 'Missing submission ID' });
      return;
    }

    if (getDeletedSubmissionIds().includes(normalizeSubmissionId(id))) {
      res.status(404).json({ ok: false, error: 'Submission was deleted' });
      return;
    }

    const currentSubs = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    const idx = currentSubs.findIndex((s) => String(s.id).trim().toLowerCase() === String(id).trim().toLowerCase());

    if (idx >= 0) {
      const sub = currentSubs[idx];
      sub.speakScore = speakScore !== undefined ? speakScore : sub.speakScore;
      sub.comment = comment !== undefined ? comment : sub.comment;
      sub.teacherComment = teacherComment !== undefined ? teacherComment : (comment || sub.teacherComment);
      if (correctedImages && Array.isArray(correctedImages)) {
        sub.correctedImages = Array.from(new Set([...(sub.correctedImages || []), ...correctedImages]));
      }
      if (audios && Array.isArray(audios)) {
        sub.audios = audios;
      }
      sub.status = 'Đã chấm';

      writeJsonFile(SUBMISSIONS_FILE, currentSubs);
      res.json({ ok: true, submission: sub });
    } else {
      res.status(404).json({ ok: false, error: 'Submission not found to grade' });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/submissions/delete', (req, res) => {
  try {
    const rawIds = Array.isArray(req.body?.ids)
      ? req.body.ids
      : req.body?.id
        ? [req.body.id]
        : [];
    const ids: string[] = Array.from(
      new Set<string>(
        rawIds
          .map(String)
          .map((id) => id.trim())
          .filter(Boolean)
      )
    );
    if (ids.length === 0) {
      res.status(400).json({ ok: false, error: 'Missing submission IDs' });
      return;
    }

    const currentSubs = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    const idSet = new Set(ids.map((id) => id.toLowerCase()));
    const updatedSubs = currentSubs.filter((sub) => !idSet.has(String(sub.id).trim().toLowerCase()));
    const deletedIds = Array.from(new Set([...getDeletedSubmissionIds(), ...ids.map(normalizeSubmissionId)]));
    const deletedSaved = writeJsonFile(DELETED_SUBMISSIONS_FILE, deletedIds);
    const saved = writeJsonFile(SUBMISSIONS_FILE, updatedSubs);
    if (!saved || !deletedSaved) {
      res.status(500).json({ ok: false, error: 'Could not delete submissions' });
      return;
    }

    res.json({ ok: true, deletedIds: ids });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function start() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HSK Server] Running on http://0.0.0.0:${PORT}`);
  });
}

start();
