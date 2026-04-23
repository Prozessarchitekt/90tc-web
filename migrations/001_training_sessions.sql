-- 90TC Migration: Training Tables
-- Ausführen in: Supabase → SQL Editor

-- ── training_sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  datum       date NOT NULL DEFAULT CURRENT_DATE,
  plan_name   text,
  notizen     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sessions' AND policyname='Eigene Sessions lesen') THEN
    CREATE POLICY "Eigene Sessions lesen" ON training_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sessions' AND policyname='Eigene Sessions einfügen') THEN
    CREATE POLICY "Eigene Sessions einfügen" ON training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sessions' AND policyname='Eigene Sessions aktualisieren') THEN
    CREATE POLICY "Eigene Sessions aktualisieren" ON training_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sessions' AND policyname='Eigene Sessions löschen') THEN
    CREATE POLICY "Eigene Sessions löschen" ON training_sessions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── training_sets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_sets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  uebung          text NOT NULL,
  satz_nr         integer NOT NULL,
  wiederholungen  integer,
  gewicht_kg      numeric(6,2),
  ist_pr          boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE training_sets ENABLE ROW LEVEL SECURITY;

-- Sets über session_id auf user_id prüfen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sets' AND policyname='Eigene Sets lesen') THEN
    CREATE POLICY "Eigene Sets lesen" ON training_sets FOR SELECT
      USING (EXISTS (SELECT 1 FROM training_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sets' AND policyname='Eigene Sets einfügen') THEN
    CREATE POLICY "Eigene Sets einfügen" ON training_sets FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM training_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_sets' AND policyname='Eigene Sets löschen') THEN
    CREATE POLICY "Eigene Sets löschen" ON training_sets FOR DELETE
      USING (EXISTS (SELECT 1 FROM training_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
  END IF;
END $$;

-- ── personal_records ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  uebung      text NOT NULL,
  gewicht_kg  numeric(6,2) NOT NULL,
  datum       date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, uebung)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='personal_records' AND policyname='Eigene PRs lesen') THEN
    CREATE POLICY "Eigene PRs lesen" ON personal_records FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='personal_records' AND policyname='Eigene PRs einfügen') THEN
    CREATE POLICY "Eigene PRs einfügen" ON personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='personal_records' AND policyname='Eigene PRs aktualisieren') THEN
    CREATE POLICY "Eigene PRs aktualisieren" ON personal_records FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='personal_records' AND policyname='Eigene PRs löschen') THEN
    CREATE POLICY "Eigene PRs löschen" ON personal_records FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
