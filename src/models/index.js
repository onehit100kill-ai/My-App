const sequelize = require('../config/database');
const Section = require('./Section');
const Day = require('./Day');
const Word = require('./Word');

// Thiết lập quan hệ: Section 1-N Day
Section.hasMany(Day, {
  foreignKey: 'sectionId',
  as: 'days',
  onDelete: 'CASCADE'
});
Day.belongsTo(Section, {
  foreignKey: 'sectionId',
  as: 'section'
});

// Thiết lập quan hệ: Day 1-N Word
Day.hasMany(Word, {
  foreignKey: 'dayId',
  as: 'words',
  onDelete: 'CASCADE'
});
Word.belongsTo(Day, {
  foreignKey: 'dayId',
  as: 'day'
});

module.exports = {
  sequelize,
  Section,
  Day,
  Word
};
