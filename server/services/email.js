const logger = require('../utils/logger');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Club Jean Jaurès';
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || 'contact@clubjeanjaures.fr';

// ─── Envoi via Brevo (ex-Sendinblue) API HTTP — fonctionne sur Railway ───
async function sendViaBrevo(to, subject, html) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo erreur ${res.status}`);
  }
}

// ─── Envoi principal ───
async function sendEmail(to, subject, html) {
  if (!process.env.BREVO_API_KEY) {
    logger.warn('Email non envoyé (BREVO_API_KEY non configurée)', { to, subject });
    return { ok: false, error: 'Email non configuré. Ajoutez BREVO_API_KEY dans les variables Railway.' };
  }

  try {
    await sendViaBrevo(to, subject, html);
    logger.info(`Email envoyé à ${to}`);
    return { ok: true };
  } catch (err) {
    logger.error('Erreur envoi email', { to, error: err.message });
    return { ok: false, error: err.message };
  }
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
    logger.error(`Email groupé: ${emails.length - sent} échecs sur ${emails.length}`);
  }
  return sent;
}

module.exports = { sendMagicLink, sendInvitation, sendBulkEmail };
