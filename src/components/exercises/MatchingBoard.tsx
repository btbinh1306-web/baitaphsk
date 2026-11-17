import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Question } from '../../types';

// Two-column "nối" board: tap a word on the left, then its meaning on the right
// (or the other way round). Each pair gets its own colour and a connecting line.
// Answers are stored exactly like multiple choice (question id -> option index),
// so grading and the teacher view are unchanged.

const PAIR_COLORS = ['#0d9488', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#16a34a', '#dc2626', '#0891b2', '#9333ea', '#ca8a04', '#4f46e5', '#059669'];

// "微小（wēixiǎo）" -> the word on one line, the pinyin smaller underneath.
const ItemLabel: React.FC<{ prompt: string }> = ({ prompt }) => {
  const match = prompt.match(/^(.+?)（(.+)）$/u);
  if (!match) return <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{prompt}</span>;
  return (
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block [overflow-wrap:anywhere]">{match[1]}</span>
      <span className="block text-xs font-normal text-slate-500 [overflow-wrap:anywhere]">{match[2]}</span>
    </span>
  );
};

type Line = { key: string; x1: number; y1: number; x2: number; y2: number; color: string };

interface MatchingBoardProps {
  questions: Question[];
  answers: Record<string, number>;
  onAssign: (questionId: string, optionIndex: number) => void;
  onClear: (questionId: string) => void;
  getAnchorId?: (questionId: string) => string;
}

export const MatchingBoard: React.FC<MatchingBoardProps> = ({ questions, answers, onAssign, onClear, getAnchorId }) => {
  const options = questions[0]?.options || [];
  const [pendingLeft, setPendingLeft] = useState<string | null>(null);
  const [pendingRight, setPendingRight] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const leftDots = useRef<Record<string, HTMLSpanElement | null>>({});
  const rightDots = useRef<Record<number, HTMLSpanElement | null>>({});

  const colorFor = (questionId: string) => PAIR_COLORS[questions.findIndex((q) => q.id === questionId) % PAIR_COLORS.length];
  const ownerOf = (optionIndex: number) => questions.find((q) => answers[q.id] === optionIndex)?.id;

  // One meaning belongs to one word: taking it from another word frees that word.
  const connect = (questionId: string, optionIndex: number) => {
    const previousOwner = ownerOf(optionIndex);
    if (previousOwner && previousOwner !== questionId) onClear(previousOwner);
    onAssign(questionId, optionIndex);
    setPendingLeft(null);
    setPendingRight(null);
  };

  const pickLeft = (questionId: string) => {
    if (pendingRight !== null) return connect(questionId, pendingRight);
    setPendingLeft((current) => (current === questionId ? null : questionId));
  };

  const pickRight = (optionIndex: number) => {
    if (pendingLeft) return connect(pendingLeft, optionIndex);
    setPendingRight((current) => (current === optionIndex ? null : optionIndex));
  };

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const box = board.getBoundingClientRect();
    const next: Line[] = [];
    questions.forEach((question, index) => {
      const optionIndex = answers[question.id];
      const from = leftDots.current[question.id];
      const to = typeof optionIndex === 'number' ? rightDots.current[optionIndex] : null;
      if (!from || !to) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      next.push({
        key: question.id,
        x1: a.left + a.width / 2 - box.left,
        y1: a.top + a.height / 2 - box.top,
        x2: b.left + b.width / 2 - box.left,
        y2: b.top + b.height / 2 - box.top,
        color: PAIR_COLORS[index % PAIR_COLORS.length]
      });
    });
    setLines(next);
  }, [questions, answers]);

  useLayoutEffect(() => {
    measure();
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(board);
    return () => observer.disconnect();
  }, [measure]);

  const matched = questions.filter((q) => typeof answers[q.id] === 'number').length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>Bấm một từ bên trái rồi bấm nghĩa bên phải để nối. Bấm × để gỡ.</span>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 font-bold text-teal-800">Đã nối {matched}/{questions.length}</span>
      </div>

      <div ref={boardRef} className="relative grid grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1.6fr)] items-start sm:grid-cols-[minmax(0,2fr)_3rem_minmax(0,5fr)]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {lines.map((line) => (
            <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth={2.5} strokeLinecap="round" />
          ))}
        </svg>

        <div className="space-y-2">
          {questions.map((question, index) => {
            const optionIndex = answers[question.id];
            const isMatched = typeof optionIndex === 'number';
            const isPending = pendingLeft === question.id;
            const color = colorFor(question.id);
            return (
              <div key={question.id} id={getAnchorId?.(question.id)} className="relative scroll-mt-32 flex items-stretch">
                <button
                  type="button"
                  onClick={() => pickLeft(question.id)}
                  aria-pressed={isPending}
                  className={`flex min-h-[3rem] min-w-0 flex-1 items-center gap-1.5 rounded-lg border bg-white px-2 py-2 text-left text-sm font-semibold text-slate-800 transition ${
                    isPending ? 'border-teal-500 ring-2 ring-teal-400' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  style={isMatched ? { borderColor: color } : undefined}
                >
                  <span className="shrink-0 text-xs font-bold text-slate-400">{index + 1}.</span>
                  <ItemLabel prompt={question.prompt} />
                  {isMatched && (
                    <span className="shrink-0 rounded px-1 text-xs font-bold text-white" style={{ backgroundColor: color }}>
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                  )}
                </button>
                <span className="relative flex w-0 items-center">
                  <span
                    ref={(node) => { leftDots.current[question.id] = node; }}
                    className="absolute -left-1.5 h-3 w-3 rounded-full border-2 bg-white"
                    style={{ borderColor: isMatched ? color : '#cbd5e1', backgroundColor: isMatched ? color : '#fff' }}
                  />
                </span>
                {isMatched && (
                  <button
                    type="button"
                    onClick={() => onClear(question.id)}
                    aria-label={`Gỡ nối câu ${index + 1}`}
                    className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold leading-none text-slate-500 shadow-sm hover:border-rose-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div />

        <div className="space-y-2">
          {options.map((option, optionIndex) => {
            const owner = ownerOf(optionIndex);
            const isPending = pendingRight === optionIndex;
            const color = owner ? colorFor(owner) : undefined;
            return (
              <div key={optionIndex} className="flex items-stretch">
                <span className="relative flex w-0 items-center">
                  <span
                    ref={(node) => { rightDots.current[optionIndex] = node; }}
                    className="absolute -left-1.5 h-3 w-3 rounded-full border-2"
                    style={{ borderColor: color || '#cbd5e1', backgroundColor: color || '#fff' }}
                  />
                </span>
                <button
                  type="button"
                  onClick={() => pickRight(optionIndex)}
                  aria-pressed={isPending}
                  className={`min-h-[3rem] min-w-0 flex-1 rounded-lg border bg-white px-2 py-2 [overflow-wrap:anywhere] sm:px-3 text-left text-sm text-slate-700 transition ${
                    isPending ? 'border-teal-500 ring-2 ring-teal-400' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  style={color ? { borderColor: color } : undefined}
                >
                  {option}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
