import { ExamLesson, Question } from '../types';
import { emptyLesson, LETTERS, lettered } from './hsk6De1Matching';

// HSK 6 · Đề 1 · Chọn đáp án thích hợp 选词填空 (from the teacher's
// HSK6_De1_LuyenTap_ChonDapAn.docx): 69 four-option questions in 7 sets, each
// with two easily confused near-synonyms. Two sets per test -> 4 tests.
// Options keep their A–D order so the explanations (which name letters) match.

type Row = [set: number, prompt: string, options: string[], answer: string, explanation: string[]];

const ROWS: Row[] = [
  [1, "报名今天下午五点___。", ["截至", "停止", "到期", "截止"], "D", ["Đúng · D. 截止  —  là động từ, đứng cuối câu: “hết hạn”. 截至 phải có mốc thời gian theo sau (截至今天).", "Sai · A. 截至  —  “Tính đến”, cần có mốc thời gian theo sau (截至今天); không đứng cuối câu làm vị ngữ.", "Sai · B. 停止  —  “dừng lại” (hành động ngừng), không nói đến hạn chót đăng ký.", "Sai · C. 到期  —  “đến hạn”, dùng cho hợp đồng, thẻ, khoản vay (合同到期), không dùng cho hạn đăng ký."]],
  [1, "___3月初，影片的票房已突破百亿元。", ["截止", "到期", "截至", "停止"], "C", ["Đúng · C. 截至  —  + mốc thời gian = “tính đến”.", "Sai · A. 截止  —  động từ “kết thúc/hết hạn”, thường cần 到 (截止到3月初); câu này diễn đạt “tính đến mốc 3月初” nên 截至 là chuẩn nhất.", "Sai · D. 停止  —  “dừng lại”, không có nghĩa “tính đến”.", "Sai · B. 到期  —  “đến hạn”, không dùng để nêu mốc thống kê."]],
  [1, "他对这个问题感到很___。", ["询问", "问题", "疑问", "疑惑"], "D", ["Đúng · D. 疑惑  —  thắc mắc, có thể làm vị ngữ (很疑惑). 疑问 là danh từ.", "Sai · C. 疑问  —  danh từ (điều thắc mắc, câu hỏi), không đứng sau 感到很 làm trạng thái.", "Sai · B. 问题  —  danh từ “vấn đề”, không thể nói 很问题.", "Sai · A. 询问  —  động từ “hỏi thăm”, cần tân ngữ, không diễn tả cảm giác."]],
  [1, "如有___，请随时与我联系。", ["疑问", "问候", "质问", "疑惑"], "A", ["Đúng · A. 疑问  —  有疑问 = có điều thắc mắc (danh từ). 疑惑 thiên về cảm giác/động từ.", "Sai · D. 疑惑  —  nghiêng về trạng thái trong lòng (很疑惑); cụm cố định ở đây là 如有疑问.", "Sai · C. 质问  —  “chất vấn”, mang sắc thái trách móc, hỏi vặn.", "Sai · B. 问候  —  “hỏi thăm, chào hỏi”, nghĩa khác hẳn."]],
  [1, "他没有明说，只是___我该走了。", ["启示", "演示", "指示", "暗示"], "D", ["Đúng · D. 暗示  —  ngầm ra hiệu, không nói thẳng. 启示 là “gợi mở, bài học”.", "Sai · A. 启示  —  “gợi mở, bài học”, không phải hành động ra hiệu ngầm.", "Sai · C. 指示  —  “chỉ thị” của cấp trên với cấp dưới, không hợp ngữ cảnh “không nói thẳng”.", "Sai · B. 演示  —  “trình diễn, làm mẫu”, không liên quan."]],
  [1, "这个故事给了我很大的___。", ["提示", "表示", "暗示", "启示"], "D", ["Đúng · D. 启示  —  给…启示 = mang lại bài học, gợi mở sâu sắc.", "Sai · C. 暗示  —  “ngầm ra hiệu”, không dùng cho bài học rút ra.", "Sai · A. 提示  —  “nhắc, gợi ý” cụ thể; không có nghĩa “bài học sâu sắc”.", "Sai · B. 表示  —  “biểu thị, bày tỏ”; không đứng sau 很大的 làm danh từ."]],
  [1, "屏幕上出现了操作___。", ["提示", "暗示", "启示", "表示"], "A", ["Đúng · A. 提示  —  dòng nhắc/gợi ý (操作提示). 启示 là bài học tư tưởng.", "Sai · C. 启示  —  bài học, sự gợi mở về tư tưởng, không phải dòng chữ nhắc trên màn hình.", "Sai · B. 暗示  —  ngầm ra hiệu, không dùng cho hướng dẫn thao tác.", "Sai · D. 表示  —  “biểu thị”; không ghép thành 操作表示."]],
  [1, "房价___上涨，让很多人感到压力。", ["大概", "大幅", "大量", "大约"], "B", ["Đúng · B. 大幅  —  + 上涨/下降/提高 (biên độ lớn). 大量 chỉ số lượng nhiều.", "Sai · C. 大量  —  chỉ số lượng nhiều, không diễn tả biên độ thay đổi của giá.", "Sai · A. 大概  —  phó từ “khoảng chừng”, không bổ nghĩa cho 上涨 theo mức độ.", "Sai · D. 大约  —  “khoảng”, cũng chỉ ước lượng."]],
  [1, "她今天___很高兴。", ["明显", "显著", "显得", "显示"], "C", ["Đúng · C. 显得  —  + tính từ = “trông có vẻ”. 显示 là “cho thấy, hiển thị”.", "Sai · D. 显示  —  “cho thấy, hiển thị”, cần tân ngữ (显示结果), không đi với tính từ 很高兴.", "Sai · B. 显著  —  tính từ “rõ rệt”, không đứng trước 很高兴 như 显得.", "Sai · A. 明显  —  tính từ “rõ ràng”, không nối trực tiếp “trạng thái” như 显得."]],
  [1, "这门技艺要___给下一代。", ["承担", "承认", "继承", "传承"], "D", ["Đúng · D. 传承  —  giá trị/kỹ nghệ, truyền cho đời sau. 继承 là thừa kế (của cải, sự nghiệp).", "Sai · C. 继承  —  “thừa kế” (tài sản, sự nghiệp); ở đây nhấn mạnh truyền lại cho thế hệ sau nên dùng 传承.", "Sai · A. 承担  —  “gánh vác” (trách nhiệm, chi phí), không có nghĩa truyền lại.", "Sai · B. 承认  —  “thừa nhận”, nghĩa khác hẳn."]],
  [2, "她___了父亲的全部财产。", ["承担", "继承", "传承", "承认"], "B", ["Đúng · B. 继承  —  继承财产 = thừa kế tài sản. 传承 dùng cho văn hóa, kỹ nghệ.", "Sai · C. 传承  —  truyền thừa văn hóa, kỹ nghệ; không dùng cho tài sản.", "Sai · A. 承担  —  “gánh chịu” trách nhiệm/chi phí; không ghép với 财产 như vậy.", "Sai · D. 承认  —  “thừa nhận”, không có nghĩa nhận tài sản."]],
  [2, "语言不通___了他们的交流。", ["推动", "障碍", "方便", "阻碍"], "D", ["Đúng · D. 阻碍  —  là động từ (cản trở). 障碍 là danh từ (chướng ngại).", "Sai · B. 障碍  —  danh từ “chướng ngại”, không làm vị ngữ (障碍了他们 ✗).", "Sai · C. 方便  —  “thuận tiện”, ngược nghĩa với ngữ cảnh.", "Sai · A. 推动  —  “thúc đẩy”, ngược nghĩa."]],
  [2, "我们要努力打破语言___。", ["障碍", "阻拦", "阻碍", "阻止"], "A", ["Đúng · A. 障碍  —  打破 + 障碍 (danh từ). 阻碍 là động từ nên không đi sau 打破.", "Sai · C. 阻碍  —  thường làm động từ “cản trở”; cụm cố định là 打破障碍.", "Sai · D. 阻止  —  “ngăn chặn” (hành động), không đi sau 打破.", "Sai · B. 阻拦  —  “ngăn cản” (hành động), không đi sau 打破."]],
  [2, "我始终___，只要努力就能成功。", ["坚信", "坚强", "坚决", "坚持"], "A", ["Đúng · A. 坚信  —  = tin chắc. 坚持 = kiên trì làm việc gì đó.", "Sai · D. 坚持  —  “kiên trì làm”, đi với hành động, không diễn tả niềm tin vào một mệnh đề.", "Sai · C. 坚决  —  “kiên quyết” (thái độ), không đi với 只要…就….", "Sai · B. 坚强  —  “kiên cường” (tính cách), không đi với mệnh đề."]],
  [2, "他___每天练习汉语。", ["坚强", "坚信", "坚持", "坚决"], "C", ["Đúng · C. 坚持  —  + động từ (kiên trì làm). 坚信 + mệnh đề (tin chắc rằng).", "Sai · B. 坚信  —  “tin chắc rằng…”, đi với mệnh đề, không đi với hành động lặp lại hằng ngày.", "Sai · D. 坚决  —  “kiên quyết”, thường đi với 反对/要求; “坚决每天练习” không tự nhiên.", "Sai · A. 坚强  —  “kiên cường”, tính từ chỉ tính cách."]],
  [2, "因为___原因，会议推迟了。", ["特色", "特殊", "特别", "特点"], "B", ["Đúng · B. 特殊  —  + 原因/情况: “khác thường, đặc biệt”. 特别 thiên về “rất”.", "Sai · C. 特别  —  “đặc biệt/rất”, gần nghĩa nhưng thiên về khẩu ngữ; 特殊原因 là cách nói chuẩn khi nói lý do khác thường.", "Sai · D. 特点  —  danh từ “đặc điểm”, không bổ nghĩa cho 原因.", "Sai · A. 特色  —  danh từ “nét đặc sắc”, không bổ nghĩa cho 原因."]],
  [2, "我___喜欢这部电影。", ["特点", "特色", "特别", "特殊"], "C", ["Đúng · C. 特别  —  + động từ/tính từ (phó từ “đặc biệt, rất”).", "Sai · D. 特殊  —  tính từ “khác thường”, không dùng như phó từ “rất” trước 喜欢.", "Sai · A. 特点  —  danh từ “đặc điểm”, không đứng trước động từ.", "Sai · B. 特色  —  danh từ, không đứng trước động từ."]],
  [2, "把牛奶和咖啡___在一起就是拿铁。", ["混乱", "混合", "混淆", "混血"], "B", ["Đúng · B. 混合  —  = trộn lẫn các thứ vào nhau.", "Sai · C. 混淆  —  “lẫn lộn, nhầm” (trừu tượng), không nói về trộn đồ uống.", "Sai · A. 混乱  —  “hỗn loạn”, nói về tình trạng, không phải hành động trộn.", "Sai · D. 混血  —  “lai” (huyết thống), không liên quan."]],
  [2, "这两个词的意思很接近，容易___。", ["融合", "混淆", "混乱", "混合"], "B", ["Đúng · B. 混淆  —  = lẫn lộn, nhầm lẫn.", "Sai · D. 混合  —  “trộn các vật với nhau”, không phải “nhầm hai từ”.", "Sai · C. 混乱  —  “hỗn loạn” (tình trạng), không đi với 容易 theo nghĩa nhầm lẫn.", "Sai · A. 融合  —  “hòa trộn” (văn hóa, kỹ thuật), không có nghĩa nhầm lẫn."]],
  [2, "她一生___教育事业。", ["倾向于", "致力于", "对于", "关于"], "B", ["Đúng · B. 致力于  —  + việc: dốc sức vào. 倾向于 là “nghiêng về”.", "Sai · A. 倾向于  —  “nghiêng về”, không có nghĩa dốc sức cả đời cho một việc.", "Sai · D. 关于  —  giới từ “về”, không làm vị ngữ.", "Sai · C. 对于  —  giới từ “đối với”, không làm vị ngữ."]],
  [3, "我___选择第二个方案。", ["倾向于", "至于", "致力于", "由于"], "A", ["Đúng · A. 倾向于  —  + lựa chọn/ý kiến: “nghiêng về”.", "Sai · C. 致力于  —  “dốc sức vào”, không dùng để chọn một phương án.", "Sai · B. 至于  —  “còn về”, dùng để chuyển chủ đề.", "Sai · D. 由于  —  “bởi vì”, giới từ chỉ nguyên nhân."]],
  [3, "他毕业___北京大学。", ["到", "于", "向", "在"], "B", ["Đúng · B. 于  —  毕业于 + trường (于 là giới từ văn viết = 从). Không dùng 在.", "Sai · D. 在  —  “毕业在…” không dùng; 在 dùng cho nơi chốn của hành động.", "Sai · C. 向  —  giới từ chỉ hướng, không đi với 毕业.", "Sai · A. 到  —  chỉ hướng đến, không đi với 毕业 theo nghĩa “tốt nghiệp từ”."]],
  [3, "这次交流___了两国青年的心灵距离。", ["拉长", "拉开", "拉动", "拉近"], "D", ["Đúng · D. 拉近  —  拉近距离 = làm gần lại. 拉开距离 ngược nghĩa.", "Sai · B. 拉开  —  “kéo xa, tạo khoảng cách” — ngược nghĩa với 拉近.", "Sai · A. 拉长  —  “kéo dài” (thời gian, vật), không nói khoảng cách tâm hồn.", "Sai · C. 拉动  —  “thúc đẩy” (kinh tế, tiêu dùng), không hợp ngữ cảnh."]],
  [3, "这看似简单的一笔，___了交流中的关键障碍。", ["消除", "消费", "消失", "消化"], "A", ["Đúng · A. 消除  —  + 障碍: xóa bỏ trở ngại. 消失 không có tân ngữ.", "Sai · C. 消失  —  “biến mất”, nội động từ, không có tân ngữ.", "Sai · D. 消化  —  “tiêu hóa”, nghĩa khác.", "Sai · B. 消费  —  “tiêu dùng”, nghĩa khác."]],
  [3, "为国家工作是一件很___的事。", ["名誉", "信誉", "光荣", "荣誉"], "C", ["Đúng · C. 光荣  —  là tính từ (vinh quang). 荣誉 là danh từ (danh dự).", "Sai · D. 荣誉  —  danh từ “danh dự”, không đứng sau 很 làm tính từ.", "Sai · B. 信誉  —  danh từ “uy tín”.", "Sai · A. 名誉  —  danh từ “danh dự, thanh danh”."]],
  [3, "这座城市的经济非常___。", ["繁体", "繁荣", "繁华", "繁忙"], "B", ["Đúng · B. 繁荣  —  + 经济/市场. 繁华 chỉ nơi sầm uất (街道/都市).", "Sai · C. 繁华  —  chỉ nơi sầm uất (街道, 都市), không nói “经济繁华”.", "Sai · D. 繁忙  —  “bận rộn” (công việc, giao thông), không dùng cho kinh tế.", "Sai · A. 繁体  —  “chữ phồn thể”, nghĩa khác."]],
  [3, "他每天都很___，几乎没有休息时间。", ["繁荣", "繁忙", "繁多", "繁华"], "B", ["Đúng · B. 繁忙  —  = bận rộn.", "Sai · A. 繁荣  —  “phồn vinh” (kinh tế, thị trường), không nói người bận.", "Sai · D. 繁华  —  “sầm uất” (nơi chốn), không nói người.", "Sai · C. 繁多  —  “nhiều” (chủng loại), không nói người bận rộn."]],
  [3, "汽车在___路上行驶。", ["快速", "快乐", "迅速", "快捷"], "A", ["Đúng · A. 快速  —  快速路 là cách gọi cố định. 迅速 thiên về “nhanh, gấp” cho hành động.", "Sai · C. 迅速  —  “nhanh chóng, gấp” chỉ hành động/phản ứng; “快速路” là cụm cố định.", "Sai · B. 快乐  —  “vui vẻ”, nghĩa khác.", "Sai · D. 快捷  —  “nhanh gọn, tiện lợi” (快捷方式), không ghép với 路 theo nghĩa này."]],
  [3, "两辆车在路口发生了___。", ["碰撞", "撞见", "碰见", "碰巧"], "A", ["Đúng · A. 碰撞  —  = va chạm. 碰见 là “tình cờ gặp”.", "Sai · C. 碰见  —  “tình cờ gặp”, không phải va chạm.", "Sai · B. 撞见  —  “bắt gặp” (thường chuyện không muốn bị thấy).", "Sai · D. 碰巧  —  phó từ “tình cờ”."]],
  [3, "导演向记者___了影片的制作情况。", ["暴露", "透露", "露面", "透明"], "B", ["Đúng · B. 透露  —  = tiết lộ (thông tin). 暴露 = phơi bày điều giấu kín.", "Sai · A. 暴露  —  “phơi bày điều giấu kín”, thường mang sắc thái tiêu cực.", "Sai · D. 透明  —  “trong suốt”, nghĩa khác.", "Sai · C. 露面  —  “xuất hiện, lộ mặt”, không có tân ngữ là thông tin."]],
  [4, "团队用五年时间___剧本，让故事更精彩。", ["研磨", "折磨", "打磨", "磨炼"], "C", ["Đúng · C. 打磨  —  + 作品/剧本: trau chuốt. 磨炼 là tôi luyện (ý chí, con người).", "Sai · D. 磨炼  —  “tôi luyện” con người/ý chí, không dùng cho kịch bản.", "Sai · B. 折磨  —  “hành hạ”, nghĩa tiêu cực.", "Sai · A. 研磨  —  “nghiền nhỏ” vật liệu."]],
  [4, "困难能___人的意志。", ["折磨", "磨炼", "打磨", "研磨"], "B", ["Đúng · B. 磨炼  —  + 意志/人: tôi luyện. 打磨 dùng cho vật/tác phẩm.", "Sai · C. 打磨  —  “mài, trau chuốt” vật hay tác phẩm, không dùng cho ý chí.", "Sai · A. 折磨  —  “hành hạ”, không hợp với 意志.", "Sai · D. 研磨  —  “nghiền nhỏ”, không hợp."]],
  [4, "她是个很___的女孩，没有那么多心思。", ["单位", "单纯", "单调", "单独"], "B", ["Đúng · B. 单纯  —  = ngây thơ, đơn thuần. 单独 là “riêng một mình”.", "Sai · D. 单独  —  “riêng một mình”, không miêu tả tính cách.", "Sai · A. 单位  —  “đơn vị”, danh từ.", "Sai · C. 单调  —  “đơn điệu”, nghĩa khác."]],
  [4, "他想___和你谈谈。", ["单独", "单调", "单纯", "单位"], "A", ["Đúng · A. 单独  —  + động từ: riêng, một mình.", "Sai · C. 单纯  —  “ngây thơ, thuần”, không dùng như “riêng, một mình”.", "Sai · D. 单位  —  “đơn vị”, danh từ.", "Sai · B. 单调  —  “đơn điệu”, nghĩa khác."]],
  [4, "这部电影的___明年上映。", ["持续", "继续", "续集", "连续"], "C", ["Đúng · C. 续集  —  = phần tiếp theo (danh từ).", "Sai · B. 继续  —  động từ “tiếp tục”, không phải danh từ “phần tiếp”.", "Sai · D. 连续  —  “liên tiếp”, tính từ/phó từ.", "Sai · A. 持续  —  “kéo dài”, động từ."]],
  [4, "请把这个页面___发给我。", ["截断", "截至", "截止", "截图"], "D", ["Đúng · D. 截图  —  = chụp màn hình.", "Sai · C. 截止  —  “hết hạn”, không phải chụp màn hình.", "Sai · B. 截至  —  “tính đến”.", "Sai · A. 截断  —  “cắt đứt”, nghĩa khác."]],
  [4, "国外动画曾___市场主导地位。", ["占据", "占领", "占比", "占用"], "A", ["Đúng · A. 占据  —  + địa vị/vị trí. 占领 thiên về quân sự, chiếm đóng.", "Sai · D. 占用  —  “chiếm dụng” (thời gian, chỗ), không đi với “địa vị”.", "Sai · B. 占领  —  “chiếm đóng” (quân sự), không dùng cho vị thế thị trường.", "Sai · C. 占比  —  danh từ “tỷ trọng”."]],
  [4, "这个项目___了我们很多时间。", ["占据", "占比", "占领", "占用"], "D", ["Đúng · D. 占用  —  + thời gian/chỗ: chiếm dụng.", "Sai · A. 占据  —  “chiếm giữ” vị trí, địa vị; với thời gian dùng 占用.", "Sai · C. 占领  —  “chiếm đóng”, không nói thời gian.", "Sai · B. 占比  —  danh từ “tỷ trọng”."]],
  [4, "班里的气氛___了起来。", ["活跃", "跳跃", "生活", "活动"], "A", ["Đúng · A. 活跃  —  = sôi nổi (气氛活跃).", "Sai · D. 活动  —  “hoạt động”, không miêu tả bầu không khí “…起来”.", "Sai · B. 跳跃  —  “nhảy”, nghĩa đen.", "Sai · C. 生活  —  “cuộc sống”, danh từ."]],
  [4, "同学们___发言，课堂很热闹。", ["踊跃", "生活", "跳跃", "活动"], "A", ["Đúng · A. 踊跃  —  + 发言/报名: hăng hái. 跳跃 là “nhảy”.", "Sai · C. 跳跃  —  “nhảy”, nghĩa đen.", "Sai · B. 生活  —  “cuộc sống”.", "Sai · D. 活动  —  “hoạt động”, không đi với 发言 theo nghĩa này."]],
  [5, "这部电影的___已突破一百亿元。", ["门票", "房间", "车票", "票房"], "D", ["Đúng · D. 票房  —  = doanh thu phòng vé.", "Sai · A. 门票  —  “vé vào cửa”, không phải doanh thu.", "Sai · B. 房间  —  “căn phòng”.", "Sai · C. 车票  —  “vé xe”."]],
  [5, "他对中国历史很感___。", ["有趣", "兴趣", "乐趣", "趣味"], "B", ["Đúng · B. 兴趣  —  感兴趣 là cụm cố định. 乐趣 là niềm vui.", "Sai · C. 乐趣  —  “niềm vui”, không đi với 感 (感乐趣 ✗).", "Sai · D. 趣味  —  “tính thú vị”, danh từ.", "Sai · A. 有趣  —  “thú vị”, không đi với 感 theo cách này."]],
  [5, "这个游戏很___，大家都玩得很开心。", ["趣味", "有趣", "兴趣", "乐趣"], "B", ["Đúng · B. 有趣  —  là tính từ nên đứng sau 很.", "Sai · C. 兴趣  —  danh từ “hứng thú”, không đứng sau 很 (很兴趣 ✗).", "Sai · D. 乐趣  —  “niềm vui”, danh từ.", "Sai · A. 趣味  —  “tính thú vị”, danh từ."]],
  [5, "科学家连续___了孩子们的反应。", ["观察", "视察", "警察", "考察"], "A", ["Đúng · A. 观察  —  = quan sát (hành vi, phản ứng). 考察 thiên về khảo sát thực địa.", "Sai · D. 考察  —  “khảo sát thực địa, tìm hiểu tình hình”, mức độ khác với quan sát hành vi.", "Sai · B. 视察  —  “thanh tra, thị sát” của cấp trên.", "Sai · C. 警察  —  “cảnh sát”, danh từ."]],
  [5, "他一点也没有___到危险。", ["觉察", "警察", "考察", "观察"], "A", ["Đúng · A. 觉察  —  觉察到 = nhận ra, phát giác.", "Sai · D. 观察  —  “quan sát” chủ động; cụm cố định ở đây là 觉察到 (nhận ra).", "Sai · C. 考察  —  “khảo sát”, không phải “nhận ra”.", "Sai · B. 警察  —  “cảnh sát”, danh từ."]],
  [5, "他把这个问题分析得很___。", ["透露", "透彻", "透明", "渗透"], "B", ["Đúng · B. 透彻  —  分析得很透彻 = phân tích thấu đáo.", "Sai · C. 透明  —  “trong suốt”, nghĩa khác.", "Sai · A. 透露  —  “tiết lộ” thông tin.", "Sai · D. 渗透  —  “thấm, thẩm thấu”."]],
  [5, "周末我们一起去___。", ["露营", "透露", "露面", "暴露"], "A", ["Đúng · A. 露营  —  = cắm trại. 露面 = lộ mặt.", "Sai · C. 露面  —  “xuất hiện, lộ diện”, không phải cắm trại.", "Sai · D. 暴露  —  “phơi bày”.", "Sai · B. 透露  —  “tiết lộ”."]],
  [5, "政府决定___这项生态修复工程。", ["启示", "启动", "启程", "启蒙"], "B", ["Đúng · B. 启动  —  + 工程/项目: khởi động. 启程 là lên đường.", "Sai · A. 启示  —  “bài học, gợi mở”, không đi với 工程.", "Sai · C. 启程  —  “lên đường”, không đi với 工程.", "Sai · D. 启蒙  —  “khai sáng”, nghĩa khác."]],
  [5, "商场里安装了摄像头进行___。", ["测试", "监控", "监测", "监考"], "B", ["Đúng · B. 监控  —  = giám sát bằng camera. 监测 là theo dõi số liệu (空气、水质).", "Sai · C. 监测  —  “theo dõi số liệu” (空气, 水质), còn camera là 监控.", "Sai · D. 监考  —  “coi thi”.", "Sai · A. 测试  —  “kiểm tra thử”, nghĩa khác."]],
  [5, "好老师能___学生的学习兴趣。", ["激励", "激发", "刺激", "激动"], "B", ["Đúng · B. 激发  —  + 兴趣/潜力: khơi dậy. 激励 là động viên, khích lệ.", "Sai · A. 激励  —  “động viên, khích lệ” (người), không đi với 兴趣.", "Sai · C. 刺激  —  “kích thích” (phản ứng mạnh), không phải khơi dậy hứng thú.", "Sai · D. 激动  —  “xúc động”, tính từ."]],
  [6, "公司用奖金来___员工。", ["激动", "激发", "激励", "刺激"], "C", ["Đúng · C. 激励  —  + người (员工, 学生): khích lệ, động viên.", "Sai · B. 激发  —  “khơi dậy” (hứng thú, tiềm năng), người thì dùng 激励 hợp hơn.", "Sai · D. 刺激  —  “kích thích”, thiên về phản ứng mạnh.", "Sai · A. 激动  —  “xúc động”, tính từ."]],
  [6, "春天来了，河面上的冰雪___了。", ["消化", "融化", "融合", "合并"], "B", ["Đúng · B. 融化  —  = tan chảy (băng, tuyết). 融合 là hòa trộn (văn hóa, kỹ thuật).", "Sai · C. 融合  —  “hòa trộn” (văn hóa, kỹ thuật), không nói băng tan.", "Sai · D. 合并  —  “sáp nhập”.", "Sai · A. 消化  —  “tiêu hóa”."]],
  [6, "这个城市努力___国际旅游品牌。", ["改造", "打造", "制造", "造成"], "B", ["Đúng · B. 打造  —  + thương hiệu/hình ảnh: xây dựng. 改造 là cải tạo cái có sẵn.", "Sai · A. 改造  —  “cải tạo” cái đã có, không phải xây dựng thương hiệu.", "Sai · C. 制造  —  “chế tạo” (vật), không hợp với thương hiệu.", "Sai · D. 造成  —  “gây ra” (hậu quả), nghĩa khác."]],
  [6, "人类一直在___宇宙的奥秘。", ["探索", "探望", "探险", "探讨"], "A", ["Đúng · A. 探索  —  + bí ẩn/chân lý. 探讨 là bàn bạc vấn đề.", "Sai · D. 探讨  —  “bàn bạc, thảo luận” một vấn đề, không đi với 奥秘.", "Sai · C. 探险  —  “thám hiểm”, nghĩa khác.", "Sai · B. 探望  —  “thăm hỏi”, nghĩa khác."]],
  [6, "科学家从青蒿中___出了有效成分。", ["提取", "获取", "吸取", "提高"], "A", ["Đúng · A. 提取  —  = chiết xuất. 获取 là thu được (thông tin, lợi ích).", "Sai · B. 获取  —  “thu được” (thông tin, lợi ích), không chỉ chiết xuất chất.", "Sai · C. 吸取  —  “hấp thụ” (kinh nghiệm, bài học).", "Sai · D. 提高  —  “nâng cao”, không đi với 出."]],
  [6, "这座建筑的___很独特。", ["类型", "造型", "发型", "模型"], "B", ["Đúng · B. 造型  —  = kiểu dáng, hình khối.", "Sai · A. 类型  —  “loại hình”.", "Sai · D. 模型  —  “mô hình”.", "Sai · C. 发型  —  “kiểu tóc”."]],
  [6, "这件衬衫和裙子___得很好。", ["分配", "搭配", "配合", "配套"], "B", ["Đúng · B. 搭配  —  = phối hợp (đồ, màu sắc). 配合 là phối hợp làm việc.", "Sai · C. 配合  —  “phối hợp làm việc”, không dùng cho quần áo.", "Sai · A. 分配  —  “phân chia”.", "Sai · D. 配套  —  “đồng bộ, đi kèm”, không đi với 得很好."]],
  [6, "在工作中，同事之间要互相___。", ["分配", "配套", "配合", "搭配"], "C", ["Đúng · C. 配合  —  = phối hợp (người với người).", "Sai · D. 搭配  —  “phối đồ/màu/món ăn”, không dùng cho người làm việc.", "Sai · A. 分配  —  “phân chia”, nghĩa khác.", "Sai · B. 配套  —  “đồng bộ, đi kèm”, nghĩa khác."]],
  [6, "志愿者___帮老人分类垃圾。", ["上门", "开门", "入门", "出门"], "A", ["Đúng · A. 上门  —  = đến tận nhà. 入门 là “nhập môn”.", "Sai · C. 入门  —  “nhập môn”, nghĩa khác.", "Sai · D. 出门  —  “ra khỏi nhà”.", "Sai · B. 开门  —  “mở cửa”."]],
  [6, "他对这次比赛信心___。", ["充足", "足够", "满足", "十足"], "D", ["Đúng · D. 十足  —  信心十足 là cụm cố định. 充足 dùng cho 时间/阳光/资金.", "Sai · A. 充足  —  “dồi dào” (thời gian, nguồn lực), không đi với 信心.", "Sai · B. 足够  —  “đủ”, không đi với 信心 theo cụm cố định.", "Sai · C. 满足  —  “thỏa mãn”, nghĩa khác."]],
  [7, "父母不应___孩子学习。", ["强大", "强烈", "强调", "强迫"], "D", ["Đúng · D. 强迫  —  = ép buộc. 强调 là nhấn mạnh.", "Sai · C. 强调  —  “nhấn mạnh”, nghĩa khác.", "Sai · B. 强烈  —  “mạnh mẽ” (tính từ), không có tân ngữ là người.", "Sai · A. 强大  —  “hùng mạnh”, tính từ."]],
  [7, "国家大力推进乡村___。", ["振兴", "兴趣", "兴奋", "复兴"], "A", ["Đúng · A. 振兴  —  乡村振兴 là cụm cố định. 复兴 là phục hưng (dân tộc, văn hóa).", "Sai · D. 复兴  —  “phục hưng” (dân tộc, văn hóa); cụm cố định là 乡村振兴.", "Sai · C. 兴奋  —  “phấn khích”, nghĩa khác.", "Sai · B. 兴趣  —  “hứng thú”, nghĩa khác."]],
  [7, "他把这次失败___一次学习机会。", ["视为", "认为", "成为", "以为"], "A", ["Đúng · A. 视为  —  把 A 视为 B = coi A là B.", "Sai · B. 认为  —  “nghĩ rằng”, không có cấu trúc 把…认为….", "Sai · D. 以为  —  “tưởng rằng”, không dùng cấu trúc 把.", "Sai · C. 成为  —  “trở thành”, không đi với 把."]],
  [7, "只有了解当地文化，才能___于这里。", ["扎根", "扎针", "扎实", "根据"], "A", ["Đúng · A. 扎根  —  扎根于 + nơi chốn: bén rễ.", "Sai · B. 扎针  —  “châm kim”.", "Sai · C. 扎实  —  “vững chắc”, tính từ.", "Sai · D. 根据  —  “căn cứ”, nghĩa khác."]],
  [7, "这次活动___了邻里之间的情谊。", ["聚集", "凝聚", "集合", "聚会"], "B", ["Đúng · B. 凝聚  —  + tình cảm/sức mạnh: gắn kết. 聚集 chỉ người tụ lại về vật lý.", "Sai · A. 聚集  —  “tụ tập” người/vật về vật lý, không nói tình cảm.", "Sai · C. 集合  —  “tập hợp”.", "Sai · D. 聚会  —  “họp mặt”."]],
  [7, "周末我喜欢在家过___生活。", ["休闲", "休息", "闲话", "空闲"], "A", ["Đúng · A. 休闲  —  休闲生活 = cuộc sống thư thả.", "Sai · B. 休息  —  “nghỉ ngơi”; “休息生活” không tự nhiên.", "Sai · D. 空闲  —  “rảnh rỗi”.", "Sai · C. 闲话  —  “chuyện phiếm”."]],
  [7, "这是一部纯___动画电影。", ["国际", "国内", "国外", "国产"], "D", ["Đúng · D. 国产  —  = sản xuất trong nước.", "Sai · B. 国内  —  “trong nước” (phạm vi), không nói nơi sản xuất.", "Sai · C. 国外  —  “nước ngoài”.", "Sai · A. 国际  —  “quốc tế”."]],
  [7, "他说着一口浓重的四川___。", ["发言", "语言", "方向", "方言"], "D", ["Đúng · D. 方言  —  = tiếng địa phương. 语言 là ngôn ngữ nói chung.", "Sai · B. 语言  —  “ngôn ngữ” nói chung, không chỉ riêng tiếng địa phương.", "Sai · C. 方向  —  “phương hướng”.", "Sai · A. 发言  —  “phát biểu”."]],
  [7, "通过卫星___，可以掌握千亩农田的长势。", ["感受", "遥感", "遥远", "感觉"], "B", ["Đúng · B. 遥感  —  = viễn thám.", "Sai · C. 遥远  —  “xa xôi”.", "Sai · D. 感觉  —  “cảm giác”.", "Sai · A. 感受  —  “cảm nhận”."]]
];

const SETS_PER_TEST = 2;
const setCount = Math.max(...ROWS.map(([set]) => set));

const buildTest = (testIndex: number): ExamLesson => {
  const examId = `hsk6-de1-chon-dap-an-${testIndex + 1}`;
  const firstSet = testIndex * SETS_PER_TEST + 1;
  const sets = Array.from({ length: SETS_PER_TEST }, (_, offset) => firstSet + offset).filter((set) => set <= setCount);
  const mcQuestions: Question[] = ROWS
    .map((row, index) => ({ row, number: index + 1 }))
    .filter(({ row: [set] }) => sets.includes(set))
    .map(({ row: [set, prompt, options, answer, explanation], number }) => {
      return {
        id: `${examId}-${String(number).padStart(2, '0')}`,
        type: 'mc',
        tier: 'tier2',
        prompt,
        options: lettered(options),
        keepOptionOrder: true,
        answer: LETTERS.indexOf(answer),
        explanation: explanation.join('\n'),
        showExplanationToStudent: true,
        taskGroup: `${examId}-set-${set}`,
        taskGroupTitle: 'Chọn đáp án thích hợp',
        instruction: 'Chọn đáp án thích hợp nhất. Mỗi câu có 2 từ gần nghĩa hoặc gần dạng rất dễ nhầm — chú ý cách dùng và từ loại.'
      };
    });
  return {
    id: examId,
    title: `HSK 6 · Đề ${testIndex + 1} · Chọn đáp án thích hợp 选词填空`,
    level: 'HSK 6',
    description: '',
    instruction: 'Chọn đáp án thích hợp nhất điền vào chỗ trống.',
    ...emptyLesson,
    mcQuestions
  };
};

export const HSK6_DE1_CHON_DAP_AN_EXAMS: ExamLesson[] = Array.from(
  { length: Math.ceil(setCount / SETS_PER_TEST) },
  (_, testIndex) => buildTest(testIndex)
);
