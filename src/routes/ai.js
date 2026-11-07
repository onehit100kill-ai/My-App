const express = require('express');
const router = express.Router();
const { keyPool, generateSentenceWithGroq } = require('../services/aiService');

/**
 * GET /api/ai/status
 * Kiểm tra xem Groq API key đã được cấu hình hay chưa
 */
router.get('/status', (req, res) => {
  const status = keyPool.getStatus();
  const hasGroq = status.totalKeys > 0;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  res.json({
    success: true,
    enabled: hasGroq || hasGemini || hasOpenRouter,
    primaryProvider: hasGroq ? 'Groq LPU' : (hasGemini ? 'Gemini Flash-Lite' : 'OpenRouter'),
    backupProvider1: hasGemini ? 'Gemini Flash-Lite' : null,
    backupProvider2: hasOpenRouter ? 'OpenRouter Llama 3.3' : null,
    totalGroqKeys: status.totalKeys,
    activeGroqKeys: status.activeKeysCount,
    coolingGroqKeys: status.coolingKeysCount
  });
});

/**
 * POST /api/ai/add-key
 * Thêm API key Groq phụ trực tiếp mà không cần khởi động lại server
 * Body: { key: "gsk_..." }
 */
router.post('/add-key', (req, res) => {
  const { key } = req.body;
  if (!key || !key.startsWith('gsk_')) {
    return res.status(400).json({
      success: false,
      message: 'Key Groq không hợp lệ (cần bắt đầu bằng gsk_).'
    });
  }

  const added = keyPool.addKey(key);
  const status = keyPool.getStatus();

  return res.json({
    success: true,
    message: added ? 'Đã thêm key Groq phụ thành công vào nhóm xoay vòng!' : 'Key này đã tồn tại trong danh sách.',
    totalKeys: status.totalKeys,
    activeKeys: status.activeKeysCount
  });
});

/**
 * POST /api/ai/generate
 * Sinh câu điền từ tiếng Anh bằng Groq LPU (tốc độ siêu nhanh, tự xoay key)
 * Body: { word: "confident", meaning: "tự tin" }
 */
router.post('/generate', async (req, res) => {
  try {
    const { word, meaning } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ vựng cần sinh câu.'
      });
    }

    const result = await generateSentenceWithGroq(word, meaning);

    return res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error('Lỗi trong /api/ai/generate:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
