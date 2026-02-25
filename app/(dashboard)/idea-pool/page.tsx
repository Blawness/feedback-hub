import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSavedIdeasAction } from "@/lib/actions/idea-pool";
import { IdeaPoolClient } from "@/components/idea-pool/idea-pool-client";

export const metadata: Metadata = {
    title: "Idea Pool - Feedback Hub",
    description: "Generate and save creative software project ideas using AI.",
};

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdeaPoolPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 max-h-screen overflow-y-auto">
            <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
                <IdeaPoolContent />
            </Suspense>
        </div>
    );
}

async function IdeaPoolContent() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const { data: savedIdeas = [] } = await getSavedIdeasAction();

    return <IdeaPoolClient initialSavedIdeas={savedIdeas as any} />;
}
