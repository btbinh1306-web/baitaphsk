import { ExamLesson } from '../types';

const isStaleHsk1Mock02Snapshot = (exam: ExamLesson, bundledExam: ExamLesson | undefined): boolean => (
  exam.id === 'hsk1-mock-02' &&
  !!bundledExam &&
  (
    (exam.speakingQuestions?.length || 0) < bundledExam.speakingQuestions.length ||
    (exam.translationQuestions?.length || 0) < (bundledExam.translationQuestions?.length || 0) ||
    (exam.speakingQuestions?.filter((question) => !!question.imageUrl).length || 0) <
      bundledExam.speakingQuestions.filter((question) => !!question.imageUrl).length
  )
);

/** Prefer the bundled expanded aggregate over an older saved snapshot with the same id. */
export const buildExamCatalog = (customExams: ExamLesson[], bundledExams: ExamLesson[]): ExamLesson[] => {
  const bundledMock02 = bundledExams.find((exam) => exam.id === 'hsk1-mock-02');
  const usableCustomExams = customExams.filter(
    (exam) => !isStaleHsk1Mock02Snapshot(exam, bundledMock02)
  );

  return [
    ...usableCustomExams,
    ...bundledExams.filter((exam) => !usableCustomExams.some((customExam) => customExam.id === exam.id))
  ];
};
