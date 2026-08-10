import React, { useState } from 'react';
import { Image as ImageIcon, Send, CheckCircle2 } from 'lucide-react';
import { getDriveMediaPlayerUrl } from '../../utils/audioUtils';

interface PictureWritingProps {
  data: Record<string, unknown>;
}

export const PictureWriting: React.FC<PictureWritingProps> = ({ data }) => {
  const instruction = typeof data.instruction === 'string' ? data.instruction : (typeof data.prompt === 'string' ? data.prompt : 'Quan sát hình ảnh và viết câu/đoạn văn miêu tả:');
  const imageUrl = typeof data.image === 'string' ? data.image : (typeof data.imageUrl === 'string' ? data.imageUrl : undefined);
  const minLength = typeof data.minLength === 'number' ? data.minLength : 0;

  const [studentText, setStudentText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const charCount = studentText.trim().length;
  const meetsMinLength = charCount >= minLength;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            Picture Writing (Tập Viết Theo Tranh)
          </span>
          <h4 className="font-bold text-slate-800 text-sm mt-1">{instruction}</h4>
        </div>
      </div>

      {/* Image container */}
      <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center min-h-[160px] max-h-[300px]">
        {imageUrl ? (
          <img
            src={getDriveMediaPlayerUrl(imageUrl)}
            alt="Picture Writing Prompt"
            className="w-full h-auto max-h-[280px] object-contain rounded-lg"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">Hình ảnh minh họa bài tập</p>
          </div>
        )}
      </div>

      {/* Writing Form */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Bài viết của bạn:</label>
            <span
              className={`text-[11px] font-semibold ${
                minLength > 0 && !meetsMinLength ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {charCount} {minLength > 0 ? `/ tối thiểu ${minLength}` : ''} ký tự
            </span>
          </div>
          <textarea
            rows={4}
            value={studentText}
            onChange={(e) => {
              setStudentText(e.target.value);
              if (isSubmitted) setIsSubmitted(false);
            }}
            placeholder="Nhập câu tiếng Trung hoặc đoạn văn dựa vào bức tranh..."
            required
            className="w-full p-3.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Nộp bài viết
          </button>
        </div>
      </div>

      {/* Submission Status */}
      {isSubmitted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã ghi nhận bài viết! {minLength > 0 && !meetsMinLength ? '(Lưu ý: Bạn chưa đạt số lượng ký tự tối thiểu)' : ''}</span>
        </div>
      )}
    </div>
  );
};
