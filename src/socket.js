const Poll = require('./models/Poll');
const { Server } = require('socket.io');
const { startPoll, completePoll, getPollById, getPollByRoomAndStatus } = require('./services/pollService');
const { recordVote, getVoteByPollAndStudent } = require('./services/voteService');
const { createChat } = require('./services/chatService');
const { createStudent, kickStudent, allowStudent } = require('./services/studentService');
const Student = require('./models/Student');
const redisClient=require('./redis')

const roomId = 'room';
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

        io.emit('poll:tick', { pollId, remaining });
        console.log('tick');
        if (remaining <= 0) {
            clearPollTimer(pollId);
            await completePoll(pollId);
            const updated = await getPollById(pollId);
            io.to(roomId).emit('poll:ended', { pollId, poll: updated });
        }
    }, 1000);

    pollTimers.set(pollId, { interval, endTime });
}

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        // console.log('server socket created at.........', socket.id);

        socket.on('connectToRoom', (roomId) => {
            console.log('connected to roomId');
            socket.join(roomId);
        });

        socket.on('teacher:join', async ({ pollId }) => {
            // setting startime and endtime of poll
            console.log('teacher Joined.............');

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

            io.to(roomId).emit('poll:stateForTeacher', {
                role: 'teacher',
                poll,
                remaining
            });
        });

        socket.on('teacher:start', async ({ pollId }) => {
            try {
                console.log('teacher Started..........');
                const poll = await getPollById(pollId);
                if (!poll) {
                    socket.emit('poll:error', { message: `Poll not found....,${pollId}` });
                    return;
                }
                console.log('poll started............');
                await startPollCountdown(io, pollId);
                console.log('sending poll started............');

                const updated = await getPollById(pollId);
                io.to(roomId).emit('poll:started', {
                    pollId,
                    poll: updated
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to start poll' });
            }
        });

        socket.on('student:whatsgoingon', async ({ studentName, roomId }) => {
            const poll = await getPollByRoomAndStatus(roomId, 'active');
            if (!poll) {
                socket.emit('poll:error', { message: 'Poll not found..' });
                return;
            }
            const studentVote = await getVoteByPollAndStudent(poll._id, studentName);
            let choosen = 0,
                choosenOption = '';
            if (!studentVote) {
                choosen = 0;
            } else {
                choosen = studentVote.selectedOptionIndex;
                choosenOption = poll.options[choosen].text;
            }
            let remaining = poll.timeLimit;
            if (poll.startTime && poll.endTime) {
                const now = Date.now();
                const endTime = new Date(poll.endTime).getTime();
                remaining = Math.max(0, Math.round((endTime - now) / 1000));
            }
            console.log('emit poll:state');
            socket.emit('poll:state', {
                role: 'student',
                poll,
                remaining,
                attempted: !!studentVote,
                choosenOption
            });
        });

        socket.on('teacher:whatsGoingOn', async (roomId) => {
            const poll = await getPollByRoomAndStatus(roomId, 'active');
            if (!poll) {
                socket.emit('poll:noActive', { message: 'Poll not found..' });
                return;
            }
            let remaining = poll.timeLimit;
            if (poll.startTime && poll.endTime) {
                const now = Date.now();
                const endTime = new Date(poll.endTime).getTime();
                remaining = Math.max(0, Math.round((endTime - now) / 1000));
            }

            socket.emit('poll:stateForTeacher', {
                role: 'student',
                poll,
                remaining
            });
        });

        socket.on('student:join', async ({ pollId, studentId, studentName }) => {
            const poll = await getPollById(pollId);
            if (!poll) {
                socket.emit('poll:error', { message: 'Poll not found....' });
                return;
            }

            const studentVote = await getVoteByPollAndStudent(poll._id, studentName);
            let choosen = 0,
                choosenOption = '';
            if (!studentVote) {
                choosen = 0;
            } else {
                choosen = studentVote.selectedOptionIndex;
                choosenOption = poll.options[choosen].text;
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
                remaining,
                attempted: !!studentVote,
                choosenOption
            });

            socket.to(roomId).emit('student:joined', { pollId, studentId, studentName });
        });

        socket.on('student:vote', async ({ pollId, studentId, studentName, selectedOptionIndex }) => {
            try {
                const vote = await recordVote({ pollId, studentId, studentName, selectedOptionIndex });
                console.log('student voted');

                console.log('poll:state after submit.............');

                const poll = await getPollById(pollId);
                const studentVote = await getVoteByPollAndStudent(poll._id, studentName);
                let choosen = 0,
                    choosenOption = '';
                if (!studentVote) {
                    choosen = 0;
                } else {
                    choosen = studentVote.selectedOptionIndex;
                    choosenOption = poll.options[choosen].text;
                }
                const remaining = poll?.timeLimit
                    ? Math.max(0, poll.timeLimit - Math.floor((Date.now() - new Date(poll.createdAt)) / 1000))
                    : 0;
                console.log(poll);

                socket.emit('poll:state', {
                    role: 'student',
                    poll,
                    remaining,
                    attempted: !!studentVote,
                    choosenOption
                });
                console.log('socket to updating teacher........', choosen);
                // io.to(roomId).emit('poll:stateForTeacher', {
                // role: 'student',
                //     poll,
                //     remaining`
                // });
                socket.to(roomId).emit('poll:voted', {
                    choosen
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Unable to record vote' });
            }
        });

        socket.on('teacher:askNewQuestion', async ({ pollId }) => {
            try {
                console.log('terminating', pollId);
                await Poll.findByIdAndUpdate(pollId, {
                    endTime: new Date(),
                    status: 'completed'
                });
                console.log('poll interrupted and saved.............');
                clearPollTimer(pollId);
                const updated = await getPollById(pollId);
                io.to(roomId).emit('poll:ended', {
                    pollId,
                    poll: updated
                });
            } catch (err) {
                console.error(err);
                socket.emit('poll:error', { message: 'Failed to end poll' });
            }
        });

        socket.on('chat:newMessage', async ({ roomId, sender, text, createdAt }) => {
            try {
                console.log('inserting new chat ', sender, text);
                const chat = createChat({ roomId, sender, text, createdAt });
                socket.to(roomId).emit('chat:updateChat', { roomId, sender, text, createdAt });
            } catch (err) {
                console.log(err);
                socket.emit('poll:error', { message: 'Failed chat creation' });
            }
        });

        socket.on('student:come', async ({ studentName, roomId }) => {
            try {
                console.log('student come');

                const existing = await Student.findOne({
                    name: studentName,
                    roomId,
                    status: 'active'
                });

                if (existing) {
                    console.log('student already present..........');
                    return;
                }

                const student = await createStudent({
                    studentName,
                    roomId
                });
                console.log('student:updateStudents');
                socket.to(roomId).emit('student:updateStudents', {
                    studentName,
                    roomId,
                    status: 'active'
                });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed student come event' });
            }
        });

        socket.on('student:kicked', async ({ studentName, roomId }) => {
            try {
                console.log('student:kicked');
                const existing = await Student.findOne({
                    name: studentName,
                    roomId,
                    status: 'active'
                });

                if (!existing) {
                    console.log('student not active..........');
                    return;
                }

                const student = await kickStudent({
                    studentName,
                    roomId
                });
                console.log('student:kickStudents');
                socket.to(roomId).emit('student:kickStudents', {
                    studentName,
                    roomId,
                    status: 'active'
                });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed student come event' });
            }
        });

        socket.on('teacher:allowStudent', async ({ studentName, roomId }) => {
            try {
                console.log('allowing ')
                let student=allowStudent({ studentName, roomId });
            } catch (err) {
                socket.emit('poll.error', { message: 'Failed teacher:allowStudent' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected', socket.id);
        });
    });

    return io;
}

module.exports = {
    initSocket,
    redisClient
};
