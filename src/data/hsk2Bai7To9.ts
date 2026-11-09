import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] => (
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }))
);

const fill = (
  id: string,
  prompt: string,
  answer: string,
  wordBank: string[],
  fillGroup: string,
  fillGroupTitle: string,
  alternatives?: string
): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  answer,
  acceptableAnswers: alternatives ? `${answer}|${alternatives}` : answer,
  suggestedAnswer: answer,
  wordBank,
  fillGroup,
  fillGroupTitle
});

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const arrange = (id: string, chips: string[], answer: string, alternatives?: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt: 'Sắp xếp các từ thành câu hoàn chỉnh.',
  wordChips: chips,
  acceptableAnswers: alternatives ? `${answer}|${alternatives}` : `${answer}|${answer.replace(/[。？！?!]$/u, '')}`
});

const essay = (id: string, prompt: string, suggestedAnswer: string, requiredElements: string[] = ['Trả lời đủ ý']): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  referenceAnswers: [suggestedAnswer],
  teacherReviewRequired: true,
  requiredElements,
  explanation: 'Chấp nhận cách diễn đạt khác nếu đúng nội dung, ngữ pháp và từ vựng mục tiêu.',
  rubric: [
    { id: 'content', label: 'Nội dung đúng ý', maxScore: 4 },
    { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 3 },
    { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 3 }
  ],
  maxScore: 10
});

const translation = (id: string, prompt: string, answer: string): Question => ({
  id,
  type: 'translation',
  translationType: 'vi_to_zh_text',
  tier: 'tier3',
  prompt,
  suggestedAnswer: answer,
  referenceAnswers: [answer],
  teacherReviewRequired: true,
  requiredElements: ['Dịch đủ nghĩa', 'Đúng cấu trúc được yêu cầu'],
  explanation: 'Chấp nhận bản dịch tương đương nếu đúng nghĩa, ngữ pháp và dùng đúng điểm ngôn ngữ yêu cầu.',
  rubric: [
    { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
    { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
  ],
  maxScore: 10
});

const reading = (id: string, title: string, content: string, questions: Question[]): ReadingPassage => ({ id, title, content, questions });

const b7WordBank = ['从', '往', '跑', '打', '踢', '球', '游', '得', '爱好', '开始'];
const b7Vocab = vocab([
  ['篮球', 'lánqiú', 'Danh từ', 'bóng rổ', '我喜欢打篮球。'],
  ['足球', 'zúqiú', 'Danh từ', 'bóng đá', '他足球踢得不错。'],
  ['游泳', 'yóuyǒng', 'Động từ', 'bơi', '她游泳游得很快。'],
  ['跑步', 'pǎobù', 'Động từ', 'chạy bộ', '我每天跑步。'],
  ['爱好', 'àihào', 'Danh từ', 'sở thích', '我的爱好是唱歌。'],
  ['开始', 'kāishǐ', 'Động từ', 'bắt đầu', '我们九点开始上课。'],
  ['从', 'cóng', 'Giới từ', 'từ', '从我家到学校很近。'],
  ['往', 'wǎng', 'Giới từ', 'về phía, hướng tới', '请往前走。'],
  ['球', 'qiú', 'Danh từ', 'quả bóng', '桌子下面有一个球。'],
  ['得', 'de', 'Trợ từ', 'trợ từ bổ ngữ trạng thái', '他篮球打得很好。'],
  ['打', 'dǎ', 'Động từ', 'chơi (bóng rổ)', '我喜欢打篮球。'],
  ['踢', 'tī', 'Động từ', 'đá', '他喜欢踢足球。'],
  ['跑', 'pǎo', 'Động từ', 'chạy', '他跑得很快。'],
  ['运动', 'yùndòng', 'Động từ / danh từ', 'vận động, thể thao', '我有时间就去运动。'],
  ['唱歌', 'chànggē', 'Động từ', 'hát', '她唱歌唱得很好听。']
]);
const b7Fill: Question[] = [
  fill('hsk2_b7_fill_01', '我喜欢（　　）篮球，一个星期打三次。', '打', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_02', '他足球（　　）得不错，是我们班的明星。', '踢', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_03', '桌子下面有一个（　　）。', '球', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_04', '你们（　　）这里（　　）前走，那边更漂亮。', '从、往', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống', '从 往|从往|从这里往'),
  fill('hsk2_b7_fill_05', '我的（　　）是唱歌，一有时间我就去唱歌。', '爱好', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_06', '我们九点（　　）上课，你别来晚了。', '开始', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_07', '她（　　）得又快又好。', '跑', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_08', '他（　　）得很快，是我们班第一名。', '游', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b7_fill_09', '她唱歌唱（　　）很好听。', '得', b7WordBank, 'hsk2-b7-fill', 'II. Chọn từ điền vào chỗ trống')
];
const b7Mc: Question[] = [
  mc('hsk2_b7_mc_01', '他一下课（　　）去打篮球。', ['就', '才', '也'], 0),
  mc('hsk2_b7_mc_02', '她游泳游（　　）很快。', ['的', '得', '地'], 1),
  mc('hsk2_b7_mc_03', '他跑得（　　）快。', ['没', '不', '别'], 1),
  mc('hsk2_b7_mc_04', '我（　　）起床就吃早饭。', ['一', '再', '都'], 0),
  mc('hsk2_b7_mc_05', '你足球踢得（　　）？', ['吗', '怎么样', '什么'], 1)
];
const b7Arrange: Question[] = [
  arrange('hsk2_b7_arrange_01', ['他', '得', '篮球', '打', '很好'], '他篮球打得很好。'),
  arrange('hsk2_b7_arrange_02', ['一', '就', '回家', '下课', '我'], '我一下课就回家。'),
  arrange('hsk2_b7_arrange_03', ['游', '她', '得', '游泳', '快', '不'], '她游泳游得不快。'),
  arrange('hsk2_b7_arrange_04', ['往', '你们', '前', '走', '这里', '从'], '你们从这里往前走。'),
  arrange('hsk2_b7_arrange_05', ['一', '有时间', '就', '他', '去运动'], '他一有时间就去运动。')
];
const b7Reading = reading('hsk2_b7_reading_01', 'VI. 阅读 · Đọc hiểu', '我叫小李，我的爱好是运动。从八岁开始，我每天都跟哥哥去打篮球。我篮球打得不错，足球踢得还可以，可是游泳游得不快。一到星期六，我就跟朋友们去踢足球。', [
  mc('hsk2_b7_read_01', '小李的爱好是运动。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b7_read_02', '小李从十岁开始运动。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b7_read_03', '小李篮球打得不错。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b7_read_04', '小李游泳游得很快。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b7_read_05', '一到星期六，小李就去踢足球。', ['✓ Đúng', '✗ Sai'], 0)
]);

const b8WordBank = ['点', '花', '饭馆', '比', '虽然', '但是', '记得', '左边', '手表', '有意思'];
const b8Vocab = vocab([
  ['点', 'diǎn', 'Động từ', 'gọi món', '我们点两个菜。'],
  ['花', 'huā', 'Động từ', 'tiêu, dùng (tiền)', '今天我花了很多钱。'],
  ['饭馆', 'fànguǎn', 'Danh từ', 'nhà hàng, quán ăn', '我们去饭馆吃饭。'],
  ['比', 'bǐ', 'Giới từ', 'so với, hơn', '今天比昨天冷。'],
  ['虽然', 'suīrán', 'Liên từ', 'mặc dù', '虽然很冷，但是我还要去。'],
  ['但是', 'dànshì', 'Liên từ', 'nhưng', '虽然很累，但是我很高兴。'],
  ['记得', 'jìde', 'Động từ', 'nhớ', '我记得你的生日。'],
  ['左边', 'zuǒbian', 'Danh từ phương vị', 'bên trái', '银行在商店的左边。'],
  ['手表', 'shǒubiǎo', 'Danh từ', 'đồng hồ đeo tay', '这块手表很漂亮。'],
  ['有意思', 'yǒu yìsi', 'Tính từ', 'thú vị', '这个电影很有意思。'],
  ['生日', 'shēngrì', 'Danh từ', 'sinh nhật', '今天是我的生日。'],
  ['冷', 'lěng', 'Tính từ', 'lạnh', '今天比昨天冷。'],
  ['好看', 'hǎokàn', 'Tính từ', 'đẹp, dễ nhìn', '这块手表很好看。'],
  ['爱情片', 'àiqíngpiān', 'Danh từ', 'phim tình cảm', '我喜欢看爱情片。']
]);
const b8Fill: Question[] = [
  fill('hsk2_b8_fill_01', '你的（　　）真漂亮，是在哪儿买的？', '手表', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_02', '我（　　）你的生日是八月二十七号。', '记得', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_03', '今天（　　）昨天冷。', '比', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_04', '我们去（　　）吃饭吧，那里的菜很好吃。', '饭馆', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_05', '银行在商店的（　　），不在右边。', '左边', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_06', '这个电影很（　　），我想再看一遍。', '有意思', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_07', '服务员，我们（　　）这两个菜，谢谢。', '点', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_08', '他买这些东西（　　）了很多钱。', '花', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b8_fill_09', '（　　）天气很冷，（　　）他还是去跑步了。', '虽然、但是', b8WordBank, 'hsk2-b8-fill', 'II. Chọn từ điền vào chỗ trống', '虽然 但是|虽然但是')
];
const b8Mc: Question[] = [
  mc('hsk2_b8_mc_01', '今天比昨天（　　）热。', ['很', '更', '非常'], 1),
  mc('hsk2_b8_mc_02', '这件衣服（　　）那件好看。', ['比', '跟', '和'], 0),
  mc('hsk2_b8_mc_03', '（　　）他很累，但是他还在学习。', ['因为', '虽然', '如果'], 1),
  mc('hsk2_b8_mc_04', '这个菜比那个菜（　　）好吃。', ['很', '非常', '更'], 2),
  mc('hsk2_b8_mc_05', '虽然他不喜欢吃鱼，（　　）他吃完了。', ['所以', '但是', '因为'], 1)
];
const b8Arrange: Question[] = [
  arrange('hsk2_b8_arrange_01', ['比', '左边的', '好看', '右边的'], '左边的比右边的好看。'),
  arrange('hsk2_b8_arrange_02', ['更', '这个', '电影', '有意思', '比', '那个'], '这个电影比那个更有意思。'),
  arrange('hsk2_b8_arrange_03', ['虽然', '但是', '贵', '很', '这块手表', '我很喜欢'], '虽然这块手表很贵，但是我很喜欢。'),
  arrange('hsk2_b8_arrange_04', ['饭馆', '去', '我们', '吃饭', '一起'], '我们一起去饭馆吃饭。'),
  arrange('hsk2_b8_arrange_05', ['你', '做的菜', '还', '比', '好吃', '饭馆的菜'], '你做的菜比饭馆的菜还好吃。')
];
const b8Reading = reading('hsk2_b8_reading_01', 'VI. 阅读 · Đọc hiểu', '今天是小林的生日。虽然他忘了，但是妈妈记得。妈妈请他去饭馆吃饭，点了很多菜。吃完饭，妈妈还给他买了一块手表。小林觉得这块手表很好看，他很高兴。', [
  mc('hsk2_b8_read_01', '今天是妈妈的生日。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b8_read_02', '小林忘了自己的生日。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b8_read_03', '妈妈请小林去饭馆吃饭。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b8_read_04', '妈妈没有给小林买手表。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b8_read_05', '小林觉得手表不好看。', ['✓ Đúng', '✗ Sai'], 1)
]);

const b9WordBank = ['坏', '旁边', '这样', '那么', '高', '离', '近', '走路', '门口', '咖啡'];
const b9Vocab = vocab([
  ['坏', 'huài', 'Tính từ', 'hỏng,坏', '我的手表坏了。'],
  ['旁边', 'pángbiān', 'Danh từ phương vị', 'bên cạnh', '我家旁边有一个超市。'],
  ['这样', 'zhèyàng', 'Đại từ / trạng từ', 'như thế này', '你不用这样客气。'],
  ['那么', 'nàme', 'Đại từ / trạng từ', 'như thế kia, đến mức đó', '今天没有昨天那么热。'],
  ['高', 'gāo', 'Tính từ', 'cao', '弟弟的个子很高。'],
  ['离', 'lí', 'Giới từ', 'cách', '学校离这儿很近。'],
  ['近', 'jìn', 'Tính từ', 'gần', '咖啡店离这儿很近。'],
  ['走路', 'zǒulù', 'Động từ', 'đi bộ', '走路五分钟就到了。'],
  ['门口', 'ménkǒu', 'Danh từ', 'cửa ra vào', '我在公司门口等你。'],
  ['咖啡', 'kāfēi', 'Danh từ', 'cà phê', '我想喝一杯咖啡。'],
  ['没有', 'méiyǒu', 'Động từ / phó từ', 'không bằng, không có', '今天没有昨天那么热。'],
  ['个子', 'gèzi', 'Danh từ', 'vóc người, chiều cao', '弟弟的个子比我高。'],
  ['上班', 'shàngbān', 'Động từ', 'đi làm', '今天我不上班。']
]);
const b9Fill: Question[] = [
  fill('hsk2_b9_fill_01', '我的手表（　　）了，得去修一下。', '坏', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_02', '我家（　　）有一个超市。', '旁边', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_03', '你不用（　　）客气。', '这样', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_04', '今天没有昨天（　　）冷。', '那么', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_05', '弟弟的个子比我（　　）。', '高', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_06', '学校（　　）这儿很（　　），我们（　　）去吧。', '离、近、走路', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống', '离 近 走路|离近走路'),
  fill('hsk2_b9_fill_07', '我在公司（　　）等你。', '门口', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống'),
  fill('hsk2_b9_fill_08', '我想喝一杯（　　）。', '咖啡', b9WordBank, 'hsk2-b9-fill', 'II. Chọn từ điền vào chỗ trống')
];
const b9Mc: Question[] = [
  mc('hsk2_b9_mc_01', '今天（　　）昨天那么热。', ['比', '更', '没有'], 2),
  mc('hsk2_b9_mc_02', '这条路（　　）学校很近。', ['在', '从', '离'], 2),
  mc('hsk2_b9_mc_03', '他学中文学了（　　）。', ['两年', '去年', '以前'], 0),
  mc('hsk2_b9_mc_04', '妹妹（　　）姐姐高吗？', ['有', '比', '更'], 0),
  mc('hsk2_b9_mc_05', '弟弟的个子没有哥哥（　　）高。', ['的', '那么', '了'], 1)
];
const b9Arrange: Question[] = [
  arrange('hsk2_b9_arrange_01', ['没有', '昨天', '今天', '那么', '热'], '今天没有昨天那么热。'),
  arrange('hsk2_b9_arrange_02', ['离', '咖啡店', '这儿', '很近'], '咖啡店离这儿很近。'),
  arrange('hsk2_b9_arrange_03', ['他们', '两年', '学', '了', '中文'], '他们学了两年中文。'),
  arrange('hsk2_b9_arrange_04', ['旁边', '有', '我家', '一个', '咖啡店'], '我家旁边有一个咖啡店。'),
  arrange('hsk2_b9_arrange_05', ['他的个子', '没有', '哥哥', '那么', '高'], '他的个子没有哥哥那么高。')
];
const b9Reading = reading('hsk2_b9_reading_01', 'VI. 阅读 · Đọc hiểu', '这周我休息。我家旁边有一家咖啡店，离我家很近，走路五分钟就到了。我在咖啡店坐了一下午。这家咖啡店的咖啡没有大商场里的那么贵，我很喜欢。', [
  mc('hsk2_b9_read_01', '这周我上班。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b9_read_02', '咖啡店在我家旁边。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b9_read_03', '走路到咖啡店要五分钟。', ['✓ Đúng', '✗ Sai'], 0),
  mc('hsk2_b9_read_04', '我在咖啡店坐了一上午。', ['✓ Đúng', '✗ Sai'], 1),
  mc('hsk2_b9_read_05', '这家咖啡店的咖啡比商场里的贵。', ['✓ Đúng', '✗ Sai'], 1)
]);

const sharedDialogueElements = ['Câu trả lời phù hợp ngữ cảnh', 'Đúng ngữ pháp và từ vựng'];
const makeLesson = (
  id: string,
  title: string,
  description: string,
  vocabList: VocabItem[],
  fillQuestions: Question[],
  mcQuestions: Question[],
  arrangeQuestions: Question[],
  passage: ReadingPassage,
  essayQuestions: Question[],
  translationQuestions: Question[]
): ExamLesson => ({
  id,
  title,
  level: 'HSK 2',
  description,
  instruction: 'Làm theo đúng thứ tự phiếu bài tập. Phần hội thoại, dịch và câu trả lời mở có đáp án tham khảo, ý bắt buộc và thang điểm cho giáo viên.',
  vocabList,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages: [passage],
  listeningQuestions: [],
  essayQuestions,
  speakingQuestions: [],
  translationQuestions,
  handwritingQuestions: []
});

export const HSK2_BAI7_TO_9_EXAMS: ExamLesson[] = [
  makeLesson(
    'hsk2-bai7-ta-lanqiu-da-de-hen-hao',
    'HSK 2 - Bài 7: 他篮球打得很好',
    'Phiếu bài tập HSK2 Bài 7: từ vựng thể thao, 一……就…… và bổ ngữ trạng thái 得.',
    b7Vocab,
    b7Fill,
    b7Mc,
    b7Arrange,
    b7Reading,
    [
      essay('hsk2_b7_dialogue_01', 'V. Hoàn thành hội thoại: A：你昨天晚上睡得怎么样？ B：', '睡得很好。', sharedDialogueElements),
      essay('hsk2_b7_dialogue_02', 'V. Hoàn thành hội thoại: A：他跑步跑得快不快？ B：', '他跑得很快。', sharedDialogueElements),
      essay('hsk2_b7_dialogue_03', 'V. Hoàn thành hội thoại: A：你什么时候去打篮球？ B：我一（　　）就（　　）。', '我一有时间就去打篮球。', ['Dùng đúng mẫu 一……就……', ...sharedDialogueElements]),
      essay('hsk2_b7_dialogue_04', 'V. Hoàn thành hội thoại: A：你游泳游得怎么样？ B：我＿＿＿＿，但是我很喜欢游泳。', '我游泳游得不快，但是我很喜欢游泳。', ['Dùng đúng bổ ngữ trạng thái 得', ...sharedDialogueElements])
    ],
    [
      translation('hsk2_b7_translate_01', 'Dịch sang tiếng Trung: Mỗi khi có thời gian là tôi đi chạy bộ. (一……就……)', '我一有时间就去跑步。'),
      translation('hsk2_b7_translate_02', 'Dịch sang tiếng Trung: Bạn chơi bóng rổ thế nào? (得)', '你篮球打得怎么样？'),
      translation('hsk2_b7_translate_03', 'Dịch sang tiếng Trung: Anh ấy bơi không nhanh. (得)', '他游泳游得不快。'),
      translation('hsk2_b7_translate_04', 'Dịch sang tiếng Trung: Từ nhà tôi đến trường đi bộ mất hai mươi phút. (从)', '从我家到学校走路要二十分钟。')
    ]
  ),
  makeLesson(
    'hsk2-bai8-xiaoxue-shengri-kuaile',
    'HSK 2 - Bài 8: 小雪，生日快乐！',
    'Phiếu bài tập HSK2 Bài 8: so sánh 比, 更 / 还 và câu chuyển ý 虽然……但是…….',
    b8Vocab,
    b8Fill,
    b8Mc,
    b8Arrange,
    b8Reading,
    [
      essay('hsk2_b8_dialogue_01', 'V. Hoàn thành hội thoại: A：这两条裙子，你喜欢哪条？ B：我喜欢左边的，它比右边的＿＿＿＿。', '好看。', sharedDialogueElements),
      essay('hsk2_b8_dialogue_02', 'V. Hoàn thành hội thoại: A：你想吃什么？ B：我想吃饺子，我觉得饺子比面条儿＿＿＿＿。', '好吃。', sharedDialogueElements),
      essay('hsk2_b8_dialogue_03', 'V. Hoàn thành hội thoại: A：这家饭馆的菜怎么样？ B：虽然＿＿＿＿，但是＿＿＿＿。', '虽然有点儿贵，但是很好吃。', ['Dùng đủ 虽然……但是……', ...sharedDialogueElements]),
      essay('hsk2_b8_dialogue_04', 'V. Hoàn thành hội thoại: A：你记得今天是几月几号吗？ B：', '我记得，今天是八月二十七号。', sharedDialogueElements)
    ],
    [
      translation('hsk2_b8_translate_01', 'Dịch sang tiếng Trung: Mặc dù hôm nay rất lạnh, nhưng tôi vẫn đi học. (虽然……但是……)', '虽然今天很冷，但是我去上学了。'),
      translation('hsk2_b8_translate_02', 'Dịch sang tiếng Trung: Chiếc đồng hồ bên trái đẹp hơn chiếc bên phải. (比)', '左边的手表比右边的好看。'),
      translation('hsk2_b8_translate_03', 'Dịch sang tiếng Trung: Hôm nay tôi tiêu rất nhiều tiền. (花)', '今天我花了很多钱。'),
      translation('hsk2_b8_translate_04', 'Dịch sang tiếng Trung: Tôi nhớ bạn thích xem phim tình cảm. (记得、爱情片)', '我记得你喜欢看爱情片。')
    ]
  ),
  makeLesson(
    'hsk2-bai9-meiyou-zuotian-na-me-re',
    'HSK 2 - Bài 9',
    'Phiếu bài tập HSK2 Bài 9: 没有 so sánh, 离 chỉ khoảng cách và bổ ngữ thời lượng.',
    b9Vocab,
    b9Fill,
    b9Mc,
    b9Arrange,
    b9Reading,
    [
      essay('hsk2_b9_dialogue_01', 'V. Hoàn thành hội thoại: A：你家离公司远吗？ B：', '不远，走路十分钟就到了。', sharedDialogueElements),
      essay('hsk2_b9_dialogue_02', 'V. Hoàn thành hội thoại: A：今天冷吗？ B：今天没有昨天＿＿＿＿。', '那么冷。', sharedDialogueElements),
      essay('hsk2_b9_dialogue_03', 'V. Hoàn thành hội thoại: A：你昨天学了多长时间中文？ B：我学了＿＿＿＿。', '两个小时。', sharedDialogueElements),
      essay('hsk2_b9_dialogue_04', 'V. Hoàn thành hội thoại: A：你的个子有哥哥高吗？ B：我的个子没有哥哥＿＿＿＿。', '那么高。', sharedDialogueElements)
    ],
    [
      translation('hsk2_b9_translate_01', 'Dịch sang tiếng Trung: Quán cà phê cách đây không xa. (离)', '咖啡店离这儿不远。'),
      translation('hsk2_b9_translate_02', 'Dịch sang tiếng Trung: Hôm nay không nóng bằng hôm qua. (没有)', '今天没有昨天那么热。'),
      translation('hsk2_b9_translate_03', 'Dịch sang tiếng Trung: Tôi đã đi bộ hơn nửa tiếng. (走路)', '我走了半个多小时。'),
      translation('hsk2_b9_translate_04', 'Dịch sang tiếng Trung: Cậu bé bên cạnh cao hơn tôi. (旁边、男孩儿、比)', '旁边的男孩儿比我高。')
    ]
  )
];
