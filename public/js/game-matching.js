/**
 * ==========================================================================
 * VOCABMASTER - GAME GHÉP TỪ VỚI NGHĨA (MATCHING GAME)
 * Lưới 4x4 (16 ô: 8 từ tiếng Anh + 8 nghĩa tiếng Việt) hiển thị trực tiếp.
 * Không úp thẻ, không phải game lật thẻ trí nhớ.
 * Chỉ phát âm khi nhấn vào thẻ tiếng Anh; đúng/sai không phát âm lại.
 * Đúng: xanh lá + mờ biến mất.
 * Sai: rung lắc đỏ + bỏ chọn sau 600ms.
 * Đồng hồ đếm giờ + số lượt thử + lưu kỷ lục localStorage.
 * Expose: window.MatchingGame
 * ==========================================================================
 */

(function () {
  'use strict';

  const DEFAULT_MATCHING_SETTINGS = {
    wordSource: 'unlearned', // 'unlearned' | 'learned' | 'custom'
    selectedDayIds: []
  };

  const MatchingGame = {
    isOpen: false,
    timerInterval: null,
    elapsedSec: 0,
    movesCount: 0,
    matchedPairsCount: 0,
    selectedCard: null,
    isLocked: false,
    currentWords: [],
    settings: { ...DEFAULT_MATCHING_SETTINGS },
    cachedSections: [],

    // Khởi tạo các sự kiện giao diện
    init() {
      this.loadSettings();
      this.bindEvents();
      this.syncCloudBestRecord();
    },

    loadSettings() {
      try {
        const raw = localStorage.getItem('vm_matching_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.settings = {
            wordSource: ['unlearned', 'learned', 'custom'].includes(parsed.wordSource) ? parsed.wordSource : 'unlearned',
            selectedDayIds: Array.isArray(parsed.selectedDayIds) ? parsed.selectedDayIds : []
          };
        }
      } catch (e) {
        this.settings = { ...DEFAULT_MATCHING_SETTINGS };
      }
    },

    saveSettings() {
      try {
        localStorage.setItem('vm_matching_settings', JSON.stringify(this.settings));
      } catch (e) {}
    },

    bindEvents() {
      document.getElementById('matching-btn-close')?.addEventListener('click', () => this.close());
      document.getElementById('matching-btn-restart')?.addEventListener('click', () => this.restart());
      document.getElementById('matching-btn-settings')?.addEventListener('click', () => this.openSettingsModal());
      document.getElementById('matching-victory-restart-btn')?.addEventListener('click', () => this.restart());
      document.getElementById('matching-victory-close-btn')?.addEventListener('click', () => {
        this.hideVictoryModal();
        this.close();
      });

      // Sự kiện trong Overlay Cài đặt nguồn từ
      const settingsOverlay = document.getElementById('matching-settings-overlay');
      document.getElementById('matching-settings-close-btn')?.addEventListener('click', () => this.closeSettingsModal(true));
      document.getElementById('matching-settings-cancel-btn')?.addEventListener('click', () => this.closeSettingsModal(true));
      document.getElementById('matching-settings-save-btn')?.addEventListener('click', () => this.saveSettingsFromUI());

      settingsOverlay?.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) this.closeSettingsModal(true);
      });

      document.querySelectorAll('input[name="matching-word-source"]').forEach(r => {
        r.addEventListener('change', (e) => {
          const wrap = document.getElementById('matching-custom-days-wrap');
          if (wrap) wrap.style.display = (e.target.value === 'custom') ? 'block' : 'none';
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          const overlay = document.getElementById('matching-settings-overlay');
          if (overlay && overlay.classList.contains('active')) {
            this.closeSettingsModal(true);
          }
        }
      });
    },

    // =========================================================================
    // CÀI ĐẶT NGUỒN TỪ (GIỐNG GAME NÔNG TRẠI)
    // =========================================================================
    async openSettingsModal() {
      const overlay = document.getElementById('matching-settings-overlay');
      if (!overlay) return;

      // Tạm dừng đồng hồ khi đang chọn cài đặt
      this.stopTimer();

      const radio = overlay.querySelector(`input[name="matching-word-source"][value="${this.settings.wordSource}"]`);
      if (radio) radio.checked = true;

      const customWrap = document.getElementById('matching-custom-days-wrap');
      if (customWrap) {
        customWrap.style.display = (this.settings.wordSource === 'custom') ? 'block' : 'none';
      }

      await this.renderCustomDaysChecklist();

      const bodyEl = overlay.querySelector('.matching-settings-body');
      if (bodyEl) bodyEl.scrollTop = 0;

      overlay.classList.add('active');
    },

    closeSettingsModal(resumeTimer = false) {
      const overlay = document.getElementById('matching-settings-overlay');
      if (overlay) overlay.classList.remove('active');

      if (resumeTimer && this.isOpen && this.matchedPairsCount < this.currentWords.length) {
        this.startTimer();
      }
    },

    async renderCustomDaysChecklist() {
      const container = document.getElementById('matching-custom-days-checklist');
      if (!container) return;

      try {
        let sections = [];
        if (window.api && typeof window.api.getSections === 'function') {
          const secRes = await window.api.getSections();
          sections = secRes.data || [];
        } else if (window.treeViewManager?.sections) {
          sections = window.treeViewManager.sections;
        }
        this.cachedSections = sections;

        let html = '';
        for (const sec of sections) {
          const days = sec.days || [];
          if (days.length === 0) continue;

          const allChecked = days.every(d => this.settings.selectedDayIds.some(id => String(id) === String(d.id)));

          html += `
            <label class="matching-section-check-row">
              <input type="checkbox" class="matching-section-checkbox" data-section-id="${sec.id}" ${allChecked ? 'checked' : ''}>
              <span>📁 ${this.escapeHtml(sec.title)}</span>
            </label>
          `;
          for (const d of days) {
            const isChecked = this.settings.selectedDayIds.some(id => String(id) === String(d.id));
            html += `
              <label class="matching-radio-item matching-day-check-item">
                <input type="checkbox" class="matching-custom-day-checkbox" data-section-id="${sec.id}" value="${d.id}" ${isChecked ? 'checked' : ''}>
                <span>${this.escapeHtml(d.title)}</span>
              </label>
            `;
          }
        }
        container.innerHTML = html || '<div style="color:#94a3b8; font-size:0.82rem; padding:6px;">Chưa có ngày học nào</div>';

        // Gắn sự kiện chọn tất cả ngày trong một Phần
        container.querySelectorAll('.matching-section-checkbox').forEach(secCb => {
          secCb.addEventListener('change', () => {
            const secId = secCb.getAttribute('data-section-id');
            container.querySelectorAll(`.matching-custom-day-checkbox[data-section-id="${secId}"]`).forEach(dayCb => {
              dayCb.checked = secCb.checked;
            });
          });
        });

        // Đồng bộ lại checkbox Phần khi tích/bỏ từng Ngày
        container.querySelectorAll('.matching-custom-day-checkbox').forEach(dayCb => {
          dayCb.addEventListener('change', () => {
            const secId = dayCb.getAttribute('data-section-id');
            const secCb = container.querySelector(`.matching-section-checkbox[data-section-id="${secId}"]`);
            if (secCb) {
              const allDays = Array.from(container.querySelectorAll(`.matching-custom-day-checkbox[data-section-id="${secId}"]`));
              secCb.checked = allDays.length > 0 && allDays.every(cb => cb.checked);
            }
          });
        });
      } catch (e) {
        container.innerHTML = '<div style="color:#94a3b8; font-size:0.82rem; padding:6px;">Không tải được danh sách ngày</div>';
      }
    },

    async saveSettingsFromUI() {
      const overlay = document.getElementById('matching-settings-overlay');
      if (!overlay) return;

      const sourceRadio = overlay.querySelector('input[name="matching-word-source"]:checked');
      const wordSource = sourceRadio ? sourceRadio.value : 'unlearned';
      const selectedDayIds = [];

      if (wordSource === 'custom') {
        overlay.querySelectorAll('.matching-custom-day-checkbox:checked').forEach(cb => {
          selectedDayIds.push(parseInt(cb.value, 10));
        });
        if (selectedDayIds.length === 0) {
          if (window.showToast) window.showToast('⚠️ Vui lòng chọn ít nhất 1 ngày để chơi!');
          return;
        }
      }

      this.settings.wordSource = wordSource;
      this.settings.selectedDayIds = selectedDayIds;
      this.saveSettings();
      this.closeSettingsModal(false);

      if (window.showToast) {
        window.showToast('✅ Đã lưu nguồn từ! Đang tạo ván mới...');
      }
      await this.startNewGame();
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
      this.closeSettingsModal(false);

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
    // NGUỒN TỪ: Lấy ngẫu nhiên 8 từ từ danh sách đã chọn trong Cài đặt
    // =========================================================================
    async fetchWords() {
      let selectedPool = [];
      const source = this.settings.wordSource || 'unlearned';

      const appendUnique = (targetArr, items) => {
        for (const w of (items || [])) {
          if (!w || !w.word || !w.meaning) continue;
          const exists = targetArr.some(item =>
            (item.id && w.id && String(item.id) === String(w.id)) ||
            item.word.toLowerCase() === w.word.toLowerCase()
          );
          if (!exists) targetArr.push(w);
        }
      };

      // 1. Tải toàn bộ danh sách từ theo nguồn đã chọn trong Cài đặt
      if (window.api) {
        try {
          if (source === 'unlearned') {
            const res = await window.api.getUnlearnedWords();
            appendUnique(selectedPool, res.data || []);
          } else if (source === 'learned') {
            let sections = this.cachedSections || [];
            if (sections.length === 0 && typeof window.api.getSections === 'function') {
              const secRes = await window.api.getSections();
              sections = secRes.data || [];
              this.cachedSections = sections;
            }
            const allDayIds = [];
            sections.forEach(sec => (sec.days || []).forEach(d => allDayIds.push(d.id)));
            if (allDayIds.length > 0 && typeof window.api.getWordsByDays === 'function') {
              const res = await window.api.getWordsByDays(allDayIds, 'learned');
              appendUnique(selectedPool, res.data || []);
            } else if (window.treeViewManager?.currentDayId) {
              const res = await window.api.getWords(window.treeViewManager.currentDayId, 'learned');
              appendUnique(selectedPool, res.data || []);
            }
          } else if (source === 'custom' && this.settings.selectedDayIds.length > 0) {
            if (typeof window.api.getWordsByDays === 'function') {
              const res = await window.api.getWordsByDays(this.settings.selectedDayIds, 'all');
              appendUnique(selectedPool, res.data || []);
            }
          }
        } catch (e) {
          console.warn('Lỗi tải danh sách từ theo cài đặt:', e);
        }
      }

      // 2. Xáo trộn NGẪU NHIÊN trong danh sách đã chọn và lấy tối đa 8 từ
      let chosen = this.shuffle(selectedPool).slice(0, 8);

      // 3. Nếu danh sách đã chọn có ít hơn 8 từ, bù thêm từ kho để đủ lưới 4x4 (16 ô)
      if (chosen.length < 8 && window.api) {
        const originalCount = chosen.length;
        const extraPool = [];
        try {
          const resUnlearned = await window.api.getUnlearnedWords();
          appendUnique(extraPool, resUnlearned.data || []);
        } catch (e) {}

        if (chosen.length + extraPool.length < 8) {
          try {
            const sections = this.cachedSections.length > 0
              ? this.cachedSections
              : (window.treeViewManager?.sections || []);
            const allDayIds = [];
            sections.forEach(sec => (sec.days || []).forEach(d => allDayIds.push(d.id)));
            if (allDayIds.length > 0 && typeof window.api.getWordsByDays === 'function') {
              const resAll = await window.api.getWordsByDays(allDayIds, 'all');
              appendUnique(extraPool, resAll.data || []);
            }
          } catch (e) {}
        }

        const shuffledExtra = this.shuffle(extraPool);
        for (const w of shuffledExtra) {
          if (chosen.length >= 8) break;
          appendUnique(chosen, [w]);
        }

        if (originalCount > 0 && originalCount < 8 && window.showToast) {
          window.showToast(`ℹ️ Danh sách chọn có ${originalCount} từ, đã bổ sung thêm cho đủ 8 cặp.`);
        }
      }

      // 4. Fallback mặc định nếu database chưa đủ 8 từ
      if (chosen.length < 8) {
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
        for (const fb of this.shuffle(fallbackList)) {
          if (chosen.length >= 8) break;
          appendUnique(chosen, [fb]);
        }
      }

      return this.shuffle(chosen).slice(0, 8);
    },

    updateTopicLabel() {
      const label = document.getElementById('matching-topic-label');
      if (!label) return;

      const source = this.settings.wordSource || 'unlearned';
      if (source === 'unlearned') {
        label.textContent = 'Từ chưa thuộc';
      } else if (source === 'learned') {
        label.textContent = 'Từ đã thuộc';
      } else if (source === 'custom') {
        const count = this.settings.selectedDayIds.length;
        if (count === 1) {
          const targetId = String(this.settings.selectedDayIds[0]);
          const sections = this.cachedSections.length > 0 ? this.cachedSections : (window.treeViewManager?.sections || []);
          let foundTitle = '';
          for (const sec of sections) {
            const d = (sec.days || []).find(x => String(x.id) === targetId);
            if (d) {
              foundTitle = `${sec.title} • ${d.title}`;
              break;
            }
          }
          label.textContent = foundTitle || 'Tuỳ chọn (1 ngày)';
        } else {
          label.textContent = count > 0 ? `Tuỳ chọn (${count} ngày)` : 'Tuỳ chọn';
        }
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

    pronounceCardIfEnglish(cardEl) {
      if (cardEl.getAttribute('data-type') !== 'en') return;
      const wordText = cardEl.querySelector('.matching-card-text')?.textContent;
      if (wordText && window.wordsManager?.playPronunciation) {
        try { window.wordsManager.playPronunciation(wordText); } catch (e) {}
      }
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

        // Chỉ đọc khi nhấn vào thẻ tiếng Anh
        this.pronounceCardIfEnglish(cardEl);
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

      // Chỉ đọc khi nhấn vào thẻ tiếng Anh (khi đúng hay sai không đọc lại)
      this.pronounceCardIfEnglish(cardB);

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
      const bestRecordEl = document.getElementById('matching-best-record');
      const newRecordBadge = document.getElementById('matching-new-record-badge');

      if (finalTimeEl) finalTimeEl.textContent = this.formatTime(timeSec);

      if (bestRecordEl && result.record) {
        bestRecordEl.textContent = this.formatTime(result.record.timeSec);
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
      } else if (timeSec < current.timeSec) {
        isNewRecord = true;
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
