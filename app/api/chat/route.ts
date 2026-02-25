import { auth } from "@/lib/auth";
import { getAiConfig, getAiModel } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 60; // Allow longer generation times

interface ChatContext {
    taskId?: string;
    projectId?: string;
}

type FrontendToolsPayload = Record<
    string,
    {
        description?: string;
        parameters: Record<string, unknown>;
    }
>;

function generateChatTitle(text: string) {
    const cleaned = text
        .replace(/[`*_>#-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return "New Chat";

    const words = cleaned.split(" ").slice(0, 8);
    let title = words.join(" ");
    if (title.length > 60) {
        title = `${title.slice(0, 57).trim()}...`;
    }
    return title;
}

async function resolveSessionUserId(sessionUser: {
    id?: string | null;
    email?: string | null;
}) {
    if (sessionUser.id) {
        const userById = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true },
        });
        if (userById) return userById.id;
    }

    if (sessionUser.email) {
        const userByEmail = await prisma.user.findUnique({
            where: { email: sessionUser.email },
            select: { id: true },
        });
        if (userByEmail) return userByEmail.id;
    }

    return null;
}

function extractUserText(message: UIMessage) {
    const chunks: string[] = [];

    if (Array.isArray((message as { parts?: unknown[] }).parts)) {
        for (const part of (message as { parts: unknown[] }).parts) {
            if (
                typeof part === "object" &&
                part !== null &&
                "type" in part &&
                (part as { type?: string }).type === "text"
            ) {
                const text = (part as { text?: unknown }).text;
                if (typeof text === "string") {
                    chunks.push(text);
                }
            }
        }
    }

    const content = (message as { content?: unknown }).content;
    if (typeof content === "string") {
        chunks.push(content);
    }

    return chunks.join("\n").trim();
}

function getLatestUserMessage(messages: UIMessage[]) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        if (message.role !== "user") continue;

        const text = extractUserText(message);
        if (text) return text;
    }
    return "";
}

function getFirstUserMessage(messages: UIMessage[]) {
    for (const message of messages) {
        if (message.role !== "user") continue;
        const text = extractUserText(message);
        if (text) return text;
    }
    return "";
}

function formatGroupCounts(
    rows: Array<{
        _count: { _all: number };
        [key: string]: string | { _all: number };
    }>,
    key: string
) {
    if (rows.length === 0) return "none";
    return rows
        .map((row) => `${String(row[key])}: ${row._count._all}`)
        .join(", ");
}

async function buildGlobalAppContext(projectId?: string) {
    const feedbackWhere = projectId ? { projectId } : undefined;
    const taskWhere = projectId ? { projectId } : undefined;

    const [
        totalProjects,
        activeProjects,
        feedbackTotal,
        taskTotal,
        feedbackByStatus,
        feedbackByPriority,
        taskByStatus,
        recentFeedback,
        recentTasks,
    ] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { isActive: true } }),
        prisma.feedback.count({ where: feedbackWhere }),
        prisma.task.count({ where: taskWhere }),
        prisma.feedback.groupBy({
            by: ["status"],
            where: feedbackWhere,
            _count: { _all: true },
        }),
        prisma.feedback.groupBy({
            by: ["priority"],
            where: feedbackWhere,
            _count: { _all: true },
        }),
        prisma.task.groupBy({
            by: ["status"],
            where: taskWhere,
            _count: { _all: true },
        }),
        prisma.feedback.findMany({
            where: feedbackWhere,
            take: 12,
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                type: true,
                priority: true,
                status: true,
                project: { select: { name: true } },
            },
        }),
        prisma.task.findMany({
            where: taskWhere,
            take: 12,
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                project: { select: { name: true } },
            },
        }),
    ]);

    const recentFeedbackText =
        recentFeedback.length === 0
            ? "- none"
            : recentFeedback
                .map(
                    (f) =>
                        `- [${f.id}] [${f.project.name}] [${f.status}] [${f.type}] [${f.priority}] ${f.title}`
                )
                .join("\n");
    const recentTaskText =
        recentTasks.length === 0
            ? "- none"
            : recentTasks
                .map(
                    (t) =>
                        `- [${t.id}] [${t.project.name}] [${t.status}] [${t.priority}] ${t.title}`
                )
                .join("\n");

    return `
Application Data Snapshot (${new Date().toISOString()}):
- Projects: ${totalProjects} total (${activeProjects} active)
- Feedback: ${feedbackTotal}
- Tasks: ${taskTotal}
- Feedback by status: ${formatGroupCounts(feedbackByStatus, "status")}
- Feedback by priority: ${formatGroupCounts(feedbackByPriority, "priority")}
- Task by status: ${formatGroupCounts(taskByStatus, "status")}

Recent Feedback:
${recentFeedbackText}

Recent Tasks:
${recentTaskText}
`;
}

async function buildSystemPrompt({
    baseSystemPrompt,
    context,
}: {
    baseSystemPrompt: string;
    context: ChatContext;
}) {
    const { taskId, projectId } = context;
    let systemPrompt = baseSystemPrompt;
    const globalContext = await buildGlobalAppContext(projectId);
    systemPrompt += `\n\n${globalContext}`;
    systemPrompt += `\n\nAssistant behavior rules:
- You are the AI copilot for Feedback Hub, and must ground answers in the context snapshot above.
- Prefer concrete references (IDs, titles, statuses, priorities) when giving analysis or recommendations.
- If context is insufficient for a precise answer, explicitly say what is missing and ask a focused follow-up question.
- Never invent projects, feedback, tasks, IDs, or statuses that are not present in the supplied context.
- Keep responses concise and actionable.`;

    if (taskId) {
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
                            include: { user: true },
                        },
                    },
                },
                comments: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: { user: true },
                },
            },
        });

        if (task) {
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
${task.feedback
                    ? `Title: ${task.feedback.title}
Type: ${task.feedback.type}
Description: ${task.feedback.description}`
                    : "No related feedback"}

Recent Comments:
${task.comments.map((c) => `- ${c.user.name}: ${c.content}`).join("\n")}
`;
            systemPrompt += `\n\n${taskContext}\n\nRules:\n- Be concise and focused on this task.\n- Use markdown formatting (headings, lists, code blocks).\n- If you suggest an action, include a hidden action hint at the end of your response in this format:\n  <!-- action:{\"type\":\"ACTION_TYPE\",\"label\":\"Button Label\",\"payload\":{\"key\":\"value\"}} -->\n\nSupported Actions:\n1. Update Status:\n   Type: \"update_status\"\n   Payload: { \"status\": \"IN_PROGRESS\" | \"COMPLETED\" | \"TODO\" | \"CANCELED\" }\n   Example: <!-- action:{\"type\":\"update_status\",\"label\":\"Mark as In Progress\",\"payload\":{\"status\":\"IN_PROGRESS\"}} -->\n\n2. Add Comment:\n   Type: \"add_comment\"\n   Payload: { \"content\": \"Comment text\" }\n   Example: <!-- action:{\"type\":\"add_comment\",\"label\":\"Post Summary Comment\",\"payload\":{\"content\":\"Summary...\"}} -->`;
        }
    } else if (projectId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (project) {
            systemPrompt += `\n\nCurrent Project: ${project.name}\nDescription: ${project.description}`;
        }
    }

    return systemPrompt;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = (await req.json()) as {
            id?: string;
            messages?: UIMessage[];
            context?: ChatContext;
            system?: string;
            tools?: FrontendToolsPayload;
        };
        const threadId = typeof body.id === "string" && body.id.trim()
            ? body.id.trim()
            : undefined;
        const messages = body.messages ?? [];
        const context = body.context ?? {};
        const taskId = context.taskId;
        const projectId = context.projectId;
        const userId = await resolveSessionUserId(session.user);
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const config = await getAiConfig();
        const model = await getAiModel();
        if (!model) {
            return new Response("AI configuration missing or invalid", { status: 500 });
        }

        const latestUserMessage = getLatestUserMessage(messages);
        const firstUserMessage = getFirstUserMessage(messages);
        const candidateThreadTitle = generateChatTitle(
            latestUserMessage || firstUserMessage
        );
        if (threadId) {
            const existingThread = await prisma.chatThread.findUnique({
                where: { id: threadId },
                select: { id: true, userId: true, title: true },
            });

            if (existingThread && existingThread.userId !== userId) {
                return new Response("Forbidden", { status: 403 });
            }

            if (!existingThread) {
                await prisma.chatThread.create({
                    data: {
                        id: threadId,
                        title: candidateThreadTitle,
                        userId,
                        taskId,
                        projectId,
                    },
                });
            } else if (
                candidateThreadTitle &&
                (!existingThread.title || existingThread.title === "New Chat")
            ) {
                await prisma.chatThread.update({
                    where: { id: threadId },
                    data: { title: candidateThreadTitle },
                });
            }
        }

        if (latestUserMessage) {
            await prisma.chatMessage.create({
                data: {
                    role: "user",
                    content: latestUserMessage,
                    threadId,
                    userId,
                    taskId,
                    projectId,
                },
            });
        }

        const baseSystemPrompt =
            [config.systemInstruction, body.system].filter(Boolean).join("\n\n") ||
            "You are a helpful AI assistant.";
        const systemPrompt = await buildSystemPrompt({
            baseSystemPrompt,
            context,
        });

        const result = streamText({
            model,
            system: systemPrompt,
            messages: await convertToModelMessages(messages),
            temperature: config.temperature,
            // @ts-ignore: maxTokens is not typed correctly in this ai version
            maxTokens: config.maxOutputTokens,
            tools: frontendTools(body.tools ?? {}),
            onFinish: async ({ text }) => {
                const content = text?.trim();
                if (!content) return;

                await prisma.chatMessage.create({
                    data: {
                        role: "assistant",
                        content,
                        threadId,
                        userId,
                        taskId,
                        projectId,
                    },
                });
            },
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
