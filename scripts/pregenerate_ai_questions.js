const path = require('path');
const APP_DIR = path.resolve(__dirname, '..');
require(path.join(APP_DIR, 'node_modules', 'dotenv')).config({ path: path.join(APP_DIR, '.env') });

const { sequelize, Word } = require(path.join(APP_DIR, 'src', 'models'));
const { generateSentencesForWordBatch } = require(path.join(APP_DIR, 'src', 'services', 'aiService'));

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.replace('--limit=', ''), 10) || Infinity;
    }
  }

  console.log('[Pregenerate] Kết nối Cơ sở dữ liệu...');
  await sequelize.authenticate();
  console.log('[Pregenerate] Kết nối thành công.');

  // Tìm tất cả các từ trong CSDL
  const allWords = await Word.findAll({ order: [['id', 'ASC']] });
  console.log(`[Pregenerate] Tổng số từ trong CSDL: ${allWords.length}`);

  const wordsNeedingQuestions = allWords.filter(w => {
    const q = w.aiQuestions;
    return !Array.isArray(q) || q.length < 5;
  });

  console.log(`[Pregenerate] Số từ cần chuẩn bị câu hỏi (chưa có hoặc < 5 câu): ${wordsNeedingQuestions.length}`);

  const toProcess = wordsNeedingQuestions.slice(0, limit);
  console.log(`[Pregenerate] Sẽ xử lý: ${toProcess.length} từ trong đợt này.\n`);

  const batchSize = 5;
  let totalSaved = 0;
  let failedWords = [];

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const chunk = toProcess.slice(i, i + batchSize);
    const chunkNames = chunk.map(w => w.word).join(', ');
    console.log(`[Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toProcess.length / batchSize)}] Đang sinh 5 câu cho: [${chunkNames}]...`);

    const inputList = chunk.map(w => ({ word: w.word, meaning: w.meaning }));

    try {
      const results = await generateSentencesForWordBatch(inputList);

      for (const w of chunk) {
        const found = results[w.word] || results[w.word.toLowerCase()];
        if (Array.isArray(found) && found.length >= 3) {
          w.aiQuestions = found;
          await w.save();
          totalSaved++;
          console.log(`  ✅ Đã lưu ${found.length} câu cho từ "${w.word}"`);
        } else {
          console.warn(`  ⚠️ Từ "${w.word}" không đủ câu hợp lệ (nhận được: ${found ? found.length : 0})`);
          failedWords.push(w);
        }
      }
    } catch (err) {
      console.error(`  ❌ Lỗi xử lý nhóm [${chunkNames}]:`, err.message);
      failedWords.push(...chunk);
    }

    // Delay nhỏ giữa các batch để tránh nghẽn rate-limit
    await delay(700);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 HOÀN TẤT: Đã chuẩn bị và lưu 5 câu hỏi cho ${totalSaved}/${toProcess.length} từ.`);
  if (failedWords.length > 0) {
    console.log(`⚠️ Có ${failedWords.length} từ cần thử lại trong lượt tiếp theo.`);
  }
  console.log(`==================================================\n`);
}

main().then(() => process.exit(0)).catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
