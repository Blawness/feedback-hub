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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { updateFeedbackStatus } from "@/lib/actions/feedback";
import { createTaskFromFeedback } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { AISuggestedReply } from "@/components/feedback/ai-suggested-reply";
import { AIConvertTaskButton } from "@/components/feedback/ai-convert-task-button";
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

export function FeedbackDetail({ feedback }: FeedbackDetailProps) {
    const [isPending, startTransition] = useTransition();

    function handleStatusChange(newStatus: string) {
        startTransition(async () => {
            await updateFeedbackStatus(feedback.id, newStatus);
        });
    }

    async function handleCreateTask() {
        try {
            await createTaskFromFeedback(feedback.id);
            toast.success("Task created successfully");
        } catch (error) {
            toast.error("Failed to create task");
        }
    }

    return (
        <>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/feedback">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                {TYPE_ICONS[feedback.type] || <Bug className="h-5 w-5" />}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-xl">{feedback.title}</CardTitle>
                                        <AIBadge
                                            aiSummary={feedback.aiSummary}
                                            aiSuggestedType={feedback.aiSuggestedType}
                                            aiSuggestedPriority={feedback.aiSuggestedPriority}
                                            aiConfidence={feedback.aiConfidence}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(feedback.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                        <span>·</span>
                                        <span className="capitalize">via {feedback.source}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {feedback.description}
                            </p>

                            {Boolean(feedback.metadata) && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Metadata</h4>
                                        <pre className="rounded bg-muted p-3 text-xs overflow-auto">
                                            {JSON.stringify(feedback.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Comments ({feedback.comments.length})</CardTitle>
                                <SyncGitHubCommentsButton
                                    feedbackId={feedback.id}
                                    hasGitHubIssue={Boolean(feedback.githubIssueNumber)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {feedback.comments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No comments yet. Be the first to comment!
                                </p>
                            )}
                            {feedback.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${comment.isFromGitHub
                                        ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                        : "bg-primary text-primary-foreground"
                                        }`}>
                                        {comment.isFromGitHub ? (
                                            <Github className="h-4 w-4" />
                                        ) : (
                                            comment.user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {comment.user.name}
                                            </span>
                                            {comment.isFromGitHub && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                                                    <Github className="h-2.5 w-2.5" />
                                                    GitHub
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            ))}

                            <Separator className="my-2" />

                            {/* Comment Form */}
                            <CommentForm feedbackId={feedback.id} />
                        </CardContent>
                    </Card>

                    {/* AI Suggested Reply */}
                    <AISuggestedReply feedbackId={feedback.id} />

                    {/* AI Analysis Details */}
                    {(feedback.aiSummary || feedback.agentPrompt) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-purple-500" />
                                    AI Analysis Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Target className="h-3 w-3" /> Suggested Type
                                        </label>
                                        <p className="text-sm font-medium capitalize">
                                            {feedback.aiSuggestedType || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <BarChart3 className="h-3 w-3" /> Confidence Score
                                        </label>
                                        <p className="text-sm font-medium">
                                            {feedback.aiConfidence
                                                ? `${Math.round(feedback.aiConfidence * 100)}%`
                                                : "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Zap className="h-3 w-3" /> Suggested Priority
                                        </label>
                                        <p className="text-sm font-medium capitalize">
                                            {feedback.aiSuggestedPriority || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {feedback.aiSummary && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" /> Analysis Summary
                                        </label>
                                        <div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
                                            {feedback.aiSummary}
                                        </div>
                                    </div>
                                )}

                                {feedback.agentPrompt && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <MessageSquareQuote className="h-3 w-3" /> Agent Prompt Used
                                        </label>
                                        <div className="rounded-md bg-muted p-3">
                                            <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground overflow-auto max-h-[200px]">
                                                {feedback.agentPrompt}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Status</label>
                                <Select
                                    value={feedback.status.toLowerCase()}
                                    onValueChange={handleStatusChange}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="mt-1">
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
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                                <p className="mt-1 capitalize text-sm">{feedback.priority}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Type</label>
                                <p className="mt-1 capitalize text-sm">{feedback.type}</p>
                            </div>
                            <Separator />
                            <div>
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <FolderGit2 className="h-3 w-3" /> Project
                                </label>
                                <p className="mt-1 text-sm">{feedback.project.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> Assignee
                                </label>
                                <p className="mt-1 text-sm">
                                    {feedback.assignee?.name || "Unassigned"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GitHub Issue Link */}
                    <Card>
                        <CardContent className="pt-6">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Github className="h-3 w-3" /> GitHub Issue
                            </label>
                            {feedback.githubIssueNumber && feedback.githubUrl ? (
                                <a
                                    href={feedback.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors"
                                >
                                    <Github className="h-4 w-4" />
                                    <span>Issue #{feedback.githubIssueNumber}</span>
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                </a>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Not synced to GitHub</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Manual Task Creation */}
                    <Button onClick={handleCreateTask} className="w-full gap-2" variant="outline">
                        <ClipboardList className="h-4 w-4" />
                        Assign to Task
                    </Button>

                    {/* AI Convert to Task */}
                    <div className="flex">
                        <AIConvertTaskButton feedbackId={feedback.id} feedbackTitle={feedback.title} />
                    </div>

                    {feedback.tasks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Linked Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {feedback.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between rounded-lg border p-2">
                                        <span className="text-sm">{task.title}</span>
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {task.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
