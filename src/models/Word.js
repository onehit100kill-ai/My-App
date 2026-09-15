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
  }
}, {
  timestamps: true
});

module.exports = Word;
