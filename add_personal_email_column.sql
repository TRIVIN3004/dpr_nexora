-- ============================================================================
-- NEXORA DPR PORTAL — SUPABASE SCHEMA MIGRATION: ADD PERSONAL EMAIL COLUMN
-- Run this script in your Supabase SQL Editor (Dashboard > Project > SQL Editor)
-- ============================================================================

-- 1. Add "personalEmail" and "personal_email" columns to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "personal_email" TEXT;

-- 2. Populate real personal emails for all staff members
UPDATE public.users SET "personalEmail" = 'trivintrivin2005@gmail.com', "personal_email" = 'trivintrivin2005@gmail.com' WHERE id = 'EMP-0001';
UPDATE public.users SET "personalEmail" = 'trivintrivin2005@gmail.com', "personal_email" = 'trivintrivin2005@gmail.com' WHERE id = 'EMP-001';
UPDATE public.users SET "personalEmail" = 'aakashrajselvam@gmail.com', "personal_email" = 'aakashrajselvam@gmail.com' WHERE id = 'EMP-002';
UPDATE public.users SET "personalEmail" = 'akshuraj2005@gmail.com', "personal_email" = 'akshuraj2005@gmail.com' WHERE id = 'EMP-004';
UPDATE public.users SET "personalEmail" = 'amirthavarshinitd@gmail.com', "personal_email" = 'amirthavarshinitd@gmail.com' WHERE id = 'EMP-005';
UPDATE public.users SET "personalEmail" = 'pavithraayohan@gmail.com', "personal_email" = 'pavithraayohan@gmail.com' WHERE id = 'EMP-006';
UPDATE public.users SET "personalEmail" = 'ssujitha9307@gmail.com', "personal_email" = 'ssujitha9307@gmail.com' WHERE id = 'EMP-007';
UPDATE public.users SET "personalEmail" = 'sangamithrakesavan8@gmail.com', "personal_email" = 'sangamithrakesavan8@gmail.com' WHERE id = 'EMP-008';
UPDATE public.users SET "personalEmail" = 'aaryanjain950@gmail.com', "personal_email" = 'aaryanjain950@gmail.com' WHERE id = 'EMP-010';
UPDATE public.users SET "personalEmail" = 'ajay872072@gmail.com', "personal_email" = 'ajay872072@gmail.com' WHERE id = 'EMP-011';
UPDATE public.users SET "personalEmail" = 'pathmavathis2005@gmail.com', "personal_email" = 'pathmavathis2005@gmail.com' WHERE id = 'EMP-012';
UPDATE public.users SET "personalEmail" = 'poojavellingiri15@gmail.com', "personal_email" = 'poojavellingiri15@gmail.com' WHERE id = 'EMP-013';
UPDATE public.users SET "personalEmail" = 'mgokulashri944@gmail.com', "personal_email" = 'mgokulashri944@gmail.com' WHERE id = 'EMP-015';
UPDATE public.users SET "personalEmail" = 'sanjayselvakumar550@gmail.com', "personal_email" = 'sanjayselvakumar550@gmail.com' WHERE id = 'EMP-018';
UPDATE public.users SET "personalEmail" = 'sanjayvijay20051512@gmail.com', "personal_email" = 'sanjayvijay20051512@gmail.com' WHERE id = 'EMP-019';
UPDATE public.users SET "personalEmail" = 'vishwakrish2006@gmail.com', "personal_email" = 'vishwakrish2006@gmail.com' WHERE id = 'EMP-020';
UPDATE public.users SET "personalEmail" = 'shakthij162@gmail.com', "personal_email" = 'shakthij162@gmail.com' WHERE id = 'EMP-021';
UPDATE public.users SET "personalEmail" = 'naujawanf@gmail.com', "personal_email" = 'naujawanf@gmail.com' WHERE id = 'EMP-022';
UPDATE public.users SET "personalEmail" = 'gokulpriyan96@gmail.com', "personal_email" = 'gokulpriyan96@gmail.com' WHERE id = 'EMP-023';
UPDATE public.users SET "personalEmail" = 'naveensv0112@gmail.com', "personal_email" = 'naveensv0112@gmail.com' WHERE id = 'EMP-024';
UPDATE public.users SET "personalEmail" = 'arutselvan.alerts@gmail.com', "personal_email" = 'arutselvan.alerts@gmail.com' WHERE id = 'EMP-025';
UPDATE public.users SET "personalEmail" = 'sanjayvijay20051512@gmail.com', "personal_email" = 'sanjayvijay20051512@gmail.com' WHERE id = 'EMP-026';
UPDATE public.users SET "personalEmail" = 'anish30092007@gmail.com', "personal_email" = 'anish30092007@gmail.com' WHERE id = 'EMP-027';
UPDATE public.users SET "personalEmail" = 'sivaranjanisumathi75@gmail.com', "personal_email" = 'sivaranjanisumathi75@gmail.com' WHERE id = 'EMP-028';
UPDATE public.users SET "personalEmail" = 'santho06raj@gmail.com', "personal_email" = 'santho06raj@gmail.com' WHERE id = 'EMP-029';
UPDATE public.users SET "personalEmail" = 'mrohith0089@gmail.com', "personal_email" = 'mrohith0089@gmail.com' WHERE id = 'EMP-030';
UPDATE public.users SET "personalEmail" = 'prishaaraj06@gmail.com', "personal_email" = 'prishaaraj06@gmail.com' WHERE id = 'EMP-031';
UPDATE public.users SET "personalEmail" = 'Srinithikumar112@gmail.com', "personal_email" = 'Srinithikumar112@gmail.com' WHERE id = 'EMP-032';
UPDATE public.users SET "personalEmail" = 'dineshkumar.muthuvel2011@gmail.com', "personal_email" = 'dineshkumar.muthuvel2011@gmail.com' WHERE id = 'EMP-033';
UPDATE public.users SET "personalEmail" = 'vishnu30426@gmail.com', "personal_email" = 'vishnu30426@gmail.com' WHERE id = 'EMP-034';
UPDATE public.users SET "personalEmail" = 'sanjayselvakumar550@gmail.com', "personal_email" = 'sanjayselvakumar550@gmail.com' WHERE id = 'EMP-035';
UPDATE public.users SET "personalEmail" = 'bharathgandhi92@gmail.com', "personal_email" = 'bharathgandhi92@gmail.com' WHERE id = 'EMP-036';
UPDATE public.users SET "personalEmail" = 'angelsharon283@gmail.com', "personal_email" = 'angelsharon283@gmail.com' WHERE id = 'EMP-037';
UPDATE public.users SET "personalEmail" = 'nidiyarajkadavan@gmail.com', "personal_email" = 'nidiyarajkadavan@gmail.com' WHERE id = 'EMP-038';
UPDATE public.users SET "personalEmail" = 'krmadona23@gmail.com', "personal_email" = 'krmadona23@gmail.com' WHERE id = 'EMP-039';
UPDATE public.users SET "personalEmail" = 'kiruthika.dev@gmail.com', "personal_email" = 'kiruthika.dev@gmail.com' WHERE id = 'EMP-041';
UPDATE public.users SET "personalEmail" = 'yani.muizz2008@gmail.com', "personal_email" = 'yani.muizz2008@gmail.com' WHERE id = 'EMP-042';
UPDATE public.users SET "personalEmail" = 'waseemay1127@gmail.com', "personal_email" = 'waseemay1127@gmail.com' WHERE id = 'EMP-043';
UPDATE public.users SET "personalEmail" = 'kishoremohan1307@gmail.com', "personal_email" = 'kishoremohan1307@gmail.com' WHERE id = 'EMP-044';
UPDATE public.users SET "personalEmail" = 'srikreekszoldych@gmail.com', "personal_email" = 'srikreekszoldych@gmail.com' WHERE id = 'EMP-045';
UPDATE public.users SET "personalEmail" = 'sankarleo23@gmail.com', "personal_email" = 'sankarleo23@gmail.com' WHERE id = 'EMP-046';
UPDATE public.users SET "personalEmail" = 'cathrinemary0208@gmail.com', "personal_email" = 'cathrinemary0208@gmail.com' WHERE id = 'EMP-047';
UPDATE public.users SET "personalEmail" = 'ireneclemencia2311@gmail.com', "personal_email" = 'ireneclemencia2311@gmail.com' WHERE id = 'EMP-048';
UPDATE public.users SET "personalEmail" = 'srdharshanraj@gmail.com', "personal_email" = 'srdharshanraj@gmail.com' WHERE id = 'EMP-049';
UPDATE public.users SET "personalEmail" = 'keerthivasan30112005@gmail.com', "personal_email" = 'keerthivasan30112005@gmail.com' WHERE id = 'EMP-050';
UPDATE public.users SET "personalEmail" = 'gabyo894491@gmail.com', "personal_email" = 'gabyo894491@gmail.com' WHERE id = 'EMP-051';
UPDATE public.users SET "personalEmail" = 'kiruthikayoganand61205@gmail.com', "personal_email" = 'kiruthikayoganand61205@gmail.com' WHERE id = 'EMP-052';
UPDATE public.users SET "personalEmail" = 'Mubeenabanu2007@gmail.com', "personal_email" = 'Mubeenabanu2007@gmail.com' WHERE id = 'EMP-053';
UPDATE public.users SET "personalEmail" = 'rajsoundar637@gmail.com', "personal_email" = 'rajsoundar637@gmail.com' WHERE id = 'EMP-054';
UPDATE public.users SET "personalEmail" = 'vedhasivasankar.ss@gmail.com', "personal_email" = 'vedhasivasankar.ss@gmail.com' WHERE id = 'EMP-055';
UPDATE public.users SET "personalEmail" = 'priyadharshinipanneerselvam24@gmail.com', "personal_email" = 'priyadharshinipanneerselvam24@gmail.com' WHERE id = 'EMP-056';
UPDATE public.users SET "personalEmail" = 'kanimozhiprakash2006@gmail.com', "personal_email" = 'kanimozhiprakash2006@gmail.com' WHERE id = 'EMP-40';

-- Verify result:
SELECT id, name, email, "personalEmail" FROM public.users ORDER BY id;