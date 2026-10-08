import { ExamLesson, Question } from '../types';

const listeningQuestion = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  audioText: string
): Question => ({
  id,
  type: 'listening_mc',
  tier: 'tier1',
  prompt,
  options,
  answer,
  audioText,
  maxAudioPlayCount: 2
});

const readingQuestion = (id: string, pinyin: string, taskGroup: string, taskGroupTitle: string): Question => ({
  id,
  type: 'speaking_record',
  tier: 'tier2',
  prompt: pinyin,
  pinyin,
  taskGroup,
  taskGroupTitle,
  referenceAnswers: [pinyin],
  teacherReviewRequired: true
});

const listeningQuestions: Question[] = [
  listeningQuestion('pinyin_listen_1_01', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['mǎi', 'mái', 'mài'], 0, '买'),
  listeningQuestion('pinyin_listen_1_02', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['pái', 'pǎi', 'pài'], 0, '排'),
  listeningQuestion('pinyin_listen_1_03', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['fō', 'fó', 'fò'], 1, '佛'),
  listeningQuestion('pinyin_listen_1_04', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['tóng', 'tǒng', 'tòng'], 2, '痛'),
  listeningQuestion('pinyin_listen_1_05', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['lóu', 'lǒu', 'lòu'], 0, '楼'),
  listeningQuestion('pinyin_listen_1_06', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['tā', 'tá', 'tǎ'], 0, '他'),
  listeningQuestion('pinyin_listen_1_07', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['lē', 'lé', 'lè'], 2, '乐'),
  listeningQuestion('pinyin_listen_1_08', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['dēng', 'déng', 'děng'], 2, '等'),
  listeningQuestion('pinyin_listen_1_09', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['qiú', 'qiǔ', 'qiù'], 0, '球'),
  listeningQuestion('pinyin_listen_1_10', 'Nghe 1 âm tiết và chọn Pinyin đúng.', ['xiē', 'xié', 'xiě'], 2, '写'),
  listeningQuestion('pinyin_listen_2_01', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['nǐ hǎo', 'ní hǎo', 'nǐ háo'], 0, '你好'),
  listeningQuestion('pinyin_listen_2_02', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['lǎo shī', 'láo shī', 'lǎo shí'], 0, '老师'),
  listeningQuestion('pinyin_listen_2_03', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['hǎo ma', 'hào ma', 'hǎo mā'], 0, '好吗'),
  listeningQuestion('pinyin_listen_2_04', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['dà jiā', 'dā jiā', 'dà qiā'], 0, '大家'),
  listeningQuestion('pinyin_listen_2_05', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['qǐng zuò', 'qíng zuò', 'qǐng zhuò'], 0, '请坐'),
  listeningQuestion('pinyin_listen_2_06', 'Nghe 2 âm tiết và chọn đúng toàn bộ Pinyin.', ['xiè xie', 'xié xiè', 'xiě xiè'], 0, '谢谢'),
  listeningQuestion('pinyin_listen_3_01', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['lǎo shī hǎo', 'láo shī hǎo', 'lǎo sí hǎo'], 0, '老师好'),
  listeningQuestion('pinyin_listen_3_02', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['dà jiā hǎo', 'dā jiā hǎo', 'dà qiā hǎo'], 0, '大家好'),
  listeningQuestion('pinyin_listen_3_03', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['nǐ hǎo ma', 'ní hǎo mā', 'nǐ háo ma'], 0, '你好吗'),
  listeningQuestion('pinyin_listen_3_04', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['qǐng zuò ba', 'qíng zuò bā', 'qǐng zhuò ba'], 0, '请坐吧'),
  listeningQuestion('pinyin_listen_3_05', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['zài jiàn le', 'zǎi jiàn lè', 'zài jiān le'], 0, '再见了'),
  listeningQuestion('pinyin_listen_3_06', 'Nghe 3 âm tiết và chọn đúng thứ tự Pinyin.', ['wǒ shì lǎo shī', 'wó shǐ láo shī', 'wǒ sí lǎo shí'], 0, '我是老师')
];

const oneSyllablePrompts = ['mǎi', 'pái', 'fò', 'qiā', 'xiē', 'jié', 'zhī', 'chí', 'shǐ', 'wǎn', 'wěn', 'zhuān'];
const twoSyllablePrompts = [
  'bā pā', 'mā fā', 'dà tīng', 'nǐ lǎo', 'gōng zuò', 'kāi mén', 'hē chá',
  'jīng cǎi', 'qǐng xiě', 'zhōng guó', 'chū zū', 'shàng wǎng', 'rì běn',
  'zǎo cān', 'sān shí', 'yī wèi', 'mǎi pái', 'fò lóu', 'qiā xiě', 'liáo tiān',
  'niú nǎi', 'yōng yīn', 'wá huài', 'wěi tuǐ', 'děng lěng', 'zhuān xīn',
  'guāng míng', 'yáng xiǎng'
];

const speakingQuestions: Question[] = [
  ...oneSyllablePrompts.map((pinyin, index) => readingQuestion(
    `pinyin_read_1_${String(index + 1).padStart(2, '0')}`,
    pinyin,
    'pinyin_read_one',
    'A. Đọc 1 âm tiết — ghi âm'
  )),
  ...twoSyllablePrompts.map((pinyin, index) => readingQuestion(
    `pinyin_read_2_${String(index + 1).padStart(2, '0')}`,
    pinyin,
    'pinyin_read_two',
    'B. Đọc 2 âm tiết — ghi âm'
  ))
];

export const PINYIN_PRACTICE_EXAM: ExamLesson = {
  id: 'pinyin-nghe-va-doc',
  title: 'Luyện Pinyin — Nghe và Đọc',
  level: 'Luyện nói',
  description: 'Dành cho học sinh mới học xong Pinyin: nghe nhận dạng thanh điệu, sau đó đọc và ghi âm Pinyin.',
  instruction: 'Không tách thanh mẫu – vận mẫu và không hiển thị chữ Hán. Phần nghe có 22 câu; mỗi câu được phát âm tối đa 2 lần. Phần đọc gồm 12 lượt 1 âm tiết và 28 lượt 2 âm tiết, chỉ tính hoàn thành khi đã có bản ghi.',
  timeLimitEnabled: false,
  mcQuestions: [],
  fillQuestions: [],
  arrangeQuestions: [],
  readingPassages: [],
  listeningQuestions,
  essayQuestions: [],
  speakingQuestions,
  translationQuestions: []
};
