const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ─── Envoi via Gmail API REST (HTTPS, fonctionne sur Railway) ───
async function sendViaGmailAPI(to, subject, html) {
  // 1. Obtenir un access token frais via le refresh token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(err.error_description || `Erreur OAuth2: ${tokenRes.status}`);
  }

  const { access_token } = await tokenRes.json();

  // 2. Construire le message MIME (RFC 2822)
  const fromAddr = process.env.GMAIL_USER;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const rawMessage = [
    `From: Club Jean Jaurès <${fromAddr}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64')
  ].join('\r\n');

  // Base64 URL-safe
  const raw = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 3. Envoyer via Gmail API
  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur Gmail API: ${sendRes.status}`);
  }
}

// ─── Envoi via Gmail SMTP (fallback hors Railway) ───
async function sendViaGmailSMTP(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `Club Jean Jaurès <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  });
}

// ─── Envoi principal ───
async function sendEmail(to, subject, html) {
  // Priorité 1 : Gmail API REST (HTTPS — fonctionne sur Railway)
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    try {
      await sendViaGmailAPI(to, subject, html);
      console.log(`Email envoyé à ${to} via Gmail API`);
      return { ok: true };
    } catch (err) {
      console.error('Erreur Gmail API:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // Priorité 2 : Gmail SMTP (fallback hors Railway)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendViaGmailSMTP(to, subject, html);
      console.log(`Email envoyé à ${to} via Gmail SMTP`);
      return { ok: true };
    } catch (err) {
      console.error('Erreur Gmail SMTP:', err.message);
      return { ok: false, error: `Gmail SMTP: ${err.message}` };
    }
  }

  // Aucun provider configuré
  console.log(`\n=== EMAIL (aucun provider) ===\nÀ: ${to}\nSujet: ${subject}\n==============================\n`);
  return { ok: false, error: 'Aucun service email configuré. Ajoutez les variables Gmail OAuth2.' };
}

// ─── Magic Link ───
async function sendMagicLink(email, token) {
  const link = `${APP_URL}/auth/verify?token=${token}`;

  return sendEmail(
    email,
    'Votre lien de connexion — Club Jean Jaurès',
    `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2B5C8A;">Club Jean Jaurès</h2>
        <p>Bonjour,</p>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
        <a href="${link}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Se connecter
        </a>
        <p style="color:#6B7280;font-size:14px;">Ce lien expire dans 15 minutes et ne peut être utilisé qu'une seule fois.</p>
        <p style="color:#6B7280;font-size:12px;">Si le bouton ne fonctionne pas, copiez ce lien : ${link}</p>
      </div>
    `
  );
}

// ─── Invitation ───
async function sendInvitation(email, inviterName) {
  const link = `${APP_URL}/inscription`;

  return sendEmail(
    email,
    `${inviterName} vous invite au Club Jean Jaurès`,
    `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2B5C8A;">Club Jean Jaurès</h2>
        <p>${inviterName} vous invite à rejoindre le Club Jean Jaurès, club d'affaires de Saint-Étienne.</p>
        <a href="${link}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Rejoindre le club
        </a>
      </div>
    `
  );
}

// ─── Email groupé ───
async function sendBulkEmail(emails, subject, htmlContent) {
  let sent = 0;
  for (const email of emails) {
    const result = await sendEmail(email, subject, htmlContent);
    if (result.ok) sent++;
  }
  if (sent < emails.length) {
    console.error(`Email groupé: ${emails.length - sent} échecs sur ${emails.length}`);
  }
  return sent;
}

module.exports = { sendMagicLink, sendInvitation, sendBulkEmail };
