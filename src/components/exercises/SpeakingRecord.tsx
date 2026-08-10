import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Volume2, CheckCircle2 } from 'lucide-react';
import { speakText } from '../../utils/tts';

interface ItemData {
  prompt?: string;
  text?: string;
  hanzi?: string;
  pinyin?: string;
  meaning?: string;
  audioUrl?: string;
}

interface SpeakingItemProps {
  item: string | ItemData;
  index: number;
  parentAudioUrl?: string;
}

const SpeakingItemRow: React.FC<SpeakingItemProps> = ({ item, index, parentAudioUrl }) => {
  const isString = typeof item === 'string';
  const prompt = isString ? item : (item.prompt || item.text || item.hanzi || `Mục ${index + 1}`);
  const pinyin = !isString ? item.pinyin : undefined;
  const meaning = !isString ? item.meaning : undefined;
  const itemAudioUrl = !isString && item.audioUrl ? item.audioUrl : parentAudioUrl;

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingRecord, setIsPlayingRecord] = useState(false);
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPrompt = () => {
    if (itemAudioUrl) {
      const audio = new Audio(itemAudioUrl);
      setIsPlayingPrompt(true);
      audio.onended = () => setIsPlayingPrompt(false);
      audio.play().catch(() => setIsPlayingPrompt(false));
    } else {
      setIsPlayingPrompt(true);
      speakText(prompt, 'zh-CN');
      setTimeout(() => setIsPlayingPrompt(false), 2000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập Micro. Vui lòng cho phép quyền ghi âm.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecord = () => {
    if (audioBlobUrl) {
      if (recordAudioRef.current) {
        recordAudioRef.current.pause();
      }
      const audio = new Audio(audioBlobUrl);
      recordAudioRef.current = audio;
      setIsPlayingRecord(true);
      audio.onended = () => setIsPlayingRecord(false);
      audio.play();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white rounded-xl border border-rose-100 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div>
            <h5 className="font-bold text-slate-800 text-base sm:text-lg">{prompt}</h5>
            {pinyin && <p className="text-xs font-semibold text-rose-600 font-mono">{pinyin}</p>}
            {meaning && <p className="text-xs text-slate-500 italic">{meaning}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlayPrompt}
          className={`p-2 rounded-lg border transition cursor-pointer shrink-0 ${
            isPlayingPrompt
              ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
          title="Nghe mẫu phát âm"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" /> Ghi âm
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 text-rose-400" /> Dừng
          </button>
        )}

        {audioBlobUrl && !isRecording && (
          <button
            type="button"
            onClick={playRecord}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer ${
              isPlayingRecord
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> {isPlayingRecord ? 'Đang phát...' : 'Nghe lại'}
          </button>
        )}

        {audioBlobUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-auto">
            <CheckCircle2 className="w-3 h-3" /> Đã ghi âm
          </span>
        )}
      </div>
    </div>
  );
};

export interface SpeakingRecordProps {
  data: Record<string, unknown>;
}

export const SpeakingRecord: React.FC<SpeakingRecordProps> = ({ data }) => {
  const title = typeof data.title === 'string' ? data.title : (typeof data.prompt === 'string' ? data.prompt : undefined);
  const items = Array.isArray(data.items) && data.items.length > 0 ? (data.items as (string | ItemData)[]) : null;

  if (items) {
    return (
      <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/60 to-orange-50/40 rounded-xl border border-rose-200/80 space-y-3">
        <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
          <div>
            <span className="inline-block text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded mb-1">
              🎙️ Luyện nói & Ghi âm ({items.length} từ / câu)
            </span>
            {title && <h4 className="font-bold text-slate-800 text-base">{title}</h4>}
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {items.map((item, idx) => (
            <SpeakingItemRow key={idx} item={item} index={idx} parentAudioUrl={typeof data.audioUrl === 'string' ? data.audioUrl : undefined} />
          ))}
        </div>
      </div>
    );
  }

  // Fallback single item
  const singleItem: ItemData = {
    prompt: typeof data.prompt === 'string' ? data.prompt : (typeof data.text === 'string' ? data.text : (typeof data.hanzi === 'string' ? data.hanzi : 'Luyện nói câu sau:')),
    pinyin: typeof data.pinyin === 'string' ? data.pinyin : undefined,
    meaning: typeof data.meaning === 'string' ? data.meaning : undefined,
    audioUrl: typeof data.audioUrl === 'string' ? data.audioUrl : undefined
  };

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/60 to-orange-50/40 rounded-xl border border-rose-200/80 space-y-3">
      <span className="inline-block text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
        🎙️ Luyện nói & Ghi âm
      </span>
      <SpeakingItemRow item={singleItem} index={0} />
    </div>
  );
};
