import { ExamLesson, Question, ReadingPassage } from '../types';

const fillQuestion = (id: string, prompt: string, answer: string, wordBank: string[]): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  wordBank,
  answer,
  acceptableAnswers: answer
});

const multipleChoice = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const listeningQuestion = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  audioText: string
): Question => ({
  id,
  type: 'listening_mc',
  tier: 'tier2',
  prompt,
  options,
  answer,
  audioText,
  explanation: `Kịch bản nghe: ${audioText} Đáp án: ${String.fromCharCode(65 + answer)}.`
});

const arrangeQuestion = (
  id: string,
  prompt: string,
  wordChips: string[],
  acceptableAnswers: string
): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips,
  acceptableAnswers
});

const essayQuestion = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'essay',
  tier: 'tier2',
  prompt,
  suggestedAnswer
});

const translationQuestion = (
  id: string,
  prompt: string,
  translationType: 'vi_to_zh_audio' | 'vi_to_zh_text',
  suggestedAnswer: string
): Question => ({
  id,
  type: 'translation',
  translationType,
  tier: 'tier3',
  prompt,
  suggestedAnswer
});

const speakingQuestion = (id: string, prompt: string, pinyin: string): Question => ({
  id,
  type: 'speaking',
  tier: 'tier1',
  prompt,
  pinyin
});

const readingPassage = (
  id: string,
  title: string,
  content: string,
  questions: Question[]
): ReadingPassage => ({
  id,
  title,
  content,
  questions
});

const bai1WordBank = ['老师', '大家', '不客气', '学生', '再见', '同学', '谢谢', '不是'];
const bai2WordBank = ['请问', '叫', '名字', '什么', '对不起', '没关系', '很', '高兴', '认识', '也'];
const bai3WordBank = ['越南', '中国', '谁', '这', '那', '个', '的', '朋友', '哪', '忙', '想', '吗'];
const bai4WordBank = ['有', '没有', '几', '多少', '两', '口', '呢', '和', '岁', '今年'];
const bai5WordBank = ['今天', '号', '月', '年', '星期', '昨天', '明天', '休息', '会', '菜', '吃', '做', '喜欢', '些', '新'];

const bai1FillQuestions: Question[] = [
  fillQuestion('hsk1_bai1_fill_01', '王老师是我的________。', '老师', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_02', '________好！', '大家', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_03', 'A：谢谢老师！ B：________。', '不客气', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_04', '他是________，不是老师。', '学生', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_05', 'A：老师，再见！ B：________！', '再见', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_06', '我们是________。', '同学', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_07', 'A：________！ B：不客气。', '谢谢', bai1WordBank),
  fillQuestion('hsk1_bai1_fill_08', '我________老师，我是学生。', '不是', bai1WordBank)
];

const bai1McQuestions: Question[] = [
  multipleChoice('hsk1_bai1_mc_01', '“大家好！” phù hợp nhất trong tình huống nào?', ['Chào một người', 'Chào nhiều người', 'Cảm ơn', 'Tạm biệt'], 1),
  multipleChoice('hsk1_bai1_mc_02', 'Câu nào đúng?', ['您们好', '你们好', '我们好老师', '学生是我'], 1),
  multipleChoice('hsk1_bai1_mc_03', 'Chọn câu phủ định đúng của “我是老师。”', ['我不老师。', '我不是老师。', '我没老师。', '我是不老师。'], 1),
  multipleChoice('hsk1_bai1_mc_04', '“王老师” có nghĩa là:', ['Học sinh họ Vương', 'Thầy/cô Vương', 'Bạn học Vương', 'Vương là học sinh'], 1)
];

const bai1Reading = readingPassage(
  'hsk1_bai1_reading',
  'Đọc đoạn văn và trả lời câu hỏi',
  '王一飞是老师。小雨是学生。王老师说：“大家好！”学生们说：“老师，您好！”下课了，小雨说：“谢谢老师，再见！”王老师说：“不客气，再见！”',
  [
    essayQuestion('hsk1_bai1_read_01', '王一飞是老师吗？', '是。'),
    essayQuestion('hsk1_bai1_read_02', '小雨是老师还是学生？', '小雨是学生。'),
    essayQuestion('hsk1_bai1_read_03', '学生们怎么跟王老师打招呼？', '老师，您好！'),
    essayQuestion('hsk1_bai1_read_04', '下课以后，小雨说了什么？', '谢谢老师，再见！')
  ]
);

const bai1Listening: Question[] = [
  listeningQuestion('hsk1_bai1_listen_01', 'Nghe và chọn câu em nghe được.', ['你好！', '您好！', '你们好！'], 2, '你们好！'),
  listeningQuestion('hsk1_bai1_listen_02', 'Nghe và chọn đáp án đúng.', ['我是老师。', '我是学生。', '我不是学生。'], 1, '我不是老师，我是学生。'),
  listeningQuestion('hsk1_bai1_listen_03', 'Nghe và chọn lời đáp phù hợp.', ['谢谢！', '不客气！', '再见！'], 1, '谢谢！'),
  listeningQuestion('hsk1_bai1_listen_04', 'Nghe và chọn số đúng.', ['6', '8', '10'], 1, '八。'),
  listeningQuestion(
    'hsk1_bai1_listen_05',
    'Nghe hội thoại và chọn quan hệ đúng.',
    ['老师—学生', '同学—同学', '朋友—朋友'],
    0,
    '女：王老师，您好！男：你好，小雨！'
  )
];

const bai1ArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_bai1_arrange_01', 'Sắp xếp thành câu đúng: 是 / 我 / 学生', ['是', '我', '学生', '。'], '我是学生。|我是学生'),
  arrangeQuestion('hsk1_bai1_arrange_02', 'Sắp xếp thành câu đúng: 老师 / 王 / 是 / 她', ['老师', '王', '是', '她', '。'], '她是王老师。|她是王老师'),
];

const bai1EssayQuestions: Question[] = [
  essayQuestion('hsk1_bai1_essay_01', 'Viết câu phủ định: 我是老师。→', '我不是老师。')
];

const bai1WritingTranslations: Question[] = [
  translationQuestion('hsk1_bai1_write_01', 'Dịch sang tiếng Trung: Chào mọi người!', 'vi_to_zh_text', '大家好！'),
  translationQuestion('hsk1_bai1_write_02', 'Dịch sang tiếng Trung: Cảm ơn thầy/cô. Tạm biệt!', 'vi_to_zh_text', '谢谢老师。再见！|谢谢老师！再见！')
];

const bai1SpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_bai1_speak_01', '大家好！', 'Dàjiā hǎo!'),
  speakingQuestion('hsk1_bai1_speak_02', '我是学生。', 'Wǒ shì xuésheng.'),
  speakingQuestion('hsk1_bai1_speak_03', '王老师，您好！', 'Wáng lǎoshī, nín hǎo!'),
  speakingQuestion('hsk1_bai1_speak_04', '谢谢老师，再见！', 'Xièxie lǎoshī, zàijiàn!')
];

const bai1SpeakingTranslations: Question[] = [
  translationQuestion('hsk1_bai1_speak_translation_01', 'Tôi là học sinh.', 'vi_to_zh_audio', '我是学生。'),
  translationQuestion('hsk1_bai1_speak_translation_02', 'Tôi không phải là giáo viên.', 'vi_to_zh_audio', '我不是老师。'),
  translationQuestion('hsk1_bai1_speak_translation_03', 'Chào các bạn!', 'vi_to_zh_audio', '你们好！|大家好！'),
  translationQuestion('hsk1_bai1_speak_translation_04', 'Cảm ơn bạn.', 'vi_to_zh_audio', '谢谢你。'),
  translationQuestion('hsk1_bai1_speak_translation_05', 'Tạm biệt thầy/cô!', 'vi_to_zh_audio', '老师，再见！')
];

const bai2FillQuestions: Question[] = [
  fillQuestion('hsk1_bai2_fill_01', '________，你叫什么名字？', '请问', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_02', '我________李文。', '叫', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_03', '你的________是什么？', '名字', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_04', '你叫________？', '什么', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_05', 'A：________！ B：没关系。', '对不起', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_06', 'A：对不起！ B：________。', '没关系', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_07', '我________高兴。', '很', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_08', '很________认识你。', '高兴', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_09', '我________王老师。', '认识', bai2WordBank),
  fillQuestion('hsk1_bai2_fill_10', '我________是学生。', '也', bai2WordBank)
];

const bai2McQuestions: Question[] = [
  multipleChoice('hsk1_bai2_mc_01', 'Câu nào đúng với trật tự cơ bản S+V+O?', ['李文我叫。', '我叫李文。', '叫我李文。', '我李文叫。'], 1),
  multipleChoice('hsk1_bai2_mc_02', '“请问” gần nghĩa nhất là:', ['Xin hỏi', 'Xin ăn', 'Cảm ơn', 'Tạm biệt'], 0),
  multipleChoice('hsk1_bai2_mc_03', 'Điền từ: 我___高兴。', ['也', '很', '什么', '叫'], 1),
  multipleChoice('hsk1_bai2_mc_04', 'A：对不起。 B：___', ['谢谢', '没关系', '再见', '请问'], 1)
];

const bai2Reading = readingPassage(
  'hsk1_bai2_reading',
  'Đọc hội thoại và trả lời',
  'A：请问，你叫什么名字？B：我叫白家月。你呢？A：我叫李文。很高兴认识你。B：我也很高兴认识你。',
  [
    essayQuestion('hsk1_bai2_read_01', 'B叫什么名字？', '白家月。'),
    essayQuestion('hsk1_bai2_read_02', 'A叫什么名字？', '李文。'),
    essayQuestion('hsk1_bai2_read_03', '谁说“很高兴认识你”？', 'A。'),
    essayQuestion('hsk1_bai2_read_04', 'B最后说什么？', '我也很高兴认识你。')
  ]
);

const bai2Listening: Question[] = [
  listeningQuestion('hsk1_bai2_listen_01', 'Nghe và chọn tên đúng.', ['李文', '白家月', '王一飞'], 0, '我叫李文。'),
  listeningQuestion('hsk1_bai2_listen_02', 'Nghe và chọn câu hỏi đúng.', ['你是谁？', '你叫什么名字？', '你是老师吗？'], 1, '请问，你叫什么名字？'),
  listeningQuestion('hsk1_bai2_listen_03', 'Nghe và chọn lời đáp.', ['没关系', '很高兴', '谢谢'], 0, '对不起。'),
  listeningQuestion('hsk1_bai2_listen_04', 'Nghe và chọn từ xuất hiện.', ['也', '们', '哪'], 0, '我也是学生。'),
  listeningQuestion(
    'hsk1_bai2_listen_05',
    'Nghe hội thoại: hai người đang làm gì?',
    ['Hỏi tên và làm quen', 'Hỏi tuổi', 'Chào tạm biệt'],
    0,
    '女：你好！我叫白家月，你叫什么名字？男：我叫李文。很高兴认识你。'
  )
];

const bai2ArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_bai2_arrange_01', 'Sắp xếp câu: 名字 / 你 / 什么 / 叫', ['名字', '你', '什么', '叫', '？'], '你叫什么名字？|你叫什么名字'),
  arrangeQuestion('hsk1_bai2_arrange_02', 'Sắp xếp câu: 也 / 我 / 学生 / 是', ['也', '我', '学生', '是', '。'], '我也是学生。|我也是学生')
];

const bai2EssayQuestions: Question[] = [
  essayQuestion('hsk1_bai2_essay_01', 'Điền 很: 我____高兴。', '很')
];

const bai2WritingTranslations: Question[] = [
  translationQuestion('hsk1_bai2_write_01', 'Dịch sang tiếng Trung: Xin hỏi, bạn tên là gì?', 'vi_to_zh_text', '请问，你叫什么名字？'),
  translationQuestion('hsk1_bai2_write_02', 'Dịch sang tiếng Trung: Tôi cũng rất vui được làm quen với bạn.', 'vi_to_zh_text', '我也很高兴认识你。')
];

const bai2SpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_bai2_speak_01', '请问，你叫什么名字？', 'Qǐngwèn, nǐ jiào shénme míngzi?'),
  speakingQuestion('hsk1_bai2_speak_02', '我叫李文。', 'Wǒ jiào Lǐ Wén.'),
  speakingQuestion('hsk1_bai2_speak_03', '很高兴认识你。', 'Hěn gāoxìng rènshi nǐ.'),
  speakingQuestion('hsk1_bai2_speak_04', '我也是学生。', 'Wǒ yě shì xuésheng.')
];

const bai2SpeakingTranslations: Question[] = [
  translationQuestion('hsk1_bai2_speak_translation_01', 'Tôi tên là Minh.', 'vi_to_zh_audio', '我叫明。'),
  translationQuestion('hsk1_bai2_speak_translation_02', 'Xin hỏi, bạn tên là gì?', 'vi_to_zh_audio', '请问，你叫什么名字？'),
  translationQuestion('hsk1_bai2_speak_translation_03', 'Xin lỗi.', 'vi_to_zh_audio', '对不起。'),
  translationQuestion('hsk1_bai2_speak_translation_04', 'Không sao.', 'vi_to_zh_audio', '没关系。|没事。'),
  translationQuestion('hsk1_bai2_speak_translation_05', 'Tôi cũng rất vui.', 'vi_to_zh_audio', '我也很高兴。')
];

const bai3FillQuestions: Question[] = [
  fillQuestion('hsk1_bai3_fill_01', '我是________人。', '越南', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_02', '王老师是________人。', '中国', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_03', '她是________？', '谁', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_04', '________是谁？（gần người nói）', '这', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_05', '________是我的中文老师。（xa người nói）', '那', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_06', '一________老师', '个', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_07', '这是我________朋友。', '的', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_08', '他是我的男________。', '朋友', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_09', '你是________国人？', '哪', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_10', '我姐姐工作很________。', '忙', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_11', '我________你们。', '想', bai3WordBank),
  fillQuestion('hsk1_bai3_fill_12', '你是学生________？', '吗', bai3WordBank)
];

const bai3McQuestions: Question[] = [
  multipleChoice('hsk1_bai3_mc_01', 'Cụm nào đúng?', ['我名字', '我的名字', '名字的我', '我名字的'], 1),
  multipleChoice('hsk1_bai3_mc_02', '“người Việt Nam” là:', ['越南', '越南人', '越南语', '越南的'], 1),
  multipleChoice('hsk1_bai3_mc_03', 'Chọn lượng từ đúng: ___老师', ['一人', '一个', '一国', '一谁'], 1),
  multipleChoice('hsk1_bai3_mc_04', '“太忙了” nghĩa phù hợp nhất:', ['rất rảnh', 'bận quá', 'không bận', 'muốn làm việc'], 1)
];

const bai3Reading = readingPassage(
  'hsk1_bai3_reading',
  'Đọc đoạn văn và trả lời',
  '我叫安妮，是法国人。我是学生。王一飞是我的中文老师，他是中国人。白家月是我的朋友，她是泰国人。她姐姐在工作，很忙。',
  [
    essayQuestion('hsk1_bai3_read_01', '安妮是哪国人？', '法国人。'),
    essayQuestion('hsk1_bai3_read_02', '王一飞是谁？', '安妮的中文老师。'),
    essayQuestion('hsk1_bai3_read_03', '王一飞是哪国人？', '中国人。'),
    essayQuestion('hsk1_bai3_read_04', '白家月是哪国人？', '泰国人。'),
    essayQuestion('hsk1_bai3_read_05', '谁很忙？', '白家月的姐姐。')
  ]
);

const bai3Listening: Question[] = [
  listeningQuestion('hsk1_bai3_listen_01', 'Nghe và chọn quốc tịch.', ['越南人', '中国人', '法国人'], 0, '我是越南人。'),
  listeningQuestion('hsk1_bai3_listen_02', 'Nghe và chọn người được hỏi.', ['老师', '谁', '朋友'], 1, '她是谁？'),
  listeningQuestion('hsk1_bai3_listen_03', 'Nghe và chọn câu đúng.', ['这是我妈妈。', '那是我老师。', '这是我朋友。'], 2, '这是我的朋友。'),
  listeningQuestion('hsk1_bai3_listen_04', 'Nghe và chọn trạng thái.', ['很忙', '很高兴', '很好'], 0, '我姐姐工作很忙。'),
  listeningQuestion(
    'hsk1_bai3_listen_05',
    'Nghe hội thoại: người nữ là ai?',
    ['姐姐', '老师', '朋友'],
    0,
    '男：那是谁？女：她是我的姐姐。'
  )
];

const bai3ArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_bai3_arrange_01', 'Sắp xếp câu: 是 / 哪 / 你 / 国 / 人', ['是', '哪', '你', '国', '人', '？'], '你是哪国人？|你是哪国人'),
  arrangeQuestion('hsk1_bai3_arrange_02', 'Sắp xếp câu: 老师 / 我的 / 她 / 中文 / 是', ['老师', '我的', '她', '中文', '是', '。'], '她是我的中文老师。|她是我的中文老师')
];

const bai3EssayQuestions: Question[] = [
  essayQuestion('hsk1_bai3_essay_01', 'Thêm 的 nếu cần: 这是我___朋友。', '的')
];

const bai3WritingTranslations: Question[] = [
  translationQuestion('hsk1_bai3_write_01', 'Dịch sang tiếng Trung: Đây là giáo viên tiếng Trung của tôi.', 'vi_to_zh_text', '这是我的中文老师。'),
  translationQuestion('hsk1_bai3_write_02', 'Dịch sang tiếng Trung: Chị gái tôi làm việc rất bận.', 'vi_to_zh_text', '我姐姐工作很忙。')
];

const bai3SpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_bai3_speak_01', '我是越南人。', 'Wǒ shì Yuènán rén.'),
  speakingQuestion('hsk1_bai3_speak_02', '这是我的中文老师。', 'Zhè shì wǒ de Zhōngwén lǎoshī.'),
  speakingQuestion('hsk1_bai3_speak_03', '她是我的朋友。', 'Tā shì wǒ de péngyou.'),
  speakingQuestion('hsk1_bai3_speak_04', '你是哪国人？', 'Nǐ shì nǎ guó rén?')
];

const bai3SpeakingTranslations: Question[] = [
  translationQuestion('hsk1_bai3_speak_translation_01', 'Tôi là người Việt Nam.', 'vi_to_zh_audio', '我是越南人。'),
  translationQuestion('hsk1_bai3_speak_translation_02', 'Đây là bạn của tôi.', 'vi_to_zh_audio', '这是我的朋友。'),
  translationQuestion('hsk1_bai3_speak_translation_03', 'Người kia là ai?', 'vi_to_zh_audio', '那是谁？'),
  translationQuestion('hsk1_bai3_speak_translation_04', 'Bạn là người nước nào?', 'vi_to_zh_audio', '你是哪国人？'),
  translationQuestion('hsk1_bai3_speak_translation_05', 'Chị gái tôi rất bận.', 'vi_to_zh_audio', '我姐姐很忙。')
];

const bai4FillQuestions: Question[] = [
  fillQuestion('hsk1_bai4_fill_01', '我________一个哥哥。', '有', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_02', '我________姐姐。', '没有', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_03', '你家有________口人？', '几', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_04', '这本书________钱？', '多少', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_05', '我有________个孩子。', '两', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_06', '我家有四________人。', '口', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_07', '我叫李文，你________？', '呢', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_08', '爸爸________妈妈', '和', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_09', '你女儿几________？', '岁', bai4WordBank),
  fillQuestion('hsk1_bai4_fill_10', '________是2026年。', '今年', bai4WordBank)
];

const bai4McQuestions: Question[] = [
  multipleChoice('hsk1_bai4_mc_01', 'Câu nào đúng?', ['二个人', '两个人', '两 个十', '二个老师'], 1),
  multipleChoice('hsk1_bai4_mc_02', 'Hỏi số người trong gia đình nên dùng:', ['几个人', '几口人', '多少岁', '哪个人'], 1),
  multipleChoice('hsk1_bai4_mc_03', 'Hỏi tuổi một người trưởng thành theo nội dung bài:', ['你几口人？', '你多大？', '你多少人？', '你几家？'], 1),
  multipleChoice('hsk1_bai4_mc_04', 'Phủ định của 有 là:', ['不有', '没有', '不是', '没是'], 1)
];

const bai4Reading = readingPassage(
  'hsk1_bai4_reading',
  'Đọc đoạn văn và trả lời',
  '我叫李文，今年二十岁。我家有五口人：爸爸、妈妈、哥哥、妹妹和我。哥哥二十三岁，妹妹八岁。爸爸和妈妈有三个孩子。我们家没有老师。',
  [
    essayQuestion('hsk1_bai4_read_01', '李文今年多大？', '二十岁。'),
    essayQuestion('hsk1_bai4_read_02', '李文家有几口人？', '五口人。'),
    essayQuestion('hsk1_bai4_read_03', '李文有哥哥吗？', '有。'),
    essayQuestion('hsk1_bai4_read_04', '妹妹几岁？', '八岁。'),
    essayQuestion('hsk1_bai4_read_05', '爸爸和妈妈有几个孩子？', '三个孩子。'),
    essayQuestion('hsk1_bai4_read_06', '他们家有老师吗？', '没有。')
  ]
);

const bai4Listening: Question[] = [
  listeningQuestion('hsk1_bai4_listen_01', 'Nghe và chọn số người.', ['3口', '4口', '5口'], 2, '我家有五口人。'),
  listeningQuestion('hsk1_bai4_listen_02', 'Nghe và chọn tuổi.', ['8岁', '18岁', '28岁'], 0, '我妹妹八岁。'),
  listeningQuestion('hsk1_bai4_listen_03', 'Nghe và chọn cấu trúc đúng.', ['两个人', '二个人', '两人个'], 0, '两个人。'),
  listeningQuestion('hsk1_bai4_listen_04', 'Nghe và chọn câu hỏi.', ['你家有几口人？', '你有几个家？', '你几岁家？'], 0, '你家有几口人？'),
  listeningQuestion(
    'hsk1_bai4_listen_05',
    'Nghe hội thoại: người nói có chị gái không?',
    ['有', '没有', 'Không rõ'],
    1,
    '女：你有姐姐吗？男：我没有姐姐，我有一个妹妹。'
  )
];

const bai4ArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_bai4_arrange_01', 'Sắp xếp câu: 有 / 你家 / 几 / 人 / 口', ['有', '你家', '几', '人', '口', '？'], '你家有几口人？|你家有几口人')
];

const bai4EssayQuestions: Question[] = [
  essayQuestion('hsk1_bai4_essay_01', 'Viết số bằng chữ Hán: 22 →', '二十二'),
  essayQuestion('hsk1_bai4_essay_02', 'Viết số bằng chữ Hán: 122 →', '一百二十二')
];

const bai4WritingTranslations: Question[] = [
  translationQuestion('hsk1_bai4_write_01', 'Dịch sang tiếng Trung: Nhà tôi có bốn người.', 'vi_to_zh_text', '我家有四口人。'),
  translationQuestion('hsk1_bai4_write_02', 'Dịch sang tiếng Trung: Con gái bạn bao nhiêu tuổi?', 'vi_to_zh_text', '你女儿几岁？|你女儿多大？')
];

const bai4SpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_bai4_speak_01', '你家有几口人？', 'Nǐ jiā yǒu jǐ kǒu rén?'),
  speakingQuestion('hsk1_bai4_speak_02', '我家有四口人。', 'Wǒ jiā yǒu sì kǒu rén.'),
  speakingQuestion('hsk1_bai4_speak_03', '我有两个孩子。', 'Wǒ yǒu liǎng ge háizi.'),
  speakingQuestion('hsk1_bai4_speak_04', '你今年多大？', 'Nǐ jīnnián duō dà?')
];

const bai4SpeakingTranslations: Question[] = [
  translationQuestion('hsk1_bai4_speak_translation_01', 'Tôi có một anh trai.', 'vi_to_zh_audio', '我有一个哥哥。'),
  translationQuestion('hsk1_bai4_speak_translation_02', 'Tôi không có chị gái.', 'vi_to_zh_audio', '我没有姐姐。'),
  translationQuestion('hsk1_bai4_speak_translation_03', 'Nhà bạn có mấy người?', 'vi_to_zh_audio', '你家有几口人？'),
  translationQuestion('hsk1_bai4_speak_translation_04', 'Tôi năm nay 20 tuổi.', 'vi_to_zh_audio', '我今年二十岁。'),
  translationQuestion('hsk1_bai4_speak_translation_05', 'Tôi có hai người con.', 'vi_to_zh_audio', '我有两个孩子。')
];

const bai5FillQuestions: Question[] = [
  fillQuestion('hsk1_bai5_fill_01', '________是8月12号。', '今天', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_02', '今天是几________？', '号', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_03', '八________', '月', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_04', '2026________', '年', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_05', '今天是________三。', '星期', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_06', '________是8月11号。', '昨天', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_07', '________是8月13号。', '明天', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_08', '星期天我________，不工作。', '休息', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_09', '我________说汉语。', '会', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_10', '中国________', '菜', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_11', '我喜欢________饺子。', '吃', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_12', '妈妈会________饭。', '做', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_13', '我________吃面条儿。', '喜欢', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_14', '这________书很好看。', '些', bai5WordBank),
  fillQuestion('hsk1_bai5_fill_15', '这是一台________电脑。', '新', bai5WordBank)
];

const bai5McQuestions: Question[] = [
  multipleChoice('hsk1_bai5_mc_01', 'Cách đọc năm 2026 theo nội dung bài là:', ['二千零二十六年', '二零二六年', '二十零二六年', '两零两六年'], 1),
  multipleChoice('hsk1_bai5_mc_02', 'Câu hỏi ngày tháng đúng:', ['今天几月几号？', '今天几人？', '今天多少岁？', '今天哪个国？'], 0),
  multipleChoice('hsk1_bai5_mc_03', '“好吃” nghĩa là:', ['dễ viết', 'ngon', 'đẹp', 'bận'], 1),
  multipleChoice('hsk1_bai5_mc_04', 'Cụm nào đúng?', ['一台电脑', '一个电脑台', '一电脑', '两台书'], 0)
];

const bai5Reading = readingPassage(
  'hsk1_bai5_reading',
  'Đọc đoạn văn và trả lời',
  '今天是2026年8月12号，星期三。今天我休息，不上班。中午妈妈做中国菜和饺子，我很喜欢吃。下午我看书，也看新电脑。明天我会上班。',
  [
    essayQuestion('hsk1_bai5_read_01', '今天是几月几号？', '8月12号。'),
    essayQuestion('hsk1_bai5_read_02', '今天星期几？', '星期三。'),
    essayQuestion('hsk1_bai5_read_03', '今天“我”上班吗？', '不上班。'),
    essayQuestion('hsk1_bai5_read_04', '妈妈做什么？', '中国菜和饺子。'),
    essayQuestion('hsk1_bai5_read_05', '“我”喜欢吃什么？', '饺子。'),
    essayQuestion('hsk1_bai5_read_06', '明天“我”会做什么？', '上班。')
  ]
);

const bai5Listening: Question[] = [
  listeningQuestion('hsk1_bai5_listen_01', 'Nghe và chọn ngày.', ['8月8号', '8月12号', '12月8号'], 1, '今天是八月十二号。'),
  listeningQuestion('hsk1_bai5_listen_02', 'Nghe và chọn thứ.', ['星期一', '星期三', '星期天'], 1, '今天是星期三。'),
  listeningQuestion('hsk1_bai5_listen_03', 'Nghe và chọn hoạt động.', ['上班', '休息', '上课'], 1, '今天我休息。'),
  listeningQuestion('hsk1_bai5_listen_04', 'Nghe và chọn món ăn.', ['面条儿', '饺子', '米饭'], 1, '我喜欢吃饺子。'),
  listeningQuestion(
    'hsk1_bai5_listen_05',
    'Nghe hội thoại: ngày mai người nữ làm gì?',
    ['学汉语', '休息', '做饭'],
    0,
    '男：你明天休息吗？女：不，我明天会学汉语。'
  )
];

const bai5ArrangeQuestions: Question[] = [
  arrangeQuestion('hsk1_bai5_arrange_01', 'Sắp xếp câu: 今天 / 星期三 / 是', ['今天', '星期三', '是', '。'], '今天是星期三。|今天是星期三'),
  arrangeQuestion('hsk1_bai5_arrange_02', 'Sắp xếp câu: 喜欢 / 我 / 吃 / 饺子', ['喜欢', '我', '吃', '饺子', '。'], '我喜欢吃饺子。|我喜欢吃饺子')
];

const bai5EssayQuestions: Question[] = [
  essayQuestion('hsk1_bai5_essay_01', 'Viết ngày tháng bằng tiếng Trung: 12/08/2026 →', '2026年8月12号|2026年8月12日')
];

const bai5WritingTranslations: Question[] = [
  translationQuestion('hsk1_bai5_write_01', 'Dịch sang tiếng Trung: Hôm nay tôi nghỉ, không làm việc.', 'vi_to_zh_text', '今天我休息，不工作。'),
  translationQuestion('hsk1_bai5_write_02', 'Dịch sang tiếng Trung: Ngày mai tôi sẽ học tiếng Trung.', 'vi_to_zh_text', '明天我会学汉语。')
];

const bai5SpeakingQuestions: Question[] = [
  speakingQuestion('hsk1_bai5_speak_01', '今天是几月几号？', 'Jīntiān shì jǐ yuè jǐ hào?'),
  speakingQuestion('hsk1_bai5_speak_02', '星期天我休息，不工作。', 'Xīngqītiān wǒ xiūxi, bù gōngzuò.'),
  speakingQuestion('hsk1_bai5_speak_03', '我会说汉语。', 'Wǒ huì shuō Hànyǔ.'),
  speakingQuestion('hsk1_bai5_speak_04', '我喜欢吃饺子。', 'Wǒ xǐhuan chī jiǎozi.')
];

const bai5SpeakingTranslations: Question[] = [
  translationQuestion('hsk1_bai5_speak_translation_01', 'Hôm nay là thứ Tư.', 'vi_to_zh_audio', '今天是星期三。'),
  translationQuestion('hsk1_bai5_speak_translation_02', 'Hôm nay là ngày 12 tháng 8.', 'vi_to_zh_audio', '今天是八月十二号。'),
  translationQuestion('hsk1_bai5_speak_translation_03', 'Ngày mai tôi sẽ học tiếng Trung.', 'vi_to_zh_audio', '明天我会学汉语。'),
  translationQuestion('hsk1_bai5_speak_translation_04', 'Tôi thích ăn mì.', 'vi_to_zh_audio', '我喜欢吃面条儿。'),
  translationQuestion('hsk1_bai5_speak_translation_05', 'Đây là một chiếc máy tính mới.', 'vi_to_zh_audio', '这是一台新电脑。')
];

const makeExam = (
  id: string,
  title: string,
  description: string,
  instruction: string,
  fillQuestions: Question[],
  mcQuestions: Question[],
  reading: ReadingPassage,
  listeningQuestions: Question[],
  arrangeQuestions: Question[],
  essayQuestions: Question[],
  writingTranslations: Question[],
  speakingQuestions: Question[],
  speakingTranslations: Question[]
): ExamLesson => ({
  id,
  title,
  level: 'HSK 1',
  description,
  instruction,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages: [reading],
  listeningQuestions,
  essayQuestions,
  speakingQuestions,
  translationQuestions: [...writingTranslations, ...speakingTranslations]
});

export const HSK1_BAI1_TO_5_EXAMS: ExamLesson[] = [
  makeExam(
    'hsk1-bai1-5-ky-nang',
    'HSK 1 - Bài 1: 你好！ / Chào hỏi',
    'Bài tập tổng hợp 5 kỹ năng theo file Word: chào hỏi, 是/不是, 老师, 学生, 大家, 同学, 谢谢, 不客气 và số 1–10.',
    'Mỗi bài là một phiếu độc lập. Phần nghe có thể dùng TTS mẫu hoặc giáo viên gắn file nghe riêng; phần nói ghi âm từng câu.',
    bai1FillQuestions,
    bai1McQuestions,
    bai1Reading,
    bai1Listening,
    bai1ArrangeQuestions,
    bai1EssayQuestions,
    bai1WritingTranslations,
    bai1SpeakingQuestions,
    bai1SpeakingTranslations
  ),
  makeExam(
    'hsk1-bai2-5-ky-nang',
    'HSK 1 - Bài 2: 我叫李文 / Tôi tên là Lý Văn',
    'Bài tập tổng hợp 5 kỹ năng theo file Word: 请问, 叫, 名字, 什么, 对不起, 没关系, 很, 高兴, 认识 và 也.',
    'Mỗi bài là một phiếu độc lập. Không hiển thị pinyin đáp án trong phần dịch; học sinh tự dịch và ghi âm.',
    bai2FillQuestions,
    bai2McQuestions,
    bai2Reading,
    bai2Listening,
    bai2ArrangeQuestions,
    bai2EssayQuestions,
    bai2WritingTranslations,
    bai2SpeakingQuestions,
    bai2SpeakingTranslations
  ),
  makeExam(
    'hsk1-bai3-5-ky-nang',
    'HSK 1 - Bài 3: 我是中国人 / Tôi là người Trung Quốc',
    'Bài tập tổng hợp 5 kỹ năng theo file Word: quốc tịch, 谁, 这/那, 的, 个, 朋友, 哪, 忙, 想 và 吗.',
    'Mỗi bài là một phiếu độc lập. Phần nghe hiển thị câu hỏi nhưng không hiển thị kịch bản nghe.',
    bai3FillQuestions,
    bai3McQuestions,
    bai3Reading,
    bai3Listening,
    bai3ArrangeQuestions,
    bai3EssayQuestions,
    bai3WritingTranslations,
    bai3SpeakingQuestions,
    bai3SpeakingTranslations
  ),
  makeExam(
    'hsk1-bai4-5-ky-nang',
    'HSK 1 - Bài 4: 我有两个孩子 / Tôi có hai người con',
    'Bài tập tổng hợp 5 kỹ năng theo file Word: 有/没有, 几, 多少, 两, 口, 家, 岁, 今年 và số đếm đến hàng nghìn.',
    'Mỗi bài là một phiếu độc lập. Học sinh làm bài viết rồi ghi âm phần nói theo từng câu.',
    bai4FillQuestions,
    bai4McQuestions,
    bai4Reading,
    bai4Listening,
    bai4ArrangeQuestions,
    bai4EssayQuestions,
    bai4WritingTranslations,
    bai4SpeakingQuestions,
    bai4SpeakingTranslations
  ),
  makeExam(
    'hsk1-bai5-5-ky-nang',
    'HSK 1 - Bài 5: 今天我休息 / Hôm nay tôi nghỉ',
    'Bài tập tổng hợp 5 kỹ năng theo file Word: ngày tháng, 星期, 休息, 会, 菜, 吃, 做, 喜欢, 面条儿, 饺子, 新 và 台.',
    'Mỗi bài là một phiếu độc lập. Học sinh không xem kịch bản nghe và không xem pinyin đáp án phần dịch.',
    bai5FillQuestions,
    bai5McQuestions,
    bai5Reading,
    bai5Listening,
    bai5ArrangeQuestions,
    bai5EssayQuestions,
    bai5WritingTranslations,
    bai5SpeakingQuestions,
    bai5SpeakingTranslations
  )
];
