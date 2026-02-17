-- Step 1: Update existing IN_PROGRESS to ASSIGNED
UPDATE "Feedback" SET status = 'ASSIGNED' WHERE status = 'IN_PROGRESS';

-- Step 2: Alter enum (will be done by schema push)
