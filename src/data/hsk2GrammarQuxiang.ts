import { ExamLesson, Question } from '../types';
import { withPunctuationChips } from '../utils/arrangePunctuation';

// HSK2 grammar practice: 趋向补语 (directional complements).
// Formula: V + 上/下/进/出/回/过/起 (+ 来/去).

const IMAGE_DIR = '/images/hsk2-quxiang';
const image = (name: string) => `${IMAGE_DIR}/${name}.jpg`;

const CHOOSE_LAI_QU = {
  taskGroup: 'quxiang-lai-qu',
  taskGroupTitle: 'Chọn 来 hay 去',
  instruction: 'Chọn đáp án đúng theo vị trí người nói.'
};
const TRUE_FALSE = {
  taskGroup: 'quxiang-true-false',
  taskGroupTitle: 'Đúng hay sai?',
  instruction: 'Câu sau đúng hay sai?'
};
const PICTURE_CHOICE = {
  taskGroup: 'quxiang-picture-choice',
  taskGroupTitle: 'Xem hình chọn câu',
  instruction: 'Nhìn hình (ngôi sao vàng = vị trí người nói; mũi tên xanh = về phía ngôi sao, mũi tên đỏ = ra xa), chọn câu đúng.'
};
const ARRANGE = {
  taskGroup: 'quxiang-arrange',
  taskGroupTitle: 'Sắp xếp thành câu',
  instruction: 'Sắp xếp các từ thành câu đúng. Chú ý vị trí tân ngữ địa điểm.'
};
const PICTURE_ARRANGE = {
  taskGroup: 'quxiang-picture-arrange',
  taskGroupTitle: 'Xem hình sắp xếp câu',
  instruction: 'Nhìn hình, sắp xếp các từ thành câu mô tả hình.'
};

const LETTERS = 'ABCD';

const choice = (
  id: string,
  group: Partial<Question>,
  prompt: string,
  options: string[],
  answerLetter: string,
  explanation: string,
  imageName?: string
): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt,
  options,
  answer: LETTERS.indexOf(answerLetter),
  explanation,
  ...group,
  ...(imageName ? { imageUrl: image(imageName), imageAlt: 'Hình minh họa hướng di chuyển' } : {})
});

const trueFalse = (id: string, sentence: string, isCorrect: boolean, explanation: string): Question => ({
  id,
  type: 'mc',
  tier: 'tier1',
  prompt: sentence,
  options: ['Đúng', 'Sai'],
  answer: isCorrect ? 0 : 1,
  explanation,
  ...TRUE_FALSE
});

const blank = (id: string, prompt: string, hint: string, answers: string, explanation: string): Question => ({
  id,
  type: 'fill',
  tier: 'tier1',
  prompt: `${prompt}（${hint}）`,
  answer: answers.split('|')[0],
  acceptableAnswers: answers,
  wordBank: ['上', '下', '进', '出', '回', '过', '起来'],
  fillGroup: 'quxiang-fill',
  fillGroupTitle: 'Điền bổ ngữ xu hướng (Điền một từ chỉ hướng: 上、下、进、出、回、过、起来)',
  explanation
});

// Punctuation is ignored: the sentence counts with or without the final 。
const order = (
  id: string,
  group: Partial<Question>,
  chips: string[],
  answer: string,
  explanation: string,
  imageName?: string
): Question => {
  const arranged = withPunctuationChips(chips, answer);
  return {
    id,
    type: 'arrange',
    tier: 'tier2',
    prompt: 'Sắp xếp các từ thành câu hoàn chỉnh.',
    explanation,
    ...arranged,
    acceptableAnswers: `${arranged.acceptableAnswers}|${answer.replace(/[。！？]$/u, '')}`,
    ...group,
    ...(imageName ? { imageUrl: image(imageName), imageAlt: 'Hình minh họa hướng di chuyển' } : {})
  };
};

const mcQuestions: Question[] = [
  choice('quxiang-01', CHOOSE_LAI_QU, 'Cô giáo ở trong lớp, bạn đứng ngoài cửa. Cô nói: 请___。', ['进来', '进去'], 'A',
    'Người nói ở trong lớp; người nghe đi về phía người nói nên dùng 来.'),
  choice('quxiang-02', CHOOSE_LAI_QU, 'Tôi ở tầng 3, bạn ở tầng 1. Tôi nói: 你快上___吧！', ['来', '去'], 'A',
    'Bạn đi về phía tôi (tầng 3) nên dùng 来.'),
  choice('quxiang-03', CHOOSE_LAI_QU, 'Tôi ở tầng 1, bạn ở tầng 3. Tôi nói: 我现在上___。', ['来', '去'], 'B',
    'Tôi đi ra xa chỗ tôi đang đứng nên dùng 去.'),
  choice('quxiang-04', CHOOSE_LAI_QU, 'Con chơi ngoài sân, mẹ ở nhà gọi: 快回___吃饭！', ['来', '去'], 'A',
    'Mẹ đang ở nhà; con về phía mẹ nên dùng 来.'),
  choice('quxiang-05', CHOOSE_LAI_QU, 'Tôi đứng dưới tầng, thấy anh Lý từ cầu thang đi xuống: 他走下___了。', ['来', '去'], 'A',
    'Anh Lý đi về phía tôi (dưới tầng) nên dùng 来.'),
  choice('quxiang-06', CHOOSE_LAI_QU, 'Cả lớp đang ngồi, cô giáo nói: 请大家站___。', ['起来', '下来'], 'A',
    '站起来 = đứng dậy.'),
  choice('quxiang-07', CHOOSE_LAI_QU, 'Tôi gọi điện từ công ty: 我下班就回___。(về nhà)', ['来', '去'], 'B',
    'Nhà xa chỗ người nói (công ty) nên dùng 去.'),
  choice('quxiang-08', CHOOSE_LAI_QU, 'Tôi ở trong phòng, bạn ở ngoài. Tôi nói: 你进___吧，外面冷。', ['来', '去'], 'A',
    'Người nghe đi vào về phía tôi nên dùng 来.'),

  trueFalse('quxiang-20', '他走进来教室。', false, 'Sai. Tân ngữ địa điểm đứng trước 来: 他走进教室来。'),
  trueFalse('quxiang-21', '他回家来了。', true, 'Đúng.'),
  trueFalse('quxiang-22', '他去进教室。', false, 'Sai. Phải nói 他走进教室去了。'),
  trueFalse('quxiang-23', '她买回一些水果来。', true, 'Đúng. Tân ngữ sự vật có thể đứng trước hoặc sau 来.'),

  choice('quxiang-24', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['她走进来。', '她走出去。', '她走上去。', '她走下来。'], 'A',
    'Cô bé đi vào phòng, về phía ngôi sao.', 'qx_01'),
  choice('quxiang-25', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['他走进来。', '他走出去。', '他走上去。', '他走下来。'], 'B',
    'Cậu bé đi ra ngoài, xa ngôi sao.', 'qx_02'),
  choice('quxiang-26', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['她走下去。', '她走上去。', '她走进去。', '她走出来。'], 'B',
    'Cô bé lên cầu thang, ra xa ngôi sao ở chân cầu thang.', 'qx_03'),
  choice('quxiang-27', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['他走下来。', '他走下去。', '他走上来。', '他走上去。'], 'A',
    'Cậu bé đi xuống về phía ngôi sao ở chân cầu thang.', 'qx_04'),
  choice('quxiang-28', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['她拿下来一本书。', '她拿上去一本书。', '她拿出来一本书。', '她拿进去一本书。'], 'A',
    'Cô bé lấy sách từ trên giá xuống về phía mình.', 'qx_05'),
  choice('quxiang-29', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['他放一本书进书包里去。', '他放一本书出书包里来。', '他拿一本书出来。', '他放一本书上去。'], 'A',
    'Cậu bé bỏ sách vào cặp, ra xa ngôi sao. Tân ngữ địa điểm 书包里 đứng trước 去.', 'qx_06'),
  choice('quxiang-30', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['她带来了一些橘子。', '她带去了一些橘子。', '她拿出了一些橘子。', '她带回去了一些橘子。'], 'A',
    'Cô bé mang cam đến chỗ ngôi sao (người nói).', 'qx_07'),
  choice('quxiang-31', PICTURE_CHOICE, 'Chọn câu đúng với hình.', ['他走过来。', '他走过去。', '他走回来。', '他走回去。'], 'B',
    'Cậu bé đi sang bên kia đường, xa ngôi sao.', 'qx_08')
];

const fillQuestions: Question[] = [
  blank('quxiang-09', '他从书包里拿___一本书。', 'lấy ra', '出|出来', '拿出 = lấy ra.'),
  blank('quxiang-10', '孩子们跑___教室了。', 'chạy vào', '进', '跑进教室 = chạy vào lớp.'),
  blank('quxiang-11', '你看，他走___马路去了。', 'băng qua', '过', '走过马路 = băng qua đường.'),
  blank('quxiang-12', '老师走___楼了。', 'đi xuống', '下', '走下楼 = đi xuống tầng.'),
  blank('quxiang-13', '妈妈买___一些水果来。', 'mua về', '回', '买回来 = mua về.'),
  blank('quxiang-14', '他站___，给老人让座。', 'đứng dậy', '起来', '站起来 = đứng dậy.')
];

const arrangeQuestions: Question[] = [
  order('quxiang-15', ARRANGE, ['他', '走', '进', '教室', '去', '了'], '他走进教室去了。', 'Tân ngữ địa điểm 教室 đứng trước 去.'),
  order('quxiang-16', ARRANGE, ['他', '拿', '出', '一本书', '来'], '他拿出一本书来。', 'Tân ngữ sự vật có thể đứng trước 来.'),
  order('quxiang-17', ARRANGE, ['妈妈', '回', '家', '来', '了'], '妈妈回家来了。', '回家来: 家 đứng trước 来.'),
  order('quxiang-18', ARRANGE, ['她', '买', '回来', '一些水果'], '她买回来一些水果。', 'Tân ngữ sự vật đứng sau 回来.'),
  order('quxiang-19', ARRANGE, ['他', '走', '下', '楼', '来', '了'], '他走下楼来了。', '走下楼来: 楼 đứng trước 来.'),

  order('quxiang-32', PICTURE_ARRANGE, ['她', '拿', '下来', '一本书'], '她拿下来一本书。', 'Tân ngữ sau 下来.', 'qx_05'),
  order('quxiang-33', PICTURE_ARRANGE, ['他', '放', '一本书', '进', '书包里', '去'], '他放一本书进书包里去。', '书包里 đứng trước 去.', 'qx_06'),
  order('quxiang-34', PICTURE_ARRANGE, ['她', '带', '来', '了', '一些橘子'], '她带来了一些橘子。', '带来了 + tân ngữ.', 'qx_07')
];

export const HSK2_GRAMMAR_QUXIANG_EXAM: ExamLesson = {
  id: 'hsk2-ngu-phap-bo-ngu-xu-huong',
  title: 'HSK 2 - Ngữ pháp: Bổ ngữ xu hướng 趋向补语',
  level: 'HSK 2',
  description: 'Công thức: V + 上/下/进/出/回/过/起 (+ 来/去). 来 = hướng về người nói/mốc; 去 = ra xa người nói/mốc.',
  instruction: 'Công thức: V + 上/下/进/出/回/过/起 (+ 来/去). 来 = hướng về người nói/mốc; 去 = ra xa người nói/mốc.',
  mcQuestions,
  fillQuestions,
  arrangeQuestions,
  essayQuestions: [],
  speakingQuestions: []
};
