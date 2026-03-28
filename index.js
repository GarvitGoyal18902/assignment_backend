require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket');
const connectDB=require('./src/lib/mongodb')
const PORT = process.env.PORT || 5001;

// const mongoose = require('mongoose');

// async function dropIndex() {
//     try {
//         await mongoose.connection.collection('polls').dropIndex('roomId_1');
//         console.log('Index dropped');
//     } catch (err) {
//         console.log('Index not found or already removed');
//     }
// }

// dropIndex();

async function start() {
    try {
        const server = http.createServer(app);
        initSocket(server);
        connectDB();
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
