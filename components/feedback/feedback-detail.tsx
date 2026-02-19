"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Bug,
    Lightbulb,
    HelpCircle,
    Zap,
    Clock,
    Loader2,
    User,
    FolderGit2,
    Sparkles,
    Github,
    ExternalLink,
    ClipboardList,
    Bot,
    Target,
    BarChart3,
    MessageSquareQuote,
    Copy,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { updateFeedbackStatus } from "@/lib/actions/feedback";
import { createTaskFromFeedback } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { AIBadge } from "@/components/ai/ai-badge";
import { CommentForm } from "@/components/feedback/comment-form";
import { SyncGitHubCommentsButton } from "@/components/feedback/sync-github-comments-button";

const TYPE_ICONS: Record<string, React.ReactNode> = {
    bug: <Bug className="h-5 w-5 text-red-500" />,
    feature: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    improvement: <Zap className="h-5 w-5 text-blue-500" />,
    question: <HelpCircle className="h-5 w-5 text-purple-500" />,
};

interface FeedbackDetailProps {
    feedback: {
        id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        source: string;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
        project: { id: string; name: string; slug: string };
        assignee: { id: string; name: string; email: string } | null;
        comments: {
            id: string;
            content: string;
            createdAt: Date;
            isFromGitHub?: boolean;
            user: { id: string; name: string; email: string };
        }[];
        tasks: { id: string; title: string; status: string }[];
        aiSummary?: string | null;
        aiSuggestedType?: string | null;
        aiSuggestedPriority?: string | null;
        aiConfidence?: number | null;
        agentPrompt?: string | null;
        githubIssueNumber?: number | null;
        githubUrl?: string | null;
    };
}

// Force hydration update
export function FeedbackDetail({ feedback }: FeedbackDetailProps) {
    const [isPending, startTransition] = useTransition();

    function handleStatusChange(newStatus: string) {
        startTransition(async () => {
            await updateFeedbackStatus(feedback.id, newStatus);
        });
    }

    const [isCreatingTask, setIsCreatingTask] = useState(false);

    async function handleCreateTask() {
        if (isCreatingTask) return;

        setIsCreatingTask(true);
        try {
            await createTaskFromFeedback(feedback.id);
            toast.success("Task created successfully");
        } catch (error) {
            toast.error("Failed to create task");
        } finally {
            setIsCreatingTask(false);
        }
    }

    const copyId = async () => {
        await navigator.clipboard.writeText(feedback.id);
        toast.success("Feedback ID copied");
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/feedback" className="hover:text-foreground hover:underline flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" />
                            Feedback
                        </Link>
                        <span>/</span>
                        <span className="font-mono text-xs">{feedback.id.substring(0, 8)}...</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={copyId}
                            title="Copy Feedback ID"
                        >
                            <Copy className="h-2.5 w-2.5" />
                            <span className="sr-only">Copy ID</span>
                        </Button>
                    </div>
                    <div className="flex items-start gap-3">
                        {TYPE_ICONS[feedback.type] || <Bug className="h-6 w-6 text-muted-foreground" />}
                        <h1 className="text-2xl font-bold tracking-tight">{feedback.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={feedback.status === "OPEN" ? "default" : "secondary"} className="capitalize">
                        {feedback.status}
                    </Badge>
                    <AIBadge
                        aiSummary={feedback.aiSummary}
                        aiSuggestedType={feedback.aiSuggestedType}
                        aiSuggestedPriority={feedback.aiSuggestedPriority}
                        aiConfidence={feedback.aiConfidence}
                    />
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description Card */}
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {format(new Date(feedback.createdAt), "PPP p")}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 capitalize">
                                    via {feedback.source}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                                {feedback.description}
                            </div>

                            {Boolean(feedback.metadata) && (
                                <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Metadata</h4>
                                    <pre className="text-xs font-mono overflow-auto">
                                        {JSON.stringify(feedback.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Analysis Card */}
                    {(feedback.aiSummary || feedback.agentPrompt) && (
                        <Card className="bg-violet-50/50 dark:bg-violet-950/10 border-violet-100 dark:border-violet-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-violet-700 dark:text-violet-300">
                                    <Bot className="h-4 w-4" />
                                    AI Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-1 rounded-md bg-white/50 dark:bg-black/20 p-2.5">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Target className="h-3.5 w-3.5" /> Suggested Type
                                        </label>
                                        <p className="text-sm font-semibold capitalize pl-5">
                                            {feedback.aiSuggestedType || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1 rounded-md bg-white/50 dark:bg-black/20 p-2.5">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Zap className="h-3.5 w-3.5" /> Suggested Priority
                                        </label>
                                        <p className="text-sm font-semibold capitalize pl-5">
                                            {feedback.aiSuggestedPriority || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1 rounded-md bg-white/50 dark:bg-black/20 p-2.5">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <BarChart3 className="h-3.5 w-3.5" /> Confidence
                                        </label>
                                        <p className="text-sm font-semibold pl-5">
                                            {feedback.aiConfidence
                                                ? `${Math.round(feedback.aiConfidence * 100)}%`
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {feedback.aiSummary && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Analysis Summary
                                        </label>
                                        <div className="text-sm leading-relaxed p-3 rounded-md border border-violet-100 dark:border-violet-900/50 bg-white/50 dark:bg-black/20">
                                            {feedback.aiSummary}
                                        </div>
                                    </div>
                                )}

                                {feedback.agentPrompt && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <MessageSquareQuote className="h-3.5 w-3.5" /> Agent Prompt
                                        </label>
                                        <div className="rounded-md bg-muted/50 p-3 border">
                                            <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground overflow-auto max-h-[150px]">
                                                {feedback.agentPrompt}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}



                    {/* Comments Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <MessageSquareQuote className="h-4 w-4" />
                                Comments
                                <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0.5 text-xs font-normal">
                                    {feedback.comments.length}
                                </Badge>
                            </CardTitle>
                            <SyncGitHubCommentsButton
                                feedbackId={feedback.id}
                                hasGitHubIssue={Boolean(feedback.githubIssueNumber)}
                            />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {feedback.comments.map((comment) => (
                                <div key={comment.id} className="group flex gap-4">
                                    <div className={`flex-shrink-0 h-8 w-8 items-center justify-center rounded-full text-xs font-medium ring-2 ring-background ${comment.isFromGitHub
                                        ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                        : "bg-primary text-primary-foreground"
                                        }`}>
                                        {comment.isFromGitHub ? (
                                            <Github className="h-4 w-4" />
                                        ) : (
                                            comment.user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                {comment.user.name}
                                            </span>
                                            {comment.isFromGitHub && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 font-normal">
                                                    <Github className="h-2.5 w-2.5" />
                                                    GitHub
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {feedback.comments.length === 0 && (
                                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No comments yet. Start the conversation!
                                </div>
                            )}

                            <Separator />
                            <CommentForm feedbackId={feedback.id} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Status</label>
                                <Select
                                    value={feedback.status.toLowerCase()}
                                    onValueChange={handleStatusChange}
                                    disabled={isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed" disabled={feedback.status === "ASSIGNED"}>Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">Priority</label>
                                    <div className="text-sm font-medium capitalize flex items-center gap-2">
                                        {feedback.priority === 'high' || feedback.priority === 'critical' ? (
                                            <Badge variant="destructive" className="capitalize">{feedback.priority}</Badge>
                                        ) : (
                                            <span className="capitalize">{feedback.priority}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">Type</label>
                                    <div className="text-sm capitalize flex items-center gap-2">
                                        {TYPE_ICONS[feedback.type]}
                                        {feedback.type}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <FolderGit2 className="h-3.5 w-3.5" /> Project
                                    </span>
                                    <span className="font-medium truncate max-w-[120px]" title={feedback.project.name}>
                                        {feedback.project.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" /> Assignee
                                    </span>
                                    <span className="font-medium">
                                        {feedback.assignee?.name || "Unassigned"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Manual Task Creation */}
                            <Button
                                onClick={handleCreateTask}
                                className="w-full gap-2 justify-start"
                                variant="outline"
                                disabled={isCreatingTask || feedback.tasks.length > 0}
                            >
                                {isCreatingTask ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : feedback.tasks.length > 0 ? (
                                    <ClipboardList className="h-4 w-4 text-green-500" />
                                ) : (
                                    <ClipboardList className="h-4 w-4" />
                                )}
                                {isCreatingTask
                                    ? "Creating Task..."
                                    : feedback.tasks.length > 0
                                        ? "Task Already Exists"
                                        : "Create Task manually"}
                            </Button>



                            {/* GitHub Issue Link */}
                            {feedback.githubIssueNumber && feedback.githubUrl ? (
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="w-full gap-2 justify-start"
                                >
                                    <a
                                        href={feedback.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Github className="h-4 w-4" />
                                        <span>View Issue #{feedback.githubIssueNumber}</span>
                                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    Not synced to GitHub
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {feedback.tasks.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Linked Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {feedback.tasks.map((task) => (
                                    <Link key={task.id} href={`/tasks?taskId=${task.id}`} className="block">
                                        <div className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/50 transition-colors">
                                            <span className="text-sm font-medium truncate max-w-[140px]">{task.title}</span>
                                            <Badge variant="outline" className="text-[10px] capitalize px-1.5 h-5">
                                                {task.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
