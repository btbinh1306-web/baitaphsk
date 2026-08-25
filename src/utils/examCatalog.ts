import { ExamLesson } from '../types';

const TRIAL_03_WAV_QUESTIONS = new Set(['11', '12', '13', '14', '15', '20']);

const migrateLocalAudio = (exam: ExamLesson): ExamLesson => {
  if (exam.id === 'hsk1-mock-01') {
    return JSON.parse(JSON.stringify(exam).replace(
      /\/audio\/hsk1-mock-01\/q(\d{2})\.mp3/g,
      (_match, number: string) => `/audio/hsk1_trial_03/q${number}.${TRIAL_03_WAV_QUESTIONS.has(number) ? 'wav' : 'mp3'}`
    )) as ExamLesson;
  }

  if (exam.id === 'hsk1-de-tong-hop-bai1-5-5-ky-nang') {
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions.map((question, index) => (
        index < 10
          ? { ...question, audioUrl: `/audio/hsk1_aggregate_0105/q${String(index + 1).padStart(2, '0')}.mp3` }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai10-15-tong-hop-5-ky-nang') {
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions.map((question, index) => (
        index < 5
          ? { ...question, audioUrl: `/audio/hsk1_aggregate_1015/0${index + 1}.mp3` }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai6-10-tong-hop-5-ky-nang') {
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions.map((question, index) => (
        index < 5
          ? { ...question, audioUrl: `/audio/hsk1_aggregate_0610/0${index + 1}.mp3` }
          : question
      ))
    };
  }

  return exam;
};

const normalizeBundledExamIdentity = (exam: ExamLesson): ExamLesson => (
  exam.id === 'hsk1-mock-01'
    ? migrateLocalAudio({ ...exam, title: 'HSK 1 (3.0) - Đề thi thử số 3' })
    : migrateLocalAudio(exam)
);

const isStaleHsk1Mock02Snapshot = (exam: ExamLesson, bundledExam: ExamLesson | undefined): boolean => (
  exam.id === 'hsk1-mock-02' &&
  !!bundledExam &&
  (
    (exam.speakingQuestions?.length || 0) < bundledExam.speakingQuestions.length ||
    (exam.translationQuestions?.length || 0) < (bundledExam.translationQuestions?.length || 0) ||
    (exam.speakingQuestions?.filter((question) => !!question.imageUrl).length || 0) <
      bundledExam.speakingQuestions.filter((question) => !!question.imageUrl).length ||
    !JSON.stringify(exam).includes('/audio/hsk1_aggregate_0115/q18.mp3')
  )
);

/** Prefer the bundled expanded aggregate over an older saved snapshot with the same id. */
export const buildExamCatalog = (customExams: ExamLesson[], bundledExams: ExamLesson[]): ExamLesson[] => {
  const bundledMock02 = bundledExams.find((exam) => exam.id === 'hsk1-mock-02');
  const usableCustomExams = Array.from(new Map(
    customExams
      .filter((exam) => !isStaleHsk1Mock02Snapshot(exam, bundledMock02))
      .map(normalizeBundledExamIdentity)
      .map((exam) => [exam.id, exam])
  ).values());

  return [
    ...usableCustomExams,
    ...bundledExams
      .filter((exam) => !usableCustomExams.some((customExam) => customExam.id === exam.id))
      .map(normalizeBundledExamIdentity)
  ];
};
