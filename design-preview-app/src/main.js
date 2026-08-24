import './styles.css';

const options = {
  a: {
    name: 'Minimal Academic',
    short: 'A',
    color: 'Đỏ gạch',
    description: 'Gọn và chuyên nghiệp, có thêm phân cấp để không bị phẳng.',
  },
  b: {
    name: 'Clean Modern',
    short: 'B',
    color: 'Xanh navy',
    description: 'Typography rõ, khoảng trắng rộng, nhịp hiện đại hơn.',
  },
  c: {
    name: 'Chinese Learning Focus',
    short: 'C',
    color: 'Đỏ nâu',
    description: 'Chữ Hán và pinyin là trung tâm của trải nghiệm học.',
  },
};

const screens = [
  { id: 'student-home', label: 'Học sinh: chọn bài' },
  { id: 'student-exam', label: 'Học sinh: làm bài' },
  { id: 'teacher-submissions', label: 'GV: danh sách bài nộp' },
  { id: 'grading-detail', label: 'GV: chấm chi tiết' },
  { id: 'student-result', label: 'Học sinh: kết quả' },
];

let state = { option: 'a', screen: 'student-home' };

const optionButtons = () => Object.entries(options).map(([id, item]) => `
  <button class="option-button ${state.option === id ? 'is-active' : ''}" data-option="${id}" type="button">
    <span class="option-key">${item.short}</span>
    <span><strong>${item.name}</strong><small>${item.color}</small></span>
  </button>
`).join('');

const screenButtons = () => screens.map((screen) => `
  <button class="screen-button ${state.screen === screen.id ? 'is-active' : ''}" data-screen="${screen.id}" type="button">
    ${screen.label}
  </button>
`).join('');

const status = (kind, text) => `<span class="status status--${kind}">${text}</span>`;

function studentHome() {
  return `
    <div class="screen-heading">
      <div>
        <p class="overline">Bài tập / HSK1</p>
        <h2>Chọn bài để bắt đầu</h2>
        <p class="screen-lede">Lớp HSK1. Hoàn thành bài làm theo tiến độ của bạn.</p>
      </div>
      <button class="button button--secondary" type="button">Tra cứu kết quả</button>
    </div>
    <section class="content-panel">
      <div class="content-panel__header"><h3>HSK1</h3><span class="muted">8 bài đang mở</span></div>
      <div class="content-panel__body lesson-list">
        <div class="lesson-row"><span class="lesson-code">Bài 01</span><div><strong>你好！ / Chào hỏi</strong><small>Từ vựng, nghe và nói cơ bản</small></div><button class="text-button" data-screen="student-exam" type="button">Làm bài</button></div>
        <div class="lesson-row"><span class="lesson-code">Bài 02</span><div><strong class="hanzi">你叫什么名字？</strong><small>Giới thiệu tên và làm quen</small></div><button class="text-button" data-screen="student-exam" type="button">Làm bài</button></div>
        <div class="lesson-row is-current"><span class="lesson-code">Bài 10</span><div><strong class="hanzi">这儿的苹果真便宜！</strong><small>Đọc hiểu, chọn đáp án và tự luận</small></div><div class="lesson-actions"><span class="current-label">Đang học</span><button class="text-button" data-screen="student-exam" type="button">Làm bài</button></div></div>
      </div>
    </section>
  `;
}

function studentExam() {
  return `
    <div class="exam-layout">
      <section class="content-panel exam-panel">
        <div class="content-panel__body">
          <div class="exercise-intro">
            <p class="overline">HSK1 · Bài 10</p>
            <h2 class="hanzi">这儿的苹果真便宜！</h2>
            <p class="pinyin">Zhèr de píngguǒ zhēn piányi!</p>
            <p class="screen-lede">Chọn đáp án phù hợp nhất cho mỗi câu.</p>
          </div>
          <article class="question"><span class="question-number">Câu 1</span><h3 class="hanzi">王老师______中国人。</h3><div class="choices"><label class="choice"><input type="radio" name="q1" /> 有</label><label class="choice"><input type="radio" name="q1" /> 是</label><label class="choice"><input type="radio" name="q1" /> 会</label></div></article>
          <article class="question"><span class="question-number">Câu 2</span><h3 class="hanzi">“Giáo viên tiếng Trung của tôi” là:</h3><div class="choices"><label class="choice"><input type="radio" name="q2" /> 我中文老师</label><label class="choice"><input type="radio" name="q2" /> 我的中文老师</label><label class="choice"><input type="radio" name="q2" /> 中文我的老师</label></div></article>
          <div class="form-actions"><button class="button" type="button">Nộp bài</button><button class="button button--quiet" type="button">Lưu tạm</button></div>
        </div>
      </section>
      <aside class="side-rail"><p class="overline">Tiến độ</p><strong class="progress-number">2 / 8 câu</strong><div class="progress"><span></span></div><div class="side-note"><h3>Gợi ý</h3><p>Đọc kỹ chữ Hán trong câu trước khi chọn đáp án.</p></div></aside>
    </div>
  `;
}

function teacherSubmissions() {
  return `
    <div class="screen-heading"><div><p class="overline">Giáo viên</p><h2>Bài nộp của học sinh</h2><p class="screen-lede">Xem và chấm bài theo từng bài học.</p></div><button class="button button--quiet" type="button">Lọc bài nộp</button></div>
    <section class="content-panel"><div class="content-panel__header"><h3>HSK1 Bài 1-5</h3><span class="muted">3 bài nộp</span></div><div class="table-wrap"><table><thead><tr><th>Tên học sinh</th><th>Bài</th><th>Kết quả</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      <tr><td><strong>Test học sinh</strong><small class="submission-id">HSK1-8C24</small></td><td>HSK1 Bài 1-5</td><td>0% · 0/53</td><td>${status('done', 'Đã chấm · 10')}</td><td><button class="button button--secondary" data-screen="grading-detail" type="button">Chấm bài</button></td></tr>
      <tr><td><strong>Nguyễn Minh Anh</strong><small class="submission-id">HSK1-5F19</small></td><td>HSK1 Bài 1-5</td><td>42% · 22/53</td><td>${status('wait', 'Chờ chấm')}</td><td><button class="button button--secondary" data-screen="grading-detail" type="button">Chấm bài</button></td></tr>
      <tr><td><strong>Lê Hoàng Long</strong><small class="submission-id">HSK1-12A8</small></td><td>Bài chép từ mới</td><td>1 ảnh nộp</td><td>${status('done', 'Đã chấm · Đạt')}</td><td><button class="button button--secondary" data-screen="grading-detail" type="button">Chấm bài chép tay</button></td></tr>
    </tbody></table></div></section>
  `;
}

function gradingDetail() {
  return `
    <div class="screen-heading"><div><p class="overline">Bài nộp / HSK1 Bài 1-5</p><h2>Test học sinh</h2><p class="screen-lede">Lớp: Test lớp · Mã bài nộp: HSK1-8C24</p></div>${status('done', 'Đã chấm · 10')}</div>
    <div class="grading-layout"><section class="submission-document"><p class="overline">Bài làm tự luận</p><p class="hanzi document-line">我叫安妮，是法国人。我是学生。</p><p class="pinyin">Wǒ jiào Ānnī, shì Fǎguó rén. Wǒ shì xuésheng.</p><p class="hanzi document-line">王老师是我的中文老师，他是中国人。</p><p class="pinyin">Wáng lǎoshī shì wǒ de Zhōngwén lǎoshī, tā shì Zhōngguó rén.</p><div class="image-placeholder"><span>1 ảnh bài nộp</span><small>Ảnh bài làm của học sinh</small></div></section><section class="content-panel grading-form"><div class="content-panel__header"><h3>Chấm bài</h3><button class="text-button" data-screen="teacher-submissions" type="button">Quay lại</button></div><div class="content-panel__body"><div class="score-line"><strong>10</strong><span>điểm bài tập</span></div><label class="field"><span>Điểm giáo viên</span><input value="10" /></label><label class="field"><span>Nhận xét</span><textarea>Phần đọc khá rõ. Chú ý thanh điệu trong câu thứ hai.</textarea></label><button class="button" type="button">Lưu chấm bài</button></div></section></div>
  `;
}

function studentResult() {
  return `
    <div class="screen-heading"><div><p class="overline">Kết quả bài làm</p><h2>Test học sinh</h2><p class="screen-lede">Lớp: Test lớp · Mã bài nộp: HSK1-8C24</p></div>${status('done', 'Đã chấm')}</div>
    <div class="result-grid"><div><span class="muted">Trắc nghiệm</span><strong>0%</strong><small>0/53 câu đúng</small></div><div><span class="muted">Điểm giáo viên</span><strong>10 điểm</strong><small>Kết quả tổng thể của bài tập</small></div></div>
    <section class="content-panel result-detail"><div class="content-panel__header"><h3>Chi tiết bài làm tự luận</h3></div><div class="content-panel__body"><div class="answer-row"><span class="hanzi">我叫安妮，是法国人。</span><small>Bài làm của bạn</small></div><div class="answer-row"><span class="hanzi">王老师是我的中文老师。</span><small>Bài làm của bạn</small></div></div></section>
  `;
}

const screenRenderers = { 'student-home': studentHome, 'student-exam': studentExam, 'teacher-submissions': teacherSubmissions, 'grading-detail': gradingDetail, 'student-result': studentResult };

function render() {
  const option = options[state.option];
  const screen = screens.find((item) => item.id === state.screen);
  document.body.dataset.option = state.option;
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <header class="app-header"><div><a class="app-brand" href="/">baitaphsk <span>design preview</span></a><p>Mini website để duyệt giao diện trước khi áp dụng vào app thật.</p></div><span class="preview-label">Prototype only</span></header>
      <main class="app-main">
        <section class="control-panel"><div class="control-heading"><div><p class="overline">Bước 1</p><h1>Chọn hướng giao diện</h1><p>Đang xem <strong>${option.name}</strong>: ${option.description}</p></div><span class="primary-note">Màu chính: ${option.color}</span></div><div class="option-switcher">${optionButtons()}</div><div class="screen-switcher"><p class="overline">Bước 2 · Chọn màn hình</p><div class="screen-buttons">${screenButtons()}</div></div></section>
        <section class="preview-frame"><div class="preview-frame__bar"><span>baitaphsk / ${screen.label}</span><span>${option.short} · ${option.name}</span></div><div class="preview-page">${screenRenderers[state.screen]()}</div></section>
      </main>
    </div>
  `;
}

document.addEventListener('click', (event) => {
  const optionButton = event.target.closest('[data-option]');
  const screenButton = event.target.closest('[data-screen]');
  if (optionButton) state = { ...state, option: optionButton.dataset.option };
  if (screenButton) state = { ...state, screen: screenButton.dataset.screen };
  if (optionButton || screenButton) render();
});

render();
