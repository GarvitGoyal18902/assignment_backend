const { createPoll, getPollById } = require('../services/pollService');
const { createUser, getUserByRole } = require('../services/userService');

async function createPollHandler(req, res, next) {
    try {
        const { question, options, timeLimit, createdBy } = req.body;

        if (!question || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'Question and at least two options are required.' });
        }

        let teacher = await getUserByRole('teacher');

        if (!teacher) {
            teacher = await createUser({ name: 'Teacher', role: 'teacher', isActive: true });
        }

        const poll = await createPoll({
            question,
            options,
            timeLimit,
            createdBy: teacher
        });

        return res.status(201).json({
            pollId: poll._id,
            roomId: poll.roomId,
            timeLimit: poll.timeLimit,
            question: poll.question,
            options: poll.options
        });
    } catch (err) {
        next(err);
    }
}

async function getPollHandler(req, res, next) {
    try {
        const { id } = req.params;
        const poll = await getPollById(id);
        if (!poll) return res.status(404).json({ message: 'Poll not found' });
        return res.json(poll);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createPollHandler,
    getPollHandler
};
