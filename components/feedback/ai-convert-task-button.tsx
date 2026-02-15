"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ListTodo, Check } from "lucide-react";
import { convertFeedbackToTask } from "@/lib/actions/ai";
import { toast } from "sonner";

interface AIConvertTaskButtonProps {
    feedbackId: string;
    feedbackTitle: string;
}

export function AIConvertTaskButton({ feedbackId, feedbackTitle }: AIConvertTaskButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isConverted, setIsConverted] = useState(false);

    function handleConvert() {
        startTransition(async () => {
            const result = await convertFeedbackToTask(feedbackId);
            if (result.error) {
                toast.error(result.error);
            } else if (result.success) {
                setIsConverted(true);
                toast.success(`Task created: ${result.task?.title || "New task"}`);
            }
        });
    }

    if (isConverted) {
        return (
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-green-600">
                <Check className="h-3.5 w-3.5" />
                Task Created
            </Button>
        );
    }

    return (
        <Button
            onClick={handleConvert}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="gap-1.5 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950"
        >
            {isPending ? (
                <>
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    Converting...
                </>
            ) : (
                <>
                    <ListTodo className="h-3.5 w-3.5" />
                    <Sparkles className="h-3 w-3" />
                    Convert to Task
                </>
            )}
        </Button>
    );
}
