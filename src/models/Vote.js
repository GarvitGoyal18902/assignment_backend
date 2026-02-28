const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
    {
        pollId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poll',
            required: true,
            index: true
        },
        studentId: {
            type: String, // Session-based student ID (name+random)
            required: true
        },
        studentName: {
            type: String,
            required: true
        },
        selectedOptionIndex: {
            type: Number,
            required: true,
            min: 0
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate votes (same student, same poll)
voteSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
