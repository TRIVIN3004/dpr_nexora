import { Resend } from 'resend';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const { to, subject, html, text, from: reqFrom, apiKey: clientApiKey } = body || {};

    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || clientApiKey;
    const from = reqFrom || process.env.VITE_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Nexora Attendance Alerts <alerts@dpralerts.nexoratechs.xyz>';

    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email address (to) is required.' });
    }

    if (!apiKey || !apiKey.startsWith('re_')) {
      console.log(`[Vercel Resend Simulator] Alert to: ${to} | Subject: "${subject}"`);
      return res.status(200).json({
        success: true,
        simulated: true,
        message: `Email alert simulated for personal mail: ${to}. Please add RESEND_API_KEY in Vercel Environment Variables.`
      });
    }

    const resend = new Resend(apiKey);
    const recipientList = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from,
      to: recipientList,
      reply_to: 'contactnexoratechs@gmail.com',
      subject: subject || 'Nexora Portal Alert',
      html: html || `<p>${text || subject}</p>`,
      text: text || ''
    });

    if (error) {
      console.error('[Email Dispatch Error]', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Email delivery service rejected the request',
        details: error
      });
    }

    console.log(`[Email Dispatch Live] Dispatched email ID: ${data?.id} to ${to}`);
    return res.status(200).json({
      success: true,
      simulated: false,
      id: data?.id,
      message: `Email alert dispatched successfully to ${to}`
    });
  } catch (err) {
    console.error('[Vercel Resend Exception]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while dispatching email alert'
    });
  }
}
