import http from 'http';
import { Resend } from 'resend';

const PORT = process.env.PORT || 3001;
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'Nexora Alerts <onboarding@resend.dev>';

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'ok', service: 'nexora-email-alerts' }));
  }

  if (req.url === '/api/send-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { to, subject, html, text, from: reqFrom, apiKey: clientApiKey } = payload;
        const apiKey = clientApiKey || RESEND_API_KEY;
        const from = reqFrom || RESEND_FROM;

        if (!to) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Recipient to is required' }));
        }

        if (!apiKey || !apiKey.startsWith('re_')) {
          console.log(`[Standalone Resend Simulation] Alert to: ${to} | Subject: "${subject}"`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            simulated: true,
            message: `Email alert simulated for personal mail: ${to}.`
          }));
        }

        const resend = new Resend(apiKey);
        const resendResponse = await resend.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject: subject || 'Nexora Portal Alert',
          html: html || `<p>${text || subject}</p>`,
          text: text || ''
        });

        if (resendResponse.error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: resendResponse.error.message,
            details: resendResponse.error
          }));
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          simulated: false,
          id: resendResponse.data?.id,
          message: `Email alert sent to ${to}`
        }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Nexora Email Alert Service running on http://localhost:${PORT}`);
});
