# Specification: AI Provider & API Key Settings

## Overview
This track implements a secure and user-friendly interface for managing AI provider configurations (Gemini and OpenRouter) within the Feedback Hub. Users will be able to select their preferred provider and securely store encrypted API keys at a global/admin level.

## User Stories
- As an administrator, I want to choose between Gemini and OpenRouter as the AI engine.
- As an administrator, I want to securely enter and update my API keys.
- As an administrator, I want to ensure my API keys are encrypted at rest in the database.

## Functional Requirements
- **Dedicated AI Settings Page:** Create a new page under the dashboard for AI configuration.
- **Provider Selection:** A toggle or dropdown to switch between Gemini and OpenRouter.
- **API Key Management:** Input fields for Gemini API Key and OpenRouter API Key.
- **Encryption:** Securely encrypt API keys using AES-256-GCM before storing them in the PostgreSQL database.
- **Form Validation:** Ensure keys are provided and correctly formatted before saving.
- **Success/Error Feedback:** Provide clear notifications (Sonner) upon saving or encountering issues.

## Non-Functional Requirements
- **Security:** API keys must never be exposed in the frontend or logs in plain text.
- **Performance:** Encryption/decryption should not noticeably impact dashboard responsiveness.
- **Maintainability:** Use a clean, modular approach for encryption logic and server actions.

## Database Schema Updates
- Update the `Settings` or `SystemConfig` model to include `aiProvider`, `encryptedGeminiKey`, and `encryptedOpenRouterKey`.

## Acceptance Criteria
- [x] A new "AI Settings" page is accessible from the dashboard sidebar.
- [x] Users can switch between providers and enter keys.
- [x] Keys are correctly encrypted and stored in the database.
- [x] The system correctly decrypts and uses the configured key for AI features (e.g., feedback analysis).
- [x] Validations and notifications work as expected.

## Out of Scope
- Per-project AI settings (to be considered in a future track).
- Support for other AI providers beyond Gemini and OpenRouter in this phase.
- Multi-region key management.
