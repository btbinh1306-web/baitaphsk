import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { AudioRecorder } from './AudioRecorder';
import { AnswerSnapshotItem, AudioRecordItem, ExamLesson, Question } from '../types';
import { submitToGas } from '../services/gasService';
import { speakText } from '../utils/tts';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { sanitizeExamSections } from '../utils/lessonParser';
import { groupExamsForSelection } from '../utils/examGrouping';
import { ExerciseRenderer } from './ExerciseRenderer';
import { StructuredBlockAudio } from './exercises/HskStructuredExercise';
import { gradeStructuredSections, StructuredAnswerMap } from '../utils/structuredExercises';
import { HandwritingExerciseView, HandwritingExerciseViewHandle } from './exercises/HandwritingExerciseView';
import { loadFormDraft, saveListeningProgress, useStudentFormDraft } from '../hooks/useStudentFormDraft';
import { useStudentExamCatalog } from '../hooks/useStudentExamCatalog';
import {
  Send,
  CheckCircle2,
  Copy,
  ArrowRight,
  User,
  BookOpen,
  AlertCircle,
  Volume2,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  HelpCircle,
  Headphones,
  Layers,
  Pencil,
  Image as ImageIcon,
  Plus,
  Clock
} from 'lucide-react';

interface StudentExamFormProps {
  customExams?: ExamLesson[];
  deletedExamIds?: string[];
  onSuccessNavigateToResult: (submissionId: string) => void;
}

const getTranslationPromptText = (prompt: string): string =>
  prompt
    .trim()
    .replace(/^Dịch(?:\s+sang\s+tiếng\s+Trung)?(?:\s*(?:&|và)\s*Ghi âm(?:\s+phát âm)?)?\s*:\s*/iu, '')
    .replace(/^\s*[“"](.*)[”"]\s*$/u, '$1')
    .trim();

const createSubmissionId = (): string =>
  `submission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const answerTextForQuestion = (question: Question, answer: unknown): string => {
  if (answer === undefined || answer === null || answer === '') return '';
  if (typeof answer === 'number' && question.options) {
    return question.options[answer] || `Đáp án ${String.fromCharCode(65 + answer)}`;
  }
  return String(answer);
};

export const StudentExamForm: React.FC<StudentExamFormProps> = ({
  customExams = [],
  deletedExamIds = [],
  onSuccessNavigateToResult
}) => {
  const { allExams } = useStudentExamCatalog(customExams, deletedExamIds);

  const filteredExams = allExams;
  const examGroups = useMemo(() => groupExamsForSelection(filteredExams), [filteredExams]);

  // Load draft from localStorage on initial mount
  const initialDraft = useMemo(() => loadFormDraft(), []);

  const [studentName, setStudentName] = useState(() => initialDraft?.studentName || '');
  const [studentClass, setStudentClass] = useState(() => initialDraft?.studentClass || '');
  const [selectedExamGroupLabel, setSelectedExamGroupLabel] = useState(() => {
    if (initialDraft?.selectedExamGroupLabel) return initialDraft.selectedExamGroupLabel;
    return examGroups.find((group) => group.exams.some((exam) => exam.id === initialDraft?.selectedExamId))?.label || '';
  });
  const [selectedExamId, setSelectedExamId] = useState(() => initialDraft?.selectedExamId || '');
  const examsInSelectedGroup =
    examGroups.find((group) => group.label === selectedExamGroupLabel)?.exams || [];

  // Vocabulary lock state - per exam
  const [vocabUnlocked, setVocabUnlocked] = useState<Record<string, boolean>>(
    () => initialDraft?.vocabUnlocked || {}
  );
  const [showVocabTable, setShowVocabTable] = useState(true);

  // Exam answers state
  const [mcAnswers, setMcAnswers] = useState<Record<string, number>>(
    () => initialDraft?.mcAnswers || {}
  );
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>(
    () => initialDraft?.fillAnswers || {}
  );
  const [arrangeAnswers, setArrangeAnswers] = useState<Record<string, string[]>>(
    () => initialDraft?.arrangeAnswers || {}
  );
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>(
    () => initialDraft?.essayAnswers || {}
  );
  const [questionComments, setQuestionComments] = useState<Record<string, string>>(
    () => initialDraft?.questionComments || {}
  );
  const [unlockedReference, setUnlockedReference] = useState<Record<string, boolean>>(
    () => initialDraft?.unlockedReference || {}
  );
  const [audioRecords, setAudioRecords] = useState<Record<string, AudioRecordItem>>({});
  const [showSpeakingPinyin, setShowSpeakingPinyin] = useState(false);
  const [additionalAudioSlots, setAdditionalAudioSlots] = useState<
    Array<{ id: string; record?: AudioRecordItem }>
  >([]);
  const [structuredAnswers, setStructuredAnswers] = useState<StructuredAnswerMap>(
    () => initialDraft?.structuredAnswers || {}
  );
  const [submissionId, setSubmissionId] = useState(() => initialDraft?.submissionId || createSubmissionId());
  const [listeningPlayCounts, setListeningPlayCounts] = useState<Record<string, number>>(
    () => initialDraft?.listeningPlayCounts || {}
  );
  const listeningPlayCountsRef = useRef<Record<string, number>>(initialDraft?.listeningPlayCounts || {});
  const [timeLimitStartedAt, setTimeLimitStartedAt] = useState<number | null>(
    () => initialDraft?.timeLimitStartedAt || null
  );

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const handwritingViewRef = useRef<HandwritingExerciseViewHandle>(null);
  const timedSubmitRef = useRef<() => void>(() => undefined);
  const timedSubmitTriggeredRef = useRef(false);

  // Persist form draft automatically in localStorage
  const { clearDraft } = useStudentFormDraft(
    {
      studentName,
      studentClass,
      selectedExamGroupLabel,
      selectedExamId,
      submissionId,
      timeLimitStartedAt: timeLimitStartedAt || undefined,
      vocabUnlocked,
      mcAnswers,
      fillAnswers,
      arrangeAnswers,
      essayAnswers,
      questionComments,
      unlockedReference,
      structuredAnswers,
      listeningPlayCounts,
    },
    !!submittedId
  );

  const rawCurrentExam: ExamLesson =
    allExams.find((e) => e.id === selectedExamId) || allExams[0] || SAMPLE_EXAMS[0];

  const currentExam: ExamLesson = useMemo(() => {
    const exam = sanitizeExamSections(rawCurrentExam);
    if (exam.id === 'hsk1-mock-02' || /đề tổng hợp 1-15/i.test(exam.title)) {
      return { ...exam, timeLimitEnabled: false, timeLimitMinutes: 0 };
    }
    return exam;
  }, [rawCurrentExam]);

  const speakingTaskGroups = useMemo(() => {
    const groups = new Map<string, { title: string; questions: Question[] }>();
    currentExam.speakingQuestions.forEach((question) => {
      const key = question.taskGroup || 'speaking';
      const existing = groups.get(key);
      if (existing) existing.questions.push(question);
      else groups.set(key, { title: question.taskGroupTitle || 'Kỹ năng nói', questions: [question] });
    });
    return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
  }, [currentExam.speakingQuestions]);

  const listeningQuestionItems = useMemo(
    () => currentExam.listeningQuestions.flatMap((question) => question.subQuestions?.length ? question.subQuestions : [question]),
    [currentExam.listeningQuestions]
  );

  const structuredAudioScope = useMemo(() => {
    const studentId = `${studentName.trim().toLocaleLowerCase()}::${studentClass.trim().toLocaleLowerCase()}`;
    return `${studentId || 'anonymous'}::${submissionId}::${currentExam.id}`;
  }, [studentName, studentClass, submissionId, currentExam.id]);

  const handleStructuredAudioAttempt = (key: string): { allowed: boolean; count: number } => {
    const current = listeningPlayCountsRef.current[key] || 0;
    const max = 2;
    if (current >= max) return { allowed: false, count: current };

    const next = { ...listeningPlayCountsRef.current, [key]: current + 1 };
    listeningPlayCountsRef.current = next;
    setListeningPlayCounts(next);
    saveListeningProgress({
      studentName,
      studentClass,
      selectedExamGroupLabel,
      selectedExamId,
      submissionId,
      listeningPlayCounts: next
    });
    return { allowed: true, count: current + 1 };
  };

  const shuffledArrangeChips = useMemo(() => {
    const pools = new Map<string, string[]>();

    (currentExam.arrangeQuestions || []).forEach((question) => {
      const chips = [...(question.wordChips || [])];
      for (let index = chips.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [chips[index], chips[randomIndex]] = [chips[randomIndex], chips[index]];
      }

      // Avoid showing the original order by chance when a question has several chips.
      if (chips.length > 1 && chips.every((chip, index) => chip === question.wordChips?.[index])) {
        [chips[0], chips[chips.length - 1]] = [chips[chips.length - 1], chips[0]];
      }

      pools.set(question.id, chips);
    });

    return pools;
  }, [currentExam.arrangeQuestions]);

  const shuffledChoiceOptions = useMemo(() => {
    const pools = new Map<string, Array<{ text: string; originalIndex: number }>>();
    const addQuestion = (question: Question) => {
      if (!question.options || question.options.length < 2) return;

      const options = question.options.map((text, originalIndex) => ({ text, originalIndex }));
      for (let index = options.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
      }

      if (options.every((option, index) => option.originalIndex === index)) {
        [options[0], options[options.length - 1]] = [options[options.length - 1], options[0]];
      }

      pools.set(question.id, options);
    };

    currentExam.mcQuestions.forEach(addQuestion);
    currentExam.listeningQuestions.forEach((question) => {
      addQuestion(question);
      question.subQuestions?.forEach(addQuestion);
    });
    currentExam.readingPassages?.forEach((passage) => passage.questions.forEach(addQuestion));

    return pools;
  }, [currentExam.mcQuestions, currentExam.listeningQuestions, currentExam.readingPassages]);

  const groupedFillQuestions = useMemo(() => {
    if (!currentExam.fillQuestions) return [];
    const groups: { tier: string; wordBank?: string[]; questions: typeof currentExam.fillQuestions }[] = [];
    const shuffleWordBank = (words: string[]) => {
      const shuffled = [...words];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
      }

      // Avoid showing the source order by chance when there are several words.
      if (shuffled.length > 1 && shuffled.every((word, index) => word === words[index])) {
        [shuffled[0], shuffled[shuffled.length - 1]] = [
          shuffled[shuffled.length - 1],
          shuffled[0],
        ];
      }

      return shuffled;
    };

    currentExam.fillQuestions.forEach((q) => {
      const tierKey = q.tier || 'tier1';
      let g = groups.find((item) => item.tier === tierKey);
      if (!g) {
        g = { tier: tierKey, wordBank: [], questions: [] };
        groups.push(g);
      }
      if (q.wordBank?.length) {
        const existingWords = g.wordBank || [];
        g.wordBank = q.wordBank.reduce<string[]>((words, word) => {
          const normalizedWord = word.trim();
          if (normalizedWord && !words.includes(normalizedWord)) {
            words.push(normalizedWord);
          }
          return words;
        }, [...existingWords]);
      }
      g.questions.push(q);
    });
    return groups.map((group) => {
      const showAnswerOnlyWordBank = /^hsk1-bai(?:6|7|8|9|10|11|12|13|14|15)(?:-|$)/i.test(currentExam.id);
      const answerWords = group.questions
        .map((question) => {
          const answer = typeof question.answer === 'string'
            ? question.answer
            : question.acceptableAnswers?.split('|')[0];
          return answer?.trim();
        })
        .filter((word): word is string => Boolean(word));

      return {
        ...group,
        wordBank: shuffleWordBank(showAnswerOnlyWordBank ? answerWords : (group.wordBank || [])),
      };
    });
  }, [currentExam.id, currentExam.fillQuestions]);

  const isAggregateExam = /tổng hợp|tong-hop/i.test(`${currentExam.id} ${currentExam.title}`);
  const hasVocabList = !isAggregateExam && !!(currentExam.vocabList && currentExam.vocabList.length > 0);
  // Strictly enforce: if exam has vocab list, questions MUST stay locked until user clicks "Đã học xong"
  const isVocabDone = !hasVocabList || !!vocabUnlocked[currentExam.id];
  const timeLimitMinutes = currentExam.timeLimitEnabled && Number.isFinite(currentExam.timeLimitMinutes)
    ? Math.max(1, Math.round(currentExam.timeLimitMinutes || 0))
    : 0;
  const isTimedExam = timeLimitMinutes > 0;
  const hasRequiredStudentInfo = Boolean(studentName.trim() && studentClass.trim());
  const isExamContentVisible = Boolean(
    selectedExamId && (!isTimedExam || (hasRequiredStudentInfo && timeLimitStartedAt))
  );
  const canStartTimedExam = Boolean(
    selectedExamId && hasRequiredStudentInfo && isVocabDone
  );

  const resetExamProgress = () => {
    setVocabUnlocked({});
    setShowVocabTable(true);
    setMcAnswers({});
    setFillAnswers({});
    setArrangeAnswers({});
    setEssayAnswers({});
    setQuestionComments({});
    setUnlockedReference({});
    setAudioRecords({});
    setAdditionalAudioSlots([]);
    setStructuredAnswers({});
    listeningPlayCountsRef.current = {};
    setListeningPlayCounts({});
    setSubmissionId(createSubmissionId());
    setTimeLimitStartedAt(null);
    setSubmittedId(null);
    setSubError(null);
    setRemainingSeconds(null);
    setAutoSubmitted(false);
    timedSubmitRef.current = () => undefined;
    timedSubmitTriggeredRef.current = false;
  };

  const handleSelectExam = (examId: string) => {
    resetExamProgress();
    setSelectedExamId(examId);
  };

  const handleSelectExamGroup = (groupLabel: string) => {
    resetExamProgress();
    setSelectedExamGroupLabel(groupLabel);
    setSelectedExamId('');
  };

  const handleUnlockExam = () => {
    setVocabUnlocked((prev) => ({ ...prev, [currentExam.id]: true }));
    setShowVocabTable(false);
  };

  const handleStartTimedExam = () => {
    if (!canStartTimedExam || timeLimitStartedAt) return;

    const startedAt = Date.now();
    setTimeLimitStartedAt(startedAt);
    saveListeningProgress({
      studentName,
      studentClass,
      selectedExamGroupLabel,
      selectedExamId,
      submissionId,
      timeLimitStartedAt: startedAt
    });
  };

  const handleMcSelect = (qId: string, optionIdx: number) => {
    setMcAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleFillChange = (qId: string, value: string) => {
    setFillAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleChipClick = (qId: string, chip: string, isAvailable: boolean, chipIdxInOrdered?: number) => {
    setArrangeAnswers((prev) => {
      const currentOrdered = prev[qId] || [];
      if (isAvailable) {
        return { ...prev, [qId]: [...currentOrdered, chip] };
      } else if (chipIdxInOrdered !== undefined) {
        const updated = [...currentOrdered];
        updated.splice(chipIdxInOrdered, 1);
        return { ...prev, [qId]: updated };
      }
      return prev;
    });
  };

  const handleResetArrange = (qId: string) => {
    setArrangeAnswers((prev) => ({ ...prev, [qId]: [] }));
  };

  const handleEssayChange = (qId: string, value: string) => {
    setEssayAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleToggleReference = (qId: string) => {
    const textEntered = essayAnswers[qId] && essayAnswers[qId].trim().length > 0;
    if (!textEntered && !unlockedReference[qId]) {
      alert('Em hãy viết câu trả lời trước khi xem đáp án tham khảo nhé.');
      return;
    }
    setUnlockedReference((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleAudioRecorded = (qId: string, record: AudioRecordItem | null) => {
    setAudioRecords((prev) => {
      const next = { ...prev };
      if (record) {
        next[qId] = record;
      } else {
        delete next[qId];
      }
      return next;
    });
  };

  const handleAdditionalAudioRecorded = (slotId: string, record: AudioRecordItem | null) => {
    setAdditionalAudioSlots((prev) => {
      if (!record) return prev.filter((slot) => slot.id !== slotId);
      return prev.map((slot) => (slot.id === slotId ? { ...slot, record } : slot));
    });
  };

  const addAdditionalAudioSlot = () => {
    setAdditionalAudioSlots((prev) => [
      ...prev,
      { id: `additional-audio-${Date.now()}-${prev.length}` }
    ]);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubError(null);

    if (!selectedExamId) {
      setSubError('Vui lòng chọn cấp bậc và bài học / đề thi trước khi bắt đầu.');
      return;
    }

    if (!studentName.trim()) {
      setSubError('Vui lòng nhập Họ và Tên của học sinh.');
      return;
    }
    if (!studentClass.trim()) {
      setSubError('Vui lòng nhập Tên Lớp học.');
      return;
    }

    if (currentExam.isHandwriting || currentExam.type === 'handwriting_submission') {
      if (!handwritingViewRef.current) {
        setSubError('Không thể mở phần nộp ảnh bài viết. Vui lòng tải lại trang và thử lại.');
        return;
      }

      setIsSubmitting(true);
      try {
        await handwritingViewRef.current.submit();
      } catch (err) {
        console.error('Handwriting submit error:', err);
        setSubError('Có lỗi xảy ra khi gửi ảnh bài viết. Vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let correctCount = 0;
      let wrongCount = 0;
      let notDoneCount = 0;
      const wrongDetails: string[] = [];
      const answerSnapshot: AnswerSnapshotItem[] = [];
      const addAnswerSnapshot = (item: AnswerSnapshotItem) => answerSnapshot.push(item);

      // 1. Grade MC Questions
      currentExam.mcQuestions.forEach((q, idx) => {
        const userAns = mcAnswers[q.id];
        const isUnanswered = userAns === undefined;
        const isCorrect = !isUnanswered && userAns === q.answer;
        addAnswerSnapshot({
          id: q.id,
          section: 'Trắc nghiệm',
          number: idx + 1,
          prompt: q.prompt,
          userAnswer: answerTextForQuestion(q, userAns),
          correctAnswer: answerTextForQuestion(q, q.answer),
          status: isUnanswered ? 'unanswered' : (isCorrect ? 'correct' : 'wrong')
        });
        if (userAns === undefined) {
          notDoneCount++;
        } else if (userAns === q.answer) {
          correctCount++;
        } else {
          wrongCount++;
          const userOptionText = q.options ? q.options[userAns] : `Đáp án ${userAns}`;
          const correctOptionText = q.options ? q.options[q.answer as number] : `Đáp án ${q.answer}`;
          wrongDetails.push(`[TN Câu ${idx + 1}: "${q.prompt}"]: Bạn chọn [${userOptionText}] — Đáp án đúng [${correctOptionText}]`);
        }
      });

      // 2. Grade Reading Passage Questions
      const readingEssayParts: string[] = [];
      if (currentExam.readingPassages) {
        currentExam.readingPassages.forEach((passage, pIdx) => {
          passage.questions.forEach((q, qIdx) => {
            if (!q.options || q.options.length === 0) {
              const ans = essayAnswers[q.id] || '(Chưa làm)';
              readingEssayParts.push(`【${q.prompt}】\nBài làm: ${ans}`);
              addAnswerSnapshot({
                id: q.id,
                section: `Đọc hiểu · ${passage.title}`,
                number: qIdx + 1,
                prompt: q.prompt,
                userAnswer: ans === '(Chưa làm)' ? '' : ans,
                correctAnswer: q.suggestedAnswer || q.acceptableAnswers || '',
                status: 'manual'
              });
              return;
            }

            const userAns = mcAnswers[q.id];
            addAnswerSnapshot({
              id: q.id,
              section: `Đọc hiểu · ${passage.title}`,
              number: qIdx + 1,
              prompt: q.prompt,
              userAnswer: answerTextForQuestion(q, userAns),
              correctAnswer: answerTextForQuestion(q, q.answer),
              status: userAns === undefined ? 'unanswered' : (userAns === q.answer ? 'correct' : 'wrong')
            });
            if (userAns === undefined) {
              notDoneCount++;
            } else if (userAns === q.answer) {
              correctCount++;
            } else {
              wrongCount++;
              const userOptionText = q.options ? q.options[userAns] : `Đáp án ${userAns}`;
              const correctOptionText = q.options ? q.options[q.answer as number] : `Đáp án ${q.answer}`;
              wrongDetails.push(`[Đọc hiểu ${passage.title} - C${qIdx + 1}: "${q.prompt}"]: Bạn chọn [${userOptionText}] — Đáp án đúng [${correctOptionText}]`);
            }
          });
        });
      }

      // 3. Grade Fill Questions
      if (currentExam.fillQuestions) {
        currentExam.fillQuestions.forEach((q, idx) => {
          const userAns = (fillAnswers[q.id] || '').trim().replace(/\s+/g, '');
          const validOptions = (q.acceptableAnswers || '')
            .split('|')
            .map((s) => s.trim().replace(/\s+/g, ''))
            .filter(Boolean);
          const isCorrect = Boolean(userAns) && validOptions.includes(userAns);
          addAnswerSnapshot({
            id: q.id,
            section: 'Điền từ',
            number: idx + 1,
            prompt: q.prompt,
            userAnswer: userAns,
            correctAnswer: validOptions[0] || q.acceptableAnswers || '',
            status: !userAns ? 'unanswered' : (isCorrect ? 'correct' : 'wrong')
          });
          if (!userAns) {
            notDoneCount++;
          } else {
            const validOptions = (q.acceptableAnswers || '')
              .split('|')
              .map((s) => s.trim().replace(/\s+/g, ''));

            if (validOptions.includes(userAns)) {
              correctCount++;
            } else {
              wrongCount++;
              wrongDetails.push(`[Điền từ Câu ${idx + 1}: "${q.prompt}"]: Bạn nhập [${userAns || 'Để trống'}] — Đáp án đúng [${validOptions[0] || q.acceptableAnswers}]`);
            }
          }
        });
      }

      // 4. Grade Sentence Arrangement Questions
      if (currentExam.arrangeQuestions) {
        currentExam.arrangeQuestions.forEach((q, idx) => {
          const userOrdered = arrangeAnswers[q.id] || [];
          const userSentence = userOrdered.join('').trim().replace(/\s+/g, '');
          const validOptions = (q.acceptableAnswers || '')
            .split('|')
            .map((s) => s.trim().replace(/\s+/g, ''))
            .filter(Boolean);
          const isCorrect = Boolean(userSentence) && validOptions.includes(userSentence);
          addAnswerSnapshot({
            id: q.id,
            section: 'Sắp xếp câu',
            number: idx + 1,
            prompt: q.prompt,
            userAnswer: userSentence,
            correctAnswer: validOptions[0] || q.acceptableAnswers || '',
            status: !userSentence ? 'unanswered' : (isCorrect ? 'correct' : 'wrong')
          });
          if (userOrdered.length === 0) {
            notDoneCount++;
          } else {
            const validOptions = (q.acceptableAnswers || '')
              .split('|')
              .map((s) => s.trim().replace(/\s+/g, ''));

            if (validOptions.includes(userSentence)) {
              correctCount++;
            } else {
              wrongCount++;
              wrongDetails.push(`[Sắp xếp Câu ${idx + 1}: "${q.prompt}"]: Bạn xếp [${userSentence || 'Để trống'}] — Đáp án đúng [${validOptions[0] || q.acceptableAnswers}]`);
            }
          }
        });
      }

      // 5. Grade Listening Questions (Nghe tích trắc nghiệm / Nghe chọn đúng sai / Nghe điền tự luận)
      if (currentExam.listeningQuestions) {
        listeningQuestionItems.forEach((q, idx) => {
          if (q.type === 'listening_fill' || q.type === 'listening_fill_in_blank') {
            const userText = (fillAnswers[q.id] || '').trim();
            const acceptableList = (q.acceptableAnswers || (typeof q.answer === 'string' ? q.answer : q.suggestedAnswer) || '')
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean);
            const cleanUser = userText.toLowerCase().replace(/\s+/g, '');
            const isCorrect = Boolean(userText) && acceptableList.some((answer) => (
              answer.toLowerCase().replace(/\s+/g, '') === cleanUser
            ));
            addAnswerSnapshot({
              id: q.id,
              section: 'Bài nghe',
              number: idx + 1,
              prompt: q.prompt,
              userAnswer: userText,
              correctAnswer: acceptableList[0] || q.acceptableAnswers || q.answer?.toString() || '',
              status: !userText ? 'unanswered' : (isCorrect || acceptableList.length === 0 ? 'correct' : 'wrong')
            });
            if (!userText) {
              notDoneCount++;
            } else {
              const acceptableList = (q.acceptableAnswers || (typeof q.answer === 'string' ? q.answer : q.suggestedAnswer) || '')
                .split('|')
                .map((s) => s.trim().toLowerCase().replace(/\s+/g, ''))
                .filter(Boolean);
              const cleanUser = userText.toLowerCase().replace(/\s+/g, '');
              if (acceptableList.length > 0 && acceptableList.includes(cleanUser)) {
                correctCount++;
              } else if (acceptableList.length > 0) {
                wrongCount++;
                wrongDetails.push(
                  `[Bài nghe điền C${idx + 1}: "${q.prompt}"]: Bạn điền [${userText}] — Đáp án đúng [${
                    q.acceptableAnswers || q.answer || q.suggestedAnswer
                  }]`
                );
              } else {
                correctCount++;
              }
            }
          } else {
            const userAns = mcAnswers[q.id];
            addAnswerSnapshot({
              id: q.id,
              section: 'Bài nghe',
              number: idx + 1,
              prompt: q.prompt,
              userAnswer: answerTextForQuestion(q, userAns),
              correctAnswer: answerTextForQuestion(q, q.answer),
              status: userAns === undefined ? 'unanswered' : (userAns === q.answer ? 'correct' : 'wrong')
            });
            if (userAns === undefined) {
              notDoneCount++;
            } else if (userAns === q.answer) {
              correctCount++;
            } else {
              wrongCount++;
              const opts = q.options || [];
              const userOptionText = opts[userAns] !== undefined ? opts[userAns] : `Đáp án ${userAns}`;
              const correctOptionText = opts[q.answer as number] !== undefined ? opts[q.answer as number] : `Đáp án ${q.answer}`;
              wrongDetails.push(`[Bài nghe C${idx + 1}: "${q.prompt}"]: Bạn chọn [${userOptionText}] — Đáp án đúng [${correctOptionText}]`);
            }
          }
        });
      }

      const structuredGrade = gradeStructuredSections(currentExam.sections, structuredAnswers);
      correctCount += structuredGrade.correct;
      wrongCount += structuredGrade.wrong;
      notDoneCount += structuredGrade.notDone;
      wrongDetails.push(...structuredGrade.wrongDetails);
      answerSnapshot.push(...structuredGrade.answerDetails);

      let totalMc =
        currentExam.mcQuestions.length +
        (currentExam.fillQuestions?.length || 0) +
        (currentExam.arrangeQuestions?.length || 0) +
        listeningQuestionItems.length;
      totalMc += structuredGrade.total;

      if (currentExam.readingPassages) {
        currentExam.readingPassages.forEach(p => {
          totalMc += p.questions.filter((q) => q.options && q.options.length > 0).length;
        });
      }

      const doneMc = totalMc - notDoneCount;
      const percent = totalMc > 0 ? Math.round((correctCount / totalMc) * 100) : 100;

      // Format Essay & Text Translation Answers
      const essayParts = [
        ...readingEssayParts,
        ...currentExam.essayQuestions.map((q) => {
        const ans = essayAnswers[q.id] || '(Chưa làm)';
        answerSnapshot.push({
          id: q.id,
          section: 'Tự luận',
          prompt: q.prompt,
          userAnswer: ans === '(Chưa làm)' ? '' : ans,
          correctAnswer: q.suggestedAnswer || q.acceptableAnswers || '',
          status: 'manual'
        });
        return `【${q.prompt}】\nBài làm: ${ans}`;
        })
      ];

      if (currentExam.translationQuestions) {
        currentExam.translationQuestions.forEach((q, idx) => {
          if (q.translationType === 'vi_to_zh_text' || q.translationType === 'zh_to_vi_text') {
            const ans = essayAnswers[q.id] || '(Chưa làm)';
            answerSnapshot.push({
              id: q.id,
              section: q.translationType === 'vi_to_zh_text' ? 'Dịch viết' : 'Dịch Hán - Việt',
              prompt: q.prompt,
              userAnswer: ans === '(Chưa làm)' ? '' : ans,
              correctAnswer: q.suggestedAnswer || q.acceptableAnswers || '',
              status: 'manual'
            });
            const label =
              q.translationType === 'vi_to_zh_text'
                ? `[Dịch TV -> Hán] ${q.prompt}`
                : `[Dịch Hán -> TV] ${q.prompt}`;
            essayParts.push(`【${label}】\nBài làm: ${ans}`);
          }
        });
      }

      const essayFormatted = essayParts.join('\n\n');

      // Package Audio Recordings (Speaking + Translation Audio)
      const audioList: AudioRecordItem[] = [];
      currentExam.speakingQuestions.forEach((q, idx) => {
        const rec = audioRecords[q.id];
        answerSnapshot.push({
          id: q.id,
          section: q.taskGroupTitle || 'Luyện nói',
          prompt: q.prompt,
          userAnswer: rec ? 'Đã ghi âm' : '',
          correctAnswer: q.referenceAnswers?.[0] || q.suggestedAnswer || '',
          status: 'manual'
        });
        if (rec) {
          audioList.push({
            label: `Câu ${idx + 1}: ${q.prompt}`,
            data: rec.data,
            mime: rec.mime,
            questionId: q.id,
            taskGroup: q.taskGroup
          });
        }
      });

      if (currentExam.translationQuestions) {
        currentExam.translationQuestions.forEach((q, idx) => {
          if (q.translationType === 'vi_to_zh_audio') {
            const rec = audioRecords[q.id];
            answerSnapshot.push({
              id: q.id,
              section: q.taskGroupTitle || 'Dịch nói',
              prompt: q.prompt,
              userAnswer: rec ? 'Đã ghi âm' : '',
              correctAnswer: q.referenceAnswers?.[0] || q.suggestedAnswer || '',
              status: 'manual'
            });
            if (rec) {
              audioList.push({
                label: `Câu ${idx + 1}: ${getTranslationPromptText(q.prompt)}`,
                data: rec.data,
                mime: rec.mime,
                questionId: q.id,
                taskGroup: q.taskGroup
              });
            }
          }
        });
      }

      additionalAudioSlots.forEach((slot, index) => {
        if (slot.record) {
          audioList.push({
            label: slot.record.label || `File ghi âm bổ sung ${index + 1}`,
            data: slot.record.data,
            mime: slot.record.mime,
            questionId: slot.record.questionId,
            taskGroup: slot.record.taskGroup
          });
        }
      });

      const fullTimeStr = new Date().toLocaleString('vi-VN');

      const res = await submitToGas({
        submissionId,
        time: fullTimeStr,
        name: studentName.trim(),
        class: studentClass.trim(),
        lesson: currentExam.title,
        correct: correctCount,
        done: doneMc,
        total: totalMc,
        percent: percent,
        wrongCount: wrongCount,
        notDone: notDoneCount,
        wrong: wrongDetails.join(' | ') || 'Không có câu sai',
        answerSnapshot: JSON.stringify(answerSnapshot),
        essays: essayFormatted || 'Không làm phần tự luận',
        audios: audioList
      });

      if (res.ok && res.id) {
        setSubmittedId(res.id);
        clearDraft();
      } else {
        setSubError(res.error || 'Nộp bài không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setSubError('Có lỗi xảy ra khi gửi dữ liệu bài làm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  timedSubmitRef.current = () => {
    void handleSubmit({ preventDefault: () => undefined } as React.FormEvent);
  };

  useEffect(() => {
    if (!isTimedExam || !canStartTimedExam || !timeLimitStartedAt || submittedId) {
      setRemainingSeconds(null);
      return;
    }

    const startedAt = timeLimitStartedAt;
    const deadline = startedAt + timeLimitMinutes * 60 * 1000;
    const updateTimer = () => {
      const nextSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(nextSeconds);
      if (nextSeconds === 0 && !timedSubmitTriggeredRef.current && timedSubmitRef.current) {
        timedSubmitTriggeredRef.current = true;
        setAutoSubmitted(true);
        timedSubmitRef.current();
      }
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timerId);
  }, [
    canStartTimedExam,
    currentExam.id,
    isTimedExam,
    selectedExamGroupLabel,
    selectedExamId,
    studentClass,
    studentName,
    submissionId,
    submittedId,
    timeLimitMinutes,
    timeLimitStartedAt
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderListeningAnswer = (question: Question) => {
    const isFillType = question.type === 'listening_fill' || question.type === 'listening_fill_in_blank';

    if (isFillType) {
      return (
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Nhập câu trả lời / từ điền tự luận:
          </label>
          <input
            type="text"
            value={fillAnswers[question.id] || ''}
            onChange={(e) => handleFillChange(question.id, e.target.value)}
            placeholder="Gõ đáp án của bạn vào đây..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
          />
        </div>
      );
    }

    if (!question.options) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {(shuffledChoiceOptions.get(question.id) || question.options.map((text, originalIndex) => ({ text, originalIndex }))).map(({ text: option, originalIndex }) => {
          const isSelected = mcAnswers[question.id] === originalIndex;
          return (
            <button
              type="button"
              key={originalIndex}
              onClick={() => handleMcSelect(question.id, originalIndex)}
              className={`text-left text-sm p-3 rounded-lg border transition cursor-pointer flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-1 ring-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}
              >
                {isSelected ? '✓' : ''}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner / Header */}
      {isExamContentVisible && (
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-100 mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Hệ Thống Luyện Thi & Ôn Tập HSK Tương Tác
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{currentExam.title}</h2>
            <p className="text-teal-100 text-sm mt-1 max-w-2xl">{currentExam.description}</p>
          </div>
        </div>
      )}

      {isExamContentVisible && isTimedExam && !submittedId && (
        <div className={`sticky top-2 z-20 rounded-xl border p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 ${
          remainingSeconds !== null && remainingSeconds <= 60
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Thời gian làm bài: {timeLimitMinutes} phút</p>
              <p className="text-xs opacity-80">
                {autoSubmitted
                  ? 'Đã hết giờ, hệ thống đang tự động nộp bài.'
                  : remainingSeconds === null
                    ? 'Đồng hồ bắt đầu khi em điền đủ họ tên, lớp và mở bài.'
                    : 'Bài sẽ tự động nộp khi đồng hồ về 00:00.'}
              </p>
            </div>
          </div>
          {remainingSeconds !== null && (
            <span className="font-mono text-2xl font-black tracking-wider" aria-label="Thời gian còn lại">
              {formatRemainingTime(remainingSeconds)}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-lg">Thông Tin Học Sinh</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Ví dụ: HSK3-T24"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Chọn cấp bậc / nhóm bài <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedExamGroupLabel}
                    onChange={(e) => handleSelectExamGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition font-semibold text-slate-800"
                  >
                    <option value="">Chọn cấp bậc / nhóm bài</option>
                    {examGroups.map((group) => (
                      <option key={group.label} value={group.label}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Chọn bài học / Đề thi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => handleSelectExam(e.target.value)}
                    disabled={!selectedExamGroupLabel}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition font-medium text-slate-800"
                  >
                    <option value="">Chọn bài học / đề thi</option>
                    {examsInSelectedGroup.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedExamId && (currentExam.isHandwriting ||
                currentExam.type === 'handwriting_submission' ||
                (currentExam.handwritingQuestions && currentExam.handwritingQuestions.length > 0)) && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-900 font-medium">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Pencil className="w-4 h-4 text-teal-600 shrink-0" />
                    Đang chọn bài tập Nộp ảnh bài viết / Chép từ mới
                  </span>
                  <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Chụp Ảnh Nộp
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedExamId ? (
          <>
        {/* SECTION 0: VOCABULARY LEARNING SHEET & LOCK SYSTEM */}
        {(!isTimedExam || hasRequiredStudentInfo) && hasVocabList && (
          <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  Bảng Từ Vựng Trọng Tâm ({currentExam.vocabList?.length} từ)
                </h3>
              </div>
              {isVocabDone && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" /> Đã ẩn vĩnh viễn trong lúc làm bài
                </span>
              )}
            </div>

            {!isVocabDone && (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-teal-50 text-teal-900 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5">Hán tự</th>
                      <th className="p-2.5">Pinyin</th>
                      <th className="p-2.5">Loại từ</th>
                      <th className="p-2.5">Nghĩa Tiếng Việt</th>
                      <th className="p-2.5 text-center">Phát âm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {currentExam.vocabList?.map((vocab, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 transition">
                        <td className="p-2.5 font-bold text-teal-700 text-base">{vocab.hanzi}</td>
                        <td className="p-2.5 font-mono text-indigo-600">{vocab.pinyin}</td>
                        <td className="p-2.5 text-slate-500">{vocab.type || 'Từ'}</td>
                        <td className="p-2.5 font-medium">{vocab.meaning}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => speakText(vocab.hanzi)}
                            title="Nghe đọc từ vựng"
                            className="p-1.5 rounded-full hover:bg-teal-100 text-teal-700 transition cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isVocabDone ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-teal-900 font-bold text-sm">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <span>
                    Học thuộc bảng từ vựng ở trên. Khi sẵn sàng, bấm nút bên dưới để mở bài tập!
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl mx-auto">
                  Lưu ý: Sau khi bấm nút, bảng từ vựng sẽ ẩn vĩnh viễn để em tự kiểm tra trí nhớ bằng cách làm bài tập (không thể xem lại trong lúc làm bài).
                </p>
                <button
                  type="button"
                  onClick={handleUnlockExam}
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Đã Học Xong — Bắt Đầu Làm Bài
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Bảng từ vựng đã ẩn vĩnh viễn. Em hãy hoàn thành bài tập bằng trí nhớ nhé! (Không thể mở lại trong lúc làm bài)
                </span>
              </div>
            )}
          </div>
        )}

        {/* EXERCISES CONTAINER - LOCKED WHEN VOCAB IS NOT DONE */}
        {isTimedExam && !hasRequiredStudentInfo ? (
          <div className="p-8 text-center bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 space-y-2">
            <Clock className="w-8 h-8 text-amber-700 mx-auto" />
            <p className="font-bold text-base">Vui lòng nhập đủ họ tên và lớp học để mở bài</p>
            <p className="text-sm text-amber-900/80">Đồng hồ chưa bắt đầu. Sau khi đủ thông tin, bạn sẽ thấy nút Bắt đầu.</p>
          </div>
        ) : !isVocabDone ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2">
            <Lock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-base">Toàn bộ câu hỏi bài tập đang tạm khóa</p>
            <p className="text-xs text-slate-500">
              Vui lòng xem kỹ bảng từ vựng ở trên và bấm nút "Đã học xong" để mở bài tập.
            </p>
          </div>
        ) : isTimedExam && !timeLimitStartedAt ? (
          <div className="p-8 text-center bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 space-y-4">
            <Clock className="w-8 h-8 text-amber-700 mx-auto" />
            <div className="space-y-1">
              <p className="font-bold text-base">Thông tin đã đủ, sẵn sàng bắt đầu bài thi?</p>
              <p className="text-sm text-amber-900/80">Sau khi bấm Bắt đầu, đề thi sẽ hiện ra và đồng hồ {timeLimitMinutes} phút sẽ chạy.</p>
            </div>
            <button
              type="button"
              onClick={handleStartTimedExam}
              className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-base px-8 py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" /> Bắt đầu
            </button>
          </div>
        ) : currentExam.isHandwriting || currentExam.type === 'handwriting_submission' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <HandwritingExerciseView
              ref={handwritingViewRef}
              exercise={{
                id: currentExam.id,
                type: 'handwriting_submission',
                title: currentExam.title,
                instruction: currentExam.instruction,
                referenceImages: currentExam.referenceImages || [],
                createdAt: new Date().toISOString(),
                level: currentExam.level,
                description: currentExam.description
              }}
              studentName={studentName}
              studentClass={studentClass}
              onSubmissionComplete={(sub) => {
                setSubmittedId(sub.id);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* RENDER CUSTOM / IMPORTED LESSON SECTIONS (Matching, Dictation, Paragraph Order, Picture Writing, etc.) */}
            {currentExam.sections && currentExam.sections.length > 0 && (
              <div className="space-y-6">
                {currentExam.sections.map((sec) => {
                  const audioItems = sec.items.filter((item) => {
                    const data = item.data || {};
                    return [data.audio, data.audioUrl, data.audioPromptUrl]
                      .some((value) => typeof value === 'string' && value.trim());
                  });
                  const sharedAudioItem = audioItems.length === 1 && sec.items.length > 1
                    ? audioItems[0]
                    : undefined;

                  return (
                  <div key={sec.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 text-lg">{sec.title}</h3>
                    </div>
                    {sharedAudioItem && (
                      <StructuredBlockAudio
                        item={sharedAudioItem}
                        studentMode
                        audioPlayCounts={listeningPlayCounts}
                        audioScope={structuredAudioScope}
                        onAudioAttempt={handleStructuredAudioAttempt}
                        sticky
                      />
                    )}
                    <div className="space-y-6">
                      {sec.items.map((item) => (
                        <ExerciseRenderer
                          key={item.id}
                          item={item}
                          answers={structuredAnswers}
                          studentMode
                          audioPlayCounts={listeningPlayCounts}
                          audioScope={structuredAudioScope}
                          onAudioAttempt={handleStructuredAudioAttempt}
                          hideBlockAudio={item.id === sharedAudioItem?.id}
                          onAnswerChange={(key, answer) => {
                            setStructuredAnswers((current) => ({ ...current, [key]: answer }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* SECTION 1: MULTIPLE CHOICE */}
            {currentExam.mcQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
                      1
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Trắc Nghiệm</h3>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                    {Object.keys(mcAnswers).length}/{currentExam.mcQuestions.length} đã chọn
                  </span>
                </div>

                <div className="space-y-6">
                  {currentExam.mcQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      {q.type && !['mc', 'multiple_choice', 'flashcard', 'vocab', 'fill', 'fill_in_blank', 'arrange', 'ordering', 'matching', 'dictation', 'paragraph_order', 'picture_writing', 'speaking_record', 'listening_multiple_choice', 'listening_true_false', 'listening', 'listening_mc', 'listening_tf', 'reading', 'passage', 'essay', 'writing', 'speaking', 'pronunciation', 'translation', 'translate', 'translate_vi_zh'].includes(q.type) && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-mono flex items-center justify-between">
                          <span>Unsupported Exercise Type: <strong>{q.type}</strong></span>
                          <span className="text-[10px] text-amber-700 font-sans italic">Item này được giữ lại đầy đủ</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-teal-600 text-sm mt-0.5">Câu {idx + 1}:</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{q.prompt}</p>
                          </div>
                        </div>
                      </div>

                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {(shuffledChoiceOptions.get(q.id) || q.options.map((text, originalIndex) => ({ text, originalIndex }))).map(({ text: opt, originalIndex }) => {
                            const isSelected = mcAnswers[q.id] === originalIndex;
                            return (
                              <button
                                type="button"
                                key={originalIndex}
                                onClick={() => handleMcSelect(q.id, originalIndex)}
                                className={`text-left text-sm p-3 rounded-lg border transition cursor-pointer flex items-center gap-2.5 ${
                                  isSelected
                                    ? 'bg-teal-50 border-teal-500 text-teal-900 font-medium ring-1 ring-teal-500'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                    isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected ? '✓' : ''}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: FILL IN BLANKS */}
            {currentExam.fillQuestions && currentExam.fillQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      2
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Điền Từ Vào Chỗ Trống & Ngữ Pháp</h3>
                  </div>
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
                    {Object.keys(fillAnswers).length}/{currentExam.fillQuestions.length} đã làm
                  </span>
                </div>

                <div className="space-y-6">
                  {groupedFillQuestions.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-4">
                      {/* Prominent Word Bank Display */}
                      {group.wordBank && group.wordBank.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300/80 rounded-xl p-4 shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>Bảng từ cho sẵn (Chọn từ thích hợp để điền vào câu):</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {group.wordBank.map((word, wIdx) => (
                              <span
                                key={wIdx}
                                className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-950 font-bold text-base rounded-lg shadow-2xs font-mono hover:scale-105 transition transform cursor-default"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions list with RESET index for Tier 2 */}
                      <div className="space-y-3">
                        {group.questions.map((q, qIdx) => (
                          <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Câu {qIdx + 1}: {q.prompt}
                              </p>
                            </div>
                            <input
                              type="text"
                              value={fillAnswers[q.id] || ''}
                              onChange={(e) => handleFillChange(q.id, e.target.value)}
                              placeholder="Nhập câu trả lời bằng chữ Hán..."
                              className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: INTERACTIVE SENTENCE ARRANGEMENT */}
            {currentExam.arrangeQuestions && currentExam.arrangeQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                      3
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Sắp Xếp Thẻ Từ Thành Câu</h3>
                  </div>
                  <span className="text-xs font-medium bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
                    {Object.keys(arrangeAnswers).length}/{currentExam.arrangeQuestions.length} đã xếp
                  </span>
                </div>

                <div className="space-y-6">
                  {currentExam.arrangeQuestions.map((q, idx) => {
                    const userOrdered = arrangeAnswers[q.id] || [];
                    const chips = shuffledArrangeChips.get(q.id) || q.wordChips || [];

                    // Track remaining available chips
                    const availableChips = [...chips];
                    userOrdered.forEach((item) => {
                      const foundIdx = availableChips.indexOf(item);
                      if (foundIdx !== -1) {
                        availableChips.splice(foundIdx, 1);
                      }
                    });

                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Câu {idx + 1}: Sắp xếp
                            </p>
                          </div>
                        </div>

                        {/* Order display area */}
                        <div className="min-h-[52px] bg-white border-2 border-dashed border-blue-200 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
                          {userOrdered.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              Nhấp vào các thẻ từ bên dưới để xếp câu tại đây...
                            </span>
                          ) : (
                            userOrdered.map((chip, chipIdx) => (
                              <button
                                type="button"
                                key={chipIdx}
                                onClick={() => handleChipClick(q.id, chip, false, chipIdx)}
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                              >
                                <span>{chip}</span>
                                <span className="text-[10px] bg-blue-800 text-blue-100 rounded-full w-4 h-4 flex items-center justify-center ml-0.5">
                                  ×
                                </span>
                              </button>
                            ))
                          )}
                        </div>

                        {/* Word Chips pool */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {availableChips.map((chip, cIdx) => (
                              <button
                                type="button"
                                key={cIdx}
                                onClick={() => handleChipClick(q.id, chip, true)}
                                className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-800 font-semibold text-sm px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {userOrdered.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleResetArrange(q.id)}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Xếp lại
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION: LISTENING EXERCISES */}
            {currentExam.listeningQuestions && currentExam.listeningQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-sm">
                      🎧
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Luyện Nghe</h3>
                  </div>
                  <span className="text-xs font-medium bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-full border border-indigo-200">
                    {listeningQuestionItems.filter(q => (q.type === 'listening_fill' || q.type === 'listening_fill_in_blank') ? !!fillAnswers[q.id]?.trim() : mcAnswers[q.id] !== undefined).length}/{listeningQuestionItems.length} đã làm
                  </span>
                </div>

                <div className="space-y-6">
                  {currentExam.listeningQuestions.map((q, idx) => {
                    const subQuestions = q.subQuestions?.length ? q.subQuestions : [q];
                    const isConversation = !!q.subQuestions?.length;
                    const isTfType = q.type === 'listening_tf' || q.type === 'listening_true_false';

                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-indigo-700 text-sm mt-0.5">{isConversation ? `Bài nghe ${idx + 1}:` : `Câu nghe ${idx + 1}:`}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{q.prompt}</p>
                              {q.pinyin && <p className="text-xs text-indigo-600 font-mono mt-0.5">Pinyin / Phiên âm: {q.pinyin}</p>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isTfType
                              ? 'bg-amber-100 text-amber-900'
                              : q.type === 'listening_fill' || q.type === 'listening_fill_in_blank'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-indigo-100 text-indigo-900'
                          }`}>
                            {isConversation
                              ? subQuestions.length > 1 ? 'Nghe hội thoại - trả lời nhiều câu' : 'Nghe hội thoại'
                              : isTfType
                              ? 'Nghe Phán Đoán Đúng / Sai'
                              : q.type === 'listening_fill' || q.type === 'listening_fill_in_blank'
                              ? 'Nghe Điền Tự Luận'
                              : 'Nghe Tích Trắc Nghiệm ABCD'}
                          </span>
                        </div>

                        {/* Audio Player Component */}
                        <div className="p-3 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2 text-indigo-950 font-semibold text-xs shrink-0">
                            <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                            <span>File âm thanh bài nghe:</span>
                          </div>

                          {(q.audioUrl || q.audioPromptUrl) ? (
                            <audio
                              controls
                              src={getDriveAudioPlayerUrl(q.audioUrl || q.audioPromptUrl || '')}
                              className="w-full sm:max-w-md h-9 rounded-md"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => speakText(q.audioText || q.pinyin || q.prompt)}
                              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-xs"
                            >
                              <Volume2 className="w-4 h-4" /> Bấm để phát âm thanh (Giọng đọc tự động TTS)
                            </button>
                          )}
                        </div>

                        <div className={isConversation ? 'space-y-3 pt-1' : ''}>
                          {subQuestions.map((subQuestion, subIdx) => (
                            <div
                              key={subQuestion.id}
                              className={isConversation ? 'p-3 bg-white/80 rounded-xl border border-indigo-100 space-y-2' : ''}
                            >
                              {isConversation && (
                                <div className="text-sm font-bold text-slate-900">
                                  Câu {subIdx + 1}: {subQuestion.prompt}
                                  {subQuestion.pinyin && (
                                    <p className="text-xs text-indigo-600 font-mono mt-0.5">
                                      Pinyin / Phiên âm: {subQuestion.pinyin}
                                    </p>
                                  )}
                                </div>
                              )}
                              {renderListeningAnswer(subQuestion)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 4: READING PASSAGES */}
            {currentExam.readingPassages && currentExam.readingPassages.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                      4
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Đọc Hiểu Đoạn Văn</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  {currentExam.readingPassages.map((passage, pIdx) => (
                    <div key={passage.id} className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <h4 className="font-bold text-sky-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-700" /> {passage.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => speakText(passage.content)}
                          className="inline-flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Nghe đọc đoạn văn
                        </button>
                      </div>

                      <div className="p-3.5 bg-white border border-sky-100 rounded-lg text-sm text-slate-800 leading-relaxed font-sans">
                        {passage.content}
                      </div>

                      <div className="space-y-4 pt-1">
                        {passage.questions.map((q, qIdx) => (
                          <div key={q.id} className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                            <p className="text-xs font-bold text-slate-700">
                              Câu {qIdx + 1}: {q.prompt}
                            </p>
                            {q.options && q.options.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {(shuffledChoiceOptions.get(q.id) || q.options.map((text, originalIndex) => ({ text, originalIndex }))).map(({ text: opt, originalIndex }) => {
                                  const isSelected = mcAnswers[q.id] === originalIndex;
                                  return (
                                    <button
                                      type="button"
                                      key={originalIndex}
                                      onClick={() => handleMcSelect(q.id, originalIndex)}
                                      className={`text-left text-xs p-2.5 rounded-lg border transition cursor-pointer flex items-center gap-2 ${
                                        isSelected
                                          ? 'bg-sky-50 border-sky-500 text-sky-900 font-medium ring-1 ring-sky-500'
                                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span
                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[9px] font-bold ${
                                          isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                                        }`}
                                      >
                                        {isSelected ? '✓' : ''}
                                      </span>
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <textarea
                                rows={2}
                                value={essayAnswers[q.id] || ''}
                                onChange={(e) => handleEssayChange(q.id, e.target.value)}
                                placeholder="Nhập câu trả lời bằng chữ Hán..."
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: ESSAY QUESTIONS */}
            {currentExam.essayQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                      5
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Viết & Tự Luận</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentExam.essayQuestions.map((q, idx) => {
                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            Câu {idx + 1}: {q.prompt}
                          </p>
                        </div>

                        {q.imageUrl && (
                          <div className="my-2">
                            <img
                              src={getDriveMediaPlayerUrl(q.imageUrl)}
                              alt={`Hình ảnh đề bài câu ${idx + 1}`}
                              className="max-h-72 max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-2xs"
                            />
                          </div>
                        )}

                        <textarea
                          rows={3}
                          value={essayAnswers[q.id] || ''}
                          onChange={(e) => handleEssayChange(q.id, e.target.value)}
                          placeholder="Nhập bài viết hoặc câu tự luận tại đây..."
                          className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6: PRODUCTION SKILLS */}
            {speakingTaskGroups.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      6
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Kỹ năng nói</h3>
                      <p className="text-xs text-slate-500">Mỗi bài có ghi âm, dừng, nghe lại, ghi âm lại và tải file lên.</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {Object.keys(audioRecords).length}/{currentExam.speakingQuestions.length} bài nói đã ghi âm
                  </span>
                </div>

                {speakingTaskGroups.some((group) => group.key === 'reading_aloud') && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2">
                    <span className="text-xs text-indigo-900">Pinyin phần 朗读 đang ẩn mặc định.</span>
                    <button
                      type="button"
                      onClick={() => setShowSpeakingPinyin((value) => !value)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                    >
                      {showSpeakingPinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {speakingTaskGroups.map((group, groupIndex) => {
                    const questionOffset = speakingTaskGroups
                      .slice(0, groupIndex)
                      .reduce((total, previousGroup) => total + previousGroup.questions.length, 0);

                    return (
                    <section key={group.key} className="space-y-3" aria-label={group.title}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-800">{group.title}</h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {group.questions.length} bài · giáo viên chấm
                        </span>
                      </div>
                      {group.questions.map((q, idx) => {
                        const questionNumber = questionOffset + idx + 1;

                        return (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-500">Câu {questionNumber}</span>
                            {q.preparationSeconds && (
                              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                Chuẩn bị {q.preparationSeconds} giây
                              </span>
                            )}
                          </div>
                          {q.explanation && group.key === 'self_introduction' && (
                            <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                          )}
                          {q.imageUrl && (
                            <img
                              src={getDriveMediaPlayerUrl(q.imageUrl)}
                              alt={`Hình ảnh luyện nói câu ${questionNumber}`}
                              className="max-h-72 max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-2xs"
                            />
                          )}
                          <AudioRecorder
                            label={q.prompt}
                            questionId={q.id}
                            taskGroup={q.taskGroup}
                            pinyin={group.key === 'reading_aloud' && showSpeakingPinyin ? q.pinyin : undefined}
                            onAudioRecorded={(rec) => handleAudioRecorded(q.id, rec)}
                          />
                        </div>
                        );
                      })}
                    </section>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 7: TRANSLATION PRACTICE (3 TYPES, NO EMOJIS, NO PINYIN, NO HINTS) */}
            {currentExam.translationQuestions && currentExam.translationQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm">
                      7
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Kỹ năng dịch</h3>
                      <p className="text-xs text-slate-500">
                        Bao gồm dịch ghi âm phát âm, dịch câu viết Hán tự và dịch Trung - Việt
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    {currentExam.translationQuestions.length} câu dịch
                  </span>
                </div>

                {currentExam.translationQuestions.some((question) => question.translationType === 'vi_to_zh_audio') && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
                    <p className="text-sm font-bold text-sky-900">
                        Dịch nói Việt → Trung
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      <span className="font-semibold text-sky-900">Dịch câu tiếng Việt sang tiếng Trung</span>, sau đó{' '}
                      <span className="font-semibold text-rose-700">ghi âm câu tiếng Trung</span> bạn vừa dịch.
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-600">
                      ① Đọc câu tiếng Việt → ② Dịch sang tiếng Trung → ③ Ghi âm câu dịch
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {currentExam.translationQuestions.map((q, idx) => {
                    // Dạng 1: Cho câu tiếng Việt -> Ghi âm câu tiếng Trung
                    if (q.translationType === 'vi_to_zh_audio') {
                      return (
                        <div
                          key={q.id}
                          className="grid gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-sky-100 px-2 text-sm font-bold text-sky-800">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-bold text-slate-700">Câu {idx + 1}</span>
                            </div>
                            <p className="mt-3 text-lg font-bold leading-snug text-slate-900">
                              {getTranslationPromptText(q.prompt)}
                            </p>
                            <span className="mt-2 inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800">
                              Dịch sang tiếng Trung
                            </span>
                            {q.preparationSeconds && (
                              <span className="ml-2 mt-2 inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                                Chuẩn bị {q.preparationSeconds} giây
                              </span>
                            )}
                          </div>

                          <div className="md:border-l md:border-slate-200 md:pl-4">
                            <AudioRecorder
                              compact
                              label={`Câu ${idx + 1}: ${getTranslationPromptText(q.prompt)}`}
                              questionId={q.id}
                              taskGroup={q.taskGroup}
                              onAudioRecorded={(rec) => handleAudioRecorded(q.id, rec)}
                            />
                            {!audioRecords[q.id] && (
                              <p className="mt-2 text-xs font-medium text-slate-500">Chưa có bản ghi âm</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Dạng 2: Cho câu tiếng Việt -> Viết câu tiếng Trung
                    if (q.translationType === 'vi_to_zh_text') {
                      return (
                        <div key={q.id} className="p-5 rounded-xl bg-white border-2 border-sky-200 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold bg-sky-100 border border-sky-200 text-sky-900">
                              Dịch viết Việt → Trung
                            </span>
                          </div>

                          <div>
                            <p className="text-lg font-bold leading-snug text-slate-900">
                              Câu {idx + 1}: <span className="text-slate-900">{q.prompt}</span>
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                              Hãy gõ câu dịch bằng chữ Hán:
                            </p>
                          </div>

                          <textarea
                            rows={3}
                            value={essayAnswers[q.id] || ''}
                            onChange={(e) => handleEssayChange(q.id, e.target.value)}
                            placeholder="Nhập câu dịch bằng chữ Hán..."
                            className="w-full p-3 border border-sky-200 rounded-lg text-base bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                          />
                        </div>
                      );
                    }

                    // Dạng 3: Cho câu tiếng Trung -> Dịch thành tiếng Việt
                    if (q.translationType === 'zh_to_vi_text') {
                      return (
                        <div key={q.id} className="p-5 rounded-xl bg-white border-2 border-sky-200 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold bg-sky-100 border border-sky-200 text-sky-900">
                              Dịch viết Trung → Việt
                            </span>
                          </div>

                          <div>
                            <p className="text-lg font-bold leading-snug text-slate-900">
                              Câu {idx + 1}: {q.prompt}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                              Hãy dịch câu Tiếng Trung trên sang Tiếng Việt chuẩn:
                            </p>
                          </div>

                          <textarea
                            rows={3}
                            value={essayAnswers[q.id] || ''}
                            onChange={(e) => handleEssayChange(q.id, e.target.value)}
                            placeholder="Nhập bản dịch Tiếng Việt của bạn..."
                            className="w-full p-3 border border-sky-200 rounded-lg text-base bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            {/* ADDITIONAL AUDIO FILES */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">File ghi âm bổ sung</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Có thể thêm nhiều file ngoài các câu hỏi có sẵn. Mỗi file đều có nút nghe lại và xóa.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                  {additionalAudioSlots.filter((slot) => Boolean(slot.record)).length} file bổ sung
                </span>
              </div>

              {additionalAudioSlots.length > 0 && (
                <div className="space-y-3">
                  {additionalAudioSlots.map((slot, index) => (
                    <AudioRecorder
                      key={slot.id}
                      label={`File ghi âm bổ sung ${index + 1}`}
                      onAudioRecorded={(record) => handleAdditionalAudioRecorded(slot.id, record)}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addAdditionalAudioSlot}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus className="w-4 h-4" />
                Thêm file ghi âm
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {subError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{subError}</span>
          </div>
        )}

        {/* Submit Button */}
        {isVocabDone && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-60 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang nộp bài & lưu ghi âm...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Nộp bài tập
                </>
              )}
            </button>
          </div>
        )}
          </>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-teal-500 mx-auto" />
            <p className="font-bold text-slate-700 text-base">
              Vui lòng điền họ tên, lớp học và chọn cấp bậc / bài học / đề thi để bắt đầu.
            </p>
            <p className="text-xs text-slate-500">
              Điền thông tin học sinh trước, sau đó chọn bước 1 và chọn bài cụ thể ở bước 2.
            </p>
          </div>
        )}
      </form>

      {/* SUCCESS MODAL AFTER SUBMISSION */}
      {submittedId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">Nộp Bài Thành Công!</h3>
              <p className="text-sm text-slate-600 mt-1">
                Bài tập và file ghi âm đã được gửi tới hệ thống. Vui lòng lưu lại mã bên dưới để xem điểm:
              </p>
            </div>

            {/* ID Display Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-xs text-slate-500 font-medium uppercase block">Mã bài nộp của bạn</span>
                <span className="text-2xl font-mono font-bold text-teal-700 tracking-wider">{submittedId}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(submittedId)}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                {copiedId ? 'Đã chép!' : 'Sao chép mã'}
              </button>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onSuccessNavigateToResult(submittedId)}
                className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition cursor-pointer text-sm"
              >
                Xem Kết Quả & Nhận Xét GV <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  setMcAnswers({});
                  setFillAnswers({});
                  setArrangeAnswers({});
                  setEssayAnswers({});
                  setUnlockedReference({});
                  setAudioRecords({});
                  setAdditionalAudioSlots([]);
                  setStructuredAnswers({});
                  listeningPlayCountsRef.current = {};
                  setListeningPlayCounts({});
                  setSubmissionId(createSubmissionId());
                  clearDraft();
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-800 py-2 transition"
              >
                Đóng thông báo & Làm bài khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
