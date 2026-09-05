const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');

router.get('/', getRecommendations);
router.post('/', getRecommendations);

module.exports = router;
