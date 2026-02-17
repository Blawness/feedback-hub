"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { addComment } from "@/lib/actions/comments";
import { toast } from "sonner";

interface CommentFormProps {
    feedbackId: string;
}

export function CommentForm({ feedbackId }: CommentFormProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!content.trim()) return;

        startTransition(async () => {
            const result = await addComment({
                feedbackId,
                content: content.trim(),
            });

            if (result.success) {
                setContent("");
                toast.success("Comment added");
                if (result.warning) {
                    toast.warning(result.warning);
                }
            } else {
                toast.error(result.error ?? "Failed to add comment");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                disabled={isPending}
                className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    disabled={isPending || !content.trim()}
                    className="gap-2"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    {isPending ? "Sending..." : "Send"}
                </Button>
            </div>
        </form>
    );
}
