/**
 * Chế độ Học Tập & Ôn Luyện Chuẩn 4English:
 * 1. Ôn xáo trộn các từ theo cách Điền từ (Gõ từ).
 * 2. Sau đó xáo trộn để ôn Chọn nghĩa (Trắc nghiệm).
 * 3. Nếu chọn hoặc gõ sai ở bất kỳ phần nào: từ đó ở CẢ 2 PHẦN đều được đưa xuống cuối và xóa tiến độ trong lần học.
 * 4. Không cho đóng khi click ra ngoài backdrop để tránh mất tiến trình.
 * 5. Bấm nút ✕ sẽ có hộp thoại xác nhận rời.
 * 6. Lưu liên tục tiến trình vào localStorage; khi vào lại app sẽ hỏi người dùng có muốn tiếp tục lần học dở dang không.
 */

class StudyManager {
  constructor() {
    this.words = [];
    this.scopeTitle = '';
    this.wordProgressMap = new Map(); // wordId -> { passedTyping: boolean, passedChoice: boolean }
    this.typingQueue = []; // Hàng đợi các từ cần gõ
    this.choiceQueue = []; // Hàng đợi các từ cần chọn trắc nghiệm
    this.currentPhase = 'typing'; // 'typing' hoặc 'choice'
    this.currentQuizItem = null;
    this.waitingForTap = false;

    this.bindEvents();
  }

  bindEvents() {
    // Nút học theo ngày
    document.getElementById('btn-study-day')?.addEventListener('click', () => {
      this.startDayStudy();
    });

    // Nút đóng phòng học (X) có xác nhận rời
    document.getElementById('btn-close-study-room')?.addEventListener('click', () => {
      this.requestExit();
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
        if (e.target.closest('#quiz-audio-btn')) return;
        this.advanceToNextQuestion();
      }
    });

    // Restart Quiz
    document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
      this.initQuizState();
      this.saveSessionState();
      this.nextQuizQuestion();
    });
  }

  // === XỬ LÝ LƯU & KHÔI PHỤC TIẾN TRÌNH VÀO LOCALSTORAGE ===
  saveSessionState() {
    if (!this.words || this.words.length === 0) return;
    try {
      const state = {
        words: this.words,
        scopeTitle: this.scopeTitle,
        currentPhase: this.currentPhase,
        typingQueue: this.typingQueue,
        choiceQueue: this.choiceQueue,
        wordProgressList: Array.from(this.wordProgressMap.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem('english_study_session', JSON.stringify(state));
    } catch (e) {
      console.warn('Không thể lưu session:', e);
    }
  }

  clearSessionState() {
    try {
      localStorage.removeItem('english_study_session');
    } catch (e) {}
  }

  checkSavedSession() {
    try {
      const raw = localStorage.getItem('english_study_session');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.words) && saved.words.length > 0) {
        window.showConfirmDialog({
          title: 'Khôi phục phiên học?',
          message: `Bạn đang có một phiên học dở dang (${saved.words.length} từ vựng). Bạn có muốn tiếp tục phiên học trước đó không?`,
          confirmText: 'Tiếp tục học',
          cancelText: 'Bỏ qua',
          onConfirm: () => {
            this.restoreSession(saved);
          },
          onCancel: () => {
            this.clearSessionState();
          }
        });
      }
    } catch (err) {
      this.clearSessionState();
    }
  }

  restoreSession(saved) {
    this.words = saved.words;
    this.scopeTitle = saved.scopeTitle || '';
    this.currentPhase = saved.currentPhase || 'typing';
    this.typingQueue = saved.typingQueue || [];
    this.choiceQueue = saved.choiceQueue || [];
    this.wordProgressMap = new Map(saved.wordProgressList || []);
    this.waitingForTap = false;

    document.getElementById('view-congrats').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
    document.getElementById('modal-study-room').classList.add('active');

    this.nextQuizQuestion();
  }

  // === XÁC NHẬN RỜI PHÒNG HỌC ===
  requestExit() {
    const congratsView = document.getElementById('view-congrats');
    const isCompleted = congratsView && congratsView.style.display !== 'none';

    if (isCompleted) {
      this.clearSessionState();
      document.getElementById('modal-study-room').classList.remove('active');
      return;
    }

    window.showConfirmDialog({
      title: 'Rời phòng ôn tập?',
      message: 'Tiến trình ôn tập hiện tại của bạn sẽ bị hủy nếu bạn thoát bây giờ. Bạn có chắc chắn muốn rời đi không?',
      confirmText: 'Rời phòng học',
      cancelText: 'Tiếp tục học',
      onConfirm: () => {
        this.clearSessionState();
        document.getElementById('modal-study-room').classList.remove('active');
      }
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

    const toggle = document.getElementById('section-study-learned-toggle');
    if (toggle) {
      toggle.checked = false;
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

  // === 3. MỞ PHÒNG HỌC THEO QUY TẮC 4ENGLISH ===
  openStudyRoom(wordsList, scopeTitle) {
    this.words = wordsList;
    this.scopeTitle = scopeTitle;
    const modal = document.getElementById('modal-study-room');

    this.initQuizState();
    modal.classList.add('active');
    this.saveSessionState();
    this.nextQuizQuestion();
  }

  initQuizState() {
    this.wordProgressMap.clear();
    this.words.forEach(w => {
      this.wordProgressMap.set(w.id, {
        passedTyping: false,
        passedChoice: false
      });
    });

    // Phần 1: Xáo trộn các từ theo cách điền từ
    this.typingQueue = this.shuffle([...this.words]);
    this.choiceQueue = [];
    this.currentPhase = 'typing';
    this.waitingForTap = false;

    document.getElementById('view-congrats').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
  }

  // Cập nhật thanh tiến độ (theo % nhiệm vụ hoàn thành)
  updateProgressBar() {
    const totalTasks = this.words.length * 2;
    if (totalTasks === 0) return;

    let completedTasks = 0;
    this.words.forEach(w => {
      const p = this.wordProgressMap.get(w.id);
      if (p) {
        if (p.passedTyping) completedTasks++;
        if (p.passedChoice) completedTasks++;
      }
    });

    const percent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
    const fill = document.getElementById('study-progress-fill');
    if (fill) {
      fill.style.width = `${percent}%`;
    }
  }

  // Chọn câu hỏi tiếp theo
  nextQuizQuestion() {
    this.waitingForTap = false;
    document.getElementById('quiz-feedback-box').style.display = 'none';
    document.getElementById('quiz-tap-continue-prompt').style.display = 'none';

    this.updateProgressBar();

    // 1. Kiểm tra hàng đợi Điền từ (Giai đoạn 1)
    if (this.typingQueue.length > 0) {
      this.currentPhase = 'typing';
      const word = this.typingQueue[0];
      this.currentQuizItem = { word, type: 'typing' };
      this.renderQuizQuestion();
      this.saveSessionState();
      return;
    }

    // 2. Nếu Điền từ đã xong, chuyển sang Chọn nghĩa (Giai đoạn 2)
    // Nếu choiceQueue chưa có hoặc cần chuẩn bị cho các từ đã pass điền từ
    if (this.choiceQueue.length === 0) {
      // Lấy các từ chưa pass trắc nghiệm
      const pendingChoiceWords = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.passedTyping && !p.passedChoice;
      });

      if (pendingChoiceWords.length > 0) {
        // "sau đó sẽ xáo trộn để ôn chọn nghĩa"
        this.choiceQueue = this.shuffle([...pendingChoiceWords]);
      }
    }

    if (this.choiceQueue.length > 0) {
      this.currentPhase = 'choice';
      const word = this.choiceQueue[0];
      this.currentQuizItem = { word, type: 'choice' };
      this.renderQuizQuestion();
      this.saveSessionState();
      return;
    }

    // 3. Kiểm tra nếu còn từ nào chưa đạt cả 2 phần (do bị sai ở phần trắc nghiệm)
    const unfinishedWords = this.words.filter(w => {
      const p = this.wordProgressMap.get(w.id);
      return p && (!p.passedTyping || !p.passedChoice);
    });

    if (unfinishedWords.length > 0) {
      // Đưa những từ cần gõ lại vào typingQueue
      const needsTyping = unfinishedWords.filter(w => !this.wordProgressMap.get(w.id).passedTyping);
      if (needsTyping.length > 0) {
        this.typingQueue = this.shuffle([...needsTyping]);
      } else {
        this.choiceQueue = this.shuffle([...unfinishedWords]);
      }
      this.nextQuizQuestion();
      return;
    }

    // 4. Nếu toàn bộ từ đã pass cả 2 phần -> Kết thúc phiên ôn tập thành công!
    this.clearSessionState();
    this.showCompletionScreen();
  }

  renderQuizQuestion() {
    const item = this.currentQuizItem;
    const w = item.word;

    const badge = document.getElementById('quiz-badge');
    const questionText = document.getElementById('quiz-question-text');
    const questionSubtext = document.getElementById('quiz-question-subtext');
    const audioBtn = document.getElementById('quiz-audio-btn');
    const optionsContainer = document.getElementById('quiz-options-container');
    const typingContainer = document.getElementById('quiz-typing-container');

    if (item.type === 'typing') {
      badge.className = 'quiz-type-badge badge-type';
      badge.textContent = 'ĐIỀN TỪ: NHẬP TỪ TIẾNG ANH TƯƠNG ỨNG';

      // Phần 1 (Điền từ): Hiện nghĩa tiếng Việt làm câu hỏi
      questionText.textContent = w.meaning;
      questionSubtext.textContent = w.ipa || '';
      audioBtn.style.display = 'none'; // Ẩn audio trước khi trả lời

      optionsContainer.style.display = 'none';
      typingContainer.style.display = 'flex';

      const input = document.getElementById('quiz-typing-input');
      input.value = '';
      setTimeout(() => {
        input.focus();
        input.select();
        input.click();
      }, 60);

    } else {
      badge.className = 'quiz-type-badge badge-choice';
      badge.textContent = 'TRẮC NGHIỆM: CHỌN NGHĨA TIẾNG VIỆT ĐÚNG';

      // Phần 2 (Chọn nghĩa): Hiện từ tiếng Anh
      questionText.textContent = w.word;
      questionSubtext.textContent = w.ipa || '';
      audioBtn.style.display = 'inline-flex';

      optionsContainer.style.display = 'grid';
      typingContainer.style.display = 'none';

      const options = this.generateChoiceOptions(w);
      optionsContainer.innerHTML = options.map((opt, idx) => `
        <button type="button" class="quiz-option-btn" onclick="studyManager.handleChoiceAnswer('${this.escapeJs(opt.text)}', ${opt.isCorrect})">
          <span style="opacity: 0.6; font-weight: 700;">${String.fromCharCode(65 + idx)}.</span>
          <span>${this.escapeHtml(opt.text)}</span>
        </button>
      `).join('');
    }
  }

  generateChoiceOptions(correctWord) {
    const options = [{ text: correctWord.meaning, isCorrect: true }];

    const otherWords = this.words.filter(w => w.id !== correctWord.id);
    const shuffledOthers = this.shuffle([...otherWords]);

    for (const other of shuffledOthers) {
      if (options.length < 4 && !options.some(o => o.text === other.meaning)) {
        options.push({ text: other.meaning, isCorrect: false });
      }
    }

    const dummyMeanings = ['thành công', 'sáng tạo', 'kiên trì', 'phát triển', 'quan trọng', 'hạnh phúc', 'nỗ lực', 'thay đổi', 'chính xác', 'cơ hội'];
    for (const dummy of dummyMeanings) {
      if (options.length < 4 && !options.some(o => o.text === dummy)) {
        options.push({ text: dummy, isCorrect: false });
      }
    }

    return this.shuffle(options);
  }

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

  handleTypingSubmit() {
    if (this.waitingForTap) return;

    const input = document.getElementById('quiz-typing-input');
    const val = input.value.trim().toLowerCase();
    const correctWord = this.currentQuizItem.word.word.trim().toLowerCase();

    const isCorrect = val === correctWord;
    this.processAnswerResult(isCorrect, 'typing');
  }

  processAnswerResult(isCorrect, type) {
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const tapPrompt = document.getElementById('quiz-tap-continue-prompt');
    const wordObj = this.currentQuizItem.word;
    const progress = this.wordProgressMap.get(wordObj.id);

    // Phát âm thanh đọc từ vựng ngay khi trả lời
    if (window.wordsManager) {
      window.wordsManager.playPronunciation(wordObj.word, wordObj.audioUrl);
    }

    feedbackBox.style.display = 'block';

    if (isCorrect) {
      feedbackBox.style.background = 'rgba(52, 199, 89, 0.15)';
      feedbackBox.style.color = '#34c759';
      feedbackBox.style.border = '1px solid rgba(52, 199, 89, 0.3)';

      if (type === 'typing') {
        // Đúng phần Điền từ -> Bỏ khỏi hàng đợi gõ, đánh dấu passedTyping
        this.typingQueue.shift();
        progress.passedTyping = true;
        feedbackBox.innerHTML = `✔ <strong>Chính xác!</strong> Bạn đã gõ đúng từ: <strong>${this.escapeHtml(wordObj.word)}</strong>`;
      } else {
        // Đúng phần Trắc nghiệm -> Bỏ khỏi hàng đợi trắc nghiệm, đánh dấu passedChoice
        this.choiceQueue.shift();
        progress.passedChoice = true;
        feedbackBox.innerHTML = `✔ <strong>Chính xác!</strong>`;
      }

    } else {
      // QUY TẮC 4ENGLISH:
      // "nếu chọn sai thì từ đó ở cả 2 phần đều được đưa xuống cuối và xóa tiến độ của từ đó hiện tại trong lần học."
      progress.passedTyping = false;
      progress.passedChoice = false;

      feedbackBox.style.background = 'rgba(255, 69, 58, 0.15)';
      feedbackBox.style.color = '#ff6b6b';
      feedbackBox.style.border = '1px solid rgba(255, 69, 58, 0.3)';

      if (type === 'typing') {
        // Sai ở phần Điền từ: Đưa xuống cuối hàng đợi Điền từ
        const failedWord = this.typingQueue.shift();
        this.typingQueue.push(failedWord);

        feedbackBox.innerHTML = `
          ❌ <strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>"${this.escapeHtml(wordObj.word)}"</strong>.<br>
          <span style="font-size: 0.82rem; opacity: 0.85;">Từ này đã được đưa xuống cuối để luyện tập lại.</span>
        `;
      } else {
        // Sai ở phần Chọn nghĩa: Bị xóa tiến độ cả 2 phần, đưa xuống cuối hàng đợi Điền từ để học lại cả 2 phần!
        const failedWord = this.choiceQueue.shift();
        this.typingQueue.push(failedWord); // Đưa về lại hàng đợi điền từ

        feedbackBox.innerHTML = `
          ❌ <strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>"${this.escapeHtml(wordObj.meaning)}"</strong>.<br>
          <span style="font-size: 0.82rem; opacity: 0.85;">Tiến trình từ này bị reset và đưa xuống cuối để ôn lại cả 2 phần (điền từ & chọn nghĩa).</span>
        `;
      }
    }

    this.updateProgressBar();
    this.saveSessionState();

    this.waitingForTap = true;
    tapPrompt.style.display = 'block';
  }

  advanceToNextQuestion() {
    this.nextQuizQuestion();
  }

  // === 4. KHI ÔN TẬP XONG: HIỂN THỊ DANH SÁCH CÁC TỪ VỪA HỌC KÈM NÚT SỬA TRẠNG THÁI ===
  showCompletionScreen() {
    document.getElementById('view-quiz').style.display = 'none';
    const congratsView = document.getElementById('view-congrats');
    congratsView.style.display = 'block';

    const fill = document.getElementById('study-progress-fill');
    if (fill) fill.style.width = '100%';

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
          <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái">
            <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="studyManager.toggleWordLearnedSummary(${w.id}, this.checked)">
            <span class="ios-slider"></span>
          </label>
        </td>
      </tr>
    `).join('');
  }

  async toggleWordLearnedSummary(wordId, newStatus) {
    try {
      const res = await window.api.toggleWordLearned(wordId);
      if (res.success) {
        const w = this.words.find(x => x.id === wordId);
        if (w) w.isLearned = res.data.isLearned;

        if (window.treeViewManager) window.treeViewManager.loadTree();
        if (window.wordsManager && window.treeViewManager?.currentDayId) {
          window.wordsManager.loadWords(window.treeViewManager.currentDayId);
        }
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  }

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
