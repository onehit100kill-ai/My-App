const express = require('express');
const router = express.Router();
const { 
  keyPool, 
  generateSentenceWithGroq, 
  generateAiLesson,
  generateFiveSentencesForWord,
  generateSentencesForWordBatch 
} = require('../services/aiService');
const { GameState, Word } = require('../models');

/**
 * GET /api/ai/status
 * Kiểm tra xem Groq API key đã được cấu hình hay chưa
 */
router.get('/status', async (req, res) => {
  let status = keyPool.getStatus();
  if (status.totalKeys === 0 && GameState) {
    await keyPool.syncKeysFromDatabase(GameState);
    status = keyPool.getStatus();
  }

  const cleanGemini = (process.env.GEMINI_API_KEY || '').trim().replace(/^["'`]+|["'`]+$/g, '');
  const cleanOpenRouter = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^["'`]+|["'`]+$/g, '');

  const hasGroq = status.totalKeys > 0;
  const hasGemini = !!(cleanGemini && !cleanGemini.includes('your_gemini'));
  const hasOpenRouter = !!(cleanOpenRouter && !cleanOpenRouter.includes('your_openrouter'));

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
 * Thêm API key Groq phụ trực tiếp mà không cần khởi động lại server và lưu vào DB
 * Body: { key: "gsk_..." }
 */
router.post('/add-key', async (req, res) => {
  let { key } = req.body;
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp key Groq.'
    });
  }

  key = String(key).trim().replace(/^["'`]+|["'`]+$/g, '').trim();

  if (!key.startsWith('gsk_')) {
    return res.status(400).json({
      success: false,
      message: 'Key Groq không hợp lệ (cần bắt đầu bằng gsk_).'
    });
  }

  const added = keyPool.addKey(key);
  if (GameState) {
    await keyPool.saveKeyToDatabase(key, GameState);
  }
  const status = keyPool.getStatus();

  return res.json({
    success: true,
    message: added ? 'Đã thêm key Groq thành công và lưu trữ đồng bộ trên Cloud!' : 'Key này đã tồn tại trong danh sách.',
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
      const cleanTarget = (target.word || '').trim();

      // Kiểm tra CSDL: Lấy ngẫu nhiên 1 trong 5 câu hỏi đã chuẩn bị sẵn
      const dbWord = await Word.findOne({ where: { word: cleanTarget } });
      if (dbWord && Array.isArray(dbWord.aiQuestions) && dbWord.aiQuestions.length > 0) {
        const randQ = dbWord.aiQuestions[Math.floor(Math.random() * dbWord.aiQuestions.length)];
        return res.json({
          success: true,
          provider: 'Database',
          model: 'DB-Stored',
          sentence: randQ.sentence,
          missingWord: randQ.answer || cleanTarget,
          hint: randQ.hint || dbWord.meaning,
          cached: true,
          data: {
            sentence: randQ.sentence,
            missingWord: randQ.answer || cleanTarget,
            hint: randQ.hint || dbWord.meaning,
            provider: 'Database'
          },
          sentences: [
            {
              word: randQ.answer || cleanTarget,
              sentence: randQ.sentence,
              answer: randQ.answer || cleanTarget,
              hint: randQ.hint || dbWord.meaning
            }
          ]
        });
      }

      // Nếu chưa có trong CSDL: Sinh 5 câu và lưu vào CSDL
      let fiveQuestions = await generateFiveSentencesForWord(cleanTarget, target.meaning);
      if (fiveQuestions.length === 0) {
        const sentRes = await generateSentenceWithGroq(cleanTarget, target.meaning);
        fiveQuestions = [{
          sentence: sentRes.sentence,
          answer: sentRes.missingWord || cleanTarget,
          hint: sentRes.hint || target.meaning
        }];
      }

      if (dbWord && fiveQuestions.length > 0) {
        dbWord.aiQuestions = fiveQuestions;
        await dbWord.save();
      }

      const chosen = fiveQuestions[Math.floor(Math.random() * fiveQuestions.length)];
      return res.json({
        success: true,
        provider: 'Groq',
        model: 'openai/gpt-oss-120b',
        sentence: chosen.sentence,
        missingWord: chosen.answer || cleanTarget,
        hint: chosen.hint || target.meaning,
        data: {
          sentence: chosen.sentence,
          missingWord: chosen.answer || cleanTarget,
          hint: chosen.hint || target.meaning,
          provider: 'Groq'
        },
        sentences: [
          {
            word: chosen.answer || cleanTarget,
            sentence: chosen.sentence,
            answer: chosen.answer || cleanTarget,
            hint: chosen.hint || target.meaning
          }
        ]
      });
    }

    // 2. Sinh bài học đầy đủ (Sentences + Reading Passage cho Phòng học)
    // Ưu tiên nạp ngẫu nhiên các câu hỏi đã chuẩn bị sẵn trong CSDL
    const dayId = req.body.dayId || '';
    const preSavedSentences = [];
    const missingWords = [];

    for (const w of words) {
      const cleanW = (w.word || '').trim();
      const dbWord = await Word.findOne({ where: { word: cleanW } });
      if (dbWord && Array.isArray(dbWord.aiQuestions) && dbWord.aiQuestions.length > 0) {
        const randQ = dbWord.aiQuestions[Math.floor(Math.random() * dbWord.aiQuestions.length)];
        preSavedSentences.push({
          word: cleanW,
          sentence: randQ.sentence,
          answer: randQ.answer || cleanW,
          hint: randQ.hint || w.meaning
        });
      } else {
        missingWords.push(w);
      }
    }

    // Nếu có từ chưa có câu hỏi trong CSDL, sinh bổ sung 5 câu và lưu lại
    if (missingWords.length > 0) {
      try {
        const batchGenerated = await generateSentencesForWordBatch(missingWords);
        for (const mw of missingWords) {
          const list = batchGenerated[mw.word] || batchGenerated[mw.word.toLowerCase()];
          if (Array.isArray(list) && list.length > 0) {
            const dbWord = await Word.findOne({ where: { word: mw.word.trim() } });
            if (dbWord) {
              dbWord.aiQuestions = list;
              await dbWord.save();
            }
            const randQ = list[Math.floor(Math.random() * list.length)];
            preSavedSentences.push({
              word: mw.word.trim(),
              sentence: randQ.sentence,
              answer: randQ.answer || mw.word.trim(),
              hint: randQ.hint || mw.meaning
            });
          }
        }
      } catch (e) {
        console.warn('Lỗi sinh bổ sung câu hỏi CSDL:', e.message);
      }
    }

    // Sinh đoạn văn đọc hiểu (Reading Passage)
    const result = await generateAiLesson(words, dayId);

    // Gộp các câu hỏi đã chọn ngẫu nhiên từ CSDL vào bài học
    if (preSavedSentences.length > 0) {
      if (!result.sentences || result.sentences.length === 0) {
        result.sentences = preSavedSentences;
      } else {
        // Thay thế bằng câu hỏi từ CSDL để đảm bảo ngữ pháp và đa dạng
        const mapExisting = new Map(preSavedSentences.map(s => [s.word.toLowerCase(), s]));
        result.sentences = result.sentences.map(s => {
          const fromDb = mapExisting.get((s.word || s.answer || '').toLowerCase());
          return fromDb || s;
        });
      }
      result.success = true;
    }

    // Nếu cả Groq, Gemini và OpenRouter đều lỗi hoặc hết lượt -> HTTP 503
    if (result.isHttpError && preSavedSentences.length === 0) {
      return res.status(result.status || 503).json(result.payload);
    }

    // Đảm bảo data.sentence luôn có sẵn cho mọi client
    if (result.sentences && result.sentences.length > 0) {
      result.data = {
        sentence: result.sentences[0].sentence,
        missingWord: result.sentences[0].answer || result.sentences[0].word,
        hint: result.sentences[0].hint || result.sentences[0].word,
        provider: result.provider || 'Database'
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
 * Ưu tiên lấy ngẫu nhiên 1 trong 5 câu đã lưu trong CSDL.
 * Nếu chưa có, tự động sinh 5 câu chuẩn ngữ pháp, lưu vào CSDL và trả về 1 câu ngẫu nhiên.
 */
router.post('/sentence', async (req, res) => {
  try {
    const rawWord = req.body.word || (Array.isArray(req.body.words) ? req.body.words[0]?.word : '');
    const meaning = req.body.meaning || (Array.isArray(req.body.words) ? req.body.words[0]?.meaning : '');
    const cleanWord = (rawWord || '').trim();
    if (!cleanWord) {
      return res.status(400).json({ success: false, message: 'Thiếu từ vựng' });
    }

    // 1. Kiểm tra trong CSDL: từ này đã có sẵn 5 câu hỏi chưa?
    const dbWord = await Word.findOne({ where: { word: cleanWord } });

    if (dbWord && Array.isArray(dbWord.aiQuestions) && dbWord.aiQuestions.length > 0) {
      // Lấy ngẫu nhiên 1 câu trong 5 câu đã lưu sẵn trong CSDL
      const randIdx = Math.floor(Math.random() * dbWord.aiQuestions.length);
      const chosen = dbWord.aiQuestions[randIdx];
      return res.json({
        success: true,
        provider: 'Database (Pre-saved)',
        model: 'Database Cache',
        sentence: chosen.sentence,
        missingWord: chosen.answer || cleanWord,
        hint: chosen.hint || dbWord.meaning,
        totalQuestions: dbWord.aiQuestions.length,
        data: {
          sentence: chosen.sentence,
          missingWord: chosen.answer || cleanWord,
          hint: chosen.hint || dbWord.meaning,
          provider: 'Database'
        }
      });
    }

    // 2. Nếu chưa có: sinh ngay 5 câu hỏi chuẩn ngữ pháp và lưu vào CSDL
    let generatedList = await generateFiveSentencesForWord(cleanWord, meaning || (dbWord ? dbWord.meaning : ''));
    if (generatedList.length === 0) {
      const single = await generateSentenceWithGroq(cleanWord, meaning);
      generatedList = [{
        sentence: single.sentence,
        answer: single.missingWord || cleanWord,
        hint: single.hint || meaning
      }];
    }

    if (dbWord && generatedList.length > 0) {
      dbWord.aiQuestions = generatedList;
      await dbWord.save();
    }

    const chosen = generatedList[Math.floor(Math.random() * generatedList.length)];
    return res.json({
      success: true,
      provider: 'Groq AI (Saved to DB)',
      model: 'Groq LPU',
      sentence: chosen.sentence,
      missingWord: chosen.answer || cleanWord,
      hint: chosen.hint || meaning,
      totalQuestions: generatedList.length,
      data: {
        sentence: chosen.sentence,
        missingWord: chosen.answer || cleanWord,
        hint: chosen.hint || meaning,
        provider: 'Groq AI'
      }
    });

  } catch (err) {
    console.error('Lỗi trong /api/ai/sentence:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/ai/pregenerate
 * Quản trị / Tiến trình: Chuẩn bị trước 5 câu hỏi cho danh sách từ chưa có câu hỏi
 * Body: { limit: 10 }
 */
router.post('/pregenerate', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.body.limit || 10, 10)));
    const allWords = await Word.findAll({ order: [['id', 'ASC']] });
    const needsPrep = allWords.filter(w => !Array.isArray(w.aiQuestions) || w.aiQuestions.length < 5);

    const targetWords = needsPrep.slice(0, limit);
    if (targetWords.length === 0) {
      return res.json({
        success: true,
        message: 'Tất cả các từ trong CSDL đã có đủ 5 câu hỏi!',
        processedCount: 0,
        remainingCount: 0
      });
    }

    // Xử lý theo từng nhóm 5 từ
    let successCount = 0;
    const batchSize = 5;
    for (let i = 0; i < targetWords.length; i += batchSize) {
      const chunk = targetWords.slice(i, i + batchSize);
      const batchRes = await generateSentencesForWordBatch(chunk.map(w => ({ word: w.word, meaning: w.meaning })));

      for (const w of chunk) {
        const found = batchRes[w.word] || batchRes[w.word.toLowerCase()];
        if (Array.isArray(found) && found.length > 0) {
          w.aiQuestions = found;
          await w.save();
          successCount++;
        }
      }
    }

    const remaining = needsPrep.length - successCount;
    return res.json({
      success: true,
      processedCount: successCount,
      remainingCount: Math.max(0, remaining),
      totalWords: allWords.length
    });
  } catch (err) {
    console.error('Lỗi trong /api/ai/pregenerate:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
