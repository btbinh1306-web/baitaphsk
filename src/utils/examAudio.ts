import { ExamLesson, Question } from '../types';

/** All questions that expect an audio response from the student. */
export const getExamAudioQuestions = (exam: ExamLesson | undefined): Question[] => {
  const questions = [
    ...(exam?.speakingQuestions || []),
    ...(exam?.translationQuestions || []).filter((question) => question.translationType === 'vi_to_zh_audio')
  ];
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
};
