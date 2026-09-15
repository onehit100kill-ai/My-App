const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Word, Day, Section } = require('../models');

// GET /api/words - Lấy danh sách từ theo dayId và trạng thái thuộc
router.get('/', async (req, res) => {
  try {
    const { dayId, status } = req.query;

    const where = {};
    if (dayId) {
      where.dayId = dayId;
    }

    if (status === 'learned') {
      where.isLearned = true;
    } else if (status === 'unlearned') {
      where.isLearned = false;
    }

    const words = await Word.findAll({
      where,
      order: [['order', 'ASC'], ['id', 'ASC']]
    });

    res.json({ success: true, count: words.length, data: words });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/words/by-days - Lấy từ của NHIỀU ngày (cho ôn tập theo phần hoặc chọn nhiều ngày)
router.post('/by-days', async (req, res) => {
  try {
    const { dayIds, status } = req.body;

    if (!Array.isArray(dayIds) || dayIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách ngày (dayIds) không hợp lệ' });
    }

    const where = {
      dayId: {
        [Op.in]: dayIds
      }
    };

    if (status === 'learned') {
      where.isLearned = true;
    } else if (status === 'unlearned') {
      where.isLearned = false;
    }

    const words = await Word.findAll({
      where,
      include: [
        {
          model: Day,
          as: 'day',
          attributes: ['id', 'dayNumber', 'title']
        }
      ],
      order: [['dayId', 'ASC'], ['order', 'ASC'], ['id', 'ASC']]
    });

    res.json({ success: true, count: words.length, data: words });
  } catch (error) {
    console.error('Error fetching words by days:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/words - Thêm từ vựng mới
router.post('/', async (req, res) => {
  try {
    let { dayId, order, word, ipa, meaning, example, audioUrl, isLearned } = req.body;

    if (!dayId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã Ngày (dayId)' });
    }
    if (!word || !word.trim()) {
      return res.status(400).json({ success: false, message: 'Từ tiếng Anh không được để trống' });
    }
    if (!meaning || !meaning.trim()) {
      return res.status(400).json({ success: false, message: 'Nghĩa tiếng Việt không được để trống' });
    }

    // Tự động tính thứ tự nếu chưa có
    if (order === undefined || order === null || isNaN(order)) {
      const wordsInDay = await Word.findAll({ where: { dayId }, attributes: ['order'] });
      const maxOrder = wordsInDay.length > 0 ? Math.max(...wordsInDay.map(w => w.order || 0)) : 0;
      order = maxOrder + 1;
    } else {
      order = parseInt(order, 10);
    }

    const newWord = await Word.create({
      dayId,
      order,
      word: word.trim(),
      ipa: ipa ? ipa.trim() : null,
      meaning: meaning.trim(),
      example: example ? example.trim() : null,
      audioUrl: audioUrl ? audioUrl.trim() : null,
      isLearned: !!isLearned
    });

    res.status(201).json({ success: true, data: newWord });
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/words/:id - Cập nhật từ vựng
router.put('/:id', async (req, res) => {
  try {
    const { order, word, ipa, meaning, example, audioUrl, isLearned } = req.body;
    const existingWord = await Word.findByPk(req.params.id);
    if (!existingWord) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy từ vựng' });
    }

    if (order !== undefined && !isNaN(order)) existingWord.order = parseInt(order, 10);
    if (word && word.trim()) existingWord.word = word.trim();
    if (ipa !== undefined) existingWord.ipa = ipa ? ipa.trim() : null;
    if (meaning && meaning.trim()) existingWord.meaning = meaning.trim();
    if (example !== undefined) existingWord.example = example ? example.trim() : null;
    if (audioUrl !== undefined) existingWord.audioUrl = audioUrl ? audioUrl.trim() : null;
    if (isLearned !== undefined) existingWord.isLearned = !!isLearned;

    await existingWord.save();
    res.json({ success: true, data: existingWord });
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/words/:id/toggle-learned - Đổi nhanh trạng thái Đã thuộc / Chưa thuộc
router.patch('/:id/toggle-learned', async (req, res) => {
  try {
    const word = await Word.findByPk(req.params.id);
    if (!word) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy từ vựng' });
    }

    word.isLearned = !word.isLearned;
    await word.save();

    res.json({
      success: true,
      data: {
        id: word.id,
        isLearned: word.isLearned
      }
    });
  } catch (error) {
    console.error('Error toggling word learned status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/words/:id - Xóa từ vựng
router.delete('/:id', async (req, res) => {
  try {
    const word = await Word.findByPk(req.params.id);
    if (!word) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy từ vựng' });
    }

    await word.destroy();
    res.json({ success: true, message: 'Đã xóa từ vựng thành công' });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
