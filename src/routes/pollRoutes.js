const express = require('express');
const { createPollHandler, getPollHandler, getAllPolls } = require('../controllers/pollController');
const { jwtAuthMiddleware } = require('../jwt');
const upload = require('../middleware/upload');

const router = express.Router();

// router.post('/', jwtAuthMiddleware, createPollHandler);
router.post('/', jwtAuthMiddleware, upload.array('images'), createPollHandler);
router.get('/all/:roomId', jwtAuthMiddleware, getAllPolls);
router.get('/:id', getPollHandler);

module.exports = router;
