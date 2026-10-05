import aggregateLessonData from '../../hsk1-de-kiem-tra-tong-hop-bai1-5.json';
import { LessonData } from '../types/lesson';
import { ExamLesson } from '../types';
import { parseLessonToExam } from '../utils/lessonParser';

/** The original five-skill HSK1 Bài 1–5 review exam. */
export const HSK1_AGGREGATE_BAI1_TO_5_EXAM: ExamLesson = parseLessonToExam(
  aggregateLessonData as LessonData
);
