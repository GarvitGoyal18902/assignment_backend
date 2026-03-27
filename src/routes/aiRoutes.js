const express = require('express');
const router = express.Router();
const { generateOptionsHandler } = require('../controllers/aiController');
const { jwtAuthMiddleware } = require('../jwt');

router.post('/generate-options', jwtAuthMiddleware, generateOptionsHandler);

module.exports = router;
