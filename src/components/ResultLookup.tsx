import React, { useState, useEffect } from 'react';
import { AnswerSnapshotItem, AudioRecordItem, ExamLesson, Question, SubmissionData } from '../types';
import { fetchResultById, cleanImageTagsFromText, getLocalSubmissions } from '../services/gasService';
import { getHandwritingSubmissions } from '../services/handwritingService';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import { getAudioLinkLabel, getAudioSrcFromObject, getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ResultExamReadOnly } from './ResultExamReadOnly';
import type { ReadOnlyExamSection } from './ResultExamReadOnly';
import { normalizeImageList } from '../utils/imageUtils';
import { getStructuredQuestionRows, isStructuredExerciseItem } from '../utils/structuredExercises';
import { buildExamCatalog } from '../utils/examCatalog';
import { getExamAudioQuestions } from '../utils/examAudio';
import { calculateHsk1TrialScore, formatScore, getHsk1TrialPart, getQuestionMaxScore, isExcludedFromOverallScore, isHsk1TrialExam, parseTeacherItemScores, TeacherItemScore } from '../utils/teacherScoring';
import { buildOrderedQuestionList, isObjectiveSnapshotItem, requiresTeacherReview } from '../utils/teacherQuestionOrder';
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
  customExams?: ExamLesson[];
}

type TeacherReviewStatus = 'Chưa chấm' | 'Đúng' | 'Sai' | 'Cần sửa';

interface PrintableItem extends AnswerSnapshotItem {
  legacyFallback?: boolean;
  options?: string[];
  subjective?: boolean;
  teacherReviewRequired?: boolean;
  teacherComment?: string;
  teacherCorrection?: boolean;
  teacherScore?: string | number;
  teacherItemScore?: number;
  teacherMaxScore?: number;
  teacherReviewStatus?: TeacherReviewStatus;
  optionImages?: string[];
  imageUrl?: string;
  audioUrl?: string;
  audioText?: string;
  subjectiveKind?: 'essay' | 'translation' | 'speaking';
  subjectiveIndex?: number;
  audioResponse?: boolean;
  studentAudioUrl?: string;
  teacherAudioUrl?: string;
  studentAudioLabel?: string;
}

interface PrintableSection {
  title: string;
  passage?: string;
  items: PrintableItem[];
}

const SUBJECTIVE_SECTION_PATTERN = /(tự luận|dịch|nói|ghi âm|viết|chép|朗读|口语|自我介绍|看图说话|写作|口译|笔译)/i;

const isSubjectiveQuestion = (question: PrintableItem): boolean => (
  Boolean(question.subjective) ||
  Boolean(question.subjectiveKind) ||
  Boolean(question.teacherReviewRequired) ||
  // Do not inspect the prompt here: a fill-in question can legitimately
  // contain notes such as "gần người nói" / "xa người nói".
  SUBJECTIVE_SECTION_PATTERN.test(question.section)
);

const shouldShowInReviewMode = (question: PrintableItem, result: SubmissionData): boolean => (
  question.status === 'wrong' ||
  question.status === 'unanswered' ||
  question.status === 'manual' ||
  isSubjectiveQuestion(question) ||
  Boolean(question.studentAudioUrl) ||
  Boolean(question.teacherComment) ||
  Boolean(question.teacherCorrection) ||
  question.teacherScore !== undefined ||
  Boolean(question.teacherReviewStatus) ||
  // Old submissions do not contain per-question status. Keep them visible
  // rather than pretending that an uncertain answer was correct.
  Boolean(question.legacyFallback && result.notDone > 0)
);

const safeText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const normalizedText = (value: unknown): string => safeText(value).trim().toLowerCase();

const normalizeAnswerForRegrade = (value: unknown): string => safeText(value)
  .toLowerCase()
  .replace(/^[a-f]\s*[.)。：:]\s*/i, '')
  .replace(/\s+/g, '')
  .trim();

const answersMatchForRegrade = (left: unknown, right: unknown): boolean => {
  const normalizedLeft = normalizeAnswerForRegrade(left);
  const normalizedRight = normalizeAnswerForRegrade(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

const answerMatchesAccepted = (answer: unknown, acceptedAnswers: unknown): boolean => {
  const normalizedAnswer = normalizeAnswerForRegrade(answer);
  if (!normalizedAnswer) return false;
  return safeText(acceptedAnswers)
    .split('|')
    .map(normalizeAnswerForRegrade)
    .filter(Boolean)
    .includes(normalizedAnswer);
};

const examMatchesLesson = (exam: Partial<ExamLesson> | undefined, lesson: unknown): boolean => {
  if (!exam) return false;

  const lessonText = normalizedText(lesson);
  const examId = normalizedText(exam.id);
  const examTitle = normalizedText(exam.title);
  if (!lessonText || !examTitle) return false;

  return (
    examId === lessonText ||
    examTitle === lessonText ||
    examTitle.includes(lessonText) ||
    lessonText.includes(examTitle)
  );
};

const stripTeacherCommentMetadata = (value: unknown): string => {
  const cleaned = cleanImageTagsFromText(safeText(value));
  if (!cleaned) return '';

  return cleaned
    .split(/\s*\|\s*|\r?\n/)
    .map((part) => part.trim())
    .filter((part) => (
      part &&
      !/^\[(?:Tự luận|Ghi âm)\s*(?:C|câu)?\s*\d+\]:/i.test(part) &&
      !/^\[Đánh giá\s+[^\]]+\]$/i.test(part) &&
      !/^\[[^\]:]+\]:\s*.+$/u.test(part)
    ))
    .join(' | ')
    .trim();
};

const parseAnswerSnapshot = (value?: string): AnswerSnapshotItem[] => {
  const text = safeText(value).trim();
  const match = text.match(/\[ANSWER_SNAPSHOT\]:\s*(\[[\s\S]*\])\s*$/);
  const jsonText = match?.[1] || (text.startsWith('[') ? text : '');
  if (!jsonText) return [];

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AnswerSnapshotItem => (
      item && typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.prompt === 'string' &&
      ['correct', 'wrong', 'unanswered', 'manual'].includes(item.status)
    ));
  } catch {
    return [];
  }
};

const removeAnswerSnapshot = (value: string): string =>
  value.replace(/\n?\[ANSWER_SNAPSHOT\]:\s*\[[\s\S]*\]\s*$/, '').trim();

export const ResultLookup: React.FC<ResultLookupProps> = ({ initialSubmissionId = '', customExams = [] }) => {
  const [submissionId, setSubmissionId] = useState(initialSubmissionId);
  const [result, setResult] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [resultViewMode, setResultViewMode] = useState<'review' | 'all'>('review');

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
    setIsPrintPreviewOpen(false);
    setResultViewMode('review');

    try {
      const res = await fetchResultById(searchId.trim());
      if (res.ok && res.row) {
        setResult(res.row);
      } else {
        setErrorMsg(res.error || 'Không tìm thấy kết quả cho Mã bài nộp này.');
      }
    } catch (error) {
      console.error('Không thể hiển thị kết quả tra cứu:', error);
      setErrorMsg('Không thể tải kết quả. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowserPrint = () => {
    document.body.classList.add('hsk-printing');
    const cleanup = () => document.body.classList.remove('hsk-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  const handlePrintExam = () => {
    if (!document.querySelector('.print-result-sheet')) return;
    setIsPrintPreviewOpen(true);
    // Let the preview render first. This also keeps the feature usable when the
    // embedded browser does not show the native print dialog immediately.
    window.setTimeout(handleBrowserPrint, 250);
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Helper: Parse only per-item teacher comments for the result details.
  const parseTeacherComment = (commentStr?: string) => {
    const text = safeText(commentStr);
    if (!text) {
      return {
        itemComments: {} as Record<string, string>,
        itemReviews: {} as Record<string, TeacherReviewStatus>
      };
    }

    const parts = text.split(' | ');
    const itemComments: Record<string, string> = {};
    const itemReviews: Record<string, TeacherReviewStatus> = {};

    const normalizeReviewStatus = (value: string): TeacherReviewStatus => {
      const normalized = value.trim().toLocaleLowerCase('vi');
      if (normalized === 'đúng') return 'Đúng';
      if (normalized === 'sai') return 'Sai';
      if (normalized === 'cần sửa') return 'Cần sửa';
      return 'Chưa chấm';
    };

    parts.forEach((part) => {
      const trimmed = part.trim();
      const reviewMatch = trimmed.match(/^\[Đánh giá\s+([^:]+):\s*(Chưa chấm|Đúng|Sai|Cần sửa)(?:,\s*điểm\s*(.*?))?\]$/i);
      if (reviewMatch) {
        itemReviews[reviewMatch[1].trim()] = normalizeReviewStatus(reviewMatch[2]);
        return;
      }

      const match = trimmed.match(/^\[(Tự luận|Ghi âm)\s*(?:C|câu)?\s*(\d+)\]:\s*(.*)$/i);
      if (match) {
        const type = match[1].toLowerCase().includes('tự luận') ? 'essay' : 'audio';
        const num = parseInt(match[2], 10) - 1; // 0-based index
        const text = match[3] ? match[3].trim() : '';
        if (text) {
          itemComments[`${type}_${num}`] = text;
        }
        return;
      }

      const stableMatch = trimmed.match(/^\[([^\]:]+)\]:\s*(.*)$/u);
      if (stableMatch && stableMatch[2].trim()) {
        itemComments[stableMatch[1].trim()] = stableMatch[2].trim();
      }
    });

    return { itemComments, itemReviews };
  };

  // Helper: Parse essay string into individual questions & answers
  const parseEssays = (essaysStr?: string) => {
    const text = removeAnswerSnapshot(safeText(essaysStr));
    if (!text || text === 'Không làm phần tự luận') return [];
    const chunks = text.split(/(?=【)/g).filter(Boolean);
    return chunks.map((chunk) => {
      const titleMatch = chunk.match(/【(.*?)】/);
      const prompt = titleMatch ? titleMatch[1] : 'Câu tự luận';
      const answer = chunk.replace(/【.*?】\n?/, '').replace(/^Bài làm:\s*/, '').trim();
      return { prompt, answer };
    });
  };

  // Helper: Parse wrong details list (can be separated by \n or |)
  const parseWrongDetails = (wrongStr?: string) => {
    const text = safeText(wrongStr);
    if (!text || text === 'Không có câu sai') return [];
    const rawLines = text.includes('\n') ? text.split('\n') : text.split(' | ');
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
      const lessonName = safeText(result?.lesson);
      const targetExam = SAMPLE_EXAMS.find(e =>
        examMatchesLesson(e, lessonName)
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

  const lessonLower = normalizedText(result?.lesson);
  const essaysLower = normalizedText(result?.essays);
  const resultId = normalizedText(result?.id);
  const resultName = normalizedText(result?.name);
  const resultSpeakScore =
    typeof result?.speakScore === 'string' || typeof result?.speakScore === 'number'
      ? result.speakScore
      : '';

  // Look up in local handwriting store & local submissions store for supplemental images if needed
  const hwListSubmissions = getHandwritingSubmissions();
  const localListSubmissions = getLocalSubmissions();

  const hwMatchForLookup = result
    ? hwListSubmissions.find(
        (h) =>
          normalizedText(h.id) === resultId ||
          (resultName &&
            normalizedText(h.studentName) === resultName &&
            (normalizedText(h.exerciseTitle).includes(lessonLower) || lessonLower.includes(normalizedText(h.exerciseTitle))))
      )
    : undefined;

  const localMatchForLookup = result
    ? localListSubmissions.find(
        (l) =>
          normalizedText(l.id) === resultId ||
          (resultName &&
            normalizedText(l.name) === resultName &&
            (normalizedText(l.lesson).includes(lessonLower) || lessonLower.includes(normalizedText(l.lesson))))
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

  const teacherCommentSources = [
    result?.teacherComment,
    result?.comment,
    hwMatchForLookup?.teacherComment,
    localMatchForLookup?.teacherComment,
    localMatchForLookup?.comment
  ];
  const teacherCommentText = teacherCommentSources
    .map(stripTeacherCommentMetadata)
    .find(Boolean) || '';
  const itemComments = teacherCommentSources.reduce(
    (comments, source) => {
      const parsed = parseTeacherComment(source).itemComments;
      return { ...comments, ...parsed };
    },
    {} as Record<string, string>
  );
  const itemReviews = teacherCommentSources.reduce(
    (reviews, source) => {
      const parsed = parseTeacherComment(source).itemReviews;
      return { ...reviews, ...parsed };
    },
    {} as Record<string, TeacherReviewStatus>
  );
  const teacherItemScores = teacherCommentSources.reduce(
    (scores, source) => ({ ...scores, ...parseTeacherItemScores(source) }),
    {} as Record<string, TeacherItemScore>
  );
  const essayList = parseEssays(result?.essays);

  // Filter essayList to remove auto-generated placeholder strings
  const essayListFiltered = essayList.filter((item) => {
    const cleaned = cleanImageTagsFromText(item.answer);
    return cleaned && cleaned.trim().length > 0;
  });

  const validCustomExams = Array.isArray(customExams)
    ? customExams.filter((exam): exam is ExamLesson => Boolean(exam && typeof exam === 'object'))
    : [];
  const examCatalog = buildExamCatalog(validCustomExams, SAMPLE_EXAMS);
  // Handwriting results use the original image-review screen below. Do not
  // let the read-only exam builder reinterpret them as a normal exam.
  const resultExam = result && !isHandwritingType
    ? examCatalog.find((exam) => examMatchesLesson(exam, result.lesson))
    : undefined;

  const wrongList = parseWrongDetails(result?.wrong);
  let regradedArrangeCount = 0;
  const visibleWrongList = wrongList.filter((wrongLine) => {
    const item = parseWrongLineItem(wrongLine);
    const arrangeNumberMatch = `${item.title} ${item.raw}`.match(/Sắp xếp(?:\s+Câu)?\s*(\d+)/i);
    const arrangeQuestionIndex = arrangeNumberMatch ? Number(arrangeNumberMatch[1]) - 1 : -1;
    const arrangeQuestion = resultExam?.arrangeQuestions?.[arrangeQuestionIndex];

    if (!arrangeQuestion || !item.userAns || !arrangeQuestion.acceptableAnswers) return true;

    const normalizedUserAnswer = item.userAns.trim().replace(/\s+/g, '');
    const acceptedAnswers = arrangeQuestion.acceptableAnswers
      .split('|')
      .map((answer) => answer.trim().replace(/\s+/g, ''))
      .filter(Boolean);

    if (acceptedAnswers.includes(normalizedUserAnswer)) {
      regradedArrangeCount++;
      return false;
    }

    return true;
  });

  const answerSnapshot = parseAnswerSnapshot(result?.answerSnapshot || result?.essays);
  const snapshotById = new Map(answerSnapshot.map((item) => [item.id, item]));
  const resultOrderedQuestions = buildOrderedQuestionList(resultExam);
  const resultQuestionById = new Map(resultOrderedQuestions.map((item) => [item.questionId, item]));
  const resultQuestionByPrompt = new Map(resultOrderedQuestions.map((item) => [normalizedText(item.question.prompt), item]));
  const legacyWrongItems = visibleWrongList.map(parseWrongLineItem);

  const formatQuestionAnswer = (question: Question, answer: unknown): string => {
    if (answer === undefined || answer === null || answer === '') {
      return question.acceptableAnswers?.split('|')[0]?.trim() || '';
    }
    if (typeof answer === 'number' && question.options) {
      return question.options[answer] || `Đáp án ${String.fromCharCode(65 + answer)}`;
    }
    return String(answer);
  };

  const findLegacyWrong = (prompt: string) => {
    const normalizedPrompt = normalizedText(prompt);
    return legacyWrongItems.find((item) => {
      const normalizedWrongPrompt = normalizedText(item.prompt);
      return normalizedPrompt && normalizedWrongPrompt && (
        normalizedPrompt === normalizedWrongPrompt ||
        normalizedPrompt.includes(normalizedWrongPrompt) ||
        normalizedWrongPrompt.includes(normalizedPrompt)
      );
    });
  };

  const makePrintableItem = (
    id: string,
    section: string,
    prompt: string,
    correctAnswer: string,
    number?: number,
    options: string[] = [],
    media: Pick<PrintableItem, 'optionImages' | 'imageUrl' | 'audioUrl' | 'audioText' | 'subjectiveKind' | 'subjectiveIndex' | 'audioResponse' | 'studentAudioUrl' | 'teacherAudioUrl' | 'studentAudioLabel' | 'teacherMaxScore'> = {}
  ): PrintableItem => {
    const sourceQuestion = resultQuestionById.get(id) || resultQuestionByPrompt.get(normalizedText(prompt));
    const teacherReviewRequired = sourceQuestion
      ? requiresTeacherReview(sourceQuestion.question)
      : undefined;
    const saved = snapshotById.get(id) || snapshotById.get(prompt);
    const legacyWrong = findLegacyWrong(prompt);
    if (saved) {
      const savedItem = {
        ...saved,
        section,
        number,
        prompt,
        options,
        ...media,
        teacherReviewRequired: teacherReviewRequired ?? (saved as PrintableItem).teacherReviewRequired
      };
      const subjective = Boolean(teacherReviewRequired) || Boolean(media.subjectiveKind) || isSubjectiveQuestion(savedItem);

      // Recompute every objective item from the saved response and the
      // current answer key. Older submissions can contain a stale status even
      // when the answer key itself did not change.
      if (!subjective && correctAnswer) {
        const userAnswer = safeText(savedItem.userAnswer).trim();
        return {
          ...savedItem,
          correctAnswer,
          status: !userAnswer
            ? 'unanswered'
            : (answerMatchesAccepted(userAnswer, correctAnswer) ? 'correct' : 'wrong')
        };
      }

      return { ...savedItem, correctAnswer };
    }

    const legacyAnswerChanged = Boolean(
      legacyWrong?.correctAns && correctAnswer &&
      !answersMatchForRegrade(legacyWrong.correctAns, correctAnswer)
    );
    const legacyUserAnswer = legacyWrong?.userAns || '';

    return {
      id,
      section,
      number,
      prompt,
      userAnswer: legacyUserAnswer,
      correctAnswer,
      teacherReviewRequired,
      status: legacyWrong
        ? (legacyAnswerChanged && answerMatchesAccepted(legacyUserAnswer, correctAnswer) ? 'correct' : 'wrong')
        : (media.subjectiveKind || teacherReviewRequired
          ? 'manual'
          : !resultExam
            ? (result?.notDone ? 'unanswered' : 'correct')
            : 'unanswered'),
      legacyFallback: true,
      options,
      ...media
    };
  };

  const driveAudioLinks = safeText(result?.driveLinks).split('\n').map((link) => link.trim()).filter(Boolean);
  const audioLabelMatchesQuestion = (label: string | undefined, question: Question): boolean => {
    const normalizedLabel = normalizedText(label);
    const normalizedPrompt = normalizedText(question.prompt);
    const normalizedQuestionId = normalizedText(question.id);
    return Boolean(normalizedLabel && (
      (normalizedPrompt && (
        normalizedLabel.includes(normalizedPrompt) || normalizedPrompt.includes(normalizedLabel)
      )) ||
      (normalizedQuestionId && normalizedLabel.includes(normalizedQuestionId))
    ));
  };

  const findAudioRecordsByQuestion = (question: Question, index: number): AudioRecordItem[] => {
    const audios = result?.audios || [];
    const matchingAudios = audios.filter((candidate) => (
      candidate.questionId === question.id || audioLabelMatchesQuestion(candidate.label, question)
    ));
    if (matchingAudios.length > 0) return matchingAudios;

    // Keep positional matching only for legacy audio records without any
    // identifying metadata; labelled teacher feedback must not be shifted.
    return audios[index] && !audios[index].questionId && !audios[index].label ? [audios[index]] : [];
  };

  const findDriveAudioLink = (question: Question, index: number): string => {
    const labelledLink = driveAudioLinks.find((link) => audioLabelMatchesQuestion(getAudioLinkLabel(link), question));
    return labelledLink || driveAudioLinks[index] || '';
  };

  const getSpeakingAudio = (question: Question, index: number): Pick<PrintableItem, 'studentAudioUrl' | 'teacherAudioUrl' | 'studentAudioLabel'> => {
    const audios = findAudioRecordsByQuestion(question, index);
    const driveAudioLink = findDriveAudioLink(question, index);
    const driveAudioUrl = driveAudioLink ? getDriveAudioPlayerUrl(driveAudioLink) : '';
    const studentAudioUrl = audios.map((audio) => getAudioSrcFromObject(audio)).find(Boolean) || driveAudioUrl;
    const teacherFeedbackUrl = audios.map((audio) => audio.teacherFeedbackUrl).find(Boolean);

    return {
      studentAudioUrl: studentAudioUrl || undefined,
      teacherAudioUrl: teacherFeedbackUrl ? getDriveAudioPlayerUrl(teacherFeedbackUrl) : undefined,
      studentAudioLabel: audios.find((audio) => audio.label)?.label || `Phần nói C${index + 1}`
    };
  };

  const printableSections: PrintableSection[] = [];
  const addPrintableSection = (section: PrintableSection) => {
    if (section.items.length > 0) printableSections.push(section);
  };

  if (resultExam && !isHandwritingType) {
    addPrintableSection({
      title: 'Trắc nghiệm',
      items: (resultExam.mcQuestions || []).map((question, index) => makePrintableItem(
        question.id,
        'Trắc nghiệm',
        question.prompt,
        formatQuestionAnswer(question, question.answer),
        index + 1,
        question.options || [],
        { imageUrl: question.imageUrl, audioUrl: question.audioUrl, audioText: question.audioText }
      ))
    });

    addPrintableSection({
      title: 'Điền từ',
      items: (resultExam.fillQuestions || []).map((question, index) => makePrintableItem(
        question.id,
        'Điền từ',
        question.prompt,
        question.acceptableAnswers || formatQuestionAnswer(question, question.answer),
        index + 1,
        question.wordBank || [],
        { imageUrl: question.imageUrl, audioUrl: question.audioUrl, audioText: question.audioText }
      ))
    });

    addPrintableSection({
      title: 'Sắp xếp câu',
      items: (resultExam.arrangeQuestions || []).map((question, index) => makePrintableItem(
        question.id,
        'Sắp xếp câu',
        question.prompt,
        question.acceptableAnswers?.split('|')[0]?.trim() || '',
        index + 1,
        question.wordChips || [],
        { imageUrl: question.imageUrl, audioUrl: question.audioUrl, audioText: question.audioText }
      ))
    });

    (resultExam.readingPassages || []).forEach((passage) => {
      addPrintableSection({
        title: `Đọc hiểu · ${passage.title}`,
        passage: passage.content,
        items: passage.questions.map((question, index) => makePrintableItem(
          question.id,
          `Đọc hiểu · ${passage.title}`,
          question.prompt,
          formatQuestionAnswer(question, question.answer),
          index + 1,
          question.options || [],
          {
            imageUrl: question.imageUrl,
            audioUrl: question.audioUrl,
            audioText: question.audioText,
            subjectiveKind: question.options && question.options.length > 0 ? undefined : 'essay',
            teacherMaxScore: question.options && question.options.length > 0 || isExcludedFromOverallScore(question)
              ? undefined
              : getQuestionMaxScore(question)
          }
        ))
      });
    });

    addPrintableSection({
      title: 'Bài nghe',
      items: (resultExam.listeningQuestions || []).flatMap((question) => (
        question.subQuestions?.length ? question.subQuestions : [question]
      )).map((question, index) => makePrintableItem(
        question.id,
        'Bài nghe',
        question.prompt,
        formatQuestionAnswer(question, question.answer),
        index + 1,
        question.options || [],
        {
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl || question.audioPromptUrl,
          audioText: question.audioText
        }
      ))
    });

    (resultExam.sections || []).forEach((section) => {
      const structuredItems: PrintableItem[] = [];
      section.items.forEach((item) => {
        if (isStructuredExerciseItem(item)) {
          getStructuredQuestionRows(item).forEach((row, index) => {
            const correctOption = row.options.find((option) => option.id === row.correctAnswer);
            structuredItems.push(makePrintableItem(
              row.key,
              section.title || 'Bài tập',
              row.prompt,
              correctOption ? `${correctOption.id}. ${correctOption.text}` : row.correctAnswer,
              row.number || index + 1,
              row.options.map((option) => `${option.id}. ${option.text}`),
              {
                optionImages: row.options.map((option) => option.image),
                audioUrl: row.audio || row.questionAudio,
                audioText: row.transcript
              }
            ));
          });
          return;
        }

        const prompt = typeof item.data.prompt === 'string'
          ? item.data.prompt
          : (typeof item.data.title === 'string' ? item.data.title : item.id);
        const correctAnswer = typeof item.data.correctAnswer === 'string'
          ? item.data.correctAnswer
          : (typeof item.data.answer === 'string' ? item.data.answer : '');
        structuredItems.push(makePrintableItem(
          item.id,
          section.title || 'Bài tập',
          prompt,
          correctAnswer,
          structuredItems.length + 1
        ));
      });

      addPrintableSection({ title: section.title || 'Bài tập', items: structuredItems });
    });

    const subjectiveQuestionEntries: Array<{
      question: Question;
      subjectiveKind: NonNullable<PrintableItem['subjectiveKind']>;
      subjectiveIndex: number;
      audioResponse: boolean;
    }> = [
      ...(resultExam.essayQuestions || []).map((question, index) => ({ question, subjectiveKind: 'essay' as const, subjectiveIndex: index, audioResponse: false })),
      ...(resultExam.translationQuestions || []).map((question, index) => ({
        question,
        subjectiveKind: 'translation' as const,
        subjectiveIndex: (resultExam.essayQuestions || []).length + index,
        audioResponse: question.translationType === 'vi_to_zh_audio'
      })),
      ...(resultExam.speakingQuestions || []).map((question, index) => ({ question, subjectiveKind: 'speaking' as const, subjectiveIndex: index, audioResponse: true }))
    ];

    addPrintableSection({
      title: 'Tự luận / Dịch / Nói',
      items: subjectiveQuestionEntries.map(({ question, subjectiveKind, subjectiveIndex, audioResponse }, index) => makePrintableItem(
        question.id,
        question.taskGroupTitle || 'Tự luận / Dịch / Nói',
        question.prompt,
        question.referenceAnswers?.[0] || question.suggestedAnswer || question.acceptableAnswers || '',
        index + 1,
        [],
        {
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl || question.audioPromptUrl,
          audioText: question.audioText,
          subjectiveKind,
          subjectiveIndex,
          audioResponse,
          teacherMaxScore: isExcludedFromOverallScore(question) ? undefined : getQuestionMaxScore(question),
          ...(audioResponse ? getSpeakingAudio(question, subjectiveIndex) : {})
        }
      ))
    });
  } else if (!isHandwritingType && answerSnapshot.length > 0) {
    const grouped = new Map<string, PrintableItem[]>();
    answerSnapshot.forEach((item) => {
      const items = grouped.get(item.section) || [];
      items.push(item);
      grouped.set(item.section, items);
    });
    grouped.forEach((items, title) => addPrintableSection({ title, items }));
  }

  const resultSections = printableSections.map((section) => ({
    ...section,
    items: section.items.map((item, index) => {
      const zeroBasedIndex = (item.number || index + 1) - 1;
      const sectionText = `${section.title} ${item.section}`;
      const audioItem = item.subjectiveKind === 'speaking' || /ghi âm|口语|口译/i.test(sectionText);
      const subjective = isSubjectiveQuestion(item) || /tự luận|dịch|viết|nói|ghi âm/i.test(sectionText);
      const feedbackIndex = item.subjectiveIndex ?? zeroBasedIndex;
      const teacherComment = item.teacherComment || itemComments[item.id] || itemComments[`${audioItem ? 'audio' : 'essay'}_${feedbackIndex}`];
      const teacherReview = itemReviews[item.id];
      const teacherItemScore = teacherItemScores[item.id];

      return {
        ...item,
        subjective,
        teacherComment,
        teacherCorrection: Boolean(subjective && correctedImgs.length > 0),
        teacherScore: subjective && resultSpeakScore !== '' ? resultSpeakScore : undefined,
        teacherItemScore: teacherItemScore?.score,
        teacherMaxScore: item.teacherMaxScore || item.maxScore || teacherItemScore?.maxScore,
        teacherReviewStatus: teacherReview
      };
    })
  }));

  const reviewSections = resultSections
    .map((section) => ({
      ...section,
      items: result ? section.items.filter((item) => shouldShowInReviewMode(item, result)) : []
    }))
    .filter((section) => section.items.length > 0);

  const currentResultItems = resultSections.flatMap((section) => section.items);
  const trialScore = resultExam && isHsk1TrialExam(resultExam)
    ? (() => {
        const counts = currentResultItems.reduce((total, item) => {
          if (item.subjective) return total;
          const part = getHsk1TrialPart(`${item.section} ${item.id}`);
          if (!part) return total;
          total[part].total += 1;
          if (item.status === 'correct') total[part].correct += 1;
          return total;
        }, {
          listening: { correct: 0, total: 0 },
          reading: { correct: 0, total: 0 }
        });

        return counts.listening.total > 0 && counts.reading.total > 0
          ? calculateHsk1TrialScore(
              counts.listening.correct,
              counts.listening.total,
              counts.reading.correct,
              counts.reading.total
            )
          : null;
      })()
    : null;
  const hasPendingAnswerReview = Boolean(
    resultExam &&
    (resultExam.sections || []).some((section) => section.items.some((item) => (
      isStructuredExerciseItem(item) && getStructuredQuestionRows(item).some((row) => !row.correctAnswer)
    )))
  );
  const currentObjectiveItems = currentResultItems.filter((item) => !item.subjective);
  const getSavedObjectiveSnapshot = (item: PrintableItem): AnswerSnapshotItem | undefined => (
    snapshotById.get(item.id) || snapshotById.get(item.prompt)
  );
  const getCurrentResultItem = (snapshot: AnswerSnapshotItem): PrintableItem | undefined => (
    currentResultItems.find((item) => item.id === snapshot.id) ||
    currentResultItems.find((item) => normalizedText(item.prompt) === normalizedText(snapshot.prompt))
  );
  const currentObjectiveByPrompt = new Map(
    currentObjectiveItems.map((item) => [normalizedText(item.prompt), item])
  );
  const getCurrentObjectiveItem = (snapshot: AnswerSnapshotItem): PrintableItem | undefined => (
    currentObjectiveItems.find((item) => item.id === snapshot.id) ||
    currentObjectiveByPrompt.get(normalizedText(snapshot.prompt))
  );
  // A submission snapshot is the source of truth for how many auto-graded
  // questions that particular exam actually contained. This prevents an old
  // stored total (for example 18) from replacing a 14- or 20-question paper.
  const objectiveSnapshotItems = answerSnapshot.filter((snapshot) => (
    getCurrentResultItem(snapshot)?.subjective
      ? false
      : resultExam
        ? isObjectiveSnapshotItem(snapshot, resultOrderedQuestions)
        : snapshot.status !== 'manual' && !SUBJECTIVE_SECTION_PATTERN.test(snapshot.section)
  ));
  const hasObjectiveSnapshot = objectiveSnapshotItems.length > 0;
  const getSnapshotStatus = (snapshot: AnswerSnapshotItem): AnswerSnapshotItem['status'] => (
    getCurrentObjectiveItem(snapshot)?.status || snapshot.status
  );
  // Count the current printable status so known answer corrections also
  // update the total score for older submissions with saved snapshots.
  const snapshotCorrect = hasObjectiveSnapshot
    ? objectiveSnapshotItems.filter((snapshot) => getSnapshotStatus(snapshot) === 'correct').length
    : currentObjectiveItems.filter((item) => (
      getSavedObjectiveSnapshot(item) && item.status === 'correct'
    )).length;
  const snapshotWrong = hasObjectiveSnapshot
    ? objectiveSnapshotItems.filter((snapshot) => getSnapshotStatus(snapshot) === 'wrong').length
    : currentObjectiveItems.filter((item) => (
      getSavedObjectiveSnapshot(item) && item.status === 'wrong'
    )).length;
  const snapshotNotDone = Math.max(
    0,
    (hasObjectiveSnapshot ? objectiveSnapshotItems.length : currentObjectiveItems.length) - snapshotCorrect - snapshotWrong
  );
  // The submission snapshot and current answer key are authoritative. A
  // missing answer can only be unanswered, never correct.
  const shouldRebuildStoredMetrics = hasObjectiveSnapshot;
  const displayTotal = hasObjectiveSnapshot
    ? objectiveSnapshotItems.length
    : resultExam && currentObjectiveItems.length > 0
      ? currentObjectiveItems.length
      : (result?.total || 0);
  const unreliableStoredMetrics = Boolean(
    resultExam &&
    !hasObjectiveSnapshot &&
    (result?.total || 0) !== displayTotal
  );
  const regradedCorrectCount = currentResultItems.filter((item) => {
    if (isSubjectiveQuestion(item) || item.status !== 'correct') return false;
    const saved = snapshotById.get(item.id) || snapshotById.get(item.prompt);
    return saved?.status === 'wrong';
  }).length;
  const regradedWrongCount = currentResultItems.filter((item) => {
    if (isSubjectiveQuestion(item) || item.status !== 'wrong') return false;
    const saved = snapshotById.get(item.id) || snapshotById.get(item.prompt);
    return saved?.status === 'correct';
  }).length;
  const displayCorrect = result
    ? (shouldRebuildStoredMetrics
        ? snapshotCorrect
        : unreliableStoredMetrics
          ? 0
        : result.correct + regradedArrangeCount + regradedCorrectCount - regradedWrongCount)
    : 0;
  const displayWrongCount = result
    ? (shouldRebuildStoredMetrics
        ? snapshotWrong
        : unreliableStoredMetrics
          ? 0
        : Math.max(0, result.wrongCount - regradedArrangeCount - regradedCorrectCount + regradedWrongCount))
    : 0;
  const displayNotDone = shouldRebuildStoredMetrics
    ? snapshotNotDone
    : unreliableStoredMetrics
      ? displayTotal
      : (result?.notDone || 0);
  const displayPercent = result
    ? (displayTotal > 0
        ? Math.round((displayCorrect / displayTotal) * 100)
        : (result.percent <= 1 && result.percent > 0 ? Math.round(result.percent * 100) : result.percent))
    : 0;
  const displayPercentLabel = hasPendingAnswerReview
    ? 'Chờ duyệt'
    : unreliableStoredMetrics
      ? 'Cần kiểm tra'
      : `${displayPercent}%`;
  const useTrialScore = Boolean(trialScore);
  const useTeacherScore = Boolean(resultExam && !isHandwritingType && !useTrialScore);
  const overallMaxScore = trialScore?.maxScore || 0;
  const overallScore = trialScore?.totalScore || 0;
  const overallPercent = trialScore ? Math.round((overallScore / overallMaxScore) * 100) : 0;
  const displayWrongList = visibleWrongList.filter((wrongLine) => {
    const wrongItem = parseWrongLineItem(wrongLine);
    const wrongPrompt = normalizedText(wrongItem.prompt);
    const currentItem = currentResultItems.find((item) => {
      const currentPrompt = normalizedText(item.prompt);
      return wrongPrompt && currentPrompt && (
        wrongPrompt === currentPrompt ||
        wrongPrompt.includes(currentPrompt) ||
        currentPrompt.includes(wrongPrompt)
      );
    });
    return !currentItem || currentItem.status !== 'correct';
  });

  const recordingResultItems = resultSections
    .flatMap((section) => section.items)
    .filter((item) => item.audioResponse);
  const getRecordedQuestionNumber = (item: PrintableItem, fallbackIndex: number): number => {
    const labelNumber = item.studentAudioLabel?.match(/(?:câu|question)\s*(\d+)/i)?.[1];
    return labelNumber ? Number(labelNumber) : (item.number || fallbackIndex + 1);
  };
  const recordedAudioItems = recordingResultItems
    .filter((item) => (
    Boolean(item.studentAudioUrl) || Boolean(item.teacherAudioUrl)
    ))
    .sort((left, right) => getRecordedQuestionNumber(left, 0) - getRecordedQuestionNumber(right, 0));
  const recordedAudioItemIds = new Set(recordedAudioItems.map((item) => item.id));
  const getSpeakingResultItem = (questionId: string | undefined, label: string | undefined, index: number) => (
    recordingResultItems.find((item) => (
      (questionId && item.id === questionId) ||
      (label && (item.studentAudioLabel === label || label.includes(item.prompt)))
    )) || recordingResultItems[index]
  );
  const resultAudioQuestionIds = new Set(getExamAudioQuestions(resultExam).map((question) => question.id));
  const resultAudioQuestionItems = resultSections
    .flatMap((section) => section.items)
    .filter((item) => resultAudioQuestionIds.has(item.id));
  const getRecordedAudioForResultItem = (item: PrintableItem) => result?.audios?.find((audio) => (
    audio.questionId === item.id ||
    Boolean(audio.label && item.prompt && audio.label.includes(item.prompt))
  ));
  const missingResultAudioItems = resultAudioQuestionItems.filter((item) => (
    !item.studentAudioUrl && !getRecordedAudioForResultItem(item)
  ));
  const findResultItemForPrompt = (prompt: string): PrintableItem | undefined => {
    const normalizedPrompt = normalizedText(prompt);
    return resultSections
      .flatMap((section) => section.items)
      .find((item) => {
        const candidatePrompt = normalizedText(item.prompt);
        return Boolean(normalizedPrompt && candidatePrompt && (
          normalizedPrompt === candidatePrompt ||
          normalizedPrompt.includes(candidatePrompt) ||
          candidatePrompt.includes(normalizedPrompt)
        ));
      });
  };
  const essayListForReview = essayList.filter((item) => {
    const resultItem = findResultItemForPrompt(item.prompt);
    return !resultItem?.audioResponse && normalizedText(item.answer) !== 'đã ghi âm';
  });
  const renderTeacherReview = (item?: PrintableItem) => item && (item.teacherReviewStatus || item.teacherMaxScore) ? (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
      {item.teacherReviewStatus && (
        <p><span className="font-bold">Đánh giá câu: </span>{item.teacherReviewStatus}</p>
      )}
      {item.teacherMaxScore && (
        <p>
          <span className="font-bold">Điểm câu: </span>
          {item.teacherItemScore !== undefined ? `${item.teacherItemScore}/${item.teacherMaxScore}` : `Chưa chấm/${item.teacherMaxScore}`}
        </p>
      )}
    </div>
  ) : null;
  const allQuestionCount = resultSections.reduce((count, section) => count + section.items.length, 0);
  const reviewQuestionCount = reviewSections.reduce((count, section) => count + section.items.length, 0);

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
        <div className="screen-result bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 animate-in fade-in duration-200">
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

            <div className="flex flex-col items-end gap-2">
              {result.status === 'Đã chấm' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã được giáo viên chấm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" /> Đã nộp - Chờ giáo viên chấm
                </span>
              )}
              {resultExam && !isHandwritingType && (
                <button
                  type="button"
                  onClick={handlePrintExam}
                  className="no-print inline-flex items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-800"
                  title="Mở hộp thoại in để lưu toàn bộ đề và kết quả dưới dạng PDF"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất PDF toàn bộ đề
                </button>
              )}
            </div>
          </div>

          {teacherCommentText && (
            <section className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-1.5">
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" /> Nhận xét của giáo viên
              </h4>
              <p className="text-sm text-amber-950 whitespace-pre-wrap leading-relaxed">
                {teacherCommentText}
              </p>
            </section>
          )}

          {!isHandwritingType && resultSections.length > 0 && (
            <div className="no-print flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Chế độ xem kết quả">
              <button
                type="button"
                role="tab"
                aria-selected={resultViewMode === 'review'}
                onClick={() => setResultViewMode('review')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  resultViewMode === 'review'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Bài cần xem lại ({reviewQuestionCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultViewMode === 'all'}
                onClick={() => setResultViewMode('all')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  resultViewMode === 'all'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Xem toàn bộ đề ({allQuestionCount})
              </button>
            </div>
          )}

          {!isHandwritingType && resultSections.length > 0 && resultViewMode === 'all' ? (
            <ResultExamReadOnly
              sections={resultSections as ReadOnlyExamSection[]}
              structuredSections={resultExam?.sections}
            />
          ) : (
            <>

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
                      {resultSpeakScore
                        ? resultSpeakScore
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
                        const teacherItemComment = itemComments[findResultItemForPrompt(item.prompt)?.id || ''] || itemComments[`essay_${idx}`];
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
                    <span className="text-xs font-semibold text-slate-500 block">
                      {useTrialScore ? 'Điểm đề thi thử HSK 1 (3.0)' : 'Điểm Phần Trắc Nghiệm'}
                    </span>
                    <span className="text-2xl font-bold text-slate-800">
                      {useTrialScore ? `${formatScore(overallScore)}/200` : displayPercentLabel}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {useTrialScore
                        ? `Nghe ${formatScore(trialScore.listeningScore)}/100 · Đọc ${formatScore(trialScore.readingScore)}/100`
                        : hasPendingAnswerReview
                          ? 'Đáp án đang chờ giáo viên duyệt'
                          : `Đúng ${displayCorrect}/${displayTotal} câu`}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {unreliableStoredMetrics
                        ? 'Không đủ dữ liệu cũ để xác định số câu đã làm/bỏ trống'
                        : `Đã làm ${Math.max(0, displayTotal - displayNotDone)}/${displayTotal} · Bỏ trống ${displayNotDone}`}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                    {useTrialScore ? `${overallPercent}%` : hasPendingAnswerReview ? '?' : `${displayPercent}%`}
                  </div>
                </div>

                {/* Overall Exercise Score Card */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 block">Điểm tổng hợp</span>
                    <span className="text-2xl font-bold text-indigo-900">
                      {useTrialScore
                        ? `${formatScore(overallScore)}/200`
                        : (resultSpeakScore || 'Chờ giáo viên chấm')}
                    </span>
                    <span className="text-xs text-indigo-700 block font-medium">
                      {useTrialScore
                        ? `Nghe ${formatScore(trialScore.listeningScore)}/100 · Đọc ${formatScore(trialScore.readingScore)}/100 · Đúng ${displayCorrect}/${displayTotal} câu`
                        : 'Điểm do giáo viên tự nhập'}
                    </span>
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
              {displayWrongList.length > 0 && (
                <section className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-slate-500" /> Các câu bạn làm sai ({displayWrongCount})
                    </h4>
                    <span className="text-xs text-slate-500">Câu hỏi và đáp án đối chiếu</span>
                  </div>

                  <div className="space-y-3">
                    {displayWrongList.map((wrongLine, idx) => {
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
              {essayListForReview.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" /> Chi Tiết Bài Làm Tự Luận Của Bạn:
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {essayListForReview.map((item, idx) => {
                      const reviewItem = findResultItemForPrompt(item.prompt);
                      const teacherItemComment = itemComments[reviewItem?.id || ''] || itemComments[`essay_${idx}`];

                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                          {/* Question Prompt */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
                            <span className="text-xs font-bold text-slate-800">
                              Câu {idx + 1}: {item.prompt}
                            </span>
                          </div>

                          {renderTeacherReview(reviewItem)}

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

                {recordedAudioItems.length > 0 && (
                  <div className="space-y-4">
                    {recordedAudioItems.map((item, idx) => {
                      const teacherItemComment = item.teacherComment || itemComments[item.id] || itemComments[`audio_${item.subjectiveIndex ?? idx}`];
                      const questionNumber = getRecordedQuestionNumber(item, idx);

                      return (
                        <article key={`recorded-speaking-${item.id}`} className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-2xs space-y-3">
                          <div className="border-b border-indigo-100 pb-2">
                            <p className="text-sm font-bold leading-relaxed text-indigo-950">
                              Câu {questionNumber}: {item.prompt}
                            </p>
                          </div>

                          {renderTeacherReview(item)}

                          {item.imageUrl && (
                            <img
                              src={getDriveMediaPlayerUrl(item.imageUrl)}
                              alt={`Hình minh họa câu nói ${questionNumber}`}
                              className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
                            />
                          )}

                          <div className="rounded-xl border border-indigo-200 bg-white p-3 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Bài làm của bạn:
                            </span>
                            {item.studentAudioUrl ? (
                              <audio controls preload="metadata" src={item.studentAudioUrl} className="h-9 w-full" />
                            ) : (
                              <p className="text-sm italic text-slate-500">(Chưa ghi âm)</p>
                            )}
                          </div>

                          {item.teacherAudioUrl && (
                            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
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

                          {teacherItemComment ? (
                            <div className="rounded-lg border-2 border-indigo-300 bg-indigo-100/80 p-3 text-xs text-indigo-950 space-y-1">
                              <span className="font-bold text-indigo-900">Nhận xét của Giáo viên cho bài ghi âm này:</span>
                              <p className="border-l-2 border-indigo-400 pl-4 font-semibold italic">"{teacherItemComment}"</p>
                            </div>
                          ) : (
                            <div className="text-[11px] italic text-slate-400">(Chưa có nhận xét riêng cho câu này)</div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {missingResultAudioItems.length > 0 && (
                  <div className="space-y-4">
                    {missingResultAudioItems.map((item, idx) => (
                      <div key={`unanswered-result-audio-${item.id}`} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span className="text-xs font-bold text-indigo-950">
                            {item.studentAudioLabel || `Phần nói C${item.number || idx + 1}`}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-relaxed text-slate-800">Đề bài: {item.prompt}</p>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-mono leading-relaxed text-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bài làm của bạn: </span>
                          (Chưa làm)
                        </div>
                        {renderTeacherReview(item)}
                        {item.imageUrl && (
                          <img
                            src={getDriveMediaPlayerUrl(item.imageUrl)}
                            alt={`Hình minh họa câu nói ${item.number || idx + 1}`}
                            className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
                          />
                        )}
                        {item.teacherComment ? (
                          <div className="p-3 bg-indigo-100/80 border-2 border-indigo-300 rounded-lg text-xs text-indigo-950 space-y-1">
                            <span className="font-bold text-indigo-900">Nhận xét của Giáo viên cho bài ghi âm này:</span>
                            <p className="font-semibold italic text-indigo-950 pl-4 border-l-2 border-indigo-400">"{item.teacherComment}"</p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">(Chưa có nhận xét riêng cho câu này)</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.audios && result.audios.length > 0 ? (
                  <div className="space-y-4">
                    {result.audios.map((aud, idx) => {
                      const audioSrc = getAudioSrcFromObject(aud);
                      const speakingItem = getSpeakingResultItem(aud.questionId, aud.label, idx);
                      const teacherItemComment = itemComments[speakingItem?.id || ''] || itemComments[`audio_${idx}`];

                      if (speakingItem && recordedAudioItemIds.has(speakingItem.id)) return null;

                      return (
                        <div key={idx} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                          {/* Audio Title / Question Prompt */}
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <span className="text-xs font-bold text-indigo-950">
                              {aud.label || `Ghi âm câu ${idx + 1}`}
                            </span>
                          </div>

                          {speakingItem?.prompt && (
                            <p className="text-sm font-semibold leading-relaxed text-slate-800">
                              Đề bài: {speakingItem.prompt}
                            </p>
                          )}

                          {renderTeacherReview(speakingItem)}

                          {speakingItem?.imageUrl && (
                            <img
                              src={getDriveMediaPlayerUrl(speakingItem.imageUrl)}
                              alt={`Hình minh họa câu nói ${idx + 1}`}
                              className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
                            />
                          )}

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
                      const rawUrl = link.substring(link.indexOf('http'));
                      const playableUrl = getDriveAudioPlayerUrl(link);
                      const speakingItem = getSpeakingResultItem(undefined, getAudioLinkLabel(link), idx);
                      const teacherItemComment = itemComments[speakingItem?.id || ''] || itemComments[`audio_${idx}`];

                      return (
                        <div key={idx} className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950">
                              {getAudioLinkLabel(link, `Ghi âm câu ${idx + 1}`)}
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

                          {speakingItem?.prompt && (
                            <p className="text-sm font-semibold leading-relaxed text-slate-800">
                              Đề bài: {speakingItem.prompt}
                            </p>
                          )}

                          {renderTeacherReview(speakingItem)}

                          {speakingItem?.imageUrl && (
                            <img
                              src={getDriveMediaPlayerUrl(speakingItem.imageUrl)}
                              alt={`Hình minh họa câu nói ${idx + 1}`}
                              className="max-h-72 w-full rounded-xl border border-indigo-200 bg-white object-contain"
                            />
                          )}

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
          </>
          )}
        </div>
      )}

      {result && resultExam && !isHandwritingType && (
        <div className={`print-result-sheet ${isPrintPreviewOpen ? 'print-preview-visible' : ''}`}>
          {isPrintPreviewOpen && (
            <div className="print-preview-toolbar no-print">
              <div>
                <strong>Bản xem trước toàn bộ đề</strong>
                <span> · Bấm “In / Lưu PDF”; nếu hộp thoại không hiện, dùng menu In của trình duyệt.</span>
              </div>
              <div className="print-preview-actions">
                <button type="button" onClick={handleBrowserPrint}>In / Lưu PDF</button>
                <button type="button" onClick={() => setIsPrintPreviewOpen(false)}>Quay lại</button>
              </div>
            </div>
          )}
          <header className="print-report-header">
            <h1>Phiếu xem lại bài làm HSK</h1>
            <p><strong>Học sinh:</strong> {result.name} · <strong>Lớp:</strong> {result.class}</p>
            <p><strong>Đề:</strong> {result.lesson} · <strong>Mã bài:</strong> {result.id}</p>
            <div className="print-report-score">
              <strong>
                {hasPendingAnswerReview
                  ? 'Kết quả: Chờ giáo viên duyệt đáp án'
                  : useTrialScore
                    ? `Kết quả: ${formatScore(overallScore)}/200 điểm (${overallPercent}%)`
                    : useTeacherScore
                    ? (resultSpeakScore
                      ? `Điểm giáo viên chấm: ${resultSpeakScore}`
                      : `Trắc nghiệm: ${displayCorrect}/${displayTotal} câu · Chờ GV nhập điểm tổng kết`)
                    : `Kết quả: ${displayCorrect}/${displayTotal} câu đúng (${displayPercent}%)`}
              </strong>
              <span>
                {hasPendingAnswerReview
                  ? 'Chưa có điểm tự động'
                  : useTrialScore
                    ? `Nghe: ${formatScore(trialScore.listeningScore)}/100 · Đọc: ${formatScore(trialScore.readingScore)}/100 · Sai: ${displayWrongCount} · Chưa làm: ${displayNotDone}`
                    : useTeacherScore
                    ? `Trắc nghiệm tự động: sai ${displayWrongCount} · chưa làm ${displayNotDone}`
                    : `Sai: ${displayWrongCount} · Chưa làm: ${displayNotDone}`}
              </span>
            </div>
          </header>

          {answerSnapshot.length === 0 && result.notDone > 0 && (
            <p className="print-report-note">
              Bài nộp này được tạo trước khi hệ thống lưu trạng thái từng câu. Các câu sai được đối chiếu chính xác; những câu còn lại có thể gồm câu đúng hoặc câu chưa làm.
            </p>
          )}

          {printableSections.map((section) => (
            <section key={section.title} className="print-report-section">
              <h2>{section.title}</h2>
              {section.passage && <p className="print-report-passage">{section.passage}</p>}
              <div className="print-report-questions">
                {section.items.map((item, index) => {
                  const statusLabel = item.status === 'correct'
                    ? '✓ ĐÚNG'
                    : item.status === 'wrong'
                      ? '✗ SAI'
                      : item.status === 'manual'
                        ? 'GV CHẤM'
                        : '— CHƯA LÀM';
                  const statusClass = item.status === 'correct'
                    ? 'print-status-correct'
                    : item.status === 'wrong'
                      ? 'print-status-wrong'
                      : item.status === 'manual'
                        ? 'print-status-manual'
                        : 'print-status-unanswered';

                  return (
                    <article key={`${item.id}-${index}`} className="print-report-question">
                      <div className="print-report-question-heading">
                        <strong>Câu {item.number || index + 1}: {item.prompt}</strong>
                        <span className={statusClass}>{statusLabel}</span>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <p className="print-report-options"><strong>Lựa chọn:</strong> {item.options.join(' · ')}</p>
                      )}
                      <p><strong>Học sinh trả lời:</strong> {item.userAnswer || 'Chưa có câu trả lời'}</p>
                      <p className="print-report-correct"><strong>Đáp án đúng:</strong> {item.correctAnswer || 'Giáo viên chấm / chưa có đáp án tự động'}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
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
