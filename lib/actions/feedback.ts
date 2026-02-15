"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

const FeedbackSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    type: z.enum(["bug", "feature", "improvement", "question"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    projectId: z.string(),
});

export type FeedbackFormData = z.infer<typeof FeedbackSchema>;

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

export async function createFeedback(data: FeedbackFormData) {
    const validatedFields = FeedbackSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, error: "Invalid fields" };
    }

    const { title, description, type, priority, projectId } = validatedFields.data;

    // Fetch user (Mocking for now as we don't have auth context passed)
    // In real app: const session = await auth(); const userId = session?.user?.id;
    const user = await prisma.user.findFirst();
    if (!user) {
        return { success: false, error: "User not found" };
    }

    // 1. Create Feedback in DB (Pending Sync)
    const feedback = await prisma.feedback.create({
        data: {
            title,
            description,
            type,
            priority,
            projectId,
            source: "webapp",
            status: "OPEN",
            assigneeId: user.id
        },
    });

    let githubIssueNumber: number | null = null;
    let githubUrl: string | null = null;
    let warning: string | null = null;

    // 2. Sync to GitHub
    try {
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_USERNAME || "Blawness";
        const repo = "feedback-hub"; // Should be dynamic based on project

        if (token) {
            const octokit = new Octokit({ auth: token });

            const bodyContent = `
**Author:** ${user.name} (${user.email})
**Type:** ${type}
**Priority:** ${priority}
**Feedback ID:** ${feedback.id}

${description}

---
*Created via Feedback Hub*
        `;

            const issue = await octokit.rest.issues.create({
                owner,
                repo,
                title: `[${type.toUpperCase()}] ${title}`,
                body: bodyContent,
                labels: [type, priority, "feedback-hub"],
            });

            githubIssueNumber = issue.data.number;
            githubUrl = issue.data.html_url;

            // 3. Update DB on Success
            await prisma.feedback.update({
                where: { id: feedback.id },
                data: {
                    githubIssueNumber,
                    githubUrl
                }
            });
        } else {
            warning = "GitHub token not configured. Saved locally only.";
        }

    } catch (error) {
        console.error("GitHub Sync Error:", error);
        warning = "Failed to sync with GitHub. Saved locally.";
    }

    revalidatePath("/feedback");

    return {
        success: true,
        feedbackId: feedback.id,
        githubIssueNumber,
        githubUrl,
        warning
    };
}

export async function updateFeedback(id: string, data: FeedbackFormData) {
    const validatedFields = FeedbackSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, error: "Invalid fields" };
    }

    const { title, description, type, priority, projectId } = validatedFields.data;

    // 1. Update in DB
    const feedback = await prisma.feedback.update({
        where: { id },
        data: {
            title,
            description,
            type,
            priority,
            projectId,
        },
    });

    let warning: string | null = null;

    // 2. Sync to GitHub (if linked)
    if (feedback.githubIssueNumber) {
        try {
            const token = process.env.GITHUB_TOKEN;
            const owner = process.env.GITHUB_USERNAME || "Blawness";
            const repo = "feedback-hub";

            if (token) {
                const octokit = new Octokit({ auth: token });

                // Update Issue Title and Body (we append a note about the update?)
                // Actually, replacing body might be aggressive if we want to keep history.
                // But for sync, let's just update title and labels. User might edit body on GH side.
                // Let's stick to updating basic fields.

                await octokit.rest.issues.update({
                    owner,
                    repo,
                    issue_number: feedback.githubIssueNumber,
                    title: `[${type.toUpperCase()}] ${title}`,
                    // body: description, // Optional: might overwrite comments or manual edits on GH. Let's start with just Title/Labels.
                    labels: [type, priority, "feedback-hub"],
                });
            }
        } catch (error) {
            console.error("GitHub Update Error:", error);
            warning = "Updated locally. GitHub sync failed.";
        }
    }

    revalidatePath("/feedback");
    return { success: true, warning };
}

export async function deleteFeedback(id: string) {
    // 1. Delete from DB
    await prisma.feedback.delete({
        where: { id },
    });

    // 2. GitHub Sync?
    // We generally don't delete issues on GH automatically to preserve history/context unless explicitly requested.
    // We could close it?
    // For now, doing nothing on GitHub side as agreed in plan.

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
