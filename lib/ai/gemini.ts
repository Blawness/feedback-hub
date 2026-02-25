import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { getTemplateById } from "@/lib/ai/prompt-templates";
import { getDecryptedAiKeys } from "@/lib/actions/ai-settings";

/** Default model to use for all AI features */
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
export const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

/** Runtime AI config resolved from persisted settings */
export interface AiConfig {
    provider: string;
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    systemInstruction: string | undefined;
    language: string;
}

/**
 * Resolves the AI model based on current database settings.
 * Uses Vercel AI SDK for provider abstraction.
 */
export async function getAiModel() {
    const keys = await getDecryptedAiKeys();

    const settings = await prisma.aiSettings.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
    });

    if (!(settings as any).isEnabled) {
        console.warn("AI Module is disabled in settings.");
        return null;
    }

    // Keys are resolved exclusively from the AiSettings table
    const provider = keys?.aiProvider || settings.aiProvider || "gemini";
    const geminiKey = keys?.geminiKey;
    const openRouterKey = keys?.openRouterKey;

    if (provider === "openrouter") {
        if (!openRouterKey) {
            console.warn("OpenRouter API Key is not set.");
            return null;
        }
        const openrouter = createOpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: openRouterKey,
            headers: {
                "HTTP-Referer": "https://feedback-hub-seven.vercel.app",
                "X-Title": "Feedback Hub"
            }
        });
        // If settings specify a gemini model but we switched to openrouter, use default
        const modelName = settings.model.includes("gemini") ? DEFAULT_OPENROUTER_MODEL : settings.model;
        return openrouter(modelName);
    }

    // Default to Gemini
    if (!geminiKey) {
        console.warn("Gemini API Key is not set.");
        return null;
    }
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(settings.model || DEFAULT_GEMINI_MODEL);
}

/** Check if AI features are available by attempting to get a model */
export async function isAIEnabled() {
    const model = await getAiModel();
    return model !== null;
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
            provider: settings.aiProvider || "gemini",
            model: settings.model,
            temperature: settings.temperature,
            maxOutputTokens: settings.maxOutputTokens,
            topP: settings.topP,
            topK: settings.topK,
            systemInstruction,
            language: settings.language,
        };
    } catch {
        // Fallback to defaults
        return {
            provider: "gemini",
            model: DEFAULT_GEMINI_MODEL,
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
            systemInstruction: undefined,
            language: "auto",
        };
    }
}
