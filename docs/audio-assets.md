# Audio asset checklist – HSK 1 Mock 01

Hiện trạng ban đầu: **chưa có MP3**. Không tạo file rỗng và không dùng browser TTS thay thế.

| File cần có | Câu | Trạng thái |
|---|---:|---|
| `/audio/hsk1-mock-01/q01.mp3` … `/audio/hsk1-mock-01/q05.mp3` | 1–5 | Chờ giáo viên bổ sung |
| `/audio/hsk1-mock-01/q06.mp3` … `/audio/hsk1-mock-01/q10.mp3` | 6–10 | Chờ giáo viên bổ sung |
| `/audio/hsk1-mock-01/q11.mp3` … `/audio/hsk1-mock-01/q15.mp3` | 11–15 | Chờ giáo viên bổ sung |
| `/audio/hsk1-mock-01/q16.mp3` … `/audio/hsk1-mock-01/q20.mp3` | 16–20 | Chờ giáo viên bổ sung |

Sau khi đặt audio thật, kiểm tra tối thiểu:

```bash
find public/audio/hsk1-mock-01 -name '*.mp3' -type f -size +0c | sort
```

Phải có đúng 20 file, mỗi file lớn hơn 0 byte. Nếu upload qua Teacher mode, dùng trường `audio` ở từng item/câu để thay file, nghe thử, thay lại hoặc gỡ file; giữ transcript, script và `correctAnswer` nguyên vẹn.
