import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

/**
 * Bài tập HSK1 Bài 6–15.
 *
 * Quy ước sư phạm:
 * - Mỗi đề có đủ nghe, nói, đọc, viết và dịch.
 * - Nội dung của bài n chỉ dùng từ đã xuất hiện ở các bài trước và từ mới của bài n.
 * - audioText được dùng làm nguồn TTS ẩn; có thể thay bằng audioUrl khi giáo viên có file thu âm.
 */

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
  explanation: `Kịch bản nghe: ${audioText}`
});

const listeningFill = (id: string, prompt: string, answer: string, audioText: string): Question => ({
  id,
  type: 'listening_fill',
  tier: 'tier2',
  prompt,
  answer,
  acceptableAnswers: answer,
  audioText,
  explanation: `Kịch bản nghe: ${audioText}`
});

const arrangeQuestion = (id: string, prompt: string, wordChips: string[], acceptableAnswers: string): Question => ({
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
  tier: 'tier3',
  prompt,
  suggestedAnswer
});

const speakingQuestion = (id: string, prompt: string, pinyin: string): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin
});

const translationQuestion = (
  id: string,
  prompt: string,
  translationType: 'vi_to_zh_audio' | 'vi_to_zh_text' | 'zh_to_vi_text',
  suggestedAnswer: string,
  pinyin?: string
): Question => ({
  id,
  type: 'translation',
  translationType,
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  pinyin
});

const readingPassage = (id: string, title: string, content: string, questions: Question[]): ReadingPassage => ({
  id,
  title,
  content,
  questions
});

const makeExam = (
  id: string,
  title: string,
  description: string,
  vocabList: VocabItem[],
  mcQuestions: Question[],
  fillQuestions: Question[],
  arrangeQuestions: Question[],
  readingPassages: ReadingPassage[],
  listeningQuestions: Question[],
  essayQuestions: Question[],
  speakingQuestions: Question[],
  translationQuestions: Question[]
): ExamLesson => ({
  id,
  title,
  level: 'HSK 1',
  description,
  instruction: 'Làm theo thứ tự: từ vựng – nghe – đọc – viết – nói – dịch. Phần nghe dùng TTS; giáo viên có thể thay bằng audioUrl.',
  vocabList,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages,
  listeningQuestions,
  essayQuestions,
  speakingQuestions,
  translationQuestions
});

const uniqueVocab = (...lists: VocabItem[][]): VocabItem[] => {
  const seen = new Set<string>();
  return lists.flat().filter((item) => {
    if (seen.has(item.hanzi)) return false;
    seen.add(item.hanzi);
    return true;
  });
};

const b6Words = ['号', '手机', '电话', '在', '学校', '去', '哪儿', '东西', '买', '超市', '喝', '牛奶', '晚饭', '那边', '包子', '非常', '米饭', '怎么', '坐', '出租车', '店'];
const b7Words = ['现在', '点', '分', '上午', '下午', '中午', '早上', '晚上', '半', '课', '见', '吧', '电影', '院', '事', '医', '分钟', '里', '后'];
const b8Words = ['房间', '内', '外', '北京', '小', '猫', '狗', '看见', '桌子', '漂亮', '前', '能', '到', '病人'];
const b9Words = ['边', '家', '书', '椅子', '学习', '做', '白天', '读', '说', '听', '唱', '歌', '电视', '玩'];
const b10Words = ['杯子', '卖', '售货员', '钱', '块', '元', '水果', '少', '斤', '苹果', '便宜', '贵', '商店', '衣服', '怎么样', '穿'];
const b11Words = ['时候', '知道', '车', '辆', '骑', '找', '正在', '还', '大学', '弟弟', '起床', '睡觉', '问', '说', '对', '要'];
const b12Words = ['天气', '天', '雨', '下雨', '雪', '觉得', '冷', '热', '一点儿', '来', '公司', '生病', '看病', '药', '回', '再', '喝'];
const b13Words = ['问题', '一下', '给', '可以', '服务员', '女士', '先生', '面包', '鸡蛋', '茶'];
const b14Words = ['火车', '有些', '有的', '了', '字', '写', '都', '说话', '听见', '晚'];
const b15Words = ['爱', '哪个', '也', '还', '好玩儿', '西安', '小时', '飞机', '机场', '家人', '时间', '接', '住', '那'];

const vocab = (items: string[], start: number, meanings: Record<string, string>): VocabItem[] =>
  items.map((hanzi, index) => ({
    hanzi,
    pinyin: meanings[`${hanzi}_pinyin`] || '',
    type: meanings[`${hanzi}_type`] || 'Từ vựng',
    meaning: meanings[hanzi] || '',
    example: meanings[`${hanzi}_example`]
  }));

const b6Vocab = vocab(b6Words, 1, {
  '号': 'Ngày; số; size', '号_pinyin': 'hào', '号_type': 'Danh từ', '号_example': '你的手机号是多少？',
  '手机': 'Điện thoại di động', '手机_pinyin': 'shǒujī', '手机_type': 'Danh từ', '手机_example': '我的手机号是18516893791。',
  '电话': 'Điện thoại', '电话_pinyin': 'diànhuà', '电话_type': 'Danh từ', '电话_example': '我给妈妈打电话。',
  '在': 'Ở; đang', '在_pinyin': 'zài', '在_type': 'Động từ / phó từ', '在_example': '我在家。',
  '学校': 'Trường học', '学校_pinyin': 'xuéxiào', '学校_type': 'Danh từ', '学校_example': '我的学校在中国。',
  '去': 'Đi', '去_pinyin': 'qù', '去_type': 'Động từ', '去_example': '我去学校。',
  '哪儿': 'Ở đâu', '哪儿_pinyin': 'nǎr', '哪儿_type': 'Đại từ nghi vấn', '哪儿_example': '你家在哪儿？',
  '东西': 'Đồ vật; đồ đạc', '东西_pinyin': 'dōngxi', '东西_type': 'Danh từ', '东西_example': '这是什么东西？',
  '买': 'Mua', '买_pinyin': 'mǎi', '买_type': 'Động từ', '买_example': '我去超市买东西。',
  '超市': 'Siêu thị', '超市_pinyin': 'chāoshì', '超市_type': 'Danh từ', '超市_example': '妈妈去超市买菜。',
  '喝': 'Uống', '喝_pinyin': 'hē', '喝_type': 'Động từ', '喝_example': '我想喝水。',
  '牛奶': 'Sữa bò', '牛奶_pinyin': 'niúnǎi', '牛奶_type': 'Danh từ', '牛奶_example': '牛奶很好喝。',
  '晚饭': 'Bữa tối', '晚饭_pinyin': 'wǎnfàn', '晚饭_type': 'Danh từ', '晚饭_example': '晚饭你想吃什么？',
  '那边': 'Đằng kia; phía bên kia', '那边_pinyin': 'nàbiān', '那边_type': 'Danh từ phương vị', '那边_example': '那边有很多人。',
  '包子': 'Bánh bao', '包子_pinyin': 'bāozi', '包子_type': 'Danh từ', '包子_example': '我吃两个包子。',
  '非常': 'Rất; cực kỳ', '非常_pinyin': 'fēicháng', '非常_type': 'Phó từ', '非常_example': '这本书非常好看。',
  '米饭': 'Cơm', '米饭_pinyin': 'mǐfàn', '米饭_type': 'Danh từ', '米饭_example': '我喜欢吃米饭。',
  '怎么': 'Như thế nào; làm sao', '怎么_pinyin': 'zěnme', '怎么_type': 'Đại từ nghi vấn', '怎么_example': '你怎么去学校？',
  '坐': 'Ngồi; đi bằng', '坐_pinyin': 'zuò', '坐_type': 'Động từ', '坐_example': '我坐出租车去学校。',
  '出租车': 'Taxi', '出租车_pinyin': 'chūzūchē', '出租车_type': 'Danh từ', '出租车_example': '我在叫出租车。',
  '店': 'Tiệm; cửa hàng', '店_pinyin': 'diàn', '店_type': 'Danh từ', '店_example': '我们去店里买东西。'
});

const b6WordBank = ['手机号', '号', '手机', '在', '去', '哪儿', '东西', '买', '喝', '牛奶', '包子', '怎么', '坐'];
const b6Mc = [
  multipleChoice('hsk1_b6_mc_01', 'Số 1 trong số điện thoại đọc là:', ['yī', 'yāo', 'liǎng', 'líng'], 1),
  multipleChoice('hsk1_b6_mc_02', 'Câu hỏi “Bạn đi đâu?” là:', ['你去哪儿？', '你怎么去？', '你买什么？', '你在家吗？'], 0),
  multipleChoice('hsk1_b6_mc_03', 'Cụm nào đúng?', ['喝牛奶', '牛奶喝', '买牛奶吗儿', '牛奶买'], 0),
  multipleChoice('hsk1_b6_mc_04', 'Chọn câu có câu liên động đúng:', ['我去超市买东西。', '我买去超市东西。', '我去东西买超市。', '我超市去东西买。'], 0),
  multipleChoice('hsk1_b6_mc_05', '“这些东西” biểu thị:', ['Một đồ vật', 'Một số đồ vật, nhiều hơn một', 'Một địa điểm', 'Một số điện thoại'], 1)
];
const b6Fill = [
  fillQuestion('hsk1_b6_fill_01', '我的____是18516893791。', '手机号', b6WordBank),
  fillQuestion('hsk1_b6_fill_02', '我____家。', '在', b6WordBank),
  fillQuestion('hsk1_b6_fill_03', '你明天____学校吗？', '去', b6WordBank),
  fillQuestion('hsk1_b6_fill_04', '你想____什么？', '买', b6WordBank),
  fillQuestion('hsk1_b6_fill_05', '我想喝____。', '牛奶', b6WordBank),
  fillQuestion('hsk1_b6_fill_06', '你____去学校？', '怎么', b6WordBank)
];
const b6Arrange = [
  arrangeQuestion('hsk1_b6_arrange_01', 'Sắp xếp câu hỏi chính phản:', ['你', '在', '不在', '家', '？'], '你在不在家？|你在不在家'),
  arrangeQuestion('hsk1_b6_arrange_02', 'Sắp xếp câu liên động:', ['我', '坐', '出租车', '去', '超市', '买', '东西', '。'], '我坐出租车去超市买东西。|我坐出租车去超市买东西')
];
const b6Reading = [readingPassage(
  'hsk1_b6_reading',
  'Đọc: Đi siêu thị',
  '今天星期五。下午我去超市买东西。我买牛奶、包子和米饭。晚上我在家吃晚饭。',
  [
    multipleChoice('hsk1_b6_read_01', '今天星期几？', ['星期一', '星期三', '星期五'], 2),
    multipleChoice('hsk1_b6_read_02', '下午“我”去哪儿？', ['学校', '超市', '店'], 1),
    multipleChoice('hsk1_b6_read_03', '“我”买什么？', ['牛奶、包子和米饭', '书和手机', '电影和东西'], 0),
    essayQuestion('hsk1_b6_read_04', '晚上“我”在哪儿吃晚饭？', '我在家吃晚饭。')
  ]
)];
const b6Listening = [
  listeningQuestion('hsk1_b6_listen_01', 'Nghe số điện thoại và chọn dãy số đúng.', ['18516893791', '18516839791', '15816893719'], 0, '我的手机号是幺八五幺六八九三七九幺。'),
  listeningQuestion('hsk1_b6_listen_02', 'Nghe và chọn hoạt động của người nói.', ['在家', '去学校', '买东西'], 2, '我下午去超市买东西。'),
  listeningQuestion('hsk1_b6_listen_03', 'Nghe và chọn đồ uống.', ['米饭', '牛奶', '包子'], 1, '我想喝牛奶。'),
  listeningQuestion('hsk1_b6_listen_04', 'Nghe và chọn phương tiện.', ['坐出租车', '坐飞机', '坐车去学校'], 0, '我坐出租车去店里。'),
  listeningFill('hsk1_b6_listen_05', 'Nghe và điền món ăn.', '包子', '晚饭我想吃包子。')
];
const b6Essay = [
  essayQuestion('hsk1_b6_essay_01', 'Viết một câu dùng 在, nói em đang làm gì ở đâu.', '我在家看书。'),
  essayQuestion('hsk1_b6_essay_02', 'Viết câu trả lời cho: 你怎么去学校？', '我坐出租车去学校。')
];
const b6Speaking = [
  speakingQuestion('hsk1_b6_speak_01', '你的手机号是多少？', 'Nǐ de shǒujī hàomǎ shì duōshao?'),
  speakingQuestion('hsk1_b6_speak_02', '你去哪儿？怎么去？', 'Nǐ qù nǎr? Zěnme qù?'),
  speakingQuestion('hsk1_b6_speak_03', '你想买什么？', 'Nǐ xiǎng mǎi shénme?'),
  speakingQuestion('hsk1_b6_speak_04', '晚饭你想吃什么？', 'Wǎnfàn nǐ xiǎng chī shénme?')
];
const b6Translation = [
  translationQuestion('hsk1_b6_tr_01', 'Dịch sang tiếng Trung và ghi âm: Ngày mai tôi đi siêu thị mua sữa.', 'vi_to_zh_audio', '明天我去超市买牛奶。'),
  translationQuestion('hsk1_b6_tr_02', 'Dịch sang chữ Hán: Tôi đang ăn tối ở nhà.', 'vi_to_zh_text', '我在家吃晚饭。'),
  translationQuestion('hsk1_b6_tr_03', 'Dịch sang tiếng Việt: 你去哪儿？', 'zh_to_vi_text', 'Bạn đi đâu?'),
  translationQuestion('hsk1_b6_tr_04', 'Dịch sang chữ Hán: Tôi đi taxi đến nhà hàng.', 'vi_to_zh_text', '我坐出租车去饭店。')
];

const b7Vocab = vocab(b7Words, 1, {
  '现在': 'Bây giờ', '现在_pinyin': 'xiànzài', '现在_type': 'Danh từ thời gian', '现在_example': '我现在在家。',
  '点': 'Giờ', '点_pinyin': 'diǎn', '点_type': 'Lượng từ thời gian', '点_example': '现在两点。',
  '分': 'Phút; điểm số', '分_pinyin': 'fēn', '分_type': 'Danh từ', '分_example': '十点十五分。',
  '上午': 'Buổi sáng', '上午_pinyin': 'shàngwǔ', '上午_type': 'Danh từ thời gian', '上午_example': '上午九点上课。',
  '下午': 'Buổi chiều', '下午_pinyin': 'xiàwǔ', '下午_type': 'Danh từ thời gian', '下午_example': '下午三点下课。',
  '中午': 'Buổi trưa', '中午_pinyin': 'zhōngwǔ', '中午_type': 'Danh từ thời gian', '中午_example': '中午十二点吃午饭。',
  '早上': 'Buổi sáng sớm', '早上_pinyin': 'zǎoshang', '早上_type': 'Danh từ thời gian', '早上_example': '早上七点吃早饭。',
  '晚上': 'Buổi tối', '晚上_pinyin': 'wǎnshang', '晚上_type': 'Danh từ thời gian', '晚上_example': '晚上六点半下班。',
  '半': 'Một nửa; rưỡi', '半_pinyin': 'bàn', '半_type': 'Danh từ / số lượng', '半_example': '七点半。',
  '课': 'Tiết học; bài học', '课_pinyin': 'kè', '课_type': 'Danh từ', '课_example': '我下午两点半有课。',
  '见': 'Gặp', '见_pinyin': 'jiàn', '见_type': 'Động từ', '见_example': '明天见！',
  '吧': 'Nhé; đi; nhé', '吧_pinyin': 'ba', '吧_type': 'Trợ từ ngữ khí', '吧_example': '我们下午四点见吧。',
  '电影': 'Phim điện ảnh', '电影_pinyin': 'diànyǐng', '电影_type': 'Danh từ', '电影_example': '这部电影很好看。',
  '院': 'Viện', '院_pinyin': 'yuàn', '院_type': 'Danh từ', '院_example': '电影院在学校后边。',
  '事': 'Việc; sự việc', '事_pinyin': 'shì', '事_type': 'Danh từ', '事_example': '他有很多事。',
  '医': 'Y; y học', '医_pinyin': 'yī', '医_type': 'Danh từ', '医_example': '他学医。',
  '分钟': 'Phút', '分钟_pinyin': 'fēnzhōng', '分钟_type': 'Danh từ thời gian', '分钟_example': '十分钟后见。',
  '里': 'Bên trong; trong', '里_pinyin': 'lǐ', '里_type': 'Phương vị từ', '里_example': '学校里有很多学生。',
  '后': 'Sau; phía sau', '后_pinyin': 'hòu', '后_type': 'Phương vị từ', '后_example': '十分钟后见。'
});
const b7WordBank = ['现在', '点', '分', '上午', '下午', '中午', '早上', '晚上', '半', '课', '见', '吧'];
const b7Mc = [
  multipleChoice('hsk1_b7_mc_01', '“7 giờ rưỡi” là:', ['七点三分', '七点半', '七分半', '七点后'], 1),
  multipleChoice('hsk1_b7_mc_02', 'Câu hỏi giờ đúng là:', ['现在多少？', '现在几点？', '现在几课？', '现在几分吗？'], 1),
  multipleChoice('hsk1_b7_mc_03', 'Chọn câu rủ/đề nghị đúng:', ['我们见吧下午。', '我们下午四点见吧。', '吧我们下午见四点。', '我们下午吧四点见。'], 1),
  multipleChoice('hsk1_b7_mc_04', '“下午两点半有课” nghĩa là:', ['2:30 chiều có tiết học', '2:00 sáng có tiết học', '12:30 trưa tan học', '4:30 chiều có việc'], 0)
];
const b7Fill = [
  fillQuestion('hsk1_b7_fill_01', '现在两____。', '点', b7WordBank),
  fillQuestion('hsk1_b7_fill_02', '十点十五____。', '分', b7WordBank),
  fillQuestion('hsk1_b7_fill_03', '我____九点上课。', '上午', b7WordBank),
  fillQuestion('hsk1_b7_fill_04', '____十二点吃午饭。', '中午', b7WordBank),
  fillQuestion('hsk1_b7_fill_05', '晚上六点____下班。', '半', b7WordBank),
  fillQuestion('hsk1_b7_fill_06', '明天____。', '见', b7WordBank)
];
const b7Arrange = [
  arrangeQuestion('hsk1_b7_arrange_01', 'Sắp xếp câu nói giờ:', ['现在', '两', '点', '半', '。'], '现在两点半。|现在两点半'),
  arrangeQuestion('hsk1_b7_arrange_02', 'Sắp xếp câu có trạng ngữ thời gian:', ['她', '上午', '十点半', '上课', '。'], '她上午十点半上课。|她上午十点半上课')
];
const b7Reading = [readingPassage(
  'hsk1_b7_reading',
  'Đọc: Một ngày học tập',
  '我早上七点吃早饭。上午九点上课。中午十二点吃午饭。下午四点下课。晚上六点半下班。',
  [
    multipleChoice('hsk1_b7_read_01', '“我”早上几点吃早饭？', ['六点半', '七点', '九点'], 1),
    multipleChoice('hsk1_b7_read_02', '“我”什么时候上课？', ['上午九点', '中午十二点', '下午四点'], 0),
    multipleChoice('hsk1_b7_read_03', '“我”什么时候下班？', ['下午四点', '晚上六点', '晚上六点半'], 2),
    essayQuestion('hsk1_b7_read_04', '“我”中午做什么？', '我中午吃午饭。')
  ]
)];
const b7Listening = [
  listeningQuestion('hsk1_b7_listen_01', 'Nghe và chọn giờ.', ['七点', '七点半', '七点十五分'], 1, '现在七点半。'),
  listeningQuestion('hsk1_b7_listen_02', 'Nghe và chọn buổi trong ngày.', ['上午', '中午', '晚上'], 2, '我晚上六点半下班。'),
  listeningQuestion('hsk1_b7_listen_03', 'Nghe và chọn hoạt động.', ['上课', '下课', '看电影'], 0, '我下午两点半上课。'),
  listeningQuestion('hsk1_b7_listen_04', 'Nghe và chọn lời đề nghị phù hợp.', ['我们下午四点见吧。', '我们下午四点上课。', '我们下午四点下班。'], 0, '我们下午四点见吧。'),
  listeningFill('hsk1_b7_listen_05', 'Nghe và điền từ chỉ thời gian.', '中午', '中午十二点吃午饭。')
];
const b7Essay = [
  essayQuestion('hsk1_b7_essay_01', 'Viết bằng tiếng Trung: 9 giờ 15 phút buổi sáng.', '上午九点十五分。'),
  essayQuestion('hsk1_b7_essay_02', 'Viết một câu dùng 吧 để rủ bạn gặp nhau.', '我们下午四点见吧。')
];
const b7Speaking = [
  speakingQuestion('hsk1_b7_speak_01', '现在几点？', 'Xiànzài jǐ diǎn?'),
  speakingQuestion('hsk1_b7_speak_02', '你几点上课？', 'Nǐ jǐ diǎn shàngkè?'),
  speakingQuestion('hsk1_b7_speak_03', '你早上吃什么？', 'Nǐ zǎoshang chī shénme?'),
  speakingQuestion('hsk1_b7_speak_04', '我们下午四点见吧。', 'Wǒmen xiàwǔ sì diǎn jiàn ba.')
];
const b7Translation = [
  translationQuestion('hsk1_b7_tr_01', 'Dịch sang tiếng Trung và ghi âm: Buổi trưa tôi ăn cơm.', 'vi_to_zh_audio', '中午我吃午饭。'),
  translationQuestion('hsk1_b7_tr_02', 'Dịch sang chữ Hán: Chiều 2 giờ rưỡi tôi có tiết học.', 'vi_to_zh_text', '下午两点半我有课。'),
  translationQuestion('hsk1_b7_tr_03', 'Dịch sang tiếng Việt: 明天见吧。', 'zh_to_vi_text', 'Hẹn gặp ngày mai nhé.'),
  translationQuestion('hsk1_b7_tr_04', 'Dịch sang chữ Hán: Buổi tối 6 giờ rưỡi tôi tan làm.', 'vi_to_zh_text', '晚上六点半下班。')
];

const b8Vocab = vocab(b8Words, 1, {
  '房间': 'Phòng', '房间_pinyin': 'fángjiān', '房间_type': 'Danh từ', '房间_example': '我家有三个房间。',
  '内': 'Trong; bên trong', '内_pinyin': 'nèi', '内_type': 'Phương vị từ', '内_example': '三天内。',
  '外': 'Ngoài; bên ngoài', '外_pinyin': 'wài', '外_type': 'Phương vị từ', '外_example': '房间外有一只猫。',
  '北京': 'Bắc Kinh', '北京_pinyin': 'Běijīng', '北京_type': 'Danh từ riêng', '北京_example': '我很喜欢北京。',
  '小': 'Nhỏ', '小_pinyin': 'xiǎo', '小_type': 'Tính từ', '小_example': '我的房间很小。',
  '猫': 'Mèo', '猫_pinyin': 'māo', '猫_type': 'Danh từ', '猫_example': '我有一只猫。',
  '狗': 'Chó', '狗_pinyin': 'gǒu', '狗_type': 'Danh từ', '狗_example': '我家有一只小狗。',
  '看见': 'Nhìn thấy', '看见_pinyin': 'kànjiàn', '看见_type': 'Động từ', '看见_example': '我看见小猫了。',
  '桌子': 'Cái bàn', '桌子_pinyin': 'zhuōzi', '桌子_type': 'Danh từ', '桌子_example': '桌子上有很多菜。',
  '漂亮': 'Đẹp; xinh', '漂亮_pinyin': 'piàoliang', '漂亮_type': 'Tính từ', '漂亮_example': '我家的小猫很漂亮。',
  '前': 'Trước; phía trước', '前_pinyin': 'qián', '前_type': 'Phương vị từ', '前_example': '他坐在我的前边。',
  '能': 'Có thể; có khả năng', '能_pinyin': 'néng', '能_type': 'Động từ năng nguyện', '能_example': '我能说汉语。',
  '到': 'Đến; tới', '到_pinyin': 'dào', '到_type': 'Động từ', '到_example': '我到了。',
  '病人': 'Bệnh nhân', '病人_pinyin': 'bìngrén', '病人_type': 'Danh từ', '病人_example': '医院里有很多病人。'
});
const b8WordBank = ['房间', '外', '北京', '小', '猫', '狗', '看见', '桌子', '漂亮', '前', '能', '到'];
const b8Mc = [
  multipleChoice('hsk1_b8_mc_01', 'Lượng từ thường dùng cho mèo và chó là:', ['本', '只', '家', '台'], 1),
  multipleChoice('hsk1_b8_mc_02', '“我没看见他” là câu phủ định của:', ['我看见他了。', '我看他。', '我在看他。', '我想看他。'], 0),
  multipleChoice('hsk1_b8_mc_03', 'Câu nào đúng?', ['小猫在桌子下。', '桌子小猫在下。', '在下桌子小猫。', '小猫桌子在下。'], 0),
  multipleChoice('hsk1_b8_mc_04', '“能不能” dùng để hỏi:', ['Địa điểm', 'Khả năng/có thể hay không', 'Giờ giấc', 'Giá tiền'], 1)
];
const b8Fill = [
  fillQuestion('hsk1_b8_fill_01', '我家有三个____。', '房间', b8WordBank),
  fillQuestion('hsk1_b8_fill_02', '我有一只____。', '猫', b8WordBank),
  fillQuestion('hsk1_b8_fill_03', '小猫在桌子____。', '下', [...b8WordBank, '下']),
  fillQuestion('hsk1_b8_fill_04', '我家的小猫很____。', '漂亮', b8WordBank),
  fillQuestion('hsk1_b8_fill_05', '你____说汉语吗？', '能', b8WordBank),
  fillQuestion('hsk1_b8_fill_06', '我____了，你在哪儿？', '到', b8WordBank)
];
const b8Arrange = [
  arrangeQuestion('hsk1_b8_arrange_01', 'Sắp xếp câu tồn tại:', ['桌子', '上', '有', '一本', '书', '。'], '桌子上有一本书。|桌子上有一本书'),
  arrangeQuestion('hsk1_b8_arrange_02', 'Sắp xếp câu hỏi khả năng:', ['你', '能', '不能', '说', '汉语', '？'], '你能不能说汉语？|你能不能说汉语')
];
const b8Reading = [readingPassage(
  'hsk1_b8_reading',
  'Đọc: Nhà tôi',
  '我家有三个房间。桌子上有一本书，桌子下有一只小猫。我有一只小狗。爸爸在医院工作。',
  [
    multipleChoice('hsk1_b8_read_01', '我家有几个房间？', ['一个', '两个', '三个'], 2),
    multipleChoice('hsk1_b8_read_02', '小猫在哪儿？', ['桌子上', '桌子下', '房间外'], 1),
    multipleChoice('hsk1_b8_read_03', '爸爸在哪儿工作？', ['学校', '医院', '超市'], 1),
    essayQuestion('hsk1_b8_read_04', 'Nhà “tôi” có những con vật nào?', '我有一只小猫和一只小狗。')
  ]
)];
const b8Listening = [
  listeningQuestion('hsk1_b8_listen_01', 'Nghe và chọn vị trí của mèo con.', ['桌子上', '桌子下', '房间外'], 1, '小猫在桌子下。'),
  listeningQuestion('hsk1_b8_listen_02', 'Nghe và chọn câu đúng.', ['我有一只狗。', '我有一只猫。', '我有一张桌子。'], 0, '我有一只小狗。'),
  listeningQuestion('hsk1_b8_listen_03', 'Nghe và chọn địa điểm.', ['北京', '学校', '医院'], 2, '爸爸在医院工作。'),
  listeningQuestion('hsk1_b8_listen_04', 'Nghe và chọn khả năng.', ['能说汉语', '不能说汉语', '能坐出租车'], 0, '她能说汉语。'),
  listeningFill('hsk1_b8_listen_05', 'Nghe và điền tính từ.', '漂亮', '我家的小猫很漂亮。')
];
const b8Essay = [
  essayQuestion('hsk1_b8_essay_01', 'Viết 2 câu giới thiệu căn phòng và một đồ vật trong phòng.', '我的房间很大。桌子上有一本书。'),
  essayQuestion('hsk1_b8_essay_02', 'Viết câu trả lời cho: 你家有几只猫？', '我家有一只猫。')
];
const b8Speaking = [
  speakingQuestion('hsk1_b8_speak_01', '你家有几个房间？', 'Nǐ jiā yǒu jǐ ge fángjiān?'),
  speakingQuestion('hsk1_b8_speak_02', '小猫在哪儿？', 'Xiǎomāo zài nǎr?'),
  speakingQuestion('hsk1_b8_speak_03', '你能说汉语吗？', 'Nǐ néng shuō Hànyǔ ma?'),
  speakingQuestion('hsk1_b8_speak_04', '你的房间怎么样？', 'Nǐ de fángjiān zěnmeyàng?')
];
const b8Translation = [
  translationQuestion('hsk1_b8_tr_01', 'Dịch sang tiếng Trung và ghi âm: Nhà tôi có một con mèo nhỏ.', 'vi_to_zh_audio', '我家有一只小猫。'),
  translationQuestion('hsk1_b8_tr_02', 'Dịch sang chữ Hán: Mèo con ở dưới bàn.', 'vi_to_zh_text', '小猫在桌子下。'),
  translationQuestion('hsk1_b8_tr_03', 'Dịch sang tiếng Việt: 他没看见我。', 'zh_to_vi_text', 'Anh ấy không nhìn thấy tôi.'),
  translationQuestion('hsk1_b8_tr_04', 'Dịch sang chữ Hán: Bố tôi làm việc ở bệnh viện.', 'vi_to_zh_text', '我爸爸在医院工作。')
];

const b9Vocab = vocab(b9Words, 1, {
  '边': 'Bên; phía', '边_pinyin': 'biān', '边_type': 'Phương vị từ', '边_example': '我在他们前边。',
  '家': 'Lượng từ cho cửa hàng/công ty/cơ sở', '家_pinyin': 'jiā', '家_type': 'Lượng từ', '家_example': '那是一家新书店。',
  '书': 'Sách', '书_pinyin': 'shū', '书_type': 'Danh từ', '书_example': '这本书很好看。',
  '椅子': 'Cái ghế', '椅子_pinyin': 'yǐzi', '椅子_type': 'Danh từ', '椅子_example': '椅子上有一本书。',
  '学习': 'Học; học tập', '学习_pinyin': 'xuéxí', '学习_type': 'Động từ', '学习_example': '他想学习中文。',
  '做': 'Làm; nấu', '做_pinyin': 'zuò', '做_type': 'Động từ', '做_example': '爸爸在做早饭。',
  '白天': 'Ban ngày', '白天_pinyin': 'báitiān', '白天_type': 'Danh từ thời gian', '白天_example': '今天白天我在家。',
  '读': 'Đọc', '读_pinyin': 'dú', '读_type': 'Động từ', '读_example': '我读书。',
  '说': 'Nói', '说_pinyin': 'shuō', '说_type': 'Động từ', '说_example': '我会说中文。',
  '听': 'Nghe', '听_pinyin': 'tīng', '听_type': 'Động từ', '听_example': '听我说。',
  '唱': 'Hát', '唱_pinyin': 'chàng', '唱_type': 'Động từ', '唱_example': '她会唱歌。',
  '歌': 'Bài hát', '歌_pinyin': 'gē', '歌_type': 'Danh từ', '歌_example': '妹妹喜欢唱歌。',
  '电视': 'TV; truyền hình', '电视_pinyin': 'diànshì', '电视_type': 'Danh từ', '电视_example': '妹妹想看电视。',
  '玩': 'Chơi', '玩_pinyin': 'wán', '玩_type': 'Động từ', '玩_example': '我喜欢玩电脑。'
});
const b9WordBank = ['边', '家', '书', '椅子', '学习', '做', '白天', '读', '说', '听', '唱', '歌', '电视', '玩'];
const b9Mc = [
  multipleChoice('hsk1_b9_mc_01', 'Lượng từ của “书” là:', ['只', '本', '台', '家'], 1),
  multipleChoice('hsk1_b9_mc_02', 'Câu nào đúng?', ['椅子上有一本书。', '一本书椅子有上。', '有椅子上一本书。', '书上有一本椅子。'], 0),
  multipleChoice('hsk1_b9_mc_03', '“听我说” có nghĩa là:', ['Nghe tôi nói', 'Tôi nói nghe', 'Hát cho tôi nghe', 'Xem TV'], 0),
  multipleChoice('hsk1_b9_mc_04', 'Chọn câu có 和 làm từ nối:', ['我和你去吧。', '我和你说。', '他对我很好。', '我给妈妈买书。'], 0)
];
const b9Fill = [
  fillQuestion('hsk1_b9_fill_01', '超市后____是一家书店。', '边', b9WordBank),
  fillQuestion('hsk1_b9_fill_02', '椅子上有一本____。', '书', b9WordBank),
  fillQuestion('hsk1_b9_fill_03', '我想____中文。', '学习', b9WordBank),
  fillQuestion('hsk1_b9_fill_04', '爸爸在____早饭。', '做', b9WordBank),
  fillQuestion('hsk1_b9_fill_05', '我喜欢听____。', '歌', b9WordBank),
  fillQuestion('hsk1_b9_fill_06', '妹妹想看____。', '电视', b9WordBank)
];
const b9Arrange = [
  arrangeQuestion('hsk1_b9_arrange_01', 'Sắp xếp câu tồn hiện:', ['学校', '前边', '有', '一家', '电影院', '。'], '学校前边有一家电影院。|学校前边有一家电影院'),
  arrangeQuestion('hsk1_b9_arrange_02', 'Sắp xếp câu với 和:', ['我', '和', '你', '去', '吧', '。'], '我和你去吧。|我和你去吧')
];
const b9Reading = [readingPassage(
  'hsk1_b9_reading',
  'Đọc: Một ngày ở nhà',
  '白天爸爸在家做早饭。我在椅子上读书。下午我学习中文。晚上我和小狗玩，也听歌。',
  [
    multipleChoice('hsk1_b9_read_01', '白天爸爸做什么？', ['做早饭', '看电视', '唱歌'], 0),
    multipleChoice('hsk1_b9_read_02', '“我”在哪儿读书？', ['桌子下', '椅子上', '学校里'], 1),
    multipleChoice('hsk1_b9_read_03', '晚上“我”做什么？', ['和小狗玩，也听歌', '学习中文', '去电影院'], 0),
    essayQuestion('hsk1_b9_read_04', '“我”喜欢学习什么？', '我喜欢学习中文。')
  ]
)];
const b9Listening = [
  listeningQuestion('hsk1_b9_listen_01', 'Nghe và chọn nơi có quyển sách.', ['椅子上', '桌子下', '学校前边'], 0, '椅子上有一本书。'),
  listeningQuestion('hsk1_b9_listen_02', 'Nghe và chọn hoạt động.', ['读书', '看电视', '买水果'], 1, '妹妹想看电视。'),
  listeningQuestion('hsk1_b9_listen_03', 'Nghe và chọn ngôn ngữ.', ['中文', '法语', '英语'], 0, '我会说中文。'),
  listeningQuestion('hsk1_b9_listen_04', 'Nghe và chọn người cùng chơi.', ['小猫', '小狗', '老师'], 1, '我喜欢和小狗玩。'),
  listeningFill('hsk1_b9_listen_05', 'Nghe và điền động từ.', '唱', '她会唱歌。')
];
const b9Essay = [
  essayQuestion('hsk1_b9_essay_01', 'Viết 2 câu về việc em làm ban ngày và buổi tối.', '白天我学习中文。晚上我看电视。'),
  essayQuestion('hsk1_b9_essay_02', 'Viết một câu dùng 和 nói em đi cùng ai.', '我和朋友去学校。')
];
const b9Speaking = [
  speakingQuestion('hsk1_b9_speak_01', '你白天做什么？', 'Nǐ báitiān zuò shénme?'),
  speakingQuestion('hsk1_b9_speak_02', '你喜欢看电视吗？', 'Nǐ xǐhuan kàn diànshì ma?'),
  speakingQuestion('hsk1_b9_speak_03', '你会唱中文歌吗？', 'Nǐ huì chàng Zhōngwén gē ma?'),
  speakingQuestion('hsk1_b9_speak_04', '你喜欢和谁玩？', 'Nǐ xǐhuan hé shéi wán?')
];
const b9Translation = [
  translationQuestion('hsk1_b9_tr_01', 'Dịch sang tiếng Trung và ghi âm: Tôi thích học tiếng Trung.', 'vi_to_zh_audio', '我喜欢学习中文。'),
  translationQuestion('hsk1_b9_tr_02', 'Dịch sang chữ Hán: Trên ghế có một quyển sách.', 'vi_to_zh_text', '椅子上有一本书。'),
  translationQuestion('hsk1_b9_tr_03', 'Dịch sang tiếng Việt: 我喜欢和小狗玩。', 'zh_to_vi_text', 'Tôi thích chơi với chó con.'),
  translationQuestion('hsk1_b9_tr_04', 'Dịch sang chữ Hán: Buổi tối em gái tôi muốn xem TV.', 'vi_to_zh_text', '晚上我妹妹想看电视。')
];

const b10Vocab = vocab(b10Words, 1, {
  '杯子': 'Cốc; ly', '杯子_pinyin': 'bēizi', '杯子_type': 'Danh từ', '杯子_example': '这个杯子太小了。',
  '卖': 'Bán', '卖_pinyin': 'mài', '卖_type': 'Động từ', '卖_example': '我们这边卖水果。',
  '售货员': 'Nhân viên bán hàng', '售货员_pinyin': 'shòuhuòyuán', '售货员_type': 'Danh từ', '售货员_example': '我是这个店的售货员。',
  '钱': 'Tiền', '钱_pinyin': 'qián', '钱_type': 'Danh từ', '钱_example': '这本书多少钱？',
  '块': 'Tệ; đồng (khẩu ngữ)', '块_pinyin': 'kuài', '块_type': 'Lượng từ tiền tệ', '块_example': '一块钱。',
  '元': 'Tệ (cách nói tiêu chuẩn)', '元_pinyin': 'yuán', '元_type': 'Lượng từ tiền tệ', '元_example': '这件衣服一百元。',
  '水果': 'Hoa quả', '水果_pinyin': 'shuǐguǒ', '水果_type': 'Danh từ', '水果_example': '我喜欢吃水果。',
  '少': 'Ít', '少_pinyin': 'shǎo', '少_type': 'Tính từ', '少_example': '这里的水果不少。',
  '斤': 'Cân Trung Quốc', '斤_pinyin': 'jīn', '斤_type': 'Đơn vị khối lượng', '斤_example': '我买了一斤苹果。',
  '苹果': 'Táo', '苹果_pinyin': 'píngguǒ', '苹果_type': 'Danh từ', '苹果_example': '我早上吃了一个苹果。',
  '便宜': 'Rẻ', '便宜_pinyin': 'piányi', '便宜_type': 'Tính từ', '便宜_example': '苹果很便宜。',
  '贵': 'Đắt', '贵_pinyin': 'guì', '贵_type': 'Tính từ', '贵_example': '这个手机太贵了。',
  '商店': 'Cửa hàng', '商店_pinyin': 'shāngdiàn', '商店_type': 'Danh từ', '商店_example': '我去商店买东西。',
  '衣服': 'Quần áo', '衣服_pinyin': 'yīfu', '衣服_type': 'Danh từ', '衣服_example': '这件衣服很好看。',
  '怎么样': 'Thế nào?', '怎么样_pinyin': 'zěnmeyàng', '怎么样_type': 'Đại từ nghi vấn', '怎么样_example': '这件衣服怎么样？',
  '穿': 'Mặc', '穿_pinyin': 'chuān', '穿_type': 'Động từ', '穿_example': '我不想穿这件衣服。'
});
const b10WordBank = ['杯子', '卖', '钱', '块', '元', '水果', '少', '斤', '苹果', '便宜', '贵', '商店', '衣服', '怎么样', '穿'];
const b10Mc = [
  multipleChoice('hsk1_b10_mc_01', '“20元” trong khẩu ngữ thường nói là:', ['二十本', '二十块', '二十斤', '二十家'], 1),
  multipleChoice('hsk1_b10_mc_02', 'Câu hỏi giá đúng là:', ['多少钱？', '多少岁？', '多少人？', '怎么样钱？'], 0),
  multipleChoice('hsk1_b10_mc_03', 'Câu nào có tính từ làm vị ngữ đúng?', ['苹果很便宜。', '苹果便宜很。', '很苹果便宜。', '苹果是便宜。'], 0),
  multipleChoice('hsk1_b10_mc_04', '“怎么” và “怎么样” khác nhau ở chỗ:', ['怎么 hỏi cách làm; 怎么样 hỏi đánh giá', '怎么 hỏi giá; 怎么样 hỏi giờ', 'Hai từ hoàn toàn giống nhau', '怎么 chỉ dùng cho người'], 0),
  multipleChoice('hsk1_b10_mc_05', 'Chọn lượng từ đúng:', ['一斤苹果', '一件苹果', '一家苹果', '一台苹果'], 0)
];
const b10Fill = [
  fillQuestion('hsk1_b10_fill_01', '这个____太小了。', '杯子', b10WordBank),
  fillQuestion('hsk1_b10_fill_02', '这本书八十____钱。', '块', b10WordBank),
  fillQuestion('hsk1_b10_fill_03', '我买了一____苹果。', '斤', b10WordBank),
  fillQuestion('hsk1_b10_fill_04', '苹果很____。', '便宜', b10WordBank),
  fillQuestion('hsk1_b10_fill_05', '这个手机太____了。', '贵', b10WordBank),
  fillQuestion('hsk1_b10_fill_06', '这件衣服____？', '怎么样', b10WordBank)
];
const b10Arrange = [
  arrangeQuestion('hsk1_b10_arrange_01', 'Sắp xếp câu hỏi giá:', ['这本书', '多少', '钱', '？'], '这本书多少钱？|这本书多少钱'),
  arrangeQuestion('hsk1_b10_arrange_02', 'Sắp xếp câu vị ngữ tính từ:', ['这儿', '的', '苹果', '真', '便宜', '！'], '这儿的苹果真便宜！|这儿的苹果真便宜')
];
const b10Reading = [readingPassage(
  'hsk1_b10_reading',
  'Đọc: Mua hoa quả và quần áo',
  '我去这家商店买水果和衣服。苹果一斤三块五，很便宜。这件衣服一百元。衣服很漂亮，太贵了。',
  [
    multipleChoice('hsk1_b10_read_01', '“我”去商店买什么？', ['水果和衣服', '书和电视', '牛奶和包子'], 0),
    multipleChoice('hsk1_b10_read_02', '苹果一斤多少钱？', ['三块', '三块五', '一百元'], 1),
    multipleChoice('hsk1_b10_read_03', '衣服怎么样？', ['很少', '很漂亮，但是太贵', '很小'], 1),
    essayQuestion('hsk1_b10_read_04', '“我”认为苹果怎么样？', '我觉得苹果很便宜。')
  ]
)];
const b10Listening = [
  listeningQuestion('hsk1_b10_listen_01', 'Nghe và chọn giá của táo.', ['三块', '三块五', '五块三'], 1, '苹果一斤三块五。'),
  listeningQuestion('hsk1_b10_listen_02', 'Nghe và chọn đồ vật.', ['杯子', '衣服', '苹果'], 0, '这个杯子太小了。'),
  listeningQuestion('hsk1_b10_listen_03', 'Nghe và chọn đánh giá.', ['便宜', '贵', '少'], 0, '这家商店的水果很便宜。'),
  listeningQuestion('hsk1_b10_listen_04', 'Nghe và chọn giá của quần áo.', ['二十元', '八十元', '一百元'], 2, '这件衣服一百元。'),
  listeningFill('hsk1_b10_listen_05', 'Nghe và điền động từ.', '穿', '我不想穿这件衣服。')
];
const b10Essay = [
  essayQuestion('hsk1_b10_essay_01', 'Viết một câu hỏi giá và một câu trả lời dùng 块.', '这个杯子多少钱？二十块。'),
  essayQuestion('hsk1_b10_essay_02', 'Dùng 怎么样 viết câu hỏi đánh giá một bộ quần áo.', '这件衣服怎么样？')
];
const b10Speaking = [
  speakingQuestion('hsk1_b10_speak_01', '这个杯子多少钱？', 'Zhège bēizi duōshao qián?'),
  speakingQuestion('hsk1_b10_speak_02', '你喜欢吃什么水果？', 'Nǐ xǐhuan chī shénme shuǐguǒ?'),
  speakingQuestion('hsk1_b10_speak_03', '这件衣服怎么样？', 'Zhè jiàn yīfu zěnmeyàng?'),
  speakingQuestion('hsk1_b10_speak_04', '你想买什么？', 'Nǐ xiǎng mǎi shénme?')
];
const b10Translation = [
  translationQuestion('hsk1_b10_tr_01', 'Dịch sang tiếng Trung và ghi âm: Tôi mua một cân táo.', 'vi_to_zh_audio', '我买了一斤苹果。'),
  translationQuestion('hsk1_b10_tr_02', 'Dịch sang chữ Hán: Những quả táo này rất rẻ.', 'vi_to_zh_text', '这些苹果很便宜。'),
  translationQuestion('hsk1_b10_tr_03', 'Dịch sang tiếng Việt: 这件衣服太贵了。', 'zh_to_vi_text', 'Bộ quần áo này đắt quá.'),
  translationQuestion('hsk1_b10_tr_04', 'Dịch sang chữ Hán: Cửa hàng này bán hoa quả.', 'vi_to_zh_text', '这家商店卖水果。')
];

const b11Vocab = vocab(b11Words, 1, {
  '时候': 'Lúc; khi; thời điểm', '时候_pinyin': 'shíhou', '时候_type': 'Danh từ', '时候_example': '你什么时候回家？',
  '知道': 'Biết', '知道_pinyin': 'zhīdào', '知道_type': 'Động từ', '知道_example': '我不知道。',
  '车': 'Xe', '车_pinyin': 'chē', '车_type': 'Danh từ', '车_example': '我想坐车。',
  '辆': 'Lượng từ cho xe', '辆_pinyin': 'liàng', '辆_type': 'Lượng từ', '辆_example': '一辆车。',
  '骑': 'Cưỡi; đi bằng xe hai bánh', '骑_pinyin': 'qí', '骑_type': 'Động từ', '骑_example': '我骑车上学。',
  '找': 'Tìm', '找_pinyin': 'zhǎo', '找_type': 'Động từ', '找_example': '我找东西。',
  '正在': 'Đang', '正在_pinyin': 'zhèngzài', '正在_type': 'Phó từ', '正在_example': '她正在开车。',
  '还': 'Vẫn; còn', '还_pinyin': 'hái', '还_type': 'Phó từ', '还_example': '我还在上班。',
  '大学': 'Đại học', '大学_pinyin': 'dàxué', '大学_type': 'Danh từ', '大学_example': '我读大学。',
  '弟弟': 'Em trai', '弟弟_pinyin': 'dìdi', '弟弟_type': 'Danh từ', '弟弟_example': '我弟弟今年十岁了。',
  '起床': 'Thức dậy', '起床_pinyin': 'qǐchuáng', '起床_type': 'Động từ', '起床_example': '弟弟不想起床。',
  '睡觉': 'Ngủ', '睡觉_pinyin': 'shuìjiào', '睡觉_type': 'Động từ ly hợp', '睡觉_example': '我昨天晚上没睡觉。',
  '问': 'Hỏi', '问_pinyin': 'wèn', '问_type': 'Động từ', '问_example': '我想问老师。',
  '说': 'Nói', '说_pinyin': 'shuō', '说_type': 'Động từ', '说_example': '她会说中文。',
  '对': 'Đúng; đối với; với', '对_pinyin': 'duì', '对_type': 'Giới từ / tính từ', '对_example': '他对我很好。',
  '要': 'Muốn; phải; cần', '要_pinyin': 'yào', '要_type': 'Động từ năng nguyện', '要_example': '我要回家。'
});
const b11WordBank = ['时候', '知道', '车', '辆', '骑', '找', '正在', '还', '大学', '弟弟', '起床', '睡觉', '问', '说', '对', '要'];
const b11Mc = [
  multipleChoice('hsk1_b11_mc_01', '“妈妈做饭的时候，我学中文” nghĩa là:', ['Khi mẹ nấu cơm, tôi học tiếng Trung', 'Tôi hỏi mẹ về tiếng Trung', 'Mẹ đi học đại học'], 0),
  multipleChoice('hsk1_b11_mc_02', 'Phủ định phù hợp của “正在学习” là:', ['不正在学习', '没在学习', '不有学习', '没是学习'], 1),
  multipleChoice('hsk1_b11_mc_03', 'Câu nào đúng?', ['我正在睡觉呢。', '我正在睡觉吗呢。', '我睡觉正在。', '我没正在睡觉。'], 0),
  multipleChoice('hsk1_b11_mc_04', '“知道” khác “会” ở chỗ:', ['知道 là biết thông tin; 会 là biết kỹ năng', 'Hai từ hoàn toàn giống nhau', '知道 chỉ dùng cho giờ', '会 chỉ dùng cho người'], 0),
  multipleChoice('hsk1_b11_mc_05', 'Lượng từ của xe là:', ['辆', '家', '本', '件'], 0)
];
const b11Fill = [
  fillQuestion('hsk1_b11_fill_01', '你什么____回家？', '时候', b11WordBank),
  fillQuestion('hsk1_b11_fill_02', '我不____你的手机在哪儿。', '知道', b11WordBank),
  fillQuestion('hsk1_b11_fill_03', '爸爸正在____车。', '开', [...b11WordBank, '开']),
  fillQuestion('hsk1_b11_fill_04', '我____在学习中文呢。', '正在', b11WordBank),
  fillQuestion('hsk1_b11_fill_05', '弟弟还在____觉。', '睡', [...b11WordBank, '睡']),
  fillQuestion('hsk1_b11_fill_06', '我想____一个问题。', '问', b11WordBank)
];
const b11Arrange = [
  arrangeQuestion('hsk1_b11_arrange_01', 'Sắp xếp câu đang diễn ra:', ['我', '正在', '学习', '中文', '呢', '。'], '我正在学习中文呢。|我正在学习中文呢'),
  arrangeQuestion('hsk1_b11_arrange_02', 'Sắp xếp câu với 的时候:', ['妈妈', '做饭', '的', '时候', '我', '在', '学中文', '。'], '妈妈做饭的时候我在学中文。|妈妈做饭的时候，我在学中文。|妈妈做饭的时候我在学中文')
];
const b11Reading = [readingPassage(
  'hsk1_b11_reading',
  'Đọc: Em trai vẫn đang ngủ',
  '我弟弟还在睡觉。爸爸正在开车去学校。妈妈问我：你知道弟弟起床了吗？我说：我不知道。',
  [
    multipleChoice('hsk1_b11_read_01', '弟弟在做什么？', ['起床', '睡觉', '学习'], 1),
    multipleChoice('hsk1_b11_read_02', '爸爸正在做什么？', ['开车', '吃饭', '说话'], 0),
    multipleChoice('hsk1_b11_read_03', '妈妈问“我”什么？', ['弟弟去哪儿', '弟弟起床了吗', '弟弟会不会说话'], 1),
    essayQuestion('hsk1_b11_read_04', '“我”知道弟弟起床了吗？', '我不知道。')
  ]
)];
const b11Listening = [
  listeningQuestion('hsk1_b11_listen_01', 'Nghe và chọn hoạt động đang diễn ra.', ['看电视', '学习中文', '睡觉'], 1, '我正在学习中文呢。'),
  listeningQuestion('hsk1_b11_listen_02', 'Nghe và chọn người đang ngủ.', ['弟弟', '爸爸', '妈妈'], 0, '弟弟还在睡觉。'),
  listeningQuestion('hsk1_b11_listen_03', 'Nghe và chọn phương tiện.', ['骑车', '坐飞机', '开车'], 2, '爸爸正在开车。'),
  listeningQuestion('hsk1_b11_listen_04', 'Nghe và chọn ý nghĩa của 要 trong câu.', ['Muốn về nhà', 'Biết về nhà', 'Đang về nhà'], 0, '我要回家。'),
  listeningFill('hsk1_b11_listen_05', 'Nghe và điền phó từ.', '还', '我还在上班。')
];
const b11Essay = [
  essayQuestion('hsk1_b11_essay_01', 'Viết 2 câu nói em đang làm gì và người thân đang làm gì.', '我正在学习中文。弟弟正在睡觉。'),
  essayQuestion('hsk1_b11_essay_02', 'Viết câu trả lời cho: 你什么时候回家？', '我晚上回家。')
];
const b11Speaking = [
  speakingQuestion('hsk1_b11_speak_01', '你现在在做什么呢？', 'Nǐ xiànzài zài zuò shénme ne?'),
  speakingQuestion('hsk1_b11_speak_02', '你会不会开车？', 'Nǐ huì bu huì kāichē?'),
  speakingQuestion('hsk1_b11_speak_03', '你什么时候起床？', 'Nǐ shénme shíhou qǐchuáng?'),
  speakingQuestion('hsk1_b11_speak_04', '你还在学习中文吗？', 'Nǐ hái zài xuéxí Zhōngwén ma?')
];
const b11Translation = [
  translationQuestion('hsk1_b11_tr_01', 'Dịch sang tiếng Trung và ghi âm: Em trai tôi vẫn đang ngủ.', 'vi_to_zh_audio', '我弟弟还在睡觉。'),
  translationQuestion('hsk1_b11_tr_02', 'Dịch sang chữ Hán: Khi mẹ nấu cơm, tôi đang học tiếng Trung.', 'vi_to_zh_text', '妈妈做饭的时候，我在学中文。'),
  translationQuestion('hsk1_b11_tr_03', 'Dịch sang tiếng Việt: 你知道弟弟在哪儿吗？', 'zh_to_vi_text', 'Bạn có biết em trai ở đâu không?'),
  translationQuestion('hsk1_b11_tr_04', 'Dịch sang chữ Hán: Tôi không biết.', 'vi_to_zh_text', '我不知道。')
];

const b12Vocab = vocab(b12Words, 1, {
  '天气': 'Thời tiết', '天气_pinyin': 'tiānqì', '天气_type': 'Danh từ', '天气_example': '今天天气怎么样？',
  '天': 'Trời; ngày', '天_pinyin': 'tiān', '天_type': 'Danh từ', '天_example': '今天下雨了。',
  '雨': 'Mưa', '雨_pinyin': 'yǔ', '雨_type': 'Danh từ', '雨_example': '外面下大雨呢。',
  '下雨': 'Mưa; trời mưa', '下雨_pinyin': 'xiàyǔ', '下雨_type': 'Động từ', '下雨_example': '下雨了。',
  '雪': 'Tuyết', '雪_pinyin': 'xuě', '雪_type': 'Danh từ', '雪_example': '下雪了。',
  '觉得': 'Cảm thấy; cho rằng', '觉得_pinyin': 'juéde', '觉得_type': 'Động từ', '觉得_example': '我觉得有点儿冷。',
  '冷': 'Lạnh', '冷_pinyin': 'lěng', '冷_type': 'Tính từ', '冷_example': '今天很冷。',
  '热': 'Nóng', '热_pinyin': 'rè', '热_type': 'Tính từ', '热_example': '天气很热。',
  '一点儿': 'Một chút; một ít', '一点儿_pinyin': 'yìdiǎnr', '一点儿_type': 'Đại từ chỉ lượng', '一点儿_example': '买一点儿水果。',
  '来': 'Đến', '来_pinyin': 'lái', '来_type': 'Động từ', '来_example': '我朋友来我家。',
  '公司': 'Công ty', '公司_pinyin': 'gōngsī', '公司_type': 'Danh từ', '公司_example': '我们公司不大。',
  '生病': 'Bị ốm; bị bệnh', '生病_pinyin': 'shēngbìng', '生病_type': 'Động từ', '生病_example': '我生病了。',
  '看病': 'Đi khám bệnh', '看病_pinyin': 'kànbìng', '看病_type': 'Động từ', '看病_example': '我去医院看病。',
  '药': 'Thuốc', '药_pinyin': 'yào', '药_type': 'Danh từ', '药_example': '我去买药。',
  '回': 'Về; quay về', '回_pinyin': 'huí', '回_type': 'Động từ', '回_example': '我回家。',
  '再': 'Lại; rồi mới', '再_pinyin': 'zài', '再_type': 'Phó từ', '再_example': '吃饭再回家。',
  '喝': 'Uống', '喝_pinyin': 'hē', '喝_type': 'Động từ', '喝_example': '多喝点儿水吧。'
});
const b12WordBank = ['天气', '天', '雨', '下雨', '雪', '觉得', '冷', '热', '一点儿', '来', '公司', '生病', '看病', '药', '回', '再'];
const b12Mc = [
  multipleChoice('hsk1_b12_mc_01', 'Câu “下雨了” diễn tả:', ['Một hành động đang được hỏi', 'Trạng thái mới: trời mưa rồi', 'Một địa điểm', 'Một số lượng'], 1),
  multipleChoice('hsk1_b12_mc_02', '“有点儿冷” nghĩa là:', ['Hơi lạnh', 'Lạnh hơn một chút', 'Rất nóng', 'Không lạnh'], 0),
  multipleChoice('hsk1_b12_mc_03', 'Câu nào dùng 再 đúng?', ['再吃饭回家', '吃了饭再回家', '回家再吃了饭', '再不回家吃饭了'], 1),
  multipleChoice('hsk1_b12_mc_04', '来 và 到 khác nhau chủ yếu ở:', ['Góc nhìn hướng về mốc và nhấn mạnh điểm đến', 'Một từ chỉ thời tiết', 'Một từ chỉ giá tiền', 'Hai từ chỉ phương tiện'], 0),
  multipleChoice('hsk1_b12_mc_05', 'Câu nào tự nhiên?', ['我生病了。', '我有病了。', '我生了病了。', '我病生了。'], 0)
];
const b12Fill = [
  fillQuestion('hsk1_b12_fill_01', '今天天气很____。', '热', b12WordBank),
  fillQuestion('hsk1_b12_fill_02', '下雨了，真____。', '冷', b12WordBank),
  fillQuestion('hsk1_b12_fill_03', '我____有点儿冷。', '觉得', b12WordBank),
  fillQuestion('hsk1_b12_fill_04', '我生病了，要去____病。', '看', [...b12WordBank, '看']),
  fillQuestion('hsk1_b12_fill_05', '吃了饭____回家。', '再', b12WordBank),
  fillQuestion('hsk1_b12_fill_06', '弟弟病了，我去买____。', '药', b12WordBank)
];
const b12Arrange = [
  arrangeQuestion('hsk1_b12_arrange_01', 'Sắp xếp câu trạng thái mới:', ['下雨', '了', '。'], '下雨了。|下雨了'),
  arrangeQuestion('hsk1_b12_arrange_02', 'Sắp xếp câu với 再:', ['吃了饭', '再', '回家', '吧', '。'], '吃了饭再回家吧。|吃了饭再回家吧')
];
const b12Reading = [readingPassage(
  'hsk1_b12_reading',
  'Đọc: Hôm nay trời mưa',
  '今天下雨了，天气有点儿冷。我生病了，下午去医院看病。买了药，我回家。明天我再来学校。',
  [
    multipleChoice('hsk1_b12_read_01', '今天天气怎么样？', ['很热', '有点儿冷', '非常好'], 1),
    multipleChoice('hsk1_b12_read_02', '“我”下午去哪儿？', ['公司', '学校', '医院'], 2),
    multipleChoice('hsk1_b12_read_03', '看病后“我”做什么？', ['回家', '去北京', '吃晚饭'], 0),
    essayQuestion('hsk1_b12_read_04', '“我”为什么去医院？', '因为我生病了。')
  ]
)];
const b12Listening = [
  listeningQuestion('hsk1_b12_listen_01', 'Nghe và chọn thời tiết.', ['下雨', '下雪', '天气很热'], 0, '今天下雨了。'),
  listeningQuestion('hsk1_b12_listen_02', 'Nghe và chọn cảm giác.', ['很热', '有点儿冷', '非常漂亮'], 1, '我觉得有点儿冷。'),
  listeningQuestion('hsk1_b12_listen_03', 'Nghe và chọn việc cần làm.', ['去看病', '去买衣服', '去看电影'], 0, '我生病了，要去看病。'),
  listeningQuestion('hsk1_b12_listen_04', 'Nghe và chọn thứ tự hành động.', ['吃饭再回家', '回家再吃饭', '再吃药看病'], 0, '吃了饭再回家吧。'),
  listeningFill('hsk1_b12_listen_05', 'Nghe và điền danh từ.', '药', '弟弟病了，我去买药。')
];
const b12Essay = [
  essayQuestion('hsk1_b12_essay_01', 'Viết 2 câu mô tả thời tiết hôm nay và cảm giác của em.', '今天天气很热。我觉得很好。'),
  essayQuestion('hsk1_b12_essay_02', 'Viết câu dùng “V了再V”.', '吃了饭再回家。')
];
const b12Speaking = [
  speakingQuestion('hsk1_b12_speak_01', '今天天气怎么样？', 'Jīntiān tiānqì zěnmeyàng?'),
  speakingQuestion('hsk1_b12_speak_02', '你觉得今天冷不冷？', 'Nǐ juéde jīntiān lěng bu lěng?'),
  speakingQuestion('hsk1_b12_speak_03', '你生病的时候会做什么？', 'Nǐ shēngbìng de shíhou huì zuò shénme?'),
  speakingQuestion('hsk1_b12_speak_04', '你什么时候回家？', 'Nǐ shénme shíhou huí jiā?')
];
const b12Translation = [
  translationQuestion('hsk1_b12_tr_01', 'Dịch sang tiếng Trung và ghi âm: Hôm nay trời mưa rồi.', 'vi_to_zh_audio', '今天下雨了。'),
  translationQuestion('hsk1_b12_tr_02', 'Dịch sang chữ Hán: Tôi cảm thấy hơi lạnh.', 'vi_to_zh_text', '我觉得有点儿冷。'),
  translationQuestion('hsk1_b12_tr_03', 'Dịch sang tiếng Việt: 吃了饭再回家吧。', 'zh_to_vi_text', 'Ăn cơm xong rồi hãy về nhà nhé.'),
  translationQuestion('hsk1_b12_tr_04', 'Dịch sang chữ Hán: Tôi bị ốm, phải đi khám bệnh.', 'vi_to_zh_text', '我生病了，要去看病。')
];

const b13Vocab = vocab(b13Words, 1, {
  '问题': 'Câu hỏi; vấn đề', '问题_pinyin': 'wèntí', '问题_type': 'Danh từ', '问题_example': '我有一个问题。',
  '一下': 'Một chút; một lát', '一下_pinyin': 'yíxià', '一下_type': 'Bổ ngữ lượng', '一下_example': '请问一下。',
  '给': 'Cho; với; tới', '给_pinyin': 'gěi', '给_type': 'Động từ / giới từ', '给_example': '我给妈妈买一个杯子。',
  '可以': 'Có thể; được phép', '可以_pinyin': 'kěyǐ', '可以_type': 'Động từ năng nguyện', '可以_example': '我可以坐吗？',
  '服务员': 'Nhân viên phục vụ', '服务员_pinyin': 'fúwùyuán', '服务员_type': 'Danh từ', '服务员_example': '我是这家饭店的服务员。',
  '女士': 'Quý cô; quý bà', '女士_pinyin': 'nǚshì', '女士_type': 'Danh từ xưng hô', '女士_example': '王女士是我的同学。',
  '先生': 'Ông; ngài', '先生_pinyin': 'xiānsheng', '先生_type': 'Danh từ xưng hô', '先生_example': '李先生，您好！',
  '面包': 'Bánh mì', '面包_pinyin': 'miànbāo', '面包_type': 'Danh từ', '面包_example': '我想再吃一块面包。',
  '鸡蛋': 'Trứng gà', '鸡蛋_pinyin': 'jīdàn', '鸡蛋_type': 'Danh từ', '鸡蛋_example': '早饭有两个鸡蛋。',
  '茶': 'Trà', '茶_pinyin': 'chá', '茶_type': 'Danh từ', '茶_example': '我喜欢喝茶。'
});
const b13WordBank = ['问题', '一下', '给', '可以', '服务员', '女士', '先生', '面包', '鸡蛋', '茶'];
const b13Mc = [
  multipleChoice('hsk1_b13_mc_01', '“看一下” có sắc thái:', ['Làm/xem một chút, nghe nhẹ nhàng hơn', 'Đã xem xong', 'Không được xem', 'Xem ở đâu'], 0),
  multipleChoice('hsk1_b13_mc_02', 'Trong câu “我给妈妈买杯子”, 给 là:', ['Động từ chính “cho”', 'Giới từ chỉ người nhận', 'Lượng từ', 'Trợ từ ngữ khí'], 1),
  multipleChoice('hsk1_b13_mc_03', 'Câu song tân ngữ đúng là:', ['请给我一杯茶。', '请我给一杯茶。', '一杯茶给请我。', '请给一茶杯我。'], 0),
  multipleChoice('hsk1_b13_mc_04', 'Câu xin phép đúng là:', ['我可以问一下吗？', '我问可以一下吗？', '一下我可以问吗？', '我可以吗问一下？'], 0),
  multipleChoice('hsk1_b13_mc_05', 'Lượng từ phù hợp với 面包 trong bài là:', ['块', '辆', '本', '家'], 0)
];
const b13Fill = [
  fillQuestion('hsk1_b13_fill_01', '我有一个____。', '问题', b13WordBank),
  fillQuestion('hsk1_b13_fill_02', '请问____。', '一下', b13WordBank),
  fillQuestion('hsk1_b13_fill_03', '我____妈妈买一个杯子。', '给', b13WordBank),
  fillQuestion('hsk1_b13_fill_04', '我____再问一个问题吗？', '可以', b13WordBank),
  fillQuestion('hsk1_b13_fill_05', '请给我一杯____。', '茶', b13WordBank),
  fillQuestion('hsk1_b13_fill_06', '我想再吃一块____。', '面包', b13WordBank)
];
const b13Arrange = [
  arrangeQuestion('hsk1_b13_arrange_01', 'Sắp xếp câu song tân ngữ:', ['请', '给', '我', '一杯', '茶', '。'], '请给我一杯茶。|请给我一杯茶'),
  arrangeQuestion('hsk1_b13_arrange_02', 'Sắp xếp câu xin phép:', ['我', '可以', '问', '一下', '吗', '？'], '我可以问一下吗？|我可以问一下吗')
];
const b13Reading = [readingPassage(
  'hsk1_b13_reading',
  'Đọc: Ở nhà hàng',
  '早上我去饭店。服务员问：先生，您要喝什么？我说：请给我一杯茶和两个鸡蛋。可以再给我一块面包吗？',
  [
    multipleChoice('hsk1_b13_read_01', '服务员问什么？', ['要喝什么', '去哪儿', '什么时候回家'], 0),
    multipleChoice('hsk1_b13_read_02', '“我”要喝什么？', ['牛奶', '茶', '水'], 1),
    multipleChoice('hsk1_b13_read_03', '“我”还要什么？', ['一块面包', '一个杯子', '一斤苹果'], 0),
    essayQuestion('hsk1_b13_read_04', '“我”要几个鸡蛋？', '我要两个鸡蛋。')
  ]
)];
const b13Listening = [
  listeningQuestion('hsk1_b13_listen_01', 'Nghe và chọn đồ uống.', ['牛奶', '茶', '米饭'], 1, '请给我一杯茶。'),
  listeningQuestion('hsk1_b13_listen_02', 'Nghe và chọn người được gọi.', ['女士', '先生', '学生'], 1, '先生，您好！'),
  listeningQuestion('hsk1_b13_listen_03', 'Nghe và chọn lời xin phép.', ['我可以问一下吗？', '我正在问问题。', '我不要问问题。'], 0, '我可以问一下吗？'),
  listeningQuestion('hsk1_b13_listen_04', 'Nghe và chọn món ăn.', ['两个鸡蛋', '一杯茶', '一辆车'], 0, '早饭有两个鸡蛋。'),
  listeningFill('hsk1_b13_listen_05', 'Nghe và điền danh từ.', '服务员', '我想找一下这里的服务员。')
];
const b13Essay = [
  essayQuestion('hsk1_b13_essay_01', 'Viết một lời gọi món dùng 给 và 可以.', '请给我一杯茶。我可以再要一块面包吗？'),
  essayQuestion('hsk1_b13_essay_02', 'Viết một câu hỏi dùng 一下 để hỏi giáo viên.', '我可以问一下吗？')
];
const b13Speaking = [
  speakingQuestion('hsk1_b13_speak_01', '我可以问一下吗？', 'Wǒ kěyǐ wèn yíxià ma?'),
  speakingQuestion('hsk1_b13_speak_02', '请给我一杯茶。', 'Qǐng gěi wǒ yì bēi chá.'),
  speakingQuestion('hsk1_b13_speak_03', '先生，您要喝什么？', 'Xiānsheng, nín yào hē shénme?'),
  speakingQuestion('hsk1_b13_speak_04', '我想再吃一块面包。', 'Wǒ xiǎng zài chī yí kuài miànbāo.')
];
const b13Translation = [
  translationQuestion('hsk1_b13_tr_01', 'Dịch sang tiếng Trung và ghi âm: Xin hãy cho tôi một cốc trà.', 'vi_to_zh_audio', '请给我一杯茶。'),
  translationQuestion('hsk1_b13_tr_02', 'Dịch sang chữ Hán: Tôi có thể hỏi một chút không?', 'vi_to_zh_text', '我可以问一下吗？'),
  translationQuestion('hsk1_b13_tr_03', 'Dịch sang tiếng Việt: 我想再吃一块面包。', 'zh_to_vi_text', 'Tôi muốn ăn thêm một miếng bánh mì.'),
  translationQuestion('hsk1_b13_tr_04', 'Dịch sang chữ Hán: Nhân viên phục vụ cho tôi một cốc sữa.', 'vi_to_zh_text', '服务员给我一杯牛奶。')
];

const b14Vocab = vocab(b14Words, 1, {
  '火车': 'Tàu hỏa', '火车_pinyin': 'huǒchē', '火车_type': 'Danh từ', '火车_example': '我们坐火车去北京吧。',
  '有些': 'Một số; một ít', '有些_pinyin': 'yǒuxiē', '有些_type': 'Đại từ', '有些_example': '有些学生在上课。',
  '有的': 'Có người/có cái; một số', '有的_pinyin': 'yǒude', '有的_type': 'Đại từ', '有的_example': '有的人喜欢看书。',
  '了': 'Trợ từ động thái/ngữ khí', '了_pinyin': 'le', '了_type': 'Trợ từ', '了_example': '我吃了饭。',
  '字': 'Chữ', '字_pinyin': 'zì', '字_type': 'Danh từ', '字_example': '一个字。',
  '写': 'Viết', '写_pinyin': 'xiě', '写_type': 'Động từ', '写_example': '请写你的名字。',
  '都': 'Đều; tất cả', '都_pinyin': 'dōu', '都_type': 'Phó từ', '都_example': '我们都是学生。',
  '说话': 'Nói chuyện', '说话_pinyin': 'shuōhuà', '说话_type': 'Động từ ly hợp', '说话_example': '我和朋友说话。',
  '听见': 'Nghe thấy', '听见_pinyin': 'tīngjiàn', '听见_type': 'Động từ', '听见_example': '我没听见。',
  '晚': 'Muộn', '晚_pinyin': 'wǎn', '晚_type': 'Tính từ', '晚_example': '太晚了。'
});
const b14WordBank = ['火车', '有些', '有的', '了', '字', '写', '都', '说话', '听见', '晚'];
const b14Mc = [
  multipleChoice('hsk1_b14_mc_01', 'Câu phủ định đúng của “我吃了饭” là:', ['我不吃了饭。', '我没吃饭。', '我没吃了饭。', '我不吃饭没。'], 1),
  multipleChoice('hsk1_b14_mc_02', '“他们都不是学生” nghĩa là:', ['Tất cả họ đều không phải học sinh', 'Không phải tất cả họ là học sinh', 'Tất cả họ đều là học sinh', 'Họ vẫn đang học'], 0),
  multipleChoice('hsk1_b14_mc_03', '“有的……，有的……” dùng để:', ['Nêu các nhóm khác nhau', 'Hỏi giá', 'Hỏi phương tiện', 'Nói số điện thoại'], 0),
  multipleChoice('hsk1_b14_mc_04', 'Câu nào đúng?', ['我写了几个字。', '我了写几个字。', '我没写了几个字。', '我写几个了字。'], 0),
  multipleChoice('hsk1_b14_mc_05', '“听不见” khác “没听见” ở chỗ:', ['Nghe không được/nghe không thấy do khả năng hoặc điều kiện vs lúc đó chưa nghe thấy', 'Hai từ giống hệt nhau', 'Một từ chỉ viết', 'Một từ chỉ ngủ'], 0)
];
const b14Fill = [
  fillQuestion('hsk1_b14_fill_01', '昨天我看____一个电影。', '了', b14WordBank),
  fillQuestion('hsk1_b14_fill_02', '请____你的名字。', '写', b14WordBank),
  fillQuestion('hsk1_b14_fill_03', '我没____老师说的话。', '听见', b14WordBank),
  fillQuestion('hsk1_b14_fill_04', '有____学生在上课，有的在外面玩。', '些', [...b14WordBank, '些']),
  fillQuestion('hsk1_b14_fill_05', '我和弟弟____了很多话。', '说', [...b14WordBank, '说']),
  fillQuestion('hsk1_b14_fill_06', '太____了，我们回家吧。', '晚', b14WordBank)
];
const b14Arrange = [
  arrangeQuestion('hsk1_b14_arrange_01', 'Sắp xếp câu có 了:', ['我', '看', '了', '一个', '电影', '。'], '我看了一个电影。|我看了一个电影'),
  arrangeQuestion('hsk1_b14_arrange_02', 'Sắp xếp câu có 都:', ['我们', '都', '是', '学生', '。'], '我们都是学生。|我们都是学生')
];
const b14Reading = [readingPassage(
  'hsk1_b14_reading',
  'Đọc: Một ngày của tôi',
  '昨天我看了一个电影。电影很好看。我回家写了几个汉字，也和弟弟说了很多话。我们都很高兴。',
  [
    multipleChoice('hsk1_b14_read_01', '昨天“我”做什么？', ['看了电影', '坐飞机', '去看病'], 0),
    multipleChoice('hsk1_b14_read_02', '“我”写了什么？', ['几个汉字', '一封信', '一个问题'], 0),
    multipleChoice('hsk1_b14_read_03', '“我”和谁说话？', ['老师', '弟弟', '服务员'], 1),
    essayQuestion('hsk1_b14_read_04', '“我”和弟弟高兴吗？', '我们都很高兴。')
  ]
)];
const b14Listening = [
  listeningQuestion('hsk1_b14_listen_01', 'Nghe và chọn hành động đã xảy ra.', ['看了电影', '看电影呢', '没看见电影'], 0, '昨天我看了一个电影。'),
  listeningQuestion('hsk1_b14_listen_02', 'Nghe và chọn hoạt động.', ['写字', '坐车', '吃药'], 0, '我写了几个汉字。'),
  listeningQuestion('hsk1_b14_listen_03', 'Nghe và chọn người nói chuyện.', ['弟弟', '爸爸', '服务员'], 0, '我和弟弟说了很多话。'),
  listeningQuestion('hsk1_b14_listen_04', 'Nghe và chọn nghĩa của 都.', ['Đều/tất cả', 'Một số', 'Muộn'], 0, '我们都很高兴。'),
  listeningFill('hsk1_b14_listen_05', 'Nghe và điền trợ từ.', '了', '我吃了饭。')
];
const b14Essay = [
  essayQuestion('hsk1_b14_essay_01', 'Viết 2 câu kể một việc em đã làm hôm qua, dùng 了.', '昨天我看了电影。我吃了饭。'),
  essayQuestion('hsk1_b14_essay_02', 'Viết một câu dùng 都 để nói về em và một người bạn.', '我和朋友都是学生。')
];
const b14Speaking = [
  speakingQuestion('hsk1_b14_speak_01', '你昨天做了什么？', 'Nǐ zuótiān zuò le shénme?'),
  speakingQuestion('hsk1_b14_speak_02', '你会写汉字吗？', 'Nǐ huì xiě Hànzì ma?'),
  speakingQuestion('hsk1_b14_speak_03', '你听见老师说话了吗？', 'Nǐ tīngjiàn lǎoshī shuōhuà le ma?'),
  speakingQuestion('hsk1_b14_speak_04', '太晚了，我们回家吧。', 'Tài wǎn le, wǒmen huí jiā ba.')
];
const b14Translation = [
  translationQuestion('hsk1_b14_tr_01', 'Dịch sang tiếng Trung và ghi âm: Hôm qua tôi đã xem một bộ phim.', 'vi_to_zh_audio', '昨天我看了一个电影。'),
  translationQuestion('hsk1_b14_tr_02', 'Dịch sang chữ Hán: Tôi không nghe thấy.', 'vi_to_zh_text', '我没听见。'),
  translationQuestion('hsk1_b14_tr_03', 'Dịch sang tiếng Việt: 有的学生在上课，有的在外面玩。', 'zh_to_vi_text', 'Có học sinh đang học, có học sinh đang chơi ở bên ngoài.'),
  translationQuestion('hsk1_b14_tr_04', 'Dịch sang chữ Hán: Chúng tôi đều là học sinh.', 'vi_to_zh_text', '我们都是学生。')
];

const b15Vocab = vocab(b15Words, 1, {
  '爱': 'Yêu; thích', '爱_pinyin': 'ài', '爱_type': 'Động từ', '爱_example': '我爱我的家人。',
  '哪个': 'Cái nào; người nào', '哪个_pinyin': 'nǎge', '哪个_type': 'Đại từ nghi vấn', '哪个_example': '你想买哪个？',
  '也': 'Cũng', '也_pinyin': 'yě', '也_type': 'Phó từ', '也_example': '我也是学生。',
  '还': 'Còn; thêm nữa', '还_pinyin': 'hái', '还_type': 'Phó từ', '还_example': '我还喜欢吃中国菜。',
  '好玩儿': 'Vui; thú vị', '好玩儿_pinyin': 'hǎowánr', '好玩儿_type': 'Tính từ', '好玩儿_example': '北京好玩儿吗？',
  '西安': 'Tây An', '西安_pinyin': "Xī'ān", '西安_type': 'Danh từ riêng', '西安_example': '我去了西安。',
  '小时': 'Giờ; tiếng', '小时_pinyin': 'xiǎoshí', '小时_type': 'Danh từ thời lượng', '小时_example': '两个小时。',
  '飞机': 'Máy bay', '飞机_pinyin': 'fēijī', '飞机_type': 'Danh từ', '飞机_example': '我们坐飞机去北京。',
  '机场': 'Sân bay', '机场_pinyin': 'jīchǎng', '机场_type': 'Danh từ', '机场_example': '我们去机场。',
  '家人': 'Người nhà; người thân', '家人_pinyin': 'jiārén', '家人_type': 'Danh từ', '家人_example': '我爱我的家人。',
  '时间': 'Thời gian', '时间_pinyin': 'shíjiān', '时间_type': 'Danh từ', '时间_example': '我没有时间。',
  '接': 'Đón', '接_pinyin': 'jiē', '接_type': 'Động từ', '接_example': '妈妈来学校接我。',
  '住': 'Ở; sống; lưu trú', '住_pinyin': 'zhù', '住_type': 'Động từ', '住_example': '我住在北京。',
  '那': 'Vậy thì', '那_pinyin': 'nà', '那_type': 'Liên từ', '那_example': '下雨了，那我们在家吧。'
});
const b15WordBank = ['爱', '哪个', '也', '还', '好玩儿', '西安', '小时', '飞机', '机场', '家人', '时间', '接', '住', '那'];
const b15Mc = [
  multipleChoice('hsk1_b15_mc_01', '“哪个” thường đi với:', ['Lượng từ/danh từ', 'Số điện thoại', 'Thời tiết', 'Trợ từ 了'], 0),
  multipleChoice('hsk1_b15_mc_02', '“也” dùng để:', ['Nêu sự tương đồng', 'Nêu sự thay đổi trạng thái', 'Hỏi giá', 'Nêu phương tiện'], 0),
  multipleChoice('hsk1_b15_mc_03', 'Câu nào đúng?', ['我喜欢喝茶，还喜欢吃中国菜。', '我还喜欢喝茶也。', '我喜欢还喝茶。', '还我喜欢喝茶。'], 0),
  multipleChoice('hsk1_b15_mc_04', '“多长时间” hỏi về:', ['Khoảng thời gian kéo dài bao lâu', 'Địa điểm', 'Người nào', 'Giá tiền'], 0),
  multipleChoice('hsk1_b15_mc_05', 'Sau câu “下雨了”, câu phản hồi phù hợp là:', ['那我们在家吧。', '哪个在家吧。', '也我们机场。', '还下雨了哪儿。'], 0)
];
const b15Fill = [
  fillQuestion('hsk1_b15_fill_01', '你想买____？', '哪个', b15WordBank),
  fillQuestion('hsk1_b15_fill_02', '我喜欢喝茶，____喜欢喝牛奶。', '还', b15WordBank),
  fillQuestion('hsk1_b15_fill_03', '北京____吗？', '好玩儿', b15WordBank),
  fillQuestion('hsk1_b15_fill_04', '我们坐____去北京。', '飞机', b15WordBank),
  fillQuestion('hsk1_b15_fill_05', '我爱我的____。', '家人', b15WordBank),
  fillQuestion('hsk1_b15_fill_06', '你现在____在哪儿？', '住', b15WordBank)
];
const b15Arrange = [
  arrangeQuestion('hsk1_b15_arrange_01', 'Sắp xếp câu có 也/还:', ['我', '喜欢', '喝茶', '还', '喜欢', '吃中国菜', '。'], '我喜欢喝茶，还喜欢吃中国菜。|我喜欢喝茶还喜欢吃中国菜。'),
  arrangeQuestion('hsk1_b15_arrange_02', 'Sắp xếp câu hỏi thời lượng:', ['你', '在', '这里', '住', '多长时间', '了', '？'], '你在这里住多长时间了？|你在这里住多长时间了')
];
const b15Reading = [readingPassage(
  'hsk1_b15_reading',
  'Đọc: Đi Bắc Kinh',
  '去年我去了西安。今年我住在北京。明年我和家人坐飞机去机场接朋友。我们在机场见。',
  [
    multipleChoice('hsk1_b15_read_01', '去年“我”去了哪儿？', ['北京', '西安', '机场'], 1),
    multipleChoice('hsk1_b15_read_02', '今年“我”住在哪儿？', ['西安', '北京', '学校'], 1),
    multipleChoice('hsk1_b15_read_03', '明年“我”和谁坐飞机？', ['老师', '家人', '服务员'], 1),
    essayQuestion('hsk1_b15_read_04', '明年“我”去机场做什么？', '我去机场接朋友。')
  ]
)];
const b15Listening = [
  listeningQuestion('hsk1_b15_listen_01', 'Nghe và chọn địa điểm.', ['西安', '北京', '学校'], 0, '去年我去了西安。'),
  listeningQuestion('hsk1_b15_listen_02', 'Nghe và chọn phương tiện.', ['火车', '飞机', '出租车'], 1, '我们坐飞机去北京。'),
  listeningQuestion('hsk1_b15_listen_03', 'Nghe và chọn người được đón.', ['朋友', '老师', '弟弟'], 0, '我去机场接朋友。'),
  listeningQuestion('hsk1_b15_listen_04', 'Nghe và chọn ý nghĩa của 那.', ['Vậy thì', 'Cái nào', 'Cũng'], 0, '下雨了，那我们在家吧。'),
  listeningFill('hsk1_b15_listen_05', 'Nghe và điền danh từ thời lượng.', '小时', '我们坐飞机要两个小时。')
];
const b15Essay = [
  essayQuestion('hsk1_b15_essay_01', 'Viết 2 câu nói em yêu ai và còn thích làm gì.', '我爱我的家人，还喜欢学习中文。'),
  essayQuestion('hsk1_b15_essay_02', 'Viết câu trả lời cho: 你现在住在哪儿？', '我现在住在河内。')
];
const b15Speaking = [
  speakingQuestion('hsk1_b15_speak_01', '你爱你的家人吗？', 'Nǐ ài nǐ de jiārén ma?'),
  speakingQuestion('hsk1_b15_speak_02', '这两个手机，你想买哪个？', 'Zhè liǎng ge shǒujī, nǐ xiǎng mǎi nǎge?'),
  speakingQuestion('hsk1_b15_speak_03', '你现在住在哪儿？', 'Nǐ xiànzài zhù zài nǎr?'),
  speakingQuestion('hsk1_b15_speak_04', '你坐飞机要几个小时？', 'Nǐ zuò fēijī yào jǐ ge xiǎoshí?')
];
const b15Translation = [
  translationQuestion('hsk1_b15_tr_01', 'Dịch sang tiếng Trung và ghi âm: Tôi yêu gia đình của tôi.', 'vi_to_zh_audio', '我爱我的家人。'),
  translationQuestion('hsk1_b15_tr_02', 'Dịch sang chữ Hán: Chúng tôi đi máy bay đến Bắc Kinh.', 'vi_to_zh_text', '我们坐飞机去北京。'),
  translationQuestion('hsk1_b15_tr_03', 'Dịch sang tiếng Việt: 你想买哪个？', 'zh_to_vi_text', 'Bạn muốn mua cái nào?'),
  translationQuestion('hsk1_b15_tr_04', 'Dịch sang chữ Hán: Mẹ đến trường đón tôi.', 'vi_to_zh_text', '妈妈来学校接我。')
];

const aggregate610Vocab = uniqueVocab(b6Vocab, b7Vocab, b8Vocab, b9Vocab, b10Vocab);
const aggregate610 = makeExam(
  'hsk1-bai6-10-tong-hop-5-ky-nang',
  'HSK 1 – Tổng hợp Bài 6–10',
  'Ôn tập số điện thoại, địa điểm, thời gian, phương vị từ, hoạt động hằng ngày, mua bán và giá tiền.',
  aggregate610Vocab,
  [
    multipleChoice('hsk1_b6_10_mc_01', 'Số 1 trong số điện thoại đọc là:', ['yī', 'yāo', 'liǎng', 'líng'], 1),
    multipleChoice('hsk1_b6_10_mc_02', 'Câu nào đúng?', ['我坐出租车去超市。', '我去出租车坐超市。', '我超市坐去出租车。', '我坐超市去出租车。'], 0),
    multipleChoice('hsk1_b6_10_mc_03', '“七点半” là:', ['7:03', '7:15', '7:30', '17:30'], 2),
    multipleChoice('hsk1_b6_10_mc_04', 'Lượng từ phù hợp với sách là:', ['本', '只', '台', '斤'], 0),
    multipleChoice('hsk1_b6_10_mc_05', 'Câu tồn hiện đúng:', ['桌子上有一本书。', '桌子有一本上书。', '有桌子上一本书。', '一本书桌子上有。'], 0),
    multipleChoice('hsk1_b6_10_mc_06', '“这件衣服怎么样？” hỏi về:', ['Đánh giá', 'Phương tiện', 'Số điện thoại', 'Thời gian'], 0)
  ],
  [
    fillQuestion('hsk1_b6_10_fill_01', '我的____是13851897623。', '手机号', ['手机号', '学校', '电影', '衣服']),
    fillQuestion('hsk1_b6_10_fill_02', '下午两点____有课。', '半', ['半', '后', '元', '家']),
    fillQuestion('hsk1_b6_10_fill_03', '桌子____有一本书。', '上', ['上', '后', '号', '块']),
    fillQuestion('hsk1_b6_10_fill_04', '我买了一斤____。', '苹果', ['苹果', '包子', '电视', '电影']),
    fillQuestion('hsk1_b6_10_fill_05', '这本书八十____钱。', '块', ['块', '斤', '家', '本']),
    fillQuestion('hsk1_b6_10_fill_06', '这件衣服太____了。', '贵', ['贵', '少', '小', '晚'])
  ],
  [
    arrangeQuestion('hsk1_b6_10_arrange_01', 'Sắp xếp câu:', ['你', '去哪儿', '？'], '你去哪儿？|你去哪儿'),
    arrangeQuestion('hsk1_b6_10_arrange_02', 'Sắp xếp câu:', ['我', '下午', '两点半', '上课', '。'], '我下午两点半上课。|我下午两点半上课'),
    arrangeQuestion('hsk1_b6_10_arrange_03', 'Sắp xếp câu:', ['苹果', '一斤', '三块五', '。'], '苹果一斤三块五。|苹果一斤三块五')
  ],
  [readingPassage(
    'hsk1_b6_10_reading',
    'Đọc tổng hợp: Một ngày mua sắm',
    '今天下午两点半，我和朋友去超市买水果。我们坐出租车去。苹果一斤三块五，很便宜。晚上我们在家吃晚饭。',
    [
      multipleChoice('hsk1_b6_10_read_01', '我们几点去超市？', ['上午九点', '下午两点半', '晚上六点半'], 1),
      multipleChoice('hsk1_b6_10_read_02', '我们怎么去？', ['坐出租车', '坐飞机', '骑车'], 0),
      multipleChoice('hsk1_b6_10_read_03', '苹果怎么样？', ['很贵', '很便宜', '很少'], 1),
      essayQuestion('hsk1_b6_10_read_04', '晚上我们在哪儿吃晚饭？', '我们在家吃晚饭。')
    ]
  )],
  [
    listeningQuestion('hsk1_b6_10_listen_01', 'Nghe và chọn số điện thoại.', ['13851897623', '13858197623', '18351897623'], 0, '我的手机号是幺三八五幺八九七六二三。'),
    listeningQuestion('hsk1_b6_10_listen_02', 'Nghe và chọn địa điểm.', ['学校', '超市', '电影院'], 1, '下午我去超市买水果。'),
    listeningQuestion('hsk1_b6_10_listen_03', 'Nghe và chọn giờ.', ['两点', '两点半', '三点半'], 1, '下午两点半上课。'),
    listeningQuestion('hsk1_b6_10_listen_04', 'Nghe và chọn giá.', ['三块', '三块五', '五块三'], 1, '苹果一斤三块五。'),
    listeningFill('hsk1_b6_10_listen_05', 'Nghe và điền phương tiện.', '出租车', '我们坐出租车去超市。')
  ],
  [
    essayQuestion('hsk1_b6_10_essay_01', 'Viết 3 câu giới thiệu: em đi đâu, đi bằng gì, mua gì.', '我去超市。我坐出租车去。我买苹果。'),
    essayQuestion('hsk1_b6_10_essay_02', 'Viết một câu hỏi giá và một câu nhận xét.', '这个杯子多少钱？这个杯子很便宜。')
  ],
  [
    speakingQuestion('hsk1_b6_10_speak_01', '你的手机号是多少？', 'Nǐ de shǒujī hàomǎ shì duōshao?'),
    speakingQuestion('hsk1_b6_10_speak_02', '你下午几点上课？', 'Nǐ xiàwǔ jǐ diǎn shàngkè?'),
    speakingQuestion('hsk1_b6_10_speak_03', '你想买什么水果？', 'Nǐ xiǎng mǎi shénme shuǐguǒ?'),
    speakingQuestion('hsk1_b6_10_speak_04', '这件衣服怎么样？', 'Zhè jiàn yīfu zěnmeyàng?')
  ],
  [
    translationQuestion('hsk1_b6_10_tr_01', 'Dịch và ghi âm: Chiều nay tôi đi siêu thị mua hoa quả.', 'vi_to_zh_audio', '今天下午我去超市买水果。'),
    translationQuestion('hsk1_b6_10_tr_02', 'Dịch sang chữ Hán: Táo một cân 3 tệ 5, rất rẻ.', 'vi_to_zh_text', '苹果一斤三块五，很便宜。'),
    translationQuestion('hsk1_b6_10_tr_03', 'Dịch sang tiếng Việt: 你怎么去学校？', 'zh_to_vi_text', 'Bạn đi đến trường bằng cách nào?'),
    translationQuestion('hsk1_b6_10_tr_04', 'Dịch sang chữ Hán: Bộ quần áo này đắt quá.', 'vi_to_zh_text', '这件衣服太贵了。')
  ]
);

const aggregate1015Vocab = uniqueVocab(b10Vocab, b11Vocab, b12Vocab, b13Vocab, b14Vocab, b15Vocab);
const aggregate1015 = makeExam(
  'hsk1-bai10-15-tong-hop-5-ky-nang',
  'HSK 1 – Tổng hợp Bài 10–15',
  'Ôn tập mua bán, giá tiền, đang làm, thời tiết, sức khỏe, gọi món, 了, 有些/有的, 哪个, 也/还 và đi lại.',
  aggregate1015Vocab,
  [
    multipleChoice('hsk1_b10_15_mc_01', 'Câu phủ định hành động đã xảy ra đúng là:', ['我没吃饭。', '我不吃了饭。', '我没吃了饭。', '我不饭吃。'], 0),
    multipleChoice('hsk1_b10_15_mc_02', 'Câu nào diễn tả “đang học tiếng Trung”?', ['我学中文了。', '我正在学习中文呢。', '我没学习中文。', '我再学习中文。'], 1),
    multipleChoice('hsk1_b10_15_mc_03', '“有的……有的……” dùng để:', ['Nêu hai nhóm khác nhau', 'Hỏi thời gian', 'Hỏi giá', 'Nói số điện thoại'], 0),
    multipleChoice('hsk1_b10_15_mc_04', 'Câu song tân ngữ đúng:', ['请给我一杯茶。', '请我给一杯茶。', '一杯茶请给我。', '给请一杯茶我。'], 0),
    multipleChoice('hsk1_b10_15_mc_05', 'Câu nào dùng 那 đúng?', ['下雨了，那我们在家吧。', '哪个我们在家吧。', '那哪儿在家。', '我们那了家。'], 0),
    multipleChoice('hsk1_b10_15_mc_06', '“我喜欢喝茶，还喜欢吃中国菜” có ý:', ['Bổ sung thêm sở thích', 'Phủ định sở thích', 'Hỏi một lựa chọn', 'Nói hành động đã hoàn thành'], 0)
  ],
  [
    fillQuestion('hsk1_b10_15_fill_01', '我生病了，要去看____。', '病', ['病', '字', '车', '钱']),
    fillQuestion('hsk1_b10_15_fill_02', '我没____老师说的话。', '听见', ['听见', '写', '接', '住']),
    fillQuestion('hsk1_b10_15_fill_03', '请给我一杯____。', '茶', ['茶', '药', '苹果', '时间']),
    fillQuestion('hsk1_b10_15_fill_04', '明天我坐____去北京。', '飞机', ['飞机', '火车', '出租车', '椅子']),
    fillQuestion('hsk1_b10_15_fill_05', '我爱我的____。', '家人', ['家人', '售货员', '服务员', '病人']),
    fillQuestion('hsk1_b10_15_fill_06', '你想买____？', '哪个', ['哪个', '有些', '正在', '一点儿'])
  ],
  [
    arrangeQuestion('hsk1_b10_15_arrange_01', 'Sắp xếp câu:', ['今天', '下雨', '了', '。'], '今天下雨了。|今天下雨了'),
    arrangeQuestion('hsk1_b10_15_arrange_02', 'Sắp xếp câu:', ['我', '正在', '写', '汉字', '呢', '。'], '我正在写汉字呢。|我正在写汉字呢'),
    arrangeQuestion('hsk1_b10_15_arrange_03', 'Sắp xếp câu:', ['请', '给', '我', '一杯', '茶', '。'], '请给我一杯茶。|请给我一杯茶')
  ],
  [readingPassage(
    'hsk1_b10_15_reading',
    'Đọc tổng hợp: Từ nhà hàng đến sân bay',
    '今天下雨了，天气有点儿冷。我去饭店，请给我一杯茶和一块面包。吃了饭，我回家写了几个字。明天我和家人坐飞机去机场接朋友。',
    [
      multipleChoice('hsk1_b10_15_read_01', '今天天气怎么样？', ['很热', '有点儿冷', '非常好玩儿'], 1),
      multipleChoice('hsk1_b10_15_read_02', '在饭店“我”要什么？', ['茶和面包', '药和鸡蛋', '水果和衣服'], 0),
      multipleChoice('hsk1_b10_15_read_03', '吃饭后“我”做什么？', ['回家写字', '去看病', '去上课'], 0),
      essayQuestion('hsk1_b10_15_read_04', '明天“我”和家人去机场做什么？', '我们去机场接朋友。')
    ]
  )],
  [
    listeningQuestion('hsk1_b10_15_listen_01', 'Nghe và chọn thời tiết.', ['下雨了', '下雪了', '天气很热'], 0, '今天下雨了，天气有点儿冷。'),
    listeningQuestion('hsk1_b10_15_listen_02', 'Nghe và chọn món gọi.', ['一杯茶和一块面包', '两个苹果和一辆车', '一斤鸡蛋和一件衣服'], 0, '请给我一杯茶和一块面包。'),
    listeningQuestion('hsk1_b10_15_listen_03', 'Nghe và chọn hành động.', ['写了几个字', '看了一个电影', '买了水果'], 0, '回家后，我写了几个字。'),
    listeningQuestion('hsk1_b10_15_listen_04', 'Nghe và chọn địa điểm.', ['机场', '医院', '商店'], 0, '明天我们去机场接朋友。'),
    listeningFill('hsk1_b10_15_listen_05', 'Nghe và điền từ chỉ người.', '家人', '明天我和家人坐飞机。')
  ],
  [
    essayQuestion('hsk1_b10_15_essay_01', 'Viết 3 câu kể hôm nay em làm gì, dùng 在/了 ít nhất một lần.', '今天我在家学习。下午我看了电影。晚上我回家。'),
    essayQuestion('hsk1_b10_15_essay_02', 'Viết một đoạn 3 câu gọi món ở nhà hàng.', '请给我一杯茶。我还要一块面包。可以再给我两个鸡蛋吗？')
  ],
  [
    speakingQuestion('hsk1_b10_15_speak_01', '今天天气怎么样？', 'Jīntiān tiānqì zěnmeyàng?'),
    speakingQuestion('hsk1_b10_15_speak_02', '你生病的时候会做什么？', 'Nǐ shēngbìng de shíhou huì zuò shénme?'),
    speakingQuestion('hsk1_b10_15_speak_03', '请给我一杯茶。', 'Qǐng gěi wǒ yì bēi chá.'),
    speakingQuestion('hsk1_b10_15_speak_04', '明天你和家人去哪儿？', 'Míngtiān nǐ hé jiārén qù nǎr?')
  ],
  [
    translationQuestion('hsk1_b10_15_tr_01', 'Dịch và ghi âm: Hôm nay trời mưa rồi, hơi lạnh.', 'vi_to_zh_audio', '今天下雨了，有点儿冷。'),
    translationQuestion('hsk1_b10_15_tr_02', 'Dịch sang chữ Hán: Tôi muốn gọi thêm một cốc trà.', 'vi_to_zh_text', '我想再要一杯茶。'),
    translationQuestion('hsk1_b10_15_tr_03', 'Dịch sang tiếng Việt: 我没听见老师说话。', 'zh_to_vi_text', 'Tôi không nghe thấy giáo viên nói.'),
    translationQuestion('hsk1_b10_15_tr_04', 'Dịch sang chữ Hán: Ngày mai tôi và gia đình đi máy bay đến Bắc Kinh.', 'vi_to_zh_text', '明天我和家人坐飞机去北京。')
  ]
);

export const HSK1_BAI6_TO_15_EXAMS: ExamLesson[] = [
  makeExam('hsk1-bai6-5-ky-nang', 'HSK 1 - Bài 6: 你的手机号是多少？', 'Bài tập 5 kỹ năng: số điện thoại, địa điểm, mua đồ, đồ uống và câu liên động.', b6Vocab, b6Mc, b6Fill, b6Arrange, b6Reading, b6Listening, b6Essay, b6Speaking, b6Translation),
  makeExam('hsk1-bai7-5-ky-nang', 'HSK 1 - Bài 7: 我晚上六点半下班', 'Bài tập 5 kỹ năng: giờ, buổi trong ngày, tiết học, gặp nhau và lời đề nghị.', b7Vocab, b7Mc, b7Fill, b7Arrange, b7Reading, b7Listening, b7Essay, b7Speaking, b7Translation),
  makeExam('hsk1-bai8-5-ky-nang', 'HSK 1 - Bài 8: 我爸爸也在医院工作', 'Bài tập 5 kỹ năng: căn phòng, phương vị từ, con vật, khả năng và đến nơi.', b8Vocab, b8Mc, b8Fill, b8Arrange, b8Reading, b8Listening, b8Essay, b8Speaking, b8Translation),
  makeExam('hsk1-bai9-5-ky-nang', 'HSK 1 - Bài 9: 我在他们前边', 'Bài tập 5 kỹ năng: phương vị, câu tồn hiện, học tập, nghe nói và hoạt động hằng ngày.', b9Vocab, b9Mc, b9Fill, b9Arrange, b9Reading, b9Listening, b9Essay, b9Speaking, b9Translation),
  makeExam('hsk1-bai10-5-ky-nang', 'HSK 1 - Bài 10: 这儿的苹果真便宜！', 'Bài tập 5 kỹ năng: mua bán, tiền, số lượng, giá cả và câu vị ngữ tính từ.', b10Vocab, b10Mc, b10Fill, b10Arrange, b10Reading, b10Listening, b10Essay, b10Speaking, b10Translation),
  makeExam('hsk1-bai11-5-ky-nang', 'HSK 1 - Bài 11: 我读大学呢', 'Bài tập 5 kỹ năng: 时候, 知道/会, 在/正在, 还, động từ ly hợp và 要.', b11Vocab, b11Mc, b11Fill, b11Arrange, b11Reading, b11Listening, b11Essay, b11Speaking, b11Translation),
  makeExam('hsk1-bai12-5-ky-nang', 'HSK 1 - Bài 12: 昨天下雪了', 'Bài tập 5 kỹ năng: thời tiết, 了 trạng thái mới, 有点儿, sức khỏe, 再 và 来/到.', b12Vocab, b12Mc, b12Fill, b12Arrange, b12Reading, b12Listening, b12Essay, b12Speaking, b12Translation),
  makeExam('hsk1-bai13-5-ky-nang', 'HSK 1 - Bài 13: 请给我一杯茶', 'Bài tập 5 kỹ năng: 一下, 给, 可以, song tân ngữ và giao tiếp ở nhà hàng.', b13Vocab, b13Mc, b13Fill, b13Arrange, b13Reading, b13Listening, b13Essay, b13Speaking, b13Translation),
  makeExam('hsk1-bai14-5-ky-nang', 'HSK 1 - Bài 14: 我看了一个电影', 'Bài tập 5 kỹ năng: 了, 没有 + V, 有些/有的, 都, 写, 听见 và động từ ly hợp.', b14Vocab, b14Mc, b14Fill, b14Arrange, b14Reading, b14Listening, b14Essay, b14Speaking, b14Translation),
  makeExam('hsk1-bai15-5-ky-nang', 'HSK 1 - Bài 15: 大兴机场见！', 'Bài tập 5 kỹ năng: 哪个, 也/还, địa điểm, thời lượng, máy bay, sân bay và gia đình.', b15Vocab, b15Mc, b15Fill, b15Arrange, b15Reading, b15Listening, b15Essay, b15Speaking, b15Translation),
  aggregate610,
  aggregate1015
];
