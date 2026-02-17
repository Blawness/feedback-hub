"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    createGitHubComment,
    fetchGitHubIssueComments,
} from "@/lib/github-issues";

const AddCommentSchema = z.object({
    feedbackId: z.string().min(1),
    content: z.string().min(1, "Comment cannot be empty"),
});

export async function addComment(data: { feedbackId: string; content: string }) {
    const validated = AddCommentSchema.safeParse(data);

    if (!validated.success) {
        return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }

    const { feedbackId, content } = validated.data;

    // Get the current user
    const user = await prisma.user.findFirst();
    if (!user) {
        return { success: false, error: "User not found" };
    }

    // Get the feedback with project info and GitHub issue number
    const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
            project: {
                select: { githubRepoFullName: true },
            },
        },
    });

    if (!feedback) {
        return { success: false, error: "Feedback not found" };
    }

    let githubCommentId: number | null = null;
    let warning: string | null = null;

    // 1. Sync to GitHub first (so we get the comment ID)
    if (feedback.githubIssueNumber && feedback.project.githubRepoFullName) {
        try {
            const result = await createGitHubComment(
                feedback.project,
                feedback.githubIssueNumber,
                content,
                user.name
            );
            if (result) {
                githubCommentId = result.id;
            }
        } catch (error) {
            console.error("GitHub comment sync error:", error);
            warning = "Comment saved locally. Failed to sync to GitHub.";
        }
    }

    // 2. Save to local DB
    const comment = await prisma.comment.create({
        data: {
            content,
            userId: user.id,
            feedbackId,
            githubCommentId,
            isFromGitHub: false,
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });

    revalidatePath(`/feedback/${feedbackId}`);

    return {
        success: true,
        comment,
        warning,
    };
}

/** Sync comments from GitHub to local DB (import new GitHub comments) */
export async function syncGitHubComments(feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
            project: {
                select: { githubRepoFullName: true },
            },
        },
    });

    if (!feedback || !feedback.githubIssueNumber || !feedback.project.githubRepoFullName) {
        return { success: false, synced: 0, error: "No GitHub issue linked" };
    }

    try {
        const githubComments = await fetchGitHubIssueComments(
            feedback.project,
            feedback.githubIssueNumber
        );

        // Get existing github comment IDs to avoid duplicates
        const existingComments = await prisma.comment.findMany({
            where: {
                feedbackId,
                githubCommentId: { not: null },
            },
            select: { githubCommentId: true },
        });

        const existingIds = new Set(existingComments.map((c) => c.githubCommentId));

        // Filter out comments we already have and comments from feedback-hub (avoid loops)
        const newComments = githubComments.filter(
            (gc) =>
                !existingIds.has(gc.id) &&
                !gc.body.includes("commented via Feedback Hub")
        );

        if (newComments.length === 0) {
            return { success: true, synced: 0 };
        }

        // We need a user for GitHub comments — use a system user or first user
        const systemUser = await prisma.user.findFirst();
        if (!systemUser) {
            return { success: false, synced: 0, error: "No user found" };
        }

        // Create comments in batch
        for (const gc of newComments) {
            const authorInfo = gc.user ? `@${gc.user.login}` : "Unknown";
            const content = `**[GitHub - ${authorInfo}]**\n${gc.body}`;

            await prisma.comment.create({
                data: {
                    content,
                    userId: systemUser.id,
                    feedbackId,
                    githubCommentId: gc.id,
                    isFromGitHub: true,
                },
            });
        }

        revalidatePath(`/feedback/${feedbackId}`);

        return { success: true, synced: newComments.length };
    } catch (error) {
        console.error("GitHub comment sync error:", error);
        return { success: false, synced: 0, error: "Failed to fetch GitHub comments" };
    }
}

export async function deleteComment(commentId: string, feedbackId: string) {
    await prisma.comment.delete({ where: { id: commentId } });
    revalidatePath(`/feedback/${feedbackId}`);
    return { success: true };
}
