const connectDB = require('../lib/mongodb');
const Student = require('../models/Student');
const { redisClient } = require('../redis');

async function kickStudent({ roomId, studentName }) {
    const student = await Student.findOneAndUpdate(
        { name: studentName, roomId },
        { status: 'kicked' },
        { new: true }
    ).lean();
    studentName= studentName.toLowerCase();
    const key = `student:${roomId}:${studentName}`;
    console.log('setting redis blocked ',roomId,studentName);
    await redisClient.set(key, 'blocked');
    // console.log(redisClient.get(key));

    return student;
}

async function getStudentByRoomId({ roomId }) {
    const students = await Student.find({ roomId }).lean();
    return students;
}

async function removeStudent({ studentName, roomId }) {
    const student = await Student.findOneAndDelete({
        name: studentName,
        roomId,
        status: 'active'
    });

    if (!student) {
        return null; 
    }
    return student.toObject(); 
}

async function allowStudent({ studentName, roomId }) {
    await connectDB();
    console.log('kicking ', studentName);
    const student = await Student.findOne({
        name: studentName,
        roomId,
        status: 'kicked'
    });
    studentName.toLowerCase();
    const key = `student:${roomId}:${studentName}`;
    await redisClient.set(key, 'active');

    if (!student) {
        console.log('no student to allow in allowStudent');
        return null;
    }

    await Student.deleteOne({
        name: studentName,
        roomId
    });

    return student.toObject();
}

module.exports = {
    getStudentByRoomId,
    removeStudent,
    kickStudent,
    allowStudent
};
