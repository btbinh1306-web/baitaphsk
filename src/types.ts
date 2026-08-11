import { LessonSection } from './types/lesson';

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
  answer?: number | string; // index for mc
  wordChips?: string[]; // array of word chips for sentence arrangement
  acceptableAnswers?: string; // pipe-separated options, e.g. "6月13号|6月13日|六月十三号|六月十三日"
  wordBank?: string[]; // word bank choices for fill in blanks section
  suggestedAnswer?: string; // model answer unlocked when student inputs answer
  explanation?: string;
  audioPromptUrl?: string;
  audioUrl?: string; // Attached audio file data/URL for listening questions
  imageUrl?: string; // Attached image file data/URL for questions
  items?: (string | Record<string, unknown>)[];
  questions?: Record<string, unknown>[];
  subQuestions?: Question[]; // Multiple questions sharing one listening/audio prompt
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
}

export interface AudioRecordItem {
  label: string;
  data: string; // base64 string
  mime: string;
  duration?: number;
  url?: string; // local blob URL for instant preview
  teacherFeedbackUrl?: string; // Shared URL of the teacher's pronunciation correction
  teacherFeedbackLabel?: string;
}

export interface SubmissionData {
  id: string;
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
