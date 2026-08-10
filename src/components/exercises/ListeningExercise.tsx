import React, { useState } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { speakText } from '../../utils/tts';
import { getDriveAudioPlayerUrl } from '../../utils/audioUtils';

interface ListeningQuestionItem {
  question?: string;
  prompt?: string;
  text?: string;
  hanzi?: string;
  pinyin?: string;
  options?: string[];
  answer?: number | string;
  audioUrl?: string;
  audioPromptUrl?: string;
  explanation?: string;
}

interface ListeningExerciseProps {
  data: Record<string, unknown>;
}

export const ListeningExercise: React.FC<ListeningExerciseProps> = ({ data }) => {
  const title = typeof data.title === 'string' ? data.title : (typeof data.prompt === 'string' ? data.prompt : 'Bài tập luyện nghe:');
  const mainAudioUrl = typeof data.audioUrl === 'string' ? data.audioUrl : (typeof data.audioPromptUrl === 'string' ? data.audioPromptUrl : (typeof data.audio === 'string' ? data.audio : undefined));

  const questions = Array.isArray(data.questions) && data.questions.length > 0
    ? (data.questions as ListeningQuestionItem[])
    : null;

  const [isPlayingMainAudio, setIsPlayingMainAudio] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const handlePlayMainAudio = () => {
    if (mainAudioUrl) {
      const playableUrl = getDriveAudioPlayerUrl(mainAudioUrl);
      const audio = new Audio(playableUrl);
      setIsPlayingMainAudio(true);
      audio.onended = () => setIsPlayingMainAudio(false);
      audio.play().catch(() => setIsPlayingMainAudio(false));
    } else {
      setIsPlayingMainAudio(true);
      speakText(title, 'zh-CN');
      setTimeout(() => setIsPlayingMainAudio(false), 2000);
    }
  };

  if (questions) {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-indigo-200 space-y-4">
        {/* Audio & Header */}
        <div className="flex items-center gap-3 bg-indigo-50/90 border border-indigo-200 p-3.5 rounded-xl">
          <button
            type="button"
            onClick={handlePlayMainAudio}
            className={`p-3 rounded-full border shadow-xs transition cursor-pointer shrink-0 ${
              isPlayingMainAudio
                ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Nghe file âm thanh chính"
          >
            {isPlayingMainAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
              <Volume2 className="w-3 h-3" /> Bài tập nghe ({questions.length} câu)
            </span>
            <p className="text-xs font-bold text-slate-800">{title}</p>
          </div>
        </div>

        {/* List of questions */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const qPrompt = q.question || q.prompt || q.text || q.hanzi || `Câu hỏi ${qIdx + 1}`;
            const qOptions = Array.isArray(q.options) && q.options.length > 0
              ? q.options.map(String)
              : ['Đúng (正确)', 'Sai (错误)'];
            const selectedOpt = selectedAnswers[qIdx];

            return (
              <div key={qIdx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-indigo-600 mr-2">Câu {qIdx + 1}:</span>
                    <span className="font-bold text-slate-800 text-sm">{qPrompt}</span>
                    {q.pinyin && <p className="text-xs font-semibold text-indigo-600 font-mono pl-6">{q.pinyin}</p>}
                  </div>

                  {q.audioUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const playableUrl = getDriveAudioPlayerUrl(q.audioUrl);
                        const audio = new Audio(playableUrl);
                        audio.play().catch(() => {});
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shrink-0 cursor-pointer"
                      title="Nghe audio câu này"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {qOptions.map((opt, optIdx) => (
                    <button
                      type="button"
                      key={optIdx}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [qIdx]: optIdx
                        }))
                      }
                      className={`text-left p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        selectedOpt === optIdx
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback single question
  const prompt = typeof data.prompt === 'string' ? data.prompt : 'Nghe và chọn đáp án đúng:';
  const pinyin = typeof data.pinyin === 'string' ? data.pinyin : undefined;
  const options = Array.isArray(data.options) && data.options.length > 0
    ? data.options.map(String)
    : ['Đúng (正确)', 'Sai (错误)'];

  const [singleOpt, setSingleOpt] = useState<number | null>(null);

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
      <div className="flex items-center gap-3 bg-indigo-50/80 border border-indigo-100 p-3.5 rounded-xl">
        <button
          type="button"
          onClick={handlePlayMainAudio}
          className={`p-3 rounded-full border shadow-xs transition cursor-pointer shrink-0 ${
            isPlayingMainAudio
              ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
          title="Nghe file âm thanh"
        >
          {isPlayingMainAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
            <Volume2 className="w-3 h-3" /> Bài tập nghe
          </span>
          <p className="text-xs font-semibold text-slate-700">Bấm nút phát để nghe file âm thanh câu hỏi</p>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{prompt}</h4>
        {pinyin && <p className="text-xs font-semibold text-indigo-600 font-mono">{pinyin}</p>}
      </div>

      {options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {options.map((opt, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setSingleOpt(idx)}
              className={`text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                singleOpt === idx
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
