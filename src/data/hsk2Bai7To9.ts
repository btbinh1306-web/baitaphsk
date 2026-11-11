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

const essay = (
  id: string,
  prompt: string,
  suggestedAnswer: string,
  requiredElements: string[] = ['Trả lời đủ ý'],
  extra: Partial<Question> = {}
): Question => ({
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
  maxScore: extra.maxScore ?? 10,
  ...extra
});

const errorCorrection = (id: string, prompt: string, suggestedAnswer: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  referenceAnswers: [suggestedAnswer],
  teacherReviewRequired: true,
  errorCorrection: { sentenceIsCorrect: false },
  requiredElements: ['Phán đoán đúng/sai', 'Sửa câu hoàn chỉnh'],
  explanation: 'Chấm 4 điểm cho phán đoán đúng/sai và 6 điểm cho câu sửa đúng; chấp nhận cách viết tương đương nếu đúng ngữ pháp.',
  rubric: [
    { id: 'judgement', label: 'Phán đoán đúng/sai', maxScore: 4 },
    { id: 'correction', label: 'Sửa câu đúng', maxScore: 6 }
  ],
  maxScore: extra.maxScore ?? 10,
  ...extra
});

const speaking = (id: string, prompt: string, pinyin: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin,
  teacherReviewRequired: true,
  referenceAnswers: [prompt],
  requiredElements: ['Đọc đủ câu', 'Phát âm và thanh điệu rõ'],
  explanation: 'Chấm theo đúng nghĩa, thanh điệu, phát âm và độ trôi chảy; chấp nhận ngữ điệu tự nhiên nếu không làm đổi nghĩa.',
  rubric: [
    { id: 'meaning', label: 'Đúng nội dung', maxScore: 4 },
    { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
    { id: 'fluency', label: 'Nói trôi chảy', maxScore: 3 }
  ],
  maxScore: extra.maxScore ?? 10,
  ...extra
});

const translation = (
  id: string,
  prompt: string,
  answer: string,
  translationType: Question['translationType'] = 'vi_to_zh_text',
  extra: Partial<Question> = {}
): Question => ({
  id,
  type: 'translation',
  translationType,
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
  maxScore: extra.maxScore ?? 10,
  ...extra
});

const listeningGroup = (
  id: string,
  prompt: string,
  audioText: string,
  type: 'listening_tf' | 'listening_mc',
  subQuestions: Question[]
): Question => ({
  id,
  type,
  tier: 'tier2',
  prompt,
  audioText,
  explanation: `Kịch bản nghe: ${audioText}`,
  maxAudioPlayCount: 2,
  subQuestions
});

const listeningTf = (id: string, prompt: string, isTrue: boolean): Question => ({
  id,
  type: 'listening_tf',
  tier: 'tier2',
  prompt,
  options: ['✓', '✗'],
  answer: isTrue ? 0 : 1
});

const listeningMc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'listening_mc',
  tier: 'tier2',
  prompt,
  options,
  answer
});

const reading = (id: string, title: string, content: string, questions: Question[], wordBank?: string[]): ReadingPassage => ({
  id,
  title,
  content,
  questions,
  ...(wordBank ? { wordBank } : {})
});

const b7WordBank = ['从', '往', '跑', '打', '篮球', '运动', '踢', '足球', '球', '得', '跑步', '游泳', '游', '爱好', '开始'];
const b7Vocab = vocab([
  ['从', 'cóng', 'Giới từ', 'từ; từ… đến…', '我每天从家跑步去学校。'],
  ['往', 'wǎng', 'Giới từ / động từ', 'hướng về, đi về phía', '请往前走。'],
  ['跑', 'pǎo', 'Động từ', 'chạy; đi nhanh đến', '一下课，我就往外跑。'],
  ['打', 'dǎ', 'Động từ', 'chơi môn thể thao dùng tay; đánh', '我喜欢打篮球。'],
  ['篮球', 'lánqiú', 'Danh từ', 'bóng rổ', '他篮球打得很好。'],
  ['运动', 'yùndòng', 'Danh từ / động từ', 'thể thao; vận động, tập thể dục', '我的爱好是运动。'],
  ['踢', 'tī', 'Động từ', 'đá, đá bóng', '我喜欢踢足球。'],
  ['足球', 'zúqiú', 'Danh từ', 'bóng đá', '他足球踢得不太好。'],
  ['球', 'qiú', 'Danh từ', 'quả bóng', '桌子下面有一个球。'],
  ['得', 'de', 'Trợ từ kết cấu', 'nối động từ với bổ ngữ trạng thái', '我跑得不快。'],
  ['跑步', 'pǎobù', 'Động từ ly hợp', 'chạy bộ', '我每天跑步。'],
  ['游泳', 'yóuyǒng', 'Động từ ly hợp', 'bơi, bơi lội', '我喜欢游泳。'],
  ['游', 'yóu', 'Động từ', 'bơi', '她游泳游得很快。'],
  ['爱好', 'àihào', 'Danh từ / động từ', 'sở thích; yêu thích', '我的爱好是运动。'],
  ['开始', 'kāishǐ', 'Động từ / danh từ', 'bắt đầu; sự khởi đầu', '我从今天开始学游泳。']
]);
const b7Arrange: Question[] = [
  arrange('hsk2_b7_arrange_01', ['就', '跑', '一下课', '他', '往外'], '一下课，他就往外跑。'),
  arrange('hsk2_b7_arrange_02', ['得', '还可以', '我', '踢', '足球'], '我踢足球踢得还可以。', '我足球踢得还可以。'),
  arrange('hsk2_b7_arrange_03', ['从', '的', '你', '回来', '北京', '什么时候', '是'], '你是什么时候从北京回来的？'),
  arrange('hsk2_b7_arrange_04', ['得', '快', '她', '跑步', '不', '跑'], '她跑步跑得不快。'),
  arrange('hsk2_b7_arrange_05', ['我', '开始', '从', '学游泳', '今天'], '我从今天开始学游泳。', '从今天开始，我学游泳。')
];
const b7ReadingWordBank = b7WordBank;
const b7Reading = reading('hsk2_b7_reading_01', 'II. 阅读 · Đọc hiểu', '我的爸爸很喜欢运动。他从二十岁开始踢足球，现在每个星期天还去踢。他足球踢得很好，也喜欢跑步。我一有时间就跟他一起去运动。我篮球打得不错，但是跑步跑得不快。', [
  mc('hsk2_b7_read_tf_01', '爸爸从二十岁开始踢足球。', ['✓', '✗'], 0),
  mc('hsk2_b7_read_tf_02', '爸爸不喜欢跑步。', ['✓', '✗'], 1),
  mc('hsk2_b7_read_tf_03', '我跑步跑得很快。', ['✓', '✗'], 1),
  mc('hsk2_b7_read_mc_01', '爸爸每个星期天做什么？', ['踢足球', '打篮球', '游泳'], 0),
  mc('hsk2_b7_read_mc_02', '我篮球打得怎么样？', ['不太好', '不错', '不会打'], 1),
  mc('hsk2_b7_read_mc_03', '我什么时候跟爸爸去运动？', ['一有时间', '每天早上', '星期六'], 0),
  fill('hsk2_b7_read_fill_01', '他（　）北京回来了，今天还要去上课。', '从', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_02', '（　）前走，学校就在前面。', '往', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_03', '别往外（　）了，外面正在下雨。', '跑', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_04', '我喜欢（　）羽毛球，也喜欢打篮球。', '打', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_05', '他（　）打得很好，大家都喜欢跟他玩。', '篮球', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_06', '你每天（　）多长时间？', '运动', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_07', '我喜欢（　）足球，不喜欢打篮球。', '踢', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_08', '你喜欢踢（　）还是打篮球？', '足球', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_09', '桌子下面有一个（　）。', '球', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_10', '哥哥跑（　）很快。', '得', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_11', '我每天早上都（　），晚上再做作业。', '跑步', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_12', '今天很热，我想去（　）。', '游泳', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_13', '她游泳（　）得很快，大家都喜欢看。', '游', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_14', '你的（　）是什么？我的爱好是踢足球。', '爱好', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b7_read_fill_15', '八点（　）上课，请你不要来晚。', '开始', b7ReadingWordBank, 'hsk2-b7-read-fill', 'Bài 3 · 选词填空')
], b7ReadingWordBank);

const b7Listening: Question[] = [
  listeningGroup('hsk2_b7_listen_01', 'Bài 1 · 听短文，判断对错', '我叫小明，我的爱好是运动。我每天早上从家跑步去学校。一下课，我就往外跑，跟同学一起打篮球。我篮球打得不错，但是足球踢得不太好。星期天我喜欢跟爸爸去游泳。', 'listening_tf', [
    listeningTf('hsk2_b7_listen_01_01', '小明的爱好是运动。', true),
    listeningTf('hsk2_b7_listen_01_02', '小明每天从学校跑步回家。', false),
    listeningTf('hsk2_b7_listen_01_03', '一下课，小明就跟同学一起打篮球。', true),
    listeningTf('hsk2_b7_listen_01_04', '小明足球踢得很好。', false),
    listeningTf('hsk2_b7_listen_01_05', '星期天小明跟爸爸去踢足球。', false)
  ]),
  listeningGroup('hsk2_b7_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：你是什么时候从北京回来的？男：昨天中午。', 'listening_mc', [
    listeningMc('hsk2_b7_listen_02_01', '男的是什么时候回来的？', ['昨天中午', '昨天晚上', '今天早上'], 0)
  ]),
  listeningGroup('hsk2_b7_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：你怎么一下课就往外跑？男：我跟同学说好了，一起去打篮球。', 'listening_mc', [
    listeningMc('hsk2_b7_listen_02_02', '男的为什么往外跑？', ['要回家', '要去打篮球', '要去游泳'], 1)
  ]),
  listeningGroup('hsk2_b7_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：你踢得怎么样？男：我踢得还可以。', 'listening_mc', [
    listeningMc('hsk2_b7_listen_02_03', '男的踢得怎么样？', ['很好', '还可以', '不好'], 1)
  ]),
  listeningGroup('hsk2_b7_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你跑得快不快？女：我跑得不快，也不太喜欢跑步。', 'listening_mc', [
    listeningMc('hsk2_b7_listen_02_04', '女的喜欢跑步吗？', ['喜欢', '不太喜欢', '很喜欢'], 1)
  ]),
  listeningGroup('hsk2_b7_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：你游泳游得怎么样？男：我游得很快，从小就喜欢游泳。', 'listening_mc', [
    listeningMc('hsk2_b7_listen_02_05', '男的游泳游得怎么样？', ['不快', '很快', '不会游'], 1)
  ])
];

const b7WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b7AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

const b7Speaking: Question[] = [
  speaking('hsk2_b7_speak_01', '你是什么时候从北京回来的？', 'Nǐ shì shénme shíhou cóng Běijīng huílái de?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_02', '你怎么一下课就往外跑？', 'Nǐ zěnme yí xiàkè jiù wǎng wài pǎo?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_03', '我跟同学说好了，一起去打篮球。', 'Wǒ gēn tóngxué shuō hǎo le, yìqǐ qù dǎ lánqiú.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_04', '我还喜欢踢足球，一到星期天就跟朋友们一起去踢。', 'Wǒ hái xǐhuan tī zúqiú, yí dào xīngqītiān jiù gēn péngyoumen yìqǐ qù tī.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_05', '你踢得怎么样？我踢得还可以。', 'Nǐ tī de zěnmeyàng? Wǒ tī de hái kěyǐ.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_06', '我跑得不快，也不太喜欢跑步。', 'Wǒ pǎo de bú kuài, yě bú tài xǐhuan pǎobù.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b7_speak_07', '从 → 我昨天从______回来。', 'Wǒ zuótiān cóng ______ huílái.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我昨天从北京回来。', referenceAnswers: ['我昨天从北京回来。'], requiredElements: ['从'] }),
  speaking('hsk2_b7_speak_08', '一……就…… → 一到星期天，______。', 'Yí dào xīngqītiān, ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '一到星期天，我就去踢足球。', referenceAnswers: ['一到星期天，我就去踢足球。'], requiredElements: ['一……就……'] }),
  speaking('hsk2_b7_speak_09', '得 → 我篮球打______。', 'Wǒ lánqiú dǎ ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我篮球打得还可以。', referenceAnswers: ['我篮球打得还可以。'], requiredElements: ['得'] }),
  speaking('hsk2_b7_speak_10', '爱好 → 你的______？', 'Nǐ de ______?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你的爱好是什么？', referenceAnswers: ['你的爱好是什么？'], requiredElements: ['爱好'] }),
  speaking('hsk2_b7_speak_11', '开始 → 从今天______。', 'Cóng jīntiān ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '从今天开始，我每天跑步。', referenceAnswers: ['从今天开始，我每天跑步。'], requiredElements: ['开始'] })
];

const b7EssayQuestions: Question[] = [
  errorCorrection('hsk2_b7_error_01', '我跑步得很快。', '我跑步跑得很快。', { explanation: '跑步是动词离合词，需要重复 跑，再接 得 + 补语。' }),
  errorCorrection('hsk2_b7_error_02', '我篮球很打得好。', '我篮球打得很好。', { explanation: '得要紧跟在动词 打 后面，程度词 很 放在补语位置。' }),
  errorCorrection('hsk2_b7_error_03', '我喜欢打足球。', '我喜欢踢足球。', { explanation: '篮球用 打，足球用 踢。' }),
  errorCorrection('hsk2_b7_error_04', '我从家到学校走。', '我从家走到学校。', { explanation: '从 后接起点，方向 到 放在动词后：从家走到学校。' }),
  errorCorrection('hsk2_b7_error_05', '我一到家，妈妈就电话。', '我一到家，妈妈就打来电话了。', { explanation: '就 后面需要完整的动词短语，电话作名词时要搭配 打。' }),
  essay(
    'hsk2_b7_writing',
    '介绍你的爱好。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 爱好、运动、打、踢、得、开始、从、一……就……、游泳、跑步。',
    '我的爱好是运动。从上小学开始，我就喜欢踢足球。我足球踢得还可以，篮球打得不太好。一到星期天，我就跟朋友们一起去踢球。我也喜欢游泳，但是游得不快。',
    ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nội dung giới thiệu rõ sở thích'],
    {
      taskGroup: 'bai7-writing',
      taskGroupTitle: 'III. 写作 · Bài 3: 写短文',
      explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.',
      rubric: b7WritingRubric,
      maxScore: 10
    }
  )
];

const b7TranslationQuestions: Question[] = [
  translation('hsk2_b7_translate_01', '你是什么时候从北京回来的？', 'Bạn từ Bắc Kinh trở về từ khi nào?', 'zh_to_vi_text'),
  translation('hsk2_b7_translate_02', '你怎么一下课就往外跑？', 'Sao vừa tan học là bạn chạy ra ngoài ngay vậy?', 'zh_to_vi_text'),
  translation('hsk2_b7_translate_03', '从上小学开始，我每天都跟爸爸去运动。', 'Từ khi bắt đầu học tiểu học, ngày nào tôi cũng đi tập thể thao cùng bố.', 'zh_to_vi_text'),
  translation('hsk2_b7_translate_04', 'Sở thích của tôi là thể thao.', '我的爱好是运动。'),
  translation('hsk2_b7_translate_05', 'Anh ấy chơi bóng rổ rất giỏi.', '他篮球打得很好。'),
  translation('hsk2_b7_translate_06', 'Tôi chạy không nhanh.', '我跑得不快。'),
  translation('hsk2_b7_translate_07', 'Vừa đến Chủ nhật là tôi đi đá bóng với bạn.', '一到星期天，我就跟朋友去踢足球。', 'vi_to_zh_audio', {
    taskGroup: 'oral_translation',
    taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
    requiredElements: ['Có 一……就……', 'Có 跟朋友', 'Dùng đúng 踢足球'],
    rubric: b7AudioTranslationRubric,
    maxScore: 10
  }),
  translation('hsk2_b7_translate_08', 'Từ hôm nay tôi bắt đầu học bơi.', '从今天开始，我学游泳。', 'vi_to_zh_audio', {
    taskGroup: 'oral_translation',
    taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
    requiredElements: ['Có 从今天开始', 'Dùng 学游泳'],
    rubric: b7AudioTranslationRubric,
    maxScore: 10
  }),
  translation('hsk2_b7_translate_09', 'Bạn bơi thế nào? Tôi bơi không nhanh.', '你游泳游得怎么样？我游得不快。', 'vi_to_zh_audio', {
    taskGroup: 'oral_translation',
    taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
    requiredElements: ['Dùng mẫu 游泳游得怎么样', 'Dùng 游得不快'],
    rubric: b7AudioTranslationRubric,
    maxScore: 10
  })
];

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
  translationQuestions: Question[],
  listeningQuestions: Question[] = [],
  speakingQuestions: Question[] = []
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
  listeningQuestions,
  essayQuestions,
  speakingQuestions,
  translationQuestions,
  handwritingQuestions: []
});

export const HSK2_BAI7_TO_9_EXAMS: ExamLesson[] = [
  makeLesson(
    'hsk2-bai7-ta-lanqiu-da-de-hen-hao',
    'HSK 2 - Bài 7: 他篮球打得很好',
    'Phiếu bài tập HSK2 Bài 7: từ vựng thể thao, 一……就…… và bổ ngữ trạng thái 得.',
    b7Vocab,
    [],
    [],
    b7Arrange,
    b7Reading,
    b7EssayQuestions,
    b7TranslationQuestions,
    b7Listening,
    b7Speaking
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
