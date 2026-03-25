const express = require('express');
const { getAllStudents,studentSignup,studentLogin} = require('../controllers/studentController');
const { jwtAuthMiddleware } = require('../jwt');
const router = express.Router();

router.get('/room/:roomId', jwtAuthMiddleware, getAllStudents);
router.post('/signup', studentSignup);
router.post('/login', studentLogin);


module.exports = router;
