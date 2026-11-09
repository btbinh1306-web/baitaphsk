import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const vocab = (hanzi: string, pinyin: string, meaning: string, type = 'Từ vựng'): VocabItem => ({
  hanzi,
  pinyin,
  meaning,
  type
});

type FillMeta = Pick<Question, 'wordBank' | 'fillGroup' | 'fillGroupTitle'>;

const fill = (
  id: string,
  prompt: string,
  answer: string,
  wordBankOrMeta: string[] | FillMeta = {},
  tier: Question['tier'] = 'tier1',
  extra: Partial<Question> = {}
): Question => ({
  id,
  type: 'fill',
  tier,
  prompt,
  answer,
  acceptableAnswers: answer,
  suggestedAnswer: answer,
  ...(Array.isArray(wordBankOrMeta) ? { wordBank: wordBankOrMeta } : wordBankOrMeta),
  ...extra
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
  correctedAnswer?: string,
  extra: Partial<Question> = {}
): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier3',
  prompt: sentence,
  suggestedAnswer: correctedAnswer || sentence,
  referenceAnswers: [correctedAnswer || sentence],
  teacherReviewRequired: true,
  errorCorrection: { sentenceIsCorrect },
  requiredElements: ['Phán đoán đúng/sai', 'Sửa câu hoàn chỉnh'],
  explanation: 'Chấm 4 điểm cho phán đoán đúng/sai và 6 điểm cho câu sửa đúng; nếu câu gốc đúng thì ghi rõ câu đúng và không sửa sai.',
  rubric: [
    { id: 'judgement', label: 'Phán đoán đúng/sai', maxScore: 4 },
    { id: 'correction', label: 'Sửa câu đúng', maxScore: 6 }
  ],
  maxScore: 10,
  ...extra
});

const essay = (id: string, prompt: string, suggestedAnswer?: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  referenceAnswers: suggestedAnswer ? [suggestedAnswer] : undefined,
  teacherReviewRequired: true,
  requiredElements: ['Trả lời đủ yêu cầu đề bài'],
  explanation: 'Chấp nhận cách diễn đạt khác nếu đúng nội dung, ngữ pháp và từ vựng theo yêu cầu.',
  rubric: [
    { id: 'content', label: 'Nội dung đúng ý', maxScore: 4 },
    { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 3 },
    { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 3 }
  ],
  ...extra,
  maxScore: extra.maxScore ?? 10
});

const speaking = (id: string, prompt: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'speaking_record',
  tier: 'tier3',
  prompt,
  taskGroup: 'reading_aloud',
  taskGroupTitle: 'Luyện nói và ghi âm',
  teacherReviewRequired: true,
  referenceAnswers: [prompt],
  requiredElements: ['Đọc đủ câu', 'Phát âm và thanh điệu rõ'],
  explanation: 'Chấm theo nội dung, phát âm, thanh điệu và độ trôi chảy; chấp nhận ngữ điệu tự nhiên nếu không làm đổi nghĩa.',
  rubric: [
    { id: 'content', label: 'Đọc đúng và đủ câu', maxScore: 4 },
    { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 },
    { id: 'fluency', label: 'Ngữ điệu và độ trôi chảy', maxScore: 3 }
  ],
  maxScore: 10,
  ...extra
});

const translation = (
  id: string,
  prompt: string,
  suggestedAnswer: string,
  translationType: Question['translationType'] = 'vi_to_zh_text',
  extra: Partial<Question> = {}
): Question => ({
  id,
  type: 'translation',
  translationType,
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  referenceAnswers: [suggestedAnswer],
  teacherReviewRequired: true,
  requiredElements: ['Dịch đủ nghĩa', 'Đúng ngữ pháp và từ vựng mục tiêu'],
  explanation: 'Chấp nhận cách dịch khác nếu đúng nghĩa và đúng ngữ pháp; bài ghi âm chấm thêm thanh điệu và độ trôi chảy.',
  rubric: [
    { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
    { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
  ],
  maxScore: 10,
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

const bai4ReadingWordBank = ['过', '商场', '进去', '条', '裤子', '因为', '试', '所以', '书包', '过去', '更', '颜色'];
const bai4WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const bai4SpeakingRubric = [
  { id: 'meaning', label: 'Đúng nội dung', maxScore: 4 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Ngữ điệu và độ trôi chảy', maxScore: 3 }
];
const bai4GuidedSpeakingRubric = [
  { id: 'target', label: 'Dùng đúng từ/cấu trúc gợi ý', maxScore: 4 },
  { id: 'grammar', label: 'Câu đúng ngữ pháp', maxScore: 3 },
  { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
];
const bai4TextTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
  { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
];
const bai4AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

const reading = (
  id: string,
  title: string,
  content: string,
  questions: Question[],
  wordBank?: string[]
): ReadingPassage => ({ id, title, content, questions, ...(wordBank ? { wordBank } : {}) });

export const HSK2_BAI4_EXAM: ExamLesson = {
  id: 'hsk2-bai4-ni-chuan-hongse-de-hen-haokan',
  title: 'HSK 2 - Bài 4: 你穿红色的很好看',
  level: 'HSK 2',
  description: 'Bài tập 5 kỹ năng HSK2 Bài 4: 你穿红色的很好看.',
  instruction: 'Làm theo thứ tự: từ vựng → nghe → đọc → viết → nói → dịch. Phần nghe dùng đúng kịch bản trong tài liệu; phần tự luận, nói và dịch có hướng dẫn chấm cho giáo viên.',
  mcQuestions: [],
  vocabList: [
    vocab('过', 'guo', 'đã từng', 'Trợ từ động thái'), vocab('商场', 'shāngchǎng', 'trung tâm thương mại', 'Danh từ'),
    vocab('进去', 'jìnqù', 'đi vào', 'Động từ'), vocab('条', 'tiáo', 'cái/con (vật dài, hẹp hoặc mảnh)', 'Lượng từ'),
    vocab('裤子', 'kùzi', 'quần', 'Danh từ'), vocab('白色', 'báisè', 'màu trắng', 'Danh từ'),
    vocab('因为', 'yīnwèi', 'bởi vì, vì', 'Liên từ'), vocab('试', 'shì', 'thử', 'Động từ'),
    vocab('红色', 'hóngsè', 'màu đỏ', 'Danh từ'), vocab('所以', 'suǒyǐ', 'cho nên, vì vậy', 'Liên từ'),
    vocab('书包', 'shūbāo', 'cặp sách, ba lô học sinh', 'Danh từ'), vocab('过去', 'guòqù', 'đi qua đó, đi tới đó', 'Động từ'),
    vocab('绿色', 'lǜsè', 'màu xanh lá', 'Danh từ'), vocab('黑色', 'hēisè', 'màu đen', 'Danh từ'),
    vocab('更', 'gèng', 'hơn, càng hơn', 'Phó từ'), vocab('颜色', 'yánsè', 'màu sắc', 'Danh từ')
  ],
  fillQuestions: [],
  arrangeQuestions: [
    arrange('hsk2_b4_arr_01', '过 / 北京 / 我 / 去', ['过', '北京', '我', '去', '。'], '我去过北京。'),
    arrange('hsk2_b4_arr_02', '穿 / 裤子 / 过 / 红色的 / 她 / 没', ['穿', '裤子', '过', '红色的', '她', '没', '。'], '她没穿过红色的裤子。'),
    arrange('hsk2_b4_arr_03', '所以 / 今天 / 下雨 / 因为 / 商场 / 我 / 不 / 去', ['所以', '今天', '下雨', '因为', '商场', '我', '不', '去', '。'], '因为今天下雨，所以我不去商场。'),
    arrange('hsk2_b4_arr_04', '买 / 的 / 书包 / 我 / 绿色 / 想', ['买', '的', '书包', '我', '绿色', '想', '。'], '我想买绿色的书包。'),
    arrange('hsk2_b4_arr_05', '好看 / 红色的 / 觉得 / 我 / 更', ['好看', '红色的', '觉得', '我', '更', '。'], '我觉得红色的更好看。')
  ],
  readingPassages: [reading(
    'hsk2_b4_reading',
    'II. 阅读 · Bài 1–3: Đọc hiểu',
    '今天我和朋友去了一家商场。这家商场我没去过，所以我们进去看了看。商场里的书包颜色很多，有红色的、绿色的和黑色的。我想买一个新书包，朋友说绿色的更好看，所以我买了绿色的。',
    [
      mc('hsk2_b4_read_01', '他们以前去过这家商场。', ['✓', '✗'], 1),
      mc('hsk2_b4_read_02', '商场里的书包颜色很多。', ['✓', '✗'], 0),
      mc('hsk2_b4_read_03', '他买了绿色的书包。', ['✓', '✗'], 0),
      mc('hsk2_b4_read_04', '他们为什么进去看了看？', ['因为没去过', '因为下雨', '因为要买裤子'], 0),
      mc('hsk2_b4_read_05', '朋友觉得哪个颜色更好看？', ['红色', '绿色', '黑色'], 1),
      mc('hsk2_b4_read_06', '他买了什么？', ['裤子', '衣服', '书包'], 2),
      fill('hsk2_b4_read_fill_01', '我去（　）北京，但是没去过西安。', '过', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_02', '这个（　）很大，里面有很多衣服。', '商场', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_03', '外面很冷，我们（　）吧。', '进去', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_04', '这（　）裤子很好看。', '条', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_05', '你穿这条（　）很好看。', '裤子', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_06', '（　）今天下雨，所以我不出去。', '因为', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_07', '这件衣服很好看，你（　）一下吧。', '试', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_08', '今天很累，（　）我不想出去。', '所以', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_09', '我想买一个新（　）。', '书包', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_10', '那边有很多书包，我们（　）看看吧。', '过去', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_11', '我觉得红色的（　）好看。', '更', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b4_read_fill_12', '你喜欢什么（　）？', '颜色', bai4ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b4-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' })
    ],
    bai4ReadingWordBank
  )],
  listeningQuestions: [
    listeningGroup('hsk2_b4_listen_01', 'Bài 1 · 听短文，判断对错', '我叫小雪，今天和妈妈去了一家新商场。我没来过这家商场，所以很想进去看看。我想买一条裤子。我有很多白色的衣服，但是没穿过红色的。妈妈让我试试红色的裤子，我觉得很好看。', 'listening_tf', [
      listeningTf('hsk2_b4_listen_01_01', '小雪来过这家商场。', false),
      listeningTf('hsk2_b4_listen_01_02', '小雪想买一条裤子。', true),
      listeningTf('hsk2_b4_listen_01_03', '小雪没有白色的衣服。', false),
      listeningTf('hsk2_b4_listen_01_04', '小雪穿过红色的裤子。', false),
      listeningTf('hsk2_b4_listen_01_05', '小雪觉得红色的裤子很好看。', true)
    ]),
    listeningGroup('hsk2_b4_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：我们来过这家商场吗？男：没来过，这是新开的。', 'listening_mc', [
      listeningMc('hsk2_b4_listen_02_01', '他们来过这家商场吗？', ['来过', '没来过', '不知道'], 1)
    ]),
    listeningGroup('hsk2_b4_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：你想买点儿什么？女：我想买条裤子。', 'listening_mc', [
      listeningMc('hsk2_b4_listen_02_02', '女的想买什么？', ['书包', '裤子', '衣服'], 1)
    ]),
    listeningGroup('hsk2_b4_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：你有很多白色的衣服，为什么还买白色的？男：因为我喜欢白色的。', 'listening_mc', [
      listeningMc('hsk2_b4_listen_02_03', '男的为什么买白色的？', ['因为他喜欢', '因为便宜', '因为妈妈买'], 0)
    ]),
    listeningGroup('hsk2_b4_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你吃过北京烤鸭吗？女：吃过，很好吃。', 'listening_mc', [
      listeningMc('hsk2_b4_listen_02_04', '女的吃过北京烤鸭吗？', ['吃过', '没吃过', '想吃'], 0)
    ]),
    listeningGroup('hsk2_b4_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：红色的、绿色的、黑色的，你想买哪个？男：绿色的吧。', 'listening_mc', [
      listeningMc('hsk2_b4_listen_02_05', '男的想买什么颜色的？', ['红色', '绿色', '黑色'], 1)
    ])
  ],
  essayQuestions: [
    errorCorrection('hsk2_b4_error_01', '我去了过北京。', false, '我去过北京。', { taskGroup: 'bai4-error-correction', taskGroupTitle: 'Bài 2: 改错句' }),
    errorCorrection('hsk2_b4_error_02', '我没去过了北京。', false, '我没去过北京。', { taskGroup: 'bai4-error-correction', taskGroupTitle: 'Bài 2: 改错句' }),
    errorCorrection('hsk2_b4_error_03', '因为今天下雨，但是我不出去。', false, '因为今天下雨，所以我不出去。', { taskGroup: 'bai4-error-correction', taskGroupTitle: 'Bài 2: 改错句' }),
    errorCorrection('hsk2_b4_error_04', '一条书包。', false, '一个书包。', { taskGroup: 'bai4-error-correction', taskGroupTitle: 'Bài 2: 改错句' }),
    errorCorrection('hsk2_b4_error_05', '我喜欢红色衣服。', false, '我喜欢红色的衣服。', { taskGroup: 'bai4-error-correction', taskGroupTitle: 'Bài 2: 改错句' }),
    essay('hsk2_b4_writing', '写一写你去商场买东西的一次经历。请写一篇60–80字的短文。至少使用下面5个词语/结构：过、商场、进去、条、因为、所以、试、颜色、更、书包、裤子。', '今天我和妈妈去了一家新商场，我以前没去过。因为我想买书包，所以我们进去看了看。商场里的书包颜色很多，我试了试红色的和绿色的。我觉得绿色的更好看，所以买了绿色的。', {
      teacherReviewRequired: true,
      referenceAnswers: ['今天我和妈妈去了一家新商场，我以前没去过。因为我想买书包，所以我们进去看了看。商场里的书包颜色很多，我试了试红色的和绿色的。我觉得绿色的更好看，所以买了绿色的。'],
      taskGroup: 'bai4-writing',
      taskGroupTitle: 'Bài 3: 写短文',
      requiredElements: ['Đủ 60–80 chữ', 'Dùng ít nhất 5 từ/cấu trúc yêu cầu'],
      explanation: 'Chấp nhận cách diễn đạt khác nếu đủ ý, đúng ngữ pháp và dùng đúng tối thiểu 5 từ/cấu trúc yêu cầu.',
      rubric: bai4WritingRubric,
      maxScore: 10
    })
  ],
  speakingQuestions: [
    { ...speaking('hsk2_b4_speaking_01', '我们来过这家商场吗？'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['我们来过这家商场吗？'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_02', '没来过，这是新开的。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['没来过，这是新开的。'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_03', '我们进去看看吧。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['我们进去看看吧。'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_04', '你有很多白色的衣服，为什么还买白色的？'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['你有很多白色的衣服，为什么还买白色的？'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_05', '正是因为没穿过，所以要试试啊！'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['正是因为没穿过，所以要试试啊！'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_06', '红色的、绿色的、黑色的，你想买哪个？'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['红色的、绿色的、黑色的，你想买哪个？'], rubric: bai4SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_07', '过 → 我去过______。'), taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我去过北京。', referenceAnswers: ['我去过北京。'], requiredElements: ['过'], rubric: bai4GuidedSpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_08', '因为……所以…… → 因为今天下雨，______。'), taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '因为今天下雨，所以我不去商场。', referenceAnswers: ['因为今天下雨，所以我不去商场。'], requiredElements: ['因为……所以……'], rubric: bai4GuidedSpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_09', '试 → 这件衣服很好看，你______。'), taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '这件衣服很好看，你试试吧。', referenceAnswers: ['这件衣服很好看，你试试吧。'], requiredElements: ['试'], rubric: bai4GuidedSpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_10', '更 → 我觉得______。'), taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我觉得红色的更好看。', referenceAnswers: ['我觉得红色的更好看。'], requiredElements: ['更'], rubric: bai4GuidedSpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b4_speaking_11', '颜色 → 你______？'), taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你喜欢什么颜色？', referenceAnswers: ['你喜欢什么颜色？'], requiredElements: ['颜色'], rubric: bai4GuidedSpeakingRubric, maxScore: 10 }
  ],
  translationQuestions: [
    translation('hsk2_b4_translation_01', '我们来过这家商场吗？', 'Chúng ta đã từng đến trung tâm thương mại này chưa?', 'zh_to_vi_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_02', '你有很多白色的衣服，为什么还买白色的？', 'Bạn có rất nhiều quần áo màu trắng, sao còn mua màu trắng?', 'zh_to_vi_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_03', '正是因为没穿过，所以要试试啊！', 'Chính vì chưa từng mặc, nên mới phải thử chứ!', 'zh_to_vi_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_04', 'Tôi chưa từng đi Tây An.', '我没去过西安。', 'vi_to_zh_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_05', 'Vì hôm nay trời mưa nên tôi không đi trung tâm thương mại.', '因为今天下雨，所以我不去商场。', 'vi_to_zh_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_06', 'Bạn thích màu gì?', '你喜欢什么颜色？', 'vi_to_zh_text', { rubric: bai4TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_07', 'Tôi muốn mua một cái quần màu đỏ.', '我想买一条红色的裤子。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai4AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_08', 'Chúng ta qua đó xem cặp sách đi.', '我们过去看看书包吧。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai4AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b4_translation_09', 'Tôi thấy màu xanh lá đẹp hơn.', '我觉得绿色的更好看。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai4AudioTranslationRubric, maxScore: 10 })
  ]
};

const bai5ReadingWordBank = ['快', '慢', '下来', '上去', '下面', '等', '一会儿', '进来', '爷爷', '礼物', '准备', '酒店', '奶茶', '跟', '走'];
const bai5WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const bai5SpeakingRubric = [
  { id: 'meaning', label: 'Đúng nội dung', maxScore: 4 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Ngữ điệu và độ trôi chảy', maxScore: 3 }
];
const bai5GuidedSpeakingRubric = [
  { id: 'target', label: 'Dùng đúng từ/cấu trúc gợi ý', maxScore: 4 },
  { id: 'grammar', label: 'Câu đúng ngữ pháp', maxScore: 3 },
  { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
];
const bai5TextTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
  { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
];
const bai5AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

export const HSK2_BAI5_EXAM: ExamLesson = {
  id: 'hsk2-bai5-diyici-qu-zhongguo-pengyou-jia',
  title: 'HSK 2 - Bài 5: 第一次去中国朋友家',
  level: 'HSK 2',
  description: 'Bài tập 5 kỹ năng HSK2 Bài 5: 第一次去中国朋友家.',
  instruction: 'Làm theo đúng thứ tự: từ vựng → nghe → đọc → viết → nói → dịch. Phần tự luận, nói và dịch có đáp án tham khảo, ý bắt buộc, giải thích và thang điểm cho giáo viên.',
  mcQuestions: [],
  vocabList: [
    vocab('快', 'kuài', 'mau, nhanh', 'Phó từ / tính từ'), vocab('慢', 'màn', 'chậm, chậm rãi', 'Tính từ / phó từ'),
    vocab('下来', 'xiàlái', 'đi xuống đây, xuống', 'Động từ'), vocab('上来', 'shànglái', 'đi lên đây, lên', 'Động từ'),
    vocab('上去', 'shàngqù', 'đi lên đó, lên', 'Động từ'), vocab('下面', 'xiàmiàn', 'phía dưới, bên dưới, tầng dưới', 'Danh từ'),
    vocab('面', 'miàn', 'hậu tố dùng tạo từ chỉ nơi chốn', 'Hậu tố'), vocab('等', 'děng', 'đợi, chờ', 'Động từ'),
    vocab('一会儿', 'yíhuìr', 'một lát, lát nữa', 'Danh từ chỉ thời gian'), vocab('下去', 'xiàqù', 'đi xuống đó, xuống', 'Động từ'),
    vocab('进来', 'jìnlái', 'đi vào đây, vào', 'Động từ'), vocab('爷爷', 'yéye', 'ông nội', 'Danh từ'),
    vocab('奶奶', 'nǎinai', 'bà nội', 'Danh từ'), vocab('礼物', 'lǐwù', 'quà, lễ vật', 'Danh từ'),
    vocab('准备', 'zhǔnbèi', 'chuẩn bị', 'Động từ'), vocab('酒店', 'jiǔdiàn', 'khách sạn', 'Danh từ'),
    vocab('奶茶', 'nǎichá', 'trà sữa', 'Danh từ'), vocab('跟', 'gēn', 'với, cùng, và', 'Giới từ / liên từ'),
    vocab('走', 'zǒu', 'đi, bước đi', 'Động từ')
  ],
  fillQuestions: [],
  arrangeQuestions: [
    arrange('hsk2_b5_arr_01', '吧　下来　快　你', ['吧', '下来', '快', '你'], '你快下来吧。'),
    arrange('hsk2_b5_arr_02', '你　我　在　等　下面', ['你', '我', '在', '等', '下面'], '我在下面等你。'),
    arrange('hsk2_b5_arr_03', '就　下去　一会儿　我', ['就', '下去', '一会儿', '我'], '我一会儿就下去。'),
    arrange('hsk2_b5_arr_04', '吃饭　十二点　吧　了　我们　都', ['吃饭', '十二点', '吧', '了', '我们', '都'], '都十二点了，我们吃饭吧。'),
    arrange('hsk2_b5_arr_05', '了　礼物　爷爷　准备　给　我', ['了', '礼物', '爷爷', '准备', '给', '我'], '我给爷爷准备了礼物。')
  ],
  readingPassages: [reading(
    'hsk2_b5_reading',
    'II. 阅读 · Bài 1–3: Đọc hiểu',
    '我和朋友第一次去中国朋友家。我们给爷爷奶奶准备了礼物。因为酒店离她家不远，所以我们走去。到了以后，朋友在门口等我们，说：“快进来！”奶奶准备了很多菜，我们吃得很开心。',
    [
      mc('hsk2_b5_read_tf_01', '他们给爷爷奶奶准备了礼物。', ['✓', '✗'], 0),
      mc('hsk2_b5_read_tf_02', '他们打车去朋友家。', ['✓', '✗'], 1),
      mc('hsk2_b5_read_tf_03', '奶奶准备了很多菜。', ['✓', '✗'], 0),
      mc('hsk2_b5_read_mc_01', '他们怎么去朋友家？', ['走去', '打车', '坐公交车'], 0),
      mc('hsk2_b5_read_mc_02', '他们为什么走去？', ['因为酒店离她家不远', '因为没有车', '因为下雨了'], 0),
      mc('hsk2_b5_read_mc_03', '朋友在门口说了什么？', ['快进来', '快回去', '慢点儿'], 0),
      fill('hsk2_b5_read_fill_01', '时间不早了，我们（　）回去吧。', '快', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_02', '你走（　）一点儿，我跟不上你。', '慢', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_03', '你快（　）吧，我在楼下等你。', '下来', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_04', '你先（　）吧，我一会儿就来。', '上去', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_05', '我在（　）等你，你快下来吧。', '下面', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_06', '我在门口（　）你，你快来吧。', '等', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_07', '我（　）就回来，你先在这里等我。', '一会儿', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_08', '外面下雨了，你快（　）吧。', '进来', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_09', '我（　）住在北京，奶奶住在上海。', '爷爷', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_10', '这是送给奶奶的（　）。', '礼物', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_11', '你（　）好了吗？我们要走了。', '准备', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_12', '我们住的（　）离车站很近。', '酒店', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_13', '我喜欢喝（　），不喜欢喝咖啡。', '奶茶', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_14', '你（　）我一起去吧。', '跟', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b5_read_fill_15', '酒店很近，我们（　）回去吧。', '走', bai5ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b5-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' })
    ],
    bai5ReadingWordBank
  )],
  listeningQuestions: [
    listeningGroup('hsk2_b5_listen_01', 'Bài 1 · 听短文，判断对错', '今天我第一次去中国朋友家。我给朋友的爷爷奶奶准备了礼物。我在酒店下面等朋友，朋友说一会儿就下来。我们一起走去他家。到他家的时候，奶奶已经做好了菜，爷爷还买了奶茶。我们吃得很开心。', 'listening_tf', [
      listeningTf('hsk2_b5_listen_01_01', '这是他第一次去中国朋友家。', true),
      listeningTf('hsk2_b5_listen_01_02', '他没有给爷爷奶奶准备礼物。', false),
      listeningTf('hsk2_b5_listen_01_03', '朋友在酒店下面等他。', false),
      listeningTf('hsk2_b5_listen_01_04', '奶奶已经做好了菜。', true),
      listeningTf('hsk2_b5_listen_01_05', '奶奶买了奶茶。', false)
    ]),
    listeningGroup('hsk2_b5_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：你快下来吧，我在下面等你。男：我一会儿就下去。', 'listening_mc', [
      listeningMc('hsk2_b5_listen_02_01', '女的在哪儿？', ['上面', '下面', '酒店里'], 1)
    ]),
    listeningGroup('hsk2_b5_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '男：快进来！我给你们介绍一下，这是爷爷、奶奶。', 'listening_mc', [
      listeningMc('hsk2_b5_listen_02_02', '男的给她们介绍了谁？', ['爷爷奶奶', '老师', '同学'], 0)
    ]),
    listeningGroup('hsk2_b5_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：这是送你们的礼物。男：你们太客气了！', 'listening_mc', [
      listeningMc('hsk2_b5_listen_02_03', '女的做了什么？', ['送礼物', '买奶茶', '做饭'], 0)
    ]),
    listeningGroup('hsk2_b5_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：都十二点了，我们吃饭吧。女：好的。', 'listening_mc', [
      listeningMc('hsk2_b5_listen_02_04', '现在几点？', ['十一点', '十二点', '一点'], 1)
    ]),
    listeningGroup('hsk2_b5_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：奶茶是你自己做的吗？男：不是，是爷爷买的。', 'listening_mc', [
      listeningMc('hsk2_b5_listen_02_05', '奶茶是谁买的？', ['爷爷', '奶奶', '男的'], 0)
    ])
  ],
  essayQuestions: [
    errorCorrection('hsk2_b5_error_01', '你来进去吧。', false, '你进来吧。', { taskGroup: 'bai5-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' }),
    errorCorrection('hsk2_b5_error_02', '我去上面。', false, '我上去。', { taskGroup: 'bai5-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' }),
    errorCorrection('hsk2_b5_error_03', '我送来礼物给你。', false, '我给你送来礼物。', { taskGroup: 'bai5-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', acceptedVariants: ['我送礼物来给你。'] }),
    errorCorrection('hsk2_b5_error_04', '都十二点，所以我们睡觉。', false, '都十二点了，我们睡觉吧。', { taskGroup: 'bai5-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' }),
    errorCorrection('hsk2_b5_error_05', '我跟一起朋友去。', false, '我跟朋友一起去。', { taskGroup: 'bai5-error-correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句' }),
    essay('hsk2_b5_writing', '写一写你第一次去朋友家的经历。请写一篇60–80字的短文。至少使用下面5个词语/结构：准备、礼物、等、一会儿、进来、跟、走、快、都……了、爷爷、奶奶。', '上个星期，我第一次去中国朋友家。我给他的爷爷奶奶准备了礼物。朋友在下面等我，说：“快进来！”奶奶做了很多菜，爷爷还买了奶茶。吃完饭，我跟朋友一起走回酒店。', {
      taskGroup: 'bai5-writing',
      taskGroupTitle: 'III. 写作 · Bài 3: 写短文',
      requiredElements: ['Đủ 60–80 chữ', 'Dùng ít nhất 5 từ/cấu trúc yêu cầu', 'Kể được trải nghiệm lần đầu đi nhà bạn'],
      explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.',
      rubric: bai5WritingRubric,
      maxScore: 10
    })
  ],
  speakingQuestions: [
    { ...speaking('hsk2_b5_speaking_01', '快下来吧，第一次去中国朋友家，别晚了。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['快下来吧，第一次去中国朋友家，别晚了。'], requiredElements: ['快下来吧', '别晚了'], rubric: bai5SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b5_speaking_02', '我不上去了，在下面等你。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['我不上去了，在下面等你。'], requiredElements: ['不上去了', '在下面等你'], rubric: bai5SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b5_speaking_03', '那我一会儿就下去。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['那我一会儿就下去。'], requiredElements: ['一会儿', '下去'], rubric: bai5SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b5_speaking_04', '家月，安妮，快进来！'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['家月，安妮，快进来！'], requiredElements: ['快进来'], rubric: bai5SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b5_speaking_05', '都十二点了，我们吃饭吧。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['都十二点了，我们吃饭吧。'], requiredElements: ['都……了', '吃饭吧'], rubric: bai5SpeakingRubric, maxScore: 10 },
    { ...speaking('hsk2_b5_speaking_06', '吃完饭你们可以跟我去看看。'), taskGroupTitle: 'IV. 口语 · Bài 1: 录音', referenceAnswers: ['吃完饭你们可以跟我去看看。'], requiredElements: ['跟我', '去看看'], rubric: bai5SpeakingRubric, maxScore: 10 },
    speaking('hsk2_b5_speaking_07', '快 → 时间不早了，我们______。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '时间不早了，我们快回去吧。', referenceAnswers: ['时间不早了，我们快回去吧。'], requiredElements: ['快'], rubric: bai5GuidedSpeakingRubric, maxScore: 10 }),
    speaking('hsk2_b5_speaking_08', '等 → 我在酒店门口______。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我在酒店门口等你。', referenceAnswers: ['我在酒店门口等你。'], requiredElements: ['等'], rubric: bai5GuidedSpeakingRubric, maxScore: 10 }),
    speaking('hsk2_b5_speaking_09', '准备 → 我给爷爷奶奶______。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我给爷爷奶奶准备了礼物。', referenceAnswers: ['我给爷爷奶奶准备了礼物。'], requiredElements: ['准备'], rubric: bai5GuidedSpeakingRubric, maxScore: 10 }),
    speaking('hsk2_b5_speaking_10', '都……了 → ______，我们吃饭吧。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '都十二点了，我们吃饭吧。', referenceAnswers: ['都十二点了，我们吃饭吧。'], requiredElements: ['都……了'], rubric: bai5GuidedSpeakingRubric, maxScore: 10 }),
    speaking('hsk2_b5_speaking_11', '跟 → 我______一起去。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我跟朋友一起去。', referenceAnswers: ['我跟朋友一起去。'], requiredElements: ['跟 + người + 一起'], rubric: bai5GuidedSpeakingRubric, maxScore: 10 })
  ],
  translationQuestions: [
    translation('hsk2_b5_translation_01', 'Gia Nguyệt, mau xuống đi, đừng để muộn.', '家月，快下来吧，别晚了。', 'zh_to_vi_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_02', 'Mình không lên nữa, mình đợi bạn ở dưới.', '我不上去了，在下面等你。', 'zh_to_vi_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_03', 'Đã mười hai giờ rồi, chúng ta ăn cơm đi.', '都十二点了，我们吃饭吧。', 'zh_to_vi_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_04', 'Bạn mau vào đi!', '你快进来！', 'vi_to_zh_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_05', 'Tôi đợi bạn ở dưới.', '我在下面等你。', 'vi_to_zh_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_06', 'Đây là quà tặng ông bà.', '这是送爷爷奶奶的礼物。', 'vi_to_zh_text', { rubric: bai5TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_07', 'Lát nữa tôi sẽ xuống ngay.', '我一会儿就下去。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['一会儿', '下去'], explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.', rubric: bai5AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_08', 'Bạn đi cùng tôi nhé.', '你跟我一起去吧。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['跟 + người + 一起'], explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.', rubric: bai5AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b5_translation_09', 'Trà sữa là ông mua.', '奶茶是爷爷买的。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', requiredElements: ['是……的', '爷爷买'], explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.', rubric: bai5AudioTranslationRubric, maxScore: 10 })
  ]
};

const bai6ReadingWordBank = ['生日', '忘', '画', '画笔', '蛋糕', '快乐', '打开', '长', '鱼', '肉', '过', '地', '床', '舒服'];
const bai6WritingRubric = [
  { id: 'content', label: 'Nội dung đủ ý về một ngày sinh nhật', maxScore: 3 },
  { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
  { id: 'grammar', label: 'Ngữ pháp và cách dùng 地 / 什么的 đúng', maxScore: 2 },
  { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
];
const bai6SpeakingRubric = [
  { id: 'content', label: 'Đọc đúng và đủ câu', maxScore: 4 },
  { id: 'tones', label: 'Thanh điệu, biến điệu và âm nhẹ', maxScore: 3 },
  { id: 'fluency', label: 'Ngữ điệu và độ trôi chảy', maxScore: 3 }
];
const bai6GuidedSpeakingRubric = [
  { id: 'target', label: 'Dùng đúng từ/cấu trúc gợi ý', maxScore: 4 },
  { id: 'grammar', label: 'Câu đúng ngữ pháp', maxScore: 3 },
  { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
];
const bai6TextTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
  { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
];
const bai6AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

export const HSK2_BAI6_EXAM: ExamLesson = {
  id: 'hsk2-bai6-xiaoxue-shengri-kuaile',
  title: 'HSK 2 - Bài 6: 小雪，生日快乐！',
  level: 'HSK 2',
  description: 'Bài tập 5 kỹ năng HSK2 Bài 6: 小雪，生日快乐！',
  instruction: 'Làm theo đúng thứ tự: từ vựng → nghe → đọc → viết → nói → dịch. Phần nghe dùng kịch bản trong đáp án để gắn audio; phần tự luận, nói và dịch có đáp án tham khảo, ý bắt buộc, giải thích và thang điểm cho giáo viên.',
  mcQuestions: [],
  vocabList: [
    vocab('生日', 'shēngrì', 'sinh nhật', 'Danh từ'), vocab('忘', 'wàng', 'quên', 'Động từ'),
    vocab('画', 'huà', 'vẽ; bức tranh', 'Động từ/Danh từ'), vocab('画笔', 'huàbǐ', 'bút vẽ, bút màu', 'Danh từ'),
    vocab('蛋糕', 'dàngāo', 'bánh ngọt, bánh sinh nhật', 'Danh từ'), vocab('快乐', 'kuàilè', 'vui vẻ, hạnh phúc', 'Tính từ'),
    vocab('打开', 'dǎkāi', 'mở ra', 'Động từ'), vocab('长', 'cháng', 'dài', 'Tính từ'),
    vocab('鱼', 'yú', 'cá', 'Danh từ'), vocab('肉', 'ròu', 'thịt', 'Danh từ'),
    vocab('过', 'guò', 'trải qua, đón (sinh nhật/lễ/tết)', 'Động từ'), vocab('地', 'de', 'trợ từ kết cấu, đứng trước động từ', 'Trợ từ'),
    vocab('床', 'chuáng', 'giường', 'Danh từ'), vocab('舒服', 'shūfu', 'thoải mái, dễ chịu', 'Tính từ')
  ],
  fillQuestions: [],
  listeningQuestions: [
    listeningGroup('hsk2_b6_listen_01', 'Bài 1 · 听短文，判断对错', '明天是我妹妹的生日。我给她准备了一个礼物，是一支画笔，因为她喜欢画画。我还买了一个大大的生日蛋糕。我忘了买鱼，所以一会儿还要出去一下。', 'listening_tf', [
      listeningTf('hsk2_b6_listen_01_01', '明天是妹妹的生日。', true),
      listeningTf('hsk2_b6_listen_01_02', '他给妹妹准备了画笔。', true),
      listeningTf('hsk2_b6_listen_01_03', '妹妹不喜欢画画。', false),
      listeningTf('hsk2_b6_listen_01_04', '他买了一个很小的蛋糕。', false),
      listeningTf('hsk2_b6_listen_01_05', '他没有忘了买鱼。', false)
    ]),
    listeningGroup('hsk2_b6_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：明天就是女儿的生日了。男：你不说，我还真忘了。', 'listening_mc', [
      listeningMc('hsk2_b6_listen_02_01', '男的怎么了？', ['忘了明天是女儿的生日', '买了礼物', '不想过生日'], 0)
    ]),
    listeningGroup('hsk2_b6_listen_03', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：她喜欢画画，你觉得画笔怎么样？男：就送画笔吧！', 'listening_mc', [
      listeningMc('hsk2_b6_listen_02_02', '他们想送什么礼物？', ['蛋糕', '画笔', '书包'], 1)
    ]),
    listeningGroup('hsk2_b6_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '男：你打开看看喜欢不喜欢。女：画笔！我很喜欢！', 'listening_mc', [
      listeningMc('hsk2_b6_listen_02_03', '女的喜欢礼物吗？', ['喜欢', '不喜欢', '不知道'], 0)
    ]),
    listeningGroup('hsk2_b6_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：桌子上有鱼啊肉啊什么的，都是你喜欢吃的。女：谢谢！', 'listening_mc', [
      listeningMc('hsk2_b6_listen_02_04', '桌子上有什么？', ['鱼和肉', '蛋糕和水果', '画笔'], 0)
    ]),
    listeningGroup('hsk2_b6_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 5)', '女：过生日真好啊！男：是的，过生日就要吃好吃的，还要高高兴兴地玩。', 'listening_mc', [
      listeningMc('hsk2_b6_listen_02_05', '过生日要做什么？', ['吃好吃的，高高兴兴地玩', '去上班', '早早睡觉'], 0)
    ])
  ],
  arrangeQuestions: [
    arrange('hsk2_b6_arr_01', '蛋糕 / 我 / 大大的 / 一个 / 买了', ['蛋糕', '我', '大大的', '一个', '买了', '。'], '我买了一个大大的蛋糕。'),
    arrange('hsk2_b6_arr_02', '高高兴兴 / 孩子们 / 蛋糕 / 地 / 吃', ['高高兴兴', '孩子们', '蛋糕', '地', '吃', '。'], '孩子们高高兴兴地吃蛋糕。'),
    arrange('hsk2_b6_arr_03', '生日 / 小雪 / 明天 / 是 / 的', ['生日', '小雪', '明天', '是', '的', '。'], '明天是小雪的生日。'),
    arrange('hsk2_b6_arr_04', '肉 / 桌子上 / 鱼 / 有 / 什么的 / 啊 / 啊', ['肉', '桌子上', '鱼', '有', '什么的', '啊', '啊', '。'], '桌子上有鱼啊肉啊什么的。'),
    arrange('hsk2_b6_arr_05', '画笔 / 画画 / 她 / 用 / 喜欢', ['画笔', '画画', '她', '用', '喜欢', '。'], '她喜欢用画笔画画。')
  ],
  readingPassages: [reading(
    'hsk2_b6_reading',
    'II. 阅读 · Bài 1–3: Đọc hiểu',
    '小雪今天过生日。爸爸妈妈送她一支画笔，她很喜欢，说想画一个家。晚上，一家人高高兴兴地吃了蛋糕，桌子上还有鱼啊肉啊什么的。吃完饭，孩子们很累，早早地就上床了。',
    [
      mc('hsk2_b6_read_tf_01', '小雪今天过生日。', ['✓', '✗'], 0),
      mc('hsk2_b6_read_tf_02', '爸爸妈妈送了小雪一个书包。', ['✓', '✗'], 1),
      mc('hsk2_b6_read_tf_03', '孩子们很晚才上床。', ['✓', '✗'], 1),
      mc('hsk2_b6_read_mc_01', '小雪想画什么？', ['一个家', '一条鱼', '一只猫'], 0),
      mc('hsk2_b6_read_mc_02', '晚上桌子上有什么？', ['鱼啊肉啊什么的', '面条和水果', '只有蛋糕'], 0),
      mc('hsk2_b6_read_mc_03', '孩子们为什么早早地上床？', ['因为他们很累', '因为明天上学', '因为要出去玩'], 0),
      fill('hsk2_b6_read_fill_01', '明天是我的（　），我想请朋友来家里。', '生日', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_02', '你别（　）了给妈妈打电话。', '忘', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_03', '她喜欢（　）画，也喜欢看书。', '画', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_04', '我想买几支（　），送给爱画画的朋友。', '画笔', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_05', '桌子上有一个大大的生日（　）。', '蛋糕', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_06', '小雪，生日（　）！', '快乐', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_07', '你（　）礼物看看，喜欢不喜欢。', '打开', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_08', '这条裤子太（　）了，有点儿不好看。', '长', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_09', '妈妈买了一条（　），晚上做饭。', '鱼', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_10', '我不太喜欢吃（　），但是爸爸很喜欢。', '肉', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_11', '你什么时候（　）生日？', '过', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_12', '孩子们高高兴兴（　）吃蛋糕。', '地', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_13', '弟弟在（　）上睡觉。', '床', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
      fill('hsk2_b6_read_fill_14', '这张床很（　），我想睡一觉。', '舒服', bai6ReadingWordBank, 'tier1', { fillGroup: 'hsk2-b6-read-fill', fillGroupTitle: 'Bài 3 · 选词填空' })
    ],
    bai6ReadingWordBank
  )],
  essayQuestions: [
    ...[
      ['hsk2_b6_error_01', '我高兴的吃蛋糕。', '我高高兴兴地吃蛋糕。', 'Dùng 地 trước động từ để nói cách thức thực hiện hành động.'],
      ['hsk2_b6_error_02', '桌子上有什么的？', '桌子上有什么？', '什么的 đứng cuối danh sách với nghĩa “vân vân”, không dùng thay cho 什么 để hỏi.'],
      ['hsk2_b6_error_03', '我过了生日。', '我过生日了。', '过生日 là cụm động-tân; 了 đặt ở cuối câu.'],
      ['hsk2_b6_error_04', '我喜欢画笔画画。', '我喜欢用画笔画画。', 'Dùng 用 để nói “dùng bút vẽ để vẽ”.'],
      ['hsk2_b6_error_05', '我买了一块床。', '我买了一张床。', '床 dùng lượng từ 张; 块 dùng cho miếng bánh hoặc miếng thịt.']
    ].map(([id, sentence, answer, explanation]) => errorCorrection(id, sentence, false, answer, {
      taskGroup: 'bai6-error-correction',
      taskGroupTitle: 'III. 写作 · Bài 2: 改错句',
      explanation
    })),
    essay('hsk2_b6_writing', '写一写你（或家人）过生日的一天。Dùng ít nhất 5 trong các từ/cấu trúc sau: 生日、忘、画笔、蛋糕、快乐、打开、过、什么的、地、舒服。', '昨天是我的生日，朋友们都来了。妈妈买了一个大大的蛋糕，还做了鱼啊肉啊什么的。朋友送我一支画笔，我打开看了看，很喜欢。大家高高兴兴地吃饭、玩，我过了很快乐的一天。', {
      taskGroup: 'bai6-writing',
      taskGroupTitle: 'III. 写作 · Bài 3: 写短文',
      requiredElements: ['Đủ khoảng 60–80 chữ', 'Dùng ít nhất 5 từ/cấu trúc yêu cầu', 'Kể được một ngày sinh nhật của bản thân hoặc người nhà'],
      explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.',
      rubric: bai6WritingRubric,
      maxScore: 10
    })
  ],
  speakingQuestions: [
    ...[
      '明天就是女儿的生日了。',
      '你不说，我还真忘了。',
      '你打开看看喜欢不喜欢。',
      '还有鱼啊肉啊什么的，都是你喜欢吃的。',
      '过生日真好啊！',
      '过生日就要吃好吃的，还要高高兴兴地玩。'
    ].map((prompt, index) => ({
      ...speaking(`hsk2_b6_speaking_${String(index + 1).padStart(2, '0')}`, prompt),
      taskGroupTitle: 'IV. 口语 · Bài 1: 录音',
      requiredElements: ['Đọc đủ câu', 'Thanh điệu và ngữ điệu rõ'],
      explanation: 'Chấm thanh điệu và ngữ điệu. Lưu ý: 你打开 đọc ní dǎkāi; 鱼啊 đọc yú ya; 肉啊 đọc ròu wa; âm tiết sau của 舒服 đọc nhẹ; câu có 啊 kết thúc tự nhiên.',
      rubric: bai6SpeakingRubric,
      maxScore: 10
    })),
    speaking('hsk2_b6_speaking_07', '过 → 明天我______。', {
      taskGroup: 'bai6-guided-speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子',
      suggestedAnswer: '明天我过生日。', referenceAnswers: ['明天我过生日。'], requiredElements: ['过生日'], rubric: bai6GuidedSpeakingRubric, maxScore: 10
    }),
    speaking('hsk2_b6_speaking_08', '忘 → 你别______。', {
      taskGroup: 'bai6-guided-speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子',
      suggestedAnswer: '你别忘了给妈妈打电话。', referenceAnswers: ['你别忘了给妈妈打电话。'], requiredElements: ['别忘了'], rubric: bai6GuidedSpeakingRubric, maxScore: 10
    }),
    speaking('hsk2_b6_speaking_09', '什么的 → 桌子上有______。', {
      taskGroup: 'bai6-guided-speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子',
      suggestedAnswer: '桌子上有鱼、肉、水果什么的。', referenceAnswers: ['桌子上有鱼、肉、水果什么的。'], requiredElements: ['什么的 đứng cuối danh sách'], rubric: bai6GuidedSpeakingRubric, maxScore: 10
    }),
    speaking('hsk2_b6_speaking_10', '地 → 孩子们______吃蛋糕。', {
      taskGroup: 'bai6-guided-speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子',
      suggestedAnswer: '孩子们高高兴兴地吃蛋糕。', referenceAnswers: ['孩子们高高兴兴地吃蛋糕。'], requiredElements: ['高高兴兴地'], rubric: bai6GuidedSpeakingRubric, maxScore: 10
    }),
    speaking('hsk2_b6_speaking_11', '舒服 → 这张床______。', {
      taskGroup: 'bai6-guided-speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子',
      suggestedAnswer: '这张床很舒服。', referenceAnswers: ['这张床很舒服。'], requiredElements: ['很舒服'], rubric: bai6GuidedSpeakingRubric, maxScore: 10
    })
  ],
  translationQuestions: [
    translation('hsk2_b6_translation_01', '明天就是女儿的生日了。', 'Ngày mai đã là sinh nhật con gái rồi.', 'zh_to_vi_text', { taskGroup: 'bai6-translation-text-zh-vi', taskGroupTitle: 'V. 翻译 · Bài 1: 中文 → 越南语', rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_02', '你不说，我还真忘了。', 'Bạn không nói thì tôi thật sự đã quên mất rồi.', 'zh_to_vi_text', { taskGroup: 'bai6-translation-text-zh-vi', taskGroupTitle: 'V. 翻译 · Bài 1: 中文 → 越南语', rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_03', '过生日就要吃好吃的，还要高高兴兴地玩。', 'Đón sinh nhật thì phải ăn đồ ngon, còn phải vui vẻ vui chơi.', 'zh_to_vi_text', { taskGroup: 'bai6-translation-text-zh-vi', taskGroupTitle: 'V. 翻译 · Bài 1: 中文 → 越南语', rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_04', 'Chúc mừng sinh nhật!', '生日快乐！', 'vi_to_zh_text', { taskGroup: 'bai6-translation-text-vi-zh', taskGroupTitle: 'V. 翻译 · Bài 2A: 越南语 → 中文', rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_05', 'Bạn mở quà ra xem đi.', '你打开礼物看看吧。', 'vi_to_zh_text', { taskGroup: 'bai6-translation-text-vi-zh', taskGroupTitle: 'V. 翻译 · Bài 2A: 越南语 → 中文', rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_06', 'Trên bàn có cá, thịt vân vân.', '桌子上有鱼啊肉啊什么的。', 'vi_to_zh_text', { taskGroup: 'bai6-translation-text-vi-zh', taskGroupTitle: 'V. 翻译 · Bài 2A: 越南语 → 中文', referenceAnswers: ['桌子上有鱼啊肉啊什么的。', '桌子上有鱼、肉什么的。'], acceptedVariants: ['桌子上有鱼、肉什么的。'], rubric: bai6TextTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_07', 'Bọn trẻ vui vẻ ăn bánh.', '孩子们高高兴兴地吃蛋糕。', 'vi_to_zh_audio', { taskGroup: 'bai6-translation-audio', taskGroupTitle: 'V. 翻译 · Bài 2B: Ghi âm Việt → Trung', requiredElements: ['高高兴兴地', '吃蛋糕'], explanation: 'Giáo viên chấm đúng nghĩa 5 điểm, thanh điệu và phát âm 3 điểm, nói trôi chảy và đúng ngữ pháp 2 điểm.', rubric: bai6AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_08', 'Cô ấy thích dùng bút vẽ để vẽ.', '她喜欢用画笔画画。', 'vi_to_zh_audio', { taskGroup: 'bai6-translation-audio', taskGroupTitle: 'V. 翻译 · Bài 2B: Ghi âm Việt → Trung', requiredElements: ['用画笔', '画画'], explanation: 'Giáo viên chấm đúng nghĩa 5 điểm, thanh điệu và phát âm 3 điểm, nói trôi chảy và đúng ngữ pháp 2 điểm.', rubric: bai6AudioTranslationRubric, maxScore: 10 }),
    translation('hsk2_b6_translation_09', 'Chiếc giường này rất thoải mái.', '这张床很舒服。', 'vi_to_zh_audio', { taskGroup: 'bai6-translation-audio', taskGroupTitle: 'V. 翻译 · Bài 2B: Ghi âm Việt → Trung', requiredElements: ['这张床', '很舒服'], explanation: 'Giáo viên chấm đúng nghĩa 5 điểm, thanh điệu và phát âm 3 điểm, nói trôi chảy và đúng ngữ pháp 2 điểm.', rubric: bai6AudioTranslationRubric, maxScore: 10 })
  ]
};

export const HSK2_BAI4_TO_6_EXAMS: ExamLesson[] = [HSK2_BAI4_EXAM, HSK2_BAI5_EXAM, HSK2_BAI6_EXAM];
