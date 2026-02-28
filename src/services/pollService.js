const crypto = require('crypto');
const Poll = require('../models/Poll');
const connectDB = require('../lib/mongodb');

function generateRoomId() {
    return crypto.randomBytes(4).toString('hex'); // 8-char room id
}

async function createPoll({ question, options, timeLimit, createdBy }) {
    await connectDB();
    const roomId = generateRoomId();

    const poll = await Poll.create({
        question,
        options,
        timeLimit,
        createdBy,
        roomId,
        status: 'draft'
    });

    return poll;
}

async function startPoll(pollId) {
    await connectDB();
    const poll = await Poll.findById(pollId);
    if (!poll) throw new Error('Poll not found');

    const now = new Date();
    const end = new Date(now.getTime() + poll.timeLimit * 1000);

    poll.status = 'active';
    poll.startTime = now;
    poll.endTime = end;
    await poll.save();

    return poll;
}

async function completePoll(pollId) {
    await connectDB();
    const poll = await Poll.findByIdAndUpdate(pollId, { status: 'completed', endTime: new Date() }, { new: true });
    return poll;
}

async function getPollById(pollId) {
    await connectDB();
    return Poll.findById(pollId).lean();
}

async function incrementVoteCount(pollId, optionIndex) {
    await connectDB();
    const poll = await Poll.findById(pollId);
    if (!poll) throw new Error('Poll not found');
    if (!poll.options[optionIndex]) throw new Error('Invalid option index');

    poll.options[optionIndex].voteCount += 1;
    await poll.save();

    return poll;
}

module.exports = {
    createPoll,
    startPoll,
    completePoll,
    getPollById,
    incrementVoteCount
};
