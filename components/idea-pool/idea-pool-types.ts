import { SavedIdeaInput } from "@/lib/actions/idea-pool";

export type SavedIdea = SavedIdeaInput & { id: string };

export interface IdeaPoolClientProps {
    initialSavedIdeas: SavedIdea[];
}
