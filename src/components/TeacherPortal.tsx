import React, { useEffect, useMemo, useState } from 'react';
import { AnswerSnapshotItem, AudioRecordItem, SubmissionData, ExamLesson, VocabItem, Question, ReadingPassage } from '../types';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import {
  deleteSubmissionsInGas,
  fetchTeacherSubmissions,
  gradeSubmissionInGas,
  getGasConfig,
  saveLocalSubmission
} from '../services/gasService';
import { speakText } from '../utils/tts';
import { convertExamLessonToLessonData, parseLessonToExam, sanitizeExamSections } from '../utils/lessonParser';
import { validateLesson } from '../utils/validateLesson';
import { LessonData } from '../types/lesson';
import { groupExamsForSelection } from '../utils/examGrouping';
import { useStudentExamCatalog } from '../hooks/useStudentExamCatalog';
import { getAudioLinkLabel, getAudioSrcFromObject, getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { buildExamCatalog } from '../utils/examCatalog';
import { getExamAudioQuestions } from '../utils/examAudio';
import {
  buildOrderedQuestionList,
  isAttempted,
  isIncorrect,
  requiresTeacherReview,
  OrderedTeacherQuestion
} from '../utils/teacherQuestionOrder';
import { fileToCompressedDataUrl } from '../utils/imageUtils';
import { ImportLesson } from './ImportLesson';
import { EditQuestionModal } from './EditQuestionModal';
import { LessonDataEditor } from './LessonDataEditor';
import { AudioRecorder } from './AudioRecorder';
import { HandwritingExerciseEditor } from './exercises/HandwritingExerciseEditor';
import { HandwritingGradingPanel } from './exercises/HandwritingGradingPanel';
import { HandwritingExercise, HandwritingSubmission } from '../types/handwriting';
import {
  getHandwritingExercises,
  saveHandwritingExercise,
  deleteHandwritingExercise,
  getHandwritingSubmissions,
  convertHandwritingToExamLesson
} from '../services/handwritingService';
import {
  uploadMediaFile,
  fetchServerHandwritingExercises,
  saveServerHandwritingExercise
} from '../services/apiService';
import {
  Lock,
  Unlock,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Volume2,
  ExternalLink,
  MessageSquare,
  Award,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  X,
  Edit3,
  Plus,
  Trash2,
  BookOpen,
  List,
  Save,
  FileText,
  Headphones,
  FileCode,
  Pencil,
  Upload,
  Image as ImageIcon,
  Undo2,
  Redo2
} from 'lucide-react';

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

const MAX_LESSON_HISTORY = 50;

const cloneExam = (exam: ExamLesson): ExamLesson => structuredClone(exam);

const normalizeLessonFilterValue = (value: string): string =>
  value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .trim()
    .toLocaleLowerCase('vi');

const removeAnswerSnapshot = (value?: string): string =>
  String(value || '').replace(/\n?\[ANSWER_SNAPSHOT\]:\s*\[[\s\S]*\]\s*$/, '').trim();

const stripTeacherReviewMetadata = (value?: string): string =>
  removeAnswerSnapshot(value)
    .split(/\s*\|\s*|\r?\n/)
    .map((part) => part.trim())
    .filter((part) => (
      part &&
      !/^\[Đánh giá\s+[^\]]+\]$/i.test(part) &&
      !/^\[(?:Tự luận|Ghi âm)\s*(?:C|câu)?\s*\d+\]:/i.test(part) &&
      !/^\[[^\]:]+\]:\s*.+$/u.test(part)
    ))
    .join(' | ')
    .trim();

type TeacherReviewStatus = 'Chưa chấm' | 'Đúng' | 'Sai' | 'Cần sửa';

const parseAnswerSnapshot = (value?: string): AnswerSnapshotItem[] => {
  const text = String(value || '').trim();
  const match = text.match(/\[ANSWER_SNAPSHOT\]:\s*(\[[\s\S]*\])\s*$/);
  const jsonText = match?.[1] || (text.startsWith('[') ? text : '');
  if (!jsonText) return [];

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AnswerSnapshotItem => (
      item && typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.prompt === 'string' &&
      ['correct', 'wrong', 'unanswered', 'manual'].includes(item.status)
    ));
  } catch {
    return [];
  }
};

const normalizeTeacherReviewStatus = (value: string): TeacherReviewStatus => {
  const normalized = value.trim().toLocaleLowerCase('vi');
  if (normalized === 'đúng') return 'Đúng';
  if (normalized === 'sai') return 'Sai';
  if (normalized === 'cần sửa') return 'Cần sửa';
  return 'Chưa chấm';
};

const parseTeacherItemMetadata = (value?: string): {
  comments: Record<string, string>;
  statuses: Record<string, TeacherReviewStatus>;
} => {
  const comments: Record<string, string> = {};
  const statuses: Record<string, TeacherReviewStatus> = {};
  String(value || '').split(/\s*\|\s*|\r?\n/).forEach((part) => {
    const trimmed = part.trim();
    const statusMatch = trimmed.match(/^\[Đánh giá\s+([^:]+):\s*(Chưa chấm|Đúng|Sai|Cần sửa)\]$/i);
    if (statusMatch) {
      statuses[statusMatch[1].trim()] = normalizeTeacherReviewStatus(statusMatch[2]);
      return;
    }

    const commentMatch = trimmed.match(/^\[([^\]:]+)\]:\s*(.+)$/u);
    if (commentMatch && commentMatch[2].trim()) comments[commentMatch[1].trim()] = commentMatch[2].trim();
  });
  return { comments, statuses };
};

const parseLegacyEssayAnswers = (value?: string): Array<{ prompt: string; answer: string }> => {
  const text = removeAnswerSnapshot(value);
  if (!text || text === 'Không làm phần tự luận') return [];
  return text.split(/(?=【)/g).filter(Boolean).map((chunk) => {
    const titleMatch = chunk.match(/【(.*?)】/);
    return {
      prompt: titleMatch?.[1]?.trim() || '',
      answer: chunk.replace(/【.*?】\n?/, '').replace(/^Bài làm:\s*/, '').trim()
    };
  });
};

const matchesCatalogLessonTitle = (submissionLesson: string, catalogTitle: string): boolean => {
  const submission = normalizeLessonFilterValue(submissionLesson);
  const catalogTitleValue = normalizeLessonFilterValue(catalogTitle);
  if (!submission || !catalogTitleValue) return false;
  if (submission === catalogTitleValue) return true;

  // Handwriting submissions append the student's lesson topic to the catalog title.
  const suffix = submission.slice(catalogTitleValue.length);
  return submission.startsWith(catalogTitleValue) && /^[\s(：:–—-]/u.test(suffix);
};

type TeacherWrongAnswerDetail = {
  category: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  raw: string;
};

type TeacherQuestionView = OrderedTeacherQuestion & {
  snapshot?: AnswerSnapshotItem;
  answerText: string;
  correctText: string;
  audio?: AudioRecordItem;
  attempted: boolean;
  incorrect: boolean;
  reviewRequired: boolean;
  legacyWrong?: TeacherWrongAnswerDetail;
};

const parseTeacherWrongDetails = (wrong?: string): TeacherWrongAnswerDetail[] => {
  if (!wrong || wrong === 'Không có câu sai') return [];

  const lines = wrong.includes('\n') ? wrong.split('\n') : wrong.split(' | ');
  return lines.map((line) => {
    const raw = line.trim();
    const bracketMatch = raw.match(/^\[(.*?)\]\s*:?\s*(.*)$/);
    const bracketContent = bracketMatch?.[1]?.trim() || '';
    const body = bracketMatch?.[2]?.trim() || raw;
    const promptMatch = bracketContent.match(/^(.*?):\s*["“](.*?)["”]$/);
    const prompt = promptMatch?.[2]?.trim() || body.match(/["“](.*?)["”]/)?.[1]?.trim() || '';
    const category = promptMatch?.[1]?.trim() || bracketContent || 'Câu sai';
    const userAnswer = body.match(/(?:Bạn chọn|Bạn nhập|Bạn xếp|Bạn điền)\s*\[(.*?)\]/i)?.[1]?.trim() || '';
    const correctAnswer = body.match(/Đáp án đúng\s*\[(.*?)\]/i)?.[1]?.trim() || '';

    return { category, prompt, userAnswer, correctAnswer, raw };
  });
};

const normalizeAnswerForRegrade = (value: unknown): string => String(value ?? '')
  .trim()
  .toLocaleLowerCase('vi')
  .replace(/^[a-f]\s*[.)。：:]\s*/i, '')
  .replace(/\s+/g, '');

const getCurrentAnswerCandidates = (question: Question): string[] => {
  const acceptableAnswers = String(question.acceptableAnswers || '')
    .split('|')
    .map((answer) => answer.trim())
    .filter(Boolean);
  if (acceptableAnswers.length > 0) return acceptableAnswers;

  if (typeof question.answer === 'number') {
    const option = question.options?.[question.answer];
    return [option || `Đáp án ${String.fromCharCode(65 + question.answer)}`, String.fromCharCode(65 + question.answer)];
  }

  if (typeof question.answer === 'string' && question.answer.trim()) {
    const answer = question.answer.trim();
    const option = question.options?.find((value) => value === answer || value.startsWith(`${answer}.`));
    return option ? [option, answer] : [answer];
  }

  return [question.referenceAnswers?.[0] || question.suggestedAnswer || ''].filter(Boolean);
};

const matchesCurrentAnswer = (question: Question, userAnswer: unknown): boolean => {
  const normalizedUserAnswer = normalizeAnswerForRegrade(userAnswer);
  return Boolean(normalizedUserAnswer) && getCurrentAnswerCandidates(question)
    .some((answer) => normalizeAnswerForRegrade(answer) === normalizedUserAnswer);
};

const getRegradedSubmissionMetrics = (submission: SubmissionData, exams: ExamLesson[]) => {
  const exam = exams.find(
    (candidate) => candidate.id === submission.lesson || matchesCatalogLessonTitle(submission.lesson, candidate.title)
  );
  const storedPercent = submission.total > 0
    ? Math.round((submission.correct / submission.total) * 100)
    : (submission.percent <= 1 && submission.percent > 0 ? Math.round(submission.percent * 100) : submission.percent);

  if (!exam) {
    return { correct: submission.correct, percent: storedPercent };
  }

  const snapshotItems = parseAnswerSnapshot(submission.answerSnapshot || submission.essays);
  const snapshotById = new Map(snapshotItems.map((item) => [item.id, item]));
  const snapshotByPrompt = new Map(snapshotItems.map((item) => [item.prompt.trim().toLocaleLowerCase(), item]));
  const legacyWrongDetails = parseTeacherWrongDetails(submission.wrong);
  const orderedQuestions = buildOrderedQuestionList(exam);

  const regradedDelta = orderedQuestions.reduce((delta, orderedQuestion) => {
    const question = orderedQuestion.question;
    if (requiresTeacherReview(question)) return delta;

    const snapshot = snapshotById.get(question.id) || snapshotByPrompt.get(question.prompt.trim().toLocaleLowerCase());
    const legacyWrong = legacyWrongDetails.find((detail) => {
      const detailPrompt = detail.prompt.trim().toLocaleLowerCase();
      const questionPrompt = question.prompt.trim().toLocaleLowerCase();
      return detailPrompt && questionPrompt && (
        detailPrompt === questionPrompt ||
        detailPrompt.includes(questionPrompt) ||
        questionPrompt.includes(detailPrompt)
      );
    });
    if (!snapshot && !legacyWrong) return delta;

    const userAnswer = snapshot?.userAnswer ?? legacyWrong?.userAnswer ?? '';
    const wasCorrect = snapshot?.status === 'correct';
    const isCorrectNow = matchesCurrentAnswer(question, userAnswer);
    return delta + Number(isCorrectNow) - Number(wasCorrect);
  }, 0);

  const correct = Math.max(0, Math.min(submission.total, submission.correct + regradedDelta));
  return {
    correct,
    percent: submission.total > 0
      ? Math.round((correct / submission.total) * 100)
      : (submission.percent <= 1 && submission.percent > 0 ? Math.round(submission.percent * 100) : submission.percent)
  };
};

const hasPendingAnswerKey = (submission: SubmissionData, exams: ExamLesson[]): boolean => {
  if (submission.status === 'Đã chấm') return false;
  const exam = exams.find(
    (candidate) => candidate.id === submission.lesson || matchesCatalogLessonTitle(submission.lesson, candidate.title)
  );
  if (!exam) return false;
  const questions = buildOrderedQuestionList(exam);
  return questions.length > 0 && questions.every((item) => requiresTeacherReview(item.question));
};

const isAcceptedArrangeAnswer = (detail: TeacherWrongAnswerDetail, exam: ExamLesson): boolean => {
  const match = detail.category.match(/Sắp xếp\s+Câu\s*(\d+)/i);
  const question = match ? exam.arrangeQuestions?.[Number(match[1]) - 1] : undefined;
  if (!question?.acceptableAnswers || !detail.userAnswer) return false;

  const normalizedUserAnswer = detail.userAnswer.replace(/\s+/g, '');
  return question.acceptableAnswers
    .split('|')
    .map((answer) => answer.trim().replace(/\s+/g, ''))
    .filter(Boolean)
    .includes(normalizedUserAnswer);
};

interface TeacherPortalProps {
  customExams?: ExamLesson[];
  deletedExamIds?: string[];
  onSaveCustomExam?: (exam: ExamLesson) => Promise<boolean> | void;
  onDeleteCustomExam?: (examId: string) => Promise<boolean> | void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  customExams = [],
  deletedExamIds = [],
  onSaveCustomExam,
  onDeleteCustomExam
}) => {
  const config = getGasConfig();
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'submissions' | 'handwriting' | 'editor' | 'import_json'>('submissions');

  // Handwriting exercises state
  const [hwExercises, setHwExercises] = useState<HandwritingExercise[]>(() => getHandwritingExercises());
  const [selectedHwSub, setSelectedHwSub] = useState<HandwritingSubmission | null>(null);
  const [editingHwExercise, setEditingHwExercise] = useState<HandwritingExercise | null>(null);
  const [showCreateHwModal, setShowCreateHwModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const syncHandwritingExercises = async () => {
      const localExercises = getHandwritingExercises();
      const serverExercises = await fetchServerHandwritingExercises();
      const serverIds = new Set(serverExercises.map((exercise) => exercise.id));

      await Promise.all(
        localExercises
          .filter((exercise) => !serverIds.has(exercise.id))
          .map((exercise) => saveServerHandwritingExercise(exercise))
      );

      if (cancelled) return;
      setHwExercises((current) => {
        const merged = new Map(current.map((exercise) => [exercise.id, exercise]));
        serverExercises.forEach((exercise) => merged.set(exercise.id, exercise));
        return Array.from(merged.values());
      });
    };

    void syncHandwritingExercises();
    return () => {
      cancelled = true;
    };
  }, []);

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Chờ chấm' | 'Đã chấm'>('ALL');
  const [lessonLevelFilter, setLessonLevelFilter] = useState('ALL');
  const [lessonFilter, setLessonFilter] = useState('ALL');

  // Selected Submission for Modal Detail & Grading
  const [selectedSub, setSelectedSub] = useState<SubmissionData | null>(null);
  const [speakScoreInput, setSpeakScoreInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [itemReviewStatus, setItemReviewStatus] = useState<Record<string, 'Chưa chấm' | 'Đúng' | 'Sai' | 'Cần sửa'>>({});
  const [gradingViewMode, setGradingViewMode] = useState<'incorrect' | 'teacher_review'>('incorrect');
  const [modalCorrectedImages, setModalCorrectedImages] = useState<string[]>([]);
  const [isUploadingCorrected, setIsUploadingCorrected] = useState(false);
  const [uploadingFeedbackAudio, setUploadingFeedbackAudio] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [pendingDeleteSubmissionId, setPendingDeleteSubmissionId] = useState<string | null>(null);

  // All Available Exams
  const rawExams = buildExamCatalog(customExams, SAMPLE_EXAMS);
  const allExams = rawExams.filter((e) => !deletedExamIds.includes(e.id));
  const examGroups = groupExamsForSelection(allExams);
  const { allExams: studentCatalogExams } = useStudentExamCatalog(customExams, deletedExamIds);
  const studentExamGroups = useMemo(() => groupExamsForSelection(studentCatalogExams), [studentCatalogExams]);
  const studentExamOptions = useMemo(() => {
    const groups = lessonLevelFilter === 'ALL'
      ? studentExamGroups
      : studentExamGroups.filter((group) => group.label === lessonLevelFilter);
    const seenTitles = new Set<string>();

    return groups.flatMap((group) => group.exams).filter((exam) => {
      if (seenTitles.has(exam.title)) return false;
      seenTitles.add(exam.title);
      return true;
    });
  }, [lessonLevelFilter, studentExamGroups]);

  useEffect(() => {
    if (lessonFilter !== 'ALL' && !studentExamOptions.some((exam) => exam.title === lessonFilter)) {
      setLessonFilter('ALL');
    }
  }, [lessonFilter, studentExamOptions]);

  // Delete Confirm & Notice state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Exam Selection for Editing
  const initialExam = sanitizeExamSections(allExams[0] || SAMPLE_EXAMS[0]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExam?.id || 'hsk3-b1');
  const initialEditingExam: ExamLesson = {
    ...initialExam,
    vocabList: initialExam?.vocabList || [],
    mcQuestions: initialExam?.mcQuestions || [],
    fillQuestions: initialExam?.fillQuestions || [],
    arrangeQuestions: initialExam?.arrangeQuestions || [],
    listeningQuestions: initialExam?.listeningQuestions || [],
    essayQuestions: initialExam?.essayQuestions || [],
    speakingQuestions: initialExam?.speakingQuestions || [],
    translationQuestions: initialExam?.translationQuestions || []
  };
  const [editingHistory, setEditingHistory] = useState<HistoryState<ExamLesson>>(() => ({
    past: [],
    present: initialEditingExam,
    future: []
  }));
  const editingExam = editingHistory.present;
  const setEditingExam = (next: ExamLesson | ((current: ExamLesson) => ExamLesson)) => {
    setEditingHistory((current) => {
      const nextExam = typeof next === 'function' ? next(current.present) : next;
      if (JSON.stringify(current.present) === JSON.stringify(nextExam)) return current;
      return {
        past: [...current.past, cloneExam(current.present)].slice(-MAX_LESSON_HISTORY),
        present: cloneExam(nextExam),
        future: []
      };
    });
  };
  const replaceEditingExam = (nextExam: ExamLesson) => {
    setEditingHistory({ past: [], present: cloneExam(nextExam), future: [] });
  };
  const updateExamTimeLimit = (enabled: boolean, minutes?: number) => {
    setEditingExam((current) => {
      const nextMinutes = enabled
        ? (minutes === undefined ? (current.timeLimitMinutes || 45) : minutes)
        : 0;
      const nextExam: ExamLesson = {
        ...current,
        timeLimitEnabled: enabled,
        timeLimitMinutes: nextMinutes
      };

      if (!current.sourceLessonData) return nextExam;

      return {
        ...nextExam,
        sourceLessonData: {
          ...current.sourceLessonData,
          lesson: {
            ...current.sourceLessonData.lesson,
            timeLimitEnabled: enabled,
            timeLimitMinutes: nextMinutes
          }
        }
      };
    });
  };
  const undoEditingExam = () => {
    setEditingHistory((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: cloneExam(previous),
        future: [cloneExam(current.present), ...current.future].slice(0, MAX_LESSON_HISTORY)
      };
    });
  };
  const redoEditingExam = () => {
    setEditingHistory((current) => {
      if (current.future.length === 0) return current;
      const [next, ...remainingFuture] = current.future;
      return {
        past: [...current.past, cloneExam(current.present)].slice(-MAX_LESSON_HISTORY),
        present: cloneExam(next),
        future: remainingFuture
      };
    });
  };

  useEffect(() => {
    if (activeTab !== 'editor') return;

    const handleLessonHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.matches('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      const modifierPressed = event.metaKey || event.ctrlKey;
      if (!modifierPressed || event.altKey) return;

      const key = event.key.toLowerCase();
      const wantsUndo = key === 'z' && !event.shiftKey;
      const wantsRedo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey);

      if (wantsUndo && editingHistory.past.length > 0) {
        event.preventDefault();
        undoEditingExam();
      } else if (wantsRedo && editingHistory.future.length > 0) {
        event.preventDefault();
        redoEditingExam();
      }
    };

    window.addEventListener('keydown', handleLessonHistoryShortcut);
    return () => window.removeEventListener('keydown', handleLessonHistoryShortcut);
  }, [activeTab, editingHistory.future.length, editingHistory.past.length]);

  // New Vocab Form state
  const [newHanzi, setNewHanzi] = useState('');
  const [newPinyin, setNewPinyin] = useState('');
  const [newType, setNewType] = useState('Danh từ');
  const [newMeaning, setNewMeaning] = useState('');

  // New Question Form state
  const [newMcPrompt, setNewMcPrompt] = useState('');
  const [newMcPinyin, setNewMcPinyin] = useState('');
  const [newMcOptA, setNewMcOptA] = useState('');
  const [newMcOptB, setNewMcOptB] = useState('');
  const [newMcOptC, setNewMcOptC] = useState('');
  const [newMcOptD, setNewMcOptD] = useState('');
  const [newMcCorrect, setNewMcCorrect] = useState(0);

  // New Fill Question state
  const [newFillPrompt, setNewFillPrompt] = useState('');
  const [newFillAnswer, setNewFillAnswer] = useState('');
  const [newFillWordBank, setNewFillWordBank] = useState('');

  // New Sentence Arrangement Question state
  const [newArrPrompt, setNewArrPrompt] = useState('');
  const [newArrChips, setNewArrChips] = useState('');
  const [newArrAnswer, setNewArrAnswer] = useState('');

  // New Essay Question state
  const [newEssayPrompt, setNewEssayPrompt] = useState('');
  const [newEssayAnswer, setNewEssayAnswer] = useState('');
  const [newEssayImageUrl, setNewEssayImageUrl] = useState('');

  // New Speaking Question state
  const [newSpeakingType, setNewSpeakingType] = useState<'speaking' | 'speaking_record'>('speaking');
  const [newSpeakingPrompt, setNewSpeakingPrompt] = useState('');
  const [newSpeakingPinyin, setNewSpeakingPinyin] = useState('');
  const [newSpeakingItems, setNewSpeakingItems] = useState('');
  const [newSpeakingImageUrl, setNewSpeakingImageUrl] = useState('');

  // New Translation Question state
  const [newTransType, setNewTransType] = useState<'vi_to_zh_audio' | 'vi_to_zh_text' | 'zh_to_vi_text'>('vi_to_zh_audio');
  const [newTransPrompt, setNewTransPrompt] = useState('');
  const [newTransPinyin, setNewTransPinyin] = useState('');
  const [newTransSuggestedAnswer, setNewTransSuggestedAnswer] = useState('');

  // New Listening Question state
  const [newListenType, setNewListenType] = useState<'listening_multiple_choice' | 'listening_true_false' | 'listening_fill' | 'listening_mc' | 'listening_tf'>('listening_multiple_choice');
  const [newListenParentId, setNewListenParentId] = useState('');
  const [newListenPrompt, setNewListenPrompt] = useState('');
  const [newListenPinyin, setNewListenPinyin] = useState('');
  const [newListenAudioUrl, setNewListenAudioUrl] = useState('');
  const [newListenOptA, setNewListenOptA] = useState('');
  const [newListenOptB, setNewListenOptB] = useState('');
  const [newListenOptC, setNewListenOptC] = useState('');
  const [newListenOptD, setNewListenOptD] = useState('');
  const [newListenFillAnswer, setNewListenFillAnswer] = useState('');
  const [newListenCorrectMc, setNewListenCorrectMc] = useState(0);
  const [newListenCorrectTf, setNewListenCorrectTf] = useState(0);
  const [newListenExplanation, setNewListenExplanation] = useState('');

  // New Reading Passage state
  const [selectedReadingPassageId, setSelectedReadingPassageId] = useState('');
  const [newReadingTitle, setNewReadingTitle] = useState('');
  const [newReadingContent, setNewReadingContent] = useState('');
  const [newReadingQuestionPrompt, setNewReadingQuestionPrompt] = useState('');
  const [newReadingOptA, setNewReadingOptA] = useState('');
  const [newReadingOptB, setNewReadingOptB] = useState('');
  const [newReadingOptC, setNewReadingOptC] = useState('');
  const [newReadingOptD, setNewReadingOptD] = useState('');
  const [newReadingCorrect, setNewReadingCorrect] = useState(0);
  const [editingReadingPassageId, setEditingReadingPassageId] = useState<string | null>(null);
  const [editingReadingTitle, setEditingReadingTitle] = useState('');
  const [editingReadingContent, setEditingReadingContent] = useState('');

  // Editing Modal state for questions
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingReadingQuestion, setEditingReadingQuestion] = useState<{ passageId: string; questionId: string } | null>(null);

  const handleSaveEditQuestion = (updatedQ: Question) => {
    if (!editingExam) return;

    if (editingReadingQuestion) {
      const updatedPassages = (editingExam.readingPassages || []).map((passage) =>
        passage.id === editingReadingQuestion.passageId
          ? {
              ...passage,
              questions: passage.questions.map((question) =>
                question.id === editingReadingQuestion.questionId ? updatedQ : question
              )
            }
          : passage
      );
      const updatedExam = { ...editingExam, readingPassages: updatedPassages };
      setEditingExam(updatedExam);
      if (onSaveCustomExam) onSaveCustomExam(updatedExam);
      setEditingReadingQuestion(null);
      return;
    }

    const listeningWithUpdatedSubQuestion = (editingExam.listeningQuestions || []).map((parent) => {
      if (!parent.subQuestions?.some((subQuestion) => subQuestion.id === updatedQ.id)) return parent;
      return {
        ...parent,
        subQuestions: parent.subQuestions.map((subQuestion) =>
          subQuestion.id === updatedQ.id
            ? { ...updatedQ, audioUrl: undefined, audioPromptUrl: undefined }
            : subQuestion
        )
      };
    });
    if (listeningWithUpdatedSubQuestion.some((parent, index) => parent !== editingExam.listeningQuestions?.[index])) {
      const updatedExam = { ...editingExam, listeningQuestions: listeningWithUpdatedSubQuestion };
      setEditingExam(updatedExam);
      if (onSaveCustomExam) onSaveCustomExam(updatedExam);
      return;
    }

    const questionToSave = updatedQ.subQuestions?.length
      ? {
          ...updatedQ,
          options: undefined,
          answer: undefined,
          acceptableAnswers: undefined,
          suggestedAnswer: undefined
        }
      : updatedQ;
    const updatedExam = { ...editingExam };

    const removeQ = (arr?: Question[]) => arr?.filter((q) => q.id !== updatedQ.id);
    const type = questionToSave.type;

    updatedExam.mcQuestions = removeQ(updatedExam.mcQuestions) || [];
    updatedExam.fillQuestions = removeQ(updatedExam.fillQuestions);
    updatedExam.arrangeQuestions = removeQ(updatedExam.arrangeQuestions);
    updatedExam.listeningQuestions = removeQ(updatedExam.listeningQuestions);
    updatedExam.essayQuestions = removeQ(updatedExam.essayQuestions) || [];
    updatedExam.speakingQuestions = removeQ(updatedExam.speakingQuestions) || [];
    updatedExam.translationQuestions = removeQ(updatedExam.translationQuestions);

    if (type === 'mc') {
      updatedExam.mcQuestions = [...updatedExam.mcQuestions, questionToSave];
    } else if (type === 'fill') {
      updatedExam.fillQuestions = [...(updatedExam.fillQuestions || []), questionToSave];
    } else if (type === 'arrange') {
      updatedExam.arrangeQuestions = [...(updatedExam.arrangeQuestions || []), questionToSave];
    } else if (
      type === 'listening_mc' ||
      type === 'listening_tf' ||
      type === 'listening_multiple_choice' ||
      type === 'listening_true_false'
    ) {
      updatedExam.listeningQuestions = [...(updatedExam.listeningQuestions || []), questionToSave];
    } else if (type === 'essay') {
      updatedExam.essayQuestions = [...updatedExam.essayQuestions, questionToSave];
    } else if (type === 'speaking' || type === 'speaking_record') {
      updatedExam.speakingQuestions = [...updatedExam.speakingQuestions, questionToSave];
    } else if (type === 'translation') {
      updatedExam.translationQuestions = [...(updatedExam.translationQuestions || []), questionToSave];
    } else {
      updatedExam.mcQuestions = [...updatedExam.mcQuestions, questionToSave];
    }

    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const handleEditVocabItem = (idx: number) => {
    if (!editingExam?.vocabList) return;
    const item = editingExam.vocabList[idx];
    setNewHanzi(item.hanzi);
    setNewPinyin(item.pinyin);
    setNewType(item.type || 'Từ');
    setNewMeaning(item.meaning);
    handleDeleteVocabItem(idx);
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (res) {
        const uploadedUrl = await uploadMediaFile(res, file.name, file.type);
        setNewListenAudioUrl(uploadedUrl || res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEssayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (res) {
        const uploadedUrl = await uploadMediaFile(res, file.name, file.type);
        setNewEssayImageUrl(uploadedUrl || res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSpeakingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (res) {
        const uploadedUrl = await uploadMediaFile(res, file.name, file.type);
        setNewSpeakingImageUrl(uploadedUrl || res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddListenQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListenPrompt.trim()) {
      alert('Vui lòng nhập câu hỏi hoặc yêu cầu cho bài nghe.');
      return;
    }

    let options: string[] | undefined = undefined;
    let answerVal: number | string | undefined = undefined;
    let acceptableVal: string | undefined = undefined;

    if (newListenType === 'listening_mc' || newListenType === 'listening_multiple_choice') {
      if (!newListenOptA.trim() || !newListenOptB.trim()) {
        alert('Vui lòng nhập ít nhất 2 lựa chọn A và B cho bài nghe chọn đáp án.');
        return;
      }
      options = [newListenOptA.trim(), newListenOptB.trim()];
      if (newListenOptC.trim()) options.push(newListenOptC.trim());
      if (newListenOptD.trim()) options.push(newListenOptD.trim());
      answerVal = newListenCorrectMc;
    } else if (newListenType === 'listening_tf' || newListenType === 'listening_true_false') {
      options = ['Đúng (正确)', 'Sai (错误)'];
      answerVal = newListenCorrectTf;
    } else if (newListenType === 'listening_fill') {
      options = undefined;
      acceptableVal = newListenFillAnswer.trim() || undefined;
      answerVal = newListenFillAnswer.trim() || undefined;
    }

    const newQ: Question = {
      id: `listen_${Date.now()}`,
      type: newListenType,
      tier: 'tier2',
      prompt: newListenPrompt.trim(),
      pinyin: newListenPinyin.trim() || undefined,
      audioUrl: newListenAudioUrl.trim() || undefined,
      audioPromptUrl: newListenAudioUrl.trim() || undefined,
      options: options,
      answer: answerVal,
      acceptableAnswers: acceptableVal,
      suggestedAnswer: acceptableVal,
      explanation: newListenExplanation.trim() || undefined
    };

    let updatedListen = [...(editingExam.listeningQuestions || [])];
    if (newListenParentId) {
      const parent = updatedListen.find((question) => question.id === newListenParentId);
      if (!parent) {
        alert('Bài nghe dùng chung không còn tồn tại. Vui lòng chọn lại.');
        setNewListenParentId('');
        return;
      }

      const existingSubQuestions = parent.subQuestions?.length
        ? parent.subQuestions
        : (() => {
            return [{
              ...parent,
              id: `${parent.id}_q1`,
              audioUrl: undefined,
              audioPromptUrl: undefined,
              questions: undefined,
              subQuestions: undefined
            }];
          })();
      const sharedAudioUrl = newListenAudioUrl.trim() || parent.audioUrl || parent.audioPromptUrl || undefined;
      const childQuestion: Question = {
        ...newQ,
        audioUrl: undefined,
        audioPromptUrl: undefined
      };

      updatedListen = updatedListen.map((question) =>
        question.id === newListenParentId
          ? {
              ...question,
              audioUrl: sharedAudioUrl,
              audioPromptUrl: sharedAudioUrl,
              options: undefined,
              answer: undefined,
              acceptableAnswers: undefined,
              suggestedAnswer: undefined,
              subQuestions: [...existingSubQuestions, childQuestion]
            }
          : question
      );
    } else {
      updatedListen.push(newQ);
    }

    const updatedExam = { ...editingExam, listeningQuestions: updatedListen };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewListenPrompt('');
    setNewListenPinyin('');
    if (!newListenParentId) setNewListenAudioUrl('');
    setNewListenOptA('');
    setNewListenOptB('');
    setNewListenOptC('');
    setNewListenOptD('');
    setNewListenFillAnswer('');
    setNewListenExplanation('');
  };

  const handleDeleteListenQuestion = (qId: string) => {
    const updatedListen = (editingExam.listeningQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, listeningQuestions: updatedListen };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
    if (newListenParentId === qId) setNewListenParentId('');
  };

  const handleSelectListeningParent = (parentId: string) => {
    setNewListenParentId(parentId);
    const parent = (editingExam.listeningQuestions || []).find((question) => question.id === parentId);
    setNewListenAudioUrl(parent?.audioUrl || parent?.audioPromptUrl || '');
    if (parentId) {
      requestAnimationFrame(() => {
        document.getElementById('listening-question-editor-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passwordInput.trim()) {
      setAuthError('Vui lòng nhập mật khẩu giáo viên');
      return;
    }
    if (passwordInput.trim() === config.teacherPass || passwordInput.trim() === 'tbtt123' || passwordInput.trim() === 'gv123') {
      setIsAuthenticated(true);
      loadSubmissions(passwordInput.trim());
    } else {
      setAuthError('Mật khẩu không chính xác.');
    }
  };

  const loadSubmissions = async (pass: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setDeleteNotice(null);
    const res = await fetchTeacherSubmissions(pass);
    if (res.ok && res.rows) {
      setSubmissions(res.rows);
    } else {
      setSubmissions([]);
      setErrorMsg(res.error || 'Không thể lấy dữ liệu bài nộp');
    }
    setIsLoading(false);
  };

  const handleDeleteSubmission = async (sub: SubmissionData) => {
    const idsToDelete = Array.from(new Set([sub.id, ...(sub.duplicateIds || [])]));

    setDeletingSubmissionId(sub.id);
    const result = await deleteSubmissionsInGas(idsToDelete, passwordInput || config.teacherPass);
    if (result.ok) {
      setSubmissions((current) => current.filter((item) => !idsToDelete.includes(item.id)));
      setSelectedSub((current) => (current?.id === sub.id ? null : current));
      setDeleteNotice(`Đã xoá bài ${sub.status === 'Đã chấm' ? 'đã chấm' : 'chưa chấm'} của ${sub.name || 'học sinh'}.`);
    } else {
      alert(result.error || 'Không thể xoá bài nộp.');
    }
    setDeletingSubmissionId(null);
    setPendingDeleteSubmissionId(null);
  };

  const openGradingModal = (sub: SubmissionData) => {
    const hwList = getHandwritingSubmissions();
    const matchedHw = hwList.find(
      (h) => h.id === sub.id || (h.studentName.toLowerCase() === sub.name.toLowerCase() && h.exerciseTitle === sub.lesson)
    );

    const isHandwritingSub =
      sub.isHandwriting ||
      (sub.submissionImages && sub.submissionImages.length > 0) ||
      (sub.essays && (sub.essays.includes('[Nộp bài chép tay]') || sub.essays.includes('chép'))) ||
      sub.lesson.toLowerCase().includes('chép') ||
      sub.lesson.toLowerCase().includes('nộp ảnh') ||
      !!matchedHw;

    if (isHandwritingSub) {
      const imagesToUse =
        sub.submissionImages && sub.submissionImages.length > 0
          ? sub.submissionImages
          : matchedHw?.submissionImages || [];

      const hwSub: HandwritingSubmission = {
        id: sub.id || matchedHw?.id || `hw_${Date.now()}`,
        exerciseId: sub.exerciseId || matchedHw?.exerciseId || sub.id,
        exerciseTitle: sub.lesson,
        studentName: sub.name,
        studentClass: sub.class,
        submissionImages: imagesToUse,
        status: sub.status === 'Đã chấm' || matchedHw?.status === 'graded' ? 'graded' : 'submitted',
        submittedAt: sub.submittedAt || matchedHw?.submittedAt || sub.time || new Date().toISOString(),
        correctedImages: sub.correctedImages || matchedHw?.correctedImages || [],
        teacherComment: sub.teacherComment || sub.comment || matchedHw?.teacherComment || '',
        gradedAt: sub.gradedAt || matchedHw?.gradedAt
      };
      setSelectedHwSub(hwSub);
      return;
    }
    setSelectedSub(sub);
    setSpeakScoreInput(String(sub.speakScore || ''));
    const storedReviewMetadata = parseTeacherItemMetadata(sub.comment || sub.teacherComment || '');
    const submissionExam = allExams.find((exam) => exam.id === sub.lesson || matchesCatalogLessonTitle(sub.lesson, exam.title));
    const legacyCommentKeyMap = new Map<string, string>();
    (submissionExam?.essayQuestions || []).forEach((question, index) => {
      legacyCommentKeyMap.set(`Tự luận C${index + 1}`.toLocaleLowerCase(), question.id);
    });
    getExamAudioQuestions(submissionExam).forEach((question, index) => {
      legacyCommentKeyMap.set(`Ghi âm C${index + 1}`.toLocaleLowerCase(), question.id);
    });
    const stableItemComments = Object.entries(storedReviewMetadata.comments).reduce<Record<string, string>>((comments, [key, value]) => {
      comments[legacyCommentKeyMap.get(key.toLocaleLowerCase()) || key] = value;
      return comments;
    }, {});
    setCommentInput(stripTeacherReviewMetadata(sub.comment || sub.teacherComment || ''));
    setItemComments(stableItemComments);
    setItemReviewStatus(storedReviewMetadata.statuses);
    setGradingViewMode('incorrect');
    setModalCorrectedImages(sub.correctedImages || matchedHw?.correctedImages || []);
    setGradeSuccess(false);
  };

  const handleCorrectedUploadInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingCorrected(true);
    try {
      const newImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await fileToCompressedDataUrl(files[i]);
        const uploadedUrl = await uploadMediaFile(compressed, files[i].name, files[i].type, 'correction');
        newImgs.push(uploadedUrl || compressed);
      }
      setModalCorrectedImages((prev) => [...prev, ...newImgs]);
    } catch (err) {
      console.error('Lỗi khi tải ảnh chữa:', err);
      alert('Không thể tải ảnh chữa. Vui lòng thử lại.');
    } finally {
      setIsUploadingCorrected(false);
      e.target.value = '';
    }
  };

  const getAudioRecordsForFeedback = (sub: SubmissionData): AudioRecordItem[] => {
    if (sub.audios && sub.audios.length > 0) return sub.audios;
    return (sub.driveLinks || '')
      .split('\n')
      .filter(Boolean)
      .map((link, index) => ({
        label: getAudioLinkLabel(link, `Ghi âm câu ${index + 1}`),
        data: '',
        mime: 'audio/webm',
        url: getDriveAudioPlayerUrl(link)
      }));
  };

  const handleTeacherFeedbackRecorded = async (audioIndex: number, record: AudioRecordItem | null, questionId?: string) => {
    if (!selectedSub || !record) return;

    const feedbackKey = `audio_${questionId || audioIndex}`;
    setUploadingFeedbackAudio(feedbackKey);
    try {
      const dataUrl = record.data.startsWith('data:')
        ? record.data
        : `data:${record.mime || 'audio/webm'};base64,${record.data}`;
      const extension = record.mime.includes('mpeg') ? 'mp3' : record.mime.includes('mp4') ? 'm4a' : 'webm';
      const uploadedUrl = await uploadMediaFile(
        dataUrl,
        `giao_vien_chua_${selectedSub.id}_${questionId || audioIndex + 1}.${extension}`,
        record.mime || 'audio/webm',
        'correction'
      );

      if (!uploadedUrl) throw new Error('Không nhận được liên kết file chữa');

      const currentAudios = getAudioRecordsForFeedback(selectedSub);
      const hasTargetAudio = currentAudios.some((audio, index) => (
        questionId ? audio.questionId === questionId || index === audioIndex : index === audioIndex
      ));
      const updatedAudios = currentAudios.map((audio, index) =>
        (questionId ? audio.questionId === questionId || index === audioIndex : index === audioIndex)
          ? {
              ...audio,
              teacherFeedbackUrl: uploadedUrl,
              teacherFeedbackLabel: 'Ghi âm chữa phát âm của giáo viên'
            }
          : audio
      );
      if (questionId && !hasTargetAudio) {
        updatedAudios.push({
          questionId,
          label: `Ghi âm chữa cho ${questionId}`,
          data: '',
          mime: record.mime || 'audio/webm',
          teacherFeedbackUrl: uploadedUrl,
          teacherFeedbackLabel: 'Ghi âm chữa phát âm của giáo viên'
        });
      }
      const updatedSub: SubmissionData = { ...selectedSub, audios: updatedAudios };

      setSelectedSub(updatedSub);
      setSubmissions((prev) => prev.map((item) => (item.id === updatedSub.id ? updatedSub : item)));
      // Keep a local copy and sync the shared server immediately. The GAS marker is
      // written when the teacher presses "Lưu Điểm Chấm & Nhận Xét" below.
      saveLocalSubmission(updatedSub);
    } catch (error) {
      console.error('Lỗi khi lưu file chữa phát âm:', error);
      alert('Không thể lưu file chữa phát âm. Vui lòng thử lại.');
    } finally {
      setUploadingFeedbackAudio(null);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsGrading(true);

    const itemFeedbackParts = Object.entries(itemComments)
      .map(([key, val]) => [key, String(val || '').trim()] as [string, string])
      .filter(([_, valStr]) => valStr.length > 0)
      .map(([key, valStr]) => {
        let label = key;
        if (key.startsWith('essay_')) {
          label = `Tự luận C${Number(key.replace('essay_', '')) + 1}`;
        } else if (key.startsWith('audio_')) {
          label = `Ghi âm C${Number(key.replace('audio_', '')) + 1}`;
        }
        return `[${label}]: ${valStr}`;
      });

    const finalComment = [
      ...itemFeedbackParts,
      ...Object.entries(itemReviewStatus)
        .map(([key, status]) => `[Đánh giá ${key}: ${status}]`),
      stripTeacherReviewMetadata(commentInput)
    ].filter(Boolean).join(' | ');

    const res = await gradeSubmissionInGas(
      selectedSub.id,
      speakScoreInput,
      finalComment,
      passwordInput || config.teacherPass,
      modalCorrectedImages,
      selectedSub.audios
    );

    if (res.ok) {
      setGradeSuccess(true);
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === selectedSub.id
            ? {
                ...item,
                speakScore: speakScoreInput,
                comment: finalComment,
                teacherComment: finalComment,
                correctedImages: modalCorrectedImages,
                status: 'Đã chấm'
              }
            : item
        )
      );
      setSelectedSub((prev) =>
        prev
          ? {
              ...prev,
              speakScore: speakScoreInput,
              comment: finalComment,
              teacherComment: finalComment,
              correctedImages: modalCorrectedImages,
              status: 'Đã chấm'
            }
          : null
      );
    } else {
      alert(res.error || 'Không thể lưu điểm chấm');
    }
    setIsGrading(false);
  };

  const persistExamSnapshot = async (exam: ExamLesson): Promise<boolean> => {
    if (!onSaveCustomExam) return true;

    const saved = await onSaveCustomExam(sanitizeExamSections(exam));
    if (saved === false) {
      alert('Bài đã cập nhật ở máy này nhưng chưa đồng bộ được lên Apps Script. Vui lòng kiểm tra cấu hình Google Sheet rồi lưu lại.');
      return false;
    }
    return true;
  };

  // Save changes to current exam
  const handleSaveExamChanges = async () => {
    let examToSave = editingExam;

    if (editingExam.sourceLessonData) {
      const validation = validateLesson(JSON.stringify(editingExam.sourceLessonData));
      if (!validation.isValid || !validation.parsedData) {
        alert(`Không thể lưu JSON bài học:\n${validation.errors.map((error) => `${error.path}: ${error.message}`).join('\n')}`);
        return;
      }
      examToSave = parseLessonToExam(validation.parsedData);
      setEditingExam(examToSave);
    }

    if (examToSave.timeLimitEnabled === false) {
      examToSave = { ...examToSave, timeLimitMinutes: 0 };
    }

    if (!examToSave.title) {
      alert('Vui lòng nhập Tên bài thi');
      return;
    }

    if (onSaveCustomExam) {
      const saved = await persistExamSnapshot(examToSave);
      if (!saved) return;
      alert(`Đã lưu thành công bài thi: "${examToSave.title}"! Học sinh có thể làm bài ngay.`);
    }
  };

  const validateSourceLessonData = (nextValue: Record<string, unknown>): string | null => {
    const validation = validateLesson(JSON.stringify(nextValue));
    if (validation.isValid) return null;
    return validation.errors.map((error) => `${error.path}: ${error.message}`).join(' | ');
  };

  const handleSourceLessonDataChange = (nextValue: Record<string, unknown>) => {
    const nextSource = nextValue as LessonData;
    const validation = validateLesson(JSON.stringify(nextSource));

    if (validation.isValid && validation.parsedData) {
      setEditingExam(parseLessonToExam(validation.parsedData));
      return;
    }

    // Keep an in-progress nested edit visible until the teacher completes the required fields.
    setEditingExam((current) => ({ ...current, sourceLessonData: nextSource }));
  };

  // Add Vocabulary Item
  const handleAddVocabItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHanzi.trim() || !newMeaning.trim()) {
      alert('Vui lòng điền chữ Hán và nghĩa tiếng Việt.');
      return;
    }
    const newItem: VocabItem = {
      hanzi: newHanzi.trim(),
      pinyin: newPinyin.trim(),
      type: newType,
      meaning: newMeaning.trim()
    };

    const updatedVocab = [...(editingExam.vocabList || []), newItem];
    const updatedExam = { ...editingExam, vocabList: updatedVocab };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewHanzi('');
    setNewPinyin('');
    setNewMeaning('');
  };

  const handleDeleteVocabItem = (idx: number) => {
    if (editingExam.vocabList) {
      const updatedVocab = [...editingExam.vocabList];
      updatedVocab.splice(idx, 1);
      const updatedExam = { ...editingExam, vocabList: updatedVocab };
      setEditingExam(updatedExam);
      if (onSaveCustomExam) onSaveCustomExam(updatedExam);
    }
  };

  // Add MC Question
  const handleAddMcQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcPrompt.trim() || !newMcOptA.trim() || !newMcOptB.trim()) {
      alert('Vui lòng nhập đề bài và ít nhất 2 lựa chọn đáp án.');
      return;
    }
    const opts = [newMcOptA.trim(), newMcOptB.trim()];
    if (newMcOptC.trim()) opts.push(newMcOptC.trim());
    if (newMcOptD.trim()) opts.push(newMcOptD.trim());

    const newQ: Question = {
      id: `mc_${Date.now()}`,
      type: 'mc',
      tier: 'tier1',
      prompt: newMcPrompt.trim(),
      pinyin: newMcPinyin.trim() || undefined,
      options: opts,
      answer: newMcCorrect
    };

    const updatedMc = [...(editingExam.mcQuestions || []), newQ];
    const updatedExam = { ...editingExam, mcQuestions: updatedMc };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewMcPrompt('');
    setNewMcPinyin('');
    setNewMcOptA('');
    setNewMcOptB('');
    setNewMcOptC('');
    setNewMcOptD('');
  };

  const handleDeleteMcQuestion = (qId: string) => {
    const updatedMc = (editingExam.mcQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, mcQuestions: updatedMc };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  // Add Fill Question
  const handleAddFillQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFillPrompt.trim() || !newFillAnswer.trim()) {
      alert('Vui lòng nhập câu hỏi và đáp án đúng.');
      return;
    }
    const newQ: Question = {
      id: `f_${Date.now()}`,
      type: 'fill',
      tier: 'tier2',
      prompt: newFillPrompt.trim(),
      acceptableAnswers: newFillAnswer.trim(),
      wordBank: newFillWordBank
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean)
        .filter((word, index, words) => words.indexOf(word) === index)
    };

    const updatedFill = [...(editingExam.fillQuestions || []), newQ];
    const updatedExam = { ...editingExam, fillQuestions: updatedFill };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewFillPrompt('');
    setNewFillAnswer('');
    setNewFillWordBank('');
  };

  const handleDeleteFillQuestion = (qId: string) => {
    const updatedFill = (editingExam.fillQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, fillQuestions: updatedFill };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const fillWordBankGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    const showAnswerOnlyWordBank = /^hsk1-bai(?:6|7|8|9|10|11|12|13|14|15)(?:-|$)/i.test(editingExam.id);
    (editingExam.fillQuestions || []).forEach((question) => {
      const tier = question.tier || 'tier1';
      const words = groups.get(tier) || [];
      const sourceWords = showAnswerOnlyWordBank
        ? [typeof question.answer === 'string' ? question.answer : question.acceptableAnswers?.split('|')[0]]
        : (question.wordBank || []);
      sourceWords.forEach((word) => {
        if (typeof word !== 'string') return;
        const normalizedWord = word.trim();
        if (normalizedWord && !words.includes(normalizedWord)) words.push(normalizedWord);
      });
      groups.set(tier, words);
    });
    return Array.from(groups.entries()).map(([tier, wordBank]) => ({ tier, wordBank }));
  }, [editingExam.id, editingExam.fillQuestions]);

  const handleUpdateFillWordBank = (tier: string, rawWordBank: string) => {
    const wordBank = rawWordBank
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean)
      .filter((word, index, words) => words.indexOf(word) === index);
    const updatedFill = (editingExam.fillQuestions || []).map((question) =>
      (question.tier || 'tier1') === tier ? { ...question, wordBank } : question
    );
    setEditingExam({ ...editingExam, fillQuestions: updatedFill });
  };

  const handleFillWordBankBlur = () => {
    void persistExamSnapshot(editingExam);
  };

  // Add Sentence Arrangement Question
  const handleAddArrQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArrPrompt.trim() || !newArrChips.trim() || !newArrAnswer.trim()) {
      alert('Vui lòng nhập câu hỏi, các thẻ từ (cách nhau bởi dấu phẩy) và đáp án chuẩn.');
      return;
    }
    const chips = newArrChips.split(',').map((s) => s.trim()).filter(Boolean);
    const newQ: Question = {
      id: `arr_${Date.now()}`,
      type: 'arrange',
      tier: 'tier2',
      prompt: newArrPrompt.trim(),
      wordChips: chips,
      acceptableAnswers: newArrAnswer.trim()
    };

    const updatedArr = [...(editingExam.arrangeQuestions || []), newQ];
    const updatedExam = { ...editingExam, arrangeQuestions: updatedArr };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewArrPrompt('');
    setNewArrChips('');
    setNewArrAnswer('');
  };

  const handleDeleteArrQuestion = (qId: string) => {
    const updatedArr = (editingExam.arrangeQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, arrangeQuestions: updatedArr };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  // Add Essay Question
  const handleAddEssayQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEssayPrompt.trim()) {
      alert('Vui lòng nhập đề bài dịch thuật hoặc viết câu.');
      return;
    }
    const newQ: Question = {
      id: `e_${Date.now()}`,
      type: 'essay',
      tier: 'tier3',
      prompt: newEssayPrompt.trim(),
      imageUrl: newEssayImageUrl.trim() || undefined,
      suggestedAnswer: newEssayAnswer.trim() || undefined
    };

    const updatedEssay = [...(editingExam.essayQuestions || []), newQ];
    const updatedExam = { ...editingExam, essayQuestions: updatedEssay };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewEssayPrompt('');
    setNewEssayAnswer('');
    setNewEssayImageUrl('');
  };

  const handleDeleteEssayQuestion = (qId: string) => {
    const updatedEssay = (editingExam.essayQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, essayQuestions: updatedEssay };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  // Add Speaking Question
  const handleAddSpeakingQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeakingPrompt.trim()) {
      alert('Vui lòng nhập đề bài khẩu ngữ phát âm.');
      return;
    }

    const itemsList =
      newSpeakingType === 'speaking_record' && newSpeakingItems.trim()
        ? newSpeakingItems.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

    const newQ: Question = {
      id: `s_${Date.now()}`,
      type: newSpeakingType,
      tier: 'tier3',
      prompt: newSpeakingPrompt.trim(),
      pinyin: newSpeakingPinyin.trim() || undefined,
      imageUrl: newSpeakingImageUrl.trim() || undefined,
      items: itemsList
    };

    const updatedSpeaking = [...(editingExam.speakingQuestions || []), newQ];
    const updatedExam = { ...editingExam, speakingQuestions: updatedSpeaking };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewSpeakingPrompt('');
    setNewSpeakingPinyin('');
    setNewSpeakingItems('');
    setNewSpeakingImageUrl('');
  };

  const handleDeleteSpeakingQuestion = (qId: string) => {
    const updatedSpeaking = (editingExam.speakingQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, speakingQuestions: updatedSpeaking };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  // Add Translation Question
  const handleAddTransQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransPrompt.trim()) {
      alert('Vui lòng nhập câu đề bài dịch thuật.');
      return;
    }
    const newQ: Question = {
      id: `tr_${Date.now()}`,
      type: 'translation',
      translationType: newTransType,
      tier: 'tier3',
      prompt: newTransPrompt.trim(),
      pinyin: newTransPinyin.trim() || undefined,
      suggestedAnswer: newTransSuggestedAnswer.trim() || undefined
    };

    const updatedTrans = [...(editingExam.translationQuestions || []), newQ];
    const updatedExam = { ...editingExam, translationQuestions: updatedTrans };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewTransPrompt('');
    setNewTransPinyin('');
    setNewTransSuggestedAnswer('');
  };

  const handleDeleteTransQuestion = (qId: string) => {
    const updatedTrans = (editingExam.translationQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, translationQuestions: updatedTrans };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const handleAddReadingQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPassage = (editingExam.readingPassages || []).find(
      (passage) => passage.id === selectedReadingPassageId
    );

    if (!selectedPassage && (!newReadingTitle.trim() || !newReadingContent.trim())) {
      alert('Vui lòng nhập tiêu đề và nội dung bài đọc mới.');
      return;
    }
    if (!newReadingQuestionPrompt.trim() || !newReadingOptA.trim() || !newReadingOptB.trim()) {
      alert('Vui lòng nhập câu hỏi đọc và ít nhất 2 lựa chọn đáp án.');
      return;
    }

    const options = [newReadingOptA.trim(), newReadingOptB.trim()];
    if (newReadingOptC.trim()) options.push(newReadingOptC.trim());
    if (newReadingOptD.trim()) options.push(newReadingOptD.trim());

    const readingQuestion: Question = {
      id: `reading_q_${Date.now()}`,
      type: 'mc',
      tier: 'tier2',
      prompt: newReadingQuestionPrompt.trim(),
      options,
      answer: newReadingCorrect
    };

    const updatedPassages: ReadingPassage[] = selectedPassage
      ? (editingExam.readingPassages || []).map((passage) =>
          passage.id === selectedPassage.id
            ? { ...passage, questions: [...passage.questions, readingQuestion] }
            : passage
        )
      : [
          ...(editingExam.readingPassages || []),
          {
            id: `reading_${Date.now()}`,
            title: newReadingTitle.trim(),
            content: newReadingContent.trim(),
            questions: [readingQuestion]
          }
        ];

    const updatedExam = { ...editingExam, readingPassages: updatedPassages };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    if (!selectedPassage) {
      setNewReadingTitle('');
      setNewReadingContent('');
    }
    setNewReadingQuestionPrompt('');
    setNewReadingOptA('');
    setNewReadingOptB('');
    setNewReadingOptC('');
    setNewReadingOptD('');
    setNewReadingCorrect(0);
  };

  const handleDeleteReadingPassage = (passageId: string) => {
    const updatedPassages = (editingExam.readingPassages || []).filter((passage) => passage.id !== passageId);
    const updatedExam = { ...editingExam, readingPassages: updatedPassages };
    setEditingExam(updatedExam);
    if (selectedReadingPassageId === passageId) {
      setSelectedReadingPassageId('');
    }
    if (editingReadingPassageId === passageId) {
      setEditingReadingPassageId(null);
    }
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const handleStartEditingReadingPassage = (passage: ReadingPassage) => {
    setEditingReadingPassageId(passage.id);
    setEditingReadingTitle(passage.title);
    setEditingReadingContent(passage.content);
  };

  const handleCancelEditingReadingPassage = () => {
    setEditingReadingPassageId(null);
    setEditingReadingTitle('');
    setEditingReadingContent('');
  };

  const handleSaveReadingPassage = (passageId: string) => {
    if (!editingReadingTitle.trim() || !editingReadingContent.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung bài đọc.');
      return;
    }

    const updatedPassages = (editingExam.readingPassages || []).map((passage) =>
      passage.id === passageId
        ? { ...passage, title: editingReadingTitle.trim(), content: editingReadingContent.trim() }
        : passage
    );
    const updatedExam = { ...editingExam, readingPassages: updatedPassages };
    setEditingExam(updatedExam);
    handleCancelEditingReadingPassage();
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const handleDeleteReadingQuestion = (passageId: string, questionId: string) => {
    const updatedPassages = (editingExam.readingPassages || []).map((passage) =>
      passage.id === passageId
        ? { ...passage, questions: passage.questions.filter((question) => question.id !== questionId) }
        : passage
    );
    const updatedExam = { ...editingExam, readingPassages: updatedPassages };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
  };

  const getIsHandwritingSubmission = (sub: SubmissionData) =>
    Boolean(
      sub.isHandwriting ||
        (sub.submissionImages && sub.submissionImages.length > 0) ||
        (sub.essays && (sub.essays.includes('[Nộp bài chép tay]') || sub.essays.includes('chép'))) ||
        sub.lesson.toLowerCase().includes('chép') ||
        sub.lesson.toLowerCase().includes('nộp ảnh')
    );

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const normalizedLesson = sub.lesson.trim();
    const isHandwritingSubmission = getIsHandwritingSubmission(sub);
    const selectedLevelGroup = studentExamGroups.find((group) => group.label === lessonLevelFilter);
    const selectedLevelLessonTitles = (selectedLevelGroup?.exams || []).map((exam) => exam.title);
    const matchesLevel =
      lessonLevelFilter === 'ALL' ||
      (lessonLevelFilter === 'Nộp bài viết tay' && isHandwritingSubmission) ||
      selectedLevelLessonTitles.some((title) => matchesCatalogLessonTitle(normalizedLesson, title));
    const matchesLesson =
      lessonFilter === 'ALL' || matchesCatalogLessonTitle(normalizedLesson, lessonFilter);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.name.toLowerCase().includes(q) ||
      sub.class.toLowerCase().includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      sub.lesson.toLowerCase().includes(q);

    return matchesStatus && matchesLevel && matchesLesson && matchesSearch;
  });

  const submissionGroups = Array.from(
    filteredSubmissions
      .reduce<Map<string, SubmissionData[]>>((groups, sub) => {
        const label = sub.lesson.trim() || (getIsHandwritingSubmission(sub) ? 'Bài chép tay' : 'Bài chưa đặt tên');
        const group = groups.get(label) || [];
        group.push(sub);
        groups.set(label, group);
        return groups;
      }, new Map())
      .entries()
  ).sort(([labelA], [labelB]) => labelA.localeCompare(labelB, 'vi'));
  const selectedSubmissionExam = selectedSub
    ? allExams.find((exam) => exam.id === selectedSub.lesson || matchesCatalogLessonTitle(selectedSub.lesson, exam.title))
    : undefined;
  const selectedWrongDetails = parseTeacherWrongDetails(selectedSub?.wrong);
  const visibleSelectedWrongDetails = selectedSubmissionExam
    ? selectedWrongDetails.filter((detail) => !isAcceptedArrangeAnswer(detail, selectedSubmissionExam))
    : selectedWrongDetails;
  const selectedSubmissionMetrics = selectedSub ? getRegradedSubmissionMetrics(selectedSub, allExams) : null;
  const orderedTeacherQuestions = buildOrderedQuestionList(selectedSubmissionExam);
  const orderedQuestionById = new Map(orderedTeacherQuestions.map((item) => [item.questionId, item.question]));

  const getReviewQuestion = (questionId?: string, label?: string): Question | undefined => {
    const questions = selectedSubmissionExam
      ? [
          ...(selectedSubmissionExam.speakingQuestions || []),
          ...(selectedSubmissionExam.translationQuestions || []),
          ...(selectedSubmissionExam.essayQuestions || [])
        ]
      : [];
    if (questionId) {
      const byId = questions.find((question) => question.id === questionId);
      if (byId) return byId;
    }
    const labelText = String(label || '');
    return questions.find((question) => labelText.includes(question.prompt));
  };

  const renderReviewDetails = (question: Question | undefined, showImage = true) => {
    if (!question) return null;
    const reviewKey = question.id;
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs">
        {showImage && question.imageUrl && (
          <img
            src={getDriveMediaPlayerUrl(question.imageUrl)}
            alt={`Hình minh họa câu hỏi ${question.id}`}
            className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
          />
        )}
        <p className="font-bold text-amber-950">Hướng dẫn chấm · {question.id}</p>
        {question.referenceAnswers && (
          <p><span className="font-semibold">Đáp án tham khảo:</span> {question.referenceAnswers.join(' / ')}</p>
        )}
        {question.requiredElements && (
          <p><span className="font-semibold">Ý bắt buộc:</span> {question.requiredElements.join(' · ')}</p>
        )}
        {question.grammarTargets && (
          <p><span className="font-semibold">Ngữ pháp mục tiêu:</span> {question.grammarTargets.join(' · ')}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px] gap-2 items-center pt-1 border-t border-amber-200">
          <label className="font-semibold text-amber-950">Đánh giá câu</label>
          <select
            value={itemReviewStatus[reviewKey] || 'Chưa chấm'}
            onChange={(event) => setItemReviewStatus((prev) => ({ ...prev, [reviewKey]: event.target.value as 'Chưa chấm' | 'Đúng' | 'Sai' | 'Cần sửa' }))}
            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs"
          >
            <option>Chưa chấm</option>
            <option>Đúng</option>
            <option>Sai</option>
            <option>Cần sửa</option>
          </select>
        </div>
      </div>
    );
  };

  const audioReviewQuestions = getExamAudioQuestions(selectedSubmissionExam);
  const getAudioQuestionForRecord = (record: AudioRecordItem | string | undefined, audioIndex: number): Question | undefined => {
    const audioLabel = typeof record === 'string' ? record : String(record?.label || '');
    const taskGroup = typeof record === 'string' ? '' : String(record?.taskGroup || '');
    const questionId = typeof record === 'string' ? undefined : record?.questionId;
    // Stable questionId is authoritative. Labels/prompts and numeric positions
    // are only compatibility fallbacks for submissions created before IDs were
    // persisted with each recording.
    const labeledQuestion = getReviewQuestion(undefined, audioLabel);
    const orderedQuestion = questionId ? orderedQuestionById.get(questionId) : undefined;
    if (orderedQuestion) {
      // Repair old records whose persisted ID was shifted, when the full label
      // still contains an unambiguous prompt for the actual question.
      return labeledQuestion && labeledQuestion.id !== orderedQuestion.id ? labeledQuestion : orderedQuestion;
    }

    const directQuestion = getReviewQuestion(questionId);
    if (directQuestion) {
      return labeledQuestion && labeledQuestion.id !== directQuestion.id ? labeledQuestion : directQuestion;
    }

    if (labeledQuestion) return labeledQuestion;

    const numberMatch = audioLabel.match(/(?:phần\s+nói|dịch\s*(?:nói|&|và)?\s*ghi\s*âm|câu|ghi\s*âm)\s*(?:c)?\s*(\d+)/i);
    const questionNumber = numberMatch ? Number(numberMatch[1]) - 1 : -1;
    if (questionNumber >= 0) {
      const numberedQuestion = audioReviewQuestions.find((question) => {
        const promptNumber = question.prompt.match(/(?:^|\s)Câu\s*(\d+)\s*[.:：-]?/i)?.[1];
        return promptNumber && Number(promptNumber) === questionNumber + 1;
      });
      if (numberedQuestion) return numberedQuestion;

      const isTranslationAudio = /dịch|口译|oral[_\s-]*translation/i.test(`${audioLabel} ${taskGroup}`);
      const candidates = isTranslationAudio
        ? (selectedSubmissionExam?.translationQuestions || []).filter((question) => question.translationType === 'vi_to_zh_audio')
        : (selectedSubmissionExam?.speakingQuestions || []);
      if (candidates[questionNumber]) return candidates[questionNumber];
    }

    return audioReviewQuestions[audioIndex];
  };

  const getAudioQuestionPrompt = (record: AudioRecordItem | string | undefined, audioIndex: number): string => {
    const audioLabel = typeof record === 'string' ? record : String(record?.label || '');
    const question = getAudioQuestionForRecord(record, audioIndex);
    if (question?.prompt) return question.prompt;

    const labelPrompt = audioLabel.match(/:\s*(.+)$/)?.[1]?.trim();
    return labelPrompt || `Câu ${audioIndex + 1}`;
  };

  const getAudioRecordMatch = (question: Question): { audio?: AudioRecordItem; index: number } => {
    const audios = selectedSub ? getAudioRecordsForFeedback(selectedSub) : [];
    const index = audios.findIndex((audio, audioIndex) => (
      audio.questionId === question.id ||
      Boolean(audio.label && question.prompt && audio.label.includes(question.prompt)) ||
      getAudioQuestionForRecord(audio, audioIndex)?.id === question.id
    ));
    return { audio: index >= 0 ? audios[index] : undefined, index };
  };
  const audioRecordsForDisplay = selectedSub ? getAudioRecordsForFeedback(selectedSub) : [];
  const dedupedAudioRecords = (() => {
    const records = new Map<string, { audio: AudioRecordItem; index: number; question?: Question }>();
    audioRecordsForDisplay.forEach((audio, index) => {
      const question = getAudioQuestionForRecord(audio, index);
      const labelKey = String(audio.label || '').trim().toLocaleLowerCase();
      const key = question ? `question:${question.id}` : `label:${labelKey || index}`;
      const existing = records.get(key);
      if (!existing) {
        records.set(key, { audio, index, question });
        return;
      }

      // A submission can contain the same recording twice after student and
      // teacher media were merged. Keep one row and retain whichever fields
      // are present in either record.
      const merged = { ...existing.audio, ...audio };
      if (!audio.data && !audio.url) {
        merged.data = existing.audio.data || '';
        merged.url = existing.audio.url;
      }
      if (!existing.audio.data && !existing.audio.url) {
        merged.data = audio.data || '';
        merged.url = audio.url;
      }
      if (!merged.teacherFeedbackUrl) {
        merged.teacherFeedbackUrl = existing.audio.teacherFeedbackUrl || audio.teacherFeedbackUrl;
      }
      if (!merged.teacherFeedbackLabel) {
        merged.teacherFeedbackLabel = existing.audio.teacherFeedbackLabel || audio.teacherFeedbackLabel;
      }
      const existingHasMedia = Boolean(existing.audio.data || existing.audio.url);
      const currentHasMedia = Boolean(audio.data || audio.url);
      records.set(key, {
        audio: merged,
        index: existingHasMedia || !currentHasMedia ? existing.index : index,
        question: existing.question || question
      });
    });
    return Array.from(records.values());
  })();

  const orderedAudioRecords = dedupedAudioRecords
    .sort((left, right) => {
      const leftOrder = left.question
        ? orderedTeacherQuestions.findIndex((item) => item.questionId === left.question?.id)
        : Number.MAX_SAFE_INTEGER;
      const rightOrder = right.question
        ? orderedTeacherQuestions.findIndex((item) => item.questionId === right.question?.id)
        : Number.MAX_SAFE_INTEGER;
      return (leftOrder < 0 ? Number.MAX_SAFE_INTEGER : leftOrder) - (rightOrder < 0 ? Number.MAX_SAFE_INTEGER : rightOrder)
        || left.index - right.index;
    });

  const snapshotItems = parseAnswerSnapshot(selectedSub?.answerSnapshot || selectedSub?.essays);
  const snapshotById = new Map(snapshotItems.map((item) => [item.id, item]));
  const snapshotByPrompt = new Map(snapshotItems.map((item) => [item.prompt.trim().toLocaleLowerCase(), item]));
  const legacyEssayAnswers = parseLegacyEssayAnswers(selectedSub?.essays);
  const legacyWrongByPrompt = visibleSelectedWrongDetails.reduce<Map<string, TeacherWrongAnswerDetail>>((map, detail) => {
    if (detail.prompt) map.set(detail.prompt.trim().toLocaleLowerCase(), detail);
    return map;
  }, new Map());
  const audioByQuestionId = new Map<string, AudioRecordItem>();
  orderedAudioRecords.forEach(({ audio, question }) => {
    if (question && (audio.data || audio.url || audio.teacherFeedbackUrl)) audioByQuestionId.set(question.id, audio);
  });

  const formatTeacherAnswer = (question: Question, answer: unknown): string => {
    if (answer === undefined || answer === null || answer === '') {
      return question.acceptableAnswers?.split('|')[0]?.trim() || question.referenceAnswers?.[0] || question.suggestedAnswer || '';
    }
    if (typeof answer === 'number' && question.options) {
      return question.options[answer] || `Đáp án ${String.fromCharCode(65 + answer)}`;
    }
    if (question.options && typeof answer === 'string') {
      const option = question.options.find((value) => value === answer || value.startsWith(`${answer}.`));
      if (option) return option;
    }
    return String(answer);
  };

  const getTeacherOptionId = (question: Question, answer: unknown): string => {
    const formatted = formatTeacherAnswer(question, answer).trim();
    const match = formatted.match(/^([A-Z])(?:\s*[.)。：:]|\s*$)/i);
    return match ? match[1].toUpperCase() : '';
  };

  const areTeacherAnswersEquivalent = (question: Question, snapshot?: AnswerSnapshotItem): boolean => {
    const userAnswer = String(snapshot?.userAnswer ?? '').trim();
    const currentCorrectAnswer = getCurrentAnswerCandidates(question)[0] || '';
    const correctAnswer = requiresTeacherReview(question)
      ? String(snapshot?.correctAnswer ?? currentCorrectAnswer).trim()
      : currentCorrectAnswer;
    if (!userAnswer || !correctAnswer) return false;

    const userOptionId = getTeacherOptionId(question, userAnswer);
    const correctOptionId = getTeacherOptionId(question, correctAnswer);
    if (userOptionId && correctOptionId) return userOptionId === correctOptionId;

    return formatTeacherAnswer(question, userAnswer).replace(/\s+/g, '')
      === formatTeacherAnswer(question, correctAnswer).replace(/\s+/g, '');
  };

  const teacherQuestionViews: TeacherQuestionView[] = orderedTeacherQuestions.map((orderedQuestion) => {
    const question = orderedQuestion.question;
    const normalizedPrompt = question.prompt.trim().toLocaleLowerCase();
    const legacyWrong = legacyWrongByPrompt.get(normalizedPrompt);
    const legacyEssay = legacyEssayAnswers.find((item) => {
      const prompt = item.prompt.trim().toLocaleLowerCase();
      return prompt === normalizedPrompt || prompt.includes(normalizedPrompt) || normalizedPrompt.includes(prompt);
    });
    const snapshot = snapshotById.get(question.id) || snapshotByPrompt.get(normalizedPrompt) || (
      legacyWrong
        ? {
            id: question.id,
            section: orderedQuestion.sectionTitle,
            number: orderedQuestion.originalQuestionNumber,
            prompt: question.prompt,
            userAnswer: legacyWrong.userAnswer,
            correctAnswer: legacyWrong.correctAnswer,
            status: 'wrong' as const
          }
        : legacyEssay
          ? {
              id: question.id,
              section: orderedQuestion.sectionTitle,
              number: orderedQuestion.originalQuestionNumber,
              prompt: question.prompt,
              userAnswer: legacyEssay.answer === '(Chưa làm)' ? '' : legacyEssay.answer,
              correctAnswer: question.referenceAnswers?.[0] || question.suggestedAnswer || '',
              status: 'manual' as const
            }
          : undefined
    );
    const audio = audioByQuestionId.get(question.id);
    const attempted = isAttempted(question, snapshot, audio, selectedSub?.submissionImages || []);
    const reviewRequired = requiresTeacherReview(question);
    const incorrect = isIncorrect(snapshot, Boolean(legacyWrong)) && !areTeacherAnswersEquivalent(question, snapshot);
    const referenceAnswer = requiresTeacherReview(question)
      ? snapshot?.correctAnswer ?? getCurrentAnswerCandidates(question)[0]
      : getCurrentAnswerCandidates(question)[0];
    return {
      ...orderedQuestion,
      snapshot,
      answerText: audio
        ? 'Đã ghi âm'
        : formatTeacherAnswer(question, snapshot?.userAnswer),
      correctText: formatTeacherAnswer(question, referenceAnswer),
      audio,
      attempted,
      incorrect,
      reviewRequired,
      legacyWrong
    };
  });

  const incorrectTeacherQuestions = teacherQuestionViews.filter((item) => (
    item.reviewRequired ? item.attempted : item.attempted && item.incorrect
  ));
  // Tab 2 is the complete subjective/manual-review block. Objective wrong
  // questions belong only in the first tab and should not be duplicated here.
  const teacherReviewQuestions = teacherQuestionViews.filter((item) => item.reviewRequired);
  const visibleTeacherQuestions = gradingViewMode === 'incorrect'
    ? incorrectTeacherQuestions
    : teacherReviewQuestions;

  const renderTeacherQuestionCard = (item: TeacherQuestionView) => {
    const question = item.question;
    const audioIndex = orderedAudioRecords.find((entry) => entry.question?.id === item.questionId)?.index ?? -1;
    const audioSrc = item.audio ? getAudioSrcFromObject(item.audio) : '';
    const isAudio = item.reviewRequired && (
      question.type === 'speaking' ||
      question.type === 'speaking_record' ||
      String(question.type || '') === 'pronunciation' ||
      question.translationType === 'vi_to_zh_audio'
    );
    const isStudentAnswerPresent = item.attempted && item.answerText.trim() !== '';
    const selectedOptionId = getTeacherOptionId(question, item.snapshot?.userAnswer);
    const correctOptionId = getTeacherOptionId(
      question,
      requiresTeacherReview(question)
        ? item.snapshot?.correctAnswer ?? getCurrentAnswerCandidates(question)[0]
        : getCurrentAnswerCandidates(question)[0]
    );

    return (
      <article key={item.questionId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <p className="text-sm font-bold text-slate-900">Câu {item.originalQuestionNumber}: {question.prompt}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{item.sectionTitle} · ID: {item.questionId}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            item.reviewRequired
              ? item.attempted ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-600'
              : item.incorrect ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {item.reviewRequired ? (item.attempted ? 'Đã làm' : 'Chưa làm') : (item.incorrect ? 'Sai' : 'Đúng')}
          </span>
        </div>

        {question.imageUrl && (
          <img
            src={getDriveMediaPlayerUrl(question.imageUrl)}
            alt={`Hình minh họa câu ${item.originalQuestionNumber}`}
            className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
          />
        )}

        {question.optionImages && question.optionImages.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">Các hình lựa chọn</p>
            <div className="grid grid-cols-3 gap-2">
              {question.optionImages.map((option) => {
                const selected = selectedOptionId === option.id;
                const correct = correctOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    className={`rounded-lg border-2 bg-white p-2 ${
                      selected && correct
                        ? 'border-emerald-500 bg-emerald-50'
                        : selected
                          ? 'border-rose-400 bg-rose-50'
                          : correct
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={getDriveMediaPlayerUrl(option.url)}
                      alt={option.alt || `Lựa chọn ${option.id}`}
                      className="aspect-[4/3] w-full rounded-md object-contain"
                    />
                    <div className="mt-1 flex items-center justify-between gap-1 text-xs font-bold">
                      <span className="text-slate-800">{option.id}</span>
                      <span className="text-right text-[10px] leading-tight">
                        {selected && <span className="block text-rose-800">HS chọn</span>}
                        {correct && <span className="block text-emerald-800">Đáp án đúng</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAudio ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
            <p className="text-xs font-bold text-indigo-950">Bài làm của học sinh</p>
            {audioSrc ? (
              <audio controls src={audioSrc} className="w-full h-8" />
            ) : (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Chưa ghi âm</p>
            )}
            {item.audio?.teacherFeedbackUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
                <p className="text-xs font-bold text-emerald-900">File chữa phát âm của giáo viên</p>
                <audio controls src={getDriveAudioPlayerUrl(item.audio.teacherFeedbackUrl)} className="w-full h-8" />
              </div>
            )}
          </div>
        ) : item.reviewRequired ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-600">Bài làm của học sinh</p>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isStudentAnswerPresent ? 'text-slate-900' : 'italic text-slate-500'}`}>
              {isStudentAnswerPresent ? item.answerText : 'Chưa làm'}
            </p>
          </div>
        ) : null}

        {!item.reviewRequired && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-bold text-rose-900">Học sinh chọn / nhập</p>
              <p className="mt-1 text-sm text-rose-800">{item.answerText || '—'}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-bold text-emerald-900">Đáp án đúng</p>
              <p className="mt-1 text-sm text-emerald-800">{item.correctText || '—'}</p>
            </div>
          </div>
        )}

        {item.reviewRequired && renderReviewDetails(question, false)}

        <div className="border-t border-slate-200 pt-2 space-y-1">
          <label className="block text-xs font-semibold text-indigo-900">
            {isAudio ? '🎙️ Nhận xét của giáo viên cho bài ghi âm này:' : '💬 Nhận xét của giáo viên cho câu này:'}
          </label>
          <input
            type="text"
            value={itemComments[item.questionId] || ''}
            onChange={(event) => setItemComments((prev) => ({ ...prev, [item.questionId]: event.target.value }))}
            placeholder="Nhập nhận xét riêng cho câu này..."
            className="w-full rounded-lg border border-indigo-300 bg-indigo-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isAudio && (
          <div className="border-t border-indigo-100 pt-2 space-y-2">
            <p className="text-xs font-semibold text-emerald-900">🎙️ Ghi âm lời chữa phát âm cho học sinh:</p>
            {uploadingFeedbackAudio === `audio_${item.questionId}` && (
              <p className="text-[11px] font-semibold text-emerald-700">Đang lưu file chữa lên bộ nhớ dùng chung...</p>
            )}
            <AudioRecorder
              label="Ghi âm mẫu để học sinh nghe lại"
              onAudioRecorded={(record) => void handleTeacherFeedbackRecorded(audioIndex, record, item.questionId)}
            />
          </div>
        )}
      </article>
    );
  };

  const renderUnansweredAudioQuestion = (question: Question, questionIndex: number) => (
    <div key={`unanswered-${question.id}`} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2 shadow-2xs">
      <div className="space-y-1">
        <span className="text-xs font-bold text-indigo-950">Phần nói C{questionIndex + 1}</span>
        <p className="text-sm font-semibold leading-relaxed text-slate-800">Câu hỏi: {question.prompt}</p>
      </div>
      {renderReviewDetails(question)}
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-mono leading-relaxed text-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bài làm của bạn: </span>
        (Chưa làm)
      </div>
      <div className="pt-2 border-t border-indigo-100 space-y-1">
        <label className="block text-xs font-semibold text-indigo-900">
          🎙️ Nhận xét của giáo viên cho bài ghi âm này:
        </label>
        <input
          type="text"
          value={itemComments[`audio_${questionIndex}`] || ''}
          onChange={(event) => setItemComments((prev) => ({ ...prev, [`audio_${questionIndex}`]: event.target.value }))}
          placeholder="Nhập nhận xét riêng cho câu chưa làm..."
          className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-indigo-50/50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg text-center space-y-5">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-700">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">Cổng Dành Cho Giáo Viên</h2>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng nhập mật khẩu giáo viên để xem danh sách bài nộp, nghe ghi âm, chấm điểm và soạn đề bài bằng AI.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu giáo viên</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu..."
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {authError && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl transition cursor-pointer text-sm shadow-md"
          >
            <Unlock className="w-4 h-4" /> Đăng Nhập Giáo Viên
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-red-700" />
              <h2 className="text-xl font-bold text-slate-800">Cổng Quản Lý, Chấm Bài & Quản Lý Giáo Trình</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nghe ghi âm phát âm, chấm điểm bài tập, đưa ra nhận xét và nhập giáo trình bằng file JSON.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadSubmissions(passwordInput)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Tải lại
            </button>
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <List className="w-4 h-4" /> Danh Sách Bài Nộp & Chấm Điểm ({submissions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_json')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'import_json'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-600" /> Nhập Bài Học (Import JSON)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Soạn & Chỉnh Sửa Bài Thi Bằng Tay
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMISSIONS & GRADING */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên học sinh, lớp, mã bài nộp..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={lessonLevelFilter}
                onChange={(e) => {
                  setLessonLevelFilter(e.target.value);
                  setLessonFilter('ALL');
                }}
                aria-label="Cấp bậc / Nhóm bài"
                title="Cấp bậc / Nhóm bài"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                {studentExamGroups.map((group) => (
                  <option key={group.label} value={group.label}>
                    {group.label}
                  </option>
                ))}
              </select>

              <select
                value={lessonFilter}
                onChange={(e) => setLessonFilter(e.target.value)}
                aria-label="Bài học / Đề thi"
                title="Bài học / Đề thi"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer max-w-[22rem]"
              >
                <option value="ALL">Tất cả bài</option>
                {studentExamOptions.map((exam) => (
                  <option key={exam.id} value={exam.title}>
                    {exam.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Chờ chấm">Chờ chấm</option>
                <option value="Đã chấm">Đã chấm</option>
              </select>
            </div>
          </div>

          {deleteNotice && (
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {deleteNotice}
              </span>
              <button
                type="button"
                onClick={() => setDeleteNotice(null)}
                className="p-1 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submissions List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải danh sách bài nộp từ Google Sheet / Hệ thống...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Chưa tìm thấy bài nộp nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <th className="p-3.5">Mã ID</th>
                      <th className="p-3.5">Họ tên & Lớp</th>
                      <th className="p-3.5">Kết quả / Loại bài</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {submissionGroups.map(([groupLabel, groupItems]) => (
                      <React.Fragment key={groupLabel}>
                        <tr className="bg-slate-50 border-y border-slate-200">
                          <td colSpan={5} className="px-3.5 py-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-slate-800">
                                <BookOpen className="w-4 h-4 text-red-700" />
                                <span>{groupLabel}</span>
                                <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  {groupItems.length} bài nộp
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-semibold">
                                <span className="text-amber-700">{groupItems.filter((item) => item.status !== 'Đã chấm').length} chờ chấm</span>
                                <span className="text-emerald-700">{groupItems.filter((item) => item.status === 'Đã chấm').length} đã chấm</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {groupItems.map((sub) => {
                          const isHw = getIsHandwritingSubmission(sub);
                          const isDeleting = deletingSubmissionId === sub.id;
                          const regradedMetrics = isHw ? null : getRegradedSubmissionMetrics(sub, allExams);

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3.5 font-mono font-bold text-red-700">{sub.id}</td>
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-800">{sub.name}</div>
                                <div className="text-xs text-slate-500">Lớp: {sub.class}</div>
                              </td>
                              <td className="p-3.5">
                                {isHw ? (
                                  <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-flex items-center gap-1.5 text-xs w-fit">
                                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> {sub.submissionImages?.length || 1} ảnh bài nộp
                                  </span>
                                ) : (
                                  <div>
                                    {hasPendingAnswerKey(sub, allExams) ? (
                                      <>
                                        <span className="font-bold text-amber-800">Chờ duyệt đáp án</span>
                                        <span className="text-xs text-slate-500 block">({sub.total || 'Toàn bộ'} câu)</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold text-slate-800">
                                          {regradedMetrics?.percent ?? (sub.percent <= 1 && sub.percent > 0 ? Math.round(sub.percent * 100) : sub.percent)}%
                                        </span>
                                        <span className="text-xs text-slate-500 block">({regradedMetrics?.correct ?? sub.correct}/{sub.total} câu)</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5">
                                {sub.status === 'Đã chấm' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" /> Chờ chấm
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {isHw ? (
                                    <button
                                      type="button"
                                      onClick={() => openGradingModal(sub)}
                                      className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5" /> Chấm bài <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openGradingModal(sub)}
                                      className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                      Chấm bài <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {pendingDeleteSubmissionId === sub.id ? (
                                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-900">
                                      <span className="font-semibold">Xác nhận xoá?</span>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteSubmission(sub)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Xoá
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteSubmissionId(null)}
                                        disabled={isDeleting}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
                                      >
                                        Huỷ
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteSubmissionId(sub.id)}
                                      disabled={isDeleting}
                                      title={`Xoá bài ${sub.status === 'Đã chấm' ? 'đã chấm' : 'chưa chấm'}`}
                                      aria-label={`Xoá bài ${sub.status === 'Đã chấm' ? 'đã chấm' : 'chưa chấm'} của ${sub.name}`}
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer"
                                    >
                                      <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT LESSON FROM JSON */}
      {activeTab === 'import_json' && (
        <ImportLesson
          onSaveCustomExam={onSaveCustomExam}
          onImportSuccess={(newExam) => {
            replaceEditingExam(sanitizeExamSections(newExam));
            setNewListenParentId('');
          }}
        />
      )}

      {/* TAB 3: MANUAL EDITOR MODE FOR TEACHER */}
      {activeTab === 'editor' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-700" /> Quản Lý & Chỉnh Sửa Chi Tiết Bài Thi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa từ vựng, bài đọc chọn đáp án, câu hỏi trắc nghiệm, bài điền từ, xếp câu chip, bài dịch và ghi âm phát âm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={undoEditingExam}
                disabled={editingHistory.past.length === 0}
                className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                title="Hoàn tác thay đổi gần nhất (⌘/Ctrl + Z)"
              >
                <Undo2 className="w-4 h-4" /> Hoàn tác
              </button>
              <button
                type="button"
                onClick={redoEditingExam}
                disabled={editingHistory.future.length === 0}
                className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                title="Làm lại thay đổi vừa hoàn tác (⌘/Ctrl + Shift + Z hoặc Ctrl + Y)"
              >
                <Redo2 className="w-4 h-4" /> Làm lại
              </button>
              <button
                type="button"
                onClick={handleSaveExamChanges}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" /> Lưu Bài Thi Này
              </button>
            </div>
          </div>

          {/* Select Exam to Edit or Create New */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 shrink-0">Chọn bài thi cần chỉnh sửa:</label>
              <select
                value={editingExam.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setShowDeleteConfirm(false);
                  setNewListenParentId('');
                  if (selectedId === 'NEW') {
                    const newExam: ExamLesson = {
                      id: `custom_${Date.now()}`,
                      title: 'Bài thi mới tự soạn',
                      level: 'HSK 3',
                      description: 'Mô tả bài thi mới',
                      vocabList: [],
                      mcQuestions: [],
                      fillQuestions: [],
                      arrangeQuestions: [],
                      listeningQuestions: [],
                      readingPassages: [],
                      essayQuestions: [],
                      speakingQuestions: [],
                      translationQuestions: []
                    };
                    replaceEditingExam(newExam);
                  } else {
                    const found = allExams.find((item) => item.id === selectedId);
                    if (found) {
                      const cleanFound = sanitizeExamSections(found);
                      replaceEditingExam({
                        ...cleanFound,
                        vocabList: cleanFound.vocabList || [],
                        mcQuestions: cleanFound.mcQuestions || [],
                        fillQuestions: cleanFound.fillQuestions || [],
                        arrangeQuestions: cleanFound.arrangeQuestions || [],
                        listeningQuestions: cleanFound.listeningQuestions || [],
                        essayQuestions: cleanFound.essayQuestions || [],
                        speakingQuestions: cleanFound.speakingQuestions || [],
                        translationQuestions: cleanFound.translationQuestions || []
                      });
                    }
                  }
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-auto"
              >
                <option value="NEW">+ Tạo bài thi mới</option>
                {examGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editingExam.id !== 'NEW' && (
                <button
                  type="button"
                  onClick={() => {
                    const exportData = editingExam.sourceLessonData || editingExam;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `${editingExam.id || 'bai-thi'}_export.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-lg font-semibold transition border border-indigo-200 cursor-pointer shadow-xs"
                  title="Xuất file JSON bài thi (bao gồm file âm thanh) để mang sang máy khác"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Tải File JSON Bài Thi
                </button>
              )}

              {onDeleteCustomExam && editingExam.id !== 'NEW' && (
                !showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-lg font-semibold transition border border-rose-300 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa bài thi này
                  </button>
                ) : (
                <div className="flex flex-wrap items-center gap-2 bg-rose-50 border border-rose-300 p-2 rounded-lg text-xs font-medium text-rose-900 animate-in fade-in">
                  <span className="font-bold">Xác nhận xóa bài thi này?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const idToDelete = editingExam.id;
                      const titleToDelete = editingExam.title;
                      const remaining = allExams.filter((e) => e.id !== idToDelete);
                      const fallbackRaw = remaining[0] || SAMPLE_EXAMS[0];
                      const fallback = fallbackRaw ? sanitizeExamSections(fallbackRaw) : null;

                      const deleted = await onDeleteCustomExam(idToDelete);
                      if (deleted === false) {
                        alert('Không thể đồng bộ việc xóa bài lên máy chủ. Bài vẫn được giữ lại để không mất dữ liệu.');
                        return;
                      }
                      setShowDeleteConfirm(false);
                      setDeleteNotice(`Đã xóa bài thi "${titleToDelete}" thành công!`);

                      if (fallback) {
                        setSelectedExamId(fallback.id);
                        replaceEditingExam({
                          ...fallback,
                          vocabList: fallback.vocabList || [],
                          mcQuestions: fallback.mcQuestions || [],
                          fillQuestions: fallback.fillQuestions || [],
                          arrangeQuestions: fallback.arrangeQuestions || [],
                          listeningQuestions: fallback.listeningQuestions || [],
                          essayQuestions: fallback.essayQuestions || [],
                          speakingQuestions: fallback.speakingQuestions || [],
                          translationQuestions: fallback.translationQuestions || []
                        });
                      }

                      setTimeout(() => setDeleteNotice(null), 4000);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded font-bold cursor-pointer transition shadow-xs"
                  >
                    Có, Xóa Ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1 rounded font-semibold cursor-pointer transition"
                  >
                    Hủy
                  </button>
                </div>
              )
            )}
          </div>
        </div>

          {deleteNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{deleteNotice}</span>
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">Thời gian làm bài</h4>
                  <p className="text-xs text-amber-900 mt-0.5">
                    Có thể bật/tắt giới hạn thời gian cho từng bài. Khi hết giờ, bài của học sinh sẽ tự động được nộp.
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingExam.timeLimitEnabled === true}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    updateExamTimeLimit(
                      enabled,
                      enabled ? (editingExam.timeLimitMinutes || 45) : editingExam.timeLimitMinutes
                    );
                  }}
                  className="w-4 h-4 accent-amber-700"
                  aria-label="Bật giới hạn thời gian"
                />
                Bật giới hạn thời gian
              </label>
            </div>

            {editingExam.timeLimitEnabled === true && (
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <label htmlFor="exam-time-limit-minutes" className="text-xs font-bold text-amber-950">
                  Số phút làm bài
                </label>
                <input
                  id="exam-time-limit-minutes"
                  type="number"
                  min={1}
                  max={600}
                  value={editingExam.timeLimitMinutes ?? 45}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    updateExamTimeLimit(true, Number.isFinite(value) && value > 0 ? Math.round(value) : undefined);
                  }}
                  className="w-24 px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-amber-900">phút</span>
              </div>
            )}
          </div>

          {!editingExam.sourceLessonData && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
              <div>
                <p className="text-sm font-bold text-indigo-950">Các dạng bài HSK theo đề giáo trình</p>
                <p className="text-xs text-indigo-800 mt-0.5">Tạo bài nghe chọn hình, ghép hình, nối câu, ngân hàng từ và đọc hiểu ngay trong trình soạn.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sourceLessonData = convertExamLessonToLessonData(editingExam);
                  if (sourceLessonData.sections.length === 0) {
                    sourceLessonData.sections.push({
                      id: 'hsk-structured-section',
                      title: 'Bài tập HSK',
                      items: []
                    });
                  }
                  setEditingExam({ ...editingExam, sourceLessonData });
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-800 shrink-0"
              >
                <Plus className="w-4 h-4" /> Mở trình soạn dạng HSK
              </button>
            </div>
          )}

          {editingExam.sourceLessonData && (
            <LessonDataEditor
              title="Chỉnh sửa toàn bộ bài học đã nhập"
              value={editingExam.sourceLessonData as unknown as Record<string, unknown>}
              onChange={handleSourceLessonDataChange}
              canUndo={editingHistory.past.length > 0}
              canRedo={editingHistory.future.length > 0}
              onUndo={undoEditingExam}
              onRedo={redoEditingExam}
              validateAdvancedJson={validateSourceLessonData}
            />
          )}

          {!editingExam.sourceLessonData && (
            <>
          {/* Exam Info Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài thi / Bài học</label>
              <input
                type="text"
                value={editingExam.title || ''}
                onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ</label>
              <select
                value={editingExam.level || 'HSK 3'}
                onChange={(e: any) => setEditingExam({ ...editingExam, level: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="HSK 1">HSK 1</option>
                <option value="HSK 2">HSK 2</option>
                <option value="HSK 3">HSK 3</option>
                <option value="HSK 4">HSK 4</option>
                <option value="HSK 5">HSK 5</option>
                <option value="HSK 6">HSK 6</option>
                <option value="Luyện nói">Luyện nói</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả bài học</label>
              <input
                type="text"
                value={editingExam.description || ''}
                onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Vocabulary List Editor */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span>Bảng từ vựng bài học ({editingExam.vocabList?.length || 0} từ)</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Hán tự</th>
                    <th className="p-3">Pinyin</th>
                    <th className="p-3">Loại từ</th>
                    <th className="p-3">Nghĩa Tiếng Việt</th>
                    <th className="p-3 text-center">Đọc</th>
                    <th className="p-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editingExam.vocabList?.map((vocab, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-red-700 text-base">{vocab.hanzi}</td>
                      <td className="p-3 font-mono text-indigo-600">{vocab.pinyin}</td>
                      <td className="p-3 text-slate-500">{vocab.type || 'Từ'}</td>
                      <td className="p-3 font-medium text-slate-800">{vocab.meaning}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => speakText(vocab.hanzi)}
                          className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="p-3 text-right flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditVocabItem(idx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="Sửa từ vựng này"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVocabItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Xóa từ vựng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form Thêm Từ Vựng Mới */}
            <form onSubmit={handleAddVocabItem} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Thêm Từ Vựng Mới Vào Bài Học:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newHanzi}
                  onChange={(e) => setNewHanzi(e.target.value)}
                  placeholder="Hán tự (Ví dụ: 苹果)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  value={newPinyin}
                  onChange={(e) => setNewPinyin(e.target.value)}
                  placeholder="Pinyin (Ví dụ: píngguǒ)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Loại từ (Ví dụ: Danh từ)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Nghĩa (Ví dụ: Quả táo)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Từ Vựng
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Câu Hỏi Trắc Nghiệm Mới */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Câu Hỏi Trắc Nghiệm ({(editingExam.mcQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.mcQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                    <span className="text-slate-500 block">Lựa chọn: {q.options?.join(' | ')}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMcQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMcQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Câu Hỏi Trắc Nghiệm Mới:</span>
              <input
                type="text"
                value={newMcPrompt}
                onChange={(e) => setNewMcPrompt(e.target.value)}
                placeholder="Đề bài câu hỏi (Ví dụ: Từ 打算 nghĩa là gì?)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newMcOptA}
                  onChange={(e) => setNewMcOptA(e.target.value)}
                  placeholder="Đáp án A"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newMcOptB}
                  onChange={(e) => setNewMcOptB(e.target.value)}
                  placeholder="Đáp án B"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newMcOptC}
                  onChange={(e) => setNewMcOptC(e.target.value)}
                  placeholder="Đáp án C"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newMcOptD}
                  onChange={(e) => setNewMcOptD(e.target.value)}
                  placeholder="Đáp án D"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Đáp án đúng:</label>
                  <select
                    value={newMcCorrect}
                    onChange={(e) => setNewMcCorrect(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Câu Trắc Nghiệm
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Câu Hỏi Điền Từ Vào Chỗ Trống */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Câu Hỏi Điền Từ Vào Chỗ Trống ({(editingExam.fillQuestions || []).length} câu)</h4>

            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div>
                <h5 className="font-bold text-emerald-950 text-sm">Bảng từ cho sẵn</h5>
                <p className="text-xs text-emerald-800 mt-1">
                  Chỉnh sửa các từ học sinh sẽ nhìn thấy trước phần điền từ. Các từ được áp dụng cho toàn bộ câu cùng cấp độ.
                </p>
              </div>

              {fillWordBankGroups.length > 0 ? (
                fillWordBankGroups.map(({ tier, wordBank }) => (
                  <label key={tier} className="block space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-900">
                      {tier === 'tier1' ? 'Cấp 1: Tri thức' : tier === 'tier2' ? 'Cấp 2: Bán giao tiếp' : 'Cấp 3: Giao tiếp tự do'}
                    </span>
                    <textarea
                      value={wordBank.join(', ')}
                      onChange={(event) => handleUpdateFillWordBank(tier, event.target.value)}
                      onBlur={handleFillWordBankBlur}
                      placeholder="老师, 学生, 谢谢... (cách nhau bằng dấu phẩy)"
                      rows={2}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                    />
                  </label>
                ))
              ) : (
                <p className="text-xs italic text-emerald-800">Chưa có câu điền từ để thiết lập bảng từ.</p>
              )}
            </div>

            <div className="space-y-2">
              {(editingExam.fillQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                    <span className="text-emerald-700 font-medium block">Đáp án chuẩn: {q.acceptableAnswers}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFillQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddFillQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Câu Hỏi Điền Từ Mới:</span>
              <input
                type="text"
                value={newFillPrompt}
                onChange={(e) => setNewFillPrompt(e.target.value)}
                placeholder="Ví dụ: 我在学校___汉语。(Điền 学习)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newFillAnswer}
                onChange={(e) => setNewFillAnswer(e.target.value)}
                placeholder="Đáp án đúng (Nếu có nhiều đáp án cùng đúng, cách nhau bằng dấu | ví dụ: 学习|学)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newFillWordBank}
                onChange={(e) => setNewFillWordBank(e.target.value)}
                placeholder="Bảng từ cho sẵn (cách nhau bằng dấu phẩy, ví dụ: 学习, 工作, 休息)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Câu Điền Từ
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Câu Hỏi Sắp Xếp Từ / Thẻ Từ */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Câu Hỏi Sắp Xếp Từ (Thẻ Từ) ({(editingExam.arrangeQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.arrangeQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                    <div className="flex flex-wrap gap-1 my-1">
                      {q.wordChips?.map((chip, cIdx) => (
                        <span key={cIdx} className="bg-slate-200 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <span className="text-emerald-700 font-medium block">Đáp án chuẩn: {q.acceptableAnswers}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteArrQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddArrQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Câu Hỏi Sắp Xếp Từ Mới:</span>
              <input
                type="text"
                value={newArrPrompt}
                onChange={(e) => setNewArrPrompt(e.target.value)}
                placeholder="Yêu cầu / Đề bài (Ví dụ: Hãy xếp các từ thành câu hoàn chỉnh)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newArrChips}
                onChange={(e) => setNewArrChips(e.target.value)}
                placeholder="Các thẻ từ rời (cách nhau bởi dấu phẩy, ví dụ: 我, 喜欢, 吃, 苹果)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newArrAnswer}
                onChange={(e) => setNewArrAnswer(e.target.value)}
                placeholder="Đáp án câu hoàn chỉnh (Ví dụ: 我喜欢吃苹果。)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Câu Sắp Xếp Từ
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Bài Tập Nghe (Nghe Chọn Đáp Án & Nghe Chọn Đúng/Sai) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
                <Headphones className="w-4 h-4 text-indigo-600" />
                Quản Lý Bài Tập Luyện Nghe ({(editingExam.listeningQuestions || []).reduce((total, question) => total + (question.subQuestions?.length || 1), 0)} câu)
              </span>
            </h4>

            {/* List of existing listening questions */}
            <div className="space-y-2">
              {(editingExam.listeningQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Câu nghe #{idx + 1}: {q.prompt}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.type === 'listening_tf' || q.type === 'listening_true_false'
                            ? 'bg-amber-100 text-amber-900'
                            : q.type === 'listening_fill' || q.type === 'listening_fill_in_blank'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {q.subQuestions?.length
                            ? q.subQuestions.length > 1 ? '🎧 Nghe hội thoại - trả lời nhiều câu' : '🎧 Nghe hội thoại'
                            : q.type === 'listening_tf' || q.type === 'listening_true_false'
                            ? '🎧 Nghe Phán Đoán Đúng / Sai'
                            : q.type === 'listening_fill' || q.type === 'listening_fill_in_blank'
                            ? '🎧 Nghe Điền Tự Luận'
                            : '🎧 Nghe Tích Trắc Nghiệm ABCD'}
                        </span>
                      </div>
                      {q.pinyin && <p className="text-indigo-600 font-mono">Pinyin: {q.pinyin}</p>}

                      {q.subQuestions?.length ? (
                        <div className="space-y-1.5 pt-1">
                          {q.subQuestions.map((subQuestion, subIdx) => (
                            <div key={subQuestion.id} className="rounded-lg bg-white border border-indigo-100 p-2 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                  Câu {subIdx + 1}: {subQuestion.prompt}
                                </p>
                                {subQuestion.options && (
                                  <p className="text-slate-600 mt-0.5">
                                    Lựa chọn: {subQuestion.options.join(' | ')}
                                    <span className="font-bold text-emerald-700 ml-2">
                                      (Đáp án đúng: {subQuestion.options[subQuestion.answer as number] || subQuestion.answer})
                                    </span>
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingQuestion(subQuestion)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
                                title="Sửa câu hỏi trong cuộc hội thoại"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      
                      {q.options && q.options.length > 0 && (
                        <div className="text-slate-600 pt-0.5">
                          <span className="font-semibold text-slate-700">Lựa chọn: </span>
                          <span>{q.options.join(' | ')}</span>
                          <span className="font-bold text-emerald-700 ml-2">
                            (Đáp án đúng: {q.options[q.answer as number] || q.answer})
                          </span>
                        </div>
                      )}

                      {(q.type === 'listening_fill' || q.type === 'listening_fill_in_blank') && (
                        <div className="text-slate-600 pt-0.5">
                          <span className="font-semibold text-slate-700">Đáp án từ cần điền: </span>
                          <span className="font-bold text-emerald-700">
                            {q.acceptableAnswers || (typeof q.answer === 'string' ? q.answer : q.suggestedAnswer) || 'Chưa đặt'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectListeningParent(q.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-white border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                        title="Thêm câu hỏi vào cuộc hội thoại này"
                      >
                        <Plus className="w-3 h-3" /> Thêm câu vào đây
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(q.subQuestions?.length ? { ...q, type: q.subQuestions[0].type } : q)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title={q.subQuestions?.length ? 'Sửa thông tin cuộc hội thoại và file nghe' : 'Sửa câu hỏi này'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListenQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Audio player preview */}
                  {(q.audioUrl || q.audioPromptUrl) ? (
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> File nghe đính kèm:
                      </p>
                      <audio
                        controls
                        src={getDriveAudioPlayerUrl(q.audioUrl || q.audioPromptUrl || '')}
                        className="w-full h-8 rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 italic">Không có file nghe đính kèm (sử dụng đọc tự động TTS).</span>
                      <button
                        type="button"
                        onClick={() => speakText(q.pinyin || q.prompt)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:underline font-bold cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" /> Thử phát TTS
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* New Listening Question Form */}
            <form id="listening-question-editor-form" onSubmit={handleAddListenQuestion} className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" /> Soạn Bài Tập Luyện Nghe Mới:
              </span>

              <div className="p-3 bg-white border border-indigo-200 rounded-lg space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Câu hỏi này thuộc bài nghe nào?</label>
                <select
                  value={newListenParentId}
                  onChange={(e) => handleSelectListeningParent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Bài nghe mới (tạo audio riêng)</option>
                  {(editingExam.listeningQuestions || [])
                    .map((question, index) => (
                      <option key={question.id} value={question.id}>
                        Thêm vào hội thoại {index + 1} - {question.prompt}
                      </option>
                    ))}
                </select>
                {newListenParentId && (
                  <p className="text-[11px] text-indigo-700 font-medium">
                    Câu mới sẽ được thêm vào cuộc hội thoại đã chọn và dùng chung một file nghe.
                  </p>
                )}
              </div>

              {/* Type Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại bài nghe:</label>
                  <select
                    value={newListenType}
                    onChange={(e: any) => setNewListenType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="listening_multiple_choice">🎧 Nghe tích trắc nghiệm ABCD (listening_multiple_choice)</option>
                    <option value="listening_true_false">🎧 Nghe phán đoán Đúng / Sai (listening_true_false)</option>
                    <option value="listening_fill">🎧 Nghe điền tự luận (listening_fill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phiên âm / Nội dung nói (Pinyin / Hán tự):</label>
                  <input
                    type="text"
                    value={newListenPinyin}
                    onChange={(e) => setNewListenPinyin(e.target.value)}
                    placeholder="Ví dụ: Nǐ zhōumò yǒu shénme dǎsuàn?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Question Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Đề bài / Câu hỏi hướng dẫn bài nghe:</label>
                <input
                  type="text"
                  value={newListenPrompt}
                  onChange={(e) => setNewListenPrompt(e.target.value)}
                  placeholder={
                    newListenType === 'listening_multiple_choice' || newListenType === 'listening_mc'
                      ? 'Ví dụ: Nghe đoạn âm thanh và chọn đáp án đúng:'
                      : newListenType === 'listening_true_false' || newListenType === 'listening_tf'
                      ? 'Ví dụ: Nghe đoạn hội thoại và cho biết phát biểu sau Đúng hay Sai:'
                      : 'Ví dụ: Nghe đoạn âm thanh và điền từ thích hợp vào chỗ trống:'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Audio File Upload or URL Input */}
              <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-600" /> Tải Lên File Âm Thanh Hoặc Dán Link MP3:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">Cách 1: Chọn file nghe từ máy (.mp3, .wav, .m4a)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">Cách 2: Hoặc Dán Đường Dẫn Link MP3 / Audio</span>
                    <input
                      type="text"
                      value={newListenAudioUrl}
                      onChange={(e) => setNewListenAudioUrl(e.target.value)}
                      placeholder="https://.../file.mp3 hoặc data:audio/..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {newListenAudioUrl && (
                  <div className="pt-2 border-t border-indigo-100 flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đính kèm âm thanh!
                    </span>
                    <audio
                      controls
                      src={getDriveAudioPlayerUrl(newListenAudioUrl)}
                      className="h-7 w-full max-w-md"
                    />
                    <button
                      type="button"
                      onClick={() => setNewListenAudioUrl('')}
                      className="text-xs text-red-600 hover:underline shrink-0"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
              </div>

              {/* Options or Answer Input based on Type */}
              {newListenType === 'listening_multiple_choice' || newListenType === 'listening_mc' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Các Lựa Chọn Đáp Án (A, B, C, D):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newListenOptA}
                      onChange={(e) => setNewListenOptA(e.target.value)}
                      placeholder="Đáp án A"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      value={newListenOptB}
                      onChange={(e) => setNewListenOptB(e.target.value)}
                      placeholder="Đáp án B"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      value={newListenOptC}
                      onChange={(e) => setNewListenOptC(e.target.value)}
                      placeholder="Đáp án C"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      value={newListenOptD}
                      onChange={(e) => setNewListenOptD(e.target.value)}
                      placeholder="Đáp án D"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-xs font-semibold text-slate-700">Đáp án đúng chính xác:</label>
                    <select
                      value={newListenCorrectMc}
                      onChange={(e) => setNewListenCorrectMc(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </div>
                </div>
              ) : newListenType === 'listening_true_false' || newListenType === 'listening_tf' ? (
                <div className="p-3 bg-white border border-amber-200 rounded-lg space-y-2">
                  <label className="block text-xs font-bold text-amber-900">Chọn Đáp Án Chuẩn Cho Bài Nghe Đúng / Sai:</label>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-emerald-800">
                      <input
                        type="radio"
                        name="listen_tf_ans"
                        checked={newListenCorrectTf === 0}
                        onChange={() => setNewListenCorrectTf(0)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Đúng (正确)</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-rose-800">
                      <input
                        type="radio"
                        name="listen_tf_ans"
                        checked={newListenCorrectTf === 1}
                        onChange={() => setNewListenCorrectTf(1)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Sai (错误)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white border border-purple-200 rounded-lg space-y-2">
                  <label className="block text-xs font-bold text-purple-950">Đáp Án / Từ Cần Điền Tự Luận Chuẩn:</label>
                  <input
                    type="text"
                    value={newListenFillAnswer}
                    onChange={(e) => setNewListenFillAnswer(e.target.value)}
                    placeholder="Ví dụ: 苹果 (dùng dấu | nếu có nhiều cách viết đồng nghĩa, ví dụ: 苹果|quả táo)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-800"
                  />
                </div>
              )}

              {/* Explanation / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giải thích đáp án (không bắt buộc):</label>
                <input
                  type="text"
                  value={newListenExplanation}
                  onChange={(e) => setNewListenExplanation(e.target.value)}
                  placeholder="Giải thích câu trả lời khi học sinh tra cứu kết quả..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> {newListenParentId ? 'Thêm Câu Vào Cuộc Hội Thoại' : 'Thêm Bài Tập Nghe'}
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Bài Đọc Hiểu Chọn Đáp Án */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-900 font-extrabold">
                <FileText className="w-4 h-4 text-sky-600" />
                Quản Lý Bài Đọc Hiểu Chọn Đáp Án ({(editingExam.readingPassages || []).length} bài đọc)
              </span>
            </h4>

            <div className="space-y-3">
              {(editingExam.readingPassages || []).map((passage, passageIdx) => (
                <div key={passage.id} className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    {editingReadingPassageId === passage.id ? (
                      <div className="space-y-2 min-w-0 flex-1">
                        <input
                          type="text"
                          value={editingReadingTitle}
                          onChange={(e) => setEditingReadingTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
                          aria-label="Tiêu đề bài đọc đang sửa"
                        />
                        <textarea
                          rows={4}
                          value={editingReadingContent}
                          onChange={(e) => setEditingReadingContent(e.target.value)}
                          className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
                          aria-label="Nội dung bài đọc đang sửa"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditingReadingPassage}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReadingPassage(passage.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Lưu đoạn văn
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="font-bold text-sky-950 text-sm block">
                          Bài đọc {passageIdx + 1}: {passage.title}
                        </span>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{passage.content}</p>
                      </div>
                    )}
                    {editingReadingPassageId !== passage.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditingReadingPassage(passage)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="Sửa tiêu đề và nội dung bài đọc"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReadingPassage(passage.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Xóa bài đọc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-sky-200 pt-2">
                    {passage.questions.map((q, questionIdx) => (
                      <div key={q.id} className="p-2.5 bg-white border border-sky-100 rounded-lg flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-slate-800">Câu {questionIdx + 1}: {q.prompt}</p>
                          <p className="text-slate-600">Lựa chọn: {q.options?.join(' | ')}</p>
                          <p className="font-bold text-emerald-700">
                            Đáp án đúng: {q.options?.[q.answer as number] || q.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion(q);
                              setEditingReadingQuestion({ passageId: passage.id, questionId: q.id });
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Sửa câu hỏi đọc"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReadingQuestion(passage.id, q.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Xóa câu hỏi đọc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddReadingQuestion} className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-600" /> Soạn bài đọc và câu hỏi chọn đáp án:
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn bài đọc đã có hoặc tạo bài đọc mới:</label>
                <select
                  value={selectedReadingPassageId}
                  onChange={(e) => setSelectedReadingPassageId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">+ Tạo bài đọc mới</option>
                  {(editingExam.readingPassages || []).map((passage, idx) => (
                    <option key={passage.id} value={passage.id}>
                      Thêm câu vào Bài đọc {idx + 1}: {passage.title}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedReadingPassageId && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newReadingTitle}
                    onChange={(e) => setNewReadingTitle(e.target.value)}
                    placeholder="Tiêu đề bài đọc (Ví dụ: Đọc đoạn văn và chọn đáp án đúng)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <textarea
                    rows={4}
                    value={newReadingContent}
                    onChange={(e) => setNewReadingContent(e.target.value)}
                    placeholder="Nội dung đoạn đọc bằng chữ Hán..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <textarea
                rows={2}
                value={newReadingQuestionPrompt}
                onChange={(e) => setNewReadingQuestionPrompt(e.target.value)}
                placeholder="Câu hỏi đọc hiểu (Ví dụ: 王文是哪国人？)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newReadingOptA}
                  onChange={(e) => setNewReadingOptA(e.target.value)}
                  placeholder="Đáp án A"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newReadingOptB}
                  onChange={(e) => setNewReadingOptB(e.target.value)}
                  placeholder="Đáp án B"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newReadingOptC}
                  onChange={(e) => setNewReadingOptC(e.target.value)}
                  placeholder="Đáp án C"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  value={newReadingOptD}
                  onChange={(e) => setNewReadingOptD(e.target.value)}
                  placeholder="Đáp án D"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  Đáp án đúng:
                  <select
                    value={newReadingCorrect}
                    onChange={(e) => setNewReadingCorrect(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  {selectedReadingPassageId ? 'Thêm câu vào bài đọc' : 'Tạo bài đọc và thêm câu'}
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Bài Tự Luận */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Bài Tự Luận ({(editingExam.essayQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.essayQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                    {q.imageUrl && (
                      <div className="mt-1">
                        <img src={getDriveMediaPlayerUrl(q.imageUrl)} alt="Đề bài" className="h-16 rounded border border-slate-200 object-contain bg-white" />
                      </div>
                    )}
                    {q.suggestedAnswer && (
                      <span className="text-slate-500 block mt-0.5">Gợi ý/Đáp án mẫu: {q.suggestedAnswer}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEssayQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddEssayQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Bài Tự Luận Mới:</span>
              <textarea
                rows={2}
                value={newEssayPrompt}
                onChange={(e) => setNewEssayPrompt(e.target.value)}
                placeholder="Đề bài tự luận (Ví dụ: Hãy viết một đoạn văn ngắn khoảng 50 từ giới thiệu về bản thân...)"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />

              {/* Up ảnh đính kèm bài Tự luận */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình ảnh đính kèm đề bài (không bắt buộc):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newEssayImageUrl}
                    onChange={(e) => setNewEssayImageUrl(e.target.value)}
                    placeholder="Dán URL hình ảnh hoặc bấm nút bên để tải ảnh từ thiết bị ->"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh...
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEssayImageUpload}
                      className="hidden"
                    />
                  </label>
                  {newEssayImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewEssayImageUrl('')}
                      className="px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {newEssayImageUrl && (
                  <div className="mt-2">
                    <img src={getDriveMediaPlayerUrl(newEssayImageUrl)} alt="Preview" className="h-24 rounded-lg border border-slate-200 object-contain bg-white" />
                  </div>
                )}
              </div>

              <input
                type="text"
                value={newEssayAnswer}
                onChange={(e) => setNewEssayAnswer(e.target.value)}
                placeholder="Gợi ý/Đáp án mẫu (không bắt buộc, ví dụ: 我叫...) "
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Bài Tự Luận
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Bài Luyện Nói */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Bài Luyện Nói ({(editingExam.speakingQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.speakingQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">C{idx + 1}: {q.prompt}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        🎙️ Luyện nói
                      </span>
                    </div>
                    {q.imageUrl && (
                      <div className="mt-1">
                        <img src={getDriveMediaPlayerUrl(q.imageUrl)} alt="Hình luyện nói" className="h-16 rounded border border-slate-200 object-contain bg-white" />
                      </div>
                    )}
                    {q.pinyin && <span className="text-indigo-600 font-mono block mt-0.5">Pinyin: {q.pinyin}</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpeakingQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSpeakingQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Bài Luyện Nói Mới:</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại bài tập:</label>
                  <select
                    value={newSpeakingType}
                    onChange={(e: any) => setNewSpeakingType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="speaking">🎙️ Luyện nói (speaking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phiên âm Pinyin (không bắt buộc):</label>
                  <input
                    type="text"
                    value={newSpeakingPinyin}
                    onChange={(e) => setNewSpeakingPinyin(e.target.value)}
                    placeholder="Phiên âm Pinyin (Ví dụ: Wǒ zuìjìn bǐjiào máng.)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung / Đề bài luyện nói:</label>
                <input
                  type="text"
                  value={newSpeakingPrompt}
                  onChange={(e) => setNewSpeakingPrompt(e.target.value)}
                  placeholder="Ví dụ: Đọc ghi âm câu sau: 我最近比较忙。"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Up ảnh đính kèm bài Luyện nói */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình ảnh đính kèm đề bài (không bắt buộc):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newSpeakingImageUrl}
                    onChange={(e) => setNewSpeakingImageUrl(e.target.value)}
                    placeholder="Dán URL hình ảnh hoặc bấm nút bên để tải ảnh từ thiết bị ->"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh...
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSpeakingImageUpload}
                      className="hidden"
                    />
                  </label>
                  {newSpeakingImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewSpeakingImageUrl('')}
                      className="px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {newSpeakingImageUrl && (
                  <div className="mt-2">
                    <img src={getDriveMediaPlayerUrl(newSpeakingImageUrl)} alt="Preview" className="h-24 rounded-lg border border-slate-200 object-contain bg-white" />
                  </div>
                )}
              </div>

              {newSpeakingType === 'speaking_record' && (
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    Danh sách các từ / âm tiết cần ghi âm (cách nhau bởi dấu phẩy):
                  </label>
                  <input
                    type="text"
                    value={newSpeakingItems}
                    onChange={(e) => setNewSpeakingItems(e.target.value)}
                    placeholder="Ví dụ: b, p, m, f, d, t, n, l"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Bài Luyện Nói
                </button>
              </div>
            </form>
          </div>

          {/* Form Thêm Bài Luyện Dịch Thuật (3 Dạng) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">
              Quản Lý Bài Luyện Dịch Thuật (3 Dạng) ({(editingExam.translationQuestions || []).length} câu)
            </h4>

            <div className="space-y-2">
              {(editingExam.translationQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        {q.translationType === 'vi_to_zh_audio' && '🎙️ TV → Ghi âm Trung'}
                        {q.translationType === 'vi_to_zh_text' && '✍️ TV → Viết Trung'}
                        {q.translationType === 'zh_to_vi_text' && '🇨🇳 Trung → Dịch Việt'}
                      </span>
                    </div>
                    {q.suggestedAnswer && <span className="text-slate-500 block mt-0.5">Đáp án mẫu: {q.suggestedAnswer}</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTransQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTransQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Bài Luyện Dịch Mới:</span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn Dạng Bài Dịch:</label>
                <select
                  value={newTransType}
                  onChange={(e: any) => setNewTransType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="vi_to_zh_audio">🎙️ Dạng 1: Cho câu Tiếng Việt → Học sinh Ghi âm Tiếng Trung</option>
                  <option value="vi_to_zh_text">✍️ Dạng 2: Cho câu Tiếng Việt → Học sinh Viết chữ Hán</option>
                  <option value="zh_to_vi_text">🇨🇳 Dạng 3: Cho câu Tiếng Trung → Học sinh Dịch sang Tiếng Việt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {newTransType === 'zh_to_vi_text' ? 'Câu Tiếng Trung đề bài:' : 'Câu Tiếng Việt đề bài:'}
                </label>
                <input
                  type="text"
                  value={newTransPrompt}
                  onChange={(e) => setNewTransPrompt(e.target.value)}
                  placeholder={
                    newTransType === 'zh_to_vi_text'
                      ? 'Ví dụ: 你明天有空吗？'
                      : 'Ví dụ: Cuối tuần này bạn có dự định gì?'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {newTransType === 'zh_to_vi_text' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pinyin câu Tiếng Trung (không bắt buộc):</label>
                  <input
                    type="text"
                    value={newTransPinyin}
                    onChange={(e) => setNewTransPinyin(e.target.value)}
                    placeholder="Ví dụ: Nǐ míngtiān yǒu kòng ma?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án gợi ý / Bản dịch mẫu tham khảo:</label>
                <input
                  type="text"
                  value={newTransSuggestedAnswer}
                  onChange={(e) => setNewTransSuggestedAnswer(e.target.value)}
                  placeholder="Ví dụ: 周末你有什么打算？ hoặc 'Ngày mai bạn có rảnh không?'"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Bài Dịch Thuật
                </button>
              </div>
            </form>
          </div>
            </>
          )}
        </div>
      )}

      {/* GRADING MODAL / DRAWER */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md">
                  Mã ID: {selectedSub.id}
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  Chấm bài: {selectedSub.name} ({selectedSub.class})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Thời gian nộp</span>
                <span className="font-semibold text-slate-800">{selectedSub.time}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bài thi</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedSub.lesson}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Điểm trắc nghiệm</span>
                <span className="font-bold text-red-700 text-sm">
                  {hasPendingAnswerKey(selectedSub, allExams)
                    ? 'Chờ duyệt đáp án'
                    : `${selectedSubmissionMetrics?.percent ?? selectedSub.percent}% (${selectedSubmissionMetrics?.correct ?? selectedSub.correct}/${selectedSub.total})`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Trạng thái</span>
                <span className="font-semibold text-slate-800">{selectedSub.status}</span>
              </div>
            </div>

            {false && (
              <div>
            {/* Legacy grouped result blocks retained only for backward reference. */}
            {visibleSelectedWrongDetails.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    Các câu học sinh làm sai ({visibleSelectedWrongDetails.length})
                  </h4>
                  <span className="text-xs text-slate-500">Câu hỏi và đáp án đối chiếu</span>
                </div>

                <div className="space-y-3">
                  {visibleSelectedWrongDetails.map((item, idx) => (
                    <article key={`${item.category}-${idx}`} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-800">Câu sai #{idx + 1}</span>
                        <span className="text-xs text-slate-500">{item.category}</span>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Câu hỏi gốc</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold text-slate-800 leading-relaxed">
                          {item.prompt || item.raw}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border-l-2 border-slate-300 pl-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Học sinh chọn / nhập</p>
                          <p className="text-sm font-semibold text-rose-700 leading-relaxed">
                            {item.userAnswer || 'Không chọn / Để trống'}
                          </p>
                        </div>
                        <div className="border-l-2 border-slate-400 pl-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Đáp án đúng</p>
                          <p className="text-sm font-semibold text-emerald-700 leading-relaxed">
                            {item.correctAnswer || '—'}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Essay Responses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> Bài Tự Luận Của Học Sinh
                </h4>
                {selectedSub.essays && selectedSub.essays !== 'Không làm phần tự luận' && (
                  <button
                    type="button"
                    onClick={() => speakText(removeAnswerSnapshot(selectedSub.essays))}
                    className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Nghe đọc bài tự luận
                  </button>
                )}
              </div>

              {selectedSub.essays && selectedSub.essays !== 'Không làm phần tự luận' ? (
                <div className="space-y-3">
                  {removeAnswerSnapshot(selectedSub.essays).split(/(?=【)/g).filter(Boolean).map((chunk, idx) => {
                    const titleMatch = chunk.match(/【(.*?)】/);
                    const title = titleMatch ? titleMatch[1] : `Câu ${idx + 1}`;
                    const answer = chunk.replace(/【.*?】\n?/, '').replace(/^Bài làm:\s*/, '').trim();
                    const essayReviewQuestion = getReviewQuestion(undefined, title);

                    return (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>Câu {idx + 1}: {title}</span>
                          <button
                            type="button"
                            onClick={() => speakText(answer)}
                            className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" /> Nghe đọc
                          </button>
                        </div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                          {answer || '(Chưa làm)'}
                        </div>
                        {renderReviewDetails(essayReviewQuestion)}

                        {/* Per-question comment input for teacher */}
                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <label className="block text-xs font-semibold text-amber-900">
                            💬 Nhận xét của giáo viên cho câu tự luận này:
                          </label>
                          <input
                            type="text"
                            value={itemComments[`essay_${idx}`] || ''}
                            onChange={(e) => setItemComments((prev) => ({ ...prev, [`essay_${idx}`]: e.target.value }))}
                            placeholder="Nhập nhận xét riêng cho câu tự luận này (ví dụ: dùng từ hay, đúng cấu trúc, chú ý lỗi chính tả...)..."
                            className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/50 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                  Học sinh không điền câu tự luận.
                </div>
              )}
            </div>

            {/* Audio Recordings Section */}
            <div className="space-y-3 bg-indigo-50/60 border border-indigo-200/80 p-4 rounded-xl">
              <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-700" /> Bản Ghi Âm Luyện Nói Của Học Sinh
              </h4>

              {audioReviewQuestions.some((question) => !getAudioRecordMatch(question).audio) && (
                <div className="space-y-3">
                  {audioReviewQuestions.map((question, questionIndex) => {
                    if (getAudioRecordMatch(question).audio) return null;
                    return renderUnansweredAudioQuestion(question, questionIndex);
                  })}
                </div>
              )}

              {/* Local audio records */}
              {selectedSub.audios && selectedSub.audios.length > 0 ? (
                <div className="space-y-3">
                  {orderedAudioRecords.map(({ audio: aud, index: recordIndex, question: audioReviewQuestion }) => {
                    const audioSrc = getAudioSrcFromObject(aud);
                    const audioQuestionPrompt = audioReviewQuestion?.prompt || getAudioQuestionPrompt(aud, recordIndex);
                    return (
                      <div key={recordIndex} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2 shadow-2xs">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-indigo-950">{aud.label || `Ghi âm câu ${recordIndex + 1}`}</span>
                          {audioQuestionPrompt && (
                            <p className="text-sm font-semibold leading-relaxed text-slate-800">
                              Câu hỏi: {audioQuestionPrompt}
                            </p>
                          )}
                        </div>
                        {renderReviewDetails(audioReviewQuestion)}
                        {audioSrc ? (
                          <audio controls src={audioSrc} className="w-full h-8" />
                        ) : (
                          <p className="text-xs text-rose-600 font-medium">Không thể tải file âm thanh ghi âm này.</p>
                        )}

                        {aud.teacherFeedbackUrl && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                            <p className="text-xs font-bold text-emerald-900">File chữa phát âm của giáo viên:</p>
                            <audio
                              controls
                              src={getDriveAudioPlayerUrl(aud.teacherFeedbackUrl)}
                              className="w-full h-8"
                            />
                          </div>
                        )}

                        {/* Per-audio comment input for teacher */}
                        <div className="pt-2 border-t border-indigo-100 space-y-1">
                          <label className="block text-xs font-semibold text-indigo-900">
                            🎙️ Nhận xét của giáo viên cho bài ghi âm này:
                          </label>
                          <input
                            type="text"
                            value={itemComments[`audio_${recordIndex}`] || ''}
                            onChange={(e) => setItemComments((prev) => ({ ...prev, [`audio_${recordIndex}`]: e.target.value }))}
                            placeholder="Nhập nhận xét riêng cho bài ghi âm này (ví dụ: phát âm chuẩn, chú ý thanh 3/thanh 4...)..."
                            className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-indigo-50/50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div className="pt-2 border-t border-indigo-100 space-y-2">
                          <p className="text-xs font-semibold text-emerald-900">
                            🎙️ Ghi âm lời chữa phát âm cho học sinh:
                          </p>
                          {uploadingFeedbackAudio === `audio_${recordIndex}` && (
                            <p className="text-[11px] text-emerald-700 font-semibold">Đang lưu file chữa lên bộ nhớ dùng chung...</p>
                          )}
                          <AudioRecorder
                            label="Ghi âm mẫu để học sinh nghe lại"
                            onAudioRecorded={(record) => void handleTeacherFeedbackRecorded(recordIndex, record)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : selectedSub.driveLinks ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 font-medium">File ghi âm trên Google Drive (từ Sheet):</p>
                  {selectedSub.driveLinks.split('\n').filter(Boolean).map((link, idx) => {
                    const rawUrl = link.substring(link.indexOf('http'));
                    const playableUrl = getDriveAudioPlayerUrl(link);
                    const audioLabel = getAudioLinkLabel(link, `File ghi âm câu ${idx + 1}`);
                    const audioQuestionPrompt = getAudioQuestionPrompt(audioLabel, idx);
                    const audioReviewQuestion = getAudioQuestionForRecord(audioLabel, idx);

                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2">
                        <div className="space-y-1 text-xs font-bold text-indigo-900">
                          <span>{audioLabel}</span>
                          {audioQuestionPrompt && (
                            <p className="text-sm font-semibold leading-relaxed text-slate-800">
                              Câu hỏi: {audioQuestionPrompt}
                            </p>
                          )}
                        </div>
                        {renderReviewDetails(audioReviewQuestion)}
                        <div className="flex justify-end text-xs font-bold text-indigo-900">
                          {rawUrl && (
                            <a
                              href={rawUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:underline text-indigo-700"
                            >
                              Mở link Drive <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Direct HTML5 Audio player for Google Drive link */}
                        {playableUrl && (
                          <audio controls src={playableUrl} className="w-full h-8 rounded-md" />
                        )}

                        {selectedSub.audios?.[idx]?.teacherFeedbackUrl && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                            <p className="text-xs font-bold text-emerald-900">File chữa phát âm của giáo viên:</p>
                            <audio
                              controls
                              src={getDriveAudioPlayerUrl(selectedSub.audios[idx].teacherFeedbackUrl || '')}
                              className="w-full h-8"
                            />
                          </div>
                        )}

                        {/* Per-audio comment input for teacher */}
                        <div className="pt-2 border-t border-indigo-100 space-y-1">
                          <label className="block text-xs font-semibold text-indigo-900">
                            🎙️ Nhận xét của giáo viên cho bài ghi âm này:
                          </label>
                          <input
                            type="text"
                            value={itemComments[`audio_${idx}`] || ''}
                            onChange={(e) => setItemComments((prev) => ({ ...prev, [`audio_${idx}`]: e.target.value }))}
                            placeholder="Nhập nhận xét riêng cho bài ghi âm này..."
                            className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-indigo-50/50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div className="pt-2 border-t border-indigo-100 space-y-2">
                          <p className="text-xs font-semibold text-emerald-900">
                            🎙️ Ghi âm lời chữa phát âm cho học sinh:
                          </p>
                          {uploadingFeedbackAudio === `audio_${idx}` && (
                            <p className="text-[11px] text-emerald-700 font-semibold">Đang lưu file chữa lên bộ nhớ dùng chung...</p>
                          )}
                          <AudioRecorder
                            label="Ghi âm mẫu để học sinh nghe lại"
                            onAudioRecorded={(record) => void handleTeacherFeedbackRecorded(idx, record)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                audioReviewQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Không có file ghi âm cho bài làm này.</p>
                ) : null
              )}
            </div>

              </div>
            )}

            {/* ORDERED TEACHER REVIEW */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Câu hỏi theo đúng thứ tự đề</h4>
                  <p className="mt-1 text-xs text-slate-500">Recording, bài làm và nhận xét được ghép bằng ID câu hỏi.</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Chế độ xem chấm bài">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={gradingViewMode === 'incorrect'}
                    onClick={() => setGradingViewMode('incorrect')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${gradingViewMode === 'incorrect' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Câu sai + đã làm ({incorrectTeacherQuestions.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={gradingViewMode === 'teacher_review'}
                    onClick={() => setGradingViewMode('teacher_review')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${gradingViewMode === 'teacher_review' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Tất cả câu tự luận ({teacherReviewQuestions.length})
                  </button>
                </div>
              </div>

              {visibleTeacherQuestions.length > 0 ? (
                <div className="space-y-3">
                  {visibleTeacherQuestions.map((item, index) => (
                    <React.Fragment key={item.questionId}>
                      {(index === 0 || visibleTeacherQuestions[index - 1].sectionTitle !== item.sectionTitle) && (
                        <h5 className="border-b border-slate-200 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                          {item.sectionTitle}
                        </h5>
                      )}
                      {renderTeacherQuestionCard(item)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {gradingViewMode === 'incorrect'
                    ? 'Không có câu sai hoặc câu tự luận / nói đã làm.'
                    : 'Không có câu tự luận hoặc câu cần giáo viên chấm.'}
                </div>
              )}
            </section>

            {/* TEACHER GRADING FORM */}
            <form onSubmit={handleSaveGrade} className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">Nhập Kết Quả Chấm Điểm & Nhận Xét (GV)</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm bài tập chung
                  </label>
                  <input
                    type="text"
                    value={speakScoreInput}
                    onChange={(e) => setSpeakScoreInput(e.target.value)}
                    placeholder="Ví dụ: 9/10, 8.5 hoặc Đạt"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhận xét chi tiết của GV</label>
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ví dụ: Phát âm thanh điệu chuẩn, ngắt nghỉ tự nhiên..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              {/* Upload Corrected Images by Teacher */}
              <div className="space-y-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    Tải Ảnh Bài Chữa / Nhận Xét Viết Tay Của Giáo Viên ({modalCorrectedImages.length} ảnh):
                  </label>
                  <label className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingCorrected ? 'Đang nén & tải ảnh...' : 'Thêm ảnh bài chữa'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleCorrectedUploadInModal}
                      disabled={isUploadingCorrected}
                      className="hidden"
                    />
                  </label>
                </div>

                {modalCorrectedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {modalCorrectedImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-emerald-300 bg-slate-900 aspect-4/3">
                        <img src={getDriveMediaPlayerUrl(imgUrl)} alt={`Corrected ${idx + 1}`} className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setModalCorrectedImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition"
                          title="Xóa ảnh chữa này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 italic">Chưa có ảnh bài chữa nào được tải lên.</p>
                )}
              </div>

              {gradeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã cập nhật điểm bài tập và nhận xét thành công!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  {isGrading ? 'Đang lưu...' : 'Lưu Điểm Chấm & Nhận Xét'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Câu Hỏi */}
      <EditQuestionModal
        question={editingQuestion}
        isOpen={!!editingQuestion}
        onClose={() => {
          setEditingQuestion(null);
          setEditingReadingQuestion(null);
        }}
        onSave={handleSaveEditQuestion}
      />

      {/* Modal Soạn / Sửa Bài Chép Tay */}
      {showCreateHwModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto p-5 space-y-4">
            <HandwritingExerciseEditor
              initialExercise={editingHwExercise || undefined}
              onSave={async (savedEx) => {
                saveHandwritingExercise(savedEx);
                await saveServerHandwritingExercise(savedEx);
                if (onSaveCustomExam) {
                  await onSaveCustomExam(convertHandwritingToExamLesson(savedEx));
                }
                setHwExercises(getHandwritingExercises());
                setShowCreateHwModal(false);
                setEditingHwExercise(null);
              }}
              onCancel={() => {
                setShowCreateHwModal(false);
                setEditingHwExercise(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Chấm Bài Chép Tay */}
      {selectedHwSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto p-5 max-h-[90vh] overflow-y-auto">
            <HandwritingGradingPanel
              submission={selectedHwSub}
              onGradingComplete={() => {
                setSelectedHwSub(null);
                loadSubmissions(passwordInput);
              }}
              onClose={() => setSelectedHwSub(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
