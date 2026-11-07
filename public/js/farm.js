/**
 * ==========================================================================
 * VOCABMASTER - NÔNG TRẠI TỪ VỰNG (FARM GAME)
 * Logic nông trại học từ vựng tiếng Anh phong cách Stardew Valley.
 * Expose window.FarmGame
 * ==========================================================================
 */

(function () {
  'use strict';

  // Định nghĩa 3 loại cây trồng chuẩn theo spec
  const CROP_TYPES = {
    radish: {
      id: 'radish',
      name: 'Củ cải',
      icon: '🥕',
      stagesNeeded: 2,
      cooldownSec: 20,
      maxHp: 3,
      rewardCoins: 10,
      rewardXp: 10,
      seedImg: 'assets/farm/seed-radish.png',
      sprites: [
        'assets/farm/crop-radish-1.png',
        'assets/farm/crop-radish-2.png',
        'assets/farm/crop-radish-3.png'
      ]
    },
    strawberry: {
      id: 'strawberry',
      name: 'Dâu tây',
      icon: '🍓',
      stagesNeeded: 3,
      cooldownSec: 30,
      maxHp: 4,
      rewardCoins: 20,
      rewardXp: 15,
      seedImg: 'assets/farm/seed-strawberry.png',
      sprites: [
        'assets/farm/crop-strawberry-1.png',
        'assets/farm/crop-strawberry-2.png',
        'assets/farm/crop-strawberry-3.png'
      ]
    },
    sunflower: {
      id: 'sunflower',
      name: 'Hướng dương',
      icon: '🌻',
      stagesNeeded: 4,
      cooldownSec: 45,
      maxHp: 5,
      rewardCoins: 35,
      rewardXp: 25,
      seedImg: 'assets/farm/seed-sunflower.png',
      sprites: [
        'assets/farm/crop-sunflower-1.png',
        'assets/farm/crop-sunflower-2.png',
        'assets/farm/crop-sunflower-3.png'
      ]
    }
  };

  // Định nghĩa 5 loại cây ăn quả thân gỗ (Group C)
  const FRUIT_TREES = {
    apple: {
      id: 'apple',
      name: 'Táo',
      icon: '🍎',
      rarity: 'Thường',
      rarityColor: '#10b981',
      unlockLevel: 1,
      maxWords: 5,
      maxHp: 5,
      cooldownSec: 30,
      costFood: 3,
      yieldFood: 5,
      rewardXp: 15,
      sprites: [
        'assets/farm/crop-apple-1.png',
        'assets/farm/crop-apple-2.png',
        'assets/farm/crop-apple-3.png'
      ]
    },
    orange: {
      id: 'orange',
      name: 'Cam',
      icon: '🍊',
      rarity: 'Thường',
      rarityColor: '#10b981',
      unlockLevel: 2,
      maxWords: 6,
      maxHp: 5,
      cooldownSec: 30,
      costFood: 3,
      yieldFood: 6,
      rewardXp: 15,
      sprites: [
        'assets/farm/crop-orange-1.png',
        'assets/farm/crop-orange-2.png',
        'assets/farm/crop-orange-3.png'
      ]
    },
    peach: {
      id: 'peach',
      name: 'Đào',
      icon: '🍑',
      rarity: 'Hiếm',
      rarityColor: '#3b82f6',
      unlockLevel: 4,
      maxWords: 10,
      maxHp: 8,
      cooldownSec: 45,
      costFood: 5,
      yieldFood: 10,
      rewardXp: 25,
      sprites: [
        'assets/farm/crop-peach-1.png',
        'assets/farm/crop-peach-2.png',
        'assets/farm/crop-peach-3.png'
      ]
    },
    pear: {
      id: 'pear',
      name: 'Lê',
      icon: '🍐',
      rarity: 'Hiếm',
      rarityColor: '#3b82f6',
      unlockLevel: 6,
      maxWords: 12,
      maxHp: 8,
      cooldownSec: 45,
      costFood: 5,
      yieldFood: 12,
      rewardXp: 25,
      sprites: [
        'assets/farm/crop-pear-1.png',
        'assets/farm/crop-pear-2.png',
        'assets/farm/crop-pear-3.png'
      ]
    },
    cherry: {
      id: 'cherry',
      name: 'Anh đào',
      icon: '🍒',
      rarity: 'Sử thi',
      rarityColor: '#a855f7',
      unlockLevel: 8,
      maxWords: 15,
      maxHp: 10,
      cooldownSec: 60,
      costFood: 8,
      yieldFood: 15,
      rewardXp: 40,
      sprites: [
        'assets/farm/crop-cherry-1.png',
        'assets/farm/crop-cherry-2.png',
        'assets/farm/crop-cherry-3.png'
      ]
    }
  };

  // Trạng thái mặc định
  const DEFAULT_STATE = {
    coins: 30,
    xp: 0,
    level: 1,
    food: 5, // Bắt đầu với 5 lương thực
    foodStorage: {}, // Lưu số lượng nông sản & trái cây đã thu hoạch
    fertilizer: 0,
    soundEnabled: true,
    harvestedTodayCount: 0,
    lastHarvestDate: '',
    plots: [
      { id: 1, state: 'empty' },
      { id: 2, state: 'empty' },
      { id: 3, state: 'empty' },
      { id: 4, state: 'empty' },
      { id: 5, state: 'empty' },
      { id: 6, state: 'empty' }
    ],
    treePlots: [
      { id: 1, state: 'empty' },
      { id: 2, state: 'empty' },
      { id: 3, state: 'empty' },
      { id: 4, state: 'empty' },
      { id: 5, state: 'empty' },
      { id: 6, state: 'empty' }
    ],
    regrow: {},
    quests: {
      date: '',
      watered: 0,
      harvested: 0,
      worms: 0,
      claimed: { water: false, harvest: false, worm: false }
    }
  };

  const DEFAULT_SETTINGS = {
    wordSource: 'unlearned', // 'unlearned' | 'learned' | 'custom'
    selectedDayIds: [],
    modes: {
      choice: true,
      typing: true,
      listening: true,
      ai: true // Đã kích hoạt API AI
    }
  };

  const FarmGame = {
    state: null,
    settings: null,
    tickInterval: null,
    activeQuiz: null, // { plotId, mode, word, failCount, isWormQuiz }
    activeTreeQuiz: null, // { plotId, wordIndex, words, firstTryErrors }
    activeTreePlanting: null, // { plotId, selectedTree, chosenWords }
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    cachedWordsPool: [],
    isOpen: false,

    // Khởi tạo
    init() {
      this.loadSettings();
      this.loadState();
      this.initBubble();
      this.initGameMenuEvents();
      this.initUIEvents();
    },

    // Lưu / Đọc State
    loadState() {
      try {
        const raw = localStorage.getItem('vm_farm_state_v1');
        if (raw) {
          this.state = Object.assign({}, DEFAULT_STATE, JSON.parse(raw));
        } else {
          this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }

      // Đảm bảo số lượng ô đất phù hợp level (tối thiểu 6, tối đa 20)
      const expectedPlots = Math.min(20, 6 + (this.state.level - 1) * 2);
      while (this.state.plots.length < expectedPlots) {
        this.state.plots.push({ id: this.state.plots.length + 1, state: 'empty' });
      }

      if (this.state.food === undefined) this.state.food = 5;
      if (!this.state.foodStorage) this.state.foodStorage = {};
      if (!Array.isArray(this.state.treePlots) || this.state.treePlots.length < 6) {
        this.state.treePlots = [
          { id: 1, state: 'empty' },
          { id: 2, state: 'empty' },
          { id: 3, state: 'empty' },
          { id: 4, state: 'empty' },
          { id: 5, state: 'empty' },
          { id: 6, state: 'empty' }
        ];
      }

      this.checkDailyReset();
    },

    saveState() {
      try {
        localStorage.setItem('vm_farm_state_v1', JSON.stringify(this.state));
      } catch (e) {
        console.error('Lỗi lưu farm state:', e);
      }
    },

    // Lưu / Đọc Settings
    loadSettings() {
      try {
        const raw = localStorage.getItem('vm_farm_settings');
        if (raw) {
          this.settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
        } else {
          this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
      } catch (e) {
        this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }
    },

    saveSettings() {
      try {
        localStorage.setItem('vm_farm_settings', JSON.stringify(this.settings));
      } catch (e) {
        console.error('Lỗi lưu farm settings:', e);
      }
    },

    getTodayStr() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    getTomorrowStr() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    checkDailyReset() {
      const today = this.getTodayStr();
      if (this.state.quests.date !== today) {
        this.state.quests = {
          date: today,
          watered: 0,
          harvested: 0,
          worms: 0,
          claimed: { water: false, harvest: false, worm: false }
        };
      }
      if (this.state.lastHarvestDate !== today) {
        this.state.lastHarvestDate = today;
        this.state.harvestedTodayCount = 0;
      }

      // Kiểm tra cây mọc lại (Regrow) hôm sau
      if (this.state.regrow && this.state.regrow[today]) {
        const regrowWords = this.state.regrow[today];
        if (Array.isArray(regrowWords) && regrowWords.length > 0) {
          // Gieo vào các ô trống nếu có
          for (const item of regrowWords) {
            const emptyPlot = this.state.plots.find(p => p.state === 'empty');
            if (emptyPlot) {
              emptyPlot.cropType = 'radish'; // Mọc lại thành mầm
              emptyPlot.wordId = item.wordId;
              emptyPlot.word = item.word;
              emptyPlot.ipa = item.ipa;
              emptyPlot.meaning = item.meaning;
              emptyPlot.example = item.example;
              emptyPlot.stage = 1; // Chỉ cần tưới 1 lần là chín
              emptyPlot.stagesNeeded = 2;
              emptyPlot.hp = 3;
              emptyPlot.maxHp = 3;
              emptyPlot.cooldownUntil = 0;
              emptyPlot.hasFertilizer = false;
              emptyPlot.worm = null;
              emptyPlot.state = 'growing';
            }
          }
          delete this.state.regrow[today];
          this.saveState();
        }
      }
    },

    // =========================================================================
    // BONG BÓNG GAME (DRAGGABLE BUBBLE & GAME MENU)
    // =========================================================================
    initBubble() {
      let bubble = document.getElementById('game-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'game-bubble';
        bubble.title = 'Trò chơi từ vựng';
        bubble.innerHTML = `
          <span class="farm-bubble-icon">🎮</span>
        `;
        document.body.appendChild(bubble);
      } else {
        bubble.innerHTML = `
          <span class="farm-bubble-icon">🎮</span>
        `;
      }

      // Khôi phục vị trí lưu trước đó
      try {
        const savedPos = localStorage.getItem('vm_game_bubble_pos');
        if (savedPos) {
          const { x, y } = JSON.parse(savedPos);
          const maxLeft = window.innerWidth - 60;
          const maxTop = window.innerHeight - 60;
          bubble.style.left = Math.min(Math.max(10, x), maxLeft) + 'px';
          bubble.style.top = Math.min(Math.max(10, y), maxTop) + 'px';
          bubble.style.bottom = 'auto';
          bubble.style.right = 'auto';
        }
      } catch (e) {}

      // Xử lý kéo thả (Pointer Events: chuột + touch di động)
      let isDragging = false;
      let startX, startY;
      let initialLeft, initialTop;
      let movedDistance = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        movedDistance = 0;
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        startY = e.clientY || (e.touches && e.touches[0].clientY);

        const rect = bubble.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        bubble.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const currentY = e.clientY || (e.touches && e.touches[0].clientY);
        const dx = currentX - startX;
        const dy = currentY - startY;
        movedDistance = Math.hypot(dx, dy);

        if (movedDistance > 4) {
          const newLeft = Math.min(Math.max(8, initialLeft + dx), window.innerWidth - 58);
          const newTop = Math.min(Math.max(8, initialTop + dy), window.innerHeight - 58);

          bubble.style.left = newLeft + 'px';
          bubble.style.top = newTop + 'px';
          bubble.style.bottom = 'auto';
          bubble.style.right = 'auto';
        }
      };

      const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;

        // Lưu vị trí nếu đã kéo
        if (movedDistance > 4) {
          const rect = bubble.getBoundingClientRect();
          localStorage.setItem('vm_game_bubble_pos', JSON.stringify({ x: rect.left, y: rect.top }));
        } else {
          // Bấm mở menu trò chơi
          FarmGame.toggleGameMenu();
        }
      };

      bubble.addEventListener('pointerdown', onPointerDown);
      bubble.addEventListener('pointermove', onPointerMove);
      bubble.addEventListener('pointerup', onPointerUp);
      bubble.addEventListener('pointercancel', onPointerUp);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },

    toggleGameMenu() {
      const backdrop = document.getElementById('game-bubble-menu-backdrop');
      if (backdrop && backdrop.classList.contains('active')) {
        this.closeGameMenu();
      } else {
        this.openGameMenu();
      }
    },

    openGameMenu() {
      const backdrop = document.getElementById('game-bubble-menu-backdrop');
      const menu = document.getElementById('game-bubble-menu');
      const bubble = document.getElementById('game-bubble');
      if (!backdrop || !menu || !bubble) return;

      // Trên desktop: popover định vị theo bong bóng
      if (window.innerWidth > 640) {
        const bubbleRect = bubble.getBoundingClientRect();
        const menuWidth = 250;
        const menuHeight = 160;

        let left = bubbleRect.right + 12;
        if (left + menuWidth > window.innerWidth - 10) {
          left = bubbleRect.left - menuWidth - 12;
        }
        if (left < 10) left = 10;

        let top = bubbleRect.top - 20;
        if (top + menuHeight > window.innerHeight - 10) {
          top = window.innerHeight - menuHeight - 10;
        }
        if (top < 10) top = 10;

        menu.style.position = 'fixed';
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
      } else {
        menu.style.position = '';
        menu.style.left = '';
        menu.style.top = '';
        menu.style.right = '';
        menu.style.bottom = '';
      }

      backdrop.classList.add('active');
    },

    closeGameMenu() {
      const backdrop = document.getElementById('game-bubble-menu-backdrop');
      if (backdrop) {
        backdrop.classList.remove('active');
      }
    },

    initGameMenuEvents() {
      const backdrop = document.getElementById('game-bubble-menu-backdrop');
      const closeBtn = document.getElementById('game-menu-close-btn');
      const matchingBtn = document.getElementById('game-menu-matching-btn');
      const farmBtn = document.getElementById('game-menu-farm-btn');

      closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeGameMenu();
      });

      backdrop?.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeGameMenu();
        }
      });

      matchingBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeGameMenu();
        if (window.MatchingGame && typeof window.MatchingGame.open === 'function') {
          window.MatchingGame.open();
        }
      });

      farmBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeGameMenu();
        this.open();
      });
    },

    // =========================================================================
    // MỞ / ĐÓNG GAME TOÀN MÀN HÌNH
    // =========================================================================
    async open() {
      this.isOpen = true;
      const farmView = document.getElementById('farm-view');
      const bubble = document.getElementById('game-bubble');
      const appHeader = document.querySelector('.app-header');
      const appContainer = document.querySelector('.app-container');

      // Ẩn giao diện cũ theo yêu cầu người dùng
      if (appHeader) appHeader.style.display = 'none';
      if (appContainer) appContainer.style.display = 'none';
      if (bubble) bubble.style.display = 'none';

      // Hiện nông trại toàn màn hình
      if (farmView) {
        farmView.removeAttribute('hidden');
        farmView.style.display = 'flex';
      }

      this.checkDailyReset();
      await this.refreshWordsPool();
      this.render();

      // Khởi động ticker đếm ngược 1s
      clearInterval(this.tickInterval);
      this.tickInterval = setInterval(() => this.tick(), 1000);
    },

    close() {
      this.isOpen = false;
      clearInterval(this.tickInterval);

      const farmView = document.getElementById('farm-view');
      const bubble = document.getElementById('game-bubble');
      const appHeader = document.querySelector('.app-header');
      const appContainer = document.querySelector('.app-container');

      // Phục hồi giao diện cũ
      if (farmView) {
        farmView.setAttribute('hidden', '');
        farmView.style.display = 'none';
      }
      if (appHeader) appHeader.style.removeProperty('display');
      if (appContainer) appContainer.style.removeProperty('display');
      if (bubble) bubble.style.removeProperty('display');

      // Đóng các sheet đang mở nếu có
      this.closeAllSheets();
    },

    closeAllSheets() {
      document.querySelectorAll('.farm-sheet-backdrop').forEach(el => el.classList.remove('active'));
    },

    // =========================================================================
    // SOUND EFFECTS (Web Audio API Synthesizer - Không lo lỗi thiếu file audio)
    // =========================================================================
    playSound(type) {
      if (!this.state.soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'pop') {
          // Tiếng tưới đúng (pop tươi vui)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(420, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.12);
        } else if (type === 'ting') {
          // Tiếng thu hoạch / lên cấp (ting leng keng)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
          osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.07); // E6
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start();
          osc2.start(ctx.currentTime + 0.07);
          osc1.stop(ctx.currentTime + 0.35);
          osc2.stop(ctx.currentTime + 0.35);
        }
      } catch (e) {}
    },

    // =========================================================================
    // KHO TỪ VỰNG (WORDS POOL)
    // =========================================================================
    async refreshWordsPool() {
      try {
        let words = [];
        if (this.settings.wordSource === 'unlearned') {
          const res = await window.api.getUnlearnedWords();
          words = res.data || [];
        } else if (this.settings.wordSource === 'learned') {
          // Lấy theo ngày hiện tại hoặc tất cả ngày đã chọn
          if (window.treeViewManager && window.treeViewManager.currentDayId) {
            const res = await window.api.getWords(window.treeViewManager.currentDayId, 'learned');
            words = res.data || [];
          } else {
            const res = await window.api.getUnlearnedWords();
            words = res.data || [];
          }
        } else if (this.settings.wordSource === 'custom' && this.settings.selectedDayIds.length > 0) {
          const res = await window.api.getWordsByDays(this.settings.selectedDayIds, 'all');
          words = res.data || [];
        }

        // Nếu kho từ rỗng, fallback lấy từ của ngày hiện tại
        if (words.length === 0 && window.treeViewManager && window.treeViewManager.currentDayId) {
          const res = await window.api.getWords(window.treeViewManager.currentDayId, 'all');
          words = res.data || [];
        }

        this.cachedWordsPool = words;
      } catch (e) {
        console.warn('Lỗi tải kho từ vựng nông trại:', e);
      }
    },

    // Lấy từ tiếp theo chưa gieo
    pickNextWord(excludeWordId = null) {
      if (!this.cachedWordsPool || this.cachedWordsPool.length === 0) {
        return {
          id: 999999,
          word: 'vocabulary',
          ipa: '/vəˈkæbjələri/',
          meaning: 'từ vựng',
          example: 'Expand your English vocabulary with farm game.'
        };
      }

      // Danh sách ID từ đang được trồng trên các ô
      const plantedIds = new Set(
        this.state.plots.filter(p => p.state !== 'empty' && p.wordId).map(p => p.wordId)
      );

      // Ưu tiên từ chưa trồng
      let available = this.cachedWordsPool.filter(w => !plantedIds.has(w.id) && w.id !== excludeWordId);

      if (available.length === 0) {
        // Nếu đã trồng hết, lấy từ ngẫu nhiên trong kho
        available = this.cachedWordsPool.filter(w => w.id !== excludeWordId);
      }

      if (available.length === 0) {
        return this.cachedWordsPool[0];
      }

      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    },

    // Đếm số từ còn lại trong kho chưa trồng
    getRemainingWordsCount() {
      const plantedIds = new Set(
        this.state.plots.filter(p => p.state !== 'empty' && p.wordId).map(p => p.wordId)
      );
      const remaining = this.cachedWordsPool.filter(w => !plantedIds.has(w.id));
      return remaining.length;
    },

    // =========================================================================
    // RENDER GIAO DIỆN NÔNG TRẠI
    // =========================================================================
    render() {
      this.renderHUD();
      this.renderField();
      this.renderBottomBar();
    },

    renderHUD() {
      const levelEl = document.getElementById('farm-hud-level');
      const xpBarEl = document.getElementById('farm-hud-xp-bar');
      const foodEl = document.getElementById('farm-hud-food');
      const coinsEl = document.getElementById('farm-hud-coins');
      const fertEl = document.getElementById('farm-hud-fert');
      const soundBtn = document.getElementById('farm-btn-sound');

      const nextXp = 20 + this.state.level * 10;
      const pct = Math.min(100, Math.round((this.state.xp / nextXp) * 100));

      if (levelEl) levelEl.textContent = `🌱 Cấp ${this.state.level}`;
      if (xpBarEl) {
        xpBarEl.style.width = `${pct}%`;
        xpBarEl.title = `${this.state.xp}/${nextXp} XP (Bấm để xem chi tiết)`;
      }
      if (foodEl) foodEl.textContent = `🍞 ${this.state.food || 0}`;
      if (coinsEl) coinsEl.textContent = `🪙 ${this.state.coins}`;
      if (fertEl) fertEl.textContent = `🧪 ×${this.state.fertilizer}`;
      if (soundBtn) soundBtn.textContent = this.state.soundEnabled ? '🔊' : '🔇';
    },

    renderBottomBar() {
      const wordsLeftEl = document.getElementById('farm-bottom-words-left');
      const harvestedEl = document.getElementById('farm-bottom-harvested');

      if (wordsLeftEl) {
        const count = this.getRemainingWordsCount();
        wordsLeftEl.textContent = `🌱 Từ còn trong kho: ${count}`;
      }
      if (harvestedEl) {
        harvestedEl.textContent = `🧺 Đã thu hoạch: ${this.state.harvestedTodayCount || 0}`;
      }
    },

    renderField() {
      this.renderCropGrid();
      this.renderTreeGrid();
    },

    renderCropGrid() {
      const grid = document.getElementById('farm-grid');
      if (!grid) return;

      const now = Date.now();
      const unlockedCount = Math.min(20, 6 + (this.state.level - 1) * 2);
      const unlockedPlots = this.state.plots.slice(0, unlockedCount);

      const plotsHtml = unlockedPlots.map(plot => {
        if (plot.state === 'empty') {
          return `
            <div class="farm-plot farm-plot-empty" data-plot-id="${plot.id}">
              <img class="farm-plot-soil-bg" src="assets/farm/soil-empty.png" onerror="this.style.display='none'" alt="soil">
              <span class="farm-empty-plus">+</span>
              <span class="farm-empty-label">Chạm để gieo</span>
            </div>
          `;
        }

        const crop = CROP_TYPES[plot.cropType] || CROP_TYPES.radish;
        const isCooldown = plot.cooldownUntil && plot.cooldownUntil > now;
        const cooldownRemaining = isCooldown ? Math.ceil((plot.cooldownUntil - now) / 1000) : 0;
        const isReady = plot.stage >= plot.stagesNeeded;
        const isWitherWarning = plot.hp === 1 && !isReady;
        const isWitheredDead = plot.state === 'withered' || plot.hp <= 0;
        const hasWorm = !!plot.worm;

        // Class CSS cho ô đất
        const classes = ['farm-plot'];
        if (isWitheredDead) classes.push('farm-plot-withered');
        else if (isWitherWarning) classes.push('farm-plot-wither-warning');
        else if (isReady) classes.push('farm-plot-ready');
        else if (isCooldown) classes.push('farm-plot-cooling');

        // Sprite cây
        let spriteIdx = Math.min(crop.sprites.length - 1, Math.max(0, plot.stage - 1));
        if (isReady) spriteIdx = crop.sprites.length - 1;
        const spriteSrc = isWitheredDead ? 'assets/farm/crop-withered.png' : crop.sprites[spriteIdx];

        // Tim máu cây
        let heartsHtml = '';
        for (let i = 0; i < plot.maxHp; i++) {
          heartsHtml += i < plot.hp ? '❤️' : '<span style="filter:grayscale(1) opacity(0.35);">❤️</span>';
        }

        // Chấm tiến độ giai đoạn
        let dotsHtml = '';
        for (let i = 0; i < plot.stagesNeeded; i++) {
          dotsHtml += i < plot.stage ? '●' : '○';
        }

        return `
          <div class="${classes.join(' ')}" data-plot-id="${plot.id}">
            <!-- Nền đất -->
            <img class="farm-plot-soil-bg" src="assets/farm/soil-empty.png" onerror="this.style.display='none'" alt="soil">

            <!-- Thanh trạng thái trên đầu ô: Máu & Tiến độ -->
            ${!isWitheredDead ? `
              <div class="farm-plot-header-bar">
                <div class="farm-plot-hearts">${heartsHtml}</div>
                <div class="farm-plot-progress-dots">${dotsHtml}</div>
              </div>
            ` : ''}

            <!-- Huy hiệu giọt nước tưới -->
            ${!isCooldown && !isReady && !hasWorm && !isWitheredDead ? `
              <div class="farm-water-badge" title="Tưới cây">💧</div>
            ` : ''}

            <!-- Huy hiệu phân bón (Icon 🧪) -->
            ${plot.hasFertilizer && !isReady && !isWitheredDead ? `
              <div class="farm-fertilized-badge" title="Đã bón phân: Lớn 2 giai đoạn">🧪</div>
            ` : ''}

            <!-- Huy hiệu giỏ thu hoạch -->
            ${isReady && !isWitheredDead ? `
              <div class="farm-basket-badge" title="Chạm để thu hoạch">🧺</div>
            ` : ''}

            <!-- Cảnh báo đang héo -->
            ${isWitherWarning && !isWitheredDead ? `
              <div class="farm-wither-warning-badge">🥀 Đang héo!</div>
            ` : ''}

            <!-- Sprite cây trồng -->
            <img class="farm-crop-sprite ${!isWitheredDead && !isReady ? 'farm-sway-anim' : ''}" 
                 src="${spriteSrc}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                 alt="${crop.name}">
            <span class="farm-crop-emoji" style="display:none;">${crop.icon}</span>

            <!-- Sâu bám trên cây -->
            ${hasWorm && !isWitheredDead ? `
              <img class="farm-worm-sprite" src="assets/farm/worm.png" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="worm">
              <span class="farm-crop-emoji" style="display:none; font-size:24px; position:absolute; bottom:18px; left:8px;">🐛</span>
              <div class="farm-worm-hearts">${'💚'.repeat(plot.worm.hp)}</div>
            ` : ''}

            <!-- Đồng hồ đếm ngược đang hồi -->
            ${isCooldown && !isReady && !isWitheredDead ? `
              <div class="farm-cooling-overlay">
                <span class="farm-cooling-timer">${cooldownRemaining}s</span>
                <div class="farm-cooling-track">
                  <div class="farm-cooling-bar" style="width: ${(cooldownRemaining / crop.cooldownSec) * 100}%"></div>
                </div>
              </div>
            ` : ''}

            <!-- Cây đã héo/chết: Dọn sạch -->
            ${isWitheredDead ? `
              <div class="farm-clean-overlay">
                <span class="farm-withered-text">Cây đã héo</span>
                <button type="button" class="btn btn-secondary farm-btn-clean" data-clean-id="${plot.id}">Dọn sạch</button>
              </div>
            ` : ''}

            <!-- Tên từ vựng nhỏ dưới ô -->
            ${plot.word ? `
              <div class="farm-plot-word-label">${plot.word}</div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Lưới luôn hiện thêm 4 ô khoá tiếp theo (Group B)
      const maxLockedPlots = Math.min(20, unlockedCount + 4);
      let lockedHtml = '';
      for (let i = unlockedCount + 1; i <= maxLockedPlots; i++) {
        const reqLevel = 1 + Math.ceil((i - 6) / 2);
        lockedHtml += `
          <div class="farm-plot farm-plot-locked" data-locked-req-level="${reqLevel}" data-locked-plot-idx="${i}" title="Cần Cấp ${reqLevel} để mở ô này">
            <div class="farm-locked-icon">🔒</div>
            <div class="farm-locked-label">Cấp ${reqLevel}</div>
          </div>
        `;
      }

      grid.innerHTML = plotsHtml + lockedHtml;
    },

    // 5.10. RENDER KHU CÂY ĂN QUẢ (Group C)
    renderTreeGrid() {
      const grid = document.getElementById('farm-tree-grid');
      if (!grid) return;

      const now = Date.now();
      const unlockedTrees = this.getUnlockedTreePlotsCount();

      grid.innerHTML = this.state.treePlots.map((plot, idx) => {
        const plotNum = idx + 1;
        const reqLevel = this.getReqLevelForTreePlot(plotNum);
        const isLocked = plotNum > unlockedTrees;

        if (isLocked) {
          return `
            <div class="farm-tree-plot farm-plot-locked" data-tree-locked-level="${reqLevel}" title="Cần Cấp ${reqLevel} để mở ô cây ăn quả này">
              <div class="farm-locked-icon">🔒</div>
              <div class="farm-locked-label">Cấp ${reqLevel}</div>
            </div>
          `;
        }

        if (plot.state === 'empty') {
          return `
            <div class="farm-tree-plot farm-plot-empty" data-tree-plot-id="${plot.id}">
              <img class="farm-plot-soil-bg" src="assets/farm/soil-empty.png" onerror="this.style.display='none'" alt="soil">
              <span class="farm-empty-plus">🌳</span>
              <span class="farm-empty-label">Trồng cây</span>
            </div>
          `;
        }

        const treeConf = FRUIT_TREES[plot.treeType] || FRUIT_TREES.apple;
        const isCooldown = plot.cooldownUntil && plot.cooldownUntil > now;
        const cooldownRemaining = isCooldown ? Math.ceil((plot.cooldownUntil - now) / 1000) : 0;
        const isReady = plot.stage >= 3;
        const isWithered = plot.state === 'withered' || plot.hp <= 0;

        const classes = ['farm-tree-plot'];
        if (isWithered) classes.push('farm-plot-withered');
        else if (isReady) classes.push('farm-plot-ready');
        else if (isCooldown) classes.push('farm-plot-cooling');

        const stageIdx = Math.min(2, Math.max(0, (plot.stage || 1) - 1));
        const spriteSrc = isWithered ? 'assets/farm/crop-withered.png' : treeConf.sprites[stageIdx];

        let heartsHtml = '';
        for (let i = 0; i < treeConf.maxHp; i++) {
          heartsHtml += i < plot.hp ? '❤️' : '<span style="filter:grayscale(1) opacity(0.35);">❤️</span>';
        }

        let dotsHtml = '';
        for (let i = 0; i < 3; i++) {
          dotsHtml += i < plot.stage ? '●' : '○';
        }

        return `
          <div class="${classes.join(' ')}" data-tree-plot-id="${plot.id}">
            <img class="farm-plot-soil-bg" src="assets/farm/soil-empty.png" onerror="this.style.display='none'" alt="soil">

            ${!isWithered ? `
              <div class="farm-plot-header-bar">
                <div class="farm-plot-hearts">${heartsHtml}</div>
                <div class="farm-plot-progress-dots">${dotsHtml}</div>
              </div>
            ` : ''}

            ${!isCooldown && !isReady && !isWithered ? `
              <div class="farm-water-badge" title="Tưới cây ăn quả">💧</div>
            ` : ''}

            ${isReady && !isWithered ? `
              <div class="farm-basket-badge" title="Thu hoạch quả">🧺</div>
            ` : ''}

            <img class="farm-tree-sprite" src="${spriteSrc}" alt="${treeConf.name}">

            <div class="farm-tree-word-count">🌳 ${plot.words ? plot.words.length : 0} từ</div>

            ${isCooldown && !isReady && !isWithered ? `
              <div class="farm-cooling-overlay">
                <span class="farm-cooling-timer">${cooldownRemaining}s</span>
              </div>
            ` : ''}

            ${isWithered ? `
              <div class="farm-clean-overlay">
                <span class="farm-withered-text">Cây đã héo</span>
                <button type="button" class="btn btn-secondary farm-btn-clean" data-clean-tree-id="${plot.id}">Dọn</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    },

    getUnlockedTreePlotsCount() {
      const lvl = this.state.level || 1;
      if (lvl < 2) return 2;
      if (lvl < 4) return 3;
      if (lvl < 6) return 4;
      if (lvl < 8) return 5;
      return 6;
    },

    getReqLevelForTreePlot(index) {
      if (index <= 2) return 1;
      if (index === 3) return 2;
      if (index === 4) return 4;
      if (index === 5) return 6;
      return 8;
    },

    getMissingXpForLevel(targetLevel) {
      if (targetLevel <= this.state.level) return 0;
      let totalNeeded = 0;
      totalNeeded += Math.max(0, (20 + this.state.level * 10) - this.state.xp);
      for (let l = this.state.level + 1; l < targetLevel; l++) {
        totalNeeded += 20 + l * 10;
      }
      return totalNeeded;
    },

    showLockedPlotToast(reqLevel) {
      const missing = this.getMissingXpForLevel(reqLevel);
      if (window.showToast) {
        window.showToast(`Cần lên Cấp ${reqLevel} để mở ô này (còn thiếu ${missing} XP)`);
      }
    },

    showLockedTreePlotToast(reqLevel) {
      const missing = this.getMissingXpForLevel(reqLevel);
      if (window.showToast) {
        window.showToast(`Cần lên Cấp ${reqLevel} để mở ô cây ăn quả này (còn thiếu ${missing} XP)`);
      }
    },

    // =========================================================================
    // TICKER (CẬP NHẬT ĐỒNG HỒ HỒI MỖI GIÂY)
    // =========================================================================
    tick() {
      if (!this.isOpen) return;
      const now = Date.now();
      let needsRerender = false;

      this.state.plots.forEach(plot => {
        if (plot.cooldownUntil && plot.cooldownUntil > 0) {
          if (now >= plot.cooldownUntil) {
            plot.cooldownUntil = 0;
            needsRerender = true;
          }
        }
      });

      if (this.state.treePlots) {
        this.state.treePlots.forEach(plot => {
          if (plot.cooldownUntil && plot.cooldownUntil > 0) {
            if (now >= plot.cooldownUntil) {
              plot.cooldownUntil = 0;
              needsRerender = true;
            }
          }
        });
      }

      if (needsRerender) {
        this.saveState();
        this.render();
      } else {
        // Cập nhật số giây text trực tiếp trên DOM
        document.querySelectorAll('.farm-plot-cooling').forEach(plotEl => {
          const plotId = parseInt(plotEl.getAttribute('data-plot-id'), 10);
          const plot = this.state.plots.find(p => p.id === plotId);
          if (plot && plot.cooldownUntil > now) {
            const crop = CROP_TYPES[plot.cropType] || CROP_TYPES.radish;
            const remaining = Math.ceil((plot.cooldownUntil - now) / 1000);
            const timerEl = plotEl.querySelector('.farm-cooling-timer');
            const barEl = plotEl.querySelector('.farm-cooling-bar');
            if (timerEl) timerEl.textContent = `${remaining}s`;
            if (barEl) barEl.style.width = `${(remaining / crop.cooldownSec) * 100}%`;
          }
        });
      }
    },

    // =========================================================================
    // TƯƠNG TÁC Ô ĐẤT (CLICK / TAP)
    // =========================================================================
    handlePlotClick(plotId) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot) return;

      const now = Date.now();

      // 1. Ô trống -> Mở bảng chọn hạt giống
      if (plot.state === 'empty') {
        this.openSeedPickerSheet(plotId);
        return;
      }

      // 2. Cây đã chết -> Dọn sạch
      if (plot.state === 'withered' || plot.hp <= 0) {
        this.cleanPlot(plotId);
        return;
      }

      // 3. Cây chín -> Thu hoạch
      if (plot.stage >= plot.stagesNeeded) {
        this.harvest(plotId);
        return;
      }

      // 4. Có sâu -> Bắt sâu trước!
      if (plot.worm) {
        this.openQuiz(plotId, true);
        return;
      }

      // 5. Cây đang hồi -> Báo toast
      if (plot.cooldownUntil && plot.cooldownUntil > now) {
        const remaining = Math.ceil((plot.cooldownUntil - now) / 1000);
        if (window.showToast) {
          window.showToast(`Đang hồi, còn ${remaining}s nữa mới tưới được!`);
        }
        return;
      }

      // 6. Cây đang lớn -> Tưới (Quiz)
      this.openQuiz(plotId, false);
    },

    // =========================================================================
    // BẢNG CHỌN HẠT GIỐNG (SEED PICKER BOTTOM SHEET)
    // =========================================================================
    openSeedPickerSheet(plotId) {
      const sheet = document.getElementById('farm-sheet-seed');
      if (!sheet) return;

      const word = this.pickNextWord();
      sheet.setAttribute('data-target-plot', plotId);
      sheet.setAttribute('data-selected-word-id', word.id);

      // Hiển thị danh sách hạt giống ban đầu
      const stepSelect = document.getElementById('farm-seed-step-select');
      const stepConfirm = document.getElementById('farm-seed-step-confirm');
      if (stepSelect) stepSelect.style.display = 'block';
      if (stepConfirm) stepConfirm.style.display = 'none';

      sheet.classList.add('active');
    },

    selectSeedType(cropType) {
      const sheet = document.getElementById('farm-sheet-seed');
      if (!sheet) return;

      sheet.setAttribute('data-selected-crop', cropType);
      const wordId = parseInt(sheet.getAttribute('data-selected-word-id'), 10);
      let word = this.cachedWordsPool.find(w => w.id === wordId) || this.pickNextWord();

      this.showSeedConfirmCard(cropType, word);
    },

    showSeedConfirmCard(cropType, word) {
      const stepSelect = document.getElementById('farm-seed-step-select');
      const stepConfirm = document.getElementById('farm-seed-step-confirm');
      const cardEl = document.getElementById('farm-seed-confirm-body');

      const crop = CROP_TYPES[cropType];

      if (cardEl) {
        cardEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #34d399; font-weight: 700;">
            <img src="${crop.seedImg}" style="width: 28px; height: 28px; image-rendering: pixelated;" onerror="this.style.display='none'">
            <span>Hạt giống ${crop.name} (Miễn phí)</span>
          </div>
          <div class="farm-plant-confirm-card">
            <div class="farm-plant-word-row">
              <span class="farm-plant-word">${word.word}</span>
              ${word.ipa ? `<span class="farm-plant-ipa">${word.ipa}</span>` : ''}
              <button type="button" class="btn-audio" style="width: 28px; height: 28px; font-size: 13px; margin-left: auto;" onclick="window.wordsManager?.playPronunciation('${word.word}', '${word.audioUrl || ''}')">🔊</button>
            </div>
            <div class="farm-plant-meaning">${word.meaning}</div>
            ${word.example ? `<div class="farm-plant-example">"${word.example}"</div>` : ''}
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; margin-bottom: 8px;">
            Cần tưới đúng ${crop.stagesNeeded} lần • Hồi ${crop.cooldownSec}s • Thu hoạch ${crop.rewardCoins} vàng + ${crop.rewardXp} XP
          </div>
        `;
      }

      if (stepSelect) stepSelect.style.display = 'none';
      if (stepConfirm) stepConfirm.style.display = 'block';
    },

    changeSeedWord() {
      const sheet = document.getElementById('farm-sheet-seed');
      if (!sheet) return;
      const currentWordId = parseInt(sheet.getAttribute('data-selected-word-id'), 10);
      const cropType = sheet.getAttribute('data-selected-crop');

      const nextWord = this.pickNextWord(currentWordId);
      sheet.setAttribute('data-selected-word-id', nextWord.id);
      this.showSeedConfirmCard(cropType, nextWord);
    },

    confirmPlant() {
      const sheet = document.getElementById('farm-sheet-seed');
      if (!sheet) return;

      const plotId = parseInt(sheet.getAttribute('data-target-plot'), 10);
      const cropType = sheet.getAttribute('data-selected-crop');
      const wordId = parseInt(sheet.getAttribute('data-selected-word-id'), 10);

      if ((this.state.food || 0) < 1) {
        if (window.showToast) window.showToast('Không đủ lương thực! Cần 1 🍞 để gieo hạt.');
        return;
      }

      const word = this.cachedWordsPool.find(w => w.id === wordId) || this.pickNextWord();
      const plot = this.state.plots.find(p => p.id === plotId);
      const crop = CROP_TYPES[cropType];

      if (plot && crop) {
        this.state.food -= 1; // Gieo hạt tốn 1 lương thực
        plot.cropType = cropType;
        plot.wordId = word.id;
        plot.word = word.word;
        plot.ipa = word.ipa;
        plot.meaning = word.meaning;
        plot.example = word.example;
        plot.audioUrl = word.audioUrl;
        plot.stage = 0; // Hạt giống vừa gieo
        plot.stagesNeeded = crop.stagesNeeded;
        plot.hp = crop.maxHp;
        plot.maxHp = crop.maxHp;
        plot.cooldownUntil = 0;
        plot.hasFertilizer = false;
        plot.worm = null;
        plot.state = 'growing';

        this.saveState();
        this.render();
        this.playSound('pop');

        if (window.showToast) {
          window.showToast(`Đã gieo ${crop.name} (-1 🍞, "${word.word}") thành công!`);
        }
      }

      sheet.classList.remove('active');
    },

    // =========================================================================
    // QUIZ TƯỚI CÂY & BẮT SÂU
    // =========================================================================
    openQuiz(plotId, isWormQuiz = false) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot) return;

      const crop = CROP_TYPES[plot.cropType];

      // Xác định dạng quiz theo thứ tự giai đoạn & cài đặt:
      // chọn nghĩa < điền từ < AI sentence < nghe điền từ
      const activeModes = [];
      if (this.settings.modes.choice) activeModes.push('choice');
      if (this.settings.modes.typing) activeModes.push('typing');
      if (this.settings.modes.ai) activeModes.push('ai');
      if (this.settings.modes.listening) activeModes.push('listening');

      if (activeModes.length === 0) activeModes.push('choice');

      // Chọn dạng câu hỏi theo giai đoạn
      const modeIdx = Math.min(activeModes.length - 1, Math.max(0, plot.stage));
      const mode = activeModes[modeIdx];

      this.activeQuiz = {
        plotId: plot.id,
        cropType: plot.cropType,
        isWormQuiz: isWormQuiz,
        mode: mode,
        word: {
          id: plot.wordId,
          word: plot.word,
          ipa: plot.ipa,
          meaning: plot.meaning,
          example: plot.example,
          audioUrl: plot.audioUrl
        },
        failCount: 0
      };

      this.renderQuizModal();
    },

    updateQuizHeaderStatus() {
      const statusEl = document.getElementById('farm-quiz-header-status');
      if (!statusEl || !this.activeQuiz) return;

      const q = this.activeQuiz;
      const plot = this.state.plots.find(p => p.id === q.plotId);
      if (!plot) return;
      const crop = CROP_TYPES[q.cropType] || {};

      let hpString = '';
      const maxPlantHp = plot.maxHp || crop.maxHp || 3;
      let plantHeartsHtml = '';
      for (let i = 0; i < maxPlantHp; i++) {
        plantHeartsHtml += i < plot.hp ? '❤️' : '<span style="filter:grayscale(1) opacity(0.35);">❤️</span>';
      }

      if (q.isWormQuiz && plot.worm) {
        const maxWormHp = plot.worm.maxHp || (crop.id === 'radish' ? 2 : 3);
        let wormHeartsHtml = '';
        for (let i = 0; i < maxWormHp; i++) {
          wormHeartsHtml += i < plot.worm.hp ? '💚' : '<span style="filter:grayscale(1) opacity(0.35);">💚</span>';
        }
        hpString = `Sâu: ${wormHeartsHtml} | Cây: ${plantHeartsHtml}`;
      } else {
        hpString = `Máu: ${plantHeartsHtml}`;
      }

      let fertBtnHtml = '';
      if (!q.isWormQuiz && plot.stage < plot.stagesNeeded) {
        if (plot.hasFertilizer) {
          fertBtnHtml = '<span style="color:#a78bfa; font-size:11px; font-weight:700; margin-left: 8px;">🌻 Đã bón phân</span>';
        } else {
          fertBtnHtml = `<button type="button" class="btn btn-secondary" style="padding: 2px 7px; font-size: 11px; border-color: #8b5cf6; color: #a78bfa; margin-left: 8px;" onclick="FarmGame.fertilizePlot(${plot.id}); FarmGame.updateQuizHeaderStatus();">🌻 Bón phân (${this.state.fertilizer})</button>`;
        }
      }

      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div class="farm-quiz-hearts">${hpString} ${fertBtnHtml}</div>
          <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">
            ${q.isWormQuiz ? 'Đánh bại sâu' : `Lần tưới: ${plot.stage + 1}/${plot.stagesNeeded}`}
          </span>
        </div>
      `;
    },

    async renderQuizModal() {
      const sheet = document.getElementById('farm-sheet-quiz');
      if (!sheet || !this.activeQuiz) return;

      const q = this.activeQuiz;
      const plot = this.state.plots.find(p => p.id === q.plotId);
      const crop = CROP_TYPES[q.cropType];

      // Tiêu đề
      const titleEl = document.getElementById('farm-quiz-title');
      if (titleEl) {
        titleEl.textContent = q.isWormQuiz ? 'Bắt sâu! 🐛' : `Tưới cây — ${crop.name}`;
      }

      // Trạng thái máu cây / máu sâu & số lần tưới (Cập nhật trực tiếp)
      this.updateQuizHeaderStatus();

      const bodyEl = document.getElementById('farm-quiz-body');
      if (!bodyEl) return;

      // Chuẩn bị nội dung câu hỏi
      let contentHtml = '';

      if (q.mode === 'ai') {
        // Chế độ 4: Câu điền từ AI
        bodyEl.innerHTML = `
          <div class="farm-quiz-prompt-card" style="padding: 24px 16px;">
            <div style="font-size: 28px; margin-bottom: 6px;">⚡</div>
            <div style="font-size: 0.95rem; color: #f59e0b; font-weight: 700;">Groq AI đang tạo câu đố...</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Tạo ngữ cảnh siêu tốc cho từ "${q.word.word}"</div>
          </div>
        `;
        sheet.classList.add('active');

        try {
          const aiRes = await window.api.generateAiSentence(q.word.word, q.word.meaning);
          if (aiRes && aiRes.success && aiRes.data && aiRes.data.sentence) {
            const aiData = aiRes.data;
            const providerTag = aiData.provider ? `⚡ ${aiData.provider}` : '🤖 AI';
            contentHtml = `
              <div class="farm-quiz-prompt-card">
                <span style="font-size: 0.8rem; color: #f59e0b; font-weight: 700;">${providerTag}:</span>
                <div class="farm-quiz-question-word" style="font-size: 1.15rem; line-height: 1.5; color: #f1f5f9; margin: 8px 0; font-weight: 600;">
                  "${aiData.sentence}"
                </div>
                ${aiData.hint ? `<div style="font-size: 0.82rem; color: #38bdf8; font-style: italic;">💡 Gợi ý nghĩa: ${aiData.hint}</div>` : ''}
              </div>
              <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Điền từ còn thiếu vào chỗ trống..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
              <button type="button" class="btn btn-primary" id="farm-quiz-submit-btn" style="width: 100%; min-height: 48px;">Kiểm tra</button>
            `;
          } else {
            throw new Error(aiRes?.message || 'Không sinh được câu');
          }
        } catch (e) {
          console.warn('Lỗi gọi AI, chuyển về điền từ cơ bản:', e);
          // Fallback về điền từ nếu AI lỗi
          contentHtml = `
            <div class="farm-quiz-prompt-card">
              <span style="font-size: 0.82rem; color: var(--text-secondary);">Gõ từ tiếng Anh có nghĩa:</span>
              <div class="farm-quiz-question-word" style="color: #38bdf8;">"${q.word.meaning}"</div>
            </div>
            <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ tiếng Anh tại đây..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
            <button type="button" class="btn btn-primary" id="farm-quiz-submit-btn" style="width: 100%; min-height: 48px;">Kiểm tra</button>
          `;
        }
      } else if (q.mode === 'listening') {
        // 1. Nghe điền từ
        contentHtml = `
          <div class="farm-quiz-prompt-card">
            <button type="button" class="btn-audio" id="farm-quiz-play-audio" style="width: 72px; height: 72px; font-size: 32px; border-radius: 50%;">🔊</button>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Nghe và gõ từ chính xác</div>
          </div>
          <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ bạn nghe được..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
          <button type="button" class="btn btn-primary" id="farm-quiz-submit-btn" style="width: 100%; min-height: 48px;">Kiểm tra</button>
        `;
      } else if (q.mode === 'typing') {
        // 2. Điền từ
        contentHtml = `
          <div class="farm-quiz-prompt-card">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">Gõ từ tiếng Anh có nghĩa:</span>
            <div class="farm-quiz-question-word" style="color: #38bdf8;">"${q.word.meaning}"</div>
          </div>
          <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ tiếng Anh tại đây..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
          <button type="button" class="btn btn-primary" id="farm-quiz-submit-btn" style="width: 100%; min-height: 48px;">Kiểm tra</button>
        `;
      } else {
        // 3. Chọn nghĩa (Choice)
        // Tạo 4 đáp án (1 đúng + 3 sai từ cached pool)
        const wrongPool = this.cachedWordsPool.filter(w => w.meaning !== q.word.meaning);
        const shuffledWrong = wrongPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        const allOptions = [q.word.meaning, ...shuffledWrong.map(w => w.meaning)].sort(() => 0.5 - Math.random());

        contentHtml = `
          <div class="farm-quiz-prompt-card">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="farm-quiz-question-word">${q.word.word}</span>
              <button type="button" class="btn-audio" style="width: 28px; height: 28px; font-size: 13px;" onclick="window.wordsManager?.playPronunciation('${q.word.word}', '${q.word.audioUrl || ''}')">🔊</button>
            </div>
            ${q.word.ipa ? `<span style="font-size: 0.85rem; color: #38bdf8; font-family: monospace;">${q.word.ipa}</span>` : ''}
          </div>
          <div class="farm-quiz-options">
            ${allOptions.map(opt => `
              <button type="button" class="farm-quiz-opt-btn" data-answer="${encodeURIComponent(opt)}">
                ${opt}
              </button>
            `).join('')}
          </div>
        `;
      }

      bodyEl.innerHTML = `
        ${contentHtml}
        <div id="farm-quiz-hint-box" style="display: none;" class="farm-quiz-hint-box"></div>
      `;

      sheet.classList.add('active');

      // Tự động focus ô nhập nếu là chế độ gõ
      const inputEl = document.getElementById('farm-quiz-input');
      if (inputEl) {
        setTimeout(() => inputEl.focus(), 250);
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.checkQuizAnswer(inputEl.value.trim());
        });
      }

      // Phát âm thanh ngay nếu là chế độ nghe
      if (q.mode === 'listening') {
        setTimeout(() => {
          window.wordsManager?.playPronunciation(q.word.word, q.word.audioUrl);
        }, 300);
      }

      // Bắt sự kiện nộp bài
      document.getElementById('farm-quiz-submit-btn')?.addEventListener('click', () => {
        const val = document.getElementById('farm-quiz-input')?.value || '';
        this.checkQuizAnswer(val.trim());
      });

      document.getElementById('farm-quiz-play-audio')?.addEventListener('click', () => {
        window.wordsManager?.playPronunciation(q.word.word, q.word.audioUrl);
      });

      // Bắt sự kiện chọn đáp án trắc nghiệm
      document.querySelectorAll('.farm-quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ans = decodeURIComponent(btn.getAttribute('data-answer'));
          this.checkQuizAnswer(ans, btn);
        });
      });
    },

    // Kiểm tra câu trả lời
    checkQuizAnswer(userAnswer, targetBtnEl = null) {
      if (!this.activeQuiz) return;
      const q = this.activeQuiz;
      const plot = this.state.plots.find(p => p.id === q.plotId);
      if (!plot) return;

      const crop = CROP_TYPES[q.cropType];
      let isCorrect = false;

      if (q.mode === 'choice') {
        isCorrect = (userAnswer.toLowerCase() === q.word.meaning.toLowerCase());
      } else {
        // Gõ từ tiếng Anh (cho cả typing và listening)
        isCorrect = (userAnswer.trim().toLowerCase() === q.word.word.trim().toLowerCase());
      }

      if (isCorrect) {
        // ================= TRẢ LỜI ĐÚNG =================
        if (targetBtnEl) targetBtnEl.classList.add('correct');
        this.playSound('pop');

        if (q.isWormQuiz && plot.worm) {
          // Bắt sâu: Trừ 1 máu sâu
          plot.worm.hp -= 1;
          this.updateQuizHeaderStatus();
          if (plot.worm.hp <= 0) {
            // Đã bắt xong sâu!
            plot.worm = null;
            this.state.coins += 10;
            this.gainXp(10);
            this.state.quests.worms += 1;
            if (window.showToast) window.showToast('🐛 Đã bắt được sâu! +10 vàng, +10 XP');
          } else {
            if (window.showToast) window.showToast('Đúng rồi! Sâu mất 1 máu.');
          }
        } else {
          // Tưới cây bình thường:
          // Nếu đang héo (1 HP): hồi 1 máu trước, sau đó mới lớn
          if (plot.hp === 1) {
            plot.hp = Math.min(plot.maxHp, 2);
            if (window.showToast) window.showToast('🌿 Cây đã hồi phục, thoát trạng thái héo!');
          }

          // Tăng giai đoạn (+2 nếu đã bón phân)
          const growth = plot.hasFertilizer ? 2 : 1;
          plot.stage = Math.min(plot.stagesNeeded, plot.stage + growth);
          plot.hasFertilizer = false; // Tiêu thụ bón phân

          // Thời gian hồi sau tưới
          plot.cooldownUntil = Date.now() + crop.cooldownSec * 1000;

          // Cộng XP và nhiệm vụ
          this.gainXp(5);
          this.state.quests.watered += 1;

          // 20% tỉ lệ xuất hiện sâu sau khi tưới
          this.maybeSpawnWorm(plot.id);
        }

        this.saveState();
        this.render();

        // Tự động đóng modal sau 600ms
        setTimeout(() => {
          document.getElementById('farm-sheet-quiz')?.classList.remove('active');
          this.activeQuiz = null;
        }, 650);

      } else {
        // ================= TRẢ LỜI SAI =================
        if (targetBtnEl) targetBtnEl.classList.add('incorrect');
        q.failCount += 1;

        // Trừ 1 máu cây (cả lúc tưới lẫn bắt sâu)
        plot.hp -= 1;

        // Cập nhật ngay lập tức tim máu trên bảng quiz
        this.updateQuizHeaderStatus();

        if (plot.hp <= 0) {
          // Cây chết
          plot.state = 'withered';
          if (plot.worm) plot.worm = null;
          this.saveState();
          this.render();

          if (window.showToast) {
            window.showToast('🥀 Rất tiếc, cây đã héo chết do hết máu!');
          }

          setTimeout(() => {
            document.getElementById('farm-sheet-quiz')?.classList.remove('active');
            this.activeQuiz = null;
          }, 800);
          return;
        }

        this.saveState();
        this.render();

        // Thang gợi ý giúp học sinh:
        // Lần 1: Chữ cái đầu + nghĩa
        // Lần 2: Hiện cả từ + chuyển sang câu hỏi trắc nghiệm dễ hơn
        const hintBox = document.getElementById('farm-quiz-hint-box');
        if (hintBox) {
          hintBox.style.display = 'block';
          if (q.failCount === 1) {
            const firstLetter = q.word.word.charAt(0).toUpperCase();
            hintBox.innerHTML = `💡 <b>Gợi ý lần 1:</b> Từ bắt đầu bằng chữ <b>"${firstLetter}..."</b> • Nghĩa: <i>"${q.word.meaning}"</i>`;
          } else {
            hintBox.innerHTML = `📖 <b>Đáp án:</b> <b style="color:#34d399;">${q.word.word}</b> [${q.word.ipa || ''}] = <i>${q.word.meaning}</i><br>Đã chuyển câu hỏi sang dạng dễ hơn để bạn ôn lại!`;
            // Chuyển sang dạng trắc nghiệm
            q.mode = 'choice';
            setTimeout(() => this.renderQuizModal(), 1200);
          }
        }
      }
    },

    // 20% sinh sâu trên cây đang lớn
    maybeSpawnWorm(currentWateredPlotId) {
      const activeWormsCount = this.state.plots.filter(p => p.worm).length;
      if (activeWormsCount >= 2) return; // Tối đa 2 sâu

      if (Math.random() <= 0.20) {
        const candidates = this.state.plots.filter(p => 
          p.id !== currentWateredPlotId &&
          p.state === 'growing' &&
          p.stage < p.stagesNeeded &&
          p.hp > 0 &&
          !p.worm
        );

        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const crop = CROP_TYPES[target.cropType];
          const wormHp = crop.id === 'radish' ? 2 : 3;
          target.worm = { hp: wormHp, maxHp: wormHp };
          if (window.showToast) {
            window.showToast('⚠️ Một con sâu 🐛 vừa xuất hiện phá hoại cây của bạn!');
          }
        }
      }
    },

    // =========================================================================
    // BÓN PHÂN & MUA PHÂN BÓN
    // =========================================================================
    buyFertilizer() {
      if (this.state.coins < 15) {
        if (window.showToast) window.showToast('Không đủ vàng! Thu hoạch thêm cây nhé.');
        return;
      }

      this.state.coins -= 15;
      this.state.fertilizer += 1;
      this.saveState();
      this.render();
      this.playSound('pop');

      const chip = document.querySelector('.farm-fertilizer-chip');
      chip?.classList.add('farm-bump-anim');
      setTimeout(() => chip?.classList.remove('farm-bump-anim'), 350);

      if (window.showToast) {
        window.showToast('Đã mua 1 gói phân bón (15 vàng)!');
      }
    },

    fertilizePlot(plotId) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot || plot.state !== 'growing' || plot.stage >= plot.stagesNeeded) return;

      if (this.state.fertilizer <= 0) {
        if (confirm('Bạn chưa có phân bón. Mua ngay 1 gói với 15 vàng?')) {
          this.buyFertilizer();
        }
        return;
      }

      if (plot.hasFertilizer) {
        if (window.showToast) window.showToast('Cây này đã được bón phân trước đó rồi!');
        return;
      }

      this.state.fertilizer -= 1;
      plot.hasFertilizer = true;
      this.saveState();
      this.render();
      this.playSound('pop');

      if (window.showToast) {
        window.showToast('Đã bón phân! Lần tưới tới cây sẽ lớn 2 giai đoạn.');
      }
    },

    // =========================================================================
    // THU HOẠCH (HARVEST) & HẸN MỌC LẠI HÔM SAU
    // =========================================================================
    async harvest(plotId) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot || plot.stage < plot.stagesNeeded) return;

      const crop = CROP_TYPES[plot.cropType];

      // Thu hoạch nông sản: KHÔNG CÒN CHO VÀNG! Nhận lương thực:
      // Bắt đầu 2 lương thực, bonus tỉ lệ = cấp × 5% nhận 3 thay vì 2
      const bonusChance = (this.state.level || 1) * 0.05;
      const foodYield = Math.random() < bonusChance ? 3 : 2;

      this.state.food = (this.state.food || 0) + foodYield;
      if (!this.state.foodStorage) this.state.foodStorage = {};
      this.state.foodStorage[plot.cropType] = (this.state.foodStorage[plot.cropType] || 0) + 1;

      this.gainXp(crop.rewardXp);
      this.state.harvestedTodayCount = (this.state.harvestedTodayCount || 0) + 1;
      this.state.quests.harvested += 1;

      // Hẹn mọc lại hôm sau thành mầm
      const tomorrow = this.getTomorrowStr();
      if (!this.state.regrow) this.state.regrow = {};
      if (!this.state.regrow[tomorrow]) this.state.regrow[tomorrow] = [];
      this.state.regrow[tomorrow].push({
        wordId: plot.wordId,
        word: plot.word,
        ipa: plot.ipa,
        meaning: plot.meaning,
        example: plot.example
      });

      // Lưu thông tin để hiện thẻ popup
      const harvestedInfo = {
        word: plot.word,
        meaning: plot.meaning,
        foodYield: foodYield,
        rewardXp: crop.rewardXp
      };

      // Đánh dấu từ đã thuộc trong backend (nếu có id)
      if (plot.wordId && window.api?.toggleWordLearned) {
        try {
          await window.api.toggleWordLearned(plot.wordId);
        } catch (e) {}
      }

      // Đưa ô trở lại trống
      plot.cropType = null;
      plot.wordId = null;
      plot.word = null;
      plot.ipa = null;
      plot.meaning = null;
      plot.stage = 0;
      plot.hp = 0;
      plot.worm = null;
      plot.state = 'empty';

      this.saveState();
      this.render();
      this.playSound('ting');

      // Hiển thị thẻ "Đã thuộc!"
      this.showHarvestToast(harvestedInfo);
    },

    showHarvestToast(info) {
      let toast = document.getElementById('farm-harvest-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'farm-harvest-toast';
        toast.className = 'farm-harvest-toast';
        document.getElementById('farm-view')?.appendChild(toast);
      }

      toast.innerHTML = `
        <div class="harvest-title">✨ Đã thuộc lòng!</div>
        <div class="harvest-word">${info.word}</div>
        <div class="harvest-meaning">${info.meaning}</div>
        <div class="harvest-rewards">+${info.foodYield} 🍞 | +${info.rewardXp} XP</div>
      `;

      toast.classList.add('active');
      setTimeout(() => {
        toast.classList.remove('active');
      }, 2200);
    },

    // =========================================================================
    // DỌN SẠCH Ô ĐẤT CÂY CHẾT (FREE)
    // =========================================================================
    cleanPlot(plotId) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot) return;

      plot.cropType = null;
      plot.wordId = null;
      plot.word = null;
      plot.ipa = null;
      plot.meaning = null;
      plot.stage = 0;
      plot.hp = 0;
      plot.worm = null;
      plot.state = 'empty';

      this.saveState();
      this.render();
      this.playSound('pop');

      if (window.showToast) {
        window.showToast('Đã dọn sạch ô đất. Bạn có thể gieo từ mới!');
      }
    },

    // =========================================================================
    // CỘNG XP & LÊN CẤP NÔNG TRẠI
    // =========================================================================
    gainXp(amount) {
      this.state.xp += amount;
      const nextXp = 20 + this.state.level * 10;

      if (this.state.xp >= nextXp) {
        this.state.xp -= nextXp;
        this.state.level += 1;
        this.state.coins += 20;

        // Thêm 2 ô đất (tối đa 20 ô)
        const currentPlotCount = this.state.plots.length;
        if (currentPlotCount < 20) {
          const addCount = Math.min(2, 20 - currentPlotCount);
          for (let i = 0; i < addCount; i++) {
            this.state.plots.push({ id: this.state.plots.length + 1, state: 'empty' });
          }
        }

        this.playSound('ting');
        this.showLevelUpOverlay();
      }
    },

    showLevelUpOverlay() {
      const overlay = document.getElementById('farm-levelup-overlay');
      const titleEl = document.getElementById('farm-levelup-title');
      const descEl = document.getElementById('farm-levelup-desc');
      if (!overlay) return;

      const lvl = this.state.level;
      let treeBonus = '';
      if (lvl === 2) treeBonus = '<br><b style="color:#38bdf8;">+1 ô cây ăn quả & Mở khóa Cam 🍊</b>';
      else if (lvl === 4) treeBonus = '<br><b style="color:#38bdf8;">+1 ô cây ăn quả & Mở khóa Đào 🍑</b>';
      else if (lvl === 6) treeBonus = '<br><b style="color:#38bdf8;">+1 ô cây ăn quả & Mở khóa Lê 🍐</b>';
      else if (lvl === 8) treeBonus = '<br><b style="color:#38bdf8;">+1 ô cây ăn quả & Mở khóa Anh đào 🍒</b>';

      if (titleEl) titleEl.textContent = `🎉 Lên Cấp ${lvl}!`;
      if (descEl) descEl.innerHTML = `Bạn nhận được:<br><b style="color:#fbbf24;">+20 vàng</b> và <b style="color:#34d399;">+2 ô đất nông sản</b>!${treeBonus}`;

      overlay.classList.add('active');
    },

    // =========================================================================
    // XEM THÔNG TIN CẤP ĐỘ & XP (Group A)
    // =========================================================================
    openLevelInfoModal() {
      const modal = document.getElementById('farm-sheet-level-info');
      const body = document.getElementById('farm-level-info-body');
      if (!modal || !body) return;

      const lvl = this.state.level || 1;
      const curXp = this.state.xp || 0;
      const nextXp = 20 + lvl * 10;
      const missingXp = Math.max(0, nextXp - curXp);
      const pct = Math.min(100, Math.round((curXp / nextXp) * 100));

      let treeUnlockInfo = '';
      const nextLvl = lvl + 1;
      if (nextLvl === 2) treeUnlockInfo = '• 🌳 +1 ô cây ăn quả & Mở khóa giống cây 🍊 Cam';
      else if (nextLvl === 4) treeUnlockInfo = '• 🌳 +1 ô cây ăn quả & Mở khóa giống cây 🍑 Đào';
      else if (nextLvl === 6) treeUnlockInfo = '• 🌳 +1 ô cây ăn quả & Mở khóa giống cây 🍐 Lê';
      else if (nextLvl === 8) treeUnlockInfo = '• 🌳 +1 ô cây ăn quả & Mở khóa giống cây 🍒 Anh đào';

      body.innerHTML = `
        <div class="farm-level-card-info">
          <div class="farm-level-huge-badge">🌱 Cấp Hiện Tại: Cấp ${lvl}</div>
          
          <div style="margin: 12px 0 6px 0; font-size: 0.95rem; color: #94a3b8;">Tiến độ kinh nghiệm:</div>
          <div class="farm-xp-track" style="height: 14px; margin: 0 auto 8px auto; max-width: 280px;">
            <div class="farm-xp-bar" style="width: ${pct}%;"></div>
          </div>
          <div style="font-weight: 700; color: #a5b4fc; font-size: 0.9rem;">${curXp} / ${nextXp} XP (${pct}%)</div>

          <div class="farm-level-xp-needed-callout">
            Cần thêm <b style="color: #fbbf24;">${missingXp} XP</b> nữa để lên <b style="color: #34d399;">Cấp ${nextLvl}</b>
          </div>

          <div class="farm-level-rewards-list">
            <div style="font-weight: 700; color: #fbbf24; margin-bottom: 8px;">🎁 Phần thưởng Cấp ${nextLvl}:</div>
            <div class="farm-level-reward-item">🌱 +2 ô đất nông sản mới</div>
            <div class="farm-level-reward-item">🪙 +20 vàng</div>
            ${treeUnlockInfo ? `<div class="farm-level-reward-item" style="color:#38bdf8;">${treeUnlockInfo}</div>` : ''}
          </div>
        </div>
      `;

      modal.classList.add('active');
    },

    // =========================================================================
    // KHO LƯƠNG THỰC & NÔNG SẢN (Group C)
    // =========================================================================
    openStorageModal() {
      const modal = document.getElementById('farm-sheet-storage');
      const body = document.getElementById('farm-storage-body');
      if (!modal || !body) return;

      const food = this.state.food || 0;
      const storage = this.state.foodStorage || {};

      const items = [
        { id: 'radish', name: 'Củ cải', icon: '🥕' },
        { id: 'strawberry', name: 'Dâu tây', icon: '🍓' },
        { id: 'sunflower', name: 'Hướng dương', icon: '🌻' },
        { id: 'apple', name: 'Táo', icon: '🍎' },
        { id: 'orange', name: 'Cam', icon: '🍊' },
        { id: 'peach', name: 'Đào', icon: '🍑' },
        { id: 'pear', name: 'Lê', icon: '🍐' },
        { id: 'cherry', name: 'Anh đào', icon: '🍒' }
      ];

      body.innerHTML = `
        <div class="farm-storage-summary">
          <div>
            <div style="font-size: 0.85rem; color: #94a3b8;">Tổng Lương Thực Có Sẵn:</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">🍞 ${food}</div>
          </div>
          <button type="button" class="btn btn-primary" id="farm-storage-btn-go-shop" style="padding: 6px 12px; font-size: 0.85rem;">🛒 Mua thêm</button>
        </div>

        <div style="font-weight: 700; color: #e2e8f0; margin-bottom: 10px; font-size: 0.9rem;">Kho Nông Sản & Trái Cây Đã Thu Hoạch:</div>
        <div class="farm-storage-grid">
          ${items.map(it => `
            <div class="farm-storage-item">
              <span class="farm-storage-item-icon">${it.icon}</span>
              <span class="farm-storage-item-name">${it.name}</span>
              <span class="farm-storage-item-count">×${storage[it.id] || 0}</span>
            </div>
          `).join('')}
        </div>
      `;

      body.querySelector('#farm-storage-btn-go-shop')?.addEventListener('click', () => {
        modal.classList.remove('active');
        this.openShopModal();
      });

      modal.classList.add('active');
    },

    // =========================================================================
    // CỬA HÀNG NÔNG TRẠI (Extra Shop Requirement)
    // =========================================================================
    openShopModal() {
      const modal = document.getElementById('farm-sheet-shop');
      if (!modal) return;
      modal.classList.add('active');
    },

    buyFertilizerFromShop() {
      if ((this.state.coins || 0) < 15) {
        if (window.showToast) window.showToast('Không đủ vàng! Cần 15🪙 để mua phân bón.');
        return;
      }
      this.state.coins -= 15;
      this.state.fertilizer = (this.state.fertilizer || 0) + 1;
      this.saveState();
      this.renderHUD();
      this.playSound('pop');
      if (window.showToast) window.showToast('Đã mua 1 🧪 Phân bón tăng trưởng thành công!');
    },

    buyFoodFromShop() {
      if ((this.state.coins || 0) < 10) {
        if (window.showToast) window.showToast('Không đủ vàng! Cần 10🪙 để mua lương thực.');
        return;
      }
      this.state.coins -= 10;
      this.state.food = (this.state.food || 0) + 2;
      this.saveState();
      this.renderHUD();
      this.playSound('pop');
      if (window.showToast) window.showToast('Đã mua 2 🍞 Lương thực khẩn cấp thành công!');
    },

    // =========================================================================
    // TRỒNG, TƯỚI & THU HOẠCH CÂY ĂN QUẢ (Group C)
    // =========================================================================
    cleanTreePlot(plotId) {
      const plot = this.state.treePlots?.find(p => p.id === plotId);
      if (!plot) return;

      plot.treeType = null;
      plot.words = [];
      plot.stage = 0;
      plot.hp = 0;
      plot.cooldownUntil = 0;
      plot.state = 'empty';

      this.saveState();
      this.render();
      this.playSound('pop');

      if (window.showToast) {
        window.showToast('Đã dọn sạch ô cây ăn quả. Bạn có thể trồng cây mới!');
      }
    },

    openFruitTreeModal(plotId) {
      const sheet = document.getElementById('farm-sheet-fruit-tree');
      const listEl = document.getElementById('farm-fruit-tree-list');
      if (!sheet || !listEl) return;

      this.activeTreePlanting = { plotId, selectedTree: null, chosenWords: [] };

      document.getElementById('farm-fruit-step-select').style.display = 'block';
      document.getElementById('farm-fruit-step-confirm').style.display = 'none';

      const curLvl = this.state.level || 1;
      const food = this.state.food || 0;

      listEl.innerHTML = Object.values(FRUIT_TREES).map(tree => {
        const isLocked = tree.unlockLevel > curLvl;

        return `
          <div class="farm-fruit-card ${isLocked ? 'locked' : ''}" data-tree-type="${tree.id}">
            <span class="farm-fruit-card-icon">${tree.icon}</span>
            <div class="farm-fruit-card-info">
              <div class="farm-fruit-card-name">
                ${tree.name}
                <span class="farm-fruit-card-rarity" style="background:${tree.rarityColor}20; color:${tree.rarityColor}; border:1px solid ${tree.rarityColor}40;">${tree.rarity}</span>
                ${isLocked ? `<span style="font-size:0.75rem; color:#f87171; margin-left:auto;">🔒 Cần Cấp ${tree.unlockLevel}</span>` : ''}
              </div>
              <div class="farm-fruit-card-meta">
                ${isLocked ? `Mở ở Cấp ${tree.unlockLevel}` : `Trồng tốn ${tree.costFood} 🍞 • Thu ${tree.yieldFood} 🍞 + ${tree.rewardXp} XP • ${tree.maxWords} từ`}
              </div>
            </div>
            ${!isLocked ? `<button type="button" class="btn btn-primary" style="padding:4px 10px; font-size:0.8rem;">Chọn</button>` : ''}
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.farm-fruit-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
          const treeType = card.getAttribute('data-tree-type');
          this.selectFruitTreeType(treeType);
        });
      });

      sheet.classList.add('active');
    },

    selectFruitTreeType(treeType) {
      const tree = FRUIT_TREES[treeType];
      if (!tree) return;

      if ((this.state.food || 0) < tree.costFood) {
        if (window.showToast) window.showToast(`Không đủ lương thực! Cần ${tree.costFood} 🍞 để trồng cây ${tree.name}.`);
        return;
      }

      this.activeTreePlanting.selectedTree = treeType;
      this.reshuffleFruitTreeWords();

      document.getElementById('farm-fruit-step-select').style.display = 'none';
      document.getElementById('farm-fruit-step-confirm').style.display = 'block';
    },

    reshuffleFruitTreeWords() {
      if (!this.activeTreePlanting || !this.activeTreePlanting.selectedTree) return;
      const tree = FRUIT_TREES[this.activeTreePlanting.selectedTree];
      const count = tree.maxWords;

      // Lấy từ pool theo cài đặt từ vựng
      const words = this.pickMultipleRandomWords(count);
      this.activeTreePlanting.chosenWords = words;

      const confirmBody = document.getElementById('farm-fruit-confirm-body');
      if (confirmBody) {
        confirmBody.innerHTML = `
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 32px;">${tree.icon}</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Cây ${tree.name} (${tree.rarity})</div>
            <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 2px;">
              Chi phí: <b style="color:#fbbf24;">${tree.costFood} 🍞</b> • Thu hoạch: <b style="color:#34d399;">${tree.yieldFood} 🍞</b> + <b style="color:#a5b4fc;">${tree.rewardXp} XP</b>
            </div>
          </div>
          <div style="font-weight: 600; font-size: 0.85rem; color: #e2e8f0; margin-bottom: 6px;">
            Bộ ${words.length} từ vựng trên cây này:
          </div>
          <div style="max-height: 180px; overflow-y: auto; background: rgba(0,0,0,0.25); border-radius: 10px; padding: 8px;">
            ${words.map((w, idx) => `
              <div style="display:flex; justify-content:space-between; padding:4px 6px; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.85rem;">
                <span style="font-weight:600; color:#38bdf8;">${idx + 1}. ${w.word}</span>
                <span style="color:#cbd5e1;">${w.meaning}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    },

    pickMultipleRandomWords(count) {
      if (!this.cachedWordsPool || this.cachedWordsPool.length === 0) {
        return [
          { id: 9991, word: 'apple', meaning: 'quả táo' },
          { id: 9992, word: 'orange', meaning: 'quả cam' },
          { id: 9993, word: 'peach', meaning: 'quả đào' }
        ];
      }

      // Xáo trộn ngẫu nhiên và lấy count từ
      const shuffled = this.shuffle([...this.cachedWordsPool]);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    confirmFruitTreePlant() {
      if (!this.activeTreePlanting || !this.activeTreePlanting.selectedTree) return;
      const { plotId, selectedTree, chosenWords } = this.activeTreePlanting;
      const tree = FRUIT_TREES[selectedTree];

      if ((this.state.food || 0) < tree.costFood) {
        if (window.showToast) window.showToast('Không đủ lương thực để trồng cây này!');
        return;
      }

      this.state.food -= tree.costFood;

      const plotIndex = plotId - 1;
      this.state.treePlots[plotIndex] = {
        id: plotId,
        state: 'growing',
        treeType: selectedTree,
        words: chosenWords,
        stage: 1,
        stagesNeeded: 3,
        hp: tree.maxHp,
        maxHp: tree.maxHp,
        cooldownUntil: 0,
        hasFertilizer: false
      };

      this.saveState();
      this.render();
      this.playSound('pop');

      document.getElementById('farm-sheet-fruit-tree')?.classList.remove('active');
      this.activeTreePlanting = null;

      if (window.showToast) {
        window.showToast(`Đã trồng cây ${tree.name} thành công (-${tree.costFood} 🍞)!`);
      }
    },

    handleTreePlotClick(plotId) {
      const plot = this.state.treePlots.find(p => p.id === plotId);
      if (!plot) return;

      if (plot.state === 'empty') {
        this.openFruitTreeModal(plotId);
        return;
      }

      if (plot.state === 'ready') {
        this.harvestTree(plotId);
        return;
      }

      if (plot.state === 'withered' || plot.hp <= 0) {
        this.cleanTreePlot(plotId);
        return;
      }

      const now = Date.now();
      const isCooldown = plot.cooldownUntil && plot.cooldownUntil > now;
      if (isCooldown) {
        const remaining = Math.ceil((plot.cooldownUntil - now) / 1000);
        if (this.state.fertilizer > 0) {
          if (confirm(`Cây đang nghỉ ngơi (còn ${remaining}s). Bạn có muốn dùng 1 🧪 phân bón để tưới ngay không?`)) {
            this.state.fertilizer -= 1;
            plot.cooldownUntil = 0;
            this.saveState();
            this.render();
            this.startFruitTreeQuiz(plotId);
          }
        } else {
          if (window.showToast) window.showToast(`Cây đang nghỉ ngơi (còn ${remaining}s). Mua phân bón trong Shop để tưới ngay!`);
        }
        return;
      }

      // Tưới cây
      this.startFruitTreeQuiz(plotId);
    },

    startFruitTreeQuiz(plotId) {
      const plot = this.state.treePlots.find(p => p.id === plotId);
      if (!plot || !plot.words || plot.words.length === 0) return;

      const treeConf = FRUIT_TREES[plot.treeType];
      this.activeTreeQuiz = {
        plotId,
        wordIndex: 0,
        words: plot.words,
        firstTryErrors: {}
      };

      this.renderFruitTreeQuizModal();
    },

    renderFruitTreeQuizModal() {
      const sheet = document.getElementById('farm-sheet-fruit-quiz');
      const titleEl = document.getElementById('farm-fruit-quiz-title');
      const statusEl = document.getElementById('farm-fruit-quiz-status');
      const bodyEl = document.getElementById('farm-fruit-quiz-body');
      if (!sheet || !this.activeTreeQuiz) return;

      const q = this.activeTreeQuiz;
      const plot = this.state.treePlots.find(p => p.id === q.plotId);
      const treeConf = FRUIT_TREES[plot.treeType];

      if (titleEl) {
        titleEl.textContent = `Tưới Cây ${treeConf.name} — Từ ${q.wordIndex + 1}/${q.words.length}`;
      }

      // Render hearts & progress
      let plantHeartsHtml = '';
      for (let i = 0; i < treeConf.maxHp; i++) {
        plantHeartsHtml += i < plot.hp ? '❤️' : '<span style="filter:grayscale(1) opacity(0.35);">❤️</span>';
      }

      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div class="farm-quiz-hearts">Máu: ${plantHeartsHtml}</div>
          <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">
            Giai đoạn: ${plot.stage}/3 • Từ ${q.wordIndex + 1}/${q.words.length}
          </span>
        </div>
      `;

      const currentWord = q.words[q.wordIndex];

      // Chọn ngẫu nhiên 1 trong các chế độ học đang bật
      const availableModes = [];
      if (this.settings.modes.choice) availableModes.push('choice');
      if (this.settings.modes.typing) availableModes.push('typing');
      if (this.settings.modes.listening) availableModes.push('listening');
      if (availableModes.length === 0) availableModes.push('choice');

      const mode = availableModes[Math.floor(Math.random() * availableModes.length)];

      let quizHtml = '';

      if (mode === 'listening') {
        quizHtml = `
          <div style="text-align: center; padding: 20px 0;">
            <button type="button" class="btn-audio" id="farm-fruit-audio-btn" style="width: 72px; height: 72px; font-size: 32px; border-radius: 50%;">🔊</button>
            <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 12px;">Nghe và gõ lại từ tiếng Anh:</div>
            <div style="margin-top: 14px;">
              <input type="text" id="farm-fruit-input" class="form-input" placeholder="Gõ từ tại đây..." autocomplete="off" autocorrect="off" autocapitalize="none" enterkeyhint="go">
            </div>
            <button type="button" class="btn btn-primary" id="farm-fruit-submit-btn" style="margin-top: 14px; width: 100%; min-height: 44px;">Kiểm Tra</button>
          </div>
        `;
      } else if (mode === 'typing') {
        quizHtml = `
          <div class="farm-quiz-prompt-card">
            <div class="farm-quiz-prompt-meaning">${this.escapeHtml(currentWord.meaning)}</div>
            ${currentWord.example ? `<div class="farm-quiz-prompt-example">"${this.escapeHtml(currentWord.example)}"</div>` : ''}
          </div>
          <div style="margin-top: 14px;">
            <input type="text" id="farm-fruit-input" class="form-input" placeholder="Gõ từ tiếng Anh..." autocomplete="off" autocorrect="off" autocapitalize="none" enterkeyhint="go">
          </div>
          <button type="button" class="btn btn-primary" id="farm-fruit-submit-btn" style="margin-top: 14px; width: 100%; min-height: 44px;">Kiểm Tra</button>
        `;
      } else {
        // Choice
        const options = this.generateDistractors(currentWord, this.cachedWordsPool);
        quizHtml = `
          <div class="farm-quiz-prompt-card">
            <div class="farm-quiz-prompt-word">${this.escapeHtml(currentWord.word)}</div>
            ${currentWord.ipa ? `<div class="farm-quiz-prompt-ipa">${this.escapeHtml(currentWord.ipa)}</div>` : ''}
          </div>
          <div class="farm-quiz-options" style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            ${options.map((opt, idx) => `
              <button type="button" class="farm-quiz-opt-btn" data-fruit-opt-correct="${opt.isCorrect}">
                <span class="quiz-opt-letter">${String.fromCharCode(65 + idx)}</span>
                <span class="quiz-opt-text">${this.escapeHtml(opt.meaning)}</span>
              </button>
            `).join('')}
          </div>
        `;
      }

      bodyEl.innerHTML = quizHtml;
      sheet.classList.add('active');

      if (mode === 'listening') {
        if (window.wordsManager) window.wordsManager.playPronunciation(currentWord.word, currentWord.audioUrl);
        document.getElementById('farm-fruit-audio-btn')?.addEventListener('click', () => {
          if (window.wordsManager) window.wordsManager.playPronunciation(currentWord.word, currentWord.audioUrl);
        });
      }

      const inputEl = document.getElementById('farm-fruit-input');
      const submitBtn = document.getElementById('farm-fruit-submit-btn');

      if (inputEl) {
        inputEl.focus();
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.handleFruitQuizAnswer(inputEl.value.trim().toLowerCase() === currentWord.word.trim().toLowerCase());
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          this.handleFruitQuizAnswer(inputEl.value.trim().toLowerCase() === currentWord.word.trim().toLowerCase());
        });
      }

      bodyEl.querySelectorAll('.farm-quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.getAttribute('data-fruit-opt-correct') === 'true';
          this.handleFruitQuizAnswer(isCorrect);
        });
      });
    },

    handleFruitQuizAnswer(isCorrect) {
      if (!this.activeTreeQuiz) return;
      const q = this.activeTreeQuiz;
      const plot = this.state.treePlots.find(p => p.id === q.plotId);
      const treeConf = FRUIT_TREES[plot.treeType];
      const currentWord = q.words[q.wordIndex];

      if (isCorrect) {
        this.playSound('correct');
        if (!q.firstTryErrors[currentWord.id]) {
          this.gainXp(5);
        }

        q.wordIndex += 1;
        if (q.wordIndex < q.words.length) {
          this.renderFruitTreeQuizModal();
        } else {
          plot.stage += 1;
          if (plot.stage >= 3) {
            plot.state = 'ready';
            plot.cooldownUntil = 0;
          } else {
            plot.cooldownUntil = Date.now() + treeConf.cooldownSec * 1000;
          }

          this.state.quests.watered += 1;
          this.saveState();
          this.render();
          this.playSound('pop');

          const sheet = document.getElementById('farm-sheet-fruit-quiz');
          sheet?.classList.remove('active');
          this.activeTreeQuiz = null;

          if (window.showToast) {
            window.showToast(plot.stage >= 3 ? `🎉 Cây ${treeConf.name} đã chín quả! Bạn có thể thu hoạch!` : `💧 Tưới xong câu đố! Cây ${treeConf.name} đã lớn lên giai đoạn ${plot.stage}!`);
          }
        }
      } else {
        this.playSound('wrong');
        q.firstTryErrors[currentWord.id] = (q.firstTryErrors[currentWord.id] || 0) + 1;
        plot.hp -= 1;

        if (plot.hp <= 0) {
          plot.hp = 0;
          plot.state = 'withered';
          this.saveState();
          this.render();

          const sheet = document.getElementById('farm-sheet-fruit-quiz');
          sheet?.classList.remove('active');
          this.activeTreeQuiz = null;

          if (window.showToast) window.showToast(`🥀 Cây ${treeConf.name} đã bị héo do hết máu! Hãy dọn dẹp để trồng cây mới.`);
          return;
        }

        this.saveState();
        if (window.showToast) window.showToast(`Trả lời sai! Cây mất 1 máu (còn ${plot.hp}/${treeConf.maxHp} ❤️)`);
        this.renderFruitTreeQuizModal();
      }
    },

    harvestTree(plotId) {
      const plot = this.state.treePlots.find(p => p.id === plotId);
      if (!plot || plot.state !== 'ready') return;

      const treeConf = FRUIT_TREES[plot.treeType];
      const bonusChance = (this.state.level || 1) * 0.05;
      const bonusFood = Math.random() < bonusChance ? 1 : 0;
      const foodYield = treeConf.yieldFood + bonusFood;

      this.state.food = (this.state.food || 0) + foodYield;
      if (!this.state.foodStorage) this.state.foodStorage = {};
      this.state.foodStorage[plot.treeType] = (this.state.foodStorage[plot.treeType] || 0) + 1;

      this.gainXp(treeConf.rewardXp);
      this.state.harvestedTodayCount = (this.state.harvestedTodayCount || 0) + 1;
      this.state.quests.harvested += 1;

      // Reset tree plot to empty
      plot.state = 'empty';
      plot.treeType = null;
      plot.words = [];
      plot.stage = 0;
      plot.hp = 0;
      plot.cooldownUntil = 0;

      this.saveState();
      this.render();
      this.playSound('ting');

      this.showHarvestToast({
        word: `Trái ${treeConf.name}`,
        meaning: `Độ hiếm: ${treeConf.rarity}`,
        foodYield: foodYield,
        rewardXp: treeConf.rewardXp
      });
    },

    // =========================================================================
    // ZOOM & PAN BẢN ĐỒ NÔNG TRẠI V2 (Group C)
    // =========================================================================
    initZoomAndPan() {
      const viewport = document.getElementById('farm-canvas-viewport');
      const canvas = document.getElementById('farm-canvas');
      if (!viewport || !canvas || this._zoomPanInited) return;
      this._zoomPanInited = true;

      this.zoom = window.innerWidth < 640 ? 0.75 : 1.0;
      this.pan = { x: 0, y: 0 };
      this.updateCanvasTransform();

      document.getElementById('farm-btn-zoom-in')?.addEventListener('click', () => {
        this.zoom = Math.min(1.5, Math.round((this.zoom + 0.15) * 100) / 100);
        this.updateCanvasTransform();
      });

      document.getElementById('farm-btn-zoom-out')?.addEventListener('click', () => {
        this.zoom = Math.max(0.6, Math.round((this.zoom - 0.15) * 100) / 100);
        this.updateCanvasTransform();
      });

      document.getElementById('farm-btn-zoom-reset')?.addEventListener('click', () => {
        this.zoom = window.innerWidth < 640 ? 0.75 : 1.0;
        this.pan = { x: 0, y: 0 };
        this.updateCanvasTransform();
      });

      // Drag Pan & Pinch Zoom
      let isPanning = false;
      let startX = 0, startY = 0;
      let initialPanX = 0, initialPanY = 0;
      let startPinchDist = 0;
      let startPinchZoom = 1.0;

      const onPointerDown = (e) => {
        if (e.target.closest('.farm-plot') || e.target.closest('.farm-tree-plot') || e.target.closest('button')) {
          return;
        }

        if (e.pointerType === 'touch' && !e.isPrimary) return;

        isPanning = true;
        viewport.classList.add('panning');
        startX = e.clientX;
        startY = e.clientY;
        initialPanX = this.pan.x;
        initialPanY = this.pan.y;
        viewport.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e) => {
        if (!isPanning) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.pan.x = initialPanX + dx;
        this.pan.y = initialPanY + dy;
        this.updateCanvasTransform();
      };

      const onPointerUp = (e) => {
        if (isPanning) {
          isPanning = false;
          viewport.classList.remove('panning');
        }
      };

      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointercancel', onPointerUp);

      viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          isPanning = false;
          viewport.classList.remove('panning');
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          startPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          startPinchZoom = this.zoom;
        }
      }, { passive: true });

      viewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && startPinchDist > 0) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const factor = dist / startPinchDist;
          this.zoom = Math.min(1.5, Math.max(0.6, Math.round(startPinchZoom * factor * 100) / 100));
          this.updateCanvasTransform();
        }
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
          startPinchDist = 0;
        }
      }, { passive: true });
    },

    updateCanvasTransform() {
      const canvas = document.getElementById('farm-canvas');
      if (canvas) {
        canvas.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
      }
    },

    // =========================================================================
    // CÀI ĐẶT NÔNG TRẠI (SETTINGS MODAL BÊN TRONG GAME)
    // =========================================================================
    async openSettingsModal() {
      const sheet = document.getElementById('farm-sheet-settings');
      if (!sheet) return;

      // Đồng bộ radio wordSource
      const radio = sheet.querySelector(`input[name="farm-word-source"][value="${this.settings.wordSource}"]`);
      if (radio) radio.checked = true;

      // Tự động hiển thị danh sách ngày nếu đang lưu nguồn từ là "custom"
      const customWrap = document.getElementById('farm-custom-days-wrap');
      if (customWrap) {
        customWrap.style.display = (this.settings.wordSource === 'custom') ? 'block' : 'none';
      }

      // Đồng bộ toggle modes
      const choiceToggle = document.getElementById('farm-setting-mode-choice');
      const typingToggle = document.getElementById('farm-setting-mode-typing');
      const listeningToggle = document.getElementById('farm-setting-mode-listening');
      const aiToggle = document.getElementById('farm-setting-mode-ai');

      if (choiceToggle) choiceToggle.checked = !!this.settings.modes.choice;
      if (typingToggle) typingToggle.checked = !!this.settings.modes.typing;
      if (listeningToggle) listeningToggle.checked = !!this.settings.modes.listening;

      // Kiểm tra trạng thái AI backend
      let aiEnabled = false;
      let aiStatus = null;
      try {
        aiStatus = await window.api.getAiStatus();
        aiEnabled = !!aiStatus?.enabled;
      } catch (e) {}

      if (aiToggle) {
        if (aiEnabled) {
          aiToggle.disabled = false;
          aiToggle.closest('.farm-toggle-item')?.classList.remove('disabled');
          const subText = aiToggle.closest('.farm-toggle-item')?.querySelector('small');
          if (subText) {
            const primary = aiStatus.primaryProvider || 'Groq LPU';
            const backups = [aiStatus.backupProvider1, aiStatus.backupProvider2].filter(Boolean).join(' & ');
            const backupText = backups ? ` (Dự phòng: ${backups})` : '';
            subText.textContent = `${primary} sẵn sàng${backupText}`;
          }
          aiToggle.checked = !!this.settings.modes.ai;
        } else {
          aiToggle.checked = false;
          aiToggle.disabled = true;
          aiToggle.closest('.farm-toggle-item')?.classList.add('disabled');
          const subText = aiToggle.closest('.farm-toggle-item')?.querySelector('small');
          if (subText) subText.textContent = 'Cần cấu hình GROQ_API_KEYS trong .env';
        }
      }

      // Tải danh sách ngày nếu chọn chế độ Tuỳ chọn
      await this.renderCustomDaysChecklist();

      sheet.classList.add('active');
    },

    async renderCustomDaysChecklist() {
      const container = document.getElementById('farm-custom-days-checklist');
      if (!container) return;

      try {
        const secRes = await window.api.getSections();
        const sections = secRes.data || [];

        let html = '';
        for (const sec of sections) {
          const days = sec.days || [];
          if (days.length === 0) continue;

          html += `
            <div style="font-weight: 700; color: #38bdf8; font-size: 0.85rem; margin-top: 6px;">
              📁 ${sec.title}
            </div>
          `;
          for (const d of days) {
            const isChecked = this.settings.selectedDayIds.some(id => String(id) === String(d.id));
            html += `
              <label class="farm-radio-item" style="margin-left: 14px; margin-bottom: 4px;">
                <input type="checkbox" class="farm-custom-day-checkbox" value="${d.id}" ${isChecked ? 'checked' : ''}>
                <span>${d.title}</span>
              </label>
            `;
          }
        }
        container.innerHTML = html || '<div style="color:var(--text-muted); font-size:0.8rem;">Chưa có ngày nào</div>';
      } catch (e) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">Không tải được danh sách ngày</div>';
      }
    },

    saveSettingsFromUI() {
      const sheet = document.getElementById('farm-sheet-settings');
      if (!sheet) return;

      const sourceRadio = sheet.querySelector('input[name="farm-word-source"]:checked');
      const choiceToggle = document.getElementById('farm-setting-mode-choice');
      const typingToggle = document.getElementById('farm-setting-mode-typing');
      const listeningToggle = document.getElementById('farm-setting-mode-listening');
      const aiToggle = document.getElementById('farm-setting-mode-ai');

      // Kiểm tra ít nhất 1 phương thức học bật
      const choice = choiceToggle ? choiceToggle.checked : true;
      const typing = typingToggle ? typingToggle.checked : false;
      const listening = listeningToggle ? listeningToggle.checked : false;
      const ai = aiToggle && !aiToggle.disabled ? aiToggle.checked : false;

      if (!choice && !typing && !listening && !ai) {
        if (window.showToast) window.showToast('Cần bật ít nhất 1 cách học!');
        return;
      }

      const wordSource = sourceRadio ? sourceRadio.value : 'unlearned';
      const selectedDayIds = [];
      if (wordSource === 'custom') {
        sheet.querySelectorAll('.farm-custom-day-checkbox:checked').forEach(cb => {
          selectedDayIds.push(parseInt(cb.value, 10));
        });
        if (selectedDayIds.length === 0) {
          if (window.showToast) window.showToast('Vui lòng chọn ít nhất 1 ngày để học!');
          return;
        }
      }

      this.settings.wordSource = wordSource;
      this.settings.selectedDayIds = selectedDayIds;
      this.settings.modes.choice = choice;
      this.settings.modes.typing = typing;
      this.settings.modes.listening = listening;
      this.settings.modes.ai = ai;

      this.saveSettings();
      this.refreshWordsPool().then(() => this.render());
      sheet.classList.remove('active');

      if (window.showToast) {
        window.showToast('Đã lưu cài đặt nông trại thành công!');
      }
    },

    // =========================================================================
    // BẢNG NHIỆM VỤ NGÀY (DAILY QUESTS)
    // =========================================================================
    openQuestsModal() {
      const sheet = document.getElementById('farm-sheet-quests');
      if (!sheet) return;

      const q = this.state.quests;
      const listEl = document.getElementById('farm-quests-list');

      const questsDef = [
        { key: 'water', name: 'Tưới cây 5 lần', cur: q.watered, target: 5, reward: 15 },
        { key: 'harvest', name: 'Thu hoạch 2 cây', cur: q.harvested, target: 2, reward: 15 },
        { key: 'worm', name: 'Bắt 1 con sâu', cur: q.worms, target: 1, reward: 15 }
      ];

      if (listEl) {
        listEl.innerHTML = questsDef.map(item => {
          const isDone = item.cur >= item.target;
          const isClaimed = q.claimed[item.key];

          let btnHtml = '';
          if (isClaimed) {
            btnHtml = `<span style="font-size: 0.8rem; color: #10b981; font-weight: 700;">✓ Đã nhận</span>`;
          } else if (isDone) {
            btnHtml = `<button type="button" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="FarmGame.claimQuest('${item.key}', ${item.reward})">Nhận thưởng</button>`;
          } else {
            btnHtml = `<span style="font-size: 0.8rem; color: var(--text-muted);">${item.cur}/${item.target}</span>`;
          }

          return `
            <div class="farm-quest-item">
              <div class="farm-quest-info">
                <span class="farm-quest-name">${item.name}</span>
                <span class="farm-quest-progress-text">Thưởng: +${item.reward} 🪙</span>
              </div>
              <div>${btnHtml}</div>
            </div>
          `;
        }).join('');
      }

      sheet.classList.add('active');
    },

    claimQuest(key, reward) {
      if (this.state.quests.claimed[key]) return;
      this.state.quests.claimed[key] = true;
      this.state.coins += reward;
      this.saveState();
      this.render();
      this.playSound('ting');
      this.openQuestsModal();

      if (window.showToast) {
        window.showToast(`Đã nhận +${reward} vàng từ nhiệm vụ ngày!`);
      }
    },

    // =========================================================================
    // KHỞI TẠO BẮT SỰ KIỆN GIAO DIỆN CHÍNH
    // =========================================================================
    initUIEvents() {
      // 1. Chạm ô đất nông sản (Event Delegation)
      document.getElementById('farm-grid')?.addEventListener('click', (e) => {
        const cleanBtn = e.target.closest('[data-clean-id]');
        if (cleanBtn) {
          const id = parseInt(cleanBtn.getAttribute('data-clean-id'), 10);
          this.cleanPlot(id);
          return;
        }

        const lockedPlot = e.target.closest('.farm-plot-locked');
        if (lockedPlot) {
          const reqLevel = parseInt(lockedPlot.getAttribute('data-locked-req-level'), 10);
          this.showLockedPlotToast(reqLevel);
          return;
        }

        const plotEl = e.target.closest('.farm-plot');
        if (plotEl) {
          const id = parseInt(plotEl.getAttribute('data-plot-id'), 10);
          this.handlePlotClick(id);
        }
      });

      // 1b. Chạm ô cây ăn quả (Event Delegation - Group C)
      document.getElementById('farm-tree-grid')?.addEventListener('click', (e) => {
        const cleanBtn = e.target.closest('[data-clean-tree-id]');
        if (cleanBtn) {
          const id = parseInt(cleanBtn.getAttribute('data-clean-tree-id'), 10);
          this.cleanTreePlot(id);
          return;
        }

        const lockedTree = e.target.closest('.farm-tree-plot.farm-plot-locked');
        if (lockedTree) {
          const reqLevel = parseInt(lockedTree.getAttribute('data-tree-locked-level'), 10);
          this.showLockedTreePlotToast(reqLevel);
          return;
        }

        const treePlotEl = e.target.closest('.farm-tree-plot');
        if (treePlotEl) {
          const id = parseInt(treePlotEl.getAttribute('data-tree-plot-id'), 10);
          this.handleTreePlotClick(id);
        }
      });

      // 2. Nút trên HUD
      document.getElementById('farm-btn-close')?.addEventListener('click', () => this.close());
      document.getElementById('farm-btn-settings')?.addEventListener('click', () => this.openSettingsModal());
      document.getElementById('farm-btn-sound')?.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        this.saveState();
        this.renderHUD();
      });

      // Bấm huy hiệu cấp độ hoặc thanh XP mở thông tin Level & XP (Group A)
      document.getElementById('farm-hud-level')?.addEventListener('click', () => this.openLevelInfoModal());
      document.getElementById('farm-hud-xp-track')?.addEventListener('click', () => this.openLevelInfoModal());

      // Bấm chip lương thực mở kho lưu trữ (Group C)
      document.getElementById('farm-hud-food')?.addEventListener('click', () => this.openStorageModal());

      // 3. Nút dưới thanh đáy
      document.getElementById('farm-btn-shop')?.addEventListener('click', () => this.openShopModal());
      document.getElementById('farm-btn-quests')?.addEventListener('click', () => this.openQuestsModal());
      document.getElementById('farm-shop-buy-fert')?.addEventListener('click', () => this.buyFertilizerFromShop());
      document.getElementById('farm-shop-buy-food')?.addEventListener('click', () => this.buyFoodFromShop());

      // 4. Chọn hạt giống nông sản
      document.querySelectorAll('.farm-seed-card').forEach(card => {
        card.addEventListener('click', () => {
          const crop = card.getAttribute('data-crop');
          this.selectSeedType(crop);
        });
      });

      document.getElementById('farm-seed-btn-change-word')?.addEventListener('click', () => this.changeSeedWord());
      document.getElementById('farm-seed-btn-confirm-plant')?.addEventListener('click', () => this.confirmPlant());
      document.getElementById('farm-seed-btn-back')?.addEventListener('click', () => {
        document.getElementById('farm-seed-step-select').style.display = 'block';
        document.getElementById('farm-seed-step-confirm').style.display = 'none';
      });

      // 4b. Chọn cây ăn quả
      document.getElementById('farm-fruit-btn-reshuffle')?.addEventListener('click', () => this.reshuffleFruitTreeWords());
      document.getElementById('farm-fruit-btn-confirm-plant')?.addEventListener('click', () => this.confirmFruitTreePlant());
      document.getElementById('farm-fruit-btn-back')?.addEventListener('click', () => {
        document.getElementById('farm-fruit-step-select').style.display = 'block';
        document.getElementById('farm-fruit-step-confirm').style.display = 'none';
      });

      // 5. Đóng các sheet khi click nút close hoặc backdrop
      document.querySelectorAll('.farm-sheet-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            backdrop.classList.remove('active');
          }
        });
      });

      document.querySelectorAll('.farm-sheet-btn-close').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.farm-sheet-backdrop')?.classList.remove('active');
        });
      });

      // 6. Lưu cài đặt nông trại
      document.getElementById('farm-btn-save-settings')?.addEventListener('click', () => {
        this.saveSettingsFromUI();
      });

      // Chuyển đổi radio hiển thị danh sách ngày tuỳ chọn
      document.querySelectorAll('input[name="farm-word-source"]').forEach(r => {
        r.addEventListener('change', (e) => {
          const wrap = document.getElementById('farm-custom-days-wrap');
          if (wrap) wrap.style.display = (e.target.value === 'custom') ? 'block' : 'none';
        });
      });

      // 7. Nút đóng Levelup overlay
      document.getElementById('farm-levelup-btn-continue')?.addEventListener('click', () => {
        document.getElementById('farm-levelup-overlay')?.classList.remove('active');
      });

      // 8. Khởi tạo Zoom & Pan
      this.initZoomAndPan();

      // 9. Phím ESC để đóng sheet hoặc đóng farm
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          const activeSheet = document.querySelector('.farm-sheet-backdrop.active');
          if (activeSheet) {
            activeSheet.classList.remove('active');
          } else {
            this.close();
          }
        }
      });
    }
  };

  // Expose toàn cục
  window.FarmGame = FarmGame;

  // Tự động khởi tạo sau khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FarmGame.init());
  } else {
    FarmGame.init();
  }
})();
