"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, ArrowLeft, ArrowRight, MoreHorizontal, Eye, Pencil, Trash2, MessageSquarePlus, Github, ClipboardList, ArrowUpDown, ChevronUp, ChevronDown, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AISearch } from "@/components/feedback/ai-search";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { deleteFeedback, updateFeedbackStatus, updateFeedbackPriority } from "@/lib/actions/feedback";
import { createTaskFromFeedback } from "@/lib/actions/tasks";
import { toast } from "sonner";

interface FeedbackItem {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    source: string;
    createdAt: Date;
    project: { id: string; name: string; slug: string };
    assignee: { id: string; name: string; email: string } | null;
    _count: { comments: number; tasks: number };
    updatedAt: Date;
    metadata: any;
    projectId: string;
    assigneeId: string | null;
    githubIssueNumber?: number | null;
    githubUrl?: string | null;
}

interface Project {
    id: string;
    name: string;
    slug: string;
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    OPEN: "destructive",
    ASSIGNED: "default",
    RESOLVED: "secondary",
    CLOSED: "outline",
    // Add lowercase mappings just in case
    open: "destructive",
    assigned: "default",
    resolved: "secondary",
    closed: "outline",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function FeedbackPageClient({
    feedbacks,
    projects,
    total,
    currentPage,
    filters,
}: {
    feedbacks: FeedbackItem[];
    projects: Project[];
    total: number;
    currentPage: number;
    filters: {
        status?: string;
        projectId?: string;
        priority?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    };
}) {
    const router = useRouter();
    const params = useSearchParams();
    const [searchValue, setSearchValue] = useState(filters.search || "");
    const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);
    const [deletingFeedback, setDeletingFeedback] = useState<FeedbackItem | null>(null);
    const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
    const totalPages = Math.ceil(total / 20);

    async function confirmDelete() {
        if (!deletingFeedback) return;
        try {
            await deleteFeedback(deletingFeedback.id);
            toast.success("Feedback deleted successfully");
        } catch {
            toast.error("Failed to delete feedback");
        }
        setDeletingFeedback(null);
    }

    async function handleCreateTask(feedbackId: string) {
        if (creatingTaskId) return;
        setCreatingTaskId(feedbackId);
        try {
            await createTaskFromFeedback(feedbackId);
            toast.success("Task created and assigned successfully");
        } catch {
            toast.error("Failed to create task");
        } finally {
            setCreatingTaskId(null);
        }
    }

    async function handleStatusUpdate(id: string, status: string) {
        try {
            await updateFeedbackStatus(id, status);
            toast.success(`Status updated to ${status}`);
        } catch {
            toast.error("Failed to update status");
        }
    }
    function toggleSort(field: string) {
        const newParams = new URLSearchParams(params.toString());
        const currentSortBy = params.get("sortBy") || "createdAt";
        const currentSortOrder = params.get("sortOrder") || "desc";

        if (currentSortBy === field) {
            newParams.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
        } else {
            newParams.set("sortBy", field);
            newParams.set("sortOrder", "asc");
        }
        router.push(`/feedback?${newParams.toString()}`);
    }

    async function handlePriorityUpdate(id: string, priority: string) {
        try {
            await updateFeedbackPriority(id, priority);
            toast.success(`Priority updated to ${priority}`);
        } catch {
            toast.error("Failed to update priority");
        }
    }

    function updateFilter(key: string, value: string) {
        const newParams = new URLSearchParams(params.toString());
        if (value && value !== "all") {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.delete("page");
        router.push(`/feedback?${newParams.toString()}`);
    }

    function handleSearch() {
        updateFilter("search", searchValue);
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search feedback..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleSearch} size="default">
                            Search
                        </Button>
                        <FeedbackDialog
                            projects={projects}
                            trigger={
                                <Button className="gap-2">
                                    <MessageSquarePlus className="h-4 w-4" />
                                    Submit
                                </Button>
                            }
                        />
                        <Select
                            value={filters.status || "all"}
                            onValueChange={(v) => updateFilter("status", v)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.priority || "all"}
                            onValueChange={(v) => updateFilter("priority", v)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.projectId || "all"}
                            onValueChange={(v) => updateFilter("projectId", v)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* AI-Powered Search */}
            <AISearch />

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="px-4 py-3 font-semibold">
                                        <button
                                            onClick={() => toggleSort("title")}
                                            className="flex items-center gap-1 hover:text-foreground transition-colors group/sort"
                                        >
                                            Title
                                            {filters.sortBy === "title" ? (
                                                filters.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="px-4 py-3 font-semibold">Project</TableHead>
                                    <TableHead className="px-4 py-3 font-semibold">Type</TableHead>
                                    <TableHead className="px-4 py-3 font-semibold text-center">Status</TableHead>
                                    <TableHead className="px-4 py-3 font-semibold">
                                        <button
                                            onClick={() => toggleSort("priority")}
                                            className="flex items-center gap-1 hover:text-foreground transition-colors group/sort"
                                        >
                                            Priority
                                            {filters.sortBy === "priority" ? (
                                                filters.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="px-4 py-3 font-semibold">
                                        <button
                                            onClick={() => toggleSort("createdAt")}
                                            className="flex items-center gap-1 hover:text-foreground transition-colors group/sort"
                                        >
                                            Date
                                            {filters.sortBy === "createdAt" ? (
                                                filters.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="px-4 py-3 font-semibold text-right w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbacks.map((fb) => (
                                    <TableRow key={fb.id} className="group">
                                        <TableCell className="px-4 py-3">
                                            <Link
                                                href={`/feedback/${fb.id}`}
                                                className="font-medium hover:underline text-foreground"
                                            >
                                                {fb.title}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span>{fb._count.comments} comments · {fb._count.tasks} tasks</span>
                                                {fb.githubIssueNumber && fb.githubUrl && (
                                                    <a
                                                        href={fb.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Github className="h-3 w-3" />
                                                        #{fb.githubIssueNumber}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="outline" className="font-normal">
                                                {fb.project.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 capitalize text-muted-foreground">
                                            {fb.type}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge variant={STATUS_COLORS[fb.status] || "outline"} className="capitalize">
                                                {fb.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Select
                                                defaultValue={fb.priority}
                                                onValueChange={(value) => handlePriorityUpdate(fb.id, value)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-7 w-[100px] text-xs font-medium border-none shadow-none focus:ring-0 capitalize px-2",
                                                    PRIORITY_COLORS[fb.priority]
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                            {format(new Date(fb.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {fb._count.tasks === 0 && fb.status !== "CLOSED" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-3 gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 hover:border-blue-500/40"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCreateTask(fb.id);
                                                        }}
                                                        disabled={creatingTaskId === fb.id}
                                                        title="Assign to Task"
                                                    >
                                                        {creatingTaskId === fb.id ? (
                                                            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                                                        ) : (
                                                            <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        )}
                                                        <span className="text-blue-700 dark:text-blue-300">
                                                            {creatingTaskId === fb.id ? "Assigning..." : "Assign"}
                                                        </span>
                                                    </Button>
                                                )}
                                                {fb.status !== "CLOSED" && fb.status !== "ASSIGNED" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-3 gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 hover:border-red-500/30"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(fb.id, "closed");
                                                        }}
                                                        title="Reject / Close"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        <span>Reject</span>
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[140px]">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/feedback/${fb.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setEditingFeedback(fb)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {fb._count.tasks === 0 && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCreateTask(fb.id)}
                                                                disabled={creatingTaskId === fb.id}
                                                            >
                                                                {creatingTaskId === fb.id ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <ClipboardList className="mr-2 h-4 w-4" />
                                                                )}
                                                                Assign Task
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingFeedback(fb)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {feedbacks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                            No feedback found. Adjust filters or submit feedback via API.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {editingFeedback && (
                <FeedbackDialog
                    projects={projects}
                    initialData={{
                        id: editingFeedback.id,
                        title: editingFeedback.title,
                        description: editingFeedback.description,
                        type: editingFeedback.type as "bug" | "feature" | "improvement" | "question",
                        priority: editingFeedback.priority as "low" | "medium" | "high" | "critical",
                        projectId: editingFeedback.projectId,
                    }}
                    open={!!editingFeedback}
                    onOpenChange={(open) => !open && setEditingFeedback(null)}
                    trigger={<span />}
                />
            )}

            <AlertDialog open={!!deletingFeedback} onOpenChange={(open) => !open && setDeletingFeedback(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{deletingFeedback?.title}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => {
                                const p = new URLSearchParams(params.toString());
                                p.set("page", String(currentPage - 1));
                                router.push(`/feedback?${p.toString()}`);
                            }}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => {
                                const p = new URLSearchParams(params.toString());
                                p.set("page", String(currentPage + 1));
                                router.push(`/feedback?${p.toString()}`);
                            }}
                        >
                            Next <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
