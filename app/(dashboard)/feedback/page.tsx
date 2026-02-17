import { getFeedbacks } from "@/lib/actions/feedback";
import { getProjects } from "@/lib/actions/projects";
import { FeedbackPageClient } from "@/components/feedback/feedback-page-client";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Feedback - Feedback Hub",
    description: "View and manage all feedback across projects.",
};

async function FeedbackContent({
    searchParams,
    projects,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    projects: any[];
}) {
    const params = await searchParams;
    const status = typeof params.status === "string" ? params.status : undefined;
    const projectId = typeof params.projectId === "string" ? params.projectId : undefined;
    const priority = typeof params.priority === "string" ? params.priority : undefined;
    const search = typeof params.search === "string" ? params.search : undefined;
    const page = typeof params.page === "string" ? parseInt(params.page) : 1;
    const sortBy = typeof params.sortBy === "string" ? params.sortBy : "createdAt";
    const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

    const { feedbacks, total } = await getFeedbacks({
        status,
        projectId,
        priority,
        search,
        page,
        sortBy,
        sortOrder
    });

    return (
        <FeedbackPageClient
            feedbacks={feedbacks}
            projects={projects}
            total={total}
            currentPage={page}
            filters={{ status, projectId, priority, search, sortBy, sortOrder }}
        />
    );
}

export default async function FeedbackPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const allProjects = await getProjects();
    const projects = allProjects.filter((p) => p.isActive);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
                <p className="text-muted-foreground">
                    All feedback from your projects. Filter by status, priority, or project.
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
                <FeedbackContent searchParams={searchParams} projects={projects} />
            </Suspense>
        </div>
    );
}
