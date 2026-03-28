const mongoose = require('mongoose');

const attachmentsSchema = new mongoose.Schema({
    url: { type: String, required: true },
    pollId: { type: String }
});

const Attachments = mongoose.model('Attachments', attachmentsSchema);

module.exports = Attachments;
