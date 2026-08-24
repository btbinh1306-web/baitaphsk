import React, { useEffect, useMemo, useState } from 'react';
import { Braces, ChevronDown, ChevronUp, Code2, Copy, Loader2, Plus, Redo2, Trash2, Undo2, Upload } from 'lucide-react';
import {
  createStructuredLessonItem,
  isStructuredExerciseType,
  STRUCTURED_EXERCISE_LABELS,
  STRUCTURED_EXERCISE_TEMPLATES
} from '../utils/structuredExercises';
import { uploadMediaFile } from '../services/apiService';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };
type ValueKind = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface LessonDataEditorProps {
  title: string;
  value: Record<string, unknown>;
  onChange: (nextValue: Record<string, unknown>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  validateAdvancedJson?: (nextValue: Record<string, unknown>) => string | null;
}

const FIELD_LABELS: Record<string, string> = {
  id: 'Mã định danh',
  version: 'Phiên bản',
  lesson: 'Thông tin bài học',
  title: 'Tiêu đề',
  level: 'Trình độ',
  description: 'Mô tả',
  sections: 'Các phần bài học',
  items: 'Danh sách bài tập',
  type: 'Dạng bài tập',
  data: 'Cài đặt chung',
  instruction: 'Hướng dẫn',
  prompt: 'Câu hỏi / đề bài',
  question: 'Câu hỏi',
  text: 'Nội dung',
  content: 'Đoạn văn / nội dung',
  hanzi: 'Hán tự',
  pinyin: 'Pinyin',
  meaning: 'Nghĩa tiếng Việt',
  translation: 'Bản dịch',
  example: 'Ví dụ',
  sample: 'Câu mẫu',
  answer: 'Đáp án đúng',
  correctAnswer: 'Đáp án đúng',
  suggestedAnswer: 'Đáp án gợi ý',
  acceptableAnswers: 'Đáp án được chấp nhận',
  options: 'Các lựa chọn',
  choices: 'Các lựa chọn',
  wordBank: 'Từ cho sẵn',
  wordChips: 'Thẻ từ',
  paragraphs: 'Các đoạn văn',
  sentences: 'Các câu',
  questions: 'Các câu hỏi',
  sharedOptions: 'Bảng hình / lựa chọn dùng chung',
  answerBank: 'Ngân hàng câu trả lời dùng chung',
  left: 'Cột trái',
  right: 'Cột phải',
  audio: 'File âm thanh',
  audioUrl: 'Đường dẫn âm thanh',
  audioPromptUrl: 'Âm thanh câu hỏi',
  questionAudio: 'Âm thanh câu hỏi riêng',
  audioText: 'Kịch bản đọc tự động',
  transcript: 'Lời thoại / transcript',
  image: 'Hình ảnh',
  imageUrl: 'Đường dẫn hình ảnh',
  referenceImages: 'Ảnh tham khảo',
  explanation: 'Giải thích',
  metadata: 'Thiết lập bổ sung',
  shuffle: 'Đảo thứ tự',
  shuffleOptions: 'Đảo lựa chọn',
  showPinyin: 'Hiển thị pinyin',
  showTranscript: 'Hiển thị transcript',
  playCount: 'Số lượt phát',
  limitPlayCount: 'Giới hạn lượt nghe',
  alt: 'Mô tả ảnh (alt text)',
  allowRecording: 'Cho phép ghi âm',
  maxAttempts: 'Số lần thử tối đa',
  minLength: 'Số ký tự tối thiểu',
  ignoreSpace: 'Bỏ qua khoảng trắng',
  ignorePunctuation: 'Bỏ qua dấu câu'
};

const REQUIRED_KEYS = new Set(['id', 'version', 'lesson', 'sections', 'items', 'type', 'data']);
const LONG_TEXT_KEYS = new Set([
  'instruction',
  'description',
  'prompt',
  'question',
  'text',
  'content',
  'transcript',
  'audioText',
  'explanation',
  'example',
  'sample',
  'meaning',
  'translation'
]);

function labelFor(key: string): string {
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function isRecord(value: JsonValue): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as JsonPrimitive;
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>).reduce<JsonRecord>((result, [key, item]) => {
      if (item !== undefined) result[key] = toJsonValue(item);
      return result;
    }, {});
  }
  return String(value ?? '');
}

function createValue(kind: ValueKind): JsonValue {
  if (kind === 'number') return 0;
  if (kind === 'boolean') return false;
  if (kind === 'object') return {};
  if (kind === 'array') return [];
  return '';
}

function ArrayAddControl({ onAdd, path }: { onAdd: (value: JsonValue) => void; path: string }) {
  const [kind, setKind] = useState<ValueKind>('string');
  const [exerciseType, setExerciseType] = useState(STRUCTURED_EXERCISE_TEMPLATES[0].type);
  const isSectionItems = /\.sections\[\d+\]\.items$/.test(path);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {isSectionItems && (
        <>
          <select
            value={exerciseType}
            onChange={(event) => setExerciseType(event.target.value as typeof exerciseType)}
            className="px-2 py-1 border border-indigo-300 rounded text-xs bg-white"
            aria-label="Dạng bài HSK cần thêm"
          >
            {(['Nghe', 'Đọc'] as const).map((group) => (
              <optgroup key={group} label={group}>
                {STRUCTURED_EXERCISE_TEMPLATES.filter((item) => item.group === group).map((item) => (
                  <option key={item.type} value={item.type}>{item.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onAdd(toJsonValue(createStructuredLessonItem(exerciseType)))}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-indigo-300 text-indigo-800 rounded hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm dạng bài
          </button>
          <span className="h-6 border-l border-slate-200" />
        </>
      )}
      <select
        value={kind}
        onChange={(event) => setKind(event.target.value as ValueKind)}
        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
        aria-label="Loại phần tử cần thêm"
      >
        <option value="string">Văn bản</option>
        <option value="number">Số</option>
        <option value="boolean">Đúng / Sai</option>
        <option value="object">Đối tượng</option>
        <option value="array">Danh sách</option>
      </select>
      <button
        type="button"
        onClick={() => onAdd(createValue(kind))}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-50"
      >
        <Plus className="w-3.5 h-3.5" /> Thêm phần tử
      </button>
    </div>
  );
}

function ObjectAddControl({ onAdd }: { onAdd: (key: string, value: JsonValue) => void }) {
  const [key, setKey] = useState('');
  const [kind, setKind] = useState<ValueKind>('string');

  const handleAdd = () => {
    const normalizedKey = key.trim();
    if (!normalizedKey) return;
    onAdd(normalizedKey, createValue(kind));
    setKey('');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-2 pt-3 border-t border-slate-200">
      <input
        type="text"
        value={key}
        onChange={(event) => setKey(event.target.value)}
        placeholder="Tên trường mới"
        className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
      />
      <select
        value={kind}
        onChange={(event) => setKind(event.target.value as ValueKind)}
        className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
        aria-label="Kiểu dữ liệu trường mới"
      >
        <option value="string">Văn bản</option>
        <option value="number">Số</option>
        <option value="boolean">Đúng / Sai</option>
        <option value="object">Đối tượng</option>
        <option value="array">Danh sách</option>
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!key.trim()}
        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"
      >
        <Plus className="w-3.5 h-3.5" /> Thêm trường
      </button>
    </div>
  );
}

interface ValueEditorProps {
  value: JsonValue;
  onChange: (nextValue: JsonValue) => void;
  fieldKey?: string;
  siblingOptions?: string[];
  depth?: number;
  path?: string;
  answerOptions?: string[];
}

function optionIds(value: JsonValue | undefined): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.map((option, index) => {
    if (typeof option === 'string' || typeof option === 'number') return String(option);
    if (isRecord(option)) {
      const id = option.id ?? option.label;
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
    return String.fromCharCode(65 + index);
  });
  return ids.length > 0 ? ids : undefined;
}

function isStructuredItemRecord(value: JsonValue, path: string): value is JsonRecord {
  if (!/\.sections\[\d+\]\.items\[\d+\]$/.test(path) || !isRecord(value)) return false;
  const type = typeof value.type === 'string' ? value.type.toLowerCase().trim() : '';
  const data = isRecord(value.data) ? value.data : null;
  return isStructuredExerciseType(type) || ((type === 'fill' || type === 'fill_in_blank') && Array.isArray(data?.items));
}

function StructuredLessonItemEditor({
  value,
  onChange,
  path
}: {
  value: JsonRecord;
  onChange: (value: JsonValue) => void;
  path: string;
}) {
  const type = String(value.type || '').toLowerCase().trim();
  const data = isRecord(value.data) ? value.data : {};
  const label = type === 'fill' || type === 'fill_in_blank'
    ? 'Điền từ (ngân hàng từ chung)'
    : STRUCTURED_EXERCISE_LABELS[type as keyof typeof STRUCTURED_EXERCISE_LABELS] || type;
  const isListening = type.startsWith('listening_');
  const sharedKey = ['sharedOptions', 'answerBank', 'wordBank'].find((key) => Array.isArray(data[key]));
  const rowKey = type === 'reading_comprehension_choice' || (
    type === 'listening_comprehension_choice' && Array.isArray(data.questions) && !Array.isArray(data.items)
  ) ? 'questions' : 'items';
  const commonKeys = [
    'instruction',
    'example',
    'showPinyin',
    ...(isListening ? ['playCount', 'limitPlayCount', 'audio', 'questionAudio', 'showTranscript'] : [])
  ].filter((key) => data[key] !== undefined);
  const sharedAnswerOptions = sharedKey ? optionIds(data[sharedKey]) : undefined;

  const updateData = (key: string, nextValue: JsonValue) => {
    onChange({ ...value, data: { ...data, [key]: nextValue } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-indigo-950">{label}</p>
          <p className="text-[11px] text-slate-500">{type}</p>
        </div>
        <div className="w-full sm:w-56">
          <label className="text-[11px] font-semibold text-slate-600">Mã block</label>
          <input
            value={String(value.id || '')}
            onChange={(event) => onChange({ ...value, id: event.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
          />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
        <h5 className="text-xs font-bold uppercase text-slate-700">Cài đặt chung</h5>
        {commonKeys.map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">{labelFor(key)}</label>
            <ValueEditor
              value={data[key]}
              fieldKey={key}
              depth={2}
              path={`${path}.data.${key}`}
              onChange={(nextValue) => updateData(key, nextValue)}
            />
          </div>
        ))}
        {isRecord(data.passage) && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Đoạn đọc dùng chung</label>
            <ValueEditor
              value={data.passage}
              fieldKey="passage"
              depth={2}
              path={`${path}.data.passage`}
              onChange={(nextValue) => updateData('passage', nextValue)}
            />
          </div>
        )}
        {sharedKey && (
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-700">{labelFor(sharedKey)}</label>
            <ValueEditor
              value={data[sharedKey]}
              fieldKey={sharedKey}
              depth={2}
              path={`${path}.data.${sharedKey}`}
              onChange={(nextValue) => updateData(sharedKey, nextValue)}
            />
          </div>
        )}
      </section>

      <section className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2">
        <h5 className="text-xs font-bold uppercase text-indigo-800">Câu hỏi</h5>
        <ValueEditor
          value={Array.isArray(data[rowKey]) ? data[rowKey] : []}
          fieldKey={rowKey}
          depth={2}
          path={`${path}.data.${rowKey}`}
          answerOptions={sharedAnswerOptions}
          onChange={(nextValue) => updateData(rowKey, nextValue)}
        />
      </section>
    </div>
  );
}

function ValueEditor({ value, onChange, fieldKey = '', siblingOptions, depth = 0, path = '$', answerOptions }: ValueEditorProps) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={`${fieldKey}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-start">
            <div className="min-w-0 border border-slate-200 rounded p-2 bg-white">
              <div className="mb-1 text-[11px] font-semibold text-slate-500">
                {fieldKey === 'options' ? `Lựa chọn ${String.fromCharCode(65 + index)}` : `Mục ${index + 1}`}
              </div>
              {isStructuredItemRecord(item, `${path}[${index}]`) ? (
                <StructuredLessonItemEditor
                  value={item}
                  path={`${path}[${index}]`}
                  onChange={(nextItem) => {
                    const next = [...value];
                    next[index] = nextItem;
                    onChange(next);
                  }}
                />
              ) : (
                <ValueEditor
                  value={item}
                  fieldKey={fieldKey}
                  depth={depth + 1}
                  path={`${path}[${index}]`}
                  answerOptions={answerOptions}
                  onChange={(nextItem) => {
                    const next = [...value];
                    next[index] = nextItem;
                    onChange(next);
                  }}
                />
              )}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  const next = [...value];
                  next.splice(index + 1, 0, JSON.parse(JSON.stringify(item)) as JsonValue);
                  onChange(next);
                }}
                className="p-1 border border-slate-300 rounded text-slate-500 hover:bg-slate-50"
                title="Nhân bản phần tử"
                aria-label="Nhân bản phần tử"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (index === 0) return;
                  const next = [...value];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                disabled={index === 0}
                className="p-1 border border-slate-300 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                title="Đưa lên"
                aria-label="Đưa lên"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (index === value.length - 1) return;
                  const next = [...value];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}
                disabled={index === value.length - 1}
                className="p-1 border border-slate-300 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                title="Đưa xuống"
                aria-label="Đưa xuống"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                className="p-1 border border-red-200 rounded text-red-700 hover:bg-red-50"
                title="Xóa phần tử"
                aria-label="Xóa phần tử"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        <ArrayAddControl path={path} onAdd={(item) => onChange([...value, item])} />
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    return (
      <div className={`space-y-3 ${depth > 0 ? 'border-l-2 border-slate-200 pl-3' : ''}`}>
        {entries.map(([key, item]) => {
          const canRemove = !REQUIRED_KEYS.has(key);
          const options = key === 'answer' || key === 'correctAnswer'
            ? (optionIds(value.options) || answerOptions)
            : undefined;

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-700">{labelFor(key)}</label>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...value };
                      delete next[key];
                      onChange(next);
                    }}
                    className="p-1 text-slate-400 hover:text-red-700"
                    title={`Xóa trường ${labelFor(key)}`}
                    aria-label={`Xóa trường ${labelFor(key)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <ValueEditor
                value={item}
                fieldKey={key}
                siblingOptions={options}
                depth={depth + 1}
                path={`${path}.${key}`}
                answerOptions={answerOptions}
                onChange={(nextItem) => onChange({ ...value, [key]: nextItem })}
              />
            </div>
          );
        })}
        <ObjectAddControl onAdd={(key, item) => onChange({ ...value, [key]: item })} />
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="inline-flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        Bật
      </label>
    );
  }

  if ((fieldKey === 'answer' || fieldKey === 'correctAnswer') && siblingOptions?.length) {
    const isIndexAnswer = typeof value === 'number' || /^\d+$/.test(String(value));
    return (
      <select
        value={String(value)}
        onChange={(event) => onChange(isIndexAnswer ? Number(event.target.value) : event.target.value)}
        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
      >
        {siblingOptions.map((option, index) => (
          <option key={`${option}-${index}`} value={isIndexAnswer ? String(index) : option}>
            {String.fromCharCode(65 + index)}. {option}
          </option>
        ))}
      </select>
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm"
      />
    );
  }

  if (value === null) {
    return (
      <select
        value="null"
        onChange={(event) => onChange(createValue(event.target.value as ValueKind))}
        className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
      >
        <option value="null">Chưa đặt giá trị</option>
        <option value="string">Văn bản</option>
        <option value="number">Số</option>
        <option value="boolean">Đúng / Sai</option>
        <option value="object">Đối tượng</option>
        <option value="array">Danh sách</option>
      </select>
    );
  }

  if (MEDIA_KEYS.has(fieldKey)) {
    return <MediaStringEditor value={value} fieldKey={fieldKey} onChange={(nextValue) => onChange(nextValue)} />;
  }

  if (LONG_TEXT_KEYS.has(fieldKey) || value.length > 90) {
    return (
      <textarea
        rows={Math.max(2, Math.min(6, value.split('\n').length + 1))}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm resize-y"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm"
    />
  );
}

const MEDIA_KEYS = new Set(['audio', 'audioUrl', 'audioPromptUrl', 'questionAudio', 'image', 'imageUrl']);

function MediaStringEditor({
  value,
  fieldKey,
  onChange
}: {
  value: string;
  fieldKey: string;
  onChange: (value: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const isImage = fieldKey === 'image' || fieldKey === 'imageUrl';

  const handleFile = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const uploadedUrl = await uploadMediaFile(dataUrl, file.name, file.type, 'lesson');
      onChange(uploadedUrl || dataUrl);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isImage ? 'Dán URL hình ảnh' : 'Dán URL file âm thanh'}
          className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-sm"
        />
        <label className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer">
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {value ? 'Thay file' : 'Tải file'}
          <input
            type="file"
            accept={isImage ? 'image/*' : 'audio/*'}
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </div>
      {value && isImage && (
        <img src={getDriveMediaPlayerUrl(value)} alt="Xem trước" className="h-28 max-w-full object-contain bg-white border border-slate-200 rounded" />
      )}
      {value && !isImage && (
        <audio controls preload="metadata" src={getDriveAudioPlayerUrl(value)} className="w-full h-9" />
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900"
        >
          <Trash2 className="w-3.5 h-3.5" /> Gỡ file
        </button>
      )}
    </div>
  );
}

export const LessonDataEditor: React.FC<LessonDataEditorProps> = ({
  title,
  value,
  onChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  validateAdvancedJson
}) => {
  const safeValue = useMemo(() => toJsonValue(value) as JsonRecord, [value]);
  const serializedValue = useMemo(() => JSON.stringify(safeValue, null, 2), [safeValue]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [jsonText, setJsonText] = useState(serializedValue);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(serializedValue);
  }, [serializedValue]);

  const applyAdvancedJson = () => {
    try {
      const nextValue = JSON.parse(jsonText);
      if (!isRecord(nextValue)) {
        setJsonError('JSON gốc phải là một đối tượng { ... }.');
        return;
      }
      const validationError = validateAdvancedJson?.(nextValue) || null;
      if (validationError) {
        setJsonError(validationError);
        return;
      }
      setJsonError(null);
      onChange(nextValue);
      setShowAdvanced(false);
    } catch (error) {
      setJsonError(error instanceof Error ? `JSON không hợp lệ: ${error.message}` : 'JSON không hợp lệ.');
    }
  };

  return (
    <section className="space-y-3 border border-slate-200 rounded-lg p-3 bg-white">
      <div className="border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Braces className="w-4 h-4 text-red-700" /> {title}
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex items-center justify-center w-8 h-8 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
            title={isCollapsed ? 'Mở rộng dữ liệu bài học' : 'Thu gọn dữ liệu bài học'}
            aria-label={isCollapsed ? 'Mở rộng dữ liệu bài học' : 'Thu gọn dữ liệu bài học'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Hoàn tác (⌘/Ctrl + Z)"
            aria-label="Hoàn tác"
          >
            <Undo2 className="w-3.5 h-3.5" /> Hoàn tác
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="inline-flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Làm lại (⌘/Ctrl + Shift + Z hoặc Ctrl + Y)"
            aria-label="Làm lại"
          >
            <Redo2 className="w-3.5 h-3.5" /> Làm lại
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="inline-flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
          >
            <Code2 className="w-3.5 h-3.5" /> JSON nâng cao
          </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Chỉnh sửa trực tiếp các trường hoặc dùng JSON nâng cao.</p>
      </div>

      {!isCollapsed && (
        <>
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cài đặt chung và nội dung</div>
            <ValueEditor value={safeValue} onChange={(nextValue) => onChange(nextValue as JsonRecord)} />
          </div>

          {showAdvanced && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <label className="block text-xs font-semibold text-slate-700">Toàn bộ dữ liệu JSON</label>
              <textarea
                rows={18}
                value={jsonText}
                onChange={(event) => {
                  setJsonText(event.target.value);
                  setJsonError(null);
                }}
                spellCheck={false}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs leading-relaxed"
              />
              {jsonError && <p className="text-xs text-red-700">{jsonError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(serializedValue);
                    setJsonError(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hoàn tác
                </button>
                <button
                  type="button"
                  onClick={applyAdvancedJson}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800"
                >
                  Áp dụng JSON
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
