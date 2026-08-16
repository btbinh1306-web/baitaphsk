import { useEffect, useMemo, useState } from 'react';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { fetchServerHandwritingExercises } from '../services/apiService';
import { getHandwritingExercises, convertHandwritingToExamLesson } from '../services/handwritingService';
import { ExamLesson } from '../types';

export function useStudentExamCatalog(customExams: ExamLesson[], deletedExamIds: string[]) {
  const [serverHwExamLessons, setServerHwExamLessons] = useState<ExamLesson[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchServerHandwritingExercises().then((exercises) => {
      if (!cancelled) {
        setServerHwExamLessons(exercises.map(convertHandwritingToExamLesson));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const localHwExamLessons = useMemo(() => {
    try {
      return getHandwritingExercises().map(convertHandwritingToExamLesson);
    } catch (error) {
      console.warn('Failed to load local handwriting exercises:', error);
      return [];
    }
  }, []);

  const allExams = useMemo(() => {
    const list: ExamLesson[] = [...customExams];

    [...serverHwExamLessons, ...localHwExamLessons, ...SAMPLE_EXAMS].forEach((exam) => {
      if (!list.some((item) => item.id === exam.id)) list.push(exam);
    });

    return list.filter(
      (exam) =>
        !deletedExamIds.includes(exam.id) &&
        exam.id !== 'hw_hsk1_b5' &&
        !exam.title.includes('HSK1 Bài 5') &&
        !exam.title.includes('HSK 1 Bài 5')
    );
  }, [customExams, deletedExamIds, localHwExamLessons, serverHwExamLessons]);

  return { allExams };
}
