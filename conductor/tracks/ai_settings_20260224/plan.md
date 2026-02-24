# Implementation Plan: AI Provider & API Key Settings

## Phase 1: Database & Security [checkpoint: completed]

- [x] Task: Update Prisma schema and encryption utility
    - [x] Add `aiProvider`, `encryptedGeminiKey`, and `encryptedOpenRouterKey` to the `Settings` model in `schema.prisma`.
    - [x] Run `npx prisma generate` and `npx prisma db push`
    - [x] Create `lib/utils/encryption.ts` with AES-256-GCM `encrypt` and `decrypt` functions.
    - [x] Write unit tests for encryption/decryption in `lib/utils/encryption.test.ts`.
- [x] Task: Implement AI Settings Server Actions
    - [x] Create `lib/actions/ai-settings.ts`
    - [x] Implement `updateAiSettingsAction` to encrypt keys and save to database.
    - [x] Implement `getAiSettingsAction` to retrieve settings (returning masked keys for UI).
    - [x] Write unit tests for Server Actions in `lib/actions/ai-settings.test.ts`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database & Security' (Protocol in workflow.md)

## Phase 2: UI Implementation [checkpoint: completed]

- [x] Task: Create AI Settings Page and Form
    - [x] Add "AI Settings" link to `components/layout/sidebar.tsx`
    - [x] Create `app/(dashboard)/settings/ai/page.tsx` as the entry point.
    - [x] Implement the settings form in `components/settings/ai-settings-card.tsx` using Shadcn UI components.
    - [x] Integrate form with `updateAiSettingsAction` and `getAiSettingsAction`.
- [x] Task: UI Unit Testing
    - [x] Write unit tests for the `AiSettingsCard` component structure and interactions.
- [x] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Integration & Refinement [checkpoint: pending]

- [~] Task: Update AI features to use configured keys
    - [ ] Refactor existing AI logic (e.g., feedback analysis, chat) to fetch the active provider and decrypted key from the database instead of environment variables.
    - [ ] Ensure fallback behavior if no key is configured.
- [ ] Task: Final verification and mobile check
    - [ ] Verify form responsiveness and touch interactions on mobile.
    - [ ] Run full test suite and confirm >80% coverage for new code.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration & Refinement' (Protocol in workflow.md)
