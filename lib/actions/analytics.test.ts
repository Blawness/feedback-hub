import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectAnalytics } from './analytics';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('getProjectAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return aggregated analytics for a project', async () => {
    const projectId = 'test-project';

    // Mock sentiment aggregation
    vi.mocked(prisma.feedback.aggregate).mockResolvedValueOnce({
      _avg: { aiSentimentScore: 0.5 },
      _count: { _all: 10 },
    } as any);

    // Mock type distribution
    vi.mocked(prisma.feedback.groupBy).mockResolvedValueOnce([
      { type: 'bug', _count: { _all: 3 } },
      { type: 'feature', _count: { _all: 7 } },
    ] as any);

    // Mock volume trends (simplified)
    vi.mocked(prisma.feedback.findMany).mockResolvedValueOnce([
      { createdAt: new Date('2026-02-20'), _count: 1 },
      { createdAt: new Date('2026-02-21'), _count: 2 },
    ] as any);

    const analytics = await getProjectAnalytics(projectId);

    expect(analytics.averageSentiment).toBe(0.5);
    expect(analytics.totalFeedback).toBe(10);
    expect(analytics.typeDistribution).toContainEqual({ type: 'bug', count: 3 });
    expect(analytics.typeDistribution).toContainEqual({ type: 'feature', count: 7 });
  });

  it('should return default values if no feedback exists', async () => {
    const projectId = 'empty-project';

    vi.mocked(prisma.feedback.aggregate).mockResolvedValueOnce({
      _avg: { aiSentimentScore: null },
      _count: { _all: 0 },
    } as any);

    vi.mocked(prisma.feedback.groupBy).mockResolvedValueOnce([]);
    vi.mocked(prisma.feedback.findMany).mockResolvedValueOnce([]);

    const analytics = await getProjectAnalytics(projectId);

    expect(analytics.averageSentiment).toBe(0);
    expect(analytics.totalFeedback).toBe(0);
    expect(analytics.typeDistribution).toEqual([]);
  });
});
