-- CodeVault — per-service least-privilege Postgres roles (DATABASE_SECURITY §9).
-- Run once per environment by a migration/bootstrap admin AFTER migrations.
-- web-backend connects as cv_web; git-service as cv_git. Neither is superuser.
-- Replace the passwords + use a secret manager in production.
--
-- Apply:  psql "$ADMIN_DATABASE_URL" -f prisma/sql/roles.sql

-- ---------- web-backend: owns most tables ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cv_web') THEN
    CREATE ROLE cv_web LOGIN PASSWORD 'change-me-cv-web';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO cv_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cv_web;
-- web-backend does not write the git-service-owned tables.
REVOKE INSERT, UPDATE, DELETE ON "problems", "sync_runs" FROM cv_web;
GRANT SELECT ON "problems", "sync_runs" TO cv_web;

-- ---------- git-service: writes only problems + sync_runs (+ append notifications/audit) ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cv_git') THEN
    CREATE ROLE cv_git LOGIN PASSWORD 'change-me-cv-git';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO cv_git;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cv_git;
GRANT INSERT, UPDATE ON "problems", "sync_runs" TO cv_git;
GRANT INSERT ON "notifications", "audit_logs" TO cv_git;

-- ---------- append-only audit log (revoke mutation from app roles) ----------
REVOKE UPDATE, DELETE ON "audit_logs" FROM cv_web, cv_git;

-- ---------- read-only analytics role (NO access to secret tables) ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cv_read') THEN
    CREATE ROLE cv_read LOGIN PASSWORD 'change-me-cv-read';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO cv_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cv_read;
REVOKE SELECT ON "connection_secrets", "oauth_identities", "auth_sessions" FROM cv_read;
