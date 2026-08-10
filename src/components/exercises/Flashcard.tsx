import React, { useState } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';
import { speakText } from '../../utils/tts';

interface FlashcardProps {
  data: Record<string, unknown>;
}

export const Flashcard: React.FC<FlashcardProps> = ({ data }) => {
  const [flipped, setFlipped] = useState(false);

  const hanzi = typeof data.hanzi === 'string' ? data.hanzi : (typeof data.prompt === 'string' ? data.prompt : 'Từ vựng');
  const pinyin = typeof data.pinyin === 'string' ? data.pinyin : undefined;
  const meaning = typeof data.meaning === 'string' ? data.meaning : (typeof data.explanation === 'string' ? data.explanation : undefined);
  const example = typeof data.example === 'string' ? data.example : undefined;

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white cursor-pointer shadow-md transition-transform transform active:scale-98 flex flex-col justify-between min-h-[160px] relative overflow-hidden"
    >
      <div className="flex items-center justify-between text-xs text-indigo-100 font-semibold">
        <span>Thẻ Từ Vựng (Flashcard)</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speakText(hanzi);
          }}
          className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      <div className="my-auto text-center space-y-2">
        {!flipped ? (
          <div>
            <h3 className="text-3xl font-extrabold tracking-wide">{hanzi}</h3>
            {pinyin && <p className="text-sm font-mono text-indigo-200 mt-1">{pinyin}</p>}
          </div>
        ) : (
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-amber-200">{meaning || 'Chưa có ý nghĩa'}</h4>
            {example && <p className="text-xs text-indigo-100 italic">"{example}"</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-200 font-medium pt-2">
        <RotateCcw className="w-3 h-3" />
        <span>Chạm để lật thẻ</span>
      </div>
    </div>
  );
};
