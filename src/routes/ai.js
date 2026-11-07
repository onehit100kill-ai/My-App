const express = require('express');
const router = express.Router();
const { keyPool, generateSentenceWithGroq, generateAiLesson } = require('../services/aiService');

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
 * Sinh bài học AI (Câu điền từ A2 + Đoạn văn bài đọc)
 * Hỗ trợ cả { words: [{ word, meaning }] }, { words: ["word"] } và { word, meaning }
 */
router.post('/generate', async (req, res) => {
  try {
    let words = req.body.words;
    const type = req.body.type || 'both';

    // Tương thích ngược nếu client gửi dạng { word, meaning } đơn lẻ
    if (!words && req.body.word) {
      words = [{ word: req.body.word, meaning: req.body.meaning || '' }];
    }

    // Xử lý chuỗi JSON nếu gửi string
    if (typeof words === 'string') {
      try {
        words = JSON.parse(words);
      } catch (e) {
        words = [{ word: words, meaning: '' }];
      }
    }

    // Chuẩn hoá mảng words
    if (Array.isArray(words)) {
      words = words.map(w => {
        if (typeof w === 'string') return { word: w.trim(), meaning: '' };
        return { word: (w.word || '').trim(), meaning: (w.meaning || '').trim() };
      }).filter(w => w.word.length > 0);
    }

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ vựng cần sinh câu.'
      });
    }

    // 1. Nếu yêu cầu câu đơn lẻ (thường dùng trong Nông trại hoặc quiz 1 từ)
    if (type === 'sentence' || (words.length === 1 && type !== 'passage' && type !== 'both')) {
      const target = words[0];
      const sentRes = await generateSentenceWithGroq(target.word, target.meaning);
      return res.json({
        success: true,
        provider: sentRes.provider,
        model: sentRes.model,
        sentence: sentRes.sentence,
        missingWord: sentRes.missingWord,
        hint: sentRes.hint,
        data: {
          sentence: sentRes.sentence,
          missingWord: sentRes.missingWord,
          hint: sentRes.hint,
          provider: sentRes.provider,
          model: sentRes.model
        },
        sentences: [
          {
            word: sentRes.missingWord,
            sentence: sentRes.sentence,
            answer: sentRes.missingWord,
            hint: sentRes.hint
          }
        ]
      });
    }

    // 2. Sinh bài học đầy đủ (Sentences + Reading Passage cho Phòng học)
    const dayId = req.body.dayId || '';
    const result = await generateAiLesson(words, dayId);

    // Nếu cả Groq, Gemini và OpenRouter đều lỗi hoặc hết lượt -> HTTP 503
    if (result.isHttpError) {
      return res.status(result.status || 503).json(result.payload);
    }

    // Đảm bảo data.sentence luôn có sẵn cho mọi client
    if (result.sentences && result.sentences.length > 0) {
      result.data = {
        sentence: result.sentences[0].sentence,
        missingWord: result.sentences[0].answer || result.sentences[0].word,
        hint: result.sentences[0].hint || result.sentences[0].word,
        provider: result.provider
      };
      result.sentence = result.sentences[0].sentence;
      result.hint = result.sentences[0].hint;
    }

    return res.json(result);

  } catch (err) {
    console.error('Lỗi trong /api/ai/generate:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server xử lý AI.'
    });
  }
});

/**
 * POST /api/ai/sentence
 * Endpoint chuyên biệt sinh 1 câu điền từ ngữ cảnh
 */
router.post('/sentence', async (req, res) => {
  try {
    const word = req.body.word || (Array.isArray(req.body.words) ? req.body.words[0]?.word : '');
    const meaning = req.body.meaning || (Array.isArray(req.body.words) ? req.body.words[0]?.meaning : '');
    if (!word) {
      return res.status(400).json({ success: false, message: 'Thiếu từ vựng' });
    }
    const sentRes = await generateSentenceWithGroq(word, meaning);
    return res.json({
      success: true,
      provider: sentRes.provider,
      model: sentRes.model,
      sentence: sentRes.sentence,
      missingWord: sentRes.missingWord,
      hint: sentRes.hint,
      data: {
        sentence: sentRes.sentence,
        missingWord: sentRes.missingWord,
        hint: sentRes.hint,
        provider: sentRes.provider
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
