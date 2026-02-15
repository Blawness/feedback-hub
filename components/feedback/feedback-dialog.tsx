'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackForm } from './feedback-form';
import { FeedbackFormData } from '@/lib/actions/feedback';

interface FeedbackDialogProps {
    projects: { id: string; name: string }[];
    trigger?: React.ReactNode;
    initialData?: FeedbackFormData & { id: string };
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function FeedbackDialog({ projects, trigger, initialData, open: controlledOpen, onOpenChange: setControlledOpen }: FeedbackDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2 shadow-lg">
                        <MessageSquarePlus className="h-4 w-4" />
                        Feedback
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Feedback' : 'Submit Feedback'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update the details of your feedback.' : 'Report a bug or request a feature for a specific project.'}
                    </DialogDescription>
                </DialogHeader>
                <FeedbackForm
                    projects={projects}
                    initialData={initialData}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
