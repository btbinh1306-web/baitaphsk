import { HandwritingExercise, HandwritingSubmission } from '../types/handwriting';
import { ExamLesson, SubmissionData } from '../types';
import { saveLocalSubmission, getLocalSubmissions } from './gasService';
import { safeSetLocalStorage } from '../utils/storageUtils';

const EXERCISES_STORAGE_KEY = 'hsk_handwriting_exercises_v1';
const SUBMISSIONS_STORAGE_KEY = 'hsk_handwriting_submissions_v1';

// Seed sample handwriting exercise if empty
const SAMPLE_HANDWRITING_EXERCISE: HandwritingExercise = {
  id: 'hw_chep_tu_moi_chung',
  type: 'handwriting_submission',
  title: 'Nộp bài chép từ mới chữ Hán',
  instruction: 'Chụp ảnh vở chép từ mới chữ Hán và nộp tại đây. Học sinh vui lòng ghi rõ tên bài / từ mới đã chép ở ô bên dưới.',
  referenceImages: [],
  createdAt: new Date().toISOString(),
  level: 'Mọi cấp độ',
  description: 'Dạng bài: Nộp ảnh bài chép từ mới chữ Hán'
};

export const getHandwritingExercises = (): HandwritingExercise[] => {
  try {
    const data = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (data) {
      const parsed: HandwritingExercise[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter(
          (ex) => ex.id !== 'hw_hsk1_b5' && !ex.title.includes('HSK1 Bài 5') && !ex.title.includes('HSK 1 Bài 5')
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(
            EXERCISES_STORAGE_KEY,
            JSON.stringify(cleaned.length > 0 ? cleaned : [SAMPLE_HANDWRITING_EXERCISE])
          );
        }
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading handwriting exercises:', e);
  }
  // Initialize with sample if none exist
  const initial = [SAMPLE_HANDWRITING_EXERCISE];
  try {
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
};

export const saveHandwritingExercise = (exercise: HandwritingExercise): HandwritingExercise => {
  const list = getHandwritingExercises();
  const index = list.findIndex((ex) => ex.id === exercise.id);
  let updated: HandwritingExercise[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = exercise;
  } else {
    updated = [exercise, ...list];
  }
  safeSetLocalStorage(EXERCISES_STORAGE_KEY, updated);
  return exercise;
};

export const deleteHandwritingExercise = (id: string): void => {
  const list = getHandwritingExercises().filter((ex) => ex.id !== id);
  safeSetLocalStorage(EXERCISES_STORAGE_KEY, list);
};

export const getHandwritingSubmissions = (): HandwritingSubmission[] => {
  try {
    const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (data) {
      const parsed: HandwritingSubmission[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading handwriting submissions:', e);
  }
  return [];
};

export const deleteHandwritingSubmissions = (ids: string[]): void => {
  const idSet = new Set(ids.map((id) => String(id).trim().toLowerCase()));
  const updated = getHandwritingSubmissions().filter(
    (submission) => !idSet.has(String(submission.id).trim().toLowerCase())
  );
  safeSetLocalStorage(SUBMISSIONS_STORAGE_KEY, updated);
};

export const getHandwritingSubmissionForStudent = (
  exerciseId: string,
  studentName?: string
): HandwritingSubmission | undefined => {
  const list = getHandwritingSubmissions();
  if (studentName && studentName.trim()) {
    const normName = studentName.trim().toLowerCase();
    const match = list.find(
      (s) => s.exerciseId === exerciseId && s.studentName.trim().toLowerCase() === normName
    );
    if (match) return match;
  }
  // Fallback to most recent submission for this exercise
  return list.find((s) => s.exerciseId === exerciseId);
};

export const saveHandwritingSubmission = (
  submission: HandwritingSubmission
): HandwritingSubmission => {
  const list = getHandwritingSubmissions();
  const index = list.findIndex((s) => s.id === submission.id);
  let updated: HandwritingSubmission[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = submission;
  } else {
    updated = [submission, ...list];
  }

  safeSetLocalStorage(SUBMISSIONS_STORAGE_KEY, updated);

  // Also sync with main SubmissionData store for teacher portal list
  syncWithMainSubmissions(submission);

  return submission;
};

export const gradeHandwritingSubmission = (
  id: string,
  correctedImages: string[],
  teacherComment: string
): HandwritingSubmission | undefined => {
  const list = getHandwritingSubmissions();
  const found = list.find((s) => s.id === id);
  if (!found) return undefined;

  const updated: HandwritingSubmission = {
    ...found,
    status: 'graded',
    correctedImages,
    teacherComment,
    gradedAt: new Date().toLocaleString('vi-VN')
  };

  saveHandwritingSubmission(updated);
  return updated;
};

/**
 * Sync HandwritingSubmission with main SubmissionData array in gasService
 */
function syncWithMainSubmissions(hwSub: HandwritingSubmission): void {
  const mainList = getLocalSubmissions();
  const statusLabel = hwSub.status === 'graded' ? 'Đã chấm' : 'Chờ chấm';
  
  const mainRecord: SubmissionData = {
    id: hwSub.id,
    time: hwSub.submittedAt || new Date().toLocaleString('vi-VN'),
    name: hwSub.studentName,
    class: hwSub.studentClass || 'Mặc định',
    lesson: hwSub.exerciseTitle,
    correct: hwSub.status === 'graded' ? 10 : 0,
    done: hwSub.submissionImages.length,
    total: hwSub.submissionImages.length || 1,
    percent: hwSub.status === 'graded' ? 100 : 0,
    wrongCount: 0,
    notDone: 0,
    wrong: '',
    essays: `[Nộp bài chép tay] ${hwSub.submissionImages.length} ảnh`,
    speakScore: hwSub.status === 'graded' ? 'Đạt' : '',
    comment: hwSub.teacherComment || '',
    status: statusLabel,
    isHandwriting: true,
    exerciseId: hwSub.exerciseId,
    submissionImages: hwSub.submissionImages,
    correctedImages: hwSub.correctedImages || [],
    teacherComment: hwSub.teacherComment || '',
    handwritingStatus: hwSub.status,
    submittedAt: hwSub.submittedAt,
    gradedAt: hwSub.gradedAt
  };

  saveLocalSubmission(mainRecord);
}

/**
 * Convert HandwritingExercise to ExamLesson format for seamless app compatibility
 */
export const convertHandwritingToExamLesson = (ex: HandwritingExercise): ExamLesson => {
  return {
    id: ex.id,
    title: ex.title,
    level: (ex.level as ExamLesson['level']) || 'HSK 1',
    description: ex.description || 'Dạng bài: Nộp ảnh bài viết',
    type: 'handwriting_submission',
    isHandwriting: true,
    instruction: ex.instruction,
    referenceImages: ex.referenceImages,
    mcQuestions: [],
    essayQuestions: [],
    speakingQuestions: [],
    handwritingQuestions: [
      {
        id: `${ex.id}_hw_q`,
        type: 'handwriting_submission',
        prompt: ex.title,
        instruction: ex.instruction,
        referenceImages: ex.referenceImages
      }
    ]
  };
};
