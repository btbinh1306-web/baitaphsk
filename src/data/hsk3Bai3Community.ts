import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] =>
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }));

const fill = (id: string, prompt: string, answer: string, wordBank: string[], alternatives?: string): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  answer,
  acceptableAnswers: alternatives ? `${answer}|${alternatives}` : answer,
  suggestedAnswer: answer,
  wordBank,
  fillGroup: 'hsk3-b3-fill',
  fillGroupTitle: 'II. Chọn từ điền vào chỗ trống'
});

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id, type: 'mc', tier: 'tier1', prompt, options, answer
});

const arrange = (id: string, wordChips: string[], answer: string, alternatives?: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt: 'Sắp xếp các từ thành câu hoàn chỉnh.',
  wordChips,
  acceptableAnswers: `${answer}|${answer.replace(/[。？！?!]$/u, '')}${alternatives ? `|${alternatives}` : ''}`
});

const openQuestion = (id: string, prompt: string, answer: string, requiredElements: string[]): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer: answer,
  referenceAnswers: [answer],
  teacherReviewRequired: true,
  requiredElements,
  explanation: 'Chấp nhận cách diễn đạt khác nếu đúng nội dung, ngữ pháp và dùng đúng từ/cấu trúc trọng tâm.',
  rubric: [
    { id: 'content', label: 'Đúng nội dung và đủ ý', maxScore: 4 },
    { id: 'grammar', label: 'Đúng ngữ pháp, từ vựng mục tiêu', maxScore: 3 },
    { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 3 }
  ],
  maxScore: 10
});

const translation = (id: string, prompt: string, answer: string, requiredElements: string[]): Question => ({
  ...openQuestion(id, prompt, answer, requiredElements),
  type: 'translation',
  translationType: 'vi_to_zh_text'
});

const wordBank = ['咱们', '换', '小区', '环境', '关', '打扫', '办', '还', '听说', '搬', '初中', '空调'];

const vocabList = vocab([
  ['咱们', 'zánmen', 'Đại từ', 'chúng ta', '咱们一起去吧。'],
  ['换', 'huàn', 'Động từ', 'đổi, thay', '我想换一个房间。'],
  ['小区', 'xiǎoqū', 'Danh từ', 'khu dân cư', '这个小区很大。'],
  ['环境', 'huánjìng', 'Danh từ', 'môi trường', '这里的环境很好。'],
  ['关', 'guān', 'Động từ', 'đóng, tắt', '出门前请关灯。'],
  ['打扫', 'dǎsǎo', 'Động từ', 'quét dọn', '我们一起打扫房间。'],
  ['办', 'bàn', 'Động từ', 'làm,办理', '我想办一张信用卡。'],
  ['还', 'hái', 'Phó từ', 'vẫn, còn', '他还在睡觉。'],
  ['听说', 'tīngshuō', 'Động từ', 'nghe nói', '听说你搬家了。'],
  ['搬', 'bān', 'Động từ', 'chuyển, dọn', '我们上个月搬家了。'],
  ['初中', 'chūzhōng', 'Danh từ', 'trung học cơ sở', '我女儿今年上初中了。'],
  ['空调', 'kōngtiáo', 'Danh từ', 'điều hòa', '天气热，打开空调吧。'],
  ['挺', 'tǐng', 'Phó từ', 'khá, rất', '这个小区挺好的。'],
  ['坏', 'huài', 'Tính từ', 'mệt rã rời; hỏng', '我们忙坏了。'],
  ['就', 'jiù', 'Phó từ', 'đã, liền', '我六点就起床了。'],
  ['才', 'cái', 'Phó từ', 'mãi đến, mới', '他十点才回家。'],
  ['需要', 'xūyào', 'Động từ', 'cần', '你需要我帮忙吗？'],
  ['信用卡', 'xìnyòngkǎ', 'Danh từ', 'thẻ tín dụng', '我想办一张信用卡。'],
  ['花园', 'huāyuán', 'Danh từ', 'vườn hoa', '小区里有一个花园。'],
  ['房间', 'fángjiān', 'Danh từ', 'phòng', '我的房间不大。'],
  ['干净', 'gānjìng', 'Tính từ', 'sạch sẽ', '房子很干净。'],
  ['家', 'jiā', 'Danh từ', 'nhà, gia đình', '新家很漂亮。'],
  ['银行', 'yínháng', 'Danh từ', 'ngân hàng', '银行在小区旁边。'],
  ['走路', 'zǒulù', 'Động từ', 'đi bộ', '走路十分钟就到了。'],
  ['学校', 'xuéxiào', 'Danh từ', 'trường học', '学校离家很近。'],
  ['公共汽车', 'gōnggòng qìchē', 'Danh từ', 'xe buýt', '我每天坐公共汽车。']
]);

const fillQuestions: Question[] = [
  fill('hsk3_b3_fill_01', '我女儿今年上（　　）了，每天坐公共汽车去学校。', '初中', wordBank),
  fill('hsk3_b3_fill_02', '（　　）这个小区的（　　）很好，有花园，也有超市。', '听说、环境', wordBank, '听说 环境|听说环境'),
  fill('hsk3_b3_fill_03', '这件衣服太小了，我想（　　）一件大的。', '换', wordBank),
  fill('hsk3_b3_fill_04', '天气太热了，把（　　）打开吧。', '空调', wordBank),
  fill('hsk3_b3_fill_05', '出门的时候，请把灯（　　）上。', '关', wordBank),
  fill('hsk3_b3_fill_06', '我们的房间很脏，（　　）一起（　　）一下吧。', '咱们、打扫', wordBank, '咱们 打扫|咱们打扫'),
  fill('hsk3_b3_fill_07', '我想（　　）一张信用卡。', '办', wordBank),
  fill('hsk3_b3_fill_08', '你什么时候把书（　　）给图书馆？', '还', wordBank),
  fill('hsk3_b3_fill_09', '这张桌子太重了，我一个人（　　）不动。', '搬', wordBank),
  fill('hsk3_b3_fill_10', '我家住在这个（　　）的八层。', '小区', wordBank)
];

const mcQuestions: Question[] = [
  mc('hsk3_b3_mc_01', '这个房间（　　）干净的，我很喜欢。', ['挺', '太', '才'], 0),
  mc('hsk3_b3_mc_02', '我今天忙（　　）了，连午饭都没吃。', ['很', '坏', '多'], 1),
  mc('hsk3_b3_mc_03', '他八点上课，七点（　　）到教室了。', ['就', '才', '都'], 0),
  mc('hsk3_b3_mc_04', '我昨天晚上十二点（　　）睡觉。', ['就', '才', '又'], 1),
  mc('hsk3_b3_mc_05', '小区里（　　）一个很大的花园。', ['在', '有', '是'], 1),
  mc('hsk3_b3_mc_06', '坐火车去上海，要十个小时（　　）能到。', ['就', '也', '才'], 2)
];

const arrangeQuestions: Question[] = [
  arrange('hsk3_b3_arrange_01', ['的', '这个小区', '环境', '挺', '好'], '这个小区的环境挺好的。'),
  arrange('hsk3_b3_arrange_02', ['我', '今天', '累', '坏了'], '我今天累坏了。'),
  arrange('hsk3_b3_arrange_03', ['他', '五点', '就', '起床', '了'], '他五点就起床了。'),
  arrange('hsk3_b3_arrange_04', ['才', '到', '我', '十点', '家'], '我十点才到家。'),
  arrange('hsk3_b3_arrange_05', ['我', '想', '去', '银行', '办', '一张', '信用卡'], '我想去银行办一张信用卡。')
];

const readingPassage: ReadingPassage = {
  id: 'hsk3_b3_reading_01',
  title: 'VI. 阅读 · Đọc hiểu',
  content: '我们家上个月搬家了。新家在一个很大的小区里，环境挺好的，小区里有一个花园。房子不大，但是挺干净的。搬家那天，我们忙坏了，晚上十点才打扫完。虽然很累，但是我们都很高兴。',
  questions: [
    mc('hsk3_b3_read_tf_01', '他们家上个星期搬家了。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b3_read_tf_02', '新小区的环境不好。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b3_read_tf_03', '小区里没有花园。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b3_read_tf_04', '搬家那天，他们忙坏了。', ['✓ Đúng', '✗ Sai'], 0),
    mc('hsk3_b3_read_tf_05', '他们晚上十点就打扫完了。', ['✓ Đúng', '✗ Sai'], 1)
  ]
};

const essayQuestions: Question[] = [
  openQuestion('hsk3_b3_dialogue_01', 'Phần V · Hoàn thành hội thoại: A：你觉得这个小区怎么样？ B：', '这个小区挺好的。', ['Có đánh giá tích cực về 小区', 'Dùng đúng 挺……的']),
  openQuestion('hsk3_b3_dialogue_02', 'Phần V · Hoàn thành hội thoại: A：你昨天晚上几点回家的？ B：', '十二点才回家的。', ['Có thời điểm cụ thể', 'Dùng đúng 才']),
  openQuestion('hsk3_b3_dialogue_03', 'Phần V · Hoàn thành hội thoại: A：你怎么了？ B：', '累坏了。', ['Nêu trạng thái mệt', 'Dùng đúng 累坏了']),
  openQuestion('hsk3_b3_dialogue_04', 'Phần V · Hoàn thành hội thoại: A：你家离银行远吗？ B：', '走路五分钟就到了。', ['Nêu khoảng cách/cách đi', 'Có thời lượng và 就'])
];

const translationQuestions: Question[] = [
  translation('hsk3_b3_translation_01', 'Phần IX · Dịch sang tiếng Trung: Nghe nói môi trường của khu dân cư này khá tốt. (听说、环境、挺……的)', '听说这个小区的环境挺好的。', ['Có 听说', 'Có 小区 và 环境', 'Dùng đúng 挺……的']),
  translation('hsk3_b3_translation_02', 'Phần IX · Dịch sang tiếng Trung: Hôm nay tôi mệt rã rời. (累坏了)', '今天我累坏了。', ['Có 今天', 'Dùng đúng 累坏了']),
  translation('hsk3_b3_translation_03', 'Phần IX · Dịch sang tiếng Trung: Tôi đã dậy từ 6 giờ. (就)', '我六点就起床了。', ['Có 六点', 'Dùng đúng 就']),
  translation('hsk3_b3_translation_04', 'Phần IX · Dịch sang tiếng Trung: Bạn có cần tôi giúp bạn chuyển đồ không? (需要、搬)', '你需要我帮你搬东西吗？', ['Có 需要', 'Có 搬东西', 'Đúng dạng câu hỏi 吗'])
];

export const HSK3_BAI3_COMMUNITY_EXAM: ExamLesson = {
  id: 'hsk3-bai3-zhege-xiaoqu-tinghao',
  title: 'HSK 3 - Bài 3: 这个小区挺好的',
  level: 'HSK 3',
  description: 'Phiếu bài tập HSK3 Bài 3: từ vựng khu dân cư, 挺……的, ……坏了, 就 / 才, đọc hiểu và dịch.',
  instruction: 'Làm theo đúng thứ tự phiếu bài tập. Phần hội thoại, đọc trả lời và dịch có đáp án tham khảo, ý bắt buộc, giải thích và thang điểm để giáo viên chấm.',
  vocabList,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages: [readingPassage],
  listeningQuestions: [],
  essayQuestions,
  speakingQuestions: [],
  translationQuestions,
  handwritingQuestions: []
};
