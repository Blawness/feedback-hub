"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChatActionHint } from "@/lib/ai/types";
import { Check, Loader2, ArrowRight, Clipboard, MessageSquare, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { addComment } from "@/lib/actions/comments";
// Import other necessary actions

interface ChatActionButtonsProps {
    actions: ChatActionHint[];
    taskId?: string;
    onActionComplete?: () => void;
}

export function ChatActionButtons({ actions, taskId, onActionComplete }: ChatActionButtonsProps) {
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
    const [isLoading, startTransition] = useTransition();

    async function handleAction(action: ChatActionHint) {
        if (isLoading || completedActions.has(action.label)) return;
        setPendingAction(action.label);

        try {
            // Artificial delay for UX or real action call
            if (action.type === "update_status" && taskId) {
                const status = action.payload.status;
                await updateTaskStatus(taskId, status as any); // Type assertion needed or fix type
                toast.success(`Task status updated to ${status}`);
            } else if (action.type === "add_comment" && taskId) {
                const content = action.payload.content;
                await addComment({ feedbackId: taskId, content }); // TODO: Check if taskId maps to feedbackId or if we need a separate addTaskComment action
                toast.success("Comment added to task");
            } else if (action.type === "copy_prompt") {
                await navigator.clipboard.writeText(action.payload.prompt);
                toast.success("Prompt copied to clipboard");
            } else {
                // Simulate action for unsupported types for now
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast.info(`Action ${action.label} executed`);
            }

            setCompletedActions(prev => new Set(prev).add(action.label));
            onActionComplete?.();

        } catch (error) {
            console.error("Action failed:", error);
            toast.error("Failed to execute action");
        } finally {
            setPendingAction(null);
        }
    }

    if (!actions || actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {actions.map((action, i) => {
                const isPending = pendingAction === action.label;
                const isCompleted = completedActions.has(action.label);

                let Icon = ArrowRight;
                if (action.type === "update_status") Icon = ListTodo;
                if (action.type === "add_comment") Icon = MessageSquare;
                if (action.type === "copy_prompt") Icon = Clipboard;

                return (
                    <Button
                        key={i}
                        variant={isCompleted ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleAction(action)}
                        disabled={isPending || isCompleted}
                        className={`h-7 text-xs gap-1.5 ${isCompleted ? "text-green-600 border-green-200 bg-green-50" : ""}`}
                    >
                        {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isCompleted ? (
                            <Check className="h-3 w-3" />
                        ) : (
                            <Icon className="h-3 w-3" />
                        )}
                        {action.label}
                    </Button>
                );
            })}
        </div>
    );
}
