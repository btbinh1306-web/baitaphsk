import { ExamLesson, Question, VocabItem } from '../types';

const vocab = (hanzi: string, pinyin: string, meaning: string, type = 'Từ vựng'): VocabItem => ({
  hanzi,
  pinyin,
  meaning,
  type
});

const fill = (
  id: string,
  prompt: string,
  answer: string,
  fillGroup: string,
  fillGroupTitle: string,
  wordBank: string[]
): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  acceptableAnswers: answer,
  suggestedAnswer: answer,
  fillGroup,
  fillGroupTitle,
  wordBank
});

const arrange = (id: string, prompt: string, wordChips: string[], answer: string, alternatives?: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips,
  acceptableAnswers: alternatives ? `${answer}|${alternatives}` : answer
});

const errorCorrection = (id: string, sentence: string, correctedAnswer: string): Question => ({
  id,
  type: 'error_correction',
  tier: 'tier3',
  prompt: sentence,
  suggestedAnswer: correctedAnswer,
  errorCorrection: { sentenceIsCorrect: false },
  maxScore: 10
});

const essay = (id: string, prompt: string, suggestedAnswer?: string): Question => ({
  id,
  type: 'essay',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  maxScore: 10
});

const translation = (id: string, prompt: string, suggestedAnswer: string): Question => ({
  id,
  type: 'translation',
  translationType: 'vi_to_zh_text',
  tier: 'tier3',
  prompt,
  suggestedAnswer,
  teacherReviewRequired: true,
  maxScore: 10
});

const part1WordBank = ['以为', '长', '接', '丢', '重要', '着急', '发现', '带', '帮助', '好像'];
const part3WordBank = ['哪儿', '什么', '谁', '哪'];
const serialVerbWordBank = ['坐', '用', '拿着', '去'];
const existentialWordBank = ['着', '了'];

export const HSK3_BAI1_AIRPORT_EXAM: ExamLesson = {
  id: 'hsk3-bai1-we-go-airport',
  title: 'HSK 3 - Bài 1: 我们去机场接你们',
  level: 'HSK 3',
  description: 'Phiếu bài tập về nhà HSK 3 Bài 1: từ mới, đại từ nghi vấn dùng phi nghi vấn, định ngữ đa tầng, 连动句 và 存现句.',
  instruction: 'Làm bài theo từng phần. Với câu tự luận, giáo viên chấm riêng.',
  timeLimitEnabled: false,
  vocabList: [
    vocab('以为', 'yǐwéi', 'cho rằng, cứ tưởng', 'Động từ'),
    vocab('长', 'zhǎng', 'lớn lên', 'Động từ'),
    vocab('接', 'jiē', 'đón', 'Động từ'),
    vocab('丢', 'diū', 'làm mất, đánh mất', 'Động từ'),
    vocab('重要', 'zhòngyào', 'quan trọng', 'Tính từ'),
    vocab('着急', 'zháojí', 'lo lắng, sốt ruột', 'Tính từ'),
    vocab('发现', 'fāxiàn', 'phát hiện', 'Động từ'),
    vocab('带', 'dài', 'mang theo', 'Động từ'),
    vocab('帮助', 'bāngzhù', 'giúp đỡ', 'Động từ'),
    vocab('好像', 'hǎoxiàng', 'hình như, giống như', 'Động từ / Phó từ'),
    vocab('机场', 'jīchǎng', 'sân bay', 'Danh từ'),
    vocab('行李箱', 'xínglǐxiāng', 'va li', 'Danh từ'),
    vocab('护照', 'hùzhào', 'hộ chiếu', 'Danh từ'),
    vocab('服务台', 'fúwùtái', 'quầy phục vụ', 'Danh từ'),
    vocab('哪儿', 'nǎr', 'ở đâu, chỗ nào', 'Đại từ nghi vấn'),
    vocab('什么', 'shénme', 'cái gì', 'Đại từ nghi vấn'),
    vocab('谁', 'shéi', 'ai', 'Đại từ nghi vấn'),
    vocab('哪', 'nǎ', 'nào', 'Đại từ nghi vấn')
  ],
  mcQuestions: [],
  fillQuestions: [
    fill('hsk3_b1_fill_01', '明天我要去机场 ______ 朋友，你想一起去吗？', '接', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_02', '你们两个 ______ 得真像，是兄弟吗？', '长', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_03', '别 ______，护照一定在包里，我们再找找。', '着急', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_04', '我 ______ 今天不上课，所以没带书。', '以为', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_05', '我的钱包 ______ 了，我现在没有钱坐车。', '丢', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_06', '到宾馆以后，我 ______ 手机不见了。', '发现', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_07', '老师 ______ 我们去参观学校。', '带', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_08', '谢谢你 ______ 我找到了行李箱。', '帮助', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_09', '这件事很 ______，一定要告诉经理。', '重要', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),
    fill('hsk3_b1_fill_10', '我 ______ 在哪儿见过他，但是想不起来他的名字。', '好像', 'hsk3-b1-part1', 'Phần I · Từ mới', part1WordBank),

    fill('hsk3_b1_fill_11', '周末我想去 ______ 玩儿玩儿，你有什么建议吗？', '哪儿', 'hsk3-b1-part3', 'Phần III · Đại từ nghi vấn dùng phi nghi vấn', part3WordBank),
    fill('hsk3_b1_fill_12', '我有点儿饿，想吃点儿 ______。', '什么', 'hsk3-b1-part3', 'Phần III · Đại từ nghi vấn dùng phi nghi vấn', part3WordBank),
    fill('hsk3_b1_fill_13', '这个问题太难了，我们找 ______ 问问吧。', '谁', 'hsk3-b1-part3', 'Phần III · Đại từ nghi vấn dùng phi nghi vấn', part3WordBank),
    fill('hsk3_b1_fill_14', '我们 ______ 天一起去爬山吧。', '哪', 'hsk3-b1-part3', 'Phần III · Đại từ nghi vấn dùng phi nghi vấn', part3WordBank),

    fill('hsk3_b1_fill_15', '我每天 ______ 公共汽车上班。', '坐', 'hsk3-b1-part5', 'Phần V · 连动句 · Điền từ', serialVerbWordBank),
    fill('hsk3_b1_fill_16', '他 ______ 手机给妈妈打电话。', '用', 'hsk3-b1-part5', 'Phần V · 连动句 · Điền từ', serialVerbWordBank),
    fill('hsk3_b1_fill_17', '老师 ______ 书走进教室。', '拿着', 'hsk3-b1-part5', 'Phần V · 连动句 · Điền từ', serialVerbWordBank),
    fill('hsk3_b1_fill_18', '明天我们 ______ 公园玩儿吧。', '去', 'hsk3-b1-part5', 'Phần V · 连动句 · Điền từ', serialVerbWordBank),

    fill('hsk3_b1_fill_19', '墙上挂 ______ 一张中国地图。', '着', 'hsk3-b1-part6', 'Phần VI · 存现句 · 着 / 了', existentialWordBank),
    fill('hsk3_b1_fill_20', '昨天我们公司来 ______ 一位新同事。', '了', 'hsk3-b1-part6', 'Phần VI · 存现句 · 着 / 了', existentialWordBank),
    fill('hsk3_b1_fill_21', '门口站 ______ 很多人。', '着', 'hsk3-b1-part6', 'Phần VI · 存现句 · 着 / 了', existentialWordBank),
    fill('hsk3_b1_fill_22', '我们班走 ______ 三个同学。', '了', 'hsk3-b1-part6', 'Phần VI · 存现句 · 着 / 了', existentialWordBank),
    fill('hsk3_b1_fill_23', '桌子上放 ______ 一个黑色的箱子，是你的吗？', '着', 'hsk3-b1-part6', 'Phần VI · 存现句 · 着 / 了', existentialWordBank)
  ],
  arrangeQuestions: [
    arrange('hsk3_b1_arr_01', 'Phần IV · Sắp xếp định ngữ đa tầng', ['那个', '站在门口的', '高个子的', '年轻人', '是我哥哥', '。'], '那个站在门口的高个子的年轻人是我哥哥。'),
    arrange('hsk3_b1_arr_02', 'Phần IV · Sắp xếp định ngữ đa tầng', ['昨天新买的', '找不到了', '那件', '我', '白色的', '衣服', '。'], '我找不到了昨天新买的那件白色的衣服。', '我找不到昨天新买的那件白色的衣服了。'),
    arrange('hsk3_b1_arr_03', 'Phần IV · Sắp xếp định ngữ đa tầng', ['在机场', '拿着黑色行李箱的', '人', '那个', '是我朋友', '。'], '那个在机场拿着黑色行李箱的人是我朋友。'),

    arrange('hsk3_b1_arr_04', 'Phần V · Sắp xếp câu liên động', ['去', '他', '接', '机场', '朋友', '。'], '他去机场接朋友。'),
    arrange('hsk3_b1_arr_05', 'Phần V · Sắp xếp câu liên động', ['坐', '我们', '去', '地铁', '学校', '。'], '我们坐地铁去学校。'),
    arrange('hsk3_b1_arr_06', 'Phần V · Sắp xếp câu liên động', ['拿着', '去', '服务台', '护照', '问问', '她', '。'], '她拿着护照去服务台问问。'),
    arrange('hsk3_b1_arr_07', 'Phần V · Sắp xếp câu liên động', ['买', '去', '我', '水果', '超市', '想', '。'], '我想去超市买水果。'),

    arrange('hsk3_b1_arr_08', 'Phần VI · Sắp xếp câu tồn hiện', ['一个', '前面', '站着', '年轻人', '。'], '前面站着一个年轻人。'),
    arrange('hsk3_b1_arr_09', 'Phần VI · Sắp xếp câu tồn hiện', ['放着', '桌子上', '两本书', '一杯茶', '和', '。'], '桌子上放着两本书和一杯茶。'),
    arrange('hsk3_b1_arr_10', 'Phần VI · Sắp xếp câu tồn hiện', ['对面', '一辆出租车', '开来了', '。'], '对面开来了一辆出租车。'),
    arrange('hsk3_b1_arr_11', 'Phần VI · Sắp xếp câu tồn hiện', ['昨天', '两位', '来了', '我们学校', '老师', '。'], '昨天我们学校来了两位老师。')
  ],
  essayQuestions: [
    essay('hsk3_b1_essay_attr', 'Phần IV · Dùng định ngữ đa tầng để miêu tả một người bạn quen (1–2 câu).', '我有一个在中国认识的很热情的朋友。'),
    errorCorrection('hsk3_b1_error_serial_01', '我机场去接朋友。', '我去机场接朋友。'),
    errorCorrection('hsk3_b1_error_serial_02', '他看电影去电影院。', '他去电影院看电影。'),
    errorCorrection('hsk3_b1_error_serial_03', '他没坐飞机去了北京。', '他没坐飞机去北京。'),
    errorCorrection('hsk3_b1_error_exist_01', '墙上着挂一张地图。', '墙上挂着一张地图。'),
    errorCorrection('hsk3_b1_error_exist_02', '我们班来着一位新同学。', '我们班来了一位新同学。'),
    errorCorrection('hsk3_b1_error_exist_03', '一个人前面站着。', '前面站着一个人。'),
    essay('hsk3_b1_essay_writing', 'Phần VII · Viết đoạn văn ngắn 60–80 chữ: 我去……旅游。Yêu cầu dùng ít nhất 1 câu 连动句, 1 câu 存现句 và 3 từ mới Bài 1.', '上个月我去北京旅游。我坐飞机到北京，下了飞机就去机场接朋友。机场里有很多人，前面站着一位导游。我们带着行李箱去酒店，发现房间很干净。第二天我们去公园和博物馆玩儿，觉得这次旅行很有意思。')
  ],
  speakingQuestions: [],
  translationQuestions: [
    translation('hsk3_b1_translation_01', 'Phần V · Dịch sang tiếng Trung: Ngày mai tôi đi sân bay đón bạn.', '明天我去机场接朋友。'),
    translation('hsk3_b1_translation_02', 'Phần V · Dịch sang tiếng Trung: Cô ấy cầm hộ chiếu đến quầy phục vụ hỏi.', '她拿着护照去服务台问问。'),
    translation('hsk3_b1_translation_03', 'Phần V · Dịch sang tiếng Trung: Chúng tôi đi taxi đến công ty.', '我们坐出租车去公司。')
  ],
  handwritingQuestions: []
};
