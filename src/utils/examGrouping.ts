import { ExamLesson } from '../types';

const GROUP_ORDER = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Luyện nói', 'Nộp bài viết tay', 'Khác'];

export interface ExamGroup {
  label: string;
  exams: ExamLesson[];
}

export function isHandwritingExam(exam: ExamLesson): boolean {
  return Boolean(
    exam.isHandwriting ||
      exam.type === 'handwriting_submission' ||
      (exam.handwritingQuestions && exam.handwritingQuestions.length > 0)
  );
}

export function getExamGroupLabel(exam: ExamLesson): string {
  if (isHandwritingExam(exam)) return 'Nộp bài viết tay';
  if (GROUP_ORDER.includes(exam.level)) return exam.level;
  return 'Khác';
}

function lessonNumber(exam: ExamLesson): number {
  const titleMatch = exam.title.match(/\bBài\s+(\d+)/iu);
  const idMatch = exam.id.match(/(?:^|[-_])(?:bai|b)(\d+)(?:[-_]|$)/i);
  const match = titleMatch || idMatch;
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortExams(a: ExamLesson, b: ExamLesson): number {
  const numberDifference = lessonNumber(a) - lessonNumber(b);
  if (numberDifference !== 0) return numberDifference;
  return a.title.localeCompare(b.title, 'vi');
}

export function groupExamsForSelection(exams: ExamLesson[]): ExamGroup[] {
  const groups = new Map<string, ExamLesson[]>();

  exams.forEach((exam) => {
    const label = getExamGroupLabel(exam);
    const group = groups.get(label) || [];
    group.push(exam);
    groups.set(label, group);
  });

  return GROUP_ORDER.filter((label) => groups.has(label)).map((label) => ({
    label,
    exams: (groups.get(label) || []).sort(sortExams)
  }));
}
