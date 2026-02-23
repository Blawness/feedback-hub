import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InsightsPage from './page';
import { getProjectAnalytics } from '@/lib/actions/analytics';
import { getProjects } from '@/lib/actions/projects';

// Mock the actions
vi.mock('@/lib/actions/analytics', () => ({
  getProjectAnalytics: vi.fn(),
}));

vi.mock('@/lib/actions/projects', () => ({
  getProjects: vi.fn(),
}));

// Mock the chart components to avoid Recharts issues in tests
vi.mock('@/components/dashboard/sentiment-chart', () => ({
  SentimentChart: () => <div data-testid="sentiment-chart">Sentiment Chart</div>,
}));

vi.mock('@/components/dashboard/trend-chart', () => ({
  TrendChart: () => <div data-testid="trend-chart">Trend Chart</div>,
}));

describe('InsightsPage', () => {
  const mockAnalytics = {
    averageSentiment: 0.75,
    totalFeedback: 100,
    typeDistribution: [{ type: 'bug', count: 20 }],
    sentimentDistribution: [{ label: 'Positive', count: 80, color: 'green' }],
    volumeTrend: [{ date: '2026-02-01', count: 10 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjects).mockResolvedValue([{ id: 'test-project', name: 'Test Project' }] as any);
  });

  it('renders the insights dashboard heading', () => {
    vi.mocked(getProjectAnalytics).mockResolvedValue(mockAnalytics);
    render(<InsightsPage />);
    expect(screen.getByRole('heading', { name: /insights dashboard/i })).toBeInTheDocument();
  });

  it('fetches and displays analytics data', async () => {
    vi.mocked(getProjectAnalytics).mockResolvedValue(mockAnalytics);
    
    render(<InsightsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('0.75')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('sentiment-chart')).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();

    // Verify getProjectAnalytics was called with default 30 days
    await waitFor(() => {
      expect(getProjectAnalytics).toHaveBeenCalledWith('test-project', 30);
    });
  });
});
