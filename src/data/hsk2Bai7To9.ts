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
  errorCorrection('hsk2_b7_error_01', '我跑步得很快。', '我跑步跑得很快。', { taskGroup: 'bai7-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '跑步是动词离合词，需要重复 跑，再接 得 + 补语。' }),
  errorCorrection('hsk2_b7_error_02', '我篮球很打得好。', '我篮球打得很好。', { taskGroup: 'bai7-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '得要紧跟在动词 打 后面，程度词 很 放在补语位置。' }),
  errorCorrection('hsk2_b7_error_03', '我喜欢打足球。', '我喜欢踢足球。', { taskGroup: 'bai7-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '篮球用 打，足球用 踢。' }),
  errorCorrection('hsk2_b7_error_04', '我从家到学校走。', '我从家走到学校。', { taskGroup: 'bai7-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '从 后接起点，方向 到 放在动词后：从家走到学校。' }),
  errorCorrection('hsk2_b7_error_05', '我一到家，妈妈就电话。', '我一到家，妈妈就打来电话了。', { taskGroup: 'bai7-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '就 后面需要完整的动词短语，电话作名词时要搭配 打。' }),
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

const b8WordBank = ['手表', '左边', '左', '比', '右边', '右', '爱情片', '有意思', '点', '虽然', '但是', '花', '妻子', '丈夫', '饭馆'];
const b8Vocab = vocab([
  ['手表', 'shǒubiǎo', 'Danh từ', 'đồng hồ đeo tay', '这块手表很好看。'],
  ['左边', 'zuǒbian', 'Danh từ phương vị', 'bên trái', '银行在商店的左边。'],
  ['左', 'zuǒ', 'Danh từ', 'trái, bên trái', '出门往左走。'],
  ['比', 'bǐ', 'Giới từ / động từ', 'hơn; so sánh', '今天比昨天热。'],
  ['右边', 'yòubian', 'Danh từ phương vị', 'bên phải', '坐在你右边的人是谁？'],
  ['右', 'yòu', 'Danh từ', 'phải, bên phải', '请往右走。'],
  ['爱情片', 'àiqíngpiàn', 'Danh từ', 'phim tình cảm', '我喜欢看爱情片。'],
  ['有意思', 'yǒu yìsi', 'Tính từ', 'thú vị', '这个电影很有意思。'],
  ['点', 'diǎn', 'Động từ', 'gọi món, chọn món', '我们点三个菜。'],
  ['虽然', 'suīrán', 'Liên từ', 'mặc dù', '虽然下雨，但是我还是去了。'],
  ['但是', 'dànshì', 'Liên từ', 'nhưng, tuy nhiên', '虽然很累，但是我很高兴。'],
  ['花', 'huā', 'Động từ', 'tiêu, tốn tiền/thời gian', '今天花了不少钱。'],
  ['妻子', 'qīzi', 'Danh từ', 'vợ', '这是我的妻子。'],
  ['丈夫', 'zhàngfu', 'Danh từ', 'chồng', '这是我的丈夫。'],
  ['饭馆', 'fànguǎn', 'Danh từ', 'nhà hàng, quán ăn', '明天我们去饭馆吃饭。']
]);
const b8ReadingQuestions: Question[] = [
  mc('hsk2_b8_read_01', '今天下雨了。', ['✓', '✗'], 0),
  mc('hsk2_b8_read_02', '他们点了三个菜。', ['✓', '✗'], 0),
  mc('hsk2_b8_read_03', '他觉得爱情片很有意思。', ['✓', '✗'], 1),
  mc('hsk2_b8_read_04', '他们去哪儿吃饭了？', ['饭馆', '家里', '学校'], 0),
  mc('hsk2_b8_read_05', '哪个菜更好吃？', ['肉', '鱼', '一样'], 1),
  mc('hsk2_b8_read_06', '妻子觉得爱情片怎么样？', ['没有意思', '很有意思', '太长'], 1),
  fill('hsk2_b8_fill_01', '这是我从北京买的（　）。', '手表', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_02', '坐在你（　）的人是谁？', '左边', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_03', '出门往（　）走就到学校了。', '左', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_04', '姐姐（　）妹妹高。', '比', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_05', '床的（　）是桌子。', '右边', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_06', '往左走还是往（　）走？', '右', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_07', '我们看（　）吧，我喜欢这样的电影。', '爱情片', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_08', '这本书很（　），我还想看。', '有意思', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_09', '您好，现在（　）菜吗？', '点', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_10', '（　）下雨了，但是不太冷。', '虽然', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_11', '我想去饭馆，（　）妈妈想在家吃饭。', '但是', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_12', '买了很多东西，（　）了不少钱。', '花', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_13', '这是我的（　），她是老师。', '妻子', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_14', '这是我（　），他会做饭。', '丈夫', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b8_fill_15', '明天我们要去（　）吃饭。', '饭馆', b8WordBank, 'hsk2-b8-reading-fill', 'Bài 3 · 选词填空')
];
const b8Arrange: Question[] = [
  arrange('hsk2_b8_arrange_01', ['右边的', '比', '好看', '我', '觉得', '左边的'], '我觉得左边的比右边的好看。', '我觉得右边的比左边的好看。'),
  arrange('hsk2_b8_arrange_02', ['但是', '你', '记得', '虽然', '我', '忘了'], '虽然我忘了，但是你记得。'),
  arrange('hsk2_b8_arrange_03', ['冷', '昨天', '比', '今天'], '今天比昨天冷。', '昨天比今天冷。'),
  arrange('hsk2_b8_arrange_04', ['那个', '更', '有意思', '这个电影', '比'], '这个电影比那个更有意思。', '那个比这个电影更有意思。'),
  arrange('hsk2_b8_arrange_05', ['花', '了', '不少', '钱', '今天'], '今天花了不少钱。')
];
const b8Reading = reading('hsk2_b8_reading_01', 'II. 阅读 · Đọc hiểu', '今天虽然下雨，但是我和妻子还是去了饭馆。我们点了三个菜，鱼比肉更好吃。吃完饭，我们去看电影。我觉得爱情片没有意思，妻子觉得很有意思。', b8ReadingQuestions, b8WordBank);

const b8Listening: Question[] = [
  listeningGroup('hsk2_b8_listen_01', 'Bài 1 · 听短文，判断对错', '今天是我的生日。虽然我忘了，但是丈夫记得。他请我去饭馆吃饭，还带我去看了爱情片。他给我买了一块手表，花了不少钱。我觉得今天很快乐。', 'listening_tf', [
    listeningTf('hsk2_b8_listen_01_01', '今天是我的生日。', true),
    listeningTf('hsk2_b8_listen_01_02', '我和丈夫都忘了生日。', false),
    listeningTf('hsk2_b8_listen_01_03', '丈夫请我去饭馆吃饭。', true),
    listeningTf('hsk2_b8_listen_01_04', '我们去看了足球。', false),
    listeningTf('hsk2_b8_listen_01_05', '手表没花什么钱。', false)
  ]),
  listeningGroup('hsk2_b8_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '男：这两块手表怎么样？女：我喜欢左边这块。', 'listening_mc', [
    listeningMc('hsk2_b8_listen_02_01', '女的喜欢哪块手表？', ['左边的', '右边的', '都不喜欢'], 0)
  ]),
  listeningGroup('hsk2_b8_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：我喜欢左边这块。男：我也觉得左边的比右边的好看。', 'listening_mc', [
    listeningMc('hsk2_b8_listen_02_02', '男的觉得哪块手表更好看？', ['右边的', '左边的', '一样'], 1)
  ]),
  listeningGroup('hsk2_b8_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：这个电影比那个爱情片更有意思。男：好，我去买票。', 'listening_mc', [
    listeningMc('hsk2_b8_listen_02_03', '他们觉得哪个电影更有意思？', ['这个电影', '那个爱情片', '都没意思'], 0)
  ]),
  listeningGroup('hsk2_b8_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：到网上买吧，网上买票比在这里买便宜。女：好的。', 'listening_mc', [
    listeningMc('hsk2_b8_listen_02_04', '在哪儿买票更便宜？', ['在这里', '网上', '饭馆'], 1)
  ]),
  listeningGroup('hsk2_b8_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '男：今天花了不少钱吧？女：虽然花了一些钱，但是我们过了一个快乐的生日。', 'listening_mc', [
    listeningMc('hsk2_b8_listen_02_05', '她觉得今天怎么样？', ['很快乐', '很累', '不快乐'], 0)
  ])
];

const b8Speaking: Question[] = [
  speaking('hsk2_b8_speak_01', '这两块手表怎么样？', 'Zhè liǎng kuài shǒubiǎo zěnmeyàng?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_02', '我也觉得左边的比右边的好看。', 'Wǒ yě juéde zuǒbian de bǐ yòubian de hǎokàn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_03', '我看网上说这个电影比那个爱情片更有意思。', 'Wǒ kàn wǎngshàng shuō zhège diànyǐng bǐ nàge àiqíngpiān gèng yǒu yìsi.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_04', '网上买票比在这里买便宜。', 'Wǎngshàng mǎi piào bǐ zài zhèlǐ mǎi piányi.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_05', '虽然你忘了，但是我记得。', 'Suīrán nǐ wàng le, dànshì wǒ jìde.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_06', '虽然花了一些钱，但是我们过了一个快乐的生日。', 'Suīrán huā le yìxiē qián, dànshì wǒmen guò le yí ge kuàilè de shēngrì.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b8_speak_07', '比 → 今天______。', 'Bǐ → Jīntiān ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '今天比昨天冷。', referenceAnswers: ['今天比昨天冷。'], requiredElements: ['比'] }),
  speaking('hsk2_b8_speak_08', '更 → 这个电影比那个______。', 'Gèng → Zhège diànyǐng bǐ nàge ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '这个电影比那个更有意思。', referenceAnswers: ['这个电影比那个更有意思。'], requiredElements: ['更'] }),
  speaking('hsk2_b8_speak_09', '虽然……但是…… → 虽然今天下雨，______。', 'Suīrán…dànshì… → Suīrán jīntiān xiàyǔ, ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '虽然今天下雨，但是我们还是去上课。', referenceAnswers: ['虽然今天下雨，但是我们还是去上课。'], requiredElements: ['虽然……但是……'] }),
  speaking('hsk2_b8_speak_10', '花 → 买手表______。', 'Huā → Mǎi shǒubiǎo ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '买手表花了不少钱。', referenceAnswers: ['买手表花了不少钱。'], requiredElements: ['花'] }),
  speaking('hsk2_b8_speak_11', '点 → 您好，现在______吗？', 'Diǎn → Nín hǎo, xiànzài ______ ma?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '您好，现在点菜吗？', referenceAnswers: ['您好，现在点菜吗？'], requiredElements: ['点'] })
];

const b8WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b8PictureRubric = [
  { id: 'comparison', label: 'So sánh đúng hai đối tượng', maxScore: 5 },
  { id: 'grammar', label: 'Dùng đúng cấu trúc 比', maxScore: 3 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b8AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

const b8EssayQuestions: Question[] = [
  errorCorrection('hsk2_b8_error_01', '他比我很高。', '他比我高。', { taskGroup: 'bai8-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['他比我更高。'], explanation: 'Câu có 比 không dùng 很/非常 trước tính từ; có thể dùng 更 để tăng mức độ.' }),
  errorCorrection('hsk2_b8_error_02', '今天比昨天非常冷。', '今天比昨天冷。', { taskGroup: 'bai8-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['今天比昨天更冷。'], explanation: 'Sau 比 dùng tính từ trực tiếp; muốn nhấn mạnh dùng 更 hoặc 还.' }),
  errorCorrection('hsk2_b8_error_03', '虽然下雨，所以我们还是去了。', '虽然下雨，但是我们还是去了。', { taskGroup: 'bai8-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Cấu trúc chuyển ý là 虽然……但是……, không dùng 所以.' }),
  errorCorrection('hsk2_b8_error_04', '我有一个手表。', '我有一块手表。', { taskGroup: 'bai8-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '手表 dùng lượng từ 块.' }),
  errorCorrection('hsk2_b8_error_05', '我们点菜了三个。', '我们点了三个菜。', { taskGroup: 'bai8-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Trật tự đúng là động từ + 了 + số lượng + danh từ.' }),
  essay('hsk2_b8_writing', '写一写你和家人（或朋友）过生日的一天。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 虽然……但是……、比、点、花、手表、饭馆、有意思、妻子（丈夫）、左边（右边）。', '昨天是我的生日。虽然我忘了，但是朋友们都记得。我们去饭馆点了很多菜，鱼比肉更好吃。朋友还送我一块手表，我们过了很快乐的一天。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nội dung kể rõ một ngày sinh nhật'], { taskGroup: 'bai8-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b8WritingRubric, maxScore: 10 }),
  essay('hsk2_b8_picture_01', 'Bài 4 · 看图，用“比”造句: Viết một câu so sánh theo ảnh.', '哥哥比弟弟高。', ['Dùng 比', 'Dùng đúng tính từ gợi ý: 高'], { imageUrl: '/images/hsk2-bai8/bai8_bi_01.png', imageAlt: '哥哥 – 弟弟 – 高', imageHint: 'Tính từ gợi ý: 高.', explanation: 'Đáp án tham khảo, không phải đáp án cố định. Giáo viên tự quyết đúng/sai theo ảnh, cấu trúc 比 và ý nghĩa câu học sinh nói/viết.', taskGroup: 'bai8-picture-comparison', taskGroupTitle: 'III. 写作 · Bài 4: 看图，用“比”造句', rubric: b8PictureRubric, maxScore: 10 }),
  essay('hsk2_b8_picture_02', 'Bài 4 · 看图，用“比”造句: Viết một câu so sánh theo ảnh.', '左边的手表比右边的贵。', ['Dùng 比', 'Dùng đúng tính từ gợi ý: 贵'], { imageUrl: '/images/hsk2-bai8/bai8_bi_02.png', imageAlt: '左边的手表 – 右边的手表 – 贵', imageHint: 'Tính từ gợi ý: 贵.', explanation: 'Đáp án tham khảo, không phải đáp án cố định. Giáo viên tự quyết đúng/sai theo ảnh, cấu trúc 比 và ý nghĩa câu học sinh nói/viết.', taskGroup: 'bai8-picture-comparison', taskGroupTitle: 'III. 写作 · Bài 4: 看图，用“比”造句', rubric: b8PictureRubric, maxScore: 10 }),
  essay('hsk2_b8_picture_03', 'Bài 4 · 看图，用“比”造句: Viết một câu so sánh theo ảnh.', '今天比昨天热。', ['Dùng 比', 'Dùng đúng tính từ gợi ý: 热'], { imageUrl: '/images/hsk2-bai8/bai8_bi_03.png', imageAlt: '今天 – 昨天 – 热', imageHint: 'Tính từ gợi ý: 热.', acceptedVariants: ['今天比昨天更热。'], explanation: 'Đáp án tham khảo, không phải đáp án cố định. Giáo viên tự quyết đúng/sai theo ảnh, cấu trúc 比 và ý nghĩa câu học sinh nói/viết.', taskGroup: 'bai8-picture-comparison', taskGroupTitle: 'III. 写作 · Bài 4: 看图，用“比”造句', rubric: b8PictureRubric, maxScore: 10 }),
  essay('hsk2_b8_picture_04', 'Bài 4 · 看图，用“比”造句: Viết một câu so sánh theo ảnh.', '左边的鱼比右边的长。', ['Dùng 比', 'Dùng đúng tính từ gợi ý: 长'], { imageUrl: '/images/hsk2-bai8/bai8_bi_04.png', imageAlt: '左边的鱼 – 右边的鱼 – 长', imageHint: 'Tính từ gợi ý: 长.', explanation: 'Đáp án tham khảo, không phải đáp án cố định. Giáo viên tự quyết đúng/sai theo ảnh, cấu trúc 比 và ý nghĩa câu học sinh nói/viết.', taskGroup: 'bai8-picture-comparison', taskGroupTitle: 'III. 写作 · Bài 4: 看图，用“比”造句', rubric: b8PictureRubric, maxScore: 10 }),
  essay('hsk2_b8_picture_05', 'Bài 4 · 看图，用“比”造句: Viết một câu so sánh theo ảnh.', '左边的苹果比右边的多。', ['Dùng 比', 'Dùng đúng tính từ gợi ý: 多'], { imageUrl: '/images/hsk2-bai8/bai8_bi_05.png', imageAlt: '左边的苹果 – 右边的苹果 – 多', imageHint: 'Tính từ gợi ý: 多.', explanation: 'Đáp án tham khảo, không phải đáp án cố định. Giáo viên tự quyết đúng/sai theo ảnh, cấu trúc 比 và ý nghĩa câu học sinh nói/viết.', taskGroup: 'bai8-picture-comparison', taskGroupTitle: 'III. 写作 · Bài 4: 看图，用“比”造句', rubric: b8PictureRubric, maxScore: 10 })
];

const b8TranslationQuestions: Question[] = [
  translation('hsk2_b8_translate_01', '我也觉得左边的比右边的好看。', 'Tôi cũng thấy cái bên trái đẹp hơn cái bên phải.', 'zh_to_vi_text'),
  translation('hsk2_b8_translate_02', '虽然你忘了，但是我记得。', 'Mặc dù bạn quên nhưng tôi vẫn nhớ.', 'zh_to_vi_text'),
  translation('hsk2_b8_translate_03', '网上买票比在这里买便宜。', 'Mua vé trên mạng rẻ hơn mua ở đây.', 'zh_to_vi_text'),
  translation('hsk2_b8_translate_04', 'Hôm nay lạnh hơn hôm qua.', '今天比昨天冷。'),
  translation('hsk2_b8_translate_05', 'Quyển sách này rất thú vị.', '这本书很有意思。'),
  translation('hsk2_b8_translate_06', 'Đây là vợ tôi.', '这是我的妻子。'),
  translation('hsk2_b8_translate_07', 'Mặc dù hơi mệt nhưng tôi rất thích bơi.', '虽然有点儿累，但是我很喜欢游泳。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 虽然……但是……', 'Dùng 喜欢游泳'], rubric: b8AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b8_translate_08', 'Tôi thấy trà sữa còn ngon hơn sữa.', '我觉得奶茶比牛奶还好喝。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 比', 'Dùng 还好喝'], rubric: b8AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b8_translate_09', 'Ngày mai chúng tôi đi nhà hàng ăn cơm.', '明天我们要去饭馆吃饭。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 去饭馆吃饭'], rubric: b8AudioTranslationRubric, maxScore: 10 })
];

const b9WordBank = ['坏', '旁边', '男孩儿', '这样', '个子', '那么', '高', '门口', '咖啡', '离', '近', '走路', '周'];
const b9Vocab = vocab([
  ['坏', 'huài', 'Tính từ', 'xấu; hỏng', '我的手机坏了，不能给你打电话。'],
  ['旁边', 'pángbiān', 'Danh từ phương vị', 'bên cạnh', '咖啡店在商店旁边。'],
  ['男孩儿', 'nánháir', 'Danh từ', 'bé trai, cậu bé', '那个男孩儿在学校学习中文。'],
  ['这样', 'zhèyàng', 'Đại từ', 'như thế này, như vậy', '你不要这样说，他会不高兴。'],
  ['个子', 'gèzi', 'Danh từ', 'vóc dáng, chiều cao cơ thể', '儿子的个子没有他那么高。'],
  ['那么', 'nàme', 'Đại từ', 'như thế, đến mức như vậy', '今天没有昨天那么热。'],
  ['高', 'gāo', 'Tính từ', 'cao', '他个子很高，篮球打得很好。'],
  ['门口', 'ménkǒu', 'Danh từ', 'cửa ra vào, cổng', '我在公司门口等你。'],
  ['咖啡', 'kāfēi', 'Danh từ', 'cà phê', '我不喝咖啡。'],
  ['离', 'lí', 'Động từ', 'cách, cách xa', '我家离学校很近。'],
  ['近', 'jìn', 'Tính từ', 'gần', '学校离我家很近。'],
  ['走路', 'zǒulù', 'Động từ', 'đi bộ', '我们走路去商店。'],
  ['周', 'zhōu', 'Danh từ', 'tuần', '这周我休息。']
]);
const b9ReadingQuestions: Question[] = [
  mc('hsk2_b9_read_tf_01', '他们走路去商店。', ['✓', '✗'], 0),
  mc('hsk2_b9_read_tf_02', '商店离他家很远。', ['✓', '✗'], 1),
  mc('hsk2_b9_read_tf_03', '商店的衣服比商场里的好看。', ['✓', '✗'], 1),
  mc('hsk2_b9_read_mc_01', '他们走路走了多长时间？', ['十分钟', '二十分钟', '半个小时'], 1),
  mc('hsk2_b9_read_mc_02', '他们为什么什么都没买？', ['衣服太贵', '衣服没有商场里的好看', '没有时间'], 1),
  mc('hsk2_b9_read_mc_03', '后来他们去了哪儿？', ['商场', '咖啡店', '学校'], 1),
  fill('hsk2_b9_read_fill_01', '我的手机（　）了，不能给你打电话。', '坏', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_02', '医院（　）有一家超市。', '旁边', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_03', '那个（　）在学校学习中文。', '男孩儿', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_04', '你不要（　）说，他会不高兴。', '这样', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_05', '爸爸的（　）很高，但是他跑得不快。', '个子', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_06', '今天没有昨天（　）热。', '那么', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_07', '他个子很（　），篮球打得很好。', '高', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_08', '我们在学校（　）见面吧。', '门口', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_09', '他每天早上喝一杯（　）。', '咖啡', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_10', '学校（　）这儿不远，我们走路去。', '离', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_11', '公司离我家很（　），我每天走路上班。', '近', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_12', '（　）要半个小时，你坐车去吧。', '走路', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b9_read_fill_13', '他每（　）都学习中文。', '周', b9WordBank, 'hsk2-b9-reading-fill', 'Bài 3 · 选词填空')
];
const b9Arrange: Question[] = [
  arrange('hsk2_b9_arrange_01', ['好看', '没有', '那块', '这块手表'], '这块手表没有那块好看。', '那块没有这块手表好看。'),
  arrange('hsk2_b9_arrange_02', ['咖啡店', '离', '有点儿', '这儿', '远'], '咖啡店离这儿有点儿远。', '这儿离咖啡店有点儿远。'),
  arrange('hsk2_b9_arrange_03', ['半个多小时', '走', '就', '到了'], '走半个多小时就到了。'),
  arrange('hsk2_b9_arrange_04', ['妹妹', '高', '有', '姐姐', '吗'], '妹妹有姐姐高吗？', '姐姐有妹妹高吗？'),
  arrange('hsk2_b9_arrange_05', ['我家', '学校', '离', '很', '近'], '我家离学校很近。', '学校离我家很近。')
];
const b9Reading = reading('hsk2_b9_reading_01', 'II. 阅读 · Đọc hiểu', '周末我和朋友去商店买衣服。商店离我家不远，我们走路去，走了二十分钟。商店里的衣服没有商场里的好看，所以我们什么都没买。后来我们去了商店旁边的咖啡店。', b9ReadingQuestions, b9WordBank);

const b9Listening: Question[] = [
  listeningGroup('hsk2_b9_listen_01', 'Bài 1 · 听短文，判断对错', '这周我休息。我家离学校很近，所以我每天走路去学校，走路只要十分钟。学校门口有一家咖啡店，我的朋友喜欢在那儿喝咖啡，但是我不喝咖啡，因为喝了咖啡晚上就不想睡觉。', 'listening_tf', [
    listeningTf('hsk2_b9_listen_01_01', '我家离学校很近。', true),
    listeningTf('hsk2_b9_listen_01_02', '我每天坐车去学校。', false),
    listeningTf('hsk2_b9_listen_01_03', '走路去学校要一个小时。', false),
    listeningTf('hsk2_b9_listen_01_04', '学校门口有一家咖啡店。', true),
    listeningTf('hsk2_b9_listen_01_05', '我喜欢喝咖啡。', false)
  ]),
  listeningGroup('hsk2_b9_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：儿子的裤子坏了，我们给他买条新的吧。男：好啊。', 'listening_mc', [
    listeningMc('hsk2_b9_listen_02_01', '他们要给儿子买什么？', ['裤子', '书包', '手表'], 0)
  ]),
  listeningGroup('hsk2_b9_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：旁边那个男孩儿穿着这样的裤子，我觉得很好看。男：儿子的个子没有他那么高。', 'listening_mc', [
    listeningMc('hsk2_b9_listen_02_02', '谁的个子更高？', ['儿子', '他', '一样高'], 1)
  ]),
  listeningGroup('hsk2_b9_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '男：我们去咖啡店吧。女：咖啡店离这儿有点儿远。', 'listening_mc', [
    listeningMc('hsk2_b9_listen_02_03', '咖啡店离这儿怎么样？', ['很近', '有点儿远', '就在门口'], 1)
  ]),
  listeningGroup('hsk2_b9_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：要走多长时间？女：走半个多小时就到了。', 'listening_mc', [
    listeningMc('hsk2_b9_listen_02_04', '走路要多长时间？', ['半个多小时', '十分钟', '两个小时'], 0)
  ]),
  listeningGroup('hsk2_b9_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：你为什么不喝咖啡？男：喝了咖啡，晚上就别想睡觉了。', 'listening_mc', [
    listeningMc('hsk2_b9_listen_02_05', '男的为什么不喝咖啡？', ['咖啡不好喝', '喝了晚上睡不着', '咖啡店太远'], 1)
  ])
];

const b9WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b9AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

const b9Speaking: Question[] = [
  speaking('hsk2_b9_speak_01', '儿子的裤子坏了，我们给他买条新的吧。', 'Érzi de kùzi huài le, wǒmen gěi tā mǎi tiáo xīn de ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_02', '没有你上次买的那条好看。', 'Méiyǒu nǐ shàng cì mǎi de nà tiáo hǎokàn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_03', '儿子的个子没有他那么高。', 'Érzi de gèzi méiyǒu tā nàme gāo.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_04', '咖啡店离这儿有点儿远。', 'Kāfēi diàn lí zhèr yǒudiǎnr yuǎn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_05', '这里离家很近，还是走路吧。', 'Zhèlǐ lí jiā hěn jìn, háishi zǒulù ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_06', '走半个多小时就到了。', 'Zǒu bàn ge duō xiǎoshí jiù dào le.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b9_speak_07', '没有 → 昨天没有今天______。', 'Méiyǒu → Zuótiān méiyǒu jīntiān ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '昨天没有今天这么冷。', referenceAnswers: ['昨天没有今天这么冷。'], requiredElements: ['没有'] }),
  speaking('hsk2_b9_speak_08', '离 → 学校离______。', 'Lí → Xuéxiào lí ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '学校离我家很近。', referenceAnswers: ['学校离我家很近。'], requiredElements: ['离'] }),
  speaking('hsk2_b9_speak_09', '有……吗 → 妹妹有姐姐______吗？', 'Yǒu…ma → Mèimei yǒu jiějie ______ ma?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '妹妹有姐姐高吗？', referenceAnswers: ['妹妹有姐姐高吗？'], requiredElements: ['有……吗'] }),
  speaking('hsk2_b9_speak_10', '走路 → 我家离学校很近，我______。', 'Zǒulù → Wǒ jiā lí xuéxiào hěn jìn, wǒ ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我家离学校很近，我每天走路去学校。', referenceAnswers: ['我家离学校很近，我每天走路去学校。'], requiredElements: ['走路'] }),
  speaking('hsk2_b9_speak_11', '旁边 → 学校______。', 'Pángbiān → Xuéxiào ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '学校旁边有一家咖啡店。', referenceAnswers: ['学校旁边有一家咖啡店。'], requiredElements: ['旁边'] })
];

const b9EssayQuestions: Question[] = [
  errorCorrection('hsk2_b9_error_01', '昨天没有今天比冷。', '昨天没有今天冷。', { taskGroup: 'bai9-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['昨天没有今天这么冷。'], explanation: 'Mẫu 没有 so sánh không dùng thêm 比.' }),
  errorCorrection('hsk2_b9_error_02', '学校医院离不远。', '学校离医院不远。', { taskGroup: 'bai9-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '离 đứng giữa hai địa điểm: 学校离医院不远.' }),
  errorCorrection('hsk2_b9_error_03', '他们学中文了两年。', '他们学了两年中文。', { taskGroup: 'bai9-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Bổ ngữ thời lượng đứng sau động từ; 了 đứng ngay sau 学.' }),
  errorCorrection('hsk2_b9_error_04', '这块手表没有那块比好看。', '这块手表没有那块好看。', { taskGroup: 'bai9-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Mẫu 没有 so sánh không dùng thêm 比.' }),
  errorCorrection('hsk2_b9_error_05', '妹妹有姐姐很高吗？', '妹妹有姐姐高吗？', { taskGroup: 'bai9-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Mẫu A 有 B + tính từ không thêm 很.' }),
  essay('hsk2_b9_writing', '写一写你每天怎么去学校（或公司），家离学校（或公司）远不远。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 离、近（远）、走路、半个小时、没有……那么……、旁边、门口、咖啡。', '我家离学校不太远，走路要二十分钟，所以我每天走路去学校。学校旁边有一家咖啡店，门口有很多人。我朋友家没有我家这么近，他每天坐车去。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nội dung nói rõ cách đi và khoảng cách'], { taskGroup: 'bai9-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b9WritingRubric, maxScore: 10 })
];

const b9TranslationQuestions: Question[] = [
  translation('hsk2_b9_translate_01', '儿子的个子没有他那么高。', 'Chiều cao của con trai không cao bằng cậu ấy.', 'zh_to_vi_text'),
  translation('hsk2_b9_translate_02', '咖啡店离这儿有点儿远。', 'Quán cà phê cách đây hơi xa.', 'zh_to_vi_text'),
  translation('hsk2_b9_translate_03', '走半个多小时就到了。', 'Đi bộ hơn nửa tiếng là đến.', 'zh_to_vi_text'),
  translation('hsk2_b9_translate_04', 'Hôm qua không lạnh bằng hôm nay.', '昨天没有今天这么冷。'),
  translation('hsk2_b9_translate_05', 'Trường học cách đây không xa.', '学校离这儿不远。'),
  translation('hsk2_b9_translate_06', 'Em gái có cao bằng chị không?', '妹妹有姐姐高吗？'),
  translation('hsk2_b9_translate_07', 'Chiếc đồng hồ này không đẹp bằng chiếc kia.', '这块手表没有那块好看。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 没有', 'Dùng đúng 好看'], rubric: b9AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b9_translate_08', 'Chúng ta nghỉ mười phút.', '我们休息十分钟。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 休息十分钟'], rubric: b9AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b9_translate_09', 'Nhà tôi rất gần cổng trường.', '我家离学校门口很近。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 离', 'Dùng 学校门口', 'Dùng 很近'], rubric: b9AudioTranslationRubric, maxScore: 10 })
];

const b10WordBank = ['开学', '门', '后面', '帮', '笔', '考试', '词', '本子', '错', '题', '还是', '考', '快要', '笑'];
const b10Vocab = vocab([
  ['开学', 'kāixué', 'Động từ', 'khai giảng, bắt đầu học kỳ', '下星期就要开学了。'],
  ['门', 'mén', 'Danh từ', 'cửa', '请把门关上。'],
  ['后面', 'hòumiàn', 'Danh từ', 'phía sau', '我的书包在门后面。'],
  ['帮', 'bāng', 'Động từ', 'giúp', '你能帮我拿一下书包吗？'],
  ['笔', 'bǐ', 'Danh từ', 'bút', '我的笔坏了，我要买一支新的。'],
  ['考试', 'kǎoshì', 'Động từ / danh từ', 'thi; kỳ thi', '明天考试，我在看书呢。'],
  ['词', 'cí', 'Danh từ', 'từ', '今天我学了十个词。'],
  ['本子', 'běnzi', 'Danh từ', 'vở, quyển sổ', '我的本子里有很多词。'],
  ['错', 'cuò', 'Tính từ', 'sai, nhầm', '这个字写错了。'],
  ['题', 'tí', 'Danh từ', 'câu hỏi, bài tập', '这道题我做错了。'],
  ['还是', 'háishi', 'Liên từ', 'hay là (trong câu hỏi lựa chọn)', '你喝茶还是咖啡？'],
  ['考', 'kǎo', 'Động từ', 'thi, kiểm tra', '今天我们考中文。'],
  ['快要', 'kuàiyào', 'Phó từ', 'sắp, gần như sắp', '电影快要开始了。'],
  ['笑', 'xiào', 'Động từ', 'cười', '他笑了笑，没说什么。']
]);

const b10Listening: Question[] = [
  listeningGroup(
    'hsk2_b10_listen_01',
    'Bài 1 · 听短文，判断对错',
    '上个周末，我和朋友小王一起去商场买东西。商场离我家不太远，我们走路去，走了二十分钟。我想买一支新笔，小王想买一个本子。因为我们都喜欢红色，所以买了红色的。回家以后，我已经有点儿累了，就早早地休息了。',
    'listening_tf',
    [
      listeningTf('hsk2_b10_listen_01_01', '我和小王一起去商场。', true),
      listeningTf('hsk2_b10_listen_01_02', '商场离我家很远。', false),
      listeningTf('hsk2_b10_listen_01_03', '我们坐车去商场。', false),
      listeningTf('hsk2_b10_listen_01_04', '我想买一个本子。', false),
      listeningTf('hsk2_b10_listen_01_05', '回家以后，我很早就休息了。', true)
    ]
  ),
  listeningGroup('hsk2_b10_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '男：这次考试你准备得怎么样？女：我每天都看书，还看了很多做错的题。', 'listening_mc', [listeningMc('hsk2_b10_listen_02_01', '女的是怎么准备考试的？', ['看书，还看做错的题', '打篮球', '去旅游'], 0)]),
  listeningGroup('hsk2_b10_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：学校离你家远不远？男：不太远，走路十五分钟就到了。', 'listening_mc', [listeningMc('hsk2_b10_listen_03_01', '男的怎么去学校？', ['打车', '走路', '坐公交车'], 1)]),
  listeningGroup('hsk2_b10_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '男：星期六是我的生日，你能来吗？女：当然，我给你准备了一个礼物。', 'listening_mc', [listeningMc('hsk2_b10_listen_04_01', '星期六是谁的生日？', ['男的', '女的', '朋友'], 0)]),
  listeningGroup('hsk2_b10_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '女：你喜欢踢足球还是打篮球？男：踢足球，我一到星期天就去踢。', 'listening_mc', [listeningMc('hsk2_b10_listen_05_01', '男的喜欢什么运动？', ['踢足球', '打篮球', '游泳'], 0)]),
  listeningGroup('hsk2_b10_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '男：门口有一家咖啡店，我们进去坐坐吧。女：好啊，我想喝杯奶茶。', 'listening_mc', [listeningMc('hsk2_b10_listen_06_01', '女的想喝什么？', ['咖啡', '奶茶', '茶'], 1)])
];

const b10ReadingWordBank = b10WordBank;
const b10Reading = reading('hsk2_b10_reading_01', 'II. 阅读 · Đọc hiểu', '我的朋友小李在北京学中文，他的爱好是运动。他每天早上跑步，一到周末就和同学一起打篮球。虽然他篮球打得没有同学那么好，但是他很快乐。下个月他就要回国了，他说他还想再来北京。', [
  mc('hsk2_b10_read_tf_01', '小李在北京学中文。', ['✓', '✗'], 0),
  mc('hsk2_b10_read_tf_02', '小李每天晚上跑步。', ['✓', '✗'], 1),
  mc('hsk2_b10_read_tf_03', '小李篮球打得比同学好。', ['✓', '✗'], 1),
  mc('hsk2_b10_read_mc_01', '小李的爱好是什么？', ['运动', '画画', '看电影'], 0),
  mc('hsk2_b10_read_mc_02', '小李周末做什么？', ['在家休息', '和同学打篮球', '去商场'], 1),
  mc('hsk2_b10_read_mc_03', '下个月小李要做什么？', ['开学', '回国', '考试'], 1),
  fill('hsk2_b10_read_fill_01', '我们下星期（　），我还没有准备好。', '开学', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_02', '让我来开（　）吧，你先坐一会儿。', '门', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_03', '他坐在我（　），我看不见老师。', '后面', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_04', '你能（　）我拿一下书包吗？', '帮', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_05', '我的（　）坏了，我要买一支新的。', '笔', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_06', '明天有一个（　），我要好好学习。', '考试', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_07', '今天我学了十个（　），还有两个不会。', '词', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_08', '我的（　）里有很多词。', '本子', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_09', '这个字写（　）了，你再看看。', '错', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_10', '这道（　）我做错了，但是我知道哪里错。', '题', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_11', '你喝茶（　）喝咖啡？', '还是', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_12', '今天我们（　）中文，我还没有复习好。', '考', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_13', '电影（　）开始了，我们快进去吧。', '快要', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空'),
  fill('hsk2_b10_read_fill_14', '他（　）了笑，没说什么就走了。', '笑', b10ReadingWordBank, 'hsk2-b10-read-fill', 'Bài 3 · 选词填空')
], b10ReadingWordBank);

const b10Arrange: Question[] = [
  arrange('hsk2_b10_arrange_01', ['门后面', '在', '我的书包'], '我的书包在门后面。'),
  arrange('hsk2_b10_arrange_02', ['了', '开始', '电影', '快要'], '电影快要开始了。'),
  arrange('hsk2_b10_arrange_03', ['书包', '帮', '吗', '你', '拿', '一下', '我', '能'], '你能帮我拿一下书包吗？'),
  arrange('hsk2_b10_arrange_04', ['咖啡', '你', '还是', '喝茶'], '你喝茶还是咖啡？'),
  arrange('hsk2_b10_arrange_05', ['就要', '了', '下星期', '我们', '考试'], '我们下星期就要考试了。', '下星期我们就要考试了。')
];

const b10WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b10EssayQuestions: Question[] = [
  errorCorrection('hsk2_b10_error_01', '电影快要开始。', '电影快要开始了。', { taskGroup: 'bai10-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Mẫu 快要……了 là mẫu cố định, không bỏ 了.' }),
  errorCorrection('hsk2_b10_error_02', '我们下星期快要考试了。', '我们下星期就要考试了。', { taskGroup: 'bai10-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Có thời gian cụ thể thì thường dùng 就要……了.' }),
  errorCorrection('hsk2_b10_error_03', '你想喝茶还是咖啡吗？', '你想喝茶还是咖啡？', { taskGroup: 'bai10-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Câu hỏi lựa chọn A 还是 B không thêm 吗.' }),
  errorCorrection('hsk2_b10_error_04', '我看了错时间。', '我看错了时间。', { taskGroup: 'bai10-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '错 là bổ ngữ kết quả đứng sau động từ; 了 đứng sau bổ ngữ.' }),
  errorCorrection('hsk2_b10_error_05', '他笑笑了，没说什么。', '他笑了笑，没说什么。', { taskGroup: 'bai10-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Động từ lặp đã xảy ra dùng A 了 A.' }),
  essay('hsk2_b10_writing', '写一写开学（或考试）前你做了什么准备。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 快要（就要）……了、帮、笔、本子、考试、错、还是、词、笑。', '下星期就要开学了，我在准备书包。我的书包在门后面，笔和本子都在桌子上。妈妈帮我看了看，说还要买一支新笔。我笑了笑，因为明天可以去商店了。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nội dung nói rõ việc chuẩn bị trước khi khai giảng hoặc thi'], { taskGroup: 'bai10-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b10WritingRubric, maxScore: 10 })
];

const b10Speaking: Question[] = [
  speaking('hsk2_b10_speak_01', '明天就开学啊？爸爸，我的书包你看见了吗？', 'Míngtiān jiù kāixué a? Bàba, wǒ de shūbāo nǐ kànjiàn le ma?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_02', '书包在门后面，书在床上，笔在桌子上。', 'Shūbāo zài mén hòumiàn, shū zài chuáng shàng, bǐ zài zhuōzi shàng.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_03', '明天考试，我在看书呢。', 'Míngtiān kǎoshì, wǒ zài kàn shū ne.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_04', '本子上做错的题也要看一看。', 'Běnzi shàng zuòcuò de tí yě yào kàn yí kàn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_05', '是您准备考试还是我准备考试？', 'Shì nín zhǔnbèi kǎoshì háishi wǒ zhǔnbèi kǎoshì?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_06', '饭菜快要做好了，你叫弟弟一起去洗手吧。', 'Fàncài kuàiyào zuò hǎo le, nǐ jiào dìdi yìqǐ qù xǐshǒu ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b10_speak_07', '快要……了 → 电影______。', 'Kuàiyào…le → Diànyǐng ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '电影快要开始了。', referenceAnswers: ['电影快要开始了。'], requiredElements: ['Dùng 快要……了'] }),
  speaking('hsk2_b10_speak_08', '就要……了 → 我们下星期______。', 'Jiùyào…le → Wǒmen xià xīngqī ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我们下星期就要考试了。', referenceAnswers: ['我们下星期就要考试了。'], requiredElements: ['Dùng 就要……了'] }),
  speaking('hsk2_b10_speak_09', '帮 → 你能______吗？', 'Bāng → Nǐ néng ______ ma?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你能帮我拿一下书包吗？', referenceAnswers: ['你能帮我拿一下书包吗？'], requiredElements: ['Dùng 帮'] }),
  speaking('hsk2_b10_speak_10', '还是 → 你______？', 'Háishi → Nǐ ______?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你喝茶还是喝咖啡？', referenceAnswers: ['你喝茶还是喝咖啡？'], requiredElements: ['Dùng 还是'] }),
  speaking('hsk2_b10_speak_11', '错 → 这个字______。', 'Cuò → Zhège zì ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '这个字写错了。', referenceAnswers: ['这个字写错了。'], requiredElements: ['Dùng 错'] })
];

const b10AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b10TranslationQuestions: Question[] = [
  translation('hsk2_b10_translate_01', '书包在门后面。', 'Cặp sách ở sau cánh cửa.', 'zh_to_vi_text'),
  translation('hsk2_b10_translate_02', '明天考试，我在看书呢。', 'Ngày mai thi, tôi đang đọc sách đây.', 'zh_to_vi_text'),
  translation('hsk2_b10_translate_03', '是您准备考试还是我准备考试？', 'Là mẹ chuẩn bị thi hay con chuẩn bị thi vậy?', 'zh_to_vi_text'),
  translation('hsk2_b10_translate_04', 'Tuần sau chúng ta sẽ thi rồi.', '我们下星期就要考试了。'),
  translation('hsk2_b10_translate_05', 'Bạn uống trà hay cà phê?', '你喝茶还是咖啡？'),
  translation('hsk2_b10_translate_06', 'Bạn có thể giúp tôi một chút không?', '你能帮我一下吗？'),
  translation('hsk2_b10_translate_07', 'Chữ này viết sai rồi.', '这个字写错了。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 写错了'], rubric: b10AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b10_translate_08', 'Bộ phim sắp bắt đầu rồi.', '电影快要开始了。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 快要……了'], rubric: b10AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b10_translate_09', 'Anh ấy cười một cái, không nói gì.', '他笑了笑，没说什么。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 笑了笑', 'Dùng 没说什么'], rubric: b10AudioTranslationRubric, maxScore: 10 })
];

const b11WordBank = ['头', '疼', '经常', '动', '着', '路上', '慢', '进', '药', '药店', '身体', '时', '最'];
const b11Vocab = vocab([
  ['头', 'tóu', 'Danh từ', 'đầu', '我的头有点儿疼。'],
  ['疼', 'téng', 'Tính từ', 'đau', '你怎么了？是不是肚子疼？'],
  ['经常', 'jīngcháng', 'Phó từ', 'thường xuyên', '我经常和家人去公园。'],
  ['动', 'dòng', 'Động từ', 'cử động, di chuyển', '现在不能动。'],
  ['着', 'zhe', 'Trợ từ', 'chỉ trạng thái/hành động tiếp diễn', '门开着呢。'],
  ['路上', 'lùshang', 'Danh từ', 'trên đường', '路上车很多。'],
  ['慢', 'màn', 'Tính từ', 'chậm (ôn từ Bài 5)', '我们开得很慢。'],
  ['进', 'jìn', 'Động từ', 'vào', '请进。'],
  ['药', 'yào', 'Danh từ', 'thuốc', '你吃药了吗？'],
  ['药店', 'yàodiàn', 'Danh từ', 'hiệu thuốc', '药店在医院旁边。'],
  ['身体', 'shēntǐ', 'Danh từ', 'cơ thể, sức khỏe', '运动对身体很好。'],
  ['时', 'shí', 'Danh từ', 'lúc, thời điểm', '吃饭时不要看手机。'],
  ['最', 'zuì', 'Phó từ', 'nhất', '我最喜欢吃中国菜。']
]);

const b11Listening: Question[] = [
  listeningGroup('hsk2_b11_listen_01', 'Bài 1 · 听短文，判断对错', '周末我经常和家人去公园。昨天路上车很多，我们开得很慢。到公园的时候，爷爷已经在门口等着我们了。他穿着红色的衣服，手里拿着一杯奶茶。我最喜欢和爷爷一起走路，因为走路对身体很好。', 'listening_tf', [
    listeningTf('hsk2_b11_listen_01_01', '我周末经常去公园。', true),
    listeningTf('hsk2_b11_listen_01_02', '昨天路上车很少。', false),
    listeningTf('hsk2_b11_listen_01_03', '爷爷在门口等着我们。', true),
    listeningTf('hsk2_b11_listen_01_04', '爷爷穿着白色的衣服。', false),
    listeningTf('hsk2_b11_listen_01_05', '我最喜欢和爷爷一起跑步。', false)
  ]),
  listeningGroup('hsk2_b11_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：你怎么了？男：我牙疼，不能吃东西。', 'listening_mc', [listeningMc('hsk2_b11_listen_02_01', '男的怎么了？', ['头疼', '牙疼', '肚子疼'], 1)]),
  listeningGroup('hsk2_b11_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：你吃药了吗？女：吃过了，药店的人说一天吃两次。', 'listening_mc', [listeningMc('hsk2_b11_listen_03_01', '女的在哪儿买药？', ['医院', '药店', '超市'], 1)]),
  listeningGroup('hsk2_b11_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：老师，我可以进来吗？男：请进，门开着呢。', 'listening_mc', [listeningMc('hsk2_b11_listen_04_01', '门怎么样？', ['开着', '坏了', '很小'], 0)]),
  listeningGroup('hsk2_b11_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你们班谁中文说得最好？女：小王说得最好，他每天都说中文。', 'listening_mc', [listeningMc('hsk2_b11_listen_05_01', '谁中文说得最好？', ['小王', '女的', '男的'], 0)]),
  listeningGroup('hsk2_b11_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：你的身体怎么样？男：我经常跑步，身体很好。', 'listening_mc', [listeningMc('hsk2_b11_listen_06_01', '男的经常做什么？', ['跑步', '游泳', '打球'], 0)])
];

const b11Reading = reading('hsk2_b11_reading_01', 'II. 阅读 · Đọc hiểu', '小红在一家商场工作，她最喜欢的颜色是绿色。她经常坐公交车上班，路上要半个小时。今天路上车很多，公交车开得很慢，所以她来晚了。到商场的时候，朋友站在门口，笑着对她说：“没关系，快进来吧。”', [
  mc('hsk2_b11_read_tf_01', '小红在商场工作。', ['✓', '✗'], 0),
  mc('hsk2_b11_read_tf_02', '小红最喜欢红色。', ['✓', '✗'], 1),
  mc('hsk2_b11_read_tf_03', '小红今天来晚了。', ['✓', '✗'], 0),
  mc('hsk2_b11_read_mc_01', '小红怎么去上班？', ['坐公交车', '走路', '打车'], 0),
  mc('hsk2_b11_read_mc_02', '今天公交车为什么开得很慢？', ['路上车很多', '下雨了', '车坏了'], 0),
  mc('hsk2_b11_read_mc_03', '朋友笑着说了什么？', ['没关系，快进来吧', '你怎么来晚了', '再见'], 0),
  ...b11WordBank.map((word, index) => fill(`hsk2_b11_read_fill_${String(index + 1).padStart(2, '0')}`, [
    '他站在那儿，一（　）不动。',
    '我的（　）有点儿疼，想早点儿休息。',
    '你怎么了？是不是肚子（　）？',
    '我们（　）一起去公园玩。',
    '门开（　），但是里面没有人。',
    '去学校的（　），我看见了一只猫。',
    '你走得太（　）了，火车要开了。',
    '老师说可以（　）教室了。',
    '你今天吃过（　）了吗？',
    '妈妈让我去（　）买药。',
    '我经常跑步，对（　）很好。',
    '吃饭（　）不要看手机。',
    '在我们家，爸爸（　）高。'
  ][index], word, b11WordBank, 'hsk2-b11-read-fill', 'Bài 3 · 选词填空'))
], b11WordBank);

const b11Arrange: Question[] = [
  arrange('hsk2_b11_arrange_01', ['着', '门', '教室的', '开'], '教室的门开着。'),
  arrange('hsk2_b11_arrange_02', ['说得', '谁', '最', '你们班', '好', '中文'], '你们班谁中文说得最好？'),
  arrange('hsk2_b11_arrange_03', ['衣服', '着', '她', '红色的', '穿'], '她穿着红色的衣服。'),
  arrange('hsk2_b11_arrange_04', ['了', '吃', '药', '吗', '你', '过'], '你吃过药了吗？'),
  arrange('hsk2_b11_arrange_05', ['在', '我', '路上', '现在'], '我现在在路上。', '现在我在路上。')
];

const b11WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b11EssayQuestions: Question[] = [
  errorCorrection('hsk2_b11_error_01', '门开了着。', '门开着。', { taskGroup: 'bai11-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '着 đứng ngay sau động từ để biểu thị trạng thái tiếp diễn, không dùng chung với 了.' }),
  errorCorrection('hsk2_b11_error_02', '她穿着了红色的衣服。', '她穿着红色的衣服。', { taskGroup: 'bai11-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Mẫu V + 着 + tân ngữ không thêm 了.' }),
  errorCorrection('hsk2_b11_error_03', '教室的门不开着。', '教室的门没开着。', { taskGroup: 'bai11-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Phủ định của 着 dùng 没（有） trước động từ.' }),
  errorCorrection('hsk2_b11_error_04', '他最很喜欢中国菜。', '他最喜欢中国菜。', { taskGroup: 'bai11-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '最 đã là phó từ mức độ, không dùng cùng 很.' }),
  errorCorrection('hsk2_b11_error_05', '我头疼很。', '我头很疼。', { taskGroup: 'bai11-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Phó từ mức độ đứng trước tính từ: 头很疼.' }),
  essay('hsk2_b11_writing', '介绍一个你经常做的运动，说说它对身体好不好。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 经常、最、着、身体、……时、路上、慢、药、疼。', '我最喜欢的运动是跑步，我经常早上六点去跑步。路上人不多，我跑得很慢，但是对身体很好。有时候朋友也和我一起去，他笑着说我跑得最慢。跑完步以后，我觉得身体很舒服。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Giới thiệu một môn thể thao thường làm và lợi ích cho sức khỏe'], { taskGroup: 'bai11-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b11WritingRubric, maxScore: 10 })
];

const b11Speaking: Question[] = [
  speaking('hsk2_b11_speak_01', '你怎么了？是不是肚子疼？', 'Nǐ zěnme le? Shì bú shì dùzi téng?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_02', '你这几天经常头疼，去医院看看吧。', 'Nǐ zhè jǐ tiān jīngcháng tóuténg, qù yīyuàn kànkan ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_03', '现在不能动，一动就疼。', 'Xiànzài bù néng dòng, yí dòng jiù téng.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_04', '现在路上车多，还下着雪，我开慢一点儿。', 'Xiànzài lùshang chē duō, hái xiàzhe xuě, wǒ kāi màn yìdiǎnr.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_05', '你最喜欢吃中国菜。', 'Nǐ zuì xǐhuan chī Zhōngguó cài.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_06', '身体不舒服时更要好好吃饭。', 'Shēntǐ bù shūfu shí gèng yào hǎohāo chīfàn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
  speaking('hsk2_b11_speak_07', '着 → 教室的门______。', 'Zhe → Jiàoshì de mén ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '教室的门开着。', referenceAnswers: ['教室的门开着。'], requiredElements: ['Dùng 着'] }),
  speaking('hsk2_b11_speak_08', '没（有）……着 → 教室的门______。', 'Méi (yǒu)…zhe → Jiàoshì de mén ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '教室的门没开着。', referenceAnswers: ['教室的门没开着。'], requiredElements: ['Dùng 没（有）……着'] }),
  speaking('hsk2_b11_speak_09', '最 → 在我们家，______。', 'Zuì → Zài wǒmen jiā, ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '在我们家，爸爸最高。', referenceAnswers: ['在我们家，爸爸最高。'], requiredElements: ['Dùng 最'] }),
  speaking('hsk2_b11_speak_10', '经常 → 我______。', 'Jīngcháng → Wǒ ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我经常去公园跑步。', referenceAnswers: ['我经常去公园跑步。'], requiredElements: ['Dùng 经常'] }),
  speaking('hsk2_b11_speak_11', '疼 → 我______。', 'Téng → Wǒ ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我头有点儿疼。', referenceAnswers: ['我头有点儿疼。'], requiredElements: ['Dùng 疼'] })
];

const b11AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b11TranslationQuestions: Question[] = [
  translation('hsk2_b11_translate_01', '教室的门开着。', 'Cửa phòng học đang mở.', 'zh_to_vi_text'),
  translation('hsk2_b11_translate_02', '你们班谁说中文说得最好？', 'Trong lớp các bạn, ai nói tiếng Trung giỏi nhất?', 'zh_to_vi_text'),
  translation('hsk2_b11_translate_03', '她穿着白色的裤子。', 'Cô ấy đang mặc quần màu trắng.', 'zh_to_vi_text'),
  translation('hsk2_b11_translate_04', 'Tôi thường xuyên đau đầu.', '我经常头疼。'),
  translation('hsk2_b11_translate_05', 'Cửa không mở.', '门没开着。'),
  translation('hsk2_b11_translate_06', 'Trong nhà tôi, bố cao nhất.', '在我们家，爸爸最高。'),
  translation('hsk2_b11_translate_07', 'Bạn uống thuốc chưa?', '你吃药了吗？', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 吃药', 'Có 了'], rubric: b11AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b11_translate_08', 'Hiệu thuốc ở bên cạnh bệnh viện.', '药店在医院旁边。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 药店', 'Dùng 在医院旁边'], rubric: b11AudioTranslationRubric, maxScore: 10 }),
  translation('hsk2_b11_translate_09', 'Bây giờ tôi đang trên đường, có việc về nhà nói sau nhé.', '我现在在路上，有事回家再说吧。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 现在在路上', 'Dùng 再说吧'], rubric: b11AudioTranslationRubric, maxScore: 10 })
];

const b12WordBank = ['事情', '晴', '阴', '正', '外面', '从小', '地铁', '楼', '站', '小时候', '好'];
const b12Vocab = vocab([
  ['事情', 'shìqing', 'Danh từ', 'việc, chuyện', '你有什么事情吗？'],
  ['晴', 'qíng', 'Tính từ', 'nắng, quang đãng', '今天是晴天。'],
  ['阴', 'yīn', 'Tính từ', 'nhiều mây, âm u', '今天是阴天，没有太阳。'],
  ['正', 'zhèng', 'Phó từ', 'đang, đúng lúc', '外面正下雪呢。'],
  ['外面', 'wàimiàn', 'Danh từ', 'bên ngoài', '外面下雨了。'],
  ['从小', 'cóngxiǎo', 'Phó từ', 'từ nhỏ', '我从小就住在北京。'],
  ['地铁', 'dìtiě', 'Danh từ', 'tàu điện ngầm', '我每天坐地铁上班。'],
  ['楼', 'lóu', 'Danh từ', 'tòa nhà, tầng', '我家住在三楼。'],
  ['站', 'zhàn', 'Danh từ', 'trạm, ga', '楼下有一个地铁站。'],
  ['小时候', 'xiǎoshíhou', 'Danh từ', 'hồi nhỏ', '小时候我住在北京。'],
  ['好', 'hǎo', 'Phó từ (khẩu ngữ)', 'rất, khá; nhấn mạnh mức độ', '这个苹果好甜啊！']
]);

const b12Listening: Question[] = [
  listeningGroup('hsk2_b12_listen_01', 'Bài 1 · 听短文，判断对错', '我从小就住在北京。小时候，我家住在三楼，楼下有一个地铁站。现在我在上海工作，每天坐地铁上班，要坐五站。今天是晴天，我正在地铁站等车。我觉得上海的地铁比北京的快得多。', 'listening_tf', [
    listeningTf('hsk2_b12_listen_01_01', '我从小住在北京。', true),
    listeningTf('hsk2_b12_listen_01_02', '小时候我家住在三楼。', true),
    listeningTf('hsk2_b12_listen_01_03', '我现在在北京工作。', false),
    listeningTf('hsk2_b12_listen_01_04', '我每天坐公交车上班。', false),
    listeningTf('hsk2_b12_listen_01_05', '我觉得上海的地铁比北京的快得多。', true)
  ]),
  listeningGroup('hsk2_b12_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：外面是晴天还是阴天？男：阴天，没有太阳。', 'listening_mc', [listeningMc('hsk2_b12_listen_02_01', '今天天气怎么样？', ['晴天', '阴天', '下雨'], 1)]),
  listeningGroup('hsk2_b12_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：喂，你在做什么呢？女：我正在做饭，一会儿给你打电话。', 'listening_mc', [listeningMc('hsk2_b12_listen_03_01', '女的在做什么？', ['打电话', '做饭', '看电影'], 1)]),
  listeningGroup('hsk2_b12_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：你家离地铁站远不远？男：不远，走路五分钟就到了。', 'listening_mc', [listeningMc('hsk2_b12_listen_04_01', '男的怎么去地铁站？', ['走路', '打车', '坐公交车'], 0)]),
  listeningGroup('hsk2_b12_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你小时候喜欢做什么？女：我从小就喜欢画画。', 'listening_mc', [listeningMc('hsk2_b12_listen_05_01', '女的小时候喜欢什么？', ['唱歌', '画画', '跑步'], 1)]),
  listeningGroup('hsk2_b12_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：这个苹果好甜啊！男：是吗？那我也吃一个。', 'listening_mc', [listeningMc('hsk2_b12_listen_06_01', '苹果怎么样？', ['很大', '很甜', '很贵'], 1)])
];

const b12Reading = reading('hsk2_b12_reading_01', 'II. 阅读 · Đọc hiểu', '王明和李红是同学，他们从小就认识。今天外面是阴天，天气有点儿冷。王明正在楼下等李红，因为他们要一起坐地铁去学校。地铁站不远，他们走路五分钟就到了。李红说坐地铁比坐公交车快得多。', [
  mc('hsk2_b12_read_tf_01', '王明和李红是同学。', ['✓', '✗'], 0),
  mc('hsk2_b12_read_tf_02', '今天是晴天。', ['✓', '✗'], 1),
  mc('hsk2_b12_read_tf_03', '他们坐地铁去学校。', ['✓', '✗'], 0),
  mc('hsk2_b12_read_mc_01', '王明在哪儿等李红？', ['楼下', '学校', '地铁站'], 0),
  mc('hsk2_b12_read_mc_02', '地铁站远不远？', ['很远', '不远', '要坐车'], 1),
  mc('hsk2_b12_read_mc_03', '李红觉得什么比较快？', ['坐地铁', '走路', '坐公交车'], 0),
  ...b12WordBank.map((word, index) => fill(`hsk2_b12_read_fill_${String(index + 1).padStart(2, '0')}`, [
    '你有什么（　）要告诉我吗？',
    '今天天（　）了，我们出去玩吧。',
    '外面很（　），没有太阳。',
    '爸爸（　）在睡觉，你们别说话。',
    '（　）下雨了，我们别出去了。',
    '我（　）就喜欢唱歌，现在也常常唱。',
    '我每天坐（　）上班，又快又方便。',
    '我住在三（　），爸爸在楼下等我。',
    '他在地铁（　）下车，然后给我打电话。',
    '我（　）很喜欢画画。',
    '今天外面（　）冷，我们在家吧。'
  ][index], word, b12WordBank, 'hsk2-b12-read-fill', 'Bài 3 · 选词填空'))
], b12WordBank);

const b12Arrange: Question[] = [
  arrange('hsk2_b12_arrange_01', ['比', '冷多了', '这里', '北京'], '这里比北京冷多了。', '北京比这里冷多了。'),
  arrange('hsk2_b12_arrange_02', ['睡得', '妈妈', '晚', '比', '我'], '妈妈比我睡得晚。', '我比妈妈睡得晚。'),
  arrange('hsk2_b12_arrange_03', ['比', '跑得', '快', '你', '我'], '你跑得比我快。', '我跑得比你快。'),
  arrange('hsk2_b12_arrange_04', ['小红', '汉字', '写得', '比', '小明', '好'], '小红汉字写得比小明好。', '小明汉字写得比小红好。'),
  arrange('hsk2_b12_arrange_05', ['下雪', '正', '外面', '呢'], '外面正下雪呢。')
];

const b12WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b12EssayQuestions: Question[] = [
  errorCorrection('hsk2_b12_error_01', '我比他很快。', '我比他快得多。', { taskGroup: 'bai12-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['我比他快。', '我比他快多了。'], explanation: 'Sau 比 không dùng 很; muốn nhấn mạnh thì dùng 多了 / 得多.' }),
  errorCorrection('hsk2_b12_error_02', '我比他跑步快。', '我跑得比他快。', { taskGroup: 'bai12-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'So sánh cách thực hiện hành động dùng V + 得 + tính từ.' }),
  errorCorrection('hsk2_b12_error_03', '我跑步得比他快。', '我跑步跑得比他快。', { taskGroup: 'bai12-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: '跑步 là động từ ly hợp, cần lặp lại 跑 trước 得.' }),
  errorCorrection('hsk2_b12_error_04', '他正在睡觉了。', '他正在睡觉。', { taskGroup: 'bai12-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['他正在睡觉呢。'], explanation: '正在 biểu thị hành động đang diễn ra, không dùng 了.' }),
  errorCorrection('hsk2_b12_error_05', '我小时候喜欢很画画。', '我小时候很喜欢画画。', { taskGroup: 'bai12-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Phó từ mức độ đứng trước động từ tâm lý: 很喜欢.' }),
  essay('hsk2_b12_writing', '比一比你小时候住的地方和你现在住的地方。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 小时候、从小、比……多了（得多）、地铁、楼、外面、正……呢、晴（阴）。', '我小时候住在河内，现在住在北京。河内比北京热多了，但是北京的冬天比河内冷得多。我每天坐地铁上班，地铁站离我家不远。今天外面是阴天，我正在楼下等朋友。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'So sánh nơi ở hồi nhỏ và nơi ở hiện nay'], { taskGroup: 'bai12-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b12WritingRubric, maxScore: 10 })
];

const b12ReadingAloudNote = 'Chấm theo thanh điệu và ngữ điệu. 事情 đọc shìqing (情 đọc nhẹ). 我这里 đọc wó zhèlǐ. 比北京 đọc bí Běijīng (hai thanh 3 liền nhau, 比 biến thành thanh 2). 比我快 đọc bí wǒ kuài. 能一起 đọc néng yìqǐ (一 đọc thanh 4 trước thanh 3). 一会儿 đọc yíhuìr (一 biến thành thanh 2 trước thanh 4). 下着雪 đọc xiàzhe xuě, 着 đọc nhẹ. Câu hỏi 吗 lên giọng cuối câu.';
const b12ReadAloud = (id: string, prompt: string, pinyin: string) => speaking(id, prompt, pinyin, { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: b12ReadingAloudNote });
const b12Speaking: Question[] = [
  b12ReadAloud('hsk2_b12_speak_01', '喂，家月，是你吗？有什么事情吗？', 'Wéi, Jiāyuè, shì nǐ ma? Yǒu shénme shìqing ma?'),
  b12ReadAloud('hsk2_b12_speak_02', '我这里比北京冷多了，外边还正下着雪呢！', 'Wǒ zhèlǐ bǐ Běijīng lěng duō le, wàibian hái zhèng xiàzhe xuě ne!'),
  b12ReadAloud('hsk2_b12_speak_03', '今天不大，昨天比今天下得大。', 'Jīntiān bú dà, zuótiān bǐ jīntiān xià de dà.'),
  b12ReadAloud('hsk2_b12_speak_04', '你跑步跑得比我快，我们能一起跑吗？', 'Nǐ pǎobù pǎo de bǐ wǒ kuài, wǒmen néng yìqǐ pǎo ma?'),
  b12ReadAloud('hsk2_b12_speak_05', '我从小就经常跟爸爸一起跑步。', 'Wǒ cóngxiǎo jiù jīngcháng gēn bàba yìqǐ pǎobù.'),
  b12ReadAloud('hsk2_b12_speak_06', '我现在坐地铁去找你，一会儿楼下见。', 'Wǒ xiànzài zuò dìtiě qù zhǎo nǐ, yíhuìr lóu xià jiàn.'),
  speaking('hsk2_b12_speak_07', '比……多了 → 这里比北京______。', 'Bǐ…duō le → Zhèlǐ bǐ Běijīng ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '这里比北京冷多了。', referenceAnswers: ['这里比北京冷多了。'], requiredElements: ['Dùng 比……多了'] }),
  speaking('hsk2_b12_speak_08', 'V得比 → 他跑得______。', 'V de bǐ → Tā pǎo de ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '他跑得比我快。', referenceAnswers: ['他跑得比我快。'], requiredElements: ['Dùng V得比'] }),
  speaking('hsk2_b12_speak_09', '正 → 外面______。', 'Zhèng → Wàimiàn ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '外面正下雪呢。', referenceAnswers: ['外面正下雪呢。'], requiredElements: ['Dùng 正……呢'] }),
  speaking('hsk2_b12_speak_10', '从小 → 我______。', 'Cóngxiǎo → Wǒ ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我从小就喜欢画画。', referenceAnswers: ['我从小就喜欢画画。'], requiredElements: ['Dùng 从小'] }),
  speaking('hsk2_b12_speak_11', '地铁 → 我每天______。', 'Dìtiě → Wǒ měitiān ______.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我每天坐地铁上班。', referenceAnswers: ['我每天坐地铁上班。'], requiredElements: ['Dùng 地铁'] })
];

const b12AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b12TranslationNote = 'Chấp nhận các cách dịch khác nếu đúng nghĩa và đúng ngữ pháp. 比 + tính từ + 多了 / 得多 dịch là “… hơn … rất nhiều”; sau 比 không dùng 很. V + 得 + tính từ với 比; động từ ly hợp phải lặp động từ: 跑步跑得. 正……呢 là “đang… đây”, không dùng 了. 从小 là “từ nhỏ”, 小时候 là “hồi nhỏ”.';
const b12TranslationQuestions: Question[] = [
  translation('hsk2_b12_translate_01', '这里比北京冷多了。', 'Chỗ này lạnh hơn Bắc Kinh rất nhiều.', 'zh_to_vi_text', { explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_02', '昨天比今天下得大。', 'Hôm qua tuyết rơi to hơn hôm nay.', 'zh_to_vi_text', { explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_03', '我从小就经常跟爸爸一起跑步。', 'Từ nhỏ tôi đã thường chạy bộ cùng bố.', 'zh_to_vi_text', { explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_04', 'Mẹ ngủ muộn hơn tôi.', '妈妈比我睡得晚。', 'vi_to_zh_text', { explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_05', 'Đi máy bay nhanh hơn đi tàu hỏa rất nhiều.', '坐飞机比坐火车快得多。', 'vi_to_zh_text', { explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_06', 'Bên ngoài đang mưa.', '外面正下着雨呢。', 'vi_to_zh_text', { referenceAnswers: ['外面正下着雨呢。', '外面正下雨呢。'], explanation: b12TranslationNote }),
  translation('hsk2_b12_translate_07', 'Bạn chạy nhanh hơn tôi.', '你跑步跑得比我快。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 比', 'Dùng V得 + tính từ'], rubric: b12AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b12TranslationNote}` }),
  translation('hsk2_b12_translate_08', 'Anh ấy đá bóng giỏi hơn tôi.', '他踢足球比我踢得好。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Có 比', 'Dùng 踢得好'], rubric: b12AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b12TranslationNote}` }),
  translation('hsk2_b12_translate_09', 'Hồi nhỏ tôi sống ở Bắc Kinh.', '我小时候住在北京。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['Dùng 小时候', 'Dùng 住在北京'], rubric: b12AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b12TranslationNote}` })
];

const b13WordBank = ['新年', '教', '花', '希望', '上面', '洗手间', '里面', '笔', '可能', '上网', '那样', '告诉', '班'];
const b13Vocab = vocab([
  ['新年', 'xīnnián', 'Danh từ', 'năm mới', '新年快到了。'],
  ['教', 'jiāo', 'Động từ', 'dạy (trong 教室 đọc jiào)', '老师教我们写汉字。'],
  ['花', 'huā', 'Danh từ', 'hoa', '姐姐从小就喜欢花。'],
  ['希望', 'xīwàng', 'Động từ', 'hy vọng, mong', '我希望明天是个晴天。'],
  ['上面', 'shàngmiàn', 'Danh từ', 'bên trên, phía trên', '桌子上面有一本书。'],
  ['洗手间', 'xǐshǒujiān', 'Danh từ', 'nhà vệ sinh', '请问，洗手间在哪儿？'],
  ['里面', 'lǐmiàn', 'Danh từ', 'bên trong', '洗手间在里面。'],
  ['笔', 'bǐ', 'Lượng từ', 'nét bút; nét chữ', '这个字有五笔。'],
  ['可能', 'kěnéng', 'Động từ / phó từ tình thái', 'có thể, có lẽ', '这本书可能是小王的。'],
  ['上网', 'shàngwǎng', 'Động từ', 'lên mạng', '我每天上网学中文。'],
  ['那样', 'nàyàng', 'Đại từ', 'như thế, như vậy', '你不要那样说。'],
  ['告诉', 'gàosu', 'Động từ', 'nói cho biết, bảo', '老师告诉我们明天考试。'],
  ['班', 'bān', 'Danh từ', 'lớp', '我们班有二十个学生。']
]);

const b13Listening: Question[] = [
  listeningGroup('hsk2_b13_listen_01', 'Bài 1 · 听短文，判断对错', '我叫小林，我在大学教中文。我们班有二十个学生，他们都是外国人。新年快到了，学生们希望大家一起吃饭、一起唱歌。我告诉他们：“好啊！”大家都很高兴，每个人都准备了礼物。', 'listening_tf', [
    listeningTf('hsk2_b13_listen_01_01', '小林在大学教中文。', true),
    listeningTf('hsk2_b13_listen_01_02', '小林的班有十个学生。', false),
    listeningTf('hsk2_b13_listen_01_03', '学生们都是中国人。', false),
    listeningTf('hsk2_b13_listen_01_04', '学生们希望新年一起吃饭、唱歌。', true),
    listeningTf('hsk2_b13_listen_01_05', '小林说不可以。', false)
  ]),
  listeningGroup('hsk2_b13_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：请问，洗手间在哪儿？男：在里面，往左走就到了。', 'listening_mc', [listeningMc('hsk2_b13_listen_02_01', '洗手间在哪儿？', ['外面', '里面', '楼下'], 1)]),
  listeningGroup('hsk2_b13_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：桌子上面有一本书，是你的吗？女：不是，可能是小王的。', 'listening_mc', [listeningMc('hsk2_b13_listen_03_01', '书可能是谁的？', ['女的', '小王', '男的'], 1)]),
  listeningGroup('hsk2_b13_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：你知道明天考试的时间吗？男：老师告诉我了，下午三点。', 'listening_mc', [listeningMc('hsk2_b13_listen_04_01', '考试在什么时候？', ['上午', '下午三点', '晚上'], 1)]),
  listeningGroup('hsk2_b13_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你每天上网做什么？女：我上网学中文，也看电影。', 'listening_mc', [listeningMc('hsk2_b13_listen_05_01', '女的上网学什么？', ['中文', '画画', '游泳'], 0)]),
  listeningGroup('hsk2_b13_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：你们班有多少个学生？男：我们班有十五个，他们班比我们班多五个。', 'listening_mc', [listeningMc('hsk2_b13_listen_06_01', '他们班有多少个学生？', ['十个', '十五个', '二十个'], 2)])
];

const b13Reading = reading('hsk2_b13_reading_01', 'II. 阅读 · Đọc hiểu', '我的姐姐比我大三岁，她从小就喜欢花。小时候，她常常和奶奶一起去公园看花。现在她在一家花店工作，每天都和花在一起。她希望以后可以有自己的花店。昨天她告诉我，她已经开始准备了。', [
  mc('hsk2_b13_read_tf_01', '姐姐比我大三岁。', ['✓', '✗'], 0),
  mc('hsk2_b13_read_tf_02', '姐姐小时候不喜欢花。', ['✓', '✗'], 1),
  mc('hsk2_b13_read_tf_03', '姐姐想有自己的花店。', ['✓', '✗'], 0),
  mc('hsk2_b13_read_mc_01', '姐姐现在在哪儿工作？', ['花店', '商场', '学校'], 0),
  mc('hsk2_b13_read_mc_02', '小时候姐姐常常和谁去公园？', ['妈妈', '奶奶', '爸爸'], 1),
  mc('hsk2_b13_read_mc_03', '昨天姐姐告诉我什么？', ['她要回国', '她已经开始准备了', '她要考试'], 1),
  ...b13WordBank.map((word, index) => fill(`hsk2_b13_read_fill_${String(index + 1).padStart(2, '0')}`, [
    '（　）快到了，我们要一起吃饭。',
    '老师（　）我们写汉字。',
    '花园里的（　）真漂亮。',
    '我（　）明天是个晴天。',
    '桌子（　）有一些苹果。',
    '请问，（　）在哪儿？',
    '书包（　）有一本书，没有笔。',
    '这个字有五（　），你写对了吗？',
    '现在十一点多了，他（　）在睡觉。',
    '我晚上（　）看中文课。',
    '你不要（　）说，大家会不高兴。',
    '老师（　）我们明天要考试。',
    '我们（　）有二十个学生。'
  ][index], word, b13WordBank, 'hsk2-b13-read-fill', 'Bài 3 · 选词填空'))
], b13WordBank);

const b13Arrange: Question[] = [
  arrange('hsk2_b13_arrange_01', ['昨天', '多了', '十个', '今天的词', '比'], '今天的词比昨天多了十个。'),
  arrange('hsk2_b13_arrange_02', ['比', '大', '三岁', '我', '姐姐'], '姐姐比我大三岁。', '我比姐姐大三岁。'),
  arrange('hsk2_b13_arrange_03', ['送给', '一本书', '他', '我'], '他送给我一本书。', '我送给他一本书。'),
  arrange('hsk2_b13_arrange_04', ['一点儿', '贵', '这个本子', '那个', '比'], '这个本子比那个贵一点儿。', '那个比这个本子贵一点儿。'),
  arrange('hsk2_b13_arrange_05', ['一本书', '有', '里面', '书包'], '书包里面有一本书。')
];

const b13WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b13ErrorGroup = { taskGroup: 'bai13-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' };
const b13EssayQuestions: Question[] = [
  errorCorrection('hsk2_b13_error_01', '我送花她。', '我送给她花。', { ...b13ErrorGroup, explanation: 'Mẫu hai tân ngữ: người nhận đứng trước vật được tặng.' }),
  errorCorrection('hsk2_b13_error_02', '姐姐三岁大我。', '姐姐比我大三岁。', { ...b13ErrorGroup, explanation: 'Cụm số lượng đứng sau tính từ: 比我大三岁.' }),
  errorCorrection('hsk2_b13_error_03', '这个本子比那个很贵一点儿。', '这个本子比那个贵一点儿。', { ...b13ErrorGroup, explanation: 'Không dùng 很 cùng với 比……一点儿/一些.' }),
  errorCorrection('hsk2_b13_error_04', '他卖我一本书给。', '他卖给我一本书。', { ...b13ErrorGroup, explanation: '给 đứng ngay sau động từ, sau đó là người nhận rồi đến vật.' }),
  errorCorrection('hsk2_b13_error_05', '我比他高一点儿很。', '我比他高一点儿。', { ...b13ErrorGroup, explanation: 'Không thêm 很 trong câu 比……一点儿.' }),
  essay('hsk2_b13_writing', '写一写你想送给朋友（或老师）的新年礼物。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 新年、送给、希望、花、告诉、比……一点儿、上网、可能、里面。', '新年快到了，我想送给老师一个礼物。我上网看了看，花比本子好看一点儿，所以我买了一朵红色的花。我希望老师喜欢，也希望她新年快乐。我告诉朋友，他可能也想送花。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nói về món quà năm mới muốn tặng'], { taskGroup: 'bai13-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b13WritingRubric, maxScore: 10 })
];

const b13ReadingAloudNote = 'Chấm theo thanh điệu và ngữ điệu. 新年 đọc xīnnián. 教 đọc jiāo khi là động từ “dạy”. 送给她 đọc sòng gěi tā. 王老师 đọc Wáng lǎoshī (老 là thanh 3 đứng trước thanh 1 nên đọc nửa thanh 3). 比我们 đọc bǐ wǒmen. 一点儿 đọc yìdiǎnr (一 thanh 4 trước thanh 3). 不可能 đọc bù kěnéng (不 giữ thanh 4 trước thanh 3). Câu có 吧 ở cuối đề nghị thì giọng nhẹ.';
const b13JiaoNote = 'Động từ “dạy” luôn đọc jiāo; trong từ ghép như 教室 đọc jiào. Đáp án: 1. 教（jiāo） 2. 教（jiāo）书 3. 教室（jiàoshì） 4. 教（jiāo） 5. 教室（jiàoshì）里教（jiāo）我们.';
const b13ReadAloud = (id: string, prompt: string, pinyin: string) => speaking(id, prompt, pinyin, { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: b13ReadingAloudNote });
const b13Guided = (id: string, prompt: string, pinyin: string, answer: string, element: string) => speaking(id, prompt, pinyin, { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: answer, referenceAnswers: [answer], requiredElements: [element] });
const b13Jiao = (id: string, prompt: string, pinyin: string) => speaking(id, prompt, pinyin, { taskGroup: 'jiao_reading', taskGroupTitle: 'IV. 口语 · Bài 3: 朗读“教”的两种读音', requiredElements: ['Đọc đúng jiāo / jiào', 'Phát âm và thanh điệu rõ'], explanation: b13JiaoNote });
const b13Speaking: Question[] = [
  b13ReadAloud('hsk2_b13_speak_01', '时间过得真快啊！新年就要到了。', 'Shíjiān guò de zhēn kuài a! Xīnnián jiù yào dào le.'),
  b13ReadAloud('hsk2_b13_speak_02', '她教得很好，因为她，我们都非常爱上中文课。', 'Tā jiāo de hěn hǎo, yīnwèi tā, wǒmen dōu fēicháng ài shàng Zhōngwén kè.'),
  b13ReadAloud('hsk2_b13_speak_03', '王老师喜欢花，就送给她花吧。', 'Wáng lǎoshī xǐhuan huā, jiù sòng gěi tā huā ba.'),
  b13ReadAloud('hsk2_b13_speak_04', '今天的词比昨天多了十个。', 'Jīntiān de cí bǐ zuótiān duō le shí gè.'),
  b13ReadAloud('hsk2_b13_speak_05', '比我们一起买的那个本子贵一点儿。', 'Bǐ wǒmen yìqǐ mǎi de nà ge běnzi guì yìdiǎnr.'),
  b13ReadAloud('hsk2_b13_speak_06', '这么漂亮的本子，不可能贵一点儿吧？', 'Zhème piàoliang de běnzi, bù kěnéng guì yìdiǎnr ba?'),
  b13Guided('hsk2_b13_speak_07', '教 → 老师______。', 'Jiāo → Lǎoshī ______.', '老师教我们汉语。', 'Dùng 教'),
  b13Guided('hsk2_b13_speak_08', '送给 → 我想______。', 'Sòng gěi → Wǒ xiǎng ______.', '我想送给朋友一个礼物。', 'Dùng 送给 + người + vật'),
  b13Guided('hsk2_b13_speak_09', '比……一点儿 → 这个本子______。', 'Bǐ…yìdiǎnr → Zhège běnzi ______.', '这个本子比那个贵一点儿。', 'Dùng 比……一点儿'),
  b13Guided('hsk2_b13_speak_10', '比……数量 → 姐姐______。', 'Bǐ…shùliàng → Jiějie ______.', '姐姐比我大三岁。', 'Dùng 比 + tính từ + số lượng'),
  b13Guided('hsk2_b13_speak_11', '告诉 → 老师______。', 'Gàosu → Lǎoshī ______.', '老师告诉我们明天考试。', 'Dùng 告诉'),
  b13Jiao('hsk2_b13_speak_12', '老师教我们写汉字。', 'Lǎoshī jiāo wǒmen xiě Hànzì.'),
  b13Jiao('hsk2_b13_speak_13', '他在大学教书。', 'Tā zài dàxué jiāoshū.'),
  b13Jiao('hsk2_b13_speak_14', '教室里有很多学生。', 'Jiàoshì lǐ yǒu hěn duō xuésheng.'),
  b13Jiao('hsk2_b13_speak_15', '我想教朋友说中文。', 'Wǒ xiǎng jiāo péngyou shuō Zhōngwén.'),
  b13Jiao('hsk2_b13_speak_16', '老师在教室里教我们。', 'Lǎoshī zài jiàoshì lǐ jiāo wǒmen.')
];

const b13AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b13TranslationNote = 'Chấp nhận các cách dịch khác nếu đúng nghĩa và đúng ngữ pháp. Câu hai tân ngữ: V + người + vật (送给, 拿给, 卖给 + người + vật). 比 + tính từ + cụm số lượng nêu chênh lệch cụ thể (大三岁, 多了十个); 比 + tính từ + 一点儿/一些 nêu chênh lệch nhỏ, không dùng 很. 告诉 là “nói cho biết, bảo”; 希望 là “hy vọng, mong”.';
const b13AudioOptions = (requiredElements: string[]) => ({ taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements, rubric: b13AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b13TranslationNote}` });
const b13TranslationQuestions: Question[] = [
  translation('hsk2_b13_translate_01', '今天的词比昨天多了十个。', 'Từ hôm nay nhiều hơn hôm qua 10 từ.', 'zh_to_vi_text', { explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_02', '王老师喜欢花，就送给她花吧。', 'Cô Vương thích hoa, vậy hãy tặng hoa cho cô ấy đi.', 'zh_to_vi_text', { explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_03', '比我们一起买的那个本子贵一点儿。', 'Đắt hơn quyển vở chúng ta cùng mua một chút.', 'zh_to_vi_text', { explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_04', 'Chị hơn tôi ba tuổi.', '姐姐比我大三岁。', 'vi_to_zh_text', { explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_05', 'Anh ấy bán cho tôi một quyển sách.', '他卖给我一本书。', 'vi_to_zh_text', { explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_06', 'Phòng học kia rộng hơn phòng này một chút.', '那间教室比这间大一些。', 'vi_to_zh_text', { referenceAnswers: ['那间教室比这间大一些。', '那间教室比这间大一点儿。'], explanation: b13TranslationNote }),
  translation('hsk2_b13_translate_07', 'Tôi hy vọng ngày mai trời nắng.', '我希望明天是个晴天。', 'vi_to_zh_audio', b13AudioOptions(['Dùng 希望', 'Dùng 晴天'])),
  translation('hsk2_b13_translate_08', 'Cô ấy đưa cho tôi một cốc nước.', '她拿给我一杯水。', 'vi_to_zh_audio', b13AudioOptions(['Dùng V + 给 + người + vật'])),
  translation('hsk2_b13_translate_09', 'Giáo viên nói với chúng tôi ngày mai phải thi.', '老师告诉我们明天要考试。', 'vi_to_zh_audio', b13AudioOptions(['Dùng 告诉', 'Dùng 要考试']))
];

const b14WordBank = ['站', '包', '过年', '没意思', '位', '前面', '房子', '小孩儿', '女孩儿', '姓', '眼睛', '跳舞'];
const b14Vocab = vocab([
  ['站', 'zhàn', 'Động từ', 'đứng', '楼下站着一个人。'],
  ['包', 'bāo', 'Danh từ / động từ / lượng từ', 'túi; gói; bọc', '妈妈和奶奶一起包饺子。'],
  ['过年', 'guònián', 'Động từ', 'ăn Tết, đón năm mới', '过年的时候，我们回奶奶家。'],
  ['没意思', 'méi yìsi', 'Tính từ', 'không thú vị, buồn, chán', '一个人过年多没意思啊！'],
  ['位', 'wèi', 'Lượng từ', 'vị, người (lịch sự)', '这位是我的中文老师。'],
  ['前面', 'qiánmiàn', 'Danh từ', 'phía trước', '房子前面有一个小花园。'],
  ['房子', 'fángzi', 'Danh từ', 'căn nhà', '奶奶家的房子很大。'],
  ['小孩儿', 'xiǎoháir', 'Danh từ', 'trẻ con, đứa trẻ', '这个小孩儿很爱笑。'],
  ['女孩儿', 'nǚháir', 'Danh từ', 'bé gái, cô bé', '小雨是一个爱笑的女孩儿。'],
  ['姓', 'xìng', 'Động từ', 'mang họ', '我姓李。'],
  ['眼睛', 'yǎnjing', 'Danh từ', 'mắt', '小雨有一双大眼睛。'],
  ['跳舞', 'tiàowǔ', 'Động từ ly hợp', 'khiêu vũ, nhảy', '我从小就学跳舞。']
]);

const b14Listening: Question[] = [
  listeningGroup('hsk2_b14_listen_01', 'Bài 1 · 听短文，判断对错', '我家有四口人，爸爸、妈妈、姐姐和我。过年的时候，我们一家人都回奶奶家。奶奶家的房子很大，前面有一个小花园。妈妈和奶奶一起包饺子，姐姐在旁边跳舞，我站在门口等客人。大家都觉得过年多高兴啊！', 'listening_tf', [
    listeningTf('hsk2_b14_listen_01_01', '我家有四口人。', true),
    listeningTf('hsk2_b14_listen_01_02', '过年的时候，我们回爷爷家。', false),
    listeningTf('hsk2_b14_listen_01_03', '奶奶家的房子很小。', false),
    listeningTf('hsk2_b14_listen_01_04', '妈妈和奶奶一起包饺子。', true),
    listeningTf('hsk2_b14_listen_01_05', '姐姐在门口跳舞。', false)
  ]),
  listeningGroup('hsk2_b14_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：你姓什么？男：我姓李，你呢？女：我姓王。', 'listening_mc', [listeningMc('hsk2_b14_listen_02_01', '女的姓什么？', ['李', '王', '陈'], 1)]),
  listeningGroup('hsk2_b14_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：楼下站着一个人，你认识吗？女：那是我的朋友。', 'listening_mc', [listeningMc('hsk2_b14_listen_03_01', '楼下有什么？', ['站着一个人', '坐着一个人', '没有人'], 0)]),
  listeningGroup('hsk2_b14_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：这位是谁？男：这是我的中文老师。', 'listening_mc', [listeningMc('hsk2_b14_listen_04_01', '男的介绍了谁？', ['朋友', '老师', '妈妈'], 1)]),
  listeningGroup('hsk2_b14_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你喜欢跳舞吗？女：很喜欢，我从小就学跳舞。', 'listening_mc', [listeningMc('hsk2_b14_listen_05_01', '女的喜欢做什么？', ['唱歌', '跳舞', '画画'], 1)]),
  listeningGroup('hsk2_b14_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：一个人过年多没意思啊！男：那你来我家吧。', 'listening_mc', [listeningMc('hsk2_b14_listen_06_01', '女的觉得怎么样？', ['很有意思', '没意思', '很高兴'], 1)])
];

const b14Reading = reading('hsk2_b14_reading_01', 'II. 阅读 · Đọc hiểu', '小雨有一双大眼睛，她今年七岁，是一个爱笑的女孩儿。她家的房子在学校前面，走路三分钟就到了。每天早上，她拿着书包走进教室，一看见老师就笑着说“早”。下课以后，她常常和同学一起跳舞。', [
  mc('hsk2_b14_read_tf_01', '小雨是一个女孩儿。', ['✓', '✗'], 0),
  mc('hsk2_b14_read_tf_02', '小雨家离学校很远。', ['✓', '✗'], 1),
  mc('hsk2_b14_read_tf_03', '下课以后小雨常常和同学跳舞。', ['✓', '✗'], 0),
  mc('hsk2_b14_read_mc_01', '小雨今年几岁？', ['六岁', '七岁', '八岁'], 1),
  mc('hsk2_b14_read_mc_02', '小雨怎么去学校？', ['走路', '坐地铁', '打车'], 0),
  mc('hsk2_b14_read_mc_03', '小雨看见老师说什么？', ['早', '再见', '谢谢'], 0),
  ...b14WordBank.map((word, index) => fill(`hsk2_b14_read_fill_${String(index + 1).padStart(2, '0')}`, [
    '别（　）着了，快请坐。',
    '妈妈在家（　）饺子，大家一起吃。',
    '（　）的时候，我要回老家。',
    '一个人在家看电视真（　）。',
    '这（　）是我们的中文老师。',
    '超市在学校（　），走路五分钟就到。',
    '我家的（　）很漂亮，里面还有一个小花园。',
    '公园里有很多（　），他们都在玩。',
    '那个（　）是我女儿，她在一班。',
    '你（　）什么？我姓李。',
    '她的（　）很漂亮，但是今天有点儿累。',
    '我很喜欢（　），每个星期都去学。'
  ][index], word, b14WordBank, 'hsk2-b14-read-fill', 'Bài 3 · 选词填空'))
], b14WordBank);

const b14Arrange: Question[] = [
  arrange('hsk2_b14_arrange_01', ['一个人', '楼下', '站着'], '楼下站着一个人。'),
  arrange('hsk2_b14_arrange_02', ['手里', '一杯咖啡', '拿着', '爸爸'], '爸爸手里拿着一杯咖啡。'),
  arrange('hsk2_b14_arrange_03', ['站', '了', '起来', '他', '就'], '他就站起来了。'),
  arrange('hsk2_b14_arrange_04', ['啊', '你', '多', '一个人', '没意思'], '你一个人多没意思啊！'),
  arrange('hsk2_b14_arrange_05', ['我的', '是', '这位', '老师'], '这位是我的老师。')
];

const b14WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b14ErrorGroup = { taskGroup: 'bai14-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' };
const b14EssayQuestions: Question[] = [
  errorCorrection('hsk2_b14_error_01', '楼下一个人站着。', '楼下站着一个人。', { ...b14ErrorGroup, explanation: 'Câu tồn hiện: nơi chốn + động từ + 着 + người/vật.' }),
  errorCorrection('hsk2_b14_error_02', '我走上去楼。', '我走上楼去。', { ...b14ErrorGroup, explanation: 'Tân ngữ chỉ nơi chốn đứng giữa 上 và 去.' }),
  errorCorrection('hsk2_b14_error_03', '很好看啊！', '多好看啊！', { ...b14ErrorGroup, explanation: 'Câu cảm thán dùng mẫu 多 + tính từ + 啊.' }),
  errorCorrection('hsk2_b14_error_04', '我家有四个人口。', '我家有四口人。', { ...b14ErrorGroup, explanation: '口 đứng trước 人 để đếm thành viên gia đình.' }),
  errorCorrection('hsk2_b14_error_05', '她站着起来了。', '她站起来了。', { ...b14ErrorGroup, explanation: '站起来 là bổ ngữ xu hướng, không thêm 着.' }),
  essay('hsk2_b14_writing', '写一写你过年（或过节）时的一件事。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 过年、包、房子、前面、站、位、多……啊、没意思、跳舞。', '过年的时候，我们一家四口都回老家。老家的房子前面有一个大花园。奶奶和妈妈一起包饺子，爸爸站在门口等客人。我觉得一个人过年多没意思啊，和家人在一起多好啊！', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Kể một việc khi ăn Tết hoặc ngày lễ'], { taskGroup: 'bai14-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b14WritingRubric, maxScore: 10 })
];

const b14ReadingAloudNote = 'Chấm theo thanh điệu và ngữ điệu. 站着 đọc zhànzhe (着 đọc nhẹ). 你一个人 đọc nǐ yí gè rén (一 biến thành thanh 2 trước thanh 4). 没意思啊 đọc méi yìsi a (啊 sau 思 thường đọc như za, giọng cảm thán tự nhiên). 房子 đọc fángzi (子 đọc nhẹ). 上来 đọc shànglái. 位 đọc wèi.';
const b14ReadAloud = (id: string, prompt: string, pinyin: string) => speaking(id, prompt, pinyin, { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: b14ReadingAloudNote });
const b14Guided = (id: string, prompt: string, pinyin: string, answer: string, element: string) => speaking(id, prompt, pinyin, { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: answer, referenceAnswers: [answer], requiredElements: [element] });
const b14Speaking: Question[] = [
  b14ReadAloud('hsk2_b14_speak_01', '王老师，你家楼下站着一个人。', 'Wáng lǎoshī, nǐ jiā lóu xià zhànzhe yí gè rén.'),
  b14ReadAloud('hsk2_b14_speak_02', '那个人穿着黑色的裤子，手里还拿着一个黑色的包。', 'Nà ge rén chuānzhe hēisè de kùzi, shǒu lǐ hái názhe yí gè hēisè de bāo.'),
  b14ReadAloud('hsk2_b14_speak_03', '就要过年了，你一个人在这儿多没意思啊！', 'Jiù yào guònián le, nǐ yí gè rén zài zhèr duō méi yìsi a!'),
  b14ReadAloud('hsk2_b14_speak_04', '这位是李文，他在我们学校学医。', 'Zhè wèi shì Lǐ Wén, tā zài wǒmen xuéxiào xué yī.'),
  b14ReadAloud('hsk2_b14_speak_05', '你住的房子真不错，很大，离学校也不远。', 'Nǐ zhù de fángzi zhēn búcuò, hěn dà, lí xuéxiào yě bù yuǎn.'),
  b14ReadAloud('hsk2_b14_speak_06', '她经常上来找我玩。', 'Tā jīngcháng shànglái zhǎo wǒ wán.'),
  b14Guided('hsk2_b14_speak_07', '着（存现句） → 楼下______。', 'Zhe (cúnxiàn jù) → Lóu xià ______.', '楼下站着一个人。', 'Dùng câu tồn hiện với 着'),
  b14Guided('hsk2_b14_speak_08', '复合趋向补语 → 一听到老师叫他，他就______。', 'Fùhé qūxiàng bǔyǔ → Yì tīngdào lǎoshī jiào tā, tā jiù ______.', '一听到老师叫他，他就站起来了。', 'Dùng bổ ngữ xu hướng kép'),
  b14Guided('hsk2_b14_speak_09', '多……啊 → 一个人在家______！', 'Duō…a → Yí gè rén zài jiā ______!', '一个人在家多没意思啊！', 'Dùng 多……啊'),
  b14Guided('hsk2_b14_speak_10', '位 → 这______。', 'Wèi → Zhè ______.', '这位是我的老师。', 'Dùng 位'),
  b14Guided('hsk2_b14_speak_11', '姓 → 你______？', 'Xìng → Nǐ ______?', '你姓什么？', 'Dùng 姓')
];

const b14AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b14TranslationNote = 'Chấp nhận các cách dịch khác nếu đúng nghĩa và đúng ngữ pháp. Câu tồn hiện: nơi chốn + V + 着 + người/vật (楼下站着一个人), không đặt người/vật trước động từ. 多 + tính từ + 啊 dịch là “… biết bao”. Lượng từ chỉ người: 个 phổ biến, 口 cho thành viên gia đình, 名 cho chức vụ/nghề nghiệp, 位 lịch sự. 站 là “đứng” (động từ) hoặc “ga, trạm” (danh từ) tùy câu.';
const b14AudioOptions = (requiredElements: string[]) => ({ taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements, rubric: b14AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b14TranslationNote}` });
const b14TranslationQuestions: Question[] = [
  translation('hsk2_b14_translate_01', '你家楼下站着一个人。', 'Dưới nhà bạn có một người đang đứng.', 'zh_to_vi_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_02', '一个人在这儿多没意思啊！', 'Một mình ở đây buồn biết bao!', 'zh_to_vi_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_03', '这位是我的中文老师。', 'Vị này là giáo viên tiếng Trung của tôi.', 'zh_to_vi_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_04', 'Trong tay bố đang cầm một cốc cà phê.', '爸爸手里拿着一杯咖啡。', 'vi_to_zh_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_05', 'Bạn họ gì?', '你姓什么？', 'vi_to_zh_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_06', 'Nhà tôi có bốn người.', '我家有四口人。', 'vi_to_zh_text', { explanation: b14TranslationNote }),
  translation('hsk2_b14_translate_07', 'Vừa nghe giáo viên gọi tên, cậu ấy liền đứng dậy.', '一听到老师叫他的名字，他就站起来了。', 'vi_to_zh_audio', b14AudioOptions(['Dùng 一……就……', 'Dùng 站起来'])),
  translation('hsk2_b14_translate_08', 'Trong phòng học kia có khá nhiều học sinh đang ngồi.', '那间教室里坐着不少学生。', 'vi_to_zh_audio', b14AudioOptions(['Dùng câu tồn hiện với 坐着'])),
  translation('hsk2_b14_translate_09', 'Đẹp biết bao! Mua cái này đi.', '多好看啊！买这件吧。', 'vi_to_zh_audio', b14AudioOptions(['Dùng 多……啊']))
];

const b15WordBank = ['姓名', '出国', '出门', '门票', '高中', '路', '颐和园', '飞', '机场', '机票', '好像', '鸟'];
const b15Vocab = vocab([
  ['姓名', 'xìngmíng', 'Danh từ', 'họ tên', '请大家写上姓名。'],
  ['出国', 'chūguó', 'Động từ', 'ra nước ngoài', '我有两年没出国了。'],
  ['出门', 'chūmén', 'Động từ', 'ra khỏi nhà, ra ngoài', '我早上七点出门。'],
  ['门票', 'ménpiào', 'Danh từ', 'vé vào cửa', '这是两张公园门票。'],
  ['高中', 'gāozhōng', 'Danh từ', 'trung học phổ thông, cấp ba', '我的高中同学住在北京。'],
  ['路', 'lù', 'Danh từ', 'đường', '这条路很长。'],
  ['颐和园', 'Yíhé Yuán', 'Danh từ riêng', 'Di Hòa Viên', '我去过一次颐和园。'],
  ['飞', 'fēi', 'Động từ', 'bay', '小鸟在天上飞。'],
  ['机场', 'jīchǎng', 'Danh từ', 'sân bay', '明天我去机场送你。'],
  ['机票', 'jīpiào', 'Danh từ', 'vé máy bay', '我在网上买好了机票。'],
  ['好像', 'hǎoxiàng', 'Động từ / phó từ tình thái', 'hình như, có vẻ như', '天上好像要下雨了。'],
  ['鸟', 'niǎo', 'Danh từ', 'chim', '天上有一只鸟。']
]);

const b15Listening: Question[] = [
  listeningGroup('hsk2_b15_listen_01', 'Bài 1 · 听短文，判断对错', '我叫小红，我有两年没出国了。下个月我想去北京旅游，昨天我已经在网上买好了机票。我去过一次颐和园，那里的花很漂亮，还有很多小鸟，所以我想再去一次。我的高中同学住在北京，他会去机场接我。', 'listening_tf', [
    listeningTf('hsk2_b15_listen_01_01', '小红有两年没出国了。', true),
    listeningTf('hsk2_b15_listen_01_02', '小红下个月想去上海。', false),
    listeningTf('hsk2_b15_listen_01_03', '小红在网上买了机票。', true),
    listeningTf('hsk2_b15_listen_01_04', '小红没去过颐和园。', false),
    listeningTf('hsk2_b15_listen_01_05', '小红的高中同学会去机场接她。', true)
  ]),
  listeningGroup('hsk2_b15_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '男：请问，你的姓名是什么？女：我叫王美。', 'listening_mc', [listeningMc('hsk2_b15_listen_02_01', '女的叫什么？', ['王美', '李美', '王明'], 0)]),
  listeningGroup('hsk2_b15_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：你明天什么时候出门？男：我早上七点出门，要去机场。', 'listening_mc', [listeningMc('hsk2_b15_listen_03_01', '男的明天要去哪儿？', ['学校', '机场', '商场'], 1)]),
  listeningGroup('hsk2_b15_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '男：这是两张公园门票，给你一张。女：谢谢，多少钱？', 'listening_mc', [listeningMc('hsk2_b15_listen_04_01', '男的有几张门票？', ['一张', '两张', '三张'], 1)]),
  listeningGroup('hsk2_b15_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '女：你去过北京吗？男：去过两次，我想再去一次。', 'listening_mc', [listeningMc('hsk2_b15_listen_05_01', '男的去过几次北京？', ['一次', '两次', '三次'], 1)]),
  listeningGroup('hsk2_b15_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '男：天上好像要下雨了。女：那我们带把伞吧。', 'listening_mc', [listeningMc('hsk2_b15_listen_06_01', '天气怎么样？', ['好像要下雨', '很晴', '很热'], 0)])
];

const b15Reading = reading('hsk2_b15_reading_01', 'II. 阅读 · Đọc hiểu', '我的朋友小明在大学学中文，他有三年没回家了。他很想家，所以下个月要坐飞机回去。他已经买好了机票，机票有点儿贵，但是他还是很高兴。他告诉我，到了机场以后，他要先给妈妈打电话，再坐车回家。', [
  mc('hsk2_b15_read_tf_01', '小明在大学学中文。', ['✓', '✗'], 0),
  mc('hsk2_b15_read_tf_02', '小明有三年没回家了。', ['✓', '✗'], 0),
  mc('hsk2_b15_read_tf_03', '小明的机票很便宜。', ['✓', '✗'], 1),
  mc('hsk2_b15_read_mc_01', '小明怎么回家？', ['坐飞机', '坐火车', '走路'], 0),
  mc('hsk2_b15_read_mc_02', '小明为什么要回家？', ['他很想家', '他要考试', '他要工作'], 0),
  mc('hsk2_b15_read_mc_03', '到了机场以后，小明先做什么？', ['给妈妈打电话', '买机票', '吃饭'], 0),
  ...b15WordBank.map((word, index) => fill(`hsk2_b15_read_fill_${String(index + 1).padStart(2, '0')}`, [
    '请在纸上写你的（　）。',
    '我想（　）学习，所以每天学中文。',
    '你几点（　）上学？',
    '这是我们的（　），请不要弄丢了。',
    '我的（　）同学在医院工作。',
    '这条（　）很长，我们慢慢走。',
    '（　）在北京，我去过一次。',
    '小鸟在天上（　），孩子们都在看。',
    '明天我去（　）送你。',
    '我买了一张去上海的（　）。',
    '她（　）生病了，今天没来上课。',
    '天上有一只（　），它飞得很高。'
  ][index], word, b15WordBank, 'hsk2-b15-read-fill', 'Bài 3 · 选词填空'))
], b15WordBank);

const b15Arrange: Question[] = [
  arrange('hsk2_b15_arrange_01', ['一次', '北京', '去过', '我'], '我去过一次北京。', '我去过北京一次。'),
  arrange('hsk2_b15_arrange_02', ['一次', '烤鸭', '想', '再', '吃', '我'], '我想再吃一次烤鸭。'),
  arrange('hsk2_b15_arrange_03', ['回国', '了', '一年', '没', '我', '有'], '我有一年没回国了。'),
  arrange('hsk2_b15_arrange_04', ['门票', '我', '两张', '买了'], '我买了两张门票。'),
  arrange('hsk2_b15_arrange_05', ['认识', '他', '我', '好像'], '他好像认识我。', '我好像认识他。')
];

const b15WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'required', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const b15ErrorGroup = { taskGroup: 'bai15-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' };
const b15EssayQuestions: Question[] = [
  errorCorrection('hsk2_b15_error_01', '我去中国一次过。', '我去过一次中国。', { ...b15ErrorGroup, acceptedVariants: ['我去过中国一次。'], explanation: '过 đứng ngay sau động từ, sau đó là bổ ngữ động lượng.' }),
  errorCorrection('hsk2_b15_error_02', '我再吃烤鸭一次。', '我再吃一次烤鸭。', { ...b15ErrorGroup, explanation: 'Tân ngữ là sự vật thì bổ ngữ động lượng đứng trước tân ngữ.' }),
  errorCorrection('hsk2_b15_error_03', '我有一年不回国了。', '我有一年没回国了。', { ...b15ErrorGroup, explanation: 'Mẫu 有 + khoảng thời gian + 没 + động từ + 了.' }),
  errorCorrection('hsk2_b15_error_04', '我想找一次他。', '我想找他一次。', { ...b15ErrorGroup, explanation: 'Tân ngữ là đại từ thì đứng trước bổ ngữ động lượng.' }),
  errorCorrection('hsk2_b15_error_05', '安妮来过两次这儿。', '安妮来过这儿两次。', { ...b15ErrorGroup, explanation: 'Tân ngữ chỉ nơi chốn (这儿) đứng trước bổ ngữ động lượng.' }),
  essay('hsk2_b15_writing', '写一写你想再去一次的地方。Viết đoạn văn khoảng 60–80 chữ. Dùng ít nhất 5 trong các từ/cấu trúc: 去过一次、再……一次、有……没……了、机票、机场、出国（出门）、好像、门票、路。', '我去过一次北京，很想再去一次。我有两年没出国了，所以想早点儿买机票。我听说颐和园的门票不贵，那里还有很多小鸟。到了机场，我要先给家里打个电话。', ['Đủ 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Giới thiệu một nơi muốn đi thêm lần nữa'], { taskGroup: 'bai15-writing', taskGroupTitle: 'III. 写作 · Bài 3: 写短文', explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.', rubric: b15WritingRubric, maxScore: 10 })
];

const b15ReadingAloudNote = 'Chấm theo thanh điệu và ngữ điệu. 姓名 đọc xìngmíng. 很想 đọc hén xiǎng (hai thanh 3 liền nhau, 很 biến thành thanh 2). 去过一次 đọc qù guo yí cì (过 đọc nhẹ, 一 biến thành thanh 2 trước thanh 4). 有一年 đọc yǒu yì nián (一 thanh 4 trước thanh 2). 机票 đọc jīpiào. 好像 đọc hǎoxiàng. 小鸟 đọc xiáoniǎo (hai thanh 3 liền nhau, 小 biến thành thanh 2). Câu có 吧 ở cuối dùng để hỏi xác nhận thì lên giọng nhẹ.';
const b15ReadAloud = (id: string, prompt: string, pinyin: string) => speaking(id, prompt, pinyin, { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: b15ReadingAloudNote });
const b15Guided = (id: string, prompt: string, pinyin: string, answer: string, element: string) => speaking(id, prompt, pinyin, { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: answer, referenceAnswers: [answer], requiredElements: [element] });
const b15Speaking: Question[] = [
  b15ReadAloud('hsk2_b15_speak_01', '考试就要开始了，请大家写上姓名。', 'Kǎoshì jiù yào kāishǐ le, qǐng dàjiā xiě shang xìngmíng.'),
  b15ReadAloud('hsk2_b15_speak_02', '我很想去中国，虽然去过一次，但是很想再去一次。', 'Wǒ hěn xiǎng qù Zhōngguó, suīrán qù guo yí cì, dànshì hěn xiǎng zài qù yí cì.'),
  b15ReadAloud('hsk2_b15_speak_03', '因为我想再吃一次烤鸭，再喝一次奶茶。', 'Yīnwèi wǒ xiǎng zài chī yí cì kǎoyā, zài hē yí cì nǎichá.'),
  b15ReadAloud('hsk2_b15_speak_04', '你有一年没回国了吧？', 'Nǐ yǒu yì nián méi huíguó le ba?'),
  b15ReadAloud('hsk2_b15_speak_05', '我记得你那次的机票很便宜。', 'Wǒ jìde nǐ nà cì de jīpiào hěn piányi.'),
  b15ReadAloud('hsk2_b15_speak_06', '家月说我们好像小鸟，一起飞到北京。', 'Jiāyuè shuō wǒmen hǎoxiàng xiǎoniǎo, yìqǐ fēi dào Běijīng.'),
  b15Guided('hsk2_b15_speak_07', 'V + 过 + 次 → 我去过______。', 'V + guo + cì → Wǒ qù guo ______.', '我去过一次北京。', 'Dùng V + 过 + 次'),
  b15Guided('hsk2_b15_speak_08', '再……一次 → 我想再______。', 'Zài…yí cì → Wǒ xiǎng zài ______.', '我想再吃一次烤鸭。', 'Dùng 再……一次'),
  b15Guided('hsk2_b15_speak_09', '有……没……了 → 我有______。', 'Yǒu…méi…le → Wǒ yǒu ______.', '我有一年没回国了。', 'Dùng 有……没……了'),
  b15Guided('hsk2_b15_speak_10', '好像 → 她______。', 'Hǎoxiàng → Tā ______.', '她好像生病了。', 'Dùng 好像'),
  b15Guided('hsk2_b15_speak_11', '机场 → 明天我______。', 'Jīchǎng → Míngtiān wǒ ______.', '明天我去机场送你。', 'Dùng 机场')
];

const b15AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy', maxScore: 2 }
];
const b15TranslationNote = 'Chấp nhận các cách dịch khác nếu đúng nghĩa và đúng ngữ pháp. V + 过 + số + 次 + tân ngữ: tân ngữ là sự vật thì đứng sau bổ ngữ động lượng; tân ngữ là đại từ thì đứng trước; tân ngữ là tên người hoặc địa danh thì đứng trước hoặc sau đều được. 有 + khoảng thời gian + 没 + động từ + 了 dịch là “đã … không … rồi”, dùng 没, không dùng 不. 好像 là “hình như, có vẻ như”; 机票 là vé máy bay, 门票 là vé vào cửa.';
const b15AudioOptions = (requiredElements: string[]) => ({ taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements, rubric: b15AudioTranslationRubric, maxScore: 10, explanation: `Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy. ${b15TranslationNote}` });
const b15TranslationQuestions: Question[] = [
  translation('hsk2_b15_translate_01', '我很想去中国，虽然去过一次，但是很想再去一次。', 'Tôi rất muốn đi Trung Quốc, tuy đã từng đi một lần nhưng vẫn rất muốn đi thêm lần nữa.', 'zh_to_vi_text', { explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_02', '你有一年没回国了吧？', 'Bạn đã một năm chưa về nước rồi nhỉ?', 'zh_to_vi_text', { explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_03', '我记得你那次的机票很便宜。', 'Tôi nhớ vé máy bay lần đó của bạn rất rẻ.', 'zh_to_vi_text', { explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_04', 'Annie đã từng đến Bắc Kinh một lần.', '安妮去过一次北京。', 'vi_to_zh_text', { referenceAnswers: ['安妮去过一次北京。', '安妮去过北京一次。'], explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_05', 'Tôi đã một tháng không gọi điện về nhà.', '我有一个月没给家里打电话了。', 'vi_to_zh_text', { explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_06', 'Tôi muốn ăn thêm một lần vịt quay.', '我想再吃一次烤鸭。', 'vi_to_zh_text', { explanation: b15TranslationNote }),
  translation('hsk2_b15_translate_07', 'Hình như cô ấy bị ốm rồi.', '她好像生病了。', 'vi_to_zh_audio', b15AudioOptions(['Dùng 好像', 'Dùng 生病了'])),
  translation('hsk2_b15_translate_08', 'Ngày mai tôi ra sân bay tiễn bạn.', '明天我去机场送你。', 'vi_to_zh_audio', b15AudioOptions(['Dùng 机场', 'Dùng 送你'])),
  translation('hsk2_b15_translate_09', 'Tôi mua hai vé vào cửa.', '我买了两张门票。', 'vi_to_zh_audio', b15AudioOptions(['Dùng 两张', 'Dùng 门票']))
];

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
    'HSK 2 - Bài 8: 虽然你忘了，但是我记得',
    'Phiếu bài tập HSK2 Bài 8: 虽然……但是……, 比, 点, 花 và so sánh trái/phải.',
    b8Vocab,
    [],
    [],
    b8Arrange,
    b8Reading,
    b8EssayQuestions,
    b8TranslationQuestions,
    b8Listening,
    b8Speaking
  ),
  makeLesson(
    'hsk2-bai9-meiyou-zuotian-na-me-re',
    'HSK 2 - Bài 9: 我去买杯奶茶',
    'Bài tập 5 kỹ năng HSK2 Bài 9: 没有 so sánh, 离 chỉ khoảng cách, bổ ngữ thời lượng và cách dùng 这样/那么.',
    b9Vocab,
    [],
    [],
    b9Arrange,
    b9Reading,
    b9EssayQuestions,
    b9TranslationQuestions,
    b9Listening,
    b9Speaking
  ),
  makeLesson(
    'hsk2-bai10-jiuyaokaoshile',
    'HSK 2 - Bài 10: 就要考试了',
    'Bài tập 5 kỹ năng HSK2 Bài 10: 开学, 考试, 快要/就要……了, 还是 và bổ ngữ kết quả 错.',
    b10Vocab,
    [],
    [],
    b10Arrange,
    b10Reading,
    b10EssayQuestions,
    b10TranslationQuestions,
    b10Listening,
    b10Speaking
  ),
  makeLesson(
    'hsk2-bai11-wo-zui-xihuan-chi-zhongguo-cai',
    'HSK 2 - Bài 11: 我最喜欢吃中国菜',
    'Bài tập 5 kỹ năng HSK2 Bài 11: 着, 经常, 最, 疼 và cách nói về sức khỏe, vận động.',
    b11Vocab,
    [],
    [],
    b11Arrange,
    b11Reading,
    b11EssayQuestions,
    b11TranslationQuestions,
    b11Listening,
    b11Speaking
  ),
  makeLesson(
    'hsk2-bai12-zheli-bi-beijing-leng-duo-le',
    'HSK 2 - Bài 12: 这里比北京冷多了',
    'Bài tập 5 kỹ năng HSK2 Bài 12: 比……多了/得多, V得比, 正……呢, 从小 và 小时候.',
    b12Vocab,
    [],
    [],
    b12Arrange,
    b12Reading,
    b12EssayQuestions,
    b12TranslationQuestions,
    b12Listening,
    b12Speaking
  ),
  makeLesson(
    'hsk2-bai13-women-ai-shang-zhongwen-ke',
    'HSK 2 - Bài 13: 我们爱上中文课',
    'Bài tập 5 kỹ năng HSK2 Bài 13: câu hai tân ngữ (送给/卖给/拿给), 比 + số lượng, 比……一点儿 và hai cách đọc của 教.',
    b13Vocab,
    [],
    [],
    b13Arrange,
    b13Reading,
    b13EssayQuestions,
    b13TranslationQuestions,
    b13Listening,
    b13Speaking
  ),
  makeLesson(
    'hsk2-bai14-yigeren-guonian-duo-mei-yisi-a',
    'HSK 2 - Bài 14: 一个人过年多没意思啊',
    'Bài tập 5 kỹ năng HSK2 Bài 14: câu tồn hiện với 着, bổ ngữ xu hướng kép, 多……啊 và lượng từ chỉ người.',
    b14Vocab,
    [],
    [],
    b14Arrange,
    b14Reading,
    b14EssayQuestions,
    b14TranslationQuestions,
    b14Listening,
    b14Speaking
  ),
  makeLesson(
    'hsk2-bai15-wo-xiang-zai-qu-yici-zhongguo',
    'HSK 2 - Bài 15: 我想再去一次中国',
    'Bài tập 5 kỹ năng HSK2 Bài 15: bổ ngữ động lượng 次, V过, 再……一次, 有……没……了 và 好像.',
    b15Vocab,
    [],
    [],
    b15Arrange,
    b15Reading,
    b15EssayQuestions,
    b15TranslationQuestions,
    b15Listening,
    b15Speaking
  )
];
