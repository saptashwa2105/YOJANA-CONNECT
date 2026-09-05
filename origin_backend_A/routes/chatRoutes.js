const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/aiChatController');

// POST /api/chat
router.post('/', handleChat);

module.exports = router;
