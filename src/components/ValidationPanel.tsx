import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ValidationResult } from '../types/lesson';

interface ValidationPanelProps {
  validationResult: ValidationResult | null;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validationResult }) => {
  if (!validationResult) return null;

  if (validationResult.isValid) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-emerald-900">
            JSON Hợp Lệ! Đã sẵn sàng để nhập vào hệ thống.
          </h4>
          <p className="text-xs text-emerald-700">
            Cấu trúc bài học đáp ứng đầy đủ yêu cầu: có version, thông tin bài học (lesson), danh sách các phần (sections) và từng câu hỏi (items).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
        <span>Phát Hiện {validationResult.errors.length} Lỗi Trong File JSON:</span>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {validationResult.errors.map((err, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs text-rose-900 flex items-start gap-2 shadow-2xs font-mono"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-700 block">{err.path}</span>
              <span>{err.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
