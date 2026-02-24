"use server";

import { getAiModel, isAIEnabled, getAiConfig } from "@/lib/ai/gemini";
import { generateText as aiGenerateText } from "ai";
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
    if (!(await isAIEnabled())) return null;

    try {
        const config = await getAiConfig();
        const model = await getAiModel();
        if (!model) return null;

        const { text } = await aiGenerateText({
            model,
            system: config.systemInstruction,
            prompt,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        });

        if (!text) return null;

        // Strip markdown fences if present
        const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsed = JSON.parse(cleaned) as T;

        console.log("--- AI JSON Request ---");
        console.log("Prompt:", prompt);
        console.log("System Instruction:", config.systemInstruction);
        console.log("--- AI JSON Response ---");
        console.log(JSON.stringify(parsed, null, 2));
        console.log("-----------------------");

        return parsed;
    } catch (error) {
        console.error("AI generation failed:", error);
        return null;
    }
}

async function generateText(prompt: string): Promise<string | null> {
    if (!(await isAIEnabled())) return null;

    try {
        const config = await getAiConfig();
        const model = await getAiModel();
        if (!model) return null;

        const { text } = await aiGenerateText({
            model,
            system: config.systemInstruction,
            prompt,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        });

        const result = text?.trim() || null;

        console.log("--- AI Text Request ---");
        console.log("Prompt:", prompt);
        console.log("System Instruction:", config.systemInstruction);
        console.log("--- AI Text Response ---");
        console.log(result);
        console.log("-----------------------");

        return result;
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

    // Update feedback status to ASSIGNED
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: "ASSIGNED" },
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
    if (!(await isAIEnabled())) {
        return { error: "AI is not available." };
    }

    const config = await getAiConfig();
    const model = await getAiModel();
    if (!model) return { error: "AI model not available." };

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
        const { text } = await aiGenerateText({
            model,
            system: systemPrompt,
            messages: history.map((h) => ({
                role: h.role as "user" | "assistant",
                content: h.content,
            })).concat([{ role: "user", content: message }]),
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        });

        return { success: true, reply: text.trim() || "No response." };
    } catch (error) {
        console.error("Chat failed:", error);
        return { error: "Failed to get AI response." };
    }
}

// ─── Feature 7: Task Chat Assistant ──────────────────────

export async function chatWithTaskAssistant(
    taskId: string,
    message: string,
    history: { role: "user" | "assistant"; content: string }[] = []
) {
    if (!(await isAIEnabled())) {
        return { error: "AI is not available." };
    }

    const config = await getAiConfig();
    const model = await getAiModel();
    if (!model) return { error: "AI model not available." };

    // Fetch task details with related data
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: true,
            assignee: true,
            feedback: {
                include: {
                    comments: {
                        take: 5,
                        orderBy: { createdAt: "desc" },
                        include: { user: true }
                    }
                }
            },
            comments: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { user: true }
            }
        }
    });

    if (!task) return { error: "Task not found." };

    // Build task context
    const taskContext = `
Current Task Context:
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Description: ${task.description || "No description"}
Project: ${task.project.name}
Assignee: ${task.assignee?.name || "Unassigned"}
Due Date: ${task.dueDate ? task.dueDate.toISOString() : "None"}

Related Feedback:
${task.feedback ? `
Title: ${task.feedback.title}
Type: ${task.feedback.type}
Description: ${task.feedback.description}
` : "No related feedback"}

Recent Comments:
${task.comments.map(c => `- ${c.user.name}: ${c.content}`).join("\n")}
`;

    const systemPrompt = `You are a specialized AI assistant for a specific task in a project management tool.
    
${taskContext}

Your goal is to help the user with this specific task. You can:
- Explain the task requirements
- Suggest implementation steps
- Draft comments or responses
- Analyze the related feedback
- specific technical advice based on the task description

Rules:
- Be concise and focused on this task
- Use the provided context to answer accurately
- If asked about code, provide relevant snippets based on the task description
- Reply in the same language as the user
`;

    try {
        const { text } = await aiGenerateText({
            model,
            system: systemPrompt,
            messages: history.map((h) => ({
                role: h.role as "user" | "assistant",
                content: h.content,
            })).concat([{ role: "user", content: message }]),
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        });

        return { success: true, reply: text.trim() || "No response." };
    } catch (error) {
        console.error("Task Chat failed:", error);
        return { error: "Failed to get AI response." };
    }
}
