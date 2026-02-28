require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const mongoose = require('mongoose');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || '';

async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        // eslint-disable-next-line no-console
        console.log('Connected to MongoDB');

        const server = http.createServer(app);
        initSocket(server);

        server.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();
