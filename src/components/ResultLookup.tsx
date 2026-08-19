import React, { useState, useEffect } from 'react';
import { SubmissionData } from '../types';
import { fetchResultById, cleanImageTagsFromText, getLocalSubmissions } from '../services/gasService';
import { getHandwritingSubmissions } from '../services/handwritingService';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { getAudioSrcFromObject, getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { ImageLightboxModal } from './ImageLightboxModal';
import { normalizeImageList } from '../utils/imageUtils';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  BookOpen,
  ExternalLink,
  FileText,
  Mic,
  XCircle,
  Sparkles,
  Eye,
  Image as ImageIcon,
  Pencil,
  Download
} from 'lucide-react';

interface ResultLookupProps {
  initialSubmissionId?: string;
}

export const ResultLookup: React.FC<ResultLookupProps> = ({ initialSubmissionId = '' }) => {
  const [submissionId, setSubmissionId] = useState(initialSubmissionId);
  const [result, setResult] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const openLightbox = (images: string[], index: number, titleText: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(titleText);
  };

  const handleOpenNewTab = (url: string, title = 'Xem ảnh bài chữa') => {
    const mediaUrl = getDriveMediaPlayerUrl(url);
    try {
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; font-family: sans-serif; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${mediaUrl}" alt="Full Image" />
            </body>
          </html>
        `);
        win.document.close();
      } else {
        window.open(mediaUrl, '_blank');
      }
    } catch (e) {
      window.open(mediaUrl, '_blank');
    }
  };

  const getValidImages = (rawList?: string[], fallbackTextSources: (string | undefined)[] = []): string[] => {
    const resultUrls: string[] = [];

    const addUrl = (url?: string) => {
      if (!url || typeof url !== 'string') return;
      const trimmed = url.trim().replace(/^["'\\]+|["'\\]+$/g, '');
      if (trimmed.length > 10 && !trimmed.startsWith('[') && !resultUrls.includes(trimmed)) {
        resultUrls.push(trimmed);
      }
    };

    if (Array.isArray(rawList)) {
      rawList.forEach((url) => addUrl(url));
    }

    fallbackTextSources.forEach((text) => {
      if (!text || typeof text !== 'string') return;

      const normalizedText = text
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      const tagRegex = /\[(?:SUBMISSION_IMAGES|CORRECTED_IMAGES)\]:\s*(\[.*?\])/gs;
      let match;
      while ((match = tagRegex.exec(normalizedText)) !== null) {
        if (match[1]) {
          try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => addUrl(item));
            }
          } catch (e) {
            const strMatches = match[1].match(/"(data:image\/[^"]+|https?:\/\/[^"]+)"/g);
            if (strMatches) {
              strMatches.forEach((m) => addUrl(m));
            }
          }
        }
      }

      const base64Regex = /data:image\/[a-zA-Z0-9]+;base64,[a-zA-Z0-9+/=]+/g;
      const base64Matches = normalizedText.match(base64Regex);
      if (base64Matches) {
        base64Matches.forEach((m) => addUrl(m));
      }

      const httpRegex = /https?:\/\/[^\s"'\\]+\.(?:png|jpg|jpeg|webp|gif)/gi;
      const httpMatches = normalizedText.match(httpRegex);
      if (httpMatches) {
        httpMatches.forEach((m) => addUrl(m));
      }
    });

    return normalizeImageList(resultUrls).map(getDriveMediaPlayerUrl);
  };

  const handleDownloadImage = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = getDriveMediaPlayerUrl(url);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
    }
  };

  const handleDownloadAllCorrected = () => {
    if (!result?.correctedImages) return;
    result.correctedImages.forEach((url, idx) => {
      setTimeout(() => {
        handleDownloadImage(url, `Bai_chua_${result.id || 'hsk'}_trang_${idx + 1}.png`);
      }, idx * 300);
    });
  };

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

  // Helper: Parse only per-item teacher comments for the result details.
  const parseTeacherComment = (commentStr?: string) => {
    if (!commentStr) return { itemComments: {} as Record<string, string> };

    const parts = commentStr.split(' | ');
    const itemComments: Record<string, string> = {};

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
      }
    });

    return { itemComments };
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

  const lessonLower = (result?.lesson || '').toLowerCase();
  const essaysLower = (result?.essays || '').toLowerCase();

  // Look up in local handwriting store & local submissions store for supplemental images if needed
  const hwListSubmissions = getHandwritingSubmissions();
  const localListSubmissions = getLocalSubmissions();

  const hwMatchForLookup = result
    ? hwListSubmissions.find(
        (h) =>
          String(h.id).trim().toLowerCase() === String(result.id).trim().toLowerCase() ||
          (result.name &&
            h.studentName.trim().toLowerCase() === result.name.trim().toLowerCase() &&
            (h.exerciseTitle.toLowerCase().includes(lessonLower) || lessonLower.includes(h.exerciseTitle.toLowerCase())))
      )
    : undefined;

  const localMatchForLookup = result
    ? localListSubmissions.find(
        (l) =>
          String(l.id).trim().toLowerCase() === String(result.id).trim().toLowerCase() ||
          (result.name &&
            l.name.trim().toLowerCase() === result.name.trim().toLowerCase() &&
            (l.lesson.toLowerCase().includes(lessonLower) || lessonLower.includes(l.lesson.toLowerCase())))
      )
    : undefined;

  const combinedSubImages = [
    ...(result?.submissionImages || []),
    ...(hwMatchForLookup?.submissionImages || []),
    ...(localMatchForLookup?.submissionImages || [])
  ];

  const combinedCorrImages = [
    ...(result?.correctedImages || []),
    ...(hwMatchForLookup?.correctedImages || []),
    ...(localMatchForLookup?.correctedImages || [])
  ];

  const submissionImgs = result
    ? getValidImages(combinedSubImages, [result.essays, result.driveLinks, localMatchForLookup?.essays])
    : [];

  const correctedImgs = result
    ? getValidImages(combinedCorrImages, [
        result.teacherComment,
        result.comment,
        hwMatchForLookup?.teacherComment,
        localMatchForLookup?.teacherComment,
        localMatchForLookup?.comment
      ])
    : [];

  const isHandwritingType = Boolean(
    result &&
      (result.isHandwriting ||
        submissionImgs.length > 0 ||
        correctedImgs.length > 0 ||
        result.type === 'handwriting_submission' ||
        lessonLower.includes('nộp ảnh') ||
        lessonLower.includes('chép từ') ||
        lessonLower.includes('chép') ||
        lessonLower.includes('chữ hán') ||
        lessonLower.includes('bài viết') ||
        lessonLower.includes('tự luận') ||
        lessonLower.includes('nộp bài') ||
        essaysLower.includes('nộp bài chép tay') ||
        essaysLower.includes('chép từ'))
  );

  const { itemComments } = parseTeacherComment(
    result?.comment || hwMatchForLookup?.teacherComment || localMatchForLookup?.comment
  );
  const essayList = parseEssays(result?.essays);

  // Filter essayList to remove auto-generated placeholder strings
  const essayListFiltered = essayList.filter((item) => {
    const cleaned = cleanImageTagsFromText(item.answer);
    return cleaned && cleaned.trim().length > 0;
  });

  const wrongList = parseWrongDetails(result?.wrong);

  const displayPercent = result
    ? (result.total > 0
        ? Math.round((result.correct / result.total) * 100)
        : (result.percent <= 1 && result.percent > 0 ? Math.round(result.percent * 100) : result.percent))
    : 0;

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
            Nhập Mã bài nộp (ID gồm 8 ký tự được cấp khi nộp bài) để xem điểm, bài làm tự luận/ảnh nộp và nhận xét từ giáo viên.
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  Mã bài nộp: {result.id}
                </span>
                {isHandwritingType && (
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5 text-teal-600" /> Bài Chép Tay / Nộp Ảnh
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{result.name}</h3>
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

          {/* DẠNG BÀI NỘP ẢNH / BÀI VIẾT CHÉP TAY */}
          {isHandwritingType ? (
            <div className="space-y-6">
              {/* 1. Score & Grading Status Card */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-600" />
                    Điểm Số & Trạng Thái Đánh Giá
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-teal-950">
                      {result.speakScore
                        ? result.speakScore
                        : result.status === 'Đã chấm'
                        ? 'Đã Chấm'
                        : 'Chờ Chấm'}
                    </span>
                    {result.status === 'Đã chấm' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        ✓ Đã hoàn thành
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-700 font-medium">
                    {result.status === 'Đã chấm'
                      ? 'Bài tập nộp ảnh / chép từ mới đã được giáo viên kiểm tra và cho nhận xét'
                      : 'Bài làm đang trong hàng đợi chờ giáo viên chấm chữa'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-14 h-14 bg-teal-600 text-white rounded-2xl shadow-sm">
                  <Pencil className="w-7 h-7" />
                </div>
              </div>

              {/* 2. Handwriting / Photo Submission Content */}
              <div className="space-y-5 pt-2">
                {/* Student Submitted Images */}
                {submissionImgs.length > 0 && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-teal-600" />
                        Ảnh Bài Làm Đã Nộp ({submissionImgs.length} trang):
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          submissionImgs.forEach((url, idx) => {
                            setTimeout(() => handleOpenNewTab(url, `Bài nộp - Trang ${idx + 1}`), idx * 200);
                          });
                        }}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-700" /> Mở tất cả thẻ mới
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {submissionImgs.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:border-teal-500 transition"
                        >
                          <div
                            className="relative w-full aspect-4/3 bg-slate-50 cursor-pointer flex items-center justify-center p-1 overflow-hidden"
                            onClick={() => openLightbox(submissionImgs, idx, `Bài nộp - Trang ${idx + 1}`)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Submission ${idx + 1}`}
                              className="w-full h-full object-contain transition duration-200 hover:scale-[1.02]"
                            />
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-white/95 text-slate-700 font-extrabold text-[11px] shadow-sm border border-slate-200">
                              Trang {idx + 1}
                            </div>
                          </div>

                          <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => openLightbox(submissionImgs, idx, `Bài nộp - Trang ${idx + 1}`)}
                              className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Xem
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenNewTab(imgUrl, `Bài nộp - Trang ${idx + 1}`)}
                              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Mở ảnh bài nộp trong thẻ mới"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Thẻ mới
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadImage(imgUrl, `Bai_nop_trang_${idx + 1}.png`)}
                              className="py-1.5 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Tải ảnh bài nộp về máy"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" /> Tải
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Corrected Images */}
                {correctedImgs.length > 0 && (
                  <div className="space-y-3 p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        Ảnh Bài Đã Được Giáo Viên Chấm Chữa ({correctedImgs.length} ảnh):
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            correctedImgs.forEach((url, idx) => {
                              setTimeout(() => handleOpenNewTab(url, `Ảnh bài chữa - Trang ${idx + 1}`), idx * 200);
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Mở tất cả ảnh bài chữa trong các thẻ mới"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400" /> Mở tất cả thẻ mới
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            correctedImgs.forEach((url, idx) => {
                              setTimeout(() => handleDownloadImage(url, `Bai_chua_trang_${idx + 1}.png`), idx * 300);
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải hàng loạt ảnh ({correctedImgs.length})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                      {correctedImgs.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-sm transition hover:border-emerald-600"
                        >
                          <div
                            className="relative w-full aspect-4/3 bg-slate-50 cursor-pointer flex items-center justify-center p-1 overflow-hidden"
                            onClick={() => openLightbox(correctedImgs, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Corrected ${idx + 1}`}
                              className="w-full h-full object-contain transition duration-200 hover:scale-[1.02]"
                            />
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-white/95 text-emerald-800 font-extrabold text-[11px] shadow-sm border border-emerald-200">
                              Trang chữa {idx + 1}
                            </div>
                          </div>

                          <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => openLightbox(correctedImgs, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                              className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Phóng to
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenNewTab(imgUrl, `Ảnh bài chữa - Trang ${idx + 1}`)}
                              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Mở ảnh trong thẻ mới để xem kích thước gốc"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Thẻ mới
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadImage(imgUrl, `Bai_chua_trang_${idx + 1}.png`)}
                              className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Tải ảnh bài chữa này về máy"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" /> Tải
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Essays / Topics if present */}
                {essayListFiltered.length > 0 && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      Nội Dung Bài Làm Tự Luận:
                    </h4>
                    <div className="space-y-3">
                      {essayListFiltered.map((item, idx) => {
                        const teacherItemComment = itemComments[`essay_${idx}`];
                        const cleanAnswer = cleanImageTagsFromText(item.answer);
                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                            <span className="text-xs font-bold text-slate-800 block">
                              {item.prompt}
                            </span>
                            {cleanAnswer && (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                                {cleanAnswer}
                              </div>
                            )}
                            {teacherItemComment && (
                              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-1">
                                <span className="font-bold text-amber-900 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  Nhận xét riêng:
                                </span>
                                <p className="font-semibold italic text-amber-900 pl-3">
                                  "{teacherItemComment}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* DẠNG BÀI TRẮC NGHIỆM / LUYỆN NÓI KẾT HỢP CHUẨN */
            <>
              {/* Scores Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Multiple Choice Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Điểm Phần Trắc Nghiệm</span>
                    <span className="text-2xl font-bold text-slate-800">{displayPercent}%</span>
                    <span className="text-xs text-slate-500 block">
                      Đúng {result.correct}/{result.total} câu
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                    {displayPercent}%
                  </div>
                </div>

                {/* Overall Exercise Score Card */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 block">Điểm Bài Tập Chung (GV chấm)</span>
                    <span className="text-2xl font-bold text-indigo-900">
                      {result.speakScore || (result.status === 'Đã chấm' ? 'Đã duyệt' : 'Chờ chấm')}
                    </span>
                    <span className="text-xs text-indigo-700 block font-medium">Kết quả tổng thể do giáo viên chấm</span>
                  </div>
                  <Award className="w-10 h-10 text-indigo-600 opacity-80" />
                </div>
              </div>

              {/* HANDWRITING SUBMISSION DETAILS / IMAGES */}
              {(isHandwritingType || submissionImgs.length > 0 || correctedImgs.length > 0) && (
                <div className="space-y-5 pt-3 border-t border-slate-200">
                  {/* Student Submitted Images */}
                  {submissionImgs.length > 0 && (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-teal-600" />
                          Ảnh Bài Làm Học Sinh Đã Nộp ({submissionImgs.length} trang):
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              submissionImgs.forEach((url, idx) => {
                                setTimeout(() => handleOpenNewTab(url, `Bài nộp - Trang ${idx + 1}`), idx * 200);
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Mở tất cả ảnh bài nộp trong các thẻ mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-teal-400" /> Mở tất cả thẻ mới
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              submissionImgs.forEach((url, idx) => {
                                setTimeout(() => handleDownloadImage(url, `Bai_nop_trang_${idx + 1}.png`), idx * 300);
                              });
                            }}
                            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải hàng loạt ảnh ({submissionImgs.length})
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        {submissionImgs.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:border-teal-500 transition"
                          >
                            <div
                              className="relative w-full aspect-4/3 bg-slate-50 cursor-pointer flex items-center justify-center p-1 overflow-hidden"
                              onClick={() => openLightbox(submissionImgs, idx, `Bài nộp - Trang ${idx + 1}`)}
                            >
                              <img
                                src={imgUrl}
                                alt={`Submission ${idx + 1}`}
                                className="w-full h-full object-contain transition duration-200 hover:scale-[1.02]"
                              />
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-white/95 text-slate-700 font-extrabold text-[11px] shadow-sm border border-slate-200">
                                Trang {idx + 1}
                              </div>
                            </div>

                            <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLightbox(submissionImgs, idx, `Bài nộp - Trang ${idx + 1}`)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Xem
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenNewTab(imgUrl, `Bài nộp - Trang ${idx + 1}`)}
                                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Mở ảnh bài nộp trong thẻ mới"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Thẻ mới
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadImage(imgUrl, `Bai_nop_trang_${idx + 1}.png`)}
                                className="py-1.5 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Tải ảnh bài nộp về máy"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" /> Tải
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teacher Corrected Images */}
                  {correctedImgs.length > 0 && (
                    <div className="space-y-3 p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-700" />
                          Ảnh Bài Đã Được Giáo Viên Chấm Chữa ({correctedImgs.length} ảnh):
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              correctedImgs.forEach((url, idx) => {
                                setTimeout(() => handleOpenNewTab(url, `Ảnh bài chữa - Trang ${idx + 1}`), idx * 200);
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Mở tất cả ảnh bài chữa trong các thẻ mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-sky-400" /> Mở tất cả thẻ mới
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              correctedImgs.forEach((url, idx) => {
                                setTimeout(() => handleDownloadImage(url, `Bai_chua_trang_${idx + 1}.png`), idx * 300);
                              });
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải hàng loạt ảnh ({correctedImgs.length})
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        {correctedImgs.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-sm transition hover:border-emerald-600"
                          >
                            <div
                              className="relative w-full aspect-4/3 bg-slate-50 cursor-pointer flex items-center justify-center p-1 overflow-hidden"
                              onClick={() => openLightbox(correctedImgs, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                            >
                              <img
                                src={imgUrl}
                                alt={`Corrected ${idx + 1}`}
                                className="w-full h-full object-contain transition duration-200 hover:scale-[1.02]"
                              />
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-white/95 text-emerald-800 font-extrabold text-[11px] shadow-sm border border-emerald-200">
                                Trang chữa {idx + 1}
                              </div>
                            </div>

                            <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLightbox(correctedImgs, idx, `Ảnh bài chữa - Trang ${idx + 1}`)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Phóng to
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenNewTab(imgUrl, `Ảnh bài chữa - Trang ${idx + 1}`)}
                                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Mở ảnh trong thẻ mới để xem kích thước gốc"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Thẻ mới
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadImage(imgUrl, `Bai_chua_trang_${idx + 1}.png`)}
                                className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Tải ảnh bài chữa này về máy"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" /> Tải
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Wrong Questions */}
              {wrongList.length > 0 && (
                <section className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-slate-500" /> Các câu bạn làm sai ({wrongList.length})
                    </h4>
                    <span className="text-xs text-slate-500">Câu hỏi và đáp án đối chiếu</span>
                  </div>

                  <div className="space-y-3">
                    {wrongList.map((wrongLine, idx) => {
                      const item = parseWrongLineItem(wrongLine);
                      return (
                        <article key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <span className="font-bold text-slate-800">Câu sai #{idx + 1}</span>
                            <span className="text-xs text-slate-500">{item.title}</span>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Câu hỏi gốc</p>
                            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold text-slate-800 leading-relaxed">
                              {item.prompt || item.raw}
                            </div>
                          </div>

                          {(item.userAns || item.correctAns) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="border-l-2 border-slate-300 pl-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Bạn chọn / nhập</p>
                                <p className="text-sm font-semibold text-rose-700 leading-relaxed">
                                  {item.userAns || 'Không chọn / Để trống'}
                                </p>
                              </div>

                              <div className="border-l-2 border-slate-400 pl-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Đáp án đúng</p>
                                <p className="text-sm font-semibold text-emerald-700 leading-relaxed">
                                  {item.correctAns || '—'}
                                </p>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
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
                      const audioSrc = getAudioSrcFromObject(aud);
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
                          {audioSrc ? (
                            <audio controls src={audioSrc} className="w-full h-9" />
                          ) : (
                            <p className="text-xs text-rose-600 font-medium">Không thể tải file âm thanh ghi âm này.</p>
                          )}

                          {aud.teacherFeedbackUrl && (
                            <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg space-y-1.5">
                              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5 text-emerald-700" />
                                File chữa phát âm của giáo viên:
                              </span>
                              <audio
                                controls
                                src={getDriveAudioPlayerUrl(aud.teacherFeedbackUrl)}
                                className="w-full h-9"
                              />
                              <p className="text-[11px] text-emerald-800 italic">
                                Hãy nghe lại giọng mẫu của giáo viên và đọc theo.
                              </p>
                            </div>
                          )}

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
                      const rawUrl = link.substring(link.indexOf('http'));
                      const playableUrl = getDriveAudioPlayerUrl(link);

                      return (
                        <div key={idx} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950">
                              {link.split(':')[0] || `Ghi âm câu ${idx + 1}`}
                            </span>
                            {rawUrl && (
                              <a
                                href={rawUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline font-bold"
                              >
                                Mở link Google Drive <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* HTML5 Audio Player for Drive Audio */}
                          {playableUrl && (
                            <audio controls src={playableUrl} className="w-full h-9 rounded-lg border border-indigo-200" />
                          )}

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
            </>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          title={lightboxTitle}
        />
      )}
    </div>
  );
};
