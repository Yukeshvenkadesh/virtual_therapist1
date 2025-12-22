import Groq from "groq-sdk";

let groq = null;

const getGroqClient = () => {
    if (!groq) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return groq;
};

/**
 * Calls Groq API for text generation.
 * @param {string} systemPrompt - The system context/instructions.
 * @param {string} userPrompt - The user's input/query.
 * @returns {Promise<string|null>} The generated text or null on failure.
 */
export const callGroq = async (systemPrompt, userPrompt) => {
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error("[GroqClient] Error calling Groq API:", error.message);
        return null;
    }
};
