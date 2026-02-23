import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdeaCard } from './idea-card';

describe('IdeaCard', () => {
    const mockIdea = {
        title: 'Test Idea',
        description: 'Test Description',
        category: 'Web App',
        techStack: ['React', 'Next.js'],
        difficulty: 'Beginner',
        audience: 'Developers',
        features: ['Feature 1', 'Feature 2'],
    };

    it('should render all idea details correctly', () => {
        render(<IdeaCard {...mockIdea} />);

        // Check if title and description are rendered
        expect(screen.getByText('Test Idea')).toBeDefined();
        expect(screen.getByText('Test Description')).toBeDefined();

        // Check badges
        expect(screen.getByText('Web App')).toBeDefined();
        expect(screen.getByText('Beginner')).toBeDefined();

        // Check tech stack
        expect(screen.getByText('React')).toBeDefined();
        expect(screen.getByText('Next.js')).toBeDefined();

        // Check audience and features
        expect(screen.getByText('Developers')).toBeDefined();
        expect(screen.getByText('Feature 1')).toBeDefined();
        expect(screen.getByText('Feature 2')).toBeDefined();
    });

    it('should render "Save Idea" button when isSaved is false', () => {
        const onSave = vi.fn();
        render(<IdeaCard {...mockIdea} isSaved={false} onSave={onSave} />);

        const saveBtn = screen.getByRole('button', { name: /save idea/i });
        expect(saveBtn).toBeDefined();

        fireEvent.click(saveBtn);
        expect(onSave).toHaveBeenCalledOnce();
    });

    it('should render "Added to Favorites" button when isSaved is true', () => {
        const onUnsave = vi.fn();
        render(<IdeaCard {...mockIdea} isSaved={true} onUnsave={onUnsave} />);

        const unsaveBtn = screen.getByRole('button', { name: /added to favorites/i });
        expect(unsaveBtn).toBeDefined();

        fireEvent.click(unsaveBtn);
        expect(onUnsave).toHaveBeenCalledOnce();
    });

    it('should disable button when isLoading is true', () => {
        render(<IdeaCard {...mockIdea} isLoading={true} />);

        const btn = screen.getByRole('button');
        expect(btn.hasAttribute('disabled')).toBe(true);
    });
});
