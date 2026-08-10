import React, { useState } from 'react';

interface MultipleChoiceProps {
  data: Record<string, unknown>;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({ data }) => {
  const prompt = typeof data.prompt === 'string' ? data.prompt : 'Câu hỏi trắc nghiệm';
  const pinyin = typeof data.pinyin === 'string' ? data.pinyin : undefined;
  const options = Array.isArray(data.options) ? data.options.map(String) : [];
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 text-sm">{prompt}</h4>
        {pinyin && <p className="text-xs text-indigo-600 font-mono">{pinyin}</p>}
      </div>

      {options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {options.map((opt, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedOpt(idx)}
              className={`text-left p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                selectedOpt === idx
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold ring-1 ring-teal-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="font-bold mr-1.5">{String.fromCharCode(65 + idx)}.</span> {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
