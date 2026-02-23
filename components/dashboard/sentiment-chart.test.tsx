import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SentimentChart } from './sentiment-chart';

// Mock ResponsiveContainer to render its children
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
  };
});

describe('SentimentChart', () => {
  const mockData = [
    { label: 'Positive', count: 10, color: '#00ff00' },
    { label: 'Neutral', count: 5, color: '#cccccc' },
    { label: 'Negative', count: 2, color: '#ff0000' },
  ];

  it('renders "No sentiment data available" when data is empty', () => {
    render(<SentimentChart data={[{ label: 'Positive', count: 0, color: '' }]} />);
    expect(screen.getByText(/no sentiment data available/i)).toBeInTheDocument();
  });

  it('renders the chart container when data is provided', () => {
    const { container } = render(<SentimentChart data={mockData} />);
    // Recharts renders SVG, we just check if it's there
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
