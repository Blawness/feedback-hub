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
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
    const projectId = typeof searchParams.projectId === "string" ? searchParams.projectId : undefined;
    const priority = typeof searchParams.priority === "string" ? searchParams.priority : undefined;
    const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
    const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;

    const [{ feedbacks, total }, projects] = await Promise.all([
        getFeedbacks({ status, projectId, priority, search, page }),
        getProjects(),
    ]);

    return (
        <FeedbackPageClient
            feedbacks={feedbacks}
            projects={projects}
            total={total}
            currentPage={page}
            filters={{ status, projectId, priority, search }}
        />
    );
}

export default async function FeedbackPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
                <p className="text-muted-foreground">
                    All feedback from your projects. Filter by status, priority, or project.
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
                <FeedbackContent searchParams={params} />
            </Suspense>
        </div>
    );
}
