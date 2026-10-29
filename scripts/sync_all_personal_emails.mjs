import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://qwvdyyeyzpqtxqzithso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BpSLx7DlTk4I5weA9fK1Yg_JSvA8tWa';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const MASTER_PERSONAL_EMAILS = {
  // Employee IDs
  'EMP-0001': 'trivintrivin2005@gmail.com',
  'EMP-001': 'trivintrivin2005@gmail.com',
  'EMP-002': 'aakashrajselvam@gmail.com',
  'EMP-004': 'akshuraj2005@gmail.com',
  'EMP-005': 'amirthavarshinitd@gmail.com',
  'EMP-006': 'pavithraayohan@gmail.com',
  'EMP-007': 'ssujitha9307@gmail.com',
  'EMP-008': 'sangamithrakesavan8@gmail.com',
  'EMP-010': 'aaryanjain950@gmail.com',
  'EMP-011': 'ajay872072@gmail.com',
  'EMP-012': 'pathmavathis2005@gmail.com',
  'EMP-013': 'poojavellingiri15@gmail.com',
  'EMP-015': 'mgokulashri944@gmail.com',
  'EMP-017': 'logesh.alerts@gmail.com',
  'EMP-018': 'sanjayselvakumar550@gmail.com',
  'EMP-019': 'sanjayvijay20051512@gmail.com',
  'EMP-020': 'vishwakrish2006@gmail.com',
  'EMP-021': 'shakthij162@gmail.com',
  'EMP-022': 'naujawanf@gmail.com',
  'EMP-023': 'gokulpriyan96@gmail.com',
  'EMP-024': 'naveensv0112@gmail.com',
  'EMP-025': 'arutselvan.alerts@gmail.com',
  'EMP-026': 'sanjayvijay20051512@gmail.com',
  'EMP-027': 'anish30092007@gmail.com',
  'EMP-028': 'sivaranjanisumathi75@gmail.com',
  'EMP-029': 'santho06raj@gmail.com',
  'EMP-030': 'mrohith0089@gmail.com',
  'EMP-031': 'prishaaraj06@gmail.com',
  'EMP-032': 'Srinithikumar112@gmail.com',
  'EMP-033': 'dineshkumar.muthuvel2011@gmail.com',
  'EMP-034': 'vishnu30426@gmail.com',
  'EMP-035': 'sanjayselvakumar550@gmail.com',
  'EMP-036': 'bharathgandhi92@gmail.com',
  'EMP-037': 'angelsharon283@gmail.com',
  'EMP-038': 'nidiyarajkadavan@gmail.com',
  'EMP-039': 'krmadona23@gmail.com',
  'EMP-040': 'kanimozhiprakash2006@gmail.com',
  'EMP-40': 'kanimozhiprakash2006@gmail.com',
  'EMP-041': 'kiruthika.dev@gmail.com',
  'EMP-042': 'yani.muizz2008@gmail.com',
  'EMP-043': 'waseemay1127@gmail.com',
  'EMP-044': 'kishoremohan1307@gmail.com',
  'EMP-045': 'srikreekszoldych@gmail.com',
  'EMP-046': 'sankarleo23@gmail.com',
  'EMP-047': 'cathrinemary0208@gmail.com',
  'EMP-048': 'ireneclemencia2311@gmail.com',
  'EMP-049': 'srdharshanraj@gmail.com',
  'EMP-050': 'keerthivasan30112005@gmail.com',
  'EMP-051': 'gabyo894491@gmail.com',
  'EMP-052': 'kiruthikayoganand61205@gmail.com',
  'EMP-053': 'Mubeenabanu2007@gmail.com',
  'EMP-054': 'rajsoundar637@gmail.com',
  'EMP-055': 'vedhasivasankar.ss@gmail.com',
  'EMP-056': 'priyadharshinipanneerselvam24@gmail.com',
  'USR-001': 'contactnexoratechs@gmail.com',
  'USR-002': 'alex.johnson.personal@gmail.com',
  'USR-003': 'sarah.miller.personal@gmail.com',

  // Work Emails
  'trivin@nexora.com': 'trivintrivin2005@gmail.com',
  'testing@nexora.com': 'trivintrivin2005@gmail.com',
  'aakashraj@nexora.com': 'aakashrajselvam@gmail.com',
  'akshaya@nexora.com': 'akshuraj2005@gmail.com',
  'amirtha@nexora.com': 'amirthavarshinitd@gmail.com',
  'pavithraa@nexora.com': 'pavithraayohan@gmail.com',
  'sujitha@nexora.com': 'ssujitha9307@gmail.com',
  'sangamithra@nexora.com': 'sangamithrakesavan8@gmail.com',
  'aaryan@nexora.com': 'aaryanjain950@gmail.com',
  'ajaykumar@nexora.com': 'ajay872072@gmail.com',
  'pathmavathi@nexora.com': 'pathmavathis2005@gmail.com',
  'pooja@nexora.com': 'poojavellingiri15@gmail.com',
  'gokulashri@nexora.com': 'mgokulashri944@gmail.com',
  'sanjaykumar@nexora.com': 'sanjayselvakumar550@gmail.com',
  'sanjays@nexora.com': 'sanjayselvakumar550@gmail.com',
  'sanjayt@nexora.com': 'sanjayvijay20051512@gmail.com',
  'sanjay@nexora.com': 'sanjayvijay20051512@gmail.com',
  'vishwa@nexora.com': 'vishwakrish2006@gmail.com',
  'shakthi@nexora.com': 'shakthij162@gmail.com',
  'farman@nexora.com': 'naujawanf@gmail.com',
  'gokul@nexora.com': 'gokulpriyan96@gmail.com',
  'naveen@nexora.com': 'naveensv0112@gmail.com',
  'anish@nexora.com': 'anish30092007@gmail.com',
  'sivaranjini@nexora.com': 'sivaranjanisumathi75@gmail.com',
  'santhoshraj@nexora.com': 'santho06raj@gmail.com',
  'rohit@nexora.com': 'mrohith0089@gmail.com',
  'prisha@nexora.com': 'prishaaraj06@gmail.com',
  'srinithi@nexora.com': 'Srinithikumar112@gmail.com',
  'dinesh@nexora.com': 'dineshkumar.muthuvel2011@gmail.com',
  'vishnu@nexora.com': 'vishnu30426@gmail.com',
  'bharath@nexora.com': 'bharathgandhi92@gmail.com',
  'sharon@nexora.com': 'angelsharon283@gmail.com',
  'nidiya@nexora.com': 'nidiyarajkadavan@gmail.com',
  'madona@nexora.com': 'krmadona23@gmail.com',
  'kanimozhi@nexora.com': 'kanimozhiprakash2006@gmail.com',
  'yani@nexora.com': 'yani.muizz2008@gmail.com',
  'waseem@nexora.com': 'waseemay1127@gmail.com',
  'kishore@nexora.com': 'kishoremohan1307@gmail.com',
  'srijith@nexora.com': 'srikreekszoldych@gmail.com',
  'sankar@nexora.com': 'sankarleo23@gmail.com',
  'rubeena@nexora.com': 'cathrinemary0208@gmail.com',
  'irene@nexora.com': 'ireneclemencia2311@gmail.com',
  'dharshanraj@nexora.com': 'srdharshanraj@gmail.com',
  'keerthivasan@nexora.com': 'keerthivasan30112005@gmail.com',
  'jeff@nexora.com': 'gabyo894491@gmail.com',
  'kiruthika@nexora.com': 'kiruthika.dev@gmail.com',
  'kiruthikayoganand@nexora.com': 'kiruthikayoganand61205@gmail.com',
  'mubeena@nexora.com': 'Mubeenabanu2007@gmail.com',
  'soundararaj@nexora.com': 'rajsoundar637@gmail.com',
  'vedha@nexora.com': 'vedhasivasankar.ss@gmail.com',
  'priyadharshini@nexora.com': 'priyadharshinipanneerselvam24@gmail.com',
  'admin@nexora.com': 'contactnexoratechs@gmail.com',

  // Names (lowercase)
  'vedha': 'vedhasivasankar.ss@gmail.com',
  'vedha s': 'vedhasivasankar.ss@gmail.com',
  'mubeena': 'Mubeenabanu2007@gmail.com',
  'kiruthika yoganand': 'kiruthikayoganand61205@gmail.com',
  'soundararaj': 'rajsoundar637@gmail.com',
  'priyadharshini': 'priyadharshinipanneerselvam24@gmail.com',
  'priyadharshini panneerselvam': 'priyadharshinipanneerselvam24@gmail.com'
};

async function syncAll() {
  console.log('🔄 Fetching all users from Supabase...');
  const { data: users, error: fetchErr } = await supabase.from('users').select('*').order('id');
  if (fetchErr) {
    console.error('Error fetching users:', fetchErr);
    return;
  }
  console.log(`Found ${users.length} users in Supabase.`);

  // 1. Sync to Supabase attendance_reports SYS_CONFIG_EMAILS
  console.log('☁️ Syncing master emails map to Supabase attendance_reports (SYS_CONFIG_EMAILS)...');
  const payload = {
    id: 'SYS_CONFIG_EMAILS',
    reportType: 'CONFIG',
    filters: MASTER_PERSONAL_EMAILS,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Personal Email Master Sync'
  };

  const { error: upsertErr } = await supabase.from('attendance_reports').upsert(payload);
  if (upsertErr) {
    console.error('❌ Failed to sync to attendance_reports:', upsertErr);
  } else {
    console.log('✅ Successfully saved to attendance_reports (SYS_CONFIG_EMAILS)!');
  }

  // 2. Try updating users table directly (if personalEmail / personal_email column exists)
  console.log('🔍 Checking if personalEmail column exists on users table in Supabase...');
  let canUpdateUsersTable = false;
  const testRes = await supabase.from('users').update({ personalEmail: 'test@example.com' }).eq('id', 'NON_EXISTENT');
  if (!testRes.error) {
    canUpdateUsersTable = true;
    console.log('✅ Column personalEmail exists on users table!');
  } else {
    console.log('ℹ️ Column personalEmail does not exist on users table yet:', testRes.error.message);
  }

  if (canUpdateUsersTable) {
    console.log('📝 Updating personalEmail for all users in Supabase users table...');
    let updatedCount = 0;
    for (const u of users) {
      const email = MASTER_PERSONAL_EMAILS[u.id] || MASTER_PERSONAL_EMAILS[u.email?.toLowerCase().trim()];
      if (email) {
        await supabase.from('users').update({ personalEmail: email, personal_email: email }).eq('id', u.id);
        updatedCount++;
      }
    }
    console.log(`✅ Updated ${updatedCount} users in public.users table!`);
  }

  // 3. Generate clean SQL migration file add_personal_email_column.sql
  console.log('📄 Generating add_personal_email_column.sql for Supabase SQL Editor...');
  const sqlLines = [
    '-- ============================================================================',
    '-- NEXORA DPR PORTAL — SUPABASE SCHEMA MIGRATION: ADD PERSONAL EMAIL COLUMN',
    '-- Run this script in your Supabase SQL Editor (Dashboard > Project > SQL Editor)',
    '-- ============================================================================',
    '',
    '-- 1. Add "personalEmail" and "personal_email" columns to public.users table',
    'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;',
    'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "personal_email" TEXT;',
    '',
    '-- 2. Populate real personal emails for all staff members'
  ];

  for (const u of users) {
    const email = MASTER_PERSONAL_EMAILS[u.id] || MASTER_PERSONAL_EMAILS[u.email?.toLowerCase().trim()];
    if (email) {
      sqlLines.push(`UPDATE public.users SET "personalEmail" = '${email}', "personal_email" = '${email}' WHERE id = '${u.id}';`);
    }
  }

  sqlLines.push('');
  sqlLines.push('-- Verify result:');
  sqlLines.push('SELECT id, name, email, "personalEmail" FROM public.users ORDER BY id;');

  const sqlPath = path.resolve(process.cwd(), 'add_personal_email_column.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');
  console.log(`✅ Generated ${sqlPath} successfully with ${users.length} staff updates!`);
}

syncAll();
