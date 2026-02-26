"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
    Calendar,
    User,
    FolderGit2,
    Link as LinkIcon,
    Tag,
    AlertCircle,
    Bot,
    Copy,
    Check,
    Terminal,
    Wand2,
    GitFork,
    Zap,
    Clock,
    Timer,
    CheckCircle2,
    Loader2,
    Sparkles,
    FileText,
} from "lucide-react";
import type { Task } from "./task-board";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskAIChat } from "./task-ai-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    estimateTask,
    applyEstimation,
    generateTaskBreakdown,
    summarizeTaskDiscussion,
    updateTaskTimeTracking,
} from "@/lib/actions/ai-tasks";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface TaskPreviewDialogProps {
    task: Task;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TaskPreviewDialog({ task, trigger, open, onOpenChange }: TaskPreviewDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [estimation, setEstimation] = useState<{
        storyPoints: number;
        estimatedHours: number;
        reasoning: string;
    } | null>(null);
    const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [isBreakingDown, setIsBreakingDown] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Time tracking local state
    const [storyPoints, setStoryPoints] = useState<string>(
        task.storyPoints?.toString() ?? ""
    );
    const [estimatedHours, setEstimatedHours] = useState<string>(
        task.estimatedHours?.toString() ?? ""
    );
    const [actualHours, setActualHours] = useState<string>(
        task.actualHoursSpent?.toString() ?? ""
    );

    async function handleEstimate() {
        setIsEstimating(true);
        try {
            const result = await estimateTask(task.id);
            if (result.success && result.estimation) {
                setEstimation(result.estimation);
                setStoryPoints(result.estimation.storyPoints.toString());
                setEstimatedHours(result.estimation.estimatedHours.toString());
                toast.success("AI estimation generated!");
            } else {
                toast.error(result.error || "Failed to estimate.");
            }
        } catch {
            toast.error("Failed to estimate task.");
        } finally {
            setIsEstimating(false);
        }
    }

    async function handleApplyEstimation() {
        if (!estimation) return;
        startTransition(async () => {
            await applyEstimation(task.id, estimation.storyPoints, estimation.estimatedHours);
            toast.success("Estimation applied!");
        });
    }

    async function handleBreakdown() {
        setIsBreakingDown(true);
        try {
            const result = await generateTaskBreakdown(task.id);
            if (result.success && result.subtasks) {
                setSubtasks(result.subtasks.map(s => ({ id: s.id, title: s.title })));
                toast.success(`${result.subtasks.length} subtasks created!`);
            } else {
                toast.error(result.error || "Failed to break down task.");
            }
        } catch {
            toast.error("Failed to generate subtask breakdown.");
        } finally {
            setIsBreakingDown(false);
        }
    }

    async function handleSummarize() {
        setIsSummarizing(true);
        try {
            const result = await summarizeTaskDiscussion(task.id);
            if (result.success && result.summary) {
                setSummary(result.summary);
            } else {
                toast.error(result.error || "No discussion to summarize.");
            }
        } catch {
            toast.error("Failed to summarize discussion.");
        } finally {
            setIsSummarizing(false);
        }
    }

    async function handleSaveTimeTracking() {
        startTransition(async () => {
            await updateTaskTimeTracking(task.id, {
                storyPoints: storyPoints ? parseInt(storyPoints) : null,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                actualHoursSpent: actualHours ? parseFloat(actualHours) : null,
            });
            toast.success("Time tracking updated!");
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="w-full max-w-5xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold leading-tight">
                                {task.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="capitalize">
                                    {task.status.replace("_", " ")}
                                </Badge>
                                <span className="text-xs">•</span>
                                <span className="text-xs">Created {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                                {task.storyPoints != null && (
                                    <>
                                        <span className="text-xs">•</span>
                                        <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                            <Zap className="h-3 w-3 mr-1" />
                                            {task.storyPoints} SP
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 mb-4">
                        <TabsTrigger
                            value="details"
                            className="relative rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="ai-chat"
                            className="relative rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 group"
                        >
                            <span className="flex items-center gap-1.5">
                                <Bot className="h-3.5 w-3.5 group-data-[state=active]:text-violet-500" />
                                AI Assistant
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                        <ScrollArea className="h-full">
                            <div className="grid gap-6 p-1 pr-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium leading-none">Description</h4>
                                    <div className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                        {task.description || "No description provided."}
                                    </div>
                                </div>

                                {/* Meta Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <FolderGit2 className="h-3 w-3" /> Project
                                        </label>
                                        <p className="text-sm font-medium">{task.project.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" /> Assignee
                                        </label>
                                        <p className="text-sm font-medium">
                                            {task.assignee?.name || "Unassigned"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Priority
                                        </label>
                                        <p className="text-sm font-medium capitalize">{task.priority}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Due Date
                                        </label>
                                        <p className="text-sm font-medium">
                                            {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                                        </p>
                                    </div>
                                </div>

                                {/* Time Tracking & Estimation */}
                                <div className="space-y-3">
                                    <Separator />
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Timer className="h-3.5 w-3.5 text-blue-500" />
                                                Time Tracking & Estimation
                                            </h4>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleEstimate}
                                                    disabled={isEstimating}
                                                    className="h-7 text-xs gap-1"
                                                >
                                                    {isEstimating ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Wand2 className="h-3 w-3 text-violet-500" />
                                                    )}
                                                    AI Estimate
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSaveTimeTracking}
                                                    disabled={isPending}
                                                    className="h-7 text-xs gap-1"
                                                >
                                                    {isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    )}
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                    <Zap className="h-3 w-3" /> Story Points
                                                </label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    placeholder="—"
                                                    value={storyPoints}
                                                    onChange={(e) => setStoryPoints(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Est. Hours
                                                </label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.5}
                                                    placeholder="—"
                                                    value={estimatedHours}
                                                    onChange={(e) => setEstimatedHours(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Actual Hours
                                                </label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.5}
                                                    placeholder="—"
                                                    value={actualHours}
                                                    onChange={(e) => setActualHours(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        {estimation && (
                                            <div className="mt-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                                                        <Sparkles className="h-3.5 w-3.5" /> AI Estimation
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleApplyEstimation}
                                                        disabled={isPending}
                                                        className="h-6 text-xs text-violet-700 dark:text-violet-300 hover:text-violet-900"
                                                    >
                                                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply & Save"}
                                                    </Button>
                                                </div>
                                                <div className="flex gap-4 text-xs">
                                                    <span><strong>{estimation.storyPoints}</strong> Story Points</span>
                                                    <span><strong>{estimation.estimatedHours}</strong> hours</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{estimation.reasoning}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Task Breakdown */}
                                <div className="space-y-3">
                                    <Separator />
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <GitFork className="h-3.5 w-3.5 text-indigo-500" />
                                                Subtasks
                                                {(task._count?.subtasks > 0 || subtasks.length > 0) && (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {task._count?.subtasks + subtasks.length}
                                                    </Badge>
                                                )}
                                            </h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleBreakdown}
                                                disabled={isBreakingDown}
                                                className="h-7 text-xs gap-1"
                                            >
                                                {isBreakingDown ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Wand2 className="h-3 w-3 text-indigo-500" />
                                                )}
                                                AI Breakdown
                                            </Button>
                                        </div>
                                        {subtasks.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {subtasks.map((sub) => (
                                                    <div
                                                        key={sub.id}
                                                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {sub.title}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : task._count?.subtasks === 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                No subtasks yet. Use &quot;AI Breakdown&quot; to automatically generate them.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                {/* AI Discussion Summary */}
                                <div className="space-y-3">
                                    <Separator />
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5 text-amber-500" />
                                                Discussion Summary
                                            </h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSummarize}
                                                disabled={isSummarizing}
                                                className="h-7 text-xs gap-1"
                                            >
                                                {isSummarizing ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                                )}
                                                AI Summarize
                                            </Button>
                                        </div>
                                        {summary ? (
                                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{summary}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Click &quot;AI Summarize&quot; to get a summary of all comments and chat discussions.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Feedback Link */}
                                {task.feedback && (
                                    <div className="space-y-2">
                                        <Separator />
                                        <div className="pt-2">
                                            <h4 className="text-sm font-medium mb-2">Linked Feedback</h4>
                                            <div className="rounded-md border p-3 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {task.feedback.type}
                                                        </Badge>
                                                        <span className="text-sm font-medium truncate max-w-[300px]">
                                                            {task.feedback.title}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={`/feedback/${task.feedback.id}`} className="gap-1 text-xs">
                                                        View <LinkIcon className="h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Coding Agent Prompt */}
                                {task.feedback?.agentPrompt && (
                                    <div className="space-y-2">
                                        <Separator />
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium flex items-center gap-2">
                                                    <Terminal className="h-3.5 w-3.5 text-violet-500" />
                                                    Agent Prompt
                                                </h4>
                                                <CopyButton text={task.feedback.agentPrompt} />
                                            </div>
                                            <div className="rounded-md bg-zinc-950 text-zinc-50 p-3 text-xs font-mono whitespace-pre-wrap border border-zinc-800">
                                                {task.feedback.agentPrompt}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* GitHub Link */}
                                {task.githubUrl && (
                                    <div className="space-y-2">
                                        <Separator />
                                        <div className="pt-2">
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <FolderGit2 className="h-3.5 w-3.5" /> GitHub Issue
                                            </h4>
                                            <a
                                                href={task.githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                #{task.githubIssueNumber} <LinkIcon className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="ai-chat" className="flex-1 overflow-hidden mt-0 h-full min-h-0">
                        <TaskAIChat taskId={task.id} taskTitle={task.title} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy to clipboard"
        >
            {copied ? (
                <Check className="h-3 w-3 text-green-500" />
            ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
            )}
        </Button>
    );
}
