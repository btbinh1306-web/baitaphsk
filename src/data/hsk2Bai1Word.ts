import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const fill = (
  id: string,
  prompt: string,
  answer: string,
  wordBank: string[],
  acceptableAnswers = answer
): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  wordBank,
  answer,
  acceptableAnswers
});

const arrange = (id: string, prompt: string, wordChips: string[], answer: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips,
  acceptableAnswers: answer
});

const listeningGroup = (
  id: string,
  prompt: string,
  audioText: string,
  type: 'listening_tf' | 'listening_mc',
  subQuestions: Question[],
  audioUrl?: string
): Question => ({
  id,
  type,
  tier: 'tier2',
  prompt,
  audioText,
  audioUrl,
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

const speaking = (id: string, prompt: string, pinyin: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin,
  teacherReviewRequired: true,
  ...extra
});

const errorCorrection = (id: string, prompt: string, suggestedAnswer: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  errorCorrection: { sentenceIsCorrect: false },
  rubric: [
    { id: 'judgement', label: 'Phán đoán đúng/sai', maxScore: 4 },
    { id: 'correction', label: 'Sửa câu đúng', maxScore: 6 }
  ],
  ...extra
});

const essay = (id: string, prompt: string, suggestedAnswer: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  ...extra
});

const translation = (
  id: string,
  prompt: string,
  suggestedAnswer: string,
  translationType: 'vi_to_zh_text' | 'zh_to_vi_text' | 'vi_to_zh_audio' | 'zh_to_vi_audio',
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
  ...extra
});

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] =>
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }));

const vocabList = vocab([
  ['就', 'jiù', 'Phó từ', 'thì, liền, chỉ có', '吃完饭我就去图书馆看书。'],
  ['给', 'gěi', 'Động từ / giới từ', 'cho; với', '我给朋友打电话。'],
  ['让', 'ràng', 'Động từ', 'cho phép; bảo; nhường', '老师让我们说中文。'],
  ['接', 'jiē', 'Động từ', 'đón', '你开车来接我吧。'],
  ['吧', 'ba', 'Trợ từ', 'nhé; vậy sao', '你们就是她的学生吧？'],
  ['次', 'cì', 'Lượng từ', 'lần', '这是我第一次来中国。'],
  ['旅游', 'lǚyóu', 'Động từ', 'du lịch', '我们是来旅游的。'],
  ['帮忙', 'bāngmáng', 'Động từ ly hợp', 'giúp đỡ', '我想请你帮个忙。'],
  ['不好意思', 'bù hǎo yìsi', 'Cụm từ', 'thật ngại; xin lỗi', '不好意思，我已经到北京了。'],
  ['已经', 'yǐjīng', 'Phó từ', 'đã', '他已经去学校了。'],
  ['那', 'nà', 'Liên từ', 'vậy thì', '那我们明天再说吧。'],
  ['介绍', 'jièshào', 'Động từ', 'giới thiệu', '我给你介绍我的朋友。'],
  ['有时', 'yǒushí', 'Phó từ', 'có lúc', '我有时在家吃饭，有时去饭店吃。'],
  ['懂', 'dǒng', 'Động từ', 'hiểu', '我不太懂他的意思。'],
  ['意思', 'yìsi', 'Danh từ', 'ý nghĩa; ý', '我不明白这个词的意思。'],
  ['北京烤鸭', 'Běijīng kǎoyā', 'Danh từ', 'vịt quay Bắc Kinh', '她请我们吃了北京烤鸭。']
]);

const vocabBank = ['吧', '就', '给', '让', '接', '次', '旅游', '帮忙', '不好意思', '已经', '那', '介绍', '有时', '懂', '意思', '北京烤鸭'];
const writingFillBank = ['吧', '是', '的', '不', '叫', '让', '请'];

const mcQuestions: Question[] = [];

const fillQuestions: Question[] = [
  fill('hsk2_b1_word_fill_01', '你们就是她的学生（　）？', '吧', writingFillBank),
  fill('hsk2_b1_word_fill_02', '我们（　）来旅游（　）。', '是 / 的', writingFillBank, '是 / 的|是的|是 的'),
  fill('hsk2_b1_word_fill_03', '我们（　）是坐出租车去的。', '不', writingFillBank),
  fill('hsk2_b1_word_fill_04', '妈妈（　）孩子们回家。', '叫', writingFillBank, '叫|让'),
  fill('hsk2_b1_word_fill_05', '我想（　）你帮个忙。', '请', writingFillBank),
  fill('hsk2_b1_word_fill_06', '这件衣服在哪儿买（　）？', '的', writingFillBank)
];

const arrangeQuestions: Question[] = [
  arrange('hsk2_b1_word_arrange_01', '把词语排成句子。', ['来', '旅游', '的', '是', '我们'], '我们是来旅游的。|我们是来旅游的'),
  arrange('hsk2_b1_word_arrange_02', '把词语排成句子。', ['说', '老师', '中文', '让', '我们'], '老师让我们说中文。|老师让我们说中文'),
  arrange('hsk2_b1_word_arrange_03', '把词语排成句子。', ['给', '电话', '他', '打', '我'], '他给我打电话。|他给我打电话'),
  arrange('hsk2_b1_word_arrange_04', '把词语排成句子。', ['请', '北京烤鸭', '了', '吃', '她', '我们'], '她请我们吃了北京烤鸭。|她请我们吃了北京烤鸭'),
  arrange('hsk2_b1_word_arrange_05', '把词语排成句子。', ['北京', '的', '到', '昨天', '是', '他'], '他是昨天到北京的。|他是昨天到北京的')
];

const listeningQuestions: Question[] = [
  listeningGroup(
    'hsk2_b1_word_listen_01',
    'Bài 1 · 听短文，判断对错',
    '我叫白家月，今天早上到北京了。这是我第一次来北京，我是来旅游的，不是来学中文的。王老师的姐姐来接我们，她请我们吃了北京烤鸭。我们的中文不太好，有时不太懂她的意思。',
    'listening_tf',
    [
      listeningTf('hsk2_b1_word_listen_01_01', '白家月是今天早上到北京的。', true),
      listeningTf('hsk2_b1_word_listen_01_02', '白家月是来学中文的。', false),
      listeningTf('hsk2_b1_word_listen_01_03', '这是白家月第一次来北京。', true),
      listeningTf('hsk2_b1_word_listen_01_04', '是王老师来接她们的。', false),
      listeningTf('hsk2_b1_word_listen_01_05', '她们有时不太懂王一雪的意思。', true)
    ],
    '/audio/HSK2_B01/putonghua_bai_jiayue_kore.wav'
  ),
  listeningGroup(
    'hsk2_b1_word_listen_02',
    'Bài 2 · 听对话，选择正确答案 (Câu 1)',
    '请问，您是王老师吗？不是，我是他哥哥。你们是他的学生吧？对。',
    'listening_mc',
    [
      listeningMc('hsk2_b1_word_listen_02_01', '男的是谁？', ['王老师', '王老师的哥哥', '王老师的学生'], 1)
    ],
    '/audio/HSK2_B01/hsk2_b1_word_listen_02_01.mp3'
  ),
  listeningGroup(
    'hsk2_b1_word_listen_03',
    'Bài 2 · 听对话，选择正确答案 (Câu 2)',
    '你是第一次来北京吗？是的，我是来旅游的。',
    'listening_mc',
    [
      listeningMc('hsk2_b1_word_listen_02_02', '女的来北京做什么？', ['学中文', '工作', '旅游'], 2)
    ],
    '/audio/HSK2_B01/hsk2_b1_word_listen_02_02.mp3'
  ),
  listeningGroup(
    'hsk2_b1_word_listen_04',
    'Bài 2 · 听对话，选择正确答案 (Câu 3)',
    '你是什么时候到的？我是昨天晚上到的。',
    'listening_mc',
    [
      listeningMc('hsk2_b1_word_listen_02_03', '女的是什么时候到北京的？', ['今天早上', '昨天晚上', '明天下午'], 1)
    ],
    '/audio/HSK2_B01/hsk2_b1_word_listen_02_03.mp3'
  ),
  listeningGroup(
    'hsk2_b1_word_listen_05',
    'Bài 2 · 听对话，选择正确答案 (Câu 4)',
    '喂，你明天有时间吗？我想请你帮个忙。不好意思，我已经回家了。你可以给李文打个电话。',
    'listening_mc',
    [
      listeningMc('hsk2_b1_word_listen_02_04', '男的现在在哪儿？', ['学校', '家', '北京'], 1)
    ],
    '/audio/HSK2_B01/hsk2_b1_word_listen_02_04.mp3'
  ),
  listeningGroup(
    'hsk2_b1_word_listen_06',
    'Bài 2 · 听对话，选择正确答案 (Câu 5)',
    '老师，我们的中文不太好。没关系，我让你们多说中文，这样就会越来越好。',
    'listening_mc',
    [
      listeningMc('hsk2_b1_word_listen_02_05', '老师为什么让学生说中文？', ['因为老师不懂中文', '因为学生想学好中文', '因为学生是中国人'], 1)
    ],
    '/audio/HSK2_B01/hsk2_b1_word_listen_02_05.mp3'
  )
];

const readingContent = '我叫李明，是越南人。这是我第一次来中国，我是来旅游的。昨天下午，我已经到北京了。朋友张华给我打电话，让我在机场等他。他开车来接我，还请我吃了北京烤鸭。他给我介绍了很多北京的地方。有时他说得太快，我不太懂他的意思，他就再说一次。我很高兴。';

const readingPassages: ReadingPassage[] = [{
  id: 'hsk2_b1_word_reading',
  title: 'III. 阅读 · Bài 1–2: Đọc hiểu',
  content: readingContent,
  questions: [
    { id: 'hsk2_b1_word_read_tf_01', type: 'mc', tier: 'tier1', prompt: '李明是中国人。', options: ['✓', '✗'], answer: 1 },
    { id: 'hsk2_b1_word_read_tf_02', type: 'mc', tier: 'tier1', prompt: '李明是来旅游的。', options: ['✓', '✗'], answer: 0 },
    { id: 'hsk2_b1_word_read_tf_03', type: 'mc', tier: 'tier1', prompt: '李明是今天早上到北京的。', options: ['✓', '✗'], answer: 1 },
    { id: 'hsk2_b1_word_read_tf_04', type: 'mc', tier: 'tier1', prompt: '张华开车来接李明。', options: ['✓', '✗'], answer: 0 },
    { id: 'hsk2_b1_word_read_tf_05', type: 'mc', tier: 'tier1', prompt: '张华没有给李明介绍北京。', options: ['✓', '✗'], answer: 1 },
    mc('hsk2_b1_word_read_mc_01', '张华让李明做什么？', ['在机场等他', '去学校找他', '给他打电话'], 0),
    mc('hsk2_b1_word_read_mc_02', '李明为什么有时不太懂张华的意思？', ['因为他不说中文', '因为张华有时说得太快', '因为他没有时间'], 1),
    mc('hsk2_b1_word_read_mc_03', '张华请李明吃了什么？', ['饺子', '面条', '北京烤鸭'], 2),
  ]
}];

const translationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm (nếu ghi âm)', maxScore: 3 },
  { id: 'fluency', label: 'Nói/viết trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

const speakingQuestions: Question[] = [
  speaking('hsk2_b1_word_speak_01', 'Đọc và ghi âm: 你们就是她的学生吧？', 'Nǐmen jiù shì tā de xuésheng ba?', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['你们就是她的学生吧？'],
    requiredElements: ['Đọc đủ câu', 'Câu hỏi với 吧 lên giọng cuối câu'],
    explanation: 'Chấm theo thanh điệu và ngữ điệu. Câu hỏi có 吧 hoặc 吗 lên giọng ở cuối câu.',
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'intonation', label: 'Ngữ điệu câu hỏi', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_02', 'Đọc và ghi âm: 一飞给我打电话了，让我来接你们。', 'Yī Fēi gěi wǒ dǎ diànhuà le, ràng wǒ lái jiē nǐmen。', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['一飞给我打电话了，让我来接你们。'],
    requiredElements: ['给 + người nhận + 打电话', '让 + người + động từ'],
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'grammar', label: 'Đọc đúng cấu trúc', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_03', 'Đọc và ghi âm: 你们是第一次来北京吗？', 'Nǐmen shì dì yī cì lái Běijīng ma?', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['你们是第一次来北京吗？'],
    requiredElements: ['第一次', '吗 lên giọng cuối câu'],
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'intonation', label: 'Ngữ điệu câu hỏi', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_04', 'Đọc và ghi âm: 我们不是来学中文的，我们是来旅游的。', 'Wǒmen bú shì lái xué Zhōngwén de, wǒmen shì lái lǚyóu de。', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['我们不是来学中文的，我们是来旅游的。'],
    requiredElements: ['不是……的', '是来旅游的'],
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'grammar', label: 'Đọc đúng 是……的', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_05', 'Đọc và ghi âm: 不好意思，我已经到北京了。', 'Bù hǎoyìsi, wǒ yǐjīng dào Běijīng le。', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['不好意思，我已经到北京了。'],
    requiredElements: ['不好意思', '已经……了'],
    explanation: '不好意思 đọc bù hǎoyìsi; 不 giữ thanh 4 vì đứng trước thanh 3.',
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'pronunciation', label: 'Đọc đúng 不好意思', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_06', 'Đọc và ghi âm: 她请我们吃了北京烤鸭，还给我们介绍了很多东西。', 'Tā qǐng wǒmen chī le Běijīng kǎoyā, hái gěi wǒmen jièshào le hěn duō dōngxi。', {
    taskGroup: 'reading_aloud',
    taskGroupTitle: 'II. 口语 · Bài 1: Đọc và ghi âm',
    referenceAnswers: ['她请我们吃了北京烤鸭，还给我们介绍了很多东西。'],
    requiredElements: ['请 + người + động từ', '还给我们介绍'],
    rubric: [
      { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 5 },
      { id: 'grammar', label: 'Đọc đúng 请 và 给', maxScore: 3 },
      { id: 'completeness', label: 'Đọc đủ câu', maxScore: 2 }
    ]
  }),
  speaking('hsk2_b1_word_speak_07', 'Dùng 让 nói câu: 老师______________。', 'Lǎoshī __________。', {
    taskGroup: 'sentence_speaking',
    taskGroupTitle: 'II. 口语 · Bài 2: Dùng từ gợi ý nói câu',
    referenceAnswers: ['老师让我们说中文。'],
    requiredElements: ['让 + người + động từ'],
    grammarTargets: ['兼语句'],
    rubric: [
      { id: 'content', label: 'Đủ ý và đúng từ 让', maxScore: 4 },
      { id: 'grammar', label: 'Đúng cấu trúc câu', maxScore: 3 },
      { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
    ]
  }),
  speaking('hsk2_b1_word_speak_08', 'Dùng 给 nói câu: 我______________。', 'Wǒ __________。', {
    taskGroup: 'sentence_speaking',
    taskGroupTitle: 'II. 口语 · Bài 2: Dùng từ gợi ý nói câu',
    referenceAnswers: ['我给朋友打电话。'],
    requiredElements: ['给 + người nhận + động từ'],
    grammarTargets: ['给字句'],
    rubric: [
      { id: 'content', label: 'Đủ ý và đúng từ 给', maxScore: 4 },
      { id: 'grammar', label: 'Đúng cấu trúc câu', maxScore: 3 },
      { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
    ]
  }),
  speaking('hsk2_b1_word_speak_09', 'Dùng 帮忙 nói câu: 不好意思，______________。', 'Bù hǎoyìsi, __________。', {
    taskGroup: 'sentence_speaking',
    taskGroupTitle: 'II. 口语 · Bài 2: Dùng từ gợi ý nói câu',
    referenceAnswers: ['不好意思，我今天没时间帮忙。'],
    requiredElements: ['不好意思', '帮忙'],
    rubric: [
      { id: 'content', label: 'Đủ ý và dùng đúng 帮忙', maxScore: 4 },
      { id: 'grammar', label: 'Câu hoàn chỉnh', maxScore: 3 },
      { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
    ]
  }),
  speaking('hsk2_b1_word_speak_10', 'Dùng 有时……有时…… nói câu: 我______________。', 'Wǒ __________。', {
    taskGroup: 'sentence_speaking',
    taskGroupTitle: 'II. 口语 · Bài 2: Dùng từ gợi ý nói câu',
    referenceAnswers: ['我有时坐公共汽车上班，有时开车上班。'],
    requiredElements: ['有时……有时……'],
    grammarTargets: ['有时……有时……'],
    rubric: [
      { id: 'content', label: 'Đủ hai vế câu', maxScore: 4 },
      { id: 'grammar', label: 'Dùng đúng 有时……有时……', maxScore: 3 },
      { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
    ]
  }),
  speaking('hsk2_b1_word_speak_11', 'Dùng 已经 nói câu: 他______________。', 'Tā __________。', {
    taskGroup: 'sentence_speaking',
    taskGroupTitle: 'II. 口语 · Bài 2: Dùng từ gợi ý nói câu',
    referenceAnswers: ['他已经去学校了。'],
    requiredElements: ['已经……了'],
    grammarTargets: ['已经……了'],
    rubric: [
      { id: 'content', label: 'Đủ ý và dùng đúng 已经', maxScore: 4 },
      { id: 'grammar', label: 'Có 了 phù hợp', maxScore: 3 },
      { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 3 }
    ]
  })
];

const essayQuestions: Question[] = [
  errorCorrection('hsk2_b1_word_error_01', '我请你帮忙一个。', '我请你帮个忙。', {
    taskGroup: 'writing_error_correction',
    taskGroupTitle: 'Bài 3 · 改错句: Tìm lỗi sai và sửa lại'
  }),
  errorCorrection('hsk2_b1_word_error_02', '他已经去学校。', '他已经去学校了。', {
    taskGroup: 'writing_error_correction',
    taskGroupTitle: 'Bài 3 · 改错句: Tìm lỗi sai và sửa lại'
  }),
  errorCorrection('hsk2_b1_word_error_03', '我们是坐出租车去。', '我们是坐出租车去的。', {
    taskGroup: 'writing_error_correction',
    taskGroupTitle: 'Bài 3 · 改错句: Tìm lỗi sai và sửa lại'
  }),
  errorCorrection('hsk2_b1_word_error_04', '我们不坐出租车去的。', '我们不是坐出租车去的。', {
    taskGroup: 'writing_error_correction',
    taskGroupTitle: 'Bài 3 · 改错句: Tìm lỗi sai và sửa lại'
  }),
  errorCorrection('hsk2_b1_word_error_05', '我给打电话朋友。', '我给朋友打电话。', {
    taskGroup: 'writing_error_correction',
    taskGroupTitle: 'Bài 3 · 改错句: Tìm lỗi sai và sửa lại'
  }),
  essay(
    'hsk2_b1_word_essay_01',
    'Viết đoạn văn 60–80 chữ: 介绍你第一次去一个地方旅游的经历。Dùng ít nhất 5 từ/cấu trúc: 第一次、是……的、让、给、已经、有时、介绍、请。',
    '这是我第一次来北京，我是来旅游的。我是昨天下午到的，朋友来机场接我。他请我吃了北京烤鸭，还给我介绍了很多好玩的地方。他的中文很好，有时我不太懂他的意思，他就再说一次。我已经喜欢上北京了。',
    {
      taskGroup: 'writing_composition',
      taskGroupTitle: 'Bài 5 · 写短文: Viết đoạn văn 60–80 chữ',
      requiredElements: ['Độ dài 60–80 chữ', 'Dùng ít nhất 5 từ/cấu trúc yêu cầu', 'Kể được trải nghiệm đi du lịch lần đầu'],
      grammarTargets: ['第一次', '是……的', '让', '给', '已经', '有时', '介绍', '请'],
      explanation: 'Thang chấm 10 điểm: nội dung đủ ý 3 điểm; dùng đúng ít nhất 5 từ/cấu trúc yêu cầu 3 điểm; ngữ pháp đúng 2 điểm; chữ Hán và dấu câu 2 điểm.',
      rubric: [
        { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
        { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', maxScore: 3 },
        { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
        { id: 'hanzi', label: 'Chữ Hán và dấu câu', maxScore: 2 }
      ],
      maxScore: 10
    }
  )
];

const translationQuestions: Question[] = [
  translation('hsk2_b1_word_translate_01', 'Dịch đánh máy Trung → Việt: 你们就是她的学生吧？', 'Các bạn chính là học sinh của cô ấy phải không?', 'zh_to_vi_text'),
  translation('hsk2_b1_word_translate_02', 'Dịch đánh máy Trung → Việt: 一飞给我打电话了，让我来接你们。', 'Nhất Phi đã gọi điện cho tôi, bảo tôi đến đón các bạn.', 'zh_to_vi_text'),
  translation('hsk2_b1_word_translate_03', 'Dịch đánh máy Trung → Việt: 我们不是来学中文的，我们是来旅游的。', 'Chúng tôi không phải đến để học tiếng Trung, chúng tôi đến để du lịch.', 'zh_to_vi_text'),
  translation('hsk2_b1_word_translate_07', 'Dịch đánh máy Việt → Trung: Đây là lần đầu tiên tôi đến Trung Quốc.', '这是我第一次来中国。', 'vi_to_zh_text', {
    grammarTargets: ['第一次']
  }),
  translation('hsk2_b1_word_translate_08', 'Dịch đánh máy Việt → Trung: Bạn đến lúc nào? Tôi đến vào sáng nay.', '你是什么时候到的？我是今天早上到的。', 'vi_to_zh_text', {
    grammarTargets: ['是……的'],
    requiredElements: ['的 ở cuối câu hỏi và câu trả lời']
  }),
  translation('hsk2_b1_word_translate_09', 'Dịch đánh máy Việt → Trung: Mẹ bảo tôi nghỉ ngơi nhiều hơn.', '妈妈让我多休息。', 'vi_to_zh_text', {
    grammarTargets: ['兼语句', '让 + người + động từ']
  }),
  translation('hsk2_b1_word_translate_10', 'Dịch ghi âm Việt → Trung: Tôi muốn nhờ bạn giúp một việc.', '我想请你帮个忙。', 'vi_to_zh_audio', {
    taskGroup: 'translation_audio',
    translationType: 'vi_to_zh_audio',
    grammarTargets: ['请 + người + động từ'],
    requiredElements: ['帮个忙'],
    explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.',
    rubric: translationRubric
  }),
  translation('hsk2_b1_word_translate_11', 'Dịch ghi âm Việt → Trung: Cô ấy đã mời chúng tôi ăn vịt quay Bắc Kinh.', '她请我们吃了北京烤鸭。', 'vi_to_zh_audio', {
    taskGroup: 'translation_audio',
    translationType: 'vi_to_zh_audio',
    requiredElements: ['请我们吃了北京烤鸭'],
    explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.',
    rubric: translationRubric
  }),
  translation('hsk2_b1_word_translate_12', 'Dịch ghi âm Việt → Trung: Hôm nay bạn không có thời gian, vậy thì ngày mai chúng ta nói tiếp.', '你今天没有时间，那我们明天再说吧。', 'vi_to_zh_audio', {
    taskGroup: 'translation_audio',
    translationType: 'vi_to_zh_audio',
    grammarTargets: ['那……吧'],
    explanation: 'Giáo viên chấm theo 3 tiêu chí: đúng nghĩa, đúng thanh điệu và nói trôi chảy.',
    rubric: translationRubric
  })
];

export const HSK2_BAI1_WORD_EXAMS: ExamLesson[] = [{
  id: 'hsk2-bai1-word',
  title: 'HSK 2 - Bài 1: 她请我们吃了北京烤鸭',
  level: 'HSK 2',
  description: 'Bài tập 5 kỹ năng theo văn bản ngày 04/11/2026: nghe, nói, đọc, viết và dịch; có đáp án, kịch bản nghe và hướng dẫn chấm tự luận.',
  instruction: 'Nghe: giáo viên đọc mỗi đoạn/hội thoại 2 lần ở tốc độ vừa phải; học sinh chỉ xem câu hỏi. Câu nói, viết và dịch là câu mở, giáo viên chấm theo hướng dẫn hiển thị trong phần chấm bài.',
  vocabList,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages,
  listeningQuestions,
  essayQuestions,
  speakingQuestions,
  translationQuestions
}];
