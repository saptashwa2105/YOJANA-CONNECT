const express = require('express');
const router = express.Router();

const schemeRoutes = require('./schemeRoutes');
const userRoutes = require('./userRoutes');
const bookmarkRoutes = require('./bookmarkRoutes');
const profileRoutes = require('./profileRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const chatRoutes = require('./chatRoutes');
const { getHealthStatus } = require('../controllers/healthController');
const { optionalAuthenticateUser } = require('../middleware/authMiddleware');

// API Mount points
router.get('/health', getHealthStatus);
router.use('/profile', optionalAuthenticateUser, profileRoutes);
router.use('/recommendations', optionalAuthenticateUser, recommendationRoutes);
router.use('/schemes', schemeRoutes);
router.use('/bookmarks', optionalAuthenticateUser, bookmarkRoutes);
router.use('/users', optionalAuthenticateUser, userRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
