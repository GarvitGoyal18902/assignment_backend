const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
