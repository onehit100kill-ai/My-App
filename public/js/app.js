/**
 * App Entry & Modal Controller
 */
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
        modal.classList.remove('active');
      }
    });
  });

  // Phím tắt ESC để đóng modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });

  // Tải dữ liệu ban đầu
  if (window.treeViewManager) {
    await window.treeViewManager.loadTree(true);
  }
});
