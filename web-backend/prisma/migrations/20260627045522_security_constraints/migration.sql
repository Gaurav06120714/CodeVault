-- Security & integrity hardening (DATABASE_PLAN §7-8): CHECK constraints,
-- partial unread-notifications index, and GIN index on problem topics.

-- Non-negative / consistent counters.
ALTER TABLE "connections"  ADD CONSTRAINT "chk_solved_count_nonneg" CHECK ("solvedCount" >= 0);
ALTER TABLE "github_repos" ADD CONSTRAINT "chk_file_count_nonneg"  CHECK ("fileCount" >= 0);
ALTER TABLE "sync_runs"    ADD CONSTRAINT "chk_items_pushed_le_fetched" CHECK ("itemsPushed" <= "itemsFetched");

-- Hot path: unread-notification count (partial index).
CREATE INDEX "idx_notifications_unread" ON "notifications" ("userId") WHERE "readAt" IS NULL;

-- Topic filtering/analytics on the high-volume problems table.
CREATE INDEX "idx_problems_topics_gin" ON "problems" USING GIN ("topics");
