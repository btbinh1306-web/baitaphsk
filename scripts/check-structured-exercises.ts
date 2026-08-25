import assert from 'node:assert/strict';
import { LessonData } from '../src/types/lesson';
import { parseLessonToExam } from '../src/utils/lessonParser';
import {
  getStructuredQuestionCount,
  getStructuredQuestionRows,
  gradeStructuredSections
} from '../src/utils/structuredExercises';

const imageOptions = ['A', 'B', 'C', 'D'].map((id) => ({ id, image: `${id}.png`, alt: `Ảnh ${id}` }));
const textOptions = ['A', 'B', 'C', 'D'].map((id) => ({ id, text: `Đáp án ${id}`, pinyin: '' }));

const lesson: LessonData = {
  version: '1.0',
  lesson: { id: 'structured-check', title: 'Structured check', level: 'HSK 1' },
  sections: [
    {
      id: 'listen',
      title: 'Nghe',
      items: [
        {
          id: 'listen-images',
          type: 'listening_image_choice',
          data: {
            instruction: 'Nghe và chọn hình.',
            items: Array.from({ length: 3 }, (_, index) => ({
              id: `q${index + 1}`,
              audio: `q${index + 1}.mp3`,
              options: imageOptions.slice(0, 3),
              correctAnswer: index === 0 ? 'B' : 'A'
            }))
          }
        },
        {
          id: 'shared-listen',
          type: 'listening_shared_image_match',
          data: {
            sharedOptions: imageOptions,
            items: [
              { id: 'q1', audio: 'one.mp3', correctAnswer: 'A' },
              { id: 'q2', audio: 'two.mp3', correctAnswer: 'D' },
              { id: 'q3', audio: 'three.mp3', correctAnswer: 'C' }
            ]
          }
        },
        {
          id: 'listen-text',
          type: 'listening_text_choice',
          data: {
            items: [
              { id: 'q1', audio: 'question-1.mp3', options: textOptions.slice(0, 3), correctAnswer: 'A' },
              { id: 'q2', audio: 'question-2.mp3', options: textOptions.slice(0, 3), correctAnswer: 'C' }
            ]
          }
        },
        {
          id: 'listen-comprehension',
          type: 'listening_comprehension_choice',
          data: {
            audio: 'shared-sentence.mp3',
            questionAudio: 'shared-question.mp3',
            questions: [
              { id: 'q1', question: '说话人家里有几口人？', options: textOptions.slice(0, 3), correctAnswer: 'B' },
              { id: 'q2', question: '她是哪国人？', options: textOptions.slice(0, 3), correctAnswer: 'A' }
            ]
          }
        }
      ]
    },
    {
      id: 'read',
      title: 'Đọc',
      items: [
        {
          id: 'matching',
          type: 'sentence_matching',
          data: {
            answerBank: textOptions,
            items: [
              { id: 'q1', text: '她是谁？', correctAnswer: 'C' },
              { id: 'q2', text: '你是法国人吗？', correctAnswer: 'D' },
              { id: 'q3', text: '您儿子多大？', correctAnswer: 'B' }
            ]
          }
        },
        {
          id: 'read-images',
          type: 'reading_shared_image_match',
          data: {
            sharedOptions: imageOptions,
            items: [
              { id: 'q1', text: '老师，您好！', correctAnswer: 'A' },
              { id: 'q2', text: '我家有四口人。', correctAnswer: 'D' },
              { id: 'q3', text: '我哥哥今年二十岁。', correctAnswer: 'B' }
            ]
          }
        },
        {
          id: 'reading-comprehension',
          type: 'reading_comprehension_choice',
          data: {
            passage: { text: '我家有三口人，爸爸、妈妈和我。', pinyin: '' },
            questions: [
              { id: 'q1', question: '说话人家里有：', options: textOptions.slice(0, 3), correctAnswer: 'B' },
              { id: 'q2', question: '家里没有谁？', options: textOptions.slice(0, 3), correctAnswer: 'C' }
            ]
          }
        },
        {
          id: 'fill-bank',
          type: 'fill',
          data: {
            wordBank: [
              { id: 'A', text: '想', pinyin: 'xiǎng' },
              { id: 'B', text: '忙', pinyin: 'máng' },
              { id: 'C', text: '名字', pinyin: 'míngzi' }
            ],
            items: [
              { id: 'q1', prompt: '她工作很（ ）。', correctAnswer: 'B' },
              { id: 'q2', prompt: '你叫什么（ ）？', correctAnswer: 'C' }
            ]
          }
        }
      ]
    }
  ]
};

const exam = parseLessonToExam(lesson);
assert.equal(exam.fillQuestions?.length, 0, 'structured word-bank fill must stay in sections');
const fillItem = exam.sections?.flatMap((section) => section.items).find((item) => item.id === 'fill-bank');
assert.ok(fillItem);
assert.deepEqual(getStructuredQuestionRows(fillItem)[0].options.map((option) => option.text), ['想', '忙', '名字']);
assert.equal(getStructuredQuestionRows(fillItem)[0].correctAnswer, 'B');
assert.equal(getStructuredQuestionCount(exam.sections), 18, 'all seven new objective types must preserve all questions');

const sharedItem = exam.sections?.flatMap((section) => section.items).find((item) => item.id === 'shared-listen');
assert.ok(sharedItem);
assert.equal(getStructuredQuestionRows(sharedItem)[0].options.length, 4, 'shared image bank must be resolved at render time');
assert.equal(Object.prototype.hasOwnProperty.call((sharedItem.data.items as object[])[0], 'options'), false, 'shared images must not be copied into each item');

const answers: Record<string, string> = {};
exam.sections?.forEach((section) => section.items.forEach((item) => {
  getStructuredQuestionRows(item).forEach((row) => {
    answers[row.key] = row.correctAnswer;
  });
}));
answers['matching::q1'] = 'D';
delete answers['reading-comprehension::q2'];

const grade = gradeStructuredSections(exam.sections, answers);
assert.deepEqual(
  { total: grade.total, correct: grade.correct, wrong: grade.wrong, notDone: grade.notDone },
  { total: 18, correct: 16, wrong: 1, notDone: 1 }
);
assert.match(grade.wrongDetails[0], /Bạn chọn/);
assert.match(grade.wrongDetails[0], /Đáp án đúng/);

console.log('Structured exercise checks passed: 18 questions across 7 objective types + 2 shared-word-bank fill questions.');
