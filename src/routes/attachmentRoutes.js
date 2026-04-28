const express = require('express');
const { getPollImages } = require('../controllers/attachmentController');
const { jwtAuthMiddlewareTeacher } = require('../jwt');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/:pollId', jwtAuthMiddleware, getPollImages);

module.exports = router;
