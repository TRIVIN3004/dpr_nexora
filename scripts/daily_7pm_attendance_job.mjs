/**
 * Nexora DPR - 7:00 PM Daily Attendance Email Dispatcher
 * Automatically dispatches:
 * 1. "Present" confirmation emails to all staff who checked in today.
 * 2. "Absent" notification emails to all staff who did not check in or take leave by 7:00 PM.
 * 
 * SENDER: Nexora DPR Notifications <alerts@dpralerts.nexoratechs.xyz>
 * NOTE: Strictly zero mentions of Resend name.
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { 
  DEFAULT_PERSONAL_EMAILS, 
  getPersonalEmail,
  isExcludedMember,
  EXCLUDED_MEMBER_IDS,
  generateAttendancePresentEmail,
  generateAttendanceAbsentEmail 
} from '../src/utils/emailService.js';

import fs from 'fs';
import path from 'path';

function resolveApiKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  if (process.env.VITE_RESEND_API_KEY) return process.env.VITE_RESEND_API_KEY;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/RESEND_API_KEY=([^\r\n]+)/);
      if (match) return match[1].trim();
    }
  } catch (e) {}
  return '';
}

const API_KEY = resolveApiKey();
const FROM_EMAIL = 'Nexora DPR Notifications <alerts@dpralerts.nexoratechs.xyz>';
const SUPABASE_URL = 'https://qwvdyyeyzpqtxqzithso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BpSLx7DlTk4I5weA9fK1Yg_JSvA8tWa';
const PORTAL_URL = 'https://dpralerts.nexoratechs.xyz';

const resend = new Resend(API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function runDailyAttendanceJob(options = {}) {
  const { forceRun = false, dryRun = false } = options;
  const todayStr = getTodayString();
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

  console.log('========================================================');
  console.log(`⏰ NEXORA DPR - 7:00 PM DAILY ATTENDANCE DISPATCH`);
  console.log(`Date: ${todayStr} | Local Time: ${now.toLocaleTimeString()}`);
  console.log('========================================================');

  // Check if weekend (unless forced)
  if ((dayOfWeek === 0 || dayOfWeek === 6) && !forceRun) {
    console.log('🌴 Today is a weekend (Saturday/Sunday). Skipping daily attendance cutoff.');
    return { skipped: true, reason: 'weekend' };
  }

  // 1. Fetch staff members
  console.log('📡 Fetching active staff roster...');
  let users = [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('⚠️ Could not load users from Supabase, using default roster mapping:', error?.message);
      users = Object.entries(DEFAULT_PERSONAL_EMAILS).map(([id, mail]) => ({
        id,
        name: id,
        email: mail,
        department: 'Engineering'
      }));
    } else {
      users = data;
    }
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return { success: false, error: err.message };
  }

  // Filter out excluded members (e.g. Gopika, Aarathana, Karthikeyan)
  users = users.filter(u => !isExcludedMember(u) && !EXCLUDED_MEMBER_IDS.includes((u.id || '').toUpperCase()));
  console.log(`👥 Active staff to evaluate: ${users.length} members`);

  // 2. Fetch today's attendance records
  console.log(`📋 Fetching today's attendance records (${todayStr})...`);
  let todayRecords = [];
  try {
    const { data: recs, error: recsErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', todayStr);

    if (!recsErr && recs) {
      todayRecords = recs;
    }
  } catch (err) {
    console.warn('Error fetching attendance records:', err.message);
  }

  // 3. Categorize staff into Present vs Absent
  const presentList = [];
  const absentList = [];
  const recordsToUpsert = [];

  for (const user of users) {
    const personalMail = getPersonalEmail(user);
    if (!personalMail || !personalMail.includes('@')) {
      continue;
    }

    const rec = todayRecords.find(r => r.employeeId === user.id);

    if (rec && (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Half Day')) {
      presentList.push({
        user,
        personalMail,
        record: rec,
        status: rec.status,
        checkInTime: rec.checkInTime || '09:00 AM',
        checkOutTime: rec.checkOutTime || '05:00 PM',
        remarks: rec.remarks || 'Present & Verified'
      });
    } else if (rec && rec.status === 'Leave') {
      console.log(`🌴 ${user.name} (${user.id}) is on Approved Leave. Skipping absent notice.`);
    } else {
      // Marked absent or not checked in
      absentList.push({
        user,
        personalMail,
        record: rec,
        status: 'Absent',
        reason: rec?.remarks || 'Unexcused Absence (No check-in or leave record by 7:00 PM cutoff)'
      });

      // If no record exists, prepare record to insert
      if (!rec) {
        recordsToUpsert.push({
          id: `ATT-${todayStr}-${user.id}`,
          employeeId: user.id,
          employeeName: user.name,
          department: user.department || 'General',
          project: 'Nexora ERP',
          role: user.role || 'member',
          date: todayStr,
          checkInTime: '',
          checkOutTime: '',
          status: 'Absent',
          remarks: 'Auto-Marked Absent: No check-in recorded by 7:00 PM cutoff',
          markedBy: 'System Auto-Cutoff (7:00 PM)',
          editHistory: []
        });
      }
    }
  }

  console.log(`📊 Summary for today:`);
  console.log(`   ✅ Present: ${presentList.length}`);
  console.log(`   ⚠️ Absent:  ${absentList.length}`);

  // Upsert absent records into Supabase
  if (recordsToUpsert.length > 0 && !dryRun) {
    try {
      console.log(`💾 Auto-recording ${recordsToUpsert.length} absent records in database...`);
      await supabase.from('attendance').upsert(recordsToUpsert);
    } catch (e) {
      console.warn('Upsert note:', e.message);
    }
  }

  // 4. Dispatch Present Emails
  const results = {
    presentSent: 0,
    absentSent: 0,
    failed: 0,
    details: []
  };

  console.log('\n📬 Dispatching "PRESENT" confirmation emails...');
  for (let i = 0; i < presentList.length; i++) {
    const item = presentList[i];
    const html = generateAttendancePresentEmail({
      employeeName: item.user.name,
      employeeId: item.user.id,
      department: item.user.department || 'General',
      date: todayStr,
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
      attendancePct: 95,
      remarks: item.remarks
    });

    const subject = `✅ Attendance Verified: Present on ${todayStr} [${item.user.name}]`;

    if (dryRun) {
      console.log(`[DRY-RUN] Would send PRESENT to ${item.user.name} <${item.personalMail}>`);
      results.presentSent++;
      continue;
    }

    try {
      const res = await resend.emails.send({
        from: FROM_EMAIL,
        to: [item.personalMail],
        subject,
        html,
        text: `Hello ${item.user.name}, your attendance for ${todayStr} has been recorded as PRESENT.`
      });

      if (res.error) {
        console.error(`❌ PRESENT failed for ${item.user.name}:`, res.error.message);
        results.failed++;
      } else {
        console.log(`✅ [PRESENT ${i + 1}/${presentList.length}] Sent to ${item.user.name} <${item.personalMail}> (ID: ${res.data?.id})`);
        results.presentSent++;
      }
    } catch (err) {
      console.error(`❌ PRESENT error for ${item.user.name}:`, err.message);
      results.failed++;
    }

    await sleep(550);
  }

  // 5. Dispatch Absent Emails
  console.log('\n📬 Dispatching "ABSENT" warning/notice emails...');
  for (let i = 0; i < absentList.length; i++) {
    const item = absentList[i];
    const html = generateAttendanceAbsentEmail({
      employeeName: item.user.name,
      employeeId: item.user.id,
      department: item.user.department || 'General',
      date: todayStr,
      reason: item.reason,
      attendancePct: 65
    });

    const subject = `⚠️ Notice: Absence Recorded on ${todayStr} [${item.user.name}]`;

    if (dryRun) {
      console.log(`[DRY-RUN] Would send ABSENT to ${item.user.name} <${item.personalMail}>`);
      results.absentSent++;
      continue;
    }

    try {
      const res = await resend.emails.send({
        from: FROM_EMAIL,
        to: [item.personalMail],
        subject,
        html,
        text: `Dear ${item.user.name}, you have been marked Absent for ${todayStr}. Please submit a leave request if this was an excused absence.`
      });

      if (res.error) {
        console.error(`❌ ABSENT failed for ${item.user.name}:`, res.error.message);
        results.failed++;
      } else {
        console.log(`⚠️ [ABSENT ${i + 1}/${absentList.length}] Sent to ${item.user.name} <${item.personalMail}> (ID: ${res.data?.id})`);
        results.absentSent++;
      }
    } catch (err) {
      console.error(`❌ ABSENT error for ${item.user.name}:`, err.message);
      results.failed++;
    }

    await sleep(550);
  }

  console.log('========================================================');
  console.log('🎉 7:00 PM DAILY DISPATCH COMPLETE!');
  console.log(`Present Emails Sent: ${results.presentSent}`);
  console.log(`Absent Emails Sent:  ${results.absentSent}`);
  console.log(`Failed / Errors:     ${results.failed}`);
  console.log('========================================================');

  return results;
}

// Direct CLI Execution
if (process.argv[1]?.endsWith('daily_7pm_attendance_job.mjs')) {
  const isForce = process.argv.includes('--force');
  const isDry = process.argv.includes('--dry-run');
  runDailyAttendanceJob({ forceRun: isForce, dryRun: isDry })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal job error:', err);
      process.exit(1);
    });
}
