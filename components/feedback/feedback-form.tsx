'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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

const FeedbackSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['bug', 'feature', 'improvement', 'question']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    projectId: z.string().min(1, 'Project is required'),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

interface FeedbackFormProps {
    projects: { id: string; name: string }[];
    initialData?: FeedbackFormData & { id: string };
    onSuccess?: () => void;
}

export function FeedbackForm({ projects, initialData, onSuccess }: FeedbackFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(FeedbackSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            type: initialData?.type || 'bug',
            priority: initialData?.priority || 'medium',
            projectId: initialData?.projectId || projects[0]?.id || '',
        },
    });

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
                    if (result.warning) {
                        toast.warning('Saved locally, but GitHub sync failed.', {
                            description: result.warning,
                        });
                    } else {
                        // Only createFeedback returns githubUrl
                        const githubUrl = 'githubUrl' in result ? (result as any).githubUrl : null;

                        toast.success(initialData ? 'Feedback updated!' : 'Feedback submitted!', {
                            action: (!initialData && githubUrl) ? {
                                label: 'View Issue',
                                onClick: () => window.open(githubUrl, '_blank'),
                            } : undefined,
                        });
                    }
                    onSuccess?.();
                } else {
                    toast.error(result.error || 'Failed to submit feedback');
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
                                defaultValue={field.value}
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
                                    defaultValue={field.value}
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
                                    defaultValue={field.value}
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
                            <FormLabel>Description</FormLabel>
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

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Update Feedback' : 'Submit Feedback'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
