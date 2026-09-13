import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Image as ImageIcon } from 'lucide-react';
import { LessonItem } from '../../types/lesson';
import {
  getStructuredQuestionRows,
  getStructuredSharedOptions,
  getQuestionAnchor,
  StructuredAnswerMap,
  StructuredOption,
  getStructuredExerciseLabel,
  StructuredExerciseType
} from '../../utils/structuredExercises';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../../utils/audioUtils';
import { speakText } from '../../utils/tts';
import type { AnswerSnapshotStatus } from '../../types';
import SinglePassAudio from './SinglePassAudio';

interface HskStructuredExerciseProps {
  item: LessonItem;
  answers?: StructuredAnswerMap;
  correctAnswers?: StructuredAnswerMap;
  answerStatuses?: Record<string, AnswerSnapshotStatus>;
  onAnswerChange?: (key: string, answer: string) => void;
  studentMode?: boolean;
  mode?: 'exam' | 'result';
  showPinyinOverride?: boolean;
  audioPlayCounts?: Record<string, number>;
  audioScope?: string;
  onAudioAttempt?: (key: string) => { allowed: boolean; count: number };
  hideBlockAudio?: boolean;
}

const getText = (value: unknown): string => typeof value === 'string' ? value : '';

const hasHanzi = (value: string): boolean => /[\u3400-\u9fff]/u.test(value);
const looksLikePinyin = (value: string): boolean => {
  const hanziCount = (value.match(/[\u3400-\u9fff]/gu) || []).length;
  return /[A-Za-zÀ-ỹ]/u.test(value) && hanziCount <= 2;
};
const looksLikeOptionLine = (value: string): boolean => (value.match(/(?:^|\s)[A-F](?:[.)。：:]?)(?=\s)/gu) || []).length >= 2;
const stripExampleBullet = (value: string): string => value.replace(/^\s*★\s*/u, '').trim();
const getExampleJudgement = (value: string): '✓' | '×' | null => {
  const match = value.match(/[（(]\s*([√✓×])\s*[）)]/u);
  if (!match) return null;
  return match[1] === '×' ? '×' : '✓';
};
const stripExampleJudgement = (value: string): string => value
  .replace(/\s*[（(]\s*[√✓×]\s*[）)]\s*$/u, '')
  .trim();
const stripExampleAnswer = (value: string): string => value
  .replace(/\s*(?:→|->)\s*[A-F]\s*$/u, '')
  .replace(/\s*[（(]\s*[A-F]\s*[）)]/gu, '')
  .trim();

function renderExample(value: string, showPinyin: boolean): React.ReactNode {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
  const content: React.ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    if (looksLikeOptionLine(line)) continue;
    if (next && looksLikePinyin(line) && hasHanzi(next)) {
      const judgement = getExampleJudgement(next);
      const hanziLine = stripExampleAnswer(stripExampleJudgement(next));
      content.push(
        <div key={`${index}-${next}`} className={judgement ? 'rounded-lg border border-indigo-100 bg-white/70 px-3 py-2' : 'space-y-0.5'}>
          <p className="font-semibold text-slate-800 whitespace-pre-wrap">{hanziLine}</p>
          {showPinyin && <p className="text-sm leading-6 text-indigo-600/90 whitespace-pre-wrap">{stripExampleAnswer(line)}</p>}
          {judgement && (
            <ExampleChoiceCards
              options={[
                { id: '✓', text: 'Đúng', pinyin: '', image: '', alt: '' },
                { id: '×', text: 'Sai', pinyin: '', image: '', alt: '' }
              ]}
              correctAnswer={judgement}
              showPinyin={false}
            />
          )}
        </div>
      );
      index += 1;
      continue;
    }

    if (!showPinyin && looksLikePinyin(line)) continue;
    content.push(<p key={index} className="whitespace-pre-wrap">{stripExampleBullet(line)}</p>);
  }

  return <div className="space-y-2">{content}</div>;
}

function normalizeExampleOptions(value: unknown): StructuredOption[] {
  if (!Array.isArray(value)) return [];
  return value.map((option, index) => {
    const item = option && typeof option === 'object' ? option as Record<string, unknown> : {};
    return {
      id: getText(item.id) || String.fromCharCode(65 + index),
      text: getText(item.text),
      pinyin: getText(item.pinyin),
      image: getText(item.image),
      alt: getText(item.alt)
    };
  });
}

function ExampleChoiceCards({
  options,
  correctAnswer,
  showPinyin
}: {
  options: StructuredOption[];
  correctAnswer: string;
  showPinyin: boolean;
}) {
  if (!options.length || !correctAnswer) return null;

  return (
    <div className={`mt-4 grid gap-2 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map((option) => {
        const isCorrect = option.id === correctAnswer;
        return (
          <div
            key={option.id}
            className={`min-w-0 rounded-lg border-2 p-2 text-center ${isCorrect
              ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
              : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {option.image && (
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-50">
                <img src={getDriveMediaPlayerUrl(option.image)} alt={option.alt || `Đáp án ví dụ ${option.id}`} className="h-full w-full object-contain" />
              </div>
            )}
            <p className="mt-1 text-sm font-bold">{option.id}{option.text ? (option.id === '✓' || option.id === '×' ? ` ${option.text}` : `. ${option.text}`) : ''}</p>
            {showPinyin && option.pinyin && <p className="text-xs leading-5 font-medium text-indigo-600/90">{option.pinyin}</p>}
            {isCorrect && <p className="mt-1 text-xs font-extrabold text-emerald-800">✓ Đáp án đúng</p>}
          </div>
        );
      })}
    </div>
  );
}

function ExampleFixedAnswer({ answer }: { answer: string }) {
  if (!answer) return null;

  return (
    <div className="shrink-0 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-center text-emerald-900 ring-2 ring-emerald-200">
      <p className="text-xl font-extrabold">{answer}</p>
      <p className="mt-1 text-xs font-extrabold">✓ Đáp án đúng</p>
    </div>
  );
}

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

function LimitedAudio({
  src,
  fallbackText,
  playCount,
  limit,
  studentMode,
  audioKey,
  usedCount = 0,
  onAttempt
}: {
  src: string;
  fallbackText?: string;
  playCount: number;
  limit: boolean;
  studentMode: boolean;
  audioKey?: string;
  usedCount?: number;
  onAttempt?: (key: string) => { allowed: boolean; count: number };
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [used, setUsed] = useState(usedCount);
  useEffect(() => setUsed(usedCount), [usedCount]);

  const exhausted = limit && used >= playCount;
  const playOnce = () => {
    if (exhausted) return;
    const attempt = limit && onAttempt && audioKey
      ? onAttempt(audioKey)
      : { allowed: true, count: Math.min(used + 1, playCount) };
    if (!attempt.allowed) return;

    setUsed(attempt.count);
    if (src) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
    } else if (fallbackText) {
      speakText(fallbackText);
    }
  };

  if (studentMode && limit) {
    return (
      <div className="space-y-1">
        {src && (
          <audio
            ref={audioRef}
            preload="auto"
            src={getDriveAudioPlayerUrl(src)}
            className="hidden"
            aria-hidden="true"
          />
        )}
        {fallbackText || src ? (
          <button
            type="button"
            onClick={playOnce}
            disabled={exhausted}
            className="inline-flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" />
              {exhausted ? 'Đã nghe đủ 2 lần' : used > 0 ? 'Nghe lần cuối' : 'Nghe'}
            </span>
            <span className="font-mono text-[11px]">{Math.min(used, playCount)}/{playCount}</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 italic">Chưa gắn file nghe</span>
        )}
      </div>
    );
  }

  if (!src) {
    return fallbackText ? (
      <button
        type="button"
        onClick={() => speakText(fallbackText)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
      >
        <Headphones className="h-3.5 w-3.5" /> Bấm để nghe
      </button>
    ) : (
      <span className="text-xs text-slate-500 italic">Chưa gắn file nghe</span>
    );
  }

  return (
    <div className="space-y-1">
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={getDriveAudioPlayerUrl(src)}
        className="w-full h-10"
      />
      {limit && !studentMode && (
        <p className="text-[11px] text-slate-500">
          Lượt nghe: {Math.min(used, playCount)}/{playCount}
        </p>
      )}
    </div>
  );
}

interface StructuredBlockAudioProps {
  item: LessonItem;
  attemptId?: string;
  studentMode?: boolean;
  audioPlayCounts?: Record<string, number>;
  audioScope?: string;
  onAudioAttempt?: (key: string) => { allowed: boolean; count: number };
  sticky?: boolean;
}

export const StructuredBlockAudio: React.FC<StructuredBlockAudioProps> = ({
  item,
  attemptId,
  studentMode = false,
  audioPlayCounts = {},
  audioScope = '',
  onAudioAttempt,
  sticky = false
}) => {
  const data = item.data || {};
  const src = getText(data.audio) || getText(data.audioUrl) || getText(data.audioPromptUrl);
  if (!src) return null;

  const playCount = typeof data.maxPlayCount === 'number' && data.maxPlayCount > 0
    ? data.maxPlayCount
    : typeof data.playCount === 'number' && data.playCount > 0
      ? data.playCount
      : 2;
  const limit = studentMode && data.limitPlayCount === true;
  const audioKey = `${audioScope}::${item.id}::block`;
  const singlePassKey = `${attemptId || audioScope}::${item.id}::single-pass`;

  return (
    <div className={`rounded-lg border border-indigo-200 bg-indigo-50/95 p-3 space-y-1 backdrop-blur ${
      sticky ? 'sticky top-44 sm:top-32 z-30 shadow-lg' : ''
    }`}>
      <p className="text-xs font-semibold text-indigo-900">File nghe dùng chung</p>
      {studentMode && data.singlePass === true ? <SinglePassAudio key={singlePassKey} src={getDriveAudioPlayerUrl(src)} audioKey={singlePassKey} /> : <LimitedAudio
        src={src}
        playCount={playCount}
        limit={limit}
        studentMode={studentMode}
        audioKey={audioKey}
        usedCount={audioPlayCounts[audioKey] || 0}
        onAttempt={onAudioAttempt}
      />}
    </div>
  );
};

function OptionCard({
  option,
  selected,
  correct = false,
  status,
  showPinyin,
  onSelect,
  disabled = false
}: {
  option: StructuredOption;
  selected: boolean;
  correct?: boolean;
  status?: AnswerSnapshotStatus;
  showPinyin: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={`min-w-0 text-left rounded-lg border p-3 transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-default ${
        selected && correct
          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400'
          : selected && status
            ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-300'
            : selected
              ? 'border-emerald-600 bg-emerald-600 text-white ring-1 ring-emerald-500'
            : correct
              ? 'border-emerald-300 bg-emerald-50/50'
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
          selected && !status
            ? 'bg-white/15 border-white text-white'
            : selected
              ? 'bg-teal-700 border-teal-700 text-white'
              : 'border-slate-300 text-slate-700'
        }`}>
          {option.id}
        </span>
        <span className="min-w-0">
          {option.text && <span className={`block text-sm font-semibold ${selected && !status ? 'text-white' : 'text-slate-900'}`}>{option.text}</span>}
          {showPinyin && option.pinyin && <span className={`block text-xs leading-5 font-medium mt-0.5 ${selected && !status ? 'text-emerald-50' : 'text-indigo-600/90'}`}>{option.pinyin}</span>}
        </span>
      </div>
      {status && (selected || correct) && (
        <span className={`mt-1 block pl-8 text-[11px] font-bold ${
          correct ? 'text-emerald-800' : 'text-rose-800'
        }`}>
          {selected && correct ? 'Bạn đã chọn · Đáp án đúng' : selected ? 'Bạn đã chọn' : 'Đáp án đúng'}
        </span>
      )}
    </button>
  );
}

export const HskStructuredExercise: React.FC<HskStructuredExerciseProps> = ({
  item,
  answers,
  correctAnswers,
  answerStatuses,
  onAnswerChange,
  studentMode = false,
  mode = 'exam',
  showPinyinOverride,
  audioPlayCounts = {},
  audioScope = '',
  onAudioAttempt,
  hideBlockAudio = false
}) => {
  const [localAnswers, setLocalAnswers] = useState<StructuredAnswerMap>({});
  const data = item.data || {};
  const type = String(item.type || '').toLowerCase().trim() as StructuredExerciseType | 'fill';
  const rows = getStructuredQuestionRows(item);
  const sharedOptions = getStructuredSharedOptions(item);
  const currentAnswers = answers || localAnswers;
  const readOnly = mode === 'result';
  const showPinyin = showPinyinOverride ?? data.showPinyin === true;
  const shouldShuffleOptions = data.shuffleOptions !== false && (studentMode || data.shuffleOptions === true);
  const shouldShuffleImages = data.shuffleImages === true;
  const playCount = typeof data.maxPlayCount === 'number' && data.maxPlayCount > 0
    ? data.maxPlayCount
    : typeof data.playCount === 'number' && data.playCount > 0
      ? data.playCount
      : 2;
  const limitPlayCount = studentMode && data.limitPlayCount === true;
  const isListening = type.startsWith('listening_');
  const blockAudio = getText(data.audio) || getText(data.audioUrl) || getText(data.audioPromptUrl);
  const blockQuestionAudio = getText(data.questionAudio) || getText(data.questionAudioUrl);
  const compactListeningImageChoice = type === 'listening_image_choice' && Array.isArray(data.exampleImages);
  const hasSharedOptions = sharedOptions.length > 0;
  const sharedChoiceSelectLayout = type === 'reading_shared_image_match' || (type === 'fill' && hasSharedOptions);
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
    if (readOnly) return;
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
            {getStructuredExerciseLabel(item)}
          </h4>
          {getText(data.instruction) && <p className="text-sm text-slate-600 mt-0.5">{getText(data.instruction)}</p>}
        </div>
      </header>

      {blockAudio && !hideBlockAudio && (
        <StructuredBlockAudio
          item={item}
          studentMode={studentMode}
          audioPlayCounts={audioPlayCounts}
          audioScope={audioScope}
          onAudioAttempt={onAudioAttempt}
        />
      )}

      {blockQuestionAudio && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-700">Âm thanh câu hỏi dùng chung</p>
          <LimitedAudio src={blockQuestionAudio} playCount={playCount} limit={limitPlayCount} studentMode={studentMode} />
        </div>
      )}

      {passage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">{getText(passage.text)}</p>
          {showPinyin && getText(passage.pinyin) && (
            <p className="text-sm leading-6 text-indigo-600/90 mt-1">{getText(passage.pinyin)}</p>
          )}
        </div>
      )}

      {hasSharedOptions && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 space-y-2">
          <p className="text-xs font-bold uppercase text-teal-800 tracking-wide">Bảng lựa chọn dùng chung</p>
          <div className="grid grid-cols-3 gap-2">
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
                {showPinyin && option.pinyin && <p className="text-xs leading-5 font-medium text-indigo-600/90">{option.pinyin}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(data.exampleImages) && <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {data.exampleImages.map((value, index) => {
          const example = value as { image: string; text: string };
          return <figure key={index} className="min-w-0 rounded-lg border p-2 sm:p-3">
            <img src={example.image} alt={`Ví dụ câu ${index + 1}`} className="h-24 w-full object-contain sm:h-28" />
            <figcaption className="mt-2 flex items-center justify-center gap-1 text-center text-sm font-semibold text-slate-800">
              <span>Ví dụ: Câu {index + 1}</span>
              <span aria-label={`Đáp án ví dụ ${example.text}`}>{example.text}</span>
            </figcaption>
          </figure>;
        })}
      </div>}
      {data.example && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 px-3 py-3 text-sm text-slate-700 shadow-sm">
          <p className="mb-2 font-extrabold text-indigo-950">Ví dụ (không tính điểm)</p>
          <div className={sharedChoiceSelectLayout ? 'flex items-center gap-3' : ''}>
            <div className="min-w-0 flex-1">
              {typeof data.example === 'string'
                ? renderExample(data.example, showPinyin)
                : getText((data.example as Record<string, unknown>).text)}
            </div>
            {sharedChoiceSelectLayout && <ExampleFixedAnswer answer={getText(data.exampleAnswer)} />}
          </div>
          {!sharedChoiceSelectLayout && (
            <ExampleChoiceCards
              options={normalizeExampleOptions(data.exampleOptions).length > 0 ? normalizeExampleOptions(data.exampleOptions) : displayedSharedOptions}
              correctAnswer={getText(data.exampleAnswer)}
              showPinyin={showPinyin}
            />
          )}
        </div>
      )}

      <div className={compactListeningImageChoice ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {rows.map((row, index) => {
          const selected = currentAnswers[row.key] || '';
          const correctAnswer = correctAnswers?.[row.key] || row.correctAnswer;
          const rowStatus: AnswerSnapshotStatus = answerStatuses?.[row.key] || (
            !correctAnswer ? 'manual' : selected ? (selected === correctAnswer ? 'correct' : 'wrong') : 'unanswered'
          );
          const rowOptionsHaveImages = row.options.some((option) => option.image);
          const options = hasSharedOptions
            ? displayedSharedOptions
            : ((rowOptionsHaveImages ? shouldShuffleImages : shouldShuffleOptions)
              ? shuffleAndRelabelOptions(row.options, row.key)
              : row.options);
          const isSelectLayout = type === 'sentence_matching';
          const inlineSelectLayout = sharedChoiceSelectLayout;
          const hideListeningPrompt = studentMode && isListening && (
            data.hidePrompt === true ||
            type === 'listening_text_choice' ||
            type === 'listening_comprehension_choice'
          );
          const usesSharedChoiceBank = hasSharedOptions && (
            type === 'listening_shared_image_match'
          );
          const prompt = hideListeningPrompt || row.prompt === `Câu ${index + 1}` ? '' : row.prompt;
          const promptLines = prompt.split('\n').map((line) => line.trim()).filter(Boolean);
          const pinyinLines = row.pinyin.split('\n').map((line) => line.trim()).filter(Boolean);
          const pairPromptPinyin = showPinyin && promptLines.length > 1 && promptLines.length === pinyinLines.length;
          return (
            <article id={getQuestionAnchor(row.key)} key={row.key} className="scroll-mt-32 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 space-y-3">
              <div className={`flex ${inlineSelectLayout ? 'flex-row items-start justify-between gap-3' : 'flex-col sm:flex-row sm:items-start justify-between gap-3'}`}>
                <div className="min-w-0 flex-1">
                  {pairPromptPinyin ? (
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 whitespace-pre-wrap">Câu {row.number ?? index + 1}: {promptLines[0]}</p>
                      <p className="text-xs sm:text-sm leading-5 text-indigo-600/90 whitespace-pre-wrap">{pinyinLines[0]}</p>
                      {promptLines.slice(1).map((line, lineIndex) => (
                        <React.Fragment key={`${row.key}-line-${lineIndex}`}>
                          <p className="font-bold text-slate-900 whitespace-pre-wrap">{line}</p>
                          <p className="text-xs sm:text-sm leading-5 text-indigo-600/90 whitespace-pre-wrap">{pinyinLines[lineIndex + 1]}</p>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900 whitespace-pre-wrap">Câu {row.number ?? index + 1}{prompt ? `: ${prompt}` : ''}</p>
                      {showPinyin && row.pinyin && <p className="text-xs sm:text-sm leading-5 text-indigo-600/90 mt-1 whitespace-pre-wrap">{row.pinyin}</p>}
                    </>
                  )}
                  {(!studentMode || data.showTranscript === true) && row.transcript && (
                    <p className="text-xs text-slate-500 mt-1">{row.transcript}</p>
                  )}
                </div>
                {inlineSelectLayout && (
                  <div className="w-28 sm:w-40 shrink-0 space-y-2">
                    <select
                      value={selected}
                      disabled={readOnly}
                      onChange={(event) => choose(row.key, event.target.value)}
                      className={`w-full rounded-lg border px-2.5 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 ${
                        readOnly && rowStatus === 'correct'
                          ? 'border-emerald-400 bg-emerald-50'
                          : readOnly && rowStatus === 'wrong'
                            ? 'border-rose-400 bg-rose-50'
                            : 'border-slate-300 bg-white'
                      }`}
                      aria-label={`Chọn đáp án cho câu ${index + 1}`}
                    >
                      <option value="">Chọn</option>
                      {options.map((option) => (
                        <option key={option.id} value={option.answerId || option.id}>
                          {option.image ? option.id : `${option.id}. ${option.text}`}
                        </option>
                      ))}
                    </select>
                    {readOnly && (
                      <p className={`text-xs font-bold ${rowStatus === 'correct' ? 'text-emerald-800' : rowStatus === 'wrong' ? 'text-rose-800' : 'text-slate-600'}`}>
                        {rowStatus === 'correct' ? '✓ Đúng' : rowStatus === 'wrong' ? '✗ Sai' : 'Chưa trả lời'}
                      </p>
                    )}
                  </div>
                )}
                {row.audio && (
                  <div className="w-full sm:w-72 shrink-0">
                    <LimitedAudio
                      src={row.audio}
                      fallbackText={row.transcript}
                      playCount={playCount}
                      limit={limitPlayCount}
                      studentMode={studentMode}
                      audioKey={`${audioScope}::${row.key}`}
                      usedCount={audioPlayCounts[`${audioScope}::${row.key}`] || 0}
                      onAttempt={onAudioAttempt}
                    />
                  </div>
                )}

                {!row.audio && row.transcript && (
                  <div className="w-full sm:w-72 shrink-0">
                    <LimitedAudio
                      src=""
                      fallbackText={row.transcript}
                      playCount={playCount}
                      limit={limitPlayCount}
                      studentMode={studentMode}
                      audioKey={`${audioScope}::${row.key}`}
                      usedCount={audioPlayCounts[`${audioScope}::${row.key}`] || 0}
                      onAttempt={onAudioAttempt}
                    />
                  </div>
                )}
              </div>

              {row.questionAudio && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Âm thanh câu hỏi</p>
                  <LimitedAudio
                    src={row.questionAudio}
                    playCount={playCount}
                    limit={limitPlayCount}
                    studentMode={studentMode}
                    audioKey={`${audioScope}::${row.key}::question`}
                    usedCount={audioPlayCounts[`${audioScope}::${row.key}::question`] || 0}
                    onAttempt={onAudioAttempt}
                  />
                </div>
              )}

              {row.image && (
                <div className={`rounded-lg border border-slate-200 bg-white p-2 ${compactListeningImageChoice ? 'aspect-[4/3]' : 'sm:max-w-sm'}`}>
                  <img
                    src={getDriveMediaPlayerUrl(row.image)}
                    alt={row.alt || `Hình câu ${row.number ?? index + 1}`}
                    className={`w-full object-contain ${compactListeningImageChoice ? 'h-full' : 'max-h-52'}`}
                  />
                </div>
              )}

              {type === 'fill' && options.length === 0 ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={selected}
                    readOnly={readOnly}
                    onChange={(event) => choose(row.key, event.target.value)}
                    placeholder="Nhập câu trả lời bằng chữ Hán..."
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 ${
                      readOnly && rowStatus === 'correct'
                        ? 'border-emerald-400 bg-emerald-50'
                        : readOnly && rowStatus === 'wrong'
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-slate-300 bg-white'
                    }`}
                    aria-label={`Nhập đáp án cho câu ${index + 1}`}
                  />
                  {readOnly && (
                    <p className={`text-xs font-bold ${rowStatus === 'correct' ? 'text-emerald-800' : rowStatus === 'wrong' ? 'text-rose-800' : 'text-slate-600'}`}>
                      {rowStatus === 'correct' ? '✓ Đúng' : rowStatus === 'wrong' ? `✗ Sai · Đáp án: ${correctAnswer || 'GV chấm'}` : 'Chưa trả lời'}
                    </p>
                  )}
                </div>
              ) : usesSharedChoiceBank ? (
                <div className="space-y-2">
                  <div
                    role="radiogroup"
                    aria-label={`Chọn hình cho câu ${index + 1}`}
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
                  >
                    {options.map((option) => {
                      const optionId = option.answerId || option.id;
                      const optionSelected = selected === optionId;
                      const optionCorrect = readOnly && correctAnswer === optionId;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={optionSelected}
                          disabled={readOnly}
                          onClick={() => choose(row.key, optionId)}
                          className={`w-full min-w-0 rounded-lg border px-2 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-default ${
                            optionSelected && optionCorrect
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : optionSelected && readOnly
                                ? 'border-rose-500 bg-rose-100 text-rose-900'
                                : optionSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                : optionCorrect
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                  : 'border-slate-300 bg-white text-slate-800 hover:border-teal-500'
                          }`}
                        >
                          {option.id}
                        </button>
                      );
                    })}
                  </div>
                  {readOnly && (
                    <p className={`text-xs font-bold ${rowStatus === 'correct' ? 'text-emerald-800' : rowStatus === 'wrong' ? 'text-rose-800' : 'text-slate-600'}`}>
                      {rowStatus === 'correct' ? '✓ Đúng' : rowStatus === 'wrong' ? `✗ Sai · Đáp án: ${correctAnswer || 'GV chấm'}` : 'Chưa trả lời'}
                    </p>
                  )}
                </div>
              ) : isSelectLayout ? (
                <div className="space-y-2">
                  <select
                    value={selected}
                    disabled={readOnly}
                    onChange={(event) => choose(row.key, event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 ${
                      readOnly && rowStatus === 'correct'
                        ? 'border-emerald-400 bg-emerald-50'
                        : readOnly && rowStatus === 'wrong'
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-slate-300 bg-white'
                    }`}
                    aria-label={`Chọn đáp án cho câu ${index + 1}`}
                  >
                    <option value="">Chọn đáp án</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.answerId || option.id}>
                        {option.image ? option.id : `${option.id}. ${option.text}`}
                      </option>
                    ))}
                  </select>
                  {readOnly && (
                    <p className={`text-xs font-bold ${rowStatus === 'correct' ? 'text-emerald-800' : rowStatus === 'wrong' ? 'text-rose-800' : 'text-slate-600'}`}>
                      {rowStatus === 'correct' ? '✓ Đúng' : rowStatus === 'wrong' ? `✗ Sai · Đáp án: ${correctAnswer || 'GV chấm'}` : 'Chưa trả lời'}
                    </p>
                  )}
                </div>
              ) : inlineSelectLayout ? null : (
                <div role="radiogroup" aria-label={`Lựa chọn câu ${index + 1}`} className={`grid gap-2 ${
                  compactListeningImageChoice
                    ? 'grid-cols-2'
                    : options.length === 2
                      ? 'grid-cols-2'
                    : options.some((option) => option.image)
                      ? 'grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {options.map((option) => (
                    <React.Fragment key={option.id}>
                      <OptionCard
                        option={option}
                        selected={selected === (option.answerId || option.id)}
                        correct={readOnly && correctAnswer === (option.answerId || option.id)}
                        status={readOnly ? rowStatus : undefined}
                        showPinyin={showPinyin}
                        disabled={readOnly}
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
