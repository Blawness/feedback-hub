"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantThread } from "@/components/ai/assistant-thread";
import { useAssistantChatRuntime } from "@/hooks/use-assistant-chat-runtime";

export function FullPageChat() {
    const runtime = useAssistantChatRuntime();

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background">
                <div className="border-b px-5 py-4">
                    <h1 className="text-base font-semibold">AI Chat</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Chat with your Feedback Hub assistant across feedback and tasks.
                    </p>
                </div>
                <AssistantThread
                    title="Feedback Hub AI"
                    subtitle="Ask for summaries, priorities, and next actions."
                    inputPlaceholder="Ask the assistant..."
                    suggestions={[
                        "Summarize latest feedback trends",
                        "What are the highest priority tasks?",
                        "Suggest next actions for the team",
                    ]}
                    className="min-h-0 flex-1"
                />
            </div>
        </AssistantRuntimeProvider>
    );
}
