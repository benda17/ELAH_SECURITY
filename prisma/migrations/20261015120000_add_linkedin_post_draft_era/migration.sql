-- Additive. Existing rows default to v1 (pre-pivot archive). New APACT drafts set era = 'v2'.
ALTER TABLE "LinkedInPostDraft" ADD COLUMN IF NOT EXISTS "era" TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS "LinkedInPostDraft_era_idx" ON "LinkedInPostDraft"("era");
