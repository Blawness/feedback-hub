"use client";

import { useState, useTransition, useEffect } from "react";
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
    const [localProjects, setLocalProjects] = useState<Project[]>(projects);
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalProjects(projects);
        setHasChanges(false);
    }, [projects]);

    // Sync local state when props change (e.g. after save/revalidate)
    // using a key on the parent or effect could work, but key is cleaner. 
    // However, since we are inside the component, let's just use an effect or key.
    // Actually, simpler: when `projects` prop updates, we should update `localProjects` IF not editing?
    // The standard way is key-ing the component, but here we can just reset verify. 
    // Let's use useEffect to reset local state when prop projects changes (deep comparison or just ref).
    // For now, let's trust that revalidatePath will re-render this component with new props
    // and we can re-initialize state if we use a key on the parent logic, 
    // OR we just use useEffect.

    // Better yet, just use `useEffect` to sync:
    // useEffect(() => { setLocalProjects(projects); setHasChanges(false); }, [projects]);

    // Actually, let's keep it simple. The user clicks Save, server action runs, revalidatePath runs, 
    // page re-renders, new projects prop comes in. 
    // We need to ensure that localProjects is updated.

    // Let's use a key in the page.tsx or just useEffect here. useTransition handles the pending state.

    // Let's use useEffect.
    /* useEffect(() => {
        setLocalProjects(projects);
        setHasChanges(false);
    }, [projects]); */
    // The above is risky if user is editing and a background sync happens. 
    // But sync is manual. So it should be fine.

    // Actually, React recommends `key` to reset state. 
    // But I can't easily change the parent `page.tsx` key without another file edit.
    // So I will use `useEffect`.

    // Re-import useEffect. 
    // Note: The previous imports need to be preserved or re-written properly.
    // I am rewriting the whole component body so I can add useEffect easily.

    function handleSync() {
        startTransition(async () => {
            const res = await syncProjects();
            // Optional: toast result
            if (res.success) {
                // projects prop will update via revalidatePath
            }
        });
    }

    function handleToggle(id: string, active: boolean) {
        setLocalProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isActive: active } : p))
        );
        setHasChanges(true);
    }

    function handleSave() {
        startTransition(async () => {
            const idsToEnable = localProjects
                .filter((p) => p.isActive && !projects.find(op => op.id === p.id)?.isActive)
                .map((p) => p.id);

            const idsToDisable = localProjects
                .filter((p) => !p.isActive && projects.find(op => op.id === p.id)?.isActive)
                .map((p) => p.id);

            // Also include projects that might have been new but we just want to ensure state matches local
            // Although the logic above only captures *changes*. 
            // If we want to be robust, we can just send all enabled and all disabled, 
            // but the server action expects lists to update.
            // Let's stick to diffs to be efficient, or just send all IsActive=true IDs?
            // The user said "save settingannya". 
            // Sending diffs is better.

            await import('@/lib/actions/projects').then(mod =>
                mod.bulkUpdateProjectStatus(idsToEnable, idsToDisable)
            );

            setHasChanges(false);
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
            <div className="flex justify-end gap-2">
                {hasChanges && (
                    <Button onClick={handleSave} disabled={isPending} variant="default">
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                )}
                <Button onClick={handleSync} disabled={isPending} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                    {isPending ? "Syncing..." : "Sync from GitHub"}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {localProjects.map((project) => (
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

                {localProjects.length === 0 && (
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
