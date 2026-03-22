const express = require('express');
const { createPollHandler, getPollHandler,getAllPolls } = require('../controllers/pollController');

const router = express.Router();

router.post('/', createPollHandler);
router.get('/:id', getPollHandler);
router.get('/all/:roomId', getAllPolls);

module.exports = router;
