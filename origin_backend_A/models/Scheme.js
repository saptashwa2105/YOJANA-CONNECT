const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scheme = sequelize.define('Scheme', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier or slug for the scheme (e.g. pm-kisan)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  eligibility: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  applicationProcess: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  officialUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'schemes',
  timestamps: true,
});

module.exports = Scheme;

