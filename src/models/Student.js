const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    emailID: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'active'
    }
});

studentSchema.index({ name: 1, roomId: 1 }, { unique: true });
studentSchema.index({ emailID: 1, roomId: 1 }, { unique: true });

studentSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
});

studentSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
