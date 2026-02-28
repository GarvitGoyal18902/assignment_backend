const { Server } = require('socket.io');
const { startPoll, completePoll, getPollById } = require('./services/pollService');
const { recordVote } = require('./services/voteService');

// In-memory timer tracking per poll
const pollTimers = new Map();

function clearPollTimer(pollId) {
    const existing = pollTimers.get(pollId);
    if (existing) {
        clearInterval(existing.interval);
        pollTimers.delete(pollId);
    }
}

async function startPollCountdown(io, pollId) {
    const poll = await startPoll(pollId);
    const endTime = poll.endTime.getTime();

    clearPollTimer(pollId);

    const interval = setInterval(async () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));

        io.to(pollId).emit('poll:tick', { pollId, remaining });

        if (remaining <= 0) {
            clearPollTimer(pollId);
            await completePoll(pollId);
            const updated = await getPollById(pollId);
            io.to(pollId).emit('poll:ended', { pollId, poll: updated });
        }
    }, 1000);

    pollTimers.set(pollId, { interval, endTime });
}

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        // eslint-disable-next-line no-console
        console.log('Socket connected', socket.id);

        socket.on('teacher:join', async ({ pollId }) => {
            socket.join(pollId);

            const poll = await getPollById(pollId);
            if (!poll) {
                socket.emit('poll:error', { message: 'Poll not found' });
                return;
            }

            let remaining = poll.timeLimit;
            if (poll.startTime && poll.endTime) {
                const now = Date.now();
                const endTime = new Date(poll.endTime).getTime();
                remaining = Math.max(0, Math.round((endTime - now) / 1000));
            }

            socket.emit('poll:state', {
                role: 'teacher',
                poll,
                remaining
            });
        });

        socket.on('teacher:start', async ({ pollId }) => {
            try {
                const poll = await getPollById(pollId);
                if (!poll) {
                    socket.emit('poll:error', { message: 'Poll not found' });
                    return;
                }

                await startPollCountdown(io, pollId);

                const updated = await getPollById(pollId);
                io.to(pollId).emit('poll:started', {
                    pollId,
                    poll: updated
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to start poll' });
            }
        });

        socket.on('student:join', async ({ pollId, studentId, studentName }) => {
            socket.join(pollId);

            const poll = await getPollById(pollId);
            if (!poll) {
                socket.emit('poll:error', { message: 'Poll not found' });
                return;
            }

            let remaining = poll.timeLimit;
            if (poll.startTime && poll.endTime) {
                const now = Date.now();
                const endTime = new Date(poll.endTime).getTime();
                remaining = Math.max(0, Math.round((endTime - now) / 1000));
            }

            socket.emit('poll:state', {
                role: 'student',
                poll,
                remaining
            });

            socket.to(pollId).emit('student:joined', { pollId, studentId, studentName });
        });

        socket.on('student:vote', async ({ pollId, studentId, studentName, selectedOptionIndex }) => {
            try {
                const vote = await recordVote({ pollId, studentId, studentName, selectedOptionIndex });
                io.to(pollId).emit('poll:voted', {
                    pollId,
                    studentId,
                    studentName,
                    selectedOptionIndex,
                    submittedAt: vote.submittedAt
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to record vote' });
            }
        });

        socket.on('disconnect', () => {
            // eslint-disable-next-line no-console
            console.log('Socket disconnected', socket.id);
        });
    });

    return io;
}

module.exports = {
    initSocket
};
