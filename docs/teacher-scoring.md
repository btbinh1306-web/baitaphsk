# Quy ước chấm điểm giáo viên

- Câu khách quan (trắc nghiệm, nghe, đọc, điền, sắp xếp) lấy trạng thái từng câu trong `answerSnapshot`. `unanswered` luôn là 0 điểm và không bao giờ được tính là đúng.
- Câu tự luận, dịch và ghi âm do giáo viên tự đánh giá; giáo viên nhập trực tiếp điểm tổng kết vào cổng giáo viên.
- Câu học sinh không làm được không được tự tính là đúng; điểm tổng kết chỉ thay đổi khi giáo viên nhập và lưu điểm.
- Bài HSK1 bài 1–15 và bài tổng hợp vẫn hiển thị điểm trắc nghiệm tự động để tham khảo, nhưng điểm tổng kết do giáo viên tự nhập; hệ thống không tự cộng trọng số giữa trắc nghiệm, tự luận và nói.
- Các đề thi thử `HSK 1 (3.0)` dùng thang riêng `200`: phần `Nghe` 100 điểm và phần `Đọc` 100 điểm. Điểm mỗi phần được chia đều theo số câu thực tế của phần đó; câu sai hoặc bỏ trống nhận 0 điểm. Quy tắc này áp dụng giống nhau ở trang học sinh, danh sách bài nộp và màn hình giáo viên.
- Hệ thống không tự quy đổi hoặc cộng trọng số điểm tự luận/nói; giáo viên nhập điểm cuối cùng vào ô điểm tổng kết.
- `combinedKnowledgePoints` chỉ là thông tin kiến thức, không phải điểm.
- Bài nộp chữ Hán/chép tay (`handwriting_submission`, hoặc tiêu đề có “chép tay”/“nộp chữ Hán”) nằm ngoài tổng điểm.
- Dữ liệu điểm tổng kết tiếp tục được lưu ở cột điểm giáo viên hiện có để tương thích với local, server và Google Sheet.
