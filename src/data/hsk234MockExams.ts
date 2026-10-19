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

const HSK2_MOCK_IMAGE_ROOT = '/images/hsk2-mock-colored';

const hsk2ImageOptions = (entries: Record<string, { text: string; file: string }>): Option[] => Object.entries(entries).map(([id, entry]) => ({
  id, text: entry.text, image: `${HSK2_MOCK_IMAGE_ROOT}/${entry.file}`, alt: entry.text
}));
const hsk2ImageChoice = (id: string, number: number, prompt: string, answer: string, entries: Record<string, { text: string; file: string }>) => row(id, number, prompt, answer, { options: hsk2ImageOptions(entries) });

const hsk2Test1Listening: LessonItem[] = [
  item('hsk2-1-listen-p1', 'listening_image_choice', '第一部分：听句子，选择与句子相符的图片。', { items: [
    hsk2ImageChoice('hsk2-1-l1', 1, '别忘了你的咖啡。', 'C', { A: { text: '两个人散步', file: 'sheet1-1.png' }, B: { text: '递东西', file: 'sheet3-1.png' }, C: { text: '拿着咖啡', file: 'hot-tea.png' } }),
    hsk2ImageChoice('hsk2-1-l2', 2, '她的头有点儿疼。', 'B', { A: { text: '肚子疼', file: 'sheet1-6.png' }, B: { text: '头疼', file: 'sheet0-2.png' }, C: { text: '牙疼', file: 'sheet1-5.png' } }),
    hsk2ImageChoice('hsk2-1-l3', 3, '孩子们正在快乐地游泳呢。', 'A', { A: { text: '孩子游泳', file: 'sheet0-3.png' }, B: { text: '孩子玩耍', file: 'sheet2-3.png' }, C: { text: '孩子学习', file: 'sheet2-1.png' } }),
    hsk2ImageChoice('hsk2-1-l4', 4, '朋友送给我两张电影票。', 'C', { A: { text: '钢笔', file: 'sheet3-2.png' }, B: { text: '手表', file: 'sheet3-3.png' }, C: { text: '电影票', file: 'sheet0-4.png' } }),
    hsk2ImageChoice('hsk2-1-l5', 5, '您一不舒服就给我们打电话。', 'A', { A: { text: '医生检查病人', file: 'sheet1-6.png' }, B: { text: '超市买东西', file: 'sheet2-4.png' }, C: { text: '骑自行车', file: 'sheet4-1.png' } })
  ] }),
  item('hsk2-1-listen-p2a', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: hsk2ImageOptions({ A: { text: '在网上买东西', file: 'sheet3-2.png' }, B: { text: '在饭店吃饭', file: 'sheet3-6.png' }, C: { text: '介绍朋友', file: 'sheet3-1.png' }, D: { text: '踢足球', file: 'sheet3-5.png' }, E: { text: '一家人在一起', file: 'sheet0-6.png' }, F: { text: '跑步出门', file: 'sheet3-5.png' } }),
    items: [row('hsk2-1-l6', 6, '你们家谁个子最高？', 'E'), row('hsk2-1-l7', 7, '请进！先生，您几位？', 'B'), row('hsk2-1-l8', 8, '你知道哪儿卖衣服便宜吗？', 'A'), row('hsk2-1-l9', 9, '我来介绍一下，这是我最好的朋友。', 'C'), row('hsk2-1-l10', 10, '这么早就出门啊？', 'F')]
  }),
  item('hsk2-1-listen-p2b', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: hsk2ImageOptions({ A: { text: '在饭店点菜', file: 'sheet3-6.png' }, B: { text: '在电脑前学习', file: 'sheet3-2.png' }, C: { text: '有小鸟图案的包', file: 'sheet3-3.png' }, D: { text: '在商场买衣服', file: 'clothes-shopping.png' }, E: { text: '踢足球', file: 'sheet3-5.png' } }),
    items: [row('hsk2-1-l11', 11, '你还是自己点吧。', 'A'), row('hsk2-1-l12', 12, '您要找的包是什么样的？', 'C'), row('hsk2-1-l13', 13, '就要下雨了，大家别踢了。', 'E'), row('hsk2-1-l14', 14, '你坐得离电脑太近了，这样对眼睛不好。', 'B'), row('hsk2-1-l15', 15, '妈妈不希望我花太多钱给孩子买衣服。', 'D')]
  }),
  item('hsk2-1-listen-p3', 'listening_comprehension_choice', '第三部分：听短文和问题，选择正确答案。', { questions: [
    textChoice('hsk2-1-l16', 16, '他们在哪儿？', 'C', ['机场', '地铁站', '公交车站']), textChoice('hsk2-1-l17', 17, '男的要做什么？', 'A', ['去找朋友', '准备考试', '去上班']), textChoice('hsk2-1-l18', 18, '名字写在哪儿？', 'A', ['本子上', '书包上', '桌子上']), textChoice('hsk2-1-l19', 19, '男的是怎么学会跳舞的？', 'C', ['老师教的', '朋友教的', '跟着网上的音乐学的']), textChoice('hsk2-1-l20', 20, '今天星期几？', 'A', ['星期六', '星期五', '星期日']), textChoice('hsk2-1-l21', 21, '那家饭馆怎么样？', 'C', ['很新', '很远', '很好吃']), textChoice('hsk2-1-l22', 22, '电影几点开始？', 'C', ['六点', '六点半', '七点半']), textChoice('hsk2-1-l23', 23, '医生让女的做什么？', 'B', ['多喝咖啡', '多喝牛奶、多吃菜', '多喝奶茶']), textChoice('hsk2-1-l24', 24, '男的怎么回家？', 'C', ['开车', '坐火车', '坐飞机']), textChoice('hsk2-1-l25', 25, '说话人哥哥的学校怎么样？', 'C', ['教室很小', '学生很少', '学生很多'])
  ] })
];

const hsk2Test2Listening: LessonItem[] = [
  item('hsk2-2-listen-p1', 'listening_image_choice', '第一部分：听句子，选择与句子相符的图片。', { items: [
    hsk2ImageChoice('hsk2-2-l1', 1, '老师，这个题我会做。', 'B', { A: { text: '看电视', file: 'sheet2-1.png' }, B: { text: '在教室学习', file: 'sheet3-2.png' }, C: { text: '一个人学习', file: 'sheet4-2.png' } }),
    hsk2ImageChoice('hsk2-2-l2', 2, '大家在地铁上可以玩玩手机、上上网。', 'A', { A: { text: '在地铁上看手机', file: 'sheet2-2.png' }, B: { text: '在办公室工作', file: 'sheet3-2.png' }, C: { text: '在地铁上看书', file: 'sheet4-1.png' } }),
    hsk2ImageChoice('hsk2-2-l3', 3, '谢谢！有你帮忙，妈妈做得快多了。', 'A', { A: { text: '妈妈和孩子做饭', file: 'cook-together.png' }, B: { text: '骑自行车', file: 'sheet4-1.png' }, C: { text: '一起跑步', file: 'sheet3-5.png' } }),
    hsk2ImageChoice('hsk2-2-l4', 4, '我太喜欢家门口这些花了。', 'C', { A: { text: '送花', file: 'sheet3-6.png' }, B: { text: '买花', file: 'sheet2-4.png' }, C: { text: '阳台上的花', file: 'sheet2-5.png' } }),
    hsk2ImageChoice('hsk2-2-l5', 5, '他们经常一起看电影。', 'C', { A: { text: '在家聊天', file: 'sheet2-1.png' }, B: { text: '看书', file: 'sheet0-6.png' }, C: { text: '在电影院看电影', file: 'sheet2-4.png' } })
  ] }),
  item('hsk2-2-listen-p2a', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: hsk2ImageOptions({ A: { text: '在超市买东西', file: 'sheet2-4.png' }, B: { text: '在公交车上让座', file: 'bus-give-seat.png' }, C: { text: '医生给病人检查', file: 'sheet1-6.png' }, D: { text: '踢足球', file: 'sheet3-5.png' }, E: { text: '在窗边看风景', file: 'sheet0-6.png' }, F: { text: '家人一起吃饭', file: 'sheet4-6.png' } }),
    items: [row('hsk2-2-l6', 6, '您慢一点儿，请坐这儿吧。', 'B'), row('hsk2-2-l7', 7, '和爸、妈，新年快乐！', 'F'), row('hsk2-2-l8', 8, '请问去地铁站怎么走？', 'A'), row('hsk2-2-l9', 9, '我们一起出去玩雪吧。', 'E'), row('hsk2-2-l10', 10, '你哪儿不舒服？', 'C')]
  }),
  item('hsk2-2-listen-p2b', 'listening_shared_image_match', '第二部分：听对话，选择正确的图片。', {
    sharedOptions: hsk2ImageOptions({ A: { text: '在饭店看菜单', file: 'sheet3-6.png' }, B: { text: '雨天骑车', file: 'sheet4-1.png' }, C: { text: '包里的东西', file: 'sheet3-3.png' }, D: { text: '一起跳舞', file: 'sheet3-5.png' }, E: { text: '两个好朋友', file: 'sheet3-1.png' } }),
    items: [row('hsk2-2-l11', 11, '她们几个谁跳得最好？', 'D'), row('hsk2-2-l12', 12, '不好意思，我晚十分钟到！', 'B'), row('hsk2-2-l13', 13, '你看见我的手表了吗？', 'C'), row('hsk2-2-l14', 14, '这是我第一次来这家饭店。', 'A'), row('hsk2-2-l15', 15, '她们两个是姐妹吗？', 'E')]
  }),
  item('hsk2-2-listen-p3', 'listening_comprehension_choice', '第三部分：听短文和问题，选择正确答案。', { questions: [
    textChoice('hsk2-2-l16', 16, '他们在哪儿？', 'B', ['书店', '饭店', '花店']), textChoice('hsk2-2-l17', 17, '男的想做什么？', 'B', ['回北京', '去北京旅游', '介绍北京']), textChoice('hsk2-2-l18', 18, '女的要男的帮着做什么？', 'C', ['买东西', '找东西', '拿书包']), textChoice('hsk2-2-l19', 19, '女的不让男的做什么？', 'C', ['看时间', '看电脑', '看手机']), textChoice('hsk2-2-l20', 20, '女的现在在哪儿？', 'B', ['楼外边', '楼上边', '楼下边']), textChoice('hsk2-2-l21', 21, '男的怎么了？', 'A', ['生病了', '没药了', '家里有事']), textChoice('hsk2-2-l22', 22, '男的现在最可能在哪儿？', 'B', ['公司', '机场', '地铁站']), textChoice('hsk2-2-l23', 23, '女的让男的做什么？', 'A', ['做饭', '工作', '跟孩子玩']), textChoice('hsk2-2-l24', 24, '电影什么时候开始？', 'C', ['八点', '八点二十', '八点十分']), textChoice('hsk2-2-l25', 25, '奶奶正在忙什么？', 'A', ['准备过年的饭菜', '买衣服', '准备回家'])
  ] })
];

const hsk2Reading = (id: string, second: boolean): LessonItem[] => {
  const imageBank = second ? { A: { text: '妈妈教孩子游泳', file: 'sheet5-1.png' }, B: { text: '熬夜睡觉', file: 'sheet5-2.png' }, C: { text: '老师给学生改作业', file: 'sheet5-3.png' }, D: { text: '打篮球', file: 'basketball.png' }, E: { text: '妈妈安慰孩子', file: 'sheet5-5.png' }, F: { text: '在健身房跑步', file: 'sheet5-6.png' } } : { A: { text: '两个人在地铁站等车', file: 'metro-wait.png' }, B: { text: '做饭', file: 'cook-together.png' }, C: { text: '坐公交车', file: 'bus-give-seat.png' }, D: { text: '打篮球', file: 'basketball.png' }, E: { text: '喝热茶', file: 'hot-tea.png' }, F: { text: '在商场看衣服', file: 'clothes-shopping.png' } };
  const matching = (answers: string[], prompts: string[], start: number) => prompts.map((prompt, index) => row(`${id}-r${start + index}`, start + index, prompt, answers[index]));
  return [
    item(`${id}-read-p1`, 'reading_shared_image_match', '第一部分：读句子，选择对应的图片。', { sharedOptions: hsk2ImageOptions(imageBank), items: second ? matching(['E', 'C', 'F', 'A', 'B'], ['你怎么了？可以跟我说说吗？', '你看，这里是不是写错了？我没看懂。', '她喜欢听着歌做运动。', '我的游泳是妈妈教的。', '别睡那么晚，对身体不好。'], 26) : matching(['C', 'F', 'A', 'E', 'B'], ['请让一让好吗？我要下车。', '你想好买哪条裤子了吗？', '我们可以坐地铁去机场。', '天一冷，我就想喝杯热茶。', '做这个菜太花时间了，我们还是出去吃吧。'], 26) }),
    item(`${id}-read-p2`, 'fill', '第二部分：选择词语填空。', { wordBank: options(second ? ['进去', '回去', '出来', '里面', '多', '前面'] : ['过', '次', '得', '的', '多', '但']), items: second ? matching(['B', 'C', 'D', 'A', 'F'], ['喂，我现在有事，一会儿给你打（ ）好吗？', '她弟弟已经上中学了，我一开始都没认（ ）。', '我爱看书，因为书（ ）有很多好玩儿的东西。', '快（ ）吧，外面太冷了。', '开车的时候，看好（ ）的路。'], 31) : matching(['D', 'B', 'A', 'F', 'C'], ['她是昨天下午去（ ）医院。', '这个药一天吃三（ ）。', '你出（ ）国吗？', '这家商场不大，（ ）东西很多。', '孩子们笑（ ）真好看。'], 31) }),
    item(`${id}-read-p3`, 'sentence_matching', '第三部分：选择合适的回答。', { answerBank: options(second ? ['你买到回家的机票了吗？', '小林画的画儿真漂亮啊！', '我们什么时候再见面啊？', '我们今晚去KTV唱歌，你也一起去吧。', '李老师在哪儿？你看见他了吗？', '站在他右边的那位女士是谁啊？'] : ['你什么时候过生日啊？', '我站的时间太长了，好累啊！', '你学了多长时间汉语了？', '你能帮我买杯奶茶吗？', '李老师在哪儿？你看见他了吗？', '不工作的时候，你都做什么？']), items: second ? matching(['D', 'B', 'C', 'A', 'F'], ['我也想去啊，但是明天有考试。', '是啊，比去年画得好多了。', '很快，我一开学就去找你。', '还没，正想着要不要坐火车呢。', '我也不认识，可能是他妻子吧。'], 36) : matching(['A', 'F', 'D', 'B', 'C'], ['还有半个月呢。', '有时候跟朋友一起喝喝咖啡、看看电影。', '我已经买了，正在回去的路上呢。', '那快坐下休息休息吧。', '我从两个月前开始学的。'], 36) }),
    item(`${id}-read-p3b`, 'sentence_matching', '第四部分：选择合适的回答。', { answerBank: options(second ? ['这苹果怎么买啊？', '请进，你找我有什么事？', '怎么没见你用新书包了啊？', '您来杯咖啡还是奶茶？', '自己的事情自己做。'] : ['先生，您觉得这件怎么样？', '请问去地铁站怎么走？', '您好，是您叫的出租车吗？', '你什么时候回北京？', '你新买的那本书好看吗？']), items: second ? matching(['E', 'D', 'B', 'A', 'C'], ['知道了，不用你帮忙。', '有热牛奶吗？', '我听了您的课，想问您几个问题。', '便宜了，十块钱都给你了。', '就用了一次，我不太喜欢那个颜色。'], 41) : matching(['D', 'E', 'B', 'C', 'A'], ['不好说，等忙完这边的工作吧。', '太有意思了，我已经看完了。', '从这条路往东走，十分钟就到了。', '对，我去黄河高中南门。', '穿着没上一件舒服呢。'], 41) }),
    item(`${id}-read-p4`, 'reading_comprehension_choice', '第五部分：读短文和问题，选择正确答案。', { questions: (second ? [['他就住在学校旁边，离得比我近多了。\n“我”家：', 'C', ['在学校旁边', '离学校很近', '离学校很远']], ['这个药一天吃三次，每次一包。\n这个药：', 'C', ['每天吃一次', '每天吃一包', '一次吃一包']], ['看她们笑得！什么事情这么有意思？\n她们：', 'A', ['很高兴', '没事做', '没意思']], ['虽然王先生有时候人不在公司，但工作没少做。\n王先生：', 'C', ['不爱工作', '经常不上班', '有时不去公司']], ['奶奶一回家就开始忙着准备过年的东西。\n奶奶：', 'A', ['在准备过年', '工作很忙', '过年不回家']]] : [['我爱跳舞，但跳得不太好。\n他：', 'B', ['下课了', '喜欢跳舞', '是小学生']], ['每次妈妈一包饺子，我就去帮忙。\n妈妈包饺子的时候，“我”：', 'B', ['做作业', '跟妈妈一起包', '准备吃']], ['从小爷爷就告诉我：做错事情的时候，要说“对不起”。\n爷爷：', 'C', ['经常做错事情', '不爱说“对不起”', '教我说“对不起”']], ['这一周都是阴天，我们等天晴了再去游泳吧。\n他们可能：', 'C', ['喜欢阴天', '喜欢晴天', '下周游泳']], ['我怎么每次见他，他都在看书？\n他的爱好是：', 'B', ['见我', '看书', '买书']]]).map(([prompt, answer, choices], index) => ({ ...row(`${id}-r${46 + index}`, 46 + index, prompt as string, answer as string), options: options(choices as string[]) })) })
  ];
};

const hsk2Writing = (id: string, second: boolean): Pick<ExamLesson, 'fillQuestions' | 'essayQuestions'> => ({
  fillQuestions: (second ? [['第51题：请写出“过来”中缺少的汉字部件。', '寸'], ['第52题：请写出“爸爸”中缺少的汉字部件。', '巴'], ['第53题：请写出“工作”中缺少的汉字部件。', '乍'], ['第54题：请写出“我们”中缺少的汉字部件。', '门'], ['第55题：请写出“打球”中缺少的汉字部件。', '丁'], ['第56题：请问，这里有人教汉（ ）吗？', '语'], ['第57题：过年了，很多人喜欢去（ ）旅游。', '国'], ['第58题：快走吧，别让人等你太（ ）时间。', '长'], ['第59题：你能告诉我他（ ）什么名字吗？', '叫'], ['第60题：不好意思，你名字里面的这个（ ）怎么读啊？', '字']] : [['第51题：男生中缺少的汉字部件是什么？', '田'], ['第52题：几岁中缺少的汉字部件是什么？', '夕'], ['第53题：汉字中缺少的汉字部件是什么？', '又'], ['第54题：现在中缺少的汉字部件是什么？', '见'], ['第55题：姐妹中缺少的汉字部件是什么？', '且'], ['第56题：这（ ）天下雪，路上不好走。', '两'], ['第57题：那是我（ ），要不要认识一下？', '哥'], ['第58题：过（ ）的时候，我们一家人要去旅游。', '年'], ['第59题：和玩手机（ ），学习很累，但很有意思。', '比'], ['第60题：（ ）天李老师身体不舒服，不能来上课了。', '今']]).map(([prompt, answer], index) => ({ id: `${id}-w${51 + index}`, type: 'fill' as const, prompt, acceptableAnswers: answer })),
  essayQuestions: []
});

const makeHsk2 = (number: 1 | 2): ExamLesson => {
  const id = `hsk2-mock-0${number}`;
  const listening = number === 1 ? hsk2Test1Listening : hsk2Test2Listening;
  const reading = hsk2Reading(id, number === 2);
  const writing = hsk2Writing(id, number === 2);
  return { id, title: `HSK 2 (3.0) - Đề thi thử số ${number}`, level: 'HSK 2', description: 'Đề thi thử HSK2 (3.0) theo PDF gốc: 60 câu (25 nghe, 25 đọc, 10 viết). Audio dùng chung đặt ở đầu phần nghe.', timeLimitEnabled: true, timeLimitMinutes: 60, mcQuestions: [], fillQuestions: writing.fillQuestions, arrangeQuestions: [], readingPassages: [], listeningQuestions: [], essayQuestions: writing.essayQuestions, speakingQuestions: [], translationQuestions: [], handwritingQuestions: [], sections: [audioSection(`${id}-listening`, 'Phần 1 · 听力 · Nghe (25 câu)', `/audio/hsk2_mock_0${number}.mp3`, listening), { id: `${id}-reading`, title: 'Phần 2 · 阅读 · Đọc (25 câu)', items: reading }, { id: `${id}-writing`, title: 'Phần 3 · 书写 · Viết (10 câu)', items: [] }] };
};

const HSK3_MOCK_IMAGE_ROOT = '/images/hsk3-mock-colored';

const hsk3ImageOptions = (group: string, descriptions: Record<string, string>): Option[] => Object.entries(descriptions).map(([id, text]) => ({
  id,
  text,
  image: `${HSK3_MOCK_IMAGE_ROOT}/${group}-${id}.png`,
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
      ['看图，用“电话”造句。', '她在给妈妈打电话。', '01-writing-66.png'],
      ['看图，用“聊天儿”造句。', '她正在和朋友聊天儿。', '01-writing-67.png'],
      ['看图，用“环境”造句。', '这家咖啡店的环境很好。', '01-writing-68.png'],
      ['看图，用“洗衣机”造句。', '妈妈每个周末都用洗衣机洗衣服。', '01-writing-69.png'],
      ['看图，用“放学”造句。', '放学后，男孩儿自己回家。', '01-writing-70.png']
    ]
    : [
      ['看图，用“检票”造句。', '上火车前要先检票。', '02-writing-66.png'],
      ['看图，用“假期”造句。', '假期里，我和朋友去旅游。', '02-writing-67.png'],
      ['看图，用“信用卡”造句。', '我办了一张信用卡。', '02-writing-68.png'],
      ['看图，用“经过”造句。', '我放学回家的时候会经过一家水果店。', '02-writing-69.png'],
      ['看图，用“干净”造句。', '房间里打扫得很干净。', '02-writing-70.png']
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

const HSK4_MOCK_IMAGE_ROOT = '/images/hsk4-mock-colored';

const hsk4ListenQuestions = (id: string, start: number, entries: Array<[string, string, string[]]>) => entries.map((entry, index) => textChoice(`${id}-l${start + index}`, start + index, entry[0], entry[1], entry[2]));

const hsk4Listening = (id: string, number: 1 | 2): LessonItem[] => {
  const first = number === 1;
  const part1 = first ? hsk4ListenQuestions(id, 1, [
    ['关于那部动画片，可以知道什么？', 'A', ['非常有趣', '环境很好', '只适合孩子看', '周末没有']],
    ['男的建议什么？', 'B', ['晚上去', '早上去', '别拍照片', '别周末去']],
    ['女的觉得那部电影怎么样？', 'D', ['音乐不好', '演员很帅', '故事无聊', '演得不错']],
    ['男的为什么建议买灰色的外套？', 'A', ['颜色更合适', '价格更便宜', '穿着更舒服', '比黑色漂亮']],
    ['女的怎么了？', 'B', ['发烧了', '感冒了', '病得很重', '需要住院']],
    ['关于女的新工作，可以知道什么？', 'C', ['经常加班', '上班很远', '工作轻松', '工资很高']],
    ['关于HSK四级考试，可以知道什么？', 'C', ['考试非常简单', '考试时间太短', '阅读部分有些难', '写作部分很简单']]
  ]) : hsk4ListenQuestions(id, 1, [
    ['女的觉得这双鞋怎么样？', 'B', ['价格高', '质量不好', '颜色好', '值得买']],
    ['关于王教授，可以知道什么？', 'A', ['很幽默', '爱生气', '太严格', '没耐心']],
    ['关于上海，男的提到了什么？', 'C', ['风景很漂亮', '少数民族多', '经济发展好', '茶叶很有名']],
    ['男的打算怎么去机场？', 'B', ['坐飞机', '坐地铁', '坐出租车', '坐公共汽车']],
    ['关于明天的天气，可以知道什么？', 'C', ['会很暖和', '有大太阳', '气温会降低', '可能会下雨']],
    ['男的觉得那家店怎么样？', 'A', ['价格低', '服务差', '人不多', '距离远']],
    ['男的为什么向女的道歉？', 'B', ['开会迟到了', '没接到电话', '弄坏了东西', '忘记了约会']]
  ]);
  const part2 = first ? hsk4ListenQuestions(id, 8, [
    ['他们为什么要参加植树活动？', 'C', ['非常环保', '小区要求', '对环保有利', '活动有奖金']],
    ['女的认为男的为什么能得第一？', 'D', ['内容简单', '大家帮助', '有朋友鼓励', '确实有水平']],
    ['关于现在的张伟，可以知道什么？', 'B', ['头发很长', '变化很大', '不太爱说话', '不爱说话']],
    ['女的建议去故宫参观前要做什么？', 'D', ['做好计划', '查好故宫地址', '找好导游', '提前七天订票']],
    ['关于那些运动员，可以知道什么？', 'B', ['比赛时很紧张', '表现得很优秀', '平时不努力', '第一次参赛']],
    ['女的上班路上为什么堵车了？', 'C', ['她的车坏了', '她走错路了', '别人的车坏了', '正在修路']],
    ['关于那本书，可以知道什么？', 'D', ['被弄脏了', '被弄破了', '女的还没看过', '男的买了本新的']]
  ]) : hsk4ListenQuestions(id, 8, [
    ['关于这套房子，女的觉得怎么样？', 'C', ['家具太旧', '离地铁远', '价格稍高', '阳光不好']],
    ['男的建议女的怎么做？', 'C', ['马上打针', '住院治疗', '吃药休息', '坚持运动']],
    ['他们最可能决定去哪里？', 'B', ['南方', '北方', '东部', '西部']],
    ['快递员最后会把快递放在哪里？', 'B', ['家里', '超市里', '公司里', '邻居家']],
    ['女的接下来打算做什么？', 'C', ['修打印机', '取消会议', '发送材料', '换台电脑']],
    ['他们是什么关系？', 'C', ['同学', '家人', '朋友', '师生']],
    ['关于这场比赛，可以知道什么？', 'B', ['没有输赢', '非常精彩', '观众不热情', '队员放弃了']]
  ]);
  const part3 = first ? hsk4ListenQuestions(id, 15, [
    ['说话人请对方帮什么忙？', 'B', ['帮他去买药', '向老师请假', '陪他去医院', '联系他家人']],
    ['说话人每周在做什么？', 'B', ['去医院看病', '去健身房健身', '去公园运动', '坚持理想']],
    ['说话人觉得画画儿有什么作用？', 'B', ['提高艺术水平', '让人忘记烦恼', '增加艺术知识', '认识更多朋友']],
    ['小区目前出现了什么问题？', 'C', ['环境不好', '卫生很差', '停车位不够用', '服务不好']],
    ['女儿最近养成了什么习惯？', 'A', ['睡前阅读', '早起运动', '坚持画画儿', '自己洗衣服']],
    ['说话人对数学课的哪方面感到有收获？', 'B', ['上课态度', '解题方法', '作业质量', '课堂环境']],
    ['关于上周的考试，可以知道什么？', 'C', ['考试取消了', '考题很简单', '考试比较难', '都考得很好']],
    ['篮球赛将在哪里举行？', 'A', ['体育馆里面', '学校操场上', '教学楼旁边', '图书馆前面']],
    ['观看篮球赛需要什么条件？', 'C', ['必须是新生', '要提前报名', '可以免费看', '只能看自己的队']],
    ['说话人在选择课外班时更看重什么？', 'D', ['价格更便宜', '老师更有名', '对上学更有用', '对身心健康更有好处']],
    ['说话人认为体育锻炼对孩子有什么好处？', 'D', ['能提高考试成绩', '能使性格更加活泼', '能认识更多朋友', '做事会更耐心和自信']],
    ['说话人第一次看到大海感觉怎么样？', 'B', ['吃惊', '兴奋', '紧张', '无聊']],
    ['说话人喜欢傍晚去海边是因为？', 'C', ['可以游泳', '傍晚凉快', '能听到大海的声音', '能看到下山的太阳']],
    ['云南省在中国的哪个位置？', 'D', ['东部', '北部', '东北部', '西南部']],
    ['关于云南省的少数民族，可以知道什么？', 'C', ['都会唱歌跳舞', '只有两个民族', '有自己的民族节日', '有自己的民族文字']],
    ['这是一个什么样的展览？', 'A', ['家具展', '书展', '画展', '照片展']],
    ['这些作品有什么特点？', 'B', ['非常复杂', '一点儿也不复杂', '人们都在笑', '让人感动']],
    ['说话人看了作品以后觉得？', 'C', ['很难看', '拍得不好', '生活很美好', '相机很重要']]
  ]) : hsk4ListenQuestions(id, 15, [
    ['关于这次会议，可以知道什么？', 'C', ['取消了', '上午开', '推迟了', '经理不参加']],
    ['说话人明天打算去哪里？', 'C', ['教室', '办公室', '图书馆', '体育馆']],
    ['关于这家店，可以知道什么？', 'C', ['菜价便宜', '不值得来', '服务热情', '没有饺子']],
    ['说话人觉得高铁怎么样？', 'D', ['票价不贵', '速度极慢', '座位不好', '很少晚点']],
    ['关于说话人，可以知道什么？', 'C', ['是公司经理', '不想去上班', '面试通过了', '面试很放松']],
    ['说话人以前有什么习惯？', 'B', ['早上跑步', '晚上工作', '不爱睡觉', '经常迟到']],
    ['现在说话人有什么变化？', 'C', ['朋友变多了', '收入提高了', '身体更健康了', '工作更忙了']],
    ['说话人现在的爱好是什么？', 'B', ['玩游戏', '照相', '爬山', '唱歌']],
    ['关于那个新相机，可以知道什么？', 'D', ['有点儿重', '朋友送的', '质量不好', '价格高了点儿']],
    ['关于现在的年轻人，可以知道什么？', 'B', ['常丢手机', '很少带现金', '不喜欢购物', '经常去银行']],
    ['说话人提醒大家要注意什么？', 'B', ['节约时间', '保护好密码', '多带些零钱', '少出去购物']],
    ['说话人认为怎样才能学好汉语？', 'D', ['多做题', '多背书', '多考试', '多交流']],
    ['关于练口语，说话人建议大家？', 'A', ['要勇敢', '要细心', '要安静', '要客气']],
    ['说话人为什么不喜欢在网上买衣服？', 'C', ['送货太慢', '价格太高', '颜色不准', '质量不好']],
    ['说话人为什么没有把裙子寄回去？', 'D', ['裙子比较漂亮', '裙子十分便宜', '不允许换货', '寄回去很麻烦']],
    ['中国人经常用什么来欢迎客人？', 'C', ['鲜花', '咖啡', '热茶', '饺子']],
    ['关于绿茶，可以知道什么？', 'B', ['价格很贵', '适合夏天喝', '味道很甜', '让人感到暖和']],
    ['说话人觉得喝茶有什么好处？', 'A', ['让人心情愉快', '让人变得聪明', '增加人的力气', '让人变得漂亮']]
  ]);
  return [
    item(`${id}-listen-p1`, 'listening_text_choice', '第一部分：听对话，选择正确答案。', { items: part1 }),
    item(`${id}-listen-p2`, 'listening_text_choice', '第二部分：听对话或短文，选择正确答案。', { items: part2 }),
    item(`${id}-listen-p3`, 'listening_text_choice', '第二部分：听短文，选择正确答案。', { items: part3 })
  ];
};

const hsk4Reading = (id: string, number: 1 | 2): LessonItem[] => {
  const first = number === 1;
  const p1 = first ? {
    bank: options(['发送', '打扰', '乘客', '高温', '互相', '度假']),
    prompts: ['他们俩一见面就（ ）介绍了一下自己。', '我昨天给你（ ）了一封邮件，你收到了吗？', '出租车司机热情地为（ ）服务。', '这种（ ）天气，一定要注意身体。', '他们计划下个月去南方（ ），好好放松放松。'],
    answers: ['E', 'A', 'C', 'D', 'F']
  } : {
    bank: options(['不断', '打扰', '街道', '郊区', '无法', '感人']),
    prompts: ['上周末天气很好，我们一家人开车去了（ ），还拍了很多照片。', '这个问题太难了，我一个人（ ）解决，需要大家的帮助。', '这几年，来中国旅游的外国人（ ）增加。', '这部电影讲了一个非常（ ）的爱情故事，很多观众都哭了。', '节日的时候，（ ）两边到处都可以看到各种颜色的花。'],
    answers: ['D', 'E', 'A', 'F', 'C']
  };
  const p2 = first ? {
    bank: options(['加油', '免费', '倒', '填写', '自习', '敲']),
    prompts: ['今晚你还去图书馆（ ）吗？', '听，是不是有（ ）门的声音？这么晚了，会是谁啊？', '听说下星期有茶文化活动，你报名了吗？还没呢，得先在网上（ ）报名表。', '明天我要去参加学院的足球比赛，有点儿紧张。没事，好好踢，我们全班同学都会去为你（ ）的！', '公司请了个教练来给咱们上网球课，你参不参加？要交钱吗？要是（ ）我就去。'],
    answers: ['E', 'F', 'D', 'A', 'B']
  } : {
    bank: options(['大巴', '毛衣', '倒', '不光', '气温', '费用']),
    prompts: ['我看你把（ ）脱了，是不是屋里太热了？', '买了会员卡后还需要支付别的（ ）吗？', '这家店的烤鱼做得怎么样？好吃极了！（ ）烤鱼好吃，其他菜也很不错。', '现在都已经是春天了，怎么（ ）还这么低？', '明天怎么去机场？坐地铁还是打车？还是坐机场（ ）最方便。'],
    answers: ['B', 'F', 'D', 'E', 'A']
  };
  const fill = (section: string, bank: Option[], prompts: string[], answers: string[], start: number) => item(`${id}-read-${section}`, 'fill', section === 'p1' ? '第一部分：选词填空。' : '第二部分：选词填空。', { wordBank: bank, items: prompts.map((prompt, index) => row(`${id}-r${start + index}`, start + index, prompt, answers[index])) });
  const p3: Array<[string, string, string[]]> = first ? [
    ['网上的商品：', 'B', ['介绍比较全', '价格比较低', '质量不太高', '种类不够多']],
    ['“早起的鸟儿有虫吃”这句话是告诉我们要：', 'D', ['注意身体', '保护动物', '早起锻炼', '提前准备']],
    ['李明是一个怎样的人？', 'A', ['重视友情', '非常耐心', '喜欢运动', '工作努力']],
    ['选择工作应该根据：', 'D', ['收入的高低', '离家的远近', '环境是否舒服', '是否适合自己']],
    ['提前看游记和照片的好处是：', 'C', ['节约旅行费用', '方便购买车票', '帮助制订计划', '认识更多朋友']],
    ['学习新语言遇到困难时，应该：', 'B', ['找人帮忙', '不要放弃', '减少练习', '先学语法']],
    ['为了减肥而不吃饭，可能会：', 'C', ['想吃甜食', '感到口渴', '影响健康', '睡不着觉']],
    ['为什么没有人回复他的消息？', 'D', ['网页有问题', '手机有问题', '别人故意不回复', '别人完全看不到']],
    ['这次活动要求穿：', 'B', ['雨衣', '运动服', '厚衣服', '运动鞋']],
    ['关于这次活动，公司觉得什么最重要？', 'B', ['节约', '安全', '开心', '美食']],
    ['有些人做事容易放弃，常常是因为：', 'B', ['事情本身难度太大', '没有马上看到结果', '得不到别人的帮助', '觉得自己能力不够']],
    ['作者用“种花”的例子是想说明：', 'B', ['植物需要浇水', '坚持才能成功', '努力就有收获', '等待才能开花']],
    ['研究发现，快乐主要来自：', 'C', ['购买新东西', '更多的休息', '内心的感受', '家人的表扬']],
    ['下面哪一项是“不需要花很多钱”的快乐？', 'A', ['帮助别人', '买辆新车', '住大房子', '出国旅行']],
    ['这段话主要想告诉我们什么？', 'B', ['钱是非常重要的东西', '快乐更多来自内心感受', '真正的幸福不需要钱', '每个人对快乐理解不同']]
  ] : [
    ['关于租房，年轻人觉得：', 'B', ['交通更方便', '生活更轻松', '环境更美好', '种类更多样']],
    ['孩子们觉得什么更重要？', 'C', ['让父母满意', '找到好工作', '做喜欢的事', '考上好大学']],
    ['医生建议大家：', 'B', ['常去医院检查', '注意保护身体', '出门多穿衣服', '少出门、多休息']],
    ['关于这种药，可以知道什么？', 'A', ['一天吃三次', '饭前吃更好', '一次吃两片', '忘记吃了下次多吃']],
    ['网上购物前应该：', 'C', ['比较一下价格', '多看商品图片', '看看别人的意见', '去商场试一试']],
    ['王老师的课受欢迎的原因是：', 'D', ['知识不太多', '考试很简单', '要求比较低', '课堂有意思']],
    ['“笨鸟先飞”这句话告诉我们要：', 'B', ['知道自己笨', '比别人早准备', '先试试再决定', '选择简单的事']],
    ['戴耳机坐地铁时应该注意什么？', 'D', ['不要错过车站', '不要一直看手机', '不要影响别人', '声音不要开太大']],
    ['现在在图书馆还可以：', 'C', ['教外语', '踢足球', '办活动', '打电话']],
    ['图书馆的这些变化有什么好处？', 'B', ['借书更方便了', '吸引更多人去', '咖啡更好喝了', '书变得更多了']],
    ['养狗能让人：', 'D', ['吃得多', '睡得香', '少吃药', '多运动']],
    ['和狗在一起时，人们的感觉是：', 'A', ['轻松', '紧张', '激动', '着急']],
    ['蓝色会让人有什么感觉？', 'D', ['快乐', '兴奋', '紧张', '安静']],
    ['运动鞋很多牌子喜欢用红色，是因为红色：', 'B', ['比较漂亮', '让人兴奋', '价格便宜', '适合跑步']],
    ['这段话主要想告诉我们：', 'B', ['蓝色不适合做运动鞋的颜色', '人的心情会受颜色的影响', '睡觉的房间应该选择用黄色', '选择合适的颜色并不容易']]
  ];
  const p4: Array<[string, string, string[]]> = first ? [
    ['周末有人喜欢待在家里，（58）____，看喜欢的电影或玩一会儿游戏。', 'B', ['让身体出出汗', '躺在舒服的沙发上刷手机', '也是不错的选择']],
    ['他们会跟着网络上的健身视频做运动，（59）____。', 'A', ['让身体出出汗', '躺在舒服的沙发上刷手机', '也是不错的选择']],
    ['点一份外卖，或者照着美食APP尝试做一道新菜，（60）____。', 'C', ['让身体出出汗', '躺在舒服的沙发上刷手机', '也是不错的选择']],
    ['变色龙变色并不是为了漂亮，（61）____。', 'C', ['这样能帮助它保护自己', '因此颜色其实是它重要的“语言”', '而是为了安全', '这些细胞可以根据环境而改变']],
    ['来到棕色的树枝上时，又会变成棕色。（62）____，不被别的动物发现。', 'A', ['这样能帮助它保护自己', '因此颜色其实是它重要的“语言”', '而是为了安全', '这些细胞可以根据环境而改变']],
    ['变色主要靠它皮肤里一些特殊的细胞，（63）____。', 'D', ['这样能帮助它保护自己', '因此颜色其实是它重要的“语言”', '而是为了安全', '这些细胞可以根据环境而改变']],
    ['变色龙还会通过改变颜色来吸引自己喜欢的变色龙，（64）____。', 'B', ['这样能帮助它保护自己', '因此颜色其实是它重要的“语言”', '而是为了安全', '这些细胞可以根据环境而改变']]
  ] : [
    ['手机上就会出现菜单。（58）____，直接点就行。', 'A', ['想吃什么自己选', '觉得那种感觉更有在饭店吃饭的味道', '不用担心最后结账时算错']],
    ['点了多少钱的菜，手机上看得清清楚楚，（59）____。', 'C', ['想吃什么自己选', '觉得那种感觉更有在饭店吃饭的味道', '不用担心最后结账时算错']],
    ['让服务员站在旁边等着自己点菜，（60）____。', 'B', ['想吃什么自己选', '觉得那种感觉更有在饭店吃饭的味道', '不用担心最后结账时算错']],
    ['但其实，（61）____，也能学好外语。', 'B', ['语言也会慢慢进步', '在家用对方法', '认识一些外国朋友', '让学习变得更有意思']],
    ['网上还有和外国人聊天儿的地方。（62）____，可以互相教语言，互相学习。', 'C', ['语言也会慢慢进步', '在家用对方法', '认识一些外国朋友', '让学习变得更有意思']],
    ['如果你喜欢看外国电影、听外国歌曲，即使不去国外，（63）____。', 'A', ['语言也会慢慢进步', '在家用对方法', '认识一些外国朋友', '让学习变得更有意思']],
    ['可以感受当地的文化，（64）____。', 'D', ['语言也会慢慢进步', '在家用对方法', '认识一些外国朋友', '让学习变得更有意思']]
  ];
  const choiceItem = (section: string, questions: Array<[string, string, string[]]>, start: number) => item(`${id}-read-${section}`, 'reading_comprehension_choice', section === 'p3' ? '第三部分：阅读短文，选择正确答案。' : '第三部分：选句填空。', { questions: questions.map((entry, index) => textChoice(`${id}-r${start + index}`, start + index, entry[0], entry[1], entry[2])) });
  return [fill('p1', p1.bank, p1.prompts, p1.answers, 33), fill('p2', p2.bank, p2.prompts, p2.answers, 38), choiceItem('p3', p3, 43), choiceItem('p4', p4, 58)];
};

const hsk4Writing = (id: string, number: 1 | 2): Pick<ExamLesson, 'essayQuestions'> => {
  const first = number === 1;
  const prompts = first ? [
    ['看图，用“道歉”造句。', '他向老师道歉，老师原谅了他。'],
    ['看图，用“聚餐”造句。', '他经常和他的大学同学聚餐。'],
    ['看图，用“眼镜”造句。', '这副眼镜她戴正合适。'],
    ['看图，用“幸福”造句。', '毕业那天，妈妈来学校看他，他感到特别幸福。'],
    ['看图，用“厨房”造句。', '周末，丈夫和妻子一起在厨房做饭。'],
    ['请写一篇不少于80字的短文，介绍一位对你影响最大的人。', '对我影响最大的人是我的汉语老师王老师。']
  ] : [
    ['看图，用“打印”造句。', '她正在打印今天的作业。'],
    ['看图，用“扫码”造句。', '现在出门不用带现金了，买什么都可以扫码。'],
    ['看图，用“健身”造句。', '健身不仅对身体好，还能让人放松心情。'],
    ['看图，用“导游”造句。', '我们的导游是一位非常热情的中国姑娘。'],
    ['看图，用“节约”造句。', '洗手时请注意节约用水。'],
    ['请写一篇不少于80字的短文，介绍一个你最喜欢的地方。', '我最喜欢的地方是家附近的一家小咖啡店。']
  ];
  return { essayQuestions: prompts.map(([prompt, suggestedAnswer], index) => ({ id: `${id}-w${65 + index}`, type: 'essay' as const, prompt: `第${65 + index}题：${prompt}`, suggestedAnswer, ...(index < 5 ? { imageUrl: `${HSK4_MOCK_IMAGE_ROOT}/${number === 1 ? '01' : '02'}-writing-${65 + index}.png` } : {}) })) };
};

const makeHsk4 = (number: 1 | 2): ExamLesson => {
  const id = `hsk4-mock-0${number}`;
  const writing = hsk4Writing(id, number);
  return { id, title: `HSK 4 (3.0) - Đề thi thử số ${number}`, level: 'HSK 4', description: 'Đề thi thử HSK 3.0 (HSK4) theo PDF gốc: 70 câu (32 nghe, 32 đọc, 6 viết). Audio dùng chung đặt ở đầu phần nghe.', timeLimitEnabled: true, timeLimitMinutes: 100, mcQuestions: [], fillQuestions: [], arrangeQuestions: [], readingPassages: [], listeningQuestions: [], essayQuestions: writing.essayQuestions, speakingQuestions: [], translationQuestions: [], handwritingQuestions: [], sections: [audioSection(`${id}-listening`, 'Phần 1 · 听力 · Nghe (32 câu)', `/audio/hsk4_mock_0${number}.mp3`, hsk4Listening(id, number)), { id: `${id}-reading`, title: 'Phần 2 · 阅读 · Đọc (32 câu)', items: hsk4Reading(id, number) }, { id: `${id}-writing`, title: 'Phần 3 · 写作 · Viết (6 câu)', items: [] }] };
};

export const HSK234_MOCK_EXAMS: ExamLesson[] = [makeHsk2(1), makeHsk2(2), makeHsk3(1), makeHsk3(2), makeHsk4(1), makeHsk4(2)];
