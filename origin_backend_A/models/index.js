const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');
const User = require('./User');
const Scheme = require('./Scheme');
const Bookmark = require('./Bookmark');

// Relationships
User.hasMany(Bookmark, {
  foreignKey: 'userId',
  as: 'bookmarks',
  onDelete: 'CASCADE',
});

Bookmark.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Scheme.hasMany(Bookmark, {
  foreignKey: 'schemeId',
  as: 'bookmarks',
  onDelete: 'CASCADE',
});

Bookmark.belongsTo(Scheme, {
  foreignKey: 'schemeId',
  as: 'scheme',
});

// Many-to-Many association between User and Scheme through Bookmark
User.belongsToMany(Scheme, {
  through: Bookmark,
  foreignKey: 'userId',
  otherKey: 'schemeId',
  as: 'bookmarkedSchemes',
});

Scheme.belongsToMany(User, {
  through: Bookmark,
  foreignKey: 'schemeId',
  otherKey: 'userId',
  as: 'bookmarkedByUsers',
});

module.exports = {
  sequelize,
  Sequelize,
  User,
  Scheme,
  Bookmark,
};

