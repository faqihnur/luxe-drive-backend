const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Jalur untuk register user baru (POST http://localhost:5000/api/auth/register)
router.post('/register', authController.register);
router.post('/login', authController.login);
module.exports = router;