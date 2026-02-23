import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InsightsPage from './page';

describe('InsightsPage', () => {
  it('renders the insights dashboard heading', () => {
    render(<InsightsPage />);
    expect(screen.getByRole('heading', { name: /insights dashboard/i })).toBeInTheDocument();
  });

  it('contains the main layout structure', () => {
    render(<InsightsPage />);
    // We expect a sentiment card and trend card eventually
    // For now just check if it's not empty
    expect(screen.getByText(/insights dashboard/i)).toBeInTheDocument();
  });
});
