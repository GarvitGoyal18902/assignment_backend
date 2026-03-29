const { createClient } = require('redis');

const redisClient = createClient({ url: process.env.poll_web_REDIS_URL });

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.connect().catch((err) => {
    console.error('Redis connect failed:', err);
});

module.exports = { redisClient };
