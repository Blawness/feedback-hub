# Implementation Plan: AI Provider & API Key Settings

## Phase 1: Database & Security [checkpoint: pending]

- [ ] Task: Update Prisma schema and encryption utility
    - [ ] Add `aiProvider`, `encryptedGeminiKey`, and `encryptedOpenRouterKey` to the `Settings` model in `schema.prisma`.
    - [ ] Run `npx prisma generate` and `npx prisma db push`
    - [ ] Create `lib/utils/encryption.ts` with AES-256-GCM `encrypt` and `decrypt` functions.
    - [ ] Write unit tests for encryption/decryption in `lib/utils/encryption.test.ts`.
- [ ] Task: Implement AI Settings Server Actions
    - [ ] Create `lib/actions/ai-settings.ts`
    - [ ] Implement `updateAiSettingsAction` to encrypt keys and save to database.
    - [ ] Implement `getAiSettingsAction` to retrieve settings (returning masked keys for UI).
    - [ ] Write unit tests for Server Actions in `lib/actions/ai-settings.test.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database & Security' (Protocol in workflow.md)

## Phase 2: UI Implementation [checkpoint: pending]

- [ ] Task: Create AI Settings Page and Form
    - [ ] Add "AI Settings" link to `components/layout/sidebar.tsx`
    - [ ] Create `app/(dashboard)/settings/ai/page.tsx` as the entry point.
    - [ ] Implement the settings form in `components/settings/ai-settings-card.tsx` using Shadcn UI components.
    - [ ] Integrate form with `updateAiSettingsAction` and `getAiSettingsAction`.
- [ ] Task: UI Unit Testing
    - [ ] Write unit tests for the `AiSettingsCard` component structure and interactions.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Integration & Refinement [checkpoint: pending]

- [ ] Task: Update AI features to use configured keys
    - [ ] Refactor existing AI logic (e.g., feedback analysis, chat) to fetch the active provider and decrypted key from the database instead of environment variables.
    - [ ] Ensure fallback behavior if no key is configured.
- [ ] Task: Final verification and mobile check
    - [ ] Verify form responsiveness and touch interactions on mobile.
    - [ ] Run full test suite and confirm >80% coverage for new code.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration & Refinement' (Protocol in workflow.md)
