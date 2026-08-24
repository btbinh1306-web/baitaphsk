import rawLessonData from '../../data/hsk1-mock-01.json';
import { ExamLesson } from '../types';
import { LessonData } from '../types/lesson';
import { parseLessonToExam } from '../utils/lessonParser';

export const HSK1_MOCK_01_EXAM: ExamLesson = parseLessonToExam(rawLessonData as LessonData);
