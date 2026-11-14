import { ExamLesson, Question } from '../types';

const TRIAL_03_WAV_QUESTIONS = new Set(['11', '12', '13', '14', '15', '20']);

const migrateLocalAudio = (exam: ExamLesson): ExamLesson => {
  if (exam.id === 'hsk1-mock-01') {
    return JSON.parse(JSON.stringify(exam).replace(
      /\/audio\/hsk1-mock-01\/q(\d{2})\.mp3/g,
      (_match, number: string) => `/audio/hsk1_trial_03/q${number}.${TRIAL_03_WAV_QUESTIONS.has(number) ? 'wav' : 'mp3'}`
    )) as ExamLesson;
  }

  if (exam.id === 'hsk1-de-tong-hop-bai1-5-5-ky-nang') {
    const aggregateAudioByQuestionId: Record<string, string> = {
      q41: '/audio/hsk1_aggregate_0105/q01.mp3',
      q42: '/audio/hsk1_aggregate_0105/q02.mp3',
      q43: '/audio/hsk1_aggregate_0105/q03.mp3',
      q44: '/audio/hsk1_aggregate_0105/q04.mp3',
      q45: '/audio/hsk1_aggregate_0105/q05.mp3',
      q47: '/audio/hsk1_aggregate_0105/q07.mp3',
      q48: '/audio/hsk1_aggregate_0105/q08.mp3',
      q49: '/audio/hsk1_aggregate_0105/q09.mp3',
      q50: '/audio/hsk1_aggregate_0105/q10.mp3'
    };
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions
        .filter((question) => question.id !== 'q46' && question.id !== 'q53')
        .map((question) => {
          const audioUrl = aggregateAudioByQuestionId[question.id];
          return audioUrl ? { ...question, audioUrl } : question;
        })
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

// Answer-key fixes for section-based lessons whose old copies are saved in
// Google Sheet: [lessonId, questionId, wrongAnswer, correctAnswer].
const SECTION_ANSWER_CORRECTIONS: Array<[string, string, string, string]> = [
  // 我朋友是一个老师 → 她朋友在学校工作 (B. 学校), not A. 饭店.
  ['hsk1-trial-pdf-01', 'hsk1-trial-pdf-01-l20', 'A', 'B']
];

const fixSectionAnswer = (exam: ExamLesson, questionId: string, wrong: string, right: string): ExamLesson => {
  let changed = false;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      const next = value.map(walk);
      return next.some((item, index) => item !== value[index]) ? next : value;
    }
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (record.id === questionId && record.correctAnswer === wrong) {
      changed = true;
      return { ...record, correctAnswer: right };
    }
    let copy: Record<string, unknown> | null = null;
    for (const [key, child] of Object.entries(record)) {
      const nextChild = walk(child);
      if (nextChild !== child) {
        copy = copy || { ...record };
        copy[key] = nextChild;
      }
    }
    return copy || value;
  };
  const fixed = walk(exam) as ExamLesson;
  return changed ? fixed : exam;
};

/** Keep saved copies of built-in lessons compatible with bundled answer corrections. */
const migrateKnownAnswerCorrections = (exam: ExamLesson, bundledExam: ExamLesson | undefined): ExamLesson => {
  if (!bundledExam) return exam;

  for (const [lessonId, questionId, wrong, right] of SECTION_ANSWER_CORRECTIONS) {
    if (exam.id === lessonId) exam = fixSectionAnswer(exam, questionId, wrong, right);
  }

  if (exam.id === 'hsk1-de-tong-hop-bai1-5-5-ky-nang') {
    let changed = false;
    const fixQuestion = (question: Question): Question => {
      let fixed = question;
      // Keep the saved answer tied to the option text when an old snapshot reordered choices.
      const normalizedPrompt = String(question.prompt || '').replace(/^Câu\s*\d+[.:]?\s*/iu, '').trim();
      if (
        ['Hôm nay là thứ mấy?', '今天是星期几？'].includes(normalizedPrompt) &&
        question.options?.includes('星期三')
      ) {
        const wednesdayIndex = question.options.indexOf('星期三');
        if (question.answer !== wednesdayIndex) {
          fixed = { ...fixed, answer: wednesdayIndex };
          changed = true;
        }
      }

      if (question.id === 'listen_1786509664671' && question.answer === 3 && question.options?.length === 3) {
        fixed = { ...fixed, answer: 2 };
        changed = true;
      }
      if (question.subQuestions?.length) {
        const subQuestions = question.subQuestions.map(fixQuestion);
        if (subQuestions.some((item, index) => item !== question.subQuestions?.[index])) {
          fixed = { ...fixed, subQuestions };
        }
      }
      if (Array.isArray(question.questions)) {
        const questions = question.questions.map((raw) => {
          if (!raw || typeof raw !== 'object') return raw;
          const item = raw as Record<string, unknown>;
          if (item.id === 'listen_1786509664671' && item.answer === 3 && Array.isArray(item.options) && item.options.length === 3) {
            changed = true;
            return { ...item, answer: 2 };
          }
          return raw;
        });
        if (questions.some((item, index) => item !== question.questions?.[index])) {
          fixed = { ...fixed, questions };
        }
      }
      return fixed;
    };

    const listeningQuestions = (exam.listeningQuestions || []).map(fixQuestion);
    return changed ? { ...exam, listeningQuestions } : exam;
  }

  if (exam.id === 'hsk2-bai1-word') {
    const correctedIds = new Set(['hsk2_b1_word_arrange_02', 'hsk2_b1_word_arrange_04']);
    const bundledArrangeById = new Map(
      (bundledExam.arrangeQuestions || []).map((question) => [question.id, question])
    );
    let changed = false;
    const arrangeQuestions = (exam.arrangeQuestions || []).map((question) => {
      if (!correctedIds.has(question.id)) return question;
      const bundledQuestion = bundledArrangeById.get(question.id);
      if (!bundledQuestion || question.acceptableAnswers === bundledQuestion.acceptableAnswers) return question;
      changed = true;
      return { ...question, acceptableAnswers: bundledQuestion.acceptableAnswers };
    });
    return changed ? { ...exam, arrangeQuestions } : exam;
  }

  if (exam.id === 'hsk1-bai3-5-ky-nang') {
    const bundledQuestion = bundledExam.arrangeQuestions?.find((question) => question.id === 'hsk1_bai3_arrange_02');
    const savedQuestion = exam.arrangeQuestions?.find((question) => question.id === 'hsk1_bai3_arrange_02');
    if (!bundledQuestion || !savedQuestion || savedQuestion.acceptableAnswers === bundledQuestion.acceptableAnswers) return exam;
    return {
      ...exam,
      arrangeQuestions: exam.arrangeQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? { ...question, acceptableAnswers: bundledQuestion.acceptableAnswers }
          : question
      ))
    };
  }

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

  if (exam.id === 'hsk1-bai5-5-ky-nang') {
    const bundledFillById = new Map(
      (bundledExam.fillQuestions || []).map((question) => [question.id, question])
    );
    let changed = false;
    const fillQuestions = (exam.fillQuestions || []).map((question) => {
      const bundledQuestion = bundledFillById.get(question.id);
      if (!bundledQuestion) return question;

      const answerChanged = String(question.answer ?? '').trim() !== String(bundledQuestion.answer ?? '').trim();
      const acceptableAnswersChanged = String(question.acceptableAnswers ?? '').trim() !== String(bundledQuestion.acceptableAnswers ?? '').trim();
      if (!answerChanged && !acceptableAnswersChanged) return question;

      changed = true;
      return {
        ...question,
        answer: bundledQuestion.answer,
        acceptableAnswers: bundledQuestion.acceptableAnswers
      };
    });

    return changed ? { ...exam, fillQuestions } : exam;
  }

  if (exam.id === 'hsk1-bai6-5-ky-nang') {
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_b6_listen_05');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_b6_listen_05');
    if (!bundledQuestion || !savedQuestion) return exam;
    if (savedQuestion.answerContains === bundledQuestion.answerContains) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? {
              ...question,
              answer: bundledQuestion.answer,
              acceptableAnswers: bundledQuestion.acceptableAnswers,
              answerContains: bundledQuestion.answerContains,
              audioText: bundledQuestion.audioText,
              explanation: bundledQuestion.explanation
            }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai7-5-ky-nang') {
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_b7_listen_05');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_b7_listen_05');
    if (!bundledQuestion || !savedQuestion) return exam;
    const bundledAnswers = String(bundledQuestion.acceptableAnswers || '').trim();
    if (!bundledAnswers || String(savedQuestion.acceptableAnswers || '').trim() === bundledAnswers) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? { ...question, answer: bundledQuestion.answer, acceptableAnswers: bundledQuestion.acceptableAnswers, audioText: bundledQuestion.audioText, explanation: bundledQuestion.explanation }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai8-5-ky-nang') {
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_b8_listen_05');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_b8_listen_05');
    if (!bundledQuestion || !savedQuestion) return exam;
    const bundledAnswers = String(bundledQuestion.acceptableAnswers || '').trim();
    if (!bundledAnswers || String(savedQuestion.acceptableAnswers || '').trim() === bundledAnswers) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? { ...question, answer: bundledQuestion.answer, acceptableAnswers: bundledQuestion.acceptableAnswers, audioText: bundledQuestion.audioText, explanation: bundledQuestion.explanation }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai9-5-ky-nang' || exam.id === 'hsk1-bai10-5-ky-nang') {
    const questionId = exam.id === 'hsk1-bai9-5-ky-nang' ? 'hsk1_b9_listen_05' : 'hsk1_b10_listen_05';
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === questionId);
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === questionId);
    if (!bundledQuestion || !savedQuestion) return exam;
    const bundledAnswers = String(bundledQuestion.acceptableAnswers || '').trim();
    if (!bundledAnswers || String(savedQuestion.acceptableAnswers || '').trim() === bundledAnswers) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? { ...question, answer: bundledQuestion.answer, acceptableAnswers: bundledQuestion.acceptableAnswers, audioText: bundledQuestion.audioText, explanation: bundledQuestion.explanation }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai11-5-ky-nang') {
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_b11_listen_05');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_b11_listen_05');
    if (!bundledQuestion || !savedQuestion) return exam;
    if (savedQuestion.answerContains === bundledQuestion.answerContains) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? {
              ...question,
              answer: bundledQuestion.answer,
              acceptableAnswers: bundledQuestion.acceptableAnswers,
              answerContains: bundledQuestion.answerContains,
              audioText: bundledQuestion.audioText,
              explanation: bundledQuestion.explanation
            }
          : question
      ))
    };
  }

  if (exam.id === 'hsk1-bai12-5-ky-nang') {
    const bundledQuestion = bundledExam.listeningQuestions?.find((question) => question.id === 'hsk1_b12_listen_05');
    const savedQuestion = exam.listeningQuestions?.find((question) => question.id === 'hsk1_b12_listen_05');
    if (!bundledQuestion || !savedQuestion) return exam;
    if (savedQuestion.answerContains === bundledQuestion.answerContains) return exam;
    return {
      ...exam,
      listeningQuestions: exam.listeningQuestions?.map((question) => (
        question.id === savedQuestion.id
          ? {
              ...question,
              answer: bundledQuestion.answer,
              acceptableAnswers: bundledQuestion.acceptableAnswers,
              answerContains: bundledQuestion.answerContains,
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
  // These lessons were replaced by bundled source-faithful versions; ignore old saved snapshots.
  const bundledReplacements = new Set(['hsk1-bai5-5-ky-nang', 'hsk2-bai1-word', 'hsk2-bai3-word']);
  const usableCustomExams = Array.from(new Map(
    customExams
      .filter((exam) => !bundledReplacements.has(exam.id))
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
