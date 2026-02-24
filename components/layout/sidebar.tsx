"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderGit2,
    MessageSquare,
    CheckSquare,
    Settings,
    LogOut,
    BookText,
    Bot,
    BarChart3,
    Lightbulb,
    Sparkles
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/ui/logo";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Feedback", href: "/feedback", icon: MessageSquare },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Idea Pool", href: "/idea-pool", icon: Lightbulb },
    { name: "AI Chat", href: "/chat", icon: Bot },
    { name: "AI Settings", href: "/settings/ai", icon: Sparkles },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Docs", href: "/docs", icon: BookText },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <Logo />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Feedback Hub
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
