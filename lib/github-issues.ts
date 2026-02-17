"use server";

import { Octokit } from "@octokit/rest";

interface ProjectForGitHub {
    githubRepoFullName: string | null;
}

interface FeedbackForGitHub {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    githubIssueNumber: number | null;
}

interface UserForGitHub {
    name: string;
    email: string;
}

function getOctokit(): Octokit | null {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return null;
    return new Octokit({ auth: token });
}

function parseRepo(fullName: string): { owner: string; repo: string } {
    const [owner, repo] = fullName.split("/");
    return { owner, repo };
}

/** Create a new GitHub issue for a feedback item */
export async function createGitHubIssue(
    project: ProjectForGitHub,
    feedback: FeedbackForGitHub,
    user: UserForGitHub
): Promise<{ number: number; url: string } | null> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName) return null;

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    const body = `**Author:** ${user.name} (${user.email})
**Type:** ${feedback.type}
**Priority:** ${feedback.priority}
**Feedback ID:** ${feedback.id}

${feedback.description}

---
*Created via Feedback Hub*`;

    const issue = await octokit.rest.issues.create({
        owner,
        repo,
        title: `[${feedback.type.toUpperCase()}] ${feedback.title}`,
        body,
        labels: [feedback.type, feedback.priority, "feedback-hub"],
    });

    return { number: issue.data.number, url: issue.data.html_url };
}

/** Update title, body, and labels of an existing GitHub issue */
export async function updateGitHubIssue(
    project: ProjectForGitHub,
    feedback: FeedbackForGitHub
): Promise<boolean> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName || !feedback.githubIssueNumber)
        return false;

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: feedback.githubIssueNumber,
        title: `[${feedback.type.toUpperCase()}] ${feedback.title}`,
        labels: [feedback.type, feedback.priority, "feedback-hub"],
    });

    return true;
}

/** Sync the open/closed state of a GitHub issue based on feedback status */
export async function syncGitHubIssueState(
    project: ProjectForGitHub,
    issueNumber: number,
    feedbackStatus: string
): Promise<boolean> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName) return false;

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    // Map feedback status to GitHub issue state
    const state: "open" | "closed" =
        feedbackStatus === "RESOLVED" || feedbackStatus === "CLOSED"
            ? "closed"
            : "open";

    await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state,
        ...(state === "closed" ? { state_reason: "not_planned" } : { state_reason: "reopened" }),
    } as any);

    return true;
}

/** Close a GitHub issue (used when deleting a feedback) */
export async function closeGitHubIssue(
    project: ProjectForGitHub,
    issueNumber: number
): Promise<boolean> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName) return false;

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: "closed",
        state_reason: "not_planned",
    } as any);

    return true;
}

/** Create a comment on a GitHub issue */
export async function createGitHubComment(
    project: ProjectForGitHub,
    issueNumber: number,
    body: string,
    authorName?: string
): Promise<{ id: number } | null> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName) return null;

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    const commentBody = authorName
        ? `**${authorName}** commented via Feedback Hub:\n\n${body}`
        : body;

    const comment = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: commentBody,
    });

    return { id: comment.data.id };
}

export interface GitHubCommentData {
    id: number;
    body: string;
    user: {
        login: string;
        avatar_url: string;
    } | null;
    created_at: string;
    updated_at: string;
}

/** Fetch all comments from a GitHub issue */
export async function fetchGitHubIssueComments(
    project: ProjectForGitHub,
    issueNumber: number
): Promise<GitHubCommentData[]> {
    const octokit = getOctokit();
    if (!octokit || !project.githubRepoFullName) return [];

    const { owner, repo } = parseRepo(project.githubRepoFullName);

    const { data } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100,
    });

    return data.map((c) => ({
        id: c.id,
        body: c.body ?? "",
        user: c.user
            ? { login: c.user.login, avatar_url: c.user.avatar_url }
            : null,
        created_at: c.created_at,
        updated_at: c.updated_at,
    }));
}
