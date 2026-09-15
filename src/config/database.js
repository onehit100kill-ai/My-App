const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'sqlite:./data/english_learning.sqlite';

let sequelize;

if (dbUrl.startsWith('sqlite:')) {
  // Lấy đường dẫn lưu file SQLite
  const relativePath = dbUrl.replace(/^sqlite:/, '');
  const storagePath = path.resolve(__dirname, '../../', relativePath);
  
  // Đảm bảo thư mục cha tồn tại
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
  console.log(`[Database] Đang kết nối Local SQLite tại: ${storagePath}`);
} else if (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:')) {
  // Kết nối PostgreSQL online cho Render / Supabase / Neon
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' || dbUrl.includes('sslmode=require') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  });
  console.log('[Database] Đang kết nối Online PostgreSQL...');
} else {
  throw new Error(`[Database] DATABASE_URL không được hỗ trợ: ${dbUrl}`);
}

module.exports = sequelize;
