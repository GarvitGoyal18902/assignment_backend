const express = require('express');
const { teacherLogin } = require('../controllers/teacherController');

const router = express.Router();
router.post('/login', teacherLogin);

module.exports = router;
