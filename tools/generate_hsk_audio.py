#!/usr/bin/env python3
"""Generate one two-pass MP3 per listening sentence."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path


LESSONS: dict[str, list[str]] = {
    "HSK1_B06": [
        "我的手机号是幺八五幺六八九三七九幺。",
        "我下午去超市买东西。",
        "我想喝牛奶。",
        "我坐出租车去店里。",
        "晚饭我想吃包子。",
    ],
    "HSK1_B07": [
        "现在七点半。",
        "我晚上六点半下班。",
        "我下午两点半上课。",
        "我们下午四点见吧。",
        "中午十二点吃午饭。",
    ],
    "HSK1_B08": [
        "小猫在桌子下。",
        "我有一只小狗。",
        "爸爸在医院工作。",
        "她能说汉语。",
        "我家的小猫很漂亮。",
    ],
    "HSK1_B09": [
        "椅子上有一本书。",
        "妹妹想看电视。",
        "我会说中文。",
        "我喜欢和小狗玩。",
        "她会唱歌。",
    ],
    "HSK1_B10": [
        "苹果一斤三块五。",
        "这个杯子太小了。",
        "这家商店的水果很便宜。",
        "这件衣服一百元。",
        "我不想穿这件衣服。",
    ],
    "HSK1_B11": [
        "我正在学习中文呢。",
        "弟弟还在睡觉。",
        "爸爸正在开车。",
        "我要回家。",
        "我还在上班。",
    ],
    "HSK1_B12": [
        "今天下雨了。",
        "我觉得有点儿冷。",
        "我生病了，要去看病。",
        "吃了饭再回家吧。",
        "弟弟病了，我去买药。",
    ],
    "HSK1_B13": [
        "请给我一杯茶。",
        "先生，您好！",
        "我可以问一下吗？",
        "早饭有两个鸡蛋。",
        "我想找一下这里的服务员。",
    ],
    "HSK1_B14": [
        "昨天我看了一个电影。",
        "我写了几个汉字。",
        "我和弟弟说了很多话。",
        "我们都很高兴。",
        "我吃了饭。",
    ],
    "HSK1_B15": [
        "去年我去了西安。",
        "我们坐飞机去北京。",
        "我去机场接朋友。",
        "下雨了，那我们在家吧。",
        "我们坐飞机要两个小时。",
    ],
    "HSK1_TongHop_06-10": [
        "我的手机号是幺三八五幺八九七六二三。",
        "下午我去超市买水果。",
        "下午两点半上课。",
        "苹果一斤三块五。",
        "我们坐出租车去超市。",
    ],
    "HSK1_TongHop_10-15": [
        "今天下雨了，天气有点儿冷。",
        "请给我一杯茶和一块面包。",
        "回家后，我写了几个字。",
        "明天我们去机场接朋友。",
        "明天我和家人坐飞机。",
    ],
    "HSK2_B01": [
        "出发前，王老师给她姐姐王一雪打了电话。",
        "我和安妮第一次来北京旅游。",
        "王一雪请我们吃了地道的北京烤鸭。",
        "我已经在北京了，没法过去。",
        "那我建议他去找李文，李文一定会帮他。",
    ],
}


def expand_lessons() -> dict[str, list[str]]:
    result = dict(LESSONS)
    result["HSK1_TongHop_06-15"] = [
        sentence
        for lesson in [f"HSK1_B{i:02d}" for i in range(6, 16)]
        for sentence in LESSONS[lesson]
    ]
    return result


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def render_sentence(text: str, target: Path, voice: str, temp_dir: Path) -> None:
    first_mp3 = temp_dir / "first.mp3"
    second_mp3 = temp_dir / "second.mp3"
    first_wav = temp_dir / "first.wav"
    second_wav = temp_dir / "second.wav"
    joined_wav = temp_dir / "joined.wav"

    for output, rate in ((first_mp3, "-15%"), (second_mp3, "-5%")):
        run([
            "edge-tts",
            "--voice",
            voice,
            "--rate",
            rate,
            "--text",
            text,
            "--write-media",
            str(output),
        ])

    for source, output in ((first_mp3, first_wav), (second_mp3, second_wav)):
        run([
            "/usr/bin/afconvert",
            "-f",
            "WAVE",
            "-d",
            "LEI16@24000",
            "-c",
            "1",
            str(source),
            str(output),
        ])

    with wave.open(str(first_wav), "rb") as first, wave.open(str(second_wav), "rb") as second:
        params = first.getparams()
        if second.getparams()[:3] != params[:3]:
            raise RuntimeError(f"TTS WAV format mismatch for: {text}")
        silence_frames = int(params.framerate * 1.5)
        silence = b"\0" * silence_frames * params.nchannels * params.sampwidth
        with wave.open(str(joined_wav), "wb") as joined:
            joined.setparams(params)
            joined.writeframes(first.readframes(first.getnframes()))
            joined.writeframes(silence)
            joined.writeframes(second.readframes(second.getnframes()))

    # macOS afconvert does not encode MP3, so ffmpeg is intentionally required here.
    run([
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(joined_wav),
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "48k",
        str(target),
    ])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True, help="Explicit edge-tts voice; no reference-voice cloning")
    parser.add_argument("--output", type=Path, default=Path("audio"))
    args = parser.parse_args()

    if shutil.which("edge-tts") is None:
        raise SystemExit("Thiếu edge-tts. Cài bằng: python3 -m pip install edge-tts")
    if shutil.which("ffmpeg") is None:
        raise SystemExit("Thiếu ffmpeg. Cài bằng: brew install ffmpeg")

    output = args.output.resolve()
    manifest_path = output / "manifest.json"
    if manifest_path.exists():
        raise SystemExit(f"Đã có {manifest_path}; đổi --output hoặc sao lưu manifest trước, không ghi đè.")

    output.mkdir(parents=True, exist_ok=True)
    entries = []
    lessons = expand_lessons()
    with tempfile.TemporaryDirectory(prefix="hsk-audio-") as temp_name:
        temp_dir = Path(temp_name)
        for lesson, sentences in lessons.items():
            lesson_dir = output / lesson
            lesson_dir.mkdir(exist_ok=True)
            for number, text in enumerate(sentences, start=1):
                filename = f"{lesson}_{number:02d}.mp3"
                target = lesson_dir / filename
                if not target.exists():
                    render_sentence(text, target, args.voice, temp_dir)
                if target.stat().st_size == 0:
                    raise RuntimeError(f"File rỗng: {target}")
                entries.append({
                    "lesson": lesson,
                    "questionNumber": number,
                    "text": text,
                    "audioFile": f"{lesson}/{filename}",
                })

    manifest_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    expected = sum(len(sentences) for sentences in lessons.values())
    actual = sum(1 for entry in entries if (output / entry["audioFile"]).is_file())
    if actual != expected or len(entries) != expected:
        raise RuntimeError(f"Kiểm tra thất bại: expected={expected}, entries={len(entries)}, files={actual}")
    print(f"Đã kiểm tra: {actual} MP3, {len(entries)} mục manifest, không có file rỗng.")


if __name__ == "__main__":
    main()
