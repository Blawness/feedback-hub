"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { revalidatePath } from "next/cache";

/**
 * Updates the global AI settings, including provider and encrypted API keys.
 */
export async function updateAiSettingsAction(data: {
  aiProvider: string;
  geminiKey?: string;
  openRouterKey?: string;
}) {
  const encryptionKey = process.env.ENCRYPTION_KEY || "";
  if (!encryptionKey || encryptionKey.length !== 32) {
    return { error: "Server encryption key is not configured correctly." };
  }

  try {
    const updateData: any = {
      aiProvider: data.aiProvider,
    };

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
        hasGeminiKey: false,
        hasOpenRouterKey: false,
      };
    }

    return {
      aiProvider: settings.aiProvider,
      hasGeminiKey: !!settings.encryptedGeminiKey,
      hasOpenRouterKey: !!settings.encryptedOpenRouterKey,
      // We don't return the encrypted keys to the UI, even in encrypted form,
      // for security and to prevent unnecessary data transfer.
    };
  } catch (error) {
    console.error("Failed to fetch AI settings:", error);
    return { error: "Failed to load AI settings." };
  }
}

/**
 * Internal helper to get decrypted keys (Server-side only).
 */
export async function getDecryptedAiKeys() {
  const encryptionKey = process.env.ENCRYPTION_KEY || "";
  if (!encryptionKey || encryptionKey.length !== 32) {
    throw new Error("Server encryption key is not configured correctly.");
  }

  const settings = await prisma.aiSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) return null;

  return {
    aiProvider: settings.aiProvider,
    geminiKey: settings.encryptedGeminiKey ? decrypt(settings.encryptedGeminiKey, encryptionKey) : null,
    openRouterKey: settings.encryptedOpenRouterKey ? decrypt(settings.encryptedOpenRouterKey, encryptionKey) : null,
  };
}
