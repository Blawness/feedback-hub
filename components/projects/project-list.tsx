"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    KeyRound,
    GitBranch,
    Bug,
    CheckSquare,
} from "lucide-react";
import {
    syncProjects,
    toggleProjectActive,
    regenerateApiKey,
} from "@/lib/actions/projects";

interface Project {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    url: string | null;
    apiKey: string;
    isActive: boolean;
    githubRepoId: number | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { feedbacks: number; tasks: number };
}

export function ProjectList({ projects }: { projects: Project[] }) {
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    function handleSync() {
        startTransition(async () => {
            await syncProjects();
        });
    }

    function handleToggle(id: string, active: boolean) {
        startTransition(async () => {
            await toggleProjectActive(id, active);
        });
    }

    async function handleCopyKey(id: string, key: string) {
        await navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    function handleRegenKey(id: string) {
        startTransition(async () => {
            await regenerateApiKey(id);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleSync} disabled={isPending}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                    {isPending ? "Syncing..." : "Sync from GitHub"}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id} className={!project.isActive ? "opacity-60" : ""}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {project.githubRepoId && (
                                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        {project.name}
                                    </CardTitle>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                                <Switch
                                    checked={project.isActive}
                                    onCheckedChange={(checked) =>
                                        handleToggle(project.id, checked)
                                    }
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3 text-sm">
                                <Badge variant="outline" className="gap-1">
                                    <Bug className="h-3 w-3" />
                                    {project._count.feedbacks} feedback
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    {project._count.tasks} tasks
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <KeyRound className="h-3 w-3" /> API Key
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">
                                        {project.apiKey}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                            handleCopyKey(project.id, project.apiKey)
                                        }
                                    >
                                        {copiedId === project.id ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleRegenKey(project.id)}
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {project.url && (
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Visit site
                                </a>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <GitBranch className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click &quot;Sync from GitHub&quot; to import your repositories.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
