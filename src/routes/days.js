const express = require('express');
const router = express.Router();
const { Day, Word, Section } = require('../models');

// GET /api/days/next-number/:sectionId - Lấy số ngày tiếp theo = Ngày lớn nhất + 1
router.get('/next-number/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const days = await Day.findAll({
      where: { sectionId },
      attributes: ['dayNumber']
    });

    let nextDayNumber = 1;
    if (days && days.length > 0) {
      const maxDay = Math.max(...days.map(d => d.dayNumber));
      nextDayNumber = maxDay + 1;
    }

    res.json({
      success: true,
      nextDayNumber,
      defaultTitle: `Ngày ${nextDayNumber}`
    });
  } catch (error) {
    console.error('Error getting next day number:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/days/:id - Lấy chi tiết 1 ngày kèm thông tin Section
router.get('/:id', async (req, res) => {
  try {
    const day = await Day.findByPk(req.params.id, {
      include: [
        { model: Section, as: 'section', attributes: ['id', 'title'] }
      ]
    });

    if (!day) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Ngày' });
    }

    res.json({ success: true, data: day });
  } catch (error) {
    console.error('Error fetching day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/days - Tạo Ngày mới
router.post('/', async (req, res) => {
  try {
    let { sectionId, dayNumber, title } = req.body;

    if (!sectionId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã Phần (sectionId)' });
    }

    const section = await Section.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Phần không tồn tại' });
    }

    // Nếu không truyền dayNumber, tự động lấy max + 1
    if (dayNumber === undefined || dayNumber === null || isNaN(dayNumber)) {
      const days = await Day.findAll({ where: { sectionId }, attributes: ['dayNumber'] });
      const maxDay = days.length > 0 ? Math.max(...days.map(d => d.dayNumber)) : 0;
      dayNumber = maxDay + 1;
    } else {
      dayNumber = parseInt(dayNumber, 10);
    }

    // Nếu không có title, mặc định đặt là "Ngày {dayNumber}"
    if (!title || !title.trim()) {
      title = `Ngày ${dayNumber}`;
    } else {
      title = title.trim();
    }

    const day = await Day.create({
      sectionId,
      dayNumber,
      title,
      order: dayNumber
    });

    res.status(201).json({ success: true, data: day });
  } catch (error) {
    console.error('Error creating day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/days/:id - Cập nhật Ngày (số ngày, tiêu đề)
router.put('/:id', async (req, res) => {
  try {
    const { dayNumber, title } = req.body;
    const day = await Day.findByPk(req.params.id);
    if (!day) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Ngày' });
    }

    if (dayNumber !== undefined && !isNaN(dayNumber)) {
      day.dayNumber = parseInt(dayNumber, 10);
      day.order = day.dayNumber;
    }
    if (title && title.trim()) {
      day.title = title.trim();
    }
    await day.save();

    res.json({ success: true, data: day });
  } catch (error) {
    console.error('Error updating day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/days/:id - Xóa Ngày
router.delete('/:id', async (req, res) => {
  try {
    const day = await Day.findByPk(req.params.id);
    if (!day) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Ngày' });
    }

    await day.destroy();
    res.json({ success: true, message: 'Đã xóa Ngày thành công' });
  } catch (error) {
    console.error('Error deleting day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
