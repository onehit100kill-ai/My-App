const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, Section, Day, Word } = require('./src/models');
const sectionRoutes = require('./src/routes/sections');
const dayRoutes = require('./src/routes/days');
const wordRoutes = require('./src/routes/words');
const dictionaryRoutes = require('./src/routes/dictionary');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/sections', sectionRoutes);
app.use('/api/days', dayRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/dictionary', dictionaryRoutes);

// Phục vụ Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Hàm tạo dữ liệu mẫu nếu Database chưa có gì
async function seedInitialData() {
  const sectionCount = await Section.count();
  if (sectionCount === 0) {
    console.log('[Seed] Đang tạo dữ liệu mẫu ban đầu...');
    const sec1 = await Section.create({
      title: 'Phần 1: Giao tiếp & Đời sống hàng ngày',
      description: 'Các từ vựng thiết yếu trong giao tiếp hàng ngày',
      order: 1
    });

    const day1 = await Day.create({
      sectionId: sec1.id,
      dayNumber: 1,
      title: 'Ngày 1: Cảm xúc & Tính cách',
      order: 1
    });

    const day2 = await Day.create({
      sectionId: sec1.id,
      dayNumber: 2,
      title: 'Ngày 2: Công việc & Thành tựu',
      order: 2
    });

    await Word.bulkCreate([
      {
        dayId: day1.id,
        order: 1,
        word: 'confident',
        ipa: '/ˈkɑːnfɪdənt/',
        meaning: 'tự tin',
        example: 'She is a confident speaker who commands attention.',
        isLearned: false
      },
      {
        dayId: day1.id,
        order: 2,
        word: 'enthusiastic',
        ipa: '/ɪnˌθuːziˈæstɪk/',
        meaning: 'nhiệt tình, hăng hái',
        example: 'The team was enthusiastic about the new project.',
        isLearned: true
      },
      {
        dayId: day1.id,
        order: 3,
        word: 'perseverance',
        ipa: '/ˌpɜːrsəˈvɪrəns/',
        meaning: 'sự kiên trì, bền bỉ',
        example: 'Through hard work and perseverance, he achieved his goals.',
        isLearned: false
      },
      {
        dayId: day2.id,
        order: 1,
        word: 'achievement',
        ipa: '/əˈtʃiːvmənt/',
        meaning: 'thành tựu, thành tích',
        example: 'Winning the award was her greatest achievement.',
        isLearned: false
      },
      {
        dayId: day2.id,
        order: 2,
        word: 'opportunity',
        ipa: '/ˌɑːpərˈtuːnəti/',
        meaning: 'cơ hội, thời cơ',
        example: 'Do not miss this valuable opportunity to learn.',
        isLearned: false
      }
    ]);

    console.log('[Seed] Hoàn tất tạo dữ liệu mẫu ban đầu.');
  }
}

// Khởi động server sau khi đồng bộ Database
sequelize.sync().then(async () => {
  console.log('[Database] Kết nối và đồng bộ cấu trúc bảng thành công.');
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Ứng dụng Học Từ Tiếng Anh đang chạy tại:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}).catch(err => {
  console.error('[Database] Lỗi kết nối cơ sở dữ liệu:', err);
});
