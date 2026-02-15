import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { FeedbackDialog } from './feedback-dialog';

async function FeedbackDriver() {
    const projects = await prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    if (projects.length === 0) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <FeedbackDialog projects={projects} />
        </div>
    );
}

export function FeedbackWrapper() {
    return (
        <Suspense fallback={null}>
            <FeedbackDriver />
        </Suspense>
    );
}
