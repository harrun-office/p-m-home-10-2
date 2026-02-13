const express = require('express');
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getCurrentUser);

module.exports = router;
