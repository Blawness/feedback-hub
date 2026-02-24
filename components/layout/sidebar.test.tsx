import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './sidebar';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <span>DashboardIcon</span>,
  MessageSquare: () => <span>FeedbackIcon</span>,
  CheckSquare: () => <span>TaskIcon</span>,
  FolderGit2: () => <span>ProjectIcon</span>,
  Settings: () => <span>SettingsIcon</span>,
  LogOut: () => <span>LogOutIcon</span>,
  BookText: () => <span>DocsIcon</span>,
  Bot: () => <span>BotIcon</span>,
  BarChart3: () => <span>InsightsIcon</span>,
  Lightbulb: () => <span>IdeaPoolIcon</span>,
  Sparkles: () => <span>AiSettingsIcon</span>,
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock Next.js usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Sidebar', () => {
  it('contains a link to the Insights page', () => {
    render(<Sidebar />);
    const link = screen.queryByRole('link', { name: /insights/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/insights');
  });
});
