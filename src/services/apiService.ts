import { ExamLesson, SubmissionData } from '../types';

/**
 * Client service to communicate with full-stack Express backend server endpoints.
 * Automatically syncs custom exams, submissions, grading, and media uploads.
 */

// --- CUSTOM EXAMS ---
export async function fetchServerCustomExams(): Promise<ExamLesson[]> {
  try {
    const res = await fetch('/api/custom-exams');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.exams)) {
      return data.exams;
    }
  } catch (err) {
    console.warn('Failed to fetch server custom exams, falling back to local', err);
  }
  return [];
}

export async function saveServerCustomExam(exam: ExamLesson): Promise<boolean> {
  try {
    const res = await fetch('/api/custom-exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch (err) {
    console.warn('Failed to save custom exam on server', err);
    return false;
  }
}

export async function deleteServerCustomExam(examId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/custom-exams/${encodeURIComponent(examId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch (err) {
    console.warn('Failed to delete custom exam on server', err);
    return false;
  }
}

export async function fetchServerDeletedExamIds(): Promise<string[]> {
  try {
    const res = await fetch('/api/deleted-exam-ids');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.deletedIds)) {
      return data.deletedIds;
    }
  } catch (err) {
    console.warn('Failed to fetch deleted exam IDs from server', err);
  }
  return [];
}

// --- SUBMISSIONS ---
export async function fetchServerSubmissions(): Promise<SubmissionData[]> {
  try {
    const res = await fetch('/api/submissions');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.submissions)) {
      return data.submissions;
    }
  } catch (err) {
    console.warn('Failed to fetch server submissions', err);
  }
  return [];
}

export async function fetchServerSubmissionById(id: string): Promise<SubmissionData | null> {
  try {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data && data.ok && data.submission) {
      return data.submission;
    }
  } catch (err) {
    console.warn('Failed to fetch server submission by ID', err);
  }
  return null;
}

export async function saveServerSubmission(sub: SubmissionData): Promise<{ ok: boolean; id?: string }> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
    const data = await res.json();
    if (data && data.ok) {
      return { ok: true, id: data.id };
    }
  } catch (err) {
    console.warn('Failed to save submission on server', err);
  }
  return { ok: false };
}

export async function gradeServerSubmission(payload: {
  id: string;
  speakScore?: string;
  comment?: string;
  teacherComment?: string;
  correctedImages?: string[];
}): Promise<{ ok: boolean; submission?: SubmissionData }> {
  try {
    const res = await fetch('/api/submissions/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.ok) {
      return { ok: true, submission: data.submission };
    }
  } catch (err) {
    console.warn('Failed to grade submission on server', err);
  }
  return { ok: false };
}

// --- MEDIA UPLOADS ---
export async function uploadMediaFile(fileData: string, fileName?: string, mimeType?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, fileName, mimeType })
    });
    const data = await res.json();
    if (data && data.ok && data.url) {
      return data.url;
    }
  } catch (err) {
    console.warn('Failed to upload media file to server', err);
  }
  return null;
}
