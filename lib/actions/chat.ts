"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// ─── Get Chat History ────────────────────────────────────────

export async function getChatHistory({
    taskId,
    projectId,
    limit = 50,
}: {
    taskId?: string;
    projectId?: string;
    limit?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) return { messages: [] };

    const where: Record<string, unknown> = { userId: session.user.id };
    if (taskId) where.taskId = taskId;
    else if (projectId) where.projectId = projectId;
    else where.taskId = null; // global chat — no task or project context

    const messages = await prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
        },
    });

    return {
        messages: messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.createdAt.toISOString(),
        })),
    };
}

// ─── Save Chat Message ───────────────────────────────────────

export async function saveChatMessage({
    role,
    content,
    taskId,
    projectId,
}: {
    role: "user" | "assistant";
    content: string;
    taskId?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const message = await prisma.chatMessage.create({
        data: {
            role,
            content,
            taskId: taskId || null,
            projectId: projectId || null,
            userId: session.user.id,
        },
        select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
        },
    });

    return {
        success: true,
        message: {
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
            createdAt: message.createdAt.toISOString(),
        },
    };
}

// ─── Save Multiple Messages (batch) ─────────────────────────

export async function saveChatMessages({
    messages,
    taskId,
    projectId,
}: {
    messages: { role: "user" | "assistant"; content: string }[];
    taskId?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    await prisma.chatMessage.createMany({
        data: messages.map((m) => ({
            role: m.role,
            content: m.content,
            taskId: taskId || null,
            projectId: projectId || null,
            userId: session.user.id,
        })),
    });

    return { success: true };
}

// ─── Clear Chat History ──────────────────────────────────────

export async function clearChatHistory({
    taskId,
    projectId,
}: {
    taskId?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const where: Record<string, unknown> = { userId: session.user.id };
    if (taskId) where.taskId = taskId;
    else if (projectId) where.projectId = projectId;
    else {
        where.taskId = null;
        where.projectId = null;
    }

    await prisma.chatMessage.deleteMany({ where });

    return { success: true };
}
