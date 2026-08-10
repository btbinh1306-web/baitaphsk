import React, { useEffect, useState } from 'react';
import { SubmissionData, ExamLesson, VocabItem, Question, ReadingPassage } from '../types';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { fetchTeacherSubmissions, gradeSubmissionInGas, getGasConfig } from '../services/gasService';
import { speakText } from '../utils/tts';
import { sanitizeExamSections } from '../utils/lessonParser';
import { getAudioSrcFromObject, getDriveAudioPlayerUrl } from '../utils/audioUtils';
import { fileToCompressedDataUrl } from '../utils/imageUtils';
import { ImportLesson } from './ImportLesson';
import { EditQuestionModal } from './EditQuestionModal';
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
  Image as ImageIcon
} from 'lucide-react';

interface TeacherPortalProps {
  customExams?: ExamLesson[];
  deletedExamIds?: string[];
  onSaveCustomExam?: (exam: ExamLesson) => void;
  onDeleteCustomExam?: (examId: string) => void;
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
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'HANDWRITING' | 'OTHER'>('ALL');

  // Selected Submission for Modal Detail & Grading
  const [selectedSub, setSelectedSub] = useState<SubmissionData | null>(null);
  const [speakScoreInput, setSpeakScoreInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [modalCorrectedImages, setModalCorrectedImages] = useState<string[]>([]);
  const [isUploadingCorrected, setIsUploadingCorrected] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  // All Available Exams
  const rawExams = [...customExams, ...SAMPLE_EXAMS.filter((s) => !customExams.some((c) => c.id === s.id))];
  const allExams = rawExams.filter((e) => !deletedExamIds.includes(e.id));

  // Delete Confirm & Notice state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Exam Selection for Editing
  const initialExam = sanitizeExamSections(allExams[0] || SAMPLE_EXAMS[0]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExam?.id || 'hsk3-b1');
  const [editingExam, setEditingExam] = useState<ExamLesson>({
    ...initialExam,
    vocabList: initialExam?.vocabList || [],
    mcQuestions: initialExam?.mcQuestions || [],
    fillQuestions: initialExam?.fillQuestions || [],
    arrangeQuestions: initialExam?.arrangeQuestions || [],
    listeningQuestions: initialExam?.listeningQuestions || [],
    essayQuestions: initialExam?.essayQuestions || [],
    speakingQuestions: initialExam?.speakingQuestions || [],
    translationQuestions: initialExam?.translationQuestions || []
  });

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

  // Editing Modal state for questions
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleSaveEditQuestion = (updatedQ: Question) => {
    if (!editingExam) return;
    const updatedExam = { ...editingExam };

    const removeQ = (arr?: Question[]) => arr?.filter((q) => q.id !== updatedQ.id);
    const type = updatedQ.type;

    updatedExam.mcQuestions = removeQ(updatedExam.mcQuestions) || [];
    updatedExam.fillQuestions = removeQ(updatedExam.fillQuestions);
    updatedExam.arrangeQuestions = removeQ(updatedExam.arrangeQuestions);
    updatedExam.listeningQuestions = removeQ(updatedExam.listeningQuestions);
    updatedExam.essayQuestions = removeQ(updatedExam.essayQuestions) || [];
    updatedExam.speakingQuestions = removeQ(updatedExam.speakingQuestions) || [];
    updatedExam.translationQuestions = removeQ(updatedExam.translationQuestions);

    if (type === 'mc') {
      updatedExam.mcQuestions = [...updatedExam.mcQuestions, updatedQ];
    } else if (type === 'fill') {
      updatedExam.fillQuestions = [...(updatedExam.fillQuestions || []), updatedQ];
    } else if (type === 'arrange') {
      updatedExam.arrangeQuestions = [...(updatedExam.arrangeQuestions || []), updatedQ];
    } else if (
      type === 'listening_mc' ||
      type === 'listening_tf' ||
      type === 'listening_multiple_choice' ||
      type === 'listening_true_false'
    ) {
      updatedExam.listeningQuestions = [...(updatedExam.listeningQuestions || []), updatedQ];
    } else if (type === 'essay') {
      updatedExam.essayQuestions = [...updatedExam.essayQuestions, updatedQ];
    } else if (type === 'speaking' || type === 'speaking_record') {
      updatedExam.speakingQuestions = [...updatedExam.speakingQuestions, updatedQ];
    } else if (type === 'translation') {
      updatedExam.translationQuestions = [...(updatedExam.translationQuestions || []), updatedQ];
    } else {
      updatedExam.mcQuestions = [...updatedExam.mcQuestions, updatedQ];
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

    const updatedListen = [...(editingExam.listeningQuestions || []), newQ];
    const updatedExam = { ...editingExam, listeningQuestions: updatedListen };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewListenPrompt('');
    setNewListenPinyin('');
    setNewListenAudioUrl('');
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
    const res = await fetchTeacherSubmissions(pass);
    if (res.ok && res.rows) {
      setSubmissions(res.rows);
    } else {
      setErrorMsg(res.error || 'Không thể lấy dữ liệu bài nộp');
    }
    setIsLoading(false);
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
    setCommentInput(sub.comment || '');
    setItemComments({});
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
      commentInput.trim()
    ].filter(Boolean).join(' | ');

    const res = await gradeSubmissionInGas(
      selectedSub.id,
      speakScoreInput,
      finalComment,
      passwordInput || config.teacherPass,
      modalCorrectedImages
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

  // Save changes to current exam
  const handleSaveExamChanges = async () => {
    if (!editingExam.title) {
      alert('Vui lòng nhập Tên bài thi');
      return;
    }
    if (onSaveCustomExam) {
      await onSaveCustomExam(editingExam);
      alert(`Đã lưu thành công bài thi: "${editingExam.title}"! Học sinh có thể làm bài ngay.`);
    }
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
      acceptableAnswers: newFillAnswer.trim()
    };

    const updatedFill = [...(editingExam.fillQuestions || []), newQ];
    const updatedExam = { ...editingExam, fillQuestions: updatedFill };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewFillPrompt('');
    setNewFillAnswer('');
  };

  const handleDeleteFillQuestion = (qId: string) => {
    const updatedFill = (editingExam.fillQuestions || []).filter((q) => q.id !== qId);
    const updatedExam = { ...editingExam, fillQuestions: updatedFill };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);
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

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;

    const isHw =
      sub.isHandwriting ||
      (sub.submissionImages && sub.submissionImages.length > 0) ||
      (sub.essays && (sub.essays.includes('[Nộp bài chép tay]') || sub.essays.includes('chép'))) ||
      sub.lesson.toLowerCase().includes('chép') ||
      sub.lesson.toLowerCase().includes('nộp ảnh');

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'HANDWRITING' && isHw) ||
      (typeFilter === 'OTHER' && !isHw);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.name.toLowerCase().includes(q) ||
      sub.class.toLowerCase().includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      sub.lesson.toLowerCase().includes(q);

    return matchesStatus && matchesType && matchesSearch;
  });

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
              Nghe ghi âm phát âm, chấm điểm khẩu ngữ, đưa ra nhận xét và nhập giáo trình bằng file JSON.
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
                placeholder="Tìm theo Tên học sinh, Lớp, Bài học hoặc Mã bài nộp..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">Tất cả loại bài</option>
                <option value="HANDWRITING">📝 Nộp ảnh / Bài viết tay</option>
                <option value="OTHER">📊 Khác (Trắc nghiệm / Tự luận)</option>
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
                      <th className="p-3.5">Bài thi / Đề bài</th>
                      <th className="p-3.5">Kết quả / Loại bài</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSubmissions.map((sub) => {
                      const isHw =
                        sub.isHandwriting ||
                        (sub.submissionImages && sub.submissionImages.length > 0) ||
                        (sub.essays && (sub.essays.includes('[Nộp bài chép tay]') || sub.essays.includes('chép'))) ||
                        sub.lesson.toLowerCase().includes('chép') ||
                        sub.lesson.toLowerCase().includes('nộp ảnh');

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono font-bold text-red-700">{sub.id}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{sub.name}</div>
                            <div className="text-xs text-slate-500">Lớp: {sub.class}</div>
                            {isHw && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 mt-1">
                                <Pencil className="w-3 h-3 text-teal-600" /> Bài chép tay / Nộp ảnh
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-slate-700" title={sub.lesson}>
                            {sub.lesson}
                          </td>
                          <td className="p-3.5">
                            {isHw ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-flex items-center gap-1.5 text-xs w-fit">
                                  <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> {sub.submissionImages?.length || 1} ảnh bài nộp
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">
                                  {sub.total > 0 ? Math.round((sub.correct / sub.total) * 100) : (sub.percent <= 1 && sub.percent > 0 ? Math.round(sub.percent * 100) : sub.percent)}%
                                </span>
                                <span className="text-xs text-slate-500 block">
                                  ({sub.correct}/{sub.total} câu)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {sub.status === 'Đã chấm' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm ({sub.speakScore || 'N/A'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" /> Chờ chấm
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {isHw ? (
                              <button
                                type="button"
                                onClick={() => openGradingModal(sub)}
                                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Chấm bài chép tay <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openGradingModal(sub)}
                                className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Chấm bài / Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
            setEditingExam(sanitizeExamSections(newExam));
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
                Chỉnh sửa từ vựng, câu hỏi trắc nghiệm, bài điền từ, xếp câu chip, bài dịch và ghi âm phát âm.
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                      essayQuestions: [],
                      speakingQuestions: [],
                      translationQuestions: []
                    };
                    setEditingExam(newExam);
                  } else {
                    const found = allExams.find((item) => item.id === selectedId);
                    if (found) {
                      const cleanFound = sanitizeExamSections(found);
                      setEditingExam({
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
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    [{ex.level || 'HSK'}] {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editingExam.id !== 'NEW' && (
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editingExam, null, 2));
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
                    onClick={() => {
                      const idToDelete = editingExam.id;
                      const titleToDelete = editingExam.title;
                      const remaining = allExams.filter((e) => e.id !== idToDelete);
                      const fallbackRaw = remaining[0] || SAMPLE_EXAMS[0];
                      const fallback = fallbackRaw ? sanitizeExamSections(fallbackRaw) : null;

                      onDeleteCustomExam(idToDelete);
                      setShowDeleteConfirm(false);
                      setDeleteNotice(`Đã xóa bài thi "${titleToDelete}" thành công!`);

                      if (fallback) {
                        setSelectedExamId(fallback.id);
                        setEditingExam({
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
                Quản Lý Bài Tập Luyện Nghe ({(editingExam.listeningQuestions || []).length} câu)
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
                          {q.type === 'listening_tf' || q.type === 'listening_true_false'
                            ? '🎧 Nghe Phán Đoán Đúng / Sai'
                            : q.type === 'listening_fill' || q.type === 'listening_fill_in_blank'
                            ? '🎧 Nghe Điền Tự Luận'
                            : '🎧 Nghe Tích Trắc Nghiệm ABCD'}
                        </span>
                      </div>
                      {q.pinyin && <p className="text-indigo-600 font-mono">Pinyin: {q.pinyin}</p>}
                      
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
                        onClick={() => setEditingQuestion(q)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title="Sửa câu hỏi này"
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
            <form onSubmit={handleAddListenQuestion} className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" /> Soạn Bài Tập Luyện Nghe Mới:
              </span>

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
                  <Plus className="w-4 h-4" /> Thêm Bài Tập Nghe
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
                        <img src={q.imageUrl} alt="Đề bài" className="h-16 rounded border border-slate-200 object-contain bg-white" />
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
                    <img src={newEssayImageUrl} alt="Preview" className="h-24 rounded-lg border border-slate-200 object-contain bg-white" />
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
                        <img src={q.imageUrl} alt="Hình luyện nói" className="h-16 rounded border border-slate-200 object-contain bg-white" />
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
                    <img src={newSpeakingImageUrl} alt="Preview" className="h-24 rounded-lg border border-slate-200 object-contain bg-white" />
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
                  {selectedSub.total > 0 ? Math.round((selectedSub.correct / selectedSub.total) * 100) : (selectedSub.percent <= 1 && selectedSub.percent > 0 ? Math.round(selectedSub.percent * 100) : selectedSub.percent)}% ({selectedSub.correct}/{selectedSub.total})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Trạng thái</span>
                <span className="font-semibold text-slate-800">{selectedSub.status}</span>
              </div>
            </div>

            {/* Wrong Answers List if any */}
            {selectedSub.wrong && selectedSub.wrong !== 'Không có câu sai' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-800 block">Chi tiết các câu làm sai:</span>
                <p className="text-xs text-rose-900 whitespace-pre-wrap font-mono leading-relaxed">{selectedSub.wrong}</p>
              </div>
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
                    onClick={() => speakText(selectedSub.essays)}
                    className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Nghe đọc bài tự luận
                  </button>
                )}
              </div>

              {selectedSub.essays && selectedSub.essays !== 'Không làm phần tự luận' ? (
                <div className="space-y-3">
                  {selectedSub.essays.split(/(?=【)/g).filter(Boolean).map((chunk, idx) => {
                    const titleMatch = chunk.match(/【(.*?)】/);
                    const title = titleMatch ? titleMatch[1] : `Câu ${idx + 1}`;
                    const answer = chunk.replace(/【.*?】\n?/, '').replace(/^Bài làm:\s*/, '').trim();

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

              {/* Local audio records */}
              {selectedSub.audios && selectedSub.audios.length > 0 ? (
                <div className="space-y-3">
                  {selectedSub.audios.map((aud, idx) => {
                    const audioSrc = getAudioSrcFromObject(aud);
                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950">{aud.label || `Ghi âm câu ${idx + 1}`}</span>
                        </div>
                        {audioSrc ? (
                          <audio controls src={audioSrc} className="w-full h-8" />
                        ) : (
                          <p className="text-xs text-rose-600 font-medium">Không thể tải file âm thanh ghi âm này.</p>
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
                            placeholder="Nhập nhận xét riêng cho bài ghi âm này (ví dụ: phát âm chuẩn, chú ý thanh 3/thanh 4...)..."
                            className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-indigo-50/50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
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

                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                          <span>{link.split(':')[0] || `File ghi âm câu ${idx + 1}`}</span>
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Không có file ghi âm cho bài làm này.</p>
              )}
            </div>

            {/* TEACHER GRADING FORM */}
            <form onSubmit={handleSaveGrade} className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">Nhập Kết Quả Chấm Điểm & Nhận Xét (GV)</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm phần Nói (Khẩu ngữ)
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
                        <img src={imgUrl} alt={`Corrected ${idx + 1}`} className="w-full h-full object-contain" />
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
                  <span>Đã cập nhật điểm nói và nhận xét thành công!</span>
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
        onClose={() => setEditingQuestion(null)}
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
