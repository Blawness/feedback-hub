# Implementation Plan: Insights Dashboard

This plan outlines the steps to implement the AI-powered Insights Dashboard, following a Test-Driven Development (TDD) approach and the established project workflow.

## Phase 1: Data Aggregation & Logic

- [ ] **Task: Implement feedback sentiment analysis service**
    - [ ] Write failing unit tests for the sentiment analysis utility in `lib/ai/sentiment.ts`
    - [ ] Implement `analyzeSentiment` function using Vercel AI SDK and Gemini
    - [ ] Verify tests pass and coverage >80%
- [ ] **Task: Create aggregation logic for analytics data**
    - [ ] Write failing unit tests for analytics aggregation in `lib/actions/analytics.ts`
    - [ ] Implement Server Action to calculate sentiment distribution and volume trends
    - [ ] Verify tests pass and coverage >80%
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Data Aggregation & Logic' (Protocol in workflow.md)**

## Phase 2: Insights UI & Visualizations

- [ ] **Task: Design and implement the Insights Dashboard layout**
    - [ ] Write failing unit tests for the `InsightsPage` component structure
    - [ ] Implement the base layout in `app/(dashboard)/insights/page.tsx`
    - [ ] Verify tests pass and coverage >80%
- [ ] **Task: Create visualization components**
    - [ ] Write failing unit tests for SentimentChart and TrendChart components
    - [ ] Implement chart components using Tailwind and accessible SVG primitives
    - [ ] Verify tests pass and coverage >80%
- [ ] **Task: Integrate UI with Analytics API**
    - [ ] Write failing unit tests for data fetching in the Insights page
    - [ ] Connect the dashboard charts to the aggregation Server Action
    - [ ] Verify tests pass and coverage >80%
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Insights UI & Visualizations' (Protocol in workflow.md)**

## Phase 3: Integration & Polish

- [ ] **Task: Update navigation and sidebar**
    - [ ] Add "Insights" link to `components/layout/sidebar.tsx`
    - [ ] Verify navigation works correctly
- [ ] **Task: Implement filtering and responsiveness**
    - [ ] Add project selection filter and date range picker to the dashboard
    - [ ] Optimize the dashboard layout for mobile devices
- [ ] **Task: Final verification and documentation**
    - [ ] Run full test suite and confirm >80% coverage
    - [ ] Update `README.md` or internal docs if necessary
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Integration & Polish' (Protocol in workflow.md)**
