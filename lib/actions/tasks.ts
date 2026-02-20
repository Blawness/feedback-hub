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
            feedback: { select: { id: true, title: true, type: true, agentPrompt: true } },
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



export async function updateTaskStatus(id: string, status: string) {
    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            feedback: true,
            project: true,
        },
    });

    if (!task) return;

    await prisma.task.update({
        where: { id },
        data: { status },
    });

    // If task is moved to done, resolve the associated feedback and sync with GitHub
    if (status === "done" && task.feedbackId && task.feedback) {
        // Update feedback status to RESOLVED
        await prisma.feedback.update({
            where: { id: task.feedbackId },
            data: { status: "RESOLVED" },
        });

        // Sync with GitHub if applicable
        if (task.feedback.githubIssueNumber && task.project.githubRepoFullName) {
            const { syncGitHubIssueState } = await import("@/lib/github-issues");
            await syncGitHubIssueState(
                { githubRepoFullName: task.project.githubRepoFullName },
                task.feedback.githubIssueNumber,
                "RESOLVED"
            );
        }
    }

    revalidatePath("/tasks");
    revalidatePath("/feedback");
}


export async function deleteTask(id: string) {
    try {
        await prisma.task.delete({ where: { id } });
        revalidatePath("/tasks");
    } catch (error: any) {
        if (error.code === "P2025") {
            // Task already deleted, just revalidate to update UI
            revalidatePath("/tasks");
            return;
        }
        throw error;
    }
}

export async function createTaskFromFeedback(feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        select: {
            title: true,
            description: true,
            priority: true,
            projectId: true,
        },
    });

    if (!feedback) {
        throw new Error("Feedback not found");
    }

    const task = await prisma.task.create({
        data: {
            title: feedback.title,
            description: feedback.description,
            priority: feedback.priority,
            projectId: feedback.projectId,
            // Link to the feedback
            feedbackId: feedbackId,
            status: "todo",
        },
    });

    // Update feedback status to ASSIGNED
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: "ASSIGNED" },
    });

    revalidatePath("/feedback");
    revalidatePath("/tasks");
    return { success: true, task };
}
