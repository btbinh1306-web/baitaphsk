import { ExamLesson, Question } from '../types';

export interface TeacherItemScore {
  score: number;
  maxScore: number;
}

/**
 * HSK 1 (3.0) mock papers use the 200-point exam scale: Listening 100 and
 * Reading 100. They must stay separate from ordinary HSK1 lessons, which use
 * a teacher-entered final score.
 */
export type Hsk1TrialPart = 'listening' | 'reading';

export interface Hsk1TrialScore {
  totalScore: number;
  maxScore: 200;
  listeningScore: number;
  listeningCorrect: number;
  listeningTotal: number;
  readingScore: number;
  readingCorrect: number;
  readingTotal: number;
}

export const isHsk1TrialExam = (
  exam?: Pick<ExamLesson, 'id' | 'title' | 'level'>
): boolean => (
  exam?.level === 'HSK 1' && /3\s*[.]\s*0|thi\s*thử|trial/i.test(`${exam.id} ${exam.title}`)
);

export const getHsk1TrialPart = (sectionTitle: unknown): Hsk1TrialPart | null => {
  const title = String(sectionTitle || '');
  if (/nghe|听力|listening/i.test(title)) return 'listening';
  if (/đọc|阅读|reading/i.test(title)) return 'reading';
  return null;
};

const scoreTrialPart = (correct: number, total: number): number => (
  total > 0 ? roundScore((Math.max(0, Math.min(total, correct)) / total) * 100) : 0
);

export const calculateHsk1TrialScore = (
  listeningCorrect: number,
  listeningTotal: number,
  readingCorrect: number,
  readingTotal: number
): Hsk1TrialScore => {
  const listeningScore = scoreTrialPart(listeningCorrect, listeningTotal);
  const readingScore = scoreTrialPart(readingCorrect, readingTotal);
  return {
    totalScore: roundScore(listeningScore + readingScore),
    maxScore: 200,
    listeningScore,
    listeningCorrect: Math.max(0, Math.min(listeningTotal, listeningCorrect)),
    listeningTotal: Math.max(0, listeningTotal),
    readingScore,
    readingCorrect: Math.max(0, Math.min(readingTotal, readingCorrect)),
    readingTotal: Math.max(0, readingTotal)
  };
};

export const TEACHER_ITEM_SCORES_MARKER = '[TEACHER_ITEM_SCORES]:';

const finitePositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const roundScore = (value: number): number => Math.round(value * 100) / 100;

export const formatScore = (value: number): string => {
  const rounded = roundScore(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

/**
 * Handwritten Chinese submissions are reviewed in their own workflow and must
 * never become part of the exam score.
 */
export const isExcludedFromOverallScore = (question: Question): boolean => (
  question.type === 'handwriting_submission' ||
  /chép tay|nộp chữ hán|handwriting/i.test(`${question.taskGroupTitle || ''} ${question.prompt || ''}`)
);

/**
 * Use an explicit question maximum when the exam provides one. Rubrics take
 * precedence because their item totals are the authoritative scale. Ordinary
 * open answers default to a 10-point teacher input scale; knowledge-target
 * counts are not scores.
 */
export const getQuestionMaxScore = (question: Question): number => {
  const rubricTotal = (question.rubric || []).reduce((total, item) => {
    const score = finitePositiveNumber(item.maxScore);
    return total + (score || 0);
  }, 0);
  if (rubricTotal > 0) return rubricTotal;

  return finitePositiveNumber(question.maxScore) || 10;
};

export const parseTeacherItemScores = (value?: string): Record<string, TeacherItemScore> => {
  const text = String(value || '');
  const markerIndex = text.indexOf(TEACHER_ITEM_SCORES_MARKER);
  if (markerIndex < 0) return {};

  const jsonText = text.slice(markerIndex + TEACHER_ITEM_SCORES_MARKER.length).trim().split(/\s*\|\s*|\r?\n/)[0];
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<Record<string, TeacherItemScore>>((scores, [id, raw]) => {
      if (!raw || typeof raw !== 'object') return scores;
      const score = Number((raw as { score?: unknown }).score);
      const maxScore = Number((raw as { maxScore?: unknown }).maxScore);
      if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return scores;
      scores[id] = {
        score: Math.max(0, Math.min(maxScore, score)),
        maxScore
      };
      return scores;
    }, {});
  } catch {
    return {};
  }
};
