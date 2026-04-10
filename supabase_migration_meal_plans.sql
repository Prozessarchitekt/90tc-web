-- Migration: meal_plans Tabelle für Ernährungsplan-Feature
-- Ausführen in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS meal_plans (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users ON DELETE CASCADE,
  name              text NOT NULL DEFAULT 'Mein Plan',
  mahlzeiten_anzahl int  NOT NULL DEFAULT 4,
  plan_data         jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Jeder sieht nur seine eigenen Pläne
CREATE POLICY "meal_plans_select" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meal_plans_insert" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_plans_delete" ON meal_plans FOR DELETE USING (auth.uid() = user_id);
