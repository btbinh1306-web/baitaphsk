import { AudioRecordItem, ExamLesson, SubmissionData } from '../types';
import { HandwritingExercise } from '../types/handwriting';
import {
  deleteGasExam,
  fetchGasDeletedExamIds,
  fetchGasExams,
  fetchGasHandwritingExercises,
  saveGasExam,
  uploadMediaToGas
} from './gasCloudService';
import type { GasMediaFolder } from './gasCloudService';

/**
 * Client service to communicate with full-stack Express backend server endpoints.
 * Automatically syncs custom exams, submissions, grading, and media uploads.
 */

// --- CUSTOM EXAMS ---
export async function fetchServerCustomExams(): Promise<ExamLesson[]> {
  const gasExams = await fetchGasExams();
  if (gasExams !== null) return gasExams;

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
  const gasSaved = await saveGasExam(exam);

  try {
    const res = await fetch('/api/custom-exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    const data = await res.json();
    const localSaved = Boolean(data && data.ok);
    return gasSaved === true || localSaved;
  } catch (err) {
    console.warn('Failed to save custom exam on server', err);
    return gasSaved === true;
  }
}

export async function deleteServerCustomExam(examId: string): Promise<boolean> {
  const gasDeleted = await deleteGasExam(examId);

  try {
    const res = await fetch(`/api/custom-exams/${encodeURIComponent(examId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    const localDeleted = Boolean(data && data.ok);
    // When GAS is configured, a local Express success is not enough for
    // cross-device deletion because the deployed server may be ephemeral.
    return gasDeleted !== null ? gasDeleted === true : localDeleted;
  } catch (err) {
    console.warn('Failed to delete custom exam on server', err);
    return gasDeleted === true;
  }
}

export async function fetchServerDeletedExamIds(): Promise<string[]> {
  const gasDeleted = await fetchGasDeletedExamIds();
  let localDeleted: string[] = [];

  try {
    const res = await fetch('/api/deleted-exam-ids');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.deletedIds)) {
      localDeleted = data.deletedIds.map(String);
    }
  } catch (err) {
    console.warn('Failed to fetch deleted exam IDs from server', err);
  }

  return Array.from(new Set([...(gasDeleted || []), ...localDeleted]));
}

// --- HANDWRITING EXERCISES ---
export async function fetchServerHandwritingExercises(): Promise<HandwritingExercise[]> {
  const gasExercises = await fetchGasHandwritingExercises();
  if (gasExercises !== null) return gasExercises;

  try {
    const res = await fetch('/api/handwriting-exercises');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.exercises)) {
      return data.exercises;
    }
  } catch (err) {
    console.warn('Failed to fetch server handwriting exercises', err);
  }
  return [];
}

export async function saveServerHandwritingExercise(exercise: HandwritingExercise): Promise<boolean> {
  const gasSaved = await saveGasExam(exercise);

  try {
    const res = await fetch('/api/handwriting-exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise)
    });
    const data = await res.json();
    const localSaved = Boolean(data && data.ok);
    return gasSaved === true || localSaved;
  } catch (err) {
    console.warn('Failed to save handwriting exercise on server', err);
    return gasSaved === true;
  }
}

export async function deleteServerHandwritingExercise(exerciseId: string): Promise<boolean> {
  const gasDeleted = await deleteGasExam(exerciseId);

  try {
    const res = await fetch(`/api/handwriting-exercises/${encodeURIComponent(exerciseId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    const localDeleted = Boolean(data && data.ok);
    return gasDeleted === true || localDeleted;
  } catch (err) {
    console.warn('Failed to delete handwriting exercise on server', err);
    return gasDeleted === true;
  }
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
  audios?: AudioRecordItem[];
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
export async function uploadMediaFile(
  fileData: string,
  fileName?: string,
  mimeType?: string,
  folder: GasMediaFolder = 'lesson'
): Promise<string | null> {
  const dataMimeType = fileData.match(/^data:([^;,]+)/i)?.[1];
  const effectiveMimeType = dataMimeType || mimeType;
  const effectiveFileName =
    effectiveMimeType === 'image/jpeg' && fileName && !/\.jpe?g$/i.test(fileName)
      ? `${fileName.replace(/\.[^.]+$/, '')}.jpg`
      : fileName;

  const gasUrl = await uploadMediaToGas(fileData, effectiveFileName, effectiveMimeType, folder);
  if (gasUrl) return gasUrl;

  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, fileName: effectiveFileName, mimeType: effectiveMimeType })
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
