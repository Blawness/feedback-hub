import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrendChart } from './trend-chart';

// Mock ResponsiveContainer
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
  };
});

describe('TrendChart', () => {
  const mockData = [
    { date: '2026-02-01', count: 5 },
    { date: '2026-02-02', count: 8 },
  ];

  it('renders "No trend data available" when data is empty', () => {
    render(<TrendChart data={[]} />);
    expect(screen.getByText(/no trend data available/i)).toBeInTheDocument();
  });

  it('renders the chart container when data is provided', () => {
    const { container } = render(<TrendChart data={mockData} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
