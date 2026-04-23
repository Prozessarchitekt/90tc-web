-- Migration: Performance-Indexes für häufige Queries
-- Ausführen in: Supabase → SQL Editor
-- Erwarteter Gewinn: 500ms–1s pro Query bei wachsender Nutzerzahl

-- ── daily_entries ──────────────────────────────────────────────────────────
-- Jede Seite filtert nach user_id + datum
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_datum
  ON daily_entries(user_id, datum);

CREATE INDEX IF NOT EXISTS idx_daily_entries_user_tag_nr
  ON daily_entries(user_id, tag_nr);

-- ── training_sessions ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_datum
  ON training_sessions(user_id, datum);

-- ── user_badges ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id
  ON user_badges(user_id);

-- ── weekly_checks ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_weekly_checks_user_woche
  ON weekly_checks(user_id, woche_nr);

-- ── personal_records ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_personal_records_user_datum
  ON personal_records(user_id, datum);

-- ── meal_entries ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_datum
  ON meal_entries(user_id, datum);
