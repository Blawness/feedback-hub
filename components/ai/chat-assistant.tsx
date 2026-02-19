"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    MessageCircle,
    X,
    Sparkles,
    Minimize2,
} from "lucide-react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantThread } from "@/components/ai/assistant-thread";
import { useAssistantChatRuntime } from "@/hooks/use-assistant-chat-runtime";
import { usePathname } from "next/navigation";

export function ChatAssistant() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const runtime = useAssistantChatRuntime();

    if (pathname.startsWith("/chat")) {
        return null;
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 p-0 z-50"
            >
                <MessageCircle className="h-6 w-6 text-white" />
            </Button>
        );
    }

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            {isMinimized ? (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        onClick={() => setIsMinimized(false)}
                        className="h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 px-5 shadow-xl hover:from-violet-700 hover:to-purple-700"
                    >
                        <Sparkles className="h-4 w-4 text-white" />
                        <span className="text-sm text-white">AI Chat</span>
                    </Button>
                </div>
            ) : (
                <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-96 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                    <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-semibold">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                onClick={() => setIsMinimized(true)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <Minimize2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={() => setIsOpen(false)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <AssistantThread
                        title="Feedback Hub AI"
                        subtitle="Ask about your feedbacks, tasks, or project insights."
                        inputPlaceholder="Ask about your feedbacks..."
                        suggestions={[
                            "How many open bugs?",
                            "What's the most urgent feedback?",
                            "Summary of recent feedback",
                        ]}
                        className="min-h-0 flex-1"
                    />
                </div>
            )}
        </AssistantRuntimeProvider>
    );
}
