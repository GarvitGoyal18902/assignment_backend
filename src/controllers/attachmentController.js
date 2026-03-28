const Attachments = require('../models/attachments');

const getPollImages = async (req, res) => {
    const { pollId } = req.params;

    if (!pollId) {
        return res.status(400).json({ message: 'pollId is required' });
    }

    try {
        const images = await Attachments.find({ pollId }).select('url -_id');
        const imageUrls = images.map((img) => img.url);

        return res.status(200).json({ images: imageUrls });
    } catch (err) {
        console.error('Error fetching poll images:', err);
        return res.status(500).json({ message: 'Failed to fetch images' });
    }
};

module.exports = {
    getPollImages
};
