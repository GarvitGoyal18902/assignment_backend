const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractJsonArray(text) {
    const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) {
        throw new Error('No JSON array found in Gemini response');
    }
    return JSON.parse(cleaned.slice(start, end + 1));
}


async function generateOptions(question) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
        Generate 4 short options for this poll question.

        Return only a JSON array of strings.
        Do not include markdown, numbering, explanation, or extra text.

        Question: ${question}

        Example:
        ["Option 1", "Option 2", "Option 3", "Option 4"]
        `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = extractJsonArray(text);

    if (!Array.isArray(parsed)) {
        throw new Error('Gemini did not return an array');
    }

    const options = parsed
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
        .slice(0, 6);

    if (options.length < 2) {
        throw new Error('Not enough options returned by Gemini');
    }

    return options;
}

module.exports = { generateOptions };
