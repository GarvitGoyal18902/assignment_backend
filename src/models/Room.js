const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll'
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    activeStudents: [
        {
            studentId: String,
            name: String,
            joinedAt: Date
        }
    ],
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '24h' // Auto-delete after 24hrs
    }
});

module.exports = mongoose.model('Room', roomSchema);
