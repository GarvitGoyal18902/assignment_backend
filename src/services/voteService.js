const Vote = require('../models/Vote');
const { incrementVoteCount } = require('./pollService');
const connectDB = require('../lib/mongodb');

async function recordVote({ pollId, studentId, studentName, selectedOptionIndex }) {
    await connectDB();
    const vote = await Vote.create({
        pollId,
        studentId,
        studentName,
        selectedOptionIndex
    });

    await incrementVoteCount(pollId, selectedOptionIndex);
    return vote;
}

async function getPollResults(pollId) {
    await connectDB();
    const votes = await Vote.find({ pollId }).lean();

    const counts = {};
    for (const v of votes) {
        counts[v.selectedOptionIndex] = (counts[v.selectedOptionIndex] || 0) + 1;
    }

    return counts;
}

module.exports = {
    recordVote,
    getPollResults
};
