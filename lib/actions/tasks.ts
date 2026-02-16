"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTasks({
    projectId,
    status,
    page = 1,
    limit = 50,
}: {
    projectId?: string;
    status?: string;
    page?: number;
    limit?: number;
} = {}) {
    const where = {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
    };

    const tasks = await prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
            feedback: { select: { id: true, title: true } },
        },
    });

    return tasks;
}

export async function createTask(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const projectId = formData.get("projectId") as string;
    const dueDate = formData.get("dueDate") as string;

    if (!title || !projectId) {
        return { error: "Title and project are required." };
    }

    await prisma.task.create({
        data: {
            title,
            description: description || null,
            priority: priority || "medium",
            projectId,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    revalidatePath("/tasks");
    return { success: true };
}

// Define the mapping from Task status (string) to FeedbackStatus (enum-like string)
const FEEDBACK_STATUS_MAP: Record<string, "OPEN" | "IN_PROGRESS" | "RESOLVED"> = {
    todo: "OPEN",
    in_progress: "IN_PROGRESS",
    review: "IN_PROGRESS",
    done: "RESOLVED",
};

export async function updateTaskStatus(id: string, status: string) {
    const task = await prisma.task.update({
        where: { id },
        data: { status },
        include: { feedback: true },
    });

    // Sync feedback status if linked
    if (task.feedbackId && FEEDBACK_STATUS_MAP[status]) {
        await prisma.feedback.update({
            where: { id: task.feedbackId },
            data: { status: FEEDBACK_STATUS_MAP[status] },
        });
    }

    revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
    await prisma.task.delete({ where: { id } });
    revalidatePath("/tasks");
}
