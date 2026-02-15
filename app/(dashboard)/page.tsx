import { getDashboardStats } from "@/lib/actions/projects";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentFeedbackTable } from "@/components/dashboard/recent-feedback";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardContent() {
    const stats = await getDashboardStats();

    return (
        <>
            <StatsCards
                projectCount={stats.projectCount}
                feedbackCount={stats.feedbackCount}
                taskCount={stats.taskCount}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <RecentFeedbackTable feedbacks={stats.recentFeedbacks} projects={stats.activeProjects} />
                </div>
                <div className="col-span-full lg:col-span-3">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>• Go to <a href="/projects" className="text-primary hover:underline font-medium">Projects</a> to sync GitHub repos</p>
                            <p>• Go to <a href="/feedback" className="text-primary hover:underline font-medium">Feedback</a> to view all reports</p>
                            <p>• Go to <a href="/tasks" className="text-primary hover:underline font-medium">Tasks</a> to manage your kanban board</p>
                            <p>• Go to <a href="/settings" className="text-primary hover:underline font-medium">Settings</a> to view API docs</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function DashboardSkeleton() {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-[350px] rounded-xl" />
        </>
    );
}

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your projects, feedback, and tasks.
                </p>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}
