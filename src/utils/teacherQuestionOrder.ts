import { AnswerSnapshotItem, AudioRecordItem, ExamLesson, Question } from '../types';
import { LessonItem } from '../types/lesson';
import {
  getStructuredQuestionRows,
  isStructuredExerciseItem,
  STRUCTURED_EXERCISE_LABELS
} from './structuredExercises';

export interface OrderedTeacherQuestion {
  questionId: string;
  sectionId?: string;
  sectionTitle: string;
  exerciseId: string;
  type: string;
  sectionOrder: number;
  exerciseOrder: number;
  itemOrder: number;
  originalQuestionNumber: number;
  question: Question;
}

const SUBJECTIVE_TYPES = new Set([
  'essay',
  'writing',
  'speaking',
  'speaking_record',
  'pronunciation',
  'translation',
  'translate',
  'translate_vi_zh',
  'handwriting_submission'
]);

const isAudioQuestion = (question: Question): boolean => (
  String(question.type || '') === 'speaking' ||
  String(question.type || '') === 'speaking_record' ||
  String(question.type || '') === 'pronunciation' ||
  question.translationType === 'vi_to_zh_audio'
);

const isHandwritingQuestion = (question: Question): boolean => (
  question.type === 'handwriting_submission' || /chép tay|handwriting/i.test(question.taskGroupTitle || '')
);

export const requiresTeacherReview = (question: Question): boolean => (
  question.teacherReviewRequired === true ||
  SUBJECTIVE_TYPES.has(String(question.type || '').toLowerCase()) ||
  Boolean(question.taskGroup && (
    question.taskGroup.includes('speaking') ||
    question.taskGroup.includes('translation') ||
    question.taskGroup.includes('picture') ||
    question.taskGroup.includes('self_')
  )) ||
  isHandwritingQuestion(question)
);

export const isAttempted = (
  question: Question,
  snapshot?: AnswerSnapshotItem,
  audio?: AudioRecordItem,
  submissionImages: string[] = []
): boolean => {
  if (isAudioQuestion(question)) return Boolean(audio && (audio.data || audio.url));
  if (isHandwritingQuestion(question)) return submissionImages.length > 0;

  const answer = String(snapshot?.userAnswer || '').trim();
  if (!answer || /^(?:\(chưa làm\)|chưa làm|để trống)$/i.test(answer)) return false;
  return true;
};

export const isIncorrect = (
  snapshot?: AnswerSnapshotItem,
  hasLegacyWrongDetail = false
): boolean => (
  snapshot?.status === 'wrong' || hasLegacyWrongDetail
);

const questionFromData = (
  item: LessonItem,
  prompt: string,
  id = item.id,
  answer?: string
): Question => {
  const data = item.data || {};
  return {
    ...(data as Partial<Question>),
    id,
    type: item.type as Question['type'],
    prompt: prompt || item.id,
    ...(answer !== undefined ? { answer } : {})
  };
};

const pushQuestion = (
  output: OrderedTeacherQuestion[],
  seen: Set<string>,
  question: Question,
  sectionTitle: string,
  sectionId: string | undefined,
  sectionOrder: number,
  exerciseOrder: number,
  itemOrder: number,
  exerciseId = question.id,
  originalQuestionNumber?: number
) => {
  if (seen.has(question.id)) return;
  seen.add(question.id);
  output.push({
    questionId: question.id,
    sectionId,
    sectionTitle,
    exerciseId,
    type: String(question.type || ''),
    sectionOrder,
    exerciseOrder,
    itemOrder,
    originalQuestionNumber: originalQuestionNumber && originalQuestionNumber > 0
      ? originalQuestionNumber
      : output.length + 1,
    question
  });
};

const appendStructuredSection = (
  output: OrderedTeacherQuestion[],
  seen: Set<string>,
  section: { id?: string; title?: string; items: LessonItem[] },
  sectionOrder: number
) => {
  section.items.forEach((item, exerciseOrder) => {
    if (isStructuredExerciseItem(item)) {
      const label = STRUCTURED_EXERCISE_LABELS[String(item.type || '').toLowerCase() as keyof typeof STRUCTURED_EXERCISE_LABELS] || section.title || 'Bài tập';
      getStructuredQuestionRows(item).forEach((row, itemOrder) => {
        const question: Question = {
          id: row.key,
          type: item.type as Question['type'],
          prompt: row.prompt,
          options: row.options.map((option) => `${option.id}. ${option.text}`),
          optionImages: row.options
            .filter((option) => option.image)
            .map((option) => ({ id: option.id, url: option.image, alt: option.alt })),
          answer: row.correctAnswer,
          audioUrl: row.audio || row.questionAudio,
          audioText: row.transcript,
          teacherReviewRequired: false
        };
        pushQuestion(
          output,
          seen,
          question,
          label,
          section.id,
          sectionOrder,
          exerciseOrder,
          itemOrder,
          item.id,
          row.number
        );
      });
      return;
    }

    const data = item.data || {};
    const prompt = typeof data.prompt === 'string'
      ? data.prompt
      : typeof data.question === 'string'
        ? data.question
        : typeof data.title === 'string'
          ? data.title
          : item.id;
    const answer = typeof data.correctAnswer === 'string'
      ? data.correctAnswer
      : typeof data.answer === 'string'
        ? data.answer
        : undefined;
    pushQuestion(
      output,
      seen,
      questionFromData(item, prompt, item.id, answer),
      section.title || 'Bài tập',
      section.id,
      sectionOrder,
      exerciseOrder,
      0,
      item.id
    );
  });
};

export const buildOrderedQuestionList = (exam: ExamLesson | undefined): OrderedTeacherQuestion[] => {
  if (!exam) return [];

  const ordered: OrderedTeacherQuestion[] = [];
  const seen = new Set<string>();

  // This is the same top-to-bottom order used by StudentExamForm. The source
  // exam remains authoritative; no submission array is used to create order.
  (exam.sections || []).forEach((section, index) => {
    appendStructuredSection(ordered, seen, section, index);
  });

  const appendArray = (
    questions: Question[] | undefined,
    sectionTitle: string,
    sectionOrder: number,
    sectionId: string
  ) => {
    (questions || []).forEach((question, itemOrder) => {
      pushQuestion(ordered, seen, question, sectionTitle, sectionId, sectionOrder, itemOrder, 0);
    });
  };

  appendArray(exam.mcQuestions, 'Trắc nghiệm', 100, 'mc');
  appendArray(exam.fillQuestions, 'Điền từ', 110, 'fill');
  appendArray(exam.arrangeQuestions, 'Sắp xếp câu', 120, 'arrange');

  const listeningQuestions = (exam.listeningQuestions || []).flatMap((question) => (
    question.subQuestions?.length ? question.subQuestions : [question]
  ));
  appendArray(listeningQuestions, 'Bài nghe', 130, 'listening');

  (exam.readingPassages || []).forEach((passage, passageIndex) => {
    appendArray(passage.questions, `Đọc hiểu · ${passage.title}`, 140 + passageIndex, passage.id);
  });

  appendArray(exam.essayQuestions, 'Tự luận / Viết', 160, 'essay');
  appendArray(exam.speakingQuestions, 'Nói / Ghi âm', 170, 'speaking');
  appendArray(exam.translationQuestions, 'Dịch', 180, 'translation');

  return ordered;
};
