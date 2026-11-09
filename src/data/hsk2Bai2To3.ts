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
  tier: Question['tier'] = 'tier1',
  extra: Partial<Question> = {}
): Question => ({
  id,
  type: 'fill',
  tier,
  prompt,
  answer,
  acceptableAnswers: answer,
  wordBank,
  ...extra
});

const arrange = (id: string, wordChips: string[], answer: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt: 'Sắp xếp thành câu hoàn chỉnh.',
  wordChips,
  acceptableAnswers: `${answer}|${answer.replace(/[。？！?!]$/, '')}`
});

const essay = (id: string, prompt: string, suggestedAnswer: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  referenceAnswers: [suggestedAnswer],
  teacherReviewRequired: true,
  requiredElements: ['Trả lời đủ yêu cầu đề bài'],
  explanation: 'Chấp nhận cách diễn đạt khác nếu đúng nội dung, ngữ pháp và từ vựng theo yêu cầu.',
  rubric: [
    { id: 'content', label: 'Nội dung đúng ý', maxScore: 4 },
    { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 3 },
    { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 3 }
  ],
  maxScore: 10,
  ...extra
});

const errorCorrection = (id: string, prompt: string, suggestedAnswer: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier2',
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
  maxScore: 10,
  ...extra
});

const translationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 6 },
  { id: 'grammar', label: 'Ngữ pháp và từ vựng', maxScore: 4 }
];

const speaking = (id: string, prompt: string, pinyin: string, extra: Partial<Question> = {}): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin,
  teacherReviewRequired: true,
  referenceAnswers: [prompt.replace(/^Đọc và ghi âm:\s*/u, '')],
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
  explanation: 'Chấp nhận cách dịch tương đương nếu đúng nghĩa và đúng ngữ pháp; bài ghi âm chấm thêm thanh điệu và độ trôi chảy.',
  rubric: translationRubric,
  maxScore: 10,
  ...extra
});

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] => (
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }))
);

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

const bai2Vocab = vocab([
  ['每', 'měi', 'Đại từ hạn định', 'mỗi, mọi', '我每天坐公交车去学校。'],
  ['公交车', 'gōngjiāochē', 'Danh từ', 'xe buýt', '这儿有到北京大学的公交车吗？'],
  ['但', 'dàn', 'Liên từ', 'nhưng, tuy nhiên', '有，但车站有点儿远。'],
  ['车站', 'chēzhàn', 'Danh từ', 'nhà ga, bến xe', '车站有点儿远。'],
  ['远', 'yuǎn', 'Tính từ', 'xa', '车站离这儿有点儿远。'],
  ['打车', 'dǎchē', 'Động từ', 'đi taxi, bắt taxi', '我们还是打车去吧。'],
  ['还是', 'háishi', 'Phó từ / liên từ', 'vẫn nên; hay là', '我们还是打车去吧。'],
  ['北京大学', 'Běijīng Dàxué', 'Danh từ riêng', 'Đại học Bắc Kinh', '我在北京大学学中文。'],
  ['请问', 'qǐngwèn', 'Cụm động từ', 'xin hỏi', '请问，这儿有公交车吗？'],
  ['啊', 'a', 'Trợ từ ngữ khí', 'nhỉ, quá, đấy', '学校里人真多啊！'],
  ['万', 'wàn', 'Số từ', 'vạn, mười nghìn', '北京大学有四万多名学生。'],
  ['名', 'míng', 'Lượng từ / danh từ', 'vị, người; tên', '她是一名外国学生。'],
  ['网上', 'wǎngshàng', 'Danh từ / trạng ngữ', 'trên mạng', '这些信息是网上看到的。'],
  ['外国', 'wàiguó', 'Danh từ', 'nước ngoài', '我是外国学生。'],
  ['间', 'jiān', 'Lượng từ', 'căn, phòng', '学校里有很多间教室。'],
  ['教室', 'jiàoshì', 'Danh từ', 'phòng học, lớp học', '我们在教室上课。'],
  ['票', 'piào', 'Danh từ', 'vé, phiếu', '电影票很便宜。'],
  ['别', 'bié', 'Phó từ', 'đừng, không nên', '别看电影了。'],
  ['过来', 'guòlái', 'Động từ', 'qua đây, đến đây', '你有时间过来看看吧。']
]);

const bai2ReadingWordBank = ['每', '但', '车站', '远', '打车', '还是', '请问', '啊', '万', '名', '外国', '间', '教室', '票', '别'];

const bai2Reading: ReadingPassage[] = [{
  id: 'hsk2_b2_reading_01',
  title: 'II. 阅读 · Bài 1–3: Đọc hiểu',
  content: '我是一名外国学生，在北京大学学中文。北京大学有四万多名学生，也有三千多名外国学生。我每天坐公交车去教室上课，但是车站有点儿远，下雨的时候我还是打车去。学校里有一家电影院，电影票很便宜，有的不到二十块钱。昨天朋友过来找我，我们想去看电影，但是已经很晚了，还是别去了。',
  wordBank: bai2ReadingWordBank,
  questions: [
    mc('hsk2_b2_read_01', '作者是中国学生。', ['✓', '✗'], 1),
    mc('hsk2_b2_read_02', '北京大学有四万多名学生。', ['✓', '✗'], 0),
    mc('hsk2_b2_read_03', '学校里有的电影票不到二十块钱。', ['✓', '✗'], 0),
    mc('hsk2_b2_read_04', '作者每天怎么去教室？', ['打车', '坐公交车', '走路'], 1),
    mc('hsk2_b2_read_05', '下雨的时候，作者怎么去教室？', ['打车', '坐公交车', '走路'], 0),
    mc('hsk2_b2_read_06', '昨天他们为什么没去看电影？', ['电影票太贵', '已经很晚了', '朋友没来'], 1),
    fill('hsk2_b2_read_fill_01', '我（　）天坐公交车上班。', '每', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_02', '今天很冷，（　）我还要出门。', '但', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_03', '（　）有很多人，我们快去吧。', '车站', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_04', '学校离我家太（　）了。', '远', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_05', '外面下雨了，我想（　）回家。', '打车', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_06', '你累了，（　）早点儿休息吧。', '还是', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_07', '（　），这儿有公交车吗？', '请问', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_08', '学校里人真多（　）！', '啊', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_09', '北京大学有四（　）多名学生。', '万', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_10', '她是一（　）老师。', '名', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_11', '他是（　）人，但是会说中文。', '外国', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_12', '那（　）教室很大。', '间', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_13', '我们在（　）里上课。', '教室', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_14', '这张电影（　）不贵。', '票', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b2_read_fill_15', '你（　）走，我们一起去。', '别', bai2ReadingWordBank, 'tier1', { fillGroup: 'hsk2_b2_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' })
  ]
}];

const bai2Listening: Question[] = [
  listeningGroup(
    'hsk2_b2_listen_01',
    'Bài 1 · 听短文，判断对错',
    '我叫安妮，是外国学生。我每天坐公交车去学校，但是今天下雨了，车站有点儿远，所以我打车去学校。我们学校有四万多名学生，教室也很大。学校里还有一家电影院，电影票很便宜，有的不到二十块钱。我想有时间去看一个电影。',
    'listening_tf',
    [
      listeningTf('hsk2_b2_listen_01_01', '安妮是中国学生。', false),
      listeningTf('hsk2_b2_listen_01_02', '安妮每天坐公交车去学校。', true),
      listeningTf('hsk2_b2_listen_01_03', '今天安妮坐公交车去学校。', false),
      listeningTf('hsk2_b2_listen_01_04', '她的学校有四万多名学生。', true),
      listeningTf('hsk2_b2_listen_01_05', '学校里的电影票很贵。', false)
    ]
  ),
  listeningGroup('hsk2_b2_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：请问，这儿有到北京大学的公交车吗？男：有，但是车站有点儿远。女：那我们还是打车去吧。', 'listening_mc', [
    listeningMc('hsk2_b2_listen_02_01', '他们为什么打车去？', ['车站有点儿远', '没有公交车', '打车很便宜'], 0)
  ]),
  listeningGroup('hsk2_b2_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：你是怎么知道的？男：是网上说的。', 'listening_mc', [
    listeningMc('hsk2_b2_listen_02_03', '男的是怎么知道的？', ['老师说的', '朋友说的', '网上说的'], 2)
  ]),
  listeningGroup('hsk2_b2_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '男：我们去看电影吧。女：还是别看电影了，我们去看看教室吧。', 'listening_mc', [
    listeningMc('hsk2_b2_listen_02_04', '女的想做什么？', ['看电影', '看教室', '打车回家'], 1)
  ]),
  listeningGroup('hsk2_b2_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '女：这张电影票多少钱？男：十八块钱，不到二十块。女：真便宜啊！', 'listening_mc', [
    listeningMc('hsk2_b2_listen_02_05', '电影票多少钱？', ['十八块', '二十八块', '八块'], 0)
  ])
];

const bai3Vocab = vocab([
  ['回来', 'huílái', 'Động từ', 'quay lại, trở về đây', '你什么时候回来？'],
  ['回去', 'huíqù', 'Động từ', 'quay về, trở về đó', '天快黑了，我们回去吧。'],
  ['这么', 'zhème', 'Đại từ / trạng từ', 'như thế này, đến mức này', '今天这么热，我们别出去了。'],
  ['完', 'wán', 'Động từ / bổ ngữ kết quả', 'hết, xong', '我还没吃完饭。'],
  ['一起', 'yìqǐ', 'Phó từ', 'cùng nhau', '明天我们一起吃饭吧。'],
  ['出去', 'chūqù', 'Động từ', 'đi ra ngoài', '外面下雨了，别出去。'],
  ['洗', 'xǐ', 'Động từ', 'rửa, giặt', '吃饭前要洗手。'],
  ['自己', 'zìjǐ', 'Đại từ', 'bản thân, tự mình', '这本书是他自己买的。'],
  ['拿', 'ná', 'Động từ', 'cầm, lấy, mang', '你拿好票，我们去车站。'],
  ['手', 'shǒu', 'Danh từ', 'tay', '我的手很冷。'],
  ['为什么', 'wèishénme', 'Đại từ nghi vấn', 'tại sao, vì sao', '你为什么不去？'],
  ['不错', 'búcuò', 'Tính từ', 'khá tốt, không tệ', '今天天气不错。'],
  ['送', 'sòng', 'Động từ', 'đưa, tiễn; tặng', '明天我送你去车站。'],
  ['每', 'měi', 'Đại từ', 'mỗi, mọi', '老师给我们每人一本书。'],
  ['累', 'lèi', 'Tính từ', 'mệt', '我今天很累。']
]);

const bai3Reading: ReadingPassage[] = [{
  id: 'hsk2_b3_reading_01',
  title: 'II. 阅读 · Bài 1–3: Đọc hiểu',
  content: '刘明在医院工作，这个月他每天都很累。今天早上，他开车送孩子去学校，送完孩子回家后，医院来电话了，让他回去上班。晚上他回来很晚，王一雪的菜已经做好了，他洗了洗手就吃饭。吃完饭，他说想休息休息。',
  wordBank: ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'],
  questions: [
    mc('hsk2_b3_read_tf_01', '刘明这个月每天都很累。', ['✓', '✗'], 0),
    mc('hsk2_b3_read_tf_02', '刘明今天早上没有送孩子去学校。', ['✓', '✗'], 1),
    mc('hsk2_b3_read_tf_03', '医院让刘明回去上班。', ['✓', '✗'], 0),
    mc('hsk2_b3_read_mc_01', '刘明早上做了什么？', ['送孩子去学校', '去医院看病', '去买菜'], 0),
    mc('hsk2_b3_read_mc_02', '医院为什么来电话？', ['让他回去上班', '让他休息', '请他吃饭'], 0),
    mc('hsk2_b3_read_mc_03', '吃完饭以后，刘明想做什么？', ['出去玩', '休息休息', '回医院'], 1),
    fill('hsk2_b3_read_fill_01', '你什么时候（　）？我在家等你。', '回来', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_02', '天快黑了，我们（　）吧。', '回去', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_03', '今天（　）热，我们别出去了。', '这么', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_04', '我还没吃（　）饭。', '完', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_05', '明天我们（　）吃饭吧。', '一起', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_06', '外面下雨了，别（　）。', '出去', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_07', '吃饭前要（　）手。', '洗', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_08', '这本书是他（　）买的。', '自己', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_09', '你（　）好票，我们去车站。', '拿', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_10', '我的（　）很冷。', '手', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_11', '你（　）不去？因为我很累。', '为什么', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_12', '今天天气（　），我们出去走走吧。', '不错', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_13', '明天我（　）你去车站。', '送', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_14', '老师给我们（　）人一本书。', '每', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' }),
    fill('hsk2_b3_read_fill_15', '我今天很（　），想早点儿休息。', '累', ['回来', '回去', '这么', '完', '一起', '出去', '洗', '自己', '拿', '手', '为什么', '不错', '送', '每', '累'], 'tier1', { fillGroup: 'hsk2_b3_read_fill', fillGroupTitle: 'Bài 3 · 选词填空' })
  ]
}];

const bai3Listening: Question[] = [
  listeningGroup('hsk2_b3_listen_01', 'Bài 1 · 听短文，判断对错', '我叫小林，今天下班的时候，工作没做完，所以回来很晚。回到家，妈妈的菜已经做好了。我先洗了洗手，然后吃饭。吃完饭，我很累，想休息休息。明天我想和朋友一起出去玩。', 'listening_tf', [
    listeningTf('hsk2_b3_listen_01_01', '小林今天回来很早。', false),
    listeningTf('hsk2_b3_listen_01_02', '小林下班的时候，工作没做完。', true),
    listeningTf('hsk2_b3_listen_01_03', '妈妈的菜还没做好。', false),
    listeningTf('hsk2_b3_listen_01_04', '小林吃饭以前洗了手。', true),
    listeningTf('hsk2_b3_listen_01_05', '小林吃完饭想出去玩。', false)
  ]),
  listeningGroup('hsk2_b3_listen_02', 'Bài 2 · 听对话，选择正确答案 (Câu 1)', '女：你今天回来这么晚啊！男：工作太多了，没做完。', 'listening_mc', [
    listeningMc('hsk2_b3_listen_02_01', '男的为什么回来这么晚？', ['路太远', '工作没做完', '去看电影'], 1)
  ]),
  listeningGroup('hsk2_b3_listen_04', 'Bài 2 · 听对话，选择正确答案 (Câu 2)', '女：吃个苹果吧，我都洗好了。男：好的，我去洗洗手。', 'listening_mc', [
    listeningMc('hsk2_b3_listen_04_01', '男的要做什么？', ['洗手', '洗苹果', '买苹果'], 0)
  ]),
  listeningGroup('hsk2_b3_listen_05', 'Bài 2 · 听对话，选择正确答案 (Câu 3)', '女：为什么想去西安？男：我看了看网上的介绍，这个时候去西安很不错。', 'listening_mc', [
    listeningMc('hsk2_b3_listen_05_01', '男的为什么想去西安？', ['朋友在西安', '网上说这个时候去很不错', '有人送他票'], 1)
  ]),
  listeningGroup('hsk2_b3_listen_06', 'Bài 2 · 听对话，选择正确答案 (Câu 4)', '男：你怎么还不回去？女：我还没写完作业呢。', 'listening_mc', [
    listeningMc('hsk2_b3_listen_06_01', '女的为什么还不回去？', ['作业还没写完', '她很累', '没有车'], 0)
  ])
];

const bai3AudioTranslationRubric = [
  { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
  { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
  { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
];

export const HSK2_BAI2_TO_3_EXAMS: ExamLesson[] = [
  {
    id: 'hsk2-bai2-word',
    title: 'HSK 2 - Bài 2: 还是打车去北大吧',
    level: 'HSK 2',
    description: 'Bài tập 5 kỹ năng HSK2 Bài 2: 还是打车去北大吧.',
    instruction: 'Làm theo đúng thứ tự: từ vựng → nghe → đọc → viết → nói → dịch. Phần nghe hiện dùng kịch bản TTS; có thể thay bằng file audio sau.',
    vocabList: bai2Vocab,
    mcQuestions: [],
    fillQuestions: [],
    arrangeQuestions: [
      arrange('hsk2_b2_arrange_01', ['还是', '打车', '我们', '去吧', '。'], '我们还是打车去吧。'),
      arrange('hsk2_b2_arrange_02', ['四万', '北京大学', '名', '多', '学生', '有'], '北京大学有四万多名学生。'),
      arrange('hsk2_b2_arrange_03', ['卖', '他们', '电影票', '的', '很', '便宜'], '他们卖的电影票很便宜。'),
      arrange('hsk2_b2_arrange_04', ['每天', '我', '上班', '坐', '公交车'], '我每天坐公交车上班。'),
      arrange('hsk2_b2_arrange_05', ['离', '车站', '我家', '很', '远'], '车站离我家很远。')
    ],
    readingPassages: bai2Reading,
    listeningQuestions: bai2Listening,
    essayQuestions: [
      errorCorrection('hsk2_b2_error_01', '我坐公交车去上班每天。', '我每天坐公交车上班。'),
      errorCorrection('hsk2_b2_error_02', '车站很远离我家。', '车站离我家很远。'),
      errorCorrection('hsk2_b2_error_03', '我们还是去打车吧。', '我们还是打车去吧。'),
      errorCorrection('hsk2_b2_error_04', '四万名多学生。', '四万多名学生。'),
      errorCorrection('hsk2_b2_error_05', '学中文学生很多。', '学中文的学生很多。'),
      essay(
        'hsk2_b2_essay_01',
        '介绍你的学校，或者你去过的一所大学。请写一篇60–80字的短文。至少使用下面5个词语/结构：每、但、远、还是……吧、多、名、教室、票、过来。',
        '我的大学有一万多名学生，也有很多外国学生。我每天坐公交车去教室上课，但是车站有点儿远。下雨的时候，朋友会说：“还是打车去吧！”你有时间可以过来看看。',
        {
          teacherReviewRequired: true,
          requiredElements: ['Đủ 60–80 chữ', 'Dùng ít nhất 5 từ/cấu trúc yêu cầu'],
          rubric: [
            { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
            { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc', maxScore: 3 },
            { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
            { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
          ],
          maxScore: 10
        }
      )
    ],
    speakingQuestions: [
      speaking('hsk2_b2_speak_01', '请问，这儿有到北京大学的公交车吗？', 'Qǐngwèn, zhèr yǒu dào Běijīng Dàxué de gōngjiāochē ma?', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_02', '有，但是车站有点儿远。', 'Yǒu, dànshì chēzhàn yǒudiǎnr yuǎn.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_03', '车站太远了，我们还是打车去吧。', 'Chēzhàn tài yuǎn le, wǒmen háishi dǎchē qù ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_04', '北京大学有四万多名学生呢！', 'Běijīng Dàxué yǒu sì wàn duō míng xuésheng ne!', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_05', '还是别看电影了，北京大学就很好看！', 'Háishi bié kàn diànyǐng le, Běijīng Dàxué jiù hěn hǎokàn!', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_06', '我们有时间还想再过来看个电影。', 'Wǒmen yǒu shíjiān hái xiǎng zài guòlái kàn ge diànyǐng。', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b2_speak_07', '每 → 我每天______。', 'Wǒ měitiān zuò gōngjiāochē qù xuéxiào。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我每天坐公交车去学校。', referenceAnswers: ['我每天坐公交车去学校。'], requiredElements: ['每'] }),
      speaking('hsk2_b2_speak_08', '还是……吧 → 车站太远了，______。', 'Chēzhàn tài yuǎn le, wǒmen háishi dǎchē qù ba。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '车站太远了，我们还是打车去吧。', referenceAnswers: ['车站太远了，我们还是打车去吧。'], requiredElements: ['还是……吧'] }),
      speaking('hsk2_b2_speak_09', '多 → 北京大学______。', 'Běijīng Dàxué yǒu sì wàn duō míng xuésheng。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '北京大学有四万多名学生。', referenceAnswers: ['北京大学有四万多名学生。'], requiredElements: ['多'] }),
      speaking('hsk2_b2_speak_10', '请问 → 请问，______？', 'Qǐngwèn, zhèr yǒu dào chēzhàn de gōngjiāochē ma?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '请问，这儿有到车站的公交车吗？', referenceAnswers: ['请问，这儿有到车站的公交车吗？'], requiredElements: ['请问'] }),
      speaking('hsk2_b2_speak_11', '别 → 你______。', 'Nǐ bié zǒu, wǒmen yìqǐ qù ba。', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你别走，我们一起去吧。', referenceAnswers: ['你别走，我们一起去吧。'], requiredElements: ['别'] })
    ],
    translationQuestions: [
      translation('hsk2_b2_translate_01', '请问，这儿有到北京大学的公交车吗？', 'Xin hỏi, ở đây có xe buýt đến Đại học Bắc Kinh không?', 'zh_to_vi_text'),
      translation('hsk2_b2_translate_02', '车站太远了，我们还是打车去吧。', 'Bến xe xa quá, chúng ta vẫn nên đi taxi đi.', 'zh_to_vi_text'),
      translation('hsk2_b2_translate_03', '北京大学有四万多名学生呢！', 'Đại học Bắc Kinh có hơn bốn vạn sinh viên đấy!', 'zh_to_vi_text'),
      translation('hsk2_b2_translate_04', 'Mỗi ngày tôi đi xe buýt đi làm.', '我每天坐公交车上班。'),
      translation('hsk2_b2_translate_05', 'Bến xe hơi xa.', '车站有点儿远。'),
      translation('hsk2_b2_translate_06', 'Trong trường có nhiều người thật đấy!', '学校里人真多啊！'),
      translation('hsk2_b2_translate_07', 'Chúng ta vẫn nên đi taxi đi.', '我们还是打车去吧。', 'vi_to_zh_audio', {
        taskGroup: 'oral_translation',
        taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
        rubric: [
          { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
          { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
          { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
        ],
        maxScore: 10
      }),
      translation('hsk2_b2_translate_08', 'Trong phòng học có hơn hai mươi học sinh.', '教室里有二十多个学生。', 'vi_to_zh_audio', {
        taskGroup: 'oral_translation',
        taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
        rubric: [
          { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
          { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
          { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
        ],
        maxScore: 10
      }),
      translation('hsk2_b2_translate_09', 'Vé xem phim họ bán không đắt.', '他们卖的电影票不贵。', 'vi_to_zh_audio', {
        taskGroup: 'oral_translation',
        taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung',
        rubric: [
          { id: 'meaning', label: 'Đúng nghĩa', maxScore: 5 },
          { id: 'tones', label: 'Thanh điệu và phát âm', maxScore: 3 },
          { id: 'fluency', label: 'Nói trôi chảy, đúng ngữ pháp', maxScore: 2 }
        ],
        maxScore: 10
      })
    ]
  },
  {
    id: 'hsk2-bai3-word',
    title: 'HSK 2 - Bài 3: 我想去西安旅游',
    level: 'HSK 2',
    description: 'Bài tập 5 kỹ năng HSK2 Bài 3: 我想去西安旅游.',
    instruction: 'Làm đúng thứ tự: I. 听力 → II. 阅读 → III. 写作 → IV. 口语 → V. 翻译. Phần nghe gồm một đoạn văn 5 câu đúng/sai và 4 hội thoại; phần đọc gồm 3 bài theo tài liệu.',
    vocabList: bai3Vocab,
    mcQuestions: [],
    fillQuestions: [],
    arrangeQuestions: [
      arrange('hsk2_b3_arrange_01', ['饭', '我', '了', '吃', '完'], '我吃完饭了。'),
      arrange('hsk2_b3_arrange_02', ['菜', '了', '好', '都', '做'], '菜都做好了。'),
      arrange('hsk2_b3_arrange_03', ['想', '你', '一想', '再'], '你再想一想。'),
      arrange('hsk2_b3_arrange_04', ['的', '网上', '介绍', '看了看', '我'], '我看了看网上的介绍。'),
      arrange('hsk2_b3_arrange_05', ['西安', '想', '你', '去', '为什么'], '你为什么想去西安？')
    ],
    readingPassages: bai3Reading,
    listeningQuestions: bai3Listening,
    essayQuestions: [
      errorCorrection('hsk2_b3_error_01', '我没吃完饭了。', '我没吃完饭。', { taskGroup: 'error_correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Phủ định kết quả dùng 没（有） + động từ + bổ ngữ, không dùng 了.' }),
      errorCorrection('hsk2_b3_error_02', '我看了完电影。', '我看完电影了。', { taskGroup: 'error_correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Dùng mẫu V + 完 + O + 了: 我看完电影了.' }),
      errorCorrection('hsk2_b3_error_03', '我休息休息了。', '我休息了一下。', { taskGroup: 'error_correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Động từ hai âm tiết biểu thị hành động đã xảy ra dùng AB 了一下.' }),
      errorCorrection('hsk2_b3_error_04', '你为什么这么晚回来吗？', '你为什么这么晚回来？', { taskGroup: 'error_correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Câu hỏi có 为什么 không thêm trợ từ 吗.' }),
      errorCorrection('hsk2_b3_error_05', '我看看了网上的介绍。', '我看了看网上的介绍。', { taskGroup: 'error_correction', taskGroupTitle: 'III. 写作 · Bài 2: 改错句', explanation: 'Động từ một âm tiết đã xảy ra dùng A 了 A.' }),
      essay(
        'hsk2_b3_essay_01',
        '介绍一个你想去旅游的地方，说说你为什么想去。Dùng ít nhất 5 trong các từ/cấu trúc sau: 回来、这么、完、一起、出去、自己、为什么、不错、送、每、累、看了看。',
        '我想和朋友一起去西安旅游。我看了看网上的介绍，这个时候去西安很不错。我每天工作很累，所以想出去玩玩。朋友问我：“你为什么想去西安？”我说：“因为西安很有意思。”等我们想好了，我来买票。',
        {
          taskGroup: 'free_writing',
          taskGroupTitle: 'III. 写作 · Bài 3: 写短文',
          teacherReviewRequired: true,
          requiredElements: ['Đủ khoảng 60–80 chữ', 'Dùng đúng ít nhất 5 từ/cấu trúc yêu cầu', 'Nêu địa điểm và lý do muốn đi'],
          rubric: [
            { id: 'content', label: 'Nội dung đủ ý', maxScore: 3 },
            { id: 'targets', label: 'Dùng đúng ít nhất 5 từ/cấu trúc', maxScore: 3 },
            { id: 'grammar', label: 'Ngữ pháp đúng', maxScore: 2 },
            { id: 'writing', label: 'Chữ Hán và dấu câu', maxScore: 2 }
          ]
        }
      )
    ],
    speakingQuestions: [
      speaking('hsk2_b3_speak_01', 'Đọc và ghi âm: 今天回来这么晚啊！', 'Jīntiān huílái zhème wǎn a!', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: 'Chú ý ngữ điệu tự nhiên ở cuối câu cảm thán với 啊.' }),
      speaking('hsk2_b3_speak_02', 'Đọc và ghi âm: 工作太多了，下班的时候没做完。', 'Gōngzuò tài duō le, xiàbān de shíhou méi zuò wán.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b3_speak_03', 'Đọc và ghi âm: 菜都做好了，过来吃饭吧。', 'Cài dōu zuò hǎo le, guòlái chīfàn ba.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音' }),
      speaking('hsk2_b3_speak_04', 'Đọc và ghi âm: 你想好了，我来买票。', 'Nǐ xiǎng hǎo le, wǒ lái mǎi piào.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: '想好了 đọc xiáng hǎo le; hai thanh 3 liền nhau, 想 biến thành thanh 2.' }),
      speaking('hsk2_b3_speak_05', 'Đọc và ghi âm: 我看了看网上的介绍，这个时候去西安很不错！', 'Wǒ kàn le kàn wǎngshàng de jièshào, zhège shíhou qù Xī’ān hěn búcuò!', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: '不错 đọc búcuò; 不 biến thành thanh 2 trước thanh 4.' }),
      speaking('hsk2_b3_speak_06', 'Đọc và ghi âm: 我觉得他这个月每天都很累，真想让他休息休息。', 'Wǒ juéde tā zhège yuè měitiān dōu hěn lèi, zhēn xiǎng ràng tā xiūxi xiūxi.', { taskGroup: 'reading_aloud', taskGroupTitle: 'IV. 口语 · Bài 1: 录音', explanation: '休息休息: âm tiết thứ hai đọc nhẹ.' }),
      speaking('hsk2_b3_speak_07', '这么 → 今天______，我们别出去了。', 'Jīntiān zhème rè, wǒmen bié chūqù le.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '今天这么热，我们别出去了。', referenceAnswers: ['今天这么热，我们别出去了。'], requiredElements: ['这么'] }),
      speaking('hsk2_b3_speak_08', '完 → 我已经______。', 'Wǒ yǐjīng chī wán fàn le.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我已经吃完饭了。', referenceAnswers: ['我已经吃完饭了。'], requiredElements: ['完'] }),
      speaking('hsk2_b3_speak_09', '一起 → 明天我们______。', 'Míngtiān wǒmen yìqǐ qù Xī’ān lǚyóu ba.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '明天我们一起去西安旅游吧。', referenceAnswers: ['明天我们一起去西安旅游吧。'], requiredElements: ['一起'] }),
      speaking('hsk2_b3_speak_10', '为什么 → 你______？', 'Nǐ wèishénme xiǎng qù Xī’ān?', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '你为什么想去西安？', referenceAnswers: ['你为什么想去西安？'], requiredElements: ['为什么'] }),
      speaking('hsk2_b3_speak_11', '休息休息 → 我很累，______。', 'Wǒ hěn lèi, xiǎng xiūxi xiūxi.', { taskGroup: 'guided_speaking', taskGroupTitle: 'IV. 口语 · Bài 2: 用所给词语说句子', suggestedAnswer: '我很累，想休息休息。', referenceAnswers: ['我很累，想休息休息。'], requiredElements: ['休息休息'] })
    ],
    translationQuestions: [
      translation('hsk2_b3_translate_01', '今天回来这么晚啊！', 'Hôm nay về muộn thế nhỉ!', 'zh_to_vi_text'),
      translation('hsk2_b3_translate_02', '菜都做好了，过来吃饭吧。', 'Thức ăn đều nấu xong rồi, qua đây ăn cơm đi.', 'zh_to_vi_text'),
      translation('hsk2_b3_translate_03', '我看了看网上的介绍，这个时候去西安很不错！', 'Tôi xem qua phần giới thiệu trên mạng, thời điểm này đi Tây An rất tuyệt!', 'zh_to_vi_text'),
      translation('hsk2_b3_translate_04', 'Tôi chưa ăn xong cơm.', '我没吃完饭。'),
      translation('hsk2_b3_translate_05', 'Bạn nghĩ xong rồi thì tôi sẽ mua vé.', '你想好了，我来买票。'),
      translation('hsk2_b3_translate_06', 'Tại sao bạn muốn đi Tây An?', '你为什么想去西安？'),
      translation('hsk2_b3_translate_07', 'Hôm nay tôi rất mệt, muốn nghỉ ngơi một chút.', '我今天很累，想休息一下。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai3AudioTranslationRubric }),
      translation('hsk2_b3_translate_08', 'Chúng ta cùng ra ngoài chơi nhé.', '我们一起出去玩吧。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai3AudioTranslationRubric }),
      translation('hsk2_b3_translate_09', 'Sáng nay anh ấy đưa con đến trường.', '今天早上他送孩子去学校。', 'vi_to_zh_audio', { taskGroup: 'oral_translation', taskGroupTitle: 'V. 翻译 · Bài 2B: Dịch ghi âm Việt → Trung', rubric: bai3AudioTranslationRubric })
    ]
  }
];
