import { ExamLesson, Question, ReadingPassage, VocabItem } from '../types';

const mc = (id: string, prompt: string, options: string[], answer: number): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer
});

const fill = (id: string, prompt: string, answer: string, wordBank: string[]): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt,
  wordBank,
  answer,
  acceptableAnswers: answer
});

const arrange = (id: string, prompt: string, wordChips: string[], answer: string): Question => ({
  id,
  type: 'arrange',
  tier: 'tier2',
  prompt,
  wordChips,
  acceptableAnswers: answer
});

const listening = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  audioText: string
): Question => ({
  id,
  type: 'listening_mc',
  tier: 'tier2',
  prompt,
  options,
  answer,
  audioText,
  explanation: `Kịch bản nghe: ${audioText}`
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

const vocab = (items: Array<[string, string, string, string, string]>): VocabItem[] =>
  items.map(([hanzi, pinyin, type, meaning, example]) => ({ hanzi, pinyin, type, meaning, example }));

const wordBank1 = ['吧', '给', '让', '接', '次', '那'];
const wordBank2 = ['帮忙', '旅游', '已经', '不好意思', '意思', '懂', '介绍', '有时'];

const vocabList = vocab([
  ['就', 'jiù', 'Phó từ', 'thì, liền, chỉ có', '吃完饭我就去图书馆看书。'],
  ['给', 'gěi', 'Động từ / giới từ', 'cho; với', '我给你介绍我的朋友。'],
  ['让', 'ràng', 'Động từ', 'cho phép; bảo; nhường', '让姐姐接你们。'],
  ['接', 'jiē', 'Động từ', 'đón', '我去机场接朋友。'],
  ['吧', 'ba', 'Trợ từ', 'nhé; vậy sao', '王老师没有在家吧？'],
  ['次', 'cì', 'Lượng từ', 'lần', '这是我第一次来北京。'],
  ['旅游', 'lǚyóu', 'Động từ', 'du lịch', '我们来北京旅游。'],
  ['帮忙', 'bāngmáng', 'Động từ ly hợp', 'giúp đỡ', '请你帮我一个忙。'],
  ['不好意思', 'bù hǎo yìsi', 'Cụm từ', 'thật ngại; xin lỗi', '不好意思，我已经到了。'],
  ['已经', 'yǐjīng', 'Phó từ', 'đã', '我已经买好车票了。'],
  ['那', 'nà', 'Liên từ', 'vậy thì', '那我们明天去找老师。'],
  ['介绍', 'jièshào', 'Động từ', 'giới thiệu', '我给你介绍我的朋友。'],
  ['有时', 'yǒushí', 'Phó từ', 'có lúc', '有时我不懂她的意思。'],
  ['懂', 'dǒng', 'Động từ', 'hiểu', '我不太懂她的意思。'],
  ['意思', 'yìsi', 'Danh từ', 'ý nghĩa; ý', '我不懂她的意思。'],
  ['北京烤鸭', 'Běijīng kǎoyā', 'Danh từ', 'vịt quay Bắc Kinh', '我们吃北京烤鸭吧。']
]);

const mcQuestions = [
  mc('hsk2_b1_word_mc_01', '“就” trong câu “吃完饭我就去图书馆” có nghĩa gần nhất là:', ['thì / liền', 'đã', 'cũng', 'vẫn'], 0),
  mc('hsk2_b1_word_mc_02', '“你们是她的学生吧？” dùng “吧” để:', ['hỏi xác nhận nhẹ nhàng', 'nói quá khứ', 'hỏi số lần', 'nói nguyên nhân'], 0),
  mc('hsk2_b1_word_mc_03', 'Câu nào dùng “已经” đúng?', ['我已经买好车票了。', '我买已经车票。', '已经我车票买。', '我车票已经。'], 0),
  mc('hsk2_b1_word_mc_04', '“让” trong “让姐姐接你们” có nghĩa là:', ['bảo / để cho', 'giới thiệu', 'hiểu', 'du lịch'], 0)
];

const fillQuestions = [
  fill('hsk2_b1_word_fill_01', '一飞打电话____我。', '给', wordBank1),
  fill('hsk2_b1_word_fill_02', '____我来接你们。', '让', wordBank1),
  fill('hsk2_b1_word_fill_03', '让我们来____你们。', '接', wordBank1),
  fill('hsk2_b1_word_fill_04', '你们是她的学生____？', '吧', wordBank1),
  fill('hsk2_b1_word_fill_05', '这是我第三____来北京。', '次', wordBank1),
  fill('hsk2_b1_word_fill_06', '____我们明天去找老师。', '那', wordBank1),
  fill('hsk2_b1_word_fill_07', '假期我打算去北京____。', '旅游', wordBank2),
  fill('hsk2_b1_word_fill_08', '明天我想请你____个忙。', '帮忙', wordBank2),
  fill('hsk2_b1_word_fill_09', '____，我已经到北京了。', '不好意思', wordBank2),
  fill('hsk2_b1_word_fill_10', '我____买好车票了。', '已经', wordBank2),
  fill('hsk2_b1_word_fill_11', '____我给你介绍我的好朋友。', '有时', wordBank2),
  fill('hsk2_b1_word_fill_12', '我有时给你____我的好朋友。', '介绍', wordBank2),
  fill('hsk2_b1_word_fill_13', '我的中文不好，不太____她的意思。', '懂', wordBank2),
  fill('hsk2_b1_word_fill_14', '我不太懂她的____。', '意思', wordBank2)
];

const arrangeQuestions = [
  arrange('hsk2_b1_word_arrange_01', 'Sắp xếp thành câu hoàn chỉnh.', ['吧', '北京烤鸭', '我们', '吃'], '我们吃北京烤鸭吧。|我们吃北京烤鸭吧'),
  arrange('hsk2_b1_word_arrange_02', 'Sắp xếp thành câu hoàn chỉnh.', ['让', '姐姐', '我', '接', '你们'], '让我姐姐接你们。|让我姐姐接你们'),
  arrange('hsk2_b1_word_arrange_03', 'Sắp xếp thành câu hoàn chỉnh.', ['已经', '我们', '旅游', '来北京'], '我们已经来北京旅游。|我们已经来北京旅游'),
  arrange('hsk2_b1_word_arrange_04', 'Sắp xếp thành câu hoàn chỉnh.', ['有时', '我', '意思', '不懂', '她的'], '有时我不懂她的意思。|有时我不懂她的意思'),
  arrange('hsk2_b1_word_arrange_05', 'Sắp xếp thành câu hoàn chỉnh.', ['次', '第一次', '这是', '他', '来这儿'], '这是他第一次来这儿。|这是他第一次来这儿'),
  arrange('hsk2_b1_word_arrange_06', 'Sắp xếp thành câu hoàn chỉnh.', ['那', '打电话', '我', '他', '给'], '那我给他打电话。|那我给他打电话'),
  arrange('hsk2_b1_word_arrange_07', 'Sắp xếp thành câu hoàn chỉnh.', ['帮忙', '请你', '我', '个'], '请你帮我个忙。|请你帮我个忙'),
  arrange('hsk2_b1_word_arrange_08', 'Sắp xếp thành câu hoàn chỉnh.', ['介绍', '给你', '我', '朋友', '我的'], '我给你介绍我的朋友。|我给你介绍我的朋友')
];

const readingPassages: ReadingPassage[] = [{
  id: 'hsk2_b1_word_reading',
  title: 'Đọc hiểu: Lần đầu đến Bắc Kinh',
  content: '我和安妮第一次来北京旅游。出发前，王老师给她姐姐王一雪打了电话，让王一雪到机场接我们。见到王一雪，她笑着问：“你们就是王老师的学生吧？”我们点头。不好意思，我们的中文说得不好，有时听不懂当地人说话的意思。王一雪非常热情，一路上给我们介绍北京好玩的地方。这几天她一直陪着我们，昨天还请我们吃了地道的北京烤鸭。晚上，我接到朋友陈天中的电话，他想请我帮忙。我告诉他，我已经在北京了，没法过去。那我建议他去找李文，李文一定会帮他。这一次去北京旅游，我一定不会忘记。',
  questions: [
    mc('hsk2_b1_word_read_01', '我和安妮来北京做什么？', ['上学', '旅游', '工作'], 1),
    mc('hsk2_b1_word_read_02', '是谁让王一雪去机场接“我们”？', ['陈天中', '李文', '王老师'], 2),
    mc('hsk2_b1_word_read_03', '王一雪见到“我们”时说了哪句话？', ['你们就是王老师的学生吧？', '我们一起去吃北京烤鸭吧。', '那我给你介绍李文。'], 0),
    mc('hsk2_b1_word_read_04', '“我们”为什么听不懂别人说话？', ['说得太快', '中文不好', '声音太小'], 1),
    mc('hsk2_b1_word_read_05', '王一雪请“我们”吃了什么？', ['饺子', '北京烤鸭', '面条'], 1),
    mc('hsk2_b1_word_read_06', '陈天中打电话想让“我”做什么？', ['帮忙', '旅游', '介绍朋友'], 0),
    mc('hsk2_b1_word_read_07', '“我”为什么不能帮陈天中？', ['我已经回家了', '我已经在北京了', '我不懂他的意思'], 1),
    mc('hsk2_b1_word_read_09', '这是作者第几次来北京？', ['第一次', '第二次', '很多次'], 0),
    mc('hsk2_b1_word_read_10', '下面哪个词语没有出现在短文中？', ['帮忙', '森林', '介绍'], 1)
  ]
}];

const listeningQuestions = [
  listening('hsk2_b1_word_listen_01', 'Nghe và chọn ý đúng.', ['Thầy Vương gọi cho chị gái', 'Annie gọi cho thầy Vương', 'Lý Văn gọi cho Trần Thiên Trung'], 0, '出发前，王老师给她姐姐王一雪打了电话。'),
  listening('hsk2_b1_word_listen_02', 'Nghe và chọn hoạt động.', ['在机场接朋友', '去北京旅游', '介绍老师'], 1, '我和安妮第一次来北京旅游。'),
  listening('hsk2_b1_word_listen_03', 'Nghe và chọn món ăn.', ['饺子', '北京烤鸭', '面条'], 1, '王一雪请我们吃了地道的北京烤鸭。'),
  listening('hsk2_b1_word_listen_04', 'Nghe và chọn trạng thái.', ['已经在北京了', '已经回家了', '已经去机场了'], 0, '我已经在北京了，没法过去。'),
  listening('hsk2_b1_word_listen_05', 'Nghe và chọn lời đề nghị.', ['找李文帮忙', '去机场接朋友', '来北京旅游'], 0, '那我建议他去找李文，李文一定会帮他。')
];

const essayQuestions = [
  essay(
    'hsk2_b1_word_essay_01',
    'Dùng các từ 就，给，让，是……的，次 viết một đoạn văn khoảng 50 chữ bằng tiếng Trung.',
    '这是我第一次来北京旅游的。我给朋友打电话，让他来机场接我。吃完饭我就去找老师，还一起吃了北京烤鸭。'
  )
];

const speakingQuestions = [
  speaking('hsk2_b1_word_speak_01', 'Đọc và ghi âm: 王老师没有在家吧？', 'Wáng lǎoshī méiyǒu zài jiā ba?'),
  speaking('hsk2_b1_word_speak_02', 'Đọc và ghi âm: 我吃完饭就去图书馆看书。', 'Wǒ chī wán fàn jiù qù túshūguǎn kàn shū.'),
  speaking('hsk2_b1_word_speak_03', 'Đọc và ghi âm: 明天我去机场接朋友。', 'Míngtiān wǒ qù jīchǎng jiē péngyou.'),
  speaking('hsk2_b1_word_speak_04', 'Đọc và ghi âm: 这是第一次我来北京吃北京烤鸭的。', 'Zhè shì dì yī cì wǒ lái Běijīng chī Běijīng kǎoyā de.')
];

const translationQuestions = [
  translation('hsk2_b1_word_translate_01', 'Dịch sang tiếng Trung: Hôm qua tôi đi Bắc Kinh mua vịt quay, bạn đi cùng tôi không?', '昨天我去北京买北京烤鸭，你跟我一起去吗？'),
  translation('hsk2_b1_word_translate_02', 'Dịch sang tiếng Trung: Đây là bạn của tôi đấy, cô ấy đến từ Việt Nam.', '这是我的朋友，她来自越南。'),
  translation('hsk2_b1_word_translate_03', 'Dịch sang tiếng Trung: Tôi đã nói 3 lần rồi, anh nghe rõ chưa?', '我已经说了三次了，你听清楚了吗？'),
  translation('hsk2_b1_word_translate_04', 'Dịch sang tiếng Trung: Tôi vừa ăn cơm xong thì anh ta đến.', '我刚吃完饭，他就来了。')
];

export const HSK2_BAI1_WORD_EXAMS: ExamLesson[] = [{
  id: 'hsk2-bai1-word',
  title: 'HSK 2 - Bài 1: 她请我们吃了北京烤鸭',
  level: 'HSK 2',
  description: 'Bài tập lấy từ file Word HSK2 Bài 1: từ vựng, ngữ pháp, sắp xếp câu, đọc hiểu, nghe, viết, nói ghi âm và dịch.',
  instruction: 'Làm theo thứ tự: từ vựng – ngữ pháp – nghe – đọc – viết – nói – dịch. Phần nghe dùng TTS; phần nói yêu cầu ghi âm.',
  vocabList,
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  readingPassages,
  listeningQuestions,
  essayQuestions,
  speakingQuestions,
  translationQuestions
}];
