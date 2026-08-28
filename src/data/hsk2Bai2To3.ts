import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const fill = (id: string, prompt: string, answer: string, wordBank: string[], tier: Question['tier'] = 'tier1'): Question => ({
  id,
  type: 'fill',
  tier,
  prompt,
  answer,
  acceptableAnswers: answer,
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
  suggestedAnswer
});

const speaking = (id: string, prompt: string, pinyin: string): Question => ({
  id,
  type: 'speaking',
  tier: 'tier3',
  prompt,
  pinyin
});

const translation = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'translation',
  translationType: 'vi_to_zh_text',
  tier: 'tier3',
  prompt,
  suggestedAnswer
});

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] => (
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }))
);

const bai2Vocab = vocab([
  ['公交车', 'gōngjiāochē', 'Danh từ', 'xe buýt', '这儿有到北大的公交车吗？'],
  ['但', 'dàn', 'Liên từ', 'nhưng', '有，但车站有点儿远。'],
  ['车站', 'chēzhàn', 'Danh từ', 'trạm xe, bến xe', '车站离这儿有点儿远。'],
  ['远', 'yuǎn', 'Tính từ', 'xa', '车站有点儿远。'],
  ['打车', 'dǎchē', 'Động từ', 'bắt taxi, đi taxi', '我们还是打车去吧。'],
  ['还是', 'háishi', 'Phó từ', 'tốt hơn là, nên là', '我们还是打车去吧。'],
  ['万', 'wàn', 'Số từ', 'vạn (10.000)', '北大有四万多名学生。'],
  ['名', 'míng', 'Lượng từ', 'lượng từ đếm người', '有四万多名学生。'],
  ['网上', 'wǎngshang', 'Danh từ', 'trên mạng', '这些信息是网上看到的。'],
  ['外国', 'wàiguó', 'Danh từ', 'nước ngoài', '有三千多名外国学生。'],
  ['间', 'jiān', 'Lượng từ', 'lượng từ đếm phòng', '那是一间大教室。'],
  ['教室', 'jiàoshì', 'Danh từ', 'phòng học', '我们可以在教室上课。'],
  ['票', 'piào', 'Danh từ', 'vé', '电影票很便宜。'],
  ['别', 'bié', 'Phó từ', 'đừng', '别忘记买电影票。'],
  ['过来', 'guòlái', 'Động từ', 'đến đây, lại đây', '你过来一下。']
]);

const bai2FillGroup1 = ['但', '间', '远', '万', '别'];
const bai2FillGroup2 = ['公交车', '打车', '车站', '网上', '外国', '过来'];

const bai2Reading: ReadingPassage[] = [{
  id: 'hsk2_b2_reading_01',
  title: 'Đọc hiểu: Tham quan Bắc Đại',
  content: '白家月和安妮来北京参观北京大学。她们在宾馆问服务员：“这儿有到北大的公交车吗？”服务员说：“有，但车站有点儿远。”所以她们还是打车去北大。\n\n北大很漂亮，学校里人真多啊，有四万多名学生，还有三千多名外国学生，这些信息是网上看到的。学校里面还有一家电影院，电影票很便宜，有的还不到二十块。但是白家月不想看电影，她觉得北大就很好看。她们说以后有时间，还要再过来看电影。',
  questions: [
    mc('hsk2_b2_read_01', '白家月和安妮怎么去北京大学？', ['坐公交车', '打车', '走路'], 1),
    mc('hsk2_b2_read_02', '她们为什么不坐公交车？', ['公交车太贵', '车站有点儿远', '没有公交车'], 1),
    mc('hsk2_b2_read_03', '北京大学有多少外国学生？', ['三千多', '四万多', '二十多'], 0),
    mc('hsk2_b2_read_04', '安妮从哪里知道北大的信息？', ['朋友告诉她', '网上', '电影院'], 1),
    mc('hsk2_b2_read_05', '学校里的电影票怎么样？', ['很贵', '很便宜', '不卖票'], 1),
    mc('hsk2_b2_read_06', '白家月为什么不想看电影？', ['没有票', '北大很好看', '时间不够'], 1),
    mc('hsk2_b2_read_07', '下面哪一个词语短文里没有出现？', ['教室', '打车', '公交车'], 0)
  ]
}];

const bai2Listening: Question[] = [{
  id: 'hsk2_b2_listen_passage',
  type: 'listening_mc',
  tier: 'tier2',
  prompt: 'Nghe đoạn văn và chọn đáp án đúng (Câu 1–5).',
  audioUrl: '/audio/HSK2_B02/01.mp3',
  audioText: '我和朋友想去北京大学看看。我在网上查了资料，北京大学有四万多名学生，还有三千多外国学生。校园很大，里面有很多间干净漂亮的教室。我们本来想坐公交车去，但附近的车站离这里很远。走路过去太麻烦，我们还是打车去吧。朋友想买电影票去看电影，我让他别着急，先过来参观北京大学的校园。',
  explanation: 'Kịch bản nghe: 我和朋友想去北京大学看看。我在网上查了资料，北京大学有四万多名学生，还有三千多外国学生。校园很大，里面有很多间干净漂亮的教室。我们本来想坐公交车去，但附近的车站离这里很远。走路过去太麻烦，我们还是打车去吧。朋友想买电影票去看电影，我让他别着急，先过来参观北京大学的校园。',
  subQuestions: [
    { id: 'hsk2_b2_listen_01', type: 'listening_mc', tier: 'tier2', prompt: '作者在哪里了解到北京大学的信息？', options: ['车站', '网上', '教室'], answer: 1 },
    { id: 'hsk2_b2_listen_02', type: 'listening_mc', tier: 'tier2', prompt: '北京大学有多少名学生？', options: ['一万多名', '四万多名', '十万多名'], answer: 1 },
    { id: 'hsk2_b2_listen_03', type: 'listening_mc', tier: 'tier2', prompt: '他们为什么不坐公交车去北大？', options: ['车站很远', '没有公交车', '车票太贵'], answer: 0 },
    { id: 'hsk2_b2_listen_04', type: 'listening_mc', tier: 'tier2', prompt: '他们最后打算怎么去北京大学？', options: ['坐公交车', '打车', '走路'], answer: 1 },
    { id: 'hsk2_b2_listen_05', type: 'listening_mc', tier: 'tier2', prompt: '作者让朋友不要做什么事情？', options: ['看电影', '逛校园', '打车'], answer: 0 }
  ]
}];

const bai3Vocab = vocab([
  ['回来', 'huílái', 'Động từ', 'quay về, trở về', '你今天回来得真晚！'],
  ['这么', 'zhème', 'Đại từ', 'như thế, đến thế', '今天回来这么晚啊！'],
  ['完', 'wán', 'Động từ', 'xong, hoàn thành', '工作还没做完。'],
  ['一起', 'yìqǐ', 'Phó từ', 'cùng nhau', '我们一起出去玩吧。'],
  ['出去', 'chūqù', 'Động từ', 'đi ra ngoài', '我们一起出去旅游。'],
  ['洗', 'xǐ', 'Động từ', 'rửa, giặt', '我自己洗了水果。'],
  ['自己', 'zìjǐ', 'Đại từ', 'tự mình, bản thân', '我自己洗了水果。'],
  ['拿', 'ná', 'Động từ', 'cầm, lấy', '把水果拿出来准备吃。'],
  ['手', 'shǒu', 'Danh từ', 'tay', '洗干净手以后再吃水果。'],
  ['为什么', 'wèi shénme', 'Nghi vấn từ', 'tại sao', '你为什么想去西安？'],
  ['不错', 'búcuò', 'Tính từ', 'khá tốt, không tệ', '这个时间去西安很不错。'],
  ['送', 'sòng', 'Động từ', 'đưa, tặng', '刘明开车送孩子上学。'],
  ['回去', 'huíqù', 'Động từ', 'quay lại', '医院叫他回去上班。'],
  ['每', 'měi', 'Đại từ', 'mỗi', '他每天都很累。'],
  ['累', 'lèi', 'Tính từ', 'mệt', '今天我感觉很累。']
]);

const bai3FillGroup1 = ['完', '洗', '拿', '累', '每'];
const bai3FillGroup2 = ['回来', '一起', '出去', '为什么', '不错', '自己', '送', '回去'];

const bai3Reading: ReadingPassage[] = [{
  id: 'hsk2_b3_reading_01',
  title: 'Đọc hiểu: Tôi muốn đi Tây An du lịch',
  content: '刘明下班回来得很晚，今天工作很多，工作没有做完。王一雪菜都做好了叫他吃饭，但是刘明很累，想要先休息喝水。\n\n之后两个人聊天，刘明提议找时间一起出去旅游。王一雪很想去，但是还没有想好去哪里。刘明叫她再想一想，想好之后由刘明买票。\n\n后来吃苹果的时候，王一雪说想去西安旅游。她看了看网上的介绍，觉得这个时间去西安很不错。刘明问她为什么想去西安。\n\n早上刘明开车送孩子上学，回家之后医院打电话，叫他回去上班。王一雪觉得刘明每个月每天都很累，很想让他休息休息。',
  questions: [
    mc('hsk2_b3_read_01', '刘明为什么回家很晚？', ['没做完工作', '去旅游', '去买苹果'], 0),
    mc('hsk2_b3_read_02', '谁提议一起出去旅游？', ['王一雪', '刘明', '网上'], 1),
    mc('hsk2_b3_read_03', '谁负责买旅游的票？', ['刘明', '王一雪', '孩子'], 0),
    mc('hsk2_b3_read_04', '王一雪想去哪里旅游？', ['北京', '西安', '上海'], 1),
    mc('hsk2_b3_read_05', '王一雪从哪里知道西安？', ['朋友告诉她', '网上', '医院'], 1),
    mc('hsk2_b3_read_06', '刘明早上怎么送孩子上学？', ['打车', '开车', '坐公交车'], 1),
    mc('hsk2_b3_read_07', '医院打电话叫刘明做什么？', ['休息', '回去上班', '去旅游'], 1),
    mc('hsk2_b3_read_08', '下面哪个词语短文没有出现？', ['洗苹果', '教室', '休息休息'], 1)
  ]
}];

const bai3Listening: Question[] = [
  {
    id: 'hsk2_b3_listen_part_01',
    type: 'listening_mc',
    tier: 'tier2',
    prompt: 'Nghe đoạn 1 và chọn đáp án đúng (Câu 1–2).',
    audioUrl: '/audio/HSK2_B03/01.mp3',
    audioText: '我的朋友每天工作很累，每天晚上都回来得这么晚，经常做不完工作。周末我想和他一起出去旅游，放松一下心情。',
    explanation: 'Kịch bản nghe: 我的朋友每天工作很累，每天晚上都回来得这么晚，经常做不完工作。周末我想和他一起出去旅游，放松一下心情。',
    subQuestions: [
      { id: 'hsk2_b3_listen_01', type: 'listening_mc', tier: 'tier2', prompt: '朋友每天的工作怎么样？', options: ['很累', '很轻松', '很无聊'], answer: 0 },
      { id: 'hsk2_b3_listen_02', type: 'listening_mc', tier: 'tier2', prompt: '朋友经常做不完什么事情？', options: ['作业', '工作', '家务'], answer: 1 }
    ]
  },
  {
    id: 'hsk2_b3_listen_part_02',
    type: 'listening_mc',
    tier: 'tier2',
    prompt: 'Nghe đoạn 2 và chọn đáp án đúng (Câu 3–4).',
    audioUrl: '/audio/HSK2_B03/02.mp3',
    audioText: '我自己洗了水果，洗干净手以后，把水果拿出来准备吃。我问朋友：“你为什么总是这么忙？出去旅游不错，我们一起去吧！”',
    explanation: 'Kịch bản nghe: 我自己洗了水果，洗干净手以后，把水果拿出来准备吃。我问朋友：“你为什么总是这么忙？出去旅游不错，我们一起去吧！”',
    subQuestions: [
      { id: 'hsk2_b3_listen_03', type: 'listening_mc', tier: 'tier2', prompt: '作者想和朋友一起做什么？', options: ['出去旅游', '在家睡觉', '上班'], answer: 0 },
      { id: 'hsk2_b3_listen_04', type: 'listening_mc', tier: 'tier2', prompt: '作者觉得出去旅游怎么样？', options: ['不好', '不错', '很累'], answer: 1 }
    ]
  },
  {
    id: 'hsk2_b3_listen_part_03',
    type: 'listening_mc',
    tier: 'tier2',
    prompt: 'Nghe đoạn 3 và chọn đáp án đúng (Câu 5).',
    audioUrl: '/audio/HSK2_B03/03.mp3',
    audioText: '朋友说周末还要送家人出门，忙完才能回去休息，暂时没有时间出去玩。',
    explanation: 'Kịch bản nghe: 朋友说周末还要送家人出门，忙完才能回去休息，暂时没有时间出去玩。',
    subQuestions: [
      { id: 'hsk2_b3_listen_05', type: 'listening_mc', tier: 'tier2', prompt: '朋友周末需要先做什么事情？', options: ['送家人出门', '出去旅游', '洗衣服'], answer: 0 }
    ]
  }
];

export const HSK2_BAI2_TO_3_EXAMS: ExamLesson[] = [
  {
    id: 'hsk2-bai2-word',
    title: 'HSK 2 - Bài 2: 还是打车去北大吧',
    level: 'HSK 2',
    description: 'Bài tập theo tài liệu HSK2 Bài 2: từ vựng, điền từ, sắp xếp câu, nghe, đọc, viết, nói và dịch.',
    instruction: 'Học từ vựng trước, sau đó làm bài theo thứ tự. Phần nghe có một file chung cho 5 câu hỏi.',
    vocabList: bai2Vocab,
    mcQuestions: [],
    fillQuestions: [
      fill('hsk2_b2_fill_01', '这个学校有一____多名学生。', '万', bai2FillGroup1),
      fill('hsk2_b2_fill_02', '我想去图书馆，____图书馆离这儿很远。', '但', bai2FillGroup1),
      fill('hsk2_b2_fill_03', '那是一____大教室，我们可以在那儿上课。', '间', bai2FillGroup1),
      fill('hsk2_b2_fill_04', '____忘记买电影票。', '别', bai2FillGroup1),
      fill('hsk2_b2_fill_05', '请问，去北大的____在哪儿？', '车站', bai2FillGroup2, 'tier2'),
      fill('hsk2_b2_fill_06', '这儿没有直达的____。', '公交车', bai2FillGroup2, 'tier2'),
      fill('hsk2_b2_fill_07', '我们____去吧。', '打车', bai2FillGroup2, 'tier2'),
      fill('hsk2_b2_fill_08', '____说，这所大学有很多外国学生。', '网上', bai2FillGroup2, 'tier2'),
      fill('hsk2_b2_fill_09', '网上说，这所大学有很多____学生。', '外国', bai2FillGroup2, 'tier2'),
      fill('hsk2_b2_fill_10', '你有空____帮我看一下这个教室，可以吗？', '过来', bai2FillGroup2, 'tier2')
    ],
    arrangeQuestions: [
      arrange('hsk2_b2_arrange_01', ['还是', '打车', '我们', '去吧', '。'], '我们还是打车去吧。'),
      arrange('hsk2_b2_arrange_02', ['有点儿', '车站', '远', '。'], '车站有点儿远。'),
      arrange('hsk2_b2_arrange_03', ['四万多', '北大', '学生', '有名', '。'], '北大有四万多名学生。'),
      arrange('hsk2_b2_arrange_04', ['别', '看电影', '了', '。'], '别看电影了。'),
      arrange('hsk2_b2_arrange_05', ['网上', '说', '有', '三千多', '外国学生', '。'], '网上说有三千多外国学生。'),
      arrange('hsk2_b2_arrange_06', ['一间', '那边', '就有', '教室', '。'], '那边就有一间教室。'),
      arrange('hsk2_b2_arrange_07', ['好打车', '这儿', '吗', '？'], '这儿好打车吗？'),
      arrange('hsk2_b2_arrange_08', ['过来', '你', '一下', '。'], '你过来一下。')
    ],
    readingPassages: bai2Reading,
    listeningQuestions: bai2Listening,
    essayQuestions: [
      essay('hsk2_b2_read_short_01', 'Đọc đoạn văn và trả lời ngắn bằng tiếng Trung: 北京大学人多不多？', '北京大学人很多，有四万多名学生。'),
      essay('hsk2_b2_read_short_02', 'Đọc đoạn văn và trả lời ngắn bằng tiếng Trung: 她们以后想做什么？', '她们以后有时间，还要再过来看电影。'),
      essay('hsk2_b2_essay_01', 'Dùng các từ 还是，多，远，打车，网上 viết đoạn văn khoảng 50 chữ bằng tiếng Trung.', '我想去北京大学看看。网上说那里有很多学生，但是车站有点儿远，我们还是打车去吧。')
    ],
    speakingQuestions: [
      speaking('hsk2_b2_speak_01', 'Đọc và ghi âm: 我们还是打车去北大吧。', 'Wǒmen háishi dǎchē qù Běidà ba.'),
      speaking('hsk2_b2_speak_02', 'Đọc và ghi âm: 车站离这儿有点儿远。', 'Chēzhàn lí zhèr yǒudiǎnr yuǎn.'),
      speaking('hsk2_b2_speak_03', 'Đọc và ghi âm: 网上说北大有四万多名学生。', 'Wǎngshang shuō Běidà yǒu sì wàn duō míng xuésheng.'),
      speaking('hsk2_b2_speak_04', 'Đọc và ghi âm: 别去看电影了，北京大学很好看。', 'Bié qù kàn diànyǐng le, Běijīng Dàxué hěn hǎokàn.')
    ],
    translationQuestions: [
      translation('hsk2_b2_translate_01', 'Dịch sang tiếng Trung: Trạm xe cách đây hơi xa một chút.', '车站离这儿有点儿远。'),
      translation('hsk2_b2_translate_02', 'Dịch sang tiếng Trung: Chúng ta nên bắt taxi đi vậy.', '我们还是打车去吧。'),
      translation('hsk2_b2_translate_03', 'Dịch sang tiếng Trung: Trên mạng nói trường này có hơn ba nghìn sinh viên nước ngoài.', '网上说这所大学有三千多名外国学生。'),
      translation('hsk2_b2_translate_04', 'Dịch sang tiếng Trung: Đừng quên mua vé xem phim.', '别忘记买电影票。')
    ]
  },
  {
    id: 'hsk2-bai3-word',
    title: 'HSK 2 - Bài 3: 我想去西安旅游',
    level: 'HSK 2',
    description: 'Bài tập theo tài liệu HSK2 Bài 3: từ vựng, điền từ, sắp xếp câu, nghe, đọc, viết, nói và dịch.',
    instruction: 'Học từ vựng trước, sau đó làm bài theo thứ tự. Phần nghe gồm 3 đoạn, tổng cộng 5 câu hỏi.',
    vocabList: bai3Vocab,
    mcQuestions: [],
    fillQuestions: [
      fill('hsk2_b3_fill_01', '工作太多，我还没做____。', '完', bai3FillGroup1),
      fill('hsk2_b3_fill_02', '苹果我已经____好了。', '洗', bai3FillGroup1),
      fill('hsk2_b3_fill_03', '苹果我已经洗好了，你可以____。', '拿', bai3FillGroup1),
      fill('hsk2_b3_fill_04', '____天早上，他都很早起床。', '每', bai3FillGroup1),
      fill('hsk2_b3_fill_05', '工作很多，今天我感觉很____。', '累', bai3FillGroup1),
      fill('hsk2_b3_fill_06', '你今天____得真晚！', '回来', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_07', '____不想出去旅游？', '为什么', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_08', '你为什么不想____旅游？', '出去', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_09', '这家饭店菜很不错，我们____吃饭吧。', '一起', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_10', '孩子在桌子旁边，你____可以送水果给他。', '自己', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_11', '你自己可以____水果给他。', '送', bai3FillGroup2, 'tier2'),
      fill('hsk2_b3_fill_12', '时间很晚了，我们该____了。', '回去', bai3FillGroup2, 'tier2')
    ],
    arrangeQuestions: [
      arrange('hsk2_b3_arrange_01', ['这么', '今天', '回来', '晚', '你', '。'], '你今天回来这么晚。'),
      arrange('hsk2_b3_arrange_02', ['吃完饭', '我', '了', '。'], '我吃完饭了。'),
      arrange('hsk2_b3_arrange_03', ['想一想', '你', '再', '。'], '你再想一想。'),
      arrange('hsk2_b3_arrange_04', ['为什么', '西安', '想去', '你', '？'], '你为什么想去西安？'),
      arrange('hsk2_b3_arrange_05', ['网上', '看', '看', '了', '介绍', '我', '。'], '我看了看网上介绍。'),
      arrange('hsk2_b3_arrange_06', ['一起', '出去玩', '我们', '。'], '我们一起出去玩。'),
      arrange('hsk2_b3_arrange_07', ['送', '刘明', '孩子', '学校', '去', '。'], '刘明送孩子去学校。'),
      arrange('hsk2_b3_arrange_08', ['休息', '休息', '想', '他', '。'], '他想休息休息。')
    ],
    readingPassages: bai3Reading,
    listeningQuestions: bai3Listening,
    essayQuestions: [
      essay('hsk2_b3_read_short_01', 'Đọc đoạn văn và trả lời ngắn bằng tiếng Trung: 王一雪觉得这个时候去西安怎么样？', '她觉得这个时候去西安很不错。'),
      essay('hsk2_b3_read_short_02', 'Đọc đoạn văn và trả lời ngắn bằng tiếng Trung: 王一雪觉得刘明怎么样？', '她觉得刘明每天都很累。'),
      essay('hsk2_b3_essay_01', 'Dùng các từ 完，一起，为什么，累，看了看 viết đoạn văn khoảng 50 chữ bằng tiếng Trung.', '今天工作很多，我还没做完，觉得很累。朋友问我为什么这么累，还说我们一起出去旅游吧。我看了看网上的介绍，觉得去西安不错。')
    ],
    speakingQuestions: [
      speaking('hsk2_b3_speak_01', 'Đọc và ghi âm: 今天回来这么晚啊！', 'Jīntiān huílái zhème wǎn a!'),
      speaking('hsk2_b3_speak_02', 'Đọc và ghi âm: 我吃完饭了。', 'Wǒ chī wán fàn le.'),
      speaking('hsk2_b3_speak_03', 'Đọc và ghi âm: 我们一起出去玩吧。', 'Wǒmen yìqǐ chūqù wán ba.'),
      speaking('hsk2_b3_speak_04', 'Đọc và ghi âm: 你为什么想去西安？', 'Nǐ wèishénme xiǎng qù Xī\'ān?'),
      speaking('hsk2_b3_speak_05', 'Đọc và ghi âm: 我看了看网上的介绍。', 'Wǒ kàn le kàn wǎngshang de jièshào.')
    ],
    translationQuestions: [
      translation('hsk2_b3_translate_01', 'Dịch sang tiếng Trung: Hôm nay anh ấy về nhà rất muộn.', '他今天回来这么晚。'),
      translation('hsk2_b3_translate_02', 'Dịch sang tiếng Trung: Tôi chưa làm xong công việc.', '我没做完工作。'),
      translation('hsk2_b3_translate_03', 'Dịch sang tiếng Trung: Chúng ta cùng đi du lịch được không?', '我们一起去旅游，怎么样？'),
      translation('hsk2_b3_translate_04', 'Dịch sang tiếng Trung: Tại sao bạn muốn đi Tây An?', '你为什么想去西安？'),
      translation('hsk2_b3_translate_05', 'Dịch sang tiếng Trung: Tôi đã xem qua giới thiệu trên mạng.', '我看了看网上的介绍。')
    ]
  }
];
