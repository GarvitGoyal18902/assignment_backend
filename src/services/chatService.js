const connectDB = require('../lib/mongodb');
const Chat = require('../models/Chat');

async function createChat({ roomId,sender,text,createdAt }) {
    await connectDB();
    const chat = await Chat.create({
        roomId,
        sender,
        text,
        createdAt
    });
    return chat;
}

async function getChatByRoomId({ roomId }) {
    await connectDB();
    if (!roomId) {
        throw new Error('roomId is required');
    }
    const messages = await Chat.find({ roomId }).sort({ createdAt: 1 }).lean(); // oldest → newest
     const formattedMessages = messages.map((msg) => ({
         sender: msg.sender,
         message: msg.text, 
         createdAt: msg.createdAt
     }));
    return formattedMessages;
}



module.exports = {
    createChat,
    getChatByRoomId
};
