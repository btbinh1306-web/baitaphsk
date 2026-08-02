import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { StudentExamForm } from './components/StudentExamForm';
import { TeacherPortal } from './components/TeacherPortal';
import { ResultLookup } from './components/ResultLookup';
import { GasSetupModal } from './components/GasSetupModal';
import { ExamLesson } from './types';

const CUSTOM_EXAMS_STORAGE_KEY = 'hsk_custom_exams_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('STUDENT');
  const [lookupSubmissionId, setLookupSubmissionId] = useState<string>('');
  const [customExams, setCustomExams] = useState<ExamLesson[]>([]);

  // Load custom exams from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_EXAMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomExams(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load custom exams:', err);
    }
  }, []);

  // Save custom exam handler
  const handleSaveCustomExam = (newExam: ExamLesson) => {
    setCustomExams((prev) => {
      const idx = prev.findIndex((e) => e.id === newExam.id);
      let updated: ExamLesson[];
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = newExam;
      } else {
        updated = [newExam, ...prev];
      }
      try {
        localStorage.setItem(CUSTOM_EXAMS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save custom exams:', err);
      }
      return updated;
    });
  };

  // Delete custom exam handler
  const handleDeleteCustomExam = (examId: string) => {
    setCustomExams((prev) => {
      const updated = prev.filter((e) => e.id !== examId);
      try {
        localStorage.setItem(CUSTOM_EXAMS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to delete custom exam:', err);
      }
      return updated;
    });
  };

  const handleNavigateToResult = (submissionId: string) => {
    setLookupSubmissionId(submissionId);
    setActiveTab('LOOKUP');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'STUDENT' && (
          <StudentExamForm
            customExams={customExams}
            onSuccessNavigateToResult={handleNavigateToResult}
          />
        )}

        {activeTab === 'TEACHER' && (
          <TeacherPortal
            customExams={customExams}
            onSaveCustomExam={handleSaveCustomExam}
            onDeleteCustomExam={handleDeleteCustomExam}
          />
        )}

        {activeTab === 'LOOKUP' && (
          <ResultLookup initialSubmissionId={lookupSubmissionId} />
        )}

        {activeTab === 'SETUP' && <GasSetupModal />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-800 text-sm">
          Hệ Thống Bài Tập & Luyện Nói HSK
        </p>
        <p className="font-medium text-slate-500 text-xs">
          Học tiếng Trung cùng Thanh Bình + Thanh Tùng nhé
        </p>
      </footer>
    </div>
  );
}
