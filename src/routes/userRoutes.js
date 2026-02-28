const express = require('express');
const { createUserHandler, getUserByRoleHandler } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUserHandler);
// router.get('/:id', getPollHandler);
router.get('/role/:role', getUserByRoleHandler);

module.exports = router;
