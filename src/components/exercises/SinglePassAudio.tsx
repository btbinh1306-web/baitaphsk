import React, { useRef, useState } from 'react';

type Progress = { position: number; started: boolean; ended: boolean };
const empty: Progress = { position: 0, started: false, ended: false };
export function readAudioProgress(key: string): Progress {
  const value = JSON.parse(localStorage.getItem(key) || 'null');
  return value && Number.isFinite(value.position) && value.position >= 0
    ? { position: value.position, started: value.started === true, ended: value.ended === true }
    : { ...empty };
}
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** One continuous play per saved submission, with resume only after interruption. */
const SinglePassAudio: React.FC<{ src: string; audioKey: string }> = ({ src, audioKey }) => {
  const key = `hsk-single-pass:${audioKey}`;
  const [progress, setProgress] = useState<Progress>(() => {
    try { return readAudioProgress(key); } catch { return { ...empty }; }
  });
  const position = useRef(progress.position);
  const audio = useRef<HTMLAudioElement>(null);
  const busy = useRef(false);
  const restored = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const save = (next: Progress) => {
    localStorage.setItem(key, JSON.stringify(next));
    setProgress(next);
  };
  const start = async () => {
    if (!audio.current || busy.current || playing || progress.ended) return;
    busy.current = true;
    setError('');
    try {
      const saved = readAudioProgress(key);
      if (saved.ended) { setProgress(saved); return; }
      position.current = Math.max(position.current, saved.position);
      // Verify persistence before playing; a storage failure must not grant a replay.
      save({ position: position.current, started: true, ended: false });
      if (audio.current.readyState >= 1) {
        restored.current = false;
        audio.current.currentTime = position.current;
        restored.current = true;
      }
      audio.current.playbackRate = 1;
      await audio.current.play();
      setPlaying(true);
    } catch {
      setError('Không thể phát hoặc lưu tiến độ. Kiểm tra kết nối và quyền lưu dữ liệu rồi bấm tiếp tục.');
    } finally { busy.current = false; }
  };
  return <div className="space-y-2" data-single-pass-audio>
    <audio ref={audio} src={src} preload="metadata" playsInline
      onLoadedMetadata={() => {
        const element = audio.current!;
        setDuration(Number.isFinite(element.duration) ? element.duration : 0);
        element.currentTime = Math.min(position.current, element.duration || position.current);
        restored.current = true;
      }}
      onSeeking={() => {
        const element = audio.current!;
        if (restored.current && Math.abs(element.currentTime - position.current) > 0.25) element.currentTime = position.current;
      }}
      onRateChange={() => { if (audio.current && audio.current.playbackRate !== 1) audio.current.playbackRate = 1; }}
      onTimeUpdate={() => {
        const element = audio.current!;
        if (!restored.current || element.seeking || element.paused || progress.ended) return;
        position.current = Math.max(position.current, element.currentTime);
        try { save({ position: position.current, started: true, ended: false }); }
        catch { element.pause(); setError('Không lưu được tiến độ nghe. Vui lòng kiểm tra quyền lưu dữ liệu.'); }
      }}
      onPause={() => setPlaying(false)}
      onEnded={() => {
        setPlaying(false);
        try { save({ position: audio.current!.duration, started: true, ended: true }); }
        catch { setProgress(p => ({ ...p, ended: true })); setError('Không lưu được trạng thái kết thúc.'); }
      }}
      onError={() => { setPlaying(false); setError('Chưa tải được file nghe. Kiểm tra kết nối rồi thử tiếp tục.'); }}
    />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" disabled={playing || progress.ended} onClick={start}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {progress.ended ? 'Đã nghe xong' : playing ? 'Đang phát bài nghe' : progress.started ? 'Tiếp tục bài nghe' : 'Phát bài nghe'}
      </button>
      <span className="text-sm tabular-nums" aria-live="off">{clock(progress.position)} / {clock(duration)}</span>
    </div>
    <progress className="w-full accent-teal-600" aria-label="Tiến độ nghe" max={duration || 1} value={progress.position} />
    <p className="text-xs text-slate-600">Một lượt nghe · Không tua · Tốc độ 1×</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
};
export default SinglePassAudio;
