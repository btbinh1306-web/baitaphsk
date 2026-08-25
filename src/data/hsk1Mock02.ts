import rawLessonData from '../../data/hsk1-mock-02.json';
import { ExamLesson, Question } from '../types';
import { LessonData } from '../types/lesson';
import { parseLessonToExam } from '../utils/lessonParser';

const makeOpenQuestion = (
  question: Pick<Question, 'id' | 'type' | 'prompt'> & Partial<Question>
): Question => ({
  tier: 'tier3',
  teacherReviewRequired: true,
  uploadFormats: ['mp3', 'wav', 'm4a', 'webm'],
  ...question
});

const readingAloudQuestions: Question[] = [
  ['RA01', '同学们大家好。', 'Tóng xuémen dàjiā hǎo。', [1], ['Chào các bạn học sinh.'], ['同学们', '大家好'], 1],
  ['RA02', '你叫什么名字？我叫李文。', 'Nǐ jiào shénme míngzi? Wǒ jiào Lǐ Wén.', [2], ['Hỏi tên và trả lời tên bằng 叫'], ['什么', '叫'], 2],
  ['RA03', '我是越南人，也是学生。', 'Wǒ shì Yuènán rén, yě shì xuésheng.', [3], ['Nói quốc tịch', 'Nói thân phận', 'Dùng 也'], ['是', '越南人', '也'], 2],
  ['RA04', '我家有四口人：爸爸、妈妈、妹妹和我。', 'Wǒ jiā yǒu sì kǒu rén: bàba, māma, mèimei hé wǒ.', [4], ['Nói số người trong gia đình', 'Dùng 口', 'Nêu thành viên gia đình'], ['有', '四口人', '和'], 2],
  ['RA05', '今天下午两点半我在学校上课。', 'Jīntiān xiàwǔ liǎng diǎn bàn wǒ zài xuéxiào shàngkè.', [5, 7], ['Ngày và buổi trong ngày', 'Thời gian cụ thể', 'Địa điểm + hoạt động'], ['今天下午', '两点半', '在学校', '上课'], 3],
  ['RA06', '妈妈去超市买了一些水果。', 'Māma qù chāoshì mǎi le yìxiē shuǐguǒ.', [6, 10, 14], ['Câu liên động chỉ mục đích', '了 sau động từ', 'Lượng từ 些'], ['去超市', '买了', '一些水果'], 3],
  ['RA07', '小猫在桌子下面，小狗在椅子旁边。', 'Xiǎomāo zài zhuōzi xiàmiàn, xiǎogǒu zài yǐzi pángbiān.', [8, 9], ['Hai vị trí'], ['小猫', '桌子下面', '小狗', '椅子旁边'], 2],
  ['RA08', '我喜欢喝中国茶，还喜欢看中国电影。', 'Wǒ xǐhuan hē Zhōngguó chá, hái xǐhuan kàn Zhōngguó diànyǐng.', [6, 7, 15], ['Hai sở thích', 'Dùng 还'], ['喜欢喝茶', '还喜欢看电影'], 2],
  ['RA09', '下雨了，我不能去上班，要在家休息。', 'Xiàyǔ le, wǒ bùnéng qù shàngbān, yào zài jiā xiūxi.', [12, 11], ['Trạng thái mới với 了', '不能', '要 + động từ'], ['下雨了', '不能去上班', '要在家休息'], 3],
  ['RA10', '明天早上我要坐出租车去机场接朋友。', 'Míngtiān zǎoshang wǒ yào zuò chūzūchē qù jīchǎng jiē péngyou.', [6, 11, 15], ['Thời gian', 'Phương tiện', 'Câu liên động mục đích'], ['明天早上', '坐出租车', '去机场', '接朋友'], 3]
].map(([id, prompt, pinyin, sourceLessons, requiredElements, knowledgeTargets, combinedKnowledgePoints]) => makeOpenQuestion({
  id: String(id),
  type: 'speaking_record',
  taskGroup: 'reading_aloud',
  taskGroupTitle: '03 朗读 · Đọc thành tiếng',
  prompt: String(prompt),
  pinyin: String(pinyin),
  sourceLessons: sourceLessons as number[],
  requiredElements: requiredElements as string[],
  knowledgeTargets: knowledgeTargets as string[],
  combinedKnowledgePoints: Number(combinedKnowledgePoints),
  difficulty: Number(combinedKnowledgePoints) >= 3 ? 'advanced' : 'intermediate',
  hidePinyinByDefault: true,
  responseSeconds: 30
}));

const writtenTranslationSpecs: Array<[
  string, string, string, number[], string[], string[], string,
  'basic' | 'intermediate' | 'advanced', number
]> = [
  ['WT01', 'Tôi tên là Lý Minh, tôi là người Việt Nam.', '我叫李明，我是越南人。', [2, 3], ['我叫李明。', '我是越南人。'], ['叫', '是', '越南人'], '我叫李明，我是越南人。|我叫李明。我是越南人。', 'basic', 2],
  ['WT02', 'Ngày mai 9 giờ tôi đến trường học tiếng Trung.', '明天九点我到学校学汉语。', [5, 6, 7, 8], ['明天九点', '到学校', '学汉语'], ['明天', '时间', '到', '学校', '学'], '明天上午九点我到学校学习中文。|明天九点我去学校学汉语。', 'intermediate', 3],
  ['WT03', 'Nhà tôi có bốn người: bố, mẹ, em gái và tôi.', '我家有四口人：爸爸、妈妈、妹妹和我。', [4], ['我家有四口人', 'Các thành viên gia đình'], ['有', '四口人', '家庭成员', '和'], '我家有四口人：爸爸、妈妈、妹妹和我。', 'basic', 2],
  ['WT04', 'Chiều 2 giờ rưỡi tôi có tiết học.', '我下午两点半有课。', [7], ['下午两点半', '有课'], ['buổi trong ngày', '点半', '有课'], '下午两点半我有课。', 'basic', 2],
  ['WT05', 'Tôi muốn đi siêu thị mua một ít hoa quả.', '我想去超市买一些水果。', [6, 10], ['想去超市', '买一些水果'], ['想', '去', '超市', '一些', '买'], '我想去超市买些水果。|我想去超市买一点儿水果。', 'intermediate', 3],
  ['WT06', 'Mẹ tôi đang ở nhà nấu cơm.', '我妈妈正在家里做饭。', [3, 6, 11], ['我妈妈', '正在做饭', '家里'], ['định ngữ sở hữu', '正在', '在', '做饭'], '我妈妈在家里做饭。|我妈妈正在家做饭。', 'intermediate', 3],
  ['WT07', 'Con mèo nhỏ ở dưới bàn, con chó ở bên cạnh ghế.', '小猫在桌子下面，小狗在椅子旁边。', [8, 9], ['小猫 + 桌子下面', '小狗 + 椅子旁边'], ['在', '下面', '旁边', '只'], '小猫在桌子下，小狗在椅子旁边。', 'intermediate', 2],
  ['WT08', 'Tôi thích uống trà, còn thích ăn món Trung Quốc.', '我喜欢喝茶，还喜欢吃中国菜。', [5, 6, 15], ['喜欢喝茶', '还喜欢吃中国菜'], ['喜欢', '喝茶', '还', '中国菜'], '我喜欢喝中国茶，还喜欢吃中国菜。', 'intermediate', 2],
  ['WT09', 'Hôm qua tôi đã mua một quyển sách 40 tệ ở cửa hàng.', '昨天我在商店买了一本书，四十块钱。', [5, 9, 10, 14], ['昨天', '在商店', '买了一本书', 'Giá 40'], ['昨天', '在', '了', '本', '块钱'], '昨天我在商店买了一本书，花了四十块钱。|昨天我买了一本四十块钱的书。', 'advanced', 4],
  ['WT10', 'Trời mưa rồi, tôi không thể đi làm, phải uống thuốc.', '下雨了，我不能上班，要吃药。', [11, 12], ['下雨了', '不能上班', '要吃药'], ['了', '不能', '上班', '要', '吃药'], '下雨了，我不能去上班，要吃药。', 'advanced', 3],
  ['WT11', 'Xin hãy cho tôi một cốc sữa và tôi muốn hỏi giáo viên một câu hỏi.', '请给我一杯牛奶，我想问老师一个问题。', [2, 6, 13], ['请给我一杯牛奶', '问老师一个问题'], ['请', '给', '双宾语', '问', '问题'], '请给我一杯牛奶，我想问老师一个问题。', 'advanced', 3],
  ['WT12', 'Tôi học ở trường, buổi tối 6 giờ rưỡi tôi tan học.', '我在学校学习，晚上六点半下课。', [6, 7, 9], ['在学校学习', '晚上六点半下课'], ['在', '学习', '晚上', '点半', '下课'], '我在学校学中文，晚上六点半下课。', 'advanced', 3],
  ['WT13', 'Chủ nhật tôi muốn cùng gia đình ra ngoài chơi.', '星期天我想和家人到外边玩儿。', [9, 15], ['星期天', '和家人', '到/去外边玩'], ['星期天', '想', '和', '家人', '玩儿'], '星期日我想和家人出去玩儿。|星期天我想和家人到外面玩。', 'intermediate', 3],
  ['WT14', 'Sáng mai tôi đến sân bay đón bạn, sau đó cùng bạn về nhà.', '明天早上我到机场接朋友，再和他回家。', [12, 13, 15], ['明天早上', '到机场接朋友', '再回家'], ['时间', '机场', '接', '再', '回家'], '明天早上我去机场接朋友，然后和他回家。', 'advanced', 3]
];

const writtenTranslationQuestions = writtenTranslationSpecs.map(([id, prompt, answer, sourceLessons, requiredElements, knowledgeTargets, acceptedVariants, difficulty, combinedKnowledgePoints]) => makeOpenQuestion({
  id,
  type: 'translation',
  taskGroup: 'written_translation',
  taskGroupTitle: '04 笔译 · Dịch viết Việt → Trung',
  translationType: 'vi_to_zh_text',
  prompt,
  sourceLessons,
  requiredElements,
  knowledgeTargets,
  combinedKnowledgePoints,
  difficulty,
  referenceAnswers: [answer],
  suggestedAnswer: answer,
  acceptedVariants: acceptedVariants.split('|'),
  acceptedPatterns: acceptedVariants.split('|'),
  responseSeconds: 120
}));

const oralTranslationSpecs: Array<[string, string, string, number[], string[], string[], string[], 'intermediate' | 'advanced', number]> = [
  ['OT01', 'Bạn tên là gì? Hãy nói câu hỏi bằng tiếng Trung.', '你叫什么名字？', [2], ['你叫什么名字？'], ['什么', '叫'], ['你叫什么？'], 'intermediate', 2],
  ['OT02', 'Bạn là người nước nào?', '你是哪国人？', [3], ['你是哪国人？'], ['哪', '国人'], ['你是哪个国家的人？'], 'intermediate', 2],
  ['OT03', 'Nhà bạn có mấy người?', '你家有几口人？', [4], ['你家有几口人？'], ['有', '几', '口人'], ['你家有多少口人？'], 'intermediate', 3],
  ['OT04', 'Bây giờ mấy giờ?', '现在几点？', [7], ['现在几点？'], ['现在', '点'], ['现在是几点？'], 'intermediate', 2],
  ['OT05', 'Chiều mai bạn có đi học không?', '明天下午你上课吗？', [5, 7], ['明天下午', '上课吗'], ['明天', '下午', '吗', '上课'], ['明天下午你有没有课？'], 'intermediate', 3],
  ['OT06', 'Tôi muốn đi siêu thị mua đồ.', '我想去超市买东西。', [6], ['想去超市买东西'], ['想', '去', '超市', '买东西'], ['我想去超市买一些东西。'], 'intermediate', 3],
  ['OT07', 'Tôi đang ở bệnh viện làm việc.', '我正在医院工作。', [3, 7, 11], ['正在医院工作'], ['正在', '医院', '工作'], ['我在医院工作呢。'], 'advanced', 3],
  ['OT08', 'Trời hơi lạnh, hãy uống thêm một chút nước nóng.', '天气有点儿冷，多喝点儿热水吧。', [12], ['有点儿冷', '喝点儿热水', '吧'], ['天气', '有点儿', '多', '点儿', '吧'], ['天有点儿冷，多喝一点儿热水吧。'], 'advanced', 4],
  ['OT09', 'Tôi ngồi taxi đến sân bay đón bạn.', '我坐出租车去机场接朋友。', [6, 11, 15], ['坐出租车', '去机场', '接朋友'], ['坐', '出租车', '机场', '接'], ['我坐出租车到机场接朋友。'], 'advanced', 3]
];

const oralTranslationQuestions = oralTranslationSpecs.map(([id, prompt, answer, sourceLessons, requiredElements, knowledgeTargets, acceptedVariants, difficulty, combinedKnowledgePoints]) => makeOpenQuestion({
  id,
  type: 'translation',
  taskGroup: 'oral_translation',
  taskGroupTitle: '05 口译 · Dịch nói Việt → Trung',
  translationType: 'vi_to_zh_audio',
  prompt,
  sourceLessons,
  requiredElements,
  knowledgeTargets,
  combinedKnowledgePoints,
  difficulty,
  referenceAnswers: [answer],
  suggestedAnswer: answer,
  acceptedVariants,
  acceptedPatterns: [answer, ...acceptedVariants],
  preparationSeconds: 4,
  responseSeconds: 20
}));

const selfIntroductionQuestion = makeOpenQuestion({
  id: 'SI01',
  type: 'speaking_record',
  taskGroup: 'self_introduction',
  taskGroupTitle: '06 自我介绍 · Giới thiệu bản thân',
  prompt: '请介绍一下你自己。',
  explanation: 'Nói 45–90 giây. Hãy giới thiệu tên, quốc tịch, thân phận, nơi học/làm, số người trong gia đình, sở thích và một hoạt động theo thời gian trong ngày.',
  sourceLessons: [1, 2, 3, 4, 5, 7, 9, 15],
  knowledgeTargets: ['叫', '是', '哪国人', '在', '有几口人', '喜欢', '时间'],
  combinedKnowledgePoints: 7,
  difficulty: 'advanced',
  requiredElements: ['Tên', 'Quốc tịch', 'Học sinh/giáo viên và nơi học/làm', 'Gia đình', 'Một sở thích', 'Một hoạt động kèm thời gian'],
  referenceAnswers: ['我叫……。我是越南人。我是学生，在……学习。我家有……口人。我喜欢……。我上午/下午……。'],
  acceptedVariants: ['Có thể dùng 我叫…… hoặc 我的名字叫……', 'Có thể nói 星期天/星期日', 'Có thể dùng 中文/汉语 nếu cấu trúc đúng'],
  rubric: [
    { id: 'content', label: 'Đủ ý và phát triển nội dung', maxScore: 2 },
    { id: 'vocabulary', label: 'Từ vựng phù hợp Bài 1–15', maxScore: 2 },
    { id: 'grammar', label: 'Cấu trúc và trật tự câu', maxScore: 2 },
    { id: 'pronunciation', label: 'Phát âm và thanh điệu', maxScore: 2 },
    { id: 'fluency', label: 'Độ trôi chảy và hoàn thành thời lượng', maxScore: 2 }
  ],
  responseSeconds: 90
});

const pictureQuestions: Question[] = [
  ['P01', 'Nhìn hình và nói một câu về vị trí của con mèo.', '/images/hsk1-mock-02/cat-under-table.png', '小猫在桌子下面。', [8], ['小猫', '桌子下面'], ['小猫在桌子下。', '小猫在桌子下面。'], ['在', '下面'], 2],
  ['P02', 'Nhìn hình và nói câu có thời gian và hoạt động.', '/images/hsk1-mock-02/clock-class.png', '她下午两点半上课。', [7], ['她', '下午两点半', '上课'], ['下午两点半她上课。', '她下午两点半有课。'], ['时间状语', '上课'], 2],
  ['P03', 'Nhìn hình và nói cô ấy đang làm gì ở đâu.', '/images/hsk1-mock-02/supermarket-apples.png', '她在超市买苹果。', [6, 10], ['她', '在超市', '买苹果'], ['她在超市买水果。', '她去超市买苹果。'], ['在', '超市', '买'], 3],
  ['P04', 'Nhìn hình và nói câu về phương tiện và đích đến.', '/images/hsk1-mock-02/taxi-airport.png', '他坐出租车去机场。', [6, 15], ['他', '坐出租车', '去机场'], ['他坐出租车到机场。'], ['坐', '出租车', '去/到'], 3],
  ['P05', 'Nhìn hình và nói câu về số lượng.', '/images/hsk1-mock-02/three-cups-table.png', '桌子上有三个杯子。', [3, 10], ['桌子上', '有', '三个杯子'], ['桌子上有三杯水。'], ['存在句', '三个', '杯子'], 2],
  ['P06', 'Nhìn hình và nói câu về mua bán.', '/images/hsk1-mock-02/buy-apples.png', '她在买苹果。', [6, 10], ['她', '在买', '苹果'], ['她买了苹果。', '她在水果店买苹果。'], ['在', '买', '苹果'], 2],
  ['P07', 'Nhìn hình và nói câu về gia đình.', '/images/hsk1-mock-02/family-four.png', '我家有四口人。', [4], ['我家', '有', '四口人'], ['我家有四个人。'], ['有', '四口人/四个人'], 2],
  ['P08', 'Nhìn hình và nói câu về sở thích.', '/images/hsk1-mock-02/movie-preference.png', '她喜欢看电影。', [7, 15], ['她', '喜欢', '看电影'], ['她喜欢看中国电影。'], ['喜欢', '看电影'], 2],
  ['P09', 'Nhìn hình và nói hai sở thích trong một câu.', '/images/hsk1-mock-02/tea-music-preference.png', '我喜欢喝茶，还喜欢听歌。', [9, 15], ['喜欢喝茶', '还喜欢听歌'], ['我喜欢喝中国茶，也喜欢听歌。'], ['喜欢', '还/也'], 3],
  ['P10', 'Nhìn hình và nói 1–2 câu có thời gian, tan làm và taxi.', '/images/hsk1-mock-02/leave-work-taxi.png', '晚上六点半他下班了。他坐出租车回家。', [7, 11, 14], ['晚上六点半', '下班', '坐出租车', '回家'], ['晚上六点半他下班。然后他坐出租车回家。', '他六点半下班，坐出租车回家。'], ['time', '了/hoàn thành', '坐出租车', '回家'], 4]
].map(([id, prompt, imageUrl, referenceAnswer, sourceLessons, requiredElements, acceptedVariants, knowledgeTargets, combinedKnowledgePoints]) => makeOpenQuestion({
  id: String(id),
  type: 'speaking_record',
  taskGroup: 'picture_speaking',
  taskGroupTitle: '07 看图说话 · Nhìn hình nói',
  prompt: String(prompt),
  imageUrl: String(imageUrl),
  referenceAnswers: [String(referenceAnswer)],
  requiredElements: requiredElements as string[],
  acceptedVariants: acceptedVariants as string[],
  acceptedPatterns: [String(referenceAnswer), ...(acceptedVariants as string[])],
  knowledgeTargets: knowledgeTargets as string[],
  sourceLessons: sourceLessons as number[],
  combinedKnowledgePoints: Number(combinedKnowledgePoints),
  difficulty: Number(combinedKnowledgePoints) >= 4 ? 'advanced' : 'intermediate',
  responseSeconds: 45
}));

const baseExam = parseLessonToExam(rawLessonData as LessonData);

export const HSK1_MOCK_02_EXAM: ExamLesson = {
  ...baseExam,
  id: 'hsk1-mock-02',
  title: 'Đề tổng hợp 1-15',
  description: 'Đề HSK1 tổng hợp Bài 1–15: 20 câu nghe, 20 câu đọc và các phần đọc thành tiếng, dịch viết, dịch nói, giới thiệu bản thân, nhìn hình nói. Phần sản sinh ngôn ngữ do giáo viên chấm theo tiêu chí, không chấm exact string.',
  timeLimitEnabled: true,
  timeLimitMinutes: 45,
  speakingQuestions: [...readingAloudQuestions, selfIntroductionQuestion, ...pictureQuestions],
  translationQuestions: [...writtenTranslationQuestions, ...oralTranslationQuestions]
};
