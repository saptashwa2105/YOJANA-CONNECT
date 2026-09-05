const express = require('express');
const router = express.Router();
const {
  searchSchemes,
  getAllSchemes,
  getSchemeById,
} = require('../controllers/schemeController');

// Define /search ahead of /:id to prevent /search being captured as a scheme ID
router.get('/search', searchSchemes);
router.get('/', getAllSchemes);
router.get('/:id', getSchemeById);

module.exports = router;
