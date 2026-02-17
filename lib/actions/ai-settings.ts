"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const aiSettingsSchema = z.object({
    language: z.string().min(1),
    model: z.string().min(1),
    temperature: z.number().min(0).max(2),
    maxOutputTokens: z.number().int().min(256).max(8192),
    topP: z.number().min(0).max(1),
    topK: z.number().int().min(1).max(100),
    masterPrompt: z.string().nullable(),
    templateId: z.string().nullable(),
});

export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;

const DEFAULT_SETTINGS: AiSettingsInput = {
    language: "auto",
    model: "gemini-2.0-flash",
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.95,
    topK: 40,
    masterPrompt: null,
    templateId: "default",
};

/** Fetch AI settings (upserts default row if none exists) */
export async function getAiSettings() {
    const settings = await prisma.aiSettings.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
    });
    return settings;
}

/** Update AI settings with validation */
export async function updateAiSettings(data: AiSettingsInput) {
    const parsed = aiSettingsSchema.safeParse(data);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    const settings = await prisma.aiSettings.upsert({
        where: { id: "default" },
        update: parsed.data,
        create: { id: "default", ...parsed.data },
    });

    revalidatePath("/settings");
    return { success: true, settings };
}

/** Reset AI settings to defaults */
export async function resetAiSettings() {
    const settings = await prisma.aiSettings.upsert({
        where: { id: "default" },
        update: DEFAULT_SETTINGS,
        create: { id: "default", ...DEFAULT_SETTINGS },
    });

    revalidatePath("/settings");
    return { success: true, settings };
}
