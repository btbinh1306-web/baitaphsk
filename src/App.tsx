import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { StudentExamForm } from './components/StudentExamForm';
import { TeacherPortal } from './components/TeacherPortal';
import { ResultLookup } from './components/ResultLookup';
import { GasSetupModal } from './components/GasSetupModal';
import { ExamLesson } from './types';
import { sanitizeExamSections } from './utils/lessonParser';
import {
  fetchServerCustomExams,
  fetchServerDeletedExamIds,
  saveServerCustomExam,
  deleteServerCustomExam
} from './services/apiService';

const CUSTOM_EXAMS_STORAGE_KEY = 'hsk_custom_exams_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('STUDENT');
  const [lookupSubmissionId, setLookupSubmissionId] = useState<string>('');
  const [customExams, setCustomExams] = useState<ExamLesson[]>([]);
  const [deletedExamIds, setDeletedExamIds] = useState<string[]>([]);

  // Load custom exams and deleted exam IDs from server API & localStorage on mount
  useEffect(() => {
    async function initData() {
      // 1. Try server first for sync across devices
      const serverExams = await fetchServerCustomExams();
      const serverDeleted = await fetchServerDeletedExamIds();

      let localExams: ExamLesson[] = [];
      let localDeleted: string[] = [];

      try {
        const saved = localStorage.getItem(CUSTOM_EXAMS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localExams = parsed.map((e) => sanitizeExamSections(e));
          }
        }
        const savedDeleted = localStorage.getItem('hsk_deleted_exam_ids');
        if (savedDeleted) {
          const parsedDel = JSON.parse(savedDeleted);
          if (Array.isArray(parsedDel)) {
            localDeleted = parsedDel;
          }
        }
      } catch (err) {
        console.error('Failed to parse localStorage:', err);
      }

      // Merge server + local exams (server takes precedence)
      const examMap = new Map<string, ExamLesson>();
      localExams.forEach((e) => examMap.set(e.id, e));
      serverExams.forEach((e) => examMap.set(e.id, sanitizeExamSections(e)));

      const mergedExams = Array.from(examMap.values());
      const mergedDeleted = Array.from(new Set([...serverDeleted, ...localDeleted]));

      setCustomExams(mergedExams);
      setDeletedExamIds(mergedDeleted);

      // Keep localStorage in sync
      try {
        localStorage.setItem(CUSTOM_EXAMS_STORAGE_KEY, JSON.stringify(mergedExams));
        localStorage.setItem('hsk_deleted_exam_ids', JSON.stringify(mergedDeleted));
      } catch (e) {}
    }

    initData();
  }, []);

  // Save custom exam handler
  const handleSaveCustomExam = async (rawExam: ExamLesson) => {
    const newExam = sanitizeExamSections(rawExam);

    // Save to server
    saveServerCustomExam(newExam);

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
        console.error('Failed to save custom exams locally:', err);
      }
      return updated;
    });

    // Remove from deleted list if re-saved
    setDeletedExamIds((prev) => {
      const updated = prev.filter((id) => id !== newExam.id);
      try {
        localStorage.setItem('hsk_deleted_exam_ids', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Delete custom exam handler
  const handleDeleteCustomExam = async (examId: string) => {
    deleteServerCustomExam(examId);

    setCustomExams((prev) => {
      const updated = prev.filter((e) => e.id !== examId);
      try {
        localStorage.setItem(CUSTOM_EXAMS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to delete custom exam locally:', err);
      }
      return updated;
    });

    setDeletedExamIds((prev) => {
      const updated = Array.from(new Set([...prev, examId]));
      try {
        localStorage.setItem('hsk_deleted_exam_ids', JSON.stringify(updated));
      } catch (err) {}
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
            deletedExamIds={deletedExamIds}
            onSuccessNavigateToResult={handleNavigateToResult}
          />
        )}

        {activeTab === 'TEACHER' && (
          <TeacherPortal
            customExams={customExams}
            deletedExamIds={deletedExamIds}
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
