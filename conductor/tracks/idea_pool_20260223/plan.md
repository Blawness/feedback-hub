# Implementation Plan: Idea Pool Feature

## Phase 1: Database Schema & Data Access
- [ ] Task: Update Prisma schema with `SavedIdea` model
    - [ ] Add `SavedIdea` model to `schema.prisma` (title, description, category, techStack, difficulty, audience, features, userId)
    - [ ] Run `npx prisma generate` and `npx prisma db push`
- [ ] Task: Implement Data Access Layer (Server Actions)
    - [ ] Create `lib/actions/idea-pool.ts`
    - [ ] Implement `saveIdeaAction`, `getSavedIdeasAction`, `deleteSavedIdeaAction`
- [ ] Task: Unit Tests for Data Access
    - [ ] Create `lib/actions/idea-pool.test.ts`
    - [ ] Write tests for saving, fetching, and deleting ideas
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Data Access' (Protocol in workflow.md)

## Phase 2: AI Generation Service
- [ ] Task: Gemini Prompt Engineering
    - [ ] Update `lib/ai/prompt-templates.ts` with project idea generation prompt
- [ ] Task: Implement Generation Action
    - [ ] Implement `generateIdeasAction` in `lib/actions/idea-pool.ts` using Vercel AI SDK
- [ ] Task: Unit Tests for AI Generation
    - [ ] Write tests to verify prompt structure and action behavior (with mocked AI response)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Generation Service' (Protocol in workflow.md)

## Phase 3: UI Components & Navigation
- [ ] Task: Update Sidebar Navigation
    - [ ] Add "Idea Pool" to `components/layout/sidebar.tsx`
- [ ] Task: Create UI Components
    - [ ] Create `components/idea-pool/idea-card.tsx` (displays details, tech stack, save button)
    - [ ] Create `components/idea-pool/idea-pool-client.tsx` (main client component with tabs for "Explore" and "Favorites")
- [ ] Task: Unit Tests for UI Components
    - [ ] Write tests for `IdeaCard` rendering and button interactions
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UI Components & Navigation' (Protocol in workflow.md)

## Phase 4: Page Implementation & Final Polish
- [ ] Task: Create Idea Pool Page
    - [ ] Implement `app/(dashboard)/idea-pool/page.tsx`
    - [ ] Integrate with `generateIdeasAction` and `getSavedIdeasAction`
- [ ] Task: Final Responsive Check & Styling
    - [ ] Ensure mobile responsiveness for the idea grid
    - [ ] Add loading skeletons and success/error notifications
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Page Implementation & Final Polish' (Protocol in workflow.md)
