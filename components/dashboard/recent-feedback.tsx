"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { deleteFeedback, FeedbackFormData } from "@/lib/actions/feedback";
import { toast } from "sonner";
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
import { useState } from "react";

interface Feedback {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: "low" | "medium" | "high" | "critical";
    type: "bug" | "feature" | "improvement" | "question";
    createdAt: Date;
    projectId: string;
    project: { name: string };
}

interface RecentFeedbackTableProps {
    feedbacks: Feedback[];
    projects: { id: string; name: string }[];
}

export function RecentFeedbackTable({ feedbacks, projects }: RecentFeedbackTableProps) {
    const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
    const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);

    async function confirmDelete() {
        if (!deletingFeedback) return;
        try {
            await deleteFeedback(deletingFeedback.id);
            toast.success("Feedback deleted successfully");
        } catch (error) {
            toast.error("Failed to delete feedback");
        }
        setDeletingFeedback(null);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Feedback</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/feedback">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.map((fb) => (
                            <TableRow key={fb.id}>
                                <TableCell>
                                    <Link href={`/feedback/${fb.id}`} className="font-medium hover:underline">
                                        {fb.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{fb.project.name}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            fb.status === "open"
                                                ? "destructive"
                                                : fb.status === "in_progress"
                                                    ? "default"
                                                    : "secondary"
                                        }
                                    >
                                        {fb.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(fb.createdAt), "MMM d")}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingFeedback(fb)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeletingFeedback(fb)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {feedbacks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No feedback yet. Sync projects and use the API to submit feedback.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {editingFeedback && (
                <FeedbackDialog
                    projects={projects}
                    initialData={editingFeedback}
                    open={!!editingFeedback}
                    onOpenChange={(open) => !open && setEditingFeedback(null)}
                    trigger={<span />} // Dummy trigger since we control state
                />
            )}

            <AlertDialog open={!!deletingFeedback} onOpenChange={(open) => !open && setDeletingFeedback(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the feedback "{deletingFeedback?.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
