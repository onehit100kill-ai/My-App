/**
 * Service tra cứu từ điển tiếng Anh:
 * - Lấy phiên âm IPA chuẩn từ Free Dictionary API
 * - Lấy âm thanh phát âm (US/UK audio mp3)
 * - Lấy câu ví dụ thực tế tiếng Anh
 * - Gợi ý bản dịch nghĩa tiếng Việt qua dịch thuật trực tuyến
 */

async function lookupWord(word) {
  if (!word || !word.trim()) {
    return { success: false, message: 'Từ không hợp lệ' };
  }

  const cleanWord = word.trim().toLowerCase();
  let ipa = '';
  let audioUrl = '';
  let examples = [];
  let definitions = [];
  let suggestedMeanings = [];

  // 1. Tra cứu Free Dictionary API
  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (dictRes.ok) {
      const data = await dictRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];

        // Lấy phiên âm IPA
        if (entry.phonetic) {
          ipa = entry.phonetic;
        } else if (entry.phonetics && entry.phonetics.length > 0) {
          const phoneticObj = entry.phonetics.find(p => p.text) || entry.phonetics[0];
          if (phoneticObj && phoneticObj.text) {
            ipa = phoneticObj.text;
          }
        }

        // Lấy audio phát âm
        if (entry.phonetics && entry.phonetics.length > 0) {
          const audioObj = entry.phonetics.find(p => p.audio && p.audio.trim() !== '');
          if (audioObj) {
            audioUrl = audioObj.audio;
          }
        }

        // Lấy câu ví dụ và định nghĩa
        if (entry.meanings && Array.isArray(entry.meanings)) {
          for (const meaning of entry.meanings) {
            const partOfSpeech = meaning.partOfSpeech ? `(${meaning.partOfSpeech}) ` : '';
            if (meaning.definitions && Array.isArray(meaning.definitions)) {
              for (const def of meaning.definitions) {
                if (def.definition && definitions.length < 5) {
                  definitions.push(`${partOfSpeech}${def.definition}`);
                }
                if (def.example && examples.length < 4) {
                  examples.push(def.example);
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DictionaryService] Dictionary API warning:', err.message);
  }

  // 2. Tra cứu nghĩa tiếng Việt gợi ý qua MyMemory Translation API
  try {
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      }
    );

    if (transRes.ok) {
      const transData = await transRes.json();
      if (transData.responseData && transData.responseData.translatedText) {
        const primaryTranslation = transData.responseData.translatedText.trim();
        suggestedMeanings.push(primaryTranslation);
      }
      // Thu thập thêm các nghĩa phụ từ matches
      if (Array.isArray(transData.matches)) {
        for (const match of transData.matches) {
          const text = match.translation && match.translation.trim();
          if (text && !suggestedMeanings.includes(text) && suggestedMeanings.length < 5) {
            // Lọc bớt các câu quá dài không phải nghĩa của từ đơn
            if (text.length < 50 && !text.includes('http')) {
              suggestedMeanings.push(text);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DictionaryService] Translation API warning:', err.message);
  }

  return {
    success: true,
    word: cleanWord,
    ipa: ipa || '',
    audioUrl: audioUrl || '',
    suggestedMeanings,
    examples,
    definitions
  };
}

module.exports = {
  lookupWord
};
