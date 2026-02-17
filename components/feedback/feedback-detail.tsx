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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { updateFeedbackStatus } from "@/lib/actions/feedback";
import { createTaskFromFeedback } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { AISuggestedReply } from "@/components/feedback/ai-suggested-reply";
import { AIConvertTaskButton } from "@/components/feedback/ai-convert-task-button";
import { AIBadge } from "@/components/ai/ai-badge";

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
            user: { id: string; name: string; email: string };
        }[];
        tasks: { id: string; title: string; status: string }[];
        aiSummary?: string | null;
        aiSuggestedType?: string | null;
        aiSuggestedPriority?: string | null;
        aiConfidence?: number | null;
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
                            <CardTitle className="text-base">Comments ({feedback.comments.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {feedback.comments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No comments yet.
                                </p>
                            )}
                            {feedback.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                        {comment.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {comment.user.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* AI Suggested Reply */}
                    <AISuggestedReply feedbackId={feedback.id} />
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
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
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
