const { createChat, getChatByRoomId } = require('../services/chatService');

async function getChatHandler(req, res, next) {
    try {
        const { roomId } = req.body;
        if (!roomId) {
            return res.status(400).json({ message: 'False roomId for fetching Chat' });
        }
        let chats = await getChatByRoomId({ roomId });
        return res.status(200).json({ chats });
    } catch (err) {
        next(err);
    }
}

module.exports = {
  getChatHandler  
};