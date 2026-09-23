import { LessonData, LessonSection } from './types/lesson';

export interface VocabItem {
  hanzi: string;
  pinyin: string;
  type?: string; // e.g. Danh từ, Động từ, Trợ từ...
  meaning: string;
  example?: string;
}

export interface Question {
  id: string;
  type:
    | 'mc'
    | 'fill'
    | 'arrange'
    | 'essay'
    | 'error_correction'
    | 'speaking'
    | 'speaking_record'
    | 'translation'
    | 'listening_mc'
    | 'listening_tf'
    | 'listening_multiple_choice'
    | 'listening_true_false'
    | 'listening_fill'
    | 'listening_fill_in_blank'
    | 'handwriting_submission';
  translationType?: 'vi_to_zh_audio' | 'vi_to_zh_text' | 'zh_to_vi_text';
  tier?: 'tier1' | 'tier2' | 'tier3'; // Cấp 1: Tri thức | Cấp 2: Bán giao tiếp | Cấp 3: Giao tiếp tự do
  prompt: string;
  instruction?: string; // for handwriting_submission
  referenceImages?: string[]; // for handwriting_submission
  pinyin?: string;
  options?: string[];
  optionImages?: Array<{ id: string; url: string; alt?: string }>;
  answer?: number | string; // index for mc
  wordChips?: string[]; // array of word chips for sentence arrangement
  acceptableAnswers?: string; // pipe-separated options, e.g. "6月13号|6月13日|六月十三号|六月十三日"
  wordBank?: string[]; // word bank choices for fill in blanks section
  suggestedAnswer?: string; // model answer unlocked when student inputs answer
  errorCorrection?: {
    sentenceIsCorrect: boolean;
  };
  explanation?: string;
  audioText?: string; // Hidden TTS script used when a listening audio file is not attached
  audioPromptUrl?: string;
  audioUrl?: string; // Attached audio file data/URL for listening questions
  imageUrl?: string; // Attached image file data/URL for questions
  items?: (string | Record<string, unknown>)[];
  questions?: Record<string, unknown>[];
  subQuestions?: Question[]; // Multiple questions sharing one listening/audio prompt
  // Structured teacher-review metadata for open-ended language production.
  taskGroup?: 'reading_aloud' | 'written_translation' | 'oral_translation' | 'self_introduction' | 'picture_speaking' | string;
  taskGroupTitle?: string;
  sourceLessons?: number[];
  knowledgeTargets?: string[];
  combinedKnowledgePoints?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced' | string;
  referenceAnswers?: string[];
  requiredElements?: string[];
  acceptedVariants?: string[];
  acceptedPatterns?: string[];
  targetElements?: string[];
  teacherReviewRequired?: boolean;
  grammarTargets?: string[];
  preparationSeconds?: number;
  responseSeconds?: number;
  hidePinyinByDefault?: boolean;
  rubric?: Array<{ id: string; label: string; maxScore: number }>;
  maxScore?: number;
  uploadFormats?: string[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  questions: Question[];
}

export interface ExamLesson {
  id: string;
  title: string;
  level: 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6' | 'Luyện nói';
  description: string;
  timeLimitEnabled?: boolean;
  timeLimitMinutes?: number;
  type?: string; // e.g. 'handwriting_submission' or undefined
  isHandwriting?: boolean;
  instruction?: string;
  referenceImages?: string[];
  vocabList?: VocabItem[];
  mcQuestions: Question[];
  fillQuestions?: Question[];
  arrangeQuestions?: Question[];
  readingPassages?: ReadingPassage[];
  listeningQuestions?: Question[]; // Danh sách bài tập nghe (nghe chọn đáp án, nghe đúng/sai)
  essayQuestions: Question[];
  speakingQuestions: Question[];
  translationQuestions?: Question[];
  handwritingQuestions?: Question[];
  sections?: LessonSection[];
  // Keeps the imported schema intact so the teacher editor can round-trip every field.
  sourceLessonData?: LessonData;
}

export interface AudioRecordItem {
  label: string;
  data: string; // base64 string
  mime: string;
  questionId?: string;
  taskGroup?: string;
  duration?: number;
  url?: string; // local blob URL for instant preview
  teacherFeedbackUrl?: string; // Shared URL of the teacher's pronunciation correction
  teacherFeedbackLabel?: string;
}

export interface SubmissionData {
  id: string;
  duplicateIds?: string[]; // IDs of older duplicate records merged into this row
  time: string;
  name: string;
  class: string;
  lesson: string;
  correct: number;
  done: number;
  total: number;
  percent: number;
  wrongCount: number;
  notDone: number;
  wrong: string; // JSON or formatted text of wrong details
  essays: string; // Essay answers formatted
  answerSnapshot?: string; // JSON snapshot of each question's answer/status for result review and PDF export
  audios?: AudioRecordItem[];
  driveLinks?: string; // Links returned or parsed
  speakScore?: string | number; // Overall exercise score entered by the teacher
  comment?: string; // Teacher's feedback
  status: 'Chờ chấm' | 'Đã chấm';
  // Handwriting submission fields
  isHandwriting?: boolean;
  exerciseId?: string;
  submissionImages?: string[];
  correctedImages?: string[];
  teacherComment?: string;
  handwritingStatus?: 'not_submitted' | 'submitted' | 'graded';
  submittedAt?: string;
  gradedAt?: string;
}

export type AnswerSnapshotStatus = 'correct' | 'wrong' | 'unanswered' | 'manual';

export interface AnswerSnapshotItem {
  id: string;
  section: string;
  number?: number;
  prompt: string;
  userAnswer?: string;
  correctAnswer?: string;
  status: AnswerSnapshotStatus;
  maxScore?: number;
  teacherScore?: string | number;
}

export * from './types/handwriting';

export interface GasConfig {
  sheetUrl: string;
  teacherPass: string;
}

export interface TeacherGradePayload {
  action: 'grade';
  pass: string;
  id: string;
  speakScore: string;
  comment: string;
}
