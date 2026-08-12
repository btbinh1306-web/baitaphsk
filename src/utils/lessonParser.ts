import { LessonData, LessonItem, LessonSection } from '../types/lesson';
import { ExamLesson, VocabItem, Question, ReadingPassage } from '../types';

export const STANDARD_CONVERTED_TYPES = new Set([
  'vocab',
  'flashcard',
  'mc',
  'multiple_choice',
  'fill',
  'fill_in_blank',
  'arrange',
  'ordering',
  'listening',
  'listening_mc',
  'listening_tf',
  'listening_multiple_choice',
  'listening_true_false',
  'listening_fill',
  'listening_fill_in_blank',
  'reading',
  'passage',
  'essay',
  'writing',
  'speaking',
  'speaking_record',
  'pronunciation',
  'translation',
  'translate',
  'translate_vi_zh',
  'handwriting_submission'
]);

export function isExamLessonExport(value: unknown): value is ExamLesson {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    Array.isArray(record.mcQuestions) &&
    Array.isArray(record.essayQuestions) &&
    Array.isArray(record.speakingQuestions)
  );
}

function questionToLessonItem(question: Question, type: string): LessonItem {
  const { id, ...data } = question;
  return {
    id,
    type,
    data: data as Record<string, unknown>
  };
}

function listeningQuestionToLessonItem(question: Question): LessonItem {
  const { id, subQuestions, ...data } = question;
  return {
    id,
    type: question.type,
    data: {
      ...data,
      questions: subQuestions?.length ? subQuestions : data.questions
    } as Record<string, unknown>
  };
}

export function convertExamLessonToLessonData(exam: ExamLesson): LessonData {
  const sections: LessonSection[] = [];
  const addSection = (id: string, title: string, items: LessonItem[]) => {
    if (items.length > 0) sections.push({ id, title, items });
  };

  addSection(
    'imported-vocab-mc',
    'Từ vựng & Trắc nghiệm',
    [
      ...(exam.vocabList || []).map((vocab, index) => ({
        id: `vocab_${index + 1}`,
        type: 'vocab',
        data: vocab as unknown as Record<string, unknown>
      })),
      ...exam.mcQuestions.map((question) => questionToLessonItem(question, 'mc'))
    ]
  );
  addSection(
    'imported-fill-arrange',
    'Điền từ & Sắp xếp câu',
    [
      ...(exam.fillQuestions || []).map((question) => questionToLessonItem(question, 'fill')),
      ...(exam.arrangeQuestions || []).map((question) => questionToLessonItem(question, 'arrange'))
    ]
  );
  addSection(
    'imported-reading',
    'Đọc hiểu',
    (exam.readingPassages || []).map((passage) => ({
      id: passage.id,
      type: 'reading',
      data: {
        title: passage.title,
        content: passage.content,
        questions: passage.questions
      }
    }))
  );
  addSection(
    'imported-listening',
    'Luyện nghe',
    (exam.listeningQuestions || []).map(listeningQuestionToLessonItem)
  );
  addSection(
    'imported-writing-speaking',
    'Viết, nói & dịch',
    [
      ...(exam.essayQuestions || []).map((question) => questionToLessonItem(question, 'essay')),
      ...(exam.speakingQuestions || []).map((question) => questionToLessonItem(question, 'speaking')),
      ...(exam.translationQuestions || []).map((question) => questionToLessonItem(question, 'translation')),
      ...(exam.handwritingQuestions || []).map((question) => questionToLessonItem(question, 'handwriting_submission'))
    ]
  );

  return {
    version: 'exam-export-1.0',
    lesson: {
      id: exam.id,
      title: exam.title,
      level: exam.level,
      description: exam.description
    },
    sections
  };
}

function parseWordBankFromPrompt(prompt?: string): { wordBank: string[]; prompt: string } | undefined {
  if (!prompt) return undefined;

  const match = prompt.match(/Từ\s+gợi\s+ý\s*[:：]\s*(.*?)(?=\s*\d+\s*[.)]|[\r\n]|$)/iu);
  if (!match) return undefined;

  const wordBank = match[1]
    .split(/[、,，]/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (wordBank.length === 0) return undefined;

  return {
    wordBank,
    prompt: prompt.replace(match[0], '').trim()
  };
}

function normalizeFillQuestions(questions: Question[]): Question[] {
  return questions.map((question) => {
    const normalizedPrompt = stripLeadingQuestionNumber(question.prompt) || question.prompt;
    const parsedPrompt = parseWordBankFromPrompt(normalizedPrompt);
    const wordBank = question.wordBank?.length
      ? question.wordBank
      : parsedPrompt?.wordBank;

    return {
      ...question,
      prompt: parsedPrompt?.prompt || normalizedPrompt,
      wordBank,
      tier: wordBank?.length && !question.wordBank ? 'tier1' : (question.tier || (wordBank?.length ? 'tier1' : 'tier2'))
    };
  });
}

export function stripLeadingQuestionNumber(prompt?: string): string | undefined {
  if (!prompt) return prompt;

  return prompt
    .trim()
    .replace(
      /^\s*(?:(?:phần\s+[ivxlcdm\d]+\s*[-–—:]\s*)?câu\s+(?:nghe\s+)?(?:số\s+)?\d+\s*[:.)\-–—]?\s*)+/iu,
      ''
    )
    .trim();
}

function normalizeQuestionPrompts(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    prompt: stripLeadingQuestionNumber(question.prompt) || question.prompt
  }));
}

function normalizeTranslationQuestions(questions: Question[]): Question[] {
  return questions.map((question) => (
    question.translationType === 'vi_to_zh_audio'
      ? { ...question, pinyin: undefined }
      : question
  ));
}

function isVietnameseToChineseAudioPrompt(prompt: string): boolean {
  return /dịch\s+sang\s+tiếng\s+trung[\s\S]*ghi\s+âm/iu.test(prompt);
}

function normalizeListeningQuestionType(type: unknown, parentType: string): Question['type'] {
  const normalizedType = typeof type === 'string' ? type.toLowerCase().trim() : parentType;
  if (normalizedType === 'listening_fill' || normalizedType === 'listening_fill_in_blank' || normalizedType === 'fill' || normalizedType === 'fill_in_blank') {
    return normalizedType === 'fill' || normalizedType === 'fill_in_blank' ? 'listening_fill' : normalizedType;
  }
  if (normalizedType === 'listening_tf' || normalizedType === 'listening_true_false' || normalizedType === 'true_false' || normalizedType === 'tf') {
    return normalizedType === 'tf' || normalizedType === 'true_false' ? 'listening_tf' : normalizedType;
  }
  return normalizedType === 'listening_multiple_choice' || normalizedType === 'listening_mc' || normalizedType === 'mc' || normalizedType === 'multiple_choice'
    ? (normalizedType === 'mc' || normalizedType === 'multiple_choice' ? 'listening_mc' : normalizedType)
    : 'listening_mc';
}

function parseListeningSubQuestions(
  rawQuestions: unknown[] | undefined,
  parentType: string,
  parentId: string
): Question[] {
  if (!rawQuestions?.length) return [];

  return rawQuestions.map((rawQuestion, index) => {
    const raw = (rawQuestion || {}) as Record<string, unknown>;
    const data = (raw.data || raw) as Record<string, unknown>;
    const type = normalizeListeningQuestionType(data.type, parentType);
    const isFillType = type === 'listening_fill' || type === 'listening_fill_in_blank';
    const isTfType = type === 'listening_tf' || type === 'listening_true_false';
    const options = Array.isArray(data.options) ? data.options.map(String) : undefined;
    const answer = data.answer;

    return {
      id: raw.id ? String(raw.id) : `${parentId}_q${index + 1}`,
      type,
      tier: 'tier2',
      prompt: stripLeadingQuestionNumber(
        typeof data.prompt === 'string'
          ? data.prompt
          : (typeof data.question === 'string' ? data.question : `Câu hỏi ${index + 1}`)
      ) || `Câu hỏi ${index + 1}`,
      pinyin: typeof data.pinyin === 'string' ? data.pinyin : undefined,
      options: isFillType
        ? undefined
        : (options || (isTfType ? ['Đúng (正确)', 'Sai (错误)'] : ['A', 'B', 'C', 'D'])),
      answer: typeof answer === 'number' || typeof answer === 'string' ? answer : 0,
      acceptableAnswers: typeof data.acceptableAnswers === 'string' ? data.acceptableAnswers : undefined,
      suggestedAnswer: typeof data.suggestedAnswer === 'string'
        ? data.suggestedAnswer
        : (typeof answer === 'string' ? answer : undefined),
      explanation: typeof data.explanation === 'string' ? data.explanation : undefined
    };
  });
}

function normalizeListeningQuestions(questions: Question[]): Question[] {
  return questions.map((question) => {
    const rawSubQuestions = Array.isArray(question.questions) ? question.questions : undefined;
    const subQuestions = question.subQuestions?.length
      ? normalizeQuestionPrompts(question.subQuestions)
      : parseListeningSubQuestions(rawSubQuestions, question.type, question.id);

    return {
      ...question,
      prompt: stripLeadingQuestionNumber(question.prompt) || question.prompt,
      subQuestions: subQuestions.length > 0 ? subQuestions : undefined,
      options: subQuestions.length > 0 ? undefined : question.options,
      answer: subQuestions.length > 0 ? undefined : question.answer
    };
  });
}

function getVocabTypeLabel(itemData: Record<string, unknown>): string {
  const typeCandidates = [
    itemData.typeLabel,
    itemData.wordType,
    itemData.partOfSpeech,
    itemData.part_of_speech,
    itemData.vocabType,
    itemData.pos,
    itemData.loaiTu,
    itemData['loại từ'],
    itemData.type
  ];

  const typeLabel = typeCandidates.find((value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    return !['vocab', 'flashcard'].includes(value.trim().toLowerCase());
  });

  return typeof typeLabel === 'string' ? typeLabel.trim() : 'Từ vựng';
}

export function sanitizeExamSections(exam: ExamLesson): ExamLesson {
  if (!exam) return exam;

  const listeningQuestions = normalizeListeningQuestions(exam.listeningQuestions || []);
  const normalizedSpeakingQuestions = normalizeQuestionPrompts(exam.speakingQuestions || []);
  const vocabList = [...(exam.vocabList || [])];
  const mcQuestions = normalizeQuestionPrompts(exam.mcQuestions || []);
  const fillQuestions = [...(exam.fillQuestions || [])];
  const arrangeQuestions = normalizeQuestionPrompts(exam.arrangeQuestions || []);
  const essayQuestions = normalizeQuestionPrompts(exam.essayQuestions || []);
  const translationQuestions = normalizeTranslationQuestions(
    normalizeQuestionPrompts(exam.translationQuestions || [])
  );
  const handwritingQuestions = normalizeQuestionPrompts(exam.handwritingQuestions || []);
  const migratedTranslationIds = new Set(translationQuestions.map((question) => question.id));
  const speakingQuestions = normalizedSpeakingQuestions.filter((question) => {
    if (!isVietnameseToChineseAudioPrompt(question.prompt)) return true;
    if (!migratedTranslationIds.has(question.id)) {
      translationQuestions.push({
        ...question,
        type: 'translation',
        translationType: 'vi_to_zh_audio',
        pinyin: undefined
      });
      migratedTranslationIds.add(question.id);
    }
    return false;
  });
  const readingPassages = (exam.readingPassages || []).map((passage) => ({
    ...passage,
    questions: normalizeQuestionPrompts(passage.questions || [])
  }));
  const normalizedFillQuestions = normalizeFillQuestions(fillQuestions);

  if (!exam.sections || exam.sections.length === 0) {
    return {
      ...exam,
      listeningQuestions,
      speakingQuestions,
      vocabList,
      mcQuestions,
      fillQuestions: normalizedFillQuestions,
      arrangeQuestions,
      essayQuestions,
      translationQuestions,
      handwritingQuestions,
      readingPassages
    };
  }

  const remainingSections = exam.sections.map((sec) => {
    const remainingItems = sec.items.filter((item) => {
      const type = (item.type || '').toLowerCase().trim();
      const itemData = (item.data || {}) as Record<string, unknown>;
      const qId = item.id ? String(item.id) : `q_${Math.random().toString(36).substr(2, 6)}`;

      // Migrate listening question if missing
      if (
        type === 'listening_mc' ||
        type === 'listening_tf' ||
        type === 'listening' ||
        type === 'listening_multiple_choice' ||
        type === 'listening_true_false' ||
        type === 'listening_fill' ||
        type === 'listening_fill_in_blank'
      ) {
        const itemPrompt = stripLeadingQuestionNumber(
          typeof itemData.prompt === 'string' ? itemData.prompt : 'Nghe và chọn đáp án:'
        ) || 'Nghe và chọn đáp án:';
        const subQuestions = parseListeningSubQuestions(
          Array.isArray(itemData.questions) ? itemData.questions : undefined,
          type,
          qId
        );
        if (!listeningQuestions.some((q) => q.id === qId || q.prompt === itemPrompt)) {
          listeningQuestions.push({
            id: qId,
            type: (type === 'listening' ? 'listening_multiple_choice' : type) as Question['type'],
            tier: 'tier2',
            prompt: itemPrompt,
            pinyin: typeof itemData.pinyin === 'string' ? itemData.pinyin : undefined,
            audioUrl: typeof itemData.audioUrl === 'string' ? itemData.audioUrl : (typeof itemData.audioPromptUrl === 'string' ? itemData.audioPromptUrl : undefined),
            audioPromptUrl: typeof itemData.audioPromptUrl === 'string' ? itemData.audioPromptUrl : undefined,
            options: subQuestions.length > 0
              ? undefined
              : (Array.isArray(itemData.options) ? itemData.options.map(String) : (type === 'listening_tf' || type === 'listening_true_false' ? ['Đúng (正确)', 'Sai (错误)'] : ['A', 'B', 'C', 'D'])),
            answer: subQuestions.length > 0 ? undefined : (typeof itemData.answer === 'number' ? itemData.answer : 0),
            explanation: typeof itemData.explanation === 'string' ? itemData.explanation : undefined,
            questions: Array.isArray(itemData.questions) ? (itemData.questions as Record<string, unknown>[]) : undefined,
            subQuestions: subQuestions.length > 0 ? subQuestions : undefined
          });
        }
        return false;
      }

      // Migrate speaking question if missing
      if (type === 'speaking' || type === 'speaking_record' || type === 'pronunciation') {
        const itemPrompt = stripLeadingQuestionNumber(
          typeof itemData.prompt === 'string' ? itemData.prompt : 'Đọc ghi âm phát âm câu:'
        ) || 'Đọc ghi âm phát âm câu:';
        if (isVietnameseToChineseAudioPrompt(itemPrompt)) {
          if (!translationQuestions.some((question) => question.id === qId || question.prompt === itemPrompt)) {
            translationQuestions.push({
              id: qId,
              type: 'translation',
              translationType: 'vi_to_zh_audio',
              tier: 'tier3',
              prompt: itemPrompt,
              suggestedAnswer: typeof itemData.suggestedAnswer === 'string' ? itemData.suggestedAnswer : undefined,
              explanation: typeof itemData.explanation === 'string' ? itemData.explanation : undefined
            });
          }
          return false;
        }
        if (!speakingQuestions.some((q) => q.id === qId || q.prompt === itemPrompt)) {
          speakingQuestions.push({
            id: qId,
            type: type === 'speaking_record' ? 'speaking_record' : 'speaking',
            tier: 'tier3',
            prompt: itemPrompt,
            pinyin: typeof itemData.pinyin === 'string' ? itemData.pinyin : undefined,
            imageUrl: typeof itemData.imageUrl === 'string' ? itemData.imageUrl : (typeof itemData.image === 'string' ? itemData.image : undefined),
            explanation: typeof itemData.explanation === 'string' ? itemData.explanation : undefined,
            items: Array.isArray(itemData.items) ? (itemData.items as string[]) : undefined
          });
        }
        return false;
      }

      // Migrate Vietnamese-to-Chinese audio translation if it is still stored in sections.
      if (type === 'translation' || type === 'translate' || type === 'translate_vi_zh') {
        const itemPrompt = stripLeadingQuestionNumber(
          typeof itemData.prompt === 'string' ? itemData.prompt : 'Dịch câu:'
        ) || 'Dịch câu:';
        const translationType =
          itemData.translationType === 'vi_to_zh_audio' ||
          itemData.translationType === 'zh_to_vi_text' ||
          itemData.translationType === 'vi_to_zh_text'
            ? itemData.translationType
            : 'vi_to_zh_text';
        if (!translationQuestions.some((question) => question.id === qId || question.prompt === itemPrompt)) {
          translationQuestions.push({
            id: qId,
            type: 'translation',
            translationType,
            tier: 'tier3',
            prompt: itemPrompt,
            pinyin: translationType === 'vi_to_zh_audio'
              ? undefined
              : (typeof itemData.pinyin === 'string' ? itemData.pinyin : undefined),
            suggestedAnswer: typeof itemData.suggestedAnswer === 'string' ? itemData.suggestedAnswer : undefined,
            explanation: typeof itemData.explanation === 'string' ? itemData.explanation : undefined
          });
        }
        return false;
      }

      // Filter out standard types that belong in specific question arrays
      if (STANDARD_CONVERTED_TYPES.has(type)) {
        return false;
      }

      return true;
    });

    return { ...sec, items: remainingItems };
  }).filter((sec) => sec.items.length > 0);

  return {
    ...exam,
    listeningQuestions,
    speakingQuestions,
    vocabList,
    mcQuestions,
    fillQuestions: normalizedFillQuestions,
    arrangeQuestions,
    essayQuestions,
    translationQuestions,
    handwritingQuestions,
    readingPassages,
    sections: remainingSections.length > 0 ? remainingSections : undefined
  };
}

export function parseLessonToExam(lessonData: LessonData): ExamLesson {
  const timestamp = Date.now();
  const lessonMeta = lessonData.lesson;
  const examId = lessonMeta.id ? String(lessonMeta.id) : `imported_${timestamp}`;
  const title = lessonMeta.title || 'Bài học đã nhập';
  const level = (lessonMeta.level as ExamLesson['level']) || 'HSK 3';
  const description =
    lessonMeta.description || `Bài học nhập từ file JSON (Phiên bản: ${lessonData.version || '1.0'}).`;

  const vocabList: VocabItem[] = [];
  const mcQuestions: Question[] = [];
  const fillQuestions: Question[] = [];
  const arrangeQuestions: Question[] = [];
  const listeningQuestions: Question[] = [];
  const readingPassages: ReadingPassage[] = [];
  const essayQuestions: Question[] = [];
  const speakingQuestions: Question[] = [];
  const translationQuestions: Question[] = [];

  lessonData.sections.forEach((section, sIdx) => {
    section.items.forEach((item: LessonItem, iIdx) => {
      const qId = item.id ? String(item.id) : `q_${sIdx}_${iIdx}_${timestamp}`;
      const type = (item.type || '').toLowerCase().trim();
      const itemData = (item.data || {}) as Record<string, unknown>;

      const itemHanzi = typeof itemData.hanzi === 'string' ? itemData.hanzi : undefined;
      const itemPinyin = typeof itemData.pinyin === 'string' ? itemData.pinyin : undefined;
      const itemPrompt = stripLeadingQuestionNumber(
        typeof itemData.prompt === 'string' ? itemData.prompt : undefined
      );
      const itemMeaning = typeof itemData.meaning === 'string' ? itemData.meaning : undefined;
      const itemExample = typeof itemData.example === 'string' ? itemData.example : undefined;
      const itemExplanation = typeof itemData.explanation === 'string' ? itemData.explanation : undefined;
      const itemTitle = typeof itemData.title === 'string' ? itemData.title : undefined;
      const itemContent = typeof itemData.content === 'string' ? itemData.content : undefined;
      const itemAudioUrl = typeof itemData.audioUrl === 'string' ? itemData.audioUrl : undefined;
      const itemAudioPromptUrl = typeof itemData.audioPromptUrl === 'string' ? itemData.audioPromptUrl : undefined;
      const itemAcceptableAnswers = typeof itemData.acceptableAnswers === 'string' ? itemData.acceptableAnswers : undefined;
      const itemSuggestedAnswer = typeof itemData.suggestedAnswer === 'string' ? itemData.suggestedAnswer : undefined;
      const itemOptions = Array.isArray(itemData.options) ? itemData.options.map(String) : undefined;
      const itemWordChips = Array.isArray(itemData.wordChips) ? itemData.wordChips.map(String) : undefined;
      const itemAnswer = itemData.answer;

      // Vocab or Flashcard
      if (type === 'vocab' || type === 'flashcard') {
        vocabList.push({
          hanzi: itemHanzi || itemPrompt || 'Word',
          pinyin: itemPinyin || '',
          type: getVocabTypeLabel(itemData),
          meaning: itemMeaning || (itemOptions ? itemOptions.join(', ') : ''),
          example: itemExample || itemExplanation
        });
        return;
      }

      // Reading Passage
      if (type === 'reading' || type === 'passage') {
        const subQuestions: Question[] = Array.isArray(itemData.questions)
          ? (itemData.questions as Record<string, unknown>[]).map((sq, sqIdx) => {
              const sqData = (sq.data || sq) as Record<string, unknown>;
              const subType = typeof sqData.type === 'string' ? sqData.type.toLowerCase().trim() : 'mc';
              const isTextAnswer = subType === 'essay' || subType === 'writing';
              return {
                id: sq.id ? String(sq.id) : `${qId}_q${sqIdx}`,
                type: isTextAnswer ? 'essay' : 'mc',
                tier: isTextAnswer ? 'tier3' : 'tier2',
                prompt: stripLeadingQuestionNumber(
                  typeof sqData.prompt === 'string' ? sqData.prompt : 'Câu hỏi đọc hiểu'
                ) || 'Câu hỏi đọc hiểu',
                pinyin: typeof sqData.pinyin === 'string' ? sqData.pinyin : undefined,
                options: isTextAnswer
                  ? undefined
                  : (Array.isArray(sqData.options) ? sqData.options.map(String) : ['Đáp án A', 'Đáp án B']),
                answer: isTextAnswer ? undefined : (typeof sqData.answer === 'number' ? sqData.answer : 0),
                acceptableAnswers: typeof sqData.acceptableAnswers === 'string' ? sqData.acceptableAnswers : undefined,
                suggestedAnswer: typeof sqData.suggestedAnswer === 'string' ? sqData.suggestedAnswer : undefined,
                explanation: typeof sqData.explanation === 'string' ? sqData.explanation : undefined
              };
            })
          : [];

        readingPassages.push({
          id: qId,
          title: itemTitle || itemPrompt || `Bài đọc #${readingPassages.length + 1}`,
          content: itemContent || itemPinyin || '',
          questions: subQuestions
        });
        return;
      }

      // Listening Questions
      if (
        type === 'listening_mc' ||
        type === 'listening_tf' ||
        type === 'listening' ||
        type === 'listening_multiple_choice' ||
        type === 'listening_true_false' ||
        type === 'listening_fill' ||
        type === 'listening_fill_in_blank'
      ) {
        const subQuestions = parseListeningSubQuestions(
          Array.isArray(itemData.questions) ? itemData.questions : undefined,
          type,
          qId
        );
        listeningQuestions.push({
          id: qId,
          type: (type === 'listening' ? 'listening_multiple_choice' : type) as Question['type'],
          tier: 'tier2',
          prompt: itemPrompt || 'Nghe và trả lời câu hỏi:',
          pinyin: itemPinyin,
          audioUrl: itemAudioUrl || itemAudioPromptUrl,
          audioPromptUrl: itemAudioPromptUrl || itemAudioUrl,
          options: subQuestions.length > 0
            ? undefined
            : ((type === 'listening_fill' || type === 'listening_fill_in_blank') ? undefined : (itemOptions || (type === 'listening_tf' || type === 'listening_true_false' ? ['Đúng (正确)', 'Sai (错误)'] : ['A', 'B', 'C', 'D']))),
          answer: subQuestions.length > 0
            ? undefined
            : (typeof itemAnswer === 'number' ? itemAnswer : (typeof itemAnswer === 'string' ? itemAnswer : 0)),
          acceptableAnswers: typeof itemData.acceptableAnswers === 'string' ? itemData.acceptableAnswers : (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          suggestedAnswer: typeof itemData.suggestedAnswer === 'string' ? itemData.suggestedAnswer : (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation,
          questions: Array.isArray(itemData.questions) ? (itemData.questions as Record<string, unknown>[]) : undefined,
          subQuestions: subQuestions.length > 0 ? subQuestions : undefined
        });
        return;
      }

      // Fill in blank
      if (type === 'fill' || type === 'fill_in_blank') {
        const itemWordBank = Array.isArray(itemData.wordBank)
          ? itemData.wordBank.map(String).filter(Boolean)
          : undefined;
        const itemTier = itemData.tier === 'tier1' || itemData.tier === 'tier2' || itemData.tier === 'tier3'
          ? itemData.tier
          : (itemWordBank?.length ? 'tier1' : 'tier2');

        fillQuestions.push({
          id: qId,
          type: 'fill',
          tier: itemTier,
          prompt: itemPrompt || 'Điền từ vào chỗ trống:',
          pinyin: itemPinyin,
          wordBank: itemWordBank,
          acceptableAnswers:
            itemAcceptableAnswers || (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation
        });
        return;
      }

      // Arrange or Ordering or Matching
      if (type === 'arrange' || type === 'ordering' || type === 'matching') {
        arrangeQuestions.push({
          id: qId,
          type: 'arrange',
          tier: 'tier2',
          prompt: itemPrompt || 'Sắp xếp thứ tự các từ:',
          pinyin: itemPinyin,
          wordChips: itemWordChips || itemOptions || [],
          acceptableAnswers:
            itemAcceptableAnswers || (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation
        });
        return;
      }

      // Essay or Writing
      if (type === 'essay' || type === 'writing') {
        const itemImg = typeof itemData.imageUrl === 'string' ? itemData.imageUrl : (typeof itemData.image === 'string' ? itemData.image : undefined);
        essayQuestions.push({
          id: qId,
          type: 'essay',
          tier: 'tier3',
          prompt: itemPrompt || 'Viết đoạn văn / dịch câu:',
          imageUrl: itemImg,
          suggestedAnswer: itemSuggestedAnswer || (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation
        });
        return;
      }

      // Speaking
      if (type === 'speaking' || type === 'speaking_record' || type === 'pronunciation') {
        const itemImg = typeof itemData.imageUrl === 'string' ? itemData.imageUrl : (typeof itemData.image === 'string' ? itemData.image : undefined);
        speakingQuestions.push({
          id: qId,
          type: type === 'speaking_record' ? 'speaking_record' : 'speaking',
          tier: 'tier3',
          prompt: itemPrompt || 'Đọc ghi âm phát âm câu:',
          pinyin: itemPinyin,
          imageUrl: itemImg,
          explanation: itemExplanation,
          items: Array.isArray(itemData.items) ? (itemData.items as string[]) : undefined
        });
        return;
      }

      // Translation
      if (type === 'translation' || type === 'translate' || type === 'translate_vi_zh') {
        const translationType =
          itemData.translationType === 'vi_to_zh_audio' ||
          itemData.translationType === 'zh_to_vi_text' ||
          itemData.translationType === 'vi_to_zh_text'
            ? itemData.translationType
            : 'vi_to_zh_text';
        translationQuestions.push({
          id: qId,
          type: 'translation',
          translationType,
          tier: 'tier3',
          prompt: itemPrompt || 'Dịch câu:',
          pinyin: translationType === 'vi_to_zh_audio' ? undefined : itemPinyin,
          suggestedAnswer: itemSuggestedAnswer || (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation
        });
        return;
      }

      // Standard Multiple Choice or Fallback for MC / Unsupported types
      mcQuestions.push({
        id: qId,
        type: type === 'mc' || type === 'multiple_choice' ? 'mc' : (type as unknown as 'mc'),
        tier: 'tier1',
        prompt: itemPrompt || `[Exercise type: ${item.type}]`,
        pinyin: itemPinyin,
        options: itemOptions || ['Lựa chọn A', 'Lựa chọn B'],
        answer: typeof itemAnswer === 'number' ? itemAnswer : 0,
        explanation: itemExplanation
      });
    });
  });

  const parsedExam: ExamLesson = {
    id: examId,
    title,
    level,
    description,
    vocabList,
    mcQuestions,
    fillQuestions,
    arrangeQuestions,
    listeningQuestions,
    readingPassages,
    essayQuestions,
    speakingQuestions,
    translationQuestions,
    sections: lessonData.sections
  };

  return sanitizeExamSections(parsedExam);
}
