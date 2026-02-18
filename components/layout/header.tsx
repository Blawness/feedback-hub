"use client";

import { Bell, Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { getOpenFeedbackCount, getFeedbacks } from "@/lib/actions/feedback";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function Header() {
    const [count, setCount] = useState(0);
    const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const refreshNotifications = async () => {
        try {
            const [c, f] = await Promise.all([
                getOpenFeedbackCount(),
                getFeedbacks({ status: "OPEN", limit: 5 }),
            ]);
            setCount(c);
            setRecentFeedback(f.feedbacks);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        refreshNotifications();

        // Listen for new feedback events from NotificationListener
        const handleNewFeedback = () => refreshNotifications();
        window.addEventListener("feedback-new", handleNewFeedback);

        // Also poll every 30s as backup
        const interval = setInterval(refreshNotifications, 30000);

        return () => {
            window.removeEventListener("feedback-new", handleNewFeedback);
            clearInterval(interval);
        };
    }, []);

    return (
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <div className="flex-1">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search feedback, tasks..."
                        className="pl-10"
                    />
                </div>
            </div>
            <ModeToggle />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {count > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-in zoom-in">
                                {count > 99 ? "99+" : count}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        <span className="text-xs text-muted-foreground">{count} pending</span>
                    </div>
                    <ScrollArea className="h-[300px]">
                        {recentFeedback.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-xs">No pending feedback</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {recentFeedback.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/feedback/${item.id}`}
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col gap-1 p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <p className="text-sm font-medium leading-none line-clamp-1">
                                            {item.title}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{item.project.name}</span>
                                            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="border-t p-2">
                        <Button variant="ghost" className="w-full h-8 text-xs" asChild>
                            <Link href="/feedback?status=OPEN" onClick={() => setOpen(false)}>
                                View all feedback
                            </Link>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </header>
    );
}
