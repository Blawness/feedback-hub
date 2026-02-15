import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

function createGeminiClient() {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

/** Singleton Gemini client — null if API key is missing */
export const ai = createGeminiClient();

/** Default model to use for all AI features */
export const DEFAULT_MODEL = "gemini-2.0-flash";

/** Check if AI features are available */
export function isAIEnabled() {
    return ai !== null;
}
