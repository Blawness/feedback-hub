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
            <Suspense fallback={null}>
                <NotificationListener />
            </Suspense>
            <Suspense fallback={<div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-screen sticky top-0" />}>
                <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col">
                <Suspense fallback={<header className="h-16 border-b border-gray-200 dark:border-gray-800" />}>
                    <Header />
                </Suspense>
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
