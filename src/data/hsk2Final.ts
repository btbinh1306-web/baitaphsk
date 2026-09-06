import { ExamLesson } from '../types';
import { LessonItem } from '../types/lesson';

const image = (page: number, index: number) => `/assets/hsk2-final/p${page}-${index}.png`;
const options = (values: string[], pinyin: string[] = []) => values.map((text, index) => ({
  id: String.fromCharCode(65 + index), text, pinyin: pinyin[index] || ''
}));
const pictures = (page: number, count: number) => Array.from({ length: count }, (_, i) => ({
  id: String.fromCharCode(65 + i), image: image(page, i + 1), alt: `Hình ${String.fromCharCode(65 + i)} trong đề H21331`
}));
const rows = (start: number, texts: string[], pinyin: string[] = []) => texts.map((prompt, i) => ({
  id: `hsk2-final-q${start + i}`, number: start + i, prompt, pinyin: pinyin[i] || '', correctAnswer: ''
}));
const blankRows = (start: number, count: number) => rows(start, Array(count).fill(''));
const block = (id: string, type: string, instruction: string, data: Record<string, unknown>): LessonItem => ({
  id: `hsk2-final-${id}`, type,
  data: { instruction, showPinyin: true, shuffleOptions: false, shuffleImages: false, ...data }
});
const tf = [{ id: '✓', text: '' }, { id: '×', text: '' }];
const listeningChoices = [
  options(['5年前', '去年', '上个月'], ['5 nián qián', 'qùnián', 'shàng ge yuè']),
  options(['教室后面', '学校里面', '公司旁边'], ['jiàoshì hòumiàn', 'xuéxiào lǐmiàn', 'gōngsī pángbiān']),
  options(['开车', '坐飞机', '坐出租车'], ['kāi chē', 'zuò fēijī', 'zuò chūzūchē']),
  options(['没睡觉', '没休息好', '上班太累'], ['méi shuìjiào', 'méi xiūxihǎo', 'shàngbān tài lèi']),
  options(['看电视', '吃米饭', '喝牛奶'], ['kàn diànshì', 'chī mǐfàn', 'hē niúnǎi']),
  options(['手机', '电脑', '手表'], ['shǒujī', 'diànnǎo', 'shǒubiǎo']),
  options(['90个', '100多', '1000多'], ['90 ge', '100 duō', '1000 duō']),
  options(['服务员', '李老师', '张医生'], ['fúwùyuán', 'Lǐ lǎoshī', 'Zhāng yīshēng']),
  options(['太小', '太冷', '很大'], ['tài xiǎo', 'tài lěng', 'hěn dà']),
  options(['买票', '喝茶', '买咖啡'], ['mǎi piào', 'hē chá', 'mǎi kāfēi']),
  options(['去学习', '去看朋友', '那儿很漂亮'], ['qù xuéxí', 'qù kàn péngyou', 'nàr hěn piàoliang']),
  options(['中午', '下班后', '下个星期'], ['zhōngwǔ', 'xiàbān hòu', 'xià ge xīngqī']),
  options(['晴天', '阴天', '下雨了'], ['qíngtiān', 'yīntiān', 'xiàyǔ le']),
  options(['杯子', '椅子', '面条儿'], ['bēizi', 'yǐzi', 'miàntiáor']),
  options(['饭店', '机场', '医院'], ['fàndiàn', 'jīchǎng', 'yīyuàn'])
];

export const HSK2_FINAL_EXAM: ExamLesson = {
  id: 'hsk2-final-h21331', title: 'Đề HSK 2 - cuối kỳ', level: 'HSK 2',
  description: 'H21331 · 60 câu: nghe 35 câu (khoảng 25 phút), 3 phút điền đáp án, đọc 25 câu (22 phút). Tổng 50 phút làm bài sau khi điền thông tin. Đã duyệt đáp án toàn bộ 60 câu.',
  timeLimitEnabled: true, timeLimitMinutes: 50,
  mcQuestions: [], essayQuestions: [], speakingQuestions: [],
  sections: [
    { id: 'hsk2-final-listening', title: '一、听力 · Nghe (Câu 1–35)', items: [
      block('l1', 'listening_image_choice', '第一部分 · 第1–10题', {
        audio: '/audio/HSK2_FINAL/H21331.mp3', singlePass: true, limitPlayCount: true, maxPlayCount: 1,
        hidePrompt: true,
        exampleImages: [{ image: image(2, 1), text: '✓' }, { image: image(2, 2), text: '✕' }],
        items: blankRows(1, 10).map((row, i) => ({ ...row, correctAnswer: ['×', '×', '✓', '✓', '×', '×', '×', '✓', '✓', '✓'][i], image: i < 5 ? image(2, i + 3) : image(3, i - 4), options: tf }))
      }),
      block('l2a', 'listening_shared_image_match', '第二部分 · 第11–15题', {
        hidePrompt: true, sharedOptions: pictures(4, 6),
        exampleAnswer: 'D',
        example: '男：Nǐ xǐhuan shénme yùndòng?\n你喜欢什么运动？\n女：Wǒ zuì xǐhuan tī zúqiú.\n我最喜欢踢足球。 → D', items: blankRows(11, 5).map((row, i) => ({ ...row, correctAnswer: ['C', 'B', 'E', 'A', 'F'][i] }))
      }),
      block('l2b', 'listening_shared_image_match', '第二部分 · 第16–20题', {
        hidePrompt: true, sharedOptions: pictures(5, 5), items: blankRows(16, 5).map((row, i) => ({ ...row, correctAnswer: ['D', 'B', 'A', 'C', 'E'][i] }))
      }),
      block('l3', 'listening_comprehension_choice', '第三部分 · 第21–30题', {
        hidePrompt: true,
        exampleAnswer: 'A',
        exampleOptions: options(['红色', '黑色', '白色'], ['hóngsè', 'hēisè', 'báisè']),
        example: '男：XiǎoWáng, zhèli yǒu jǐ ge bēizi, nǎge shì nǐ de?\n小王，这里有几个杯子，哪个是你的？\n女：Zuǒbian nàge hóngsè de shì wǒ de.\n左边那个红色的是我的。\n问：XiǎoWáng de bēizi shì shénme yánsè de?\n小王的杯子是什么颜色的？\nA hóngsè 红色 √　B hēisè 黑色　C báisè 白色',
        questions: blankRows(21, 10).map((row, i) => ({ ...row, correctAnswer: ['B', 'C', 'B', 'B', 'A', 'A', 'B', 'C', 'A', 'C'][i], options: listeningChoices[i] }))
      }),
      block('l4', 'listening_comprehension_choice', '第四部分 · 第31–35题', {
        hidePrompt: true,
        exampleAnswer: 'A',
        exampleOptions: options(['名字', '时间', '房间号'], ['míngzi', 'shíjiān', 'fángjiān hào']),
        example: '女：Qǐng zài zhèr xiě nín de míngzi.\n请在这儿写您的名字。\n男：Shì zhèr ma?\n是这儿吗？\n女：Bú shì, shì zhèr.\n不是，是这儿。\n男：Hǎo, xièxie.\n好，谢谢。\n问：Nánde yào xiě shénme?\n男的要写什么？\nA míngzi 名字 √　B shíjiān 时间　C fángjiān hào 房间号',
        questions: blankRows(31, 5).map((row, i) => ({ ...row, correctAnswer: ['C', 'C', 'A', 'B', 'A'][i], options: listeningChoices[i + 10] }))
      })
    ] },
    { id: 'hsk2-final-reading', title: '二、阅读 · Đọc (Câu 36–60)', items: [
      block('r1', 'reading_shared_image_match', '第一部分 · 第36–40题', {
        sharedOptions: pictures(9, 6), exampleAnswer: 'D', example: 'Měi ge xīngqīliù, wǒ dōu qù dǎ lánqiú.\n每个星期六，我都去打篮球。 → D',
        items: rows(36, [
          '中午我和哥哥去商店买了很多菜。', '你家的小猫真好玩儿，它叫什么名字？', '我们都爱吃西瓜。', '这个题我不会，你帮我看看吧。', '喂，我已经在车上了，一小时后到。'
        ], ['Zhōngwǔ wǒ hé gēge qù shāngdiàn mǎile hěn duō cài.', 'Nǐ jiā de xiǎo māo zhēn hǎowánr, tā jiào shénme míngzi?', 'Wǒmen dōu ài chī xīguā.', 'Zhège tí wǒ bú huì, nǐ bāng wǒ kànkan ba.', 'Wéi, wǒ yǐjīng zài chē shàng le, yì xiǎoshí hòu dào.']).map((row, i) => ({ ...row, correctAnswer: ['A', 'B', 'E', 'C', 'F'][i] }))
      }),
      block('r2', 'fill', '第二部分 · 第41–45题', {
        wordBank: options(['因为', '远', '事情', '生病', '贵', '等'], ['yīnwèi', 'yuǎn', 'shìqing', 'shēngbìng', 'guì', 'děng']),
        exampleAnswer: 'E',
        example: 'Zhèr de yángròu hěn hǎochī, dànshì yě hěn (E).\n这儿的羊肉很好吃，但是也很（E）。',
        items: rows(41, ['王先生住的宾馆离机场不（　）。', '这是什么时候的（　）？我怎么不知道？', '我丈夫（　）了，我去给他买点儿药。', '他现在很忙，您能（　）一下吗？', '女：儿子怎么不太高兴？\n男：可能是（　）今天考试没考好。'],
          ['Wáng xiānsheng zhù de bīnguǎn lí jīchǎng bù (　).', 'Zhè shì shénme shíhou de (　)? Wǒ zěnme bù zhīdào?', 'Wǒ zhàngfu (　) le, wǒ qù gěi tā mǎi diǎnr yào.', 'Tā xiànzài hěn máng, nín néng (　) yíxià ma?', 'Érzi zěnme bú tài gāoxìng?\nKěnéng shì (　) jīntiān kǎoshì méi kǎohǎo.']).map((row, i) => ({ ...row, correctAnswer: ['B', 'C', 'D', 'F', 'A'][i] }))
      }),
      block('r3', 'reading_comprehension_choice', '第三部分 · 第46–50题', {
        example: 'Xiànzài shì 11 diǎn 30 fēn, tāmen yǐjīng yóule 20 fēnzhōng le.\n现在是11点30分，他们已经游了20分钟了。\n★ Tāmen 11 diǎn 10 fēn kāishǐ yóuyǒng.\n★ 他们11点10分开始游泳。（✓）\nWǒ huì tiàowǔ, dàn tiàode bù zěnmeyàng.\n我会跳舞，但跳得不怎么样。\n★ Tā tiàode fēicháng hǎo.\n★ 她跳得非常好。（×）',
        questions: rows(46, [
          '小李，你有什么不懂的问题就问，我们都会帮你的，别客气。\n★ 小李帮助了他们。',
          '弟弟比我小两岁，但他比我还高一点儿，所以有时候，不认识我们的人会觉得他比我大。\n★ 他弟弟比他高。',
          '对不起，小姐，红色的都已经卖完了，您看这个黑色的可以吗？\n★ 黑色的很便宜。',
          '我大学时很喜欢打篮球，但是工作后事情多，就很少玩儿了。\n★ 他现在很少打篮球。',
          '小高，天这么热，还让你给我送东西，真是不好意思。快坐下喝点儿水吧。\n★ 他想让小高去买水。'
        ], [
          'XiǎoLǐ, nǐ yǒu shénme bù dǒng de wèntí jiù wèn, wǒmen dōu huì bāng nǐ de, biékèqi.\n★ XiǎoLǐ bāngzhùle tāmen.',
          'Dìdi bǐ wǒ xiǎo liǎng suì, dàn tā bǐ wǒ hái gāo yìdiǎnr, suǒyǐ yǒu shíhou, bú rènshi wǒmen de rén huì juéde tā bǐ wǒ dà.\n★ Tā dìdi bǐ tā gāo.',
          'Duìbuqǐ, xiǎojiě, hóngsè de dōu yǐjīng màiwán le, nín kàn zhège hēisè de kěyǐ ma?\n★ Hēisè de hěn piányi.',
          'Wǒ dàxué shí hěn xǐhuan dǎ lánqiú, dànshì gōngzuò hòu shìqing duō, jiù hěn shǎo wánr le.\n★ Tā xiànzài hěn shǎo dǎ lánqiú.',
          'XiǎoGāo, tiān zhème rè, hái ràng nǐ gěi wǒ sòng dōngxi, zhēn shì bù hǎo yìsi. Kuài zuòxià hē diǎnr shuǐ ba.\n★ Tā xiǎng ràng XiǎoGāo qù mǎi shuǐ.'
        ]).map((row, i) => ({ ...row, correctAnswer: ['×', '✓', '×', '✓', '×'][i], options: tf }))
      }),
      block('r4a', 'sentence_matching', '第四部分 · 第51–55题', {
        sharedOptions: options(['你妹妹还在读书吗？', '你下午准备做什么？', '在这儿坐408路公共汽车，20分钟就能到。', '明天上午来我家吧，给你介绍个朋友。', '他在哪儿呢？你看见他了吗？', '家里没有鸡蛋了，不能做鸡蛋面了。'],
          ['Nǐ mèimei hái zài dú shū ma?', 'Nǐ xiàwǔ zhǔnbèi zuò shénme?', 'Zài zhèr zuò 408 lù gōnggòngqìchē, 20 fēnzhōng jiù néng dào.', 'Míngtiān shàngwǔ lái wǒ jiā ba, gěi nǐ jièshào ge péngyou.', 'Tā zài nǎr ne? Nǐ kànjiàn tā le ma?', 'Jiā li méiyǒu jīdàn le, bù néng zuò jīdànmiàn le.']),
        exampleAnswer: 'E',
        example: 'Tā hái zài jiàoshì li xuéxí.\n他还在教室里学习。 → E',
        items: rows(51, ['是你上次说的那个人吗？', '你好，请问火车站怎么走？', '我要去唱歌，你呢？', '不，她工作好几年了。', '没关系，我们吃点儿别的吧。'],
          ['Shì nǐ shàng cì shuō de nàge rén ma?', 'Nǐ hǎo, qǐng wèn huǒchēzhàn zěnme zǒu?', 'Wǒ yào qù chànggē, nǐ ne?', 'Bù, tā gōngzuò hǎo jǐ nián le.', 'Méiguānxi, wǒmen chī diǎnr bié de ba.']).map((row, i) => ({ ...row, correctAnswer: ['D', 'C', 'B', 'A', 'F'][i] }))
      }),
      block('r4b', 'sentence_matching', '第四部分 · 第56–60题', {
        sharedOptions: options(['可能在我桌子上，你去找找吧。', '后面的同学能听见我说话吗？', '不好意思，我可能打错电话了。', '你看完了也给我看看吧。', '那个饭店就在前面，很近。'],
          ['Kěnéng zài wǒ zhuōzi shàng, nǐ qù zhǎozhao ba.', 'Hòumiàn de tóngxué néng tīngjiàn wǒ shuōhuà ma?', 'Bù hǎo yìsi, wǒ kěnéng dǎcuò diànhuà le.', 'Nǐ kànwánle yě gěi wǒ kànkan ba.', 'Nàge fàndiàn jiù zài qiánmiàn, hěn jìn.']),
        items: rows(56, ['听说这本书对学汉语很有帮助。', '今天是我第一次给大家上课。', '我们走着去，怎么样？', '姐，你看见我新买的铅笔了吗？', '我们这里没有叫王雪的。'],
          ['Tīngshuō zhè běn shū duì xué Hànyǔ hěn yǒu bāngzhù.', 'Jīntiān shì wǒ dì-yī cì gěi dàjiā shàngkè.', 'Wǒmen zǒuzhe qù, zěnmeyàng?', 'Jiě, nǐ kànjiàn wǒ xīn mǎi de qiānbǐ le ma?', 'Wǒmen zhèli méiyǒu jiào Wáng Xuě de.']).map((row, i) => ({ ...row, correctAnswer: ['D', 'B', 'E', 'A', 'C'][i] }))
      })
    ] }
  ]
};
