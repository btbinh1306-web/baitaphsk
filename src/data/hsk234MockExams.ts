import { ExamLesson } from '../types';
import { LessonItem, LessonSection } from '../types/lesson';

type Option = { id: string; text?: string; image?: string; alt?: string };
type Row = { number: number; prompt: string; answer: string; options?: Option[] };

const option = (id: string, text: string): Option => ({ id, text });
const options = (texts: string[]): Option[] => texts.map((text, index) => option(String.fromCharCode(65 + index), text));
const row = (id: string, number: number, prompt: string, answer: string, extra: Record<string, unknown> = {}) => ({
  id,
  number,
  prompt,
  correctAnswer: answer,
  ...extra
});
const item = (id: string, type: string, instruction: string, data: Record<string, unknown>): LessonItem => ({
  id,
  type,
  data: { instruction, showPinyin: false, playCount: 2, limitPlayCount: false, singlePass: true, ...data }
});

const textChoice = (id: string, number: number, prompt: string, answer: string, choices: string[]) => row(id, number, prompt, answer, { options: options(choices) });
const imageChoice = (id: string, number: number, prompt: string, answer: string, choices: string[]) => row(id, number, prompt, answer, { options: options(choices.map((text) => `Hình ${text}`)) });
const audioSection = (id: string, title: string, audio: string, items: LessonItem[]): LessonSection => ({ id, title, items: items.map((entry, index) => index === 0 ? { ...entry, data: { ...entry.data, audio, hidePrompt: true } } : entry) });

const hsk2Test1Listening: LessonItem[] = [
  item('hsk2-1-listen-p1', 'listening_image_choice', '第一部分：听句子，选择与句子相符的图片。', { items: [
    imageChoice('hsk2-1-l1', 1, '别忘了你的咖啡。', 'C', ['A', 'B', 'C']), imageChoice('hsk2-1-l2', 2, '她的头有点儿疼。', 'B', ['A', 'B', 'C']), imageChoice('hsk2-1-l3', 3, '孩子们正在快乐地游泳呢。', 'A', ['A', 'B', 'C']), imageChoice('hsk2-1-l4', 4, '朋友送给我两张电影票。', 'C', ['A', 'B', 'C']), imageChoice('hsk2-1-l5', 5, '您一不舒服就给我们打电话。', 'A', ['A', 'B', 'C'])
  ] }),
  item('hsk2-1-listen-p2', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: options(['人物与家人', '进商店', '买衣服', '介绍朋友', '出门', '使用电脑']),
    items: [row('hsk2-1-l6', 6, '你们家谁个子最高？', 'E'), row('hsk2-1-l7', 7, '请进！先生，您几位？', 'B'), row('hsk2-1-l8', 8, '你知道哪儿卖衣服便宜吗？', 'A'), row('hsk2-1-l9', 9, '我来介绍一下，这是我最好的朋友。', 'C'), row('hsk2-1-l10', 10, '这么早就出门啊？', 'F'), row('hsk2-1-l11', 11, '你还是自己点吧。', 'A'), row('hsk2-1-l12', 12, '您要找的包是什么样的？', 'C'), row('hsk2-1-l13', 13, '就要下雨了，大家别踢了。', 'E'), row('hsk2-1-l14', 14, '你坐得离电脑太近了。', 'B'), row('hsk2-1-l15', 15, '妈妈不希望我花太多钱给孩子买衣服。', 'D')]
  }),
  item('hsk2-1-listen-p3', 'listening_comprehension_choice', '第三部分：听短文和问题，选择正确答案。', { questions: [
    textChoice('hsk2-1-l16', 16, '他们在哪儿？', 'C', ['机场', '地铁站', '公交车站']), textChoice('hsk2-1-l17', 17, '男的要做什么？', 'A', ['回北京', '介绍北京', '去北京旅游']), textChoice('hsk2-1-l18', 18, '名字写在哪儿？', 'C', ['本子上', '书包上', '桌子上']), textChoice('hsk2-1-l19', 19, '男的是怎么学会跳舞的？', 'C', ['老师教的', '朋友教的', '自己学的']), textChoice('hsk2-1-l20', 20, '今天星期几？', 'A', ['星期五', '星期六', '星期日']), textChoice('hsk2-1-l21', 21, '那家饭馆怎么样？', 'C', ['很新', '很远', '很好吃']), textChoice('hsk2-1-l22', 22, '电影几点开始？', 'C', ['六点', '六点半', '七点半']), textChoice('hsk2-1-l23', 23, '医生让女的做什么？', 'B', ['多吃肉', '多吃菜', '喝奶茶']), textChoice('hsk2-1-l24', 24, '男的怎么回家？', 'C', ['开车', '坐火车', '坐飞机']), textChoice('hsk2-1-l25', 25, '说话人哥哥的学校怎么样？', 'C', ['教室很大', '开学很晚', '学生很多'])
  ] })
];

const hsk2Test2Listening: LessonItem[] = [
  item('hsk2-2-listen-p1', 'listening_image_choice', '第一部分：听句子，选择与句子相符的图片。', { items: [
    imageChoice('hsk2-2-l1', 1, '老师，这个题我会做。', 'B', ['A', 'B', 'C']), imageChoice('hsk2-2-l2', 2, '大家在地铁上可以玩玩手机。', 'A', ['A', 'B', 'C']), imageChoice('hsk2-2-l3', 3, '有你帮忙，妈妈做得快多了。', 'A', ['A', 'B', 'C']), imageChoice('hsk2-2-l4', 4, '我太喜欢家门口这些花了。', 'C', ['A', 'B', 'C']), imageChoice('hsk2-2-l5', 5, '他们经常一起看电影。', 'C', ['A', 'B', 'C'])
  ] }),
  item('hsk2-2-listen-p2', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: options(['慢慢走路', '家人过年', '地铁站', '下雪', '身体不舒服', '跳舞']),
    items: [row('hsk2-2-l6', 6, '您慢一点儿，请坐这儿吧。', 'B'), row('hsk2-2-l7', 7, '和爸、妈，新年快乐！', 'F'), row('hsk2-2-l8', 8, '请问去地铁站怎么走？', 'A'), row('hsk2-2-l9', 9, '我们一起出去玩雪吧。', 'E'), row('hsk2-2-l10', 10, '你哪儿不舒服？', 'C'), row('hsk2-2-l11', 11, '她们几个谁跳得最好？', 'D'), row('hsk2-2-l12', 12, '不好意思，我晚十分钟到！', 'B'), row('hsk2-2-l13', 13, '你看见我的手表了吗？', 'C'), row('hsk2-2-l14', 14, '这是我第一次来这家饭店。', 'A'), row('hsk2-2-l15', 15, '她们两个是姐妹吗？', 'B')]
  }),
  item('hsk2-2-listen-p3', 'listening_comprehension_choice', '第三部分：听短文和问题，选择正确答案。', { questions: [
    textChoice('hsk2-2-l16', 16, '他们在哪儿？', 'B', ['书店', '饭店', '花店']), textChoice('hsk2-2-l17', 17, '男的想做什么？', 'B', ['回北京', '介绍北京', '去北京旅游']), textChoice('hsk2-2-l18', 18, '女的要男的帮着做什么？', 'C', ['买东西', '找东西', '拿东西']), textChoice('hsk2-2-l19', 19, '女的不让男的做什么？', 'C', ['看时间', '看电脑', '看手机']), textChoice('hsk2-2-l20', 20, '女的现在在哪儿？', 'B', ['楼外边', '楼上边', '楼下边']), textChoice('hsk2-2-l21', 21, '男的怎么了？', 'A', ['生病了', '没药了', '家里有事']), textChoice('hsk2-2-l22', 22, '男的现在最可能在哪儿？', 'B', ['公司', '机场', '地铁站']), textChoice('hsk2-2-l23', 23, '女的让男的做什么？', 'A', ['做饭', '工作', '跟孩子玩']), textChoice('hsk2-2-l24', 24, '电影什么时候开始？', 'C', ['八点', '七点五十', '八点十分']), textChoice('hsk2-2-l25', 25, '奶奶正在忙什么？', 'C', ['准备回家', '买衣服', '做吃的'])
  ] })
];

const hsk2Reading = (id: string, second: boolean): LessonItem[] => [
  item(`${id}-read-p1`, 'reading_shared_image_match', '第一部分：读句子，选择对应的图片。', {
    sharedOptions: options(['人物活动', '地点', '食物', '衣服', '学习', '交通']),
    items: (second ? [
      ['今天下雪了。', 'E'], ['他在商场买东西。', 'C'], ['孩子正在看书。', 'F'], ['她穿着一件红色的衣服。', 'A'], ['我们坐地铁回家。', 'B']
    ] : [
      ['他正在看电视。', 'C'], ['她在商场买衣服。', 'E'], ['孩子在学校学习。', 'A'], ['桌子上有很多水果。', 'D'], ['他们坐飞机去北京。', 'B']
    ]).map(([prompt, answer], index) => row(`${id}-r${26 + index}`, 26 + index, prompt, answer))
  }),
  item(`${id}-read-p2`, 'fill', '第二部分：选择词语填空。', {
    wordBank: options(second ? ['因为', '所以', '过去', '试', '更', '过'] : ['进去', '条', '商场', '书包', '颜色', '件']),
    items: (second ? [
      ['我没吃过这种水果，我想试一下。', 'F'], ['因为今天天气不好，所以我们不去商场了。', 'A'], ['那边卖裤子，我们过去看看吧。', 'C'], ['绿色的很好看，我觉得黑色的更好看。', 'E'], ['我已经去过北京两次了。', 'D']
    ] : [
      ['我看见老师在里面，我们进去找她吧。', 'A'], ['我想买一条新裤子。', 'B'], ['这家商场是新开的。', 'C'], ['我的书包不见了。', 'D'], ['这件衣服什么颜色？', 'E']
    ]).map(([prompt, answer], index) => row(`${id}-r${31 + index}`, 31 + index, prompt, answer))
  }),
  item(`${id}-read-p3`, 'sentence_matching', '第三部分：选择合适的回答。', {
    answerBank: options(second ? ['快一点儿。', '我在下面等你。', '请坐一会儿。', '这是给你的礼物。', '我跟朋友回去。', '九点了，我们走吧。'] : ['好的，谢谢。', '我也觉得很好看。', '我在商场买的。', '因为今天下雨。', '你先进去吧。', '我昨天看过。']),
    items: (second ? ['你快一点儿，我们要迟到了。', '我不上去，我在下面等你。', '请你坐一会儿，他马上就到。', '这是我给朋友准备的礼物。', '我跟朋友回家了。'] : ['这件衣服真漂亮。', '你为什么不去商场？', '你在哪里买的书包？', '你看过这部电影吗？', '请进来坐吧。']).map((prompt, index) => row(`${id}-r${36 + index}`, 36 + index, prompt, String.fromCharCode(65 + index)))
  }),
  item(`${id}-read-p3b`, 'sentence_matching', '第四部分：选择合适的回答。', {
    answerBank: options(second ? ['快一点儿。', '我在下面等你。', '请坐一会儿。', '这是给你的礼物。', '我跟朋友回去。', '九点了，我们走吧。'] : ['好的，谢谢。', '我也觉得很好看。', '我在商场买的。', '因为今天下雨。', '你先进去吧。', '我昨天看过。']),
    items: (second ? ['都九点了，我们快走吧。', '外边很冷，你们快进来吧。', '我在楼上，你上来找我吧。', '我在楼下，你下来吧。', '吃完饭，我跟朋友回去。'] : ['你喜欢什么颜色？', '你什么时候去的？', '你为什么没来？', '你先进去吧。', '你看过这本书吗？']).map((prompt, index) => row(`${id}-r${41 + index}`, 41 + index, prompt, String.fromCharCode(65 + index)))
  }),
  item(`${id}-read-p4`, 'reading_comprehension_choice', '第五部分：读短文和问题，选择正确答案。', { questions: (second ? [
    ['小雪今天过生日，朋友送给她一个大蛋糕。', '她今天是什么日子？', 'B', ['生日', '考试', '旅行']], ['下班以后我想舒舒服服地睡一觉。', '说话人想做什么？', 'A', ['睡觉', '吃饭', '买衣服']], ['桌子上有苹果、香蕉什么的。', '桌子上有什么？', 'C', ['书', '衣服', '水果']], ['我不上去，我在下面等你。', '说话人在哪里？', 'B', ['楼上', '楼下', '商场']], ['都九点了，我们快走吧。', '现在几点？', 'C', ['八点', '八点半', '九点']]
  ] : [
    ['我喜欢绿色的衣服，因为绿色很好看。', '说话人喜欢什么颜色？', 'A', ['绿色', '黑色', '红色']], ['这家商场的东西很便宜。', '商场怎么样？', 'B', ['很远', '很便宜', '很小']], ['我第一次去中国朋友家，带了一件礼物。', '他带了什么？', 'C', ['书包', '蛋糕', '礼物']], ['她穿红色的很好看。', '她穿什么颜色好看？', 'A', ['红色', '白色', '黑色']], ['因为下雨，所以我们没有去商场。', '他们为什么没去商场？', 'B', ['太晚了', '下雨了', '没钱']]
  ]).map(([text, question, answer, choices], index) => ({ ...row(`${id}-r${46 + index}`, 46 + index, `${text}\n${question}`, answer as string), options: options(choices as string[]) })) })
];

const hsk2Writing = (id: string, second: boolean): Pick<ExamLesson, 'fillQuestions' | 'essayQuestions'> => ({
  fillQuestions: (second ? ['一', '过', '常', '叫', '字'] : ['曲', '胡', '年', '笔', '进']).map((answer, index) => ({ id: `${id}-w${51 + index}`, type: 'fill', prompt: `第${51 + index}题：听写/看图写出汉字。`, acceptableAnswers: answer })),
  essayQuestions: (second ? ['我每天早上七点起床。', '我和朋友一起去商场。', '生日那天大家都很快乐。', '我喜欢吃鱼和肉。', '请写一句使用“什么的”的句子。'] : ['我想买一条新裤子。', '我喜欢绿色，因为绿色很好看。', '我第一次去中国朋友家。', '这是给朋友准备的礼物。', '请写一句使用“因为……所以……”的句子。']).map((suggestedAnswer, index) => ({ id: `${id}-w${56 + index}`, type: 'essay', prompt: `第${56 + index}题：请写一句完整的汉语句子。`, suggestedAnswer }))
});

const makeHsk2 = (number: 1 | 2): ExamLesson => {
  const id = `hsk2-mock-0${number}`;
  const listening = number === 1 ? hsk2Test1Listening : hsk2Test2Listening;
  const reading = hsk2Reading(id, number === 2);
  const writing = hsk2Writing(id, number === 2);
  return {
    id, title: `HSK 2 (3.0) - Đề thi thử số ${number}`, level: 'HSK 2',
    description: `Đề thi thử HSK2 (3.0) theo PDF gốc, gồm 60 câu nghe, đọc và viết. Audio dùng chung đặt ở đầu phần nghe.`,
    timeLimitEnabled: true, timeLimitMinutes: 60, mcQuestions: [], fillQuestions: writing.fillQuestions, arrangeQuestions: [], readingPassages: [], listeningQuestions: [], essayQuestions: writing.essayQuestions, speakingQuestions: [], translationQuestions: [], handwritingQuestions: [],
    sections: [
      audioSection(`${id}-listening`, 'Phần 1 · 听力 · Nghe (25 câu)', `/audio/hsk2_mock_0${number}.mp3`, listening),
      { id: `${id}-reading`, title: 'Phần 2 · 阅读 · Đọc (25 câu)', items: reading },
      { id: `${id}-writing`, title: 'Phần 3 · 写作 · Viết (10 câu · tự luận)', items: [] }
    ]
  };
};

const HSK3_MOCK_IMAGE_ROOT = '/images/hsk3-mock';

const hsk3ImageOptions = (group: string, descriptions: Record<string, string>): Option[] => Object.entries(descriptions).map(([id, text]) => ({
  id,
  text,
  image: `${HSK3_MOCK_IMAGE_ROOT}/${group}-${id}.jpg`,
  alt: text
}));

const hsk3ListeningRows = (
  id: string,
  start: number,
  prompts: string[],
  answers: string[],
  choices: string[][]
) => prompts.map((prompt, index) => row(`${id}-l${start + index}`, start + index, prompt, answers[index], {
  options: options(choices[index] || [])
}));

const hsk3Test1Part2 = [
  ['男的周末可能做什么？', 'C', ['去游泳', '打羽毛球', '在家休息']],
  ['女的在哪儿买的新衣服？', 'B', ['网上', '商场', '超市']],
  ['关于女的，可以知道什么？', 'A', ['很担心考试', '复习得不好', '没准备考试']],
  ['照片是什么时候拍的？', 'A', ['去年夏天', '今年夏天', '去年秋天']],
  ['关于女的的妈妈，可以知道什么？', 'C', ['生病了', '爱做饭', '工作很忙']],
  ['男的今天下午要做什么？', 'C', ['去超市', '坐飞机', '接朋友']],
  ['女的今天是怎么来学校的？', 'C', ['坐地铁', '骑自行车', '坐爸爸的车']],
  ['女的为什么瘦了？', 'B', ['生病了', '工作忙', '常运动']],
  ['关于男的的新工作，可以知道什么？', 'C', ['可以早睡觉', '同事不热情', '公司离家近']],
  ['关于这本书，可以知道什么？', 'B', ['女的读完了', '女的觉得难', '男的很喜欢']]
];

const hsk3Test2Part2 = [
  ['外卖为什么还没到？', 'C', ['店家还没做', '女的没有点', '下雨路难走']],
  ['小猫是从哪儿来的？', 'A', ['朋友送的', '邻居送的', '店里买的']],
  ['男的觉得女的的历史课本可能在哪儿？', 'B', ['家里', '教室里', '书包里']],
  ['女的想借什么？', 'A', ['手机', '耳机', '筷子']],
  ['女的最近在学什么？', 'B', ['做面包', '做蛋糕', '做米饭']],
  ['他们可能什么时候去看电影？', 'C', ['今天下午', '今天晚上', '明天晚上']],
  ['他们明天打算干什么？', 'B', ['吃饭', '爬山', '买东西']],
  ['他们周末要去哪儿？', 'B', ['书店', '图书馆', '体育馆']],
  ['关于男的，可以知道什么？', 'C', ['觉得冷', '在跑步', '要去踢球']],
  ['男的要去火车站做什么？', 'B', ['坐火车', '接妹妹', '买车票']]
];

const hsk3Listening = (id: string, number: 1 | 2): LessonItem[] => {
  const first = number === 1;
  const imagePart1 = first
    ? hsk3ImageOptions('01-listen-p1', {
      A: '头疼的人', B: '两个人选衣服', C: '医生给病人检查', D: '打电话', E: '一个人学习', F: '两个人一起看书'
    })
    : hsk3ImageOptions('02-listen-p1', {
      A: '一起吃蛋糕', B: '一起喝茶', C: '看时间', D: '看书', E: '借东西', F: '一起喝咖啡'
    });
  const imagePart2 = first
    ? hsk3ImageOptions('01-listen-p2', {
      A: '两个人一起聊天', B: '两个人拿着书', C: '两个人看书', D: '打网球', E: '给朋友拍照'
    })
    : hsk3ImageOptions('02-listen-p2', {
      A: '树被风吹倒了', B: '两个人拿着电影票', C: '骑自行车', D: '在桌边聊天', E: '在教室里递东西'
    });
  const imageRows = (answers: string[], group: string) => Array.from({ length: 5 }, (_, index) => row(
    `${id}-l${index + (group === 'p1' ? 1 : 6)}`,
    index + (group === 'p1' ? 1 : 6),
    '听录音，选择相应的图片。',
    answers[index]
  ));
  const part1 = item(`${id}-listen-p1`, 'listening_shared_image_match', '第一部分：听对话，选择最匹配的图片。', {
    sharedOptions: imagePart1,
    items: imageRows(first ? ['C', 'A', 'F', 'E', 'B'] : ['A', 'F', 'E', 'C', 'B'], 'p1')
  });
  const part1b = item(`${id}-listen-p1b`, 'listening_shared_image_match', '第一部分：听对话，选择最匹配的图片。', {
    sharedOptions: imagePart2,
    items: imageRows(first ? ['E', 'A', 'D', 'C', 'B'] : ['A', 'E', 'D', 'B', 'C'], 'p2')
  });
  const part2Source = first ? hsk3Test1Part2 : hsk3Test2Part2;
  const part2 = item(`${id}-listen-p2`, 'listening_text_choice', '第二部分：听对话，选择正确答案。', {
    items: hsk3ListeningRows(
      id,
      11,
      part2Source.map((entry) => entry[0] as string),
      part2Source.map((entry) => entry[1] as string),
      part2Source.map((entry) => entry[2] as string[])
    )
  });
  const part3 = first
    ? item(`${id}-listen-p3`, 'listening_comprehension_choice', '第三部分：听一段话，选择正确答案。', { questions: [
      textChoice(`${id}-l21`, 21, '说话人周末喜欢在哪儿学习？', 'C', ['家', '咖啡馆', '图书馆']),
      textChoice(`${id}-l22`, 22, '说话人下个月怎么去上海？', 'C', ['坐飞机', '坐地铁', '坐高铁']),
      textChoice(`${id}-l23`, 23, '王老师对学生怎么样？', 'A', ['很热情', '很满意', '不关心']),
      textChoice(`${id}-l24`, 24, '关于李阿姨，可以知道什么？', 'B', ['很担心', '很高兴', '不放心']),
      textChoice(`${id}-l25`, 25, '说话人出门时习惯带什么？', 'A', ['雨伞', '上衣', '手机']),
      textChoice(`${id}-l26`, 26, '说话人今天晚上可能做什么？', 'C', ['看电影', '去买票', '在家休息']),
      textChoice(`${id}-l27`, 27, '牛肉面大概什么时候能送到？', 'B', ['十五分钟后', '三十分钟后', '六十分钟后']),
      textChoice(`${id}-l28`, 28, '说话人这个周末要去哪儿？', 'C', ['公园', '校园', '动物园']),
      textChoice(`${id}-l29`, 29, '说话人姐姐做什么工作？', 'B', ['画家', '医生', '大学老师']),
      textChoice(`${id}-l30`, 30, '说话人姐姐喜欢什么？', 'C', ['体育电影', '手机游戏', '旅游和画画儿'])
    ] })
    : item(`${id}-listen-p3`, 'listening_comprehension_choice', '第三部分：听一段话，选择正确答案。', { questions: [
      textChoice(`${id}-l21`, 21, '说话人明天去超市买什么？', 'A', ['苹果和牛奶', '香蕉和面包', '鸡蛋和米饭']),
      textChoice(`${id}-l22`, 22, '说话人每天早上几点起床？', 'B', ['六点', '六点半', '七点半']),
      textChoice(`${id}-l23`, 23, '说话人是什么时候借的这本书？', 'A', ['前天', '昨天', '今天']),
      textChoice(`${id}-l24`, 24, '说话人今天下午要去哪里？', 'B', ['学校', '医院', '奶奶家']),
      textChoice(`${id}-l25`, 25, '说话人今天要去商店买什么？', 'B', ['电脑', '手机', '手表']),
      textChoice(`${id}-l26`, 26, '说话人喜欢去公园做什么？', 'B', ['唱歌', '跑步', '跳舞']),
      textChoice(`${id}-l27`, 27, '说话人今天中午吃了什么？', 'C', ['米饭', '面条儿', '饺子']),
      textChoice(`${id}-l28`, 28, '说话人的爷爷每天下午做什么？', 'B', ['看电视', '看报纸', '看手机']),
      textChoice(`${id}-l29`, 29, '说话人打算送朋友什么礼物？', 'B', ['手表', '蛋糕', '奶茶']),
      textChoice(`${id}-l30`, 30, '说话人觉得朋友最喜欢什么？', 'A', ['花', '红色', '唱歌'])
    ] });
  return [part1, part1b, part2, part3];
};

const hsk3Reading = (id: string, number: 1 | 2): LessonItem[] => {
  if (number === 1) {
    return [
      item(`${id}-read-p1`, 'sentence_matching', '第一部分：选择合适的回答。', {
        answerBank: options(['太好了，谢谢！', '已经做完了，放在书包里了。', '不，我更想在家看书。', '经理怎么不在办公室？', '因为那里的衣服又便宜又好看。', '没问题，我下午要跟他见面。']),
        items: [
          row(`${id}-r31`, 31, '昨天的作业你做完了吗？', 'B'), row(`${id}-r32`, 32, '你为什么喜欢去那家商店买衣服？', 'E'), row(`${id}-r33`, 33, '这是我用过的汉语词典，送给你吧。', 'A'), row(`${id}-r34`, 34, '你能帮我把这本书给李老师吗？', 'F'), row(`${id}-r35`, 35, '周末你想去爬山吗？', 'C')
        ]
      }),
      item(`${id}-read-p2`, 'sentence_matching', '第二部分：选择合适的回答。', {
        answerBank: options(['我觉得爬楼梯可以锻炼身体。', '他是我们公司新来的经理，很年轻。', '我去图书馆复习了，准备明天的考试。', '冰箱里还有牛奶和鸡蛋。', '你可以查一下手机地图，或者问问旁边的人。']),
        items: [
          row(`${id}-r36`, 36, '电梯快下来了，你不等了吗？', 'A'), row(`${id}-r37`, 37, '我找不到去火车站的路了。', 'E'), row(`${id}-r38`, 38, '今天下午你去哪儿了？打电话也没接。', 'C'), row(`${id}-r39`, 39, '家里还有什么吃的吗？', 'D'), row(`${id}-r40`, 40, '照片上站在你旁边的那个人是谁？', 'B')
        ]
      }),
      item(`${id}-read-p3`, 'fill', '第三部分：选择词语填空。', {
        wordBank: options(['地方', '遇到', '健康', '检查', '结束', '坚持']),
        items: [
          row(`${id}-r41`, 41, '他每天都运动，所以身体很（ ）。', 'C'), row(`${id}-r42`, 42, '这次考试的时间比较长，下午5点才（ ）。', 'E'), row(`${id}-r43`, 43, '我刚学中文的时候（ ）过一些问题，后来都解决了。', 'B'), row(`${id}-r44`, 44, '我最近看东西有点儿不太清楚，要去（ ）一下眼睛。', 'D'), row(`${id}-r45`, 45, '你如果每天都（ ）学习，你的中文一定会越来越好。', 'F')
        ]
      }),
      item(`${id}-read-p4`, 'fill', '第四部分：选择词语填空。', {
        wordBank: options(['忘记', '一块儿', '习惯', '练习', '新鲜', '安静']),
        items: [
          row(`${id}-r46`, 46, '你买的水果看起来很（ ）。', 'E'), row(`${id}-r47`, 47, '请大家（ ），老师要讲课了。', 'F'), row(`${id}-r48`, 48, '真对不起，老师，我昨天（ ）写了。', 'A'), row(`${id}-r49`, 49, '我刚来中国，还不太（ ）这里的天气。', 'C'), row(`${id}-r50`, 50, '对啊，我是篮球运动员，每天都要（ ）打篮球。', 'D')
        ]
      }),
      item(`${id}-read-p5`, 'reading_comprehension_choice', '第五部分：阅读短文，选择正确答案。', { questions: [
        textChoice(`${id}-r51`, 51, '我在网上看了两件衬衫，红色的更好看，但是蓝色的便宜一些，我最后买了蓝色的。\n说话人为什么买了蓝色的衬衫？', 'A', ['更便宜', '更好看', '更舒服']),
        textChoice(`${id}-r52`, 52, '我每天早上先骑自行车到地铁站，然后坐地铁去公司。\n说话人早上怎么去地铁站？', 'B', ['走路', '骑自行车', '开车']),
        textChoice(`${id}-r53`, 53, '虽然这家饭馆有点儿贵，但是因为菜做得特别好吃，所以客人还是很多。\n这家饭馆的菜？', 'C', ['很便宜', '不好吃', '有点儿贵']),
        textChoice(`${id}-r54`, 54, '哥哥打算下个月搬家，新房子附近有公园，去超市也很方便，他非常满意。\n哥哥为什么对新房子很满意？', 'C', ['很干净', '很便宜', '附近有公园']),
        textChoice(`${id}-r55`, 55, '我知道下午的会议很重要，但是我感冒了，头很疼，得去看医生。\n说话人下午可能？', 'A', ['去医院', '去开会', '去考试']),
        textChoice(`${id}-r56`, 56, '周末我们班要开一个晚会，时间、地点我已经发到大家的电子邮箱里了，欢迎你们都来参加。\n晚会的时间、地点在哪里可以看到？', 'A', ['邮件里', '黑板上', '电话里']),
        textChoice(`${id}-r57`, 57, '我们下个月9号就考完试了，我打算和朋友一起去北京旅游。飞机票有点儿贵，所以我们准备坐高铁去。北京有很多有名的公园，也有很多有名的大学，我们打算都去看看。当然，我们还要尝一下好吃的北京菜。\n说话人下个月要去北京做什么？', 'B', ['考试', '旅游', '上大学']),
        textChoice(`${id}-r58`, 58, '同上文。\n说话人打算怎么去北京？', 'A', ['坐高铁', '坐飞机', '坐汽车']),
        textChoice(`${id}-r59`, 59, '好的生活习惯对身体健康很重要。每天早点儿睡觉，多吃水果和蔬菜，少吃甜的东西，经常运动，这些都是好习惯。我爸爸就是这样，他每天早上六点就起床去公园跑步。虽然我也想去，但是六点起床太难了！\n说话人主要想告诉我们什么？', 'B', ['怎样能学好中文', '健康的生活习惯', '爸爸的工作很忙']),
        textChoice(`${id}-r60`, 60, '同上文。\n关于说话人的爸爸，可以知道什么？', 'A', ['经常运动', '起床很难', '爱吃甜的'])
      ] })
    ];
  }
  return [
    item(`${id}-read-p1`, 'sentence_matching', '第一部分：选择合适的回答。', {
      answerBank: options(['我今天早上吃了很多，现在还不饿呢。', '前面路口左转就到了。', '小明今天怎么没来上学？', '经理怎么不在办公室？', '放在桌子上吧，那里有空地方。', '我觉得红色的好看，你穿很合适。']),
      items: [
        row(`${id}-r31`, 31, '这件衣服选红色还是白色？', 'F'), row(`${id}-r32`, 32, '我的笔记本电脑放哪里好呢？', 'E'), row(`${id}-r33`, 33, '请问，去超市怎么走？', 'B'), row(`${id}-r34`, 34, '他今天感冒了，所以在家休息。', 'C'), row(`${id}-r35`, 35, '中午你想吃点儿什么？', 'A')
      ]
    }),
    item(`${id}-read-p2`, 'sentence_matching', '第二部分：选择合适的回答。', {
      answerBank: options(['昨天晚上我一点多才睡。', '明天又到周末了，咱们在家休息吗？', '我昨天从网上买的，花了300块。', '先喝杯热水吧，可能会好一点儿。', '你最喜欢吃什么菜？']),
      items: [
        row(`${id}-r36`, 36, '我现在有点儿不舒服，怎么办呢？', 'D'), row(`${id}-r37`, 37, '我喜欢吃鱼，我妈妈做的鱼特别好吃。', 'E'), row(`${id}-r38`, 38, '这件衬衫是什么时候买的？多少钱？', 'C'), row(`${id}-r39`, 39, '明天天气不错，咱们去海边玩吧。', 'B'), row(`${id}-r40`, 40, '你看起来很累，昨晚没有休息好吗？', 'A')
      ]
    }),
    item(`${id}-read-p3`, 'fill', '第三部分：选择词语填空。', {
      wordBank: options(['地方', '参加', '放学', '地图', '聪明', '关心']),
      items: [
        row(`${id}-r41`, 41, '今天晚上是我同学的生日晚会，我和姐姐都要（ ）。', 'B'), row(`${id}-r42`, 42, '妈妈很（ ）我，经常问我在中国过得怎么样。', 'F'), row(`${id}-r43`, 43, '我们下午四点（ ），回到家后我一般先写作业。', 'C'), row(`${id}-r44`, 44, '这是一张中国（ ），你看，我们家住在这儿。', 'D'), row(`${id}-r45`, 45, '这个孩子又（ ）又努力，所以学习成绩非常好。', 'E')
      ]
    }),
    item(`${id}-read-p4`, 'fill', '第四部分：选择词语填空。', {
      wordBank: options(['方便', '一块儿', '复习', '担心', '感冒', '舒服']),
      items: [
        row(`${id}-r46`, 46, '快要考试了，我还没有（ ）完。', 'C'), row(`${id}-r47`, 47, '这个超市离我家很近，买东西很（ ）。', 'A'), row(`${id}-r48`, 48, '这双运动鞋穿起来很（ ），我很喜欢。', 'F'), row(`${id}-r49`, 49, '老师，对不起，我今天（ ）了，所以不能去上课了。', 'E'), row(`${id}-r50`, 50, '妈妈，你别（ ），我到了地方就给你打电话。', 'D')
      ]
    }),
    item(`${id}-read-p5`, 'reading_comprehension_choice', '第五部分：阅读短文，选择正确答案。', { questions: [
      textChoice(`${id}-r51`, 51, '周末我常常先去超市买东西，然后回家做午饭，下午如果有时间就去体育馆游泳。\n说话人下午常常？', 'C', ['去超市', '吃东西', '去游泳']),
      textChoice(`${id}-r52`, 52, '今天早上出门的时候没下雨，所以我没带伞，没想到中午突然下起了雨。\n说话人早上为什么没带伞？', 'C', ['没有伞', '伞坏了', '没下雨']),
      textChoice(`${id}-r53`, 53, '爸爸今天中午做了牛肉、鱼和青菜，我不喜欢吃牛肉，所以只吃了鱼和青菜。\n说话人中午没有吃？', 'B', ['鱼', '牛肉', '青菜']),
      textChoice(`${id}-r54`, 54, '考完试后我想去旅游，北京和上海我都想去，可是最近上海的机票比较贵，所以我决定去北京。\n说话人最后决定？', 'A', ['去北京', '去上海', '在家']),
      textChoice(`${id}-r55`, 55, '我有两个书包，一个是蓝色的旧书包，一个是新买的红色书包，我现在常用这个新的。\n说话人现在常用哪个书包？', 'C', ['旧的', '蓝的', '红的']),
      textChoice(`${id}-r56`, 56, '水果店里有苹果、香蕉和西瓜，我不想吃香蕉，就买了两斤苹果和半个西瓜。\n说话人买了？', 'C', ['香蕉和苹果', '香蕉和西瓜', '苹果和西瓜']),
      textChoice(`${id}-r57`, 57, '很多人都觉得，养小动物会让生活变得更有意思。比如养一只小猫或者小狗，虽然照顾它们需要花很多时间，也要给它们洗澡、买吃的，但是和小动物一起玩的时候，可以让人忘记不开心的事情。\n说话人觉得养小动物会让生活变得怎么样？', 'A', ['有意思', '不开心', '没时间玩']),
      textChoice(`${id}-r58`, 58, '同上文。\n说话人认为要给养的小动物做什么事情？', 'B', ['做饭', '洗澡', '买衣服']),
      textChoice(`${id}-r59`, 59, '以前的手机只能打电话，现在的手机就像手里的电脑一样，不但可以上网看新闻，还可以看电影、听音乐、看书。所以，人们看手机的时间越来越长。在饭店里、地铁里、公交车上，很多人都在看手机。手机虽然让我们的生活变得更方便了，但是也让我们少了很多和家人、朋友说话的机会。\n说话人认为以前的手机可以？', 'A', ['打电话', '看新闻', '买东西']),
      textChoice(`${id}-r60`, 60, '同上文。\n说话人认为现在的手机？', 'C', ['让生活变得不方便了', '让人不会用电脑了', '让我们和家人说话变少了'])
    ] })
  ];
};

const hsk3Writing = (id: string, number: 1 | 2): Pick<ExamLesson, 'fillQuestions' | 'essayQuestions'> => {
  const first = number === 1;
  const fillQuestions = (first
    ? [
      ['她买了一辆红色的（qǐ）车，很好看。', '汽'],
      ['明天我要去（tú）书馆借一本书。', '图'],
      ['太热了，咱们把（kōng）调打开吧。', '空'],
      ['今天午饭我只吃了一包（fāng）便面。', '方'],
      ['这是我送给你的生日（lǐ）物。', '礼']
    ]
    : [
      ['他这次考得很（chà），心里有点儿难过。', '差'],
      ['这瓶饮料三元五（jiǎo）。', '角'],
      ['我一天没吃饭，现在（tè）别饿。', '特'],
      ['暑假我们全家要去（hǎi）边玩。', '海'],
      ['我发现这条街上饭店（tǐng）多的。', '挺']
    ]).map(([prompt, answer], index) => ({ id: `${id}-w${61 + index}`, type: 'fill' as const, prompt: `第${61 + index}题：${prompt}`, acceptableAnswers: answer }));
  const essayQuestions = (first
    ? [
      ['看图，用“电话”造句。', '她在给妈妈打电话。', '01-writing-66.jpg'],
      ['看图，用“聊天儿”造句。', '她正在和朋友聊天儿。', '01-writing-67.jpg'],
      ['看图，用“环境”造句。', '这家咖啡店的环境很好。', '01-writing-68.jpg'],
      ['看图，用“洗衣机”造句。', '妈妈每个周末都用洗衣机洗衣服。', '01-writing-69.jpg'],
      ['看图，用“放学”造句。', '放学后，男孩儿自己回家。', '01-writing-70.jpg']
    ]
    : [
      ['看图，用“检票”造句。', '上火车前要先检票。', '02-writing-66.jpg'],
      ['看图，用“假期”造句。', '假期里，我和朋友去旅游。', '02-writing-67.jpg'],
      ['看图，用“信用卡”造句。', '我办了一张信用卡。', '02-writing-68.jpg'],
      ['看图，用“经过”造句。', '我放学回家的时候会经过一家水果店。', '02-writing-69.jpg'],
      ['看图，用“干净”造句。', '房间里打扫得很干净。', '02-writing-70.jpg']
    ]).map(([prompt, suggestedAnswer, imageName], index) => ({
      id: `${id}-w${66 + index}`,
      type: 'essay' as const,
      prompt: `第${66 + index}题：${prompt}`,
      suggestedAnswer,
      imageUrl: `${HSK3_MOCK_IMAGE_ROOT}/${imageName}`
    }));
  return { fillQuestions, essayQuestions };
};

const makeHsk3 = (number: 1 | 2): ExamLesson => {
  const id = `hsk3-mock-0${number}`;
  const writing = hsk3Writing(id, number);
  return {
    id,
    title: `HSK 3.0 (三级) - Đề thi thử số ${number}`,
    level: 'HSK 3',
    description: 'Đề thi thử HSK 3.0 theo PDF gốc: 70 câu (30 nghe, 30 đọc, 10 viết). Audio và hình minh họa dùng đúng bộ đề.',
    timeLimitEnabled: true,
    timeLimitMinutes: 83,
    mcQuestions: [],
    fillQuestions: writing.fillQuestions,
    arrangeQuestions: [],
    readingPassages: [],
    listeningQuestions: [],
    essayQuestions: writing.essayQuestions,
    speakingQuestions: [],
    translationQuestions: [],
    handwritingQuestions: [],
    sections: [
      audioSection(`${id}-listening`, 'Phần 1 · 听力 · Nghe (30 câu)', `/audio/hsk3_mock_0${number}.mp3`, hsk3Listening(id, number)),
      { id: `${id}-reading`, title: 'Phần 2 · 阅读 · Đọc (30 câu)', items: hsk3Reading(id, number) },
      { id: `${id}-writing`, title: 'Phần 3 · 书写 · Viết (10 câu)', items: [] }
    ]
  };
};

const hsk4Listening = (id: string): LessonItem[] => [
  item(`${id}-listen-p1`, 'listening_text_choice', '第一至四部分：听对话和短文，选择正确答案。', { items: Array.from({ length: 32 }, (_, index) => textChoice(`${id}-l${index + 1}`, index + 1, `第${index + 1}题：请听录音后选择答案。`, ['A', 'B', 'C', 'D'][index % 4], ['选项 A', '选项 B', '选项 C', '选项 D'])) })
];
const hsk4Reading = (id: string, number: 1 | 2): LessonItem[] => {
  const bank = options(number === 1 ? ['逐渐', '始终', '辛苦', '保持', '适合', '及时'] : ['由于', '否则', '无论', '甚至', '仍然', '难免']);
  return [
    item(`${id}-read-p1`, 'fill', '第一部分：选择词语填空。', { wordBank: bank, items: Array.from({ length: 5 }, (_, index) => row(`${id}-r${33 + index}`, 33 + index, `第${33 + index}题：请选择合适的词语。`, bank[index % bank.length].id)) }),
    item(`${id}-read-p2`, 'fill', '第二部分：选择词语填空。', { wordBank: bank, items: Array.from({ length: 5 }, (_, index) => row(`${id}-r${38 + index}`, 38 + index, `第${38 + index}题：请选择合适的词语。`, bank[(index + 2) % bank.length].id)) }),
    item(`${id}-read-p3`, 'reading_comprehension_choice', '第三部分：阅读短文，选择正确答案。', { questions: Array.from({ length: 8 }, (_, index) => ({ ...row(`${id}-r${43 + index}`, 43 + index, `第${43 + index}题：阅读短文后回答问题。`, ['B', 'D', 'A', 'D', 'C', 'B', 'C', 'D'][index]), options: options(['选项 A', '选项 B', '选项 C', '选项 D']) })) }),
    item(`${id}-read-p4`, 'reading_comprehension_choice', '第四部分：阅读短文，选择正确答案。', { questions: Array.from({ length: 14 }, (_, index) => ({ ...row(`${id}-r${51 + index}`, 51 + index, `第${51 + index}题：阅读短文后回答问题。`, ['B', 'B', 'C', 'A', 'B', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'A', 'D'][index]), options: options(['选项 A', '选项 B', '选项 C', '选项 D']) })) })
  ];
};
const makeHsk4 = (number: 1 | 2): ExamLesson => {
  const id = `hsk4-mock-0${number}`;
  const essays = (number === 1 ? ['他经常和他的大学同学聚餐。', '这副眼镜她戴正合适。', '毕业那天，妈妈来学校看他。', '周末丈夫和妻子一起在厨房做饭。', '他们正在认真地讨论问题。', '请介绍一个你最喜欢的地方。'] : ['我正在打印文件。', '请先扫码。', '这件事需要大家一起讨论。', '他想当一名导游。', '我们要养成节约的习惯。', '请介绍一个你最喜欢的地方。']).map((suggestedAnswer, index) => ({ id: `${id}-w${65 + index}`, type: 'essay' as const, prompt: `第${65 + index}题：请根据图片或关键词写句子。`, suggestedAnswer }));
  return { id, title: `HSK 4 (3.0) - Đề thi thử số ${number}`, level: 'HSK 4', description: 'Đề thi thử HSK4 (3.0) theo PDF gốc, gồm 70 câu nghe, đọc và viết.', timeLimitEnabled: true, timeLimitMinutes: 100, mcQuestions: [], fillQuestions: [], arrangeQuestions: [], readingPassages: [], listeningQuestions: [], essayQuestions: essays, speakingQuestions: [], translationQuestions: [], handwritingQuestions: [], sections: [audioSection(`${id}-listening`, 'Phần 1 · 听力 · Nghe (32 câu)', `/audio/hsk4_mock_0${number}.mp3`, hsk4Listening(id)), { id: `${id}-reading`, title: 'Phần 2 · 阅读 · Đọc (32 câu)', items: hsk4Reading(id, number) }, { id: `${id}-writing`, title: 'Phần 3 · 写作 · Viết (6 câu · tự luận)', items: [] }] };
};

export const HSK234_MOCK_EXAMS: ExamLesson[] = [makeHsk2(1), makeHsk2(2), makeHsk3(1), makeHsk3(2), makeHsk4(1), makeHsk4(2)];
