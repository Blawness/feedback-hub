"use server";

import { getAiModel, isAIEnabled, getAiConfig } from "@/lib/ai/gemini";
import { generateText as aiGenerateText } from "ai";
import { prisma } from "@/lib/prisma";
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

        const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error("AI JSON generation failed:", error);
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

        return text?.trim() || null;
    } catch (error) {
        console.error("AI text generation failed:", error);
        return null;
    }
}

// ─── AI Task Breakdown ────────────────────────────────────

interface SubtaskSuggestion {
    title: string;
    description: string;
    priority: string;
    estimatedHours: number;
    storyPoints: number;
}

export async function generateTaskBreakdown(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            feedback: true,
            project: { select: { id: true, name: true } },
            subtasks: { select: { id: true, title: true } },
        },
    });

    if (!task) return { error: "Task not found" };

    const existingSubtasks = task.subtasks.map(s => `- ${s.title}`).join("\n");

    const prompt = `You are a project manager AI. Analyze the following task and break it down into smaller, actionable subtasks.

Task Title: ${task.title}
Task Description: ${task.description || "No description"}
Task Priority: ${task.priority}
Project: ${task.project.name}

${task.feedback ? `
Related Feedback:
Title: ${task.feedback.title}
Description: ${task.feedback.description}
Type: ${task.feedback.type}
` : ""}

${existingSubtasks ? `
Existing subtasks (do NOT duplicate these):
${existingSubtasks}
` : ""}

Generate 3-6 subtasks. Return a JSON array of subtasks:
[
  {
    "title": "Short actionable title",
    "description": "Brief description of what needs to be done",
    "priority": "low" | "medium" | "high" | "critical",
    "estimatedHours": number (between 0.5 and 8),
    "storyPoints": number (1, 2, 3, 5, 8, 13)
  }
]

Rules:
- Each subtask should be concrete and testable
- Keep titles under 80 characters
- Assign realistic story points using fibonacci sequence (1, 2, 3, 5, 8, 13)
- Estimated hours should be realistic for a single developer
- Return ONLY the JSON array, no other text`;

    const subtasks = await generateJSON<SubtaskSuggestion[]>(prompt);

    if (!subtasks || subtasks.length === 0) {
        return { error: "AI could not generate subtask breakdown." };
    }

    // Create subtasks in the database
    const created = await prisma.$transaction(
        subtasks.map(sub =>
            prisma.task.create({
                data: {
                    title: sub.title,
                    description: sub.description,
                    priority: sub.priority,
                    storyPoints: sub.storyPoints,
                    estimatedHours: sub.estimatedHours,
                    projectId: task.projectId,
                    parentTaskId: task.id,
                    status: "todo",
                },
            })
        )
    );

    revalidatePath("/tasks");
    return { success: true, subtasks: created };
}

// ─── AI Auto-Estimation ───────────────────────────────────

interface TaskEstimation {
    storyPoints: number;
    estimatedHours: number;
    reasoning: string;
}

export async function estimateTask(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            feedback: { select: { title: true, description: true, type: true } },
        },
    });

    if (!task) return { error: "Task not found" };

    // Fetch historical tasks for context
    const historicalTasks = await prisma.task.findMany({
        where: {
            projectId: task.projectId,
            storyPoints: { not: null },
            status: "done",
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: {
            title: true,
            description: true,
            storyPoints: true,
            estimatedHours: true,
            actualHoursSpent: true,
        },
    });

    const historyContext = historicalTasks.length > 0
        ? `\nHistorical completed tasks for reference:\n${historicalTasks.map(h =>
            `- "${h.title}" (Points: ${h.storyPoints}, Est: ${h.estimatedHours}h, Actual: ${h.actualHoursSpent || "N/A"}h)`
        ).join("\n")}`
        : "";

    const prompt = `You are an experienced project estimation AI. Estimate the effort for this task.

Task Title: ${task.title}
Task Description: ${task.description || "No description"}
Task Priority: ${task.priority}

${task.feedback ? `
Related Feedback:
Title: ${task.feedback.title}
Type: ${task.feedback.type}
Description: ${task.feedback.description}
` : ""}
${historyContext}

Return a JSON object:
{
  "storyPoints": number (fibonacci: 1, 2, 3, 5, 8, 13, 21),
  "estimatedHours": number (realistic hours for a single developer),
  "reasoning": "Brief explanation of the estimation"
}

Rules:
- Story points: 1=trivial, 2=simple, 3=moderate, 5=complex, 8=very complex, 13=epic, 21=massive
- Hours should be realistic (consider complexity, testing, code review)
- If historical data is available, use it as calibration
- Return ONLY the JSON, no other text`;

    const estimation = await generateJSON<TaskEstimation>(prompt);

    if (!estimation) {
        return { error: "AI could not estimate this task." };
    }

    return { success: true, estimation };
}

export async function applyEstimation(taskId: string, storyPoints: number, estimatedHours: number) {
    await prisma.task.update({
        where: { id: taskId },
        data: { storyPoints, estimatedHours },
    });

    revalidatePath("/tasks");
    return { success: true };
}

// ─── AI Task Summarization ────────────────────────────────

export async function summarizeTaskDiscussion(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            comments: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { name: true } } },
            },
            chatMessages: {
                orderBy: { createdAt: "asc" },
                take: 30,
                select: { role: true, content: true, createdAt: true },
            },
            feedback: {
                select: {
                    title: true,
                    description: true,
                    comments: {
                        orderBy: { createdAt: "asc" },
                        take: 10,
                        include: { user: { select: { name: true } } },
                    },
                },
            },
        },
    });

    if (!task) return { error: "Task not found" };

    const taskComments = task.comments.map(c => `[${c.user.name}]: ${c.content}`).join("\n");
    const chatHistory = task.chatMessages.map(m => `[${m.role}]: ${m.content}`).join("\n");
    const feedbackComments = task.feedback?.comments?.map(c => `[${c.user.name}]: ${c.content}`).join("\n") || "";

    if (!taskComments && !chatHistory && !feedbackComments) {
        return { error: "No discussion found for this task." };
    }

    const prompt = `You are a project summarization AI. Summarize the current discussion status for this task.

Task: ${task.title}
Description: ${task.description || "No description"}

${task.feedback ? `
Related Feedback: ${task.feedback.title}
Feedback Description: ${task.feedback.description}
` : ""}

${taskComments ? `Task Comments:\n${taskComments}\n` : ""}
${feedbackComments ? `Feedback Comments:\n${feedbackComments}\n` : ""}
${chatHistory ? `AI Chat History:\n${chatHistory}\n` : ""}

Provide a concise summary covering:
1. **Current Status**: What is the current state of discussion?
2. **Key Decisions**: What has been decided?
3. **Open Questions**: What still needs to be resolved?
4. **Next Steps**: What actions should be taken?

Keep it under 300 words. Use markdown formatting. Reply in the same language as the discussion content.`;

    const summary = await generateText(prompt);

    if (!summary) {
        return { error: "AI could not generate a summary." };
    }

    return { success: true, summary };
}

// ─── Update Task Time Tracking ────────────────────────────

export async function updateTaskTimeTracking(
    taskId: string,
    data: {
        storyPoints?: number | null;
        estimatedHours?: number | null;
        actualHoursSpent?: number | null;
    }
) {
    await prisma.task.update({
        where: { id: taskId },
        data,
    });

    revalidatePath("/tasks");
    return { success: true };
}
