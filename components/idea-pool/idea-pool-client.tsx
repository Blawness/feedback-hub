"use client";

import { useState } from "react";
import { Sparkles, Bookmark, RefreshCw, Loader2 } from "lucide-react";
import { IdeaCard, IdeaCardProps } from "./idea-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerationConfig } from "./generation-config";
import { generateIdeasAction, saveIdeaAction, deleteSavedIdeaAction, SavedIdeaInput, IdeaGenerationConfig } from "@/lib/actions/idea-pool";
import { useToast } from "@/hooks/use-toast";

type SavedIdea = SavedIdeaInput & { id: string };

interface IdeaPoolClientProps {
    initialSavedIdeas: SavedIdea[];
}

export function IdeaPoolClient({ initialSavedIdeas }: IdeaPoolClientProps) {
    const { toast } = useToast();

    // State
    const [activeTab, setActiveTab] = useState("explore");
    const [generatedIdeas, setGeneratedIdeas] = useState<SavedIdeaInput[]>([]);
    const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas);
    const [generationConfig, setGenerationConfig] = useState<IdeaGenerationConfig>({
        count: 3,
        category: undefined,
        difficulty: undefined,
    });

    // Loading states
    const [isGenerating, setIsGenerating] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateIdeasAction(generationConfig); // Use config from state

            if (result.error) {
                toast({
                    title: "Generation failed",
                    description: result.error,
                    variant: "destructive",
                });
                return;
            }

            if (result.data) {
                setGeneratedIdeas(result.data);
                toast({
                    title: "Ideas generated successfully",
                    description: "Here are some fresh project ideas for you!",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Something went wrong",
                description: "Failed to generate ideas. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (idea: SavedIdeaInput, index: number) => {
        const loadingId = `generated-${index}`;
        setProcessingIds(prev => new Set(prev).add(loadingId));

        try {
            const result = await saveIdeaAction(idea);

            if (result.error || !result.data) {
                toast({
                    title: "Failed to save idea",
                    description: result.error || "Unknown error occurred",
                    variant: "destructive",
                });
                return;
            }

            // Add the returned saved idea to our state
            setSavedIdeas(prev => [result.data as SavedIdea, ...prev]);

            toast({
                title: "Idea saved!",
                description: "You can find it in your Favorites tab.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save the idea.",
                variant: "destructive",
            });
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(loadingId);
                return next;
            });
        }
    };

    const handleUnsave = async (id: string) => {
        setProcessingIds(prev => new Set(prev).add(id));

        try {
            const result = await deleteSavedIdeaAction(id);

            if (result.error) {
                toast({
                    title: "Failed to remove idea",
                    description: result.error,
                    variant: "destructive",
                });
                return;
            }

            // Remove from state
            setSavedIdeas(prev => prev.filter(idea => idea.id !== id));

            toast({
                title: "Idea removed",
                description: "The idea was removed from your favorites.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to remove the idea.",
                variant: "destructive",
            });
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // Helper to check if a generated idea is already saved (by title matching)
    // In a robust app, we might use a better identifier entirely, but title works for MVP
    const isIdeaSaved = (title: string) => {
        return savedIdeas.some(idea => idea.title === title);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Idea Pool</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Get AI-generated project ideas and save your favorites.
                    </p>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md transition-all whitespace-nowrap"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate New Ideas
                        </>
                    )}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="explore" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Explore
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4" />
                        Favorites
                        {savedIdeas.length > 0 && (
                            <span className="ml-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                {savedIdeas.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="explore" className="mt-0 outline-none">
                    <GenerationConfig config={generationConfig} onChange={setGenerationConfig} />

                    {generatedIdeas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                                <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Ideas Yet</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                Click the generate button to brainstorm fresh project concepts using AI.
                            </p>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                variant="outline"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Generate Now
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedIdeas.map((idea, idx) => {
                                const saved = isIdeaSaved(idea.title);
                                const loadingId = `generated-${idx}`;

                                // Find the actual saved idea ID if it exists
                                const matchedSavedIdea = savedIdeas.find(i => i.title === idea.title);

                                return (
                                    <IdeaCard
                                        key={idx}
                                        {...idea}
                                        isSaved={saved}
                                        isLoading={processingIds.has(loadingId) || (matchedSavedIdea && processingIds.has(matchedSavedIdea.id))}
                                        onSave={() => handleSave(idea, idx)}
                                        onUnsave={() => matchedSavedIdea && handleUnsave(matchedSavedIdea.id)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-0 outline-none">
                    {savedIdeas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                <Bookmark className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Saved Ideas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                You haven't added any project ideas to your favorites yet. Explore new ideas and save the ones you like!
                            </p>
                            <Button variant="outline" onClick={() => setActiveTab("explore")}>
                                Go to Explore
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedIdeas.map((idea) => (
                                <IdeaCard
                                    key={idea.id}
                                    {...idea}
                                    isSaved={true}
                                    isLoading={processingIds.has(idea.id)}
                                    onUnsave={() => handleUnsave(idea.id)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
