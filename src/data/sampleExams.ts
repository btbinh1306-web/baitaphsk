import { ExamLesson } from '../types';
import { HSK1_BAI1_TO_5_EXAMS } from './hsk1Bai1To5';

export const SAMPLE_EXAMS: ExamLesson[] = [
  ...HSK1_BAI1_TO_5_EXAMS,
  {
    id: 'hsk1-b1-ai-xiaoyu',
    title: 'HSK 1 - Bài 1: 小语，你好！ (Đọc câu, Nối từ, Xếp câu & Dịch thuật)',
    level: 'HSK 1',
    description: 'Bài tập HSK 1 Bài 1 (小语，你好！): Luyện đọc 5 câu giao tiếp, Trắc nghiệm nối chữ Hán - nghĩa Việt, Sắp xếp từ thành câu hoàn chỉnh và Kỹ năng dịch thuật Việt - Trung.',
    vocabList: [
      { hanzi: '大家', pinyin: 'dàjiā', type: 'Đại từ', meaning: 'Mọi người', example: '大家好！' },
      { hanzi: '王', pinyin: 'Wáng', type: 'Họ', meaning: 'Họ Vương', example: '王老师' },
      { hanzi: '学生', pinyin: 'xuésheng', type: 'Danh từ', meaning: 'Học sinh', example: '我是学生。' },
      { hanzi: '老师', pinyin: 'lǎoshī', type: 'Danh từ', meaning: 'Thầy, cô giáo', example: '谢谢老师。' },
      { hanzi: '是', pinyin: 'shì', type: 'Động từ', meaning: 'Là', example: '我是学生。' },
      { hanzi: '们', pinyin: 'men', type: 'Hậu tố', meaning: '(Trợ từ chỉ số nhiều)', example: '同学们' }
    ],
    mcQuestions: [
      {
        id: 'hsk1_xiaoyu_mc1',
        type: 'mc',
        tier: 'tier1',
        prompt: 'II. NỐI TỪ CỘT A VỚI CỘT B:\nTừ "1. 大家" (dàjiā) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'dàjiā',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 2,
        explanation: '1. 大家 (dàjiā) ➔ c. Mọi người'
      },
      {
        id: 'hsk1_xiaoyu_mc2',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "2. 王" (Wáng) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'Wáng',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 5,
        explanation: '2. 王 (Wáng) ➔ f. Họ Vương'
      },
      {
        id: 'hsk1_xiaoyu_mc3',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "3. 学生" (xuésheng) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'xuésheng',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 4,
        explanation: '3. 学生 (xuésheng) ➔ e. Học sinh'
      },
      {
        id: 'hsk1_xiaoyu_mc4',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "4. 老师" (lǎoshī) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'lǎoshī',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 0,
        explanation: '4. 老师 (lǎoshī) ➔ a. Thầy, cô giáo'
      },
      {
        id: 'hsk1_xiaoyu_mc5',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "5. 是" (shì) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'shì',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 3,
        explanation: '5. 是 (shì) ➔ d. Là'
      },
      {
        id: 'hsk1_xiaoyu_mc6',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "6. 们" (men) nối với nghĩa Tiếng Việt nào ở Cột B?',
        pinyin: 'men',
        options: [
          'a. Thầy, cô giáo',
          'b. (Trợ từ chỉ số nhiều)',
          'c. Mọi người',
          'd. Là',
          'e. Học sinh',
          'f. Họ Vương'
        ],
        answer: 1,
        explanation: '6. 们 (men) ➔ b. (Trợ từ chỉ số nhiều)'
      }
    ],
    arrangeQuestions: [
      {
        id: 'hsk1_xiaoyu_arr1',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'III. SẮP XẾP CÂU 1: 是 / 我 / 学生',
        pinyin: 'Sắp xếp các từ sau thành câu hoàn chỉnh và thêm dấu câu',
        wordChips: ['我', '是', '学生', '。'],
        acceptableAnswers: '我是学生。|我是学生',
        explanation: 'Đáp án: 我是学生。 (Tôi là học sinh.)'
      },
      {
        id: 'hsk1_xiaoyu_arr2',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'III. SẮP XẾP CÂU 2: 老师 / 谢谢 / 王',
        pinyin: 'Sắp xếp các từ sau thành câu hoàn chỉnh và thêm dấu câu',
        wordChips: ['谢谢', '王', '老师', '。'],
        acceptableAnswers: '谢谢王老师。|谢谢王老师',
        explanation: 'Đáp án: 谢谢王老师。 (Cảm ơn thầy/cô Vương.)'
      },
      {
        id: 'hsk1_xiaoyu_arr3',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'III. SẮP XẾP CÂU 3: 好 / 同学 / 们 / 大家',
        pinyin: 'Sắp xếp các từ sau thành câu hoàn chỉnh và thêm dấu câu',
        wordChips: ['同学们', '，', '大家好', '！'],
        acceptableAnswers: '同学们，大家好！|大家好，同学们好！|同学们大家好！|大家好同学们好！|同学们,大家好！',
        explanation: 'Đáp án: 同学们，大家好！ (Chào các bạn học sinh, chào mọi người!)'
      },
      {
        id: 'hsk1_xiaoyu_arr4',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'III. SẮP XẾP CÂU 4: 不是 / 我 / 老师 / ， / 学生 / 是 / 我',
        pinyin: 'Sắp xếp các từ sau thành câu hoàn chỉnh và thêm dấu câu',
        wordChips: ['我', '不是', '老师', '，', '我', '是', '学生', '。'],
        acceptableAnswers: '我不是老师，我是学生。|我不是老师, 我是学生。|我不是老师,我是学生|我不是老师，我是学生',
        explanation: 'Đáp án: 我不是老师，我是学生。 (Tôi không phải là thầy giáo, tôi là học sinh.)'
      }
    ],
    essayQuestions: [
      {
        id: 'hsk1_xiaoyu_tr1',
        type: 'essay',
        tier: 'tier3',
        prompt: 'IV. KỸ NĂNG DỊCH (VIỆT - TRUNG)\nCâu 1: "Chào mọi người, tôi là học sinh."',
        pinyin: 'Dịch sang chữ Hán',
        suggestedAnswer: '大家好，我是学生。'
      },
      {
        id: 'hsk1_xiaoyu_tr2',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Câu 2: "A: Cảm ơn thầy Vương! B: Đừng khách sáo!"',
        pinyin: 'Dịch câu hội thoại sang chữ Hán',
        suggestedAnswer: 'A: 谢谢王老师！ B: 不客气！ (Hoặc 谢谢王老师！不客气！)'
      },
      {
        id: 'hsk1_xiaoyu_tr3',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Câu 3: "Các số: Sáu, Bảy, Tám, Chín, Mười."',
        pinyin: 'Dịch các số sang chữ Hán',
        suggestedAnswer: '六、七、八、九、十'
      }
    ],
    speakingQuestions: [
      {
        id: 'hsk1_xiaoyu_spk1',
        type: 'speaking',
        tier: 'tier1',
        prompt: 'I. ĐỌC CÂU (Luyện phát âm & ghi âm)\nCâu 1: "大家好！"',
        pinyin: 'Dàjiā hǎo!'
      },
      {
        id: 'hsk1_xiaoyu_spk2',
        type: 'speaking',
        tier: 'tier1',
        prompt: 'Câu 2: "我是学生。"',
        pinyin: 'Wǒ shì xuésheng.'
      },
      {
        id: 'hsk1_xiaoyu_spk3',
        type: 'speaking',
        tier: 'tier1',
        prompt: 'Câu 3: "谢谢老师。"',
        pinyin: 'Xièxie lǎoshī.'
      },
      {
        id: 'hsk1_xiaoyu_spk4',
        type: 'speaking',
        tier: 'tier1',
        prompt: 'Câu 4: "不客气。"',
        pinyin: 'Bú kèqi.'
      },
      {
        id: 'hsk1_xiaoyu_spk5',
        type: 'speaking',
        tier: 'tier1',
        prompt: 'Câu 5: "再见！"',
        pinyin: 'Zàijiàn!'
      }
    ]
  },
  {
    id: 'hsk3-b1',
    title: 'HSK 3 - Bài 1: 周末你有什么打算？ (Dự định cuối tuần & Ôn tập toàn diện)',
    level: 'HSK 3',
    description: 'Bài ôn tập toàn diện HSK 3 bao gồm bảng 15 từ vựng, trắc nghiệm nghĩa từ, điền từ hội thoại, ngữ pháp V+好, 一…也/都+不/没, xếp câu chip, đọc hiểu 2 đoạn văn và viết dịch thuật.',
    vocabList: [
      { hanzi: '周末', pinyin: 'zhōumò', type: 'Danh từ', meaning: 'Cuối tuần', example: '这个周末你有什么打算？' },
      { hanzi: '打算', pinyin: 'dǎsuàn', type: 'Động từ / Danh từ', meaning: 'Dự định, kế hoạch', example: '我打算去北京旅游。' },
      { hanzi: '啊', pinyin: 'a', type: 'Trợ từ', meaning: 'À, ạ (ngữ khí cuối câu)', example: '好啊！' },
      { hanzi: '跟', pinyin: 'gēn', type: 'Giới từ', meaning: 'Cùng với', example: '我跟朋友一起去。' },
      { hanzi: '一直', pinyin: 'yìzhí', type: 'Phó từ', meaning: 'Suốt, liên tục', example: '他一直玩儿游戏。' },
      { hanzi: '游戏', pinyin: 'yóuxì', type: 'Danh từ', meaning: 'Trò chơi / Game', example: '别玩儿游戏了。' },
      { hanzi: '作业', pinyin: 'zuòyè', type: 'Danh từ', meaning: 'Bài tập về nhà', example: '写作业。' },
      { hanzi: '着急', pinyin: 'zháojí', type: 'Tính từ', meaning: 'Lo lắng, sốt ruột', example: '别着急。' },
      { hanzi: '复习', pinyin: 'fùxí', type: 'Động từ', meaning: 'Ôn tập', example: '复习课文。' },
      { hanzi: '南方', pinyin: 'nánfāng', type: 'Danh từ', meaning: 'Phía nam, miền nam', example: '南方很热。' },
      { hanzi: '北方', pinyin: 'běifāng', type: 'Danh từ', meaning: 'Phía bắc, miền bắc', example: '北方不冷也不热。' },
      { hanzi: '面包', pinyin: 'miànbāo', type: 'Danh từ', meaning: 'Bánh mì', example: '吃面包。' },
      { hanzi: '带', pinyin: 'dài', type: 'Động từ', meaning: 'Mang theo', example: '带地图。' },
      { hanzi: '地图', pinyin: 'dìtú', type: 'Danh từ', meaning: 'Bản đồ', example: '买一张地图。' },
      { hanzi: '搬', pinyin: 'bān', type: 'Động từ', meaning: 'Dọn, chuyển (đồ/nhà)', example: '搬家。' }
    ],
    mcQuestions: [
      {
        id: 'v1',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "打算" (dǎsuàn) có nghĩa là gì?',
        pinyin: 'dǎsuàn',
        options: ['A. Dự định, kế hoạch', 'B. Lo lắng', 'C. Ôn tập', 'D. Mua sắm'],
        answer: 0,
        explanation: '打算 = Dự định, kế hoạch.'
      },
      {
        id: 'v2',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "一直" (yìzhí) có nghĩa là gì?',
        pinyin: 'yìzhí',
        options: ['A. Một chút', 'B. Suốt, liên tục', 'C. Cùng với', 'D. Đột nhiên'],
        answer: 1,
        explanation: '一直 = Suốt, liên tục.'
      },
      {
        id: 'v3',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "着急" (zháojí) có nghĩa là gì?',
        pinyin: 'zháojí',
        options: ['A. Vui vẻ', 'B. Lo lắng, sốt ruột', 'C. Bận rộn', 'D. Tự do'],
        answer: 1,
        explanation: '着急 = Lo lắng, sốt ruột.'
      },
      {
        id: 'v4',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "复习" (fùxí) có nghĩa là gì?',
        pinyin: 'fùxí',
        options: ['A. Luyện tập thể thao', 'B. Ôn tập', 'C. Chuẩn bị', 'D. Luyện phát âm'],
        answer: 1,
        explanation: '复习 = Ôn tập.'
      },
      {
        id: 'v5',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "带" (dài) trong câu "带地图" nghĩa là gì?',
        pinyin: 'dài',
        options: ['A. Mang theo', 'B. Dọn nhà', 'C. Mua sắm', 'D. Trả lại'],
        answer: 0,
        explanation: '带 = Mang theo.'
      },
      {
        id: 'v6',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "搬" (bān) trong "搬家" có nghĩa là gì?',
        pinyin: 'bān',
        options: ['A. Mang theo', 'B. Dọn, chuyển (đồ/nhà)', 'C. Đi du lịch', 'D. Xây dựng'],
        answer: 1,
        explanation: '搬 = Dọn, chuyển.'
      }
    ],
    fillQuestions: [
      {
        id: 'f1',
        type: 'fill',
        tier: 'tier1',
        prompt: 'Điền từ vựng: "你写完 ___ 了吗？"',
        wordBank: ['周末', '带', '游戏', '跟', '作业'],
        pinyin: 'Nǐ xiě wán ___ le ma?',
        acceptableAnswers: '作业',
        explanation: 'Đáp án: 作业 (bài tập về nhà).'
      },
      {
        id: 'f2',
        type: 'fill',
        tier: 'tier1',
        prompt: 'Điền từ vựng: "上个 ___ 我们去朋友家玩儿了。"',
        pinyin: 'Shàng gè ___ wǒmen qù péngyǒu jiā wánr le.',
        acceptableAnswers: '周末',
        explanation: 'Đáp án: 周末 (cuối tuần).'
      },
      {
        id: 'f3',
        type: 'fill',
        tier: 'tier1',
        prompt: 'Điền từ vựng: "别玩儿 ___ 了，快去睡觉。"',
        pinyin: 'Bié wánr ___ le, kuài qù shuìjiào.',
        acceptableAnswers: '游戏',
        explanation: 'Đáp án: 游戏 (trò chơi / game).'
      },
      {
        id: 'f4',
        type: 'fill',
        tier: 'tier1',
        prompt: 'Điền từ vựng: "他说好请我吃饭，但是没 ___ 钱。"',
        pinyin: 'Tā shuō hǎo qǐng wǒ chīfàn, dànshì méi ___ qián.',
        acceptableAnswers: '带',
        explanation: 'Đáp án: 带 (mang theo).'
      },
      {
        id: 'f5',
        type: 'fill',
        tier: 'tier1',
        prompt: 'Điền từ vựng: "明天我要上课，不能 ___ 你们一起去玩儿。"',
        pinyin: 'Míngtiān wǒ yào shàngkè, bù néng ___ nǐmen yìqǐ qù wánr.',
        acceptableAnswers: '跟',
        explanation: 'Đáp án: 跟 (cùng với).'
      },
      {
        id: 'f6',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền từ hội thoại: "A: 你是什么时候 ___ 家的？ B: 上个月。"',
        wordBank: ['南方', '搬', '面包', '地图', '打算'],
        pinyin: 'Nǐ shì shénme shíhou ___ jiā de?',
        acceptableAnswers: '搬',
        explanation: 'Đáp án: 搬 (搬家 = dọn nhà).'
      },
      {
        id: 'f7',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền từ hội thoại: "A: 你是北方人吗？ B: 不是，我是 ___ 人。"',
        pinyin: 'Nǐ shì běifāng rén ma? Bú shì, wǒ shì ___ rén.',
        acceptableAnswers: '南方',
        explanation: 'Đáp án: 南方 (miền Nam).'
      },
      {
        id: 'f8',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền từ hội thoại: "A: 考完试你有什么 ___？ B: 我还没想好。"',
        pinyin: 'Kǎo wán shì nǐ yǒu shénme ___?',
        acceptableAnswers: '打算',
        explanation: 'Đáp án: 打算 (dự định).'
      },
      {
        id: 'f9',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền từ bổ ngữ kết quả V+好: "明天的汉语课我还没 ___。 (ôn xong)"',
        pinyin: 'Míngtiān de Hànyǔ kè wǒ hái méi ___.',
        acceptableAnswers: '复习好',
        explanation: 'Đáp án: 复习好.'
      },
      {
        id: 'f10',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền cấu trúc phủ định 一…也/都+不/没: "这些汉字太难了，我 ___。 (không biết chữ nào)"',
        pinyin: 'Zhèxiē hànzì tài nán le, wǒ ___.',
        acceptableAnswers: '一个也不认识|一个都不认识|一个字也不认识|一个字都不认识',
        explanation: 'Đáp án: 一个也不认识 / 一个都不认识.'
      },
      {
        id: 'f11',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Điền cấu trúc phủ định: "这件衣服真便宜， ___。 (không đắt tý nào)"',
        pinyin: 'Zhè jiàn yīfu zhēn piányi, ___.',
        acceptableAnswers: '一点儿也不贵|一点也不贵|一点儿都不贵|一点都不贵',
        explanation: 'Đáp án: 一点儿也不贵.'
      }
    ],
    arrangeQuestions: [
      {
        id: 'a1',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'Sắp xếp các từ thành câu đúng cấu trúc V+好 (nhớ chọn đúng thứ tự và dấu câu):',
        wordChips: ['就', '我', '早', '想好', '了', '。'],
        acceptableAnswers: '我早就想好了。',
        explanation: 'Đáp án đúng: 我早就想好了。 (Tôi đã nghĩ xong từ lâu rồi.)'
      },
      {
        id: 'a2',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'Sắp xếp thành câu hỏi rủ rê giao tiếp:',
        wordChips: ['吗', '一起', '你', '去', '跟', '？', '我', '能'],
        acceptableAnswers: '你能跟我一起去吗？|我能跟你一起去吗？',
        explanation: 'Đáp án đúng: 你能跟我一起去吗？'
      }
    ],
    listeningQuestions: [
      {
        id: 'l1',
        type: 'listening_mc',
        tier: 'tier2',
        prompt: 'Nghe đoạn âm thanh sau và chọn đáp án đúng nhất:',
        pinyin: 'Zhè ge zhōumò nǐ yǒu shénme dǎsuàn?',
        options: ['A. Mua sắm', 'B. Đi du lịch', 'C. Ở nhà làm bài tập', 'D. Xem phim'],
        answer: 1,
        explanation: 'Nội dung nghe: "这个周末 em 打算去北京旅游。" -> Đáp án B.',
        audioPromptUrl: 'https://actions.google.com/sounds/v1/speech/person_speaking.ogg'
      },
      {
        id: 'l2',
        type: 'listening_tf',
        tier: 'tier2',
        prompt: 'Nghe câu sau và cho biết nhận định dưới đây là Đúng hay Sai: "Bạn nhỏ đã làm xong tất cả bài tập về nhà."',
        pinyin: 'Nǐ zuòyè xiě wán le ma?',
        options: ['Đúng (正确)', 'Sai (错误)'],
        answer: 1,
        explanation: 'Nội dung nghe: "我作业还没写完呢。" -> Chọn Sai (错误).'
      }
    ],
    readingPassages: [
      {
        id: 'rp1',
        title: 'Đoạn 1 – 周末的打算',
        content: '这个周末小刚早就想好了打算：他要请小丽吃饭、看电影、喝咖啡。饭馆儿他已经找好了，电影票也买好了。可是小丽还没想好要不要 navigation跟他去，因为她这个周末 headquarters还有很多作业没写完。小刚说："那你先写作业吧，写好了我们再去。"',
        questions: [
          {
            id: 'rp1_q1',
            type: 'mc',
            tier: 'tier2',
            prompt: '小刚这个周末打算做什么？',
            options: ['A. 写作业', 'B. 请小丽吃饭、看电影、喝咖啡', 'C. 去南方旅游', 'D. 在家睡觉'],
            answer: 1,
            explanation: 'Đoạn văn: 他要请小丽吃饭、看电影、喝咖啡。'
          },
          {
            id: 'rp1_q2',
            type: 'mc',
            tier: 'tier2',
            prompt: '(Đúng / Sai) 小刚还没买电影票。',
            options: ['A. Đúng', 'B. Sai'],
            answer: 1,
            explanation: 'Đoạn văn ghi "电影票也买好了" nên câu phát biểu "chưa mua" là Sai.'
          },
          {
            id: 'rp1_q3',
            type: 'mc',
            tier: 'tier2',
            prompt: '小丽为什么还没想好要不要去？',
            options: ['A. 她不喜欢小刚', 'B. 她还有很多作业没写完', 'C. 她要去旅游', 'D. 她生病了'],
            answer: 1,
            explanation: 'Đoạn văn: 因为她这个周末还有很多作业没写完。'
          }
        ]
      },
      {
        id: 'rp2',
        title: 'Đoạn 2 – 旅游的计划',
        content: '下个月小丽打算去旅游，她想跟小刚一起去。小丽觉得南方好，可是小刚说南方太热了，北方不冷也不热，更好一些。他们打算去北方。出发前，小刚准备好了水果、面包和茶，还带了手机、电脑和地图，一个也不能少。小丽说再多带几件衣服吧，小刚说："我们是去旅游，不是搬家，还是少带一些吧。"',
        questions: [
          {
            id: 'rp2_q1',
            type: 'mc',
            tier: 'tier2',
            prompt: '他们最后打算去哪儿旅游？',
            options: ['A. 南方', 'B. 北方', 'C. 还没决定', 'D. 国外'],
            answer: 1,
            explanation: 'Đoạn văn: 他们打算去北方。'
          },
          {
            id: 'rp2_q2',
            type: 'mc',
            tier: 'tier2',
            prompt: '小刚为什么说"还是少带一些吧"？',
            options: ['A. 因为东西太贵了', 'B. 因为是去旅游，不是搬家', 'C. 因为没有钱', 'D. 因为拿不动'],
            answer: 1,
            explanation: 'Đoạn văn: 小刚说："我们是去旅游， headquarters不是搬家，还是少带一些吧。"'
          }
        ]
      }
    ],
    essayQuestions: [
      {
        id: 'eq1',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Dịch sang tiếng Trung: "Cuối tuần bạn có kế hoạch gì?"',
        suggestedAnswer: '周末你有什么打算？'
      },
      {
        id: 'eq2',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Dịch sang tiếng Trung: "Vé phim tối nay tôi đã mua sẵn rồi."',
        suggestedAnswer: '今晚的电影票我已经买好了。'
      },
      {
        id: 'eq3',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Dịch sang tiếng Trung: "Sao bạn không lo lắng tí nào cả?"',
        suggestedAnswer: '你怎么一点儿 headquarters headquarters也不着急？'
      },
      {
        id: 'eq4',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Dịch sang tiếng Việt câu: "我们是去旅游， headquarters不是搬家，还是少带一些吧。"',
        suggestedAnswer: 'Chúng ta đi du lịch chứ không phải dọn nhà, thôi mang ít đồ thôi nhé.'
      },
      {
        id: 'eq5',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Viết đoạn văn ngắn (5-8 câu) về chủ đề: "我的周末打算" (Dự định cuối tuần của tôi).',
        suggestedAnswer: '这个周末我早就想好了打算。我打算跟朋友一起去北方旅游。出发前，我已经准备好了面包、水果和地图，一个 headquarters也不能少。我的作业也复习 headquarters好了，所以一点儿也不着急。'
      }
    ],
    speakingQuestions: [
      {
        id: 'sq1',
        type: 'speaking',
        tier: 'tier3',
        prompt: 'Ghi âm câu 1: "周末你有什么打算？"',
        pinyin: 'Zhōumò nǐ yǒu shénme dǎsuàn?'
      },
      {
        id: 'sq2',
        type: 'speaking',
        tier: 'tier3',
        prompt: 'Ghi âm câu 2: "去旅游的东西我都准备好了。"',
        pinyin: 'Qù lǚyóu de dōngxī wǒ dōu zhǔnbèi hǎo le.'
      },
      {
        id: 'sq3',
        type: 'speaking',
        tier: 'tier3',
        prompt: 'Ghi âm câu 3: "我们是去旅游， headquarters不是搬家，还是少带一些吧。"',
        pinyin: 'Wǒmen shì qù lǚyóu, bú shì bānjiā, hái shì shǎo dài yìxiē ba.'
      }
    ],
    translationQuestions: [
      {
        id: 'tr1_1',
        type: 'translation',
        translationType: 'vi_to_zh_audio',
        tier: 'tier3',
        prompt: 'Dịch sang tiếng Trung & Ghi âm phát âm: "Cuối tuần bạn có kế hoạch gì?"',
        pinyin: 'Zhōumò nǐ yǒu shénme dǎsuàn?',
        suggestedAnswer: '周末你有什么打算？'
      },
      {
        id: 'tr1_2',
        type: 'translation',
        translationType: 'vi_to_zh_text',
        tier: 'tier3',
        prompt: 'Dịch sang chữ Hán: "Vé xem phim tối nay tôi đã mua xong rồi."',
        suggestedAnswer: '今晚的电影票我已经买好了。 (Jīnwǎn de diànyǐng piào wǒ yǐjīng mǎi hǎo le.)'
      },
      {
        id: 'tr1_3',
        type: 'translation',
        translationType: 'zh_to_vi_text',
        tier: 'tier3',
        prompt: 'Dịch sang Tiếng Việt: "南方太热了，我不喜欢去。"',
        pinyin: 'Nánfāng tài rè le, wǒ bù xǐhuān qù.',
        suggestedAnswer: 'Miền Nam nóng quá, tôi không thích đi.'
      }
    ]
  },
  {
    id: 'hsk1-b1',
    title: 'HSK 1 - Bài 1: 你好 (Xin chào & Ôn tập toàn diện)',
    level: 'HSK 1',
    description: 'Bài ôn tập tương tác HSK 1 bao gồm bảng từ vựng khóa, trắc nghiệm, điền từ dịch ngày tháng, sắp xếp câu chip và ghi âm luyện phát âm.',
    vocabList: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', type: 'Thán từ', meaning: 'Xin chào', example: '你好！我是李老师。' },
      { hanzi: '谢谢', pinyin: 'xièxie', type: 'Động từ', meaning: 'Cảm ơn', example: '谢谢你！' },
      { hanzi: '不客气', pinyin: 'bú kèqi', type: 'Cụm từ', meaning: 'Không có gì', example: '不客气！' },
      { hanzi: '再见', pinyin: 'zàijiàn', type: 'Động từ', meaning: 'Tạm biệt', example: '明天见，再见！' },
      { hanzi: '老师', pinyin: 'lǎoshī', type: 'Danh từ', meaning: 'Thầy / Cô giáo', example: '王老师好！' },
      { hanzi: '学生', pinyin: 'xuésheng', type: 'Danh từ', meaning: 'Học sinh / Sinh viên', example: '我是汉语学生。' }
    ],
    mcQuestions: [
      {
        id: 'q1',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Từ "你好" (Nǐ hǎo) trong tiếng Trung có nghĩa là gì?',
        pinyin: 'Nǐ hǎo',
        options: ['A. Tạm biệt', 'B. Xin chào', 'C. Cảm ơn', 'D. Xin lỗi'],
        answer: 1,
        explanation: '你好 (Nǐ hǎo) = Xin chào.'
      },
      {
        id: 'q2',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Đại từ "你" (nǐ) chỉ đối tượng nào?',
        pinyin: 'nǐ',
        options: ['A. Tôi', 'B. Bạn / Anh / Chị', 'C. Anh ấy', 'D. Chúng tôi'],
        answer: 1,
        explanation: '你 (nǐ) = Bạn, ngôi thứ 2 số ít.'
      },
      {
        id: 'q3',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Chọn phiên âm Pinyin đúng cho chữ "谢谢":',
        pinyin: 'Xièxie',
        options: ['A. Nǐ hǎo', 'B. Zàijiàn', 'C. Xièxie', 'D. Bù kèqi'],
        answer: 2,
        explanation: '谢谢 = Xièxie (Cảm ơn).'
      }
    ],
    fillQuestions: [
      {
        id: 'fq1',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Dịch ngày tháng thời gian sang tiếng Trung: "Ngày 13 tháng 6 năm 2025"',
        pinyin: 'Trật tự tiếng Trung: Năm -> Tháng -> Ngày (年 -> 月 -> 号/日)',
        acceptableAnswers: '2025年6月13号|2025年6月13日|二〇二五年六月十三号|二零二五年六月十三日',
        explanation: 'Tiếng Trung viết thời gian từ lớn đến nhỏ: 年 (năm) -> 月 (tháng) -> 号/日 (ngày).'
      }
    ],
    arrangeQuestions: [
      {
        id: 'aq1',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'Sắp xếp các từ sau thành câu chào hỏi hoàn chỉnh:',
        pinyin: 'Nhấp vào các thẻ từ để xếp thành câu đúng',
        wordChips: ['老师', '你好', '李', '。'],
        acceptableAnswers: '李老师你好。|你好李老师。',
        explanation: 'Đáp án đúng: 李老师你好。 (Thầy giáo Lý xin chào.)'
      }
    ],
    essayQuestions: [
      {
        id: 'eq1',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Hãy dịch câu sau sang tiếng Trung: "Xin chào thầy giáo, cảm ơn thầy!"',
        suggestedAnswer: '老师你好，谢谢您！ (hoặc 老师好，谢谢你！)'
      }
    ],
    speakingQuestions: [
      {
        id: 'sq1',
        type: 'speaking',
        tier: 'tier3',
        prompt: 'Câu 1 (Phát âm): Đọc to và ghi âm đoạn chào hỏi sau: "你好！我是学生，谢谢你！再见！"',
        pinyin: 'Nǐ hǎo! Wǒ shì xuésheng, xièxie nǐ! Zàijiàn!'
      }
    ]
  },
  {
    id: 'hsk2-b3',
    title: 'HSK 2 - Bài 3: 左边那个红色的是我的 (Cái màu đỏ bên trái là của tôi)',
    level: 'HSK 2',
    description: 'Bài tập tương tác kiểm tra trắc nghiệm trợ từ 的, điền từ chỉ vị trí, sắp xếp câu và ghi âm luyện đọc.',
    vocabList: [
      { hanzi: '左边', pinyin: 'zuǒbian', type: 'Danh từ chỉ hướng', meaning: 'Bên trái', example: '左边那个是我的。' },
      { hanzi: '右边', pinyin: 'yòubian', type: 'Danh từ chỉ hướng', meaning: 'Bên phải', example: '右边是王先生。' },
      { hanzi: '红色', pinyin: 'hóngsè', type: 'Danh từ / Tính từ', meaning: 'Màu đỏ', example: '我喜欢红色的苹果。' },
      { hanzi: '苹果', pinyin: 'píngguǒ', type: 'Danh từ', meaning: 'Quả táo', example: '吃一个苹果。' }
    ],
    mcQuestions: [
      {
        id: 'q1_2',
        type: 'mc',
        tier: 'tier1',
        prompt: 'Điền từ thích hợp: "这本书是 ___ 的。"',
        pinyin: 'Zhè běn shū shì ___ de.',
        options: ['A. 我', 'B. 去', 'C. 吃', 'D. 大'],
        answer: 0,
        explanation: '我的 (Wǒ de) = Của tôi. Danh từ/đại từ + 的.'
      }
    ],
    fillQuestions: [
      {
        id: 'fq1_2',
        type: 'fill',
        tier: 'tier2',
        prompt: 'Dịch ngày tháng sang tiếng Trung: "Ngày 20 tháng 10 năm 2024"',
        pinyin: 'Năm -> Tháng -> Ngày',
        acceptableAnswers: '2024年10月20号|2024年10月20日|二〇二四年十月二十号|二零二四年十月二十日',
        explanation: 'Đáp án: 2024年10月20号'
      }
    ],
    arrangeQuestions: [
      {
        id: 'aq1_2',
        type: 'arrange',
        tier: 'tier2',
        prompt: 'Sắp xếp các từ thành câu đúng cấu trúc "...是...的":',
        pinyin: 'Xếp từ mô tả đồ vật',
        wordChips: ['左边', '那个', '苹果', '是', '我的', '。'],
        acceptableAnswers: '左边那个苹果是我的。',
        explanation: 'Đáp án đúng: 左边那个苹果是我的。'
      }
    ],
    essayQuestions: [
      {
        id: 'eq1_2',
        type: 'essay',
        tier: 'tier3',
        prompt: 'Đặt 2 câu có sử dụng cấu trúc "...是...的" (Ví dụ: 这双鞋是我买的).',
        suggestedAnswer: '1. 这本书是我的。\n2. 那个红色的苹果是妹妹买的。'
      }
    ],
    speakingQuestions: [
      {
        id: 'sq1_2',
        type: 'speaking',
        tier: 'tier3',
        prompt: 'Đọc ghi âm bài hội thoại: "左边那个苹果是我的，右边那个是你的。"',
        pinyin: 'Zuǒbiān nà gè píngguǒ shì wǒ de, yòubiān nà gè shì nǐ de.'
      }
    ]
  },
  {
    id: 'hsk1-b1-phatam',
    title: 'HSK 1 - Bài 1: Luyện Phát Âm (Thanh Mẫu, Vận Mẫu & Từ Đơn)',
    level: 'HSK 1',
    description: 'Bài luyện phát âm HSK 1 gồm các câu ghi âm thanh mẫu, vận mẫu, từ đơn, trắc nghiệm phát âm và phán đoán đúng sai.',
    mcQuestions: [],
    essayQuestions: [],
    speakingQuestions: [
      { id: 'tm_b', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: b', pinyin: 'b' },
      { id: 'tm_p', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: p', pinyin: 'p' },
      { id: 'tm_m', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: m', pinyin: 'm' },
      { id: 'tm_f', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: f', pinyin: 'f' },
      { id: 'tm_d', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: d', pinyin: 'd' },
      { id: 'tm_t', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: t', pinyin: 't' },
      { id: 'tm_n', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: n', pinyin: 'n' },
      { id: 'tm_l', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: l', pinyin: 'l' },
      { id: 'tm_g', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: g', pinyin: 'g' },
      { id: 'tm_k', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: k', pinyin: 'k' },
      { id: 'tm_h', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: h', pinyin: 'h' },
      { id: 'tm_j', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: j', pinyin: 'j' },
      { id: 'tm_q', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: q', pinyin: 'q' },
      { id: 'tm_x', type: 'speaking_record', tier: 'tier3', prompt: 'Thanh mẫu: x', pinyin: 'x' },
      { id: 'vm_a', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: a', pinyin: 'a' },
      { id: 'vm_o', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: o', pinyin: 'o' },
      { id: 'vm_e', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: e', pinyin: 'e' },
      { id: 'vm_i', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: i', pinyin: 'i' },
      { id: 'vm_u', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: u', pinyin: 'u' },
      { id: 'vm_ai', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ai', pinyin: 'ai' },
      { id: 'vm_iao', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: iao', pinyin: 'iao' },
      { id: 'vm_er', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: er', pinyin: 'er' },
      { id: 'vm_v', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ü', pinyin: 'ü' },
      { id: 'vm_ei', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ei', pinyin: 'ei' },
      { id: 'vm_ao', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ao', pinyin: 'ao' },
      { id: 'vm_ia', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ia', pinyin: 'ia' },
      { id: 'vm_ie', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ie', pinyin: 'ie' },
      { id: 'vm_ua', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: ua', pinyin: 'ua' },
      { id: 'vm_uo', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: uo', pinyin: 'uo' },
      { id: 'vm_ue', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: üe', pinyin: 'üe' },
      { id: 'vm_uai', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: uai', pinyin: 'uai' },
      { id: 'vm_uei', type: 'speaking_record', tier: 'tier3', prompt: 'Vận mẫu: uei', pinyin: 'uei' },
      { id: 'td_fei', type: 'speaking_record', tier: 'tier3', prompt: 'Từ đơn: fēi', pinyin: 'fēi' },
      { id: 'td_hao', type: 'speaking_record', tier: 'tier3', prompt: 'Từ đơn: hǎo', pinyin: 'hǎo' },
      { id: 'td_jia', type: 'speaking_record', tier: 'tier3', prompt: 'Từ đơn: jiā', pinyin: 'jiā' },
      { id: 'td_yue', "type": 'speaking_record', tier: 'tier3', prompt: 'Từ đơn: yuè', pinyin: 'yuè' },
      { id: 'td_shui', type: 'speaking_record', tier: 'tier3', prompt: 'Từ đơn: shuǐ', pinyin: 'shuǐ' }
    ],
    listeningQuestions: [
      {
        id: 'mc_1',
        type: 'listening_multiple_choice',
        tier: 'tier2',
        prompt: 'Nghe và chọn cách phát âm đúng:',
        options: ['tuī', 'duī'],
        answer: 0,
        explanation: 'Đáp án đúng là tuī'
      },
      {
        id: 'mc_2',
        type: 'listening_multiple_choice',
        tier: 'tier2',
        prompt: 'Nghe và chọn thanh điệu đúng:',
        options: ['gē', 'gé', 'gě', 'gè'],
        answer: 0,
        explanation: 'Đáp án đúng là gē (thanh 1)'
      },
      {
        id: 'mc_3',
        type: 'listening_multiple_choice',
        tier: 'tier2',
        prompt: 'Nghe và chọn âm đúng:',
        options: ['qǐ', 'qì', 'jǐ', 'jì'],
        answer: 0,
        explanation: 'Đáp án đúng là qǐ'
      },
      {
        id: 'mc_4',
        type: 'listening_multiple_choice',
        tier: 'tier2',
        prompt: 'Nghe và chọn thanh điệu đúng:',
        options: ['māi', 'mái', 'mǎi', 'mài'],
        answer: 3,
        explanation: 'Đáp án đúng là mài (thanh 4)'
      },
      {
        id: 'tf_1',
        type: 'listening_true_false',
        tier: 'tier2',
        prompt: 'Từ vừa đọc có phải là: nǎ ?',
        options: ['Đúng (正确)', 'Sai (错误)'],
        answer: 0,
        explanation: 'Đúng, phát âm là nǎ.'
      },
      {
        id: 'tf_2',
        type: 'listening_true_false',
        tier: 'tier2',
        prompt: 'Từ vừa đọc có phải là: bái ?',
        options: ['Đúng (正确)', 'Sai (错误)'],
        answer: 1,
        explanation: 'Sai, phát âm không phải là bái.'
      }
    ]
  },
  {
    id: 'hw_chep_tu_moi_chung',
    title: 'Nộp bài chép từ mới chữ Hán',
    level: 'HSK 1',
    description: 'Dạng bài: Nộp ảnh bài chép từ mới chữ Hán',
    type: 'handwriting_submission',
    isHandwriting: true,
    instruction: 'Chụp ảnh vở chép từ mới chữ Hán và nộp tại đây. Học sinh vui lòng ghi rõ tên bài / từ mới đã chép ở ô bên dưới.',
    referenceImages: [],
    mcQuestions: [],
    essayQuestions: [],
    speakingQuestions: [],
    handwritingQuestions: [
      {
        id: 'hw_q_chep_tu_moi_chung',
        type: 'handwriting_submission',
        prompt: 'Nộp bài chép từ mới chữ Hán',
        instruction: 'Chụp ảnh vở chép từ mới chữ Hán và nộp tại đây. Học sinh vui lòng ghi rõ tên bài / từ mới đã chép ở ô bên dưới.'
      }
    ]
  }
];
