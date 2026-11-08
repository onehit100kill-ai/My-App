/**
 * ==========================================================================
 * VOCABMASTER - GAME GHÉP TỪ VỚI NGHĨA (MATCHING GAME)
 * Lưới 4x4 (16 ô: 8 từ tiếng Anh + 8 nghĩa tiếng Việt) hiển thị trực tiếp.
 * Không úp thẻ, không phải game lật thẻ trí nhớ.
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
      this.syncCloudBestRecord();
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

      const gridEl = document.getElementById('matching-grid');
      if (gridEl) {
        gridEl.innerHTML = `
          <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#94a3b8;">
            <div style="font-size:24px;">🔄</div>
            <div>Đang tải 8 cặp từ vựng...</div>
          </div>
        `;
      }

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
    // RENDER LƯỚI 4X4 (16 Ô: 8 TỪ TIẾNG ANH + 8 NGHĨA TIẾNG VIỆT)
    // =========================================================================
    renderBoard() {
      const gridEl = document.getElementById('matching-grid');
      if (!gridEl) return;

      // Sinh 16 thẻ mở sẵn: 8 từ tiếng Anh + 8 nghĩa tiếng Việt
      const cards = [];
      this.currentWords.forEach((item, idx) => {
        const pairId = String(item.id || idx);

        // Thẻ tiếng Anh
        cards.push({
          cardId: `c_${idx}_en`,
          pairId: pairId,
          type: 'en',
          text: item.word,
          sub: item.ipa || ''
        });

        // Thẻ nghĩa tiếng Việt
        cards.push({
          cardId: `c_${idx}_vi`,
          pairId: pairId,
          type: 'vi',
          text: item.meaning,
          sub: ''
        });
      });

      // Xáo trộn 16 thẻ trên lưới 4x4
      const shuffledCards = this.shuffle(cards);

      // Render vào DOM dạng lưới 4x4, mặt mở sẵn (không úp thẻ)
      gridEl.innerHTML = shuffledCards.map(card => {
        const isLongText = (card.text || '').length > 10;
        const textClass = isLongText ? 'matching-card-text matching-card-text-long' : 'matching-card-text';
        return `
          <div class="matching-card ${card.type === 'en' ? 'matching-card-en' : 'matching-card-vi'}" data-card-id="${card.cardId}" data-pair-id="${card.pairId}" data-type="${card.type}">
            <div class="matching-card-content">
              <span class="matching-card-tag">${card.type === 'en' ? 'EN' : 'VI'}</span>
              <span class="${textClass}">${this.escapeHtml(card.text)}</span>
              ${card.sub ? `<span class="matching-card-sub">${this.escapeHtml(card.sub)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Bắt sự kiện nhấp chọn thẻ
      gridEl.querySelectorAll('.matching-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => this.handleCardClick(cardEl));
      });
    },

    // =========================================================================
    // XỬ LÝ CHỌN VÀ GHÉP TỪ VỚI NGHĨA TRÊN LƯỚI MA TRẬN 4X4
    // =========================================================================
    handleCardClick(cardEl) {
      if (this.isLocked) return;
      if (cardEl.classList.contains('matched') || cardEl.classList.contains('cleared')) return;

      // 1. Chưa chọn thẻ nào -> Nhấn vào thẻ nào thì viền thẻ đó sáng lên
      if (!this.selectedCard) {
        this.playSound('select');
        cardEl.classList.add('selected');
        this.selectedCard = cardEl;

        // Nếu chọn từ tiếng Anh, phát âm nhẹ
        if (cardEl.getAttribute('data-type') === 'en') {
          const wordText = cardEl.querySelector('.matching-card-text')?.textContent;
          if (wordText && window.wordsManager?.playPronunciation) {
            try { window.wordsManager.playPronunciation(wordText); } catch (e) {}
          }
        }
        return;
      }

      // 2. Nhấp lại chính thẻ đang chọn -> Tắt ánh sáng viền, huỷ chọn
      if (this.selectedCard === cardEl) {
        cardEl.classList.remove('selected');
        this.selectedCard = null;
        return;
      }

      // 3. Đã có thẻ 1 đang chọn (cardA), vừa nhấp thẻ thứ 2 (cardB)
      const cardA = this.selectedCard;
      const cardB = cardEl;

      this.movesCount += 1;
      this.updateMovesDisplay();

      const pairA = cardA.getAttribute('data-pair-id');
      const pairB = cardB.getAttribute('data-pair-id');
      const typeA = cardA.getAttribute('data-type');
      const typeB = cardB.getAttribute('data-type');

      // Điều kiện ghép đúng: cùng cặp ID và khác loại (1 thẻ Từ Tiếng Anh + 1 thẻ Nghĩa Tiếng Việt)
      const isMatch = (pairA === pairB && typeA !== typeB);

      if (isMatch) {
        // ================= GHÉP ĐÚNG: 2 THẺ BIẾN MẤT =================
        this.playSound('match');

        // Phát âm từ tiếng Anh vừa ghép đúng
        const enCard = typeA === 'en' ? cardA : cardB;
        const enWord = enCard.querySelector('.matching-card-text')?.textContent;
        if (enWord && window.wordsManager?.playPronunciation) {
          try { window.wordsManager.playPronunciation(enWord); } catch (e) {}
        }

        // Viền xanh lá sáng rực báo đúng
        cardA.classList.remove('selected');
        cardB.classList.remove('selected');
        cardA.classList.add('matched');
        cardB.classList.add('matched');

        this.matchedPairsCount += 1;
        this.selectedCard = null;

        // 2 thẻ biến mất sau 350ms
        setTimeout(() => {
          cardA.classList.add('cleared');
          cardB.classList.add('cleared');
        }, 350);

        // Ghép đủ 8 cặp -> CHIẾN THẮNG!
        if (this.matchedPairsCount >= this.currentWords.length) {
          setTimeout(() => this.handleVictory(), 650);
        }

      } else {
        // ================= GHÉP SAI: NGHĨA KHÁC NHAU =================
        // Khoá bàn trong thời gian báo lỗi
        this.isLocked = true;
        this.playSound('mismatch');

        // Ánh sáng đỏ ở viền cả 2 thẻ
        cardA.classList.remove('selected');
        cardB.classList.remove('selected');
        cardA.classList.add('mismatch');
        cardB.classList.add('mismatch');

        // Sau 550ms tắt ánh sáng viền đỏ để chọn thẻ khác
        setTimeout(() => {
          cardA.classList.remove('mismatch');
          cardB.classList.remove('mismatch');
          this.selectedCard = null;
          this.isLocked = false;
        }, 550);
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

    async syncCloudBestRecord() {
      if (!window.api || typeof window.api.getMatchingCloudRecords !== 'function') return;
      try {
        const res = await window.api.getMatchingCloudRecords();
        if (res && res.success && res.exists && res.records) {
          const current = this.getBestRecord();
          if (!current || res.records.timeSec < current.timeSec) {
            localStorage.setItem('vm_matching_records', JSON.stringify(res.records));
          }
        }
      } catch (e) {}
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
          if (window.api && typeof window.api.saveMatchingCloudRecords === 'function') {
            window.api.saveMatchingCloudRecords(record);
          }
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

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
