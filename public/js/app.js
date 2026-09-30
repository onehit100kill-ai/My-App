/**
 * App Entry & Modal Controller
 */

// Toast thông báo thanh lịch
window.showToast = function(message, duration = 2500) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(33, 38, 45, 0.95);
      border: 1px solid var(--border-color, rgba(240, 246, 252, 0.1));
      color: #f0f6fc;
      padding: 12px 22px;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 9999;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      opacity: 0;
      pointer-events: none;
      backdrop-filter: blur(10px);
      text-align: center;
      max-width: 90vw;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
  }, duration);
};

// Hàm hiển thị hộp thoại xác nhận xóa chuẩn iOS (Bấm Đồng ý là xóa luôn)
window.showConfirmDialog = function({
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa mục này không? Thao tác này không thể hoàn tác.',
  confirmText = 'Đồng ý Xóa',
  cancelText = 'Hủy',
  onConfirm,
  onCancel
} = {}) {
  const modal = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const agreeBtn = document.getElementById('confirm-btn-agree');
  const cancelBtn = document.getElementById('confirm-btn-cancel');

  if (!modal) {
    if (confirm(message)) {
      if (typeof onConfirm === 'function') onConfirm();
    }
    return;
  }

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (agreeBtn) agreeBtn.textContent = confirmText;
  if (cancelBtn) cancelBtn.textContent = cancelText;

  // Clone nút để xóa các event listener cũ
  const newAgreeBtn = agreeBtn.cloneNode(true);
  agreeBtn.parentNode.replaceChild(newAgreeBtn, agreeBtn);

  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  const closeModal = () => {
    modal.classList.remove('active');
  };

  newCancelBtn.addEventListener('click', () => {
    closeModal();
    if (typeof onCancel === 'function') {
      try {
        onCancel();
      } catch (err) {
        console.error('Lỗi onCancel:', err);
      }
    }
  });

  newAgreeBtn.addEventListener('click', async () => {
    closeModal();
    if (typeof onConfirm === 'function') {
      try {
        await onConfirm();
      } catch (err) {
        console.error('Lỗi khi thực hiện thao tác xóa:', err);
      }
    }
  });

  modal.classList.add('active');
};

document.addEventListener('DOMContentLoaded', async () => {
  // Lắng nghe sự thay đổi class 'active' trên tất cả các modal để vô hiệu hóa cuộn nền
  const modalObserver = new MutationObserver(() => {
    const anyModalOpen = document.querySelector('.modal-backdrop.active');
    if (anyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  // Đóng modal khi bấm nút close hoặc click bên ngoài
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (targetId) {
        document.getElementById(targetId)?.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        // KHÔNG cho phép đóng phòng học hoặc thẻ thêm từ khi nhấn ra ngoài để tránh mất dữ liệu đang nhập!
        if (modal.id === 'modal-study-room' || modal.id === 'modal-word') {
          return;
        }
        modal.classList.remove('active');
      }
    });
  });

  // Phím tắt ESC để đóng modal (nếu đang ở phòng học thì hỏi xác nhận)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const studyRoom = document.getElementById('modal-study-room');
      if (studyRoom && studyRoom.classList.contains('active')) {
        window.studyManager?.requestExit();
        return;
      }
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });

  // Tải dữ liệu ban đầu
  if (window.treeViewManager) {
    await window.treeViewManager.loadTree(true);
  }

  // Kiểm tra nếu có phiên học dở dang trước đó khi vào lại ứng dụng
  if (window.studyManager) {
    window.studyManager.checkSavedSession();
  }

  // Ngăn chặn cuộn nền khi modal đang mở
  const updateBodyScroll = () => {
    const hasActiveModal = document.querySelectorAll('.modal-backdrop.active').length > 0;
    if (hasActiveModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  };

  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const m of mutations) {
      if (m.target.classList.contains('modal-backdrop') && m.attributeName === 'class') {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) updateBodyScroll();
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  // ================= Global Search Logic =================
  const btnGlobalSearch = document.getElementById('btn-global-search');
  const globalSearchOverlay = document.getElementById('global-search-overlay');
  const globalSearchInput = document.getElementById('global-search-input');
  const btnCloseGlobalSearch = document.getElementById('btn-close-global-search');
  const globalSearchResults = document.getElementById('global-search-results');
  let globalSearchTimeout = null;

  btnGlobalSearch?.addEventListener('click', () => {
    globalSearchOverlay.classList.add('active');
    globalSearchInput.value = '';
    globalSearchResults.innerHTML = '';
    setTimeout(() => globalSearchInput.focus(), 100);
  });

  btnCloseGlobalSearch?.addEventListener('click', () => {
    globalSearchOverlay.classList.remove('active');
  });

  globalSearchInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(globalSearchTimeout);
    
    if (!query) {
      globalSearchResults.innerHTML = '';
      return;
    }

    globalSearchTimeout = setTimeout(async () => {
      try {
        const res = await window.api.searchGlobalWords(query);
        if (res.success && res.data.length > 0) {
          globalSearchResults.innerHTML = res.data.map(word => {
            const sectionTitle = word.day?.section?.title || 'Chưa có phần';
            const dayTitle = word.day?.title || 'Chưa có ngày';
            return `
              <div class="search-result-item" onclick="appNavigateToWord(${word.day?.sectionId}, ${word.dayId}, ${word.id})">
                <div>
                  <div class="search-result-word">${word.word} <span style="font-size: 0.8rem; color: #39c5cf; font-weight: normal; margin-left: 6px;">${word.ipa || ''}</span></div>
                  <div class="search-result-meaning">${word.meaning}</div>
                </div>
                <div class="search-result-path">
                  <span>📁 ${sectionTitle}</span>
                  <span>›</span>
                  <span>📅 ${dayTitle}</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          globalSearchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">Không tìm thấy từ nào phù hợp.</div>';
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  });

  window.appNavigateToWord = (sectionId, dayId, wordId) => {
    if (sectionId && dayId && window.treeViewManager) {
      window.treeViewManager.expandedSections.add(sectionId);
      window.treeViewManager.render();
      window.treeViewManager.selectDay(sectionId, dayId);
    }
    
    globalSearchOverlay.classList.remove('active');

    setTimeout(() => {
      const row = document.querySelector(`tr[data-word-id="${wordId}"]`) || document.querySelector(`.word-card-mobile[data-word-id="${wordId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.transition = 'background-color 0.5s ease';
        row.style.backgroundColor = 'rgba(56, 139, 253, 0.3)';
        setTimeout(() => {
          row.style.backgroundColor = '';
        }, 1500);
      }
    }, 400); // Đợi words render xong
  };

  // Khởi tạo trạng thái ban đầu
  updateBodyScroll();

  // ================= THEME TOGGLE =================
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else {
      document.body.classList.remove('light-theme');
      if (themeIcon) themeIcon.textContent = '🌙';
    }
  };

  const currentTheme = localStorage.getItem('app_theme') || 'dark';
  applyTheme(currentTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('app_theme', newTheme);
    applyTheme(newTheme);
  });

  // ================= INTENSIVE STUDY MODAL =================
  const brandLogo = document.getElementById('brand-logo');
  const modalIntensive = document.getElementById('modal-intensive');
  const intensiveTabs = document.querySelectorAll('.intensive-tab');
  const intensiveTabContents = document.querySelectorAll('.intensive-tab-content');
  const intensiveTbody = document.getElementById('intensive-tbody');
  const unlearnedTbody = document.getElementById('unlearned-tbody');

  
  // Add All Intensive
  const btnAddAllIntensive = document.getElementById('btn-add-all-intensive');
  if (btnAddAllIntensive) {
    btnAddAllIntensive.addEventListener('click', async () => {
      try {
        const unlearnedRes = await window.api.getUnlearnedWords();
        const words = unlearnedRes.data || [];
        const filtered = words.filter(w => !w.isIntensive);
        if (filtered.length === 0) return window.showToast('Không có từ nào để thêm');
        
        // Cần add tất cả - gọi API từng cái
        const confirmMsg = 'Thêm ' + filtered.length + ' từ vào chuyên sâu?';
        if (!confirm(confirmMsg)) return;

        btnAddAllIntensive.disabled = true;
        btnAddAllIntensive.innerText = 'Đang thêm...';
        await Promise.all(filtered.map(w => window.api.toggleWordIntensive(w.id)));
        window.showToast('Đã thêm tất cả vào chuyên sâu!');
        window.loadIntensiveData();
      } catch (err) {
        console.error(err);
        window.showToast('Lỗi khi thêm tất cả');
      } finally {
        if (btnAddAllIntensive) {
          btnAddAllIntensive.disabled = false;
          btnAddAllIntensive.innerText = '➕ Thêm tất cả';
        }
      }
    });
  }

  // Remove All Intensive
  const btnRemoveAllIntensive = document.getElementById('btn-remove-all-intensive');
  if (btnRemoveAllIntensive) {
    btnRemoveAllIntensive.addEventListener('click', async () => {
      try {
        const intensiveRes = await window.api.getIntensiveWords();
        const words = intensiveRes.data || [];
        if (words.length === 0) return window.showToast('Không có từ nào để xóa');

        if (!confirm('Bạn có chắc muốn xóa tất cả ' + words.length + ' từ khỏi chuyên sâu?')) return;
        
        btnRemoveAllIntensive.disabled = true;
        btnRemoveAllIntensive.innerText = 'Đang xóa...';
        await Promise.all(words.map(w => window.api.toggleWordIntensive(w.id)));
        window.showToast('Đã xóa tất cả khỏi chuyên sâu!');
        window.loadIntensiveData();
      } catch (err) {
        console.error(err);
        window.showToast('Lỗi khi xóa tất cả');
      } finally {
        if (btnRemoveAllIntensive) {
          btnRemoveAllIntensive.disabled = false;
          btnRemoveAllIntensive.innerText = '✕ Xóa tất cả';
        }
      }
    });
  }

  brandLogo?.addEventListener('click', () => {
    modalIntensive?.classList.add('active');
    loadIntensiveData();
  });

  intensiveTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      intensiveTabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-secondary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--primary)';
      tab.style.borderBottomColor = 'var(--primary)';
      
      const target = tab.getAttribute('data-tab');
      intensiveTabContents.forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`tab-content-${target}`).style.display = 'flex';
    });
  });

  window.loadIntensiveData = async function() {
    try {
      const intensiveRes = await window.api.getIntensiveWords();
      const unlearnedRes = await window.api.getUnlearnedWords();

      renderIntensiveList(intensiveRes.data || []);
      renderUnlearnedList(unlearnedRes.data || []);
    } catch (err) {
      console.error('Error loading intensive data:', err);
    }
  };

  function renderIntensiveList(words) {
    if (!intensiveTbody) return;
    if (words.length === 0) {
      intensiveTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-muted);">Chưa có từ nào trong danh sách chuyên sâu</td></tr>`;
      return;
    }

    intensiveTbody.innerHTML = words.map(word => `
      <tr>
        <td>
          <div style="font-weight: bold; color: var(--text-primary); font-size: 1.05rem;">${word.word}</div>
          ${word.ipa ? `<div style="font-size: 0.85rem; color: var(--accent-cyan); font-family: monospace;">${word.ipa}</div>` : ''}

        </td>
        <td style="color: var(--text-primary); font-size: 0.95rem;">${word.meaning}</td>
        <td style="text-align: center;">
          <button class="icon-btn-mini btn-remove-intensive" data-id="${word.id}" style="color: #ff6b6b; font-size: 18px;" title="Bỏ khỏi chuyên sâu">✕</button>
        </td>
      </tr>
    `).join('');
  }

  function renderUnlearnedList(words) {
    if (!unlearnedTbody) return;
    // Lọc bỏ những từ đã có trong chuyên sâu (mặc dù backend có thể trả về cả, nhưng ta lọc lại cho chắc)
    const filtered = words.filter(w => !w.isIntensive);

    if (filtered.length === 0) {
      unlearnedTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-muted);">Không có từ chưa thuộc nào để thêm</td></tr>`;
      return;
    }

    unlearnedTbody.innerHTML = filtered.map(word => `
      <tr>
        <td>
          <div style="font-weight: bold; color: var(--text-primary); font-size: 1.05rem;">${word.word}</div>
          ${word.ipa ? `<div style="font-size: 0.85rem; color: var(--accent-cyan); font-family: monospace;">${word.ipa}</div>` : ''}

        </td>
        <td style="color: var(--text-primary); font-size: 0.95rem;">${word.meaning}</td>
        <td style="text-align: center;">
          <button class="icon-btn-mini btn-add-intensive" data-id="${word.id}" style="color: #34c759; font-size: 18px;" title="Thêm vào chuyên sâu">➕</button>
        </td>
      </tr>
    `).join('');
  }

  // Delegate events cho nút Thêm / Bỏ chuyên sâu
  document.addEventListener('click', async (e) => {
    const btnAdd = e.target.closest('.btn-add-intensive');
    if (btnAdd) {
      const id = btnAdd.getAttribute('data-id');
      try {
        await window.api.toggleWordIntensive(id);
        window.loadIntensiveData();
      } catch (err) {
        window.showToast('Lỗi khi thêm từ vào chuyên sâu');
      }
    }

    const btnRemove = e.target.closest('.btn-remove-intensive');
    if (btnRemove) {
      const id = btnRemove.getAttribute('data-id');
      try {
        await window.api.toggleWordIntensive(id);
        window.loadIntensiveData();
      } catch (err) {
        window.showToast('Lỗi khi xóa từ khỏi chuyên sâu');
      }
    }
  });

});
