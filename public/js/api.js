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

  async toggleWordLearned(id) {
    const res = await fetch(`${API_BASE}/words/${id}/toggle-learned`, {
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

  // === Dictionary Lookup & Suggestions ===
  async getWordSuggestions(query) {
    const res = await fetch(`${API_BASE}/dictionary/suggest?q=${encodeURIComponent(query)}`);
    return await res.json();
  },

  async lookupDictionary(word) {
    const res = await fetch(`${API_BASE}/dictionary/lookup?word=${encodeURIComponent(word)}`);
    return await res.json();
  }
};

window.api = api;
