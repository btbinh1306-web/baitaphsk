import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, GraduationCap, UserRound } from 'lucide-react';
import { ExamLesson } from '../types';
import { useStudentExamCatalog } from '../hooks/useStudentExamCatalog';
import { clearFormDraft, loadFormDraft } from '../hooks/useStudentFormDraft';
import { getExamGroupLabel, groupExamsForSelection } from '../utils/examGrouping';
import { loadStudentProfile, saveStudentProfile, StudentProfile } from '../utils/studentProfile';

interface StudentProfilePageProps {
  onContinue: (profile: StudentProfile) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ onContinue }) => {
  const existingProfile = useMemo(() => {
    const savedProfile = loadStudentProfile();
    if (savedProfile) return savedProfile;

    const draft = loadFormDraft();
    if (draft?.studentName?.trim() && draft.studentClass?.trim()) {
      return { name: draft.studentName.trim(), className: draft.studentClass.trim() };
    }

    return null;
  }, []);
  const [isEditing, setIsEditing] = useState(!existingProfile);
  const [name, setName] = useState(existingProfile?.name || '');
  const [className, setClassName] = useState(existingProfile?.className || '');
  const [error, setError] = useState('');

  const continueWithProfile = (profile: StudentProfile) => {
    saveStudentProfile(profile);
    onContinue(profile);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const profile = { name: name.trim(), className: className.trim() };
    if (!profile.name || !profile.className) {
      setError('Vui lòng nhập đủ tên học sinh và lớp.');
      return;
    }

    setError('');
    clearFormDraft();
    continueWithProfile(profile);
  };

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-red-700">Cổng học sinh</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thông tin học sinh</h1>
        <p className="text-slate-600">Nhập một lần để bắt đầu làm bài và xem kết quả trên thiết bị này.</p>
      </div>

      {existingProfile && !isEditing ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="flex items-start gap-3">
            <UserRound className="w-5 h-5 text-red-700 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Tiếp tục với</p>
              <p className="text-xl font-bold text-slate-900">{existingProfile.name}</p>
              <p className="text-sm text-slate-600">{existingProfile.className}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => continueWithProfile(existingProfile)}
              className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-md"
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Đổi học sinh
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="student-name">
              Tên của bạn
            </label>
            <input
              id="student-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Nguyễn Phương Linh"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-red-600"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="student-class">
              Lớp
            </label>
            <input
              id="student-class"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Ví dụ: HSK1-01"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-red-600"
              autoComplete="organization"
              required
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-md"
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
            {existingProfile && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
};

interface StudentLessonPickerProps {
  customExams?: ExamLesson[];
  deletedExamIds?: string[];
  onSelectLesson: (lessonId: string) => void;
  onChangeStudent: () => void;
}

export const StudentLessonPicker: React.FC<StudentLessonPickerProps> = ({
  customExams = [],
  deletedExamIds = [],
  onSelectLesson,
  onChangeStudent
}) => {
  const profile = useMemo(() => loadStudentProfile(), []);
  const { allExams } = useStudentExamCatalog(customExams, deletedExamIds);
  const groups = useMemo(() => groupExamsForSelection(allExams), [allExams]);
  const [filter, setFilter] = useState('ALL');
  const visibleExams = filter === 'ALL' ? allExams : groups.find((group) => group.label === filter)?.exams || [];

  if (!profile) {
    return (
      <section className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Chưa có thông tin học sinh</h1>
        <p className="text-slate-600">Hãy nhập tên và lớp trước khi chọn bài.</p>
        <button
          type="button"
          onClick={onChangeStudent}
          className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-md"
        >
          Nhập thông tin <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Xin chào,</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{profile.className}</p>
        </div>
        <button type="button" onClick={onChangeStudent} className="text-sm font-semibold text-red-700 hover:text-red-900">
          Đổi học sinh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bài học / bài kiểm tra</h2>
          <p className="text-sm text-slate-500 mt-1">Chọn bài để bắt đầu làm.</p>
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          aria-label="Lọc bài học"
        >
          <option value="ALL">Tất cả</option>
          {groups.map((group) => <option key={group.label} value={group.label}>{group.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {visibleExams.map((exam) => (
          <article
            key={exam.id}
            onClick={() => onSelectLesson(exam.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectLesson(exam.id);
              }
            }}
            role="link"
            tabIndex={0}
            className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-red-300 hover:bg-red-50/20 transition"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-700 mb-1">{getExamGroupLabel(exam)}</p>
              <h3 className="text-xl font-bold text-slate-900 break-words">{exam.title}</h3>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{exam.description}</p>
              <p className="text-xs text-slate-500 mt-2">
                {exam.type ? `Loại bài: ${exam.type === 'handwriting_submission' ? 'Nộp ảnh bài viết tay' : exam.type}` : 'Bài học / bài kiểm tra'}
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectLesson(exam.id);
              }}
              className="inline-flex items-center justify-center gap-2 shrink-0 bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-md"
            >
              Làm bài <ArrowRight className="w-4 h-4" />
            </button>
          </article>
        ))}
        {visibleExams.length === 0 && <p className="text-center text-slate-500 py-10">Chưa có bài trong nhóm này.</p>}
      </div>
    </section>
  );
};

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => (
  <section className="max-w-3xl mx-auto py-8 sm:py-16">
    <div className="text-center space-y-3 mb-10">
      <p className="text-sm font-semibold tracking-wide text-red-700">HSK · Thanh Bình</p>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Bạn muốn vào đâu?</h1>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <PortalChoice icon={<GraduationCap className="w-6 h-6" />} title="Học sinh" description="Làm bài tập và bài kiểm tra" onClick={() => onNavigate('/student')} />
      <PortalChoice icon={<BookOpen className="w-6 h-6" />} title="Giáo viên" description="Soạn bài, chấm bài và quản lý" onClick={() => onNavigate('/teacher')} />
      <PortalChoice icon={<ClipboardCheck className="w-6 h-6" />} title="Kết quả" description="Xem bài đã nộp và kết quả" onClick={() => onNavigate('/results')} />
    </div>
  </section>
);

interface PortalChoiceProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const PortalChoice: React.FC<PortalChoiceProps> = ({ icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-white border border-slate-200 rounded-lg p-5 min-h-36 hover:border-red-300 hover:bg-red-50/30 transition"
  >
    <span className="inline-flex text-red-700 mb-8">{icon}</span>
    <span className="block text-lg font-bold text-slate-900">{title}</span>
    <span className="block text-sm text-slate-600 mt-1">{description}</span>
  </button>
);
