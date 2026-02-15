import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "Blawness";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string; // e.g., Blawness/feedback-hub
    html_url: string;
    description: string | null;
    homepage: string | null;
    language: string | null;
}

export async function syncGitHubRepos() {
    try {
        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Feedback-Hub-App",
        };

        if (GITHUB_TOKEN) {
            headers.Authorization = `token ${GITHUB_TOKEN}`;
        }

        // Use /user/repos instead of /users/{username}/repos to get private repos when authenticated
        const url = GITHUB_TOKEN
            ? `https://api.github.com/user/repos?per_page=100&sort=updated`
            : `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const repos: GitHubRepo[] = await response.json();
        const syncedProjects: string[] = [];

        for (const repo of repos) {
            // Upsert project based on githubRepoId
            const project = await prisma.project.upsert({
                where: {
                    githubRepoId: repo.id,
                },
                update: {
                    name: repo.name,
                    slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), // Normalize slug
                    description: repo.description,
                    url: repo.homepage || repo.html_url,
                    // Don't update apiKey if exists
                },
                create: {
                    name: repo.name,
                    slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    description: repo.description,
                    url: repo.homepage || repo.html_url,
                    githubRepoId: repo.id,
                    apiKey: `kp_${nanoid(24)}`, // Generate new API key
                },
            });
            syncedProjects.push(project.name);
        }

        return { success: true, count: syncedProjects.length, projects: syncedProjects };
    } catch (error) {
        console.error("Failed to sync GitHub repos:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

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
