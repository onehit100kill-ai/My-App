/**
 * ==========================================================================
 * VOCABMASTER - NÔNG TRẠI TỪ VỰNG (FARM GAME)
 * Logic nông trại học từ vựng tiếng Anh phong cách Stardew Valley.
 * Expose window.FarmGame
 * ==========================================================================
 */

(function () {
  'use strict';

  // Định nghĩa 3 loại cây trồng chuẩn theo spec (thời gian hồi 5s)
  // Phân biệt rõ: Số lần tưới nước (💧) khác với Số câu hỏi cần làm trong mỗi lần tưới (📖)
  const CROP_TYPES = {
    radish: {
      id: 'radish',
      name: 'Củ cải',
      icon: '🥕',
      seedPrice: 2, // Giảm 1/2 làm tròn xuống: 5 -> 2
      sellPrice: 6,
      wateringsNeeded: 2,   // 💧 2 lần tưới để chín thu hoạch
      stagesNeeded: 2,      // giữ tương thích ngược
      questionsPerWater: 1, // 📖 1 câu hỏi trong mỗi lần tưới
      cooldownSec: 5,
      maxHp: 3,
      rewardCoins: 10,
      rewardXp: 10,
      seedImg: 'assets/farm/seed-radish.png',
      sprites: [
        'assets/farm/crop-radish-0.png', // Mới gieo (0 lần tưới)
        'assets/farm/crop-radish-1.png', // Lớn lần 1 (1 lần tưới)
        'assets/farm/crop-radish-2.png'  // Chín thu hoạch (2 lần tưới)
      ]
    },
    strawberry: {
      id: 'strawberry',
      name: 'Dâu tây',
      icon: '🍓',
      seedPrice: 5, // Giảm 1/2: 10 -> 5
      sellPrice: 10,
      wateringsNeeded: 3,   // 💧 3 lần tưới để chín thu hoạch
      stagesNeeded: 3,      // giữ tương thích ngược
      questionsPerWater: 2, // 📖 2 câu hỏi trong mỗi lần tưới
      cooldownSec: 5,
      maxHp: 4,
      rewardCoins: 20,
      rewardXp: 15,
      seedImg: 'assets/farm/seed-strawberry.png',
      sprites: [
        'assets/farm/crop-strawberry-0.png', // Mới gieo (0 lần tưới)
        'assets/farm/crop-strawberry-1.png', // Cây con nhú lá (1 lần tưới)
        'assets/farm/crop-strawberry-2.png', // Bụi hoa trắng nở rộ (2 lần tưới)
        'assets/farm/crop-strawberry-3.png'  // Quả dâu chín đỏ rực thu hoạch (3 lần tưới)
      ]
    },
    sunflower: {
      id: 'sunflower',
      name: 'Hướng dương',
      icon: '🌻',
      seedPrice: 7, // Giảm 1/2 làm tròn xuống: 15 -> 7
      sellPrice: 15,
      wateringsNeeded: 4,   // 💧 4 lần tưới để chín thu hoạch
      stagesNeeded: 4,      // giữ tương thích ngược
      questionsPerWater: 3, // 📖 3 câu hỏi trong mỗi lần tưới
      cooldownSec: 5,
      maxHp: 5,
      rewardCoins: 35,
      rewardXp: 25,
      seedImg: 'assets/farm/seed-sunflower.png',
      sprites: [
        'assets/farm/crop-sunflower-0.png', // Mới gieo (0 lần tưới)
        'assets/farm/crop-sunflower-1.png', // Cây mầm 2 lá cotyledon (1 lần tưới)
        'assets/farm/crop-sunflower-2.png', // Thân cao phát triển tầng lá (2 lần tưới)
        'assets/farm/crop-sunflower-3.png', // Búp nụ hoa lớn chuẩn bị nở (3 lần tưới)
        'assets/farm/crop-sunflower-4.png'  // Bông hướng dương nở rộ rực rỡ thu hoạch (4 lần tưới)
      ]
    }
  };

  // Định nghĩa 5 loại cây ăn quả thân gỗ (3 cấp mở 1 cây: Cấp 3, 6, 9, 12, 15 - thời gian hồi 5s)
  const FRUIT_TREES = {
    apple: {
      id: 'apple',
      name: 'Táo',
      icon: '🍎',
      rarity: 'Thường',
      rarityColor: '#10b981',
      unlockLevel: 3, // 3 cấp mở 1 cây: Cây 1 Cấp 3
      maxWords: 5,
      maxHp: 5,
      cooldownSec: 5,
      sellPrice: 20,
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
      unlockLevel: 6, // Cây 2 Cấp 6
      maxWords: 6,
      maxHp: 5,
      cooldownSec: 5,
      sellPrice: 24,
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
      unlockLevel: 9, // Cây 3 Cấp 9
      maxWords: 10,
      maxHp: 8,
      cooldownSec: 5,
      sellPrice: 35,
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
      unlockLevel: 12, // Cây 4 Cấp 12
      maxWords: 12,
      maxHp: 8,
      cooldownSec: 5,
      sellPrice: 42,
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
      unlockLevel: 15, // Cây 5 Cấp 15
      maxWords: 15,
      maxHp: 10,
      cooldownSec: 5,
      sellPrice: 50,
      rewardXp: 40,
      sprites: [
        'assets/farm/crop-cherry-1.png',
        'assets/farm/crop-cherry-2.png',
        'assets/farm/crop-cherry-3.png'
      ]
    }
  };

  // Danh mục các loại nông sản & sản phẩm chăn nuôi có thể bán trong Shop (Không cho bán phân bón)
  const SHOP_SELL_ITEMS = [
    { id: 'radish', name: 'Củ cải', icon: '🥕', price: 6, type: 'storage' },
    { id: 'strawberry', name: 'Dâu tây', icon: '🍓', price: 10, type: 'storage' },
    { id: 'sunflower', name: 'Hướng dương', icon: '🌻', price: 15, type: 'storage' },
    { id: 'apple', name: 'Táo', icon: '🍎', price: 20, type: 'storage' },
    { id: 'orange', name: 'Cam', icon: '🍊', price: 24, type: 'storage' },
    { id: 'peach', name: 'Đào', icon: '🍑', price: 35, type: 'storage' },
    { id: 'pear', name: 'Lê', icon: '🍐', price: 42, type: 'storage' },
    { id: 'cherry', name: 'Anh đào', icon: '🍒', price: 50, type: 'storage' },
    { id: 'egg', name: 'Trứng gà', icon: '🥚', price: 8, type: 'storage' },
    { id: 'milk', name: 'Sữa tươi', icon: '🥛', price: 24, type: 'storage' }
  ];

  // Trạng thái mặc định
  const DEFAULT_STATE = {
    coins: 30,
    xp: 0,
    level: 1,
    foodStorage: {
      radish: 3,
      strawberry: 3,
      sunflower: 3,
      apple: 3,
      orange: 3,
      peach: 3,
      pear: 3,
      cherry: 3,
      egg: 3,
      milk: 3
    }, // Lưu số lượng nông sản, trái cây & sản phẩm chăn nuôi (trứng, sữa) đã thu hoạch
    fertilizer: 0,
    soundEnabled: true,
    harvestedTodayCount: 0,
    lastHarvestDate: '',
    // 16 ô luống cây trồng (mỗi cấp mở 1 ô: Cấp 1 có 1 ô duy nhất, Cấp 2 mở tiếp)
    plots: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, state: 'empty' })),
    // 5 cây ăn quả có sẵn trên sân (3 cấp mở 1 cây)
    treePlots: [
      { id: 1, type: 'apple', stage: 1, cooldown: 0, hearts: 5, words: [] },
      { id: 2, type: 'orange', stage: 1, cooldown: 0, hearts: 5, words: [] },
      { id: 3, type: 'peach', stage: 1, cooldown: 0, hearts: 8, words: [] },
      { id: 4, type: 'pear', stage: 1, cooldown: 0, hearts: 8, words: [] },
      { id: 5, type: 'cherry', stage: 1, cooldown: 0, hearts: 10, words: [] }
    ],
    // 8 ô nuôi gà (Cấp 5 mới mở, mỗi 2 cấp 1 con: Cấp 5, 7, 9, 11, 13, 15, 17, 19)
    chickenPlots: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 })),
    // 6 ô nuôi bò sữa (Cấp 10 mới mở, mỗi 3 cấp 1 con: Cấp 10, 13, 16, 19, 22, 25)
    cowPlots: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 })),
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
      ai: true
    },
    // Cài đặt cách học riêng cho từng vùng
    zoneModes: {
      crops: {
        choice: true,
        typing: true,
        listening: true,
        ai: true,
        randomMode: true // 🎲 Ngẫu nhiên loại câu hỏi
      },
      orchard: {
        choice: true,
        typing: true,
        listening: true,
        ai: true,
        randomMode: true // 🎲 Ngẫu nhiên loại câu hỏi
      },
      poultry: {
        choice: true,
        typing: true,
        listening: true,
        ai: true,
        randomMode: true // 🎲 Ngẫu nhiên loại câu hỏi
      }
    }
  };

  const FarmGame = {
    state: null,
    settings: null,
    tickInterval: null,
    activeQuiz: null, // { plotId, mode, word, failCount, isWormQuiz }
    activeTreeQuiz: null, // { treeType, wordIndex, words, firstTryErrors }
    cachedWordsPool: [],
    isOpen: false,

    // Icon túi phân bón dùng chung (ảnh người dùng đã tải lên, đã tách nền)
    getFertilizerBagIcon(size = 18) {
      return `<img class="farm-fert-icon-img" src="assets/farm/fertilizer-bag.png" alt="fert" style="width:${size}px; height:${size}px; object-fit:contain; vertical-align:middle; display:inline-block;" />`;
    },

    // Icon đồng xu vàng dùng chung (ảnh người dùng đã tải lên, đã tách nền)
    getCoinIcon(size = 18) {
      return `<img class="farm-coin-icon-img" src="assets/farm/coin.png" alt="coin" style="width:${size}px; height:${size}px; object-fit:contain; vertical-align:middle; display:inline-block;" />`;
    },

    // Icon ngôi sao xanh lam nhạt viền đậm đại diện cho EXP
    getXpIcon(size = 16) {
      return `<svg class="farm-xp-icon" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
        <path fill="#7dd3fc" stroke="#0284c7" stroke-width="1.8" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`;
    },

    // Icon tim máu cây: kích thước giảm còn 0.6 (~6.5px trên ô đất, ~8.5px trong quiz), khi mất máu giữ lại viền đỏ
    getHeartIcon(isFull = true, size = 6.5) {
      if (isFull) {
        return `<svg class="farm-heart-icon full" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="#ef4444" stroke="#991b1b" stroke-width="1.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      } else {
        return `<svg class="farm-heart-icon lost" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="rgba(15, 23, 42, 0.65)" stroke="#ef4444" stroke-width="2.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      }
    },

    // Icon tim máu sâu: khi mất máu giữ lại viền xanh lá
    getWormHeartIcon(isFull = true, size = 6.5) {
      if (isFull) {
        return `<svg class="farm-heart-icon full worm-heart" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="#22c55e" stroke="#15803d" stroke-width="1.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      } else {
        return `<svg class="farm-heart-icon lost worm-heart" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="rgba(15, 23, 42, 0.65)" stroke="#22c55e" stroke-width="2.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      }
    },

    // Xáo trộn mảng ngẫu nhiên (Fisher-Yates)
    shuffle(array) {
      if (!Array.isArray(array)) return [];
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    // Escape chuỗi HTML chống lỗi và vỡ layout
    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Icon tim máu cây: kích thước giảm còn 0.6 (~6.5px trên ô đất, ~8.5px trong quiz), khi mất máu giữ lại viền đỏ
    getHeartIcon(isFull = true, size = 6.5) {
      if (isFull) {
        return `<svg class="farm-heart-icon full" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="#ef4444" stroke="#991b1b" stroke-width="1.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      } else {
        return `<svg class="farm-heart-icon lost" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="rgba(15, 23, 42, 0.65)" stroke="#ef4444" stroke-width="2.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      }
    },

    // Icon tim máu sâu: khi mất máu giữ lại viền xanh lá
    getWormHeartIcon(isFull = true, size = 6.5) {
      if (isFull) {
        return `<svg class="farm-heart-icon full worm-heart" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="#22c55e" stroke="#15803d" stroke-width="1.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      } else {
        return `<svg class="farm-heart-icon lost worm-heart" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;">
          <path fill="rgba(15, 23, 42, 0.65)" stroke="#22c55e" stroke-width="2.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
      }
    },

    // Xáo trộn mảng ngẫu nhiên (Fisher-Yates)
    shuffle(array) {
      if (!Array.isArray(array)) return [];
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    // Escape chuỗi HTML chống lỗi và vỡ layout
    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Khởi tạo
    init() {
      this.loadSettings();
      this.loadState();
      this.initBubble();
      this.initGameMenuEvents();
      this.initUIEvents();
      this.initCloudSync();
    },

    // =========================================================================
    // HỆ THỐNG ĐỒNG BỘ ĐÁM MÂY ĐA THIẾT BỊ (CROSS-DEVICE CLOUD SYNC)
    // =========================================================================
    getSlot() {
      return localStorage.getItem('vm_game_slot') || 'default';
    },

    setSlot(newSlot) {
      const clean = (newSlot || 'default').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
      localStorage.setItem('vm_game_slot', clean);
      this.fetchCloudState(true);
      return clean;
    },

    initCloudSync() {
      this._cloudSyncInProgress = false;
      this._cloudSyncDebounce = null;
      this._lastCloudSyncTime = 0;

      // 1. Tải dữ liệu từ máy chủ ngay khi mở app
      this.fetchCloudState();

      // 2. Tự động đồng bộ khi chuyển qua lại tab hoặc thiết bị mở khóa
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.fetchCloudState();
        }
      });

      window.addEventListener('focus', () => {
        this.fetchCloudState();
      });

      // 3. Tự động đẩy khi có mạng online
      window.addEventListener('online', () => {
        this.pushCloudState();
      });
    },

    updateSyncStatusUI(text = 'vừa xong') {
      const timeEl = document.getElementById('farm-sync-status-time');
      if (timeEl) {
        timeEl.textContent = text;
      }
    },

    async fetchCloudState(isForce = false) {
      if (!window.api || typeof window.api.getFarmCloudState !== 'function') return;
      if (this._cloudSyncInProgress) return;

      const now = Date.now();
      if (!isForce && now - this._lastCloudSyncTime < 3000) return;

      try {
        const slot = this.getSlot();
        const res = await window.api.getFarmCloudState(slot);
        this._lastCloudSyncTime = Date.now();

        if (res && res.success && res.exists && res.state) {
          const serverTime = Number(res.clientUpdatedAt) || 0;
          const localTime = Number(this.state.updatedAt) || 0;

          const localHasProgress = (this.state.level && this.state.level > 1) || (this.state.xp && this.state.xp > 0) || (this.state.coins && this.state.coins > 20);
          const serverHasProgress = (res.state.level && res.state.level > 1) || (res.state.xp && res.state.xp > 0) || (res.state.coins && res.state.coins > 20);

          if (serverTime > localTime || (!localHasProgress && serverHasProgress) || isForce) {
            console.log('[FarmSync] Đồng bộ dữ liệu nông trại mới nhất từ máy chủ:', res);
            this.state = Object.assign({}, DEFAULT_STATE, res.state);
            if (res.settings) {
              this.settings = Object.assign({}, DEFAULT_SETTINGS, res.settings);
              this.saveSettings(false);
            }
            this.state.updatedAt = Math.max(serverTime, Date.now());
            this.saveState(false);

            this.render();
            this.updateSyncStatusUI('vừa xong');
            window.showToast?.('☁️ Đã đồng bộ dữ liệu nông trại từ máy chủ!');
          } else if (localTime > serverTime && localHasProgress) {
            this.pushCloudState();
          } else {
            this.updateSyncStatusUI('vừa xong');
          }
        } else if (res && res.success && !res.exists) {
          this.pushCloudState();
        }
      } catch (err) {
        console.warn('[FarmSync] Lỗi tải dữ liệu:', err);
      }
    },

    pushCloudState() {
      if (!window.api || typeof window.api.saveFarmCloudState !== 'function') return;
      clearTimeout(this._cloudSyncDebounce);

      this._cloudSyncDebounce = setTimeout(async () => {
        if (this._cloudSyncInProgress) return;
        this._cloudSyncInProgress = true;

        try {
          const slot = this.getSlot();
          const timestamp = this.state.updatedAt || Date.now();
          const res = await window.api.saveFarmCloudState(this.state, this.settings, timestamp, slot);

          if (res && res.success) {
            this._lastCloudSyncTime = Date.now();
            this.updateSyncStatusUI('vừa xong');
            if (res.conflict && res.serverIsNewer && res.state) {
              this.state = Object.assign({}, DEFAULT_STATE, res.state);
              if (res.settings) this.settings = Object.assign({}, DEFAULT_SETTINGS, res.settings);
              this.saveState(false);
              this.render();
              window.showToast?.('☁️ Dữ liệu từ thiết bị khác vừa được cập nhật!');
            }
          }
        } catch (e) {
          console.warn('[FarmSync] Lỗi đẩy dữ liệu:', e);
        } finally {
          this._cloudSyncInProgress = false;
        }
      }, 600);
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

      // Đảm bảo đúng 16 ô đất nông sản (4 hàng x 4 cột)
      if (!Array.isArray(this.state.plots)) {
        this.state.plots = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, state: 'empty' }));
      } else {
        while (this.state.plots.length < 16) {
          this.state.plots.push({ id: this.state.plots.length + 1, state: 'empty' });
        }
        if (this.state.plots.length > 16) {
          this.state.plots = this.state.plots.slice(0, 16);
        }
      }

      if (!this.state.foodStorage) this.state.foodStorage = {};
      if (typeof this.state.foodStorage.egg !== 'number') {
        this.state.foodStorage.egg = 3;
      }
      if (typeof this.state.foodStorage.milk !== 'number') {
        this.state.foodStorage.milk = 3;
      }

      // Bổ sung x3 mỗi loại nông sản, trái cây & sản phẩm chăn nuôi (trứng, sữa) vào kho để test theo yêu cầu
      if (!this.state._testStockBoostV4) {
        const testItems = ['radish', 'strawberry', 'sunflower', 'apple', 'orange', 'peach', 'pear', 'cherry', 'egg', 'milk'];
        testItems.forEach(k => {
          this.state.foodStorage[k] = Math.max(3, (this.state.foodStorage[k] || 0) + 3);
        });
        this.state._testStockBoostV4 = true;
        this.saveState();
      }

      // Đảm bảo 5 cây ăn quả có sẵn trên sân
      const validTypes = ['apple', 'orange', 'peach', 'pear', 'cherry'];
      if (!Array.isArray(this.state.treePlots) || this.state.treePlots.length !== 5 || !this.state.treePlots.every(t => validTypes.includes(t.type))) {
        this.state.treePlots = [
          { id: 1, type: 'apple', stage: 1, cooldown: 0, hearts: 5, words: [] },
          { id: 2, type: 'orange', stage: 1, cooldown: 0, hearts: 5, words: [] },
          { id: 3, type: 'peach', stage: 1, cooldown: 0, hearts: 8, words: [] },
          { id: 4, type: 'pear', stage: 1, cooldown: 0, hearts: 8, words: [] },
          { id: 5, type: 'cherry', stage: 1, cooldown: 0, hearts: 10, words: [] }
        ];
      }

      // Đảm bảo 8 ô nuôi gà (Cấp 5 mới mở, mỗi 2 cấp 1 con)
      if (!Array.isArray(this.state.chickenPlots) || this.state.chickenPlots.length !== 8) {
        this.state.chickenPlots = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      } else {
        this.state.chickenPlots.forEach(ch => {
          if (!ch.state) {
            if (ch.readyAt && ch.readyAt > Date.now()) ch.state = 'feeding';
            else if (ch.readyAt && Date.now() >= ch.readyAt) ch.state = 'ready';
            else ch.state = 'hungry';
          }
        });
      }

      // Đảm bảo 6 ô nuôi bò sữa (Cấp 10 mới mở, mỗi 3 cấp 1 con)
      if (!Array.isArray(this.state.cowPlots) || this.state.cowPlots.length !== 6) {
        this.state.cowPlots = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      } else {
        this.state.cowPlots.forEach(cow => {
          if (!cow.state) {
            if (cow.readyAt && cow.readyAt > Date.now()) cow.state = 'feeding';
            else if (cow.readyAt && Date.now() >= cow.readyAt) cow.state = 'ready';
            else cow.state = 'hungry';
          }
        });
      }

      // Xóa bỏ hoàn toàn bánh mì nếu còn sót trong state cũ
      if (this.state.food !== undefined) {
        delete this.state.food;
      }

      this.checkDailyReset();
    },

    saveState(triggerPush = true) {
      try {
        this.state.updatedAt = Date.now();
        localStorage.setItem('vm_farm_state_v1', JSON.stringify(this.state));
        if (triggerPush) {
          this.pushCloudState();
        }
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

      // Đảm bảo cài đặt riêng cho 3 vùng luôn tồn tại
      if (!this.settings.zoneModes) {
        const base = this.settings.modes || DEFAULT_SETTINGS.modes;
        this.settings.zoneModes = {
          crops: { choice: !!base.choice, typing: !!base.typing, listening: !!base.listening, ai: !!base.ai, randomMode: true },
          orchard: { choice: !!base.choice, typing: !!base.typing, listening: !!base.listening, ai: !!base.ai, randomMode: true },
          poultry: { choice: !!base.choice, typing: !!base.typing, listening: !!base.listening, ai: !!base.ai, randomMode: true }
        };
      } else {
        ['crops', 'orchard', 'poultry'].forEach(z => {
          if (!this.settings.zoneModes[z]) {
            this.settings.zoneModes[z] = { choice: true, typing: true, listening: true, ai: true, randomMode: true };
          }
          if (this.settings.zoneModes[z].randomMode === undefined) {
            this.settings.zoneModes[z].randomMode = true;
          }
        });
      }
    },

    getZoneQuizMode(zone, stage = 0) {
      const zConfig = (this.settings.zoneModes && this.settings.zoneModes[zone]) || this.settings.modes || {};
      const activeModes = [];
      if (zConfig.choice) activeModes.push('choice');
      if (zConfig.typing) activeModes.push('typing');
      if (zConfig.listening) activeModes.push('listening');
      if (zConfig.ai) activeModes.push('ai');

      if (activeModes.length === 0) activeModes.push('choice');

      if (zConfig.randomMode) {
        // Ngẫu nhiên loại câu hỏi trong các cách học đã chọn
        return activeModes[Math.floor(Math.random() * activeModes.length)];
      } else {
        // Thứ tự tiến dần theo giai đoạn phát triển
        const idx = Math.min(activeModes.length - 1, Math.max(0, stage));
        return activeModes[idx];
      }
    },

    saveSettings(triggerPush = true) {
      try {
        localStorage.setItem('vm_farm_settings', JSON.stringify(this.settings));
        if (triggerPush) {
          this.pushCloudState();
        }
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

    // Icon ô đất hiển thị gọn gàng, không bị vỡ font chữ trên các thiết bị
    getSoilPlotIcon(size = 16) {
      return `<img src="assets/farm/soil-empty.png" style="width:${size}px; height:${size}px; vertical-align:middle; image-rendering:pixelated; border-radius:2px; display:inline-block;" alt="Ô đất" title="Ô đất">`;
    },

    // =========================================================================
    // HỆ THỐNG GIÁ & CHỐNG LẠM PHÁT THƯƠNG LÁI (PROMPT #10)
    // =========================================================================
    getFertilizerPrice() {
      return 15; // Phân bón giá cố định 15 vàng theo yêu cầu
    },

    getMerchantRemainingGold() {
      return Infinity; // Bỏ giới hạn lượng đồ có thể bán trong Shop
    },

    recordMerchantSale(earnedGold) {
      // Không còn giới hạn
    },

    getItemStock(itemId) {
      if (itemId === 'fertilizer') return this.state.fertilizer || 0;
      return (this.state.foodStorage && this.state.foodStorage[itemId]) || 0;
    },

    deductItemStock(itemId, qty) {
      if (itemId === 'fertilizer') {
        this.state.fertilizer = Math.max(0, (this.state.fertilizer || 0) - qty);
      } else {
        if (!this.state.foodStorage) this.state.foodStorage = {};
        this.state.foodStorage[itemId] = Math.max(0, (this.state.foodStorage[itemId] || 0) - qty);
      }
    },

    // 4.4. KHU NUÔI GÀ: 8 Ô GÀ (Cấp 5 mới mở, mỗi 2 cấp 1 con: Cấp 5, 7, 9, 11, 13, 15, 17, 19)
    getChickenReqLevel(chickenId) {
      return 5 + (chickenId - 1) * 2;
    },

    renderPoultryGrid() {
      const grid = document.getElementById('farm-poultry-grid');
      if (!grid) return;

      if (!Array.isArray(this.state.chickenPlots) || this.state.chickenPlots.length !== 8) {
        this.state.chickenPlots = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      }

      const curLvl = this.state.level || 1;
      const now = Date.now();
      let html = '';

      this.state.chickenPlots.forEach(ch => {
        const reqLvl = this.getChickenReqLevel(ch.id);
        const isLocked = curLvl < reqLvl;

        if (isLocked) {
          html += `
            <div class="farm-chicken-plot locked" data-chicken-id="${ch.id}" title="Cần Cấp ${reqLvl} để mở khóa Gà #${ch.id}">
              <div class="farm-animal-locked-icon">🔒</div>
              <div class="farm-animal-locked-label">Cấp ${reqLvl}</div>
            </div>
          `;
          return;
        }

        // Tự động kiểm tra hoàn thành đẻ trứng
        if (ch.state === 'feeding' && ch.readyAt && now >= ch.readyAt) {
          ch.state = 'ready';
          ch.readyAt = 0;
        }

        const isReady = ch.state === 'ready';
        const isFeeding = ch.state === 'feeding' && ch.readyAt > now;
        const leftSec = isFeeding ? Math.ceil((ch.readyAt - now) / 1000) : 0;

        let statusClass = 'hungry';
        if (isReady) statusClass = 'ready';
        else if (isFeeding) statusClass = 'feeding';

        html += `
          <div class="farm-chicken-plot ${statusClass}" data-chicken-id="${ch.id}"
               title="${isReady ? `Gà #${ch.id}: Đã đẻ trứng 🥚, chạm để thu hoạch!` : isFeeding ? `Gà #${ch.id}: Đang ấp trứng (${leftSec}s)` : `Gà #${ch.id}: Đang đói, chạm để cho ăn (-2🪙, 📖 1 câu)`}">
            <span class="farm-chicken-icon">🐔</span>
            ${isReady ? `
              <div class="farm-chicken-egg-badge" title="Có trứng 🥚">🥚</div>
              <span class="farm-chicken-label">Thu trứng</span>
            ` : isFeeding ? `
              <span class="farm-chicken-cooldown-text">⏳ ${leftSec}s</span>
            ` : `
              <span class="farm-animal-feed-badge">🌾 -2${this.getCoinIcon(12)}</span>
              <span class="farm-chicken-label" style="color: #86efac;">Cho ăn</span>
              <span style="font-size: 8px; color: #38bdf8; font-weight: 700; line-height: 1;">📖 1 câu</span>
            `}
          </div>
        `;
      });

      grid.innerHTML = html;
    },

    interactChickenPlot(chickenId) {
      const ch = this.state.chickenPlots?.find(p => p.id === chickenId);
      if (!ch) return;

      const curLvl = this.state.level || 1;
      const reqLvl = this.getChickenReqLevel(chickenId);

      if (curLvl < reqLvl) {
        if (window.showToast) window.showToast(`🔒 Chuồng gà #${chickenId} cần đạt Cấp ${reqLvl} mới mở khóa! (Hiện tại Cấp ${curLvl})`);
        return;
      }

      const now = Date.now();

      // 1. Nếu đã đẻ trứng -> Thu hoạch trứng
      if (ch.state === 'ready' || (ch.readyAt && now >= ch.readyAt)) {
        ch.state = 'hungry';
        ch.readyAt = 0;
        if (!this.state.foodStorage) this.state.foodStorage = {};
        this.state.foodStorage.egg = (this.state.foodStorage.egg || 0) + 1;

        this.saveState();
        this.renderHUD();
        this.renderPoultryGrid();
        this.playSound('ting');

        if (window.showToast) {
          window.showToast(`🥚 Thu hoạch 1 quả trứng cất vào kho! (Bán trong Shop lấy +8🪙)`);
        }
        return;
      }

      // 2. Nếu đang ấp trứng -> Báo thời gian còn lại
      if (ch.state === 'feeding' && ch.readyAt > now) {
        const leftSec = Math.ceil((ch.readyAt - now) / 1000);
        if (window.showToast) window.showToast(`🐔 Gà #${chickenId} đang ấp trứng (còn ${leftSec}s), hãy quay lại sau!`);
        return;
      }

      // 3. Nếu đang đói -> Cần trả lời 1 câu hỏi ngẫu nhiên để cho ăn (-2🪙)
      const feedCost = 2;
      const userCoins = this.state.coins || 0;
      if (userCoins < feedCost) {
        if (window.showToast) {
          window.showToast(`Không đủ vàng để cho gà ăn! Cần ${feedCost}🪙 (Ví có: ${userCoins}🪙). Hãy bán nông sản để kiếm vàng!`);
        }
        return;
      }

      this.openAnimalQuiz('chicken', chickenId, feedCost);
    },

    // 4.5. KHU NUÔI BÒ SỮA: 6 Ô BÒ (Cấp 10 mới mở, mỗi 3 cấp 1 con: Cấp 10, 13, 16, 19, 22, 25)
    getCowReqLevel(cowId) {
      return 10 + (cowId - 1) * 3;
    },

    renderCattleGrid() {
      const grid = document.getElementById('farm-cattle-grid');
      if (!grid) return;

      if (!Array.isArray(this.state.cowPlots) || this.state.cowPlots.length !== 6) {
        this.state.cowPlots = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      }

      const curLvl = this.state.level || 1;
      const now = Date.now();
      let html = '';

      this.state.cowPlots.forEach(cow => {
        const reqLvl = this.getCowReqLevel(cow.id);
        const isLocked = curLvl < reqLvl;

        if (isLocked) {
          html += `
            <div class="farm-cow-plot locked" data-cow-id="${cow.id}" title="Cần Cấp ${reqLvl} để mở khóa Bò #${cow.id}">
              <div class="farm-animal-locked-icon">🔒</div>
              <div class="farm-animal-locked-label">Cấp ${reqLvl}</div>
            </div>
          `;
          return;
        }

        // Tự động kiểm tra hoàn thành cho sữa
        if (cow.state === 'feeding' && cow.readyAt && now >= cow.readyAt) {
          cow.state = 'ready';
          cow.readyAt = 0;
        }

        const isReady = cow.state === 'ready';
        const isFeeding = cow.state === 'feeding' && cow.readyAt > now;
        const leftSec = isFeeding ? Math.ceil((cow.readyAt - now) / 1000) : 0;

        let statusClass = 'hungry';
        if (isReady) statusClass = 'ready';
        else if (isFeeding) statusClass = 'feeding';

        html += `
          <div class="farm-cow-plot ${statusClass}" data-cow-id="${cow.id}"
               title="${isReady ? `Bò #${cow.id}: Đã có sữa 🥛, chạm để vắt sữa!` : isFeeding ? `Bò #${cow.id}: Đang cho sữa (${leftSec}s)` : `Bò #${cow.id}: Đang đói, chạm để cho ăn (-6🪙, 📖 1 câu)`}">
            <span class="farm-cow-icon">🐄</span>
            ${isReady ? `
              <div class="farm-cow-milk-badge" title="Có sữa 🥛">🥛</div>
              <span class="farm-cow-label">Vắt sữa</span>
            ` : isFeeding ? `
              <span class="farm-cow-cooldown-text">⏳ ${leftSec}s</span>
            ` : `
              <span class="farm-animal-feed-badge">🌿 -6${this.getCoinIcon(12)}</span>
              <span class="farm-cow-label" style="color: #67e8f9;">Cho ăn</span>
              <span style="font-size: 8px; color: #38bdf8; font-weight: 700; line-height: 1;">📖 1 câu</span>
            `}
          </div>
        `;
      });

      grid.innerHTML = html;
    },

    interactCowPlot(cowId) {
      const cow = this.state.cowPlots?.find(p => p.id === cowId);
      if (!cow) return;

      const curLvl = this.state.level || 1;
      const reqLvl = this.getCowReqLevel(cowId);

      if (curLvl < reqLvl) {
        if (window.showToast) window.showToast(`🔒 Chuồng bò #${cowId} cần đạt Cấp ${reqLvl} mới mở khóa! (Hiện tại Cấp ${curLvl})`);
        return;
      }

      const now = Date.now();

      // 1. Nếu đã có sữa -> Vắt sữa
      if (cow.state === 'ready' || (cow.readyAt && now >= cow.readyAt)) {
        cow.state = 'hungry';
        cow.readyAt = 0;
        if (!this.state.foodStorage) this.state.foodStorage = {};
        this.state.foodStorage.milk = (this.state.foodStorage.milk || 0) + 1;

        this.saveState();
        this.renderHUD();
        this.renderCattleGrid();
        this.playSound('ting');

        if (window.showToast) {
          window.showToast(`🥛 Thu hoạch 1 bình sữa tươi cất vào kho! (Bán trong Shop lấy +24🪙)`);
        }
        return;
      }

      // 2. Nếu đang cho sữa -> Báo thời gian còn lại
      if (cow.state === 'feeding' && cow.readyAt > now) {
        const leftSec = Math.ceil((cow.readyAt - now) / 1000);
        if (window.showToast) window.showToast(`🐄 Bò #${cowId} đang cho sữa (còn ${leftSec}s), hãy quay lại sau!`);
        return;
      }

      // 3. Nếu đang đói -> Cần trả lời 1 câu hỏi ngẫu nhiên để cho ăn (-6🪙)
      const feedCost = 6;
      const userCoins = this.state.coins || 0;
      if (userCoins < feedCost) {
        if (window.showToast) {
          window.showToast(`Không đủ vàng để cho bò ăn! Cần ${feedCost}🪙 (Ví có: ${userCoins}🪙). Hãy bán nông sản để kiếm vàng!`);
        }
        return;
      }

      this.openAnimalQuiz('cow', cowId, feedCost);
    },

    // Mở Quiz ngẫu nhiên khi cho vật nuôi ăn (Gà / Bò)
    openAnimalQuiz(animalType, animalId, feedCost) {
      const mode = this.getZoneQuizMode('poultry', 0);
      const word = this.pickNextWord();

      this.activeQuiz = {
        isAnimal: true,
        animalType: animalType,
        animalId: animalId,
        feedCost: feedCost,
        mode: mode,
        word: {
          id: word.id,
          word: word.word,
          ipa: word.ipa,
          meaning: word.meaning,
          example: word.example,
          audioUrl: word.audioUrl
        },
        failCount: 0
      };

      this.renderQuizModal();
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
      } catch (e) { }

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
      document.body.classList.add('farm-active');
      document.documentElement.classList.add('farm-active');
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

      // Đảm bảo các ô đất có đầy đủ wateringsNeeded và questionsPerWater
      if (Array.isArray(this.state.plots)) {
        this.state.plots.forEach(p => {
          if (p.cropType && CROP_TYPES[p.cropType]) {
            const def = CROP_TYPES[p.cropType];
            if (!p.wateringsNeeded) p.wateringsNeeded = p.stagesNeeded || def.wateringsNeeded || 2;
            p.stagesNeeded = p.wateringsNeeded;
            if (!p.questionsPerWater) p.questionsPerWater = def.questionsPerWater || 1;
          }
        });
      }

      // Đảm bảo 8 ô nuôi gà (Cấp 5 mới mở, mỗi 2 cấp 1 con)
      if (!Array.isArray(this.state.chickenPlots) || this.state.chickenPlots.length !== 8) {
        this.state.chickenPlots = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      }

      // Đảm bảo 6 ô nuôi bò sữa (Cấp 10 mới mở, mỗi 3 cấp 1 con)
      if (!Array.isArray(this.state.cowPlots) || this.state.cowPlots.length !== 6) {
        this.state.cowPlots = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, state: 'hungry', readyAt: 0 }));
      }

      // Xóa bỏ hoàn toàn bánh mì nếu còn sót trong state cũ
      if (this.state.food !== undefined) {
        delete this.state.food;
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
      document.body.classList.remove('farm-active');
      document.documentElement.classList.remove('farm-active');
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

    hideQuizKeyboard() {
      const el1 = document.getElementById('farm-quiz-input');
      if (el1) el1.blur();
      const el2 = document.getElementById('farm-fruit-input');
      if (el2) el2.blur();
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
      }
      document.body.classList.remove('keyboard-open');
    },

    closeAllSheets() {
      this.hideQuizKeyboard();
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
      } catch (e) { }
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
      const fertEl = document.getElementById('farm-hud-fert');
      const soundBtn = document.getElementById('farm-btn-sound');

      const nextXp = 20 + this.state.level * 10;
      const pct = Math.min(100, Math.round((this.state.xp / nextXp) * 100));

      if (levelEl) levelEl.textContent = `🌱 Cấp ${this.state.level}`;
      if (xpBarEl) {
        xpBarEl.style.width = `${pct}%`;
        xpBarEl.title = `${this.state.xp}/${nextXp} XP (Bấm để xem chi tiết)`;
      }

      const coinsCountEl = document.getElementById('farm-hud-coins-count');
      const coinsEl = document.getElementById('farm-hud-coins');
      if (coinsCountEl) {
        coinsCountEl.textContent = this.state.coins || 0;
      } else if (coinsEl) {
        coinsEl.innerHTML = `${this.getCoinIcon(18)} <span id="farm-hud-coins-count">${this.state.coins || 0}</span>`;
      }

      if (fertEl) {
        const fertCountEl = document.getElementById('farm-hud-fert-count');
        if (fertCountEl) {
          fertCountEl.textContent = `${this.state.fertilizer || 0}`;
        } else {
          fertEl.innerHTML = `${this.getFertilizerBagIcon(18)} <span id="farm-hud-fert-count">${this.state.fertilizer || 0}</span>`;
        }
        fertEl.title = 'Túi phân bón (chạm để mở Shop)';
      }

      const wordsHudEl = document.getElementById('farm-hud-words');
      if (wordsHudEl) {
        const count = this.getRemainingWordsCount();
        wordsHudEl.textContent = `📖 ${count} từ`;
      }

      if (soundBtn) soundBtn.textContent = this.state.soundEnabled ? '🔊' : '🔇';

      // Cập nhật số vàng trên Shop Header (ghi như trên header và để bên trên)
      const shopCoinsEl = document.getElementById('farm-shop-coins-display');
      if (shopCoinsEl) {
        shopCoinsEl.textContent = this.state.coins || 0;
      }
    },

    renderBottomBar() {
      // Dòng "Đã thu hoạch" và "Từ còn trong kho" đã được lược bỏ khỏi footer theo yêu cầu
    },

    renderField() {
      this.renderCropGrid();
      this.renderTreeGrid();
      this.renderPoultryGrid();
      this.renderCattleGrid();
    },

    // =========================================================================
    // 5. RENDER CÁC KHU ĐẤT TRÊN NÔNG TRẠI
    // =========================================================================
    renderCropGrid() {
      const grid = document.getElementById('farm-grid');
      if (!grid) return;

      const now = Date.now();
      let html = '';

      for (let i = 0; i < 16; i++) {
        // Mỗi ô cần 1 cấp để mở khóa: Cấp 1 chỉ có 1 ô duy nhất (i = 0), Cấp 2 mở tiếp (i = 1), ...
        const reqLevel = i + 1;
        const isLocked = (this.state.level || 1) < reqLevel;

        if (isLocked) {
          html += `
            <div class="farm-plot farm-plot-locked" data-locked-req-level="${reqLevel}" data-locked-plot-idx="${i + 1}" title="Cần Cấp ${reqLevel} để mở ô này">
              <div class="farm-locked-icon">🔒</div>
              <div class="farm-locked-label">Cấp ${reqLevel}</div>
            </div>
          `;
          continue;
        }

        const plot = this.state.plots[i] || { id: i + 1, state: 'empty' };

        if (plot.state === 'empty') {
          html += `
            <div class="farm-plot farm-plot-empty" data-plot-id="${plot.id}">
              <img class="farm-plot-soil-bg" src="assets/farm/soil-empty.png" onerror="this.style.display='none'" alt="soil">
              <span class="farm-empty-plus">+</span>
              <span class="farm-empty-label">Chạm gieo</span>
            </div>
          `;
          continue;
        }

        const crop = CROP_TYPES[plot.cropType] || CROP_TYPES.radish;
        const totalWaterings = plot.wateringsNeeded || plot.stagesNeeded || crop.wateringsNeeded || 2;
        const isCooldown = plot.cooldownUntil && plot.cooldownUntil > now;
        const cooldownRemaining = isCooldown ? Math.ceil((plot.cooldownUntil - now) / 1000) : 0;
        const isReady = plot.stage >= totalWaterings;
        const isWitherWarning = plot.hp === 1 && !isReady;
        const isWitheredDead = plot.state === 'withered' || plot.hp <= 0;
        const hasWorm = !!plot.worm;

        // Class CSS cho ô đất
        const classes = ['farm-plot'];
        if (isWitheredDead) classes.push('farm-plot-withered');
        else if (isWitherWarning) classes.push('farm-plot-wither-warning');
        else if (isReady) classes.push('farm-plot-ready');
        else if (isCooldown) classes.push('farm-plot-cooling');

        // Sprite cây: mỗi giai đoạn phát triển (plot.stage từ 0 đến totalWaterings) có 1 hình ảnh tương ứng
        let spriteIdx = Math.min(crop.sprites.length - 1, Math.max(0, plot.stage));
        if (isReady) spriteIdx = crop.sprites.length - 1;
        const spriteSrc = isWitheredDead ? 'assets/farm/crop-withered.png' : crop.sprites[spriteIdx];

        // Tim máu cây (giảm còn 0.6 kích thước cũ ~6.5px, khi mất máu giữ lại viền)
        let heartsHtml = '';
        for (let h = 0; h < plot.maxHp; h++) {
          heartsHtml += this.getHeartIcon(h < plot.hp, 6.5);
        }

        // Chấm tiến độ số lần tưới nước
        let dotsHtml = '';
        for (let d = 0; d < totalWaterings; d++) {
          dotsHtml += d < plot.stage ? '●' : '○';
        }

        html += `
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
              <div class="farm-water-badge" title="Tưới cây (Lần ${plot.stage + 1}/${totalWaterings} • ${crop.questionsPerWater || 1} câu)">💧</div>
            ` : ''}

            <!-- Huy hiệu phân bón (Túi phân bón) -->
            ${plot.hasFertilizer && !isReady && !isWitheredDead ? `
              <div class="farm-fertilized-badge" title="Đã bón phân: Lớn 2 giai đoạn">${this.getFertilizerBagIcon(15)}</div>
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
              <div class="farm-worm-hearts">${Array.from({ length: plot.worm.maxHp || plot.worm.hp }, (_, wh) => this.getWormHeartIcon(wh < plot.worm.hp, 6.5)).join('')}</div>
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
      }

      grid.innerHTML = html;
      this.updateWaterAllButton();
    },

    // =========================================================================
    // CHỨC NĂNG TƯỚI TẤT CẢ (CHỈ HIỆN KHI CÓ CÂY ĐANG CẦN TƯỚI)
    // =========================================================================
    getWaterablePlots() {
      const now = Date.now();
      return (this.state.plots || []).filter(plot =>
        plot &&
        plot.state === 'growing' &&
        plot.stage < (plot.wateringsNeeded || plot.stagesNeeded || 2) &&
        (!plot.cooldownUntil || plot.cooldownUntil <= now) &&
        !plot.worm &&
        plot.hp > 0
      );
    },

    updateWaterAllButton() {
      const btn = document.getElementById('farm-btn-water-all');
      if (!btn) return;

      const waterablePlots = this.getWaterablePlots();
      if (waterablePlots.length > 0) {
        btn.style.display = 'flex';
        const badge = btn.querySelector('.farm-water-all-badge');
        if (badge) {
          badge.textContent = waterablePlots.length;
        }
        btn.title = `Tưới tất cả (${waterablePlots.length} cây đang cần tưới)`;
      } else {
        btn.style.display = 'none';
      }
    },

    waterAll() {
      const waterablePlots = this.getWaterablePlots();
      if (!waterablePlots || waterablePlots.length === 0) {
        if (window.showToast) window.showToast('Không có cây nào đang cần tưới lúc này!');
        return;
      }

      const mode = this.getZoneQuizMode('crops', 0);
      const word = this.pickNextWord();

      this.activeQuiz = {
        isWaterAll: true,
        waterablePlotIds: waterablePlots.map(p => p.id),
        mode: mode,
        word: {
          id: word.id,
          word: word.word,
          ipa: word.ipa,
          meaning: word.meaning,
          example: word.example,
          audioUrl: word.audioUrl
        },
        failCount: 0
      };

      this.renderQuizModal();
    },

    // 5.10. RENDER KHU CÂY ĂN QUẢ (CÓ SẴN TRÊN SÂN, BỊ MỜ NẾU CHƯA ĐỦ CẤP)
    renderTreeGrid() {
      const grid = document.getElementById('farm-tree-grid');
      if (!grid) return;

      const treeTypes = ['apple', 'orange', 'peach', 'pear', 'cherry'];
      const currentLevel = this.state.level || 1;

      const cardsHtml = treeTypes.map(type => {
        const def = FRUIT_TREES[type];
        if (!def) return '';

        let treeState = this.state.treePlots.find(t => t.type === type);
        if (!treeState) {
          treeState = { type, stage: 1, cooldown: 0, hearts: def.maxHp, words: [] };
          this.state.treePlots.push(treeState);
        }

        const isLocked = currentLevel < def.unlockLevel;
        const isReady = !isLocked && (treeState.stage || 1) >= 3;
        const isCooldown = !isLocked && (treeState.cooldown || 0) > 0;
        const stageIdx = Math.min(2, Math.max(0, (treeState.stage || 1) - 1));
        const spriteSrc = def.sprites[stageIdx];

        const cardClasses = ['farm-tree-card'];
        if (isLocked) cardClasses.push('farm-tree-locked');
        if (isReady) cardClasses.push('farm-tree-ready');

        return `
          <div class="${cardClasses.join(' ')}" data-tree-type="${type}" title="${isLocked ? `Cần Cấp ${def.unlockLevel} để mở Cây ${def.name}` : `Cây ${def.name}`}">
            <div class="farm-tree-header">
              <span class="farm-tree-name">${def.icon} Cây ${def.name}</span>
              ${isLocked
            ? `<span class="farm-tree-lock-badge">🔒 Cấp ${def.unlockLevel}</span>`
            : isReady
              ? `<span class="farm-tree-stage-badge" style="background:rgba(245,158,11,0.25); color:#fde047;">🧺 Chín rộ</span>`
              : isCooldown
                ? `<span class="farm-tree-stage-badge" style="background:rgba(148,163,184,0.2); color:#cbd5e1;">⏳ ${treeState.cooldown}s</span>`
                : `<span class="farm-tree-stage-badge">🌱 Giai đoạn ${treeState.stage}/3</span>`
          }
            </div>

            <div class="farm-tree-visual">
              <img class="farm-tree-sprite" src="${spriteSrc}" alt="${def.name}">
            </div>

            <div style="width:100%; text-align:center;">
              ${isLocked
            ? `<div class="farm-tree-locked-hint">Mở ở Cấp ${def.unlockLevel} • Cần học ${def.maxWords} từ/lần</div>`
            : isReady
              ? `<button type="button" class="farm-tree-btn btn-harvest" data-harvest-tree="${type}">🧺 Thu hoạch (+1 ${def.icon})</button>`
              : isCooldown
                ? `<div class="farm-tree-cooldown">Đang hồi (${treeState.cooldown}s)</div>`
                : `<button type="button" class="farm-tree-btn btn-water" data-water-tree="${type}">${def.maxWords}💧</button>`
          }
            </div>
          </div>
        `;
      }).join('');

      // Ô thứ 6 lấp đầy lưới 6 ô (2 hàng x 3 cột), không để lại ô trống
      const placeholderHtml = `
        <div class="farm-tree-card farm-tree-card-coming-soon" style="opacity: 0.45; border: 1.5px dashed rgba(255, 255, 255, 0.18); background: rgba(15, 23, 42, 0.45); cursor: default; justify-content: center; text-align: center; gap: 4px;">
          <div style="font-size: 26px; filter: grayscale(0.4);">🌱</div>
          <div class="farm-tree-name" style="color: #cbd5e1; font-size: 0.72rem;">Cây Thần Kỳ</div>
          <span class="farm-tree-lock-badge" style="background: rgba(148, 163, 184, 0.2); color: #cbd5e1;">🔒 Cấp 18</span>
          <div style="font-size: 0.66rem; color: #94a3b8; margin-top: 2px;">Sắp ra mắt</div>
        </div>
      `;

      grid.innerHTML = cardsHtml + placeholderHtml;
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
        this.state.treePlots.forEach(tree => {
          if (tree.cooldown && tree.cooldown > 0) {
            tree.cooldown -= 1;
            if (tree.cooldown <= 0) {
              tree.cooldown = 0;
              needsRerender = true;
            }
          }
        });
      }

      if (this.state.chickenPlots) {
        this.state.chickenPlots.forEach(ch => {
          if (ch.state === 'feeding' && ch.readyAt && ch.readyAt > 0 && now >= ch.readyAt) {
            ch.state = 'ready';
            ch.readyAt = 0;
            needsRerender = true;
          }
        });
      }

      if (this.state.cowPlots) {
        this.state.cowPlots.forEach(cow => {
          if (cow.state === 'feeding' && cow.readyAt && cow.readyAt > 0 && now >= cow.readyAt) {
            cow.state = 'ready';
            cow.readyAt = 0;
            needsRerender = true;
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

        document.querySelectorAll('.farm-tree-cooldown').forEach(cdEl => {
          const card = cdEl.closest('.farm-tree-card');
          const type = card?.getAttribute('data-tree-type');
          const tree = this.state.treePlots.find(t => t.type === type);
          if (tree && tree.cooldown > 0) {
            cdEl.textContent = `Đang hồi sức (${tree.cooldown}s)`;
          }
        });

        document.querySelectorAll('.farm-chicken-cooldown-text').forEach(cdEl => {
          const plotEl = cdEl.closest('.farm-chicken-plot');
          const chId = parseInt(plotEl?.getAttribute('data-chicken-id'), 10);
          const ch = this.state.chickenPlots?.find(p => p.id === chId);
          if (ch && ch.state === 'feeding' && ch.readyAt > now) {
            const leftSec = Math.ceil((ch.readyAt - now) / 1000);
            cdEl.textContent = `⏳ ${leftSec}s`;
          }
        });

        document.querySelectorAll('.farm-cow-cooldown-text').forEach(cdEl => {
          const plotEl = cdEl.closest('.farm-cow-plot');
          const cowId = parseInt(plotEl?.getAttribute('data-cow-id'), 10);
          const cow = this.state.cowPlots?.find(p => p.id === cowId);
          if (cow && cow.state === 'feeding' && cow.readyAt > now) {
            const leftSec = Math.ceil((cow.readyAt - now) / 1000);
            cdEl.textContent = `⏳ ${leftSec}s`;
          }
        });

        this.updateWaterAllButton();
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
      const totalWaterings = plot.wateringsNeeded || plot.stagesNeeded || (CROP_TYPES[plot.cropType]?.wateringsNeeded) || 2;
      if (plot.stage >= totalWaterings) {
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

      sheet.setAttribute('data-target-plot', plotId);

      // Cập nhật giá động & trạng thái nút theo số xu hiện có (không hiển thị số lượng kho)
      const userCoins = this.state.coins || 0;
      const seedCards = sheet.querySelectorAll('.farm-seed-card');
      seedCards.forEach(card => {
        const cType = card.getAttribute('data-crop');
        const cDef = CROP_TYPES[cType];
        if (!cDef) return;

        // Dòng 1: {số nước}{icon nước} {số từ}{icon sách} (thống nhất icon sau số, không viền và nền)
        const stagesEl = card.querySelector('.farm-seed-stages');
        const questionsEl = card.querySelector('.farm-seed-questions');

        let statsRow = card.querySelector('.farm-seed-stats-row');
        if (!statsRow && stagesEl && questionsEl) {
          statsRow = document.createElement('div');
          statsRow.className = 'farm-seed-stats-row';
          stagesEl.parentNode.insertBefore(statsRow, stagesEl);
          statsRow.appendChild(stagesEl);
          statsRow.appendChild(questionsEl);
        }

        if (stagesEl) stagesEl.innerHTML = `<b>${cDef.wateringsNeeded}</b>💧`;
        if (questionsEl) questionsEl.innerHTML = `<b>${cDef.questionsPerWater}</b>📖`;

        // Dòng 2: Máu và thời gian (thống nhất icon sau số: {máu}❤️ • {thời gian}⏳)
        const metaEl = card.querySelector('.farm-seed-meta');
        if (metaEl) {
          metaEl.innerHTML = `${cDef.maxHp || 3}❤️ • ${cDef.cooldownSec || 5}s⏳`;
        }

        // Nút bấm: Giá chuyển xuống thay cho chữ gieo hạt (giữ viền và nền của button)
        const canAfford = userCoins >= cDef.seedPrice;
        const btn = card.querySelector('.farm-seed-btn');
        if (btn) {
          btn.innerHTML = `${cDef.seedPrice} <img class="farm-coin-icon-img" src="assets/farm/coin.png" alt="coin">`;
          btn.style.opacity = canAfford ? '1' : '0.5';
          btn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
          btn.title = canAfford ? `Gieo hạt (${cDef.seedPrice} xu)` : 'Không đủ vàng để gieo hạt';
        }
      });

      // Hiển thị danh sách hạt giống ban đầu
      const stepSelect = document.getElementById('farm-seed-step-select');
      const stepConfirm = document.getElementById('farm-seed-step-confirm');
      if (stepSelect) stepSelect.style.display = 'block';
      if (stepConfirm) stepConfirm.style.display = 'none';

      sheet.classList.add('active');
    },

    // Khi trồng không cần chọn từ mà gieo ngay, khi tưới sẽ bốc câu hỏi ngẫu nhiên
    selectSeedType(cropType) {
      const sheet = document.getElementById('farm-sheet-seed');
      if (!sheet) return;

      const plotId = parseInt(sheet.getAttribute('data-target-plot'), 10);
      const crop = CROP_TYPES[cropType];
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot || !crop) return;

      const seedPrice = crop.seedPrice || 2;
      const userCoins = this.state.coins || 0;
      if (userCoins < seedPrice) {
        if (window.showToast) {
          window.showToast(`Không đủ vàng để mua hạt giống! Cần ${seedPrice}🪙 (Ví có: ${userCoins}🪙). Hãy bán nông sản để kiếm vàng!`);
        }
        return;
      }

      this.state.coins -= seedPrice;
      plot.cropType = cropType;
      plot.state = 'growing';
      plot.stage = 0;
      plot.wateringsNeeded = crop.wateringsNeeded;
      plot.stagesNeeded = crop.wateringsNeeded;
      plot.questionsPerWater = crop.questionsPerWater;
      plot.maxHp = crop.maxHp;
      plot.hp = crop.maxHp;
      plot.cooldownUntil = 0;
      plot.plantedAt = Date.now();

      this.saveState();
      sheet.classList.remove('active');
      this.renderHUD();
      this.renderCropGrid();
      this.playSound('pop');

      if (window.showToast) {
        window.showToast(`🌱 Đã gieo ${crop.name} (-${seedPrice}🪙)! Cần ${crop.wateringsNeeded} lần tưới (mỗi lần ${crop.questionsPerWater} câu) để thu hoạch.`);
      }
    },

    showSeedConfirmCard(cropType, word) {
      const stepSelect = document.getElementById('farm-seed-step-select');
      const stepConfirm = document.getElementById('farm-seed-step-confirm');
      const cardEl = document.getElementById('farm-seed-confirm-body');

      const crop = CROP_TYPES[cropType];
      if (!crop) return;

      const seedPrice = crop.seedPrice || 2;
      const userCoins = this.state.coins || 0;
      const canAfford = userCoins >= seedPrice;

      let costBanner = '';
      let btnLabel = '';
      if (canAfford) {
        costBanner = `
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; border-radius: 10px; padding: 8px 12px; font-size: 0.82rem; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display:inline-flex; align-items:center; gap:4px;">${this.getCoinIcon(16)} Chi phí gieo: <b>${seedPrice} vàng</b></span>
            <span style="font-weight: 700; color: #a7f3d0; display:inline-flex; align-items:center; gap:2px;">Ví của bạn: ${userCoins}${this.getCoinIcon(13)}</span>
          </div>
        `;
        btnLabel = `🌱 Gieo Hạt (-${seedPrice}${this.getCoinIcon(13)})`;
      } else {
        costBanner = `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; border-radius: 10px; padding: 8px 12px; font-size: 0.82rem; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display:inline-flex; align-items:center; gap:4px;">${this.getCoinIcon(16)} Cần <b>${seedPrice} vàng</b> để gieo hạt</span>
            <span style="font-weight: 700; color: #f87171; display:inline-flex; align-items:center; gap:2px;">Ví chỉ có: ${userCoins}${this.getCoinIcon(13)} (Thiếu)</span>
          </div>
        `;
        btnLabel = `Thiếu Vàng (${seedPrice}${this.getCoinIcon(13)})`;
      }

      const confirmBtn = document.getElementById('farm-seed-btn-confirm-plant');
      if (confirmBtn) {
        confirmBtn.innerHTML = btnLabel;
        confirmBtn.disabled = !canAfford;
        confirmBtn.style.opacity = canAfford ? '1' : '0.4';
        confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
      }

      if (cardEl) {
        cardEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #34d399; font-weight: 700;">
            <img src="${crop.seedImg}" style="width: 28px; height: 28px; image-rendering: pixelated;" onerror="this.style.display='none'">
            <span>Hạt giống ${crop.name}</span>
          </div>
          ${costBanner}
          <div class="farm-plant-confirm-card">
            <div class="farm-plant-word-row">
              <span class="farm-plant-word">${word.word}</span>
              ${word.ipa ? `<span class="farm-plant-ipa">${word.ipa}</span>` : ''}
              <button type="button" class="btn-audio" style="width: 28px; height: 28px; font-size: 13px; margin-left: auto;" onclick="window.wordsManager?.playPronunciation('${word.word}', '${word.audioUrl || ''}')">🔊</button>
            </div>
            <div class="farm-plant-meaning">${word.meaning}</div>
            ${word.example ? `<div class="farm-plant-example">"${word.example}"</div>` : ''}
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
            <span>💧 ${crop.wateringsNeeded} lần tưới</span> • <span>📖 ${crop.questionsPerWater} câu/lần</span> • <span>Hồi ${crop.cooldownSec}s</span> • <span>Thu hoạch ${crop.name} (Bán +${crop.sellPrice}${this.getCoinIcon(13)})</span> • <span>+${crop.rewardXp}${this.getXpIcon(14)}</span>
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

      const word = this.cachedWordsPool.find(w => w.id === wordId) || this.pickNextWord();
      const plot = this.state.plots.find(p => p.id === plotId);
      const crop = CROP_TYPES[cropType];
      if (!plot || !crop) return;

      const seedPrice = crop.seedPrice || 5;
      if ((this.state.coins || 0) < seedPrice) {
        if (window.showToast) window.showToast(`Không đủ vàng để mua hạt giống! Cần ${seedPrice}🪙 (Ví có: ${this.state.coins || 0}🪙).`);
        return;
      }

      this.state.coins -= seedPrice;
      const toastMsg = `Đã gieo ${crop.name} (-${seedPrice}🪙, "${word.word}")!`;

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
        window.showToast(toastMsg);
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

      // Lấy dạng quiz từ cài đặt riêng cho Vườn Nông Sản (có hỗ trợ ngẫu nhiên)
      const mode = this.getZoneQuizMode('crops', plot.stage);

      // Bốc từ ngẫu nhiên trong danh sách từ đang học
      const word = this.pickNextWord();

      const totalQ = isWormQuiz
        ? (plot.worm?.maxHp || plot.worm?.hp || 2)
        : (crop?.questionsPerWater || 1);
      const curQ = isWormQuiz
        ? ((plot.worm?.maxHp || plot.worm?.hp || 2) - (plot.worm?.hp || 1) + 1)
        : 1;

      this.activeQuiz = {
        plotId: plot.id,
        cropType: plot.cropType,
        isWormQuiz: isWormQuiz,
        mode: mode,
        questionIndex: curQ,
        totalQuestions: totalQ,
        word: {
          id: word.id,
          word: word.word,
          ipa: word.ipa,
          meaning: word.meaning,
          example: word.example,
          audioUrl: word.audioUrl
        },
        failCount: 0
      };

      this.renderQuizModal();
    },

    updateQuizHeaderStatus() {
      const statusEl = document.getElementById('farm-quiz-header-status');
      if (!statusEl || !this.activeQuiz) return;

      const q = this.activeQuiz;

      // Xử lý quiz Tưới Tất Cả
      if (q.isWaterAll) {
        const count = q.waterablePlotIds?.length || 1;
        statusEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 2px;">
            <span style="font-size: 0.88rem; font-weight: 700; color: #38bdf8;">💧 Tưới Tất Cả (${count} cây)</span>
            <span style="font-size: 0.8rem; color: #34d399; font-weight: 600;">📖 Trả lời đúng để tưới toàn bộ</span>
          </div>
        `;
        return;
      }

      // Xử lý quiz cho vật nuôi ăn (Gà / Bò)
      if (q.isAnimal) {
        const animalName = q.animalType === 'chicken' ? `Gà #${q.animalId}` : `Bò #${q.animalId}`;
        const animalIcon = q.animalType === 'chicken' ? '🐔' : '🐄';
        statusEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 2px;">
            <span style="font-size: 0.88rem; font-weight: 700; color: #fde047;">${animalIcon} Cho ${animalName} Ăn</span>
            <span style="font-size: 0.8rem; color: #38bdf8; font-weight: 600;">📖 Cần trả lời: <b>1 câu</b> • Chi phí: ${q.feedCost}🪙</span>
          </div>
        `;
        return;
      }

      const plot = this.state.plots.find(p => p.id === q.plotId);
      if (!plot) return;
      const crop = CROP_TYPES[q.cropType] || {};
      const totalWaterings = plot.wateringsNeeded || plot.stagesNeeded || (crop.wateringsNeeded || 2);

      const maxPlantHp = plot.maxHp || crop.maxHp || 3;
      let plantHeartsHtml = '';
      for (let i = 0; i < maxPlantHp; i++) {
        plantHeartsHtml += this.getHeartIcon(i < plot.hp, 8.5);
      }

      if (q.isWormQuiz && plot.worm) {
        const maxWormHp = plot.worm.maxHp || (crop.id === 'radish' ? 2 : 3);
        let wormHeartsHtml = '';
        for (let i = 0; i < maxWormHp; i++) {
          wormHeartsHtml += this.getWormHeartIcon(i < plot.worm.hp, 8.5);
        }
        statusEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; padding-bottom: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="farm-quiz-hearts" style="font-size: 0.9rem;">Máu sâu: ${wormHeartsHtml}</span>
              <span style="font-size: 0.8rem; color: #34d399; font-weight: 700;">🐛 Sâu còn ${plot.worm.hp}/${maxWormHp} HP</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="farm-quiz-hearts" style="font-size: 0.9rem;">Máu cây: ${plantHeartsHtml}</span>
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Cây ${crop.name || ''}</span>
            </div>
          </div>
        `;
        return;
      }

      let fertBtnHtml = '';
      if (!q.isWormQuiz && plot.stage < totalWaterings) {
        if (plot.hasFertilizer) {
          fertBtnHtml = `<span style="color:#a78bfa; font-size:11px; font-weight:700; margin-left: 8px; display:inline-flex; align-items:center; gap:3px;">${this.getFertilizerBagIcon(14)} Đã bón phân</span>`;
        } else {
          fertBtnHtml = `<button type="button" class="btn btn-secondary" style="padding: 2px 7px; font-size: 11px; border-color: #8b5cf6; color: #a78bfa; margin-left: 8px; display:inline-flex; align-items:center; gap:4px;" onclick="FarmGame.fertilizePlot(${plot.id}); FarmGame.updateQuizHeaderStatus();">${this.getFertilizerBagIcon(14)} Bón phân (${this.state.fertilizer || 0})</button>`;
        }
      }

      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 4px;">
          <div class="farm-quiz-hearts">Máu: ${plantHeartsHtml} ${fertBtnHtml}</div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600;">
            ${q.isWormQuiz
          ? `<span style="color: #34d399;">🐛 Đánh bại sâu (Hiệp ${q.questionIndex}/${q.totalQuestions})</span>`
          : `<span style="color: #38bdf8;">💧 Lần tưới: ${plot.stage + 1}/${totalWaterings}</span> <span style="color: #34d399;">📖 Câu hỏi: ${q.questionIndex}/${q.totalQuestions}</span>`
        }
          </div>
        </div>
      `;
    },

    async renderQuizModal() {
      const sheet = document.getElementById('farm-sheet-quiz');
      if (!sheet || !this.activeQuiz) return;

      const q = this.activeQuiz;
      const plot = !q.isAnimal ? this.state.plots.find(p => p.id === q.plotId) : null;
      const crop = (!q.isAnimal && plot) ? CROP_TYPES[q.cropType] : null;

      // Tiêu đề
      const titleEl = document.getElementById('farm-quiz-title');
      if (titleEl) {
        if (q.isWaterAll) {
          titleEl.textContent = `💧 Tưới Tất Cả (${q.waterablePlotIds?.length || 1} Cây)`;
        } else if (q.isAnimal) {
          titleEl.textContent = q.animalType === 'chicken' ? `Cho Gà #${q.animalId} Ăn 🐔` : `Cho Bò #${q.animalId} Ăn 🐄`;
        } else if (q.isWormQuiz) {
          titleEl.textContent = `Bắt sâu! 🐛 (Hiệp ${q.questionIndex}/${q.totalQuestions})`;
        } else {
          const totalWaterings = plot ? (plot.wateringsNeeded || plot.stagesNeeded || (crop?.wateringsNeeded || 2)) : 2;
          titleEl.textContent = `Tưới cây — ${crop ? crop.name : 'Nông sản'} (Lần ${plot ? plot.stage + 1 : 1}/${totalWaterings})`;
        }
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
          const sentence = aiRes?.data?.sentence || aiRes?.sentence || aiRes?.sentences?.[0]?.sentence;
          if (aiRes && aiRes.success && sentence) {
            const aiData = {
              sentence: sentence,
              hint: aiRes?.data?.hint || aiRes?.hint || aiRes?.sentences?.[0]?.hint || q.word.meaning,
              provider: aiRes?.provider || aiRes?.data?.provider || 'Groq'
            };
            const providerTag = aiData.provider ? `⚡ ${aiData.provider}` : '🤖 AI';
            contentHtml = `
              <div class="farm-quiz-prompt-card">
                <span style="font-size: 0.8rem; color: #f59e0b; font-weight: 700;">${providerTag}:</span>
                <div class="farm-quiz-question-word" style="font-size: 1.15rem; line-height: 1.5; color: #f1f5f9; margin: 8px 0; font-weight: 600;">
                  "${aiData.sentence}"
                </div>
                ${aiData.hint ? `<div style="font-size: 0.82rem; color: #38bdf8; font-style: italic;">💡 Gợi ý nghĩa: ${aiData.hint}</div>` : ''}
              </div>
              <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Điền từ còn thiếu vào chỗ trống..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="go">
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
            <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ tiếng Anh tại đây..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="go">
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
          <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ bạn nghe được..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="go">
          <button type="button" class="btn btn-primary" id="farm-quiz-submit-btn" style="width: 100%; min-height: 48px;">Kiểm tra</button>
        `;
      } else if (q.mode === 'typing') {
        // 2. Điền từ
        contentHtml = `
          <div class="farm-quiz-prompt-card">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">Gõ từ tiếng Anh có nghĩa:</span>
            <div class="farm-quiz-question-word" style="color: #38bdf8;">"${q.word.meaning}"</div>
          </div>
          <input type="text" id="farm-quiz-input" class="farm-quiz-input" placeholder="Gõ từ tiếng Anh tại đây..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="go">
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

      // Tự động trỏ vào ô nhập nếu là chế độ gõ (sao chép y hệt cơ chế bên phòng học chính study.js)
      const inputEl = document.getElementById('farm-quiz-input');
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus({ preventScroll: true });
        
        // Fix lỗi giật viewport trên mobile khi mất focus (giống study.js)
        inputEl.addEventListener('blur', () => {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
        });

        // Chạm vào khung câu hỏi để kích hoạt focus mở bàn phím nếu chưa mở
        document.querySelector('.farm-quiz-body')?.addEventListener('click', (e) => {
          if (e.target.closest('button, .farm-quiz-opt-btn')) return;
          inputEl.focus({ preventScroll: true });
        });

        // Nhấn Enter nộp bài ngay lập tức (ngăn reload/form submit)
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            this.checkQuizAnswer(inputEl.value);
          }
        });
      } else {
        // Nếu là trắc nghiệm, chắc chắn thu gọn bàn phím ảo ngay lập tức (giống study.js)
        this.hideQuizKeyboard();
      }

      // Phát âm thanh ngay nếu là chế độ nghe
      if (q.mode === 'listening') {
        setTimeout(() => {
          window.wordsManager?.playPronunciation(q.word.word, q.word.audioUrl);
        }, 300);
      }

      // Bắt sự kiện nộp bài
      document.getElementById('farm-quiz-submit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const inp = document.getElementById('farm-quiz-input');
        const val = inp?.value || '';
        this.checkQuizAnswer(val);
      });

      // Phát âm thanh: dùng mousedown & touchstart để chặn mất focus input (giống study.js)
      const playAudioBtn = document.getElementById('farm-quiz-play-audio');
      if (playAudioBtn) {
        const onAudio = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          window.wordsManager?.playPronunciation(q.word.word, q.word.audioUrl);
        };
        playAudioBtn.addEventListener('mousedown', onAudio);
        playAudioBtn.addEventListener('touchstart', onAudio, { passive: false });
        playAudioBtn.addEventListener('click', onAudio);
      }

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

      // Chuẩn hoá đáp án giống study.js: trim và loại bỏ khoảng trắng thừa ở giữa
      const cleanUserAns = (userAnswer || '').trim().replace(/\s+/g, ' ').toLowerCase();
      let isCorrect = false;
      if (q.mode === 'choice') {
        const cleanMeaning = (q.word.meaning || '').trim().replace(/\s+/g, ' ').toLowerCase();
        isCorrect = (cleanUserAns === cleanMeaning);
      } else {
        // Gõ từ tiếng Anh (cho cả typing, listening, ai)
        const cleanWord = (q.word.word || '').trim().replace(/\s+/g, ' ').toLowerCase();
        isCorrect = (cleanUserAns === cleanWord);
      }

      // Phát âm từ ngay khi trả lời đúng (giống study.js), trừ listening để tránh đè âm thanh
      if (isCorrect && window.wordsManager && q.mode !== 'listening') {
        window.wordsManager.playPronunciation(q.word.word, q.word.audioUrl);
      }

      // 0. QUIZ TƯỚI TẤT CẢ (WATER ALL)
      if (q.isWaterAll) {
        if (isCorrect) {
          if (targetBtnEl) targetBtnEl.classList.add('correct');
          this.playSound('pop');

          const now = Date.now();
          let count = 0;
          (q.waterablePlotIds || []).forEach(plotId => {
            const plot = this.state.plots.find(p => p.id === plotId);
            const totalWaterings = plot ? (plot.wateringsNeeded || plot.stagesNeeded || 2) : 2;
            if (!plot || plot.state !== 'growing' || plot.stage >= totalWaterings) return;

            const crop = CROP_TYPES[plot.cropType] || {};
            if (plot.hp === 1) {
              plot.hp = Math.min(plot.maxHp || 3, 2);
            }

            const growth = plot.hasFertilizer ? 2 : 1;
            plot.stage = Math.min(totalWaterings, plot.stage + growth);
            plot.hasFertilizer = false;

            plot.cooldownUntil = now + (crop.cooldownSec || 5) * 1000;
            this.maybeSpawnWorm(plot.id);
            count++;
          });

          // Tưới cây không tăng EXP, chỉ thu hoạch mới tăng EXP
          this.state.quests.watered = (this.state.quests.watered || 0) + count;

          this.saveState();
          this.render();

          if (window.showToast) {
            window.showToast(`💧 Đã tưới nước thành công cho tất cả ${count} cây!`);
          }

          // Hoàn thành tưới: Ẩn ngay bàn phím ảo
          this.hideQuizKeyboard();

          setTimeout(() => {
            document.getElementById('farm-sheet-quiz')?.classList.remove('active');
            this.activeQuiz = null;
          }, 650);
        } else {
          if (targetBtnEl) targetBtnEl.classList.add('incorrect');
          this.playSound('wrong');

          (q.waterablePlotIds || []).forEach(plotId => {
            const plot = this.state.plots.find(p => p.id === plotId);
            if (plot && plot.hp > 1) {
              plot.hp -= 1;
            }
          });
          this.saveState();
          this.render();

          q.failCount = (q.failCount || 0) + 1;
          const hintBox = document.getElementById('farm-quiz-hint-box');
          if (hintBox) {
            hintBox.style.display = 'block';
            if (q.failCount === 1) {
              const firstLetter = q.word.word.charAt(0).toUpperCase();
              hintBox.innerHTML = `💡 <b>Gợi ý:</b> Từ bắt đầu bằng chữ <b>"${firstLetter}..."</b> • Nghĩa: <i>"${q.word.meaning}"</i>`;
              const inp = document.getElementById('farm-quiz-input');
              if (inp) {
                inp.value = '';
                inp.focus({ preventScroll: true });
              }
            } else {
              hintBox.innerHTML = `📖 <b>Đáp án:</b> <b style="color:#34d399;">${q.word.word}</b> [${q.word.ipa || ''}] = <i>${q.word.meaning}</i><br>Đã chuyển câu hỏi sang dạng trắc nghiệm dễ hơn!`;
              q.mode = 'choice';
              this.hideQuizKeyboard();
              setTimeout(() => this.renderQuizModal(), 1200);
            }
          }
        }
        return;
      }

      // 1. QUIZ CHO VẬT NUÔI ĂN (GÀ, BÒ)
      if (q.isAnimal) {
        if (isCorrect) {
          if (targetBtnEl) targetBtnEl.classList.add('correct');
          this.playSound('pop');

          this.state.coins -= q.feedCost;
          if (q.animalType === 'chicken') {
            const ch = this.state.chickenPlots?.find(p => p.id === q.animalId);
            if (ch) {
              ch.state = 'feeding';
              ch.readyAt = Date.now() + 5000;
            }
            this.gainXp(3);
            if (window.showToast) {
              window.showToast(`🌾 Trả lời đúng! Đã cho Gà #${q.animalId} ăn (-${q.feedCost}🪙)! Gà đang ấp trứng (5s)...`);
            }
          } else {
            const cow = this.state.cowPlots?.find(p => p.id === q.animalId);
            if (cow) {
              cow.state = 'feeding';
              cow.readyAt = Date.now() + 5000;
            }
            this.gainXp(5);
            if (window.showToast) {
              window.showToast(`🌿 Trả lời đúng! Đã cho Bò #${q.animalId} ăn (-${q.feedCost}🪙)! Bò đang tạo sữa (5s)...`);
            }
          }

          this.saveState();
          this.render();

          // Hoàn thành cho ăn: Ẩn ngay bàn phím ảo
          this.hideQuizKeyboard();

          setTimeout(() => {
            document.getElementById('farm-sheet-quiz')?.classList.remove('active');
            this.activeQuiz = null;
          }, 650);
        } else {
          // Trả lời sai khi cho ăn: Không trừ tiền, hiển thị gợi ý
          if (targetBtnEl) targetBtnEl.classList.add('incorrect');
          q.failCount = (q.failCount || 0) + 1;
          const hintBox = document.getElementById('farm-quiz-hint-box');
          if (hintBox) {
            hintBox.style.display = 'block';
            if (q.failCount === 1) {
              const firstLetter = q.word.word.charAt(0).toUpperCase();
              hintBox.innerHTML = `💡 <b>Gợi ý:</b> Từ bắt đầu bằng chữ <b>"${firstLetter}..."</b> • Nghĩa: <i>"${q.word.meaning}"</i>`;
              const inp = document.getElementById('farm-quiz-input');
              if (inp) {
                inp.value = '';
                inp.focus({ preventScroll: true });
              }
            } else {
              hintBox.innerHTML = `📖 <b>Đáp án:</b> <b style="color:#34d399;">${q.word.word}</b> [${q.word.ipa || ''}] = <i>${q.word.meaning}</i><br>Đã chuyển câu hỏi sang dạng dễ hơn để bạn ôn lại!`;
              q.mode = 'choice';
              this.hideQuizKeyboard();
              setTimeout(() => this.renderQuizModal(), 1200);
            }
          }
        }
        return;
      }

      // 2. QUIZ CÂY TRỒNG NÔNG SẢN
      const plot = this.state.plots.find(p => p.id === q.plotId);
      if (!plot) return;

      const crop = CROP_TYPES[q.cropType];

      if (isCorrect) {
        // ================= TRẢ LỜI ĐÚNG =================
        if (targetBtnEl) targetBtnEl.classList.add('correct');
        this.playSound('pop');

        if (q.isWormQuiz && plot.worm) {
          // Bắt sâu: Trừ 1 máu sâu
          plot.worm.hp -= 1;
          q.questionIndex = (plot.worm.maxHp || (crop.id === 'radish' ? 2 : 3)) - plot.worm.hp + 1;
          this.updateQuizHeaderStatus();
          if (plot.worm.hp <= 0) {
            // Đã bắt xong sâu! Ẩn bàn phím ảo ngay
            this.hideQuizKeyboard();

            plot.worm = null;
            this.state.coins += 10;
            this.gainXp(10);
            this.state.quests.worms = (this.state.quests.worms || 0) + 1;
            if (window.showToast) window.showToast('🐛 Đã diệt sạch sâu hại! +10 vàng, +10 XP');

            this.saveState();
            this.render();

            setTimeout(() => {
              document.getElementById('farm-sheet-quiz')?.classList.remove('active');
              this.activeQuiz = null;
            }, 650);
          } else {
            // Sâu còn máu -> Tiếp tục hỏi câu tiếp theo, giữ bàn phím mở để gõ tiếp
            if (window.showToast) window.showToast(`Đúng rồi! Sâu còn ${plot.worm.hp} máu. Hãy tiếp tục!`);
            this.saveState();
            this.render();

            const nextWord = this.pickNextWord(q.word.id);
            q.word = {
              id: nextWord.id,
              word: nextWord.word,
              ipa: nextWord.ipa,
              meaning: nextWord.meaning,
              example: nextWord.example,
              audioUrl: nextWord.audioUrl
            };
            q.failCount = 0;
            q.mode = this.getZoneQuizMode('crops', plot.stage);

            setTimeout(() => {
              this.renderQuizModal();
            }, 450);
          }
          return;
        } else {
          // Tưới cây bình thường:
          // Nếu còn câu hỏi trong lần tưới này (q.questionIndex < q.totalQuestions)
          if (q.questionIndex < q.totalQuestions) {
            q.questionIndex += 1;
            this.saveState();
            this.render();

            const nextWord = this.pickNextWord(q.word.id);
            q.word = {
              id: nextWord.id,
              word: nextWord.word,
              ipa: nextWord.ipa,
              meaning: nextWord.meaning,
              example: nextWord.example,
              audioUrl: nextWord.audioUrl
            };
            q.failCount = 0;
            q.mode = this.getZoneQuizMode('crops', plot.stage);

            // Giữ bàn phím mở để gõ câu tiếp theo liên tục (giống study.js)
            setTimeout(() => {
              this.renderQuizModal();
            }, 450);
            return;
          }

          // ĐÃ HOÀN THÀNH HẾT SỐ CÂU HỎI TRONG LẦN TƯỚI NÀY!
          // Ẩn bàn phím ảo trên điện thoại ngay lập tức theo yêu cầu!
          this.hideQuizKeyboard();

          // Nếu đang héo (1 HP): hồi 1 máu trước, sau đó mới lớn
          if (plot.hp === 1) {
            plot.hp = Math.min(plot.maxHp || 3, 2);
            if (window.showToast) window.showToast('🌿 Cây đã hồi phục, thoát trạng thái héo!');
          }

          // Tăng giai đoạn (+2 nếu đã bón phân)
          const growth = plot.hasFertilizer ? 2 : 1;
          const totalWaterings = plot.wateringsNeeded || plot.stagesNeeded || (crop ? crop.wateringsNeeded : 2);
          plot.stage = Math.min(totalWaterings, plot.stage + growth);
          plot.hasFertilizer = false; // Tiêu thụ bón phân

          // Thời gian hồi sau tưới
          plot.cooldownUntil = Date.now() + (crop ? crop.cooldownSec : 5) * 1000;

          // Tưới cây không tăng EXP, chỉ thu hoạch mới tăng EXP
          this.state.quests.watered = (this.state.quests.watered || 0) + 1;

          // 20% tỉ lệ xuất hiện sâu sau khi tưới
          this.maybeSpawnWorm(plot.id);

          this.saveState();
          this.render();

          if (window.showToast) {
            if (plot.stage >= totalWaterings) {
              window.showToast(`✨ ${crop ? crop.name : 'Cây'} đã chín rộ! Hãy chạm để thu hoạch! 🧺`);
            } else {
              window.showToast(`💧 Đã hoàn thành lần tưới ${plot.stage}/${totalWaterings}!`);
            }
          }

          // Tự động đóng modal sau 650ms
          setTimeout(() => {
            document.getElementById('farm-sheet-quiz')?.classList.remove('active');
            this.activeQuiz = null;
          }, 650);
          return;
        }

      } else {
        // ================= TRẢ LỜI SAI =================
        if (targetBtnEl) targetBtnEl.classList.add('incorrect');
        q.failCount += 1;

        // Trừ 1 máu cây (cả lúc tưới lẫn bắt sâu)
        plot.hp -= 1;

        // Cập nhật ngay lập tức tim máu trên bảng quiz
        this.updateQuizHeaderStatus();

        if (plot.hp <= 0) {
          // Cây chết: Ẩn bàn phím ảo ngay lập tức
          this.hideQuizKeyboard();

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
            const inp = document.getElementById('farm-quiz-input');
            if (inp) {
              inp.value = '';
              inp.focus({ preventScroll: true });
            }
          } else {
            hintBox.innerHTML = `📖 <b>Đáp án:</b> <b style="color:#34d399;">${q.word.word}</b> [${q.word.ipa || ''}] = <i>${q.word.meaning}</i><br>Đã chuyển câu hỏi sang dạng dễ hơn để bạn ôn lại!`;
            // Chuyển sang dạng trắc nghiệm: Ẩn bàn phím ảo ngay lập tức
            q.mode = 'choice';
            this.hideQuizKeyboard();
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
          p.stage < (p.wateringsNeeded || p.stagesNeeded || 2) &&
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
      const price = this.getFertilizerPrice();
      if (this.state.coins < price) {
        if (window.showToast) window.showToast(`Không đủ vàng! Cần ${price}🪙 để mua phân bón.`);
        return;
      }

      this.state.coins -= price;
      this.state.fertilizer += 1;
      this.saveState();
      this.render();
      this.playSound('pop');

      const chip = document.querySelector('.farm-fertilizer-chip');
      chip?.classList.add('farm-bump-anim');
      setTimeout(() => chip?.classList.remove('farm-bump-anim'), 350);

      if (window.showToast) {
        window.showToast(`Đã mua 1 túi phân bón (${price} vàng)!`);
      }
    },

    fertilizePlot(plotId) {
      const plot = this.state.plots.find(p => p.id === plotId);
      if (!plot || plot.state !== 'growing' || plot.stage >= (plot.wateringsNeeded || plot.stagesNeeded || 2)) return;

      if (this.state.fertilizer <= 0) {
        const price = this.getFertilizerPrice();
        if (confirm(`Bạn chưa có phân bón. Mua ngay 1 túi với ${price} vàng?`)) {
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
      if (!plot || plot.stage < (plot.wateringsNeeded || plot.stagesNeeded || 2)) return;

      const crop = CROP_TYPES[plot.cropType];

      // Thu hoạch nông sản: thu 1 nông sản vào kho (không dùng bánh mì)
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
        cropIcon: crop.icon,
        cropName: crop.name,
        rewardXp: crop.rewardXp
      };

      // Đánh dấu từ đã thuộc trong backend (nếu có id)
      if (plot.wordId && window.api?.toggleWordLearned) {
        try {
          await window.api.toggleWordLearned(plot.wordId);
        } catch (e) { }
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
        <div class="harvest-rewards">+1 ${info.cropIcon || '🌾'} ${info.cropName || ''} | +${info.rewardXp} ${this.getXpIcon(15)}</div>
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
      let bonuses = [];
      if (lvl <= 16) {
        bonuses.push(`<span style="display:inline-flex; align-items:center; gap:4px; color:#34d399;">+ Mở khóa ${this.getSoilPlotIcon(18)}</span>`);
      }
      if (lvl === 3) bonuses.push('<span style="color:#38bdf8;">+ Mở khóa 🍎</span>');
      else if (lvl === 6) bonuses.push('<span style="color:#38bdf8;">+ Mở khóa 🍊</span>');
      else if (lvl === 9) bonuses.push('<span style="color:#38bdf8;">+ Mở khóa 🍑</span>');
      else if (lvl === 12) bonuses.push('<span style="color:#38bdf8;">+ Mở khóa 🍐</span>');
      else if (lvl === 15) bonuses.push('<span style="color:#38bdf8;">+ Mở khóa 🍒</span>');

      if (lvl === 5 || (lvl > 5 && lvl <= 19 && (lvl - 5) % 2 === 0)) {
        bonuses.push('<span style="color:#fde047;">+ Mở khóa 🥚</span>');
      }

      if (lvl === 10 || (lvl > 10 && lvl <= 25 && (lvl - 10) % 3 === 0)) {
        bonuses.push('<span style="color:#67e8f9;">+ Mở khóa 🥛</span>');
      }

      const bonusStr = bonuses.join('<br>');
      if (titleEl) titleEl.textContent = `🎉 Lên Cấp ${lvl}!`;
      if (descEl) descEl.innerHTML = `Bạn nhận được:<br><b style="color:#fbbf24;">+20 vàng</b><br>${bonusStr}`;

      overlay.classList.add('active');
    },

    // =========================================================================
    // XEM THÔNG TIN CẤP ĐỘ & XP (Tooltip nhỏ 2 dòng: EXP 1 dòng, Vật phẩm 1 dòng)
    // =========================================================================
    toggleLevelTooltip() {
      const tooltip = document.getElementById('farm-level-tooltip');
      if (!tooltip) return;

      if (!tooltip.hasAttribute('hidden')) {
        tooltip.setAttribute('hidden', '');
        return;
      }

      const lvl = this.state.level || 1;
      const curXp = this.state.xp || 0;
      const nextXp = 20 + lvl * 10;
      const missingXp = Math.max(0, nextXp - curXp);

      const nextLvl = lvl + 1;
      let rewards = [];
      if (nextLvl <= 16) {
        rewards.push(this.getSoilPlotIcon(16));
      }
      if (nextLvl === 3) rewards.push('🍎');
      else if (nextLvl === 6) rewards.push('🍊');
      else if (nextLvl === 9) rewards.push('🍑');
      else if (nextLvl === 12) rewards.push('🍐');
      else if (nextLvl === 15) rewards.push('🍒');

      if (nextLvl === 5 || (nextLvl > 5 && nextLvl <= 19 && (nextLvl - 5) % 2 === 0)) {
        rewards.push('🥚');
      }

      if (nextLvl === 10 || (nextLvl > 10 && nextLvl <= 25 && (nextLvl - 10) % 3 === 0)) {
        rewards.push('🥛');
      }

      const xpEl = document.getElementById('farm-tooltip-xp-line');
      const rewardEl = document.getElementById('farm-tooltip-reward-line');
      const rewardIconEl = document.getElementById('farm-tooltip-reward-icon');
      if (xpEl) xpEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${this.getXpIcon(14)} <b>${curXp}</b> / <b>${nextXp}</b></span>`;
      if (rewardEl) {
        if (rewards.length) {
          rewardEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;">Cấp ${nextLvl} mở: ${rewards.join(' ')}</span>`;
        } else {
          rewardEl.innerHTML = `<span>Đạt cấp độ tối đa! 👑</span>`;
        }
      }
      if (rewardIconEl) rewardIconEl.textContent = '';

      tooltip.removeAttribute('hidden');
    },

    openLevelInfoModal() {
      this.toggleLevelTooltip();
    },

    // =========================================================================
    // KHO ĐÃ ĐƯỢC THAY BẰNG HIỂN THỊ XU VÀNG & QUẢN LÝ BÁN QUA SHOP
    // =========================================================================
    openStorageModal() {
      this.openShopModal();
    },

    // =========================================================================
    // CỬA HÀNG NÔNG TRẠI (SHOP: MUA PHÂN BÓN & BÁN NÔNG SẢN KHÔNG GIỚI HẠN)
    // =========================================================================
    openShopModal() {
      const modal = document.getElementById('farm-sheet-shop');
      if (!modal) return;
      this.renderShopModal();
      modal.classList.add('active');
    },

    renderShopModal() {
      const body = document.getElementById('farm-shop-body');
      if (!body) return;

      const fertPrice = 15;
      const currentLevel = Math.max(1, this.state.level || 1);

      // Cập nhật số vàng trên Shop Header (ghi như trên header và để bên trên)
      const shopCoinsEl = document.getElementById('farm-shop-coins-display');
      if (shopCoinsEl) {
        shopCoinsEl.textContent = this.state.coins || 0;
      }

      body.innerHTML = `
        <!-- PHẦN 1: MUA VẬT PHẨM (Chỉ mua Phân bón - Thu nhỏ, bỏ dữ liệu thừa) -->
        <div style="margin-bottom: 12px;">
          <div class="farm-shop-buy-card">
            <div class="farm-shop-buy-left">
              <div class="farm-shop-buy-icon">
                ${this.getFertilizerBagIcon(28)}
              </div>
              <div class="farm-shop-buy-info">
                <span class="farm-shop-buy-name">Phân bón</span>
                <span class="farm-shop-buy-stock">(Có: ${this.state.fertilizer || 0})</span>
              </div>
            </div>
            <button type="button" class="btn btn-primary farm-shop-buy-btn" id="farm-shop-btn-buy-fert"
              style="display:inline-flex; align-items:center; gap:4px;"
              ${(this.state.coins || 0) < 15 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              15${this.getCoinIcon(14)} Mua
            </button>
          </div>
        </div>

        <!-- PHẦN 2: BÁN VẬT PHẨM (MỖI VẬT PHẨM 1 NÚT BÁN - KHÔNG BÁN PHÂN BÓN) -->
        <div>
          <div class="farm-shop-section-title" style="margin-bottom: 8px;">
            <span>💰 Bán Hàng Lấy Vàng</span>
          </div>

          <div class="farm-shop-grid">
            ${SHOP_SELL_ITEMS.map(it => {
        const stock = this.getItemStock(it.id);

        return `
                <div class="farm-shop-grid-card ${stock === 0 ? 'empty-stock' : ''}">
                  <div class="farm-shop-grid-icon">
                    ${it.icon}
                  </div>
                  <div class="farm-shop-grid-name" title="${it.name}">${it.name}</div>
                  <div class="farm-shop-grid-stock">
                    Đang có: <b style="color: ${stock > 0 ? '#34d399' : '#94a3b8'};">${stock}</b>
                  </div>
                  <div class="farm-shop-grid-price" style="display:inline-flex; align-items:center; justify-content:center; gap:2px;">
                    Đơn giá: <b style="color: #fbbf24;">+${it.price}${this.getCoinIcon(14)}</b>
                  </div>
                  <div class="farm-shop-grid-actions">
                    <button type="button" class="farm-shop-sell-btn farm-btn-sell-item" data-item-id="${it.id}"
                      ${stock === 0 ? 'disabled' : ''}>
                      ${stock === 0 ? 'Hết hàng' : 'Bán'}
                    </button>
                  </div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;

      // Gắn sự kiện Mua Phân Bón
      body.querySelector('#farm-shop-btn-buy-fert')?.addEventListener('click', () => {
        this.buyFertilizerFromShop();
      });

      // Gắn sự kiện Bán (mở Modal bán có thanh trượt & ô nhập số)
      body.querySelectorAll('.farm-btn-sell-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = btn.getAttribute('data-item-id');
          this.openSellModal(itemId);
        });
      });
    },

    // Modal Bán vật phẩm: 1 nút bán mở modal có thanh trượt & ô điền số, tính trực tiếp tổng tiền
    openSellModal(itemId) {
      const it = SHOP_SELL_ITEMS.find(x => x.id === itemId);
      if (!it) return;

      const stock = this.getItemStock(itemId);
      if (stock <= 0) {
        if (window.showToast) window.showToast('Bạn không có món này trong kho để bán!');
        return;
      }

      const overlay = document.getElementById('farm-shop-confirm-overlay');
      const contentEl = document.getElementById('farm-shop-confirm-content');
      const okBtn = document.getElementById('farm-shop-confirm-ok');
      if (!overlay || !contentEl) return;

      let currentQty = 1;
      const userCoins = this.state.coins || 0;

      const updateUI = (qty) => {
        currentQty = Math.max(1, Math.min(stock, Math.floor(qty) || 1));
        const totalGold = currentQty * it.price;
        const afterCoins = userCoins + totalGold;

        const slider = document.getElementById('farm-sell-qty-slider');
        const input = document.getElementById('farm-sell-qty-input');
        const totalEl = document.getElementById('farm-sell-total-amount');
        const previewEl = document.getElementById('farm-sell-wallet-preview');

        if (slider && parseInt(slider.value, 10) !== currentQty) slider.value = currentQty;
        if (input && parseInt(input.value, 10) !== currentQty) input.value = currentQty;
        if (totalEl) totalEl.innerHTML = `+${totalGold} VÀNG ${this.getCoinIcon(20)}`;
        if (previewEl) {
          previewEl.innerHTML = `Ví hiện tại: <b style="display:inline-flex; align-items:center; gap:2px;">${userCoins}${this.getCoinIcon(13)}</b> ➔ Sau khi bán: <b style="color: #34d399; display:inline-flex; align-items:center; gap:2px;">${afterCoins}${this.getCoinIcon(13)}</b>`;
        }
        if (okBtn) {
          okBtn.innerHTML = `✅ Bán (+${totalGold}${this.getCoinIcon(14)})`;
        }
        this.pendingSale = { itemId, it, qty: currentQty, totalGold };
      };

      const iconHtml = `<span style="font-size: 2.2rem; line-height: 1;">${it.icon}</span>`;

      contentEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
          ${iconHtml}
          <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">${it.name}</div>
          <div style="font-size: 0.82rem; color: #94a3b8; display:flex; align-items:center; gap:4px;">
            Đang có: <b style="color: #34d399;">${stock}</b> • Đơn giá: <b style="color: #fbbf24; display:inline-flex; align-items:center; gap:2px;">+${it.price}${this.getCoinIcon(14)}</b>
          </div>
        </div>

        <div class="farm-sell-controls">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 600;">Số lượng bán:</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <input type="number" id="farm-sell-qty-input" class="farm-sell-qty-input" min="1" max="${stock}" value="1">
              <button type="button" id="farm-sell-btn-max" class="farm-sell-btn-max">Tất cả</button>
            </div>
          </div>
          <input type="range" id="farm-sell-qty-slider" class="farm-sell-qty-slider" min="1" max="${stock}" value="1">
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; margin-top: 3px;">
            <span>1</span>
            <span>Tối đa (${stock})</span>
          </div>
        </div>

        <div class="farm-confirm-total-box">
          <div class="farm-confirm-total-label">TỔNG TIỀN NHẬN ĐƯỢC</div>
          <div class="farm-confirm-total-amount" id="farm-sell-total-amount" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            +${it.price} VÀNG ${this.getCoinIcon(20)}
          </div>
        </div>

        <div id="farm-sell-wallet-preview" style="font-size: 0.78rem; color: #cbd5e1; margin-top: 4px;">
          Ví hiện tại: <b style="display:inline-flex; align-items:center; gap:2px;">${userCoins}${this.getCoinIcon(13)}</b> ➔ Sau khi bán: <b style="color: #34d399; display:inline-flex; align-items:center; gap:2px;">${userCoins + it.price}${this.getCoinIcon(13)}</b>
        </div>
      `;

      updateUI(1);

      const sliderEl = document.getElementById('farm-sell-qty-slider');
      const inputEl = document.getElementById('farm-sell-qty-input');
      const maxBtn = document.getElementById('farm-sell-btn-max');

      sliderEl?.addEventListener('input', (e) => {
        updateUI(parseInt(e.target.value, 10));
      });

      inputEl?.addEventListener('input', (e) => {
        updateUI(parseInt(e.target.value, 10));
      });
      inputEl?.addEventListener('change', (e) => {
        updateUI(parseInt(e.target.value, 10));
      });

      maxBtn?.addEventListener('click', () => {
        updateUI(stock);
      });

      overlay.style.display = 'flex';
    },

    closeSellConfirmation() {
      this.pendingSale = null;
      const overlay = document.getElementById('farm-shop-confirm-overlay');
      if (overlay) overlay.style.display = 'none';
    },

    executeConfirmedSale() {
      if (!this.pendingSale) return;
      const { itemId, it, qty, totalGold } = this.pendingSale;
      this.closeSellConfirmation();

      this.deductItemStock(itemId, qty);
      this.state.coins = (this.state.coins || 0) + totalGold;
      this.saveState();
      this.renderHUD();
      this.renderShopModal();
      this.playSound('ting');

      if (window.showToast) {
        window.showToast(`💰 Đã bán ${qty} ${it.name}, nhận được +${totalGold} vàng 🪙!`);
      }
    },

    buyFertilizerFromShop() {
      const price = this.getFertilizerPrice();
      if ((this.state.coins || 0) < price) {
        if (window.showToast) window.showToast(`Không đủ vàng! Cần ${price}🪙 để mua phân bón.`);
        return;
      }
      this.state.coins -= price;
      this.state.fertilizer = (this.state.fertilizer || 0) + 1;
      this.saveState();
      this.renderHUD();
      this.renderShopModal();
      this.playSound('pop');
      if (window.showToast) window.showToast(`Đã mua 1 Túi phân bón tăng trưởng (${price}🪙) thành công!`);
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
                ${isLocked ? `Mở ở Cấp ${tree.unlockLevel}` : `Thu hoạch ${tree.icon} + ${tree.rewardXp} XP • ${tree.maxWords} từ`}
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
              Thu hoạch: <b style="color:#34d399;">+${tree.yieldFood} ${tree.icon}</b> + <b style="color:#7dd3fc; display:inline-flex; align-items:center; gap:2px;">+${tree.rewardXp} ${this.getXpIcon(14)}</b>
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
        if (window.wordsManager && Array.isArray(window.wordsManager.words) && window.wordsManager.words.length > 0) {
          this.cachedWordsPool = window.wordsManager.words;
        }
      }
      if (!this.cachedWordsPool || this.cachedWordsPool.length === 0) {
        const fallbacks = [
          { id: 9991, word: 'apple', meaning: 'quả táo', ipa: '/ˈæpl/' },
          { id: 9992, word: 'orange', meaning: 'quả cam', ipa: '/ˈɒrɪndʒ/' },
          { id: 9993, word: 'peach', meaning: 'quả đào', ipa: '/piːtʃ/' },
          { id: 9994, word: 'pear', meaning: 'quả lê', ipa: '/peə(r)/' },
          { id: 9995, word: 'cherry', meaning: 'quả anh đào', ipa: '/ˈtʃeri/' },
          { id: 9996, word: 'banana', meaning: 'quả chuối', ipa: '/bəˈnɑːnə/' },
          { id: 9997, word: 'grape', meaning: 'quả nho', ipa: '/ɡreɪp/' },
          { id: 9998, word: 'mango', meaning: 'quả xoài', ipa: '/ˈmæŋɡəʊ/' },
          { id: 9999, word: 'lemon', meaning: 'quả chanh', ipa: '/ˈlemən/' },
          { id: 10000, word: 'strawberry', meaning: 'quả dâu tây', ipa: '/ˈstrɔːbəri/' },
          { id: 10001, word: 'watermelon', meaning: 'dưa hấu', ipa: '/ˈwɔːtərmelən/' },
          { id: 10002, word: 'coconut', meaning: 'quả dừa', ipa: '/ˈkəʊkənʌt/' },
          { id: 10003, word: 'pineapple', meaning: 'quả dứa', ipa: '/ˈpaɪnæpl/' },
          { id: 10004, word: 'papaya', meaning: 'quả đu đủ', ipa: '/pəˈpaɪə/' },
          { id: 10005, word: 'avocado', meaning: 'quả bơ', ipa: '/ˌævəˈkɑːdəʊ/' }
        ];
        const shuffledFb = this.shuffle([...fallbacks]);
        return shuffledFb.slice(0, Math.min(count, shuffledFb.length));
      }

      // Xáo trộn ngẫu nhiên và lấy count từ
      const shuffled = this.shuffle([...this.cachedWordsPool]);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    confirmFruitTreePlant() {
      if (!this.activeTreePlanting || !this.activeTreePlanting.selectedTree) return;
      const { plotId, selectedTree, chosenWords } = this.activeTreePlanting;
      const tree = FRUIT_TREES[selectedTree];

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
        window.showToast(`Đã trồng cây ${tree.name} thành công!`);
      }
    },

    handleFruitTreeClick(treeType) {
      const def = FRUIT_TREES[treeType];
      if (!def) return;

      const isLocked = (this.state.level || 1) < def.unlockLevel;
      if (isLocked) {
        this.showLockedTreeToast(def);
        return;
      }

      let tree = this.state.treePlots.find(t => t.type === treeType);
      if (!tree) {
        tree = { type: treeType, stage: 1, cooldown: 0, hearts: def.maxHp, words: [] };
        this.state.treePlots.push(tree);
      }

      if ((tree.stage || 1) >= 3) {
        this.harvestFruitTree(treeType);
        return;
      }

      if ((tree.cooldown || 0) > 0) {
        if (this.state.fertilizer > 0) {
          if (confirm(`Cây ${def.name} đang hồi sức (còn ${tree.cooldown}s). Bạn có muốn dùng 1 túi phân bón để tưới ngay không?`)) {
            this.state.fertilizer -= 1;
            tree.cooldown = 0;
            this.saveState();
            this.render();
            this.startFruitTreeQuiz(treeType);
          }
        } else {
          if (window.showToast) {
            window.showToast(`Cây ${def.name} đang hồi sức (${tree.cooldown}s). Mua phân bón trong Shop để tưới ngay!`);
          }
        }
        return;
      }

      // Tưới cây
      this.startFruitTreeQuiz(treeType);
    },

    startFruitTreeQuiz(treeType) {
      let tree = this.state.treePlots.find(t => t.type === treeType);
      const def = FRUIT_TREES[treeType];
      if (!def) return;

      if (!tree) {
        tree = { type: treeType, stage: 1, cooldown: 0, hearts: def.maxHp, words: [] };
        this.state.treePlots.push(tree);
      }

      // Mỗi lần tưới luôn lấy ngẫu nhiên def.maxWords từ vựng trong danh sách từ đã chọn
      const randomWords = this.pickMultipleRandomWords(def.maxWords);
      tree.words = randomWords;
      this.saveState();

      this.activeTreeQuiz = {
        treeType,
        wordIndex: 0,
        words: randomWords,
        firstTryErrors: {}
      };

      this.renderFruitTreeQuizModal();
    },

    fertilizeFruitTree(treeType) {
      if ((this.state.fertilizer || 0) <= 0) {
        if (window.showToast) window.showToast('Bạn không còn phân bón! Hãy mua trong Cửa hàng.');
        return;
      }
      const tree = this.state.treePlots.find(t => t.type === treeType);
      if (!tree) return;
      this.state.fertilizer -= 1;
      tree.hasFertilizer = true;
      this.saveState();
      this.renderFruitTreeQuizModal();
      this.playSound('ting');
      if (window.showToast) window.showToast('🌱 Đã bón phân cho cây! Hoàn thành phiên tưới này cây sẽ lớn +2 giai đoạn.');
    },

    generateDistractors(targetWord, pool) {
      const targetMeaning = (targetWord && targetWord.meaning) ? targetWord.meaning.trim() : '';
      let wordsSource = Array.isArray(pool) && pool.length > 0 ? pool : (window.wordsManager?.words || []);
      const wrongPool = wordsSource.filter(w => w && w.meaning && w.meaning.trim() !== targetMeaning);
      const shuffledWrong = this.shuffle([...wrongPool]).slice(0, 3);

      const options = [
        { meaning: targetMeaning || 'Chính xác', isCorrect: true },
        ...shuffledWrong.map(w => ({ meaning: w.meaning, isCorrect: false }))
      ];

      const fallbackMeanings = ['Trái cây bổ dưỡng', 'Nông sản thơm ngon', 'Vật dụng thu hoạch', 'Hoạt động chăm sóc'];
      let fbIdx = 0;
      while (options.length < 4 && fbIdx < fallbackMeanings.length) {
        options.push({ meaning: fallbackMeanings[fbIdx++], isCorrect: false });
      }

      return this.shuffle(options);
    },

    async renderFruitTreeQuizModal() {
      const sheet = document.getElementById('farm-sheet-fruit-quiz');
      const titleEl = document.getElementById('farm-fruit-quiz-title');
      const statusEl = document.getElementById('farm-fruit-quiz-status');
      const bodyEl = document.getElementById('farm-fruit-quiz-body');
      if (!sheet || !this.activeTreeQuiz) return;

      const q = this.activeTreeQuiz;
      const def = FRUIT_TREES[q.treeType];
      const tree = this.state.treePlots.find(t => t.type === q.treeType) || {};

      if (!q.words || q.words.length === 0) {
        q.words = this.pickMultipleRandomWords(def.maxWords);
        tree.words = q.words;
        this.saveState();
      }

      if (titleEl) {
        titleEl.textContent = `Tưới Cây ${def.name} — Câu ${q.wordIndex + 1}/${q.words.length}`;
      }

      let plantHeartsHtml = '';
      for (let i = 0; i < def.maxHp; i++) {
        plantHeartsHtml += this.getHeartIcon(i < (tree.hearts || def.maxHp), 8.5);
      }

      const fertStatusHtml = tree.hasFertilizer
        ? `<span style="color:#a78bfa; font-size:11px; font-weight:700; margin-left: 8px; display:inline-flex; align-items:center; gap:3px;">${this.getFertilizerBagIcon(14)} Đã bón phân (+2 cấp)</span>`
        : `<button type="button" class="btn btn-secondary" style="padding: 2px 7px; font-size: 11px; border-color: #8b5cf6; color: #a78bfa; margin-left: 8px; display:inline-flex; align-items:center; gap:4px;" onclick="FarmGame.fertilizeFruitTree('${q.treeType}')">${this.getFertilizerBagIcon(14)} Bón phân (${this.state.fertilizer || 0})</button>`;

      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div class="farm-quiz-hearts">Máu: ${plantHeartsHtml} ${fertStatusHtml}</div>
          <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">
            Giai đoạn: ${tree.stage || 1}/3 • Câu ${q.wordIndex + 1}/${q.words.length}
          </span>
        </div>
      `;

      const currentWord = q.words[q.wordIndex] || { word: 'apple', meaning: 'quả táo' };

      // Lấy dạng quiz từ cài đặt riêng cho Khu Cây Ăn Quả (hỗ trợ ngẫu nhiên loại câu hỏi)
      const mode = this.getZoneQuizMode('orchard', tree.stage || 1);

      let quizHtml = '';

      if (mode === 'ai') {
        bodyEl.innerHTML = `
          <div class="farm-quiz-prompt-card" style="padding: 24px 16px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 6px;">⚡</div>
            <div style="font-size: 0.95rem; color: #f59e0b; font-weight: 700;">Groq AI đang tạo câu đố cho Cây ${def.name}...</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Ngữ cảnh cho từ "${currentWord.word}"</div>
          </div>
        `;
        sheet.classList.add('active');

        try {
          const aiRes = await window.api.generateAiSentence(currentWord.word, currentWord.meaning);
          const sentence = aiRes?.data?.sentence || aiRes?.sentence || aiRes?.sentences?.[0]?.sentence;
          if (aiRes && aiRes.success && sentence) {
            const aiData = {
              sentence: sentence,
              hint: aiRes?.data?.hint || aiRes?.hint || aiRes?.sentences?.[0]?.hint || currentWord.meaning,
              provider: aiRes?.provider || aiRes?.data?.provider || 'Groq'
            };
            const providerTag = aiData.provider ? `⚡ ${aiData.provider}` : '🤖 AI';
            quizHtml = `
              <div class="farm-quiz-prompt-card">
                <span style="font-size: 0.8rem; color: #f59e0b; font-weight: 700;">${providerTag}:</span>
                <div class="farm-quiz-question-word" style="font-size: 1.15rem; line-height: 1.5; color: #f1f5f9; margin: 8px 0; font-weight: 600;">
                  "${aiData.sentence}"
                </div>
                ${aiData.hint ? `<div style="font-size: 0.82rem; color: #38bdf8; font-style: italic;">💡 Gợi ý nghĩa: ${aiData.hint}</div>` : ''}
              </div>
              <div style="margin-top: 14px;">
                <input type="text" id="farm-fruit-input" class="form-input" placeholder="Điền từ còn thiếu vào chỗ trống..." autocomplete="off" autocorrect="off" autocapitalize="none" enterkeyhint="go">
              </div>
              <button type="button" class="btn btn-primary" id="farm-fruit-submit-btn" style="margin-top: 14px; width: 100%; min-height: 44px;">Kiểm Tra</button>
            `;
          } else {
            throw new Error('AI generation failed');
          }
        } catch (e) {
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
        }
      } else if (mode === 'listening') {
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
        inputEl.value = '';
        inputEl.focus({ preventScroll: true });

        inputEl.addEventListener('blur', () => {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
        });

        const submitAction = () => {
          const cleanVal = (inputEl.value || '').trim().replace(/\s+/g, ' ').toLowerCase();
          const cleanCorrect = (currentWord.word || '').trim().replace(/\s+/g, ' ').toLowerCase();
          const isCorrect = cleanVal === cleanCorrect;
          this.handleFruitQuizAnswer(isCorrect);
        };

        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            submitAction();
          }
        });
        if (submitBtn) {
          submitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            submitAction();
          });
        }
      } else {
        this.hideQuizKeyboard();
      }

      bodyEl.querySelectorAll('.farm-quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const isCorrect = btn.getAttribute('data-fruit-opt-correct') === 'true';
          btn.classList.add(isCorrect ? 'correct' : 'incorrect');
          bodyEl.querySelectorAll('.farm-quiz-opt-btn').forEach(b => b.disabled = true);
          setTimeout(() => {
            this.handleFruitQuizAnswer(isCorrect);
          }, 320);
        });
      });
    },

    handleFruitQuizAnswer(isCorrect) {
      if (!this.activeTreeQuiz) return;
      const q = this.activeTreeQuiz;
      const def = FRUIT_TREES[q.treeType];
      const tree = this.state.treePlots.find(t => t.type === q.treeType);
      const currentWord = q.words[q.wordIndex];

      if (isCorrect) {
        this.playSound('correct');
        // Tưới cây không tăng EXP, chỉ thu hoạch mới tăng EXP
        q.wordIndex += 1;
        if (q.wordIndex < q.words.length) {
          // Chưa xong đợt tưới: giữ bàn phím mở để gõ từ tiếp theo
          this.renderFruitTreeQuizModal();
        } else {
          // Hoàn thành tưới đủ từ của giai đoạn này: Ẩn ngay bàn phím ảo!
          this.hideQuizKeyboard();

          const growth = tree.hasFertilizer ? 2 : 1;
          tree.hasFertilizer = false;
          tree.stage = Math.min(3, (tree.stage || 1) + growth);
          const sheet = document.getElementById('farm-sheet-fruit-quiz');
          if (sheet) sheet.classList.remove('active');
          this.activeTreeQuiz = null;

          this.playSound('pop');
          this.state.quests.watered = (this.state.quests.watered || 0) + 1;

          if (tree.stage >= 3) {
            tree.stage = 3;
            tree.cooldown = 0;
            if (window.showToast) {
              window.showToast(`🎉 Trái ${def.name} đã chín rộ! Hãy chạm vào cây để thu hoạch!`);
            }
          } else {
            tree.cooldown = def.cooldownSec || 5;
            if (window.showToast) {
              window.showToast(`💧 Cây ${def.name} đã được tưới đủ nước, lớn lên Giai đoạn ${tree.stage}/3!`);
            }
          }

          this.saveState();
          this.render();
        }
      } else {
        this.playSound('wrong');
        q.firstTryErrors[currentWord.id || currentWord.word] = true;
        tree.hearts = Math.max(0, (tree.hearts || def.maxHp) - 1);
        this.saveState();

        if (tree.hearts <= 0) {
          // Hết tim: Ẩn ngay bàn phím ảo
          this.hideQuizKeyboard();

          tree.hearts = def.maxHp;
          tree.cooldown = 5;
          const sheet = document.getElementById('farm-sheet-fruit-quiz');
          if (sheet) sheet.classList.remove('active');
          this.activeTreeQuiz = null;
          this.saveState();
          this.render();
          if (window.showToast) {
            window.showToast(`🥀 Cây ${def.name} đã hết tim do trả lời sai! Hãy thử lại sau 5s.`);
          }
          return;
        }

        this.renderFruitTreeQuizModal();

        if (window.showToast) {
          window.showToast(`Trả lời sai! Cây ${def.name} mất 1 máu (còn ${tree.hearts}/${def.maxHp} ❤️)`);
        }
      }
    },

    harvestFruitTree(treeType) {
      const tree = this.state.treePlots.find(t => t.type === treeType);
      const def = FRUIT_TREES[treeType];
      if (!tree || !def) return;

      const bonusChance = (this.state.level || 1) * 0.05;
      const fruitYield = Math.random() < bonusChance ? 2 : 1;

      if (!this.state.foodStorage) this.state.foodStorage = {};
      this.state.foodStorage[treeType] = (this.state.foodStorage[treeType] || 0) + fruitYield;

      this.gainXp(def.rewardXp);
      this.state.harvestedTodayCount = (this.state.harvestedTodayCount || 0) + 1;
      this.state.quests.harvested = (this.state.quests.harvested || 0) + 1;

      // Cây hồi sinh về giai đoạn 1, chờ cooldown 5s để chu kỳ sau tiếp tục lớn
      tree.stage = 1;
      tree.hearts = def.maxHp;
      tree.cooldown = def.cooldownSec || 5;
      tree.words = this.pickMultipleRandomWords(def.maxWords);

      this.saveState();
      this.render();
      this.playSound('ting');

      this.showHarvestToast({
        word: `Trái ${def.name}`,
        meaning: `Độ hiếm: ${def.rarity}`,
        cropIcon: def.icon,
        cropName: def.name,
        cropYield: fruitYield,
        rewardXp: def.rewardXp
      });
    },

    showLockedTreeToast(def) {
      const missingXp = this.getMissingXpForLevel(def.unlockLevel);
      if (window.showToast) {
        window.showToast(`Cần lên Cấp ${def.unlockLevel} để mở Cây ${def.name} (còn thiếu ${missingXp} XP)!`);
      }
    },

    // =========================================================================
    // CÀI ĐẶT NÔNG TRẠI (SETTINGS MODAL BÊN TRONG GAME)
    // =========================================================================
    async openSettingsModal() {
      const sheet = document.getElementById('farm-sheet-settings');
      if (!sheet) return;

      // Đồng bộ toggle âm thanh
      const soundToggle = document.getElementById('farm-setting-sound-toggle');
      if (soundToggle) {
        soundToggle.checked = this.state.soundEnabled !== false;
      }

      // Đồng bộ radio wordSource
      const radio = sheet.querySelector(`input[name="farm-word-source"][value="${this.settings.wordSource}"]`);
      if (radio) radio.checked = true;

      // Tự động hiển thị danh sách ngày nếu đang lưu nguồn từ là "custom"
      const customWrap = document.getElementById('farm-custom-days-wrap');
      if (customWrap) {
        customWrap.style.display = (this.settings.wordSource === 'custom') ? 'block' : 'none';
      }

      // Kiểm tra trạng thái AI backend
      let aiEnabled = false;
      let aiStatus = null;
      try {
        aiStatus = await window.api.getAiStatus();
        aiEnabled = !!aiStatus?.enabled;
      } catch (e) { }

      // Đồng bộ toggle modes riêng cho 3 vùng: Vườn Nông Sản, Cây Ăn Quả, Khu Chăn Nuôi
      const zones = ['crops', 'orchard', 'poultry'];
      zones.forEach(z => {
        const zConf = (this.settings.zoneModes && this.settings.zoneModes[z]) || this.settings.modes || {};
        const choiceEl = document.getElementById(`farm-setting-${z}-choice`);
        const typingEl = document.getElementById(`farm-setting-${z}-typing`);
        const listeningEl = document.getElementById(`farm-setting-${z}-listening`);
        const aiEl = document.getElementById(`farm-setting-${z}-ai`);
        const randomEl = document.getElementById(`farm-setting-${z}-random`);

        if (choiceEl) choiceEl.checked = !!zConf.choice;
        if (typingEl) typingEl.checked = !!zConf.typing;
        if (listeningEl) listeningEl.checked = !!zConf.listening;
        if (randomEl) randomEl.checked = zConf.randomMode !== false; // Mặc định bật ngẫu nhiên

        if (aiEl) {
          if (aiEnabled) {
            aiEl.disabled = false;
            aiEl.closest('.farm-toggle-item')?.classList.remove('disabled');
            const subText = sheet.querySelector(`.farm-ai-status-${z}`);
            if (subText) {
              const primary = aiStatus.primaryProvider || 'Groq LPU';
              const backups = [aiStatus.backupProvider1, aiStatus.backupProvider2].filter(Boolean).join(' & ');
              const backupText = backups ? ` (Dự phòng: ${backups})` : '';
              subText.textContent = `${primary} sẵn sàng${backupText}`;
            }
            aiEl.checked = !!zConf.ai;
          } else {
            aiEl.checked = false;
            aiEl.disabled = true;
            aiEl.closest('.farm-toggle-item')?.classList.add('disabled');
            const subText = sheet.querySelector(`.farm-ai-status-${z}`);
            if (subText) subText.textContent = 'Cần cấu hình GROQ_API_KEYS trong .env';
          }
        }
      });

      // Tải danh sách ngày nếu chọn chế độ Tuỳ chọn
      await this.renderCustomDaysChecklist();

      // Reset vị trí cuộn về đầu khi mở
      const bodyEl = sheet.querySelector('.farm-sheet-body');
      if (bodyEl) bodyEl.scrollTop = 0;

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
      const zoneNames = {
        crops: 'Vườn Nông Sản',
        orchard: 'Khu Cây Ăn Quả',
        poultry: 'Khu Chăn Nuôi'
      };

      const newZoneModes = {};
      for (const z of ['crops', 'orchard', 'poultry']) {
        const choiceEl = document.getElementById(`farm-setting-${z}-choice`);
        const typingEl = document.getElementById(`farm-setting-${z}-typing`);
        const listeningEl = document.getElementById(`farm-setting-${z}-listening`);
        const aiEl = document.getElementById(`farm-setting-${z}-ai`);
        const randomEl = document.getElementById(`farm-setting-${z}-random`);

        const choice = choiceEl ? choiceEl.checked : true;
        const typing = typingEl ? typingEl.checked : false;
        const listening = listeningEl ? listeningEl.checked : false;
        const ai = aiEl && !aiEl.disabled ? aiEl.checked : false;
        const randomMode = randomEl ? randomEl.checked : true;

        if (!choice && !typing && !listening && !ai) {
          if (window.showToast) window.showToast(`Vui lòng bật ít nhất 1 cách học cho ${zoneNames[z]}!`);
          return;
        }

        newZoneModes[z] = { choice, typing, listening, ai, randomMode };
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
      this.settings.zoneModes = newZoneModes;
      this.settings.modes = {
        choice: newZoneModes.crops.choice || newZoneModes.orchard.choice,
        typing: newZoneModes.crops.typing || newZoneModes.orchard.typing,
        listening: newZoneModes.crops.listening || newZoneModes.orchard.listening,
        ai: newZoneModes.crops.ai || newZoneModes.orchard.ai
      };

      this.saveSettings();

      // Lưu cài đặt âm thanh
      const soundToggle = document.getElementById('farm-setting-sound-toggle');
      if (soundToggle) {
        this.state.soundEnabled = soundToggle.checked;
        this.saveState();
      }

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
                <span class="farm-quest-progress-text" style="display:inline-flex; align-items:center; gap:2px;">Thưởng: +${item.reward}${this.getCoinIcon(14)}</span>
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

      // 1a. Nút Tưới Tất Cả (Chỉ hiện khi có cây đang cần tưới)
      document.getElementById('farm-btn-water-all')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.waterAll();
      });

      // 1b. Chạm ô cây ăn quả (Cây có sẵn trên sân: tưới cây, thu hoạch, xem thông tin)
      document.getElementById('farm-tree-grid')?.addEventListener('click', (e) => {
        const harvestBtn = e.target.closest('[data-harvest-tree], .btn-harvest');
        if (harvestBtn) {
          e.stopPropagation();
          const treeCard = harvestBtn.closest('.farm-tree-card');
          const type = harvestBtn.getAttribute('data-harvest-tree') || treeCard?.getAttribute('data-tree-type');
          if (type) {
            this.harvestFruitTree(type);
            return;
          }
        }

        const waterBtn = e.target.closest('[data-water-tree], .btn-water');
        if (waterBtn) {
          e.stopPropagation();
          const treeCard = waterBtn.closest('.farm-tree-card');
          const type = waterBtn.getAttribute('data-water-tree') || treeCard?.getAttribute('data-tree-type');
          if (type) {
            this.handleFruitTreeClick(type);
            return;
          }
        }

        const treeCard = e.target.closest('.farm-tree-card');
        if (treeCard) {
          const type = treeCard.getAttribute('data-tree-type');
          if (type) {
            this.handleFruitTreeClick(type);
          }
        }
      });

      // 2. Nút trên HUD & Cài đặt
      document.getElementById('farm-btn-close')?.addEventListener('click', () => this.close());
      document.getElementById('farm-btn-settings')?.addEventListener('click', () => this.openSettingsModal());
      document.getElementById('farm-setting-sound-toggle')?.addEventListener('change', (e) => {
        this.state.soundEnabled = e.target.checked;
        this.saveState();
        if (this.state.soundEnabled) this.playSound('pop');
      });

      // Nút đồng bộ ngay & sao lưu trong Cài đặt
      document.getElementById('farm-btn-force-sync')?.addEventListener('click', async () => {
        window.showToast?.('🔄 Đang đồng bộ với máy chủ...');
        await this.fetchCloudState(true);
        await this.pushCloudState();
        window.showToast?.('✅ Đã đồng bộ dữ liệu nông trại!');
      });

      document.getElementById('farm-btn-backup-export')?.addEventListener('click', () => {
        try {
          const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            state: this.state,
            settings: this.settings
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vocabmaster_farm_backup_${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          window.showToast?.('💾 Đã tải file sao lưu nông trại!');
        } catch (err) {
          console.error('Lỗi xuất file backup:', err);
        }
      });

      // Bấm huy hiệu cấp độ hoặc thanh XP mở tooltip Level & XP (2 dòng)
      document.getElementById('farm-hud-level')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLevelTooltip();
      });
      document.getElementById('farm-hud-xp-track')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLevelTooltip();
      });

      // Đóng tooltip khi bấm ra ngoài
      document.addEventListener('click', (e) => {
        const tooltip = document.getElementById('farm-level-tooltip');
        if (tooltip && !tooltip.hasAttribute('hidden')) {
          if (!e.target.closest('#farm-hud-level') && !e.target.closest('#farm-hud-xp-track') && !e.target.closest('#farm-level-tooltip')) {
            tooltip.setAttribute('hidden', '');
          }
        }
      });

      // Bấm chip xu hoặc phân bón trên HUD -> Mở Cửa hàng
      document.getElementById('farm-hud-coins')?.addEventListener('click', () => this.openShopModal());
      document.getElementById('farm-hud-fert')?.addEventListener('click', () => this.openShopModal());

      // Chạm chuồng gà nhặt trứng / cho ăn (8 ô nuôi gà - Cấp 5+)
      document.getElementById('farm-poultry-grid')?.addEventListener('click', (e) => {
        const plotEl = e.target.closest('.farm-chicken-plot');
        if (!plotEl) return;
        const chickenId = parseInt(plotEl.getAttribute('data-chicken-id'), 10);
        this.interactChickenPlot(chickenId);
      });

      // Chạm chuồng bò vắt sữa / cho ăn (6 ô nuôi bò - Cấp 10+)
      document.getElementById('farm-cattle-grid')?.addEventListener('click', (e) => {
        const plotEl = e.target.closest('.farm-cow-plot');
        if (!plotEl) return;
        const cowId = parseInt(plotEl.getAttribute('data-cow-id'), 10);
        this.interactCowPlot(cowId);
      });

      // Xác nhận bán vật phẩm trong Shop
      document.getElementById('farm-shop-confirm-ok')?.addEventListener('click', () => {
        this.executeConfirmedSale();
      });
      document.getElementById('farm-shop-confirm-cancel')?.addEventListener('click', () => {
        this.closeSellConfirmation();
      });

      // 3. Nút dưới thanh đáy
      document.getElementById('farm-btn-quests')?.addEventListener('click', () => this.openQuestsModal());
      document.getElementById('farm-btn-shop')?.addEventListener('click', () => this.openShopModal());

      // 4. Chọn hạt giống nông sản
      const seedStepSelect = document.getElementById('farm-seed-step-select');
      if (seedStepSelect) {
        seedStepSelect.addEventListener('click', (e) => {
          const card = e.target.closest('.farm-seed-card');
          if (card) {
            const crop = card.getAttribute('data-crop');
            if (crop) this.selectSeedType(crop);
          }
        });
      }

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

      // 5. Đóng các sheet khi click nút close hoặc backdrop, đồng thời chống cuộn nền khu vườn
      document.querySelectorAll('.farm-sheet-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            backdrop.classList.remove('active');
          }
        });

        // Cho phép cuộn mượt nội dung sheet/danh sách ngày, chỉ chặn touchmove trên backdrop ngoài thẻ
        backdrop.addEventListener('touchmove', (e) => {
          if (!backdrop.classList.contains('active')) return;
          const scrollable = e.target.closest('.farm-sheet-body, .farm-custom-days-list');
          if (scrollable) return;
          e.preventDefault();
        }, { passive: false });
      });

      document.querySelectorAll('.farm-sheet-btn-close').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('farm-quiz-input')?.blur();
          document.body.classList.remove('keyboard-open');
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
