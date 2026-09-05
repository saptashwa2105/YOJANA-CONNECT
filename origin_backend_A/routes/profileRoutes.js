const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');

router.get('/', getProfile);
router.post('/', updateProfile); // <-- Yeh line add karde (POST support ke liye)
router.put('/', updateProfile);  // <-- Yeh line pehle se thi (PUT support ke liye)

module.exports = router;

