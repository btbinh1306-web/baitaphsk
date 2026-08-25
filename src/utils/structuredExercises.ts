import { LessonItem, LessonSection } from '../types/lesson';
import { AnswerSnapshotItem } from '../types';

export const STRUCTURED_EXERCISE_TYPES = [
  'listening_image_choice',
  'listening_text_choice',
  'listening_shared_image_match',
  'listening_comprehension_choice',
  'reading_shared_image_match',
  'sentence_matching',
  'reading_comprehension_choice'
] as const;

export type StructuredExerciseType = (typeof STRUCTURED_EXERCISE_TYPES)[number];
export type StructuredAnswerMap = Record<string, string>;

export const STRUCTURED_EXERCISE_LABELS: Record<StructuredExerciseType, string> = {
  listening_image_choice: 'Nghe -> chọn hình',
  listening_text_choice: 'Nghe -> chọn đáp án',
  listening_shared_image_match: 'Nghe -> ghép hình dùng chung',
  listening_comprehension_choice: 'Nghe hiểu -> trả lời',
  reading_shared_image_match: 'Đọc -> chọn hình dùng chung',
  sentence_matching: 'Nối câu',
  reading_comprehension_choice: 'Đọc hiểu -> trắc nghiệm'
};

export const STRUCTURED_EXERCISE_TEMPLATES: Array<{
  type: StructuredExerciseType | 'fill';
  label: string;
  group: 'Nghe' | 'Đọc';
  data: Record<string, unknown>;
}> = [
  {
    type: 'listening_image_choice',
    label: 'Nghe -> chọn hình',
    group: 'Nghe',
    data: {
      instruction: 'Nghe và chọn hình phù hợp.',
      example: '',
      playCount: 2,
      limitPlayCount: false,
      showPinyin: false,
      items: [{ id: 'q1', audio: '', options: optionTemplates(true, 3), correctAnswer: 'A' }]
    }
  },
  {
    type: 'listening_text_choice',
    label: 'Nghe -> chọn đáp án',
    group: 'Nghe',
    data: {
      instruction: 'Nghe câu hỏi và chọn đáp án đúng.',
      example: '',
      playCount: 2,
      limitPlayCount: false,
      showPinyin: false,
      items: [{ id: 'q1', audio: '', transcript: '', options: optionTemplates(false, 3), correctAnswer: 'A' }]
    }
  },
  {
    type: 'listening_shared_image_match',
    label: 'Nghe -> ghép hình dùng chung',
    group: 'Nghe',
    data: {
      instruction: 'Nghe hội thoại và chọn hình phù hợp.',
      example: '',
      playCount: 2,
      limitPlayCount: false,
      sharedOptions: optionTemplates(true, 4),
      items: [{ id: 'q1', audio: '', correctAnswer: 'A' }]
    }
  },
  {
    type: 'listening_comprehension_choice',
    label: 'Nghe hiểu -> trả lời',
    group: 'Nghe',
    data: {
      instruction: 'Nghe câu và câu hỏi, sau đó chọn đáp án đúng.',
      example: '',
      playCount: 2,
      limitPlayCount: false,
      showPinyin: false,
      audio: '',
      questionAudio: '',
      questions: [{ id: 'q1', transcript: '', question: '', options: optionTemplates(false, 3), correctAnswer: 'A' }]
    }
  },
  {
    type: 'reading_shared_image_match',
    label: 'Đọc -> chọn hình dùng chung',
    group: 'Đọc',
    data: {
      instruction: 'Đọc câu và chọn hình phù hợp.',
      example: '',
      showPinyin: false,
      sharedOptions: optionTemplates(true, 4),
      items: [{ id: 'q1', text: '', pinyin: '', translation: '', correctAnswer: 'A' }]
    }
  },
  {
    type: 'sentence_matching',
    label: 'Nối câu',
    group: 'Đọc',
    data: {
      instruction: 'Chọn câu trả lời phù hợp cho từng câu hỏi.',
      example: '',
      showPinyin: false,
      answerBank: optionTemplates(false, 4),
      items: [{ id: 'q1', text: '', pinyin: '', correctAnswer: 'A' }]
    }
  },
  {
    type: 'fill',
    label: 'Điền từ (ngân hàng từ chung)',
    group: 'Đọc',
    data: {
      instruction: 'Chọn từ thích hợp để điền vào chỗ trống.',
      example: '',
      showPinyin: false,
      wordBank: optionTemplates(false, 3),
      items: [{ id: 'q1', prompt: '', pinyin: '', correctAnswer: 'A' }]
    }
  },
  {
    type: 'reading_comprehension_choice',
    label: 'Đọc hiểu -> trắc nghiệm',
    group: 'Đọc',
    data: {
      instruction: 'Đọc nội dung và chọn đáp án đúng.',
      example: '',
      showPinyin: false,
      passage: { text: '', pinyin: '' },
      questions: [{ id: 'q1', question: '', pinyin: '', options: optionTemplates(false, 3), correctAnswer: 'A' }]
    }
  }
];

function optionTemplates(withImage: boolean, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: String.fromCharCode(65 + index),
    ...(withImage ? { image: '', alt: '' } : { text: '', pinyin: '' })
  }));
}

export function createStructuredLessonItem(type: StructuredExerciseType | 'fill'): LessonItem {
  const template = STRUCTURED_EXERCISE_TEMPLATES.find((item) => item.type === type) || STRUCTURED_EXERCISE_TEMPLATES[0];
  return {
    id: `${type}_${Date.now().toString(36)}`,
    type,
    data: JSON.parse(JSON.stringify(template.data)) as Record<string, unknown>
  };
}

export function isStructuredExerciseType(type: string): type is StructuredExerciseType {
  return (STRUCTURED_EXERCISE_TYPES as readonly string[]).includes(type);
}

export function isStructuredExerciseItem(item: LessonItem): boolean {
  const type = String(item.type || '').toLowerCase().trim();
  return isStructuredExerciseType(type) || (
    (type === 'fill' || type === 'fill_in_blank') && Array.isArray(item.data?.items)
  );
}

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}

function asArray(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function textValue(...values: unknown[]): string {
  const value = values.find((item) => typeof item === 'string' || typeof item === 'number');
  return value === undefined ? '' : String(value).trim();
}

export interface StructuredOption {
  id: string;
  answerId?: string;
  text: string;
  pinyin: string;
  image: string;
  alt: string;
}

export interface StructuredQuestionRow {
  id: string;
  key: string;
  number?: number;
  prompt: string;
  pinyin: string;
  audio: string;
  questionAudio: string;
  transcript: string;
  correctAnswer: string;
  options: StructuredOption[];
}

export function normalizeStructuredOptions(value: unknown): StructuredOption[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw, index) => {
    if (typeof raw === 'string' || typeof raw === 'number') {
      return { id: String.fromCharCode(65 + index), text: String(raw), pinyin: '', image: '', alt: '' };
    }
    const option = asRecord(raw);
    return {
      id: textValue(option.id, option.label) || String.fromCharCode(65 + index),
      text: textValue(option.text, option.hanzi, option.value, option.answer),
      pinyin: textValue(option.pinyin),
      image: textValue(option.image, option.imageUrl, option.url),
      alt: textValue(option.alt, option.altText, option.text)
    };
  });
}

export function getStructuredSharedOptions(item: LessonItem): StructuredOption[] {
  const data = asRecord(item.data);
  return normalizeStructuredOptions(data.sharedOptions || data.answerBank || data.wordBank);
}

export function getStructuredQuestionRows(item: LessonItem): StructuredQuestionRow[] {
  const data = asRecord(item.data);
  const type = String(item.type || '').toLowerCase().trim();
  const rawRows = type === 'reading_comprehension_choice' || (
    type === 'listening_comprehension_choice' && Array.isArray(data.questions) && !Array.isArray(data.items)
  )
    ? asArray(data.questions)
    : asArray(data.items);
  const sharedOptions = getStructuredSharedOptions(item);

  return rawRows.map((row, index) => {
    const id = textValue(row.id) || `q${index + 1}`;
    const ownOptions = normalizeStructuredOptions(row.options || row.choices);
    const rawAnswer = row.correctAnswer ?? row.answer;
    const options = ownOptions.length > 0 ? ownOptions : sharedOptions;
    const numericAnswer = typeof rawAnswer === 'number' ? options[rawAnswer]?.id : undefined;
    const textAnswer = textValue(rawAnswer);
    const matchedAnswer = options.find((option) => (
      option.id.toLowerCase() === textAnswer.toLowerCase() || option.text === textAnswer
    ));
    return {
      id,
      key: `${item.id}::${id}`,
      number: typeof row.number === 'number' ? row.number : undefined,
      prompt: textValue(row.question, row.prompt, row.text, row.hanzi) || `Câu ${index + 1}`,
      pinyin: textValue(row.pinyin),
      audio: textValue(row.audio, row.audioUrl, row.audioPromptUrl),
      questionAudio: textValue(row.questionAudio, row.questionAudioUrl),
      transcript: textValue(row.transcript, row.audioText),
      correctAnswer: numericAnswer || matchedAnswer?.id || textAnswer,
      options
    };
  });
}

export function getStructuredQuestionCount(sections?: LessonSection[]): number {
  return (sections || []).reduce((total, section) => total + section.items.reduce((itemTotal, item) => (
    itemTotal + (isStructuredExerciseItem(item) ? getStructuredQuestionRows(item).length : 0)
  ), 0), 0);
}

function optionDisplay(options: StructuredOption[], id: string): string {
  const option = options.find((item) => item.id === id);
  if (!option) return id || 'Để trống';
  return [option.id, option.text].filter(Boolean).join('. ') || option.id;
}

export function gradeStructuredSections(
  sections: LessonSection[] | undefined,
  answers: StructuredAnswerMap
): { correct: number; wrong: number; notDone: number; total: number; wrongDetails: string[]; answerDetails: AnswerSnapshotItem[] } {
  let correct = 0;
  let wrong = 0;
  let notDone = 0;
  let total = 0;
  const wrongDetails: string[] = [];
  const answerDetails: AnswerSnapshotItem[] = [];

  (sections || []).forEach((section) => {
    section.items.forEach((item) => {
      const type = String(item.type || '').toLowerCase().trim();
      if (!isStructuredExerciseItem(item)) return;
      const label = STRUCTURED_EXERCISE_LABELS[type];
      getStructuredQuestionRows(item).forEach((row, index) => {
        total += 1;
        const userAnswer = textValue(answers[row.key]);
        const userAnswerText = optionDisplay(row.options, userAnswer);
        const correctAnswerText = optionDisplay(row.options, row.correctAnswer);
        const status: AnswerSnapshotItem['status'] = !userAnswer
          ? 'unanswered'
          : (userAnswer === row.correctAnswer ? 'correct' : 'wrong');
        answerDetails.push({
          id: row.key,
          section: label,
          number: row.number || index + 1,
          prompt: row.prompt,
          userAnswer: userAnswer ? userAnswerText : '',
          correctAnswer: correctAnswerText,
          status
        });
        if (!userAnswer) {
          notDone += 1;
          return;
        }
        if (userAnswer === row.correctAnswer) {
          correct += 1;
          return;
        }
        wrong += 1;
        wrongDetails.push(
          `[${label} Câu ${index + 1}: "${row.prompt}"]: Bạn chọn [${userAnswerText}] — Đáp án đúng [${correctAnswerText}]`
        );
      });
    });
  });

  return { correct, wrong, notDone, total, wrongDetails, answerDetails };
}
