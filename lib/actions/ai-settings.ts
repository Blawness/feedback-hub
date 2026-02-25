"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { getAiModel } from "@/lib/ai/gemini";

function resolveEncryptionKey(): string | null {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // Preserve backward compatibility if a valid 32-char key is already configured.
    if (envKey.length === 32) return envKey;
    return crypto.createHash("sha256").update(envKey).digest("hex").slice(0, 32);
  }

  const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!authSecret) return null;

  // Stable 32-char key derived from existing auth secret for local/dev convenience.
  return crypto.createHash("sha256").update(authSecret).digest("hex").slice(0, 32);
}

/**
 * Updates the global AI settings, including provider and encrypted API keys.
 */
export async function updateAiSettingsAction(data: {
  aiProvider: string;
  isEnabled?: boolean;
  geminiKey?: string;
  openRouterKey?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  masterPrompt?: string;
}) {
  const encryptionKey = resolveEncryptionKey();
  if (!encryptionKey) {
    return { error: "Server encryption key is not configured correctly." };
  }

  try {
    const updateData: any = {
      aiProvider: data.aiProvider,
    };

    if (data.isEnabled !== undefined) {
      updateData.isEnabled = data.isEnabled;
    }

    if (data.model !== undefined) {
      updateData.model = data.model;
    }

    if (data.temperature !== undefined) {
      updateData.temperature = data.temperature;
    }

    if (data.maxOutputTokens !== undefined) {
      updateData.maxOutputTokens = data.maxOutputTokens;
    }

    if (data.topP !== undefined) {
      updateData.topP = data.topP;
    }

    if (data.topK !== undefined) {
      updateData.topK = data.topK;
    }

    if (data.masterPrompt !== undefined) {
      updateData.masterPrompt = data.masterPrompt;
    }

    if (data.geminiKey) {
      updateData.encryptedGeminiKey = encrypt(data.geminiKey, encryptionKey);
    }

    if (data.openRouterKey) {
      updateData.encryptedOpenRouterKey = encrypt(data.openRouterKey, encryptionKey);
    }

    await prisma.aiSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...updateData,
      },
    });

    revalidatePath("/settings/ai");
    return { success: true };
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return { error: "Failed to save AI settings." };
  }
}

/**
 * Retrieves the global AI settings. API keys are masked for the UI.
 */
export async function getAiSettingsAction() {
  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return {
        aiProvider: "gemini",
        isEnabled: true,
        hasGeminiKey: false,
        hasOpenRouterKey: false,
        model: "gemini-2.0-flash",
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
        masterPrompt: "",
      };
    }

    return {
      aiProvider: settings.aiProvider,
      isEnabled: (settings as any).isEnabled,
      hasGeminiKey: !!settings.encryptedGeminiKey,
      hasOpenRouterKey: !!settings.encryptedOpenRouterKey,
      model: settings.model,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      topP: settings.topP,
      topK: settings.topK,
      masterPrompt: settings.masterPrompt ?? "",
    };
  } catch (error) {
    console.error("Failed to fetch AI settings:", error);
    return { error: "Failed to load AI settings." };
  }
}

import { cacheLife } from "next/cache";

/**
 * Fetches available models from OpenRouter.
 * Uses Next.js 16 Server-side caching to prevent rate-limits and ensure fast loads.
 */
export async function getOpenRouterModelsAction() {
  "use cache";
  cacheLife("hours");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const { data } = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Map and sort alphabetically
    return data
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return [];
  }
}


/**
 * Internal helper to get decrypted keys (Server-side only).
 * Returns null if encryption key is not configured or settings don't exist.
 * API keys are sourced exclusively from the AiSettings database table.
 */
export async function getDecryptedAiKeys() {
  const encryptionKey = resolveEncryptionKey();
  if (!encryptionKey) {
    // No encryption key configured — return null to allow env var fallback
    return null;
  }

  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) return null;

    let geminiKey = null;
    let openRouterKey = null;

    if (settings.encryptedGeminiKey) {
      try {
        geminiKey = decrypt(settings.encryptedGeminiKey, encryptionKey);
      } catch (e) {
        console.error("Failed to decrypt Gemini key:", e);
      }
    }

    if (settings.encryptedOpenRouterKey) {
      try {
        openRouterKey = decrypt(settings.encryptedOpenRouterKey, encryptionKey);
      } catch (e) {
        console.error("Failed to decrypt OpenRouter key:", e);
      }
    }

    return {
      aiProvider: settings.aiProvider,
      geminiKey,
      openRouterKey,
    };
  } catch (error) {
    console.error("Database error in getDecryptedAiKeys:", error);
    return null;
  }
}

/**
 * Sends a minimal prompt to the configured AI model and returns
 * latency, token usage, model name, and the raw response.
 */
export async function testAiConnectionAction() {
  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { id: "default" },
    });

    const provider = settings?.aiProvider || "gemini";
    const modelName = settings?.model || "gemini-2.0-flash";

    const model = await getAiModel();
    if (!model) {
      return {
        success: false as const,
        error:
          "AI model could not be resolved. Please ensure an API key is configured and the AI module is enabled.",
      };
    }

    const start = performance.now();

    const { text, usage } = await generateText({
      model,
      prompt: "Respond with only: Hello",
      temperature: 0,
      maxOutputTokens: 32,
    });

    const latencyMs = Math.round(performance.now() - start);

    return {
      success: true as const,
      latencyMs,
      provider,
      model: modelName,
      response: text.trim(),
      tokenUsage: {
        prompt: usage?.inputTokens ?? 0,
        completion: usage?.outputTokens ?? 0,
        total: usage?.totalTokens ?? 0,
      },
    };
  } catch (error) {
    console.error("AI connection test failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false as const, error: message };
  }
}
