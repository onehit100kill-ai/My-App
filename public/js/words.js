/**
 * Quản lý Danh Sách Từ Vựng & Modal Thêm/Sửa Từ (Tích hợp gợi ý từ điển & Google Autocomplete)
 */
class WordsManager {
  constructor() {
    this.words = [];
    this.currentFilter = 'all'; // Hiển thị toàn bộ từ của ngày
    this.lookupDebounceTimer = null;
    this.autocompleteTimer = null;
    this.currentSuggestions = [];
    this.activeSuggestionIndex = -1;
    this.previewAudioObj = null;

    // Quản lý gợi ý nghĩa tiếng Việt dạng Google Suggest
    this.availableMeanings = [];
    this.currentMeaningSuggestions = [];
    this.activeMeaningSuggestionIndex = -1;

    this.bindEvents();
    this.initAutocomplete();
    this.initMeaningAutocomplete();
  }

  bindEvents() {
    // Switch lọc Đã thuộc / Chưa thuộc (nếu còn trên giao diện cũ)
    const filterToggle = document.getElementById('filter-learned-toggle');
    if (filterToggle) {
      filterToggle.addEventListener('change', () => {
        this.currentFilter = filterToggle.checked ? 'learned' : 'all';
        if (window.treeViewManager?.currentDayId) {
          this.loadWords(window.treeViewManager.currentDayId);
        }
      });
    }

    // Nút thêm từ vào ngày hiện tại
    document.getElementById('btn-add-word')?.addEventListener('click', () => {
      if (!window.treeViewManager?.currentDayId) {
        alert('Vui lòng chọn một Ngày học ở thanh bên trái trước khi thêm từ vựng.');
        return;
      }
      this.openWordModal();
    });

    // Form submit thêm/sửa Từ
    document.getElementById('form-word')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleWordSubmit();
    });

    // Bỏ nút tra cứu theo yêu cầu (đã tự động tra và hiện gợi ý khi bấm vào ô định nghĩa)
    /*
    document.getElementById('btn-lookup-dict')?.addEventListener('click', () => {
      const wordInput = document.getElementById('word-english-input');
      const query = wordInput?.value.trim();
      if (query) {
        this.hideAutocomplete();
        this.performDictionaryLookup(query);
      }
    });
    */

    // Nút nghe thử audio trong modal
    document.getElementById('btn-preview-audio')?.addEventListener('click', () => {
      const audioUrl = document.getElementById('word-audio-url').value;
      const word = document.getElementById('word-english-input').value.trim();
      this.playPronunciation(word, audioUrl);
    });
  }

  // =========================================================================
  // GỢI Ý DẠNG LỰA CHỌN KIỂU GOOGLE SEARCH AUTOCOMPLETE
  // =========================================================================
  initAutocomplete() {
    const wordInput = document.getElementById('word-english-input');
    const dropdown = document.getElementById('word-autocomplete-dropdown');
    if (!wordInput || !dropdown) return;

    // Lắng nghe gõ phím để hiển thị gợi ý kiểu Google
    wordInput.addEventListener('input', () => {
      const isEditing = !!document.getElementById('word-id').value;
      const query = wordInput.value.trim();

      clearTimeout(this.autocompleteTimer);
      clearTimeout(this.lookupDebounceTimer);

      if (query.length < 1) {
        this.hideAutocomplete();
        return;
      }

      // Debounce 160ms gọi API gợi ý autocomplete
      this.autocompleteTimer = setTimeout(async () => {
        try {
          const res = await window.api.getWordSuggestions(query);
          if (res.success && res.suggestions && res.suggestions.length > 0) {
            this.currentSuggestions = res.suggestions;
            this.activeSuggestionIndex = -1;
            this.renderAutocompleteDropdown(query, res.suggestions);
          } else {
            this.hideAutocomplete();
          }
        } catch (err) {
          console.warn('Lỗi tải autocomplete:', err);
          this.hideAutocomplete();
        }
      }, 160);

      // Nếu người dùng gõ từ dài và ngừng gõ 700ms thì tự tra cứu chi tiết (khi tạo mới)
      if (!isEditing && query.length >= 3) {
        this.lookupDebounceTimer = setTimeout(() => {
          this.performDictionaryLookup(query);
        }, 750);
      }
    });

    // Hỗ trợ điều hướng bằng bàn phím (Mũi tên lên / xuống / Enter / Esc)
    wordInput.addEventListener('keydown', (e) => {
      if (dropdown.style.display !== 'none' && this.currentSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.currentSuggestions.length;
          this.highlightActiveSuggestion();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.currentSuggestions.length) % this.currentSuggestions.length;
          this.highlightActiveSuggestion();
          return;
        } else if (e.key === 'Enter') {
          if (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < this.currentSuggestions.length) {
            e.preventDefault();
            this.selectAutocompleteWord(this.currentSuggestions[this.activeSuggestionIndex]);
            return;
          }
        } else if (e.key === 'Escape') {
          this.hideAutocomplete();
          return;
        }
      }

      // Enter khi không mở autocomplete: kích hoạt tra cứu
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = wordInput.value.trim();
        if (query) {
          this.hideAutocomplete();
          this.performDictionaryLookup(query);
        }
      }
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) {
        this.hideAutocomplete();
      }
    });
  }

  renderAutocompleteDropdown(query, suggestions) {
    const dropdown = document.getElementById('word-autocomplete-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = suggestions.map((word, idx) => {
      // In đậm phần ký tự trùng với query đang gõ
      let highlighted = this.escapeHtml(word);
      const lowerQuery = query.toLowerCase();
      const lowerWord = word.toLowerCase();
      if (lowerWord.startsWith(lowerQuery)) {
        highlighted = `<strong>${this.escapeHtml(word.slice(0, query.length))}</strong>${this.escapeHtml(word.slice(query.length))}`;
      }

      return `
        <div class="autocomplete-item" data-index="${idx}" data-word="${this.escapeHtml(word)}" onclick="wordsManager.selectAutocompleteWord('${this.escapeJs(word)}')">
          <span class="autocomplete-icon">🔍</span>
          <span class="autocomplete-text">${highlighted}</span>
          <span class="autocomplete-select-hint">Chọn ↵</span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  }

  highlightActiveSuggestion() {
    const dropdown = document.getElementById('word-autocomplete-dropdown');
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, idx) => {
      if (idx === this.activeSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  selectAutocompleteWord(word) {
    const wordInput = document.getElementById('word-english-input');
    if (wordInput) {
      wordInput.value = word;
    }
    this.hideAutocomplete();
    this.performDictionaryLookup(word);
  }

  hideAutocomplete() {
    const dropdown = document.getElementById('word-autocomplete-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }
    this.currentSuggestions = [];
    this.activeSuggestionIndex = -1;
  }

  // =========================================================================
  // GỢI Ý NGHĨA TIẾNG VIỆT DẠNG DROPDOWN GOOGLE SUGGEST (CHỈ DÙNG TIẾNG VIỆT)
  // =========================================================================
  initMeaningAutocomplete() {
    const meaningInput = document.getElementById('word-meaning-input');
    const dropdown = document.getElementById('meaning-autocomplete-dropdown');
    if (!meaningInput || !dropdown) return;

    // Khi người dùng bấm/focus vào ô định nghĩa -> Hiển thị danh sách gợi ý nghĩa tiếng Việt
    const triggerMeaningDropdown = () => {
      const currentVal = meaningInput.value.trim().toLowerCase();
      const englishWord = document.getElementById('word-english-input')?.value.trim();

      // Nếu đã có sẵn danh sách nghĩa từ tra cứu trước đó
      if (this.availableMeanings && this.availableMeanings.length > 0) {
        this.filterAndRenderMeaningDropdown(currentVal);
      } else if (englishWord) {
        // Nếu chưa có nhưng ô tiếng Anh đã có từ -> Tự động tra cứu và hiển thị
        this.performDictionaryLookup(englishWord).then(() => {
          this.filterAndRenderMeaningDropdown(meaningInput.value.trim().toLowerCase());
        });
      }
    };

    meaningInput.addEventListener('focus', triggerMeaningDropdown);
    meaningInput.addEventListener('click', triggerMeaningDropdown);

    // Khi gõ vào ô định nghĩa: lọc danh sách gợi ý theo ký tự người dùng gõ
    meaningInput.addEventListener('input', () => {
      const currentVal = meaningInput.value.trim().toLowerCase();
      if (this.availableMeanings && this.availableMeanings.length > 0) {
        this.filterAndRenderMeaningDropdown(currentVal);
      }
    });

    // Hỗ trợ điều hướng bằng bàn phím (Mũi tên lên / xuống / Enter / Esc)
    meaningInput.addEventListener('keydown', (e) => {
      if (dropdown.style.display !== 'none' && this.currentMeaningSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.activeMeaningSuggestionIndex = (this.activeMeaningSuggestionIndex + 1) % this.currentMeaningSuggestions.length;
          this.highlightActiveMeaningSuggestion();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.activeMeaningSuggestionIndex = (this.activeMeaningSuggestionIndex - 1 + this.currentMeaningSuggestions.length) % this.currentMeaningSuggestions.length;
          this.highlightActiveMeaningSuggestion();
          return;
        } else if (e.key === 'Enter') {
          if (this.activeMeaningSuggestionIndex >= 0 && this.activeMeaningSuggestionIndex < this.currentMeaningSuggestions.length) {
            e.preventDefault();
            this.selectMeaningAutocomplete(this.currentMeaningSuggestions[this.activeMeaningSuggestionIndex]);
            return;
          }
        } else if (e.key === 'Escape') {
          this.hideMeaningAutocomplete();
          return;
        }
      }
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#meaning-autocomplete-dropdown') && e.target !== meaningInput) {
        this.hideMeaningAutocomplete();
      }
    });
  }

  filterAndRenderMeaningDropdown(query = '') {
    const dropdown = document.getElementById('meaning-autocomplete-dropdown');
    if (!dropdown || !this.availableMeanings || this.availableMeanings.length === 0) {
      this.hideMeaningAutocomplete();
      return;
    }

    // Lọc nghĩa tiếng Việt theo ký tự đang gõ nếu có
    let filtered = this.availableMeanings;
    if (query) {
      const matched = this.availableMeanings.filter(m => m.toLowerCase().includes(query));
      if (matched.length > 0) {
        filtered = matched;
      }
    }

    this.currentMeaningSuggestions = filtered;
    this.activeMeaningSuggestionIndex = -1;

    dropdown.innerHTML = filtered.map((meaning, idx) => {
      let highlighted = this.escapeHtml(meaning);
      if (query && meaning.toLowerCase().includes(query)) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlighted = this.escapeHtml(meaning).replace(regex, '<strong>$1</strong>');
      }

      return `
        <div class="autocomplete-item" data-index="${idx}" onclick="wordsManager.selectMeaningAutocomplete('${this.escapeJs(meaning)}')">
          <span class="autocomplete-icon">💡</span>
          <span class="autocomplete-text">${highlighted}</span>
          <span class="autocomplete-select-hint">Chọn ↵</span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  }

  highlightActiveMeaningSuggestion() {
    const dropdown = document.getElementById('meaning-autocomplete-dropdown');
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, idx) => {
      if (idx === this.activeMeaningSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  selectMeaningAutocomplete(meaning) {
    const meaningInput = document.getElementById('word-meaning-input');
    if (meaningInput) {
      meaningInput.value = meaning;
      meaningInput.focus();
    }
    this.hideMeaningAutocomplete();
  }

  hideMeaningAutocomplete() {
    const dropdown = document.getElementById('meaning-autocomplete-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }
    this.currentMeaningSuggestions = [];
    this.activeMeaningSuggestionIndex = -1;
  }

  // Tải danh sách từ của ngày hiện tại
  async loadWords(dayId) {
    try {
      const res = await window.api.getWords(dayId, this.currentFilter);
      if (res.success) {
        this.words = res.data;
        this.render();
      }
    } catch (err) {
      console.error('Lỗi nạp từ:', err);
    }
  }

  // Render bảng từ vựng (Desktop) VÀ Thẻ từ vựng (iPhone 12 Pro Max mobile)
  render() {
    const tbody = document.getElementById('words-tbody');
    const mobileContainer = document.getElementById('words-mobile-container');
    const emptyState = document.getElementById('words-empty-state');
    const table = document.getElementById('words-table');

    if (!this.words || this.words.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (mobileContainer) mobileContainer.innerHTML = '';
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    // Sắp xếp danh sách: Ưu tiên từ chưa thuộc (isLearned: false/undefined) lên trên
    this.words.sort((a, b) => {
      const aLearned = a.isLearned ? 1 : 0;
      const bLearned = b.isLearned ? 1 : 0;
      if (aLearned !== bLearned) {
        return aLearned - bLearned;
      }
      return (a.order || 0) - (b.order || 0);
    });

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    // 1. Render Table View (Desktop & Tablet)
    if (tbody) {
      tbody.innerHTML = this.words.map((w, index) => {
        return `
          <tr data-word-id="${w.id}">
            <td class="word-col-order">${w.order || index + 1}</td>
            <td class="word-col-word">
              <div class="word-english" ondblclick="wordsManager.openWordModal(${w.id})" title="Bấm đúp để sửa từ">
                <span>${this.escapeHtml(w.word)}</span>
                <button class="icon-btn-mini action-edit-trigger" title="Sửa từ" onclick="wordsManager.openWordModal(${w.id})">✏️</button>
                <button class="icon-btn-mini action-delete-trigger" title="Xóa từ" onclick="wordsManager.deleteWord(${w.id})">🗑️</button>
              </div>
              ${w.ipa ? `<div class="word-ipa">${this.escapeHtml(w.ipa)}</div>` : ''}
            </td>
            <td>
              <button type="button" class="btn-audio" title="Nghe phát âm" onclick="wordsManager.playPronunciation('${this.escapeJs(w.word)}', '${w.audioUrl || ''}')">
                🔊
              </button>
            </td>
            <td class="word-col-meaning">
              ${this.escapeHtml(w.meaning)}
            </td>
            ${/* Cột ví dụ được comment lại để ẩn theo yêu cầu:
            <td class="word-col-example">
              ${w.example ? this.escapeHtml(w.example) : '<span style="opacity: 0.4;">—</span>'}
            </td>
            */ ''}
            <td class="word-col-status">
              <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái">
                <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="wordsManager.toggleLearned(${w.id}, this.checked)">
                <span class="ios-slider"></span>
              </label>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Render Card View (Dạng compact cho điện thoại)
    if (mobileContainer) {
      mobileContainer.innerHTML = this.words.map((w) => {
        return `
          <div class="word-card-mobile" data-word-id="${w.id}">
            <div class="word-card-mobile-top">
              <div class="word-card-term-wrap">
                <span class="word-card-word">${this.escapeHtml(w.word)}</span>
                ${w.ipa ? `<span class="word-card-ipa">${this.escapeHtml(w.ipa)}</span>` : ''}
              </div>
              <div class="word-card-actions-wrap">
                <button type="button" class="btn-audio btn-audio-card" title="Phát âm" onclick="wordsManager.playPronunciation('${this.escapeJs(w.word)}', '${w.audioUrl || ''}')">
                  🔊
                </button>
                <button class="icon-btn-mini action-edit-trigger" title="Sửa từ" onclick="wordsManager.openWordModal(${w.id})">✏️</button>
                <button class="icon-btn-mini action-delete-trigger" title="Xóa từ" onclick="wordsManager.deleteWord(${w.id})">🗑️</button>
              </div>
            </div>

            <div class="word-card-mobile-bottom">
              <div class="word-card-meaning-text">${this.escapeHtml(w.meaning)}</div>
              <div class="word-card-switch-wrap">
                <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái">
                  <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="wordsManager.toggleLearned(${w.id}, this.checked)">
                  <span class="ios-slider"></span>
                </label>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Chuyển đổi trạng thái Đã thuộc / Chưa thuộc bằng nút gạt iPhone
  async toggleLearned(wordId, newStatus) {
    try {
      const res = await window.api.toggleWordLearned(wordId);
      if (res.success) {
        // Cập nhật mảng local
        const w = this.words.find(x => x.id === wordId);
        if (w) w.isLearned = res.data.isLearned;

        // Render lại giao diện
        this.render();

        // Cập nhật lại số đếm trên sidebar
        if (window.treeViewManager) {
          window.treeViewManager.loadTree();
        }
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  }

  // Phát âm thanh: ưu tiên audio từ điển, fallback sang Web Speech API chuẩn
  playPronunciation(word, audioUrl) {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => this.speakWordFallback(word));
    } else {
      this.speakWordFallback(word);
    }
  }

  speakWordFallback(word) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      window._currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  // === Modal Thêm / Sửa Từ (Phong cách Quizlet) ===
  openWordModal(wordId = null) {
    const modal = document.getElementById('modal-word');
    const titleEl = document.getElementById('modal-word-title');
    const idInput = document.getElementById('word-id');
    const dayIdInput = document.getElementById('word-day-id');
    const englishInput = document.getElementById('word-english-input');
    const orderInput = document.getElementById('word-order-input');
    const orderGroup = document.getElementById('word-order-group');
    const ipaInput = document.getElementById('word-ipa-input');
    const meaningInput = document.getElementById('word-meaning-input');
    const exampleInput = document.getElementById('word-example-input');
    const audioUrlInput = document.getElementById('word-audio-url');
    const learnedInput = document.getElementById('word-learned-input');
    const learnedRow = document.getElementById('word-learned-row');
    const previewAudioBtn = document.getElementById('btn-preview-audio');
    const meaningsWrap = document.getElementById('suggested-meanings-wrap');
    const definitionsWrap = document.getElementById('suggested-definitions-wrap');
    const examplesWrap = document.getElementById('suggested-examples-wrap');

    this.hideAutocomplete();
    this.hideMeaningAutocomplete();
    this.availableMeanings = [];
    if (meaningsWrap) meaningsWrap.style.display = 'none';
    if (definitionsWrap) definitionsWrap.style.display = 'none';
    if (examplesWrap) examplesWrap.style.display = 'none';

    if (wordId) {
      const w = this.words.find(x => x.id === wordId);
      if (!w) return;

      titleEl.textContent = '✏️ Sửa Từ Vựng';
      idInput.value = w.id;
      dayIdInput.value = w.dayId;
      englishInput.value = w.word;
      orderInput.value = w.order;
      ipaInput.value = w.ipa || '';
      meaningInput.value = w.meaning;
      // Giữ nguyên câu ví dụ đã có trong CSDL (lưu vào input hidden)
      if (exampleInput) exampleInput.value = w.example || '';
      audioUrlInput.value = w.audioUrl || '';
      learnedInput.checked = !!w.isLearned;

      // Khi sửa từ: Cho phép hiển thị STT và nút trạng thái ghi nhớ
      if (orderGroup) orderGroup.style.display = 'block';
      if (learnedRow) learnedRow.style.display = 'flex';
      if (previewAudioBtn) previewAudioBtn.style.display = 'inline-flex';

      // Nạp trước các nghĩa tiếng Việt để khi bấm vào ô định nghĩa sẽ có gợi ý ngay
      this.performDictionaryLookup(w.word);
    } else {
      titleEl.textContent = '✨ Thêm Từ Vựng Mới';
      idInput.value = '';
      dayIdInput.value = window.treeViewManager.currentDayId;
      englishInput.value = '';
      orderInput.value = this.words.length + 1;
      ipaInput.value = '';
      meaningInput.value = '';
      if (exampleInput) exampleInput.value = '';
      audioUrlInput.value = '';
      learnedInput.checked = false;

      // YÊU CẦU 3 & 5:
      // - Ẩn số thứ tự khi tạo từ vì nó tự động tăng
      // - Từ thêm mới sẽ không có nút "nhớ"
      if (orderGroup) orderGroup.style.display = 'none';
      if (learnedRow) learnedRow.style.display = 'none';
      if (previewAudioBtn) previewAudioBtn.style.display = 'none';
    }

    modal.classList.add('active');
    setTimeout(() => englishInput.focus(), 120);
  }

  // Tra cứu từ điển tự động (Lấy IPA, Audio và danh sách gợi ý nghĩa tiếng Việt)
  async performDictionaryLookup(word) {
    if (!word || !word.trim()) return;

    const spinner = document.getElementById('dict-loading-spinner');
    const ipaInput = document.getElementById('word-ipa-input');
    const audioUrlInput = document.getElementById('word-audio-url');
    const previewAudioBtn = document.getElementById('btn-preview-audio');
    const meaningInput = document.getElementById('word-meaning-input');

    if (spinner) spinner.style.display = 'inline';

    try {
      const data = await window.api.lookupDictionary(word.trim());
      if (spinner) spinner.style.display = 'none';

      if (data.success) {
        // 1. Tự động điền phiên âm IPA nếu có
        if (data.ipa && ipaInput) {
          ipaInput.value = data.ipa;
        }

        // 2. Luôn hiển thị nút nghe thử phát âm
        if (audioUrlInput) audioUrlInput.value = data.audioUrl || '';
        if (previewAudioBtn) previewAudioBtn.style.display = 'inline-flex';

        // 3. LƯU DANH SÁCH NGHĨA TIẾNG VIỆT (DÙNG CHO DROPDOWN GỢI Ý GOOGLE SUGGEST)
        // Chỉ dùng nghĩa tiếng Việt, không dùng định nghĩa tiếng Anh
        if (data.suggestedMeanings && data.suggestedMeanings.length > 0) {
          this.availableMeanings = data.suggestedMeanings;
        } else {
          this.availableMeanings = [];
        }

        // Nếu người dùng đang focus/nhấn ở ô định nghĩa thì hiển thị dropdown ngay
        if (document.activeElement === meaningInput && this.availableMeanings.length > 0) {
          this.filterAndRenderMeaningDropdown(meaningInput.value.trim().toLowerCase());
        }

        /*
        // Các phần gợi ý cũ (chips và định nghĩa tiếng Anh) được comment lại theo yêu cầu
        const meaningsWrap = document.getElementById('suggested-meanings-wrap');
        const chipsContainer = document.getElementById('suggested-chips');
        const definitionsWrap = document.getElementById('suggested-definitions-wrap');
        const definitionsContainer = document.getElementById('suggested-definitions');
        */

        /*
        // PHẦN VÍ DỤ MINH HỌA - ĐƯỢC COMMENT LẠI THEO YÊU CẦU ĐỂ ẨN ĐI
        const examplesWrap = document.getElementById('suggested-examples-wrap');
        const examplesContainer = document.getElementById('suggested-examples');
        if (data.examples && data.examples.length > 0) {
          // ...
        }
        */
      }
    } catch (err) {
      if (spinner) spinner.style.display = 'none';
      console.warn('Lỗi tra từ điển:', err);
    }
  }

  selectMeaning(text) {
    const meaningInput = document.getElementById('word-meaning-input');
    if (meaningInput && text) {
      meaningInput.value = text;
      meaningInput.focus();
    }
  }

  /*
  // Comment lại chức năng chọn ví dụ
  selectExample(text) {
    const exampleInput = document.getElementById('word-example-input');
    if (exampleInput && text) {
      exampleInput.value = text;
      exampleInput.focus();
    }
  }
  */

  async handleWordSubmit() {
    const id = document.getElementById('word-id').value;
    const dayId = document.getElementById('word-day-id').value;
    const word = document.getElementById('word-english-input').value.trim();
    const order = document.getElementById('word-order-input').value;
    const ipa = document.getElementById('word-ipa-input').value.trim();
    const meaning = document.getElementById('word-meaning-input').value.trim();
    // Giữ nguyên câu ví dụ nếu đã có trong CSDL (lấy từ input hidden)
    const exampleVal = document.getElementById('word-example-input')?.value;
    const example = (exampleVal && exampleVal.trim()) ? exampleVal.trim() : null;
    const audioUrl = document.getElementById('word-audio-url').value.trim();
    const isLearned = document.getElementById('word-learned-input').checked;

    if (!word || !meaning) return;

    try {
      if (id) {
        await window.api.updateWord(id, { order, word, ipa, meaning, example, audioUrl, isLearned });
      } else {
        await window.api.createWord({ dayId, order, word, ipa, meaning, example, audioUrl, isLearned });
      }

      document.getElementById('modal-word').classList.remove('active');
      await this.loadWords(dayId);

      if (window.treeViewManager) {
        window.treeViewManager.loadTree();
      }
    } catch (err) {
      alert('Lỗi lưu từ vựng: ' + err.message);
    }
  }

  // YÊU CẦU 2: KHI XÓA HIỂN THỊ XÁC NHẬN NẾU NHẤN ĐỒNG Ý THÌ XÓA LUÔN
  deleteWord(wordId) {
    const targetWord = this.words.find(x => x.id === wordId);
    const wordName = targetWord ? `"${targetWord.word}"` : 'từ này';

    window.showConfirmDialog({
      title: 'Xóa Từ Vựng',
      message: `Bạn có chắc chắn muốn xóa từ ${wordName} không? Thao tác này không thể hoàn tác.`,
      confirmText: 'Đồng ý Xóa',
      onConfirm: async () => {
        try {
          await window.api.deleteWord(wordId);
          await this.loadWords(window.treeViewManager.currentDayId);
          if (window.treeViewManager) {
            window.treeViewManager.loadTree();
          }
        } catch (err) {
          alert('Lỗi xóa từ: ' + err.message);
        }
      }
    });
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

window.wordsManager = new WordsManager();
