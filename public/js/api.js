/**
 * API Service Layer giao tiếp với Backend
 */
const API_BASE = '/api';

const api = {
  // === Sections ===
  async getSections() {
    const res = await fetch(`${API_BASE}/sections`);
    return await res.json();
  },

  async createSection(data) {
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateSection(id, data) {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteSection(id) {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // === Days ===
  async getNextDayNumber(sectionId) {
    const res = await fetch(`${API_BASE}/days/next-number/${sectionId}`);
    return await res.json();
  },

  async getDay(id) {
    const res = await fetch(`${API_BASE}/days/${id}`);
    return await res.json();
  },

  async createDay(data) {
    const res = await fetch(`${API_BASE}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateDay(id, data) {
    const res = await fetch(`${API_BASE}/days/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteDay(id) {
    const res = await fetch(`${API_BASE}/days/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // === Words ===
  async getWords(dayId, status = 'all') {
    let url = `${API_BASE}/words?dayId=${dayId}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    const res = await fetch(url);
    return await res.json();
  },

  async getWordsByDays(dayIds, status = 'all') {
    const res = await fetch(`${API_BASE}/words/by-days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayIds, status })
    });
    return await res.json();
  },

  async createWord(data) {
    const res = await fetch(`${API_BASE}/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateWord(id, data) {
    const res = await fetch(`${API_BASE}/words/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getIntensiveWords() {
    const res = await fetch(`${API_BASE}/words/intensive`);
    return await res.json();
  },

  async getUnlearnedWords() {
    const res = await fetch(`${API_BASE}/words/unlearned`);
    return await res.json();
  },

  async toggleWordLearned(id) {
    const res = await fetch(`${API_BASE}/words/${id}/toggle-learned`, {
      method: 'PATCH'
    });
    return await res.json();
  },

  async toggleWordIntensive(id) {
    const res = await fetch(`${API_BASE}/words/${id}/toggle-intensive`, {
      method: 'PATCH'
    });
    return await res.json();
  },

  async deleteWord(id) {
    const res = await fetch(`${API_BASE}/words/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // === Dictionary Lookup & Suggestions (Client-Side để tránh lỗi IP block trên Render) ===
  async getWordSuggestions(query) {
    try {
      const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
      const data = await res.json();
      return {
        success: true,
        suggestions: data.map(item => item.word)
      };
    } catch (err) {
      console.error('Datamuse API error:', err);
      return { success: false, suggestions: [] };
    }
  },

  async lookupDictionary(word) {
    const cleanWord = word.trim().toLowerCase();
    let ipa = '';
    let suggestedMeanings = [];
    let audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=2`;

    const isValidMeaning = (str, w) => {
      if (!str) return false;
      if (str.toLowerCase() === w) return false;
      if (str.includes('[object') || str.includes('http') || str.includes('<') || str.includes('>') || str.includes('MYMEMORY')) return false;
      if (str.length > 35) return false;
      return true;
    };

    try {
      // 1. Lấy phiên âm IPA từ Wiktionary (origin=* để tránh CORS)
      const fetchIpaForWord = async (w) => {
        try {
          const res = await fetch(`https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(w)}&prop=wikitext&format=json&origin=*`);
          if (res.ok) {
            const data = await res.json();
            const text = data.parse?.wikitext?.['*'] || '';
            const m = text.match(/\{\{IPA\|en\|([^}]+)\}\}/);
            if (m) {
              return m[1].split('|')[0].trim().replace(/\//g, '');
            }
          }
        } catch(e) {}
        return '';
      };

      let rawIpa = await fetchIpaForWord(cleanWord);
      
      // Nếu không tìm thấy IPA cho cả cụm, thử tìm cho từng từ đơn
      if (!rawIpa && cleanWord.includes(' ')) {
        const parts = cleanWord.split(' ');
        const ipas = await Promise.all(parts.map(p => fetchIpaForWord(p)));
        if (ipas.some(i => i)) {
           rawIpa = ipas.map(i => i || '...').join(' ');
        }
      }
      
      if (rawIpa) {
        ipa = '/' + rawIpa + '/';
      }
    } catch (e) {
      console.warn('Wiktionary client fetch error:', e);
    }

    try {
      // 2. Lấy nghĩa tiếng Việt từ Google Translate API
      const gtRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(cleanWord)}`);
      if (gtRes.ok) {
        const data = await gtRes.json();
        if (data[0] && Array.isArray(data[0])) {
          for (const item of data[0]) {
            if (item && item[0]) {
              const mainTrans = item[0].trim().toLowerCase();
              if (isValidMeaning(mainTrans, cleanWord) && !suggestedMeanings.includes(mainTrans)) {
                suggestedMeanings.push(mainTrans);
              }
            }
          }
        }
        if (data[1] && Array.isArray(data[1])) {
          for (const d of data[1]) {
            if (Array.isArray(d[1])) {
              for (const term of d[1]) {
                const cleanTerm = term.trim().toLowerCase();
                if (isValidMeaning(cleanTerm, cleanWord) && !suggestedMeanings.includes(cleanTerm) && suggestedMeanings.length < 8) {
                  suggestedMeanings.push(cleanTerm);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Google Translate client fetch error:', e);
    }

    // 3. Fallback: Lấy nghĩa tiếng Việt từ MyMemory nếu Google Translate bị lỗi CORS trên Render
    if (suggestedMeanings.length === 0) {
      try {
        const mmRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`);
        if (mmRes.ok) {
          const data2 = await mmRes.json();
          const txt = data2.responseData?.translatedText?.trim().toLowerCase();
          if (txt && isValidMeaning(txt, cleanWord) && !suggestedMeanings.includes(txt)) {
            suggestedMeanings.push(txt);
          }
          if (Array.isArray(data2.matches)) {
            for (const m of data2.matches) {
              const cleanM = m.translation?.trim().toLowerCase();
              if (cleanM && isValidMeaning(cleanM, cleanWord) && !suggestedMeanings.includes(cleanM) && suggestedMeanings.length < 10) {
                suggestedMeanings.push(cleanM);
              }
            }
          }
        }
      } catch (e) {
        console.warn('MyMemory client fetch error:', e);
      }
    }

    return {
      success: true,
      word: cleanWord,
      ipa,
      audioUrl,
      suggestedMeanings
    };
  },

  async searchGlobalWords(query) {
    const res = await fetch(`${API_BASE}/words/search?q=${encodeURIComponent(query)}`);
    return await res.json();
  }
};

window.api = api;
