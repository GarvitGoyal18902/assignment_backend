const express = require('express');
const router = express.Router();
const {getChatHandler}=require('../controllers/chatController')


router.post('/', getChatHandler);

module.exports = router;
