/**
 * Chế độ Học Tập & Ôn Luyện Thông Minh (Unified Smart Study):
 * - Tự động tạo sẵn và xáo trộn các câu hỏi trắc nghiệm & gõ từ đan xen (không cần tab)
 * - Khi trả lời: tự động phát âm đọc từ đó
 * - Giữ nguyên kết quả đúng/sai trên màn hình, nhấn vào bất kỳ đâu để sang câu tiếp theo
 * - Đối với câu hỏi gõ từ: tự động focus input để người dùng không phải bấm chuột/chạm tay lại
 * - Khi sai 1 câu: chỉ reset tiến trình của riêng từ bị sai (các từ khác giữ nguyên tiến trình)
 * - Khi ôn tập xong: hiển thị danh sách các từ vừa học kèm nút gạt iPhone để sửa trạng thái Đã thuộc / Chưa thuộc trực tiếp
 */

class StudyManager {
  constructor() {
    this.words = [];
    this.TARGET_CHOICE = 2; // Số lần trắc nghiệm cần đúng cho mỗi từ
    this.TARGET_TYPING = 2; // Số lần gõ đúng cho mỗi từ

    this.wordProgressMap = new Map(); // wordId -> { choiceCount, typingCount, isMastered }
    this.currentQuizItem = null;
    this.lastWordId = null;
    this.waitingForTap = false; // Cờ chờ người dùng chạm bất kỳ đâu để sang câu tiếp theo

    this.bindEvents();
  }

  bindEvents() {
    // Nút học theo ngày
    document.getElementById('btn-study-day')?.addEventListener('click', () => {
      this.startDayStudy();
    });

    // Modal chọn ngày ôn theo phần
    document.getElementById('btn-select-all-days')?.addEventListener('click', () => {
      document.querySelectorAll('#section-days-checklist input[type="checkbox"]').forEach(cb => cb.checked = true);
    });
    document.getElementById('btn-deselect-all-days')?.addEventListener('click', () => {
      document.querySelectorAll('#section-days-checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
    document.getElementById('btn-start-section-study')?.addEventListener('click', () => {
      this.startSectionStudy();
    });

    // Audio Quiz
    document.getElementById('quiz-audio-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentQuizItem && window.wordsManager) {
        window.wordsManager.playPronunciation(this.currentQuizItem.word.word, this.currentQuizItem.word.audioUrl);
      }
    });

    // Submit gõ từ chính tả
    document.getElementById('btn-submit-typing')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTypingSubmit();
    });
    document.getElementById('quiz-typing-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        this.handleTypingSubmit();
      }
    });

    // Nhấn vào bất kỳ đâu trong phòng học để sang câu tiếp theo khi đang hiển thị kết quả
    const studyArea = document.getElementById('study-interactive-area');
    studyArea?.addEventListener('click', (e) => {
      if (this.waitingForTap) {
        // Tránh trigger khi bấm nút audio
        if (e.target.closest('#quiz-audio-btn')) return;
        this.advanceToNextQuestion();
      }
    });

    // Restart Quiz
    document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
      this.initQuizState();
      this.nextQuizQuestion();
    });
  }

  // === 1. BẮT ĐẦU HỌC THEO NGÀY ===
  async startDayStudy() {
    const dayId = window.treeViewManager?.currentDayId;
    if (!dayId) {
      alert('Vui lòng chọn một Ngày học trước.');
      return;
    }

    const filter = window.wordsManager?.currentFilter || 'unlearned';
    try {
      const res = await window.api.getWords(dayId, filter);
      if (!res.success || res.data.length === 0) {
        const filterText = filter === 'unlearned' ? 'chưa thuộc' : 'đã thuộc';
        alert(`Không có từ nào ${filterText} trong ngày này để ôn tập.`);
        return;
      }

      const dayObj = await window.api.getDay(dayId);
      const title = dayObj.data ? dayObj.data.title : `Ngày ${dayId}`;

      this.openStudyRoom(res.data, `Học theo Ngày: ${title}`);
    } catch (err) {
      alert('Lỗi tải từ ôn tập: ' + err.message);
    }
  }

  // === 2. MỞ MODAL CHỌN NGÀY ÔN THEO PHẦN ===
  openSectionStudyModal(sectionId = null) {
    const secId = sectionId || window.treeViewManager?.currentSectionId;
    if (!secId) {
      alert('Vui lòng chọn một Phần trước.');
      return;
    }

    const section = window.treeViewManager.sections.find(s => s.id === secId);
    if (!section || !section.days || section.days.length === 0) {
      alert('Phần này chưa có Ngày nào.');
      return;
    }

    const checklist = document.getElementById('section-days-checklist');
    checklist.innerHTML = section.days.map(day => `
      <label class="day-check-item">
        <input type="checkbox" value="${day.id}" checked>
        <span style="font-weight: 500;">${this.escapeHtml(day.title)}</span>
        <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: auto;">
          (${day.totalWords} từ)
        </span>
      </label>
    `).join('');

    // Khởi tạo toggle filter trong modal
    const toggle = document.getElementById('section-study-learned-toggle');
    if (toggle) {
      toggle.checked = false; // Mặc định là Chưa thuộc
      this.updateSectionStudyFilterLabels(false);
      toggle.onchange = () => this.updateSectionStudyFilterLabels(toggle.checked);
    }

    document.getElementById('modal-section-study').classList.add('active');
  }

  updateSectionStudyFilterLabels(isLearned) {
    const unlearned = document.getElementById('label-section-study-unlearned');
    const learned = document.getElementById('label-section-study-learned');
    if (isLearned) {
      learned.classList.add('active');
      unlearned.classList.remove('active');
    } else {
      unlearned.classList.add('active');
      learned.classList.remove('active');
    }
  }

  // Bắt đầu ôn sau khi chọn các ngày trong phần
  async startSectionStudy() {
    const checkedBoxes = document.querySelectorAll('#section-days-checklist input[type="checkbox"]:checked');
    const dayIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    if (dayIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ngày để ôn tập.');
      return;
    }

    const isLearned = document.getElementById('section-study-learned-toggle').checked;
    const status = isLearned ? 'learned' : 'unlearned';

    try {
      const res = await window.api.getWordsByDays(dayIds, status);
      if (!res.success || res.data.length === 0) {
        const filterText = isLearned ? 'đã thuộc' : 'chưa thuộc';
        alert(`Không tìm thấy từ nào ${filterText} trong các ngày đã chọn.`);
        return;
      }

      document.getElementById('modal-section-study').classList.remove('active');
      this.openStudyRoom(res.data, `Ôn tập Phần (${dayIds.length} ngày)`);
    } catch (err) {
      alert('Lỗi tải từ: ' + err.message);
    }
  }

  // === 3. MỞ PHÒNG HỌC (Không cần chuyển tab, tạo sẵn câu hỏi xáo trộn) ===
  openStudyRoom(wordsList, scopeTitle) {
    this.words = wordsList;
    const modal = document.getElementById('modal-study-room');

    document.getElementById('study-room-title').textContent = '🎯 ' + scopeTitle;
    document.getElementById('study-scope-desc').textContent = `Tổng số: ${wordsList.length} từ vựng`;

    this.initQuizState();
    modal.classList.add('active');
    this.nextQuizQuestion();
  }

  initQuizState() {
    this.wordProgressMap.clear();
    this.lastWordId = null;
    this.waitingForTap = false;

    // Khởi tạo tiến trình mục tiêu cho mỗi từ
    for (const w of this.words) {
      this.wordProgressMap.set(w.id, {
        choiceCount: 0,
        typingCount: 0,
        isMastered: false
      });
    }

    document.getElementById('view-congrats').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
  }

  // Chọn câu hỏi tiếp theo đan xen
  nextQuizQuestion() {
    this.waitingForTap = false;
    document.getElementById('quiz-feedback-box').style.display = 'none';
    document.getElementById('quiz-tap-continue-prompt').style.display = 'none';

    // 1. Lọc danh sách các từ CHƯA thuộc mục tiêu
    const remainingWords = this.words.filter(w => {
      const p = this.wordProgressMap.get(w.id);
      return p && !p.isMastered;
    });

    // Cập nhật thanh tiến độ
    const totalWords = this.words.length;
    const masteredWords = totalWords - remainingWords.length;
    const percent = Math.round((masteredWords / totalWords) * 100);
    document.getElementById('study-progress-fill').style.width = `${percent}%`;
    document.getElementById('study-progress-text').textContent = `${masteredWords}/${totalWords} từ thành thạo`;

    // Nếu đã hoàn thành tất cả từ -> Sang màn hình chúc mừng & danh sách từ vừa học
    if (remainingWords.length === 0) {
      this.showCompletionScreen();
      return;
    }

    // 2. Chọn từ tiếp theo, tránh lặp lại từ vừa làm nếu còn nhiều từ (chống học máy móc)
    let candidateWords = remainingWords;
    if (remainingWords.length > 1 && this.lastWordId) {
      candidateWords = remainingWords.filter(w => w.id !== this.lastWordId);
    }
    const chosenWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
    this.lastWordId = chosenWord.id;

    const progress = this.wordProgressMap.get(chosenWord.id);

    // 3. Quyết định loại câu hỏi (Trắc nghiệm hoặc Gõ chính tả)
    let questionType = 'choice';
    if (progress.choiceCount < this.TARGET_CHOICE && progress.typingCount < this.TARGET_TYPING) {
      questionType = Math.random() > 0.5 ? 'choice' : 'typing';
    } else if (progress.choiceCount < this.TARGET_CHOICE) {
      questionType = 'choice';
    } else {
      questionType = 'typing';
    }

    this.currentQuizItem = {
      word: chosenWord,
      type: questionType,
      progress
    };

    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    const item = this.currentQuizItem;
    const w = item.word;

    const badge = document.getElementById('quiz-badge');
    const questionText = document.getElementById('quiz-question-text');
    const questionSubtext = document.getElementById('quiz-question-subtext');
    const masteryHint = document.getElementById('quiz-word-mastery-hint');
    const optionsContainer = document.getElementById('quiz-options-container');
    const typingContainer = document.getElementById('quiz-typing-container');

    // Hiển thị tiến trình riêng của từ này
    masteryHint.textContent = `Tiến trình từ "${w.word}": Trắc nghiệm [${item.progress.choiceCount}/${this.TARGET_CHOICE}] • Gõ từ [${item.progress.typingCount}/${this.TARGET_TYPING}]`;

    if (item.type === 'choice') {
      badge.className = 'quiz-type-badge badge-choice';
      badge.textContent = 'Trắc nghiệm: Chọn nghĩa tiếng Việt đúng';

      questionText.textContent = w.word;
      questionSubtext.textContent = w.ipa || '';
      optionsContainer.style.display = 'grid';
      typingContainer.style.display = 'none';

      // Tạo 4 phương án trắc nghiệm
      const options = this.generateChoiceOptions(w);
      optionsContainer.innerHTML = options.map((opt, idx) => `
        <button type="button" class="quiz-option-btn" onclick="studyManager.handleChoiceAnswer('${this.escapeJs(opt.text)}', ${opt.isCorrect})">
          <span style="opacity: 0.6; font-weight: 700;">${String.fromCharCode(65 + idx)}.</span>
          <span>${this.escapeHtml(opt.text)}</span>
        </button>
      `).join('');

    } else {
      badge.className = 'quiz-type-badge badge-type';
      badge.textContent = 'Gõ từ chính tả: Nhập từ tiếng Anh tương ứng';

      questionText.textContent = w.meaning; // Hiện nghĩa tiếng Việt
      questionSubtext.textContent = w.example ? `Ví dụ: ${w.example}` : (w.ipa || '');
      optionsContainer.style.display = 'none';
      typingContainer.style.display = 'flex';

      // YÊU CẦU: Tự động mở input điện thoại hoặc nhấn sẵn vào input cho máy tính
      const input = document.getElementById('quiz-typing-input');
      input.value = '';
      setTimeout(() => {
        input.focus();
        input.select();
        input.click();
      }, 60);
    }
  }

  // Sinh 4 phương án cho trắc nghiệm
  generateChoiceOptions(correctWord) {
    const options = [{ text: correctWord.meaning, isCorrect: true }];

    const otherWords = this.words.filter(w => w.id !== correctWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());

    for (const other of shuffledOthers) {
      if (options.length < 4 && !options.some(o => o.text === other.meaning)) {
        options.push({ text: other.meaning, isCorrect: false });
      }
    }

    const dummyMeanings = ['thành công', 'sáng tạo', 'kiên trì', 'phát triển', 'quan trọng', 'hạnh phúc', 'nỗ lực', 'thay đổi'];
    for (const dummy of dummyMeanings) {
      if (options.length < 4 && !options.some(o => o.text === dummy)) {
        options.push({ text: dummy, isCorrect: false });
      }
    }

    return options.sort(() => 0.5 - Math.random());
  }

  // Xử lý khi chọn trắc nghiệm
  handleChoiceAnswer(selectedText, isCorrect) {
    if (this.waitingForTap) return;

    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.innerText.includes(this.currentQuizItem.word.meaning)) {
        btn.classList.add('correct');
      } else if (btn.innerText.includes(selectedText) && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    this.processAnswerResult(isCorrect, 'choice');
  }

  // Xử lý khi gõ từ chính tả
  handleTypingSubmit() {
    if (this.waitingForTap) return;

    const input = document.getElementById('quiz-typing-input');
    const val = input.value.trim().toLowerCase();
    const correctWord = this.currentQuizItem.word.word.trim().toLowerCase();

    const isCorrect = val === correctWord;
    this.processAnswerResult(isCorrect, 'typing');
  }

  /**
   * Xử lý kết quả câu trả lời:
   * 1. Phát âm thanh đọc từ đó ngay lập tức
   * 2. Nếu sai: CHỈ reset tiến trình của riêng từ bị sai
   * 3. Giữ nguyên trên màn hình, chờ người dùng bấm vào bất kỳ đâu để sang câu tiếp theo
   */
  processAnswerResult(isCorrect, type) {
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const tapPrompt = document.getElementById('quiz-tap-continue-prompt');
    const wordId = this.currentQuizItem.word.id;
    const progress = this.wordProgressMap.get(wordId);
    const wordObj = this.currentQuizItem.word;

    // YÊU CẦU: Phát âm thanh đọc từ đó
    if (window.wordsManager) {
      window.wordsManager.playPronunciation(wordObj.word, wordObj.audioUrl);
    }

    feedbackBox.style.display = 'block';

    if (isCorrect) {
      feedbackBox.style.background = 'rgba(52, 199, 89, 0.15)';
      feedbackBox.style.color = '#34c759';
      feedbackBox.style.border = '1px solid rgba(52, 199, 89, 0.3)';

      if (type === 'choice') {
        progress.choiceCount += 1;
        feedbackBox.innerHTML = `✔ <strong>Chính xác!</strong> Từ "${this.escapeHtml(wordObj.word)}": [${progress.choiceCount}/${this.TARGET_CHOICE} trắc nghiệm]`;
      } else {
        progress.typingCount += 1;
        feedbackBox.innerHTML = `✔ <strong>Tuyệt vời!</strong> Bạn đã gõ đúng từ: <strong>${this.escapeHtml(wordObj.word)}</strong> [${progress.typingCount}/${this.TARGET_TYPING} gõ từ]`;
      }

      if (progress.choiceCount >= this.TARGET_CHOICE && progress.typingCount >= this.TARGET_TYPING) {
        progress.isMastered = true;
        feedbackBox.innerHTML = `🌟 <strong>Xuất sắc!</strong> Từ "<strong>${this.escapeHtml(wordObj.word)}</strong>" đã đạt mục tiêu thành thạo!`;
      }

    } else {
      // YÊU CẦU: Nếu làm sai 1 câu sẽ reset tiến trình cho từ bị sai, từ khác không ảnh hưởng
      progress.choiceCount = 0;
      progress.typingCount = 0;
      progress.isMastered = false;

      feedbackBox.style.background = 'rgba(255, 69, 58, 0.15)';
      feedbackBox.style.color = '#ff6b6b';
      feedbackBox.style.border = '1px solid rgba(255, 69, 58, 0.3)';

      const correctAnswer = type === 'choice' ? wordObj.meaning : wordObj.word;

      feedbackBox.innerHTML = `
        ❌ <strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>"${this.escapeHtml(correctAnswer)}"</strong>.<br>
        <span style="font-size: 0.82rem; opacity: 0.85;">Tiến trình của từ này được reset để luyện tập lại. Các từ khác giữ nguyên 100%.</span>
      `;
    }

    // YÊU CẦU: Giữ nguyên và khi nhấn vào bất kỳ đâu sẽ chuyển sang câu tiếp theo
    this.waitingForTap = true;
    tapPrompt.style.display = 'block';
  }

  // Chuyển sang câu hỏi kế tiếp khi người dùng chạm bất kỳ đâu
  advanceToNextQuestion() {
    this.nextQuizQuestion();
  }

  // === 4. KHI ÔN TẬP XONG: HIỂN THỊ DANH SÁCH CÁC TỪ VỪA HỌC KÈM NÚT SỬA TRẠNG THÁI ===
  showCompletionScreen() {
    document.getElementById('view-quiz').style.display = 'none';
    const congratsView = document.getElementById('view-congrats');
    congratsView.style.display = 'block';

    const tbody = document.getElementById('summary-words-tbody');
    tbody.innerHTML = this.words.map((w, index) => `
      <tr>
        <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
        <td>
          <div style="font-weight: 700; color: #ffffff; font-size: 1rem;">${this.escapeHtml(w.word)}</div>
          ${w.ipa ? `<div style="font-size: 0.82rem; color: var(--accent-cyan); font-family: monospace;">${this.escapeHtml(w.ipa)}</div>` : ''}
        </td>
        <td>
          <button type="button" class="btn-audio" title="Nghe" onclick="wordsManager.playPronunciation('${this.escapeJs(w.word)}', '${w.audioUrl || ''}')">
            🔊
          </button>
        </td>
        <td style="color: var(--text-primary); font-weight: 500;">
          ${this.escapeHtml(w.meaning)}
        </td>
        <td style="text-align: center;">
          <!-- Nút gạt iPhone đổi trạng thái Đã thuộc / Chưa thuộc trực tiếp -->
          <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái">
            <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="studyManager.toggleWordLearnedSummary(${w.id}, this.checked)">
            <span class="ios-slider"></span>
          </label>
        </td>
      </tr>
    `).join('');
  }

  // Đổi trạng thái thuộc trực tiếp trên bảng tổng kết
  async toggleWordLearnedSummary(wordId, newStatus) {
    try {
      const res = await window.api.toggleWordLearned(wordId);
      if (res.success) {
        const w = this.words.find(x => x.id === wordId);
        if (w) w.isLearned = res.data.isLearned;

        // Cập nhật lại cây thư mục và bảng từ ngoài màn hình chính
        if (window.treeViewManager) window.treeViewManager.loadTree();
        if (window.wordsManager && window.treeViewManager?.currentDayId) {
          window.wordsManager.loadWords(window.treeViewManager.currentDayId);
        }
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  escapeJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
  }
}

window.studyManager = new StudyManager();
