const connectDB = require('../lib/mongodb');
const Student = require('../models/Student');
const { redisClient } = require('../redis');

async function createStudent({ roomId, studentName }) {
    await connectDB();
    let student = await Student.findOne({ name: studentName, roomId });
    if (!student) {
        student = new Student({ name: studentName, roomId, status: 'active' });
        await student.save();
    }
    const key = `student:${roomId}:${studentName}`;
    await redisClient.set(key, 'active');

    return student;
}

async function kickStudent({ roomId, studentName }) {
    await connectDB();
    const student = await Student.findOneAndUpdate(
        { name: studentName, roomId },
        { status: 'kicked' },
        { new: true }
    ).lean();
    const key = `student:${roomId}:${studentName}`;
    console.log('setting redis blocked ',roomId,studentName);
    await redisClient.set(key, 'blocked');
    console.log(redisClient.get(key));

    return student;
}

async function getStudentByRoomId({ roomId }) {
    await connectDB();
    const students = await Student.find({ roomId }).lean();
    console.log('end point ', students, roomId);
    return students;
}

async function removeStudent({ studentName, roomId }) {
    await connectDB();
    const student = await Student.findOne({
        name: studentName,
        roomId,
        status: 'active'
    });
    if (!student) {
        return null;
    }
    await Student.updateOne({ name: studentName, roomId }, { $set: { status: 'kicked' } });
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
    createStudent,
    getStudentByRoomId,
    removeStudent,
    kickStudent,
    allowStudent
};
