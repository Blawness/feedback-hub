# Specification: Idea Pool Feature

## Overview
The Idea Pool is a new feature within the Feedback Hub dashboard that leverages Google Gemini 2.0 Flash to generate creative project ideas for users. Users can generate a fresh batch of ideas on-demand, view comprehensive details for each (including tech stack and difficulty), and save their favorite ideas for future reference.

## Functional Requirements
1.  **Navigation:** Add a new "Idea Pool" item to the dashboard sidebar.
2.  **Idea Generation:**
    *   Provide a "Generate New Ideas" button.
    *   Trigger an AI call to Gemini to produce 3-5 unique project ideas.
    *   Each idea must include:
        *   **Title:** Catchy project name.
        *   **Category:** (e.g., Landing Page, SaaS, Web App, Mobile App, CLI Tool).
        *   **Tech Stack:** List of recommended technologies.
        *   **Detailed Description:** A paragraph explaining the concept.
        *   **Difficulty Level:** (Beginner, Intermediate, Advanced).
        *   **Target Audience:** Who would use this project.
        *   **Key Features List:** 3-5 core functionalities.
3.  **Persistence (Favorites):**
    *   Allow users to "Save" an idea.
    *   Saved ideas must be stored in the database.
    *   Provide a "Favorites" view/tab within the Idea Pool to list all saved ideas.
    *   Allow users to "Unsave" (delete) an idea from their favorites.
4.  **User Interface:**
    *   Use Shadcn UI cards to display ideas.
    *   Responsive layout (Grid on desktop, Stack on mobile).
    *   Loading states during AI generation.

## Technical Requirements
- **LLM:** Google Gemini 2.0 Flash via Vercel AI SDK.
- **Database:** Prisma schema update to include `Idea` or `FavoriteIdea` model.
- **State Management:** Use TanStack Query for fetching/mutating ideas.
- **Testing:** Vitest unit tests for generation logic and persistence.

## Acceptance Criteria
- [ ] User can click "Idea Pool" in the sidebar and see the initial interface.
- [ ] Clicking "Generate" successfully displays new AI-generated project ideas.
- [ ] Clicking "Save" adds the idea to the database and visual feedback is shown.
- [ ] Navigating to the "Favorites" tab shows all previously saved ideas.
- [ ] The feature is fully responsive on mobile devices.

## Out of Scope
- Converting a saved idea directly into a "Project" in the Feedback Hub system (Phase 2).
- Filtering or searching within the favorites list.
- User-provided keywords for generation (Initial version is random/trend-based).
