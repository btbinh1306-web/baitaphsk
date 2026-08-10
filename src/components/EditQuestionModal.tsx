import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Volume2, Upload, Trash2, Image as ImageIcon, Link as LinkIcon, HardDrive } from 'lucide-react';
import { Question } from '../types';
import { speakText } from '../utils/tts';
import { getDriveAudioPlayerUrl, getDriveMediaPlayerUrl } from '../utils/audioUtils';
import { uploadMediaFile } from '../services/apiService';

interface EditQuestionModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !question) return null;

  const [type, setType] = useState<string>(question.type || 'mc');
  const [prompt, setPrompt] = useState<string>(question.prompt || '');
  const [pinyin, setPinyin] = useState<string>(question.pinyin || '');
  const [translationType, setTranslationType] = useState<string>(question.translationType || 'vi_to_zh_audio');
  
  // MC / Listening options
  const [optA, setOptA] = useState<string>(question.options?.[0] || '');
  const [optB, setOptB] = useState<string>(question.options?.[1] || '');
  const [optC, setOptC] = useState<string>(question.options?.[2] || '');
  const [optD, setOptD] = useState<string>(question.options?.[3] || '');
  const [correctAnswer, setCorrectAnswer] = useState<number>(
    typeof question.answer === 'number' ? question.answer : 0
  );

  // Fill / Arrange / Essay / Translation
  const [acceptableAnswers, setAcceptableAnswers] = useState<string>(question.acceptableAnswers || '');
  const [suggestedAnswer, setSuggestedAnswer] = useState<string>(question.suggestedAnswer || '');
  const [wordChips, setWordChips] = useState<string>(
    Array.isArray(question.wordChips) ? question.wordChips.join(', ') : ''
  );

  // Speaking record items
  const [items, setItems] = useState<string>(
    Array.isArray(question.items) ? question.items.map(String).join(', ') : ''
  );

  // Audio, Image & Explanation
  const [audioUrl, setAudioUrl] = useState<string>(question.audioUrl || question.audioPromptUrl || '');
  const [imageUrl, setImageUrl] = useState<string>(question.imageUrl || '');
  const [explanation, setExplanation] = useState<string>(question.explanation || '');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    if (question) {
      setType(question.type || 'mc');
      setPrompt(question.prompt || '');
      setPinyin(question.pinyin || '');
      setTranslationType(question.translationType || 'vi_to_zh_audio');
      setOptA(question.options?.[0] || '');
      setOptB(question.options?.[1] || '');
      setOptC(question.options?.[2] || '');
      setOptD(question.options?.[3] || '');
      setCorrectAnswer(typeof question.answer === 'number' ? question.answer : 0);
      setAcceptableAnswers(question.acceptableAnswers || '');
      setSuggestedAnswer(question.suggestedAnswer || '');
      setWordChips(Array.isArray(question.wordChips) ? question.wordChips.join(', ') : '');
      setItems(Array.isArray(question.items) ? question.items.map(String).join(', ') : '');
      setAudioUrl(question.audioUrl || question.audioPromptUrl || '');
      setImageUrl(question.imageUrl || '');
      setExplanation(question.explanation || '');
    }
  }, [question]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploadedUrl = await uploadMediaFile(dataUrl, file.name, file.type);
      setAudioUrl(uploadedUrl || dataUrl);
    } catch (err) {
      console.error('Could not upload audio:', err);
      alert('Không thể đọc file audio. Vui lòng thử lại.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploadedUrl = await uploadMediaFile(dataUrl, file.name, file.type);
      setImageUrl(uploadedUrl || dataUrl);
    } catch (err) {
      console.error('Could not upload image:', err);
      alert('Không thể đọc file ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingMedia) {
      alert('Vui lòng chờ tải file hoàn tất.');
      return;
    }
    if (!prompt.trim()) {
      alert('Vui lòng nhập đề bài câu hỏi.');
      return;
    }

    let finalOptions: string[] | undefined = undefined;
    if (
      ['mc', 'listening_mc', 'listening_multiple_choice', 'listening_tf', 'listening_true_false'].includes(type)
    ) {
      if (type === 'listening_tf' || type === 'listening_true_false') {
        finalOptions = ['Đúng (正确)', 'Sai (错误)'];
      } else {
        const opts = [optA.trim(), optB.trim()];
        if (optC.trim()) opts.push(optC.trim());
        if (optD.trim()) opts.push(optD.trim());
        finalOptions = opts;
      }
    }

    const finalChips = wordChips.trim()
      ? wordChips.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const finalItems = items.trim()
      ? items.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const updatedQuestion: Question = {
      ...question,
      type: type as Question['type'],
      prompt: prompt.trim(),
      pinyin: pinyin.trim() || undefined,
      translationType: type === 'translation' ? (translationType as any) : undefined,
      options: finalOptions,
      answer: ['mc', 'listening_mc', 'listening_multiple_choice', 'listening_tf', 'listening_true_false'].includes(type)
        ? correctAnswer
        : undefined,
      acceptableAnswers: acceptableAnswers.trim() || undefined,
      suggestedAnswer: suggestedAnswer.trim() || undefined,
      wordChips: finalChips,
      items: finalItems,
      audioUrl: audioUrl.trim() || undefined,
      audioPromptUrl: audioUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      explanation: explanation.trim() || undefined
    };

    onSave(updatedQuestion);
    onClose();
  };

  const isMcOrListening = ['mc', 'listening_mc', 'listening_multiple_choice', 'listening_tf', 'listening_true_false'].includes(type);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Chỉnh Sửa Câu Hỏi</h3>
              <p className="text-xs text-slate-300">ID: {question.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Loại / Dạng câu hỏi:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="speaking">🎙️ Luyện nói (speaking)</option>
                <option value="listening_multiple_choice">🎧 Nghe tích trắc nghiệm ABCD (listening_multiple_choice)</option>
                <option value="listening_true_false">🎧 Nghe phán đoán Đúng / Sai (listening_true_false)</option>
                <option value="listening_fill">🎧 Nghe điền tự luận (listening_fill)</option>
                <option value="mc">📝 Trắc nghiệm chọn đáp án (mc)</option>
                <option value="fill">✍️ Điền từ vào chỗ trống (fill)</option>
                <option value="arrange">🧩 Sắp xếp từ thành câu (arrange)</option>
                <option value="essay">📄 Bài tập tự luận (essay)</option>
                <option value="handwriting_submission">📝 Bài chép từ mới / Nộp ảnh bài viết (handwriting_submission)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phiên âm Pinyin (không bắt buộc):</label>
              <input
                type="text"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                placeholder="Ví dụ: Wǒ zuìjìn bǐjiào máng."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Translation Sub-type if translation */}
          {type === 'translation' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dạng bài dịch:</label>
              <select
                value={translationType}
                onChange={(e) => setTranslationType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="vi_to_zh_audio">🎙️ Cho Tiếng Việt → Ghi âm Tiếng Trung</option>
                <option value="vi_to_zh_text">✍️ Cho Tiếng Việt → Viết chữ Hán</option>
                <option value="zh_to_vi_text">🇨🇳 Cho Tiếng Trung → Dịch sang Tiếng Việt</option>
              </select>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài tập / Đề bài câu hỏi:</label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập đề bài câu hỏi..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Items for speaking_record */}
          {type === 'speaking_record' && (
            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Danh sách các từ / âm tiết cần ghi âm (cách nhau bởi dấu phẩy):
              </label>
              <input
                type="text"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="Ví dụ: b, p, m, f, d, t, n, l"
                className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs bg-rose-50/50 font-mono text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Options for MC & Listening */}
          {isMcOrListening && type !== 'listening_tf' && type !== 'listening_true_false' && (
            <div className="space-y-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <label className="block text-xs font-bold text-indigo-900">Các lựa chọn đáp án:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">Đáp án A:</span>
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">Đáp án B:</span>
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">Đáp án C:</span>
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">Đáp án D:</span>
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <label className="text-xs font-bold text-indigo-900">Chọn đáp án đúng chuẩn:</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                  className="px-3 py-1 border border-indigo-300 rounded-lg text-xs font-bold bg-white text-indigo-900 outline-none"
                >
                  <option value={0}>A ({optA || 'Tùy chọn A'})</option>
                  <option value={1}>B ({optB || 'Tùy chọn B'})</option>
                  <option value={2}>C ({optC || 'Tùy chọn C'})</option>
                  <option value={3}>D ({optD || 'Tùy chọn D'})</option>
                </select>
              </div>
            </div>
          )}

          {/* Correct selection for True/False */}
          {(type === 'listening_tf' || type === 'listening_true_false') && (
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-900">Chọn đáp án đúng chuẩn (Đúng / Sai):</label>
              <div className="flex items-center gap-6 text-xs font-bold">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-emerald-800">
                  <input
                    type="radio"
                    name="edit_tf_ans"
                    checked={correctAnswer === 0}
                    onChange={() => setCorrectAnswer(0)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>A. Đúng (正确)</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer text-rose-800">
                  <input
                    type="radio"
                    name="edit_tf_ans"
                    checked={correctAnswer === 1}
                    onChange={() => setCorrectAnswer(1)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>B. Sai (错误)</span>
                </label>
              </div>
            </div>
          )}

          {/* Word Chips for Arrange */}
          {type === 'arrange' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Các thẻ từ rời (cách nhau bởi dấu phẩy):
              </label>
              <input
                type="text"
                value={wordChips}
                onChange={(e) => setWordChips(e.target.value)}
                placeholder="Ví dụ: 我, 喜欢, 吃, 苹果"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {/* Acceptable answers for Fill / Arrange / Listening Fill */}
          {(type === 'fill' || type === 'arrange' || type === 'listening_fill' || type === 'listening_fill_in_blank') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đáp án chuẩn / từ cần điền (cách nhau bởi dấu | nếu có nhiều đáp án):
              </label>
              <input
                type="text"
                value={acceptableAnswers}
                onChange={(e) => setAcceptableAnswers(e.target.value)}
                placeholder="Ví dụ: 苹果|quả táo"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Suggested answers for Essay / Translation */}
          {(type === 'essay' || type === 'translation') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gợi ý / Đáp án mẫu chuẩn:</label>
              <input
                type="text"
                value={suggestedAnswer}
                onChange={(e) => setSuggestedAnswer(e.target.value)}
                placeholder="Ví dụ: 你的打算是什么？"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Audio Upload & URL Section */}
          <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2.5">
            <label className="block text-xs font-bold text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-600" /> Tải Lên / Gắn Link Audio (Bài Nghe & Luyện Nói):
              </span>
              {(pinyin || prompt) && (
                <button
                  type="button"
                  onClick={() => speakText(pinyin || prompt)}
                  className="text-[11px] text-indigo-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" /> Thử phát AI TTS
                </button>
              )}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="block text-[11px] text-slate-700 font-bold mb-1">
                  Cách 1: Upload file audio từ máy (.mp3, .wav, .m4a):
                </span>
                <input
                  type="file"
                  accept="audio/*"
                    onChange={handleAudioFileUpload}
                    disabled={isUploadingMedia}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-[11px] text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Cách 2: Dán Link Google Drive / ID Drive / URL MP3:
                </span>
                <input
                  type="text"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="Link Google Drive (https://drive.google.com/...) hoặc ID file Drive"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-indigo-900 bg-indigo-100/60 p-2 rounded-lg border border-indigo-200 leading-normal flex items-start gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
              <span>
                <b>Lưu trữ Google Drive đa thiết bị:</b> Bạn chỉ cần dán link chia sẻ từ Google Drive (đã bật quyền <i>"Bất kỳ ai có liên kết đều xem được"</i>). Hệ thống sẽ tự động phát trực tiếp trên mọi thiết bị và máy tính khác nhau!
              </span>
            </p>

            {/* Audio Preview if available */}
            {audioUrl ? (
              <div className="pt-2 border-t border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="w-full sm:w-auto flex-1">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 mb-1">
                    ✓ Nghe thử file audio (Đã đồng bộ phát trên mọi máy):
                  </span>
                  <audio controls src={getDriveAudioPlayerUrl(audioUrl)} className="w-full h-8 rounded-md" />
                </div>
                <button
                  type="button"
                  onClick={() => setAudioUrl('')}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer self-end sm:self-auto shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa audio
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic pt-0.5">
                Chưa có file âm thanh đính kèm. (Nếu không chọn file nghe, hệ thống sẽ tự động đọc câu hỏi bằng giọng AI TTS).
              </p>
            )}
          </div>

          {/* Image Upload & URL Section */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2.5">
            <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-700" /> Hình Ảnh Đính Kèm Đề Bài (Tự luận / Luyện nói / Trắc nghiệm):
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="block text-[11px] text-slate-600 font-medium mb-1">
                  Cách 1: Chọn file ảnh từ máy (.jpg, .png, .webp):
                </span>
                <input
                  type="file"
                  accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={isUploadingMedia}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-[11px] text-slate-600 font-medium mb-1">
                  Cách 2: Hoặc Dán URL / Link Hình Ảnh:
                </span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... URL hình ảnh hoặc base64"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Image Preview if available */}
            {imageUrl ? (
              <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-emerald-700 block mb-1">✓ Xem trước hình ảnh đính kèm:</span>
                  <img src={getDriveMediaPlayerUrl(imageUrl)} alt="Đề bài" className="h-28 rounded-lg border border-slate-200 object-contain bg-white shadow-2xs" />
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer self-end sm:self-auto shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic pt-1">
                Chưa có hình ảnh đính kèm.
              </p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Giải thích đáp án (không bắt buộc):</label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích câu trả lời..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" /> Lưu Cập Nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
