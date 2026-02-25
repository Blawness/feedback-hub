import { FullPageChat } from "@/components/ai/full-page-chat";
import { Suspense } from "react";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-8.5rem)] min-h-[560px]">
            <Suspense fallback={<div className="flex h-full items-center justify-center">Loading chat...</div>}>
                <FullPageChat />
            </Suspense>
        </div>
    );
}
