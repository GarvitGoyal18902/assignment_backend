const express = require('express');
const router = express.Router();
const {getChatHandler}=require('../controllers/chatController')
const { jwtAuthMiddleware } = require('../jwt');

router.post('/', jwtAuthMiddleware, getChatHandler);

module.exports = router;
