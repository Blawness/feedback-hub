import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatAssistant } from "@/components/ai/chat-assistant";
import { NotificationListener } from "@/components/shared/notification-listener";
import { Suspense } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <NotificationListener />
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 lg:p-8 relative">
                    {children}
                </main>
            </div>
            <Suspense fallback={null}>
                <ChatAssistant />
            </Suspense>
        </div>
    );
}
