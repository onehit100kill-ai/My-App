/**
 * Quản lý Danh Sách Từ Vựng & Modal Thêm/Sửa Từ (Tích hợp gợi ý từ điển)
 */
class WordsManager {
  constructor() {
    this.words = [];
    this.currentFilter = 'unlearned'; // 'unlearned' hoặc 'learned'
    this.lookupDebounceTimer = null;
    this.previewAudioObj = null;

    this.bindEvents();
  }

  bindEvents() {
    // Switch lọc Đã thuộc / Chưa thuộc trên toolbar
    const filterToggle = document.getElementById('filter-learned-toggle');
    const labelUnlearned = document.getElementById('label-filter-unlearned');
    const labelLearned = document.getElementById('label-filter-learned');

    if (filterToggle) {
      filterToggle.addEventListener('change', () => {
        this.currentFilter = filterToggle.checked ? 'learned' : 'unlearned';
        if (filterToggle.checked) {
          labelLearned.classList.add('active');
          labelUnlearned.classList.remove('active');
        } else {
          labelUnlearned.classList.add('active');
          labelLearned.classList.remove('active');
        }
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

    // Tra cứu từ điển khi gõ hoặc bấm nút (Chỉ áp dụng khi thêm từ)
    const wordInput = document.getElementById('word-english-input');
    const lookupBtn = document.getElementById('btn-lookup-dict');

    if (wordInput) {
      wordInput.addEventListener('input', () => {
        // Chỉ tự động tra cứu khi đang tạo mới từ
        const isEditing = !!document.getElementById('word-id').value;
        if (isEditing) return;

        clearTimeout(this.lookupDebounceTimer);
        const query = wordInput.value.trim();
        if (query.length >= 2) {
          this.lookupDebounceTimer = setTimeout(() => {
            this.performDictionaryLookup(query);
          }, 600);
        }
      });
    }

    if (lookupBtn) {
      lookupBtn.addEventListener('click', () => {
        const query = wordInput.value.trim();
        if (query) {
          this.performDictionaryLookup(query);
        }
      });
    }

    // Nút nghe thử audio trong modal
    document.getElementById('btn-preview-audio')?.addEventListener('click', () => {
      const audioUrl = document.getElementById('word-audio-url').value;
      const word = document.getElementById('word-english-input').value.trim();
      this.playPronunciation(word, audioUrl);
    });
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

  // Render bảng từ vựng
  render() {
    const tbody = document.getElementById('words-tbody');
    const emptyState = document.getElementById('words-empty-state');
    const table = document.getElementById('words-table');

    if (!this.words || this.words.length === 0) {
      tbody.innerHTML = '';
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = this.words.map((w, index) => {
      return `
        <tr data-word-id="${w.id}">
          <td class="word-col-order">${w.order || index + 1}</td>
          <td class="word-col-word">
            <div class="word-english">${this.escapeHtml(w.word)}</div>
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
          <td class="word-col-example">
            ${w.example ? this.escapeHtml(w.example) : '<span style="opacity: 0.4;">—</span>'}
          </td>
          <td class="word-col-status">
            <!-- Nút gạt iPhone đổi trạng thái thuộc -->
            <label class="ios-switch ios-switch-sm" title="Gạt để chuyển trạng thái Đã thuộc / Chưa thuộc">
              <input type="checkbox" ${w.isLearned ? 'checked' : ''} onchange="wordsManager.toggleLearned(${w.id}, this.checked)">
              <span class="ios-slider"></span>
            </label>
          </td>
          <td class="word-col-actions">
            <button class="icon-btn-mini action-edit-trigger" title="Sửa từ" onclick="wordsManager.openWordModal(${w.id})">✏️</button>
            <button class="icon-btn-mini action-delete-trigger" title="Xóa từ" onclick="wordsManager.deleteWord(${w.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Chuyển đổi trạng thái Đã thuộc / Chưa thuộc bằng nút gạt iPhone
  async toggleLearned(wordId, newStatus) {
    try {
      const res = await window.api.toggleWordLearned(wordId);
      if (res.success) {
        // Cập nhật mảng local
        const w = this.words.find(x => x.id === wordId);
        if (w) w.isLearned = res.data.isLearned;

        // Nếu đang bật bộ lọc thì ẩn dòng từ đó sau hiệu ứng mượt
        const row = document.querySelector(`tr[data-word-id="${wordId}"]`);
        if (row && (this.currentFilter === 'unlearned' && newStatus) || (this.currentFilter === 'learned' && !newStatus)) {
          row.style.opacity = '0.3';
          setTimeout(() => {
            this.words = this.words.filter(x => x.id !== wordId);
            this.render();
          }, 300);
        }

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
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  // === Modal Thêm / Sửa Từ ===
  openWordModal(wordId = null) {
    const modal = document.getElementById('modal-word');
    const titleEl = document.getElementById('modal-word-title');
    const idInput = document.getElementById('word-id');
    const dayIdInput = document.getElementById('word-day-id');
    const englishInput = document.getElementById('word-english-input');
    const orderInput = document.getElementById('word-order-input');
    const ipaInput = document.getElementById('word-ipa-input');
    const meaningInput = document.getElementById('word-meaning-input');
    const exampleInput = document.getElementById('word-example-input');
    const audioUrlInput = document.getElementById('word-audio-url');
    const learnedInput = document.getElementById('word-learned-input');
    const previewAudioBtn = document.getElementById('btn-preview-audio');
    const suggestionBox = document.getElementById('suggestion-box');

    suggestionBox.style.display = 'none';

    if (wordId) {
      const w = this.words.find(x => x.id === wordId);
      if (!w) return;

      titleEl.textContent = '✏ Sửa Từ Vựng';
      idInput.value = w.id;
      dayIdInput.value = w.dayId;
      englishInput.value = w.word;
      orderInput.value = w.order;
      ipaInput.value = w.ipa || '';
      meaningInput.value = w.meaning;
      exampleInput.value = w.example || '';
      audioUrlInput.value = w.audioUrl || '';
      learnedInput.checked = !!w.isLearned;

      previewAudioBtn.style.display = 'inline-flex';
    } else {
      titleEl.textContent = '✨ Thêm Từ Vựng Mới';
      idInput.value = '';
      dayIdInput.value = window.treeViewManager.currentDayId;
      englishInput.value = '';
      orderInput.value = this.words.length + 1;
      ipaInput.value = '';
      meaningInput.value = '';
      exampleInput.value = '';
      audioUrlInput.value = '';
      learnedInput.checked = false;

      previewAudioBtn.style.display = 'none';
    }

    modal.classList.add('active');
    setTimeout(() => englishInput.focus(), 100);
  }

  // Tra cứu gợi ý tự động (Chỉ áp dụng khi thêm từ)
  async performDictionaryLookup(word) {
    const spinner = document.getElementById('dict-loading-spinner');
    const suggestionBox = document.getElementById('suggestion-box');
    const chipsContainer = document.getElementById('suggested-chips');
    const meaningsWrap = document.getElementById('suggested-meanings-wrap');
    const examplesContainer = document.getElementById('suggested-examples');
    const examplesWrap = document.getElementById('suggested-examples-wrap');
    const ipaInput = document.getElementById('word-ipa-input');
    const audioUrlInput = document.getElementById('word-audio-url');
    const previewAudioBtn = document.getElementById('btn-preview-audio');

    suggestionBox.style.display = 'flex';
    spinner.style.display = 'inline';

    try {
      const data = await window.api.lookupDictionary(word);
      spinner.style.display = 'none';

      if (data.success) {
        // Tự động điền phiên âm IPA nếu có
        if (data.ipa) {
          ipaInput.value = data.ipa;
        }

        // Lưu URL audio nếu có
        if (data.audioUrl) {
          audioUrlInput.value = data.audioUrl;
          previewAudioBtn.style.display = 'inline-flex';
        }

        // Hiển thị gợi ý nghĩa tiếng Việt
        if (data.suggestedMeanings && data.suggestedMeanings.length > 0) {
          meaningsWrap.style.display = 'block';
          chipsContainer.innerHTML = data.suggestedMeanings.map(m => `
            <button type="button" class="chip-btn" onclick="wordsManager.selectMeaning('${this.escapeJs(m)}')">
              + ${this.escapeHtml(m)}
            </button>
          `).join('');

          // Nếu ô nghĩa đang trống thì tự điền nghĩa đầu tiên
          const meaningInput = document.getElementById('word-meaning-input');
          if (!meaningInput.value.trim()) {
            meaningInput.value = data.suggestedMeanings[0];
          }
        } else {
          meaningsWrap.style.display = 'none';
        }

        // Hiển thị gợi ý câu ví dụ
        if (data.examples && data.examples.length > 0) {
          examplesWrap.style.display = 'block';
          examplesContainer.innerHTML = data.examples.map(ex => `
            <button type="button" class="example-item-btn" onclick="wordsManager.selectExample('${this.escapeJs(ex)}')">
              💬 "${this.escapeHtml(ex)}"
            </button>
          `).join('');

          // Nếu ô ví dụ đang trống thì tự điền ví dụ đầu tiên
          const exampleInput = document.getElementById('word-example-input');
          if (!exampleInput.value.trim()) {
            exampleInput.value = data.examples[0];
          }
        } else {
          examplesWrap.style.display = 'none';
        }
      }
    } catch (err) {
      spinner.style.display = 'none';
      console.warn('Lỗi tra từ điển:', err);
    }
  }

  selectMeaning(text) {
    const meaningInput = document.getElementById('word-meaning-input');
    meaningInput.value = text;
  }

  selectExample(text) {
    const exampleInput = document.getElementById('word-example-input');
    exampleInput.value = text;
  }

  async handleWordSubmit() {
    const id = document.getElementById('word-id').value;
    const dayId = document.getElementById('word-day-id').value;
    const word = document.getElementById('word-english-input').value.trim();
    const order = document.getElementById('word-order-input').value;
    const ipa = document.getElementById('word-ipa-input').value.trim();
    const meaning = document.getElementById('word-meaning-input').value.trim();
    const example = document.getElementById('word-example-input').value.trim();
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

  async deleteWord(wordId) {
    if (!confirm('Bạn có chắc chắn muốn xóa từ này không?')) return;

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
