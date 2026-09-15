const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Day = sequelize.define('Day', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dayNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true
});

module.exports = Day;
