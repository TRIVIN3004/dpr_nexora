/**
 * Nexora DPR - Resend Email Alert Service
 * Manages email alerts to employees' personal email IDs via Resend.
 */

// Comprehensive personal emails mapping for all company team members
export const DEFAULT_PERSONAL_EMAILS = {
  // Primary Employee ID Mappings
  'EMP-001': 'trivintrivin2005@gmail.com',
  'EMP-0001': 'trivintrivin2005@gmail.com',
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
  'USR-001': 'contactnexoratechs@gmail.com',
  'USR-002': 'alex.johnson.personal@gmail.com',
  'USR-003': 'sarah.miller.personal@gmail.com',

  // Work Email Cross-References (lowercase)
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
  'admin@nexora.com': 'contactnexoratechs@gmail.com',

  // Name Matches (lowercase trimmed)
  'aaryan': 'aaryanjain950@gmail.com',
  'administrator': 'contactnexoratechs@gmail.com',
  'ajay kumar': 'ajay872072@gmail.com',
  'ajay kumar d': 'ajay872072@gmail.com',
  'akashraj': 'aakashrajselvam@gmail.com',
  'aakashraj': 'aakashrajselvam@gmail.com',
  'akshaya': 'akshuraj2005@gmail.com',
  'akshaya r': 'akshuraj2005@gmail.com',
  'amirtha': 'amirthavarshinitd@gmail.com',
  'amirthavarshini t d': 'amirthavarshinitd@gmail.com',
  'anish': 'anish30092007@gmail.com',
  'anish k': 'anish30092007@gmail.com',
  'aswin': 'aswin3908@gmail.com',
  'bharath g': 'bharathgandhi92@gmail.com',
  'dharshanraj': 'srdharshanraj@gmail.com',
  'dharsha raj s r': 'srdharshanraj@gmail.com',
  'gokul': 'gokulpriyan96@gmail.com',
  'gokul priyan': 'gokulpriyan96@gmail.com',
  'irene clemencia': 'ireneclemencia2311@gmail.com',
  'jeff gabriel yowan': 'gabyo894491@gmail.com',
  'kanimozhi': 'kanimozhiprakash2006@gmail.com',
  'keerthivasan': 'keerthivasan30112005@gmail.com',
  'keerthivasan k': 'keerthivasan30112005@gmail.com',
  'kishore': 'kishoremohan1307@gmail.com',
  'kishore mohan': 'kishoremohan1307@gmail.com',
  'gokulashri': 'mgokulashri944@gmail.com',
  'm gokulashri': 'mgokulashri944@gmail.com',
  'dinesh': 'dineshkumar.muthuvel2011@gmail.com',
  'm. dinesh kumar': 'dineshkumar.muthuvel2011@gmail.com',
  'srijith': 'srikreekszoldych@gmail.com',
  'm. srijith': 'srikreekszoldych@gmail.com',
  'madona': 'krmadona23@gmail.com',
  'farman': 'naujawanf@gmail.com',
  'mohammad farman ahmed naujawan h': 'naujawanf@gmail.com',
  'naveen': 'naveensv0112@gmail.com',
  'nidiya': 'nidiyarajkadavan@gmail.com',
  'nidiya raj kadavan': 'nidiyarajkadavan@gmail.com',
  'pathmavathi': 'pathmavathis2005@gmail.com',
  'pathmavathi s': 'pathmavathis2005@gmail.com',
  'pavithraa': 'pavithraayohan@gmail.com',
  'pavithraa s': 'pavithraayohan@gmail.com',
  'pooja': 'poojavellingiri15@gmail.com',
  'pooja v': 'poojavellingiri15@gmail.com',
  'prishaa': 'prishaaraj06@gmail.com',
  'prishaa kamal': 'prishaaraj06@gmail.com',
  'prishaa kamal p': 'prishaaraj06@gmail.com',
  'raghul prasath a': 'justinsam1902@gmail.com',
  'rohith': 'mrohith0089@gmail.com',
  'rohith m': 'mrohith0089@gmail.com',
  'rubena catherine mary': 'cathrinemary0208@gmail.com',
  'rubeena catherine mary': 'cathrinemary0208@gmail.com',
  'sangamithra': 'sangamithrakesavan8@gmail.com',
  'sangamithra k': 'sangamithrakesavan8@gmail.com',
  'sanjay': 'sanjayvijay20051512@gmail.com',
  'sanjay c': 'sanjayvijay20051512@gmail.com',
  'sanjay s': 'sanjayselvakumar550@gmail.com',
  'sanjay kumar': 'sanjayselvakumar550@gmail.com',
  'sankar': 'sankarleo23@gmail.com',
  'sankar r': 'sankarleo23@gmail.com',
  'santhoshraj': 'santho06raj@gmail.com',
  'santhoshraj v': 'santho06raj@gmail.com',
  'shakthi': 'shakthij162@gmail.com',
  'sharon': 'angelsharon283@gmail.com',
  'sivaranjani': 'sivaranjanisumathi75@gmail.com',
  'srinithi': 'Srinithikumar112@gmail.com',
  'srinithi k': 'Srinithikumar112@gmail.com',
  'sujitha': 'ssujitha9307@gmail.com',
  'sujitha s': 'ssujitha9307@gmail.com',
  'trivin': 'trivintrivin2005@gmail.com',
  'trivin s': 'trivintrivin2005@gmail.com',
  'vishnu hasan r': 'vishnu30426@gmail.com',
  'vishwa': 'vishwakrish2006@gmail.com',
  'vishwa k': 'vishwakrish2006@gmail.com',
  'waseem': 'waseemay1127@gmail.com',
  'waseem ahamed a j': 'waseemay1127@gmail.com',
  'waseem ahmed': 'waseemay1127@outlook.com',
  'yani muizz': 'yani.muizz2008@gmail.com',
  'yani muizz h': 'yani.muizz2008@gmail.com'
};

// Excluded team members list (removed from email notifications)
export const EXCLUDED_MEMBER_IDS = ['EMP-003', 'EMP-014', 'EMP-016'];
export const EXCLUDED_EMAILS = [
  'gopika.design@gmail.com',
  'aarathana.eng@gmail.com',
  'karthikeyan.nexora@gmail.com',
  'gopika@nexora.com',
  'aarathana@nexora.com',
  'karthikeyan@nexora.com'
];

export const isExcludedMember = (user) => {
  if (!user) return false;
  const id = (user.id || '').toUpperCase();
  const email = (user.email || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();
  if (EXCLUDED_MEMBER_IDS.includes(id)) return true;
  if (EXCLUDED_EMAILS.includes(email)) return true;
  if (name === 'gopika' || name === 'aarathana' || name === 'karthikeyan') return true;
  return false;
};

// 1. Personal Email Resolution
export const getPersonalEmail = (user) => {
  if (!user || isExcludedMember(user)) return '';
  if (user.personalEmail && user.personalEmail.trim().length > 3) {
    if (EXCLUDED_EMAILS.includes(user.personalEmail.toLowerCase().trim())) return '';
    return user.personalEmail.trim();
  }

  // Check local mapping cache
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('nexora_personal_emails_map');
      if (raw) {
        const map = JSON.parse(raw);
        if (user.id && map[user.id]) return map[user.id];
        if (user.email && map[user.email.toLowerCase()]) return map[user.email.toLowerCase()];
        if (user.name && map[user.name.toLowerCase().trim()]) return map[user.name.toLowerCase().trim()];
      }
    }
  } catch (e) {
    console.warn('Error reading personal emails map:', e);
  }

  // Fallback to default comprehensive map by ID
  if (user.id && DEFAULT_PERSONAL_EMAILS[user.id]) {
    return DEFAULT_PERSONAL_EMAILS[user.id];
  }
  if (user.id && DEFAULT_PERSONAL_EMAILS[user.id.toUpperCase()]) {
    return DEFAULT_PERSONAL_EMAILS[user.id.toUpperCase()];
  }

  // Fallback by email
  if (user.email && DEFAULT_PERSONAL_EMAILS[user.email.toLowerCase().trim()]) {
    return DEFAULT_PERSONAL_EMAILS[user.email.toLowerCase().trim()];
  }

  // Fallback by name
  if (user.name) {
    const cleanName = user.name.toLowerCase().trim();
    if (DEFAULT_PERSONAL_EMAILS[cleanName]) {
      return DEFAULT_PERSONAL_EMAILS[cleanName];
    }
    // Check partial name match
    const matchingKey = Object.keys(DEFAULT_PERSONAL_EMAILS).find(k => k.length > 3 && cleanName.includes(k));
    if (matchingKey) return DEFAULT_PERSONAL_EMAILS[matchingKey];
  }

  // If work email has standard format, construct personal email or fallback
  if (user.email && user.email.includes('@nexora.com')) {
    const prefix = user.email.split('@')[0];
    return `${prefix}.personal@gmail.com`;
  }

  return user.email || '';
};

export const savePersonalEmail = (userId, personalEmail) => {
  if (!userId || !personalEmail) return;
  try {
    let map = {};
    const raw = localStorage.getItem('nexora_personal_emails_map');
    if (raw) map = JSON.parse(raw);
    map[userId] = personalEmail.trim();
    localStorage.setItem('nexora_personal_emails_map', JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save personal email to map:', e);
  }
};

export const bulkUpdatePersonalEmails = (mapping = {}) => {
  try {
    let currentMap = {};
    const raw = localStorage.getItem('nexora_personal_emails_map');
    if (raw) currentMap = JSON.parse(raw);

    Object.entries(mapping).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.trim().length > 3) {
        currentMap[key.trim()] = val.trim();
      }
    });

    localStorage.setItem('nexora_personal_emails_map', JSON.stringify(currentMap));
    window.dispatchEvent(new CustomEvent('nexora:personal_emails_updated', { detail: currentMap }));
    return currentMap;
  } catch (e) {
    console.error('Failed to bulk update personal emails:', e);
    return null;
  }
};

// 2. Resend Settings Configuration
export const getResendConfig = () => {
  let config = {
    apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
    fromEmail: import.meta.env.VITE_RESEND_FROM_EMAIL || 'Nexora Attendance Alerts <alerts@dpralerts.nexoratechs.xyz>',
    autoAttendanceWarnings: true,
    autoDeactivationAlerts: true,
    autoDprReviewAlerts: true,
    autoLeaveAlerts: true,
    isConfigured: true
  };

  try {
    const saved = localStorage.getItem('nexora_resend_config');
    if (saved) {
      config = { ...config, ...JSON.parse(saved) };
    }
  } catch (e) {}

  config.isConfigured = Boolean(config.apiKey && config.apiKey.startsWith('re_'));
  return config;
};

export const saveResendConfig = (newConfig) => {
  try {
    const current = getResendConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem('nexora_resend_config', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexora:resend_config_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error saving Resend config:', e);
    return null;
  }
};

// 3. Email Alert Audit Logs
export const getEmailAlertLogs = () => {
  try {
    const raw = localStorage.getItem('nexora_email_alerts_log');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

const recordEmailAlertLog = (entry) => {
  try {
    const logs = getEmailAlertLogs();
    const updated = [entry, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem('nexora_email_alerts_log', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexora:email_alert_sent', { detail: entry }));
  } catch (e) {
    console.warn('Failed to record email alert log:', e);
  }
};

// 4. Core Email Dispatcher
export const sendEmailAlert = async ({
  to,
  recipientName = 'Team Member',
  subject,
  html,
  text = '',
  type = 'general_alert',
  metadata = {}
}) => {
  if (!to) {
    return { success: false, error: 'Recipient personal email is missing.' };
  }

  const config = getResendConfig();

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        from: config.fromEmail,
        apiKey: config.apiKey,
        type,
        metadata
      })
    });

    const result = await response.json();

    const logEntry = {
      id: `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      to,
      recipientName,
      type,
      subject,
      status: result.simulated ? 'simulated' : result.success ? 'delivered' : 'failed',
      resendId: result.id || (result.simulated ? 'SIMULATED' : null),
      error: result.error || null,
      message: result.message || (result.success ? 'Delivered successfully' : 'Failed to deliver'),
      html
    };

    recordEmailAlertLog(logEntry);
    return { ...result, logEntry };
  } catch (err) {
    console.error('sendEmailAlert network exception:', err);

    // Fallback simulation log if fetch fails (e.g. dev server without proxy restarted yet)
    const logEntry = {
      id: `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      to,
      recipientName,
      type,
      subject,
      status: 'simulated',
      resendId: 'SIMULATED-OFFLINE',
      message: 'Simulated email alert (Network proxy unreachable, logged locally)',
      html
    };

    recordEmailAlertLog(logEntry);
    return {
      success: true,
      simulated: true,
      message: 'Simulated alert logged locally (Personal Mail: ' + to + ')',
      logEntry
    };
  }
};

// 5. HTML Email Template Generators
const emailWrapper = (title, badgeText, badgeColor, contentHtml, footerNote) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #1e293b;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                      <span style="color: #6366f1;">NEXORA</span> <span style="font-weight: 300; color: #94a3b8;">PORTAL</span>
                    </div>
                    <div style="font-size: 11px; text-transform: uppercase; tracking: 1.5px; color: #818cf8; font-weight: 700; margin-top: 3px;">
                      Automated Workforce & DPR Alert System
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; border-radius: 9999px; background-color: ${badgeColor.bg}; color: ${badgeColor.text}; border: 1px solid ${badgeColor.border};">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0d121f; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
                ${footerNote || 'This alert was dispatched to your personal mail ID for verified official delivery.'}
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                &copy; ${new Date().getFullYear()} Nexora Technologies Inc. All rights reserved. • Nexora Automated Notification Pipeline
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Template 1a: Attendance Absent Notice Email
export const generateAttendanceAbsentEmail = ({
  employeeName,
  employeeId,
  department = 'General',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  reason = 'Unexcused Absence (No check-in or leave record)',
  attendancePct = null
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f43f5e;">
      Absence Recorded Notification
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, this is an automated attendance alert notifying you that you have been marked <strong>Absent</strong> for work on <strong>${date}</strong>.
    </p>

    <!-- Absence Callout Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 12px; padding: 18px 20px;">
      <tr>
        <td width="50%">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f43f5e; margin-bottom: 4px;">
            Attendance Status
          </div>
          <div style="font-size: 26px; font-weight: 900; color: #fb7185;">
            ABSENT
          </div>
        </td>
        <td width="50%" style="border-left: 1px solid rgba(244, 63, 94, 0.2); padding-left: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
            Recorded Date
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #f8fafc;">
            ${date}
          </div>
          ${attendancePct !== null ? `
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            Updated Rate: <strong style="color: #fbbf24;">${attendancePct}%</strong>
          </div>` : ''}
        </td>
      </tr>
    </table>

    <!-- Detail Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 12px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8; width: 140px;">Employee ID:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${employeeId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Department:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${department}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Recorded Reason:</td>
        <td style="padding: 10px 0; color: #fda4af; font-weight: 600;">${reason}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #94a3b8;">Required Action:</td>
        <td style="padding: 10px 0; color: #f8fafc;">Submit Leave Application / Notify Lead</td>
      </tr>
    </table>

    <div style="background-color: #1e293b; border-left: 4px solid #f43f5e; padding: 14px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #e2e8f0;">
      <strong>Company Attendance Guideline:</strong> Unexcused absences directly reduce your cumulative attendance rating. Employees must maintain at least <strong>75%</strong> attendance to remain in good standing. If you were absent due to medical or personal emergencies, please submit a retroactive leave request through the Nexora Portal immediately.
    </div>
  `;

  return emailWrapper(
    'Nexora Attendance Absence Notification',
    'Marked Absent',
    { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.4)' },
    content,
    'Official absence advisory delivered to your personal mail ID.'
  );
};

// Template 1c: Instant Attendance Present Confirmation Email (Dispatched Immediately Upon Check-In)
export const generateAttendancePresentEmail = ({
  employeeName,
  employeeId,
  department = 'General',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  checkInTime = 'Recorded',
  checkOutTime = 'Recorded',
  attendancePct = 95,
  remarks = 'On time'
}) => {
  const isHighAttendance = (attendancePct ?? 100) >= 75;
  const statusColor = isHighAttendance ? '#10b981' : '#f59e0b';

  const content = `
    <!-- Top Alert Banner -->
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.2) 100%); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 6px;">
        INSTANT ATTENDANCE CONFIRMATION • VERIFIED PRESENT
      </div>
      <h2 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 900; color: #ffffff;">
        Attendance Recorded: Present &check;
      </h2>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
        Dear <strong>${employeeName}</strong>, your work attendance for <strong>${date}</strong> has been successfully verified and recorded as <strong>Present</strong>.
      </p>
    </div>

    <!-- Stat Callout Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px 20px;">
      <tr>
        <td width="50%">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #34d399; margin-bottom: 4px;">
            Attendance Status
          </div>
          <div style="font-size: 26px; font-weight: 900; color: #6ee7b7; letter-spacing: 0.5px;">
            PRESENT
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            ${remarks || 'Check-in Recorded'}
          </div>
        </td>
        <td width="50%" style="border-left: 1px solid rgba(16, 185, 129, 0.2); padding-left: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
            Cumulative Rating
          </div>
          <div style="font-size: 26px; font-weight: 900; color: ${statusColor}; font-family: monospace;">
            ${attendancePct !== null ? `${attendancePct}%` : 'Good'}
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            ${isHighAttendance ? '✅ Compliant (≥75%)' : '⚠️ Warning Area (<75%)'}
          </div>
        </td>
      </tr>
    </table>

    <!-- Detail Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 12px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8; width: 140px;">Employee ID:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${employeeId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Department:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${department}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Check-In Time:</td>
        <td style="padding: 10px 0; color: #34d399; font-weight: 700;">${checkInTime || 'Flexible / On-Time'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Check-Out Time:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${checkOutTime || 'Recorded / Completed'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #94a3b8;">Recorded Date:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${date}</td>
      </tr>
    </table>

    <!-- Encouragement Callout -->
    <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #e2e8f0;">
      <strong>Consistency Matters:</strong> Thank you for checking in today! Regular check-ins maintain your good standing across company performance audits. Please make sure to submit your Daily Progress Report (DPR) before signing off for the evening.
    </div>

    <!-- Portal Link Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="https://dpralerts.nexoratechs.xyz" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 12px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
            Open Nexora Portal Dashboard &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(
    `Nexora Attendance Verified: Present [${date}]`,
    'Attendance Present',
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
    content,
    'Instant attendance confirmation delivered directly to your personal mail ID.'
  );
};

// Template 1b: Attendance Warning Email
export const generateAttendanceWarningEmail = ({
  employeeName,
  employeeId,
  department = 'General',
  attendancePct,
  requiredPct = 75,
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f8fafc;">
      Attendance Policy Warning Notice
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, this is an official automated advisory notification regarding your company attendance status.
    </p>

    <!-- Stat Callout Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 18px 20px;">
      <tr>
        <td width="50%">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f59e0b; margin-bottom: 4px;">
            Current Attendance Rate
          </div>
          <div style="font-size: 32px; font-weight: 900; color: #fbbf24; font-family: monospace;">
            ${attendancePct}%
          </div>
        </td>
        <td width="50%" style="border-left: 1px solid rgba(245, 158, 11, 0.2); padding-left: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
            Company Benchmark
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #f8fafc;">
            &ge; ${requiredPct}% Minimum
          </div>
          <div style="font-size: 11px; color: #f59e0b; font-weight: 600; margin-top: 2px;">
            Action Required
          </div>
        </td>
      </tr>
    </table>

    <!-- Detail Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 12px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8; width: 140px;">Employee ID:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${employeeId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Department:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${department}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Policy Status:</td>
        <td style="padding: 10px 0; color: #fbbf24; font-weight: 700;">Tier 3 Warning Notice (50% - 74%)</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #94a3b8;">Notice Date:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${date}</td>
      </tr>
    </table>

    <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #e2e8f0;">
      <strong>Policy Mandate:</strong> Employees falling below the 75% attendance threshold are subject to administrative review. If overall attendance drops below 50%, automated login revocation and account suspension will take effect. Please ensure timely check-ins and submit leave applications for planned absences.
    </div>
  `;

  return emailWrapper(
    'Nexora Attendance Policy Warning',
    'Warning Notice',
    { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
    content,
    'Dispatched to your personal email to ensure receipt outside portal access.'
  );
};

// Template 2: Attendance Termination / Deactivation Email
export const generateAttendanceTerminationEmail = ({
  employeeName,
  employeeId,
  department = 'General',
  attendancePct,
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #fda4af;">
      Critical: Portal Access Suspended
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, this is an official notice that your Nexora DPR Portal login access has been automatically suspended in accordance with company attendance regulations.
    </p>

    <!-- Critical Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 18px 20px;">
      <tr>
        <td width="50%">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f87171; margin-bottom: 4px;">
            Recorded Attendance
          </div>
          <div style="font-size: 32px; font-weight: 900; color: #f87171; font-family: monospace;">
            ${attendancePct}%
          </div>
        </td>
        <td width="50%" style="border-left: 1px solid rgba(239, 68, 68, 0.2); padding-left: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
            Policy Action
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #fca5a5;">
            Login Revocation (&lt;50%)
          </div>
          <div style="font-size: 11px; color: #ef4444; font-weight: 700; margin-top: 2px;">
            Immediate Effect
          </div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 12px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8; width: 140px;">Employee ID:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${employeeId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Department:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${department}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #94a3b8;">Action Date:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${date}</td>
      </tr>
    </table>

    <div style="background-color: #1e293b; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; color: #e2e8f0;">
      <strong>How to Reactivate:</strong> To appeal this deactivation or submit retroactive documentation for absences, please immediately contact your Department Head or the Management Team. An administrator can review your case and reactivate your portal privileges.
    </div>
  `;

  return emailWrapper(
    'Nexora Account Deactivation Notice',
    'Account Deactivated',
    { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.5)' },
    content,
    'Urgent notice dispatched to your personal mail ID.'
  );
};

// Template 3: Account Reactivation Notice
export const generateAccountReactivationEmail = ({
  employeeName,
  employeeId,
  adminName = 'System Administrator',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #6ee7b7;">
      Account Access Restored
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, we are pleased to inform you that your Nexora DPR Portal credentials have been successfully reactivated by <strong>${adminName}</strong>.
    </p>

    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 14px; font-weight: 800; color: #34d399; margin-bottom: 6px;">
        &check; Login Restored &amp; Ready
      </div>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
        You can now sign in with your employee email and password to log daily progress reports and record attendance.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 12px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8; width: 140px;">Employee ID:</td>
        <td style="padding: 10px 0; color: #f8fafc; font-weight: 700;">${employeeId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 10px 0; color: #94a3b8;">Reactivated By:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${adminName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #94a3b8;">Effective Date:</td>
        <td style="padding: 10px 0; color: #f8fafc;">${date}</td>
      </tr>
    </table>
  `;

  return emailWrapper(
    'Nexora Account Reactivated',
    'Reactivated',
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
    content,
    'Dispatched to your personal mail ID for notification.'
  );
};

// Template 4: DPR Review / Status Email
export const generateDprReviewEmail = ({
  employeeName,
  projectName,
  moduleName = 'General',
  status = 'Approved',
  feedback = '',
  adminName = 'Lead / Admin',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}) => {
  const isApproved = status === 'Approved';
  const badgeColor = isApproved
    ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' }
    : { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: ${isApproved ? '#6ee7b7' : '#fda4af'};">
      Daily Progress Report ${status}
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, your Daily Progress Report for project <strong>[${projectName}]</strong> has been reviewed by <strong>${adminName}</strong>.
    </p>

    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8; width: 130px;">Project:</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 700;">${projectName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8;">Module:</td>
          <td style="padding: 8px 0; color: #f8fafc;">${moduleName || 'Core'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8;">Review Decision:</td>
          <td style="padding: 8px 0; color: ${isApproved ? '#34d399' : '#f87171'}; font-weight: 800;">${status}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Review Date:</td>
          <td style="padding: 8px 0; color: #f8fafc;">${date}</td>
        </tr>
      </table>
    </div>

    ${feedback ? `
      <div style="background: rgba(99, 102, 241, 0.08); border-left: 4px solid #6366f1; border-radius: 4px 8px 8px 4px; padding: 14px 16px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #818cf8; margin-bottom: 4px;">
          Reviewer Feedback / Comments:
        </div>
        <div style="font-size: 13px; color: #e2e8f0; font-style: italic;">
          &ldquo;${feedback}&rdquo;
        </div>
      </div>
    ` : ''}
  `;

  return emailWrapper(
    `Nexora DPR ${status}: ${projectName}`,
    `DPR ${status}`,
    badgeColor,
    content,
    'Dispatched to your personal email address for status records.'
  );
};

// Template 5: Leave Application Decision Email
export const generateLeaveStatusEmail = ({
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  status = 'Approved',
  remarks = '',
  adminName = 'HR / Admin'
}) => {
  const isApproved = status === 'Approved';
  const badgeColor = isApproved
    ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' }
    : { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: ${isApproved ? '#6ee7b7' : '#fda4af'};">
      Leave Application ${status}
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${employeeName}</strong>, your request for <strong>${leaveType}</strong> has been <strong>${status.toLowerCase()}</strong> by <strong>${adminName}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #1e293b; border-radius: 12px; padding: 18px 20px; font-size: 12px;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8; width: 130px;">Leave Type:</td>
        <td style="padding: 6px 0; color: #f8fafc; font-weight: 700;">${leaveType}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Duration:</td>
        <td style="padding: 6px 0; color: #f8fafc; font-weight: 700;">${startDate} &rarr; ${endDate} (${totalDays} day${totalDays > 1 ? 's' : ''})</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Decision:</td>
        <td style="padding: 6px 0; color: ${isApproved ? '#34d399' : '#f87171'}; font-weight: 800;">${status}</td>
      </tr>
      ${remarks ? `
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Admin Remarks:</td>
        <td style="padding: 6px 0; color: #cbd5e1; font-style: italic;">${remarks}</td>
      </tr>
      ` : ''}
    </table>
  `;

  return emailWrapper(
    `Nexora Leave Request: ${status}`,
    `Leave ${status}`,
    badgeColor,
    content,
    'Dispatched to your personal email address.'
  );
};

// Template 6: Welcome / Account Credentials Email
export const generateWelcomeEmail = ({
  employeeName,
  employeeId,
  workEmail,
  tempPassword = '••••••••',
  personalEmail
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f8fafc;">
      Welcome to Nexora DPR Portal!
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Hello <strong>${employeeName}</strong>, your account has been provisioned on the Nexora Daily Progress Report &amp; Attendance Portal.
    </p>

    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #818cf8; margin-bottom: 12px;">
        Your Access Credentials
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 130px;">Employee ID:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 700; font-family: monospace;">${employeeId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Work Email:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 700;">${workEmail}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Initial Password:</td>
          <td style="padding: 6px 0; color: #a5b4fc; font-weight: 700; font-family: monospace;">${tempPassword}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Personal Mail:</td>
          <td style="padding: 6px 0; color: #34d399; font-weight: 600;">${personalEmail}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
      Please login and change your password upon first entry. All attendance notices and report reviews will be dispatched to this personal email address.
    </p>
  `;

  return emailWrapper(
    'Welcome to Nexora Portal - Your Credentials',
    'Account Active',
    { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)' },
    content,
    'Official credential notice delivered to your personal mail ID.'
  );
};

// Template 7: Test Alert Email
export const generateTestEmail = ({
  userName = 'Nexora User',
  personalEmail
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #6ee7b7;">
      &check; DPR Email Alerts Active!
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Hello <strong>${userName}</strong>, this test confirms that the automated email delivery pipeline is successfully configured for your personal mail ID.
    </p>

    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Recipient Mail ID:</td>
          <td style="padding: 6px 0; color: #34d399; font-weight: 700;">${personalEmail}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Delivery Engine:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 700;">Nexora Automated Cloud Delivery</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Status:</td>
          <td style="padding: 6px 0; color: #34d399; font-weight: 800;">Operational</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Timestamp:</td>
          <td style="padding: 6px 0; color: #f8fafc;">${new Date().toISOString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Automated alerts for attendance policy warnings, leave approvals, and DPR reviews will be delivered to this verified mailbox.
    </p>
  `;

  return emailWrapper(
    'Nexora Integration Test Alert',
    'Pipeline Verified',
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
    content,
    'Test alert delivered directly to your personal mail ID.'
  );
};

// Template 8: Manual Admin Broadcast / Communication
export const generateManualBroadcastEmail = ({
  recipientName = 'Team Member',
  subject = 'Official Communication',
  message = '',
  senderName = 'Management',
  badgeText = 'OFFICIAL NOTICE'
}) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f8fafc;">
      ${subject}
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      Dear <strong>${recipientName}</strong>,
    </p>

    <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 12px; padding: 20px; margin-bottom: 24px; color: #f1f5f9; font-size: 13px; line-height: 1.7; white-space: pre-wrap;">
${message}
    </div>

    <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 14px; margin-top: 16px; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Dispatched by: <strong>${senderName}</strong> • Nexora Administration</p>
      <p style="margin: 4px 0 0 0;">This email was delivered directly to your verified personal mail ID.</p>
    </div>
  `;

  return emailWrapper(
    subject,
    badgeText,
    { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)' },
    content,
    'Official communication dispatched via Nexora Enterprise Pipeline.'
  );
};

// Template 9: DPR Automation Announcement to All Team Members
export const generateDprAutomationAnnouncementEmail = ({
  employeeName = 'Team Member',
  recipientEmail = '',
  portalUrl = 'https://dpralerts.nexoratechs.xyz'
}) => {
  const content = `
    <!-- Top Alert Banner -->
    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 12px; padding: 20px; margin-bottom: 26px; text-align: left;">
      <div style="display: inline-block; padding: 4px 10px; background-color: #4f46e5; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 6px; margin-bottom: 8px;">
        🚀 OFFICIAL SYSTEM ROLLOUT
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 900; color: #ffffff; line-height: 1.3;">
        Automated DPR &amp; Attendance Email Alerts are Now Live!
      </h2>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
        Real-time status updates, review notifications, and attendance tracking delivered directly to your personal mailbox.
      </p>
    </div>

    <!-- Greeting -->
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #f1f5f9;">
      Dear <strong>${employeeName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.7; color: #cbd5e1;">
      We are pleased to announce that the <strong>Nexora DPR (Daily Progress Report) Portal</strong> has launched an automated email notification system. You will now receive instant, transparent, and color-coded email notifications for all key activities without needing to check the portal manually.
    </p>

    <!-- Section Title -->
    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; margin-bottom: 14px;">
      ✨ KEY AUTOMATION FEATURES
    </div>

    <!-- 4 Colorful Feature Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-collapse: separate; border-spacing: 0 12px;">
      
      <!-- Card 1: DPR Review Alerts -->
      <tr>
        <td style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(30, 27, 75, 0.25) 100%); border: 1px solid rgba(99, 102, 241, 0.35); border-left: 5px solid #6366f1; border-radius: 10px; padding: 16px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 16px; margin-right: 6px;">📋</span>
                <strong style="color: #a5b4fc; font-size: 13px;">DPR Review &amp; Approval Notifications</strong>
              </td>
              <td align="right">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4);">
                  REAL-TIME
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                Get immediate notification whenever your submitted report is approved or reviewed by team leads, complete with reviewer remarks and actionable feedback.
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Card 2: Attendance Tracking -->
      <tr>
        <td style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(69, 26, 3, 0.25) 100%); border: 1px solid rgba(245, 158, 11, 0.35); border-left: 5px solid #f59e0b; border-radius: 10px; padding: 16px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 16px; margin-right: 6px;">⏱️</span>
                <strong style="color: #fbbf24; font-size: 13px;">Attendance Tracking &amp; Policy Safeguards</strong>
              </td>
              <td align="right">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">
                  75% BENCHMARK
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                Stay in compliance effortlessly. Automated advisories keep you informed about recorded absences and proactively notify you before your monthly attendance drops below the 75% required benchmark.
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Card 3: Leave Decisions -->
      <tr>
        <td style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.25) 100%); border: 1px solid rgba(16, 185, 129, 0.35); border-left: 5px solid #10b981; border-radius: 10px; padding: 16px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 16px; margin-right: 6px;">🌴</span>
                <strong style="color: #6ee7b7; font-size: 13px;">Instant Leave Status Decisions</strong>
              </td>
              <td align="right">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);">
                  HR WORKFLOW
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                Receive immediate decision updates the moment your leave applications are processed, including authorized date ranges, total days, and administrator comments.
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Card 4: Personal Mail Delivery -->
      <tr>
        <td style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(12, 74, 110, 0.25) 100%); border: 1px solid rgba(14, 165, 233, 0.35); border-left: 5px solid #0ea5e9; border-radius: 10px; padding: 16px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 16px; margin-right: 6px;">📬</span>
                <strong style="color: #7dd3fc; font-size: 13px;">Direct Personal Mailbox Delivery</strong>
              </td>
              <td align="right">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4);">
                  VERIFIED
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                Alerts are dispatched directly to your personal mailbox (${recipientEmail || 'your verified personal email'}), ensuring you stay informed even outside workstation hours or when working remotely.
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    <!-- Best Practice Checklist -->
    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 26px; border: 1px solid #334155;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #f8fafc; margin-bottom: 12px; letter-spacing: 0.5px;">
        📌 QUICK TIPS FOR TEAM MEMBERS
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; line-height: 1.7; color: #cbd5e1;">
        <tr>
          <td style="vertical-align: top; width: 22px; color: #10b981; font-weight: 900;">✓</td>
          <td style="padding-bottom: 8px;">
            <strong>Whitelist Sender:</strong> Add <span style="color: #818cf8; font-family: monospace;">alerts@dpralerts.nexoratechs.xyz</span> to your contacts or Safe Senders list so alerts always land in your Primary inbox.
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 22px; color: #10b981; font-weight: 900;">✓</td>
          <td style="padding-bottom: 8px;">
            <strong>Submit Daily DPRs:</strong> Submit your progress report before the end of each working day for timely feedback from project leads.
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 22px; color: #10b981; font-weight: 900;">✓</td>
          <td>
            <strong>Keep Info Current:</strong> If your preferred personal email ID changes, notify the portal administrator to update your routing.
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);">
                <a href="${portalUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; letter-spacing: 0.5px; border-radius: 10px;">
                  Access Nexora DPR Portal &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <p style="margin: 0 0 4px 0;">Warm regards,</p>
      <p style="margin: 0; font-weight: 800; color: #f8fafc;">Nexora Technologies Administration &amp; Engineering</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Automated Workforce &amp; DPR Systems • Nexora Inc.</p>
    </div>
  `;

  return emailWrapper(
    'Nexora DPR Email Automation Announcement',
    'SYSTEM LIVE',
    { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.5)' },
    content,
    'Official DPR Automation notification dispatched directly to your personal mail ID.'
  );
};

