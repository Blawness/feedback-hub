"use server";

import { ai, isAIEnabled, getAiConfig } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import {
    feedbackAnalyzerPrompt,
    suggestedReplyPrompt,
    feedbackToTaskPrompt,
    dashboardInsightsPrompt,
    chatAssistantSystemPrompt,
    semanticSearchPrompt,
} from "@/lib/ai/prompts";
import type {
    FeedbackAnalysis,
    SuggestedReply,
    TaskSuggestion,
    DashboardInsight,
    SemanticSearchResult,
} from "@/lib/ai/types";
import { revalidatePath } from "next/cache";

// ─── Helper ───────────────────────────────────────────────

async function generateJSON<T>(prompt: string): Promise<T | null> {
    if (!isAIEnabled() || !ai) return null;

    try {
        const config = await getAiConfig();

        const response = await ai.models.generateContent({
            model: config.model,
            contents: config.systemInstruction
                ? `${config.systemInstruction}\n\n${prompt}`
                : prompt,
            config: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topP: config.topP,
                topK: config.topK,
            },
        });

        const text = response.text?.trim();
        if (!text) return null;

        // Strip markdown fences if present
        const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error("AI generation failed:", error);
        return null;
    }
}

async function generateText(prompt: string): Promise<string | null> {
    if (!isAIEnabled() || !ai) return null;

    try {
        const config = await getAiConfig();

        const response = await ai.models.generateContent({
            model: config.model,
            contents: config.systemInstruction
                ? `${config.systemInstruction}\n\n${prompt}`
                : prompt,
            config: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topP: config.topP,
                topK: config.topK,
            },
        });

        return response.text?.trim() || null;
    } catch (error) {
        console.error("AI generation failed:", error);
        return null;
    }
}

// ─── Feature 1: Feedback Analyzer ─────────────────────────

export async function analyzeFeedback(
    title: string,
    description: string
): Promise<FeedbackAnalysis | null> {
    const prompt = feedbackAnalyzerPrompt(title, description);
    return generateJSON<FeedbackAnalysis>(prompt);
}

// ─── Feature 2: Feedback → Task Converter ─────────────────

export async function convertFeedbackToTask(feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: { project: { select: { id: true, name: true } } },
    });

    if (!feedback) return { error: "Feedback not found" };

    const prompt = feedbackToTaskPrompt(
        feedback.title,
        feedback.description,
        feedback.type,
        feedback.priority
    );

    const suggestion = await generateJSON<TaskSuggestion>(prompt);

    if (!suggestion) {
        return { error: "AI is not available. Please create task manually." };
    }

    // Create the task directly
    const task = await prisma.task.create({
        data: {
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            projectId: feedback.projectId,
            feedbackId: feedback.id,
            dueDate: suggestion.suggestedDueDate
                ? new Date(suggestion.suggestedDueDate)
                : null,
        },
    });

    // Update feedback status to IN_PROGRESS
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: "IN_PROGRESS" },
    });

    revalidatePath("/tasks");
    revalidatePath("/feedback");

    return { success: true, task, suggestion };
}

// ─── Feature 3: Smart Reply ──────────────────────────────

export async function generateSuggestedReplyAction(feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
            comments: {
                orderBy: { createdAt: "asc" },
                select: { content: true },
            },
        },
    });

    if (!feedback) return { error: "Feedback not found" };

    const prompt = suggestedReplyPrompt(
        feedback.title,
        feedback.description,
        feedback.type,
        feedback.comments.map((c) => c.content)
    );

    const reply = await generateText(prompt);

    if (!reply) {
        return { error: "AI is not available." };
    }

    return { success: true, reply };
}

// ─── Feature 4: Dashboard Insights ───────────────────────

export async function generateDashboardInsightsAction(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const feedbacks = await prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            status: true,
            createdAt: true,
        },
    });

    if (feedbacks.length === 0) {
        return { insights: [], message: "No feedbacks to analyze." };
    }

    const summaries = feedbacks.map((f) => ({
        id: f.id,
        title: f.title,
        type: f.type,
        priority: f.priority,
        status: f.status,
        createdAt: f.createdAt.toISOString(),
    }));

    const prompt = dashboardInsightsPrompt(summaries);
    const insights = await generateJSON<DashboardInsight[]>(prompt);

    return { insights: insights || [], success: true };
}

// ─── Feature 5: Semantic Search ──────────────────────────

export async function semanticSearchAction(query: string, projectId?: string) {
    if (!query.trim()) return { results: [] };

    const where = projectId ? { projectId } : {};

    const feedbacks = await prisma.feedback.findMany({
        where,
        take: 100,
        select: {
            id: true,
            title: true,
            description: true,
        },
    });

    if (feedbacks.length === 0) return { results: [] };

    const prompt = semanticSearchPrompt(query, feedbacks);
    const results = await generateJSON<SemanticSearchResult[]>(prompt);

    return { results: results || [], success: true };
}

// ─── Feature 6: Chat Assistant ───────────────────────────

export async function chatWithAssistant(
    message: string,
    projectId?: string,
    history: { role: "user" | "assistant"; content: string }[] = []
) {
    if (!isAIEnabled() || !ai) {
        return { error: "AI is not available." };
    }

    const config = await getAiConfig();

    // Build project context
    const feedbacks = await prisma.feedback.findMany({
        where: projectId ? { projectId } : {},
        take: 30,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            status: true,
        },
    });

    const tasks = await prisma.task.findMany({
        where: projectId ? { projectId } : {},
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
        },
    });

    const projectContext = `
Recent Feedbacks (${feedbacks.length}):
${feedbacks.map((f) => `- [${f.status}] [${f.type}] [${f.priority}] ${f.title}`).join("\n")}

Recent Tasks (${tasks.length}):
${tasks.map((t) => `- [${t.status}] [${t.priority}] ${t.title}`).join("\n")}
`;

    let systemPrompt = chatAssistantSystemPrompt(projectContext);
    if (config.systemInstruction) {
        systemPrompt = `${config.systemInstruction}\n\n${systemPrompt}`;
    }

    try {
        const contents = [
            { role: "user" as const, parts: [{ text: systemPrompt }] },
            { role: "model" as const, parts: [{ text: "Understood. I'm ready to help you with your Feedback Hub." }] },
            ...history.map((h) => ({
                role: (h.role === "assistant" ? "model" : "user") as "user" | "model",
                parts: [{ text: h.content }],
            })),
            { role: "user" as const, parts: [{ text: message }] },
        ];

        const response = await ai.models.generateContent({
            model: config.model,
            contents,
            config: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topP: config.topP,
                topK: config.topK,
            },
        });

        return { success: true, reply: response.text?.trim() || "No response." };
    } catch (error) {
        console.error("Chat failed:", error);
        return { error: "Failed to get AI response." };
    }
}
