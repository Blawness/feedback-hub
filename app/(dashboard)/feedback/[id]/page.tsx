import { getFeedbackById } from "@/lib/actions/feedback";
import { FeedbackDetail } from "@/components/feedback/feedback-detail";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function FeedbackDetailContent({ id }: { id: string }) {
    const feedback = await getFeedbackById(id);
    if (!feedback) notFound();
    return <FeedbackDetail feedback={feedback} />;
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
