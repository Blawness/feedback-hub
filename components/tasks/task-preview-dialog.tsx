import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
    Calendar,
    User,
    FolderGit2,
    Link as LinkIcon,
    Eye,
    Tag,
    AlertCircle,
    Bot,
    Copy,
    Check,
    Terminal,
} from "lucide-react";
import type { Task } from "./task-board";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskAIChat } from "./task-ai-chat";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskPreviewDialogProps {
    task: Task;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TaskPreviewDialog({ task, trigger, open, onOpenChange }: TaskPreviewDialogProps) {
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
                            </div>
                        </ScrollArea>
                    </TabsContent >

                    <TabsContent value="ai-chat" className="flex-1 overflow-hidden mt-0 h-full min-h-0">
                        <TaskAIChat taskId={task.id} taskTitle={task.title} />
                    </TabsContent>
                </Tabs >


            </DialogContent >
        </Dialog >
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
