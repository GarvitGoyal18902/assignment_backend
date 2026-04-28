const express = require('express');
const { getAllStudents,studentSignup,studentLogin} = require('../controllers/studentController');
const { jwtAuthMiddleware , jwtAuthMiddlewareStudent } = require('../jwt');
const router = express.Router();

router.get('/room/:roomId', jwtAuthMiddlewareTeacher, getAllStudents);
router.post('/signup', studentSignup);
router.post('/login', studentLogin);


module.exports = router;
