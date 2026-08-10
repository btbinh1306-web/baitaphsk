import React from 'react';
import { PenTool, Award, Search, Settings } from 'lucide-react';

export type TabType = 'STUDENT' | 'TEACHER' | 'LOOKUP' | 'SETUP';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-3">
          {/* Logo Brand */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => setActiveTab('STUDENT')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-800 to-red-600 text-white font-bold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-lg tracking-wider">HSK</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                  Hệ Thống Bài Tập & Luyện Nói HSK
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">Học tiếng Trung cùng Thanh Bình + Thanh Tùng nhé</p>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-medium text-xs sm:text-sm border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => setActiveTab('STUDENT')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeTab === 'STUDENT'
                  ? 'bg-red-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-4 h-4" /> Làm Bài Tập
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TEACHER')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeTab === 'TEACHER'
                  ? 'bg-red-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" /> Giáo Viên Chấm Bài
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LOOKUP')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeTab === 'LOOKUP'
                  ? 'bg-red-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" /> Tra Cứu Kết Quả
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SETUP')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeTab === 'SETUP'
                  ? 'bg-red-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Cấu hình Google Sheet"
            >
              <Settings className="w-4 h-4" /> Cấu hình Google Sheet
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
