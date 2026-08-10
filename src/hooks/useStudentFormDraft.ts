import { useState, useEffect, useCallback } from 'react';

const DRAFT_KEY = 'hsk_student_exam_draft_v1';

export interface ExamFormDraft {
  studentName?: string;
  studentClass?: string;
  selectedExamId?: string;
  vocabUnlocked?: Record<string, boolean>;
  mcAnswers?: Record<string, number>;
  fillAnswers?: Record<string, string>;
  arrangeAnswers?: Record<string, string[]>;
  essayAnswers?: Record<string, string>;
  questionComments?: Record<string, string>;
  unlockedReference?: Record<string, boolean>;
  updatedAt?: number;
}

export function loadFormDraft(): ExamFormDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load student exam draft from localStorage:', e);
  }
  return null;
}

export function saveFormDraft(draft: ExamFormDraft): void {
  try {
    const dataToSave = {
      ...draft,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('Failed to save student exam draft to localStorage:', e);
  }
}

export function clearFormDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.warn('Failed to clear student exam draft from localStorage:', e);
  }
}

/**
 * Custom hook to manage student exam form progress persistence in localStorage.
 */
export function useStudentFormDraft(currentFormState: ExamFormDraft, isSubmitted: boolean) {
  useEffect(() => {
    // Do not save if already submitted
    if (isSubmitted) return;

    // Save current form state to localStorage
    const timeout = setTimeout(() => {
      saveFormDraft(currentFormState);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeout);
  }, [
    currentFormState.studentName,
    currentFormState.studentClass,
    currentFormState.selectedExamId,
    currentFormState.vocabUnlocked,
    currentFormState.mcAnswers,
    currentFormState.fillAnswers,
    currentFormState.arrangeAnswers,
    currentFormState.essayAnswers,
    currentFormState.questionComments,
    currentFormState.unlockedReference,
    isSubmitted
  ]);

  return {
    clearDraft: clearFormDraft,
  };
}
