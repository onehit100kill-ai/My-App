/**
 * Chế độ Học Tập & Ôn Luyện Chuẩn 4English:
 * 1. Ôn xáo trộn các từ theo cách Điền từ (Gõ từ).
 * 2. Sau đó xáo trộn để ôn Chọn nghĩa (Trắc nghiệm xếp 1 hàng dọc như 4English).
 * 3. Nếu chọn hoặc gõ sai ở bất kỳ phần nào: từ đó ở CẢ 2 PHẦN đều bị xóa tiến trình và đưa xuống cuối để ôn lại từ đầu.
 * 4. Tùy chỉnh số lần hoàn thành (targetTyping & targetChoice) qua modal Cài Đặt.
 * 5. Trên máy tính: chỉ cần nhấn Enter để nộp bài và nhấn Enter lần nữa để sang câu tiếp theo mà không cần dùng chuột.
 * 6. Trên điện thoại (iPhone 12 Pro Max & mobile): tự động focus và kích hoạt bàn phím ảo ngay khi vào câu điền từ mới.
 * 7. Nhấn vào bất kỳ đâu trên màn hình để chuyển câu khi có kết quả.
 * 8. Không đóng khi click ra ngoài backdrop để tránh mất tiến trình. Nút ✕ có xác nhận rời.
 * 9. Lưu liên tục tiến trình vào localStorage; khi vào lại app sẽ hỏi khôi phục phiên học dở dang.
 */

class StudyManager {
  constructor() {
    this.words = [];
    this.scopeTitle = '';
    this.wordProgressMap = new Map(); // wordId -> { typingCount: number, choiceCount: number }
    this.typingQueue = []; // Hàng đợi các từ cần gõ
    this.choiceQueue = []; // Hàng đợi các từ cần chọn trắc nghiệm
    this.currentPhase = 'typing'; // 'typing' hoặc 'choice'
    this.currentQuizItem = null;
    this.waitingForTap = false;

    // Cài đặt số lần ôn tập (mặc định: 1 lần điền từ, 1 lần chọn nghĩa)
    this.targetTyping = 1;
    this.targetChoice = 1;

    this.loadSettings();
    this.bindEvents();
  }

  setWaitingForTap(val) {
    this.waitingForTap = val;
    const modal = document.getElementById('modal-study-room');
    if (val) {
      modal?.classList.add('waiting-for-tap');
    } else {
      modal?.classList.remove('waiting-for-tap');
    }
  }

  // === XỬ LÝ FOCUS ĐỒNG BỘ TRÊN MOBILE ===
  prepareFocusForMobile() {
    const modal = document.getElementById('modal-study-room');
    const input = document.getElementById('quiz-typing-input');
    const quizView = document.getElementById('view-quiz');
    const typingContainer = document.getElementById('quiz-typing-container');

    if (modal && input && quizView && typingContainer) {
      modal.classList.add('active');
      modal.style.opacity = '0.01'; // Ẩn trực quan nhưng vẫn render để focus
      quizView.style.display = 'block';
      typingContainer.style.display = 'flex';
      input.focus();
      input.click();
    }
  }

  // === CÀI ĐẶT SỐ LẦN ÔN TẬP ===
  loadSettings() {
    try {
      const raw = localStorage.getItem('study_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.targetTyping = Math.max(1, Math.min(10, parseInt(parsed.targetTyping, 10) || 1));
        this.targetChoice = Math.max(1, Math.min(10, parseInt(parsed.targetChoice, 10) || 1));
      }
    } catch (e) {
      this.targetTyping = 1;
      this.targetChoice = 1;
    }
    this.updateSettingsUI();
  }

  saveSettings(typingVal, choiceVal) {
    this.targetTyping = Math.max(1, Math.min(10, parseInt(typingVal, 10) || 1));
    this.targetChoice = Math.max(1, Math.min(10, parseInt(choiceVal, 10) || 1));
    try {
      localStorage.setItem('study_settings', JSON.stringify({
        targetTyping: this.targetTyping,
        targetChoice: this.targetChoice
      }));
    } catch (e) {}
    this.updateSettingsUI();
  }

  updateSettingsUI() {
    const typingInput = document.getElementById('setting-target-typing');
    const choiceInput = document.getElementById('setting-target-choice');
    if (typingInput) typingInput.value = this.targetTyping;
    if (choiceInput) choiceInput.value = this.targetChoice;
  }

  bindEvents() {
    // --- CÀI ĐẶT (SETTINGS) MODAL ---
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    btnOpenSettings?.addEventListener('click', () => {
      this.updateSettingsUI();
      modalSettings?.classList.add('active');
    });

    // Steppers cho Điền từ
    document.getElementById('btn-dec-typing')?.addEventListener('click', () => {
      const input = document.getElementById('setting-target-typing');
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) input.value = val - 1;
    });
    document.getElementById('btn-inc-typing')?.addEventListener('click', () => {
      const input = document.getElementById('setting-target-typing');
      let val = parseInt(input.value, 10) || 1;
      if (val < 10) input.value = val + 1;
    });

    // Steppers cho Chọn nghĩa
    document.getElementById('btn-dec-choice')?.addEventListener('click', () => {
      const input = document.getElementById('setting-target-choice');
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) input.value = val - 1;
    });
    document.getElementById('btn-inc-choice')?.addEventListener('click', () => {
      const input = document.getElementById('setting-target-choice');
      let val = parseInt(input.value, 10) || 1;
      if (val < 10) input.value = val + 1;
    });

    // Lưu cài đặt
    btnSaveSettings?.addEventListener('click', () => {
      const typingVal = document.getElementById('setting-target-typing')?.value || 1;
      const choiceVal = document.getElementById('setting-target-choice')?.value || 1;
      this.saveSettings(typingVal, choiceVal);
      modalSettings?.classList.remove('active');
      if (window.showToast) {
        window.showToast('Đã lưu cài đặt ôn tập thành công!');
      }
    });

    // --- PHÒNG HỌC (STUDY ROOM) ---
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

    // Nút Hoàn tất
    document.getElementById('btn-finish-study')?.addEventListener('click', () => {
      this.requestExit();
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

    // Xử lý phím Enter trên ô gõ từ:
    // 1. Chưa submit -> Enter để nộp bài
    // 2. Đã có kết quả (waitingForTap) -> Enter để chuyển sang câu tiếp theo ngay lập tức (không cần dùng chuột)
    document.getElementById('quiz-typing-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this.waitingForTap) {
          this.advanceToNextQuestion();
        } else {
          this.handleTypingSubmit();
        }
      }
    });

    // Xử lý phím Enter / Phím tắt toàn cục khi phòng ôn tập đang mở
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal-study-room');
      if (!modal || !modal.classList.contains('active')) return;

      // Nếu đang đợi bấm bất kỳ để chuyển câu -> Enter hoặc Phím cách chuyển câu ngay!
      if (this.waitingForTap && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.stopPropagation();
        this.advanceToNextQuestion();
        return;
      }

      // Phím tắt bàn phím tiện lợi cho câu trắc nghiệm (1, 2, 3, 4 hoặc A, B, C, D)
      if (!this.waitingForTap && !this._choiceAnswered && this.currentQuizItem?.type === 'choice') {
        const key = e.key.toUpperCase();
        let optionIndex = -1;
        if (key === '1' || key === 'A') optionIndex = 0;
        else if (key === '2' || key === 'B') optionIndex = 1;
        else if (key === '3' || key === 'C') optionIndex = 2;
        else if (key === '4' || key === 'D') optionIndex = 3;

        if (optionIndex >= 0) {
          const btns = document.querySelectorAll('.quiz-option-btn');
          if (btns[optionIndex] && !btns[optionIndex].classList.contains('disabled')) {
            e.preventDefault();
            btns[optionIndex].click();
          }
        }
      }
    });

    // Nhấn vào BẤT KỲ ĐÂU trên toàn màn hình (khoảng trống, nền, thẻ câu hỏi, các ô lựa chọn...) để sang câu tiếp theo
    const handleStudyGlobalTap = (e) => {
      const modal = document.getElementById('modal-study-room');
      if (!modal || !modal.classList.contains('active')) return;
      if (!this.waitingForTap) return;

      // Đừng chuyển câu nếu bấm nút phát âm thanh hoặc nút đóng phòng học
      if (e.target.closest('#quiz-audio-btn') || e.target.closest('#btn-close-study-room')) {
        return;
      }

      // Đừng can thiệp nếu người dùng đang ở màn hình chúc mừng / tổng kết
      const congratsView = document.getElementById('view-congrats');
      if (congratsView && congratsView.style.display !== 'none') {
        return;
      }

      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.advanceToNextQuestion();
    };

    // Bắt sự kiện click toàn cục ở Capture Phase để bao quát 100% màn hình
    document.addEventListener('click', handleStudyGlobalTap, true);

    // Hỗ trợ cảm ứng điện thoại (iOS Safari, Android Chrome) tức thì
    document.addEventListener('touchend', (e) => {
      if (this.waitingForTap) {
        const modal = document.getElementById('modal-study-room');
        if (!modal || !modal.classList.contains('active')) return;
        if (e.target.closest('#quiz-audio-btn') || e.target.closest('#btn-close-study-room')) return;
        const congratsView = document.getElementById('view-congrats');
        if (congratsView && congratsView.style.display !== 'none') return;

        handleStudyGlobalTap(e);
      }
    }, { passive: false });

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
    
    // Tối ưu hóa: Dùng setTimeout (debounce) để tránh block luồng giao diện chính
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    
    this._saveTimeout = setTimeout(() => {
      try {
        const state = {
          // Lưu trực tiếp vào localStorage nhưng thay mảng object bằng mảng ID cho hàng đợi
          words: this.words,
          scopeTitle: this.scopeTitle,
          currentPhase: this.currentPhase,
          typingQueue: this.typingQueue.map(w => w.id), // Tối ưu bộ nhớ
          choiceQueue: this.choiceQueue.map(w => w.id), // Tối ưu bộ nhớ
          wordProgressList: Array.from(this.wordProgressMap.entries()),
          targetTyping: this.targetTyping,
          targetChoice: this.targetChoice,
          timestamp: Date.now()
        };
        localStorage.setItem('english_study_session', JSON.stringify(state));
      } catch (e) {
        console.warn('Không thể lưu session:', e);
      }
    }, 100);
  }

  clearSessionState() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
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
    this.words = saved.words || [];
    this.scopeTitle = saved.scopeTitle || '';
    this.currentPhase = saved.currentPhase || 'typing';
    
    // Tái tạo lại Object từ ID để tránh lỗi
    const wordMap = new Map(this.words.map(w => [w.id, w]));
    
    if (saved.typingQueue && saved.typingQueue.length > 0 && typeof saved.typingQueue[0] !== 'object') {
      this.typingQueue = saved.typingQueue.map(id => wordMap.get(id)).filter(Boolean);
    } else {
      this.typingQueue = saved.typingQueue || [];
    }
    
    if (saved.choiceQueue && saved.choiceQueue.length > 0 && typeof saved.choiceQueue[0] !== 'object') {
      this.choiceQueue = saved.choiceQueue.map(id => wordMap.get(id)).filter(Boolean);
    } else {
      this.choiceQueue = saved.choiceQueue || [];
    }

    this.wordProgressMap = new Map(saved.wordProgressList || []);
    if (saved.targetTyping) this.targetTyping = saved.targetTyping;
    if (saved.targetChoice) this.targetChoice = saved.targetChoice;
    this.setWaitingForTap(false);
    this._choiceAnswered = false;

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
      this.setWaitingForTap(false);
      const modal = document.getElementById('modal-study-room');
      if (modal) {
        modal.classList.remove('active');
        modal.style.opacity = '';
      }
      return;
    }

    window.showConfirmDialog({
      title: 'Rời phòng ôn tập?',
      message: 'Tiến trình ôn tập hiện tại của bạn sẽ bị hủy nếu bạn thoát bây giờ. Bạn có chắc chắn muốn rời đi không?',
      confirmText: 'Rời phòng học',
      cancelText: 'Tiếp tục học',
      onConfirm: () => {
        this.clearSessionState();
        this.setWaitingForTap(false);
        const modal = document.getElementById('modal-study-room');
        if (modal) {
          modal.classList.remove('active');
          modal.style.opacity = '';
        }
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

    this.prepareFocusForMobile(); // Kích hoạt focus đồng bộ trước khi await

    try {
      // Chỉ lấy các từ Chưa thuộc (được đánh dấu để học)
      const res = await window.api.getWords(dayId, 'unlearned');
      if (res.success && res.data.length > 0) {
        const dayObj = await window.api.getDay(dayId);
        const title = dayObj.data ? dayObj.data.title : `Ngày ${dayId}`;
        this.openStudyRoom(res.data, `Học theo Ngày: ${title}`);
        return;
      }

      // Nếu không có từ chưa thuộc nào, kiểm tra xem có từ trong ngày không
      const resAll = await window.api.getWords(dayId, 'all');
      if (!resAll.success || resAll.data.length === 0) {
        alert('Ngày này chưa có từ vựng nào để ôn tập.');
        return;
      }

      // Nếu tất cả từ đã thuộc, hỏi người dùng có muốn ôn lại không
      const modal = document.getElementById('modal-study-room');
      if (modal) {
        modal.classList.remove('active');
        modal.style.opacity = '';
      }
      
      window.showConfirmDialog({
        title: 'Tất cả từ đã thuộc',
        message: 'Tất cả từ vựng trong ngày này đều đã được đánh dấu Đã thuộc. Bạn có muốn ôn lại toàn bộ không?',
        confirmText: 'Ôn lại toàn bộ',
        cancelText: 'Hủy',
        onConfirm: async () => {
          this.prepareFocusForMobile();
          const dayObj = await window.api.getDay(dayId);
          const title = dayObj.data ? dayObj.data.title : `Ngày ${dayId}`;
          this.openStudyRoom(resAll.data, `Ôn lại toàn bộ: ${title}`);
        }
      });
    } catch (err) {
      const modal = document.getElementById('modal-study-room');
      if (modal) {
        modal.classList.remove('active');
        modal.style.opacity = '';
      }
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

    this.prepareFocusForMobile();

    try {
      const res = await window.api.getWordsByDays(dayIds, status);
      if (!res.success || res.data.length === 0) {
        const modal = document.getElementById('modal-study-room');
        if (modal) {
          modal.classList.remove('active');
          modal.style.opacity = '';
        }
        const filterText = isLearned ? 'đã thuộc' : 'chưa thuộc';
        alert(`Không tìm thấy từ nào ${filterText} trong các ngày đã chọn.`);
        return;
      }

      document.getElementById('modal-section-study').classList.remove('active');
      this.openStudyRoom(res.data, `Ôn tập Phần (${dayIds.length} ngày)`);
    } catch (err) {
      const modal = document.getElementById('modal-study-room');
      if (modal) {
        modal.classList.remove('active');
        modal.style.opacity = '';
      }
      alert('Lỗi tải từ: ' + err.message);
    }
  }

  // === 3. MỞ PHÒNG HỌC THEO QUY TẮC 4ENGLISH ===
  openStudyRoom(wordsList, scopeTitle) {
    this.words = wordsList;
    this.scopeTitle = scopeTitle;
    this.loadSettings(); // Tải cài đặt mới nhất
    const modal = document.getElementById('modal-study-room');

    this.initQuizState();
    modal.classList.add('active');
    modal.style.opacity = '1'; // Phục hồi độ mờ
    this.saveSessionState();
    this.nextQuizQuestion();
  }

  initQuizState() {
    this.wordProgressMap.clear();
    this.words.forEach(w => {
      this.wordProgressMap.set(w.id, {
        typingCount: 0,
        choiceCount: 0
      });
    });

    // Phần 1: Xáo trộn các từ theo cách điền từ
    this.typingQueue = this.shuffle([...this.words]);
    this.choiceQueue = [];
    this.currentPhase = 'typing';
    this.setWaitingForTap(false);
    this._choiceAnswered = false;

    document.getElementById('view-congrats').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
  }

  // Cập nhật thanh tiến độ theo số lần hoàn thành mục tiêu cài đặt
  updateProgressBar() {
    const totalTasks = this.words.length * (this.targetTyping + this.targetChoice);
    if (totalTasks === 0) return;

    let completedTasks = 0;
    this.words.forEach(w => {
      const p = this.wordProgressMap.get(w.id);
      if (p) {
        completedTasks += Math.min(this.targetTyping, p.typingCount || 0);
        completedTasks += Math.min(this.targetChoice, p.choiceCount || 0);
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
    this.setWaitingForTap(false);
    this._choiceAnswered = false;
    const fb = document.getElementById('quiz-feedback-box');
    if (fb) fb.style.display = 'none';

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

    // 2. Nếu Điền từ đã xong, chuẩn bị hoặc tiếp tục Chọn nghĩa (Giai đoạn 2)
    if (this.choiceQueue.length === 0) {
      // Lấy các từ đã hoàn thành điền từ nhưng chưa đủ số lần chọn nghĩa
      const pendingChoiceWords = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.typingCount >= this.targetTyping && p.choiceCount < this.targetChoice;
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

    // 3. Kiểm tra nếu còn từ nào chưa đạt cả 2 phần (do bị sai và reset)
    const unfinishedTyping = this.words.filter(w => {
      const p = this.wordProgressMap.get(w.id);
      return p && p.typingCount < this.targetTyping;
    });

    if (unfinishedTyping.length > 0) {
      this.typingQueue = this.shuffle([...unfinishedTyping]);
      this.nextQuizQuestion();
      return;
    }

    const unfinishedChoice = this.words.filter(w => {
      const p = this.wordProgressMap.get(w.id);
      return p && p.choiceCount < this.targetChoice;
    });

    if (unfinishedChoice.length > 0) {
      this.choiceQueue = this.shuffle([...unfinishedChoice]);
      this.nextQuizQuestion();
      return;
    }

    // 4. Nếu toàn bộ từ đã pass cả 2 phần theo đúng target cài đặt -> Kết thúc phiên ôn tập thành công!
    this.clearSessionState();
    this.showCompletionScreen();
  }

  renderQuizQuestion() {
    const item = this.currentQuizItem;
    const w = item.word;
    const progress = this.wordProgressMap.get(w.id) || { typingCount: 0, choiceCount: 0 };

    const badge = document.getElementById('quiz-badge');
    const questionText = document.getElementById('quiz-question-text');
    const questionSubtext = document.getElementById('quiz-question-subtext');
    const audioBtn = document.getElementById('quiz-audio-btn');
    const optionsContainer = document.getElementById('quiz-options-container');
    const typingContainer = document.getElementById('quiz-typing-container');

    // Ẩn badge tiêu đề rườm rà theo yêu cầu của người dùng
    if (badge) badge.style.display = 'none';

    if (item.type === 'typing') {
      // Phần 1 (Điền từ): Hiện duy nhất nghĩa tiếng Việt làm câu hỏi, ẩn hoàn toàn phiên âm IPA
      questionText.textContent = w.meaning;
      if (questionSubtext) {
        questionSubtext.style.display = 'none';
        questionSubtext.textContent = '';
      }
      audioBtn.style.display = 'none'; // Ẩn audio trước khi trả lời

      optionsContainer.style.display = 'none';
      typingContainer.style.display = 'flex';

      const input = document.getElementById('quiz-typing-input');
      input.value = '';

      // TỰ ĐỘNG MỞ BÀN PHÍM TRÊN ĐIỆN THOẠI:
      // Focus ĐỒNG BỘ trong cùng luồng sự kiện chạm/nhấn để trình duyệt điện thoại (iOS Safari & Android Chrome)
      // nhận diện gesture token và tự động bật bàn phím ảo ngay lập tức.
      input.focus();
      input.click();

      // Hỗ trợ thêm cho một số trình duyệt có micro-delay layout
      requestAnimationFrame(() => {
        input.focus();
      });
      setTimeout(() => {
        input.focus();
      }, 50);

    } else {
      // Phần 2 (Chọn nghĩa): Hiện từ tiếng Anh, hiện phiên âm IPA và audio
      questionText.textContent = w.word;
      if (questionSubtext) {
        if (w.ipa) {
          questionSubtext.style.display = 'block';
          questionSubtext.textContent = w.ipa;
        } else {
          questionSubtext.style.display = 'none';
          questionSubtext.textContent = '';
        }
      }
      audioBtn.style.display = 'inline-flex';

      // Xếp 4 nút thành 1 hàng dọc chuẩn 4English
      optionsContainer.style.display = 'flex';
      typingContainer.style.display = 'none';

      const options = this.generateChoiceOptions(w);
      optionsContainer.innerHTML = options.map((opt, idx) => `
        <button type="button" class="quiz-option-btn" onclick="studyManager.handleChoiceAnswer(event, '${this.escapeJs(opt.text)}', ${opt.isCorrect})">
          <span class="quiz-opt-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="quiz-opt-text">${this.escapeHtml(opt.text)}</span>
        </button>
      `).join('');
    }
  }

  generateChoiceOptions(correctWord) {
    const wrongOptions = [];

    // Lọc bỏ từ hiện tại
    const otherWords = this.words.filter(w => w.id !== correctWord.id);
    
    // Thuật toán O(1) ngẫu nhiên thay vì shuffle toàn bộ danh sách O(N) gây giật lag
    for (let i = 0; i < 15; i++) {
      if (wrongOptions.length >= 3 || otherWords.length === 0) break;
      
      const randIdx = Math.floor(Math.random() * otherWords.length);
      const other = otherWords[randIdx];
      
      if (!wrongOptions.some(o => o.text === other.meaning) && other.meaning !== correctWord.meaning) {
        wrongOptions.push({ text: other.meaning, isCorrect: false });
        otherWords.splice(randIdx, 1); // Loại bỏ để không bị chọn lại
      }
    }

    const dummyMeanings = ['thành công', 'sáng tạo', 'kiên trì', 'phát triển', 'quan trọng', 'hạnh phúc', 'nỗ lực', 'thay đổi', 'chính xác', 'cơ hội'];
    // Lấy thêm từ nghĩa giả lập nếu chưa đủ
    while (wrongOptions.length < 3 && dummyMeanings.length > 0) {
      const randIdx = Math.floor(Math.random() * dummyMeanings.length);
      const dummy = dummyMeanings[randIdx];
      
      if (!wrongOptions.some(o => o.text === dummy) && dummy !== correctWord.meaning) {
        wrongOptions.push({ text: dummy, isCorrect: false });
      }
      dummyMeanings.splice(randIdx, 1);
    }

    // Explicitly place the correct answer at a random index to guarantee randomness
    // without relying on array shuffle behavior
    const insertIndex = Math.floor(Math.random() * (wrongOptions.length + 1));
    wrongOptions.splice(insertIndex, 0, { text: correctWord.meaning, isCorrect: true });

    return wrongOptions;
  }

  handleChoiceAnswer(event, selectedText, isCorrect) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.waitingForTap || this._choiceAnswered) return;
    this._choiceAnswered = true;

    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => {
      btn.classList.add('disabled');
      btn.style.pointerEvents = 'none';
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
    const wordObj = this.currentQuizItem.word;
    const progress = this.wordProgressMap.get(wordObj.id) || { typingCount: 0, choiceCount: 0 };

    // Tự động thu gọn bàn phím ảo điện thoại khi nộp đáp án typing
    if (type === 'typing') {
      const input = document.getElementById('quiz-typing-input');
      if (input) input.blur();
    }

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
        progress.typingCount = (progress.typingCount || 0) + 1;
        this.typingQueue.shift();
        if (progress.typingCount < this.targetTyping) {
          this.typingQueue.push(wordObj);
        }
      } else {
        progress.choiceCount = (progress.choiceCount || 0) + 1;
        this.choiceQueue.shift();
        if (progress.choiceCount < this.targetChoice) {
          this.choiceQueue.push(wordObj);
        }
      }

      feedbackBox.textContent = 'Chính xác';

    } else {
      // QUY TẮC 4ENGLISH:
      progress.typingCount = 0;
      progress.choiceCount = 0;

      feedbackBox.style.background = 'rgba(255, 69, 58, 0.15)';
      feedbackBox.style.color = '#ff6b6b';
      feedbackBox.style.border = '1px solid rgba(255, 69, 58, 0.3)';

      if (type === 'typing') {
        const failedWord = this.typingQueue.shift();
        this.typingQueue.push(failedWord);
        feedbackBox.textContent = `Sai, từ đúng: ${wordObj.word}`;
      } else {
        const failedWord = this.choiceQueue.shift();
        this.typingQueue.push(failedWord);
        feedbackBox.textContent = `Sai, từ đúng: ${wordObj.meaning}`;
      }
    }

    this.updateProgressBar();
    this.saveSessionState();

    // Dừng chuyển câu ngay trong cú click hiện tại, cho phép người dùng quan sát kết quả đúng/sai.
    // Kích hoạt chế độ cho phép nhấn vào BẤT KỲ ĐÂU trên toàn màn hình để chuyển sang câu tiếp theo.
    this.setWaitingForTap(false);
    setTimeout(() => {
      this.setWaitingForTap(true);
    }, 50);
  }

  advanceToNextQuestion() {
    this.nextQuizQuestion();
  }

  // === 4. KHI ÔN TẬP XONG: HIỂN THỊ DANH SÁCH CÁC TỪ VỪA HỌC KÈM NÚT SỬA TRẠNG THÁI ===
  showCompletionScreen() {
    this.setWaitingForTap(false);
    
    // Cập nhật DOM nhanh gọn bằng requestAnimationFrame để không giật lag
    requestAnimationFrame(() => {
      document.getElementById('view-quiz').style.display = 'none';
      const congratsView = document.getElementById('view-congrats');
      congratsView.style.display = 'block';

      const fill = document.getElementById('study-progress-fill');
      if (fill) fill.style.width = '100%';

      const tbody = document.getElementById('summary-words-tbody');
      
      // Sử dụng mảng HTML tĩnh để update innerHTML nhanh nhất
      let htmlStr = '';
      for (let i = 0; i < this.words.length; i++) {
        const w = this.words[i];
        htmlStr += `
          <tr>
            <td style="color: var(--text-muted); font-weight: 600;">${i + 1}</td>
            <td>
              <div style="font-weight: 700; color: #ffffff; font-size: 1rem;">${this.escapeHtml(w.word)}</div>
              ${w.ipa ? `<div style="font-size: 0.82rem; color: var(--accent-cyan); font-family: monospace;">${this.escapeHtml(w.ipa)}</div>` : ''}
            </td>
            <td style="text-align: center;">
              <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái">
                <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="studyManager.toggleWordLearnedSummary(${w.id}, this.checked)">
                <span class="ios-slider"></span>
              </label>
            </td>
          </tr>
        `;
      }
      tbody.innerHTML = htmlStr;
    });
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
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
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
