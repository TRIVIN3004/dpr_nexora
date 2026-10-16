/**
 * Nexora DPR - Announcement Dispatcher
 * Dispatches the DPR & Attendance Email Automation Announcement
 * to all team members' personal email IDs.
 * 
 * SENDER: Nexora DPR Notifications <alerts@dpralerts.nexoratechs.xyz>
 * NOTE: Strictly without any mention of Resend name.
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { 
  DEFAULT_PERSONAL_EMAILS, 
  getPersonalEmail, 
  generateDprAutomationAnnouncementEmail 
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

// Configuration
const API_KEY = resolveApiKey();
const FROM_EMAIL = 'Nexora DPR Notifications <alerts@dpralerts.nexoratechs.xyz>';
const SUBJECT = '🚀 Nexora DPR Email Automation is Live: Real-Time Alerts Direct to Your Inbox';
const SUPABASE_URL = 'https://qwvdyyeyzpqtxqzithso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BpSLx7DlTk4I5weA9fK1Yg_JSvA8tWa';
const PORTAL_URL = 'https://dpralerts.nexoratechs.xyz';

const resend = new Resend(API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTeamRecipients() {
  console.log('📡 Fetching registered team members from Supabase...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .order('id', { ascending: true });

    if (error || !users || users.length === 0) {
      console.warn('⚠️ Supabase users fetch returned error or empty, using comprehensive defaults:', error?.message);
      return buildRecipientsFromDefaults();
    }

    console.log(`✅ Retrieved ${users.length} team members from database.`);
    
    // Group by unique personal email
    const emailToUsers = new Map();
    users.forEach(u => {
      const personalMail = getPersonalEmail(u);
      if (!personalMail || !personalMail.includes('@')) return;
      const cleanMail = personalMail.toLowerCase().trim();

      if (!emailToUsers.has(cleanMail)) {
        emailToUsers.set(cleanMail, {
          email: cleanMail,
          names: [u.name.trim()],
          ids: [u.id]
        });
      } else {
        const item = emailToUsers.get(cleanMail);
        if (!item.names.includes(u.name.trim())) item.names.push(u.name.trim());
        if (!item.ids.includes(u.id)) item.ids.push(u.id);
      }
    });

    return Array.from(emailToUsers.values());
  } catch (err) {
    console.warn('⚠️ Exception connecting to database, falling back to defaults:', err.message);
    return buildRecipientsFromDefaults();
  }
}

function buildRecipientsFromDefaults() {
  const emailToUsers = new Map();
  Object.entries(DEFAULT_PERSONAL_EMAILS).forEach(([key, mail]) => {
    if (!mail || !mail.includes('@')) return;
    const cleanMail = mail.toLowerCase().trim();
    if (!emailToUsers.has(cleanMail)) {
      emailToUsers.set(cleanMail, {
        email: cleanMail,
        names: [key.startsWith('EMP') ? `Team Member (${key})` : key],
        ids: [key]
      });
    }
  });
  return Array.from(emailToUsers.values());
}

async function run() {
  console.log('========================================================');
  console.log('🚀 NEXORA DPR - EMAIL AUTOMATION ALL-STAFF DISPATCH');
  console.log('========================================================');
  console.log(`From:    ${FROM_EMAIL}`);
  console.log(`Subject: ${SUBJECT}`);
  console.log('');

  const recipients = await fetchTeamRecipients();
  console.log(`📊 Total unique recipient personal mailboxes: ${recipients.length}`);
  console.log('');

  // Pre-verification: Ensure NO Resend mentions in generated HTML
  const sampleHtml = generateDprAutomationAnnouncementEmail({
    employeeName: 'Sample Member',
    recipientEmail: 'sample@nexora.com',
    portalUrl: PORTAL_URL
  });

  if (sampleHtml.toLowerCase().includes('resend')) {
    console.error('❌ CRITICAL ERROR: Found mention of "Resend" in the email template! Aborting.');
    process.exit(1);
  } else {
    console.log('🛡️ Verified: Template contains ZERO mentions of "Resend".');
  }

  const results = {
    total: recipients.length,
    success: 0,
    failed: 0,
    details: []
  };

  console.log('📬 Starting dispatch queue...');
  console.log('--------------------------------------------------------');

  for (let i = 0; i < recipients.length; i++) {
    const item = recipients[i];
    const displayName = item.names.join(' / ');
    const toEmail = item.email;

    const htmlContent = generateDprAutomationAnnouncementEmail({
      employeeName: displayName,
      recipientEmail: toEmail,
      portalUrl: PORTAL_URL
    });

    const plainText = `
Nexora DPR Portal - Automated Email Alerts Are Now Live!

Dear ${displayName},

We are pleased to announce that the Nexora DPR (Daily Progress Report) Portal has launched an automated email notification system. You will now receive instant, transparent, and color-coded email notifications for all key activities directly to this personal mailbox.

Key Features:
- DPR Review & Approval Notifications: Instant alerts when reports are approved with lead feedback.
- Attendance Tracking & Policy Safeguards: Proactive notifications to keep you above the 75% required benchmark.
- Instant Leave Status Decisions: Immediate confirmation when leave requests are processed.
- Direct Personal Mailbox Delivery: Delivered directly to ${toEmail}.

Quick Tips:
1. Whitelist Sender: Add alerts@dpralerts.nexoratechs.xyz to your Safe Senders list.
2. Submit Daily DPRs: Log your progress report before the end of each working day.
3. Keep Info Current: Ensure your preferred contact information is up to date in the portal.

Access Portal: ${PORTAL_URL}

Warm regards,
Nexora Technologies Administration & Engineering
Automated Workforce & DPR Systems
    `.trim();

    try {
      const sendResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: SUBJECT,
        html: htmlContent,
        text: plainText
      });

      if (sendResult.error) {
        console.error(`❌ [${i + 1}/${recipients.length}] FAILED: ${displayName} <${toEmail}> - ${sendResult.error.message}`);
        results.failed++;
        results.details.push({
          recipient: toEmail,
          name: displayName,
          status: 'failed',
          error: sendResult.error.message
        });
      } else {
        const id = sendResult.data?.id;
        console.log(`✅ [${i + 1}/${recipients.length}] SENT: ${displayName} <${toEmail}> (ID: ${id})`);
        results.success++;
        results.details.push({
          recipient: toEmail,
          name: displayName,
          status: 'sent',
          id
        });
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${recipients.length}] EXCEPTION: ${displayName} <${toEmail}> - ${err.message}`);
      results.failed++;
      results.details.push({
        recipient: toEmail,
        name: displayName,
        status: 'error',
        error: err.message
      });
    }

    // Delay between sends to maintain smooth rate limits (2 req/sec safe threshold)
    if (i < recipients.length - 1) {
      await sleep(550);
    }
  }

  console.log('--------------------------------------------------------');
  console.log('🎉 DISPATCH COMPLETE!');
  console.log(`Total Recipient Mailboxes: ${results.total}`);
  console.log(`Successfully Dispatched:  ${results.success}`);
  console.log(`Failed / Errors:          ${results.failed}`);
  console.log('========================================================');

  return results;
}

run().catch(err => {
  console.error('Fatal dispatch error:', err);
  process.exit(1);
});
