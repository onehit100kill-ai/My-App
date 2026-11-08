const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameState = sequelize.define('GameState', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slot: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default'
  },
  gameType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'farm'
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  clientUpdatedAt: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = GameState;

