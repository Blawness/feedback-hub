import { StatsCards } from "@/components/dashboard/stats-cards";
import { FeedbackTable } from "@/components/feedback/feedback-table";
import { Suspense } from "react";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your projects, feedback, and tasks.
                </p>
            </div>

            <StatsCards />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <Suspense fallback={<div>Loading feedback...</div>}>
                        <FeedbackTable title="Recent Feedback" limit={5} />
                    </Suspense>
                </div>
                <div className="col-span-3">
                    {/* Task summary or project health component will go here */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                            Project Health (Coming Soon)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
