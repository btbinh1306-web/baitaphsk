import React, { useState, useEffect } from 'react';
import { SubmissionData } from '../types';
import { fetchResultById } from '../services/gasService';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  MessageSquare,
  BookOpen,
  ExternalLink,
  FileText,
  Mic,
  XCircle,
  Sparkles
} from 'lucide-react';

interface ResultLookupProps {
  initialSubmissionId?: string;
}

export const ResultLookup: React.FC<ResultLookupProps> = ({ initialSubmissionId = '' }) => {
  const [submissionId, setSubmissionId] = useState(initialSubmissionId);
  const [result, setResult] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubmissionId && initialSubmissionId.trim()) {
      handleSearch(initialSubmissionId.trim());
    }
  }, [initialSubmissionId]);

  const handleSearch = async (idToSearch?: string) => {
    const searchId = idToSearch || submissionId;
    if (!searchId || !searchId.trim()) {
      setErrorMsg('Vui lòng nhập Mã bài nộp.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    const res = await fetchResultById(searchId.trim());
    if (res.ok && res.row) {
      setResult(res.row);
    } else {
      setErrorMsg(res.error || 'Không tìm thấy kết quả cho Mã bài nộp này.');
    }
    setIsLoading(false);
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Helper: Parse teacher's comment into general comment & per-item comments
  const parseTeacherComment = (commentStr?: string) => {
    if (!commentStr) return { itemComments: {} as Record<string, string>, generalComment: '' };

    const parts = commentStr.split(' | ');
    const itemComments: Record<string, string> = {};
    const generalParts: string[] = [];

    parts.forEach((part) => {
      const trimmed = part.trim();
      const match = trimmed.match(/^\[(Tự luận|Ghi âm)\s*(?:C|câu)?\s*(\d+)\]:\s*(.*)$/i);
      if (match) {
        const type = match[1].toLowerCase().includes('tự luận') ? 'essay' : 'audio';
        const num = parseInt(match[2], 10) - 1; // 0-based index
        const text = match[3] ? match[3].trim() : '';
        if (text) {
          itemComments[`${type}_${num}`] = text;
        }
      } else {
        generalParts.push(trimmed);
      }
    });

    return {
      itemComments,
      generalComment: generalParts.join(' | ').trim(),
    };
  };

  // Helper: Parse essay string into individual questions & answers
  const parseEssays = (essaysStr?: string) => {
    if (!essaysStr || essaysStr === 'Không làm phần tự luận') return [];
    const chunks = essaysStr.split(/(?=【)/g).filter(Boolean);
    return chunks.map((chunk) => {
      const titleMatch = chunk.match(/【(.*?)】/);
      const prompt = titleMatch ? titleMatch[1] : 'Câu tự luận';
      const answer = chunk.replace(/【.*?】\n?/, '').replace(/^Bài làm:\s*/, '').trim();
      return { prompt, answer };
    });
  };

  // Helper: Parse wrong details list (can be separated by \n or |)
  const parseWrongDetails = (wrongStr?: string) => {
    if (!wrongStr || wrongStr === 'Không có câu sai') return [];
    const rawLines = wrongStr.includes('\n') ? wrongStr.split('\n') : wrongStr.split(' | ');
    return rawLines.map(s => s.trim()).filter(Boolean);
  };

  const parseWrongLineItem = (line: string) => {
    const raw = line.trim();
    let title = '';
    let prompt = '';
    let userAns = '';
    let correctAns = '';

    const bracketMatch = raw.match(/^\[(.*?)\](?:\s*:\s*|\s*)(.*)$/);

    let mainBody = raw;

    if (bracketMatch) {
      const bracketContent = bracketMatch[1].trim();
      mainBody = bracketMatch[2] ? bracketMatch[2].trim() : '';

      const promptInBracket =
        bracketContent.match(/^(.*?)(?:\:\s*|\s*-\s*)(?:"|“)(.*?)(?:"|”)$/) ||
        bracketContent.match(/^(.*?)(?:\:\s*|\s*-\s*)(.*)$/);

      if (promptInBracket && promptInBracket[2]) {
        title = promptInBracket[1].trim();
        prompt = promptInBracket[2].trim();
      } else {
        title = bracketContent;
      }
    }

    if (!prompt) {
      const promptMatch = mainBody.match(/(?:Câu hỏi|Đề bài)?\s*["“](.*?)["”]/i);
      if (promptMatch) {
        prompt = promptMatch[1].trim();
      }
    }

    const userAnsMatch = mainBody.match(
      /(?:Bạn chọn|Chọn|Bạn nhập|Nhập|Bạn xếp)\s*(?:\[|\:\s*)(.*?)(?:\]|\s*—|\s*-\s*Đáp|\s*\||$)/i
    );
    if (userAnsMatch) {
      userAns = userAnsMatch[1].trim();
    }

    const correctAnsMatch = mainBody.match(
      /(?:Đáp án đúng|ĐT đúng)\s*(?:\[|\:\s*)(.*?)(?:\]|$)/i
    );
    if (correctAnsMatch) {
      correctAns = correctAnsMatch[1].trim();
    }

    if (!title) {
      title = 'Câu sai';
    }

    // Lookup original question prompt from SAMPLE_EXAMS if missing
    if (!prompt) {
      const lessonName = result?.lesson || '';
      const targetExam = SAMPLE_EXAMS.find(e =>
        lessonName && (e.title.toLowerCase().includes(lessonName.toLowerCase()) || lessonName.toLowerCase().includes(e.title.toLowerCase()) || e.id === lessonName)
      ) || SAMPLE_EXAMS[0];

      if (targetExam) {
        const qNumMatch = (title + ' ' + raw).match(/(?:TN|Trắc nghiệm|Điền từ|Sắp xếp|Đọc hiểu|C|Câu)\s*(\d+)/i);
        const qNum = qNumMatch ? parseInt(qNumMatch[1], 10) - 1 : -1;

        if ((title.includes('TN') || title.includes('Trắc nghiệm') || raw.includes('TN')) && qNum >= 0 && targetExam.mcQuestions[qNum]) {
          prompt = targetExam.mcQuestions[qNum].prompt;
        } else if ((title.includes('Điền từ') || raw.includes('Điền từ')) && qNum >= 0 && targetExam.fillQuestions?.[qNum]) {
          prompt = targetExam.fillQuestions[qNum].prompt;
        } else if ((title.includes('Sắp xếp') || raw.includes('Sắp xếp')) && qNum >= 0 && targetExam.arrangeQuestions?.[qNum]) {
          prompt = targetExam.arrangeQuestions[qNum].prompt;
        } else if (title.includes('Đọc hiểu') || raw.includes('Đọc hiểu')) {
          if (targetExam.readingPassages) {
            for (const p of targetExam.readingPassages) {
              if (qNum >= 0 && p.questions[qNum]) {
                prompt = p.questions[qNum].prompt;
                break;
              }
            }
          }
        }

        // Fallback search across all questions in SAMPLE_EXAMS by matching answer or options text
        if (!prompt) {
          allExamsLoop: for (const exam of SAMPLE_EXAMS) {
            const allQs = [
              ...exam.mcQuestions,
              ...(exam.fillQuestions || []),
              ...(exam.arrangeQuestions || []),
              ...(exam.readingPassages ? exam.readingPassages.flatMap(p => p.questions) : [])
            ];
            for (const q of allQs) {
              const optionsStr = (q.options || []).join(' ');
              const answerStr = `${q.answer ?? ''} ${q.acceptableAnswers || ''} ${q.explanation || ''}`;
              if (
                (correctAns && (optionsStr.includes(correctAns) || answerStr.includes(correctAns))) ||
                (userAns && optionsStr.includes(userAns))
              ) {
                prompt = q.prompt;
                break allExamsLoop;
              }
            }
          }
        }
      }
    }

    return { title, prompt, userAns, correctAns, raw };
  };

  const { itemComments, generalComment } = parseTeacherComment(result?.comment);
  const essayList = parseEssays(result?.essays);
  const wrongList = parseWrongDetails(result?.wrong);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Search Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-800">
          <BookOpen className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">Tra Cứu Kết Quả & Nhận Xét Bài Tập HSK</h2>
          <p className="text-xs text-slate-500 mt-1">
            Nhập Mã bài nộp (ID gồm 8 ký tự được cấp khi nộp bài) để xem điểm trắc nghiệm, bài làm chi tiết và nhận xét từ giáo viên.
          </p>
        </div>

        <form onSubmit={onSubmitForm} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="Nhập Mã bài nộp (VD: a1b2c3d4)..."
              required
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono tracking-wide uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition cursor-pointer"
          >
            {isLoading ? 'Đang tra...' : 'Xem Kết Quả'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Display Card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 animate-in fade-in duration-200">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Mã bài nộp: {result.id}
              </span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{result.name}</h3>
              <p className="text-xs text-slate-500 font-medium">Lớp: {result.class} | Bài: {result.lesson}</p>
            </div>

            <div>
              {result.status === 'Đã chấm' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã được giáo viên chấm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" /> Đã nộp - Chờ giáo viên chấm
                </span>
              )}
            </div>
          </div>

          {/* Scores Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Multiple Choice Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Điểm Phần Trắc Nghiệm</span>
                <span className="text-2xl font-bold text-slate-800">{result.percent}%</span>
                <span className="text-xs text-slate-500 block">
                  Đúng {result.correct}/{result.total} câu
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                {result.percent}%
              </div>
            </div>

            {/* Speaking Score Card */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 block">Điểm Luyện Nói (GV chấm)</span>
                <span className="text-2xl font-bold text-indigo-900">
                  {result.speakScore || (result.status === 'Đã chấm' ? 'Đã duyệt' : 'Chờ chấm')}
                </span>
                <span className="text-xs text-indigo-700 block font-medium">Kỹ năng khẩu ngữ & phát âm</span>
              </div>
              <Award className="w-10 h-10 text-indigo-600 opacity-80" />
            </div>
          </div>

          {/* General Teacher Comment Box */}
          <div className="p-4 bg-amber-50/90 border-2 border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-amber-700" /> Nhận Xét Chung Của Giáo Viên:
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-950 italic leading-relaxed">
              {generalComment
                ? `"${generalComment}"`
                : Object.keys(itemComments).length > 0
                ? '"Đã có nhận xét chi tiết từng câu ở bên dưới."'
                : 'Giáo viên chưa nhập nhận xét chung hoặc bài tập đang chờ chấm.'}
            </p>
          </div>

          {/* Detailed Wrong Questions */}
          {wrongList.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" /> Chi Tiết Các Câu Làm Sai (Trắc nghiệm / Điền từ / Sắp xếp):
              </h4>
              <div className="space-y-3">
                {wrongList.map((wrongLine, idx) => {
                  const item = parseWrongLineItem(wrongLine);
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-2.5"
                    >
                      {/* Header Badge & Title */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-2">
                        <span className="font-bold text-white bg-rose-600 px-2.5 py-0.5 rounded-md text-[11px] shrink-0 uppercase tracking-wide">
                          Câu sai #{idx + 1} • {item.title}
                        </span>
                      </div>

                      {/* Question Prompt */}
                      {item.prompt ? (
                        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-lg text-sm text-slate-900 font-bold leading-snug">
                          <span className="text-red-700 font-extrabold mr-1.5">[Câu hỏi gốc]:</span>
                          <span>{item.prompt}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                          {item.raw}
                        </p>
                      )}

                      {/* Side-by-side Red & Green Answer Cards */}
                      {(item.userAns || item.correctAns) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {/* Student Answer Box (Red) */}
                          <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-rose-800 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              Học sinh chọn / nhập:
                            </span>
                            <p className="font-bold text-rose-950 text-xs sm:text-sm pl-4 leading-normal">
                              {item.userAns || 'Không chọn / Để trống'}
                            </p>
                          </div>

                          {/* Correct Answer Box (Green) */}
                          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              Đáp án đúng chính xác:
                            </span>
                            <p className="font-bold text-emerald-950 text-xs sm:text-sm pl-4 leading-normal">
                              {item.correctAns || '—'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Essay Answers with Immediate Per-Item Teacher Comments */}
          {essayList.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" /> Chi Tiết Bài Làm Tự Luận Của Bạn:
                </h4>
              </div>

              <div className="space-y-4">
                {essayList.map((item, idx) => {
                  const teacherItemComment = itemComments[`essay_${idx}`];

                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      {/* Question Prompt */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-slate-800">
                          Câu {idx + 1}: {item.prompt}
                        </span>
                      </div>

                      {/* Student Answer */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Bài làm của bạn:
                        </span>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                          {item.answer || '(Chưa làm)'}
                        </div>
                      </div>

                      {/* Immediate Teacher Comment for this Essay Question */}
                      {teacherItemComment ? (
                        <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg text-xs text-amber-950 space-y-1 animate-in fade-in duration-150">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Nhận xét của Giáo viên cho câu này:
                          </span>
                          <p className="font-semibold italic text-amber-900 pl-4 border-l-2 border-amber-400">
                            "{teacherItemComment}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          (Chưa có nhận xét riêng cho câu này)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Recorded Audios with Immediate Per-Item Teacher Comments */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-600" /> Bản Ghi Âm Luyện Nói Của Bạn:
            </h4>

            {result.audios && result.audios.length > 0 ? (
              <div className="space-y-4">
                {result.audios.map((aud, idx) => {
                  const audioSrc = aud.url || `data:${aud.mime || 'audio/webm'};base64,${aud.data}`;
                  const teacherItemComment = itemComments[`audio_${idx}`];

                  return (
                    <div key={idx} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                      {/* Audio Title / Question Prompt */}
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <span className="text-xs font-bold text-indigo-950">
                          {aud.label || `Ghi âm câu ${idx + 1}`}
                        </span>
                      </div>

                      {/* Audio Player */}
                      <audio controls src={audioSrc} className="w-full h-9" />

                      {/* Immediate Teacher Comment for this Audio Recording */}
                      {teacherItemComment ? (
                        <div className="p-3 bg-indigo-100/80 border-2 border-indigo-300 rounded-lg text-xs text-indigo-950 space-y-1 animate-in fade-in duration-150">
                          <span className="font-bold text-indigo-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Nhận xét của Giáo viên cho bài ghi âm này:
                          </span>
                          <p className="font-semibold italic text-indigo-950 pl-4 border-l-2 border-indigo-400">
                            "{teacherItemComment}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          (Chưa có nhận xét riêng cho file ghi âm này)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : result.driveLinks ? (
              <div className="space-y-4">
                <span className="text-slate-500 font-sans text-xs block font-medium">
                  File ghi âm đã lưu trên Google Drive:
                </span>
                {result.driveLinks.split('\n').filter(Boolean).map((link, idx) => {
                  const teacherItemComment = itemComments[`audio_${idx}`];

                  return (
                    <div key={idx} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950">
                          Ghi âm câu {idx + 1}:
                        </span>
                        <a
                          href={link.substring(link.indexOf('http'))}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline font-bold"
                        >
                          Mở link Google Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Immediate Teacher Comment for this Drive Audio */}
                      {teacherItemComment ? (
                        <div className="p-3 bg-indigo-100/80 border-2 border-indigo-300 rounded-lg text-xs text-indigo-950 space-y-1">
                          <span className="font-bold text-indigo-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Nhận xét của Giáo viên cho bài ghi âm này:
                          </span>
                          <p className="font-semibold italic text-indigo-950 pl-4 border-l-2 border-indigo-400">
                            "{teacherItemComment}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          (Chưa có nhận xét riêng cho file ghi âm này)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Bài nộp này không kèm file ghi âm.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

