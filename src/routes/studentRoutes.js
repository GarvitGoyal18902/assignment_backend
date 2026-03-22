const express = require('express');
const { getStudentByRoomId, getAllStudents, checkAllowed } = require('../controllers/studentController');

const router = express.Router();
router.post('/checkallowed', checkAllowed);
router.post('/:roomId', getAllStudents);


module.exports = router;
