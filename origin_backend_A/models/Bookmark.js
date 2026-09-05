const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  schemeId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'schemes',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'bookmarks',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'schemeId'],
      name: 'unique_user_scheme_bookmark',
    },
  ],
});

module.exports = Bookmark;

