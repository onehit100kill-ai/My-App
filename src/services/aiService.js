/**
 * AI Service: Quản lý Groq API với cơ chế xoay vòng Key (Key Pool Rotation)
 * Tự động chuyển key khác và đưa key hết token vào cooldown 30 phút.
 * Tự động fallback sang các model Groq khác hoặc Gemini nếu cần.
 */

class GroqKeyPool {
  constructor() {
    this.keys = [];
    this.keyCooldowns = new Map(); // key -> timestamp hết hạn cooldown
    this.currentIndex = 0;
    this.defaultCooldownMs = 30 * 60 * 1000; // 30 phút

    this.reloadKeys();
  }

  // Tải danh sách key từ biến môi trường
  reloadKeys() {
    const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    const parsed = rawKeys
      .split(/[,;\n\s]+/)
      .map(k => k.trim())
      .filter(k => k.startsWith('gsk_'));

    // Giữ lại các key mới không bị trùng
    for (const k of parsed) {
      if (!this.keys.includes(k)) {
        this.keys.push(k);
      }
    }
  }

  // Thêm key trực tiếp trong lúc app đang chạy
  addKey(key) {
    const cleanKey = (key || '').trim();
    if (cleanKey.startsWith('gsk_') && !this.keys.includes(cleanKey)) {
      this.keys.push(cleanKey);
      this.keyCooldowns.delete(cleanKey); // Reset cooldown nếu add lại
      return true;
    }
    return false;
  }

  // Lấy key đang sẵn sàng (chưa bị hết token hoặc đã qua 30 phút)
  getAvailableKey() {
    this.reloadKeys();
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const totalKeys = this.keys.length;

    // Duyệt vòng quanh danh sách key bắt đầu từ currentIndex
    for (let i = 0; i < totalKeys; i++) {
      const idx = (this.currentIndex + i) % totalKeys;
      const key = this.keys[idx];
      const cooldownUntil = this.keyCooldowns.get(key) || 0;

      if (now >= cooldownUntil) {
        this.currentIndex = (idx + 1) % totalKeys;
        return key;
      }
    }

    // Nếu tất cả key đều đang trong 30 phút cooldown, tìm key có thời gian chờ ngắn nhất
    let earliestKey = this.keys[0];
    let earliestTime = Infinity;
    for (const key of this.keys) {
      const time = this.keyCooldowns.get(key) || 0;
      if (time < earliestTime) {
        earliestTime = time;
        earliestKey = key;
      }
    }
    return earliestKey;
  }

  // Đánh dấu key bị hết token -> Cooldown 30 phút
  markExhausted(key, retryAfterSeconds = null) {
    const cooldownMs = retryAfterSeconds 
      ? Math.max(retryAfterSeconds * 1000, 60 * 1000) 
      : this.defaultCooldownMs;

    const until = Date.now() + cooldownMs;
    this.keyCooldowns.set(key, until);
    const maskedKey = key.substring(0, 10) + '...' + key.substring(key.length - 4);
    const mins = Math.round(cooldownMs / 60000);
    console.warn(`[Groq AI] Key ${maskedKey} đã hết token/rate limit. Đưa vào trạng thái chờ ${mins} phút. Chuyển sang key tiếp theo.`);
  }

  // Thống kê trạng thái key
  getStatus() {
    this.reloadKeys();
    const now = Date.now();
    const activeKeys = this.keys.filter(k => (this.keyCooldowns.get(k) || 0) <= now);
    return {
      totalKeys: this.keys.length,
      activeKeysCount: activeKeys.length,
      coolingKeysCount: this.keys.length - activeKeys.length
    };
  }
}

const keyPool = new GroqKeyPool();

// In-memory daily cache for AI lessons (D.1)
const lessonCache = new Map();

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeCacheKey(words, dayId) {
  const today = getTodayStr();
  const wordKey = words.map(w => (w.word || '').toLowerCase().trim()).sort().join('_');
  return `${today}_${dayId || 'all'}_${wordKey}`;
}

function validateAndFilterLesson(rawParsed, inputWords) {
  const inputMap = new Map();
  inputWords.forEach(w => {
    const cleanW = (w.word || '').toLowerCase().trim();
    if (cleanW) inputMap.set(cleanW, (w.word || '').trim());
  });

  const validSentences = [];
  const rawSentences = Array.isArray(rawParsed.sentences) ? rawParsed.sentences : [];

  for (const item of rawSentences) {
    if (!item || !item.sentence || !item.answer) continue;
    const answer = String(item.answer).trim();
    const sentence = String(item.sentence).trim();
    const word = String(item.word || answer).trim();

    // 1. Answer must match an input word
    const matchedOrigWord = inputMap.get(answer.toLowerCase()) || inputMap.get(word.toLowerCase());
    if (!matchedOrigWord) continue;

    // 2. Exactly one blank "_____"
    const blanks = sentence.match(/_____/g);
    if (!blanks || blanks.length !== 1) continue;

    // 3. Sentence must NOT contain the target word outside the blank
    const withoutBlank = sentence.replace(/_____/g, ' ');
    const escapedAns = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`\\b${escapedAns}\\b`, 'i');
    if (wordRegex.test(withoutBlank)) continue;

    validSentences.push({
      word: matchedOrigWord,
      sentence: sentence,
      answer: matchedOrigWord
    });
  }

  const passage = typeof rawParsed.passage === 'string' ? rawParsed.passage.trim() : '';
  const rawUsed = Array.isArray(rawParsed.usedWords) ? rawParsed.usedWords : [];
  const usedWords = rawUsed
    .map(w => inputMap.get(String(w).toLowerCase().trim()))
    .filter(Boolean);

  return {
    sentences: validSentences.slice(0, 12),
    passage,
    usedWords: Array.from(new Set(usedWords))
  };
}

/**
 * Sinh bài học AI hoàn chỉnh (Sentences + Reading Passage) theo đúng spec D.1
 * Groq LPU trước -> Gemini Flash-Lite fallback -> 503 error
 */
async function generateAiLesson(words, dayId = null) {
  const today = getTodayStr();
  const cacheKey = computeCacheKey(words, dayId);

  // 1. Kiểm tra cache trong bộ nhớ theo ngày
  if (lessonCache.has(cacheKey)) {
    const cached = lessonCache.get(cacheKey);
    if (cached.date === today) {
      return {
        success: true,
        provider: cached.provider,
        sentences: cached.sentences,
        passage: cached.passage,
        usedWords: cached.usedWords,
        cached: true
      };
    } else {
      lessonCache.delete(cacheKey);
    }
  }

  const wordListFormatted = words.map(w => w.meaning ? `${w.word} (${w.meaning})` : w.word).join(', ');

  const promptSystem = `You are an expert English teacher for A2 learners.
Generate learning content based strictly on the user's provided vocabulary list.
Follow these rules strictly:
1. "sentences": Write one English fill-in-the-blank sentence (A2 level, everyday context) for each suitable word from this list: ${wordListFormatted}.
Choose only the words that fit naturally in a sentence; skip words that do not fit.
Each sentence MUST have exactly one blank written as "_____" for the target word, and must NOT contain the target word itself.
Return JSON format: [{"word": "target_word", "sentence": "sentence with _____ blank", "answer": "target_word"}].
2. "passage": Write a short English reading passage (80-120 words, A2 level) using 5-8 of the selected words naturally once.
3. "usedWords": List of the target words actually used in the passage.

Return STRICTLY a valid JSON object with no markdown fences:
{
  "sentences": [
    { "word": "example", "sentence": "This is an _____ sentence.", "answer": "example" }
  ],
  "passage": "Reading passage...",
  "usedWords": ["word1", "word2"]
}`;

  const promptUser = `Vocabulary list: ${wordListFormatted}`;

  let parsedData = null;
  let activeProvider = null;
  let lastErrorMsg = '';

  // 2. Thử Groq LPU trước
  const groqKey = keyPool.getAvailableKey();
  if (groqKey) {
    const groqModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b'
    ];

    for (const model of groqModels) {
      try {
        const body = {
          model: model,
          messages: [
            { role: 'system', content: promptSystem },
            { role: 'user', content: promptUser }
          ],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        };
        if (model.includes('gpt-oss')) {
          body.reasoning_effort = 'low';
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const status = res.status;
          const errText = await res.text();
          if (status === 429) {
            keyPool.markExhausted(groqKey);
          }
          lastErrorMsg = `Groq ${model} (${status}): ${errText}`;
          continue;
        }

        const resJson = await res.json();
        const content = resJson.choices?.[0]?.message?.content || '';
        if (content) {
          const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(clean);
          activeProvider = 'groq';
          break;
        }
      } catch (e) {
        lastErrorMsg = e.message;
      }
    }
  } else {
    lastErrorMsg = 'Chưa cấu hình GROQ_API_KEY hoặc tất cả key Groq đang cooldown.';
  }

  // 3. Fallback sang Gemini nếu Groq lỗi hoặc hết key
  if (!parsedData && process.env.GEMINI_API_KEY) {
    const geminiModels = [
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash'
    ];

    const geminiPrompt = `${promptSystem}\n\n${promptUser}`;

    for (const m of geminiModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          lastErrorMsg = `Gemini ${m} (${res.status}): ${errText}`;
          continue;
        }

        const data = await res.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const clean = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(clean);
          activeProvider = 'gemini';
          break;
        }
      } catch (e) {
        lastErrorMsg = e.message;
      }
    }
  }

  // 4. Nếu cả 2 đều lỗi -> HTTP 503
  if (!parsedData) {
    return {
      isHttpError: true,
      status: 503,
      payload: {
        success: false,
        error: "AI tạm hết lượt, thử lại sau",
        provider: activeProvider || (process.env.GEMINI_API_KEY ? 'gemini' : 'groq'),
        details: lastErrorMsg
      }
    };
  }

  // 5. Kiểm tra tính hợp lệ dữ liệu theo đúng spec
  const validated = validateAndFilterLesson(parsedData, words);

  // Lưu cache bộ nhớ theo ngày
  lessonCache.set(cacheKey, {
    sentences: validated.sentences,
    passage: validated.passage,
    usedWords: validated.usedWords,
    provider: activeProvider,
    date: today
  });

  return {
    success: true,
    provider: activeProvider,
    sentences: validated.sentences,
    passage: validated.passage,
    usedWords: validated.usedWords,
    cached: false
  };
}

// Danh sách model Groq hỗ trợ (ưu tiên theo tốc độ và độ thông minh)
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

/**
 * Gọi Groq API để sinh câu điền từ ngữ cảnh
 */
async function generateSentenceWithGroq(word, meaning) {
  const cleanWord = word.trim();
  const cleanMeaning = (meaning || '').trim();

  const promptSystem = `You are an expert English language teacher. Given a vocabulary word and its Vietnamese meaning, create ONE natural, high quality English fill-in-the-blank sentence where the vocabulary word is replaced with "_____". Return strictly a valid JSON object with no markdown formatting:
{
  "sentence": "She felt _____ before giving her presentation.",
  "missingWord": "${cleanWord}",
  "hint": "Bản dịch tiếng Việt của câu này làm gợi ý"
}`;

  const promptUser = `Vocabulary word: "${cleanWord}" (Meaning: "${cleanMeaning}")`;

  let lastError = null;
  const maxAttempts = Math.max(1, keyPool.keys.length) * GROQ_MODELS.length;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const apiKey = keyPool.getAvailableKey();
    if (!apiKey) {
      throw new Error('Chưa có Groq API Key nào được cấu hình trong hệ thống.');
    }

    // Chọn model
    const model = GROQ_MODELS[(attempts - 1) % GROQ_MODELS.length];

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: promptSystem },
            { role: 'user', content: promptUser }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        })
      });

      // Nếu gặp lỗi Rate Limit (429) hoặc Hết token
      if (res.status === 429) {
        const retryHeader = res.headers.get('retry-after');
        const retrySec = retryHeader ? parseInt(retryHeader, 10) : null;
        keyPool.markExhausted(apiKey, retrySec);
        continue; // Tự động thử lại ngay với key khác
      }

      if (!res.ok) {
        const errText = await res.text();
        lastError = `Groq (${model}): ${res.statusText} - ${errText}`;
        continue;
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      if (rawText) {
        const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);
        return {
          sentence: parsed.sentence || `Fill in the blank: _____ (${cleanWord})`,
          missingWord: parsed.missingWord || cleanWord,
          hint: parsed.hint || cleanMeaning,
          provider: 'Groq',
          model: model
        };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  // Nếu tất cả key Groq tạm thời không gọi được, chuyển ngay sang API Phụ 1: Gemini Flash-Lite
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[AI Phụ 1] Chuyển sang API Phụ Thứ Nhất: Gemini Flash-Lite...');
      return await fallbackToGemini(cleanWord, cleanMeaning);
    } catch (geminiErr) {
      console.error('[AI Phụ 1] Gemini Flash-Lite gặp lỗi:', geminiErr.message);
    }
  }

  // Nếu API Phụ 1 cũng bận, chuyển sang API Phụ 2: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log('[AI Phụ 2] Chuyển sang API Phụ Thứ Hai: OpenRouter...');
      return await fallbackToOpenRouter(cleanWord, cleanMeaning);
    } catch (openRouterErr) {
      console.error('[AI Phụ 2] OpenRouter gặp lỗi:', openRouterErr.message);
    }
  }

  throw new Error('Tất cả hệ thống AI (Groq, Gemini Phụ 1, OpenRouter Phụ 2) đều đang bận: ' + (lastError || ''));
}

/**
 * API Phụ Thứ Nhất: Gemini Flash-Lite
 * Tự động chọn gemini-2.5-flash-lite theo yêu cầu và fallback sang gemini-3.5-flash-lite
 */
async function fallbackToGemini(word, meaning) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chưa có GEMINI_API_KEY');

  const promptText = `You are an expert English language teacher. Given a vocabulary word and its Vietnamese meaning, create ONE natural, high quality English fill-in-the-blank sentence where the vocabulary word is replaced with "_____". Return strictly a valid JSON object with no markdown formatting:
{
  "sentence": "The full sentence with _____ in place of the target word",
  "missingWord": "${word}",
  "hint": "Bản dịch nghĩa tiếng Việt của cả câu để làm gợi ý"
}`;

  const candidateModels = Array.from(new Set([
    process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash'
  ]));

  let lastErr = null;
  for (const m of candidateModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
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

      if (!res.ok) {
        const errText = await res.text();
        lastErr = `${m}: ${errText}`;
        continue;
      }

      const data = await res.json();
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) {
        const clean = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return {
          sentence: parsed.sentence || `Fill in the blank: _____ (${word})`,
          missingWord: parsed.missingWord || word,
          hint: parsed.hint || meaning,
          provider: 'Gemini Flash-Lite (API Phụ 1)',
          model: m
        };
      }
    } catch (e) {
      lastErr = e.message;
    }
  }

  throw new Error('API Phụ Gemini Flash-Lite không thể tạo câu: ' + lastErr);
}

/**
 * API Phụ Thứ Hai: OpenRouter
 */
async function fallbackToOpenRouter(word, meaning) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Chưa có OPENROUTER_API_KEY');

  const promptSystem = `You are an expert English language teacher. Given a vocabulary word and its Vietnamese meaning, create ONE natural, high quality English fill-in-the-blank sentence where the vocabulary word is replaced with "_____". Return strictly a valid JSON object with no markdown formatting:
{
  "sentence": "She felt _____ before giving her presentation.",
  "missingWord": "${word}",
  "hint": "Bản dịch tiếng Việt của câu này làm gợi ý"
}`;

  const promptUser = `Vocabulary word: "${word}" (Meaning: "${meaning}")`;

  const models = [
    process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat',
    'google/gemini-flash-1.5'
  ];

  let lastErr = null;
  for (const m of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://vocabmaster.app',
          'X-Title': 'VocabMaster',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: promptSystem },
            { role: 'user', content: promptUser }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = `${m}: ${errText}`;
        continue;
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      if (rawText) {
        const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return {
          sentence: parsed.sentence || `Fill in the blank: _____ (${word})`,
          missingWord: parsed.missingWord || word,
          hint: parsed.hint || meaning,
          provider: 'OpenRouter (API Phụ 2)',
          model: m
        };
      }
    } catch (e) {
      lastErr = e.message;
    }
  }

  throw new Error('API Phụ 2 OpenRouter không thể tạo câu: ' + lastErr);
}

module.exports = {
  keyPool,
  generateSentenceWithGroq,
  generateAiLesson,
  fallbackToGemini,
  fallbackToOpenRouter
};

