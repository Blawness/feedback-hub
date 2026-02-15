"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFeedbacks({
    projectId,
    status,
    priority,
    search,
    page = 1,
    limit = 20,
}: {
    projectId?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    const where = {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: "insensitive" as const } },
                    { description: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {}),
    };

    const [feedbacks, total] = await Promise.all([
        prisma.feedback.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                project: { select: { id: true, name: true, slug: true } },
                assignee: { select: { id: true, name: true, email: true } },
                _count: { select: { comments: true, tasks: true } },
            },
        }),
        prisma.feedback.count({ where }),
    ]);

    return { feedbacks, total, page, limit };
}

export async function createFeedback(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const priority = formData.get("priority") as string;
    const projectId = formData.get("projectId") as string;

    if (!title || !description || !projectId) {
        return { error: "Title, description, and project are required." };
    }

    await prisma.feedback.create({
        data: {
            title,
            description,
            type: type || "bug",
            priority: priority || "medium",
            source: "manual",
            projectId,
        },
    });

    revalidatePath("/feedback");
    return { success: true };
}

export async function updateFeedbackStatus(id: string, status: string) {
    await prisma.feedback.update({
        where: { id },
        data: { status },
    });
    revalidatePath("/feedback");
}

export async function getFeedbackById(id: string) {
    return await prisma.feedback.findUnique({
        where: { id },
        include: {
            project: { select: { id: true, name: true, slug: true } },
            assignee: { select: { id: true, name: true, email: true } },
            comments: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "asc" },
            },
            tasks: {
                select: { id: true, title: true, status: true },
            },
        },
    });
}
