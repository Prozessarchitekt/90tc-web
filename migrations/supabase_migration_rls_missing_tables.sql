-- Migration: RLS für fehlende Tabellen
-- Ausführen in: Supabase → SQL Editor

-- ── profiles ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Eigenes Profil lesen') THEN
    CREATE POLICY "Eigenes Profil lesen" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Eigenes Profil einfügen') THEN
    CREATE POLICY "Eigenes Profil einfügen" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Eigenes Profil aktualisieren') THEN
    CREATE POLICY "Eigenes Profil aktualisieren" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ── daily_entries ──────────────────────────────────────────────────
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_entries' AND policyname='Eigene Einträge lesen') THEN
    CREATE POLICY "Eigene Einträge lesen" ON daily_entries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_entries' AND policyname='Eigene Einträge einfügen') THEN
    CREATE POLICY "Eigene Einträge einfügen" ON daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_entries' AND policyname='Eigene Einträge aktualisieren') THEN
    CREATE POLICY "Eigene Einträge aktualisieren" ON daily_entries FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_entries' AND policyname='Eigene Einträge löschen') THEN
    CREATE POLICY "Eigene Einträge löschen" ON daily_entries FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── meal_entries ───────────────────────────────────────────────────
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_entries' AND policyname='Eigene Mahlzeiten lesen') THEN
    CREATE POLICY "Eigene Mahlzeiten lesen" ON meal_entries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_entries' AND policyname='Eigene Mahlzeiten einfügen') THEN
    CREATE POLICY "Eigene Mahlzeiten einfügen" ON meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_entries' AND policyname='Eigene Mahlzeiten löschen') THEN
    CREATE POLICY "Eigene Mahlzeiten löschen" ON meal_entries FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── weekly_checks ──────────────────────────────────────────────────
ALTER TABLE weekly_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_checks' AND policyname='Eigene Wochenchecks lesen') THEN
    CREATE POLICY "Eigene Wochenchecks lesen" ON weekly_checks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_checks' AND policyname='Eigene Wochenchecks einfügen') THEN
    CREATE POLICY "Eigene Wochenchecks einfügen" ON weekly_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_checks' AND policyname='Eigene Wochenchecks aktualisieren') THEN
    CREATE POLICY "Eigene Wochenchecks aktualisieren" ON weekly_checks FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_checks' AND policyname='Eigene Wochenchecks löschen') THEN
    CREATE POLICY "Eigene Wochenchecks löschen" ON weekly_checks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── user_badges ────────────────────────────────────────────────────
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='Eigene Badges lesen') THEN
    CREATE POLICY "Eigene Badges lesen" ON user_badges FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='Eigene Badges einfügen') THEN
    CREATE POLICY "Eigene Badges einfügen" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── community_posts ────────────────────────────────────────────────
-- Lesen: alle eingeloggten User (Community-Feature)
-- Schreiben/Löschen: nur eigene Posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_posts' AND policyname='Community lesen') THEN
    CREATE POLICY "Community lesen" ON community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_posts' AND policyname='Eigene Posts einfügen') THEN
    CREATE POLICY "Eigene Posts einfügen" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  -- Likes können von allen eingeloggten Usern erhöht werden
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_posts' AND policyname='Likes aktualisieren') THEN
    CREATE POLICY "Likes aktualisieren" ON community_posts FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_posts' AND policyname='Eigene Posts löschen') THEN
    CREATE POLICY "Eigene Posts löschen" ON community_posts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
