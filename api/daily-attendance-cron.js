import { runDailyAttendanceJob } from '../scripts/daily_7pm_attendance_job.mjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const isForce = req.query?.force === 'true' || req.body?.force === true;
    console.log(`[Vercel Cron] 7:00 PM Daily Attendance Dispatch triggered (force: ${isForce})`);
    
    const results = await runDailyAttendanceJob({ forceRun: isForce });
    return res.status(200).json({
      success: true,
      message: '7:00 PM daily attendance emails processed successfully',
      results
    });
  } catch (err) {
    console.error('[Vercel Cron Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal error processing 7:00 PM attendance emails'
    });
  }
}
