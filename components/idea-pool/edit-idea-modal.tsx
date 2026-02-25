"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SavedIdeaInput, updateIdeaAction, refineIdeaAction } from "@/lib/actions/idea-pool";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ideaSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    difficulty: z.string().min(1, "Difficulty is required"),
    audience: z.string().min(1, "Audience is required"),
    techStack: z.string().min(1, "Tech stack is required"),
    features: z.string().min(1, "Features are required"),
});

type IdeaFormValues = z.infer<typeof ideaSchema>;

interface EditIdeaModalProps {
    idea: SavedIdeaInput & { id: string };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedIdea: any) => void;
}

export function EditIdeaModal({ idea, isOpen, onClose, onSuccess }: EditIdeaModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [aiInstruction, setAiInstruction] = useState("");

    const form = useForm<IdeaFormValues>({
        resolver: zodResolver(ideaSchema),
        defaultValues: {
            title: idea.title,
            description: idea.description,
            category: idea.category,
            difficulty: idea.difficulty,
            audience: idea.audience,
            techStack: idea.techStack.join(", "),
            features: idea.features.join(", "),
        },
    });

    const handleRefineWithAI = async () => {
        if (!aiInstruction.trim()) {
            toast({
                title: "Instruction required",
                description: "Please enter what you want the AI to change.",
                variant: "destructive",
            });
            return;
        }

        setIsRefining(true);
        try {
            const currentValues = form.getValues();
            const ideaToRefine: SavedIdeaInput = {
                ...currentValues,
                techStack: currentValues.techStack.split(",").map(s => s.trim()).filter(Boolean),
                features: currentValues.features.split(",").map(s => s.trim()).filter(Boolean),
            };

            const result = await refineIdeaAction(ideaToRefine, aiInstruction);

            if (result.success && result.data) {
                const refined = result.data;
                form.reset({
                    title: refined.title,
                    description: refined.description,
                    category: refined.category,
                    difficulty: refined.difficulty,
                    audience: refined.audience,
                    techStack: refined.techStack.join(", "),
                    features: refined.features.join(", "),
                });
                setAiInstruction("");
                toast({
                    title: "Idea refined!",
                    description: "AI has updated the form fields based on your instruction.",
                });
            } else {
                toast({
                    title: "AI Refinement Failed",
                    description: result.error || "Failed to refine idea",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An unexpected error occurred during AI refinement.",
                variant: "destructive",
            });
        } finally {
            setIsRefining(false);
        }
    };

    const onSubmit = async (values: IdeaFormValues) => {
        setIsSubmitting(true);
        try {
            const formattedValues = {
                ...values,
                techStack: values.techStack.split(",").map((s) => s.trim()).filter(Boolean),
                features: values.features.split(",").map((s) => s.trim()).filter(Boolean),
            };

            const result = await updateIdeaAction(idea.id, formattedValues as any);

            if (result.success && result.data) {
                toast({
                    title: "Idea updated",
                    description: "Your changes have been saved successfully.",
                });
                onSuccess(result.data);
                onClose();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update idea",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Saved Idea</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                            <Sparkles className="h-4 w-4" />
                            Edit with AI
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g., 'Make it more enterprise focused' or 'Change tech stack to Next.js'"
                                value={aiInstruction}
                                onChange={(e) => setAiInstruction(e.target.value)}
                                className="bg-white dark:bg-gray-950"
                                disabled={isRefining}
                            />
                            <Button
                                size="sm"
                                onClick={handleRefineWithAI}
                                disabled={isRefining}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isRefining ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Refine"
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/50 mt-2">
                            This will update the form fields above. You still need to click "Save Changes" to persist them.
                        </p>
                    </div>

                    <Separator />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Difficulty</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="audience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Audience</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="techStack"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tech Stack (comma separated)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Features (comma separated)</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={2} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
