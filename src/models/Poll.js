const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            maxlength: 200
        },
        options: [
            {
                text: {
                    type: String,
                    required: true
                },
                isCorrect: {
                    type: Boolean,
                    default: false
                },
                voteCount: {
                    type: Number,
                    default: 0
                }
            }
        ],
        timeLimit: {
            type: Number,
            default: 60, // seconds
            min: 10,
            max: 300
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'completed', 'cancelled'],
            default: 'draft'
        },
        startTime: {
            type: Date,
            default: null
        },
        endTime: {
            type: Date,
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        roomId: {
            type: String,
            required: true,
            unique: true // Each poll has unique room for socket.io
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Poll', pollSchema);
