import React, { useState } from 'react';
import { SubmissionData, ExamLesson, VocabItem, Question, ReadingPassage } from '../types';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { fetchTeacherSubmissions, gradeSubmissionInGas, getGasConfig } from '../services/gasService';
import { generateExamWithAI } from '../services/aiExamService';
import { speakText } from '../utils/tts';
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
  Sparkles,
  Save,
  Wand2,
  FileText
} from 'lucide-react';

interface TeacherPortalProps {
  customExams?: ExamLesson[];
  onSaveCustomExam?: (exam: ExamLesson) => void;
  onDeleteCustomExam?: (examId: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  customExams = [],
  onSaveCustomExam,
  onDeleteCustomExam
}) => {
  const config = getGasConfig();
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'submissions' | 'editor' | 'ai_creator'>('submissions');

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Chờ chấm' | 'Đã chấm'>('ALL');

  // Selected Submission for Modal Detail & Grading
  const [selectedSub, setSelectedSub] = useState<SubmissionData | null>(null);
  const [speakScoreInput, setSpeakScoreInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  // All Available Exams
  const allExams = [...customExams, ...SAMPLE_EXAMS.filter((s) => !customExams.some((c) => c.id === s.id))];

  // Exam Selection for Editing
  const initialExam = allExams[0] || SAMPLE_EXAMS[0];
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExam?.id || 'hsk3-b1');
  const [editingExam, setEditingExam] = useState<ExamLesson>({
    ...initialExam,
    vocabList: initialExam?.vocabList || [],
    mcQuestions: initialExam?.mcQuestions || [],
    fillQuestions: initialExam?.fillQuestions || [],
    arrangeQuestions: initialExam?.arrangeQuestions || [],
    essayQuestions: initialExam?.essayQuestions || [],
    speakingQuestions: initialExam?.speakingQuestions || [],
    translationQuestions: initialExam?.translationQuestions || []
  });

  // AI Exam Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState<ExamLesson['level']>('HSK 3');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

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

  // New Speaking Question state
  const [newSpeakingPrompt, setNewSpeakingPrompt] = useState('');
  const [newSpeakingPinyin, setNewSpeakingPinyin] = useState('');

  // New Translation Question state
  const [newTransType, setNewTransType] = useState<'vi_to_zh_audio' | 'vi_to_zh_text' | 'zh_to_vi_text'>('vi_to_zh_audio');
  const [newTransPrompt, setNewTransPrompt] = useState('');
  const [newTransPinyin, setNewTransPinyin] = useState('');
  const [newTransSuggestedAnswer, setNewTransSuggestedAnswer] = useState('');

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
    setSelectedSub(sub);
    setSpeakScoreInput(String(sub.speakScore || ''));
    setCommentInput(sub.comment || '');
    setItemComments({});
    setGradeSuccess(false);
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
      passwordInput || config.teacherPass
    );

    if (res.ok) {
      setGradeSuccess(true);
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === selectedSub.id
            ? { ...item, speakScore: speakScoreInput, comment: finalComment, status: 'Đã chấm' }
            : item
        )
      );
      setSelectedSub((prev) =>
        prev ? { ...prev, speakScore: speakScoreInput, comment: finalComment, status: 'Đã chấm' } : null
      );
    } else {
      alert(res.error || 'Không thể lưu điểm chấm');
    }
    setIsGrading(false);
  };

  // AI Exam Generation Handler
  const handleGenerateAiExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      alert('Vui lòng nhập chủ đề hoặc danh sách từ vựng bài học.');
      return;
    }
    setIsAiGenerating(true);
    setAiSuccessMsg(null);

    try {
      const generated = await generateExamWithAI(aiTopic.trim(), aiLevel);
      if (onSaveCustomExam) {
        onSaveCustomExam(generated);
      }
      setEditingExam(generated);
      setAiSuccessMsg(`Đã tạo thành công bài thi AI: "${generated.title}"! Đã tự động lưu vào danh sách.`);
      setAiTopic('');
    } catch (err) {
      console.error(err);
      alert('Không thể tạo bài thi bằng AI. Vui lòng thử lại.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save changes to current exam
  const handleSaveExamChanges = () => {
    if (!editingExam.title) {
      alert('Vui lòng nhập Tên bài thi');
      return;
    }
    if (onSaveCustomExam) {
      onSaveCustomExam(editingExam);
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
      suggestedAnswer: newEssayAnswer.trim() || undefined
    };

    const updatedEssay = [...(editingExam.essayQuestions || []), newQ];
    const updatedExam = { ...editingExam, essayQuestions: updatedEssay };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewEssayPrompt('');
    setNewEssayAnswer('');
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
    const newQ: Question = {
      id: `s_${Date.now()}`,
      type: 'speaking',
      tier: 'tier3',
      prompt: newSpeakingPrompt.trim(),
      pinyin: newSpeakingPinyin.trim() || undefined
    };

    const updatedSpeaking = [...(editingExam.speakingQuestions || []), newQ];
    const updatedExam = { ...editingExam, speakingQuestions: updatedSpeaking };
    setEditingExam(updatedExam);
    if (onSaveCustomExam) onSaveCustomExam(updatedExam);

    setNewSpeakingPrompt('');
    setNewSpeakingPinyin('');
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
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.name.toLowerCase().includes(q) ||
      sub.class.toLowerCase().includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      sub.lesson.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
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
              <h2 className="text-xl font-bold text-slate-800">Cổng Quản Lý, Chấm Bài & Soạn Đề Thi AI</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nghe ghi âm phát âm, chấm điểm khẩu ngữ, đưa ra nhận xét và dùng AI soạn/sửa bài thi tự động.
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
            onClick={() => setActiveTab('ai_creator')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai_creator'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> AI Soạn Đề Thi Mới Tự Động
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

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
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
                      <th className="p-3.5">Bài thi</th>
                      <th className="p-3.5">Trắc nghiệm</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-red-700">{sub.id}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{sub.name}</div>
                          <div className="text-xs text-slate-500">Lớp: {sub.class}</div>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-700" title={sub.lesson}>
                          {sub.lesson}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800">{sub.percent}%</span>
                          <span className="text-xs text-slate-500 block">
                            ({sub.correct}/{sub.total} câu)
                          </span>
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
                          <button
                            type="button"
                            onClick={() => openGradingModal(sub)}
                            className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Chấm bài / Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI EXAM GENERATOR */}
      {activeTab === 'ai_creator' && (
        <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-purple-100 pb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">AI Trợ Lý Soạn Đề Thi Tiếng Trung</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Nhập chủ đề hoặc danh sách từ vựng. Trợ lý AI sẽ tự động tạo bảng từ vựng, câu hỏi trắc nghiệm, bài điền từ, xếp câu chip, đoạn đọc hiểu và bài ghi âm luyện nói.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateAiExam} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trình độ HSK
              </label>
              <select
                value={aiLevel}
                onChange={(e: any) => setAiLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="HSK 1">HSK 1</option>
                <option value="HSK 2">HSK 2</option>
                <option value="HSK 3">HSK 3</option>
                <option value="HSK 4">HSK 4</option>
                <option value="HSK 5">HSK 5</option>
                <option value="HSK 6">HSK 6</option>
                <option value="Luyện nói">Luyện nói & Khẩu ngữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chủ đề hoặc Danh sách từ vựng cần soạn <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Ví dụ: Soạn bài thi HSK 3 Bài 2 chủ đề Mua sắm & Đồ ăn 饮料, 啤酒, 瘦, 花, 拿..."
                required
                className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {aiSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{aiSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAiGenerating}
              className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition cursor-pointer disabled:opacity-60"
            >
              {isAiGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI Đang Tự Động Soạn Đề Thi...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Tự Động Soạn Bài Thi Bằng AI
                </>
              )}
            </button>
          </form>
        </div>
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
                      essayQuestions: [],
                      speakingQuestions: [],
                      translationQuestions: []
                    };
                    setEditingExam(newExam);
                  } else {
                    const found = allExams.find((item) => item.id === selectedId);
                    if (found) {
                      setEditingExam({
                        ...found,
                        vocabList: found.vocabList || [],
                        mcQuestions: found.mcQuestions || [],
                        fillQuestions: found.fillQuestions || [],
                        arrangeQuestions: found.arrangeQuestions || [],
                        essayQuestions: found.essayQuestions || [],
                        speakingQuestions: found.speakingQuestions || [],
                        translationQuestions: found.translationQuestions || []
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

            {onDeleteCustomExam && customExams.some((c) => c.id === editingExam.id) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc muốn xóa bài thi "${editingExam.title}"?`)) {
                    onDeleteCustomExam(editingExam.id);
                    const remaining = allExams.filter((e) => e.id !== editingExam.id);
                    const fallback = remaining[0] || SAMPLE_EXAMS[0];
                    setEditingExam({
                      ...fallback,
                      vocabList: fallback.vocabList || [],
                      mcQuestions: fallback.mcQuestions || [],
                      fillQuestions: fallback.fillQuestions || [],
                      arrangeQuestions: fallback.arrangeQuestions || [],
                      essayQuestions: fallback.essayQuestions || [],
                      speakingQuestions: fallback.speakingQuestions || []
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg font-semibold transition border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa bài thi này
              </button>
            )}
          </div>

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
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteVocabItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => handleDeleteMcQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => handleDeleteFillQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => handleDeleteArrQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

          {/* Form Thêm Bài Tự Luận & Dịch Thuật */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Bài Tự Luận & Dịch Thuật ({(editingExam.essayQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.essayQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">C{idx + 1}: {q.prompt}</span>
                    {q.suggestedAnswer && (
                      <span className="text-slate-500 block mt-0.5">Gợi ý/Đáp án mẫu: {q.suggestedAnswer}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEssayQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddEssayQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Bài Tự Luận / Dịch Thuật Mới:</span>
              <textarea
                rows={2}
                value={newEssayPrompt}
                onChange={(e) => setNewEssayPrompt(e.target.value)}
                placeholder="Đề bài tự luận hoặc dịch thuật (Ví dụ: Dịch câu sau sang tiếng Trung: Kế hoạch của bạn là gì?)"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newEssayAnswer}
                onChange={(e) => setNewEssayAnswer(e.target.value)}
                placeholder="Gợi ý/Đáp án mẫu (không bắt buộc, ví dụ: 你的打算是什么？)"
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

          {/* Form Thêm Bài Khẩu Ngữ & Luyện Ghi Âm */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Quản Lý Bài Khẩu Ngữ & Luyện Ghi Âm ({(editingExam.speakingQuestions || []).length} câu)</h4>

            <div className="space-y-2">
              {(editingExam.speakingQuestions || []).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">C{idx + 1}: {q.prompt}</span>
                      <button
                        type="button"
                        onClick={() => speakText(q.prompt)}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Nghe mẫu TTS"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {q.pinyin && <span className="text-indigo-600 font-mono block mt-0.5">Pinyin: {q.pinyin}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSpeakingQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSpeakingQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Soạn Câu Luyện Nói / Khẩu Ngữ Mới:</span>
              <input
                type="text"
                value={newSpeakingPrompt}
                onChange={(e) => setNewSpeakingPrompt(e.target.value)}
                placeholder="Câu tiếng Trung cần học sinh phát âm ghi âm (Ví dụ: 我最近比较忙。)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newSpeakingPinyin}
                onChange={(e) => setNewSpeakingPinyin(e.target.value)}
                placeholder="Phiên âm Pinyin (Ví dụ: Wǒ zuìjìn bǐjiào máng.)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
              />
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
                  <button
                    type="button"
                    onClick={() => handleDeleteTransQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  {selectedSub.percent}% ({selectedSub.correct}/{selectedSub.total})
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
                    const audioSrc = aud.url || `data:${aud.mime || 'audio/webm'};base64,${aud.data}`;
                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950">{aud.label || `Ghi âm câu ${idx + 1}`}</span>
                        </div>
                        <audio controls src={audioSrc} className="w-full h-8" />

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
                  <p className="text-slate-600 font-medium">Link file ghi âm trên Google Drive (từ Sheet):</p>
                  {selectedSub.driveLinks.split('\n').filter(Boolean).map((link, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                        <span>File ghi âm câu {idx + 1}:</span>
                        <a
                          href={link.substring(link.indexOf('http'))}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline text-indigo-700"
                        >
                          Mở link Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

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
                  ))}
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
    </div>
  );
};
