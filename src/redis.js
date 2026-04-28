const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.poll_web_REDIS_URL
});
// const redisClient = createClient();

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Redis connect failed:', err);
    }
}

connectRedis();

module.exports = { redisClient };
