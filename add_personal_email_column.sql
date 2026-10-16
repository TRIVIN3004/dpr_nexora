-- ---------------------------------------------------------------------------
-- Migration: Add personalEmail column to public.users for Resend Email Alerts
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ---------------------------------------------------------------------------

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;

-- Optional: Populate default personal emails for existing staff accounts
UPDATE public.users SET "personalEmail" = 'trivin.nexora@gmail.com' WHERE id = 'EMP-001' AND "personalEmail" IS NULL;
UPDATE public.users SET "personalEmail" = 'pavithraa.alerts@gmail.com' WHERE id = 'EMP-006' AND "personalEmail" IS NULL;
UPDATE public.users SET "personalEmail" = 'logesh.alerts@gmail.com' WHERE id = 'EMP-017' AND "personalEmail" IS NULL;

-- ---------------------------------------------------------------------------
