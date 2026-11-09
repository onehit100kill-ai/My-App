const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Word = sequelize.define('Word', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  dayId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  word: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ipa: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meaning: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  example: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isLearned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isIntensive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiQuestions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('aiQuestions');
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('aiQuestions', JSON.stringify(val));
      } else if (typeof val === 'string') {
        this.setDataValue('aiQuestions', val);
      } else {
        this.setDataValue('aiQuestions', null);
      }
    }
  }
}, {
  timestamps: true
});

module.exports = Word;
