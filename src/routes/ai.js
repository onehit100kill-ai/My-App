const express = require('express');
const router = express.Router();

/**
 * GET /api/ai/status
 * Kiểm tra xem Gemini API key đã được cấu hình hay chưa
 */
router.get('/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  res.json({
    success: true,
    enabled: hasKey,
    model: model
  });
});

/**
 * POST /api/ai/generate
 * Sinh câu điền từ tiếng Anh bằng Gemini Pro
 * Body: { word: "confident", meaning: "tự tin" }
 */
router.post('/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trong file .env hoặc biến môi trường.'
      });
    }

    const { word, meaning } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ vựng cần sinh câu.'
      });
    }

    const cleanWord = word.trim();
    const cleanMeaning = (meaning || '').trim();

    const promptText = `
You are an expert English language teacher.
Create ONE natural, clear English sentence suitable for an intermediate learner that uses the vocabulary word "${cleanWord}" (Vietnamese meaning: "${cleanMeaning}").
Replace the word "${cleanWord}" (or its inflected form) with "_____" (5 underscores) to create a fill-in-the-blank test question.
Also provide a natural Vietnamese translation of the entire sentence to serve as a hint.

Return strictly a valid JSON object with no markdown formatting and no extra text:
{
  "sentence": "The full sentence with _____ in place of the target word",
  "missingWord": "${cleanWord}",
  "hint": "Bản dịch nghĩa tiếng Việt của cả câu để làm gợi ý"
}
`.trim();

    const candidateModels = Array.from(new Set([
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview'
    ].filter(Boolean)));

    let lastError = null;
    let resultJson = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          lastError = `${model}: ${errText}`;
          continue; // Thử model tiếp theo
        }

        const data = await geminiRes.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawContent) {
          const cleanJsonStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
          resultJson = JSON.parse(cleanJsonStr);
          break; // Thành công!
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!resultJson) {
      return res.status(502).json({
        success: false,
        message: 'Không thể tạo câu đố với Gemini API: ' + lastError
      });
    }

    return res.json({
      success: true,
      data: resultJson
    });

  } catch (err) {
    console.error('Error in /api/ai/generate:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi sinh câu với AI: ' + err.message
    });
  }
});

module.exports = router;

