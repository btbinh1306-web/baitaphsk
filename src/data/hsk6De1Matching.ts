import { ExamLesson, Question } from '../types';

// Shared helpers for the HSK 6 · Đề 1 practice lessons (hsk6De1CisuFile1,
// hsk6De1CisuFile2, hsk6De1TuVung). "Nối" exercises become multiple-choice
// items that all show the same lettered list in the same order.

export type MatchingSet = { title: string; items: string[][]; options: string[]; answers: string };

export const LETTERS = 'ABCDEFGHIJKLMNOP';
export const lettered = (options: string[]) => options.map((option, index) => `${LETTERS[index]}. ${option}`);

export const emptyLesson = {
  fillQuestions: [] as Question[],
  arrangeQuestions: [] as Question[],
  readingPassages: [],
  listeningQuestions: [] as Question[],
  essayQuestions: [] as Question[],
  speakingQuestions: [] as Question[],
  translationQuestions: [] as Question[],
  handwritingQuestions: [] as Question[]
};

// One "nối" set = one task group (Bài N); every item shows the same A–J list.
export const matchingQuestions = (
  idPrefix: string,
  sets: MatchingSet[],
  titlePrefix: string,
  instruction: string
): Question[] => sets.flatMap((set, setIndex) => set.items.map(([word, pinyin = ''], itemIndex) => {
  const answer = LETTERS.indexOf(set.answers[itemIndex]);
  return {
    id: `${idPrefix}-${setIndex + 1}-${String(itemIndex + 1).padStart(2, '0')}`,
    type: 'mc',
    tier: 'tier1',
    prompt: pinyin ? `${word}（${pinyin}）` : word,
    options: lettered(set.options),
    keepOptionOrder: true,
    answer,
    explanation: `${word}：${set.options[answer]}`,
    taskGroup: `${idPrefix}-${setIndex + 1}`,
    taskGroupTitle: `${titlePrefix} · ${set.title}`,
    instruction
  };
}));

const CISU_INSTRUCTION = 'Nối từ trong phần 词素 với giải thích đơn giản bằng tiếng Trung: chọn lời giải thích đúng (A–J). Nhiều từ không có trong bài đọc.';

export const cisuLesson = (fileNumber: number, span: string, sets: MatchingSet[]): ExamLesson => {
  return {
    id: `hsk6-de1-cisu-${span}`,
    title: `HSK 6 · Đề ${fileNumber} · Luyện tập 词素`,
    level: 'HSK 6',
    description: '',
    instruction: CISU_INSTRUCTION,
    ...emptyLesson,
    mcQuestions: matchingQuestions(`hsk6-de1-cisu-${span}`, sets, '词素词语连线', CISU_INSTRUCTION)
  };
};
