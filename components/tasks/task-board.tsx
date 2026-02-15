"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Clock, FolderGit2 } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { format } from "date-fns";

const COLUMNS = [
    { id: "todo", label: "To Do", color: "bg-gray-100 dark:bg-gray-800" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "review", label: "Review", color: "bg-yellow-50 dark:bg-yellow-900/20" },
    { id: "done", label: "Done", color: "bg-green-50 dark:bg-green-900/20" },
];

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    project: { id: string; name: string };
    assignee: { id: string; name: string } | null;
    feedback: { id: string; title: string } | null;
}

interface Project {
    id: string;
    name: string;
}

const PRIORITY_DOT: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
};

export function TaskBoard({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
    const [isPending, startTransition] = useTransition();

    function handleStatusChange(taskId: string, newStatus: string) {
        startTransition(async () => {
            await updateTaskStatus(taskId, newStatus);
        });
    }

    function handleDelete(taskId: string) {
        startTransition(async () => {
            await deleteTask(taskId);
        });
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.id);
                return (
                    <div key={col.id} className="space-y-3">
                        <div className={`rounded-lg px-4 py-2 ${col.color}`}>
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                {col.label}
                                <Badge variant="secondary" className="text-xs">
                                    {columnTasks.length}
                                </Badge>
                            </h3>
                        </div>

                        <div className="space-y-3 min-h-[100px]">
                            {columnTasks.map((task) => (
                                <Card key={task.id} className="group">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-1.5 h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
                                                <div>
                                                    <p className="text-sm font-medium leading-tight">
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(task.id)}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FolderGit2 className="h-3 w-3" />
                                                {task.project.name}
                                            </span>
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(task.dueDate), "MMM d")}
                                                </span>
                                            )}
                                        </div>

                                        <Select
                                            value={task.status}
                                            onValueChange={(v) =>
                                                handleStatusChange(task.id, v)
                                            }
                                            disabled={isPending}
                                        >
                                            <SelectTrigger className="h-7 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COLUMNS.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                            ))}

                            {columnTasks.length === 0 && (
                                <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-xs text-muted-foreground">
                                    No tasks
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
