import { getTasks } from "@/lib/actions/tasks";
import { getProjects } from "@/lib/actions/projects";
import { TaskBoard } from "@/components/tasks/task-board";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Tasks - Feedback Hub",
    description: "Manage tasks across your projects.",
};

async function TasksContent() {
    const [tasks, projects] = await Promise.all([
        getTasks(),
        getProjects(),
    ]);

    return <TaskBoard tasks={tasks} projects={projects} />;
}

export default function TasksPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                <p className="text-muted-foreground">
                    Manage tasks across all projects. Drag to update status.
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
                <TasksContent />
            </Suspense>
        </div>
    );
}
