import { getProjects } from "@/lib/actions/projects";
import { ProjectList } from "@/components/projects/project-list";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Projects - Feedback Hub",
    description: "Manage your projects and API keys.",
};

async function ProjectsContent() {
    const projects = await getProjects();

    return <ProjectList projects={projects} />;
}

export default function ProjectsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Manage your projects synced from GitHub. Each project gets a unique API key.
                    </p>
                </div>
            </div>
            <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
                <ProjectsContent />
            </Suspense>
        </div>
    );
}
