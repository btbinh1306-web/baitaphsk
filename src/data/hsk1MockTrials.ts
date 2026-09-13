import { ExamLesson } from '../types';
import { LessonItem, LessonSection } from '../types/lesson';

type StructuredOption = {
  id: string;
  text?: string;
  pinyin?: string;
  image?: string;
  alt?: string;
};

type TrialSpec = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  assetPrefix: string;
  listening: {
    part1: Array<{ image: string; alt: string; prompt: string; answer: string }>;
    part2: Array<{ prompt: string; answer: string; options: StructuredOption[] }>;
    part3: { options: StructuredOption[]; rows: Array<{ prompt: string; answer: string }> };
    part4: Array<{ prompt: string; answer: string; options: StructuredOption[] }>;
  };
  reading: {
    part1: Array<{ image: string; alt: string; prompt: string; answer: string }>;
    part2: { options: StructuredOption[]; rows: Array<{ prompt: string; answer: string }> };
    part3: { options: StructuredOption[]; rows: Array<{ prompt: string; answer: string }> };
    part4: { options: StructuredOption[]; rows: Array<{ prompt: string; answer: string }> };
  };
};

const image = (prefix: string, file: string, alt: string): string => `/assets/${prefix}/${file}`;

const option = (id: string, text = '', extra: Partial<StructuredOption> = {}): StructuredOption => ({
  id,
  text,
  ...extra
});

const row = (
  id: string,
  number: number,
  prompt: string,
  answer: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({ id, number, prompt, correctAnswer: answer, ...extra });

const makeItem = (
  id: string,
  type: string,
  instruction: string,
  data: Record<string, unknown>
): LessonItem => ({
  id,
  type,
  data: {
    instruction,
    showPinyin: false,
    playCount: 2,
    limitPlayCount: false,
    singlePass: true,
    ...data
  }
});

const makeListeningSections = (spec: TrialSpec): LessonSection[] => {
  const { listening, assetPrefix, audioUrl } = spec;
  const trueFalseOptions = [option('A', 'Đúng / 相符'), option('B', 'Sai / 不相符')];

  const part1 = makeItem(
    `${spec.id}-listening-part-1`,
    'listening_image_choice',
    '第一部分 听力：听句子，判断图片和句子是否相符。',
    {
      audio: audioUrl,
      hidePrompt: true,
      items: listening.part1.map((item, index) => row(
        `${spec.id}-l${index + 1}`,
        index + 1,
        item.prompt,
        item.answer,
        {
          image: image(assetPrefix, item.image, item.alt),
          alt: item.alt,
          options: trueFalseOptions
        }
      ))
    }
  );

  const part2 = makeItem(
    `${spec.id}-listening-part-2`,
    'listening_image_choice',
    '第二部分 听力：听句子，选择正确的图片。',
    {
      hidePrompt: true,
      items: listening.part2.map((item, index) => row(
        `${spec.id}-l${index + 6}`,
        index + 6,
        item.prompt,
        item.answer,
        { options: item.options }
      ))
    }
  );

  const part3 = makeItem(
    `${spec.id}-listening-part-3`,
    'listening_shared_image_match',
    '第三部分 听力：听对话，选择对应的图片。',
    {
      hidePrompt: true,
      sharedOptions: listening.part3.options,
      items: listening.part3.rows.map((item, index) => row(
        `${spec.id}-l${index + 11}`,
        index + 11,
        item.prompt,
        item.answer
      ))
    }
  );

  const part4 = makeItem(
    `${spec.id}-listening-part-4`,
    'listening_comprehension_choice',
    '第四部分 听力：听短句和问题，选择正确的答案。',
    {
      hidePrompt: true,
      questions: listening.part4.map((item, index) => ({
        ...row(`${spec.id}-l${index + 16}`, index + 16, item.prompt, item.answer),
        options: item.options
      }))
    }
  );

  return [{ id: `${spec.id}-listening`, title: 'Phần 1 · 听力 · Nghe (20 câu)', items: [part1, part2, part3, part4] }];
};

const makeReadingSections = (spec: TrialSpec): LessonSection[] => {
  const { reading, assetPrefix } = spec;
  const trueFalseOptions = [option('A', 'Đúng / 相符'), option('B', 'Sai / 不相符')];

  const part1 = makeItem(
    `${spec.id}-reading-part-1`,
    'reading_comprehension_choice',
    '第一部分 阅读：看图，判断词语和图片是否相符。',
    {
      questions: reading.part1.map((item, index) => ({
        ...row(`${spec.id}-r${index + 21}`, index + 21, item.prompt, item.answer, {
          image: image(assetPrefix, item.image, item.alt),
          alt: item.alt
        }),
        options: trueFalseOptions
      }))
    }
  );

  const part2 = makeItem(
    `${spec.id}-reading-part-2`,
    'reading_shared_image_match',
    '第二部分 阅读：读句子，选择对应的图片。',
    {
      sharedOptions: reading.part2.options,
      items: reading.part2.rows.map((item, index) => row(
        `${spec.id}-r${index + 26}`,
        index + 26,
        item.prompt,
        item.answer
      ))
    }
  );

  const part3 = makeItem(
    `${spec.id}-reading-part-3`,
    'sentence_matching',
    '第三部分 阅读：选择合适的回答。',
    {
      answerBank: reading.part3.options,
      items: reading.part3.rows.map((item, index) => row(
        `${spec.id}-r${index + 31}`,
        index + 31,
        item.prompt,
        item.answer
      ))
    }
  );

  const part4 = makeItem(
    `${spec.id}-reading-part-4`,
    'fill',
    '第四部分 阅读：选择词语填空。',
    {
      wordBank: reading.part4.options,
      items: reading.part4.rows.map((item, index) => row(
        `${spec.id}-r${index + 36}`,
        index + 36,
        item.prompt,
        item.answer
      ))
    }
  );

  return [{ id: `${spec.id}-reading`, title: 'Phần 2 · 阅读 · Đọc (20 câu)', items: [part1, part2, part3, part4] }];
};

const makeTrialExam = (spec: TrialSpec): ExamLesson => ({
  id: spec.id,
  title: spec.title,
  level: 'HSK 1',
  description: spec.description,
  timeLimitEnabled: false,
  mcQuestions: [],
  fillQuestions: [],
  arrangeQuestions: [],
  readingPassages: [],
  listeningQuestions: [],
  essayQuestions: [],
  speakingQuestions: [],
  translationQuestions: [],
  handwritingQuestions: [],
  sections: [...makeListeningSections(spec), ...makeReadingSections(spec)]
});

type PdfChoice = { prompt: string; answer: string; options: StructuredOption[] };
type PdfMatch = { options: StructuredOption[]; rows: Array<{ prompt: string; answer: string }> };

type PdfTrialSpec = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  assetPrefix: string;
  listening: {
    part1: PdfChoice[];
    part2: PdfChoice[];
    part3: PdfMatch;
    part4: PdfChoice[];
  };
  reading: {
    part1: PdfMatch;
    part2: PdfMatch;
    part3: PdfMatch;
    part4: PdfChoice[];
  };
};

const makeSourceTrialExam = (spec: PdfTrialSpec): ExamLesson => {
  const makeRows = (prefix: string, startNumber: number, rows: Array<{ prompt: string; answer: string }>) => (
    rows.map((item, index) => row(`${spec.id}-${prefix}${startNumber + index}`, startNumber + index, item.prompt, item.answer))
  );

  const listeningItems: LessonItem[] = [
    makeItem(`${spec.id}-listening-part-1`, 'listening_image_choice', '第一部分 听力：听短语，选择正确图片。', {
      audio: spec.audioUrl,
      hidePrompt: true,
      items: spec.listening.part1.map((item, index) => row(`${spec.id}-l${index + 1}`, index + 1, item.prompt, item.answer, { options: item.options }))
    }),
    makeItem(`${spec.id}-listening-part-2`, 'listening_text_choice', '第二部分 听力：听问题，选择正确回答。', {
      hidePrompt: true,
      items: spec.listening.part2.map((item, index) => row(`${spec.id}-l${index + 6}`, index + 6, item.prompt, item.answer, { options: item.options }))
    }),
    makeItem(`${spec.id}-listening-part-3`, 'listening_shared_image_match', '第三部分 听力：听对话，选择最匹配的图片。', {
      hidePrompt: true,
      sharedOptions: spec.listening.part3.options,
      items: makeRows('l', 11, spec.listening.part3.rows)
    }),
    makeItem(`${spec.id}-listening-part-4`, 'listening_comprehension_choice', '第四部分 听力：听句子和问题，选择正确答案。', {
      hidePrompt: true,
      questions: spec.listening.part4.map((item, index) => ({
        ...row(`${spec.id}-l${index + 16}`, index + 16, item.prompt, item.answer),
        options: item.options
      }))
    })
  ];

  const readingItems: LessonItem[] = [
    makeItem(`${spec.id}-reading-part-1`, 'reading_shared_image_match', '第一部分 阅读：读句子，选择对应的图片。', {
      sharedOptions: spec.reading.part1.options,
      items: makeRows('r', 21, spec.reading.part1.rows)
    }),
    makeItem(`${spec.id}-reading-part-2`, 'reading_shared_image_match', '第二部分 阅读：读句子，选择合适的回答。', {
      sharedOptions: spec.reading.part2.options,
      items: makeRows('r', 26, spec.reading.part2.rows)
    }),
    makeItem(`${spec.id}-reading-part-3`, 'sentence_matching', '第三部分 阅读：选择合适的词语填空。', {
      answerBank: spec.reading.part3.options,
      items: makeRows('r', 31, spec.reading.part3.rows)
    }),
    makeItem(`${spec.id}-reading-part-4`, 'reading_comprehension_choice', '第四部分 阅读：读句子和问题，选择正确答案。', {
      questions: spec.reading.part4.map((item, index) => ({
        ...row(`${spec.id}-r${index + 36}`, index + 36, item.prompt, item.answer),
        options: item.options
      }))
    })
  ];

  return {
    id: spec.id,
    title: spec.title,
    level: 'HSK 1',
    description: spec.description,
    timeLimitEnabled: true,
    timeLimitMinutes: 40,
    mcQuestions: [],
    fillQuestions: [],
    arrangeQuestions: [],
    readingPassages: [],
    listeningQuestions: [],
    essayQuestions: [],
    speakingQuestions: [],
    translationQuestions: [],
    handwritingQuestions: [],
    sections: [
      { id: `${spec.id}-listening`, title: 'Phần 1 · 听力 · Nghe (20 câu · 100 điểm)', items: listeningItems },
      { id: `${spec.id}-reading`, title: 'Phần 2 · 阅读 · Đọc (20 câu · 100 điểm)', items: readingItems }
    ]
  };
};

const imageChoiceOptions = (prefix: string, filePrefix: string, altPrefix: string, letters = 'ABC') => (
  [...letters].map((id) => option(id, '', {
    image: image(prefix, `${filePrefix}-${id.toLowerCase()}.png`, `${altPrefix} ${id}`),
    alt: `${altPrefix} ${id}`
  }))
);

const textChoiceOptions = (values: Record<string, string>) => (
  Object.entries(values).map(([id, text]) => option(id, text))
);

const sourceTrial01: PdfTrialSpec = {
  id: 'hsk1-trial-pdf-04',
  title: 'HSK 1 (3.0) - Đề thi thử số 4',
  description: 'Đề thi thử HSK1 (3.0) theo bộ PDF HSK3.0模拟（一）一级, gồm 20 câu nghe và 20 câu đọc. Thang điểm: Nghe 100 + Đọc 100 = 200 điểm.',
  audioUrl: '/audio_hsk1_trial_04.mp3',
  assetPrefix: 'hsk1-mock-04',
  listening: {
    part1: [
      { prompt: '喝茶', answer: 'B', options: imageChoiceOptions('hsk1-mock-04', 'listen-p1-q1', 'Câu 1 hình') },
      { prompt: '做午饭', answer: 'C', options: imageChoiceOptions('hsk1-mock-04', 'listen-p1-q2', 'Câu 2 hình') },
      { prompt: '两个面包', answer: 'B', options: imageChoiceOptions('hsk1-mock-04', 'listen-p1-q3', 'Câu 3 hình') },
      { prompt: '在房间学习', answer: 'A', options: imageChoiceOptions('hsk1-mock-04', 'listen-p1-q4', 'Câu 4 hình') },
      { prompt: '漂亮的衣服', answer: 'C', options: imageChoiceOptions('hsk1-mock-04', 'listen-p1-q5', 'Câu 5 hình') }
    ],
    part2: [
      { prompt: '今天星期几？', answer: 'C', options: textChoiceOptions({ A: '三月', B: '五个', C: '星期天' }) },
      { prompt: '你现在在哪儿？', answer: 'B', options: textChoiceOptions({ A: '上课', B: '书店', C: '大学生' }) },
      { prompt: '请问你有时间吗？', answer: 'A', options: textChoiceOptions({ A: '没有', B: '不知道', C: '六点十分' }) },
      { prompt: '她的中文怎么样？', answer: 'B', options: textChoiceOptions({ A: '没关系', B: '非常好', C: '很好看' }) },
      { prompt: '你吃几个饺子？', answer: 'A', options: textChoiceOptions({ A: '十个', B: '不好吃', C: '在饭店' }) }
    ],
    part3: {
      options: [
        option('A', '', { image: image('hsk1-mock-04', 'listen-p3-a.png', 'Siêu thị') }),
        option('B', '', { image: image('hsk1-mock-04', 'listen-p3-b.png', 'Đặt ghế') }),
        option('C', '', { image: image('hsk1-mock-04', 'listen-p3-c.png', 'Bắt tay') }),
        option('D', '', { image: image('hsk1-mock-04', 'listen-p3-d.png', 'Bàn làm việc') }),
        option('E', '', { image: image('hsk1-mock-04', 'listen-p3-e.png', 'Đồng hồ') }),
        option('F', '', { image: image('hsk1-mock-04', 'listen-p3-f.png', 'Mì') })
      ],
      rows: [
        { prompt: '女：请坐！\n男：谢谢！', answer: 'B' },
        { prompt: '男：现在几点？\n女：四点十分。', answer: 'E' },
        { prompt: '女：你在做什么呢？\n男：我在超市买东西呢。', answer: 'A' },
        { prompt: '男：你晚上想吃什么？\n女：吃面条儿，怎么样？', answer: 'F' },
        { prompt: '男：房间里有电脑吗？\n女：有。', answer: 'D' }
      ]
    },
    part4: [
      { prompt: '今天天气不好，下雨了。\n问：今天是什么天气？', answer: 'C', options: textChoiceOptions({ A: '很热', B: '下雪', C: '下雨' }) },
      { prompt: '我今天晚上和同学一起学习中文。\n问：说话人今晚做什么？', answer: 'B', options: textChoiceOptions({ A: '做饭', B: '学中文', C: '去外边玩' }) },
      { prompt: '我明天不上班，可以在家里休息。\n问：说话人明天在哪里？', answer: 'A', options: textChoiceOptions({ A: '家', B: '医院', C: '学校' }) },
      { prompt: '这件衣服小了，我想买件新的。\n问：说话人想做什么？', answer: 'C', options: textChoiceOptions({ A: '读书', B: '唱歌', C: '买衣服' }) },
      { prompt: '坐飞机太贵了，我坐火车去那儿吧。\n问：说话人怎么去那儿？', answer: 'B', options: textChoiceOptions({ A: '开车', B: '坐火车', C: '坐飞机' }) }
    ]
  },
  reading: {
    part1: {
      options: [
        option('A', '', { image: image('hsk1-mock-04', 'read-p1-a.png', 'Con mèo') }),
        option('B', '', { image: image('hsk1-mock-04', 'read-p1-b.png', 'Ngủ') }),
        option('C', '', { image: image('hsk1-mock-04', 'read-p1-c.png', 'Bác sĩ') }),
        option('D', '', { image: image('hsk1-mock-04', 'read-p1-d.png', 'Lớp học') }),
        option('E', '', { image: image('hsk1-mock-04', 'read-p1-e.png', 'Đọc sách') }),
        option('F', '', { image: image('hsk1-mock-04', 'read-p1-f.png', 'Làm việc với máy tính') })
      ],
      rows: [
        { prompt: '我的儿子还没下课。', answer: 'D' },
        { prompt: '她明天去医院看病。', answer: 'C' },
        { prompt: '你的猫真漂亮！它几岁了？', answer: 'A' },
        { prompt: '妈妈正在睡觉，不要说话。', answer: 'B' },
        { prompt: '朋友在一家公司工作。', answer: 'F' }
      ]
    },
    part2: {
      options: textChoiceOptions({ A: '有点儿贵。', B: '没有。', C: '20岁。', D: '没事。', E: '对，他是我同学。', F: '好的，谢谢！' }),
      rows: [
        { prompt: '你认识高先生吧？', answer: 'E' },
        { prompt: '真对不起，我来晚了。', answer: 'D' },
        { prompt: '你看见谢老师了吗？', answer: 'B' },
        { prompt: '那个超市的东西怎么样？', answer: 'A' },
        { prompt: '你姐姐今年多大？', answer: 'C' }
      ]
    },
    part3: {
      options: textChoiceOptions({ A: '问', B: '电视', C: '生病', D: '叫', E: '一下', F: '说话' }),
      rows: [
        { prompt: '他（  ）了，今天不能来上班了。', answer: 'C' },
        { prompt: '女士，你好！请在这儿写（  ）你的手机号。', answer: 'E' },
        { prompt: '现在看（  ）的人很少了。', answer: 'B' },
        { prompt: '我想（  ）他一个问题。', answer: 'A' },
        { prompt: '你孩子会（  ）了吗？', answer: 'F' }
      ]
    },
    part4: [
      { prompt: '下雪了，你多穿一件衣服吧。\n问：说话人觉得天气怎么样？', answer: 'C', options: textChoiceOptions({ A: '雨太大', B: '太热了', C: '有点儿冷' }) },
      { prompt: '今天公司有很多事，他没有时间吃饭。\n问：我们可以知道什么？', answer: 'A', options: textChoiceOptions({ A: '他很忙', B: '他生病了', C: '他喜欢做饭' }) },
      { prompt: '家里没有水果了，我再去买些吧。\n问：说话人要去哪儿？', answer: 'A', options: textChoiceOptions({ A: '超市', B: '朋友家', C: '电影院' }) },
      { prompt: '他的女朋友很漂亮，学习也很好。\n问：他的女朋友怎么样？', answer: 'A', options: textChoiceOptions({ A: '很好看', B: '很少生病', C: '不爱说话' }) },
      { prompt: '一个杯子八十块？太贵了！有便宜一点儿的吗？\n问：说话人正在做什么？', answer: 'C', options: textChoiceOptions({ A: '见朋友', B: '学汉字', C: '买东西' }) }
    ]
  }
};

const sourceTrial02: PdfTrialSpec = {
  id: 'hsk1-trial-pdf-05',
  title: 'HSK 1 (3.0) - Đề thi thử số 5',
  description: 'Đề thi thử HSK1 (3.0) theo bộ PDF HSK3.0模拟（一）一级, gồm 20 câu nghe và 20 câu đọc. Thang điểm: Nghe 100 + Đọc 100 = 200 điểm.',
  audioUrl: '/audio_hsk1_trial_05.mp3',
  assetPrefix: 'hsk1-mock-05',
  listening: {
    part1: [
      { prompt: '喝牛奶', answer: 'A', options: imageChoiceOptions('hsk1-mock-05', 'listen-p1-q1', 'Câu 1 hình') },
      { prompt: '坐出租车', answer: 'C', options: imageChoiceOptions('hsk1-mock-05', 'listen-p1-q2', 'Câu 2 hình') },
      { prompt: '三只猫', answer: 'A', options: imageChoiceOptions('hsk1-mock-05', 'listen-p1-q3', 'Câu 3 hình') },
      { prompt: '在书店看书', answer: 'A', options: imageChoiceOptions('hsk1-mock-05', 'listen-p1-q4', 'Câu 4 hình') },
      { prompt: '漂亮的衣服', answer: 'B', options: imageChoiceOptions('hsk1-mock-05', 'listen-p1-q5', 'Câu 5 hình') }
    ],
    part2: [
      { prompt: '你喜欢吃饺子吗？', answer: 'B', options: textChoiceOptions({ A: '没关系', B: '很喜欢', C: '不好吃' }) },
      { prompt: '先生，请问您会说中文吗？', answer: 'C', options: textChoiceOptions({ A: '谢谢', B: '很好听', C: '会一点儿' }) },
      { prompt: '你每天早上几点起床？', answer: 'B', options: textChoiceOptions({ A: '十分钟', B: '八点半', C: '三个小时' }) },
      { prompt: '哥哥去哪儿买东西了？', answer: 'A', options: textChoiceOptions({ A: '商店', B: '衣服', C: '睡觉' }) },
      { prompt: '你妹妹今年多大了？', answer: 'A', options: textChoiceOptions({ A: '两岁', B: '很漂亮', C: '是学生' }) }
    ],
    part3: {
      options: [
        option('A', '', { image: image('hsk1-mock-05', 'listen-p3-a.png', 'Em bé chơi đồ chơi') }),
        option('B', '', { image: image('hsk1-mock-05', 'listen-p3-b.png', 'Hai người đi dưới mưa') }),
        option('C', '', { image: image('hsk1-mock-05', 'listen-p3-c.png', 'Bắt tay') }),
        option('D', '', { image: image('hsk1-mock-05', 'listen-p3-d.png', 'Ăn cùng bạn bè') }),
        option('E', '', { image: image('hsk1-mock-05', 'listen-p3-e.png', 'Điện thoại trên bàn') }),
        option('F', '', { image: image('hsk1-mock-05', 'listen-p3-f.png', 'Đưa đồ cho nhau') })
      ],
      rows: [
        { prompt: '女：谢谢你给我面包！\n男：不客气，多吃点儿。', answer: 'F' },
        { prompt: '男：你看见女儿了吗？\n女：在那儿呢。', answer: 'A' },
        { prompt: '男：外边天气怎么样？\n男：很冷，还下雨了。', answer: 'B' },
        { prompt: '男：你晚上要做什么？\n女：我去和朋友吃饭。', answer: 'D' },
        { prompt: '女：那是你的手机吗？\n男：桌子上的那个吗？不是。', answer: 'E' }
      ]
    },
    part4: [
      { prompt: '我的房间号是908。\n问：说话人住在哪个房间？', answer: 'C', options: textChoiceOptions({ A: '608', B: '809', C: '908' }) },
      { prompt: '弟弟喜欢吃面条儿，姐姐喜欢吃米饭。\n问：谁喜欢吃米饭？', answer: 'A', options: textChoiceOptions({ A: '姐姐', B: '弟弟', C: '哥哥' }) },
      { prompt: '我下课后和朋友去电影院。\n问：说话人下课后做什么？', answer: 'B', options: textChoiceOptions({ A: '吃晚饭', B: '看电影', C: '玩电脑' }) },
      { prompt: '我三月回国去看爸爸妈妈。\n问：说话人什么时候回国？', answer: 'A', options: textChoiceOptions({ A: '三月', B: '星期三', C: '三年后' }) },
      { prompt: '小高生病了，不能来上班了。\n问：小高怎么了？', answer: 'C', options: textChoiceOptions({ A: '上班了', B: '不喝茶', C: '生病了' }) }
    ]
  },
  reading: {
    part1: {
      options: [
        option('A', '', { image: image('hsk1-mock-05', 'read-p1-a.png', 'Nấu ăn') }),
        option('B', '', { image: image('hsk1-mock-05', 'read-p1-b.png', 'Con chó') }),
        option('C', '', { image: image('hsk1-mock-05', 'read-p1-c.png', 'Quần áo') }),
        option('D', '', { image: image('hsk1-mock-05', 'read-p1-d.png', 'Sinh nhật') }),
        option('E', '', { image: image('hsk1-mock-05', 'read-p1-e.png', 'Đọc sách') }),
        option('F', '', { image: image('hsk1-mock-05', 'read-p1-f.png', 'Tivi') })
      ],
      rows: [
        { prompt: '昨天是妈妈的生日。', answer: 'D' },
        { prompt: '这是我新买的电视。', answer: 'F' },
        { prompt: '这些衣服都很好看。', answer: 'C' },
        { prompt: '这儿有一只小狗，真可爱。', answer: 'B' },
        { prompt: '爸爸给家人做饭呢。', answer: 'A' }
      ]
    },
    part2: {
      options: textChoiceOptions({ A: '下了，雪不大。', B: '坐吧，没人。', C: '一杯牛奶吧。', D: '没有，怎么了？', E: '一百五十个。', F: '好的，谢谢！' }),
      rows: [
        { prompt: '你们公司有多少人？', answer: 'E' },
        { prompt: '你们那儿下雪了吗？', answer: 'A' },
        { prompt: '老师给你打电话了吗？', answer: 'D' },
        { prompt: '睡觉前你想喝点儿什么？', answer: 'C' },
        { prompt: '请问，我可以坐在这儿吗？', answer: 'F' }
      ]
    },
    part3: {
      options: textChoiceOptions({ A: '去', B: '有点儿', C: '正在', D: '叫', E: '同学', F: '个' }),
      rows: [
        { prompt: '我早上吃了一个（  ）苹果。', answer: 'F' },
        { prompt: '昨天这个时候，我（  ）飞机上呢。', answer: 'C' },
        { prompt: '现在（  ）热，我们喝口水吧。', answer: 'B' },
        { prompt: '妈妈，下午我想（  ）书店买本书。', answer: 'A' },
        { prompt: '你们认识很多年了吧？对，我们是小学（  ）。', answer: 'E' }
      ]
    },
    part4: [
      { prompt: '明天是星期六，我不上班。我们去买衣服吧。\n问：说话人明天要去哪里？', answer: 'C', options: textChoiceOptions({ A: '公司', B: '饭店', C: '商店' }) },
      { prompt: '我爸爸在医院上班，今天很多人去找他看病，他非常忙。\n问：说话人的爸爸做什么工作？', answer: 'A', options: textChoiceOptions({ A: '医生', B: '老师', C: '学生' }) },
      { prompt: '我昨天晚上没去上课，在家看电视了。\n问：说话人昨天晚上在哪儿？', answer: 'A', options: textChoiceOptions({ A: '家', B: '学校', C: '电影院' }) },
      { prompt: '我爱去学校后边那家超市，那里卖的东西很便宜。\n问：那家超市的东西怎么样？', answer: 'B', options: textChoiceOptions({ A: '不多', B: '不贵', C: '不好吃' }) },
      { prompt: '你好，我要一个鸡蛋和一个包子，多少钱？六块五。\n问：说话人在做什么？', answer: 'C', options: textChoiceOptions({ A: '休息', B: '看病', C: '买东西' }) }
    ]
  }
};

export const HSK1_PDF_TRIAL_01_EXAM = makeSourceTrialExam(sourceTrial01);
export const HSK1_PDF_TRIAL_02_EXAM = makeSourceTrialExam(sourceTrial02);

const trial01: TrialSpec = {
  id: 'hsk1-trial-pdf-01',
  title: 'HSK 1 (3.0) - Đề thi thử số 1',
  description: 'Đề thi thử HSK1 (3.0) theo PDF gốc: 20 câu nghe và 20 câu đọc. File nghe dùng chung đặt ở đầu phần nghe; đề không bật đồng hồ đếm giờ.',
  audioUrl: '/audio_hsk1_trial_01.mp3',
  assetPrefix: 'hsk1-mock-01',
  listening: {
    part1: [
      { image: 'listen-p1-q1.png', alt: 'Em bé đang ngủ', prompt: '在睡觉', answer: 'A' },
      { image: 'listen-p1-q2.png', alt: 'Người đang chơi bóng rổ', prompt: '看书', answer: 'B' },
      { image: 'listen-p1-q3.png', alt: 'Con mèo và con chó', prompt: '猫和狗', answer: 'A' },
      { image: 'listen-p1-q4.png', alt: 'Hai chiếc ghế', prompt: '两个椅子', answer: 'A' },
      { image: 'listen-p1-q5.png', alt: 'Mì trong bát', prompt: '吃米饭', answer: 'B' }
    ],
    part2: [
      { prompt: '你看，小狗在吃东西呢。', answer: 'A', options: ['A', 'B', 'C'].map((id, index) => option(id, '', { image: image('hsk1-mock-01', `listen-p2-q6-${id.toLowerCase()}.png`, `Câu 6 hình ${id}`) })) },
      { prompt: '这是爸爸的电脑。', answer: 'C', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-01', `listen-p2-q7-${id.toLowerCase()}.png`, `Câu 7 hình ${id}`) })) },
      { prompt: '李先生，请喝茶。', answer: 'B', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-01', `listen-p2-q8-${id.toLowerCase()}.png`, `Câu 8 hình ${id}`) })) },
      { prompt: '我会做中国菜。', answer: 'B', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-01', `listen-p2-q9-${id.toLowerCase()}.png`, `Câu 9 hình ${id}`) })) },
      { prompt: '她在打电话。', answer: 'A', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-01', `listen-p2-q10-${id.toLowerCase()}.png`, `Câu 10 hình ${id}`) })) }
    ],
    part3: {
      options: [
        option('A', '', { image: image('hsk1-mock-01', 'listen-p3-a.png', 'Cô giáo') }),
        option('B', '', { image: image('hsk1-mock-01', 'listen-p3-b.png', 'Đồng hồ') }),
        option('C', '', { image: image('hsk1-mock-01', 'listen-p3-c.png', 'Bắt tay') }),
        option('D', '', { image: image('hsk1-mock-01', 'listen-p3-d.png', 'Viết chữ Hán') }),
        option('E', '', { image: image('hsk1-mock-01', 'listen-p3-e.png', 'Trà') }),
        option('F', '', { image: image('hsk1-mock-01', 'listen-p3-f.png', 'Làm việc ở bệnh viện') })
      ],
      rows: [
        { prompt: '你上午几点钟去学校？男：九点钟。', answer: 'B' },
        { prompt: '你认识她吗？女：认识，她是我的汉语老师。', answer: 'A' },
        { prompt: '你会写汉字吗？男：会。我学汉语两年多了。', answer: 'D' },
        { prompt: '你的茶杯在哪儿？女：我家后边的商店里。', answer: 'E' },
        { prompt: '你儿子在哪儿工作？男：我儿子在医院工作。', answer: 'F' }
      ]
    },
    part4: [
      { prompt: '今天太冷了，我不想去看电影。问：今天天气怎么样？', answer: 'A', options: [option('A', '很冷'), option('B', '很热'), option('C', '很好')] },
      { prompt: '中午妈妈没有做饭，我们去饭店吃吧。问：他们中午去哪里？', answer: 'B', options: [option('A', '学校'), option('B', '饭店'), option('C', '商店')] },
      { prompt: '这本书是我朋友买的，我很喜欢。问：书是谁买的？', answer: 'B', options: [option('A', '我'), option('B', '朋友'), option('C', '老师')] },
      { prompt: '明天下午我想和爸爸去看电影。问：明天下午他想去哪里？', answer: 'C', options: [option('A', '医院'), option('B', '水果店'), option('C', '电影院')] },
      { prompt: '我朋友是一个老师，今年三十岁了。问：她朋友在哪儿工作？', answer: 'A', options: [option('A', '饭店'), option('B', '学校'), option('C', '书店')] }
    ]
  },
  reading: {
    part1: [
      { image: 'read-p1-q21.png', alt: 'Người phụ nữ đang nghe', prompt: '听', answer: 'A' },
      { image: 'read-p1-q22.png', alt: 'Quả dâu', prompt: '苹果', answer: 'B' },
      { image: 'read-p1-q23.png', alt: 'Một cốc trà', prompt: '茶', answer: 'A' },
      { image: 'read-p1-q24.png', alt: 'Người đang nói lời tạm biệt', prompt: '再见', answer: 'A' },
      { image: 'read-p1-q25.png', alt: 'Một quyển sách', prompt: '书', answer: 'A' }
    ],
    part2: {
      options: [
        option('A', '', { image: image('hsk1-mock-01', 'read-p2-a.png', 'Bộ ấm trà') }),
        option('B', '', { image: image('hsk1-mock-01', 'read-p2-b.png', 'Mua hoa quả') }),
        option('C', '', { image: image('hsk1-mock-01', 'read-p2-c.png', 'Trời mưa') }),
        option('D', '', { image: image('hsk1-mock-01', 'read-p2-d.png', 'Làm việc với máy tính') }),
        option('E', '', { image: image('hsk1-mock-01', 'read-p2-e.png', 'Đọc sách') }),
        option('F', '', { image: image('hsk1-mock-01', 'read-p2-f.png', 'Món ăn Trung Quốc') })
      ],
      rows: [
        { prompt: '爸爸在工作呢。', answer: 'D' },
        { prompt: '她去商店买了一点儿水果。', answer: 'B' },
        { prompt: '李小姐爱喝茶。', answer: 'A' },
        { prompt: '下雨了，天气很冷。', answer: 'C' },
        { prompt: '我很爱吃中国菜。', answer: 'F' }
      ]
    },
    part3: {
      options: [option('A', '衣服。'), option('B', '对不起，没有。'), option('C', '五年多了。'), option('D', '30个。'), option('E', '开车。'), option('F', '好的，谢谢！')],
      rows: [
        { prompt: '这个学校有多少老师？', answer: 'D' },
        { prompt: '你怎么去火车站？', answer: 'E' },
        { prompt: '你去商店买什么？', answer: 'A' },
        { prompt: '你们这儿有这本书吗？', answer: 'B' },
        { prompt: '她来中国几年了？', answer: 'C' }
      ]
    },
    part4: {
      options: [option('A', '开'), option('B', '都'), option('C', '不客气'), option('D', '名字'), option('E', '哪'), option('F', '学习')],
      rows: [
        { prompt: '爸爸妈妈（  ）很爱我。', answer: 'B' },
        { prompt: '雨太大了，车不能（  ）了。', answer: 'A' },
        { prompt: '上午我女儿在学校（  ）。', answer: 'F' },
        { prompt: '女：谢谢你请我吃饭。男：（  ）。', answer: 'C' },
        { prompt: '男：你是（  ）国人？女：我是中国人。', answer: 'E' }
      ]
    }
  }
};

const trial02: TrialSpec = {
  id: 'hsk1-trial-pdf-02',
  title: 'HSK 1 (3.0) - Đề thi thử số 2',
  description: 'Đề thi thử HSK1 (3.0) theo PDF gốc: 20 câu nghe và 20 câu đọc. File nghe dùng chung đặt ở đầu phần nghe; đề không bật đồng hồ đếm giờ.',
  audioUrl: '/audio_hsk1_trial_02.mp3',
  assetPrefix: 'hsk1-mock-02',
  listening: {
    part1: [
      { image: 'listen-p1-q1.png', alt: 'Trời nắng', prompt: '下雨', answer: 'B' },
      { image: 'listen-p1-q2.png', alt: 'Một đôi giày', prompt: '买衣服', answer: 'B' },
      { image: 'listen-p1-q3.png', alt: 'Người đang ăn táo', prompt: '吃苹果', answer: 'A' },
      { image: 'listen-p1-q4.png', alt: 'Người phụ nữ', prompt: '看电视', answer: 'B' },
      { image: 'listen-p1-q5.png', alt: 'Học sinh đeo cặp đi học', prompt: '去学校', answer: 'A' }
    ],
    part2: [
      { prompt: '现在是五点。', answer: 'C', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-02', `listen-p2-q6-${id.toLowerCase()}.png`, `Câu 6 hình ${id}`) })) },
      { prompt: '他是坐飞机去北京的。', answer: 'A', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-02', `listen-p2-q7-${id.toLowerCase()}.png`, `Câu 7 hình ${id}`) })) },
      { prompt: '他家有五个人。', answer: 'A', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-02', `listen-p2-q8-${id.toLowerCase()}.png`, `Câu 8 hình ${id}`) })) },
      { prompt: '今天天气很热。', answer: 'B', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-02', `listen-p2-q9-${id.toLowerCase()}.png`, `Câu 9 hình ${id}`) })) },
      { prompt: '我朋友是医生。', answer: 'B', options: ['A', 'B', 'C'].map((id) => option(id, '', { image: image('hsk1-mock-02', `listen-p2-q10-${id.toLowerCase()}.png`, `Câu 10 hình ${id}`) })) }
    ],
    part3: {
      options: [
        option('A', '', { image: image('hsk1-mock-02', 'listen-p3-a.png', 'Cốc') }),
        option('B', '', { image: image('hsk1-mock-02', 'listen-p3-b.png', 'Người phụ nữ cầm cốc') }),
        option('C', '', { image: image('hsk1-mock-02', 'listen-p3-c.png', 'Bắt tay') }),
        option('D', '', { image: image('hsk1-mock-02', 'listen-p3-d.png', 'Tàu hỏa') }),
        option('E', '', { image: image('hsk1-mock-02', 'listen-p3-e.png', 'Đồ ăn') }),
        option('F', '', { image: image('hsk1-mock-02', 'listen-p3-f.png', 'Sách') })
      ],
      rows: [
        { prompt: '你是中国人吗？女：是，我是中国人。', answer: 'B' },
        { prompt: '你看见我的杯子了吗？男：在桌子上。', answer: 'A' },
        { prompt: '这是你的书吗？男：不是，这是我朋友的书。', answer: 'F' },
        { prompt: '你是怎么来北京的？男：我是坐火车来的。', answer: 'D' },
        { prompt: '你女儿在哪儿工作？男：她在饭店工作。', answer: 'E' }
      ]
    },
    part4: [
      { prompt: '今天雨太大了，我是坐出租车去学校的。问：她是怎么去学校的？', answer: 'C', options: [option('A', '开车'), option('B', '坐飞机'), option('C', '坐出租车')] },
      { prompt: '我不会开车，我爸爸会开。问：谁会开车？', answer: 'B', options: [option('A', '我'), option('B', '我爸爸'), option('C', '我和爸爸')] },
      { prompt: '她来中国四年多了，她很喜欢中国。问：她来中国几年了？', answer: 'A', options: [option('A', '四年多'), option('B', '七年多'), option('C', '十年多')] },
      { prompt: '我会写很多汉字，汉语老师很高兴。问：她会什么？', answer: 'C', options: [option('A', '做饭'), option('B', '说汉语'), option('C', '写汉字')] },
      { prompt: '我的电脑是八月二十号买的，买了九天了。问：电脑是什么时候买的？', answer: 'B', options: [option('A', '8月11号'), option('B', '8月20号'), option('C', '8月29号')] }
    ]
  },
  reading: {
    part1: [
      { image: 'read-p1-q21.png', alt: 'Con mèo', prompt: '狗', answer: 'B' },
      { image: 'read-p1-q22.png', alt: 'Người đang ngủ', prompt: '睡觉', answer: 'A' },
      { image: 'read-p1-q23.png', alt: 'Đĩa bánh bao', prompt: '米饭', answer: 'B' },
      { image: 'read-p1-q24.png', alt: 'Người đang tập thể dục', prompt: '学习', answer: 'B' },
      { image: 'read-p1-q25.png', alt: 'Người phụ nữ vui vẻ', prompt: '高兴', answer: 'A' }
    ],
    part2: {
      options: [
        option('A', '', { image: image('hsk1-mock-02', 'read-p2-a.png', 'Học bài') }),
        option('B', '', { image: image('hsk1-mock-02', 'read-p2-b.png', 'Quả địa cầu') }),
        option('C', '', { image: image('hsk1-mock-02', 'read-p2-c.png', 'Làm việc ở nhà hàng') }),
        option('D', '', { image: image('hsk1-mock-02', 'read-p2-d.png', 'Mẹ và con') }),
        option('E', '', { image: image('hsk1-mock-02', 'read-p2-e.png', 'Đọc sách') }),
        option('F', '', { image: image('hsk1-mock-02', 'read-p2-f.png', 'Mèo uống nước') })
      ],
      rows: [
        { prompt: '你看，小猫在喝水呢。', answer: 'F' },
        { prompt: '老师，这个字我会读。', answer: 'A' },
        { prompt: '我朋友在饭店工作。', answer: 'C' },
        { prompt: '中国在这儿。', answer: 'B' },
        { prompt: '妈妈很爱我。', answer: 'D' }
      ]
    },
    part3: {
      options: [option('A', '我家后面。'), option('B', '10岁。'), option('C', '中国菜。'), option('D', '我很喜欢。'), option('E', '星期五。'), option('F', '好的，谢谢！')],
      rows: [
        { prompt: '今天星期几？', answer: 'E' },
        { prompt: '那个医院在哪儿？', answer: 'A' },
        { prompt: '这本书怎么样？', answer: 'D' },
        { prompt: '你女儿今年几岁了？', answer: 'B' },
        { prompt: '你喜欢吃什么？', answer: 'C' }
      ]
    },
    part4: {
      options: [option('A', '学校'), option('B', '米饭'), option('C', '几'), option('D', '名字'), option('E', '认识'), option('F', '同学')],
      rows: [
        { prompt: '我不爱吃（  ）。', answer: 'B' },
        { prompt: '我不（  ）这个人。', answer: 'E' },
        { prompt: '王老师住在（  ）里。', answer: 'A' },
        { prompt: '男：他们是谁？女：他们都是我的（  ）。', answer: 'F' },
        { prompt: '男：你来北京（  ）年了？女：五年多了。', answer: 'C' }
      ]
    }
  }
};

export const HSK1_TRIAL_01_EXAM = makeTrialExam(trial01);
export const HSK1_TRIAL_02_EXAM = makeTrialExam(trial02);
