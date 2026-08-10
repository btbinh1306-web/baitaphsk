import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2, XCircle, RotateCcw, GripVertical } from 'lucide-react';

interface ParagraphItem {
  id: string;
  text: string;
}

interface ParagraphOrderProps {
  data: Record<string, unknown>;
}

export const ParagraphOrder: React.FC<ParagraphOrderProps> = ({ data }) => {
  const instruction = typeof data.instruction === 'string' ? data.instruction : 'Sắp xếp các đoạn văn theo đúng thứ tự logic:';
  
  const rawParagraphs: ParagraphItem[] = Array.isArray(data.paragraphs)
    ? (data.paragraphs as unknown[]).map((p, idx) => {
        if (typeof p === 'object' && p !== null) {
          const pObj = p as Record<string, unknown>;
          return {
            id: pObj.id ? String(pObj.id) : String.fromCharCode(65 + idx),
            text: typeof pObj.text === 'string' ? pObj.text : String(pObj.content || pObj.text || '')
          };
        }
        return { id: String.fromCharCode(65 + idx), text: String(p) };
      })
    : [];

  const expectedOrder: string[] = Array.isArray(data.answer)
    ? (data.answer as unknown[]).map(String)
    : rawParagraphs.map((p) => p.id);

  // Initialize ordered list (scrambled if possible)
  const [orderedItems, setOrderedItems] = useState<ParagraphItem[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const initializeList = () => {
    // If length > 1 and list matches expected order initially, reverse or scramble slightly so it's a real puzzle
    let list = [...rawParagraphs];
    if (list.length > 1) {
      const currentIds = list.map((item) => item.id);
      if (JSON.stringify(currentIds) === JSON.stringify(expectedOrder)) {
        list = [...rawParagraphs].reverse();
      }
    }
    setOrderedItems(list);
    setIsSubmitted(false);
  };

  useEffect(() => {
    initializeList();
  }, [data]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isSubmitted) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const updated = [...orderedItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setOrderedItems(updated);
  };

  const currentIds = orderedItems.map((p) => p.id);
  const isCorrect = JSON.stringify(currentIds) === JSON.stringify(expectedOrder);

  const handleCheck = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
            Paragraph Ordering
          </span>
          <h4 className="font-bold text-slate-800 text-sm mt-1">{instruction}</h4>
        </div>
        <button
          type="button"
          onClick={initializeList}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Trộn lại
        </button>
      </div>

      <p className="text-xs text-slate-500 italic">
        👉 Sử dụng nút mũi tên <ChevronUp className="w-3 h-3 inline text-slate-600" /> <ChevronDown className="w-3 h-3 inline text-slate-600" /> để thay đổi vị trí các đoạn văn.
      </p>

      {/* Paragraphs list */}
      <div className="space-y-2.5">
        {orderedItems.map((p, idx) => {
          const isPositionCorrect = isSubmitted && expectedOrder[idx] === p.id;
          const isPositionWrong = isSubmitted && expectedOrder[idx] !== p.id;

          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                isPositionCorrect
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                  : isPositionWrong
                  ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 h-6 bg-slate-200 text-slate-800 font-extrabold rounded-lg text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  <span className="font-extrabold text-indigo-600 mr-2">[{p.id}]</span>
                  {p.text}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(idx, 'up')}
                  disabled={idx === 0 || isSubmitted}
                  className="p-1 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-md text-slate-700 transition cursor-pointer"
                  title="Di chuyển lên"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 'down')}
                  disabled={idx === orderedItems.length - 1 || isSubmitted}
                  className="p-1 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-md text-slate-700 transition cursor-pointer"
                  title="Di chuyển xuống"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleCheck}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Nộp bài & Kiểm tra
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold">
            {isCorrect ? (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hoàn hảo! Thứ tự đoạn văn hoàn toàn chính xác.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Thứ tự chưa chuẩn. Bấm "Trộn lại" để làm lại.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
