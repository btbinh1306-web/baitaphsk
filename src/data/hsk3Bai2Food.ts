import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] =>
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }));

const fill = (
  id: string,
  prompt: string,
  answer: string,
  fillGroup: string,
  fillGroupTitle: string,
  wordBank: string[],
  alternatives?: string
): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  acceptableAnswers: alternatives ? `${answer}|${alternatives}` : answer,
  suggestedAnswer: answer,
  fillGroup,
  fillGroupTitle,
  wordBank
});

const arrange = (id: string, wordChips: string[], answer: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt: 'Sắp xếp thành câu hoàn chỉnh.',
  wordChips,
  acceptableAnswers: `${answer}|${answer.replace(/[。？！?!]$/, '')}`
});

const essay = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  maxScore: 10
});

const translation = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'translation',
  translationType: 'vi_to_zh_text',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  maxScore: 10
});

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const bai2Vocab = vocab([
  ['渴', 'kě', 'Tính từ', 'khát', '我又累又渴。'],
  ['客气', 'kèqi', 'Tính từ', 'khách sáo', '别客气。'],
  ['热情', 'rèqíng', 'Tính từ', 'nhiệt tình', '服务员很热情。'],
  ['尝', 'cháng', 'Động từ', 'nếm, thử', '你尝一个吧。'],
  ['记', 'jì', 'Động từ', 'nhớ', '我怎么也记不住。'],
  ['选', 'xuǎn', 'Động từ', 'chọn', '你自己选一个吧。'],
  ['马上', 'mǎshàng', 'Phó từ', 'ngay lập tức', '我马上就来。'],
  ['不用', 'búyòng', 'Phó từ', 'không cần', '不用去饭馆。'],
  ['方便', 'fāngbiàn', 'Tính từ', 'tiện lợi', '点外卖很方便。'],
  ['简单', 'jiǎndān', 'Tính từ', 'đơn giản', '简单的菜。'],
  ['只', 'zhǐ', 'Phó từ', 'chỉ', '我只吃了一个面包。'],
  ['外卖', 'wàimài', 'Danh từ', 'đồ ăn giao tận nơi', '我们点外卖吧。'],
  ['饭馆', 'fànguǎn', 'Danh từ', 'nhà hàng, quán ăn', '这家饭馆很好。'],
  ['菜单', 'càidān', 'Danh từ', 'thực đơn', '请给我一张菜单。'],
  ['筷子', 'kuàizi', 'Danh từ', 'đũa', '我用筷子吃饭。'],
  ['勺子', 'sháozi', 'Danh từ', 'thìa', '朋友用勺子。'],
  ['面条儿', 'miàntiáor', 'Danh từ', 'mì', '我点了一碗面条儿。'],
  ['蛋糕', 'dàngāo', 'Danh từ', 'bánh ngọt', '服务员送了一块蛋糕。'],
  ['咖啡', 'kāfēi', 'Danh từ', 'cà phê', '我想喝一杯咖啡。'],
  ['绿茶', 'lǜchá', 'Danh từ', 'trà xanh', '我们要了两杯绿茶。'],
  ['饺子', 'jiǎozi', 'Danh từ', 'sủi cảo', '我好久没吃饺子了。'],
  ['点菜', 'diǎn cài', 'Động từ', 'gọi món', '你想吃什么就点什么。']
]);

const part1WordBank = ['渴', '客气', '热情', '尝', '记', '选', '马上', '不用', '方便', '简单', '只', '外卖'];
const part2WordBank = ['双', '张', '个', '块', '碗', '杯'];
const part4WordBank = ['哪个', '哪儿', '什么', '谁', '什么时候', '怎么'];
const part6WordBank = ['上', '下'];

const fillQuestions: Question[] = [
  fill('hsk3_b2_fill_01', '走了一上午，我又累又 ______，想喝一杯水。', '渴', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_02', '来我家做客，别 ______，想吃什么就自己拿。', '客气', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_03', '这家饭馆的服务员很 ______，总是笑着跟客人说话。', '热情', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_04', '妈妈做的饺子很好吃，你 ______ 一个吧。', '尝', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_05', '这个饭馆的名字太难了，我怎么也 ______ 不住。', '记', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_06', '菜单上有这么多菜，你自己 ______ 一个吧。', '选', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_07', '请等一下，我 ______ 就来。', '马上', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_08', '手机上就能点菜，______ 去饭馆。', '不用', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_09', '现在很多饭馆都能送外卖，真 ______！', '方便', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_10', '我不会做复杂的菜，我会做的都是 ______ 的菜。', '简单', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_11', '我昨天晚上 ______ 吃了一个面包。', '只', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_12', '太累了，不想出去吃饭，我们点个 ______ 吧。', '外卖', 'hsk3-b2-part1', 'Phần I · Từ mới', part1WordBank),
  fill('hsk3_b2_fill_13', '再给我们拿一 ______ 筷子。', '双', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_14', '请给我一 ______ 菜单。', '张', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_15', '早饭我吃了一 ______ 面包。', '个', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_16', '他点了一 ______ 面条儿。', '碗', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_17', '我想吃一 ______ 蛋糕。', '块', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_18', '我想喝一 ______ 咖啡。', '杯', 'hsk3-b2-part2', 'Phần II · Lượng từ', part2WordBank),
  fill('hsk3_b2_fill_20', '这些菜我 ______ 都爱吃。', '什么', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_21', '这个周末我 ______ 都不想去，只想在家休息。', '哪儿', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_22', '这家饭馆的菜，______ 都说好吃。', '谁', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_23', '我今天有时间，你 ______ 来都可以。', '什么时候', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_24', '这个问题很简单，______ 做都可以。', '怎么', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_25', '菜单上的菜，______ 都看起来很好吃。', '哪个', 'hsk3-b2-part4', 'Phần IV · Đại từ nghi vấn dùng chung', part4WordBank),
  fill('hsk3_b2_fill_26', '今天是周五，______ 周我们去爬山了，______ 周我们去看电影。', '上下', 'hsk3-b2-part6', 'Phần VI · 上 / 下 + lượng từ', part6WordBank, '上 下|上、下'),
  fill('hsk3_b2_fill_27', '这个菜太好吃了，______ 次我还要来。', '下', 'hsk3-b2-part6', 'Phần VI · 上 / 下 + lượng từ', part6WordBank),
  fill('hsk3_b2_fill_28', '______ 个月我去过北京，这个月我没去。', '上', 'hsk3-b2-part6', 'Phần VI · 上 / 下 + lượng từ', part6WordBank),
  fill('hsk3_b2_fill_29', '我这个星期很忙，______ 周有时间。', '下', 'hsk3-b2-part6', 'Phần VI · 上 / 下 + lượng từ', part6WordBank),
  fill('hsk3_b2_fill_30', '我 ______ 次来这个饭馆，是三年前。', '上', 'hsk3-b2-part6', 'Phần VI · 上 / 下 + lượng từ', part6WordBank)
];

const arrangeQuestions: Question[] = [
  arrange('hsk3_b2_arrange_01', ['又', '好吃', '饭馆', '便宜', '这家', '又', '的菜'], '这家饭馆的菜又便宜又好吃。'),
  arrange('hsk3_b2_arrange_02', ['点', '什么', '你们', '就', '想', '吃', '什么'], '你们想吃什么就点什么。'),
  arrange('hsk3_b2_arrange_03', ['方便', '点外卖', '太', '了'], '点外卖太方便了。'),
  arrange('hsk3_b2_arrange_04', ['好久', '没', '了', '我', '吃', '饺子'], '我好久没吃饺子了。'),
  arrange('hsk3_b2_arrange_05', ['服务员', '很', '这家饭馆的', '热情'], '这家饭馆的服务员很热情。'),
  arrange('hsk3_b2_arrange_06', ['不用', '拿菜单', '在手机上', '就能看到'], '不用拿菜单，在手机上就能看到。')
];

const essayQuestions: Question[] = [
  essay('hsk3_b2_rewrite_01', 'Phần III · Dùng “又……又……” viết lại: 这家饭馆的菜很便宜，也很好吃。', '这家饭馆的菜又便宜又好吃。'),
  essay('hsk3_b2_rewrite_02', 'Phần III · Dùng “又……又……” viết lại: 我今天很饿，也很渴。', '我今天又饿又渴。'),
  essay('hsk3_b2_rewrite_03', 'Phần III · Dùng “又……又……” viết lại: 他妈妈做的菜很简单，也很好吃。', '他妈妈做的菜又简单又好吃。'),
  essay('hsk3_b2_rewrite_04', 'Phần III · Dùng “又……又……” viết lại: 这种方便面很便宜，也很方便。', '这种方便面又便宜又方便。'),
  essay('hsk3_b2_dialogue_01', 'Phần V · Hoàn thành hội thoại. A：你想喝什么？', '你喝什么，我就喝什么。'),
  essay('hsk3_b2_dialogue_02', 'Phần V · Hoàn thành hội thoại. A：我们怎么去饭馆？', '你想怎么去，我们就怎么去。'),
  essay('hsk3_b2_dialogue_03', 'Phần V · Hoàn thành hội thoại. A：我什么时候去找你？', '你什么时候有时间，我就什么时候去找你。'),
  essay('hsk3_b2_dialogue_04', 'Phần V · Hoàn thành hội thoại. A：我们去哪儿吃饭？', '你想去哪儿，我们就去哪儿。'),
  essay('hsk3_b2_dialogue_05', 'Phần V · Viết lại thành “……什么……就……什么”：我喜欢吃什么，你也吃什么。', '你喜欢吃什么，我就吃什么。')
];

const reading: ReadingPassage[] = [{
  id: 'hsk3_b2_reading_01',
  title: 'Phần VIII · Đọc hiểu',
  content: '周末，我和朋友去了一家新开的饭馆。这家饭馆不大，可是服务员很热情，菜又便宜又好吃。朋友说：“你想吃什么就点什么，别客气。”我点了鸡肉饭，朋友点了面条儿，我们还要了两杯绿茶。我用筷子，朋友不太会用筷子，用勺子。吃完饭，服务员送了我们一块蛋糕。我说下次还要来，朋友说不用出门，在手机上就能点外卖，太方便了！',
  questions: [
    mc('hsk3_b2_read_tf_01', '这家饭馆很大。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b2_read_tf_02', '服务员很热情。', ['✓ Đúng', '✗ Sai'], 0),
    mc('hsk3_b2_read_tf_03', '我点的是面条儿。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b2_read_tf_04', '朋友用筷子吃饭。', ['✓ Đúng', '✗ Sai'], 1),
    mc('hsk3_b2_read_tf_05', '吃完饭，服务员送了蛋糕。', ['✓ Đúng', '✗ Sai'], 0),
    essay('hsk3_b2_read_short_06', 'Đọc đoạn văn và trả lời: 他们喝什么？', '绿茶。'),
    essay('hsk3_b2_read_short_07', 'Đọc đoạn văn và trả lời: 朋友觉得点外卖怎么样？', '他觉得太方便了。')
  ]
}];

const translationQuestions: Question[] = [
  translation('hsk3_b2_translation_01', 'Phần IX · Dịch sang tiếng Trung: Món ăn ở quán này vừa rẻ vừa ngon, phục vụ cũng rất nhiệt tình.', '这家饭馆的菜又便宜又好吃，服务员也很热情。'),
  translation('hsk3_b2_translation_02', 'Phần IX · Dịch sang tiếng Trung: Bạn muốn ăn gì thì gọi món đó, đừng khách sáo.', '你想吃什么就点什么，别客气。'),
  translation('hsk3_b2_translation_03', 'Phần IX · Dịch sang tiếng Trung: Tôi lâu rồi không ăn sủi cảo, lần sau chúng ta lại đến đây ăn nhé.', '我好久没吃饺子了，下次我们再来这儿吃吧。'),
  translation('hsk3_b2_translation_04', 'Phần IX · Dịch sang tiếng Trung: Hôm nay tôi vừa đói vừa mệt, không muốn nấu cơm nữa, chúng ta gọi đồ ăn giao tận nơi đi.', '今天我又饿又累，不想做饭了，我们点外卖吧。'),
  translation('hsk3_b2_translation_05', 'Phần IX · Dịch sang tiếng Trung: Phục vụ ơi, lấy thêm cho chúng tôi một đôi đũa và một cái thìa.', '服务员，再给我们拿一双筷子和一个勺子。')
];

export const HSK3_BAI2_FOOD_EXAM: ExamLesson = {
  id: 'hsk3-bai2-ni-men-xiang-chi-shenme',
  title: 'HSK 3 - Bài 2: 你们想吃什么就点什么',
  level: 'HSK 3',
  description: 'Phiếu bài tập HSK 3 Bài 2: từ vựng ăn uống, 又……又……, đại từ nghi vấn dùng chung, 什么……就……什么, 上 / 下 + lượng từ, đọc hiểu và dịch.',
  instruction: 'Làm bài theo từng phần. Các câu viết lại, hội thoại, đọc trả lời và dịch được giáo viên chấm; chấp nhận cách diễn đạt khác nếu đúng ngữ pháp và dùng đúng cấu trúc trọng tâm.',
  vocabList: bai2Vocab,
  mcQuestions: [],
  fillQuestions,
  arrangeQuestions,
  readingPassages: reading,
  listeningQuestions: [],
  essayQuestions,
  speakingQuestions: [],
  translationQuestions,
  handwritingQuestions: []
};
