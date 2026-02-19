import { auth } from "@/lib/auth";
import { getAiConfig } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { google } from "@ai-sdk/google";
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

function extractUserText(message: UIMessage) {
    const chunks: string[] = [];

    if (Array.isArray((message as { parts?: unknown[] }).parts)) {
        for (const part of (message as { parts: unknown[] }).parts) {
            if (
                typeof part === "object" &&
                part !== null &&
                "type" in part &&
                (part as { type?: string }).type === "text" &&
                typeof (part as { text?: unknown }).text === "string"
            ) {
                chunks.push((part as { text: string }).text);
            }
        }
    }

    if (typeof (message as { content?: unknown }).content === "string") {
        chunks.push((message as { content: string }).content);
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

async function buildSystemPrompt({
    baseSystemPrompt,
    context,
}: {
    baseSystemPrompt: string;
    context: ChatContext;
}) {
    const { taskId, projectId } = context;
    let systemPrompt = baseSystemPrompt;

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
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = (await req.json()) as {
            messages?: UIMessage[];
            context?: ChatContext;
            system?: string;
            tools?: FrontendToolsPayload;
        };
        const messages = body.messages ?? [];
        const context = body.context ?? {};
        const taskId = context.taskId;
        const projectId = context.projectId;
        const userId = session.user.id;

        const config = await getAiConfig();
        const latestUserMessage = getLatestUserMessage(messages);
        if (latestUserMessage) {
            await prisma.chatMessage.create({
                data: {
                    role: "user",
                    content: latestUserMessage,
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
            model: google(config.model),
            system: systemPrompt,
            messages: await convertToModelMessages(messages),
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            topP: config.topP,
            tools: frontendTools(body.tools ?? {}),
            onFinish: async ({ text }) => {
                const content = text?.trim();
                if (!content) return;

                await prisma.chatMessage.create({
                    data: {
                        role: "assistant",
                        content,
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
