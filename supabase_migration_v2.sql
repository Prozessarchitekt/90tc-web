-- 90TC Migration v2 — Neue Features
-- Ausführen in: Supabase → SQL Editor

-- Neue Spalten in daily_entries
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS intention TEXT;
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS koerper_gefuehl INTEGER CHECK (koerper_gefuehl BETWEEN 1 AND 5);
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS score_faktoren TEXT;

-- Neue Spalten in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'orange';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_schutz_verfuegbar INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_schutz_genutzt_am DATE;

-- Wöchentliche Reflexionen
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  woche_nr INTEGER NOT NULL,
  gut_gelaufen TEXT,
  schwer_gewesen TEXT,
  aenderung TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, woche_nr)
);

ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_reflections' AND policyname='Eigene Reflexionen lesen') THEN
    CREATE POLICY "Eigene Reflexionen lesen" ON weekly_reflections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_reflections' AND policyname='Eigene Reflexionen schreiben') THEN
    CREATE POLICY "Eigene Reflexionen schreiben" ON weekly_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_reflections' AND policyname='Eigene Reflexionen aktualisieren') THEN
    CREATE POLICY "Eigene Reflexionen aktualisieren" ON weekly_reflections FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_reflections' AND policyname='Eigene Reflexionen loeschen') THEN
    CREATE POLICY "Eigene Reflexionen loeschen" ON weekly_reflections FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Community: likes Spalte sicherstellen
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
