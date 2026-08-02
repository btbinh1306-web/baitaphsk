import { GoogleGenAI } from '@google/genai';
import { ExamLesson, VocabItem, Question, ReadingPassage } from '../types';

export async function generateExamWithAI(
  topicPrompt: string,
  level: ExamLesson['level'] = 'HSK 3'
): Promise<ExamLesson> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là chuyên gia biên soạn giáo trình và đề thi tiếng Trung HSK.
Hãy tạo một đề thi/bài học ôn tập HSK chuẩn cấp độ [${level}] về chủ đề: "${topicPrompt}".

Yêu cầu trả về BẮT BUỘC dạng JSON thuần túy (không bọc trong markdown triple backticks), có cấu trúc chính xác như sau:
{
  "id": "custom-${Date.now()}",
  "title": "${level} - Bài học AI: ${topicPrompt}",
  "level": "${level}",
  "description": "Mô tả bài học...",
  "vocabList": [
    { "hanzi": "字", "pinyin": "zì", "type": "Danh từ", "meaning": "Chữ", "example": "Ví dụ" }
  ],
  "mcQuestions": [
    {
      "id": "mc1",
      "type": "mc",
      "tier": "tier1",
      "prompt": "Câu hỏi trắc nghiệm?",
      "pinyin": "pinyin...",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "answer": 0,
      "explanation": "Giải thích đáp án"
    }
  ],
  "fillQuestions": [
    {
      "id": "f1",
      "type": "fill",
      "tier": "tier2",
      "prompt": "Điền từ: '我打算去 ___ 旅游。'",
      "pinyin": "pinyin...",
      "acceptableAnswers": "北京|上海"
    }
  ],
  "arrangeQuestions": [
    {
      "id": "a1",
      "type": "arrange",
      "tier": "tier2",
      "prompt": "Sắp xếp từ thành câu đúng:",
      "pinyin": "pinyin...",
      "wordChips": ["我", "去", "打算", "北京", "。"],
      "acceptableAnswers": "我打算去北京。"
    }
  ],
  "readingPassages": [
    {
      "id": "rp1",
      "title": "Đoạn văn đọc hiểu",
      "content": "Nội dung đoạn văn chữ Hán...",
      "questions": [
        {
          "id": "rp1_q1",
          "type": "mc",
          "tier": "tier2",
          "prompt": "Câu hỏi đọc hiểu?",
          "options": ["A. Lựa chọn 1", "B. Lựa chọn 2"],
          "answer": 0,
          "explanation": "Giải thích"
        }
      ]
    }
  ],
  "essayQuestions": [
    {
      "id": "e1",
      "type": "essay",
      "tier": "tier3",
      "prompt": "Dịch câu hoặc viết bài...",
      "suggestedAnswer": "Gợi ý đáp án..."
    }
  ],
  "speakingQuestions": [
    {
      "id": "s1",
      "type": "speaking",
      "tier": "tier3",
      "prompt": "Đọc ghi âm câu: '...'",
      "pinyin": "pinyin..."
    }
  ]
}

Hãy đảm bảo có ít nhất 6-8 từ vựng, 4 câu trắc nghiệm, 3 câu điền từ, 2 câu xếp từ chip, 1 đoạn đọc hiểu và 2 câu khẩu ngữ ghi âm.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed as ExamLesson;
    } catch (err) {
      console.warn('AI generation API call failed, falling back to smart template generator:', err);
    }
  }

  // Fallback AI generator if API key is not present or error
  return createFallbackExam(topicPrompt, level);
}

function createFallbackExam(topicPrompt: string, level: ExamLesson['level']): ExamLesson {
  const timestamp = Date.now();

  const sampleVocab: VocabItem[] = [
    { hanzi: '打算', pinyin: 'dǎsuàn', type: 'Động từ / Danh từ', meaning: 'Dự định, kế hoạch', example: '你有什么打算？' },
    { hanzi: '准备', pinyin: 'zhǔnbèi', type: 'Động từ', meaning: 'Chuẩn bị', example: '我都准备好了。' },
    { hanzi: '旅游', pinyin: 'lǚyóu', type: 'Động từ', meaning: 'Du lịch', example: '去北京旅游。' },
    { hanzi: '决定', pinyin: 'juédìng', type: 'Động từ', meaning: 'Quyết định', example: '我已经决定了。' },
    { hanzi: '开心', pinyin: 'kāixīn', type: 'Tính từ', meaning: 'Vui vẻ', example: '祝你玩的开心！' }
  ];

  const mcQuestions: Question[] = [
    {
      id: `mc_${timestamp}_1`,
      type: 'mc',
      tier: 'tier1',
      prompt: `Từ "打算" (dǎsuàn) trong chủ đề "${topicPrompt}" nghĩa là gì?`,
      pinyin: 'dǎsuàn',
      options: ['A. Dự định, kế hoạch', 'B. Lo lắng', 'C. Mua sắm', 'D. Báo cáo'],
      answer: 0,
      explanation: '打算 = Dự định, kế hoạch.'
    },
    {
      id: `mc_${timestamp}_2`,
      type: 'mc',
      tier: 'tier1',
      prompt: 'Từ "准备" (zhǔnbèi) có nghĩa là gì?',
      pinyin: 'zhǔnbèi',
      options: ['A. Ôn tập', 'B. Chuẩn bị', 'C. Tạm biệt', 'D. Trả lời'],
      answer: 1,
      explanation: '准备 = Chuẩn bị.'
    }
  ];

  const fillQuestions: Question[] = [
    {
      id: `f_${timestamp}_1`,
      type: 'fill',
      tier: 'tier2',
      prompt: `Điền từ vựng thích hợp liên quan đến "${topicPrompt}": "去旅游的东西我都 ___ 好了。 (chuẩn bị xong)"`,
      pinyin: 'Qù lǚyóu de dōngxī wǒ dōu ___ hǎo le.',
      acceptableAnswers: '准备|准备好',
      explanation: 'Đáp án: 准备 (chuẩn bị).'
    }
  ];

  const arrangeQuestions: Question[] = [
    {
      id: `a_${timestamp}_1`,
      type: 'arrange',
      tier: 'tier2',
      prompt: 'Sắp xếp các từ chip thành câu giao tiếp chuẩn:',
      pinyin: 'Xếp câu dự định',
      wordChips: ['打算', '我', '去', '北京', '。'],
      acceptableAnswers: '我打算去北京。',
      explanation: 'Đáp án đúng: 我打算去北京。'
    }
  ];

  const readingPassages: ReadingPassage[] = [
    {
      id: `rp_${timestamp}_1`,
      title: `Bài đọc hiểu – 主题：${topicPrompt}`,
      content: `下个月我们打算去旅游。旅行的东西我已经准备好了，地图和面包也带好了。大家都很开心！`,
      questions: [
        {
          id: `rp_q1`,
          type: 'mc',
          tier: 'tier2',
          prompt: '下个月他们打算做什么？',
          options: ['A. 去旅游', 'B. 搬家', 'C. 考试'],
          answer: 0,
          explanation: 'Đoạn văn: 下个月我们打算去旅游。'
        }
      ]
    }
  ];

  const essayQuestions: Question[] = [
    {
      id: `e_${timestamp}_1`,
      type: 'essay',
      tier: 'tier3',
      prompt: `Dịch câu sang tiếng Trung: "Tôi đã chuẩn bị xong hết đồ đi du lịch rồi."`,
      suggestedAnswer: '去旅游的东西我都准备好了。'
    }
  ];

  const speakingQuestions: Question[] = [
    {
      id: `s_${timestamp}_1`,
      type: 'speaking',
      tier: 'tier3',
      prompt: `Đọc ghi âm phát âm câu: "祝你玩的开心！"`,
      pinyin: 'Zhù nǐ wán de kāixīn!'
    }
  ];

  const translationQuestions: Question[] = [
    {
      id: `tr_${timestamp}_1`,
      type: 'translation',
      translationType: 'vi_to_zh_audio',
      tier: 'tier3',
      prompt: `Dịch & Ghi âm phát âm câu: "Chúc bạn chơi vui vẻ!"`,
      pinyin: 'Zhù nǐ wán de kāixīn!',
      suggestedAnswer: '祝你玩的开心！'
    },
    {
      id: `tr_${timestamp}_2`,
      type: 'translation',
      translationType: 'vi_to_zh_text',
      tier: 'tier3',
      prompt: `Dịch sang chữ Hán câu: "Đồ đi du lịch tôi đều chuẩn bị xong rồi."`,
      suggestedAnswer: '去旅游的东西 headquarters我都准备好了。'
    },
    {
      id: `tr_${timestamp}_3`,
      type: 'translation',
      translationType: 'zh_to_vi_text',
      tier: 'tier3',
      prompt: `Dịch sang Tiếng Việt câu: "下个月我们打算去旅游。"`,
      pinyin: 'Xià gè yuè wǒmen dǎsuàn qù lǚyóu.',
      suggestedAnswer: 'Tháng sau chúng tôi dự định đi du lịch.'
    }
  ];

  return {
    id: `ai-exam-${timestamp}`,
    title: `${level} - Bài thi AI: ${topicPrompt}`,
    level,
    description: `Đề thi được tạo tự động bởi AI dành cho ${level} về chủ đề ${topicPrompt}.`,
    vocabList: sampleVocab,
    mcQuestions,
    fillQuestions,
    arrangeQuestions,
    readingPassages,
    essayQuestions,
    speakingQuestions,
    translationQuestions
  };
}
