import React from 'react';
import { Upload, FileCode, Sparkles } from 'lucide-react';

interface JsonEditorProps {
  jsonText: string;
  onChangeJson: (val: string) => void;
  onValidate: () => void;
  onLoadSample: () => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  jsonText,
  onChangeJson,
  onValidate,
  onLoadSample
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" /> Nhập Dữ Liệu Bài Học JSON
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dán nội dung mã JSON hoặc tải file .json cấu trúc chuẩn bài học HSK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Thử Mẫu JSON
          </button>

          <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Chọn file .json
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          rows={12}
          value={jsonText}
          onChange={(e) => onChangeJson(e.target.value)}
          placeholder={`[\n  Dán chuỗi JSON cấu trúc Lesson tại đây...\n]`}
          className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition leading-relaxed"
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Kích thước: {new Blob([jsonText]).size} bytes</span>
          <span>Dòng: {jsonText.split('\n').length}</span>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onValidate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          🔍 Kiểm Tra JSON
        </button>
      </div>
    </div>
  );
};
