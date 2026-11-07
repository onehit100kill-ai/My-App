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
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', errText);
      return res.status(geminiRes.status).json({
        success: false,
        message: 'Lỗi khi gọi Gemini API: ' + geminiRes.statusText,
        details: errText
      });
    }

    const data = await geminiRes.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON từ kết quả trả về của Gemini
    let resultJson = null;
    try {
      // Loại bỏ markdown code block nếu có
      const cleanJsonStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      resultJson = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.warn('Could not parse Gemini JSON directly, fallback:', parseErr);
      resultJson = {
        sentence: `Please fill in the blank with the word "${cleanWord}": _____`,
        missingWord: cleanWord,
        hint: cleanMeaning
      };
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

