const express = require('express');
const { createPollHandler, getPollHandler, getAllPolls } = require('../controllers/pollController');
const { jwtAuthMiddleware, jwtAuthMiddlewareTeacher } = require('../jwt');
const upload = require('../middleware/upload');

const router = express.Router();

// router.post('/', jwtAuthMiddleware, createPollHandler);
router.post('/', jwtAuthMiddlewareTeacher, upload.array('images'), createPollHandler);
router.get('/all/:roomId', jwtAuthMiddlewareTeacher, getAllPolls);
router.get('/:id', getPollHandler);

module.exports = router;
