/**
 * App Entry & Modal Controller
 */

// Hàm hiển thị hộp thoại xác nhận xóa chuẩn iOS (Bấm Đồng ý là xóa luôn)
window.showConfirmDialog = function({
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa mục này không? Thao tác này không thể hoàn tác.',
  confirmText = 'Đồng ý Xóa',
  cancelText = 'Hủy',
  onConfirm
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
        // KHÔNG cho phép đóng phòng học khi nhấn ra ngoài để tránh mất tiến trình đang học!
        if (modal.id === 'modal-study-room') {
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
});

