import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Link2 } from 'lucide-react';

interface MatchingProps {
  data: Record<string, unknown>;
}

export const Matching: React.FC<MatchingProps> = ({ data }) => {
  const instruction = typeof data.instruction === 'string' ? data.instruction : (typeof data.prompt === 'string' ? data.prompt : 'Nối từ với nghĩa tương ứng');
  
  const leftItems = Array.isArray(data.left) ? data.left.map(String) : [];
  const rightItems = Array.isArray(data.right) ? data.right.map(String) : [];
  
  // answer is array of [leftIdx, rightIdx] pairs e.g. [[0,0], [1,1]]
  const expectedPairs: [number, number][] = Array.isArray(data.answer)
    ? (data.answer as unknown[])
        .filter((pair): pair is [number, number] => Array.isArray(pair) && pair.length === 2 && typeof pair[0] === 'number' && typeof pair[1] === 'number')
    : [];

  // State: selected left item index
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  
  // State: user matched pairs { [leftIdx]: rightIdx }
  const [userPairs, setUserPairs] = useState<Record<number, number>>({});

  // State: submit/verification state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Colors palette for visual connection tags
  const pairColors = [
    'bg-indigo-100 border-indigo-400 text-indigo-900',
    'bg-purple-100 border-purple-400 text-purple-900',
    'bg-emerald-100 border-emerald-400 text-emerald-900',
    'bg-amber-100 border-amber-400 text-amber-900',
    'bg-rose-100 border-rose-400 text-rose-900',
    'bg-cyan-100 border-cyan-400 text-cyan-900',
    'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900',
  ];

  const handleLeftClick = (leftIdx: number) => {
    if (isSubmitted) return;
    if (selectedLeft === leftIdx) {
      setSelectedLeft(null); // toggle off
    } else {
      setSelectedLeft(leftIdx);
    }
  };

  const handleRightClick = (rightIdx: number) => {
    if (isSubmitted) return;

    if (selectedLeft !== null) {
      // Remove any existing left pair that was mapped to this rightIdx
      const updated = { ...userPairs };
      Object.keys(updated).forEach((k) => {
        if (updated[Number(k)] === rightIdx) {
          delete updated[Number(k)];
        }
      });

      // Assign pair
      updated[selectedLeft] = rightIdx;
      setUserPairs(updated);
      setSelectedLeft(null);
    }
  };

  const handleUnmatch = (leftIdx: number) => {
    if (isSubmitted) return;
    const updated = { ...userPairs };
    delete updated[leftIdx];
    setUserPairs(updated);
  };

  const handleCheck = () => {
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setUserPairs({});
    setSelectedLeft(null);
    setIsSubmitted(false);
  };

  // Calculate score
  let correctCount = 0;
  if (isSubmitted) {
    expectedPairs.forEach(([l, r]) => {
      if (userPairs[l] === r) {
        correctCount++;
      }
    });
  }

  const totalExpected = expectedPairs.length > 0 ? expectedPairs.length : leftItems.length;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Matching Exercise
          </span>
          <h4 className="font-bold text-slate-800 text-sm mt-1">{instruction}</h4>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm lại
        </button>
      </div>

      <p className="text-xs text-slate-500 italic">
        👉 Click vào 1 từ ở cột Trái, sau đó click vào nghĩa tương ứng ở cột Phải để nối ghép.
      </p>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cột Trái</h5>
          {leftItems.map((item, lIdx) => {
            const isMatched = userPairs[lIdx] !== undefined;
            const isSelected = selectedLeft === lIdx;
            const pairRightIdx = userPairs[lIdx];
            const colorClass = isMatched ? pairColors[lIdx % pairColors.length] : '';

            let resultStatusClass = '';
            if (isSubmitted) {
              const expectedRight = expectedPairs.find(([l]) => l === lIdx)?.[1];
              if (pairRightIdx === expectedRight && expectedRight !== undefined) {
                resultStatusClass = 'ring-2 ring-emerald-500 bg-emerald-50';
              } else {
                resultStatusClass = 'ring-2 ring-rose-400 bg-rose-50';
              }
            }

            return (
              <div
                key={lIdx}
                onClick={() => handleLeftClick(lIdx)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-sm font-semibold ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-300 text-indigo-950 scale-101'
                    : isMatched
                    ? `${colorClass}`
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                } ${resultStatusClass}`}
              >
                <span>{item}</span>
                {isMatched && (
                  <span className="text-[11px] font-normal opacity-80 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> #{lIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cột Phải</h5>
          {rightItems.map((item, rIdx) => {
            // Find which leftIdx is paired with this rIdx
            const matchedLeftIdx = Object.keys(userPairs).find((lKey) => userPairs[Number(lKey)] === rIdx);
            const isMatched = matchedLeftIdx !== undefined;
            const colorClass = isMatched ? pairColors[Number(matchedLeftIdx) % pairColors.length] : '';

            let resultStatusClass = '';
            if (isSubmitted && matchedLeftIdx !== undefined) {
              const lNum = Number(matchedLeftIdx);
              const expectedRight = expectedPairs.find(([l]) => l === lNum)?.[1];
              if (rIdx === expectedRight) {
                resultStatusClass = 'ring-2 ring-emerald-500 bg-emerald-50';
              } else {
                resultStatusClass = 'ring-2 ring-rose-400 bg-rose-50';
              }
            }

            return (
              <div
                key={rIdx}
                onClick={() => handleRightClick(rIdx)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-sm font-semibold ${
                  isMatched
                    ? `${colorClass}`
                    : selectedLeft !== null
                    ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 border-dashed hover:bg-indigo-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                } ${resultStatusClass}`}
              >
                <span>{item}</span>
                {isMatched && matchedLeftIdx !== undefined && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnmatch(Number(matchedLeftIdx));
                    }}
                    className="text-[11px] font-normal hover:underline opacity-80"
                  >
                    Gỡ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Control / Verification bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={Object.keys(userPairs).length === 0}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Nộp bài & Kiểm tra
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold">
            {correctCount === totalExpected ? (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hoàn hảo! Ghép đúng {correctCount}/{totalExpected} cặp.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Đúng {correctCount}/{totalExpected} cặp. Hãy thử gỡ và nối lại.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
