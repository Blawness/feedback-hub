import { prisma } from "@/lib/prisma";
import { startOfDay, format, subDays } from "date-fns";

export interface ProjectAnalytics {
  averageSentiment: number;
  totalFeedback: number;
  typeDistribution: { type: string; count: number }[];
  sentimentDistribution: { label: string; count: number; color: string }[];
  volumeTrend: { date: string; count: number }[];
}

/**
 * Calculates aggregated analytics for a specific project.
 */
export async function getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
  // 1. Get average sentiment and total count
  const aggregation = await prisma.feedback.aggregate({
    where: { projectId },
    _avg: { aiSentimentScore: true },
    _count: { _all: true },
  });

  // 2. Get distribution of feedback types
  const typeGroups = await prisma.feedback.groupBy({
    by: ['type'],
    where: { projectId },
    _count: { _all: true },
  });

  // 3. Get sentiment distribution (Negative, Neutral, Positive)
  const sentimentGroups = await Promise.all([
    prisma.feedback.count({ where: { projectId, aiSentimentScore: { lt: -0.1 } } }),
    prisma.feedback.count({ where: { projectId, aiSentimentScore: { gte: -0.1, lte: 0.1 } } }),
    prisma.feedback.count({ where: { projectId, aiSentimentScore: { gt: 0.1 } } }),
  ]);

  const sentimentDistribution = [
    { label: 'Negative', count: sentimentGroups[0], color: '#ef4444' }, // red-500
    { label: 'Neutral', count: sentimentGroups[1], color: '#94a3b8' },  // slate-400
    { label: 'Positive', count: sentimentGroups[2], color: '#22c55e' }, // green-500
  ];

  // 4. Get volume trend for the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentFeedback = await prisma.feedback.findMany({
    where: {
      projectId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Process trends in-memory for simplicity and cross-DB compatibility
  const trendMap = new Map<string, number>();
  
  // Initialize last 30 days with 0
  for (let i = 0; i <= 30; i++) {
    const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
    trendMap.set(dateStr, 0);
  }

  recentFeedback.forEach(f => {
    const dateStr = format(startOfDay(f.createdAt), 'yyyy-MM-dd');
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
  });

  const volumeTrend = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    averageSentiment: aggregation._avg.aiSentimentScore || 0,
    totalFeedback: aggregation._count._all,
    typeDistribution: typeGroups.map(g => ({
      type: g.type,
      count: g._count._all,
    })),
    sentimentDistribution,
    volumeTrend,
  };
}
