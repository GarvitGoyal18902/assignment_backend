const express = require('express');
const cors = require('cors');
const path = require('path');

const pollRoutes = require('./routes/pollRoutes');
const chatRoutes = require('./routes/chatRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(
    cors({
        origin: '*',
        optionsSuccessStatus: 200
    })
);

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/polls', pollRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/ai', aiRoutes);

// fallback routing :
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }

    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
