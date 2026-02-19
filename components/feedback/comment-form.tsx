"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles } from "lucide-react";
import { addComment } from "@/lib/actions/comments";
import { toast } from "sonner";

interface CommentFormProps {
    feedbackId: string;
}

export function CommentForm({ feedbackId }: CommentFormProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAiGenerating, setIsAiGenerating] = useState(false);

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

    async function handleAiReply() {
        if (content.trim() && !confirm("Replace current text with AI reply?")) {
            return;
        }

        setIsAiGenerating(true);
        try {
            // dynamically import to avoid circular dep issues in some setups, strictly not needed here but good practice if actions were heavy
            const { generateSuggestedReplyAction } = await import("@/lib/actions/ai");
            const result = await generateSuggestedReplyAction(feedbackId);

            if (result.success && result.reply) {
                setContent(result.reply);
                toast.success("AI reply generated");
            } else {
                toast.error(result.error || "Failed to generate reply");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsAiGenerating(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                disabled={isPending || isAiGenerating}
                className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between items-center">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/50"
                    onClick={handleAiReply}
                    disabled={isPending || isAiGenerating}
                >
                    {isAiGenerating ? (
                        <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-3 w-3 mr-2" />
                            Reply with AI
                        </>
                    )}
                </Button>

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
