const express = require('express');
const router = express.Router();
const { generateOptionsHandler } = require('../controllers/aiController');
const { jwtAuthMiddlewareTeacher } = require('../jwt');

router.post('/generate-options', jwtAuthMiddlewareTeacher, generateOptionsHandler);

module.exports = router;
