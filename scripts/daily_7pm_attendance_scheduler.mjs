/**
 * Nexora DPR - 7:00 PM Daily Attendance Daemon Scheduler
 * Runs continuously in the background and automatically triggers the daily
 * attendance emails (Present and Absent) every day at 7:00 PM IST.
 */

import { runDailyAttendanceJob } from './daily_7pm_attendance_job.mjs';

// Calculate milliseconds until next 7:00 PM IST (UTC+5:30)
function getMsUntilNext7PMIST() {
  const now = new Date();
  
  // Convert current time to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istNow = new Date(utcNow + istOffset);

  // Target today 19:00:00 IST
  const targetIST = new Date(istNow);
  targetIST.setHours(19, 0, 0, 0);

  // If 7:00 PM IST already passed today, target tomorrow 7:00 PM IST
  if (istNow >= targetIST) {
    targetIST.setDate(targetIST.getDate() + 1);
  }

  const msRemaining = targetIST.getTime() - istNow.getTime();
  return { msRemaining, targetDate: targetIST };
}

async function scheduleNextRun() {
  const { msRemaining, targetDate } = getMsUntilNext7PMIST();
  const hours = (msRemaining / (1000 * 60 * 60)).toFixed(2);
  
  console.log(`\n⏳ Next 7:00 PM IST Daily Attendance Email scheduled for:`);
  console.log(`   ${targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST (~${hours} hours from now)`);

  setTimeout(async () => {
    console.log(`\n🚀 [7:00 PM IST REACHED] Starting automatic daily attendance email dispatch...`);
    try {
      await runDailyAttendanceJob({ forceRun: false });
    } catch (err) {
      console.error('Error during scheduled 7:00 PM dispatch:', err);
    }
    // Schedule for next day
    scheduleNextRun();
  }, msRemaining);
}

console.log('========================================================');
console.log('🕒 NEXORA DPR - 7:00 PM DAILY ATTENDANCE SCHEDULER DAEMON');
console.log('Status: Active & Monitoring');
console.log('========================================================');

scheduleNextRun();
