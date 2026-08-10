import { LessonData, LessonItem } from '../types/lesson';
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

export function sanitizeExamSections(exam: ExamLesson): ExamLesson {
  if (!exam) return exam;

  const listeningQuestions = [...(exam.listeningQuestions || [])];
  const speakingQuestions = [...(exam.speakingQuestions || [])];
  const vocabList = [...(exam.vocabList || [])];
  const mcQuestions = [...(exam.mcQuestions || [])];
  const fillQuestions = [...(exam.fillQuestions || [])];
  const arrangeQuestions = [...(exam.arrangeQuestions || [])];
  const essayQuestions = [...(exam.essayQuestions || [])];
  const translationQuestions = [...(exam.translationQuestions || [])];
  const handwritingQuestions = [...(exam.handwritingQuestions || [])];

  if (!exam.sections || exam.sections.length === 0) {
    return {
      ...exam,
      listeningQuestions,
      speakingQuestions,
      vocabList,
      mcQuestions,
      fillQuestions,
      arrangeQuestions,
      essayQuestions,
      translationQuestions,
      handwritingQuestions
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
        const itemPrompt = typeof itemData.prompt === 'string' ? itemData.prompt : 'Nghe và chọn đáp án:';
        if (!listeningQuestions.some((q) => q.id === qId || q.prompt === itemPrompt)) {
          listeningQuestions.push({
            id: qId,
            type: (type === 'listening' ? 'listening_multiple_choice' : type) as Question['type'],
            tier: 'tier2',
            prompt: itemPrompt,
            pinyin: typeof itemData.pinyin === 'string' ? itemData.pinyin : undefined,
            audioUrl: typeof itemData.audioUrl === 'string' ? itemData.audioUrl : (typeof itemData.audioPromptUrl === 'string' ? itemData.audioPromptUrl : undefined),
            audioPromptUrl: typeof itemData.audioPromptUrl === 'string' ? itemData.audioPromptUrl : undefined,
            options: Array.isArray(itemData.options) ? itemData.options.map(String) : (type === 'listening_tf' || type === 'listening_true_false' ? ['Đúng (正确)', 'Sai (错误)'] : ['A', 'B', 'C', 'D']),
            answer: typeof itemData.answer === 'number' ? itemData.answer : 0,
            explanation: typeof itemData.explanation === 'string' ? itemData.explanation : undefined,
            questions: Array.isArray(itemData.questions) ? (itemData.questions as Record<string, unknown>[]) : undefined
          });
        }
        return false;
      }

      // Migrate speaking question if missing
      if (type === 'speaking' || type === 'speaking_record' || type === 'pronunciation') {
        const itemPrompt = typeof itemData.prompt === 'string' ? itemData.prompt : 'Đọc ghi âm phát âm câu:';
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
    fillQuestions,
    arrangeQuestions,
    essayQuestions,
    translationQuestions,
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
      const itemPrompt = typeof itemData.prompt === 'string' ? itemData.prompt : undefined;
      const itemMeaning = typeof itemData.meaning === 'string' ? itemData.meaning : undefined;
      const itemExample = typeof itemData.example === 'string' ? itemData.example : undefined;
      const itemExplanation = typeof itemData.explanation === 'string' ? itemData.explanation : undefined;
      const itemTypeLabel = typeof itemData.typeLabel === 'string' ? itemData.typeLabel : undefined;
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
          type: itemTypeLabel || item.type || 'Từ vựng',
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
              return {
                id: sq.id ? String(sq.id) : `${qId}_q${sqIdx}`,
                type: 'mc',
                tier: 'tier2',
                prompt: typeof sqData.prompt === 'string' ? sqData.prompt : 'Câu hỏi đọc hiểu',
                pinyin: typeof sqData.pinyin === 'string' ? sqData.pinyin : undefined,
                options: Array.isArray(sqData.options) ? sqData.options.map(String) : ['Đáp án A', 'Đáp án B'],
                answer: typeof sqData.answer === 'number' ? sqData.answer : 0,
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
        listeningQuestions.push({
          id: qId,
          type: (type === 'listening' ? 'listening_multiple_choice' : type) as Question['type'],
          tier: 'tier2',
          prompt: itemPrompt || 'Nghe và trả lời câu hỏi:',
          pinyin: itemPinyin,
          audioUrl: itemAudioUrl || itemAudioPromptUrl,
          audioPromptUrl: itemAudioPromptUrl || itemAudioUrl,
          options: (type === 'listening_fill' || type === 'listening_fill_in_blank') ? undefined : (itemOptions || (type === 'listening_tf' || type === 'listening_true_false' ? ['Đúng (正确)', 'Sai (错误)'] : ['A', 'B', 'C', 'D'])),
          answer: typeof itemAnswer === 'number' ? itemAnswer : (typeof itemAnswer === 'string' ? itemAnswer : 0),
          acceptableAnswers: typeof itemData.acceptableAnswers === 'string' ? itemData.acceptableAnswers : (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          suggestedAnswer: typeof itemData.suggestedAnswer === 'string' ? itemData.suggestedAnswer : (typeof itemAnswer === 'string' ? itemAnswer : undefined),
          explanation: itemExplanation,
          questions: Array.isArray(itemData.questions) ? (itemData.questions as Record<string, unknown>[]) : undefined
        });
        return;
      }

      // Fill in blank
      if (type === 'fill' || type === 'fill_in_blank') {
        fillQuestions.push({
          id: qId,
          type: 'fill',
          tier: 'tier2',
          prompt: itemPrompt || 'Điền từ vào chỗ trống:',
          pinyin: itemPinyin,
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
        translationQuestions.push({
          id: qId,
          type: 'translation',
          translationType:
            itemData.translationType === 'zh_to_vi_text' || itemData.translationType === 'vi_to_zh_text'
              ? itemData.translationType
              : 'vi_to_zh_text',
          tier: 'tier3',
          prompt: itemPrompt || 'Dịch câu:',
          pinyin: itemPinyin,
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
