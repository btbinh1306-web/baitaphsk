import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Configure body parser limits for large payloads (base64 images & audio)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

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

// Media file upload & serving
app.use('/api/media', express.static(UPLOADS_DIR));

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

// --- API ENDPOINTS FOR SUBMISSIONS ---
app.get('/api/submissions', (req, res) => {
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  res.json({ ok: true, submissions });
});

app.get('/api/submissions/:id', (req, res) => {
  const subId = String(req.params.id).trim().toLowerCase();
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
    const { id, speakScore, comment, teacherComment, correctedImages } = req.body;
    if (!id) {
      res.status(400).json({ ok: false, error: 'Missing submission ID' });
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
