import React from 'react';
import { Mic } from 'lucide-react';
import { LessonSection } from '../types/lesson';
import { ExerciseRenderer } from './ExerciseRenderer';
import { getStructuredQuestionRows, isStructuredExerciseItem, StructuredAnswerMap } from '../utils/structuredExercises';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { speakText } from '../utils/tts';
import type { AnswerSnapshotStatus } from '../types';

export type ReadOnlyAnswerStatus = 'correct' | 'wrong' | 'unanswered' | 'manual';
type TeacherReviewStatus = 'Chưa chấm' | 'Đúng' | 'Sai' | 'Cần sửa';

export interface ReadOnlyExamItem {
  id: string;
  section: string;
  number?: number;
  prompt: string;
  userAnswer?: string;
  correctAnswer?: string;
  status: ReadOnlyAnswerStatus;
  legacyFallback?: boolean;
  options?: string[];
  optionImages?: string[];
  imageUrl?: string;
  audioUrl?: string;
  audioText?: string;
  subjective?: boolean;
  subjectiveKind?: 'essay' | 'translation' | 'speaking';
  audioResponse?: boolean;
  studentAudioUrl?: string;
  teacherAudioUrl?: string;
  studentAudioLabel?: string;
  teacherComment?: string;
  teacherScore?: string | number;
  teacherReviewStatus?: TeacherReviewStatus;
}

export interface ReadOnlyExamSection {
  title: string;
  passage?: string;
  items: ReadOnlyExamItem[];
}

interface ResultExamReadOnlyProps {
  sections: ReadOnlyExamSection[];
  structuredSections?: LessonSection[];
}

const normalizeAnswer = (value: string): string => value
  .toLowerCase()
  .replace(/^[a-f]\s*[.)。：:]\s*/i, '')
  .replace(/\s+/g, '')
  .trim();

const answerMatches = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeAnswer(left);
  const normalizedRight = normalizeAnswer(right);
  return Boolean(normalizedLeft && normalizedRight && (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ));
};

const exactAnswerMatches = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeAnswer(left);
  const normalizedRight = normalizeAnswer(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

const resolveStructuredAnswerId = (
  answer: string,
  options: Array<{ id: string; text?: string }>
): string => {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return '';

  const matched = options.find((option) => {
    const candidates = [
      option.id,
      option.text ? `${option.id}. ${option.text}` : '',
      option.text || ''
    ].filter(Boolean);

    return candidates.some((candidate) => (
      normalizeAnswer(candidate) === normalizedAnswer ||
      answerMatches(answer, candidate)
    ));
  });

  return matched?.id || '';
};

const statusLabel = (item: ReadOnlyExamItem): string => {
  if (item.status === 'correct') return '✓ ĐÚNG';
  if (item.status === 'wrong') return '✗ SAI';
  if (item.status === 'manual') return 'GV CHẤM';
  return item.legacyFallback ? '' : 'CHƯA LÀM';
};

const statusClass = (item: ReadOnlyExamItem): string => {
  if (item.status === 'correct') return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  if (item.status === 'wrong') return 'border-rose-300 bg-rose-50 text-rose-900';
  if (item.status === 'manual') return 'border-indigo-300 bg-indigo-50 text-indigo-900';
  return 'border-slate-300 bg-slate-100 text-slate-700';
};

const optionClass = (selected: boolean, correct: boolean): string => {
  if (selected && correct) return 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400';
  if (selected) return 'border-rose-400 bg-rose-50 ring-1 ring-rose-300';
  if (correct) return 'border-emerald-300 bg-emerald-50/40';
  return 'border-slate-200 bg-white';
};

const stripOptionLabel = (value: string): string => value.replace(/^[a-f]\s*[.)。：:]\s*/i, '').trim();

const isFillQuestion = (sectionTitle: string, item: ReadOnlyExamItem): boolean => (
  /điền từ|fill/i.test(`${sectionTitle} ${item.section}`)
);

const isOrderingQuestion = (sectionTitle: string, item: ReadOnlyExamItem): boolean => (
  /sắp xếp câu|ordering|arrange/i.test(`${sectionTitle} ${item.section}`)
);

const isSubjectiveQuestion = (sectionTitle: string, item: ReadOnlyExamItem): boolean => (
  Boolean(item.subjective) ||
  Boolean(item.subjectiveKind) ||
  // Prompt notes like "gần người nói" belong to a fill-in question and
  // must not turn the item into a subjective-answer card.
  /tự luận|dịch|nói|ghi âm|viết|chép|口译|笔译|口语/i.test(`${sectionTitle} ${item.section}`)
);

const displayAnswer = (value: string): string => stripOptionLabel(value.split('|')[0] || '');

const getDisplayQuestionNumber = (item: ReadOnlyExamItem, fallbackNumber: number): number => {
  const labelNumber = item.studentAudioLabel?.match(/(?:câu|question)\s*(\d+)/i)?.[1];
  return labelNumber ? Number(labelNumber) : (item.number || fallbackNumber);
};

const renderPromptWithAnswer = (prompt: string, answer: string): React.ReactNode => {
  const answerText = displayAnswer(answer) || 'Chưa có đáp án';
  const blank = /_{2,}|＿{2,}|（\s*）|\(\s*\)|□+/u.exec(prompt);
  if (!blank || blank.index === undefined) {
    return <>{prompt} <strong className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">{answerText}</strong></>;
  }

  return (
    <>
      {prompt.slice(0, blank.index)}
      <strong className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">{answerText}</strong>
      {prompt.slice(blank.index + blank[0].length)}
    </>
  );
};

export const ResultExamReadOnly: React.FC<ResultExamReadOnlyProps> = ({ sections, structuredSections = [] }) => {
  const structuredAnswers: StructuredAnswerMap = {};
  const structuredCorrectAnswers: StructuredAnswerMap = {};
  const structuredStatuses: Record<string, AnswerSnapshotStatus> = {};

  structuredSections.forEach((section) => {
    section.items.forEach((item) => {
      if (!isStructuredExerciseItem(item)) return;
      getStructuredQuestionRows(item).forEach((row) => {
        const resultItem = sections
          .find((candidate) => candidate.title === section.title)
          ?.items.find((candidate) => candidate.id === row.key);
        structuredCorrectAnswers[row.key] = row.correctAnswer;
        const rawUserAnswer = resultItem?.userAnswer || '';
        const resolvedAnswerId = resolveStructuredAnswerId(rawUserAnswer, row.options);
        if (resolvedAnswerId) structuredAnswers[row.key] = resolvedAnswerId;

        if (!rawUserAnswer.trim()) {
          structuredStatuses[row.key] = 'unanswered';
          return;
        }

        if (!row.correctAnswer) {
          structuredStatuses[row.key] = resultItem?.status || 'manual';
          return;
        }

        // Recompute from the answer ID so a stale snapshot cannot mark a
        // correct shared-image/shared-choice answer as wrong in read-only view.
        structuredStatuses[row.key] = resolvedAnswerId
          ? (resolvedAnswerId === row.correctAnswer ? 'correct' : 'wrong')
          : (resultItem?.status || 'wrong');
      });
    });
  });

  const structuredByTitle = new Map(structuredSections.map((section) => [section.title, section]));
  const orderedBlocks: Array<
    | { kind: 'regular'; section: ReadOnlyExamSection }
    | { kind: 'structured'; section: LessonSection }
  > = sections.map((section) => {
    const structuredSection = structuredByTitle.get(section.title);
    return structuredSection
      ? { kind: 'structured', section: structuredSection }
      : { kind: 'regular', section };
  });

  structuredSections.forEach((section) => {
    if (!sections.some((candidate) => candidate.title === section.title)) {
      orderedBlocks.push({ kind: 'structured', section });
    }
  });

  return (
  <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6">
    <header className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">Chế độ xem lại đề</p>
      <h4 className="mt-1 text-xl font-bold text-slate-900">Xem toàn bộ đề</h4>
      <p className="mt-1 text-sm text-slate-600">
        Đây là giao diện chỉ đọc của bài thi. Các lựa chọn và câu trả lời không thể chỉnh sửa.
      </p>
    </header>

    {orderedBlocks.map((block, blockIndex) => {
      if (block.kind === 'structured') {
        return (
          <section key={`${block.section.title}-${blockIndex}`} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                {blockIndex + 1}
              </span>
              <div>
                <h5 className="text-base font-bold text-slate-900">{block.section.title}</h5>
                <p className="text-xs text-slate-500">Giao diện bài làm được khóa chỉ đọc</p>
              </div>
            </div>
            <div className="space-y-5">
              {block.section.items.map((item) => (
                <ExerciseRenderer
                  key={item.id}
                  item={item}
                  mode="result"
                  studentMode={false}
                  answers={structuredAnswers}
                  correctAnswers={structuredCorrectAnswers}
                  answerStatuses={structuredStatuses}
                />
              ))}
            </div>
          </section>
        );
      }

      const section = block.section;
      const sectionIndex = blockIndex;
      const fillItems = section.items.filter((item) => isFillQuestion(section.title, item));
      const fillWordBank = Array.from(new Set(
        fillItems.flatMap((item) => (item.options || []).map(stripOptionLabel)).filter(Boolean)
      ));
      return (
      <section key={`${section.title}-${sectionIndex}`} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
            {sectionIndex + 1}
          </span>
          <div>
            <h5 className="text-base font-bold text-slate-900">{section.title}</h5>
            <p className="text-xs text-slate-500">{section.items.length} câu</p>
          </div>
        </div>

        {fillWordBank.length > 0 && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-emerald-900">
              Bảng từ cho sẵn (chọn từ thích hợp để điền vào câu)
            </p>
            <div className="flex flex-wrap gap-2">
              {fillWordBank.map((word) => (
                <span key={word} className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-base font-extrabold text-emerald-950 shadow-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {section.passage && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {section.passage}
          </div>
        )}

        <div className="space-y-4">
          {section.items.map((item, itemIndex) => {
            const userAnswer = item.userAnswer || '';
            const correctAnswer = item.correctAnswer || '';
            const questionNumber = getDisplayQuestionNumber(item, itemIndex + 1);
            const fillQuestion = isFillQuestion(section.title, item);
            const orderingQuestion = isOrderingQuestion(section.title, item);
            const subjectiveQuestion = isSubjectiveQuestion(section.title, item);
            const fillAnswerIsCorrect = fillQuestion && !subjectiveQuestion && Boolean(userAnswer.trim())
              ? answerMatches(userAnswer, correctAnswer)
              : undefined;
            const displayedStatus = fillAnswerIsCorrect === undefined
              ? item.status
              : fillAnswerIsCorrect ? 'correct' : 'wrong';
            const displayedItem = displayedStatus === item.status ? item : { ...item, status: displayedStatus };

            return (
              <article key={`${item.id}-${itemIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h6 className="text-sm font-bold leading-relaxed text-slate-900">
                    Câu {questionNumber}: {fillQuestion ? renderPromptWithAnswer(item.prompt, userAnswer || correctAnswer) : item.prompt}
                  </h6>
                  {!subjectiveQuestion && statusLabel(displayedItem) && (
                    <span className={`self-start whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusClass(displayedItem)}`}>
                      {statusLabel(displayedItem)}
                    </span>
                  )}
                </div>

                {item.teacherReviewStatus && (
                  <div className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    <span className="font-bold">Đánh giá câu: </span>{item.teacherReviewStatus}
                  </div>
                )}

                {orderingQuestion && (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className={`rounded-lg border-2 px-4 py-3 ${item.status === 'wrong'
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-slate-200 bg-white text-slate-800'}`}>
                      <p className="text-xs font-extrabold uppercase tracking-wide">Bài làm của bạn</p>
                      <p className="mt-1 text-lg font-extrabold leading-relaxed">
                        {displayAnswer(userAnswer) || 'Chưa trả lời'}
                      </p>
                    </div>
                    <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-950">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">Đáp án đúng</p>
                      <p className="mt-1 text-lg font-extrabold leading-relaxed">
                        {displayAnswer(correctAnswer) || 'Chưa có đáp án'}
                      </p>
                    </div>
                  </div>
                )}

                {subjectiveQuestion && (
                  <div className="mt-3 space-y-3">
                    {item.audioResponse || item.subjectiveKind === 'speaking' ? (
                      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Bài làm của bạn:
                        </span>
                        {item.studentAudioUrl ? (
                          <audio controls preload="metadata" src={item.studentAudioUrl} className="h-9 w-full" />
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bài làm của bạn: </span>
                            {userAnswer || '(Chưa làm)'}
                          </div>
                        )}

                        {item.teacherAudioUrl && (
                          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                              <Mic className="h-3.5 w-3.5 text-emerald-700" />
                              File chữa phát âm của giáo viên:
                            </span>
                            <audio controls preload="metadata" src={item.teacherAudioUrl} className="h-9 w-full" />
                            <p className="text-[11px] italic text-emerald-800">
                              Hãy nghe lại giọng mẫu của giáo viên và đọc theo.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bài làm của bạn:</span>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                          {userAnswer || '(Chưa làm)'}
                        </div>
                      </div>
                    )}

                    {item.teacherComment ? (
                      <div className={item.audioResponse || item.subjectiveKind === 'speaking'
                        ? 'rounded-lg border-2 border-indigo-300 bg-indigo-100/80 p-3 text-xs text-indigo-950 space-y-1'
                        : 'rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1'}>
                        <span className={item.audioResponse || item.subjectiveKind === 'speaking' ? 'font-bold text-indigo-900' : 'font-bold text-amber-900'}>
                          {item.audioResponse || item.subjectiveKind === 'speaking'
                            ? 'Nhận xét của Giáo viên cho bài ghi âm này:'
                            : 'Nhận xét của Giáo viên cho câu này:'}
                        </span>
                        <p className={item.audioResponse || item.subjectiveKind === 'speaking'
                          ? 'border-l-2 border-indigo-400 pl-4 font-semibold italic'
                          : 'border-l-2 border-amber-400 pl-4 font-semibold italic'}>
                          "{item.teacherComment}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] italic text-slate-400">(Chưa có nhận xét riêng cho câu này)</div>
                    )}
                  </div>
                )}

                {item.imageUrl && (
                  <img
                    src={getDriveMediaPlayerUrl(item.imageUrl)}
                    alt={`Hình minh họa câu ${questionNumber}`}
                    className="mt-3 max-h-64 w-full rounded-lg border border-slate-200 bg-white object-contain"
                  />
                )}

                {(item.audioUrl || item.audioText) && (
                  <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                    <p className="mb-2 text-xs font-bold text-indigo-900">Âm thanh câu hỏi</p>
                    {item.audioUrl ? (
                      <audio controls preload="metadata" src={getDriveAudioPlayerUrl(item.audioUrl)} className="h-9 w-full" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => speakText(item.audioText || '')}
                        className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white"
                      >
                        Bấm để nghe
                      </button>
                    )}
                  </div>
                )}

                {subjectiveQuestion || fillQuestion || orderingQuestion ? null : item.options && item.options.length > 0 ? (
                  <div className={`mt-3 grid gap-2 ${item.options.length >= 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {item.options.map((option, optionIndex) => {
                      const selected = exactAnswerMatches(userAnswer, option);
                      const correct = exactAnswerMatches(correctAnswer, option);
                      const explicitLabel = option.match(/^([a-f])\s*[.)。：:]\s*/i)?.[1];
                      const optionLabel = explicitLabel || String.fromCharCode(65 + optionIndex);
                      const optionText = explicitLabel
                        ? option.replace(/^[a-f]\s*[.)。：:]\s*/i, '')
                        : option;

                      return (
                        <div
                          key={`${item.id}-option-${optionIndex}`}
                          className={`rounded-lg border p-3 transition ${optionClass(selected, correct)}`}
                        >
                          <div className="flex items-start gap-2">
                            {item.optionImages?.[optionIndex] && (
                              <img
                                src={getDriveMediaPlayerUrl(item.optionImages[optionIndex])}
                                alt={`Hình lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                                className="h-20 w-24 shrink-0 rounded border border-slate-200 bg-white object-contain"
                              />
                            )}
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700">
                              {optionLabel.toUpperCase()}
                            </span>
                            <span className="text-sm font-semibold leading-relaxed">{optionText}</span>
                          </div>
                          {(selected || correct) && (
                            <p className="mt-1 pl-8 text-[11px] font-bold">
                              {selected && correct ? 'Bạn đã chọn · Đáp án đúng' : selected ? 'Bạn đã chọn' : 'Đáp án đúng'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Bài làm của bạn</p>
                      <p className={`whitespace-pre-wrap font-semibold ${displayedStatus === 'wrong' ? 'text-rose-700' : 'text-emerald-800'}`}>
                        {userAnswer || 'Chưa có câu trả lời'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Đáp án / đáp án tham khảo</p>
                      <p className="whitespace-pre-wrap font-semibold">{correctAnswer || 'Giáo viên chấm'}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
    })}
  </section>
  );
};
