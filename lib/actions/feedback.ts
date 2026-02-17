"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeFeedback } from "@/lib/actions/ai";
import {
    createGitHubIssue,
    updateGitHubIssue,
    syncGitHubIssueState,
    closeGitHubIssue,
} from "@/lib/github-issues";
import { Prisma } from "@prisma/client";

const FeedbackSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    type: z.enum(["bug", "feature", "improvement", "question"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    projectId: z.string(),
    agentPrompt: z.string().optional(),
});

export type FeedbackFormData = z.infer<typeof FeedbackSchema>;

export type FeedbackWithRelations = Prisma.FeedbackGetPayload<{
    include: {
        project: { select: { id: true; name: true; slug: true } };
        assignee: { select: { id: true; name: true; email: true } };
        _count: { select: { comments: true; tasks: true } };
    };
}>;

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
    const where: Prisma.FeedbackWhereInput = {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status: status as any } : {}),
        ...(priority ? { priority } : {}),
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
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

    return { feedbacks: feedbacks as FeedbackWithRelations[], total, page, limit };
}

export async function createFeedback(data: FeedbackFormData) {
    const validatedFields = FeedbackSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, error: "Invalid fields" };
    }

    const { title, description, type, priority, projectId, agentPrompt } = validatedFields.data;

    const user = await prisma.user.findFirst();
    if (!user) {
        return { success: false, error: "User not found" };
    }

    // Get the project to resolve GitHub repo dynamically
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { githubRepoFullName: true },
    });

    // 1. Create Feedback in DB
    const feedback = await prisma.feedback.create({
        data: {
            title,
            description,
            type,
            priority,
            projectId,
            source: "webapp",
            status: "OPEN",
            assigneeId: user.id,
            agentPrompt: agentPrompt || null,
        },
    });

    let githubIssueNumber: number | null = null;
    let githubUrl: string | null = null;
    let warning: string | null = null;

    // 2. Sync to GitHub (dynamic repo)
    try {
        if (project?.githubRepoFullName) {
            const result = await createGitHubIssue(
                project,
                { ...feedback, githubIssueNumber: null },
                user
            );

            if (result) {
                githubIssueNumber = result.number;
                githubUrl = result.url;

                await prisma.feedback.update({
                    where: { id: feedback.id },
                    data: { githubIssueNumber, githubUrl },
                });
            }
        } else {
            warning = "Project not linked to a GitHub repo. Saved locally only.";
        }
    } catch (error) {
        console.error("GitHub Sync Error:", error);
        warning = "Failed to sync with GitHub. Saved locally.";
    }

    // 3. AI Analysis (non-blocking)
    try {
        const analysis = await analyzeFeedback(title, description);
        if (analysis) {
            await prisma.feedback.update({
                where: { id: feedback.id },
                data: {
                    aiSummary: analysis.summary,
                    aiSuggestedType: analysis.suggestedType,
                    aiSuggestedPriority: analysis.suggestedPriority,
                    aiConfidence: analysis.confidence,
                    agentPrompt: analysis.suggestedAgentPrompt || feedback.agentPrompt,
                } as any,
            });
        }
    } catch (error) {
        console.error("AI analysis failed (non-blocking):", error);
    }

    revalidatePath("/feedback");

    return {
        success: true,
        feedbackId: feedback.id,
        githubIssueNumber,
        githubUrl,
        warning,
    };
}

export async function updateFeedback(id: string, data: FeedbackFormData) {
    const validatedFields = FeedbackSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, error: "Invalid fields" };
    }

    const { title, description, type, priority, projectId, agentPrompt } = validatedFields.data;

    // 1. Update in DB
    const feedback = await prisma.feedback.update({
        where: { id },
        data: {
            title,
            description,
            type,
            priority,
            projectId,
            agentPrompt: agentPrompt || null,
        },
        include: {
            project: { select: { githubRepoFullName: true } },
        },
    });

    let warning: string | null = null;

    // 2. Sync to GitHub
    try {
        await updateGitHubIssue(feedback.project, {
            ...feedback,
            githubIssueNumber: feedback.githubIssueNumber,
        });
    } catch (error) {
        console.error("GitHub Update Error:", error);
        warning = "Updated locally. GitHub sync failed.";
    }

    revalidatePath("/feedback");
    return { success: true, warning };
}

export async function deleteFeedback(id: string) {
    // Fetch feedback with project info before deleting
    const feedback = await prisma.feedback.findUnique({
        where: { id },
        include: {
            project: { select: { githubRepoFullName: true } },
        },
    });

    // Close the GitHub issue if it exists
    if (feedback?.githubIssueNumber && feedback.project.githubRepoFullName) {
        try {
            await closeGitHubIssue(feedback.project, feedback.githubIssueNumber);
        } catch (error) {
            console.error("GitHub close error (non-blocking):", error);
        }
    }

    await prisma.feedback.delete({ where: { id } });

    revalidatePath("/feedback");
    return { success: true };
}


export async function updateFeedbackStatus(id: string, status: string) {
    const feedback = await prisma.feedback.update({
        where: { id },
        data: { status: status.toUpperCase() as any },
        include: {
            project: { select: { githubRepoFullName: true } },
        },
    });

    // Sync GitHub issue state (open/closed)
    if (feedback.githubIssueNumber) {
        try {
            await syncGitHubIssueState(
                feedback.project,
                feedback.githubIssueNumber,
                status.toUpperCase()
            );
        } catch (error) {
            console.error("GitHub status sync error (non-blocking):", error);
        }
    }

    revalidatePath("/feedback");
    revalidatePath(`/feedback/${id}`);
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
