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

function isAggregateExam(exam: ExamLesson): boolean {
  return /tổng hợp/i.test(exam.title) || /tong-hop/i.test(exam.id);
}

function isNewFrameworkPracticeExam(exam: ExamLesson): boolean {
  return /đề luyện thi.*khung mới/i.test(exam.title) || /de-luyen-thi.*khung-moi/i.test(exam.id);
}

function trialExamNumber(exam: ExamLesson): number | null {
  const match = exam.title.match(/HSK\s*1\s*\(3\.0\)\s*-\s*Đề thi thử số\s*(\d+)/iu);
  return match ? Number(match[1]) : null;
}

function aggregateRange(exam: ExamLesson): [number, number] | null {
  const match = exam.title.match(/Bài\s+(\d+)\s*[–-]\s*(\d+)/iu);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

// "HSK 6 · Đề 2 · Luyện tập 词素" -> series "Luyện tập 词素", number 2, so each
// series stays together (Đề 1, 2, 3) instead of interleaving with another series.
function numberedSeries(exam: ExamLesson): { series: string; number: number } | null {
  const match = exam.title.match(/^HSK\s*\d\s*·\s*Đề\s*(\d+)\s*·\s*(.+)$/u);
  return match ? { series: match[2].trim(), number: Number(match[1]) } : null;
}

// Vocabulary practice (词语练习) first, then 词素, then 选词填空 (chọn đáp án).
const SERIES_ORDER = [/词语练习/u, /词素/u, /选词填空/u];
const seriesRank = (series: string) => {
  const index = SERIES_ORDER.findIndex((pattern) => pattern.test(series));
  return index === -1 ? SERIES_ORDER.length : index;
};

function sortExams(a: ExamLesson, b: ExamLesson): number {
  const aPinyinPractice = a.id === 'pinyin-nghe-va-doc';
  const bPinyinPractice = b.id === 'pinyin-nghe-va-doc';
  if (aPinyinPractice !== bPinyinPractice) return aPinyinPractice ? -1 : 1;

  const aTrialNumber = trialExamNumber(a);
  const bTrialNumber = trialExamNumber(b);
  if ((aTrialNumber === null) !== (bTrialNumber === null)) return aTrialNumber === null ? -1 : 1;
  if (aTrialNumber !== null && bTrialNumber !== null) return aTrialNumber - bTrialNumber;

  const aNewFrameworkPractice = isNewFrameworkPracticeExam(a);
  const bNewFrameworkPractice = isNewFrameworkPracticeExam(b);
  if (aNewFrameworkPractice !== bNewFrameworkPractice) return aNewFrameworkPractice ? 1 : -1;

  const aAggregate = isAggregateExam(a);
  const bAggregate = isAggregateExam(b);

  if (aAggregate !== bAggregate) return aAggregate ? 1 : -1;

  if (aAggregate && bAggregate) {
    const aRange = aggregateRange(a);
    const bRange = aggregateRange(b);
    if (aRange && bRange) {
      if (aRange[0] !== bRange[0]) return aRange[0] - bRange[0];
      if (aRange[1] !== bRange[1]) return bRange[1] - aRange[1];
    }
  }

  const aSeries = numberedSeries(a);
  const bSeries = numberedSeries(b);
  if (aSeries && bSeries) {
    if (aSeries.series !== bSeries.series) {
      const rankDifference = seriesRank(aSeries.series) - seriesRank(bSeries.series);
      return rankDifference || aSeries.series.localeCompare(bSeries.series, 'vi');
    }
    return aSeries.number - bSeries.number;
  }

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
