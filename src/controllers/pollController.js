const { createPoll, getPollById, getCompletedPolls } = require('../services/pollService');
const { createUser, getUserByRole } = require('../services/userService');
const Attachments = require('../models/attachments');

async function createPollHandler(req, res, next) {
    try {
        const { question, timeLimit, roomId } = req.body;
        let options = [];
        try {
            options = JSON.parse(req.body.options);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid options format' });
        }
        if (!question || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({
                message: 'Question and at least two options are required.'
            });
        }

        let teacher = await getUserByRole('teacher');

        if (!teacher) {
            teacher = await createUser({ name: 'Teacher', role: 'teacher', isActive: true });
        }

        const poll = await createPoll({
            question,
            options,
            timeLimit,
            createdBy: teacher,
            roomId
        });
        if (req.files && req.files.length > 0) {
            await Attachments.insertMany(
                req.files.map((file) => ({
                    url: file.path,
                    pollId: poll._id
                }))
            );
        }

        // res.json({ pollId: poll._id });
        const attachments = await Attachments.find({ pollId:poll._id });

        return res.status(200).json({
            pollId: poll._id,
            roomId: poll.roomId,
            timeLimit: poll.timeLimit,
            question: poll.question,
            options: poll.options,
            attachments
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
        const attachments = await Attachments.find({ pollId: id });

        return res.json({
            ...poll.toObject(),
            attachments
        });
    } catch (err) {
        next(err);
    }
}

async function getAllPolls(req, res, next) {
    try {
        const { roomId } = req.params;
        const completedPolls = await getCompletedPolls(roomId);
        // console.log(JSON.stringify(completedPolls, null, 2));
        return res.json({ polls: completedPolls });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createPollHandler,
    getPollHandler,
    getAllPolls
};
