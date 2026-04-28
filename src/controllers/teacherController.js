const { redisClient } = require('../redis');
const Student = require('../models/Student');
const { generateToken } = require('../../src/jwt');

async function teacherLogin(req, res) {
    const { roomId } = req.body;
    try {
        if (!roomId) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        const authPayload = {
            name: 'teacher',
            roomId,
            role:'teacher'
        };
        const token = generateToken(authPayload);
        return res.status(200).json({ token });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    teacherLogin
};
