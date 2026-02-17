'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ... imports
import { createFeedback, updateFeedback, FeedbackFormData } from '@/lib/actions/feedback';
import { analyzeFeedback } from '@/lib/actions/ai';

const FeedbackSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['bug', 'feature', 'improvement', 'question']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    projectId: z.string().min(1, 'Project is required'),
    agentPrompt: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

interface FeedbackFormProps {
    projects: { id: string; name: string }[];
    initialData?: FeedbackFormData & { id: string };
    onSuccess?: () => void;
}

export function FeedbackForm({ projects, initialData, onSuccess }: FeedbackFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(FeedbackSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            type: initialData?.type || 'bug',
            priority: initialData?.priority || 'medium',
            projectId: initialData?.projectId || projects[0]?.id || '',
            agentPrompt: initialData?.agentPrompt || '',
        },
    });

    const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

    const handleAIAnalysis = useCallback(async (silent = false) => {
        const description = form.getValues('description');
        const title = form.getValues('title');

        if (!description || description.length < 15) {
            if (!silent) toast.error('Please provide a more detailed description first (min 15 chars).');
            return;
        }

        // Avoid re-analyzing the same content
        const currentContent = `${title}|${description}`;
        if (silent && currentContent === lastAnalyzedContent) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeFeedback(title, description);
            if (result) {
                const newTitle = result.suggestedTitle || title;
                const newDescription = result.suggestedDescription || description;

                // Update tracker to the NEW state to prevent re-triggering loop
                setLastAnalyzedContent(`${newTitle}|${newDescription}`);

                if (result.suggestedTitle) {
                    form.setValue('title', result.suggestedTitle, { shouldDirty: true });
                }
                if (result.suggestedDescription) {
                    form.setValue('description', result.suggestedDescription, { shouldDirty: true });
                }
                if (result.suggestedAgentPrompt) {
                    form.setValue('agentPrompt', result.suggestedAgentPrompt, { shouldDirty: true });
                }
                form.setValue('type', result.suggestedType as any, { shouldDirty: true });
                form.setValue('priority', result.suggestedPriority as any, { shouldDirty: true });

                if (!silent) {
                    toast.success('Feedback enhanced with AI!', {
                        description: `Confidence: ${Math.round(result.confidence * 100)}%`,
                    });
                }
            } else if (!silent) {
                toast.error('AI is currently unavailable.');
            }
        } catch (error) {
            if (!silent) toast.error('Failed to analyze feedback.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [form, lastAnalyzedContent]);



    function onSubmit(data: FeedbackFormValues) {
        startTransition(async () => {
            try {
                let result;
                if (initialData) {
                    result = await updateFeedback(initialData.id, data);
                } else {
                    result = await createFeedback(data);
                }

                if (result.success) {
                    if (!initialData) form.reset();

                    const githubUrl = 'githubUrl' in result ? (result as any).githubUrl : null;
                    const isNew = !initialData;

                    toast.success(isNew ? 'Feedback submitted & Task created!' : 'Feedback updated!', {
                        description: (result as any).warning || (isNew ? 'Successfully created feedback and linked task.' : 'Your changes have been saved.'),
                        action: (isNew && githubUrl) ? {
                            label: 'View Issue',
                            onClick: () => window.open(githubUrl, '_blank'),
                        } : undefined,
                    });

                    onSuccess?.();
                } else {
                    toast.error((result as any).error || 'Failed to submit feedback');
                }
            } catch (error) {
                toast.error('Something went wrong. Please try again.');
                console.error(error);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Brief summary of the issue" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="bug">Bug</SelectItem>
                                        <SelectItem value="feature">Feature</SelectItem>
                                        <SelectItem value="improvement">Improvement</SelectItem>
                                        <SelectItem value="question">Question</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            <div className="flex items-center justify-between">
                                <FormLabel>Description</FormLabel>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleAIAnalysis(false)}
                                    disabled={isAnalyzing || isPending}
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                    AI Enhance
                                </Button>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Detailed description..."
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="agentPrompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                Agent Prompt
                                <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">IDE Ready</span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="AI generated prompt for Cursor/IDE..."
                                    className="min-h-[80px] font-mono text-xs bg-muted/30"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Update Feedback' : 'Submit Feedback'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
