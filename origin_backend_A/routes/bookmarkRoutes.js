const express = require('express');
const router = express.Router();
const {
  getBookmarks,
  addBookmark,
  deleteBookmark,
} = require('../controllers/bookmarkController');

// List user bookmarks
router.get('/', getBookmarks);

// Add bookmark by :schemeId or body
router.post('/:schemeId', addBookmark);
router.post('/', addBookmark);

// Delete bookmark by :schemeId or bookmark id
router.delete('/:schemeId', deleteBookmark);

module.exports = router;
