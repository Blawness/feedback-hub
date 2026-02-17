import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getTemplateById } from "@/lib/ai/prompt-templates";

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

/** Runtime AI config resolved from persisted settings */
export interface AiConfig {
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    systemInstruction: string | undefined;
    language: string;
}

/** Fetch the persisted AI settings and resolve config for generation */
export async function getAiConfig(): Promise<AiConfig> {
    try {
        const settings = await prisma.aiSettings.upsert({
            where: { id: "default" },
            update: {},
            create: { id: "default" },
        });

        // Resolve system instruction: custom masterPrompt > template > undefined
        let systemInstruction: string | undefined;
        if (settings.masterPrompt) {
            systemInstruction = settings.masterPrompt;
        } else if (settings.templateId) {
            const template = getTemplateById(settings.templateId);
            systemInstruction = template?.systemInstruction;
        }

        // Append language instruction if not auto
        if (settings.language !== "auto" && systemInstruction) {
            const languageMap: Record<string, string> = {
                en: "English",
                id: "Bahasa Indonesia",
                ja: "Japanese",
                ko: "Korean",
                zh: "Chinese",
                es: "Spanish",
            };
            const langName = languageMap[settings.language] || settings.language;
            systemInstruction += `\n\nIMPORTANT: Always respond in ${langName}.`;
        }

        return {
            model: settings.model,
            temperature: settings.temperature,
            maxOutputTokens: settings.maxOutputTokens,
            topP: settings.topP,
            topK: settings.topK,
            systemInstruction,
            language: settings.language,
        };
    } catch {
        // Fallback to defaults if DB not available
        return {
            model: DEFAULT_MODEL,
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
            systemInstruction: undefined,
            language: "auto",
        };
    }
}
