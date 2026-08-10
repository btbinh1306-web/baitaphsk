export interface LessonMetadata {
  id?: string;
  title: string;
  level?: string;
  description?: string;
  [key: string]: unknown;
}

export type ExerciseType =
  | 'matching'
  | 'dictation'
  | 'paragraph_order'
  | 'picture_writing'
  | 'multiple_choice'
  | 'flashcard'
  | string;

export interface LessonItem {
  id: string;
  type: ExerciseType;
  data: Record<string, unknown>;
}

export interface LessonSection {
  id?: string;
  title?: string;
  items: LessonItem[];
}

export interface LessonData {
  version: string | number;
  lesson: LessonMetadata;
  sections: LessonSection[];
  [key: string]: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  parsedData?: LessonData;
}
