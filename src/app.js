const express = require('express');
const cors = require('cors');

const pollRoutes = require('./routes/pollRoutes');
const chatRoutes = require('./routes/chatRoutes');
const studentRoutes = require('./routes/studentRoutes');
const app = express();

app.use(
    cors({
        origin: '*',
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    })
);
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/polls', pollRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/students', studentRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
