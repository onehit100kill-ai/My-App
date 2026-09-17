const express = require('express');
const router = express.Router();
const { lookupWord, getAutocompleteSuggestions } = require('../services/dictionaryService');

// GET /api/dictionary/suggest?q=... - Gợi ý từ khi gõ (kiểu Google autocomplete)
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, suggestions: [] });
    }

    const data = await getAutocompleteSuggestions(q);
    res.json(data);
  } catch (error) {
    console.error('Error suggesting words:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dictionary/lookup?word=... - Gợi ý IPA, audio, nghĩa, câu ví dụ khi thêm từ
router.get('/lookup', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word || !word.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập từ tiếng Anh cần tra cứu' });
    }

    const data = await lookupWord(word);
    res.json(data);
  } catch (error) {
    console.error('Error looking up word:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

