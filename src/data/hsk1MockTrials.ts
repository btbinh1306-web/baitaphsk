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
