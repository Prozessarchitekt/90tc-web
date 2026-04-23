-- Migration: Bevel overnight vitals in daily_entries
ALTER TABLE daily_entries
  ADD COLUMN IF NOT EXISTS bevel_recovery_pct  integer,
  ADD COLUMN IF NOT EXISTS bevel_schlaf_score  integer,
  ADD COLUMN IF NOT EXISTS bevel_hrv_ms        integer,
  ADD COLUMN IF NOT EXISTS bevel_resting_hr    integer;
