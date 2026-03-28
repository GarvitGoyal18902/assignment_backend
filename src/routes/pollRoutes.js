const express = require('express');
const { createPollHandler, getPollHandler, getAllPolls } = require('../controllers/pollController');
const { jwtAuthMiddleware } = require('../jwt');

const router = express.Router();

router.post('/', jwtAuthMiddleware, createPollHandler);
router.get('/all/:roomId', getAllPolls);
router.get('/:id', getPollHandler);

module.exports = router;
