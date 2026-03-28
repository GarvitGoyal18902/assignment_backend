const { generateOptions } = require('../services/aiService');

async function generateOptionsHandler(req, res, next) {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ message: 'Question is required' });
        }

        const options = await generateOptions(question.trim());
        return res.status(200).json({ options });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    generateOptionsHandler
};
