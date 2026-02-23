import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSavedIdeasAction } from "@/lib/actions/idea-pool";
import { IdeaPoolClient } from "@/components/idea-pool/idea-pool-client";

export const metadata: Metadata = {
    title: "Idea Pool - Feedback Hub",
    description: "Generate and save creative software project ideas using AI.",
};

export default async function IdeaPoolPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const { data: savedIdeas = [] } = await getSavedIdeasAction();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 max-h-screen overflow-y-auto">
            <IdeaPoolClient initialSavedIdeas={savedIdeas as any} />
        </div>
    );
}
