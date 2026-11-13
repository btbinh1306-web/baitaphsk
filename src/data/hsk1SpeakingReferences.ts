import { ExamLesson, Question } from '../types';

// Sample answers for HSK1 speaking prompts that are questions (or need a reply).
// Keyed by the Chinese prompt so lessons and aggregate exams share them.
const HSK1_SAMPLE_REPLIES: Record<string, string> = {
  '请问，你叫什么名字？': '我叫李文。',
  '你叫什么名字？': '我叫李文。',
  '你是哪国人？': '我是越南人。',
  '你家有几口人？': '我家有四口人。',
  '你今年多大？': '我今年二十岁。',
  '今天是几月几号？': '今天是十一月十四号。',
  '你的手机号是多少？': '我的手机号是一三八……（học sinh nói số thật）。',
  '你去哪儿？怎么去？': '我去学校，坐出租车去。',
  '你想买什么？': '我想买一个杯子。',
  '晚饭你想吃什么？': '晚饭我想吃米饭和菜。',
  '现在几点？': '现在八点十分。',
  '你几点上课？': '我上午八点上课。',
  '你下午几点上课？': '我下午两点上课。',
  '你早上吃什么？': '我早上吃面包，喝牛奶。',
  '我们下午四点见吧。': '好的，下午四点见。',
  '你家有几个房间？': '我家有三个房间。',
  '小猫在哪儿？': '小猫在桌子下面。',
  '你能说汉语吗？': '我能说一点儿汉语。',
  '你的房间怎么样？': '我的房间不大，很漂亮。',
  '你白天做什么？': '我白天在学校学习。',
  '你喜欢看电视吗？': '我喜欢看电视。',
  '你会唱中文歌吗？': '我会唱一点儿中文歌。',
  '你喜欢和谁玩？': '我喜欢和朋友一起玩。',
  '这个杯子多少钱？': '这个杯子二十块钱。',
  '你喜欢吃什么水果？': '我喜欢吃苹果。',
  '你想买什么水果？': '我想买苹果。',
  '这件衣服怎么样？': '这件衣服很漂亮。',
  '你现在在做什么呢？': '我在学习中文呢。',
  '你会不会开车？': '我不会开车。（或：我会开车。）',
  '你什么时候起床？': '我早上六点起床。',
  '你还在学习中文吗？': '我还在学习中文。',
  '今天天气怎么样？': '今天天气很好，不太冷。',
  '你觉得今天冷不冷？': '我觉得今天有点儿冷。',
  '你生病的时候会做什么？': '我生病的时候去医院看医生。',
  '你什么时候回家？': '我下午五点回家。',
  '我可以问一下吗？': '可以，你问吧。',
  '请给我一杯茶。': '好的，给你。',
  '先生，您要喝什么？': '我要喝一杯茶。',
  '我想再吃一块面包。': '好，给你。',
  '你昨天做了什么？': '我昨天看了一个电影。',
  '你会写汉字吗？': '我会写一些汉字。',
  '你听见老师说话了吗？': '我听见了。',
  '太晚了，我们回家吧。': '好，我们回家吧。',
  '你爱你的家人吗？': '我很爱我的家人。',
  '这两个手机，你想买哪个？': '我想买这个。',
  '你现在住在哪儿？': '我现在住在河内。',
  '你坐飞机要几个小时？': '坐飞机要两个小时。',
  '明天你和家人去哪儿？': '明天我和家人去饭店吃饭。'
};

// Open oral tasks in the entrance test: the student answers with their own information.
const HSK1_ORAL_ANSWERS: Record<string, string> = {
  hsk1_entry_oral_self_intro: '大家好！我叫……。我是越南人。我今年二十岁。我是学生。',
  hsk1_entry_oral_family: '我家有四个人：爸爸、妈妈、哥哥和我。',
  hsk1_entry_oral_birth_year: '我是二〇〇五年出生的。',
  hsk1_entry_oral_birthday: '我的生日是五月八号。',
  hsk1_entry_oral_today: '今天是十一月十四号。'
};

const hasReference = (question: Question) => Boolean(
  question.suggestedAnswer?.trim()
  || question.referenceAnswers?.some((answer) => answer?.trim())
  || question.acceptedVariants?.some((answer) => answer?.trim())
);

// "Đọc thành tiếng: 大家好！" / 'Câu 1: "大家好！"' / '大家好！' -> '大家好！'
const getSpokenText = (prompt: string): string => {
  const quoted = [...prompt.matchAll(/["“]([^"”]+)["”]/gu)].pop();
  if (quoted) return quoted[1].trim();
  return prompt.replace(/^[^:：]*[:：]\s*/u, '').trim();
};

const addReference = (question: Question): Question => {
  if (question.type !== 'speaking' && question.type !== 'speaking_record') return question;
  if (hasReference(question)) return question;

  const oral = HSK1_ORAL_ANSWERS[question.id];
  if (oral) {
    return { ...question, referenceAnswers: [`Bài mẫu (học sinh nói theo thông tin thật của mình): ${oral}`] };
  }

  const text = getSpokenText(question.prompt || '');
  if (!text) return question;
  const pinyin = question.pinyin?.trim();
  const references = [`Đọc đúng: ${text}${pinyin ? ` — ${pinyin}` : ''}`];
  const reply = HSK1_SAMPLE_REPLIES[text];
  if (reply) references.push(`Gợi ý trả lời: ${reply}`);
  return { ...question, referenceAnswers: references };
};

/** Give every HSK1 speaking question a reference answer for teachers grading by hand. */
export const withHsk1SpeakingReferences = (exam: ExamLesson): ExamLesson => (
  exam.level !== 'HSK 1' ? exam : {
    ...exam,
    speakingQuestions: (exam.speakingQuestions || []).map(addReference)
  }
);
