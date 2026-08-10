import React, { useState } from 'react';
import { JsonEditor } from './JsonEditor';
import { ValidationPanel } from './ValidationPanel';
import { PreviewLesson } from './PreviewLesson';
import { validateLesson } from '../utils/validateLesson';
import { parseLessonToExam } from '../utils/lessonParser';
import { ValidationResult } from '../types/lesson';
import { ExamLesson } from '../types';
import { FileCode, CheckCircle2 } from 'lucide-react';

interface ImportLessonProps {
  onSaveCustomExam?: (exam: ExamLesson) => void;
  onImportSuccess?: (exam: ExamLesson) => void;
}

const SAMPLE_LESSON_JSON = JSON.stringify(
  {
    version: '1.0',
    lesson: {
      id: 'hsk1-lesson1',
      title: 'HSK 1 - Bài 1: 你好 (Xin chào & Bài tập mở rộng)',
      level: 'HSK 1',
      description: 'Bài học mở đầu nhập từ file JSON bao gồm đầy đủ các dạng bài tập mới: Matching, Dictation, Paragraph Order và Picture Writing.'
    },
    sections: [
      {
        id: 'sec1',
        title: 'Từ vựng & Flashcard',
        items: [
          { id: 'v1', type: 'vocab', data: { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào', example: '你好！很高兴认识你。' } },
          { id: 'v2', type: 'flashcard', data: { hanzi: '再见', pinyin: 'zàijiàn', meaning: 'Tạm biệt', example: '明天见，再见！' } },
          { id: 'v3', type: 'vocab', data: { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Cảm ơn', example: '谢谢你的帮助。' } }
        ]
      },
      {
        id: 'sec2',
        title: 'Bài tập Nối từ & Nghe chính tả',
        items: [
          {
            id: 'm1',
            type: 'matching',
            data: {
              instruction: 'Nối từ tiếng Trung với nghĩa tiếng Việt tương ứng',
              left: ['老师', '学生'],
              right: ['Giáo viên', 'Học sinh'],
              answer: [
                [0, 0],
                [1, 1]
              ]
            }
          },
          {
            id: 'd1',
            type: 'dictation',
            data: {
              instruction: 'Nghe audio và gõ lại câu chính xác',
              audio: '',
              answer: '我是学生',
              ignoreSpace: true,
              ignorePunctuation: true
            }
          }
        ]
      },
      {
        id: 'sec3',
        title: 'Sắp xếp đoạn văn & Tập viết theo tranh',
        items: [
          {
            id: 'po1',
            type: 'paragraph_order',
            data: {
              instruction: 'Sắp xếp các câu thành đoạn văn hoàn chỉnh:',
              paragraphs: [
                { id: 'A', text: '今天星期天。' },
                { id: 'B', text: '我去看电影。' }
              ],
              answer: ['A', 'B']
            }
          },
          {
            id: 'pw1',
            type: 'picture_writing',
            data: {
              instruction: 'Quan sát bức tranh và viết câu miêu tả:',
              image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
              minLength: 5,
              sample: '这是一个苹果。'
            }
          }
        ]
      }
    ]
  },
  null,
  2
);

export const ImportLesson: React.FC<ImportLessonProps> = ({ onSaveCustomExam, onImportSuccess }) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importedSuccessMsg, setImportedSuccessMsg] = useState<string | null>(null);

  const handleValidate = () => {
    setImportedSuccessMsg(null);
    const result = validateLesson(jsonText);
    setValidationResult(result);
  };

  const handleLoadSample = () => {
    setImportedSuccessMsg(null);
    setJsonText(SAMPLE_LESSON_JSON);
    const result = validateLesson(SAMPLE_LESSON_JSON);
    setValidationResult(result);
  };

  const handleImport = () => {
    if (!validationResult || !validationResult.isValid || !validationResult.parsedData) {
      alert('Vui lòng kiểm tra JSON hợp lệ trước khi nhập.');
      return;
    }

    const parsedExam = parseLessonToExam(validationResult.parsedData);

    // Save to localStorage or state handler
    try {
      const storageKey = 'hsk_custom_exams_v2';
      const existingStr = localStorage.getItem(storageKey);
      let customList: ExamLesson[] = existingStr ? JSON.parse(existingStr) : [];
      customList = customList.filter((e) => e.id !== parsedExam.id);
      customList.unshift(parsedExam);
      localStorage.setItem(storageKey, JSON.stringify(customList));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    if (onSaveCustomExam) {
      onSaveCustomExam(parsedExam);
    }

    if (onImportSuccess) {
      onImportSuccess(parsedExam);
    }

    setImportedSuccessMsg(`Đã nhập thành công bài học "${parsedExam.title}" (${parsedExam.id})!`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Nhập Bài Học Từ File JSON (Import System)</h2>
        </div>
        <p className="text-xs text-slate-500">
          Nhập giáo trình, từ vựng và ngân hàng câu hỏi bằng file JSON tiêu chuẩn. Hệ thống sẽ tự động kiểm tra cú pháp, hiển thị bản xem trước (Preview) và đưa bài học vào danh sách giảng dạy.
        </p>
      </div>

      {importedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importedSuccessMsg}</span>
        </div>
      )}

      {/* Editor Component */}
      <JsonEditor
        jsonText={jsonText}
        onChangeJson={(val) => {
          setJsonText(val);
          setImportedSuccessMsg(null);
        }}
        onValidate={handleValidate}
        onLoadSample={handleLoadSample}
      />

      {/* Validation Panel */}
      <ValidationPanel validationResult={validationResult} />

      {/* Preview Panel if JSON valid */}
      {validationResult && validationResult.isValid && validationResult.parsedData && (
        <PreviewLesson
          lessonData={validationResult.parsedData}
          onImport={handleImport}
        />
      )}
    </div>
  );
};
