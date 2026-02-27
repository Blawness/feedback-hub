import { SavedIdeaInput } from "@/lib/actions/idea-pool";

export type SavedIdea = SavedIdeaInput & { id: string; contextPrompt?: string | null; prd?: { id: string } | null };

export interface IdeaPoolClientProps {
    initialSavedIdeas: SavedIdea[];
}
