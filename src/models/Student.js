const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        roomId: {
            type:String
        },
        status: {
            type:String
        }
    }
);

module.exports = mongoose.model('Student', studentSchema);
