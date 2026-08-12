import React, { useState, useEffect } from 'react';
import { HandwritingExercise, HandwritingSubmission } from '../../types/handwriting';
import {
  getHandwritingSubmissionForStudent,
  saveHandwritingSubmission
} from '../../services/handwritingService';
import { submitToGas, getLocalSubmissions, cleanImageTagsFromText } from '../../services/gasService';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';
import { uploadMediaFile } from '../../services/apiService';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { getDriveMediaPlayerUrl } from '../../utils/audioUtils';
import {
  Upload,
  Camera,
  X,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  FileCheck2,
  Pencil,
  Download,
  ExternalLink
} from 'lucide-react';

interface HandwritingExerciseViewProps {
  exercise: HandwritingExercise;
  studentName?: string;
  studentClass?: string;
  onSubmissionComplete?: (sub: HandwritingSubmission) => void;
}

export interface HandwritingExerciseViewHandle {
  submit: () => Promise<void>;
}

export const HandwritingExerciseView = React.forwardRef(
  (
    {
      exercise,
      studentName = '',
      studentClass = '',
      onSubmissionComplete
    }: HandwritingExerciseViewProps,
    ref: React.ForwardedRef<HandwritingExerciseViewHandle>
  ) => {
  const [submissionImages, setSubmissionImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSub, setCurrentSub] = useState<HandwritingSubmission | null>(null);

  const [lessonTopicInput, setLessonTopicInput] = useState('');

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Load existing submission or saved draft if available
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('hsk_hw_draft_v1');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.lessonTopicInput) setLessonTopicInput(parsed.lessonTopicInput);
      }
    } catch (e) {}

    const existing = getHandwritingSubmissionForStudent(exercise.id, studentName);
    const allLocals = getLocalSubmissions();
    const localMain = allLocals.find(
      (m) =>
        (existing?.id && m.id === existing.id) ||
        (m.exerciseId && m.exerciseId === exercise.id) ||
        (studentName && m.name?.trim().toLowerCase() === studentName.trim().toLowerCase() && m.lesson?.includes(exercise.title))
    );

    if (existing || localMain) {
      const subImages = getValidImages(
        existing?.submissionImages || localMain?.submissionImages,
        [localMain?.essays]
      );
      const corrImages = getValidImages(
        existing?.correctedImages || localMain?.correctedImages,
        [localMain?.teacherComment, localMain?.comment]
      );

      const isGraded = existing?.status === 'graded' || localMain?.status === 'Đã chấm';
      const commentText = existing?.teacherComment || localMain?.teacherComment || localMain?.comment || '';

      const subToSet: HandwritingSubmission = {
        id: existing?.id || localMain?.id || `hw_${Date.now()}`,
        exerciseId: existing?.exerciseId || localMain?.exerciseId || exercise.id,
        exerciseTitle: existing?.exerciseTitle || localMain?.lesson || exercise.title,
        studentName: existing?.studentName || localMain?.name || studentName,
        studentClass: existing?.studentClass || localMain?.class || studentClass,
        submissionImages: subImages.length > 0 ? subImages : (existing?.submissionImages || []),
        status: isGraded ? 'graded' : 'submitted',
        submittedAt: existing?.submittedAt || localMain?.time || new Date().toISOString(),
        correctedImages: corrImages,
        teacherComment: cleanImageTagsFromText(commentText),
        gradedAt: existing?.gradedAt
      };

      setCurrentSub(subToSet);
      setSubmissionImages(subToSet.submissionImages);
      if (existing?.lessonTopic) setLessonTopicInput(existing.lessonTopic);
    }
  }, [exercise.id, exercise.title, studentName, studentClass]);

  // Save inputs draft to localStorage
  useEffect(() => {
    if (currentSub) return;
    try {
      localStorage.setItem(
        'hsk_hw_draft_v1',
        JSON.stringify({
          lessonTopicInput,
        })
      );
    } catch (e) {}
  }, [lessonTopicInput, currentSub]);

  // Handle uploading photos (student)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await fileToCompressedDataUrl(files[i]);
        const uploadedUrl = await uploadMediaFile(compressed, files[i].name, files[i].type, 'submission');
        newImages.push(uploadedUrl || compressed);
      }
      setSubmissionImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Lỗi tải ảnh bài làm:', err);
      alert('Không thể đọc ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSubmissionImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const finalName = studentName.trim();
    const finalClass = studentClass.trim();
    const finalTopic = lessonTopicInput.trim();

    if (!finalName) {
      alert('Vui lòng nhập Họ và Tên học sinh.');
      return;
    }
    if (!finalClass) {
      alert('Vui lòng nhập Lớp học.');
      return;
    }
    if (!finalTopic) {
      alert('Vui lòng ghi rõ bài chép từ mới thuộc Bài nào (Ví dụ: Từ mới Bài 5, HSK 1 Bài 3...).');
      return;
    }
    if (submissionImages.length === 0) {
      alert('Vui lòng chụp hoặc tải lên ít nhất 1 ảnh bài viết.');
      return;
    }

    setIsSubmitting(true);

    const fallbackSubId = currentSub?.id || `SUB_HW_${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString('vi-VN');

    let assignedId = fallbackSubId;
    const submissionLessonTitle = `${exercise.title} (${finalTopic})`;

    try {
      const gasRes = await submitToGas({
        time: nowStr,
        name: finalName,
        class: finalClass,
        lesson: submissionLessonTitle,
        correct: 0,
        done: submissionImages.length,
        total: submissionImages.length || 1,
        percent: 0,
        wrongCount: 0,
        notDone: 0,
        wrong: '',
        essays: `[Nộp bài chép từ mới] Bài: ${finalTopic} (${submissionImages.length} ảnh)`,
        isHandwriting: true,
        submissionImages: submissionImages
      });

      if (gasRes && gasRes.ok && gasRes.id) {
        assignedId = String(gasRes.id);
      }
    } catch (err) {
      console.error('GAS submit error in handwriting:', err);
    }

    const newSub: HandwritingSubmission = {
      id: assignedId,
      exerciseId: exercise.id,
      exerciseTitle: submissionLessonTitle,
      lessonTopic: finalTopic,
      studentName: finalName,
      studentClass: finalClass,
      submissionImages: submissionImages,
      status: currentSub?.status === 'graded' ? 'graded' : 'submitted',
      submittedAt: currentSub?.submittedAt || nowStr,
      correctedImages: currentSub?.correctedImages,
      teacherComment: currentSub?.teacherComment,
      gradedAt: currentSub?.gradedAt
    };

    saveHandwritingSubmission(newSub);
    setCurrentSub(newSub);
    setIsSubmitting(false);

    try {
      localStorage.removeItem('hsk_hw_draft_v1');
    } catch (e) {}

    if (onSubmissionComplete) {
      onSubmissionComplete(newSub);
    }
  };

  React.useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  const openLightbox = (images: string[], index: number, titleText: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(titleText);
  };

  const handleOpenNewTab = (url: string, title = 'Xem ảnh bài chữa') => {
    const mediaUrl = getDriveMediaPlayerUrl(url);
    try {
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #fff; font-family: sans-serif; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${mediaUrl}" alt="Full Image" />
            </body>
          </html>
        `);
        win.document.close();
      } else {
        window.open(mediaUrl, '_blank');
      }
    } catch (e) {
      window.open(mediaUrl, '_blank');
    }
  };

  const getValidImages = (rawList?: string[], fallbackTextSources: (string | undefined)[] = []): string[] => {
    const resultUrls: string[] = [];

    const addUrl = (url?: string) => {
      if (!url || typeof url !== 'string') return;
      const trimmed = url.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('[') && !resultUrls.includes(trimmed)) {
        resultUrls.push(getDriveMediaPlayerUrl(trimmed));
      }
    };

    if (Array.isArray(rawList)) {
      rawList.forEach((url) => addUrl(url));
    }

    fallbackTextSources.forEach((text) => {
      if (!text || typeof text !== 'string') return;

      const jsonTagMatches = text.match(/\[(?:SUBMISSION_IMAGES|CORRECTED_IMAGES)\]:\s*(\[.*?\])/s);
      if (jsonTagMatches && jsonTagMatches[1]) {
        try {
          const parsed = JSON.parse(jsonTagMatches[1]);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => addUrl(item));
          }
        } catch (e) {}
      }

      const base64Regex = /data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g;
      const base64Matches = text.match(base64Regex);
      if (base64Matches) {
        base64Matches.forEach((m) => addUrl(m));
      }

      const httpRegex = /https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp|gif)/gi;
      const httpMatches = text.match(httpRegex);
      if (httpMatches) {
        httpMatches.forEach((m) => addUrl(m));
      }
    });

    return resultUrls;
  };

  const handleDownloadImage = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = getDriveMediaPlayerUrl(url);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
    }
  };

  const handleDownloadAllCorrected = () => {
    if (!currentSub?.correctedImages) return;
    currentSub.correctedImages.forEach((url, idx) => {
      setTimeout(() => {
        handleDownloadImage(url, `Bai_chua_${currentSub.id || 'hsk'}_trang_${idx + 1}.png`);
      }, idx * 300);
    });
  };

  const status = currentSub?.status || 'not_submitted';

  return (
    <div className="space-y-6">
      {/* EXERCISE HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              📝
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Dạng bài: Nộp ảnh bài viết
                </span>
                {status === 'not_submitted' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Chưa nộp
                  </span>
                )}
                {status === 'submitted' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Đã nộp (Chờ giáo viên chấm)
                  </span>
                )}
                {status === 'graded' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã chấm
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {exercise.title}
              </h2>
            </div>
          </div>
        </div>

        {/* INSTRUCTION */}
        {exercise.instruction && (
          <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Yêu cầu bài tập
            </div>
            <p className="text-sm font-medium text-teal-950 leading-relaxed whitespace-pre-line">
              {exercise.instruction}
            </p>
          </div>
        )}

        {/* TEACHER'S REFERENCE IMAGES */}
        {exercise.referenceImages && exercise.referenceImages.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Mẫu từ mới / Bài chép mẫu của giáo viên ({exercise.referenceImages.length} ảnh)
              </span>
              <span className="text-slate-400 font-normal">Nhấn vào ảnh để phóng to</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {exercise.referenceImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    openLightbox(exercise.referenceImages, idx, `Mẫu từ mới - Ảnh ${idx + 1}`)
                  }
                  className="relative group rounded-xl overflow-hidden border-2 border-indigo-100 bg-slate-900 aspect-4/3 cursor-pointer shadow-xs hover:border-indigo-400 transition"
                >
                  <img
                    src={getDriveMediaPlayerUrl(imgUrl)}
                    alt={`Mẫu ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-white/90 text-slate-900 font-bold text-xs rounded-lg shadow-md flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Phóng to
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRADED RESULT SECTION FOR STUDENT */}
      {status === 'graded' && currentSub && (
        <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 border-b border-emerald-200 pb-3">
            <FileCheck2 className="w-6 h-6 text-emerald-700" />
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-950">
              Kết Quả Chấm Bài Của Giáo Viên
            </h3>
            {currentSub.gradedAt && (
              <span className="ml-auto text-xs font-medium text-emerald-800">
                Chấm lúc: {currentSub.gradedAt}
              </span>
            )}
          </div>

          {/* TEACHER COMMENT */}
          {currentSub.teacherComment && (
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Nhận xét từ giáo viên:
              </span>
              <p className="text-sm font-medium text-slate-800 whitespace-pre-line leading-relaxed pl-1">
                {currentSub.teacherComment}
              </p>
            </div>
          )}

          {/* CORRECTED IMAGES */}
          {(() => {
            const validCorrected = getValidImages(currentSub.correctedImages, [currentSub.teacherComment]);
            if (validCorrected.length === 0) return null;

            return (
              <div className="space-y-3 p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                  <span className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Ảnh bài đã được giáo viên chấm chữa ({validCorrected.length} ảnh):
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        validCorrected.forEach((url, idx) => {
                          setTimeout(() => handleOpenNewTab(url, `Ảnh bài chữa - Trang ${idx + 1}`), idx * 200);
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Mở tất cả ảnh bài chữa trong các thẻ mới"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" /> Mở tất cả thẻ mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        validCorrected.forEach((url, idx) => {
                          setTimeout(() => handleDownloadImage(url, `Bai_chua_trang_${idx + 1}.png`), idx * 300);
                        });
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải tất cả ({validCorrected.length})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                  {validCorrected.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col rounded-xl overflow-hidden border-2 border-emerald-400 bg-slate-950 shadow-md transition hover:border-emerald-600"
                    >
                      {/* Image Viewer Container */}
                      <div
                        className="relative w-full aspect-4/3 bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center p-1"
                        onClick={() => openLightbox(validCorrected, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                      >
                        <img
                          src={getDriveMediaPlayerUrl(imgUrl)}
                          alt={`Corrected ${idx + 1}`}
                          className="w-full h-full object-contain transition duration-200 hover:scale-[1.02]"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-emerald-950/90 text-emerald-200 font-extrabold text-[11px] shadow-sm border border-emerald-600/50">
                          Trang chữa {idx + 1}
                        </div>
                      </div>

                      {/* Always-Visible Button Bar */}
                      <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => openLightbox(validCorrected, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Phóng to
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenNewTab(imgUrl, `Ảnh bài chữa - Trang ${idx + 1}`)}
                          className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Mở ảnh trong thẻ mới để xem kích thước gốc"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Thẻ mới
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(imgUrl, `Bai_chua_trang_${idx + 1}.png`)}
                          className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Tải ảnh bài chữa về máy"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" /> Tải
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STUDENT UPLOAD & SUBMISSION AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-600" />
            Nộp ảnh bài làm (Chụp vở chép tay)
          </h3>
          <span className="text-xs text-slate-500 font-normal">
            Hỗ trợ nộp từ 1 đến 5 trang vở
          </span>
        </div>

        {/* Text Block for Lesson / Vocabulary Topic */}
        <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-200/90 space-y-1.5 shadow-2xs">
          <label className="block text-xs font-bold text-teal-950 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Pencil className="w-4 h-4 text-teal-600 shrink-0" />
              Chép từ mới của bài nào? <span className="text-red-500">*</span>
            </span>
            <span className="text-[11px] text-teal-700 font-normal hidden sm:inline">Ví dụ: Từ mới Bài 5, HSK 1 Bài 3...</span>
          </label>
          <input
            type="text"
            value={lessonTopicInput}
            onChange={(e) => setLessonTopicInput(e.target.value)}
            placeholder="Nhập tên bài học / từ mới đã chép (Ví dụ: Từ mới Bài 5: Gia đình...)"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition font-medium"
            required
          />
        </div>

        {/* Uploaded Photos Grid */}
        {submissionImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Đã chọn {submissionImages.length} trang bài viết</span>
              <span className="text-slate-400 font-normal">Nhấn vào ảnh để xem trước</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {submissionImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white aspect-4/3 shadow-2xs"
                >
                  <img
                    src={getDriveMediaPlayerUrl(imgUrl)}
                    alt={`Bài làm ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-bold text-[10px]">
                    Trang {idx + 1}
                  </div>
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openLightbox(
                          submissionImages,
                          idx,
                          `Ảnh bài làm - Trang ${idx + 1}`
                        )
                      }
                      className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow-sm transition hover:bg-slate-100 cursor-pointer"
                      title="Xem ảnh"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                      link.href = getDriveMediaPlayerUrl(imgUrl);
                        link.download = `bai_lam_trang_${idx + 1}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="p-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold shadow-sm transition hover:bg-teal-700 cursor-pointer"
                      title="Tải / Lưu ảnh về máy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm transition hover:bg-red-700 cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Action Button */}
        <div>
          <label className="flex items-center justify-center gap-2.5 p-4 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/60 hover:bg-teal-50 rounded-xl cursor-pointer transition text-teal-900 font-bold text-sm text-center shadow-2xs">
            <Upload className="w-5 h-5 text-teal-600 shrink-0" />
            <span>{isUploading ? 'Đang đọc & nén ảnh...' : 'Tải lên hoặc Chụp ảnh bài làm từ thiết bị'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploading || isSubmitting}
            />
          </label>
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          title={lightboxTitle}
        />
      )}
    </div>
  );
});
