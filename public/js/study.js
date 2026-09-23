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
    this.wordProgressMap = new Map(); // wordId -> { listeningCount: number, typingCount: number, choiceCount: number }
    this.listeningQueue = []; // Hàng đợi Nghe điền từ
    this.typingQueue = []; // Hàng đợi các từ cần gõ
    this.choiceQueue = []; // Hàng đợi các từ cần chọn trắc nghiệm
    this.currentPhase = 'listening'; // 'listening', 'typing', 'choice'
    this.currentQuizItem = null;
    this.waitingForTap = false;

    // Cài đặt số lần ôn tập theo 3 loại
    this.studySettings = {
      all: { listening: 0, typing: 1, choice: 1 },
      unlearned: { listening: 1, typing: 1, choice: 1 },
      learned: { listening: 0, typing: 1, choice: 1 }
    };
    this.currentStudyProfile = 'all'; // Profile đang dùng cho phiên học
    this.currentConfigProfile = 'all'; // Profile đang được chọn để chỉnh sửa trong Cài đặt

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
      const raw = localStorage.getItem('study_settings_profiles');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.all) this.studySettings.all = parsed.all;
        if (parsed.unlearned) this.studySettings.unlearned = parsed.unlearned;
        if (parsed.learned) this.studySettings.learned = parsed.learned;
      }
    } catch (e) {
      console.warn("Could not load study settings, using default.", e);
    }
  }

  saveSettings() {
    // Đọc giá trị hiện tại trên UI và lưu vào currentConfigProfile
    const listeningVal = parseInt(document.getElementById('setting-target-listening')?.value || 0, 10);
    const typingVal = parseInt(document.getElementById('setting-target-typing')?.value || 0, 10);
    const choiceVal = parseInt(document.getElementById('setting-target-choice')?.value || 0, 10);
    
    if (listeningVal === 0 && typingVal === 0 && choiceVal === 0) {
      if (window.showToast) window.showToast('Lỗi: Cần có ít nhất 1 phương pháp học > 0');
      return false; // Validation failed
    }

    this.studySettings[this.currentConfigProfile] = {
      listening: Math.max(0, Math.min(10, listeningVal)),
      typing: Math.max(0, Math.min(10, typingVal)),
      choice: Math.max(0, Math.min(10, choiceVal))
    };

    try {
      localStorage.setItem('study_settings_profiles', JSON.stringify(this.studySettings));
    } catch (e) {}
    
    return true; // Saved successfully
  }

  updateSettingsUI() {
    const listeningInput = document.getElementById('setting-target-listening');
    const typingInput = document.getElementById('setting-target-typing');
    const choiceInput = document.getElementById('setting-target-choice');
    
    const currentConf = this.studySettings[this.currentConfigProfile];
    if (listeningInput) listeningInput.value = currentConf.listening;
    if (typingInput) typingInput.value = currentConf.typing;
    if (choiceInput) choiceInput.value = currentConf.choice;
    
    // Đồng bộ UI radio button
    const radioSelected = document.querySelector(`input[name="setting-profile"][value="${this.currentConfigProfile}"]`);
    if (radioSelected) radioSelected.checked = true;
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

    // Sự kiện chuyển đổi cấu hình
    document.querySelectorAll('input[name="setting-profile"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        // Lưu lại thay đổi của profile hiện tại trước khi chuyển
        this.saveSettings(); // Không bắt buộc validation khi chuyển tab, nhưng để an toàn cứ lưu tạm
        this.currentConfigProfile = e.target.value;
        this.updateSettingsUI();
      });
    });

    // Helper tạo event cho stepper
    const setupStepper = (idName, min, max) => {
      document.getElementById(`btn-dec-${idName}`)?.addEventListener('click', () => {
        const input = document.getElementById(`setting-target-${idName}`);
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        if (val > min) input.value = val - 1;
      });
      document.getElementById(`btn-inc-${idName}`)?.addEventListener('click', () => {
        const input = document.getElementById(`setting-target-${idName}`);
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        if (val < max) input.value = val + 1;
      });
    };

    setupStepper('listening', 0, 10);
    setupStepper('typing', 0, 10);
    setupStepper('choice', 0, 10);

    // Lưu cài đặt
    btnSaveSettings?.addEventListener('click', () => {
      if (this.saveSettings()) {
        modalSettings?.classList.remove('active');
        if (window.showToast) {
          window.showToast('Đã lưu cài đặt ôn tập thành công!');
        }
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
      this.updateSectionStudyWordCount();
    });
    document.getElementById('btn-deselect-all-days')?.addEventListener('click', () => {
      document.querySelectorAll('#section-days-checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
      this.updateSectionStudyWordCount();
    });
    
    // Khi thay đổi radio mode trong modal section study
    document.querySelectorAll('input[name="section-study-profile"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.renderSectionStudyChecklist();
      });
    });

    // Khi thay đổi checkbox trong danh sách ngày
    document.getElementById('section-days-checklist')?.addEventListener('change', (e) => {
      if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') {
        this.updateSectionStudyWordCount();
      }
    });

    document.getElementById('btn-start-section-study')?.addEventListener('click', () => {
      this.startSectionStudy();
    });

    // Nút Hoàn tất
    document.getElementById('btn-finish-study')?.addEventListener('click', () => {
      this.requestExit();
    });

    // Audio Quiz
    const playCurrentAudio = (e) => {
      if (e) e.stopPropagation();
      if (this.currentQuizItem && window.wordsManager) {
        window.wordsManager.playPronunciation(this.currentQuizItem.word.word, this.currentQuizItem.word.audioUrl);
      }
    };
    
    document.getElementById('quiz-audio-btn')?.addEventListener('click', playCurrentAudio);
    document.getElementById('quiz-big-audio-btn')?.addEventListener('click', playCurrentAudio);

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
          currentStudyProfile: this.currentStudyProfile,
          listeningQueue: this.listeningQueue.map(w => w.id), // Tối ưu bộ nhớ
          typingQueue: this.typingQueue.map(w => w.id), // Tối ưu bộ nhớ
          choiceQueue: this.choiceQueue.map(w => w.id), // Tối ưu bộ nhớ
          wordProgressList: Array.from(this.wordProgressMap.entries()),
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
    this.currentPhase = saved.currentPhase || 'listening';
    this.currentStudyProfile = saved.currentStudyProfile || 'all';
    
    // Tái tạo lại Object từ ID để tránh lỗi
    const wordMap = new Map(this.words.map(w => [w.id, w]));
    
    const restoreQueue = (savedQ) => {
      if (savedQ && savedQ.length > 0 && typeof savedQ[0] !== 'object') {
        return savedQ.map(id => wordMap.get(id)).filter(Boolean);
      }
      return savedQ || [];
    };

    this.listeningQueue = restoreQueue(saved.listeningQueue);
    this.typingQueue = restoreQueue(saved.typingQueue);
    this.choiceQueue = restoreQueue(saved.choiceQueue);

    this.wordProgressMap = new Map(saved.wordProgressList || []);
    
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
    
    this._currentStudySection = section; // Lưu tạm section đang mở modal

    this.renderSectionStudyChecklist();
    document.getElementById('modal-section-study').classList.add('active');
  }

  renderSectionStudyChecklist() {
    if (!this._currentStudySection) return;
    const section = this._currentStudySection;
    const checklist = document.getElementById('section-days-checklist');
    const profileRadio = document.querySelector('input[name="section-study-profile"]:checked');
    const profile = profileRadio ? profileRadio.value : 'all';

    // Giữ nguyên trạng thái checked của các ngày (nếu re-render)
    const existingChecks = new Set(
      Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
    );
    const isInitialRender = checklist.innerHTML.trim() === '';

    checklist.innerHTML = section.days.map(day => {
      const total = day.totalWords || 0;
      const learned = day.learnedWords || 0;
      let count = 0;
      if (profile === 'all') count = total;
      else if (profile === 'learned') count = learned;
      else if (profile === 'unlearned') count = total - learned;
      
      const checked = isInitialRender ? 'checked' : (existingChecks.has(String(day.id)) ? 'checked' : '');

      return `
      <label class="day-check-item">
        <input type="checkbox" value="${day.id}" ${checked}>
        <span style="font-weight: 500;">${this.escapeHtml(day.title)}</span>
        <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: auto;" data-count="${count}">
          (${count} từ)
        </span>
      </label>
    `}).join('');
    
    this.updateSectionStudyWordCount();
  }

  updateSectionStudyWordCount() {
    const checkedBoxes = document.querySelectorAll('#section-days-checklist input[type="checkbox"]:checked');
    let total = 0;
    checkedBoxes.forEach(cb => {
      const label = cb.closest('.day-check-item');
      if (label) {
        const countSpan = label.querySelector('[data-count]');
        if (countSpan) {
          total += parseInt(countSpan.getAttribute('data-count'), 10) || 0;
        }
      }
    });
    
    const countText = document.getElementById('section-study-total-words');
    if (countText) {
      countText.textContent = `Tổng số từ: ${total} từ`;
    }
  }

  async startSectionStudy() {
    const checkedBoxes = document.querySelectorAll('#section-days-checklist input[type="checkbox"]:checked');
    const dayIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    if (dayIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ngày để ôn tập.');
      return;
    }

    const profileRadio = document.querySelector('input[name="section-study-profile"]:checked');
    const profile = profileRadio ? profileRadio.value : 'all';
    let status = 'all';
    if (profile === 'learned') status = 'learned';
    else if (profile === 'unlearned') status = 'unlearned';

    // Cập nhật profile cho phiên học
    this.currentStudyProfile = profile;

    this.prepareFocusForMobile();

    try {
      const res = await window.api.getWordsByDays(dayIds, status);
      if (!res.success || res.data.length === 0) {
        const modal = document.getElementById('modal-study-room');
        if (modal) {
          modal.classList.remove('active');
          modal.style.opacity = '';
        }
        let filterText = '';
        if (profile === 'learned') filterText = 'đã thuộc';
        else if (profile === 'unlearned') filterText = 'chưa thuộc';
        
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
        listeningCount: 0,
        typingCount: 0,
        choiceCount: 0
      });
    });

    const conf = this.studySettings[this.currentStudyProfile];
    this.listeningQueue = conf.listening > 0 ? this.shuffle([...this.words]) : [];
    this.typingQueue = conf.listening === 0 && conf.typing > 0 ? this.shuffle([...this.words]) : [];
    this.choiceQueue = conf.listening === 0 && conf.typing === 0 && conf.choice > 0 ? this.shuffle([...this.words]) : [];

    this.currentPhase = null;
    this.setWaitingForTap(false);
    this._choiceAnswered = false;

    document.getElementById('view-congrats').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
  }

  // Cập nhật thanh tiến độ theo số lần hoàn thành mục tiêu cài đặt
  updateProgressBar() {
    const conf = this.studySettings[this.currentStudyProfile];
    const totalTasks = this.words.length * (conf.listening + conf.typing + conf.choice);
    if (totalTasks === 0) return;

    let completedTasks = 0;
    this.words.forEach(w => {
      const p = this.wordProgressMap.get(w.id);
      if (p) {
        completedTasks += Math.min(conf.listening, p.listeningCount || 0);
        completedTasks += Math.min(conf.typing, p.typingCount || 0);
        completedTasks += Math.min(conf.choice, p.choiceCount || 0);
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
    const conf = this.studySettings[this.currentStudyProfile];

    // 1. Kiểm tra hàng đợi Nghe điền từ
    if (this.listeningQueue.length > 0) {
      this.currentPhase = 'listening';
      const word = this.listeningQueue[0];
      this.currentQuizItem = { word, type: 'listening' };
      this.renderQuizQuestion();
      this.saveSessionState();
      return;
    }

    // 2. Hàng đợi Điền từ
    if (this.typingQueue.length === 0 && conf.typing > 0) {
      const pendingTyping = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.listeningCount >= conf.listening && p.typingCount < conf.typing;
      });
      if (pendingTyping.length > 0) this.typingQueue = this.shuffle([...pendingTyping]);
    }

    if (this.typingQueue.length > 0) {
      this.currentPhase = 'typing';
      const word = this.typingQueue[0];
      this.currentQuizItem = { word, type: 'typing' };
      this.renderQuizQuestion();
      this.saveSessionState();
      return;
    }

    // 3. Hàng đợi Chọn nghĩa
    if (this.choiceQueue.length === 0 && conf.choice > 0) {
      const pendingChoice = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.listeningCount >= conf.listening && p.typingCount >= conf.typing && p.choiceCount < conf.choice;
      });
      if (pendingChoice.length > 0) this.choiceQueue = this.shuffle([...pendingChoice]);
    }

    if (this.choiceQueue.length > 0) {
      this.currentPhase = 'choice';
      const word = this.choiceQueue[0];
      this.currentQuizItem = { word, type: 'choice' };
      this.renderQuizQuestion();
      this.saveSessionState();
      return;
    }

    // 4. Kiểm tra lại phòng hờ sai/rớt nhịp (Punishment loop fallback)
    if (conf.listening > 0) {
      const unfinished = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.listeningCount < conf.listening;
      });
      if (unfinished.length > 0) {
        this.listeningQueue = this.shuffle([...unfinished]);
        this.nextQuizQuestion();
        return;
      }
    }
    
    if (conf.typing > 0) {
      const unfinished = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.typingCount < conf.typing;
      });
      if (unfinished.length > 0) {
        this.typingQueue = this.shuffle([...unfinished]);
        this.nextQuizQuestion();
        return;
      }
    }

    if (conf.choice > 0) {
      const unfinished = this.words.filter(w => {
        const p = this.wordProgressMap.get(w.id);
        return p && p.choiceCount < conf.choice;
      });
      if (unfinished.length > 0) {
        this.choiceQueue = this.shuffle([...unfinished]);
        this.nextQuizQuestion();
        return;
      }
    }

    // 5. Nếu toàn bộ từ đã pass cả 3 phần -> Kết thúc phiên ôn tập thành công!
    this.clearSessionState();
    this.showCompletionScreen();
  }

  renderQuizQuestion() {
    const item = this.currentQuizItem;
    const w = item.word;
    const progress = this.wordProgressMap.get(w.id) || { listeningCount: 0, typingCount: 0, choiceCount: 0 };

    const badge = document.getElementById('quiz-badge');
    const questionText = document.getElementById('quiz-question-text');
    const questionSubtext = document.getElementById('quiz-question-subtext');
    const audioBtn = document.getElementById('quiz-audio-btn');
    
    const promptContainer = document.getElementById('quiz-prompt-container');
    const listeningContainer = document.getElementById('quiz-listening-container');
    const optionsContainer = document.getElementById('quiz-options-container');
    const typingContainer = document.getElementById('quiz-typing-container');

    // Ẩn badge tiêu đề rườm rà theo yêu cầu của người dùng
    if (badge) badge.style.display = 'none';

    if (item.type === 'listening') {
      // Phần Nghe điền từ: Ẩn hoàn toàn prompt, hiện nút loa to
      if (promptContainer) promptContainer.style.display = 'none';
      if (listeningContainer) listeningContainer.style.display = 'flex';
      
      optionsContainer.style.display = 'none';
      typingContainer.style.display = 'flex';

      const input = document.getElementById('quiz-typing-input');
      input.value = '';

      // Tự động phát âm thanh
      if (window.wordsManager) {
        window.wordsManager.playPronunciation(w.word, w.audioUrl);
      }

      input.focus();
      input.click();
      requestAnimationFrame(() => input.focus());
      setTimeout(() => input.focus(), 50);

    } else if (item.type === 'typing') {
      // Phần Điền từ: Hiện duy nhất nghĩa tiếng Việt làm câu hỏi, ẩn hoàn toàn phiên âm IPA
      if (promptContainer) promptContainer.style.display = 'flex';
      if (listeningContainer) listeningContainer.style.display = 'none';
      
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

      input.focus();
      input.click();
      requestAnimationFrame(() => input.focus());
      setTimeout(() => input.focus(), 50);

    } else {
      // Phần Chọn nghĩa: Hiện từ tiếng Anh, hiện phiên âm IPA và audio
      if (promptContainer) promptContainer.style.display = 'flex';
      if (listeningContainer) listeningContainer.style.display = 'none';
      
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
    this.processAnswerResult(isCorrect, this.currentQuizItem.type);
  }

  processAnswerResult(isCorrect, type) {
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const wordObj = this.currentQuizItem.word;
    const progress = this.wordProgressMap.get(wordObj.id) || { listeningCount: 0, typingCount: 0, choiceCount: 0 };
    const conf = this.studySettings[this.currentStudyProfile];

    // Phát âm thanh NGAY LẬP TỨC để trình duyệt iOS ghi nhận đây là kết quả của user gesture.
    if (window.wordsManager) {
      window.wordsManager.playPronunciation(wordObj.word, wordObj.audioUrl);
    }

    // Tự động thu gọn bàn phím ảo điện thoại khi nộp đáp án
    if (type === 'typing' || type === 'listening') {
      const input = document.getElementById('quiz-typing-input');
      // Trì hoãn việc blur để không cản trở luồng phát âm thanh đồng bộ
      if (input) {
        setTimeout(() => input.blur(), 100);
      }
    }

    feedbackBox.style.display = 'block';

    if (isCorrect) {
      feedbackBox.style.background = 'rgba(52, 199, 89, 0.15)';
      feedbackBox.style.color = '#34c759';
      feedbackBox.style.border = '1px solid rgba(52, 199, 89, 0.3)';

      if (type === 'listening') {
        progress.listeningCount = (progress.listeningCount || 0) + 1;
        this.listeningQueue.shift();
        if (progress.listeningCount < conf.listening) {
          this.listeningQueue.push(wordObj);
        }
      } else if (type === 'typing') {
        progress.typingCount = (progress.typingCount || 0) + 1;
        this.typingQueue.shift();
        if (progress.typingCount < conf.typing) {
          this.typingQueue.push(wordObj);
        }
      } else {
        progress.choiceCount = (progress.choiceCount || 0) + 1;
        this.choiceQueue.shift();
        if (progress.choiceCount < conf.choice) {
          this.choiceQueue.push(wordObj);
        }
      }

      feedbackBox.textContent = 'Chính xác';

    } else {
      // QUY TẮC PHẠT MỚI: Reset tiến trình và bắt ôn lại theo config đã chọn
      progress.listeningCount = 0;
      progress.typingCount = 0;
      progress.choiceCount = 0;

      feedbackBox.style.background = 'rgba(255, 69, 58, 0.15)';
      feedbackBox.style.color = '#ff6b6b';
      feedbackBox.style.border = '1px solid rgba(255, 69, 58, 0.3)';

      if (type === 'listening') {
        const failedWord = this.listeningQueue.shift();
        if (conf.listening > 0) this.listeningQueue.push(failedWord);
        feedbackBox.textContent = `Sai, từ đúng: ${wordObj.word}`;
      } else if (type === 'typing') {
        const failedWord = this.typingQueue.shift();
        if (conf.listening > 0) this.listeningQueue.push(failedWord);
        else if (conf.typing > 0) this.typingQueue.push(failedWord);
        feedbackBox.textContent = `Sai, từ đúng: ${wordObj.word}`;
      } else {
        const failedWord = this.choiceQueue.shift();
        if (conf.listening > 0) this.listeningQueue.push(failedWord);
        else if (conf.typing > 0) this.typingQueue.push(failedWord);
        else if (conf.choice > 0) this.choiceQueue.push(failedWord);
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
      congratsView.style.display = 'flex';
      congratsView.style.flexDirection = 'column';
      congratsView.style.maxHeight = 'calc(100vh - 140px)';

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
