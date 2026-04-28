const { getStudentByRoomId } = require('../services/studentService');
const { redisClient } = require('../redis');
const Student = require('../models/Student');
const { generateToken } = require('../../src/jwt');
const { getIo } = require('../socket');

async function isStudentAllowed(studentName, roomId) {
    const key = `student:${roomId}:${studentName.toLowerCase()}`;

    const status = await redisClient.get(key);

    if (status === 'blocked') {
        return { allowed: false, message: 'You are kicked and cannot rejoin' };
    }

    if (status === 'active') {
        return { allowed: true };
    }

    const student = await Student.findOne({
        name: studentName,
        roomId
    });

    if (student && student.status === 'kicked') {
        await redisClient.set(key, 'blocked', { EX: 36000 });

        return { allowed: false, message: 'You are kicked and cannot rejoin' };
    }

    return { allowed: true };
}

async function getAllStudents(req, res, next) {
    try {
        const { roomId } = req.params;
        const students = await getStudentByRoomId({ roomId });

        return res.status(200).json({ students });
    } catch (err) {
        next(err);
    }
}

async function studentSignup(req, res) {
    try {
        const { name, emailID, password, roomId } = req.body;

        if (!name || !emailID || !password || !roomId) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const check = await isStudentAllowed(name, roomId);
        if (!check.allowed) {
            return res.status(403).json({
                message: check.message
            });
        }

        const existingStudent = await Student.findOne({ name, roomId });
        if (existingStudent) {
            return res.status(400).json({
                message: 'Student with this name already exists in this room'
            });
        }

        const existingEmail = await Student.findOne({ emailID, roomId });
        if (existingEmail) {
            return res.status(400).json({
                message: 'Email already registered in the room'
            });
        }

        const newUser = new Student({ name, emailID, password, roomId });
        if (!roomId) {
            res.status(400).json({ message: 'roomId missing at login' });
        }
        const savedUser = await newUser.save();
        const io = getIo();
        io.to(roomId).emit('student:updateStudents', {
            studentName: name,
            roomId,
            status: 'active',
            password,
            emailID
        });

        const payload = {
            id: savedUser.id,
            name: savedUser.name,
            roomId,
            role:"student"
        };

        const token = generateToken(payload);

        const key = `student:${roomId}:${name.toLowerCase()}`;
        await redisClient.set(key, 'active');

        return res.status(201).json({ token });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate student (name + roomId must be unique)'
            });
        }

        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function studentLogin(req, res) {
    try {
        const { studentName, emailID, password, roomId } = req.body;

        if (!studentName || !emailID || !password || !roomId) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const check = await isStudentAllowed(studentName, roomId);
        if (!check.allowed) {
            return res.status(403).json({
                message: check.message
            });
        }

        const existing = await Student.findOne({
            name: studentName,
            roomId
        });

        if (!existing) {
            return res.status(402).json({
                message: 'User not found'
            });
        }

        if (existing.emailID !== emailID) {
            return res.status(401).json({
                message: 'Invalid email'
            });
        }

        const isMatch = await existing.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }

        const authPayload = {
            id: existing.id,
            name: existing.name,
            roomId,
            role:'student'
        };

        const io = getIo();
        io.to(roomId).emit('student:updateStudents', {
            studentName: studentName,
            roomId,
            status: 'active',
            password,
            emailID
        });

        const token = generateToken(authPayload);

        const key = `student:${roomId}:${studentName.toLowerCase()}`;
        await redisClient.set(key, 'active');

        return res.status(200).json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getAllStudents,
    studentSignup,
    studentLogin
};
