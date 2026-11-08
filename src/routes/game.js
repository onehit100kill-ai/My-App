const express = require('express');
const router = express.Router();
const { GameState } = require('../models');

/**
 * Helper: Chuẩn hóa slot ID
 */
function normalizeSlot(slot) {
  if (!slot || typeof slot !== 'string') return 'default';
  const clean = slot.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return clean || 'default';
}

/**
 * GET /api/game/farm-state
 * Lấy dữ liệu nông trại theo slot (mặc định: 'default')
 */
router.get('/farm-state', async (req, res) => {
  try {
    const slot = normalizeSlot(req.query.slot);
    const key = `farm_state_${slot}`;

    const record = await GameState.findOne({ where: { key } });
    if (!record) {
      return res.json({
        success: true,
        exists: false,
        slot,
        state: null,
        settings: null,
        clientUpdatedAt: 0
      });
    }

    let parsed = {};
    try {
      parsed = JSON.parse(record.data);
    } catch (err) {
      console.error('[GameSync] Lỗi parse JSON state:', err);
    }

    return res.json({
      success: true,
      exists: true,
      slot,
      state: parsed.state || null,
      settings: parsed.settings || null,
      clientUpdatedAt: Number(record.clientUpdatedAt) || 0,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('[GameSync] Lỗi GET farm-state:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đọc dữ liệu nông trại' });
  }
});

/**
 * POST /api/game/farm-state
 * Lưu dữ liệu nông trại theo slot để đồng bộ qua mọi thiết bị
 */
router.post('/farm-state', async (req, res) => {
  try {
    const { slot: rawSlot, state, settings, clientUpdatedAt } = req.body;
    const slot = normalizeSlot(rawSlot);
    const key = `farm_state_${slot}`;

    if (!state || typeof state !== 'object') {
      return res.status(400).json({ success: false, message: 'Dữ liệu state không hợp lệ' });
    }

    const payload = JSON.stringify({
      state,
      settings: settings || {}
    });

    const nowTimestamp = Number(clientUpdatedAt) || Date.now();

    const [record, created] = await GameState.findOrCreate({
      where: { key },
      defaults: {
        key,
        slot,
        gameType: 'farm',
        data: payload,
        clientUpdatedAt: nowTimestamp
      }
    });

    if (!created) {
      // Chỉ cập nhật nếu client gửi dữ liệu mới hơn hoặc bằng (chống ghi đè dữ liệu cũ do mạng chập chờn)
      const currentClientTime = Number(record.clientUpdatedAt) || 0;
      if (nowTimestamp >= currentClientTime) {
        record.data = payload;
        record.clientUpdatedAt = nowTimestamp;
        record.slot = slot;
        record.gameType = 'farm';
        await record.save();
      } else {
        // Dữ liệu trên server mới hơn, trả về bản server để client cập nhật
        let serverData = {};
        try { serverData = JSON.parse(record.data); } catch (e) {}
        return res.json({
          success: true,
          conflict: true,
          serverIsNewer: true,
          slot,
          state: serverData.state || null,
          settings: serverData.settings || null,
          clientUpdatedAt: currentClientTime,
          message: 'Dữ liệu trên máy chủ mới hơn'
        });
      }
    }

    return res.json({
      success: true,
      slot,
      clientUpdatedAt: nowTimestamp,
      updatedAt: record.updatedAt,
      message: 'Đã lưu và đồng bộ thành công'
    });
  } catch (error) {
    console.error('[GameSync] Lỗi POST farm-state:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu dữ liệu nông trại' });
  }
});

/**
 * GET /api/game/matching-records
 * Lấy kỷ lục trò chơi Nối từ theo slot
 */
router.get('/matching-records', async (req, res) => {
  try {
    const slot = normalizeSlot(req.query.slot);
    const key = `matching_records_${slot}`;

    const record = await GameState.findOne({ where: { key } });
    if (!record) {
      return res.json({
        success: true,
        exists: false,
        slot,
        records: null,
        clientUpdatedAt: 0
      });
    }

    let records = null;
    try {
      records = JSON.parse(record.data);
    } catch (e) {}

    return res.json({
      success: true,
      exists: true,
      slot,
      records,
      clientUpdatedAt: Number(record.clientUpdatedAt) || 0,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('[GameSync] Lỗi GET matching-records:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy kỷ lục' });
  }
});

/**
 * POST /api/game/matching-records
 * Lưu kỷ lục trò chơi Nối từ
 */
router.post('/matching-records', async (req, res) => {
  try {
    const { slot: rawSlot, records, clientUpdatedAt } = req.body;
    const slot = normalizeSlot(rawSlot);
    const key = `matching_records_${slot}`;

    if (!records || typeof records !== 'object') {
      return res.status(400).json({ success: false, message: 'Dữ liệu kỷ lục không hợp lệ' });
    }

    const payload = JSON.stringify(records);
    const nowTimestamp = Number(clientUpdatedAt) || Date.now();

    const [record, created] = await GameState.findOrCreate({
      where: { key },
      defaults: {
        key,
        slot,
        gameType: 'matching',
        data: payload,
        clientUpdatedAt: nowTimestamp
      }
    });

    if (!created) {
      record.data = payload;
      record.clientUpdatedAt = nowTimestamp;
      await record.save();
    }

    return res.json({
      success: true,
      slot,
      clientUpdatedAt: nowTimestamp,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('[GameSync] Lỗi POST matching-records:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu kỷ lục' });
  }
});

/**
 * GET /api/game/sync-all
 * Lấy toàn bộ dữ liệu game (Nông trại + Ghép từ) trong 1 request
 */
router.get('/sync-all', async (req, res) => {
  try {
    const slot = normalizeSlot(req.query.slot);
    const farmRec = await GameState.findOne({ where: { key: `farm_state_${slot}` } });
    const matchRec = await GameState.findOne({ where: { key: `matching_records_${slot}` } });

    let farm = null;
    let matching = null;

    if (farmRec) {
      try {
        const p = JSON.parse(farmRec.data);
        farm = {
          state: p.state || null,
          settings: p.settings || null,
          clientUpdatedAt: Number(farmRec.clientUpdatedAt) || 0,
          updatedAt: farmRec.updatedAt
        };
      } catch (e) {}
    }

    if (matchRec) {
      try {
        matching = {
          records: JSON.parse(matchRec.data),
          clientUpdatedAt: Number(matchRec.clientUpdatedAt) || 0,
          updatedAt: matchRec.updatedAt
        };
      } catch (e) {}
    }

    return res.json({
      success: true,
      slot,
      farm,
      matching,
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('[GameSync] Lỗi sync-all:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đồng bộ toàn bộ' });
  }
});

module.exports = router;

