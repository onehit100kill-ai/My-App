const express = require('express');
const router = express.Router();
const { Section, Day, Word } = require('../models');

// GET /api/sections - Lấy tất cả các Phần kèm danh sách Ngày (để hiển thị Folder Tree)
router.get('/', async (req, res) => {
  try {
    const sections = await Section.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']],
      include: [
        {
          model: Day,
          as: 'days',
          attributes: ['id', 'dayNumber', 'title', 'order'],
          include: [
            {
              model: Word,
              as: 'words',
              attributes: ['id', 'isLearned']
            }
          ]
        }
      ]
    });

    // Format kết quả gọn gàng kèm số lượng từ
    const result = sections.map(section => {
      const s = section.toJSON();
      s.days = (s.days || []).sort((a, b) => a.dayNumber - b.dayNumber).map(day => {
        const totalWords = day.words ? day.words.length : 0;
        const learnedWords = day.words ? day.words.filter(w => w.isLearned).length : 0;
        delete day.words; // Chỉ giữ số đếm cho treeview
        return {
          ...day,
          totalWords,
          learnedWords,
          unlearnedWords: totalWords - learnedWords
        };
      });
      return s;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/sections - Tạo Phần mới
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề Phần không được để trống' });
    }

    const count = await Section.count();
    const section = await Section.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      order: count + 1
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/sections/:id - Cập nhật Phần
router.put('/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const section = await Section.findByPk(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Phần' });
    }

    if (title && title.trim()) {
      section.title = title.trim();
    }
    if (description !== undefined) {
      section.description = description ? description.trim() : null;
    }
    await section.save();

    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/sections/:id - Xóa Phần
router.delete('/:id', async (req, res) => {
  try {
    const section = await Section.findByPk(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Phần' });
    }

    await section.destroy();
    res.json({ success: true, message: 'Đã xóa Phần thành công' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
