const { createStudent, getStudentByRoomId, removeStudent } = require('../services/studentService');
const { redisClient } = require('../redis');
const connectDB = require('../lib/mongodb');
const Student = require('../models/Student');

async function getAllStudents(req, res, next) {
    try {
        const { roomId } = req.params;
        console.log('getStudentByRoomId', roomId);
        const students = await getStudentByRoomId({ roomId });
        return res.status(200).json({
            students
        });
    } catch (err) {
        next(err);
    }
}

async function checkAllowed(req, res, next) {
    try {
        console.log('checkAllowed middleware');

        const { studentName, roomId } = req.body;

        if (!studentName || !roomId) {
            return res.status(400).json({
                message: 'Missing studentName or roomId'
            });
        }

        const key = `student:${roomId}:${studentName}`;

        const status = await redisClient.get(key);

        if (status === 'blocked') {
            return res.status(403).json({
                message: 'You are kicked and cannot rejoin'
            });
        }

        await connectDB();

        const student = await Student.findOne({
            name: studentName, 
            roomId
        });

        if (!student) {
            return res.status(200).json({
                message: 'Allowed'
            });
        }

        if (student.status === 'kicked') {
            await redisClient.set(key, 'blocked', {
                EX: 36000
            });

            return res.status(403).json({
                message: 'You are kicked and cannot rejoin'
            });
        }

        return res.status(200).json({
            message: 'Allowed'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllStudents,
    checkAllowed
};
