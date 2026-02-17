"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { syncGitHubComments } from "@/lib/actions/comments";
import { toast } from "sonner";

interface SyncGitHubCommentsButtonProps {
    feedbackId: string;
    hasGitHubIssue: boolean;
}

export function SyncGitHubCommentsButton({
    feedbackId,
    hasGitHubIssue,
}: SyncGitHubCommentsButtonProps) {
    const [isPending, startTransition] = useTransition();

    if (!hasGitHubIssue) return null;

    function handleSync() {
        startTransition(async () => {
            const result = await syncGitHubComments(feedbackId);

            if (result.success) {
                if (result.synced > 0) {
                    toast.success(`Synced ${result.synced} new comment(s) from GitHub`);
                } else {
                    toast.info("No new comments from GitHub");
                }
            } else {
                toast.error(result.error ?? "Sync failed");
            }
        });
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isPending}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
            {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isPending ? "Syncing..." : "Sync from GitHub"}
        </Button>
    );
}
