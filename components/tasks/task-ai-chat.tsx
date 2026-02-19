"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantThread } from "@/components/ai/assistant-thread";
import { useAssistantChatRuntime } from "@/hooks/use-assistant-chat-runtime";

interface TaskAIChatProps {
    taskId: string;
    taskTitle: string;
}

export function TaskAIChat({ taskId, taskTitle }: TaskAIChatProps) {
    const runtime = useAssistantChatRuntime({ taskId });

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border bg-background">
                <AssistantThread
                    title="Task Assistant"
                    subtitle={`I have context about "${taskTitle}". Ask me anything.`}
                    inputPlaceholder="Ask specifically about this task..."
                    suggestions={[
                        "Summarize this task",
                        "Suggest implementation steps",
                        "Draft a status update",
                    ]}
                    className="min-h-0 flex-1"
                />
            </div>
        </AssistantRuntimeProvider>
    );
}
