/**
 * ==========================================================================
 * VOCABMASTER - GAME GHÉP TỪ VỚI NGHĨA (MATCHING GAME)
 * Hiển thị trực tiếp 2 cột: Cột Từ Tiếng Anh ↔ Cột Nghĩa Tiếng Việt
 * Người chơi chọn từ tiếng Anh và chọn nghĩa tương ứng để ghép cặp.
 * Đúng: phát âm + xanh lá + mờ biến mất.
 * Sai: rung lắc đỏ + bỏ chọn sau 600ms.
 * Đồng hồ đếm giờ + số lượt thử + lưu kỷ lục localStorage.
 * Expose: window.MatchingGame
 * ==========================================================================
 */

(function () {
  'use strict';

  const MatchingGame = {
    isOpen: false,
    timerInterval: null,
    elapsedSec: 0,
    movesCount: 0,
    matchedPairsCount: 0,
    selectedCard: null,
    isLocked: false,
    currentWords: [],

    // Khởi tạo các sự kiện giao diện
    init() {
      this.bindEvents();
    },

    bindEvents() {
      document.getElementById('matching-btn-close')?.addEventListener('click', () => this.close());
      document.getElementById('matching-btn-restart')?.addEventListener('click', () => this.restart());
      document.getElementById('matching-victory-restart-btn')?.addEventListener('click', () => this.restart());
      document.getElementById('matching-victory-close-btn')?.addEventListener('click', () => {
        this.hideVictoryModal();
        this.close();
      });
    },

    // =========================================================================
    // MỞ / ĐÓNG GAME TOÀN MÀN HÌNH
    // =========================================================================
    async open() {
      this.isOpen = true;
      const gameView = document.getElementById('matching-game-view');
      const bubble = document.getElementById('game-bubble');
      const appHeader = document.querySelector('.app-header');
      const appContainer = document.querySelector('.app-container');

      // Ẩn giao diện chính và bong bóng
      if (appHeader) appHeader.style.display = 'none';
      if (appContainer) appContainer.style.display = 'none';
      if (bubble) bubble.style.display = 'none';

      // Hiện màn hình game ghép cặp
      if (gameView) {
        gameView.removeAttribute('hidden');
        gameView.style.display = 'flex';
      }

      await this.startNewGame();
    },

    close() {
      this.isOpen = false;
      this.stopTimer();

      const gameView = document.getElementById('matching-game-view');
      const bubble = document.getElementById('game-bubble');
      const appHeader = document.querySelector('.app-header');
      const appContainer = document.querySelector('.app-container');

      // Ẩn game
      if (gameView) {
        gameView.setAttribute('hidden', '');
        gameView.style.display = 'none';
      }

      // Khôi phục giao diện chính & bong bóng
      if (appHeader) appHeader.style.display = '';
      if (appContainer) appContainer.style.display = '';
      if (bubble) bubble.style.display = 'flex';
    },

    async restart() {
      this.hideVictoryModal();
      await this.startNewGame();
    },

    // =========================================================================
    // KHỞI ĐỘNG VÁN CHƠI MỚI
    // =========================================================================
    async startNewGame() {
      this.stopTimer();
      this.elapsedSec = 0;
      this.movesCount = 0;
      this.matchedPairsCount = 0;
      this.selectedCard = null;
      this.isLocked = false;

      this.updateTimerDisplay();
      this.updateMovesDisplay();
      this.hideVictoryModal();

      const listEn = document.getElementById('matching-list-en');
      const listVi = document.getElementById('matching-list-vi');
      if (listEn) listEn.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:10px;">Đang tải...</div>';
      if (listVi) listVi.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:10px;">Đang tải...</div>';

      // Lấy 8 từ vựng phù hợp
      this.currentWords = await this.fetchWords();
      this.updateTopicLabel();
      this.renderBoard();
      this.startTimer();
    },

    // =========================================================================
    // NGUỒN TỪ: Ưu tiên chưa thuộc -> Bù đã thuộc -> Fallback
    // =========================================================================
    async fetchWords() {
      const dayId = window.treeViewManager?.currentDayId;
      let words = [];

      // 1. Nếu có Ngày đang chọn
      if (dayId && window.api) {
        try {
          const resUnlearned = await window.api.getWords(dayId, 'unlearned');
          const unlearned = resUnlearned.data || [];
          words = words.concat(unlearned);

          if (words.length < 8) {
            const resLearned = await window.api.getWords(dayId, 'learned');
            const learned = resLearned.data || [];
            for (const w of learned) {
              if (!words.some(item => item.id === w.id)) {
                words.push(w);
                if (words.length >= 8) break;
              }
            }
          }
        } catch (e) {
          console.warn('Lỗi lấy từ theo ngày:', e);
        }
      }

      // 2. Nếu vẫn chưa đủ 8 từ, lấy từ chưa thuộc toàn hệ thống
      if (words.length < 8 && window.api) {
        try {
          const resAllUnlearned = await window.api.getUnlearnedWords();
          const allUnlearned = resAllUnlearned.data || [];
          for (const w of allUnlearned) {
            if (!words.some(item => item.id === w.id)) {
              words.push(w);
              if (words.length >= 8) break;
            }
          }
        } catch (e) {
          console.warn('Lỗi lấy từ chưa thuộc toàn app:', e);
        }
      }

      // 3. Nếu vẫn chưa đủ 8 từ, quét tất cả các ngày trong sections
      if (words.length < 8 && window.treeViewManager?.sections && window.api) {
        const sections = window.treeViewManager.sections;
        for (const sec of sections) {
          if (words.length >= 8) break;
          for (const day of (sec.days || [])) {
            if (words.length >= 8) break;
            try {
              const res = await window.api.getWords(day.id, 'all');
              for (const w of (res.data || [])) {
                if (!words.some(item => item.id === w.id)) {
                  words.push(w);
                  if (words.length >= 8) break;
                }
              }
            } catch (e) {}
          }
        }
      }

      // 4. Fallback mặc định nếu database chưa có từ nào
      if (words.length < 8) {
        const fallbackList = [
          { id: 'fb_1', word: 'Achieve', ipa: '/əˈtʃiːv/', meaning: 'Đạt được' },
          { id: 'fb_2', word: 'Improve', ipa: '/ɪmˈpruːv/', meaning: 'Cải thiện' },
          { id: 'fb_3', word: 'Confident', ipa: '/ˈkɑːnfɪdənt/', meaning: 'Tự tin' },
          { id: 'fb_4', word: 'Challenge', ipa: '/ˈtʃælɪndʒ/', meaning: 'Thử thách' },
          { id: 'fb_5', word: 'Success', ipa: '/səkˈses/', meaning: 'Thành công' },
          { id: 'fb_6', word: 'Practice', ipa: '/ˈpræktɪs/', meaning: 'Luyện tập' },
          { id: 'fb_7', word: 'Remember', ipa: '/rɪˈmembər/', meaning: 'Ghi nhớ' },
          { id: 'fb_8', word: 'Knowledge', ipa: '/ˈnɑːlɪdʒ/', meaning: 'Kiến thức' }
        ];
        for (const fb of fallbackList) {
          if (!words.some(item => item.word.toLowerCase() === fb.word.toLowerCase())) {
            words.push(fb);
            if (words.length >= 8) break;
          }
        }
      }

      // Trộn ngẫu nhiên và chọn đúng 8 từ
      return this.shuffle(words).slice(0, 8);
    },

    updateTopicLabel() {
      const label = document.getElementById('matching-topic-label');
      if (!label) return;

      const dayId = window.treeViewManager?.currentDayId;
      if (dayId && window.treeViewManager?.sections) {
        let foundTitle = '';
        for (const sec of window.treeViewManager.sections) {
          const d = (sec.days || []).find(x => x.id === dayId);
          if (d) {
            foundTitle = `${sec.title} • ${d.title}`;
            break;
          }
        }
        label.textContent = foundTitle || `Ngày ${dayId}`;
      } else {
        label.textContent = 'Kho Từ Vựng';
      }
    },

    // =========================================================================
    // RENDER 2 CỘT TỪ VỰNG & NGHĨA
    // =========================================================================
    renderBoard() {
      const listEn = document.getElementById('matching-list-en');
      const listVi = document.getElementById('matching-list-vi');
      const countEn = document.getElementById('matching-count-en');
      const countVi = document.getElementById('matching-count-vi');
      if (!listEn || !listVi) return;

      const total = this.currentWords.length;
      if (countEn) countEn.textContent = `${total} từ`;
      if (countVi) countVi.textContent = `${total} nghĩa`;

      // Tạo danh sách thẻ tiếng Anh và xáo trộn riêng
      const enItems = this.currentWords.map((item, idx) => ({
        pairId: String(item.id || idx),
        word: item.word,
        ipa: item.ipa || ''
      }));
      const shuffledEn = this.shuffle(enItems);

      // Tạo danh sách thẻ tiếng Việt và xáo trộn riêng
      const viItems = this.currentWords.map((item, idx) => ({
        pairId: String(item.id || idx),
        meaning: item.meaning
      }));
      const shuffledVi = this.shuffle(viItems);

      // Render Cột tiếng Anh
      listEn.innerHTML = shuffledEn.map(item => `
        <div class="matching-card matching-card-en" data-pair-id="${item.pairId}" data-type="en">
          <div class="matching-card-main">
            <span class="matching-word-text">${item.word}</span>
            ${item.ipa ? `<span class="matching-word-ipa">${item.ipa}</span>` : ''}
          </div>
          <span class="matching-card-dot"></span>
        </div>
      `).join('');

      // Render Cột tiếng Việt
      listVi.innerHTML = shuffledVi.map(item => `
        <div class="matching-card matching-card-vi" data-pair-id="${item.pairId}" data-type="vi">
          <span class="matching-card-dot"></span>
          <div class="matching-card-main">
            <span class="matching-meaning-text">${item.meaning}</span>
          </div>
        </div>
      `).join('');

      // Bắt sự kiện chọn thẻ cho cả 2 cột
      listEn.querySelectorAll('.matching-card').forEach(card => {
        card.addEventListener('click', () => this.handleCardClick(card));
      });
      listVi.querySelectorAll('.matching-card').forEach(card => {
        card.addEventListener('click', () => this.handleCardClick(card));
      });
    },

    // =========================================================================
    // XỬ LÝ CHỌN VÀ GHÉP TỪ VỚI NGHĨA
    // =========================================================================
    handleCardClick(cardEl) {
      if (this.isLocked) return;
      if (cardEl.classList.contains('matched') || cardEl.classList.contains('cleared')) return;

      this.playSound('select');

      // 1. Chưa chọn thẻ nào trước đó -> Chọn thẻ này
      if (!this.selectedCard) {
        cardEl.classList.add('selected');
        this.selectedCard = cardEl;

        // Nếu chọn từ tiếng Anh, phát âm nhẹ
        if (cardEl.getAttribute('data-type') === 'en') {
          const wordText = cardEl.querySelector('.matching-word-text')?.textContent;
          if (wordText && window.wordsManager?.playPronunciation) {
            try { window.wordsManager.playPronunciation(wordText); } catch (e) {}
          }
        }
        return;
      }

      // 2. Nhấp lại chính thẻ đang chọn -> Huỷ chọn (Deselect)
      if (this.selectedCard === cardEl) {
        cardEl.classList.remove('selected');
        this.selectedCard = null;
        return;
      }

      const prevType = this.selectedCard.getAttribute('data-type');
      const currType = cardEl.getAttribute('data-type');

      // 3. Nhấp vào thẻ cùng loại (ví dụ đang chọn từ Anh này, lại bấm từ Anh khác)
      // -> Chuyển vùng chọn mượt mà sang thẻ mới
      if (prevType === currType) {
        this.selectedCard.classList.remove('selected');
        cardEl.classList.add('selected');
        this.selectedCard = cardEl;

        if (currType === 'en') {
          const wordText = cardEl.querySelector('.matching-word-text')?.textContent;
          if (wordText && window.wordsManager?.playPronunciation) {
            try { window.wordsManager.playPronunciation(wordText); } catch (e) {}
          }
        }
        return;
      }

      // 4. Khác loại (1 thẻ Tiếng Anh + 1 thẻ Tiếng Việt) -> Tiến hành so sánh ghép đôi!
      const cardA = this.selectedCard;
      const cardB = cardEl;
      cardB.classList.add('selected');

      this.movesCount += 1;
      this.updateMovesDisplay();

      const pairA = cardA.getAttribute('data-pair-id');
      const pairB = cardB.getAttribute('data-pair-id');
      const isMatch = (pairA === pairB);

      if (isMatch) {
        // ================= GHÉP ĐÚNG =================
        this.playSound('match');

        // Phát âm từ tiếng Anh vừa ghép đúng
        const enCard = prevType === 'en' ? cardA : cardB;
        const enWord = enCard.querySelector('.matching-word-text')?.textContent;
        if (enWord && window.wordsManager?.playPronunciation) {
          try { window.wordsManager.playPronunciation(enWord); } catch (e) {}
        }

        cardA.classList.remove('selected');
        cardB.classList.remove('selected');
        cardA.classList.add('matched');
        cardB.classList.add('matched');

        this.matchedPairsCount += 1;
        this.selectedCard = null;

        // Cập nhật số từ còn lại trên tiêu đề cột
        const remaining = this.currentWords.length - this.matchedPairsCount;
        const countEn = document.getElementById('matching-count-en');
        const countVi = document.getElementById('matching-count-vi');
        if (countEn) countEn.textContent = `${remaining} từ`;
        if (countVi) countVi.textContent = `${remaining} nghĩa`;

        // Ẩn nhẹ nhàng 2 thẻ vừa ghép đúng sau 350ms
        setTimeout(() => {
          cardA.classList.add('cleared');
          cardB.classList.add('cleared');
        }, 350);

        // Nếu đã ghép hết 8 cặp -> CHIẾN THẮNG!
        if (this.matchedPairsCount >= this.currentWords.length) {
          setTimeout(() => this.handleVictory(), 600);
        }

      } else {
        // ================= GHÉP SAI =================
        this.isLocked = true;
        this.playSound('mismatch');

        cardA.classList.remove('selected');
        cardB.classList.remove('selected');
        cardA.classList.add('mismatch');
        cardB.classList.add('mismatch');

        setTimeout(() => {
          cardA.classList.remove('mismatch');
          cardB.classList.remove('mismatch');
          this.selectedCard = null;
          this.isLocked = false;
        }, 600);
      }
    },

    // =========================================================================
    // XỬ LÝ CHIẾN THẮNG & KỶ LỤC LOCALSTORAGE
    // =========================================================================
    handleVictory() {
      this.stopTimer();
      this.playSound('victory');

      const timeSec = this.elapsedSec;
      const moves = this.movesCount;
      const result = this.saveBestRecord(timeSec, moves);

      // Hiển thị kết quả
      const finalTimeEl = document.getElementById('matching-final-time');
      const finalMovesEl = document.getElementById('matching-final-moves');
      const bestRecordEl = document.getElementById('matching-best-record');
      const newRecordBadge = document.getElementById('matching-new-record-badge');

      if (finalTimeEl) finalTimeEl.textContent = this.formatTime(timeSec);
      if (finalMovesEl) finalMovesEl.textContent = `${moves} lượt`;

      if (bestRecordEl && result.record) {
        bestRecordEl.textContent = `${this.formatTime(result.record.timeSec)} (${result.record.moves} lượt)`;
      }

      if (newRecordBadge) {
        newRecordBadge.style.display = result.isNewRecord ? 'block' : 'none';
      }

      this.showVictoryModal();
    },

    showVictoryModal() {
      const overlay = document.getElementById('matching-victory-overlay');
      if (overlay) overlay.classList.add('active');
    },

    hideVictoryModal() {
      const overlay = document.getElementById('matching-victory-overlay');
      if (overlay) overlay.classList.remove('active');
    },

    getBestRecord() {
      try {
        const raw = localStorage.getItem('vm_matching_records');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    saveBestRecord(timeSec, moves) {
      const current = this.getBestRecord();
      let isNewRecord = false;

      if (!current) {
        isNewRecord = true;
      } else {
        if (timeSec < current.timeSec || (timeSec === current.timeSec && moves < current.moves)) {
          isNewRecord = true;
        }
      }

      if (isNewRecord) {
        const record = { timeSec, moves, date: new Date().toISOString() };
        try {
          localStorage.setItem('vm_matching_records', JSON.stringify(record));
        } catch (e) {}
        return { isNewRecord: true, record };
      }

      return { isNewRecord: false, record: current };
    },

    // =========================================================================
    // ĐỒNG HỒ & BỘ ĐẾM LƯỢT
    // =========================================================================
    startTimer() {
      this.stopTimer();
      this.timerInterval = setInterval(() => {
        this.elapsedSec += 1;
        this.updateTimerDisplay();
      }, 1000);
    },

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    updateTimerDisplay() {
      const el = document.getElementById('matching-timer');
      if (el) el.textContent = this.formatTime(this.elapsedSec);
    },

    updateMovesDisplay() {
      const el = document.getElementById('matching-moves');
      if (el) el.textContent = `${this.movesCount} lượt`;
    },

    formatTime(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    },

    // =========================================================================
    // HIỆU ỨNG ÂM THANH (WEB AUDIO API SYNTH)
    // =========================================================================
    playSound(type) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'select') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);

        } else if (type === 'match') {
          // Double ding trong trẻo
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
            gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 0.16);
          });

        } else if (type === 'mismatch') {
          // Buzz trầm báo sai
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.setValueAtTime(170, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);

        } else if (type === 'victory') {
          // Hợp âm chiến thắng rộn rã
          const fanfare = [523.25, 659.25, 783.99, 1046.50];
          fanfare.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.12);
            osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
          });
        }
      } catch (e) {}
    },

    // Thuật toán xáo trộn Fisher-Yates
    shuffle(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };

  // Expose global
  window.MatchingGame = MatchingGame;

  // Tự động khởi tạo sau khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MatchingGame.init());
  } else {
    MatchingGame.init();
  }
})();
