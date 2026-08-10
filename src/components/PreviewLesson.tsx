import React from 'react';
import { BookOpen, Layers, HelpCircle, Check, AlertTriangle } from 'lucide-react';
import { LessonData, LessonItem } from '../types/lesson';

interface PreviewLessonProps {
  lessonData: LessonData;
  onImport: () => void;
}

export const PreviewLesson: React.FC<PreviewLessonProps> = ({ lessonData, onImport }) => {
  const { lesson, sections } = lessonData;

  // Calculate stats
  const totalSections = sections.length;
  let totalExercises = 0;
  const typeCounts: Record<string, number> = {};
  const unsupportedTypes = new Set<string>();

  const standardTypes = new Set([
    'vocab',
    'flashcard',
    'mc',
    'multiple_choice',
    'fill',
    'fill_in_blank',
    'arrange',
    'ordering',
    'matching',
    'dictation',
    'paragraph_order',
    'picture_writing',
    'speaking_record',
    'listening_multiple_choice',
    'listening_true_false',
    'listening',
    'listening_mc',
    'listening_tf',
    'reading',
    'passage',
    'essay',
    'writing',
    'speaking',
    'pronunciation',
    'translation',
    'translate',
    'translate_vi_zh'
  ]);

  sections.forEach((sec) => {
    sec.items.forEach((item: LessonItem) => {
      totalExercises++;
      const rawType = (item.type || 'unknown').toLowerCase().trim();
      typeCounts[rawType] = (typeCounts[rawType] || 0) + 1;

      if (!standardTypes.has(rawType)) {
        unsupportedTypes.add(rawType);
      }
    });
  });

  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Xem Trước Bài Học (Preview)
          </span>
          <h3 className="font-extrabold text-slate-900 text-lg mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            {lesson.title || 'Bài học không tên'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lesson.description || 'Chưa có mô tả bài học.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          <Check className="w-5 h-5" /> [Nhập Bài] Đưa Vào Hệ Thống
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block">Tên Bài / Tiêu đề</span>
          <span className="text-sm font-bold text-indigo-950 truncate block mt-0.5">
            {lesson.title}
          </span>
        </div>

        <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block">Trình độ / Cấp độ</span>
          <span className="text-sm font-bold text-purple-950 block mt-0.5">
            {lesson.level || 'HSK'}
          </span>
        </div>

        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block">Số phần (Sections)</span>
          <span className="text-sm font-bold text-blue-950 block mt-0.5">
            {totalSections} phần
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block">Tổng bài tập (Items)</span>
          <span className="text-sm font-bold text-emerald-950 block mt-0.5">
            {totalExercises} bài
          </span>
        </div>
      </div>

      {/* Warning for Unsupported Types */}
      {unsupportedTypes.size > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Phát hiện dạng bài tập mới chưa nằm trong thư viện chuẩn:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 font-mono">
            {Array.from(unsupportedTypes).map((t) => (
              <li key={t}>
                Unsupported Exercise Type: <span className="font-bold text-rose-700">{t}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-700 italic pt-1">
            * Lưu ý: Tất cả các item thuộc dạng bài này vẫn được lưu giữ và nhập vào bài học bình thường mà không bị loại bỏ.
          </p>
        </div>
      )}

      {/* Sections Breakdown */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" /> Chi Tiết Danh Sách Sections ({sections.length}):
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((sec, idx) => {
            const secTypeCounts: Record<string, number> = {};
            sec.items.forEach((item) => {
              const t = (item.type || 'unknown').toLowerCase().trim();
              secTypeCounts[t] = (secTypeCounts[t] || 0) + 1;
            });

            return (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Phần {idx + 1}: {sec.title || `Section #${idx + 1}`}
                  </span>
                  <span className="font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">
                    {sec.items.length} bài tập
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(secTypeCounts).map(([type, count]) => {
                    const isStandard = standardTypes.has(type);
                    return (
                      <span
                        key={type}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border ${
                          isStandard
                            ? 'bg-white border-slate-200 text-slate-700'
                            : 'bg-amber-100 border-amber-300 text-amber-900 font-mono font-bold'
                        }`}
                      >
                        {isStandard ? (
                          <>
                            {type}: <strong className="text-slate-900">{count}</strong>
                          </>
                        ) : (
                          <>
                            Unsupported: <strong>{type}</strong> ({count})
                          </>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
