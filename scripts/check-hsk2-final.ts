import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { HSK2_FINAL_EXAM as exam } from '../src/data/hsk2Final';
import { getStructuredQuestionRows, gradeStructuredSections } from '../src/utils/structuredExercises';
import { buildOrderedQuestionList, requiresTeacherReview } from '../src/utils/teacherQuestionOrder';

const blocks = exam.sections!.flatMap(section => section.items);
const rows = blocks.flatMap(getStructuredQuestionRows);
assert.equal(rows.length, 60);
assert.deepEqual(rows.map(row => row.number), Array.from({ length: 60 }, (_, i) => i + 1));
assert.equal(new Set(rows.map(row => row.key)).size, 60);
assert.equal(exam.sections![0].items.flatMap(getStructuredQuestionRows).length, 35);
assert.equal(blocks.filter(item => item.data.audio).length, 1);
assert.equal(blocks[0].data.singlePass, true);
const assets = new Set<string>();
function scan(value: unknown) {
  if (typeof value === 'string' && /^\/(assets|audio)\//.test(value)) assets.add(value);
  else if (Array.isArray(value)) value.forEach(scan);
  else if (value && typeof value === 'object') Object.values(value).forEach(scan);
}
scan(exam);
assert.equal(assets.size, 30);
assets.forEach(path => { assert(existsSync(`public${path}`), path); assert(statSync(`public${path}`).size > 0); });
const answerKey = ['×', '×', '✓', '✓', '×', '×', '×', '✓', '✓', '✓',
  'C', 'B', 'E', 'A', 'F', 'D', 'B', 'A', 'C', 'E',
  'B', 'C', 'B', 'B', 'A', 'A', 'B', 'C', 'A', 'C', 'C', 'C', 'A', 'B', 'A',
  'A', 'B', 'E', 'C', 'F', 'B', 'C', 'D', 'F', 'A', '×', '✓', '×', '✓', '×',
  'D', 'C', 'B', 'A', 'F', 'D', 'B', 'E', 'A', 'C'];
const answers = Object.fromEntries(rows.map(row => [row.key, answerKey[row.number - 1]]));
const grade = gradeStructuredSections(exam.sections, answers);
assert.equal(grade.wrong, 0);
assert.equal(grade.total, 60);
assert.equal(grade.correct, 60);
assert.equal(grade.answerDetails.length, 60);
assert(grade.answerDetails.every(row => row.status === 'correct'));
const ordered = buildOrderedQuestionList(exam);
assert.equal(ordered.length, 60);
assert(ordered.every(row => !requiresTeacherReview(row.question)));
const oneWrong = { ...answers, [rows[0].key]: '✓' };
const oneWrongGrade = gradeStructuredSections(exam.sections, oneWrong);
assert.equal(oneWrongGrade.total, 60);
assert.equal(oneWrongGrade.correct, 59);
assert.equal(oneWrongGrade.wrong, 1);
console.log('PASS: 60 ordered questions, all answers approved, 29 original images, one audio.');
