import { auth } from "@/auth";
import { createGeminiClient, getAiConfig } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Allow longer generation times

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { message, history, context } = await req.json();
        const taskId = context?.taskId;
        const projectId = context?.projectId;

        // 1. Build System Prompt & Context
        const config = await getAiConfig();
        let systemPrompt = config.systemInstruction || "You are a helpful AI assistant.";

        // Add specific context if available
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
${task.feedback ? `
Title: ${task.feedback.title}
Type: ${task.feedback.type}
Description: ${task.feedback.description}
` : "No related feedback"}

Recent Comments:
${task.comments.map(c => `- ${c.user.name}: ${c.content}`).join("\n")}
`;
                systemPrompt += `\n\n${taskContext}\n\nRules:\n- Be concise and focused on this task.\n- Use markdown formatting (headings, lists, code blocks).\n- If you suggest an action, include a hidden action hint at the end of your response in this format:\n  <!-- action:{"type":"ACTION_TYPE","label":"Button Label","payload":{"key":"value"}} -->\n\nSupported Actions:\n1. Update Status:\n   Type: "update_status"\n   Payload: { "status": "IN_PROGRESS" | "COMPLETED" | "TODO" | "CANCELED" }\n   Example: <!-- action:{"type":"update_status","label":"Mark as In Progress","payload":{"status":"IN_PROGRESS"}} -->\n\n2. Add Comment:\n   Type: "add_comment"\n   Payload: { "content": "Comment text" }\n   Example: <!-- action:{"type":"add_comment","label":"Post Summary Comment","payload":{"content":"Summary..."}} -->`;
            }
        } else if (projectId) {
            // Project context - simplified for now
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            if (project) {
                systemPrompt += `\n\nCurrent Project: ${project.name}\nDescription: ${project.description}`;
            }
        }

        // 2. Prepare Gemini Client
        const client = createGeminiClient();
        if (!client) {
            return new Response("AI configuration missing", { status: 500 });
        }

        // 3. Save User Message to DB immediately
        await prisma.chatMessage.create({
            data: {
                role: "user",
                content: message,
                userId: session.user.id,
                taskId,
                projectId,
            },
        });

        // 4. Create Stream
        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I have the context." }] },
            ...history.map((h: any) => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
            })),
            { role: "user", parts: [{ text: message }] },
        ];

        const geminiStream = await client.models.generateContentStream({
            model: config.model,
            contents,
            config: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
            },
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let fullResponse = "";

                try {
                    for await (const chunk of geminiStream.stream) {
                        const text = chunk.text();
                        if (text) {
                            fullResponse += text;
                            controller.enqueue(encoder.encode(text));
                        }
                    }

                    // 5. Save Assistant Message to DB after streaming is done
                    if (fullResponse) {
                        await prisma.chatMessage.create({
                            data: {
                                role: "assistant",
                                content: fullResponse,
                                userId: session.user.id,
                                taskId,
                                projectId,
                            },
                        });
                    }
                } catch (error) {
                    console.error("Streaming failed:", error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
