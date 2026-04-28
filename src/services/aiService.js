const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractJsonArray(text) {
    try {
        const cleaned = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');

        if (start === -1 || end === -1) {
            throw new Error('No JSON array found');
        }

        return JSON.parse(cleaned.slice(start, end + 1));
    } catch (err) {
        throw new Error('Failed to parse Gemini response');
    }
}

async function generateWithRetry(model, prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            if (err.status === 503 && i < retries - 1) {
                await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
            } else {
                throw err;
            }
        }
    }
}

function fallbackOptions(question) {
    return ['TRY AGAIN IN SOME TIME (AI is experiencing HIGH demand)', 'No', 'Maybe', 'Not sure'];
}

async function generateOptions(question) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
        Generate 4 short options for this poll question. Only one should be correct.

        Return ONLY a JSON array of strings.
        No markdown, no explanation.

        Question: ${question}

        Example:
        ["Option 1", "Option 2", "Option 3", "Option 4"]
        `;

    try {
        const result = await generateWithRetry(model, prompt);
        const text = result.response.text();

        const parsed = extractJsonArray(text);

        if (!Array.isArray(parsed)) {
            throw new Error('Invalid format');
        }

        const options = parsed
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0)
            .slice(0, 4);

        if (options.length < 2) {
            throw new Error('Too few options');
        }

        return options;
    } catch (err) {
        console.error('Gemini failed:', err.message);

        return fallbackOptions(question);
    }
}

module.exports = { generateOptions };
