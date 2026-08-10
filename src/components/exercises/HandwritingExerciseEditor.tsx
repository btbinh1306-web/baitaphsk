import React, { useState } from 'react';
import { HandwritingExercise } from '../../types/handwriting';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { Upload, X, Plus, Eye, Save, Sparkles, Image as ImageIcon, FileText } from 'lucide-react';

interface HandwritingExerciseEditorProps {
  initialExercise?: HandwritingExercise;
  onSave: (exercise: HandwritingExercise) => void;
  onCancel?: () => void;
}

export const HandwritingExerciseEditor: React.FC<HandwritingExerciseEditorProps> = ({
  initialExercise,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialExercise?.title || '');
  const [instruction, setInstruction] = useState(
    initialExercise?.instruction || 'Chép mỗi từ mới 3 dòng vào vở ô ly rồi chụp ảnh nộp.'
  );
  const [referenceImages, setReferenceImages] = useState<string[]>(
    initialExercise?.referenceImages || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await fileToCompressedDataUrl(files[i]);
        newImages.push(compressed);
      }
      setReferenceImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      alert('Không thể đọc file ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập Tên bài / Nội dung bài.');
      return;
    }

    const exercise: HandwritingExercise = {
      id: initialExercise?.id || `hw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'handwriting_submission',
      title: title.trim(),
      instruction: instruction.trim() || undefined,
      referenceImages,
      createdAt: initialExercise?.createdAt || new Date().toISOString(),
      level: initialExercise?.level || 'HSK 1',
      description: 'Dạng bài: Nộp ảnh bài viết'
    };

    onSave(exercise);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            📝
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {initialExercise ? 'Chỉnh sửa bài chép từ mới' : 'Soạn bài chép từ mới / Nộp ảnh bài viết'}
            </h3>
            <p className="text-xs text-slate-500">
              Tạo bài luyện viết chữ Hán, chép từ mới cho học sinh chụp ảnh nộp
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            Tên bài / Nội dung bài <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: HSK1 Bài 5 – Chép từ mới"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50/50 text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
            required
          />
        </div>

        {/* Instruction input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Yêu cầu bài tập / Hướng dẫn học sinh (không bắt buộc)
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            placeholder="Ví dụ: Chép mỗi từ mới 3 dòng vào vở ô ly rồi chụp ảnh nộp."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
          />
        </div>

        {/* Reference Images upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Ảnh bài tập / Ảnh từ mới (Mẫu chữ cho học sinh chép)
            </span>
            <span className="text-xs text-slate-500 font-normal">
              Đã có {referenceImages.length} ảnh
            </span>
          </label>

          {/* Image Grid */}
          {referenceImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {referenceImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white aspect-4/3 shadow-xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewIdx(idx)}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm text-xs font-bold transition"
                      title="Xem ảnh lớn"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg shadow-sm text-xs font-bold transition"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Drop Area / Button */}
          <label className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/40 hover:bg-teal-50 rounded-xl cursor-pointer transition text-center group">
            <Upload className="w-8 h-8 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-teal-900">
              {isUploading ? 'Đang xử lý ảnh...' : 'Tải lên 1 hoặc nhiều ảnh bài tập'}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              Chọn ảnh chứa từ mới / mẫu chữ viết tay từ máy tính hoặc điện thoại
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Lưu bài tập
          </button>
        </div>
      </form>

      {/* Lightbox Preview */}
      {previewIdx !== null && (
        <ImageLightboxModal
          images={referenceImages}
          initialIndex={previewIdx}
          isOpen={previewIdx !== null}
          onClose={() => setPreviewIdx(null)}
          title={title}
        />
      )}
    </div>
  );
};
