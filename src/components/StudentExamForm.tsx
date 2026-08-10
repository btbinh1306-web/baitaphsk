import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { AudioRecorder } from './AudioRecorder';
import { AudioRecordItem, ExamLesson } from '../types';
import { submitToGas } from '../services/gasService';
import { speakText } from '../utils/tts';
import { sanitizeExamSections } from '../utils/lessonParser';
import { ExerciseRenderer } from './ExerciseRenderer';
import { HandwritingExerciseView, HandwritingExerciseViewHandle } from './exercises/HandwritingExerciseView';
import { getHandwritingExercises, convertHandwritingToExamLesson } from '../services/handwritingService';
import { fetchServerHandwritingExercises } from '../services/apiService';
import { loadFormDraft, useStudentFormDraft } from '../hooks/useStudentFormDraft';
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
  Image as ImageIcon
} from 'lucide-react';

interface StudentExamFormProps {
  customExams?: ExamLesson[];
  deletedExamIds?: string[];
  onSuccessNavigateToResult: (submissionId: string) => void;
}

export const StudentExamForm: React.FC<StudentExamFormProps> = ({
  customExams = [],
  deletedExamIds = [],
  onSuccessNavigateToResult
}) => {
  const [serverHwExamLessons, setServerHwExamLessons] = useState<ExamLesson[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchServerHandwritingExercises().then((exercises) => {
      if (!cancelled) {
        setServerHwExamLessons(exercises.map(convertHandwritingToExamLesson));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load handwriting exercises from handwritingService
  const hwExamLessons = useMemo(() => {
    try {
      return getHandwritingExercises().map(convertHandwritingToExamLesson);
    } catch (e) {
      return [];
    }
  }, []);

  // Combine custom exams, handwriting exercises, and sample exams
  const rawExams = useMemo(() => {
    const list: ExamLesson[] = [...customExams];

    serverHwExamLessons.forEach((hw) => {
      if (!list.some((e) => e.id === hw.id)) {
        list.push(hw);
      }
    });

    // Add handwriting exercises if not already in customExams
    hwExamLessons.forEach((hw) => {
      if (!list.some((e) => e.id === hw.id)) {
        list.push(hw);
      }
    });

    // Add sample exams if not already in customExams
    SAMPLE_EXAMS.forEach((s) => {
      if (!list.some((e) => e.id === s.id)) {
        list.push(s);
      }
    });

    return list;
  }, [customExams, hwExamLessons]);

  const allExams = useMemo(() => {
    return rawExams.filter(
      (e) =>
        !deletedExamIds.includes(e.id) &&
        e.id !== 'hw_hsk1_b5' &&
        !e.title.includes('HSK1 Bài 5') &&
        !e.title.includes('HSK 1 Bài 5')
    );
  }, [rawExams, deletedExamIds]);

  const filteredExams = allExams;

  // Load draft from localStorage on initial mount
  const initialDraft = useMemo(() => loadFormDraft(), []);

  const [studentName, setStudentName] = useState(() => initialDraft?.studentName || '');
  const [studentClass, setStudentClass] = useState(() => initialDraft?.studentClass || '');
  const [selectedExamId, setSelectedExamId] = useState(
    () => initialDraft?.selectedExamId || allExams[0]?.id || 'hsk3-b1'
  );

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

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const handwritingViewRef = useRef<HandwritingExerciseViewHandle>(null);

  // Persist form draft automatically in localStorage
  const { clearDraft } = useStudentFormDraft(
    {
      studentName,
      studentClass,
      selectedExamId,
      vocabUnlocked,
      mcAnswers,
      fillAnswers,
      arrangeAnswers,
      essayAnswers,
      questionComments,
      unlockedReference,
    },
    !!submittedId
  );

  const rawCurrentExam: ExamLesson =
    allExams.find((e) => e.id === selectedExamId) || allExams[0] || SAMPLE_EXAMS[0];

  const currentExam: ExamLesson = useMemo(() => sanitizeExamSections(rawCurrentExam), [rawCurrentExam]);

  const groupedFillQuestions = useMemo(() => {
    if (!currentExam.fillQuestions) return [];
    const groups: { tier: string; wordBank?: string[]; questions: typeof currentExam.fillQuestions }[] = [];
    currentExam.fillQuestions.forEach((q) => {
      const tierKey = q.tier || 'tier1';
      let g = groups.find((item) => item.tier === tierKey);
      if (!g) {
        g = { tier: tierKey, wordBank: q.wordBank, questions: [] };
        groups.push(g);
      }
      if (!g.wordBank && q.wordBank) {
        g.wordBank = q.wordBank;
      }
      g.questions.push(q);
    });
    return groups;
  }, [currentExam.fillQuestions]);

  const hasVocabList = !!(currentExam.vocabList && currentExam.vocabList.length > 0);
  // Strictly enforce: if exam has vocab list, questions MUST stay locked until user clicks "Đã học xong"
  const isVocabDone = !hasVocabList || !!vocabUnlocked[currentExam.id];

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setShowVocabTable(true);
  };

  const handleUnlockExam = () => {
    setVocabUnlocked((prev) => ({ ...prev, [currentExam.id]: true }));
    setShowVocabTable(false);
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);

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

      // 1. Grade MC Questions
      currentExam.mcQuestions.forEach((q, idx) => {
        const userAns = mcAnswers[q.id];
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
      if (currentExam.readingPassages) {
        currentExam.readingPassages.forEach((passage, pIdx) => {
          passage.questions.forEach((q, qIdx) => {
            const userAns = mcAnswers[q.id];
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
        currentExam.listeningQuestions.forEach((q, idx) => {
          if (q.type === 'listening_fill' || q.type === 'listening_fill_in_blank') {
            const userText = (fillAnswers[q.id] || '').trim();
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

      let totalMc =
        currentExam.mcQuestions.length +
        (currentExam.fillQuestions?.length || 0) +
        (currentExam.arrangeQuestions?.length || 0) +
        (currentExam.listeningQuestions?.length || 0);

      if (currentExam.readingPassages) {
        currentExam.readingPassages.forEach(p => {
          totalMc += p.questions.length;
        });
      }

      const doneMc = totalMc - notDoneCount;
      const percent = totalMc > 0 ? Math.round((correctCount / totalMc) * 100) : 100;

      // Format Essay & Text Translation Answers
      const essayParts = currentExam.essayQuestions.map((q) => {
        const ans = essayAnswers[q.id] || '(Chưa làm)';
        return `【${q.prompt}】\nBài làm: ${ans}`;
      });

      if (currentExam.translationQuestions) {
        currentExam.translationQuestions.forEach((q, idx) => {
          if (q.translationType === 'vi_to_zh_text' || q.translationType === 'zh_to_vi_text') {
            const ans = essayAnswers[q.id] || '(Chưa làm)';
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
      const audioList: Array<{ data: string; mime: string; label: string }> = [];
      currentExam.speakingQuestions.forEach((q, idx) => {
        const rec = audioRecords[q.id];
        if (rec) {
          audioList.push({
            label: `Phần nói C${idx + 1}: ${q.prompt}`,
            data: rec.data,
            mime: rec.mime
          });
        }
      });

      if (currentExam.translationQuestions) {
        currentExam.translationQuestions.forEach((q, idx) => {
          if (q.translationType === 'vi_to_zh_audio') {
            const rec = audioRecords[q.id];
            if (rec) {
              audioList.push({
                label: `Dịch & Ghi âm C${idx + 1}: ${q.prompt}`,
                data: rec.data,
                mime: rec.mime
              });
            }
          }
        });
      }

      const fullTimeStr = new Date().toLocaleString('vi-VN');

      const res = await submitToGas({
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderTierBadge = (tier?: string) => {
    if (tier === 'tier1') {
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Cấp 1: Tri thức</span>;
    }
    if (tier === 'tier2') {
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Cấp 2: Bán giao tiếp</span>;
    }
    if (tier === 'tier3') {
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-100 text-rose-800 rounded">Cấp 3: Giao tiếp tự do</span>;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-100 mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Hệ Thống Luyện Thi & Ôn Tập HSK Tương Tác
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{currentExam.title}</h2>
          <p className="text-teal-100 text-sm mt-1 max-w-2xl">{currentExam.description}</p>
        </div>
      </div>

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

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn bài học / Đề thi <span className="text-red-500">*</span>
              </label>

              <select
                value={selectedExamId}
                onChange={(e) => handleSelectExam(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition font-medium text-slate-800 truncate"
              >
                {filteredExams.map((ex) => {
                  const isHw =
                    ex.isHandwriting ||
                    ex.type === 'handwriting_submission' ||
                    (ex.handwritingQuestions && ex.handwritingQuestions.length > 0);
                  const hasLevelInTitle =
                    ex.title.toLowerCase().startsWith(ex.level.toLowerCase()) ||
                    ex.title.startsWith('[') ||
                    ex.title.startsWith('「');
                  const tag = hasLevelInTitle ? '' : `[${ex.level}] `;
                  const displayTitle = tag + ex.title;
                  return (
                    <option key={ex.id} value={ex.id}>
                      {displayTitle}
                    </option>
                  );
                })}
              </select>

              {(currentExam.isHandwriting ||
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

        {/* SECTION 0: VOCABULARY LEARNING SHEET & LOCK SYSTEM */}
        {hasVocabList && (
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
        {!isVocabDone ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2">
            <Lock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-base">Toàn bộ câu hỏi bài tập đang tạm khóa</p>
            <p className="text-xs text-slate-500">
              Vui lòng xem kỹ bảng từ vựng ở trên và bấm nút "Đã học xong" để mở bài tập.
            </p>
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
                {currentExam.sections.map((sec) => (
                  <div key={sec.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 text-lg">{sec.title}</h3>
                    </div>
                    <div className="space-y-6">
                      {sec.items.map((item) => (
                        <ExerciseRenderer key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-teal-600 text-sm mt-0.5">Câu {idx + 1}:</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{q.prompt}</p>
                          </div>
                        </div>
                        {renderTierBadge(q.tier)}
                      </div>

                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = mcAnswers[q.id] === optIdx;
                            return (
                              <button
                                type="button"
                                key={optIdx}
                                onClick={() => handleMcSelect(q.id, optIdx)}
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
                      {/* Group Header Badge */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md uppercase tracking-wider border border-emerald-200">
                          {group.tier === 'tier1' && '📌 Cấp 1: Tri thức - Điền từ vựng'}
                          {group.tier === 'tier2' && '📌 Cấp 2: Bán giao tiếp - Ngữ pháp & Hội thoại'}
                          {group.tier === 'tier3' && '📌 Cấp 3: Giao tiếp tự do'}
                        </span>
                      </div>

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
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                Câu {qIdx + 1}: {q.prompt}
                              </p>
                              {renderTierBadge(q.tier)}
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
                    const chips = q.wordChips || [];

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
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Câu {idx + 1}: {q.prompt}
                            </p>
                          </div>
                          {renderTierBadge(q.tier)}
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
                    {currentExam.listeningQuestions.filter(q => (q.type === 'listening_fill' || q.type === 'listening_fill_in_blank') ? !!fillAnswers[q.id]?.trim() : mcAnswers[q.id] !== undefined).length}/{currentExam.listeningQuestions.length} đã làm
                  </span>
                </div>

                <div className="space-y-6">
                  {currentExam.listeningQuestions.map((q, idx) => {
                    const isFillType = q.type === 'listening_fill' || q.type === 'listening_fill_in_blank';
                    const isTfType = q.type === 'listening_tf' || q.type === 'listening_true_false';

                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-indigo-700 text-sm mt-0.5">Câu nghe {idx + 1}:</span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{q.prompt}</p>
                              {q.pinyin && <p className="text-xs text-indigo-600 font-mono mt-0.5">Pinyin / Phiên âm: {q.pinyin}</p>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isTfType
                              ? 'bg-amber-100 text-amber-900'
                              : isFillType
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-indigo-100 text-indigo-900'
                          }`}>
                            {isTfType ? 'Nghe Phán Đoán Đúng / Sai' : isFillType ? 'Nghe Điền Tự Luận' : 'Nghe Tích Trắc Nghiệm ABCD'}
                          </span>
                        </div>

                        {/* Audio Player Component */}
                        <div className="p-3 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2 text-indigo-950 font-semibold text-xs shrink-0">
                            <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                            <span>File âm thanh bài nghe:</span>
                          </div>

                          {(q.audioUrl || q.audioPromptUrl) ? (
                            <audio controls src={q.audioUrl || q.audioPromptUrl} className="w-full sm:max-w-md h-9 rounded-md" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => speakText(q.pinyin || q.prompt)}
                              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-xs"
                            >
                              <Volume2 className="w-4 h-4" /> Bấm để phát âm thanh (Giọng đọc tự động TTS)
                            </button>
                          )}
                        </div>

                        {/* Fill in blank answer input or Multiple choice / True False options */}
                        {isFillType ? (
                          <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Nhập câu trả lời / từ điền tự luận:
                            </label>
                            <input
                              type="text"
                              value={fillAnswers[q.id] || ''}
                              onChange={(e) => setFillAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Gõ đáp án của bạn vào đây..."
                              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                            />
                          </div>
                        ) : q.options ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = mcAnswers[q.id] === optIdx;
                              return (
                                <button
                                  type="button"
                                  key={optIdx}
                                  onClick={() => handleMcSelect(q.id, optIdx)}
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
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 4: READING PASSAGES */}
            {currentExam.readingPassages && currentExam.readingPassages.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                      4
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Đọc Hiểu Đoạn Văn</h3>
                  </div>
                  {renderTierBadge('tier2')}
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
                            {q.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = mcAnswers[q.id] === optIdx;
                                  return (
                                    <button
                                      type="button"
                                      key={optIdx}
                                      onClick={() => handleMcSelect(q.id, optIdx)}
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                      5
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Viết & Tự Luận</h3>
                  </div>
                  {renderTierBadge('tier3')}
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
                              src={q.imageUrl}
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

            {/* SECTION 6: AUDIO RECORDING FOR SPEAKING */}
            {currentExam.speakingQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      6
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">Phần Luyện Nói & Ghi Âm</h3>
                  </div>
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {Object.keys(audioRecords).length}/{currentExam.speakingQuestions.length} câu đã ghi âm
                  </span>
                </div>

                <div className="space-y-4">
                  {currentExam.speakingQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      {q.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={q.imageUrl}
                            alt={`Hình ảnh luyện nói câu ${idx + 1}`}
                            className="max-h-72 max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-2xs"
                          />
                        </div>
                      )}
                      <AudioRecorder
                        label={`Câu ${idx + 1}: ${q.prompt}`}
                        onAudioRecorded={(rec) => handleAudioRecorded(q.id, rec)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: TRANSLATION PRACTICE (3 TYPES, NO EMOJIS, NO PINYIN, NO HINTS) */}
            {currentExam.translationQuestions && currentExam.translationQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm">
                      7
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Phần Luyện Dịch Thuật</h3>
                      <p className="text-xs text-slate-500">
                        Bao gồm dịch ghi âm phát âm, dịch câu viết Hán tự và dịch Trung - Việt
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    {currentExam.translationQuestions.length} câu dịch
                  </span>
                </div>

                <div className="space-y-6">
                  {currentExam.translationQuestions.map((q, idx) => {
                    // Dạng 1: Cho câu tiếng Việt -> Ghi âm câu tiếng Trung
                    if (q.translationType === 'vi_to_zh_audio') {
                      return (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200/80 text-slate-800">
                              Dạng 1: Dịch Tiếng Việt → Ghi âm Tiếng Trung
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Câu {idx + 1}: <span className="text-slate-900">{q.prompt}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Hãy đọc thành tiếng câu Tiếng Trung tương ứng và nhấn nút ghi âm bên dưới:
                            </p>
                          </div>

                          <AudioRecorder
                            label={`Ghi âm câu dịch ${idx + 1}`}
                            onAudioRecorded={(rec) => handleAudioRecorded(q.id, rec)}
                          />
                        </div>
                      );
                    }

                    // Dạng 2: Cho câu tiếng Việt -> Viết câu tiếng Trung
                    if (q.translationType === 'vi_to_zh_text') {
                      return (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200/80 text-slate-800">
                              Dạng 2: Dịch Tiếng Việt → Viết Tiếng Trung
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Câu {idx + 1}: <span className="text-slate-900">{q.prompt}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Hãy gõ câu dịch bằng chữ Hán:
                            </p>
                          </div>

                          <textarea
                            rows={2}
                            value={essayAnswers[q.id] || ''}
                            onChange={(e) => handleEssayChange(q.id, e.target.value)}
                            placeholder="Nhập câu dịch bằng chữ Hán..."
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-400 outline-none transition"
                          />
                        </div>
                      );
                    }

                    // Dạng 3: Cho câu tiếng Trung -> Dịch thành tiếng Việt
                    if (q.translationType === 'zh_to_vi_text') {
                      return (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200/80 text-slate-800">
                              Dạng 3: Dịch Tiếng Trung → Tiếng Việt
                            </span>
                          </div>

                          <div>
                            <p className="text-base font-bold text-slate-800">
                              Câu {idx + 1}: {q.prompt}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Hãy dịch câu Tiếng Trung trên sang Tiếng Việt chuẩn:
                            </p>
                          </div>

                          <textarea
                            rows={2}
                            value={essayAnswers[q.id] || ''}
                            onChange={(e) => handleEssayChange(q.id, e.target.value)}
                            placeholder="Nhập bản dịch Tiếng Việt của bạn..."
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-400 outline-none transition"
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
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
                  <Send className="w-5 h-5" /> Nộp Bài Tập & Gửi Ghi Âm
                </>
              )}
            </button>
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
