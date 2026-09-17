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

const isLocalUploadAudioUrl = (value: unknown): boolean => (
  typeof value === 'string' && /^\/api\/media\/file_[^/]+\.(?:mp3|wav|ogg|m4a|webm)$/iu.test(value.trim())
);

/** Restore bundled listening audio when an old local upload no longer exists. */
const migrateMissingBundledAudio = (exam: ExamLesson, bundledExam: ExamLesson | undefined): ExamLesson => {
  if (!bundledExam || !exam.listeningQuestions?.length || !bundledExam.listeningQuestions?.length) return exam;

  const bundledAudioByQuestionId = new Map(
    bundledExam.listeningQuestions
      .map((question) => [question.id, question.audioUrl || question.audioPromptUrl])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
  );
  let changed = false;
  const listeningQuestions = exam.listeningQuestions.map((question) => {
    const bundledAudio = bundledAudioByQuestionId.get(question.id);
    const hasMissingLocalUpload = [question.audioUrl, question.audioPromptUrl].some(isLocalUploadAudioUrl);
    if (!bundledAudio || !hasMissingLocalUpload) return question;

    changed = true;
    return { ...question, audioUrl: bundledAudio, audioPromptUrl: bundledAudio };
  });

  return changed ? { ...exam, listeningQuestions } : exam;
};

/** Keep saved copies of built-in lessons compatible with bundled answer corrections. */
const migrateKnownAnswerCorrections = (exam: ExamLesson, bundledExam: ExamLesson | undefined): ExamLesson => {
  if (!bundledExam) return exam;

  if (exam.id === 'hsk1-bai4-5-ky-nang') {
    const bundledFillQuestion = bundledExam.fillQuestions?.find((question) => question.id === 'hsk1_bai4_fill_02');
    const savedFillQuestion = exam.fillQuestions?.find((question) => question.id === 'hsk1_bai4_fill_02');
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_bai4_listen_02');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_bai4_listen_02');
    const shouldMigrateFillAnswers = bundledFillQuestion && savedFillQuestion && (
      String(savedFillQuestion.acceptableAnswers ?? '').trim() !== String(bundledFillQuestion.acceptableAnswers ?? '').trim()
    );
    const shouldMigrateListeningAnswer = bundledQuestion && savedQuestion && String(savedQuestion.answer) !== String(bundledQuestion.answer);
    if (!shouldMigrateFillAnswers && !shouldMigrateListeningAnswer) return exam;

    return {
      ...exam,
      fillQuestions: shouldMigrateFillAnswers
        ? exam.fillQuestions?.map((question) => (
          question.id === savedFillQuestion.id
            ? { ...question, answer: bundledFillQuestion.answer, acceptableAnswers: bundledFillQuestion.acceptableAnswers }
            : question
        ))
        : exam.fillQuestions,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        shouldMigrateListeningAnswer && question.id === savedQuestion.id
          ? {
              ...question,
              answer: bundledQuestion.answer,
              audioText: bundledQuestion.audioText,
              explanation: bundledQuestion.explanation
            }
          : question
      ))
    };
  }

  if (exam.id !== 'hsk1-bai2-5-ky-nang') return exam;

  const bundledQuestion = bundledExam.fillQuestions?.find((question) => question.id === 'hsk1_bai2_fill_04');
  const savedQuestion = exam.fillQuestions?.find((question) => question.id === 'hsk1_bai2_fill_04');
  if (!bundledQuestion || !savedQuestion) return exam;

  const savedAnswer = String(savedQuestion.answer ?? '').trim();
  const savedAcceptableAnswers = String(savedQuestion.acceptableAnswers ?? '').trim();
  const bundledAnswer = String(bundledQuestion.answer ?? '').trim();
  const bundledAcceptableAnswers = String(bundledQuestion.acceptableAnswers ?? '').trim();
  const isKnownStaleAnswer = savedAnswer === '什么' || savedAcceptableAnswers === '什么';
  if (!isKnownStaleAnswer || !bundledAnswer || !bundledAcceptableAnswers) return exam;

  return {
    ...exam,
    fillQuestions: exam.fillQuestions?.map((question) => (
      question.id === savedQuestion.id
        ? { ...question, answer: bundledQuestion.answer, acceptableAnswers: bundledQuestion.acceptableAnswers }
        : question
    ))
  };
};

/** Prefer the bundled expanded aggregate over an older saved snapshot with the same id. */
export const buildExamCatalog = (customExams: ExamLesson[], bundledExams: ExamLesson[]): ExamLesson[] => {
  const bundledMock02 = bundledExams.find((exam) => exam.id === 'hsk1-mock-02');
  const bundledById = new Map(bundledExams.map((exam) => [exam.id, normalizeBundledExamIdentity(exam)]));
  const usableCustomExams = Array.from(new Map(
    customExams
      .filter((exam) => !isStaleHsk1Mock02Snapshot(exam, bundledMock02))
      .map(normalizeBundledExamIdentity)
      .map((exam) => migrateKnownAnswerCorrections(exam, bundledById.get(exam.id)))
      .map((exam) => migrateMissingBundledAudio(exam, bundledById.get(exam.id)))
      .map((exam) => [exam.id, exam])
  ).values());

  return [
    ...usableCustomExams,
    ...bundledExams
      .filter((exam) => !usableCustomExams.some((customExam) => customExam.id === exam.id))
      .map(normalizeBundledExamIdentity)
  ];
};
