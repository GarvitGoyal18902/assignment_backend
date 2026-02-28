const express = require('express');
const { createPollHandler, getPollHandler } = require('../controllers/pollController');

const router = express.Router();

router.post('/', createPollHandler);
router.get('/:id', getPollHandler);

module.exports = router;
