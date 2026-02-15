"use server";

import { prisma } from "@/lib/prisma";
import { syncGitHubRepos } from "@/lib/github";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export async function getProjects() {
    return await prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            _count: {
                select: { feedbacks: true, tasks: true },
            },
        },
    });
}

export async function syncProjects() {
    const result = await syncGitHubRepos();
    revalidatePath("/projects");
    return result;
}

export async function toggleProjectActive(id: string, isActive: boolean) {
    await prisma.project.update({
        where: { id },
        data: { isActive },
    });
    revalidatePath("/projects");
}

export async function regenerateApiKey(id: string) {
    const newKey = `fhk_${nanoid(24)}`;
    await prisma.project.update({
        where: { id },
        data: { apiKey: newKey },
    });
    revalidatePath("/projects");
    return newKey;
}

export async function getDashboardStats() {
    const [projectCount, feedbackCount, taskCount, recentFeedbacks, activeProjects] = await Promise.all([
        prisma.project.count({ where: { isActive: true } }),
        prisma.feedback.count({ where: { status: { not: "resolved" } } }),
        prisma.task.count({ where: { status: { not: "done" } } }),
        prisma.feedback.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                project: { select: { name: true } },
            },
        }),
        prisma.project.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    ]);

    return { projectCount, feedbackCount, taskCount, recentFeedbacks, activeProjects };
}
