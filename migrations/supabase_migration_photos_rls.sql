-- 90TC Migration: Photos RLS Fix
-- Ausführen in: Supabase → SQL Editor

-- RLS aktivieren (falls noch nicht)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies anlegen (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='Eigene Fotos lesen') THEN
    CREATE POLICY "Eigene Fotos lesen" ON photos FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='Eigene Fotos einfügen') THEN
    CREATE POLICY "Eigene Fotos einfügen" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='Eigene Fotos aktualisieren') THEN
    CREATE POLICY "Eigene Fotos aktualisieren" ON photos FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='Eigene Fotos löschen') THEN
    CREATE POLICY "Eigene Fotos löschen" ON photos FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Storage Bucket Policies (privater Bucket — nur eigene Dateien)
-- Bucket "photos" muss in Supabase → Storage als NICHT-public angelegt sein

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Photos upload own') THEN
    CREATE POLICY "Photos upload own" ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Photos read own') THEN
    CREATE POLICY "Photos read own" ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Photos update own') THEN
    CREATE POLICY "Photos update own" ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Photos delete own') THEN
    CREATE POLICY "Photos delete own" ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
