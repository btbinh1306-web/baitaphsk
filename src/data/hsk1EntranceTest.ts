import { ExamLesson, Question } from '../types';

const multipleChoice = (id: string, prompt: string, options: string[], answer: number, maxScore?: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer,
  ...(maxScore ? { maxScore } : {})
});

const fillQuestion = (id: string, prompt: string, answer: string, wordBank: string[], maxScore?: number): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  wordBank,
  answer,
  acceptableAnswers: answer,
  ...(maxScore ? { maxScore } : {})
});

const arrangeQuestion = (id: string, prompt: string, wordChips: string[], acceptableAnswers: string, maxScore?: number): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips,
  acceptableAnswers,
  ...(maxScore ? { maxScore } : {})
});

const listeningQuestion = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  audioUrl: string,
  audioText?: string,
  maxScore?: number
): Question => ({
  id,
  type: 'listening_mc',
  tier: 'tier2',
  prompt,
  options,
  answer,
  audioUrl,
  ...(audioText ? { audioText } : {}),
  ...(maxScore ? { maxScore } : {})
});

const essayQuestion = (id: string, prompt: string, suggestedAnswer: string, maxScore?: number): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  ...(maxScore ? { maxScore } : {})
});

const speakingQuestion = (
  id: string,
  prompt: string,
  pinyin: string,
  taskGroup = 'reading_aloud',
  taskGroupTitle = 'Đọc thành tiếng – ghi âm',
  maxScore?: number
): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin,
  taskGroup,
  taskGroupTitle,
  teacherReviewRequired: true,
  ...(maxScore ? { maxScore } : {})
});

const translationQuestion = (
  id: string,
  prompt: string,
  translationType: 'vi_to_zh_audio' | 'vi_to_zh_text',
  suggestedAnswer: string,
  maxScore?: number
): Question => ({
  id,
  type: 'translation',
  translationType,
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  ...(maxScore ? { maxScore } : {})
});

const wordBank = ['谁', '没有', '会', '两', '星期', '有', '今年', '喜欢'];

// 15 câu trắc nghiệm này giữ nguyên nội dung phần trắc nghiệm của đề
// “HSK1 Bài 1–5 (Đủ 5 kỹ năng)” đang dùng trong hệ thống.
const copiedMultipleChoice: Question[] = [
  multipleChoice('hsk1_entry_mc_01', 'Nối từ với nghĩa phù hợp: 老师', ['A. nghỉ ngơi', 'B. giáo viên', 'C. tên', 'D. bạn bè', 'E. sủi cảo'], 1),
  multipleChoice('hsk1_entry_mc_02', 'Nối từ với nghĩa phù hợp: 名字', ['A. nghỉ ngơi', 'B. giáo viên', 'C. tên', 'D. bạn bè', 'E. sủi cảo'], 2),
  multipleChoice('hsk1_entry_mc_03', 'Nối từ với nghĩa phù hợp: 朋友', ['A. nghỉ ngơi', 'B. giáo viên', 'C. tên', 'D. bạn bè', 'E. sủi cảo'], 3),
  multipleChoice('hsk1_entry_mc_04', 'Nối từ với nghĩa phù hợp: 休息', ['A. nghỉ ngơi', 'B. giáo viên', 'C. tên', 'D. bạn bè', 'E. sủi cảo'], 0),
  multipleChoice('hsk1_entry_mc_05', 'Nối từ với nghĩa phù hợp: 饺子', ['A. nghỉ ngơi', 'B. giáo viên', 'C. tên', 'D. bạn bè', 'E. sủi cảo'], 4),
  multipleChoice('hsk1_entry_mc_06', '“Tôi là học sinh” nói thế nào?', ['我是学生。', '我叫学生。', '我有学生。'], 0),
  multipleChoice('hsk1_entry_mc_07', 'A：谢谢您！ B：______', ['对不起！', '不客气！', '没事吗？'], 1),
  multipleChoice('hsk1_entry_mc_08', '你______名字？', ['什么叫', '叫什么', '叫谁'], 1),
  multipleChoice('hsk1_entry_mc_09', '王老师______中国人。', ['有', '是', '会'], 1),
  multipleChoice('hsk1_entry_mc_10', '“Giáo viên tiếng Trung của tôi” là:', ['我中文老师', '我的中文老师', '中文我的老师'], 1),
  multipleChoice('hsk1_entry_mc_11', '你是哪______人？', ['个', '国', '口'], 1),
  multipleChoice('hsk1_entry_mc_12', '你家有______人？', ['几口', '多少口个', '几个口'], 0),
  multipleChoice('hsk1_entry_mc_13', '我有______姐姐。', ['二个', '两个', '两'], 1),
  multipleChoice('hsk1_entry_mc_14', '今天______8月12号。', ['有', '叫', '是'], 2),
  multipleChoice('hsk1_entry_mc_15', '我喜欢______中国菜。', ['吃', '叫', '是'], 0)
];

const copiedReadingMultipleChoice: Question[] = [
  multipleChoice('hsk1_entry_read_mc_01', '你叫什么名字？', ['今天是八月十二号。', '我叫李文。', '会，我会说汉语。', '我是越南人。', '我家有四口人。'], 1),
  multipleChoice('hsk1_entry_read_mc_02', '你是哪国人？', ['今天是八月十二号。', '我叫李文。', '会，我会说汉语。', '我是越南人。', '我家有四口人。'], 3),
  multipleChoice('hsk1_entry_read_mc_03', '你家有几口人？', ['今天是八月十二号。', '我叫李文。', '会，我会说汉语。', '我是越南人。', '我家有四口人。'], 4),
  multipleChoice('hsk1_entry_read_mc_04', '今天是几月几号？', ['今天是八月十二号。', '我叫李文。', '会，我会说汉语。', '我是越南人。', '我家有四口人。'], 0),
  multipleChoice('hsk1_entry_read_mc_05', '你会说汉语吗？', ['今天是八月十二号。', '我叫李文。', '会，我会说汉语。', '我是越南人。', '我家有四口人。'], 2)
];

const fillQuestions: Question[] = [
  fillQuestion('hsk1_entry_fill_01', '你家有几口人？——我家有（    ）口人。', '两', wordBank),
  fillQuestion('hsk1_entry_fill_02', '今天是（    ）三。', '星期', wordBank),
  fillQuestion('hsk1_entry_fill_03', '他（    ）说汉语。', '会', wordBank),
  fillQuestion('hsk1_entry_fill_04', '她是（    ）？——她是我的中文老师。', '谁', wordBank),
  fillQuestion('hsk1_entry_fill_05', '我（    ）哥哥，我有一个妹妹。', '没有', wordBank),
  fillQuestion('hsk1_entry_fill_06', '我（    ）一个姐姐。', '有', wordBank),
  fillQuestion('hsk1_entry_fill_07', '（    ）是2026年。', '今年', wordBank),
  fillQuestion('hsk1_entry_fill_08', '我（    ）吃中国菜。', '喜欢', wordBank)
];

const arrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_entry_arrange_01', 'Sắp xếp từ thành câu đúng: 有 / 几 / 你家 / 口 / 人', ['有', '几', '你家', '口', '人', '？'], '你家有几口人？|你家有几口人'),
  arrangeQuestion('hsk1_entry_arrange_02', 'Sắp xếp từ thành câu đúng: 今天 / 星期 / 是 / 几', ['今天', '星期', '是', '几', '？'], '今天是星期几？|今天是星期几'),
  arrangeQuestion('hsk1_entry_arrange_03', 'Sắp xếp từ thành câu đúng: 我的 / 她 / 中文老师 / 是', ['我的', '她', '中文老师', '是', '。'], '她是我的中文老师。|她是我的中文老师'),
  arrangeQuestion('hsk1_entry_arrange_04', 'Sắp xếp từ thành câu đúng: 你 / 有 / 几个 / 朋友', ['你', '有', '几个', '朋友', '？'], '你有几个朋友？|你有几个朋友'),
  arrangeQuestion('hsk1_entry_arrange_05', 'Sắp xếp từ thành câu đúng: 叫 / 我 / 李文', ['叫', '我', '李文', '。'], '我叫李文。|我叫李文')
];

const listeningQuestions: Question[] = [
  listeningQuestion('hsk1_entry_listen_01', 'Bạn nghe thấy số nào?', ['12', '20', '22'], 2, '/audio/hsk1_aggregate_0105/q01.mp3'),
  listeningQuestion('hsk1_entry_listen_02', 'Bạn nghe thấy ngày nào?', ['8月8号', '8月18号', '9月8号'], 1, '/audio/hsk1_aggregate_0105/q02.mp3'),
  listeningQuestion('hsk1_entry_listen_03', 'Người nói là ai?', ['老师', '学生', '朋友'], 1, '/audio/hsk1_aggregate_0105/q03.mp3'),
  listeningQuestion('hsk1_entry_listen_04', 'Người nói có anh trai không?', ['有', '没有', 'Không nói'], 1, '/audio/hsk1_aggregate_0105/q04.mp3'),
  listeningQuestion('hsk1_entry_listen_05', 'Hôm nay là thứ mấy?', ['星期一', '星期三', '星期五'], 1, '/audio/hsk1_aggregate_0105/q05.mp3'),
  listeningQuestion('hsk1_entry_listen_06', 'Chọn câu trả lời đúng.', ['她是我姐姐。', '她叫安妮。', '她二十岁。'], 0, '/audio/hsk1_aggregate_0105/q06.mp3'),
  listeningQuestion('hsk1_entry_listen_07', 'Chọn câu trả lời đúng.', ['我家有四口人。', '我有四本书。', '我叫李文。'], 0, '/audio/hsk1_aggregate_0105/q07.mp3'),
  listeningQuestion('hsk1_entry_listen_08', 'Chọn câu trả lời đúng.', ['今天是8月12号。', '今天星期三吗？', '明天我休息。'], 0, '/audio/hsk1_aggregate_0105/q08.mp3'),
  listeningQuestion('hsk1_entry_listen_09', 'Chọn câu trả lời đúng.', ['会，我会说一点儿汉语。', '我是汉语老师。', '我喜欢汉语。'], 0, '/audio/hsk1_aggregate_0105/q09.mp3'),
  listeningQuestion('hsk1_entry_listen_10', '王月家有几口人？', ['三口人', '四口人', '五口人'], 1, '/audio/hsk1_aggregate_0105/q10.mp3')
];

const essayQuestions: Question[] = [
  essayQuestion('hsk1_entry_essay_01', 'Viết chữ Hán theo Pinyin: lǎoshī (giáo viên)', '老师'),
  essayQuestion('hsk1_entry_essay_02', 'Viết chữ Hán theo Pinyin: míngzi (tên)', '名字'),
  essayQuestion('hsk1_entry_essay_03', 'Viết chữ Hán theo Pinyin: péngyou (bạn bè)', '朋友'),
  essayQuestion('hsk1_entry_essay_04', 'Trả lời bằng câu tiếng Trung hoàn chỉnh: 你家有几口人？', '我家有四口人。')
];

const speakingQuestions: Question[] = [
  speakingQuestion('hsk1_entry_speak_01', 'Đọc thành tiếng: 大家好！我是学生。', 'Dàjiā hǎo! Wǒ shì xuésheng.'),
  speakingQuestion('hsk1_entry_speak_02', 'Đọc thành tiếng: 我叫李文，很高兴认识你。', 'Wǒ jiào Lǐ Wén, hěn gāoxìng rènshi nǐ.'),
  speakingQuestion('hsk1_entry_speak_03', 'Đọc thành tiếng: 我是越南人。', 'Wǒ shì Yuènán rén.'),
  speakingQuestion('hsk1_entry_speak_04', 'Đọc thành tiếng: 我家有四口人。', 'Wǒ jiā yǒu sì kǒu rén.'),
  speakingQuestion('hsk1_entry_speak_05', 'Đọc thành tiếng: 我今年二十岁。', 'Wǒ jīnnián èrshí suì.'),
  speakingQuestion('hsk1_entry_speak_06', 'Đọc thành tiếng: 我是学生，我会说一点儿汉语。', 'Wǒ shì xuésheng, wǒ huì shuō yìdiǎnr Hànyǔ.'),
  speakingQuestion('hsk1_entry_speak_07', 'Đọc thành tiếng: 今天是星期三，明天我休息。', 'Jīntiān shì xīngqīsān, míngtiān wǒ xiūxi.'),
  speakingQuestion('hsk1_entry_speak_08', 'Đọc thành tiếng: 这是我的中文老师。', 'Zhè shì wǒ de Zhōngwén lǎoshī.')
];

const translationQuestions: Question[] = [
  translationQuestion('hsk1_entry_write_01', 'Dịch sang tiếng Trung bằng chữ Hán: Tôi tên là Minh.', 'vi_to_zh_text', '我叫明。'),
  translationQuestion('hsk1_entry_write_02', 'Dịch sang tiếng Trung bằng chữ Hán: Cô ấy là người Việt Nam.', 'vi_to_zh_text', '她是越南人。'),
  translationQuestion('hsk1_entry_write_03', 'Dịch sang tiếng Trung bằng chữ Hán: Nhà tôi có bốn người.', 'vi_to_zh_text', '我家有四口人。'),
  translationQuestion('hsk1_entry_write_04', 'Dịch sang tiếng Trung bằng chữ Hán: Hôm nay là thứ Tư.', 'vi_to_zh_text', '今天是星期三。'),
  translationQuestion('hsk1_entry_oral_01', 'Ghi âm nói tiếng Trung: Bạn tên là gì?', 'vi_to_zh_audio', '你叫什么名字？'),
  translationQuestion('hsk1_entry_oral_02', 'Ghi âm nói tiếng Trung: Bạn là người nước nào?', 'vi_to_zh_audio', '你是哪国人？'),
  translationQuestion('hsk1_entry_oral_03', 'Ghi âm nói tiếng Trung: Nhà bạn có mấy người?', 'vi_to_zh_audio', '你家有几口人？'),
  translationQuestion('hsk1_entry_oral_04', 'Ghi âm nói tiếng Trung: Bạn năm nay bao nhiêu tuổi?', 'vi_to_zh_audio', '你今年多大？')
];

const pinyinSpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_entry_pinyin_syllable_01', 'Đọc âm tiết và ghi âm: mā', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_02', 'Đọc âm tiết và ghi âm: nǐ', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_03', 'Đọc âm tiết và ghi âm: hǎo', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_04', 'Đọc âm tiết và ghi âm: xué', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_05', 'Đọc âm tiết và ghi âm: shēng', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_06', 'Đọc âm tiết và ghi âm: guó', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_07', 'Đọc âm tiết và ghi âm: jiā', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_08', 'Đọc âm tiết và ghi âm: rén', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_09', 'Đọc âm tiết và ghi âm: yuè', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_syllable_10', 'Đọc âm tiết và ghi âm: nián', '', 'pinyin_pronunciation', 'Phần 1A – Đọc âm tiết (ghi âm)', 0.5),
  speakingQuestion('hsk1_entry_pinyin_phrase_01', 'Đọc từ/cụm từ và ghi âm: 你好', 'nǐ hǎo', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_02', 'Đọc từ/cụm từ và ghi âm: 我叫……', 'wǒ jiào……', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_03', 'Đọc từ/cụm từ và ghi âm: 我是越南人', 'wǒ shì Yuènán rén', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_04', 'Đọc từ/cụm từ và ghi âm: 你几岁', 'nǐ jǐ suì', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_05', 'Đọc từ/cụm từ và ghi âm: 我家有五个人', 'wǒ jiā yǒu wǔ ge rén', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_06', 'Đọc từ/cụm từ và ghi âm: 今年', 'jīnnián', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_07', 'Đọc từ/cụm từ và ghi âm: 生日', 'shēngrì', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625),
  speakingQuestion('hsk1_entry_pinyin_phrase_08', 'Đọc từ/cụm từ và ghi âm: 学生', 'xuésheng', 'pinyin_phrase', 'Phần 1B – Đọc từ/cụm từ (ghi âm)', 0.625)
];

const vocabularyPinyinWritingQuestions: Question[] = [
  essayQuestion('hsk1_entry_vocab_pinyin_01', 'Nhìn Pinyin, viết nghĩa tiếng Việt: wǒ', 'tôi', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_02', 'Nhìn Pinyin, viết nghĩa tiếng Việt: nǐ', 'bạn', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_03', 'Nhìn Pinyin, viết nghĩa tiếng Việt: jiào', 'gọi; tên là', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_04', 'Nhìn Pinyin, viết nghĩa tiếng Việt: míngzi', 'tên', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_05', 'Nhìn Pinyin, viết nghĩa tiếng Việt: guó', 'nước; quốc gia', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_06', 'Nhìn Pinyin, viết nghĩa tiếng Việt: xuésheng', 'học sinh', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_07', 'Nhìn Pinyin, viết nghĩa tiếng Việt: lǎoshī', 'giáo viên; thầy cô', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_08', 'Nhìn Pinyin, viết nghĩa tiếng Việt: jiā', 'nhà; gia đình', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_09', 'Nhìn Pinyin, viết nghĩa tiếng Việt: shēngrì', 'sinh nhật', 1),
  essayQuestion('hsk1_entry_vocab_pinyin_10', 'Nhìn Pinyin, viết nghĩa tiếng Việt: péngyou', 'bạn bè', 1)
];

const vocabularyPinyinChoiceQuestions: Question[] = [
  multipleChoice('hsk1_entry_vocab_choice_01', 'jǐ suì là gì?', ['Bao nhiêu tuổi', 'Bao nhiêu người', 'Ngày nào'], 0, 1),
  multipleChoice('hsk1_entry_vocab_choice_02', 'jǐ ge rén là gì?', ['Mấy tuổi', 'Mấy người', 'Mấy ngày'], 1, 1),
  multipleChoice('hsk1_entry_vocab_choice_03', 'bàba là gì?', ['Bố', 'Mẹ', 'Anh trai'], 0, 1),
  multipleChoice('hsk1_entry_vocab_choice_04', 'māma là gì?', ['Em gái', 'Mẹ', 'Bạn bè'], 1, 1),
  multipleChoice('hsk1_entry_vocab_choice_05', 'gēge là gì?', ['Anh trai', 'Chị gái', 'Em trai'], 0, 1),
  multipleChoice('hsk1_entry_vocab_choice_06', 'jiějie là gì?', ['Em gái', 'Chị gái', 'Em trai'], 1, 1),
  multipleChoice('hsk1_entry_vocab_choice_07', 'jīntiān là gì?', ['Hôm nay', 'Ngày mai', 'Hôm qua'], 0, 1),
  multipleChoice('hsk1_entry_vocab_choice_08', 'míngtiān là gì?', ['Hôm qua', 'Ngày mai', 'Hôm nay'], 1, 1),
  multipleChoice('hsk1_entry_vocab_choice_09', 'shíjiān là gì?', ['Thời gian', 'Sinh nhật', 'Gia đình'], 0, 1),
  multipleChoice('hsk1_entry_vocab_choice_10', 'xuéxiào là gì?', ['Bệnh viện', 'Trường học', 'Nhà hàng'], 1, 1)
];

const numberAndDateWritingQuestions: Question[] = [
  essayQuestion('hsk1_entry_number_01', 'Viết số 8 bằng chữ Hán hoặc Pinyin.', '八|bā', 1),
  essayQuestion('hsk1_entry_number_02', 'Viết số 15 bằng chữ Hán hoặc Pinyin.', '十五|shíwǔ', 1),
  essayQuestion('hsk1_entry_number_03', 'Viết số 20 bằng chữ Hán hoặc Pinyin.', '二十|èrshí', 1),
  essayQuestion('hsk1_entry_number_04', 'Viết số 35 bằng chữ Hán hoặc Pinyin.', '三十五|sānshíwǔ', 1),
  essayQuestion('hsk1_entry_number_05', 'Viết số 2026 bằng chữ Hán hoặc Pinyin.', '二零二六|二〇二六|èr líng èr liù', 1),
  essayQuestion('hsk1_entry_date_01', 'Viết bằng Pinyin hoặc chữ Hán: Ngày 13 tháng 6 năm 2004.', '2004年6月13号|2004年6月13日|二零零四年六月十三号', 1),
  essayQuestion('hsk1_entry_date_02', 'Viết bằng Pinyin hoặc chữ Hán: Ngày 1 tháng 9 năm 2026.', '2026年9月1号|2026年9月1日|二零二六年九月一号', 1),
  essayQuestion('hsk1_entry_date_03', 'Viết bằng Pinyin hoặc chữ Hán: Ngày 25 tháng 12 năm 2026.', '2026年12月25号|2026年12月25日|二零二六年十二月二十五号', 1),
  essayQuestion('hsk1_entry_date_04', 'Trả lời bằng tiếng Trung: Hôm nay là ngày bao nhiêu?', 'Học sinh tự trả lời theo ngày kiểm tra.', 1),
  essayQuestion('hsk1_entry_date_05', 'Trả lời bằng tiếng Trung: Sinh nhật của bạn là ngày nào?', 'Học sinh tự trả lời theo thông tin cá nhân.', 1)
];

const numberAndDateChoiceQuestions: Question[] = [
  multipleChoice('hsk1_entry_date_choice_01', '“Ngày 8 tháng 3” nói thế nào?', ['三月八号', '八月三号', '三号八月'], 0, 1),
  multipleChoice('hsk1_entry_date_choice_02', '“Năm 2026” nói thế nào?', ['二千零二十六年', '二零二六年', '二十六年'], 1, 1),
  multipleChoice('hsk1_entry_date_choice_03', '“Tháng 5” là:', ['五月', '五号', '五天'], 0, 1),
  multipleChoice('hsk1_entry_date_choice_04', '“Thứ Hai” là:', ['星期一', '星期二', '星期日'], 0, 1),
  multipleChoice('hsk1_entry_date_choice_05', '“Ngày mai” là:', ['昨天', '明天', '今天'], 1, 1)
];

const hanziRecognitionChoiceQuestions: Question[] = [
  multipleChoice('hsk1_entry_hanzi_pinyin_01', 'Chữ 我 đọc là:', ['wǒ', 'nǐ', 'tā'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_02', 'Chữ 叫 đọc là:', ['jiāo', 'jiào', 'jiǎo'], 1, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_03', 'Chữ 名字 đọc là:', ['míngzi', 'míngzì', 'mǐngzi'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_04', 'Chữ 中国 đọc là:', ['Zhōngguó', 'Zhōnggu', 'Zhōngguǒ'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_05', 'Chữ 越南 đọc là:', ['Yuènán', 'Yuènǎn', 'Yuénán'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_06', 'Chữ 学生 đọc là:', ['xuésheng', 'xuěshēng', 'xuéshèng'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_07', 'Chữ 家 đọc là:', ['jiā', 'jiǎ', 'jià'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_08', 'Chữ 人 đọc là:', ['rén', 'rěn', 'rèn'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_09', 'Chữ 年 đọc là:', ['nián', 'niǎn', 'nían'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_pinyin_10', 'Chữ 月 đọc là:', ['yuè', 'yǔe', 'yuě'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_meaning_01', '爸爸 nghĩa là:', ['Bố', 'Mẹ', 'Anh trai'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_meaning_02', '妈妈 nghĩa là:', ['Em gái', 'Mẹ', 'Chị gái'], 1, 1),
  multipleChoice('hsk1_entry_hanzi_meaning_03', '生日 nghĩa là:', ['Sinh nhật', 'Ngày hôm qua', 'Thời gian'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_meaning_04', '朋友 nghĩa là:', ['Bạn bè', 'Gia đình', 'Giáo viên'], 0, 1),
  multipleChoice('hsk1_entry_hanzi_meaning_05', '多少 nghĩa là:', ['Ai', 'Bao nhiêu', 'Ở đâu'], 1, 1)
];

const hanziReadingSpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_entry_hanzi_read_01', 'Nhìn chữ Hán và đọc thành tiếng, ghi âm: 你好', 'Nǐ hǎo', 'hanzi_reading', 'Phần 4C – Đọc chữ Hán (ghi âm)', 1),
  speakingQuestion('hsk1_entry_hanzi_read_02', 'Nhìn chữ Hán và đọc thành tiếng, ghi âm: 我叫……', 'Wǒ jiào……', 'hanzi_reading', 'Phần 4C – Đọc chữ Hán (ghi âm)', 1),
  speakingQuestion('hsk1_entry_hanzi_read_03', 'Nhìn chữ Hán và đọc thành tiếng, ghi âm: 越南人', 'Yuènán rén', 'hanzi_reading', 'Phần 4C – Đọc chữ Hán (ghi âm)', 1),
  speakingQuestion('hsk1_entry_hanzi_read_04', 'Nhìn chữ Hán và đọc thành tiếng, ghi âm: 我家有四个人', 'Wǒ jiā yǒu sì ge rén', 'hanzi_reading', 'Phần 4C – Đọc chữ Hán (ghi âm)', 1),
  speakingQuestion('hsk1_entry_hanzi_read_05', 'Nhìn chữ Hán và đọc thành tiếng, ghi âm: 今天是五月八号', 'Jīntiān shì wǔ yuè bā hào', 'hanzi_reading', 'Phần 4C – Đọc chữ Hán (ghi âm)', 1)
];

const grammarChoiceQuestions: Question[] = [
  multipleChoice('hsk1_entry_grammar_01', '我___越南人。', ['是', '叫', '有'], 0, 1),
  multipleChoice('hsk1_entry_grammar_02', '我___小明。', ['是', '叫', '有'], 1, 1),
  multipleChoice('hsk1_entry_grammar_03', '你___学生吗？', ['是', '叫', '有'], 0, 1),
  multipleChoice('hsk1_entry_grammar_04', '我家___四个人。', ['是', '叫', '有'], 2, 1),
  multipleChoice('hsk1_entry_grammar_05', '你___岁？', ['几', '多少', '什么'], 0, 1),
  multipleChoice('hsk1_entry_grammar_06', '你是哪___人？', ['个', '国', '年'], 1, 1),
  multipleChoice('hsk1_entry_grammar_07', '我学习___。', ['汉语', '名字', '生日'], 0, 1),
  multipleChoice('hsk1_entry_grammar_08', '今天是星期___。', ['三', '年', '月'], 0, 1),
  multipleChoice('hsk1_entry_grammar_09', '你生日是几月几___？', ['年', '号', '人'], 1, 1),
  multipleChoice('hsk1_entry_grammar_10', '我有一个___。', ['妈妈', '学习', '生日'], 0, 1)
];

const grammarArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_entry_grammar_arrange_01', 'Sắp xếp câu: 叫 / 我 / 小王', ['叫', '我', '小王', '。'], '我叫小王。|我叫小王', 1),
  arrangeQuestion('hsk1_entry_grammar_arrange_02', 'Sắp xếp câu: 人 / 我家 / 有 / 五个', ['人', '我家', '有', '五个', '。'], '我家有五个人。|我家有五个人', 1),
  arrangeQuestion('hsk1_entry_grammar_arrange_03', 'Sắp xếp câu: 是 / 越南人 / 我', ['是', '越南人', '我', '。'], '我是越南人。|我是越南人', 1),
  arrangeQuestion('hsk1_entry_grammar_arrange_04', 'Sắp xếp câu: 你 / 哪国 / 是 / 人', ['你', '哪国', '是', '人', '？'], '你是哪国人？|你是哪国人', 1),
  arrangeQuestion('hsk1_entry_grammar_arrange_05', 'Sắp xếp câu: 生日 / 你的 / 是 / 什么时候', ['生日', '你的', '是', '什么时候', '？'], '你的生日是什么时候？|你的生日是什么时候', 1)
];

const oralInterviewSpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_entry_oral_self_intro', 'Ghi âm trả lời bằng tiếng Trung (3–4 câu): Tự giới thiệu tên, quốc tịch, tuổi và nghề nghiệp/việc học của em.', '', 'oral_self_intro', 'Phần 7A – Giới thiệu bản thân (ghi âm)', 4),
  speakingQuestion('hsk1_entry_oral_family', 'Ghi âm trả lời bằng tiếng Trung: 你家有几个人？ Có thể nói thêm về bố, mẹ, anh/chị/em nếu biết.', '', 'oral_family', 'Phần 7B – Giới thiệu gia đình (ghi âm)', 3),
  speakingQuestion('hsk1_entry_oral_birth_year', 'Ghi âm trả lời bằng tiếng Trung: 你是哪年出生的？', '', 'oral_date', 'Phần 7C – Ngày tháng năm và sinh nhật (ghi âm)', 1),
  speakingQuestion('hsk1_entry_oral_birthday', 'Ghi âm trả lời bằng tiếng Trung: 你的生日是几月几号？', '', 'oral_date', 'Phần 7C – Ngày tháng năm và sinh nhật (ghi âm)', 1),
  speakingQuestion('hsk1_entry_oral_today', 'Ghi âm trả lời bằng tiếng Trung: 今天是几月几号？', '', 'oral_date', 'Phần 7C – Ngày tháng năm và sinh nhật (ghi âm)', 1)
];

export const HSK1_ENTRANCE_EXAM: ExamLesson = {
  id: 'hsk1-kiem-tra-dau-vao-bai1-5',
  title: 'HSK 1 – Bộ đề kiểm tra đầu vào (Bài 1–5 | Đủ 5 kỹ năng)',
  level: 'HSK 1',
  description: 'Bộ kiểm tra đầu vào mở rộng HSK 1 Bài 1–5 cho học sinh biết Pinyin nhưng yếu chữ Hán: phát âm, từ vựng, số và ngày tháng, nhận diện chữ Hán, ngữ pháp, nghe và khẩu ngữ.',
  instruction: 'Thời lượng tham khảo: 90 phút làm bài và 15 phút kiểm tra khẩu ngữ. Phần nào yêu cầu đọc/nói đều dùng nút ghi âm; giáo viên nghe và chấm thủ công. Phần viết/tự luận cũng chờ giáo viên chấm, không tự tính đúng/sai.',
  mcQuestions: [
    ...copiedMultipleChoice,
    ...copiedReadingMultipleChoice,
    ...vocabularyPinyinChoiceQuestions,
    ...numberAndDateChoiceQuestions,
    ...hanziRecognitionChoiceQuestions,
    ...grammarChoiceQuestions
  ],
  fillQuestions,
  arrangeQuestions: [...arrangeQuestions, ...grammarArrangeQuestions],
  listeningQuestions,
  essayQuestions: [...essayQuestions, ...vocabularyPinyinWritingQuestions, ...numberAndDateWritingQuestions],
  speakingQuestions: [...speakingQuestions, ...pinyinSpeakingQuestions, ...hanziReadingSpeakingQuestions, ...oralInterviewSpeakingQuestions],
  translationQuestions
};
