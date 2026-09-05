const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const storagePath = process.env.DB_STORAGE 
  ? path.resolve(process.cwd(), process.env.DB_STORAGE) 
  : path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: process.env.NODE_ENV === 'development' ? false : false,
});

module.exports = sequelize;

