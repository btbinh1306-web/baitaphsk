export interface HandwritingExercise {
  id: string;
  type: 'handwriting_submission';
  title: string;
  instruction?: string;
  referenceImages: string[];
  createdAt: string;
  level?: string;
  description?: string;
}

export interface HandwritingSubmission {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  lessonTopic?: string;
  studentId?: string;
  studentName: string;
  studentClass?: string;
  submissionImages: string[];
  status: 'not_submitted' | 'submitted' | 'graded';
  submittedAt?: string;
  correctedImages?: string[];
  teacherComment?: string;
  gradedAt?: string;
}
