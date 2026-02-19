"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAssistantChatRuntime } from "@/hooks/use-assistant-chat-runtime";
import { usePathname } from "next/navigation";
import { AssistantModal } from "@/components/assistant-modal";

export function ChatAssistant() {
    const pathname = usePathname();
    const runtime = useAssistantChatRuntime();

    if (pathname.startsWith("/chat")) {
        return null;
    }

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <AssistantModal />
        </AssistantRuntimeProvider>
    );
}
