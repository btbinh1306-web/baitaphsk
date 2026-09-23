import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const vocab = (hanzi: string, pinyin: string, meaning: string, type = 'Từ vựng'): VocabItem => ({
  hanzi,
  pinyin,
  meaning,
  type
});

type FillMeta = Pick<Question, 'wordBank' | 'fillGroup' | 'fillGroupTitle'>;

const fill = (id: string, prompt: string, answer: string, meta: FillMeta = {}): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  acceptableAnswers: answer,
  suggestedAnswer: answer,
  ...meta
});

const arrange = (id: string, prompt: string, chips: string[], answer: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips: chips,
  acceptableAnswers: answer
});

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier2',
  prompt,
  options,
  answer
});

const errorCorrection = (
  id: string,
  sentence: string,
  sentenceIsCorrect: boolean,
  correctedAnswer?: string
): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier3',
  prompt: sentence,
  suggestedAnswer: correctedAnswer || sentence,
  errorCorrection: { sentenceIsCorrect },
  maxScore: 10
});

const essay = (id: string, prompt: string, suggestedAnswer?: string): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  maxScore: 10
});

const speaking = (id: string, prompt: string): Question => ({
  id,
  type: 'speaking_record',
  tier: 'tier3',
  prompt,
  taskGroup: 'reading_aloud',
  taskGroupTitle: 'Luyện nói và ghi âm',
  teacherReviewRequired: true
});

const translation = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'translation',
  translationType: 'vi_to_zh_text',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true
});

const reading = (
  id: string,
  title: string,
  content: string,
  questions: Question[]
): ReadingPassage => ({ id, title, content, questions });

export const HSK2_BAI4_EXAM: ExamLesson = {
  id: 'hsk2-bai4-ni-chuan-hongse-de-hen-haokan',
  title: 'HSK 2 - Bài 4: 你穿红色的很好看',
  level: 'HSK 2',
  description: 'Luyện từ vựng màu sắc, 过, 因为……所以……, 的 làm đại từ và sửa lỗi câu.',
  mcQuestions: [],
  vocabList: [
    vocab('过', 'guo', 'đã từng', 'Trợ từ'), vocab('商场', 'shāngchǎng', 'trung tâm thương mại', 'Danh từ'),
    vocab('进去', 'jìnqù', 'đi vào', 'Động từ'), vocab('条', 'tiáo', 'lượng từ cho vật dài hẹp', 'Lượng từ'),
    vocab('书包', 'shūbāo', 'cặp sách', 'Danh từ'), vocab('颜色', 'yánsè', 'màu sắc', 'Danh từ'),
    vocab('裤子', 'kùzi', 'quần', 'Danh từ'), vocab('试', 'shì', 'thử', 'Động từ'),
    vocab('因为', 'yīnwèi', 'vì', 'Liên từ'), vocab('所以', 'suǒyǐ', 'cho nên', 'Liên từ'),
    vocab('过去', 'guòqù', 'qua đó', 'Động từ'), vocab('更', 'gèng', 'càng, hơn', 'Phó từ')
  ],
  fillQuestions: [
    fill('hsk2_b4_fill_01', '我看见老师在里面，我们____找她吧。', '进去', {
      fillGroup: 'hsk2-b4-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['进去', '条', '商场', '书包', '颜色']
    }),
    fill('hsk2_b4_fill_02', '我想买一____新裤子。', '条', {
      fillGroup: 'hsk2-b4-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['进去', '条', '商场', '书包', '颜色']
    }),
    fill('hsk2_b4_fill_03', '这家____是新开的，东西很便宜。', '商场', {
      fillGroup: 'hsk2-b4-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['进去', '条', '商场', '书包', '颜色']
    }),
    fill('hsk2_b4_fill_04', '我的____不见了，我需要买一个新的。', '书包', {
      fillGroup: 'hsk2-b4-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['进去', '条', '商场', '书包', '颜色']
    }),
    fill('hsk2_b4_fill_05', '这件衣服什么____？我喜欢绿色。', '颜色', {
      fillGroup: 'hsk2-b4-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['进去', '条', '商场', '书包', '颜色']
    }),
    fill('hsk2_b4_fill_06a', '我没吃____这种水果。', '过', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    }),
    fill('hsk2_b4_fill_06b', '我想____一下。', '试', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    }),
    fill('hsk2_b4_fill_07a', '____今天天气不好。', '因为', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    }),
    fill('hsk2_b4_fill_07b', '____我们不去商场了。', '所以', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    }),
    fill('hsk2_b4_fill_08', '那边卖裤子，我们____看看吧。', '过去', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    }),
    fill('hsk2_b4_fill_09', '绿色的很好看，我觉得黑色的____好看。', '更', {
      fillGroup: 'hsk2-b4-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['过', '因为', '所以', '试', '过去', '更']
    })
  ],
  arrangeQuestions: [
    arrange('hsk2_b4_arr_01', '来过 / 这家 / 我们 / 商场', ['来过', '这家', '我们', '商场', '。'], '我们来过这家商场。'),
    arrange('hsk2_b4_arr_02', '想买 / 我 / 裤子 / 条 / 白色的', ['想买', '我', '裤子', '条', '白色的', '。'], '我想买条白色的裤子。'),
    arrange('hsk2_b4_arr_03', '没穿过 / 红色的 / 我', ['没穿过', '红色的', '我', '。'], '我没穿过红色的。'),
    arrange('hsk2_b4_arr_04', '因为 / 没穿过 / 所以 / 要 / 试试', ['因为', '没穿过', '所以', '要', '试试', '。'], '因为没穿过，所以要试试。'),
    arrange('hsk2_b4_arr_05', '看看 / 过去 / 我们 / 吧 / 书包', ['看看', '过去', '我们', '吧', '书包', '。'], '我们过去看看书包吧。'),
    arrange('hsk2_b4_arr_06', '好看 / 穿 / 你 / 红色的 / 很', ['好看', '穿', '你', '红色的', '很', '。'], '你穿红色的很好看。'),
    arrange('hsk2_b4_arr_07', '很多 / 衣服 / 商场 / 的 / 颜色 / 里', ['很多', '衣服', '商场', '的', '颜色', '里', '。'], '商场里的衣服颜色很多。'),
    arrange('hsk2_b4_arr_08', '更喜欢 / 我 / 绿色的', ['更喜欢', '我', '绿色的', '。'], '我更喜欢绿色的。')
  ],
  readingPassages: [reading(
    'hsk2_b4_reading',
    'Đọc hiểu: Đi mua quần áo',
    '我和妈妈去了一家商场。因为是新开的，所以这几天东西很便宜。商场里的衣服颜色很多。我没穿过红色的裤子，妈妈让我试了试，我觉得我穿红色的也很好看。',
    [
      mc('hsk2_b4_read_01', '我和妈妈去了哪里？', ['超市', '商场', '学校'], 1),
      mc('hsk2_b4_read_02', '这家商场东西为什么很便宜？', ['因为很大', '因为新开的', '因为衣服很多'], 1),
      mc('hsk2_b4_read_03', '商场的衣服怎么样？', ['颜色很多', '都很贵', '都是红色'], 0),
      mc('hsk2_b4_read_04', '“我”有没有穿过红色的裤子？', ['穿过', '没穿过', '每天穿'], 1),
      mc('hsk2_b4_read_05', '“我”觉得穿红色的裤子怎么样？', ['不好看', '很好看', '太贵'], 1),
      essay('hsk2_b4_read_06', '这家商场是新开的吗？', '是的，是新开的。'),
      essay('hsk2_b4_read_07', '妈妈让“我”做什么？', '妈妈让我试红色的裤子。')
    ]
  )],
  essayQuestions: [
    errorCorrection('hsk2_b4_error_01', '我没穿红色裤子过。', false, '我没穿过红色裤子。'),
    errorCorrection('hsk2_b4_error_02', '因为我喜欢白色，所以想买条白色裤子的。', false, '因为我喜欢白色，所以想买条白色的裤子。'),
    errorCorrection('hsk2_b4_error_03', '这个书包是黑色，那个是绿色。', false, '这个书包是黑色的，那个是绿色的。'),
    errorCorrection('hsk2_b4_error_04', '我去过这家商场没有？', true),
    errorCorrection('hsk2_b4_error_05', '我觉得红色的好看，绿色的好看更。', false, '我觉得红色的好看，绿色的更好看。'),
    essay('hsk2_b4_writing', 'Dùng 过、商场、因为……所以……、颜色、更 viết đoạn văn khoảng 40–50 chữ.')
  ],
  speakingQuestions: [
    speaking('hsk2_b4_speaking_01', '我们来过这家商场吗？'), speaking('hsk2_b4_speaking_02', '我想买条裤子。'),
    speaking('hsk2_b4_speaking_03', '就是因为没穿过，所以要试试啊！'), speaking('hsk2_b4_speaking_04', '你穿红色的很好看。'),
    speaking('hsk2_b4_speaking_05', '我觉得绿色的更好看。')
  ],
  translationQuestions: [
    translation('hsk2_b4_translation_01', 'Tôi chưa từng đến trung tâm thương mại này.', '我没来过这家商场。'),
    translation('hsk2_b4_translation_02', 'Vì tôi thích màu xanh lá nên tôi muốn mua cái cặp sách màu xanh lá.', '因为我喜欢绿色，所以我想买绿色的书包。'),
    translation('hsk2_b4_translation_03', 'Chúng ta qua đó xem thử quần áo đi.', '我们过去看看衣服吧。'),
    translation('hsk2_b4_translation_04', 'Bạn đã thử quần màu đỏ chưa?', '你试过红色的裤子吗？'),
    translation('hsk2_b4_translation_05', 'Quần áo ở đây có rất nhiều màu sắc.', '这里的衣服颜色很多。')
  ]
};

export const HSK2_BAI5_EXAM: ExamLesson = {
  id: 'hsk2-bai5-diyici-qu-zhongguo-pengyou-jia',
  title: 'HSK 2 - Bài 5: 第一次去中国朋友家',
  level: 'HSK 2',
  description: 'Luyện bổ ngữ xu hướng 上来、下来、进去、跟 và cấu trúc 都……了.',
  mcQuestions: [],
  vocabList: [
    vocab('快', 'kuài', 'nhanh, nhanh lên', 'Tính từ/Phó từ'), vocab('下来', 'xiàlái', 'xuống về phía người nói', 'Động từ'),
    vocab('上来', 'shànglái', 'lên về phía người nói', 'Động từ'), vocab('上去', 'shàngqù', 'lên rời xa người nói', 'Động từ'),
    vocab('下面', 'xiàmiàn', 'phía dưới', 'Danh từ'), vocab('等', 'děng', 'đợi', 'Động từ'),
    vocab('一会儿', 'yíhuìr', 'một lát', 'Danh từ'), vocab('礼物', 'lǐwù', 'quà', 'Danh từ'),
    vocab('进来', 'jìnlái', 'vào về phía người nói', 'Động từ'), vocab('跟', 'gēn', 'cùng, với', 'Giới từ'),
    vocab('酒店', 'jiǔdiàn', 'khách sạn', 'Danh từ')
  ],
  fillQuestions: [
    fill('hsk2_b5_fill_01', '你____一点儿，我们要迟到了。', '快', {
      fillGroup: 'hsk2-b5-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['快', '下面', '等', '一会儿', '礼物']
    }),
    fill('hsk2_b5_fill_02a', '我不上去，我在____。', '下面', {
      fillGroup: 'hsk2-b5-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['快', '下面', '等', '一会儿', '礼物']
    }),
    fill('hsk2_b5_fill_02b', '我在下面____你。', '等', {
      fillGroup: 'hsk2-b5-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['快', '下面', '等', '一会儿', '礼物']
    }),
    fill('hsk2_b5_fill_03', '请你坐____，他马上就到。', '一会儿', {
      fillGroup: 'hsk2-b5-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['快', '下面', '等', '一会儿', '礼物']
    }),
    fill('hsk2_b5_fill_04', '这是我给朋友准备的____。', '礼物', {
      fillGroup: 'hsk2-b5-fill-group-1',
      fillGroupTitle: 'Nhóm 1',
      wordBank: ['快', '下面', '等', '一会儿', '礼物']
    }),
    fill('hsk2_b5_fill_05', '外边很冷，你们快____吧。', '进来', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_06', '我在楼上，你____找我吧。', '上来', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_07a', '我在楼下，你____吧。', '下来', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_07b', '我不____了。', '上去', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_08a', '吃完饭，我____朋友回酒店。', '跟', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_08b', '吃完饭，我跟朋友回____。', '酒店', {
      fillGroup: 'hsk2-b5-fill-group-2',
      fillGroupTitle: 'Nhóm 2',
      wordBank: ['上来', '上去', '下来', '下去', '进来', '跟', '酒店']
    }),
    fill('hsk2_b5_fill_09a', '____九点了，我们快走吧。', '都', {
      fillGroup: 'hsk2-b5-fill-group-3',
      fillGroupTitle: 'Nhóm 3 · Cấu trúc “都……了”',
      wordBank: ['都', '了']
    }),
    fill('hsk2_b5_fill_09b', '都九点____，我们快走吧。', '了', {
      fillGroup: 'hsk2-b5-fill-group-3',
      fillGroupTitle: 'Nhóm 3 · Cấu trúc “都……了”',
      wordBank: ['都', '了']
    }),
    fill('hsk2_b5_fill_10a', '我____去过中国了，我不想再去。', '都', {
      fillGroup: 'hsk2-b5-fill-group-3',
      fillGroupTitle: 'Nhóm 3 · Cấu trúc “都……了”',
      wordBank: ['都', '了']
    }),
    fill('hsk2_b5_fill_10b', '我都去过中国____，我不想再去。', '了', {
      fillGroup: 'hsk2-b5-fill-group-3',
      fillGroupTitle: 'Nhóm 3 · Cấu trúc “都……了”',
      wordBank: ['都', '了']
    })
  ],
  arrangeQuestions: [
    arrange('hsk2_b5_arr_01', '快 / 吧 / 下来', ['快', '吧', '下来', '。'], '快下来吧。'),
    arrange('hsk2_b5_arr_02', '在 / 我 / 等 / 下面 / 你', ['在', '我', '等', '下面', '你', '。'], '我在下面等你。'),
    arrange('hsk2_b5_arr_03', '一会儿 / 就 / 我 / 下去', ['一会儿', '就', '我', '下去', '。'], '我一会儿就下去。'),
    arrange('hsk2_b5_arr_04', '快 / 吧 / 进来', ['快', '吧', '进来', '。'], '快进来吧。'),
    arrange('hsk2_b5_arr_05', '礼物 / 拿 / 来 / 这么多', ['礼物', '拿', '来', '这么多', '。'], '拿这么多礼物来。'),
    arrange('hsk2_b5_arr_06', '都 / 12 点 / 了 / 我们 / 吃饭 / 吧', ['都', '12点', '了', '我们', '吃饭', '吧', '。'], '都12点了，我们吃饭吧。'),
    arrange('hsk2_b5_arr_07', '跟 / 我 / 商场 / 去 / 看看', ['跟', '我', '商场', '去', '看看', '。'], '跟我去商场看看。'),
    arrange('hsk2_b5_arr_08', '走回 / 我们 / 酒店', ['走回', '我们', '酒店', '。'], '我们走回酒店。')
  ],
  readingPassages: [reading(
    'hsk2_b5_reading',
    'Đọc hiểu: Lần đầu đến nhà bạn Trung Quốc',
    '回国前一天，我们去一雪姐家了。到她家的时候，饭菜都做好了。刘爷爷还准备了奶茶。因为吃了太多东西，我们吃完饭是走回酒店的。',
    [
      mc('hsk2_b5_read_01', '什么时候，她们去一雪姐家？', ['回国前一天', '今天早上', '明天'], 0),
      mc('hsk2_b5_read_02', '到她家的时候，饭菜怎么样？', ['还没做', '都做好了', '正在做'], 1),
      mc('hsk2_b5_read_03', '谁准备奶茶？', ['奶奶', '刘爷爷', '一雪姐'], 1),
      mc('hsk2_b5_read_04', '她们为什么走回酒店？', ['没有车', '吃太多东西', '想逛街'], 1),
      essay('hsk2_b5_read_05', '她们吃完饭去哪里？', '她们走回酒店。'),
      essay('hsk2_b5_read_06', '刘爷爷准备了什么？', '刘爷爷准备了奶茶。')
    ]
  )],
  essayQuestions: [
    errorCorrection('hsk2_b5_error_01', '我在楼上，你下去找我吧。', false, '我在楼上，你上来找我吧。'),
    errorCorrection('hsk2_b5_error_02', '都九点，我们快走吧。', false, '都九点了，我们快走吧。'),
    errorCorrection('hsk2_b5_error_03', '外边冷，你们快进去吧。', false, '外边冷，你们快进来吧。'),
    errorCorrection('hsk2_b5_error_04', '我跟朋友回酒店去了。', true),
    errorCorrection('hsk2_b5_error_05', '我等一会儿你在下面。', false, '我在下面等你一会儿。'),
    essay('hsk2_b5_writing', 'Dùng 下来、等、一会儿、都……了、跟、走回 viết đoạn văn khoảng 40–50 chữ。')
  ],
  speakingQuestions: [
    speaking('hsk2_b5_speaking_01', '快下来吧，别晚了。'), speaking('hsk2_b5_speaking_02', '我不上去，就在下面等你。'),
    speaking('hsk2_b5_speaking_03', '那我一会儿就下去。'), speaking('hsk2_b5_speaking_04', '家月、安妮，快进来！'),
    speaking('hsk2_b5_speaking_05', '都12点了，我们吃饭吧。'), speaking('hsk2_b5_speaking_06', '吃完饭我们走回酒店。')
  ],
  translationQuestions: [
    translation('hsk2_b5_translation_01', 'Nhanh xuống đi, chúng ta sắp muộn rồi.', '快下来吧，我们要晚了。'),
    translation('hsk2_b5_translation_02', 'Tôi không lên nữa, tôi đợi bạn ở phía dưới.', '我不上去，我在下面等你。'),
    translation('hsk2_b5_translation_03', 'Đã 11 giờ rồi, chúng ta phải đi thôi.', '都11点了，我们得走了。'),
    translation('hsk2_b5_translation_04', 'Các bạn mau vào trong nhà đi, bên ngoài lạnh lắm.', '你们快进来吧，外边很冷。'),
    translation('hsk2_b5_translation_05', 'Sau bữa ăn tôi cùng bạn tôi đi bộ về khách sạn.', '吃完饭我跟我的朋友走回酒店。')
  ]
};

const hsk2Bai6FillGroup1: FillMeta = {
  fillGroup: 'hsk2-b6-fill-group-1',
  fillGroupTitle: 'Nhóm 1',
  wordBank: ['忘', '画笔', '蛋糕', '打开', '床']
};

const hsk2Bai6FillGroup2: FillMeta = {
  fillGroup: 'hsk2-b6-fill-group-2',
  fillGroupTitle: 'Nhóm 2 · Dùng trùng điệp tính từ AA / AABB',
  wordBank: ['长', '快乐', '舒服', '地']
};

const hsk2Bai6FillGroup3: FillMeta = {
  fillGroup: 'hsk2-b6-fill-group-3',
  fillGroupTitle: 'Nhóm 3 · Cụm từ “什么的”',
  wordBank: ['什么的']
};

export const HSK2_BAI6_EXAM: ExamLesson = {
  id: 'hsk2-bai6-xiaoxue-shengri-kuaile',
  title: 'HSK 2 - Bài 6: 小雪，生日快乐！',
  level: 'HSK 2',
  description: 'Luyện từ vựng sinh nhật, trùng điệp tính từ, 地 và cụm 什么的.',
  mcQuestions: [],
  vocabList: [
    vocab('生日', 'shēngrì', 'sinh nhật', 'Danh từ'), vocab('忘', 'wàng', 'quên', 'Động từ'),
    vocab('画', 'huà', 'vẽ; bức tranh', 'Động từ/Danh từ'), vocab('画笔', 'huàbǐ', 'bút vẽ, bút màu', 'Danh từ'),
    vocab('蛋糕', 'dàngāo', 'bánh ngọt, bánh sinh nhật', 'Danh từ'), vocab('打开', 'dǎkāi', 'mở ra', 'Động từ'),
    vocab('床', 'chuáng', 'giường', 'Danh từ'), vocab('长长的', 'chángcháng de', 'dài dài', 'Tính từ'),
    vocab('快乐', 'kuàilè', 'vui vẻ', 'Tính từ'), vocab('舒服', 'shūfu', 'thoải mái', 'Tính từ'),
    vocab('地', 'de', 'trợ từ kết cấu trạng ngữ', 'Trợ từ'), vocab('什么的', 'shénme de', 'vân vân, các thứ', 'Cụm từ')
  ],
  fillQuestions: [
    fill('hsk2_b6_fill_01', '明天是朋友的生日，你别____。', '忘', hsk2Bai6FillGroup1),
    fill('hsk2_b6_fill_02', '妹妹喜欢画画，我送她一支____。', '画笔', hsk2Bai6FillGroup1),
    fill('hsk2_b6_fill_03', '过生日我们要买一个大大的____。', '蛋糕', hsk2Bai6FillGroup1),
    fill('hsk2_b6_fill_04', '这是你的礼物，请你____看看。', '打开', hsk2Bai6FillGroup1),
    fill('hsk2_b6_fill_05', '很累的时候，我想在____上休息。', '床', hsk2Bai6FillGroup1),
    fill('hsk2_b6_fill_06', '中国人过生日要吃____的面条儿。', '长长', hsk2Bai6FillGroup2),
    fill('hsk2_b6_fill_07', '生日那天，大家____地唱歌。', '快快乐乐', hsk2Bai6FillGroup2),
    fill('hsk2_b6_fill_08', '下班以后，我想____地睡一觉。', '舒舒服服', hsk2Bai6FillGroup2),
    fill('hsk2_b6_fill_09', '桌子上有苹果、香蕉____。', '什么的', hsk2Bai6FillGroup3),
    fill('hsk2_b6_fill_10', '我喜欢吃鱼、肉____。', '什么的', hsk2Bai6FillGroup3)
  ],
  arrangeQuestions: [
    arrange('hsk2_b6_arr_01', '生日快乐 / 小雪', ['生日快乐', '小雪', '！'], '小雪，生日快乐！'),
    arrange('hsk2_b6_arr_02', '礼物 / 打开 / 看看 / 你', ['礼物', '打开', '看看', '你', '。'], '你打开礼物看看。'),
    arrange('hsk2_b6_arr_03', '大大的 / 买个 / 我 / 蛋糕', ['大大的', '买个', '我', '蛋糕', '。'], '我买个大大的蛋糕。'),
    arrange('hsk2_b6_arr_04', '高高兴兴地 / 玩 / 我们', ['高高兴兴地', '玩', '我们', '。'], '我们高高兴兴地玩。'),
    arrange('hsk2_b6_arr_05', '鱼啊 / 肉啊 / 什么的 / 有', ['鱼啊', '肉啊', '什么的', '有', '。'], '有鱼啊肉啊什么的。'),
    arrange('hsk2_b6_arr_06', '早早地 / 孩子们 / 上床', ['早早地', '孩子们', '上床', '。'], '孩子们早早地上床。'),
    arrange('hsk2_b6_arr_07', '画画 / 喜欢 / 她', ['画画', '喜欢', '她', '。'], '她喜欢画画。'),
    arrange('hsk2_b6_arr_08', '舒舒服服地 / 想 / 我 / 睡一觉', ['舒舒服服地', '想', '我', '睡一觉', '。'], '我想舒舒服服地睡一觉。')
  ],
  readingPassages: [reading(
    'hsk2_b6_reading',
    'Đọc hiểu: Sinh nhật của con gái',
    '今天是女儿的生日。我们买了蛋糕，做了面条儿，还做了鱼啊肉啊什么的。吃完晚饭，一家人去看了个电影。回家后，孩子们早早地就上床了。明天不上学，他们说要舒舒服服地睡一觉，让我们晚点儿叫他们起床。这是很忙、很累，但是很快乐的一天。',
    [
      mc('hsk2_b6_read_01', '今天是谁的生日？', ['儿子', '女儿', '妈妈'], 1),
      mc('hsk2_b6_read_02', '过生日他们没有做什么？', ['买蛋糕', '看电影', '去商场买衣服'], 2),
      mc('hsk2_b6_read_03', '晚饭以后一家人做什么？', ['看电影', '睡觉', '画画'], 0),
      mc('hsk2_b6_read_04', '孩子们为什么想舒舒服服睡一觉？', ['明天不上学', '想吃面条', '想看电影'], 0),
      essay('hsk2_b6_read_05', '他们晚饭吃什么？', '他们吃面条、蛋糕，还有鱼啊肉啊什么的。'),
      essay('hsk2_b6_read_06', '这一天怎么样？', '很忙、很累，但是很快乐。')
    ]
  )],
  essayQuestions: [
    errorCorrection('hsk2_b6_error_01', '今天是生日，我们高兴地高高兴兴玩。', false, '今天是生日，我们高高兴兴地玩。'),
    errorCorrection('hsk2_b6_error_02', '桌子上有书、笔什么。', false, '桌子上有书、笔什么的。'),
    errorCorrection('hsk2_b6_error_03', '孩子们早早上床了。', false, '孩子们早早地上床了。'),
    errorCorrection('hsk2_b6_error_04', '我想舒服舒服睡一觉。', false, '我想舒舒服服地睡一觉。'),
    errorCorrection('hsk2_b6_error_05', '他高兴说：“生日快乐！”', false, '他高兴地说：“生日快乐！”'),
    essay('hsk2_b6_writing', 'Dùng 生日、蛋糕、高高兴兴地、什么的、舒服 viết đoạn văn khoảng 40–50 chữ。')
  ],
  speakingQuestions: [
    speaking('hsk2_b6_speaking_01', '小雪，生日快乐！'), speaking('hsk2_b6_speaking_02', '你打开礼物看看。'),
    speaking('hsk2_b6_speaking_03', '长长的面条儿，大大的蛋糕。'), speaking('hsk2_b6_speaking_04', '还有鱼啊肉啊什么的。'),
    speaking('hsk2_b6_speaking_05', '孩子们早早地上床了。'), speaking('hsk2_b6_speaking_06', '我想舒舒服服地睡一觉。')
  ],
  translationQuestions: [
    translation('hsk2_b6_translation_01', 'Chúc mừng sinh nhật, Tiểu Tuyết!', '小雪，生日快乐！'),
    translation('hsk2_b6_translation_02', 'Mở quà ra xem đi.', '打开礼物看看。'),
    translation('hsk2_b6_translation_03', 'Tôi muốn ngủ một giấc thật thoải mái.', '我想舒舒服服地睡一觉。'),
    translation('hsk2_b6_translation_04', 'Trên bàn có sách, bút các thứ.', '桌子上有书、笔什么的。'),
    translation('hsk2_b6_translation_05', 'Chúng tôi vui vẻ chơi cùng nhau.', '我们高高兴兴地一起玩。')
  ]
};

export const HSK2_BAI4_TO_6_EXAMS: ExamLesson[] = [HSK2_BAI4_EXAM, HSK2_BAI5_EXAM, HSK2_BAI6_EXAM];
