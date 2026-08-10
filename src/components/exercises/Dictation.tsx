import React, { useState, useRef } from 'react';
import { Volume2, Play, Pause, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { speakText } from '../../utils/tts';
import { getDriveAudioPlayerUrl } from '../../utils/audioUtils';

interface DictationProps {
  data: Record<string, unknown>;
}

export const Dictation: React.FC<DictationProps> = ({ data }) => {
  const instruction = typeof data.instruction === 'string' ? data.instruction : 'Nghe audio và gõ lại chính xác câu bạn nghe được:';
  const audioUrl = typeof data.audio === 'string' ? data.audio : (typeof data.audioUrl === 'string' ? data.audioUrl : undefined);
  const expectedAnswer = typeof data.answer === 'string' ? data.answer : '';
  const ignoreSpace = typeof data.ignoreSpace === 'boolean' ? data.ignoreSpace : true;
  const ignorePunctuation = typeof data.ignorePunctuation === 'boolean' ? data.ignorePunctuation : true;

  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanString = (str: string) => {
    let result = str;
    if (ignoreSpace) {
      result = result.replace(/\s+/g, '');
    }
    if (ignorePunctuation) {
      // Clean standard and Chinese punctuation
      result = result.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'，。！？；：、（）]/g, '');
    }
    return result.trim().toLowerCase();
  };

  const handlePlayAudio = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        const playableUrl = getDriveAudioPlayerUrl(audioUrl);
        const audio = new Audio(playableUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          // Fallback to TTS if audio file fails
          setIsPlaying(false);
          speakText(expectedAnswer);
        };
      }
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {
          speakText(expectedAnswer);
        });
        setIsPlaying(true);
      }
    } else {
      // Use built-in TTS speakText
      speakText(expectedAnswer);
    }
  };

  const isCorrect = cleanString(userInput) === cleanString(expectedAnswer);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setUserInput('');
    setIsSubmitted(false);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            Dictation (Nghe & Chính Tả)
          </span>
          <h4 className="font-bold text-slate-800 text-sm mt-1">{instruction}</h4>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>

      {/* Audio Play Trigger */}
      <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayAudio}
          className="w-12 h-12 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-full flex items-center justify-center shadow-sm transition cursor-pointer shrink-0"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
        <div>
          <p className="text-xs font-bold text-purple-950">Bấm để nghe âm thanh</p>
          <p className="text-[11px] text-purple-700">
            {audioUrl ? 'Đang phát file ghi âm' : 'Đang sử dụng hệ thống phát âm AI'}
          </p>
        </div>
      </div>

      {/* Textarea Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nhập lại chính xác nội dung câu nghe được:
          </label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (isSubmitted) setIsSubmitted(false);
            }}
            placeholder="Gõ chữ Hán hoặc nội dung câu..."
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-medium outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => handleCheck(e as any)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Kiểm tra đáp án
          </button>

          {isSubmitted && (
            <div className="flex items-center gap-2 text-xs font-bold">
              {isCorrect ? (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Chính xác 100%!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Chưa chính xác.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
