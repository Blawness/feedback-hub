"use client";

import { useMemo } from "react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";

export interface AssistantChatContext {
    taskId?: string;
    projectId?: string;
}

export function useAssistantChatRuntime(context?: AssistantChatContext) {
    const transport = useMemo(
        () =>
            new AssistantChatTransport({
                api: "/api/chat",
                body: {
                    context: {
                        taskId: context?.taskId,
                        projectId: context?.projectId,
                    },
                },
            }),
        [context?.taskId, context?.projectId]
    );

    return useChatRuntime({ transport });
}
