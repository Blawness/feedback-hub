# Implementation Plan: Idea Pool Feature

## Phase 1: Database Schema & Data Access
- [x] Task: Update Prisma schema with `SavedIdea` model
    - [x] Add `SavedIdea` model to `schema.prisma` (title, description, category, techStack, difficulty, audience, features, userId)
    - [x] Run `npx prisma generate` and `npx prisma db push`
- [x] Task: Implement Data Access Layer (Server Actions)
    - [x] Create `lib/actions/idea-pool.ts`
    - [x] Implement `saveIdeaAction`, `getSavedIdeasAction`, `deleteSavedIdeaAction`
- [x] Task: Unit Tests for Data Access
    - [x] Create `lib/actions/idea-pool.test.ts`
    - [x] Write tests for saving, fetching, and deleting ideas
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Data Access' (Protocol in workflow.md)

## Phase 2: AI Generation Service
- [x] Task: Gemini Prompt Engineering
    - [x] Update `lib/ai/prompt-templates.ts` with project idea generation prompt
- [x] Task: Implement Generation Action
    - [x] Implement `generateIdeasAction` in `lib/actions/idea-pool.ts` using Vercel AI SDK
- [x] Task: Unit Tests for AI Generation
    - [x] Write tests to verify prompt structure and action behavior (with mocked AI response)
- [x] Task: Conductor - User Manual Verification 'Phase 2: AI Generation Service' (Protocol in workflow.md)

## Phase 3: UI Components & Navigation
- [x] Task: Update Sidebar Navigation
    - [x] Add "Idea Pool" to `components/layout/sidebar.tsx`
- [x] Task: Create UI Components
    - [x] Create `components/idea-pool/idea-card.tsx` (displays details, tech stack, save button)
    - [x] Create `components/idea-pool/idea-pool-client.tsx` (main client component with tabs for "Explore" and "Favorites")
- [x] Task: Unit Tests for UI Components
    - [x] Write tests for `IdeaCard` rendering and button interactions
- [x] Task: Conductor - User Manual Verification 'Phase 3: UI Components & Navigation' (Protocol in workflow.md)

## Phase 4: Page Implementation & Final Polish
- [x] Task: Create Idea Pool Page
    - [x] Implement `app/(dashboard)/idea-pool/page.tsx`
    - [x] Integrate with `generateIdeasAction` and `getSavedIdeasAction`
- [x] Task: Final Responsive Check & Styling
    - [x] Ensure mobile responsiveness for the idea grid
    - [x] Add loading skeletons and success/error notifications
- [x] Task: Conductor - User Manual Verification 'Phase 4: Page Implementation & Final Polish' (Protocol in workflow.md)
