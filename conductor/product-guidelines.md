# Product Guidelines

## User Experience (UX) Principles
- **Simplicity First:** Interfaces should be clean and uncluttered. Primary actions (e.g., "Submit Feedback", "Create Task") must be obvious.
- **Speed & Responsiveness:** The application must load quickly and respond instantly to user interactions. Optimistic UI updates should be used for actions like upvoting or status changes.
- **Accessibility:** All components must be keyboard navigable and screen reader friendly (adhering to WCAG 2.1 AA standards).
- **Feedback Loops:** The system should provide clear feedback for all user actions (e.g., toast notifications for success/error, loading skeletons for data fetching).

## User Interface (UI) Standards
- **Consistent Layouts:** Use a standardized grid and sidebar layout across all dashboard pages to ensure predictability.
- **Component Reusability:** Exclusively use the components from the components/ui directory (based on Shadcn UI) to maintain visual consistency.
- **States & Transitions:**
  - **Loading States:** Use skeletons for data-heavy views.
  - **Empty States:** Provide actionable "Empty" states (e.g., "No feedback yet - click here to create one").
  - **Error States:** Use inline alerts for recoverable errors and full-page error boundaries for critical failures.
- **Responsive Design:** A mobile-first approach is mandatory. All views must be fully functional on small screens.

## Design System & Branding
- **Typography:** Use a clean, sans-serif font stack (Geist) for readability.
- **Color Palette:**
  - **Primary:** A distinct brand color for calls-to-action.
  - **Neutral:** Grays for text and backgrounds.
  - **Semantic:** Green (Success), Red (Error), Amber (Warning).
- **Spacing:** Use a consistent 4px grid system (Tailwind defaults).

## Content & Tone
- **Professional & Direct:** Communication should be clear and concise.
- **Helpful & Proactive:** AI-generated content should be framed as helpful assists.
- **Empathetic:** Error messages should offer solutions.

## Functional Standards
- **Data Integrity:** User data must be saved reliably.
- **Privacy:** Minimize PII storage.
- **Security:** Protect API keys and sensitive routes. Rate limit public endpoints.
