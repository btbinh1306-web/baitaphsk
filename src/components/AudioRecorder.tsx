import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2, AlertCircle, Volume2, Upload, ExternalLink } from 'lucide-react';
import { AudioRecordItem } from '../types';
import { speakText } from '../utils/tts';

interface AudioRecorderProps {
  label: string;
  pinyin?: string;
  comment?: string;
  onCommentChange?: (val: string) => void;
  onAudioRecorded: (record: AudioRecordItem | null) => void;
  showAudioSample?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  label,
  comment,
  onCommentChange,
  onAudioRecorded,
  showAudioSample = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ MediaDevices.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks in stream to release mic
        stream.getTracks().forEach((track) => track.stop());

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          // Extract base64 part after comma
          const base64Clean = base64Data.split(',')[1] || '';
          onAudioRecorded({
            label,
            data: base64Clean,
            mime: mimeType,
            duration: recordingTime,
            url
          });
        };
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setErrorMsg(
        'Không thể mở micro (Do chưa cấp quyền hoặc môi trường iFrame bị giới hạn). Bạn có thể mở ở Tab Mới hoặc tải file âm thanh lên.'
      );
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const mimeType = file.type || 'audio/webm';
    setAudioBlob(file);

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setRecordingTime(0);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Clean = base64Data.split(',')[1] || '';
      onAudioRecorded({
        label,
        data: base64Clean,
        mime: mimeType,
        duration: 0,
        url
      });
    };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleClearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    onAudioRecorded(null);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm sm:text-base">{label}</span>
            {showAudioSample && (
              <button
                type="button"
                onClick={() => speakText(label.replace(/^Câu \d+:\s*/, ''))}
                title="Nghe mẫu phát âm"
                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {audioBlob && (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã ghi âm / Tải file xong {recordingTime > 0 ? `(${formatTime(recordingTime)})` : ''}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="space-y-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="inline-flex items-center gap-1 bg-white border border-rose-300 text-rose-800 px-2.5 py-1 rounded-md font-semibold text-[11px] hover:bg-rose-100 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở ở Tab Mới
            </button>
            <label className="inline-flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1 rounded-md font-semibold text-[11px] hover:bg-rose-700 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Tải File Âm Thanh
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                Bắt đầu ghi âm
              </button>

              <label className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs px-3 py-2.5 rounded-lg transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Tải File Âm Thanh
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                Dừng ghi âm ({formatTime(recordingTime)})
              </button>

              <div className="flex items-center gap-1.5 flex-1 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-medium text-rose-700">Đang thu âm...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Tạm dừng' : 'Nghe lại ghi âm'}
          </button>

          {audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          <div className="flex-1 text-xs text-slate-500 font-mono text-center sm:text-left">
            {recordingTime > 0 ? `Thời lượng: ${formatTime(recordingTime)}` : 'File âm thanh đã tải lên'}
          </div>

          <button
            type="button"
            onClick={handleClearRecording}
            className="inline-flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-md transition cursor-pointer"
            title="Xóa và ghi âm lại"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Thu âm lại
          </button>
        </div>
      )}

      {/* Per-question comment section */}
      {(comment !== undefined || onCommentChange) && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/80">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nhận xét cho câu này:
          </label>
          <input
            type="text"
            value={comment || ''}
            onChange={(e) => onCommentChange && onCommentChange(e.target.value)}
            placeholder="Ghi nhận xét cho câu ghi âm này..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      )}
    </div>
  );
};

