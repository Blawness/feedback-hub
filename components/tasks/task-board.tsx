"use client";

import { useTransition, useState, useEffect, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    closestCorners,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    UniqueIdentifier,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Clock, FolderGit2, Bug, Lightbulb, TrendingUp, HelpCircle } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    feedback: { id: string; title: string; type: string } | null;
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

const FEEDBACK_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    bug: {
        icon: Bug,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
    },
    feature: {
        icon: Lightbulb,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
    },
    improvement: {
        icon: TrendingUp,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
    },
    question: {
        icon: HelpCircle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
    },
};

export function TaskBoard({ tasks: initialTasks, projects }: { tasks: Task[]; projects: Project[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [isPending, startTransition] = useTransition();

    // Sync state with props if initialTasks change (e.g. from server revalidation)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor)
    );

    const columns = useMemo(() => {
        const cols = new Map<string, Task[]>();
        // Initialize columns
        COLUMNS.forEach((col) => cols.set(col.id, []));

        // Distribute tasks
        tasks.forEach((task) => {
            const status = task.status;
            // Handle tasks with invalid status by putting them in todo or keeping them if the column exists
            // Since we defined COLUMNS, we only care about those.
            if (cols.has(status)) {
                cols.get(status)!.push(task);
            } else {
                // Fallback for unknown status
                const todo = cols.get("todo");
                if (todo) todo.push(task);
            }
        });
        return cols;
    }, [tasks]);

    function findContainer(id: UniqueIdentifier) {
        if (columns.has(id as string)) {
            return id as string;
        }
        const task = tasks.find((t) => t.id === id);
        return task?.status;
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }

        // Move task to new container locally for preview
        setTasks((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const newTasks = [...prev];

            // Just update the status to the new container
            // If overContainer is a task, find its status. If it's a column, use it directly.
            // But wait, findContainer returns the status string for both cases.
            // So we just update the status.

            if (activeIndex !== -1) {
                newTasks[activeIndex] = {
                    ...newTasks[activeIndex],
                    status: overContainer as string,
                };
            }

            return newTasks;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const activeContainer = findContainer(active.id);
        const overContainer = over ? findContainer(over.id) : null;

        if (
            activeContainer &&
            overContainer &&
            activeContainer !== overContainer
        ) {
            // Status changed
            const taskId = active.id as string;
            const newStatus = overContainer as string;

            // Optimistic update was already done in DragOver, but let's confirm/persist
            // We don't need to setTasks here because DragOver handled the visual move (by changing status)
            // But if we want to ensure it sticks or handle reordering (if we had it), we would do it here.

            startTransition(async () => {
                await updateTaskStatus(taskId, newStatus);
            });
        }

        setActiveId(null);
    }

    // Also support manual status change via Select
    function handleStatusChange(taskId: string, newStatus: string) {
        setTasks((prev) =>
            prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        );
        startTransition(async () => {
            await updateTaskStatus(taskId, newStatus);
        });
    }

    function handleDelete(taskId: string) {
        // Optimistic delete
        setTasks((prev) => prev.filter(t => t.id !== taskId));
        startTransition(async () => {
            await deleteTask(taskId);
        });
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    if (!isMounted) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 h-full items-start">
                {COLUMNS.map((col) => (
                    <TaskColumn
                        key={col.id}
                        column={col}
                        tasks={columns.get(col.id) || []}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        isPending={isPending}
                    />
                ))}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <TaskCard
                            task={tasks.find((t) => t.id === activeId)!}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

function TaskColumn({
    column,
    tasks,
    onDelete,
    onStatusChange,
    isPending,
}: {
    column: typeof COLUMNS[0];
    tasks: Task[];
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    isPending: boolean;
}) {
    const { setNodeRef } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
        disabled: true, // Columns themselves are not sortable/draggable
    });

    return (
        <div ref={setNodeRef} className="space-y-3 h-full flex flex-col rounded-xl bg-gray-50/50 dark:bg-gray-900/50 p-2">
            <div className={`rounded-lg px-3 py-2 ${column.color}`}>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    {column.label}
                    <Badge variant="secondary" className="text-xs bg-background/50">
                        {tasks.length}
                    </Badge>
                </h3>
            </div>

            <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-2 min-h-[150px] flex-1">
                    {tasks.map((task) => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            isPending={isPending}
                        />
                    ))}
                    {tasks.length === 0 && (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-6 text-xs text-muted-foreground h-full min-h-[100px]">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableTaskItem({
    task,
    onDelete,
    onStatusChange,
    isPending,
}: {
    task: Task;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    isPending: boolean;
}) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30"
            >
                <TaskCard task={task} />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                isPending={isPending}
            />
        </div>
    );
}

function TaskCard({
    task,
    onDelete,
    onStatusChange,
    isPending,
    isOverlay,
}: {
    task: Task;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: string) => void;
    isPending?: boolean;
    isOverlay?: boolean;
}) {
    return (
        <Card className={cn("group cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-card border-l-4",
            isOverlay && "shadow-xl cursor-grabbing rotate-2 scale-105",
            task.priority === "high" || task.priority === "critical" ? "border-l-orange-500" : "border-l-transparent"
        )}>
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight select-none truncate">
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 select-none">
                                    {task.description}
                                </p>
                            )}
                        </div>
                    </div>
                    {onDelete && !isOverlay && (
                        <div onPointerDown={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                                onClick={() => onDelete(task.id)}
                            >
                                <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground select-none">
                    {task.feedback && FEEDBACK_TYPE_CONFIG[task.feedback.type] && (() => {
                        const config = FEEDBACK_TYPE_CONFIG[task.feedback.type];
                        const Icon = config.icon;
                        return (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded border font-medium ${config.color} ${config.bg}`}>
                                <Icon className="h-3.5 w-3.5" />
                                <span className="capitalize">{task.feedback.type}</span>
                            </span>
                        );
                    })()}
                    <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
                        <FolderGit2 className="h-3 w-3" />
                        {task.project.name}
                    </span>
                    {task.dueDate && (
                        <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.dueDate), "MMM d")}
                        </span>
                    )}
                </div>

                {/* Keep select for accessibility, but hide if overlay to reduce clutter */}
                {!isOverlay && onStatusChange && (
                    <div onPointerDown={(e) => e.stopPropagation()} className="pt-1">
                        {/* We can hide this visually if we want drag only, but let's keep it small or show on hover maybe? 
                             For now, let's keep it visible but subtle. */}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
