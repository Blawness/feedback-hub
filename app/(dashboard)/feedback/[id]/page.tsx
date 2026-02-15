import { getFeedbackById } from "@/lib/actions/feedback";
import { FeedbackDetail } from "@/components/feedback/feedback-detail";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { connection } from "next/server";

async function FeedbackDetailContent({ id }: { id: string }) {
    await connection();
    try {
        const feedback = await getFeedbackById(id);
        if (!feedback) notFound();
        return <FeedbackDetail feedback={feedback} />;
    } catch (error) {
        console.error("Failed to fetch feedback details:", error);
        notFound();
    }
}

export default async function FeedbackDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
                <FeedbackDetailContent id={id} />
            </Suspense>
        </div>
    );
}
