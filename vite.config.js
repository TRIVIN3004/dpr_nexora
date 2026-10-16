import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

function getEnvConfig() {
  const envFile = path.resolve(process.cwd(), '.env');
  const envVars = {};
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    lines.forEach(l => {
      const match = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[match[1]] = val;
      }
    });
  }
  return envVars;
}

function resendApiPlugin() {
  const handleEmailRequest = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { to, subject, html, text, from: reqFrom, apiKey: clientApiKey } = payload;

        const env = getEnvConfig();
        const apiKey = clientApiKey || env.RESEND_API_KEY || env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
        const from = reqFrom || env.VITE_RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || 'Nexora Attendance Alerts <alerts@dpralerts.nexoratechs.xyz>';

        if (!to) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Recipient email address (to) is required.' }));
        }

        // If no valid Resend API key is configured, operate in simulation mode
        if (!apiKey || !apiKey.startsWith('re_') || apiKey.includes('YOUR_RESEND_API_KEY')) {
          console.log(`\x1b[33m[Nexora Resend Simulator]\x1b[0m Alert to: \x1b[36m${to}\x1b[0m | Subject: "${subject}"`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            simulated: true,
            message: `Email alert simulated for personal mail: ${to}. (Provide RESEND_API_KEY in .env or Settings to send live emails via Resend).`
          }));
        }

        // Send live email via Resend SDK
        const resend = new Resend(apiKey);
        const recipientList = Array.isArray(to) ? to : [to];

        const resendResponse = await resend.emails.send({
          from,
          to: recipientList,
          reply_to: 'contactnexoratechs@gmail.com',
          subject: subject || 'Nexora Portal Alert',
          html: html || `<p>${text || subject}</p>`,
          text: text || ''
        });

        if (resendResponse.error) {
          console.error('[Nexora Resend Error]', resendResponse.error);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: resendResponse.error.message || 'Resend API rejected the request',
            details: resendResponse.error
          }));
        }

        console.log(`\x1b[32m[Nexora Email Alert Live]\x1b[0m Dispatched email ID: ${resendResponse.data?.id} to ${to}`);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          simulated: false,
          id: resendResponse.data?.id,
          message: `Email alert dispatched successfully to ${to}`
        }));
      } catch (err) {
        console.error('[Nexora Email Exception]', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: false,
          error: err.message || 'Internal server error while dispatching email alert'
        }));
      }
    });
  };

  const handleCronRequest = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    try {
      const { runDailyAttendanceJob } = await import('./scripts/daily_7pm_attendance_job.mjs');
      const results = await runDailyAttendanceJob({ forceRun: true });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, results }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  };

  return {
    name: 'email-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/send-email', handleEmailRequest);
      server.middlewares.use('/api/daily-attendance-cron', handleCronRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/send-email', handleEmailRequest);
      server.middlewares.use('/api/daily-attendance-cron', handleCronRequest);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resendApiPlugin()],
});
