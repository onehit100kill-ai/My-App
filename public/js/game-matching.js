/**
 * ==========================================================================
 * VOCABMASTER - GAME GHÉP CẶP TỪ VỰNG (MATCHING GAME)
 * Lưới thẻ bài 4x4 (16 thẻ, 8 cặp từ - nghĩa).
 * Lật sai tự úp lại sau 800ms + khoá bàn.
 * Đồng hồ đếm giờ + số lượt lật + lưu kỷ lục localStorage.
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
    firstCard: null,
    secondCard: null,
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
      this.firstCard = null;
      this.secondCard = null;
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
          // Lấy từ chưa thuộc trước
          const resUnlearned = await window.api.getWords(dayId, 'unlearned');
          const unlearned = resUnlearned.data || [];
          words = words.concat(unlearned);

          // Nếu chưa đủ 8 từ, lấy thêm từ đã thuộc cùng ngày
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

      // 4. Fallback mặc định phong phú nếu database chưa có từ nào
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
    // RENDER LƯỚI 4X4 (16 THẺ)
    // =========================================================================
    renderBoard() {
      const gridEl = document.getElementById('matching-grid');
      if (!gridEl) return;

      // Sinh 16 thẻ: 8 tiếng Anh + 8 tiếng Việt
      const cards = [];
      this.currentWords.forEach((item, idx) => {
        const pairId = String(item.id || idx);

        // Thẻ tiếng Anh
        cards.push({
          cardId: `c_${idx}_word`,
          pairId: pairId,
          type: 'word',
          text: item.word,
          sub: item.ipa || ''
        });

        // Thẻ nghĩa tiếng Việt
        cards.push({
          cardId: `c_${idx}_meaning`,
          pairId: pairId,
          type: 'meaning',
          text: item.meaning,
          sub: ''
        });
      });

      // Xáo trộn 16 thẻ
      const shuffledCards = this.shuffle(cards);

      // Render vào DOM
      gridEl.innerHTML = shuffledCards.map(card => `
        <div class="matching-card" data-card-id="${card.cardId}" data-pair-id="${card.pairId}" data-type="${card.type}">
          <div class="matching-card-inner">
            <div class="matching-card-front">
              <span class="matching-card-back-icon">🎮</span>
            </div>
            <div class="matching-card-back">
              <div class="matching-card-content">
                <span class="matching-card-type-badge">${card.type === 'word' ? 'English' : 'Nghĩa'}</span>
                <span class="matching-card-text">${card.text}</span>
                ${card.sub ? `<small class="matching-card-sub">${card.sub}</small>` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Gắn sự kiện lật thẻ
      gridEl.querySelectorAll('.matching-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => this.handleCardClick(cardEl));
      });
    },

    // =========================================================================
    // XỬ LÝ LẬT THẺ & SO SÁNH CẶP
    // =========================================================================
    handleCardClick(cardEl) {
      // Đang khoá bàn hoặc đã lật/khớp -> bỏ qua
      if (this.isLocked) return;
      if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

      // Lật thẻ
      cardEl.classList.add('flipped');
      this.playSound('flip');

      // Thẻ thứ nhất
      if (!this.firstCard) {
        this.firstCard = cardEl;
        return;
      }

      // Thẻ thứ hai
      this.secondCard = cardEl;
      this.movesCount += 1;
      this.updateMovesDisplay();

      const pair1 = this.firstCard.getAttribute('data-pair-id');
      const type1 = this.firstCard.getAttribute('data-type');
      const pair2 = this.secondCard.getAttribute('data-pair-id');
      const type2 = this.secondCard.getAttribute('data-type');

      // Điều kiện đúng: Cùng pairId và khác loại (1 Word + 1 Meaning)
      const isMatch = (pair1 === pair2) && (type1 !== type2);

      if (isMatch) {
        // ================= KHỚP ĐÚNG =================
        this.playSound('match');
        this.firstCard.classList.add('matched');
        this.secondCard.classList.add('matched');
        this.matchedPairsCount += 1;

        // Phát âm thanh đọc từ nếu là thẻ tiếng Anh
        const englishCard = type1 === 'word' ? this.firstCard : this.secondCard;
        const wordText = englishCard.querySelector('.matching-card-text')?.textContent;
        if (wordText && window.wordsManager?.playPronunciation) {
          try {
            window.wordsManager.playPronunciation(wordText);
          } catch (e) {}
        }

        this.firstCard = null;
        this.secondCard = null;

        // Đã ghép đủ 8 cặp -> CHIẾN THẮNG!
        if (this.matchedPairsCount >= 8) {
          this.handleVictory();
        }
      } else {
        // ================= GHÉP SAI =================
        // Khoá bàn + rung lắc thẻ + úp lại sau đúng 800ms
        this.isLocked = true;
        this.playSound('mismatch');

        const cardA = this.firstCard;
        const cardB = this.secondCard;
        cardA.classList.add('mismatch');
        cardB.classList.add('mismatch');

        setTimeout(() => {
          cardA.classList.remove('flipped', 'mismatch');
          cardB.classList.remove('flipped', 'mismatch');
          this.firstCard = null;
          this.secondCard = null;
          this.isLocked = false;
        }, 800);
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

      // Hiện modal chiến thắng sau 400ms
      setTimeout(() => {
        this.showVictoryModal();
      }, 400);
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
        // Tiêu chí: thời gian ngắn hơn, hoặc bằng thời gian nhưng số lượt ít hơn
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

        if (type === 'flip') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);

        } else if (type === 'match') {
          // Double ding vui vẻ
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
