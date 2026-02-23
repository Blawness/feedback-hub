import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveIdeaAction, getSavedIdeasAction, deleteSavedIdeaAction, generateIdeasAction } from './idea-pool';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ai, isAIEnabled, getAiConfig } from '@/lib/ai/gemini';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        savedIdea: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/ai/gemini', () => ({
    ai: {
        models: {
            generateContent: vi.fn(),
        },
    },
    isAIEnabled: vi.fn(),
    getAiConfig: vi.fn(),
}));

describe('Idea Pool Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockUser = { id: 'user-1' };
    const mockIdeaInput = {
        title: 'Test Idea',
        description: 'Test Description',
        category: 'SaaS',
        techStack: ['React', 'Node.js'],
        difficulty: 'Intermediate',
        audience: 'Developers',
        features: ['Feature 1', 'Feature 2'],
    };

    describe('saveIdeaAction', () => {
        it('should save an idea for authenticated user', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
            vi.mocked(prisma.savedIdea.create).mockResolvedValueOnce({
                id: 'idea-1',
                ...mockIdeaInput,
                userId: mockUser.id,
            } as any);

            const result = await saveIdeaAction(mockIdeaInput);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('idea-1');
            expect(prisma.savedIdea.create).toHaveBeenCalledWith({
                data: {
                    ...mockIdeaInput,
                    userId: mockUser.id,
                },
            });
        });

        it('should return error if unauthorized', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

            const result = await saveIdeaAction(mockIdeaInput);

            expect(result.error).toBe('Unauthorized');
            expect(result.status).toBe(401);
            expect(prisma.savedIdea.create).not.toHaveBeenCalled();
        });
    });

    describe('getSavedIdeasAction', () => {
        it('should return saved ideas for user', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
            const mockIdeas = [{ id: 'idea-1', title: 'Test' }];
            vi.mocked(prisma.savedIdea.findMany).mockResolvedValueOnce(mockIdeas as any);

            const result = await getSavedIdeasAction();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockIdeas);
            expect(prisma.savedIdea.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should return error if unauthorized', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

            const result = await getSavedIdeasAction();

            expect(result.error).toBe('Unauthorized');
            expect(result.status).toBe(401);
        });
    });

    describe('deleteSavedIdeaAction', () => {
        it('should delete idea if user owns it', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
            vi.mocked(prisma.savedIdea.findUnique).mockResolvedValueOnce({
                id: 'idea-1',
                userId: mockUser.id,
            } as any);
            vi.mocked(prisma.savedIdea.delete).mockResolvedValueOnce({} as any);

            const result = await deleteSavedIdeaAction('idea-1');

            expect(result.success).toBe(true);
            expect(prisma.savedIdea.delete).toHaveBeenCalledWith({
                where: { id: 'idea-1' },
            });
        });

        it('should return error if unauthorized', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

            const result = await deleteSavedIdeaAction('idea-1');

            expect(result.error).toBe('Unauthorized');
            expect(result.status).toBe(401);
        });

        it('should return error if idea not found or not owned by user', async () => {
            vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
            vi.mocked(prisma.savedIdea.findUnique).mockResolvedValueOnce({
                id: 'idea-1',
                userId: 'other-user',
            } as any);

            const result = await deleteSavedIdeaAction('idea-1');

            expect(result.error).toBe('Idea not found or unauthorized');
            expect(result.status).toBe(404);
            expect(prisma.savedIdea.delete).not.toHaveBeenCalled();
        });
    });

    describe('generateIdeasAction', () => {
        const mockConfig = {
            model: 'test-model',
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
            systemInstruction: 'Test instructions',
        };

        const mockAiResponse = JSON.stringify([
            {
                title: 'AI Idea 1',
                category: 'Web App',
                techStack: ['Next.js', 'Prisma'],
                description: 'A great AI idea.',
                difficulty: 'Beginner',
                audience: 'Everyone',
                features: ['AI generation'],
            },
        ]);

        beforeEach(() => {
            vi.mocked(isAIEnabled).mockReturnValue(true);
            vi.mocked(getAiConfig).mockResolvedValue(mockConfig as any);
        });

        it('should successfully generate and parse ideas from AI', async () => {
            vi.mocked(ai!.models.generateContent).mockResolvedValueOnce({
                text: mockAiResponse,
            } as any);

            const result = await generateIdeasAction(1);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].title).toBe('AI Idea 1');
            expect(ai!.models.generateContent).toHaveBeenCalled();
        });

        it('should return error if AI is not enabled', async () => {
            vi.mocked(isAIEnabled).mockReturnValue(false);

            const result = await generateIdeasAction(1);

            expect(result.error).toBe('AI is not available. Please configure Gemini API key.');
            expect(result.success).toBeUndefined();
            expect(ai!.models.generateContent).not.toHaveBeenCalled();
        });

        it('should handle AI JSON parsing errors gracefully', async () => {
            vi.mocked(ai!.models.generateContent).mockResolvedValueOnce({
                text: 'This is not valid JSON.',
            } as any);

            const result = await generateIdeasAction(1);

            expect(result.error).toBe('Failed to generate ideas. Please try again.');
            expect(result.status).toBe(500);
        });

        it('should clean markdown json blocks before parsing', async () => {
            vi.mocked(ai!.models.generateContent).mockResolvedValueOnce({
                text: `\`\`\`json\n${mockAiResponse}\n\`\`\``,
            } as any);

            const result = await generateIdeasAction(1);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].title).toBe('AI Idea 1');
        });
    });
});
