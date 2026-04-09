const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../Controller/User.controller');
const { protect } = require('../Middlewares/Auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;