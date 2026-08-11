/**
 * Nexora DPR — Safe Base64 Storage Migration Utility
 * ===================================================
 * Safe non-destructive script to migrate embedded Base64 Data URLs
 * in `reports.images` and `users.avatar` into Supabase Storage buckets.
 *
 * Usage:
 *   node scripts/migrate_base64_storage.mjs             (runs live migration)
 *   node scripts/migrate_base64_storage.mjs --dry-run   (inspects records without modifying)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qwvdyyeyzpqtxqzithso.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BpSLx7DlTk4I5weA9fK1Yg_JSvA8tWa';
const BUCKET_NAME = process.env.VITE_STORAGE_BUCKET || 'dpr-attachments';

const isDryRun = process.argv.includes('--dry-run');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isBase64(str) {
  return typeof str === 'string' && (str.startsWith('data:image/') || str.startsWith('data:application/'));
}

async function uploadBase64(base64Str, filename, folder) {
  const matches = base64Str.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.split('/')[1] || 'png';
  const filePath = `${folder}/${filename}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Bucket upload error: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
  return urlData.publicUrl;
}

async function runMigration() {
  console.log('\n==================================================');
  console.log(' NEXORA DPR — BASE64 STORAGE MIGRATION UTILITY');
  console.log('==================================================');
  console.log(` Mode: ${isDryRun ? 'DRY RUN (No database updates)' : 'LIVE MIGRATION'}`);
  console.log(` Target Supabase URL: ${SUPABASE_URL}`);
  console.log(` Storage Bucket: ${BUCKET_NAME}\n`);

  const metrics = {
    usersTotal: 0,
    usersMigrated: 0,
    usersFailed: 0,
    usersSkipped: 0,
    reportsTotal: 0,
    reportsMigrated: 0,
    reportsFailed: 0,
    reportsSkipped: 0,
  };

  // 1. Migrate Users Avatars
  console.log('--- 1. Checking USERS table for Base64 avatars ---');
  try {
    const { data: users, error: userErr } = await supabase.from('users').select('id, name, email, avatar');
    if (userErr) {
      console.error('Failed to query users table:', userErr.message);
    } else if (users) {
      metrics.usersTotal = users.length;
      for (const u of users) {
        if (isBase64(u.avatar)) {
          console.log(`  🔍 User [${u.id} - ${u.name}]: Base64 avatar detected (~${Math.round(u.avatar.length / 1024)} KB)`);
          if (!isDryRun) {
            try {
              const publicUrl = await uploadBase64(u.avatar, `avatar_${u.id}`, 'avatars');
              if (publicUrl) {
                const { error: updateErr } = await supabase.from('users').update({ avatar: publicUrl }).eq('id', u.id);
                if (updateErr) throw updateErr;
                console.log(`     ✅ Successfully migrated to: ${publicUrl}`);
                metrics.usersMigrated++;
              }
            } catch (err) {
              console.error(`     ❌ Migration failed for user ${u.id}:`, err.message);
              metrics.usersFailed++;
            }
          } else {
            metrics.usersMigrated++;
          }
        } else {
          metrics.usersSkipped++;
        }
      }
    }
  } catch (e) {
    console.error('Error scanning users:', e.message);
  }

  // 2. Migrate Reports Images
  console.log('\n--- 2. Checking REPORTS table for Base64 images ---');
  try {
    const { data: reports, error: repErr } = await supabase.from('reports').select('id, employeeName, images');
    if (repErr) {
      console.error('Failed to query reports table:', repErr.message);
    } else if (reports) {
      metrics.reportsTotal = reports.length;
      for (const r of reports) {
        if (Array.isArray(r.images) && r.images.some(isBase64)) {
          console.log(`  🔍 Report [${r.id} - ${r.employeeName}]: Base64 image array detected (${r.images.length} items)`);
          if (!isDryRun) {
            try {
              const updatedImages = [];
              for (let i = 0; i < r.images.length; i++) {
                const imgStr = r.images[i];
                if (isBase64(imgStr)) {
                  const url = await uploadBase64(imgStr, `rep_${r.id}_${i}`, 'reports');
                  updatedImages.push(url);
                } else {
                  updatedImages.push(imgStr);
                }
              }
              const { error: updateErr } = await supabase.from('reports').update({ images: updatedImages }).eq('id', r.id);
              if (updateErr) throw updateErr;
              console.log(`     ✅ Successfully migrated ${updatedImages.length} images for report ${r.id}`);
              metrics.reportsMigrated++;
            } catch (err) {
              console.error(`     ❌ Migration failed for report ${r.id}:`, err.message);
              metrics.reportsFailed++;
            }
          } else {
            metrics.reportsMigrated++;
          }
        } else {
          metrics.reportsSkipped++;
        }
      }
    }
  } catch (e) {
    console.error('Error scanning reports:', e.message);
  }

  // Summary Report
  console.log('\n==================================================');
  console.log(' MIGRATION SUMMARY REPORT');
  console.log('==================================================');
  console.log(` Users Scanned         : ${metrics.usersTotal}`);
  console.log(` Users Base64 Migrated : ${metrics.usersMigrated}`);
  console.log(` Users Skipped        : ${metrics.usersSkipped}`);
  console.log(` Users Failed         : ${metrics.usersFailed}`);
  console.log('--------------------------------------------------');
  console.log(` Reports Scanned        : ${metrics.reportsTotal}`);
  console.log(` Reports Base64 Migrated: ${metrics.reportsMigrated}`);
  console.log(` Reports Skipped       : ${metrics.reportsSkipped}`);
  console.log(` Reports Failed        : ${metrics.reportsFailed}`);
  console.log('==================================================\n');
}

runMigration().catch((e) => console.error('Migration error:', e));
