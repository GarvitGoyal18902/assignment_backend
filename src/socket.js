const Poll = require('./models/Poll');
const { Server } = require('socket.io');
const { startPoll, completePoll, getPollById, getPollByRoomAndStatus } = require('./services/pollService');
const { recordVote, getVoteByPollAndStudent } = require('./services/voteService');
const { createChat } = require('./services/chatService');
const { createStudent, kickStudent, allowStudent, removeStudent } = require('./services/studentService');
const Student = require('./models/Student');
const redisClient = require('./redis');

// Make pollTimers room+poll aware
const pollTimers = new Map();

function clearPollTimer(roomId, pollId) {
    const key = `${roomId}:${pollId}`;
    const existing = pollTimers.get(key);
    if (existing) {
        clearInterval(existing.interval);
        pollTimers.delete(key);
    }
}

async function startPollCountdown(io, pollId, roomId) {
    console.log('starting poll ', pollId, roomId);
    const poll = await startPoll(pollId);
    const endTime = poll.endTime.getTime();
    clearPollTimer(roomId, pollId);

    const key = `${roomId}:${pollId}`;
    const interval = setInterval(async () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));
        // console.log('tick')
        io.to(roomId).emit('poll:tick', { pollId, remaining });

        if (remaining <= 0) {
            clearPollTimer(roomId, pollId);
            await completePoll(pollId);
            const updated = await getPollById(pollId);
            io.to(roomId).emit('poll:ended', { pollId, poll: updated });
        }
    }, 1000);

    pollTimers.set(key, { interval, endTime });
}

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        // Join room and store roomId in socket
        socket.on('connectToRoom', (roomId) => {
            socket.join(roomId);
            socket.roomId = roomId;
        });

        // Teacher joins room
        socket.on('teacher:join', async ({ pollId }) => {
            try {
                const poll = await getPollById(pollId);
                if (!poll) {
                    socket.emit('poll:error', { message: `Poll not found ${pollId}` });
                    return;
                }

                await Poll.findByIdAndUpdate(pollId, { status: 'active' });

                let remaining = poll.timeLimit;
                if (poll.startTime && poll.endTime) {
                    const now = Date.now();
                    const endTime = new Date(poll.endTime).getTime();
                    remaining = Math.max(0, Math.round((endTime - now) / 1000));
                }

                io.to(socket.roomId).emit('poll:stateForTeacher', {
                    role: 'teacher',
                    poll,
                    remaining
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Failed teacher join' });
            }
        });

        // Teacher starts poll
        socket.on('teacher:start', async ({ pollId }) => {
            try {
                console.log('teacher:start');
                const poll = await getPollById(pollId);
                if (!poll) {
                    socket.emit('poll:error', { message: `Poll not found ${pollId}` });
                    return;
                }

                await startPollCountdown(io, pollId, socket.roomId);

                const updated = await getPollById(pollId);
                io.to(socket.roomId).emit('poll:started', {
                    pollId,
                    poll: updated
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to start poll' });
            }
        });

        // Student requests current poll state
        socket.on('student:whatsgoingon', async ({ studentName }) => {
            try {
                const roomId = socket.roomId;
                const poll = await getPollByRoomAndStatus(roomId, 'active');
                if (!poll) {
                    socket.emit('poll:error', { message: 'Poll not found' });
                    return;
                }

                const studentVote = await getVoteByPollAndStudent(poll._id, studentName);
                let choosen = 0,
                    choosenOption = '';
                if (studentVote) {
                    choosen = studentVote.selectedOptionIndex;
                    choosenOption = poll.options[choosen].text;
                }

                let remaining = poll.timeLimit;
                if (poll.startTime && poll.endTime) {
                    const now = Date.now();
                    remaining = Math.max(0, Math.round((new Date(poll.endTime).getTime() - now) / 1000));
                }

                socket.emit('poll:state', {
                    role: 'student',
                    poll,
                    remaining,
                    attempted: !!studentVote,
                    choosenOption
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Failed fetching poll state' });
            }
        });

        // Teacher checks poll state
        socket.on('teacher:whatsGoingOn', async () => {
            try {
                const roomId = socket.roomId;
                const poll = await getPollByRoomAndStatus(roomId, 'active');
                if (!poll) {
                    socket.emit('poll:noActive', { message: 'Poll not found' });
                    return;
                }

                let remaining = poll.timeLimit;
                if (poll.startTime && poll.endTime) {
                    remaining = Math.max(0, Math.round((new Date(poll.endTime).getTime() - Date.now()) / 1000));
                }

                socket.emit('poll:stateForTeacher', {
                    role: 'teacher',
                    poll,
                    remaining
                });
            } catch (err) {
                console.error(err);
            }
        });

        // Student joins
        socket.on('student:join', async ({ pollId, studentId, studentName }) => {
            try {
                const roomId = socket.roomId;
                const poll = await getPollById(pollId);
                if (!poll) {
                    socket.emit('poll:error', { message: 'Poll not found' });
                    return;
                }

                const studentVote = await getVoteByPollAndStudent(poll._id, studentName);
                let choosen = 0,
                    choosenOption = '';
                if (studentVote) {
                    choosen = studentVote.selectedOptionIndex;
                    choosenOption = poll.options[choosen].text;
                }

                let remaining = poll.timeLimit;
                if (poll.startTime && poll.endTime) {
                    remaining = Math.max(0, Math.round((new Date(poll.endTime).getTime() - Date.now()) / 1000));
                }

                socket.emit('poll:state', {
                    role: 'student',
                    poll,
                    remaining,
                    attempted: !!studentVote,
                    choosenOption
                });

                socket.to(roomId).emit('student:joined', { pollId, studentId, studentName });
            } catch (err) {
                console.error(err);
            }
        });

        // Student votes
        socket.on('student:vote', async ({ pollId, studentId, studentName, selectedOptionIndex }) => {
            try {
                const roomId = socket.roomId;
                await recordVote({ pollId, studentId, studentName, selectedOptionIndex });

                const poll = await getPollById(pollId);
                const studentVote = await getVoteByPollAndStudent(poll._id, studentName);

                let choosen = 0,
                    choosenOption = '';
                if (studentVote) {
                    choosen = studentVote.selectedOptionIndex;
                    choosenOption = poll.options[choosen].text;
                }

                let remaining = poll.timeLimit;
                if (poll.startTime && poll.endTime) {
                    remaining = Math.max(0, Math.round((new Date(poll.endTime).getTime() - Date.now()) / 1000));
                }

                socket.emit('poll:state', {
                    role: 'student',
                    poll,
                    remaining,
                    attempted: !!studentVote,
                    choosenOption
                });

                socket.to(roomId).emit('poll:voted', { choosen });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to record vote' });
            }
        });

        // Teacher ends poll early
        socket.on('teacher:askNewQuestion', async ({ pollId }) => {
            try {
                const roomId = socket.roomId;
                await Poll.findByIdAndUpdate(pollId, {
                    endTime: new Date(),
                    status: 'completed'
                });

                clearPollTimer(roomId, pollId);
                const updated = await getPollById(pollId);

                io.to(roomId).emit('poll:ended', { pollId, poll: updated });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Failed to end poll' });
            }
        });

        // Chat messages
        socket.on('chat:newMessage', async ({ sender, text, createdAt }) => {
            try {
                const roomId = socket.roomId;
                await createChat({ roomId, sender, text, createdAt });
                socket.to(roomId).emit('chat:updateChat', { roomId, sender, text, createdAt });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Failed chat creation' });
            }
        });

        // Student arrives
        socket.on('student:come', async ({ studentName }) => {
            try {
                const roomId = socket.roomId;

                const existing = await Student.findOne({
                    name: studentName,
                    roomId,
                    status: 'active'
                });

                if (existing) return;

                await createStudent({ studentName, roomId });
                socket.to(roomId).emit('student:updateStudents', {
                    studentName,
                    roomId,
                    status: 'active'
                });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed student come event' });
            }
        });

        socket.on('student:go', async ({ studentName }) => {
            try {
                const roomId = socket.roomId;
                const existing = await Student.findOne({
                    name: studentName,
                    roomId,
                    status: 'active'
                });

                if (!existing) return;

                await removeStudent({ studentName, roomId });
                socket.to(roomId).emit('student:updateStudents', { studentName, roomId });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed student come event' });
            }
        });

        // Kick student
        socket.on('student:kicked', async ({ studentName }) => {
            try {
                const roomId = socket.roomId;

                const existing = await Student.findOne({
                    name: studentName,
                    roomId,
                    status: 'active'
                });

                if (!existing) return;

                await kickStudent({ studentName, roomId });
                socket.to(roomId).emit('student:kickStudents', {
                    studentName,
                    roomId,
                    status: 'active'
                });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed student kick event' });
            }
        });

        // Allow student
        socket.on('teacher:allowStudent', async ({ studentName }) => {
            try {
                const roomId = socket.roomId;
                await allowStudent({ studentName, roomId });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed teacher:allowStudent' });
            }
        });

        socket.on('disconnect', () => {
            // console.log('Socket disconnected', socket.id);
            let temp = 1;
        });
    });

    return io;
}

module.exports = {
    initSocket,
    redisClient
};
