---
name: issue-comment-sync
description: Hardens feedback issue/comment synchronization between app and GitHub. Use when editing issue sync, comment sync, webhook import/export flow, retry logic, or ID mapping in lib/github-issues.ts, lib/actions/feedback.ts, and lib/actions/comments.ts.
version: 0.0.1
license: MIT
---

# Issue/Comment Sync Guard

Use this skill when changing sync behavior between Feedback Hub and GitHub issues/comments.

## Scope

- `lib/github-issues.ts`
- `lib/actions/feedback.ts`
- `lib/actions/comments.ts`

Do not expand scope unless the change requires it.

## Primary Objectives

1. Prevent duplicate issue/comment creation.
2. Guard against missing IDs and invalid mappings.
3. Keep retries safe (idempotent where possible).
4. Verify both directions:
   - app -> GitHub
   - GitHub -> app

## Required Checks Before Editing

1. Trace all create/update paths:
   - feedback create/update/status sync
   - comment create sync
   - GitHub comment import sync
2. Identify identity keys:
   - Feedback: `id`, `githubIssueNumber`
   - Comment: local `id`, `githubCommentId`
3. Identify loop-prevention markers:
   - `"commented via Feedback Hub"` in GitHub comment body

## Guardrails

### 1) Duplicate Sync Protection

- Before creating in destination, check whether an external ID already exists.
- For GitHub -> app comment import, always compare incoming GitHub IDs against existing `githubCommentId` values.
- Keep loop-prevention checks when importing GitHub comments created by this app.

### 2) Missing ID Protection

- Fail safely if required IDs are absent:
  - No `githubRepoFullName` -> local-only path with warning.
  - No `githubIssueNumber` for comment/issue updates -> skip remote mutation safely.
- Preserve explicit warning/error return values instead of silent success.
- Keep `BigInt`/string conversion consistent at boundaries.

### 3) Retry Safety

- Treat create operations as non-idempotent by default.
- Never blindly retry `create` calls without a de-dup strategy.
- If retries are added, use one of:
  - existing external ID check before retry
  - deterministic lookup by ID marker after failure
  - bounded retry with no duplicate side effects
- Update/close/state-sync operations may retry more safely than create operations.

## Implementation Guidelines

- Prefer small, local changes inside scoped files.
- Keep sync failures non-blocking when existing flow is intentionally non-blocking.
- Log actionable context for sync failures (operation + identifiers).
- Return structured result payloads (`success`, `warning`, `synced`, `error`) consistently.

## Verification Checklist (Required)

Run through all items after changes:

1. app -> GitHub issue create:
   - feedback saved once
   - exactly one GitHub issue created
   - `githubIssueNumber` persisted once
2. app -> GitHub issue update/state:
   - updates do not create new issues
   - close/reopen mapping remains correct
3. app -> GitHub comment create:
   - exactly one GitHub comment for one local submit
   - `githubCommentId` saved locally
4. GitHub -> app comment import:
   - already-imported comments are skipped
   - app-originated comments are skipped (loop prevention)
   - only truly new GitHub comments are inserted
5. Failure paths:
   - missing repo/issue IDs return safe warning/error
   - transient GitHub error does not duplicate on retry

## Quick Regression Commands

Use project package manager commands:

```bash
npm run lint
```

Then validate manually with a linked GitHub repo:

- Create feedback with GitHub sync enabled.
- Add local comment and verify one GitHub comment.
- Run GitHub comment sync twice and verify no duplicate local imports.
