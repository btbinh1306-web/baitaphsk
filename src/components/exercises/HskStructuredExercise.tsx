import React, { useRef, useState } from 'react';
import { Headphones, Image as ImageIcon } from 'lucide-react';
import { LessonItem } from '../../types/lesson';
import {
  getStructuredQuestionRows,
  getStructuredSharedOptions,
  StructuredAnswerMap,
  StructuredOption,
  STRUCTURED_EXERCISE_LABELS,
  StructuredExerciseType
} from '../../utils/structuredExercises';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../../utils/audioUtils';

interface HskStructuredExerciseProps {
  item: LessonItem;
  answers?: StructuredAnswerMap;
  onAnswerChange?: (key: string, answer: string) => void;
}

const getText = (value: unknown): string => typeof value === 'string' ? value : '';

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = Math.imul(state ^ (state >>> 13), 1274126177);
    const swapIndex = Math.abs(state) % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function shuffleAndRelabelOptions(options: StructuredOption[], seed: string): StructuredOption[] {
  return shuffleWithSeed(options, seed).map((option, index) => ({
    ...option,
    id: String.fromCharCode(65 + index),
    answerId: option.id
  }));
}

function LimitedAudio({ src, playCount, limit }: { src: string; playCount: number; limit: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [used, setUsed] = useState(0);
  if (!src) return <span className="text-xs text-slate-500 italic">Chưa gắn file nghe</span>;

  const exhausted = limit && used >= playCount;
  return (
    <div className="space-y-1">
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={getDriveAudioPlayerUrl(src)}
        className={`w-full h-10 ${exhausted ? 'opacity-50 pointer-events-none' : ''}`}
        onPlay={() => {
          if (exhausted) {
            audioRef.current?.pause();
            return;
          }
          setUsed((current) => current + 1);
        }}
      />
      {limit && (
        <p className="text-[11px] text-slate-500">
          Lượt nghe: {Math.min(used, playCount)}/{playCount}
        </p>
      )}
    </div>
  );
}

function OptionCard({
  option,
  selected,
  showPinyin,
  onSelect
}: {
  option: StructuredOption;
  selected: boolean;
  showPinyin: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`min-w-0 text-left rounded-lg border p-3 transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        selected
          ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
          : 'border-slate-200 bg-white hover:border-slate-400'
      }`}
    >
      {option.image && (
        <div className="aspect-[4/3] bg-slate-50 border border-slate-100 rounded-md mb-2 overflow-hidden">
          <img
            src={getDriveMediaPlayerUrl(option.image)}
            alt={option.alt || `Lựa chọn ${option.id}`}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold ${
          selected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 text-slate-700'
        }`}>
          {option.id}
        </span>
        <span className="min-w-0">
          {option.text && <span className="block text-sm font-semibold text-slate-900">{option.text}</span>}
          {showPinyin && option.pinyin && <span className="block text-xs text-indigo-700 mt-0.5">{option.pinyin}</span>}
        </span>
      </div>
    </button>
  );
}

export const HskStructuredExercise: React.FC<HskStructuredExerciseProps> = ({
  item,
  answers,
  onAnswerChange
}) => {
  const [localAnswers, setLocalAnswers] = useState<StructuredAnswerMap>({});
  const data = item.data || {};
  const type = String(item.type || '').toLowerCase().trim() as StructuredExerciseType | 'fill';
  const rows = getStructuredQuestionRows(item);
  const sharedOptions = getStructuredSharedOptions(item);
  const currentAnswers = answers || localAnswers;
  const showPinyin = data.showPinyin === true;
  const shouldShuffleOptions = data.shuffleOptions === true;
  const shouldShuffleImages = data.shuffleImages === true;
  const playCount = typeof data.playCount === 'number' && data.playCount > 0 ? data.playCount : 2;
  const limitPlayCount = data.limitPlayCount === true;
  const isListening = type.startsWith('listening_');
  const blockAudio = getText(data.audio) || getText(data.audioUrl) || getText(data.audioPromptUrl);
  const blockQuestionAudio = getText(data.questionAudio) || getText(data.questionAudioUrl);
  const hasSharedOptions = sharedOptions.length > 0;
  const sharedOptionsHaveImages = sharedOptions.some((option) => option.image);
  const displayedSharedOptions = shouldShuffleImages && sharedOptionsHaveImages
    ? shuffleAndRelabelOptions(sharedOptions, `${item.id}:images`)
    : shouldShuffleOptions && !sharedOptionsHaveImages
      ? shuffleAndRelabelOptions(sharedOptions, item.id)
    : sharedOptions;
  const passage = data.passage && typeof data.passage === 'object' && !Array.isArray(data.passage)
    ? data.passage as Record<string, unknown>
    : null;

  const choose = (key: string, answer: string) => {
    if (onAnswerChange) onAnswerChange(key, answer);
    else setLocalAnswers((current) => ({ ...current, [key]: answer }));
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <header className="flex items-start gap-3 border-b border-slate-100 pb-3">
        <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
          {isListening ? <Headphones className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
        </span>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 text-base">
            {type === 'fill' ? 'Điền từ vào chỗ trống' : STRUCTURED_EXERCISE_LABELS[type]}
          </h4>
          {getText(data.instruction) && <p className="text-sm text-slate-600 mt-0.5">{getText(data.instruction)}</p>}
        </div>
      </header>

      {blockAudio && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-1">
          <p className="text-xs font-semibold text-indigo-900">File nghe dùng chung</p>
          <LimitedAudio src={blockAudio} playCount={playCount} limit={limitPlayCount} />
        </div>
      )}

      {blockQuestionAudio && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-700">Âm thanh câu hỏi dùng chung</p>
          <LimitedAudio src={blockQuestionAudio} playCount={playCount} limit={limitPlayCount} />
        </div>
      )}

      {passage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">{getText(passage.text)}</p>
          {showPinyin && getText(passage.pinyin) && (
            <p className="text-sm text-indigo-700 mt-1">{getText(passage.pinyin)}</p>
          )}
        </div>
      )}

      {hasSharedOptions && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 space-y-2">
          <p className="text-xs font-bold uppercase text-teal-800 tracking-wide">Bảng lựa chọn dùng chung</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {displayedSharedOptions.map((option) => (
              <div key={option.id} className="rounded-lg border border-teal-200 bg-white p-2">
                {option.image && (
                  <div className="aspect-[4/3] bg-slate-50 rounded mb-2 overflow-hidden">
                    <img
                      src={getDriveMediaPlayerUrl(option.image)}
                      alt={option.alt || `Lựa chọn ${option.id}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <p className="text-sm font-bold text-slate-900">{option.id}. {option.text}</p>
                {showPinyin && option.pinyin && <p className="text-xs text-indigo-700">{option.pinyin}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.example && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-bold">Ví dụ (không tính điểm): </span>
          {typeof data.example === 'string' ? data.example : getText((data.example as Record<string, unknown>).text)}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => {
          const selected = currentAnswers[row.key] || '';
          const rowOptionsHaveImages = row.options.some((option) => option.image);
          const options = hasSharedOptions
            ? displayedSharedOptions
            : ((rowOptionsHaveImages ? shouldShuffleImages : shouldShuffleOptions)
              ? shuffleAndRelabelOptions(row.options, row.key)
              : row.options);
          const isSelectLayout = type === 'sentence_matching';
          const hideListeningPrompt = type === 'listening_text_choice';
          const usesSharedChoiceBank = hasSharedOptions && (
            type === 'fill' ||
            type === 'listening_shared_image_match' || type === 'reading_shared_image_match'
          );
          const prompt = hideListeningPrompt || row.prompt === `Câu ${index + 1}` ? '' : row.prompt;
          return (
            <article key={row.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
              <p className="font-bold text-slate-900">Câu {row.number ?? index + 1}{prompt ? `: ${prompt}` : ''}</p>
                  {showPinyin && row.pinyin && <p className="text-sm text-indigo-700 mt-1">{row.pinyin}</p>}
                  {data.showTranscript === true && row.transcript && (
                    <p className="text-xs text-slate-500 mt-1">{row.transcript}</p>
                  )}
                </div>
                {row.audio && (
                  <div className="w-full sm:w-72 shrink-0">
                    <LimitedAudio src={row.audio} playCount={playCount} limit={limitPlayCount} />
                  </div>
                )}
              </div>

              {row.questionAudio && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Âm thanh câu hỏi</p>
                  <LimitedAudio src={row.questionAudio} playCount={playCount} limit={limitPlayCount} />
                </div>
              )}

              {type === 'fill' && options.length === 0 ? (
                <input
                  type="text"
                  value={selected}
                  onChange={(event) => choose(row.key, event.target.value)}
                  placeholder="Nhập câu trả lời bằng chữ Hán..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  aria-label={`Nhập đáp án cho câu ${index + 1}`}
                />
              ) : usesSharedChoiceBank ? (
                <div
                  role="radiogroup"
                  aria-label={`${type === 'fill' ? 'Chọn đáp án' : 'Chọn hình'} cho câu ${index + 1}`}
                  className="flex flex-wrap gap-2"
                >
                  {options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected === (option.answerId || option.id)}
                      onClick={() => choose(row.key, option.answerId || option.id)}
                      className={`min-w-11 rounded-lg border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        selected === (option.answerId || option.id)
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-teal-500'
                      }`}
                    >
                      {option.id}
                    </button>
                  ))}
                </div>
              ) : isSelectLayout ? (
                <select
                  value={selected}
                  onChange={(event) => choose(row.key, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  aria-label={`Chọn đáp án cho câu ${index + 1}`}
                >
                  <option value="">Chọn đáp án</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.answerId || option.id}>{option.id}. {option.text}</option>
                  ))}
                </select>
              ) : (
                <div role="radiogroup" aria-label={`Lựa chọn câu ${index + 1}`} className={`grid gap-2 ${
                  options.some((option) => option.image)
                    ? 'grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {options.map((option) => (
                    <React.Fragment key={option.id}>
                      <OptionCard
                        option={option}
                        selected={selected === (option.answerId || option.id)}
                        showPinyin={showPinyin}
                        onSelect={() => choose(row.key, option.answerId || option.id)}
                      />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
