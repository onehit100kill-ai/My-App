/**
 * Quản lý Cây Thư Mục Phần & Ngày (Folder Tree View)
 */
class TreeViewManager {
  constructor() {
    this.treeContainer = document.getElementById('tree-container');
    this.sections = [];
    this.currentSectionId = null;
    this.currentDayId = null;
    this.expandedSections = new Set(); // Lưu trạng thái các phần đang mở
    this.isEditMode = false;
    this.isDeleteMode = false;

    this.bindEvents();
  }

  bindEvents() {
    // Nút thêm phần
    document.getElementById('btn-add-section')?.addEventListener('click', () => {
      this.openSectionModal();
    });
    document.getElementById('btn-add-section-top')?.addEventListener('click', () => {
      this.openSectionModal();
    });

    // Nút bật/tắt chế độ SỬA
    document.getElementById('btn-mode-edit')?.addEventListener('click', () => {
      this.toggleEditMode();
    });

    // Nút bật/tắt chế độ XÓA
    document.getElementById('btn-mode-delete')?.addEventListener('click', () => {
      this.toggleDeleteMode();
    });

    // Form submit thêm/sửa Phần
    document.getElementById('form-section')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSectionSubmit();
    });

    // Form submit thêm/sửa Ngày
    document.getElementById('form-day')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleDaySubmit();
    });

    // Nút thêm ngày từ thanh toolbar chính
    document.getElementById('btn-add-day')?.addEventListener('click', () => {
      if (!this.currentSectionId) {
        alert('Vui lòng tạo hoặc chọn một Phần trước khi thêm Ngày.');
        return;
      }
      this.openDayModal(this.currentSectionId);
    });

    // Mobile Sidebar Drawer Controller
    const mobileMenuBtn = document.getElementById('btn-toggle-sidebar-mobile');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.querySelector('.app-sidebar');

    mobileMenuBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('mobile-open');
      backdrop?.classList.toggle('active');
    });

    backdrop?.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
      backdrop?.classList.remove('active');
    });
  }

  // Bật/tắt chế độ Sửa (hiển thị bút chì ✏️ bên cạnh Phần, Ngày, Từ)
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const btn = document.getElementById('btn-mode-edit');
    if (this.isEditMode) {
      document.body.classList.add('mode-edit');
      btn?.classList.add('active-mode');
      // Nếu đang bật mode xóa thì tắt
      if (this.isDeleteMode) this.toggleDeleteMode();
    } else {
      document.body.classList.remove('mode-edit');
      btn?.classList.remove('active-mode');
    }
  }

  // Bật/tắt chế độ Xóa (hiển thị thùng rác 🗑️ bên cạnh Phần, Ngày, Từ)
  toggleDeleteMode() {
    this.isDeleteMode = !this.isDeleteMode;
    const btn = document.getElementById('btn-mode-delete');
    if (this.isDeleteMode) {
      document.body.classList.add('mode-delete');
      btn?.classList.add('active-delete-mode');
      // Nếu đang bật mode sửa thì tắt
      if (this.isEditMode) this.toggleEditMode();
    } else {
      document.body.classList.remove('mode-delete');
      btn?.classList.remove('active-delete-mode');
    }
  }

  // Tải lại toàn bộ cây danh mục
  async loadTree(selectFirst = false) {
    try {
      const res = await window.api.getSections();
      if (res.success) {
        this.sections = res.data;
        this.render();

        if (this.sections.length > 0) {
          // Mặc định mở phần đầu tiên nếu chưa mở phần nào
          if (this.expandedSections.size === 0) {
            this.expandedSections.add(this.sections[0].id);
          }

          if (selectFirst || !this.currentDayId) {
            // Tìm ngày đầu tiên để chọn
            const firstSecWithDays = this.sections.find(s => s.days && s.days.length > 0);
            if (firstSecWithDays && firstSecWithDays.days.length > 0) {
              const firstDay = firstSecWithDays.days[0];
              this.selectDay(firstSecWithDays.id, firstDay.id);
            } else {
              this.currentSectionId = this.sections[0].id;
              this.updateBreadcrumb(this.sections[0].title, 'Chưa có ngày');
            }
          } else {
            // Giữ nguyên ngày đang chọn nếu có
            this.highlightActiveDay();
          }
        } else {
          this.treeContainer.innerHTML = `
            <div class="empty-state" style="padding: 24px 10px;">
              <div class="empty-icon">📁</div>
              <div class="empty-title" style="font-size: 1rem;">Chưa có Phần nào</div>
              <div class="empty-desc" style="font-size: 0.8rem;">Hãy bấm nút "+" ở trên để tạo Phần học đầu tiên!</div>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  }

  // Render HTML danh sách Phần và Ngày
  render() {
    if (!this.sections || this.sections.length === 0) return;

    let html = '';
    for (const sec of this.sections) {
      const isExpanded = this.expandedSections.has(sec.id);
      const daysCount = sec.days ? sec.days.length : 0;

      html += `
        <div class="tree-section ${isExpanded ? 'expanded' : ''}" data-section-id="${sec.id}">
          <div class="tree-section-header" onclick="treeViewManager.toggleSection(${sec.id})">
            <div class="tree-section-title-wrap">
              <span class="chevron-icon">▶</span>
              <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
              <span class="tree-section-title" title="${this.escapeHtml(sec.title)}">${this.escapeHtml(sec.title)}</span>
            </div>
            
            <div class="tree-actions-wrap" onclick="event.stopPropagation()">
              <!-- Ở trạng thái mặc định: Hiển thị nút thêm ngày và ôn tập phần này -->
              <button class="section-action-btn" title="Thêm Ngày vào phần này" onclick="treeViewManager.openDayModal(${sec.id})">
                + Ngày
              </button>
              <button class="section-action-btn btn-review-section" title="Ôn tập các ngày trong phần này" onclick="studyManager.openSectionStudyModal(${sec.id})">
                🎯 Ôn tập
              </button>

              <!-- Ký hiệu Sửa (chỉ hiện khi nhấn nút Sửa) -->
              <button class="icon-btn-mini action-edit-trigger" title="Sửa Phần" onclick="treeViewManager.openSectionModal(${sec.id})">
                ✏️
              </button>

              <!-- Ký hiệu Xóa (chỉ hiện khi nhấn nút Xóa) -->
              <button class="icon-btn-mini action-delete-trigger" title="Xóa Phần" onclick="treeViewManager.deleteSection(${sec.id})">
                🗑️
              </button>
            </div>
          </div>

          <div class="tree-days-list">
            ${daysCount === 0 ? `
              <div style="font-size: 0.78rem; color: var(--text-muted); padding: 6px 10px;">
                Chưa có ngày. <a href="javascript:void(0)" style="color: var(--primary);" onclick="treeViewManager.openDayModal(${sec.id})">+ Thêm ngày</a>
              </div>
            ` : sec.days.map(day => `
              <div class="tree-day-item ${this.currentDayId === day.id ? 'active' : ''}" 
                   data-day-id="${day.id}" 
                   onclick="treeViewManager.selectDay(${sec.id}, ${day.id})">
                <div class="day-item-content">
                  <span class="calendar-icon">📅</span>
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(day.title)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span class="day-badge" title="${day.totalWords} từ (${day.learnedWords} đã thuộc)">
                    ${day.totalWords}
                  </span>
                  <!-- Ký hiệu Sửa Ngày (chỉ hiện khi bật Sửa) -->
                  <button class="icon-btn-mini action-edit-trigger" style="width: 22px; height: 22px; font-size: 12px;" title="Sửa Ngày" onclick="event.stopPropagation(); treeViewManager.openEditDayModal(${day.id})">✏️</button>
                  <!-- Ký hiệu Xóa Ngày (chỉ hiện khi bật Xóa) -->
                  <button class="icon-btn-mini action-delete-trigger" style="width: 22px; height: 22px; font-size: 12px;" title="Xóa Ngày" onclick="event.stopPropagation(); treeViewManager.deleteDay(${day.id})">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.treeContainer.innerHTML = html;
  }

  // Đóng / Mở thư mục Phần
  toggleSection(sectionId) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
    this.render();
  }

  // Chọn ngày học và hiển thị từ vựng
  selectDay(sectionId, dayId) {
    this.currentSectionId = sectionId;
    this.currentDayId = dayId;

    const section = this.sections.find(s => s.id === sectionId);
    const day = section?.days?.find(d => d.id === dayId);

    if (section && day) {
      this.updateBreadcrumb(section.title, day.title);
    }

    this.highlightActiveDay();

    // Tự động đóng sidebar drawer trên mobile sau khi chọn ngày
    document.querySelector('.app-sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-backdrop')?.classList.remove('active');

    // Gọi WordsManager để nạp từ của ngày này
    if (window.wordsManager) {
      window.wordsManager.loadWords(dayId);
    }
  }

  highlightActiveDay() {
    document.querySelectorAll('.tree-day-item').forEach(el => {
      const id = parseInt(el.getAttribute('data-day-id'), 10);
      if (id === this.currentDayId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  updateBreadcrumb(sectionTitle, dayTitle) {
    const breadcrumb = document.getElementById('current-breadcrumb');
    const heading = document.getElementById('current-day-heading');
    if (breadcrumb) {
      breadcrumb.innerHTML = `<span>${this.escapeHtml(sectionTitle)}</span> <span>›</span> <span>${this.escapeHtml(dayTitle)}</span>`;
    }
    if (heading) {
      heading.textContent = dayTitle;
    }
  }

  // === Xử lý Modal Phần ===
  openSectionModal(sectionId = null) {
    const modal = document.getElementById('modal-section');
    const titleEl = document.getElementById('modal-section-title');
    const idInput = document.getElementById('section-id');
    const titleInput = document.getElementById('section-title-input');
    const descInput = document.getElementById('section-desc-input');

    if (sectionId) {
      const sec = this.sections.find(s => s.id === sectionId);
      if (!sec) return;
      titleEl.textContent = '✏ Sửa Tên Phần';
      idInput.value = sec.id;
      titleInput.value = sec.title;
      descInput.value = sec.description || '';
    } else {
      titleEl.textContent = '📁 Thêm Phần Mới';
      idInput.value = '';
      titleInput.value = '';
      descInput.value = '';
    }

    modal.classList.add('active');
    setTimeout(() => titleInput.focus(), 100);
  }

  async handleSectionSubmit() {
    const id = document.getElementById('section-id').value;
    const title = document.getElementById('section-title-input').value.trim();
    const description = document.getElementById('section-desc-input').value.trim();

    if (!title) return;

    try {
      if (id) {
        await window.api.updateSection(id, { title, description });
      } else {
        const res = await window.api.createSection({ title, description });
        if (res.success) {
          this.expandedSections.add(res.data.id);
        }
      }
      document.getElementById('modal-section').classList.remove('active');
      await this.loadTree();
    } catch (err) {
      alert('Lỗi lưu phần: ' + err.message);
    }
  }

  deleteSection(sectionId) {
    const sec = this.sections.find(s => s.id === sectionId);
    if (!sec) return;

    window.showConfirmDialog({
      title: 'Xóa Phần Học',
      message: `Bạn có chắc chắn muốn xóa "${sec.title}" cùng tất cả các ngày và từ vựng bên trong không?`,
      confirmText: 'Đồng ý Xóa',
      onConfirm: async () => {
        try {
          await window.api.deleteSection(sectionId);
          if (this.currentSectionId === sectionId) {
            this.currentSectionId = null;
            this.currentDayId = null;
          }
          await this.loadTree(true);
        } catch (err) {
          alert('Lỗi xóa phần: ' + err.message);
        }
      }
    });
  }

  // === Xử lý Modal Ngày (Tự động tính ngày lớn nhất + 1) ===
  async openDayModal(sectionId) {
    const modal = document.getElementById('modal-day');
    const titleEl = document.getElementById('modal-day-title');
    const idInput = document.getElementById('day-id');
    const secInput = document.getElementById('day-section-id');
    const numInput = document.getElementById('day-number-input');
    const dayTitleInput = document.getElementById('day-title-input');
    const secSelect = document.getElementById('day-section-select');

    titleEl.textContent = '📅 Thêm Ngày Mới';
    idInput.value = '';
    secInput.value = sectionId;

    // Render danh sách section vào select
    secSelect.innerHTML = this.sections.map(s => 
      `<option value="${s.id}" ${s.id === sectionId ? 'selected' : ''}>${this.escapeHtml(s.title)}</option>`
    ).join('');

    // Lấy số ngày lớn nhất + 1 từ Backend
    try {
      const res = await window.api.getNextDayNumber(sectionId);
      if (res.success) {
        numInput.value = res.nextDayNumber;
        dayTitleInput.value = res.defaultTitle;
      } else {
        numInput.value = 1;
        dayTitleInput.value = 'Ngày 1';
      }
    } catch {
      numInput.value = 1;
      dayTitleInput.value = 'Ngày 1';
    }

    // Khi người dùng đổi số ngày thì gợi ý tự động đổi title nếu chưa nhập custom
    numInput.oninput = () => {
      dayTitleInput.value = `Ngày ${numInput.value}`;
    };

    modal.classList.add('active');
    setTimeout(() => dayTitleInput.focus(), 100);
  }

  async openEditDayModal(dayId) {
    const modal = document.getElementById('modal-day');
    const titleEl = document.getElementById('modal-day-title');
    const idInput = document.getElementById('day-id');
    const secInput = document.getElementById('day-section-id');
    const numInput = document.getElementById('day-number-input');
    const dayTitleInput = document.getElementById('day-title-input');
    const secSelect = document.getElementById('day-section-select');

    let targetDay = null;
    let targetSec = null;
    for (const sec of this.sections) {
      const d = sec.days?.find(x => x.id === dayId);
      if (d) {
        targetDay = d;
        targetSec = sec;
        break;
      }
    }
    if (!targetDay) return;

    titleEl.textContent = '✏ Sửa Thông Tin Ngày';
    idInput.value = targetDay.id;
    secInput.value = targetSec.id;
    numInput.value = targetDay.dayNumber;
    dayTitleInput.value = targetDay.title;

    secSelect.innerHTML = `<option value="${targetSec.id}" selected>${this.escapeHtml(targetSec.title)}</option>`;
    numInput.oninput = null;

    modal.classList.add('active');
  }

  async handleDaySubmit() {
    const id = document.getElementById('day-id').value;
    const sectionId = document.getElementById('day-section-id').value;
    const dayNumber = document.getElementById('day-number-input').value;
    const title = document.getElementById('day-title-input').value.trim();

    if (!title || !dayNumber) return;

    try {
      if (id) {
        await window.api.updateDay(id, { dayNumber, title });
      } else {
        const res = await window.api.createDay({ sectionId, dayNumber, title });
        if (res.success) {
          this.currentDayId = res.data.id;
        }
      }
      this.expandedSections.add(parseInt(sectionId, 10));
      document.getElementById('modal-day').classList.remove('active');
      await this.loadTree();
      if (this.currentDayId) {
        this.selectDay(parseInt(sectionId, 10), this.currentDayId);
      }
    } catch (err) {
      alert('Lỗi lưu ngày: ' + err.message);
    }
  }

  deleteDay(dayId) {
    window.showConfirmDialog({
      title: 'Xóa Ngày Học',
      message: 'Bạn có chắc chắn muốn xóa ngày này và toàn bộ từ vựng trong ngày không?',
      confirmText: 'Đồng ý Xóa',
      onConfirm: async () => {
        try {
          await window.api.deleteDay(dayId);
          if (this.currentDayId === dayId) {
            this.currentDayId = null;
          }
          await this.loadTree(true);
        } catch (err) {
          alert('Lỗi xóa ngày: ' + err.message);
        }
      }
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.treeViewManager = new TreeViewManager();
