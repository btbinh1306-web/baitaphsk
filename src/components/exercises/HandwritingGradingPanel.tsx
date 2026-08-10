import React, { useState } from 'react';
import { HandwritingSubmission } from '../../types/handwriting';
import { gradeHandwritingSubmission } from '../../services/handwritingService';
import { gradeSubmissionInGas, getGasConfig } from '../../services/gasService';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';
import { uploadMediaFile } from '../../services/apiService';
import { ImageLightboxModal } from '../ImageLightboxModal';
import {
  Upload,
  X,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  User,
  BookOpen,
  Calendar,
  Save,
  Sparkles,
  Award,
  Download
} from 'lucide-react';

interface HandwritingGradingPanelProps {
  submission: HandwritingSubmission;
  onGradingComplete: (updated: HandwritingSubmission) => void;
  onClose?: () => void;
}

export const HandwritingGradingPanel: React.FC<HandwritingGradingPanelProps> = ({
  submission,
  onGradingComplete,
  onClose
}) => {
  const [correctedImages, setCorrectedImages] = useState<string[]>(
    submission.correctedImages || []
  );
  const [teacherComment, setTeacherComment] = useState<string>(
    submission.teacherComment || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const handleCorrectedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await fileToCompressedDataUrl(files[i]);
        const uploadedUrl = await uploadMediaFile(compressed, files[i].name, files[i].type, 'correction');
        newImages.push(uploadedUrl || compressed);
      }
      setCorrectedImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Lỗi khi tải ảnh chữa:', err);
      alert('Không thể tải ảnh bài chữa. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveCorrected = (index: number) => {
    setCorrectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveGrading = async () => {
    setIsSaving(true);

    const updated = gradeHandwritingSubmission(
      submission.id,
      correctedImages,
      teacherComment
    );
    const updatedForCallback: HandwritingSubmission = updated || {
      ...submission,
      status: 'graded',
      correctedImages,
      teacherComment,
      gradedAt: new Date().toLocaleString('vi-VN')
    };

    // Sync grade to Google Sheet if configured
    const config = getGasConfig();
    try {
      await gradeSubmissionInGas(
        submission.id,
        'Đạt',
        teacherComment,
        config.teacherPass,
        correctedImages
      );
    } catch (err) {
      console.warn('Syncing handwriting grade to GAS failed:', err);
    }

    setIsSaving(false);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      onGradingComplete(updatedForCallback);
    }, 800);
  };

  const openLightbox = (images: string[], index: number, titleText: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(titleText);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xl space-y-6 max-w-4xl mx-auto">
      {/* HEADER / STUDENT METADATA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              📝 Chấm bài chép từ mới
            </span>
            {submission.status === 'graded' ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã chấm
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ chấm
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {submission.exerciseTitle}
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition self-start sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* STUDENT INFO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-teal-600 shrink-0" />
          <div>
            <span className="text-slate-500 text-xs block">Học sinh:</span>
            <span className="font-extrabold text-slate-900">{submission.studentName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="text-slate-500 text-xs block">Lớp:</span>
            <span className="font-bold text-slate-800">{submission.studentClass || 'Mặc định'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-slate-500 text-xs block">Thời gian nộp:</span>
            <span className="font-semibold text-slate-800">{submission.submittedAt || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* STUDENT SUBMITTED PHOTOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            Bài học sinh đã nộp ({submission.submissionImages?.length || 0} trang)
          </h3>
          <span className="text-xs text-slate-500">Nhấn vào ảnh để xem nét chữ chi tiết</span>
        </div>

        {submission.submissionImages && submission.submissionImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {submission.submissionImages.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() =>
                  openLightbox(
                    submission.submissionImages,
                    idx,
                    `Bài làm học sinh ${submission.studentName} - Trang ${idx + 1}`
                  )
                }
                className="relative group rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-900 aspect-4/3 cursor-pointer shadow-sm hover:border-teal-500 transition"
              >
                <img
                  src={imgUrl}
                  alt={`Student page ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-bold text-[10px]">
                  Trang {idx + 1}
                </div>
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(
                        submission.submissionImages,
                        idx,
                        `Bài làm học sinh ${submission.studentName} - Trang ${idx + 1}`
                      );
                    }}
                    className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-lg shadow-md flex items-center gap-1 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Phóng to
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = imgUrl;
                      const studentClean = submission.studentName.replace(/[^a-zA-Z0-9_\-]/g, '_');
                      link.download = `hoc_sinh_${studentClean}_trang_${idx + 1}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1.5 bg-teal-600 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1 hover:bg-teal-700 transition cursor-pointer"
                    title="Tải ảnh này về máy"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải về
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
            Học sinh chưa tải ảnh bài nộp.
          </div>
        )}
      </div>

      {/* TEACHER CORRECTED IMAGES UPLOAD SECTION */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Ảnh bài đã chữa (Giáo viên khoanh/sửa nét chữ & tải lại)
          </h3>
          <span className="text-xs text-slate-500">
            {correctedImages.length} ảnh đã đăng
          </span>
        </div>

        {correctedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl">
            {correctedImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-indigo-300 bg-white aspect-4/3 shadow-2xs"
              >
                <img
                  src={imgUrl}
                  alt={`Corrected page ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-indigo-900/80 text-white font-bold text-[10px]">
                  Ảnh chữa {idx + 1}
                </div>
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(
                        correctedImages,
                        idx,
                        `Ảnh bài đã chữa - ${idx + 1}`
                      )
                    }
                    className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-100 transition"
                    title="Xem ảnh"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCorrected(idx)}
                    className="p-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-red-700 transition"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl cursor-pointer transition text-indigo-950 font-bold text-xs sm:text-sm text-center">
          <Upload className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{isUploading ? 'Đang tải...' : 'Tải lên 1 hoặc nhiều ảnh bài đã sửa/chấm'}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleCorrectedUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* TEACHER COMMENT TEXTAREA */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <label className="block text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Nhận xét của giáo viên
        </label>
        <textarea
          value={teacherComment}
          onChange={(e) => setTeacherComment(e.target.value)}
          rows={3}
          placeholder='Nhập nhận xét (hỗ trợ Tiếng Việt, Tiếng Trung, Pinyin, Emoji)... Ví dụ: "Chữ viết khá đều. Chú ý nét 横 của chữ 月 và thứ tự nét của chữ 休. Từ 今天 viết tốt."'
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition leading-relaxed"
        />
      </div>

      {/* SUCCESS NOTICE */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Đã lưu kết quả chấm bài thành công!
        </div>
      )}

      {/* SAVE BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Đóng
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveGrading}
          disabled={isUploading || isSaving}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Lưu và hoàn thành chấm bài
        </button>
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
};
