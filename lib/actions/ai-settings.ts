"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { revalidatePath } from "next/cache";

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
  const encryptionKey = process.env.ENCRYPTION_KEY || "";
  if (!encryptionKey || encryptionKey.length !== 32) {
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
      isEnabled: settings.isEnabled,
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

/**
 * Internal helper to get decrypted keys (Server-side only).
 * Returns null if encryption key is not configured or settings don't exist,
 * allowing getAiModel() to fallback to environment variables.
 */
export async function getDecryptedAiKeys() {
  const encryptionKey = process.env.ENCRYPTION_KEY || "";
  if (!encryptionKey || encryptionKey.length !== 32) {
    // No encryption key configured — return null to allow env var fallback
    return null;
  }

  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) return null;

    return {
      aiProvider: settings.aiProvider,
      geminiKey: settings.encryptedGeminiKey ? decrypt(settings.encryptedGeminiKey, encryptionKey) : null,
      openRouterKey: settings.encryptedOpenRouterKey ? decrypt(settings.encryptedOpenRouterKey, encryptionKey) : null,
    };
  } catch (error) {
    console.error("Failed to decrypt AI keys:", error);
    return null;
  }
}
