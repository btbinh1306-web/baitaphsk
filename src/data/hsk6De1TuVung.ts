import { ExamLesson, Question } from '../types';
import { emptyLesson, LETTERS, lettered, MatchingSet } from './hsk6De1Matching';

// HSK 6 · Đề 1 · 词语练习: vocabulary of questions 41–77 and the 词素 compounds
// (from the teacher's HSK6_De1_LuyenTap_TuVung.docx).

const VOCAB_FILL: Array<{ bank: string[]; sentences: string[]; answers: string[] }> = [
  { bank: ["打造", "创办", "备胎", "重塑", "视为", "体系", "切实", "繁荣", "特定", "传承"], sentences: ["后备厢里有一个___。", "我们要采取___有效的措施。", "这种药只适用于___的人群。", "这次改革___了公司的形象。", "城市的经济非常___。", "青春一代继续___这份友谊。", "这个城市努力___国际旅游品牌。", "他___了一家科技公司。", "他把这次失败___一次学习机会。", "柴严逐步打造出智慧农业管理___。"], answers: ["备胎", "切实", "特定", "重塑", "繁荣", "传承", "打造", "创办", "视为", "体系"] },
  { bank: ["年幼", "障碍", "上映", "观察", "恰当", "搭配", "探索", "透露", "活跃", "实时"], sentences: ["这看似简单的一笔，消除了交流中的关键___。", "科学家连续___了孩子们的反应。", "导演___了影片的制作情况。", "这部电影将于春节___。", "这句话的用词很___。", "人类一直在___宇宙的奥秘。", "班里的气氛___了起来。", "这件衬衫和裙子___得很好。", "___的孩子还不能准确表达自己的情绪。", "这个软件可以___翻译外语。"], answers: ["障碍", "观察", "透露", "上映", "恰当", "探索", "活跃", "搭配", "年幼", "实时"] },
  { bank: ["碰撞", "合并", "方言", "疟疾", "致力于", "和谐", "愤怒", "休闲", "大幅", "文献"], sentences: ["这两家公司决定___。", "她整理了大量医学___。", "两辆车发生了___。", "___是由蚊子传播的疾病。", "邻居之间相处得很___。", "他说着一口浓重的四川___。", "周末我喜欢在家过___生活。", "今年的产量___提升。", "她一生___教育事业。", "5岁的孩子也能分辨快乐和___的表情。"], answers: ["合并", "文献", "碰撞", "疟疾", "和谐", "方言", "休闲", "大幅", "致力于", "愤怒"] },
  { bank: ["清醒", "国产", "扎根", "迅速", "占据", "接触", "遥感", "适度", "激发", "倾向于"], sentences: ["低收入家庭更___以升学为目标。", "国外动画曾___市场主导地位。", "通过卫星___，柴严能掌握千亩农田的墒情与长势。", "只有了解当地文化，才能___于这里。", "每天___运动对身体有好处。", "面对压力，我们要保持头脑___。", "消息___传开了。", "每周最好多___大自然。", "这是一部纯___动画电影。", "好老师能___学生的学习兴趣。"], answers: ["倾向于", "占据", "遥感", "扎根", "适度", "清醒", "迅速", "接触", "国产", "激发"] },
  { bank: ["十足", "强迫", "并未", "融化", "投放", "距离", "显著", "潮流", "荣誉", "监测"], sentences: ["父母不应___孩子学习。", "她被授予了国家最高___勋章。", "他对这次比赛信心___。", "坚持锻炼后，他的身体状况有了___的变化。", "春天来了，河面上的冰雪___了。", "我们要顺应时代的___。", "村里___采取强迫手段。", "环保部门每天___空气质量。", "这次交流拉近了两国青年的心灵___。", "请把垃圾___到指定地点。"], answers: ["强迫", "荣誉", "十足", "显著", "融化", "潮流", "并未", "监测", "距离", "投放"] },
  { bank: ["实践", "凝聚", "启动", "提取", "特殊", "坚信", "造型", "振兴", "良好", "释放"], sentences: ["这个建筑的___很独特。", "科学家从青蒿中___出了有效成分。", "理论要和___结合起来。", "运动是___压力的好办法。", "___的自然环境有助于身体放松。", "政府决定___这项生态修复工程。", "这次活动___了邻里情谊。", "体育成了连接两国民众的___桥梁。", "国家大力推进乡村___。", "我始终___，只要努力就能成功。"], answers: ["造型", "提取", "实践", "释放", "良好", "启动", "凝聚", "特殊", "振兴", "坚信"] },
  { bank: ["冲击", "机制", "启示", "察言观色", "票房", "续集", "单纯", "热线", "桥梁", "探讨"], sentences: ["有问题可以拨打客服___。", "网络的发展给传统媒体带来了很多___。", "这部电影的___明年上映。", "语言是不同文化之间的___。", "她是一个很___的女孩。", "在职场上，要学会___。", "从身体___来看，自然环境有助于放松。", "大家一起___解决问题的方法。", "通过这个故事，我得到了一个深刻的___。", "这部电影的___已突破一百亿元。"], answers: ["热线", "冲击", "续集", "桥梁", "单纯", "察言观色", "机制", "探讨", "启示", "票房"] },
  { bank: ["一体化", "创意", "接见", "移动", "引发", "打磨", "风尚", "融合", "违法", "趣味性"], sentences: ["请把桌子向左___一点。", "老师用游戏增强课堂的___。", "这家医院实现了检查与治疗___。", "总统在白宫___了乒乓球代表团。", "这个广告很有___。", "垃圾分类正成为全村的绿色___。", "他积极探索现代科技与农业的深度___。", "乱砍滥伐是___行为。", "这个决定___了很大的争议。", "团队用五年时间___剧本。"], answers: ["移动", "趣味性", "一体化", "接见", "创意", "风尚", "融合", "违法", "引发", "打磨"] },
  { bank: ["改造", "监控", "调动", "激励", "青蒿", "巧妙", "微小", "瞬间", "上门", "繁忙", "典型", "混合", "精准", "缓解", "疑惑"], sentences: ["志愿者___帮老人分类垃圾。", "公司用奖金来___员工。", "我们打算把这间旧房子___成咖啡馆。", "屠呦呦从___中提取出了青蒿素。", "这是一个___的案例。", "天气预报越来越___了。", "把牛奶和咖啡___在一起就是拿铁。", "散步可以___压力。", "他___地回答了这个问题。", "系统可以实时___农作物的生长情况。", "家长常常___，孩子为什么读不懂大人的情绪。", "一___，天突然变黑了。", "两次结果只有___的差别。", "他每天都很___。", "公司决定___一部分职员。"], answers: ["上门", "激励", "改造", "青蒿", "典型", "精准", "混合", "缓解", "巧妙", "监控", "疑惑", "瞬间", "微小", "繁忙", "调动"] }
];

const VOCAB_MEANING: MatchingSet[] = [
  { title: "Bộ 1", items: [["微小", "wēixiǎo"], ["透露", "tòulù"], ["备胎", "bèitāi"], ["距离", "jùlí"], ["冲击", "chōngjī"], ["打磨", "dǎmó"], ["趣味性", "qùwèixìng"], ["愤怒", "fènnù"], ["风尚", "fēngshàng"], ["合并", "hébìng"]], options: ["khoảng cách; cách", "mài dũa, trau chuốt", "tiết lộ, để lộ", "tính thú vị", "phong khí, xu hướng được ưa chuộng", "cực kỳ nhỏ, nhỏ bé", "hợp nhất, gộp lại", "phẫn nộ, tức giận", "lốp dự phòng", "va đập mạnh; gây chấn động, tác động"], answers: "FCIAJBDHEG" },
  { title: "Bộ 2", items: [["重塑", "chóngsù"], ["遥感", "yáogǎn"], ["启示", "qǐshì"], ["投放", "tóufàng"], ["违法", "wéifǎ"], ["恰当", "qiàdàng"], ["典型", "diǎnxíng"], ["造型", "zàoxíng"], ["方言", "fāngyán"], ["搭配", "dāpèi"]], options: ["điển hình, tiêu biểu", "bỏ vào, thả vào, đưa ra", "tiếng địa phương", "sự gợi mở, điều khai sáng; bài học gợi ra", "kiểu dáng, tạo hình", "trái pháp luật; vi phạm pháp luật", "hợp lý, thích hợp", "tái định hình, xây dựng lại một diện mạo mới", "kết hợp, phối hợp", "viễn thám"], answers: "HJDBFGAECI" },
  { title: "Bộ 3", items: [["适度", "shìdù"], ["十足", "shízú"], ["国产", "guóchǎn"], ["荣誉", "róngyù"], ["巧妙", "qiǎomiào"], ["大幅", "dàfú"], ["释放", "shìfàng"], ["调动", "diàodòng"], ["特定", "tèdìng"], ["振兴", "zhènxīng"]], options: ["vinh dự", "điều động; huy động", "nhất định, riêng biệt, được chỉ định", "mức độ phù hợp, vừa phải", "sản xuất trong nước, quốc sản", "khéo léo, tài tình", "giải tỏa, giải phóng", "với biên độ lớn", "đầy đủ hoàn toàn, trọn vẹn", "chấn hưng, làm cho phát triển hưng thịnh"], answers: "DIEAFHGBCJ" },
  { title: "Bộ 4", items: [["精准", "jīngzhǔn"], ["占据", "zhànjù"], ["碰撞", "pèngzhuàng"], ["创办", "chuàngbàn"], ["混合", "hùnhé"], ["和谐", "héxié"], ["上门", "shàngmén"], ["监控", "jiānkòng"], ["融化", "rónghuà"], ["青蒿", "qīnghāo"]], options: ["sáng lập, thành lập", "chuẩn xác", "tan chảy", "giám sát kiểm soát; camera giám sát", "trộn lẫn, hỗn hợp;", "va chạm; giao thoa", "chiếm, chiếm giữ", "hài hòa, hòa thuận", "thanh hao", "đến thẳng nhà"], answers: "BGFAEHJDCI" }
];

const SYNONYM = {
  items: ["荣", "迅", "碰", "占", "活", "疾", "观", "愤", "疑", "显", "特", "障"],
  options: ["殊", "跃", "速", "病", "惑", "著", "誉", "碍", "据", "撞", "怒", "察"],
  answers: "GCJIBDLKEFAH",
  words: ["荣誉", "迅速", "碰撞", "占据", "活跃", "疾病", "观察", "愤怒", "疑惑", "显著", "特殊", "障碍"]
};

const NEAR_SYNONYMS: Array<[string, string[], 'A' | 'B']> = [
  ["消息___传开了。", ["迅速", "快速"], "A"],
  ["汽车在___路上行驶。", ["迅速", "快速"], "B"],
  ["___3月初，影片票房已突破百亿元。", ["截止", "截至"], "B"],
  ["报名今天下午五点___。", ["截止", "截至"], "A"],
  ["他对这个问题感到很___。", ["疑问", "疑惑"], "B"],
  ["如有___，请随时联系我。", ["疑问", "疑惑"], "A"],
  ["面对两份工作，他很___，不知道怎么选。", ["困惑", "疑问"], "A"],
  ["他___我早点离开。", ["暗示", "启示"], "A"],
  ["这个故事给了我很大的___。", ["提示", "启示"], "B"],
  ["屏幕上出现了操作___。", ["提示", "启示"], "A"],
  ["坚持锻炼后，他的身体有了___变化。", ["显著", "大幅"], "A"],
  ["他___累了，需要休息。", ["明显", "显著"], "A"],
  ["她___了父亲的事业。", ["继承", "传承"], "A"],
  ["青年人要___传统文化。", ["承担", "传承"], "B"],
  ["他___了全部责任。", ["承担", "继承"], "A"],
  ["语言不通___了他们的交流。", ["障碍", "阻碍"], "B"],
  ["我们要打破语言___。", ["障碍", "阻碍"], "A"],
  ["我始终___他一定会来。", ["坚持", "坚信"], "B"],
  ["他___每天练习汉语。", ["坚持", "坚信"], "A"],
  ["因为___原因，会议推迟了。", ["特殊", "特别"], "A"],
  ["我___喜欢这部电影。", ["特殊", "特别"], "B"]
];

const COLLOCATION = {
  items: ["消除", "打磨", "传承", "拉近", "占据", "透露", "克服", "提取"],
  options: ["有效成分", "困难", "剧本", "市场", "障碍", "消息", "距离", "文化"],
  answers: "ECHGDFBA"
};

const TRANSLATION: Array<[string, string, string]> = [
  ["Ngôn ngữ là cầu nối giữa các nền văn hóa.", "桥梁", "语言是不同文化之间的桥梁。"],
  ["Cô ấy dốc sức cả đời cho sự nghiệp giáo dục.", "致力于", "她一生致力于教育事业。"],
  ["Hiệu quả của chính sách này rất rõ rệt.", "显著", "这项政策的效果十分显著。"],
  ["Đội ngũ đã dành năm năm để trau chuốt kịch bản.", "打磨", "团队用五年时间打磨剧本。"],
  ["Kinh tế thành phố phát triển nhanh chóng và rất phồn vinh.", "迅速 / 繁荣", "这座城市的经济发展迅速，十分繁荣。"],
  ["Tôi nghiêng về chọn phương án thứ hai.", "倾向于", "我倾向于选择第二个方案。"]
];

const ESSAY = {
  title: "《我的一次交流经历》",
  words: ["桥梁", "拉近", "距离", "障碍", "传承", "启示", "坚信", "致力于", "缓解", "创意", "繁荣", "激发"],
  sample: "去年我参加了一次中越青年交流活动。刚开始，语言成了最大的障碍，但大家都很热情，慢慢拉近了彼此的距离。这次经历给了我很大的启示：交流是文化之间的桥梁。我坚信，只要保持沟通，就没有克服不了的困难。"
};

// The worksheet is split into three shorter practice tests (Đề 1–3). Every test
// keeps the same question types: 3 选词填空 sets, a meaning-matching set, 词素,
// near-synonyms, 搭配 and 2 translations. The paragraph is in test 3 only.
type Part = 0 | 1 | 2;
const PARTS: Part[] = [0, 1, 2];
const pad = (value: number) => String(value).padStart(2, '0');

// Split a list into three nearly equal consecutive chunks.
const third = <T,>(list: T[], part: Part): T[] => (
  list.slice(Math.round((list.length * part) / 3), Math.round((list.length * (part + 1)) / 3))
);

// Deterministic shuffle so every student sees the same A–N order.
const seededShuffle = <T,>(list: T[], seed: number): T[] => {
  const result = [...list];
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

// Options for a short matching set: the partners of this test's items plus two
// partners from the other tests as distractors, in a fixed shuffled order.
const shortOptionList = (allOptions: string[], answerLetters: string, itemIndexes: number[], seed: number): string[] => {
  const own = itemIndexes.map((index) => allOptions[LETTERS.indexOf(answerLetters[index])]);
  const others = allOptions.filter((option) => !own.includes(option));
  const distractors = seededShuffle(others, seed + 1).slice(0, 2);
  return seededShuffle([...own, ...distractors], seed);
};

const matchingItem = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  group: { taskGroup: string; taskGroupTitle: string; instruction: string }
): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options: lettered(options),
  keepOptionOrder: true,
  answer,
  explanation,
  ...group
});

const vocabTest = (part: Part): ExamLesson => {
  const examId = `hsk6-de1-tu-vung-${part + 1}`;

  // 选词填空: worksheet sets 1–3 / 4–6 / 7–9.
  const fillQuestions = VOCAB_FILL.slice(part * 3, part * 3 + 3).flatMap((set, setIndex) => set.sentences.map((sentence, index) => ({
    id: `${examId}-fill-${setIndex + 1}-${pad(index + 1)}`,
    type: 'fill',
    tier: 'tier1',
    prompt: sentence,
    answer: set.answers[index],
    acceptableAnswers: set.answers[index],
    wordBank: set.bank,
    fillGroup: `${examId}-fill-${setIndex + 1}`,
    fillGroupTitle: `选词填空 · Bộ ${setIndex + 1} (mỗi từ dùng đúng một lần)`,
    explanation: `Đáp án: ${set.answers[index]}`
  } as Question)));

  // Meaning matching: worksheet set (part + 1) plus a third of set 4, options reshuffled.
  const pairs = [...VOCAB_MEANING[part].items.map((item, index) => ({ set: VOCAB_MEANING[part], item, index })),
    ...third(VOCAB_MEANING[3].items.map((item, index) => ({ set: VOCAB_MEANING[3], item, index })), part)]
    .map(({ set, item: [word, pinyin], index }) => ({ word, pinyin, meaning: set.options[LETTERS.indexOf(set.answers[index])] }));
  const meaningOptions = seededShuffle(pairs.map((pair) => pair.meaning), 7919 * (part + 1));
  const lastLetter = LETTERS[meaningOptions.length - 1];
  const meaningGroup = {
    taskGroup: `${examId}-meaning`,
    taskGroupTitle: '连线 · Nối từ với nghĩa tiếng Việt',
    instruction: `Chọn nghĩa tiếng Việt đúng (A–${lastLetter}) cho từ.`
  };
  const meaningQuestions = pairs.map(({ word, pinyin, meaning }, index) => matchingItem(
    `${examId}-meaning-${pad(index + 1)}`, `${word}（${pinyin}）`, meaningOptions, meaningOptions.indexOf(meaning), `${word}：${meaning}`, meaningGroup
  ));

  // 词素 synonyms and 搭配: a third of the items each, against the full option list.
  const synonymGroup = {
    taskGroup: `${examId}-synonym`,
    taskGroupTitle: '词素练习 · Nối hai chữ đồng nghĩa',
    instruction: 'Mỗi chữ có một chữ đồng nghĩa; ghép lại thành từ trong bài. Có 2 chữ thừa.'
  };
  const synonymItems = third(SYNONYM.items.map((char, index) => ({ char, index })), part);
  const synonymOptions = shortOptionList(SYNONYM.options, SYNONYM.answers, synonymItems.map(({ index }) => index), 104729 * (part + 1));
  const synonymQuestions = synonymItems.map(({ char, index }, position) => {
    const partner = SYNONYM.options[LETTERS.indexOf(SYNONYM.answers[index])];
    return matchingItem(`${examId}-synonym-${pad(position + 1)}`, `${char} + ？`, synonymOptions, synonymOptions.indexOf(partner),
      `${char} + ${partner} → ${SYNONYM.words[index]}`, synonymGroup);
  });

  const collocationGroup = {
    taskGroup: `${examId}-collocation`,
    taskGroupTitle: '搭配连线 · Nối động từ với danh từ hay đi cùng',
    instruction: 'Chọn danh từ hay đi cùng động từ. Có 2 danh từ thừa.'
  };
  const collocationItems = third(COLLOCATION.items.map((verb, index) => ({ verb, index })), part);
  const collocationOptions = shortOptionList(COLLOCATION.options, COLLOCATION.answers, collocationItems.map(({ index }) => index), 15485863 * (part + 1));
  const collocationQuestions = collocationItems.map(({ verb, index }, position) => {
    const noun = COLLOCATION.options[LETTERS.indexOf(COLLOCATION.answers[index])];
    return matchingItem(`${examId}-collocation-${pad(position + 1)}`, `${verb} + ？`, collocationOptions, collocationOptions.indexOf(noun),
      `${verb}${noun}`, collocationGroup);
  });

  const nearSynonymQuestions: Question[] = third(NEAR_SYNONYMS, part).map(([prompt, options, answer], index) => ({
    id: `${examId}-near-${pad(index + 1)}`,
    type: 'mc',
    tier: 'tier2',
    prompt,
    options,
    answer: answer === 'A' ? 0 : 1,
    explanation: `Đáp án: ${options[answer === 'A' ? 0 : 1]}`,
    taskGroup: `${examId}-near`,
    taskGroupTitle: '近义词辨析 · Phân biệt từ gần nghĩa',
    instruction: 'Chọn từ phù hợp nhất cho chỗ trống.'
  }));

  const translationQuestions: Question[] = third(TRANSLATION, part).map(([prompt, words, answer], index) => ({
    id: `${examId}-translate-${index + 1}`,
    type: 'translation',
    translationType: 'vi_to_zh_text',
    tier: 'tier3',
    prompt: `${prompt} (dùng ${words})`,
    suggestedAnswer: answer,
    referenceAnswers: [answer],
    requiredElements: [`Dùng ${words}`],
    teacherReviewRequired: true,
    explanation: 'Chấp nhận bản dịch tương đương nếu đúng nghĩa, ngữ pháp và dùng đúng từ cho sẵn.',
    maxScore: 10
  }));

  const essayQuestions: Question[] = part !== 2 ? [] : [{
    id: `${examId}-essay`,
    type: 'essay',
    tier: 'tier3',
    prompt: `Viết đoạn văn 80–100 chữ: ${ESSAY.title}. Dùng ít nhất 5 từ/cấu trúc sau: ${ESSAY.words.join('、')}`,
    suggestedAnswer: ESSAY.sample,
    referenceAnswers: [`Bài mẫu: ${ESSAY.sample}`],
    requiredElements: ['80–100 chữ', 'Dùng ít nhất 5 từ cho sẵn'],
    teacherReviewRequired: true,
    explanation: 'Chấm theo nội dung, số từ cho sẵn dùng đúng, ngữ pháp và chữ Hán.',
    maxScore: 10,
    taskGroup: `${examId}-essay`,
    taskGroupTitle: '翻译与写作 · Viết đoạn văn (giáo viên chấm)'
  }];

  return {
    id: examId,
    title: `HSK 6 · Đề ${part + 1} · Luyện tập củng cố từ vựng 词语练习`,
    level: 'HSK 6',
    description: '',
    instruction: 'Làm lần lượt các phần. Phần dịch và viết đoạn văn do giáo viên chấm.',
    ...emptyLesson,
    mcQuestions: [...meaningQuestions, ...synonymQuestions, ...nearSynonymQuestions, ...collocationQuestions],
    fillQuestions,
    translationQuestions,
    essayQuestions
  };
};

export const HSK6_DE1_TU_VUNG_EXAMS: ExamLesson[] = PARTS.map(vocabTest);
