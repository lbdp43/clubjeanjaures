const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ─── Configuration du transporteur ───
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Vérifier la connexion au démarrage
  transporter.verify()
    .then(() => logger.info('Connexion SMTP Gmail OK'))
    .catch(err => logger.error('Erreur connexion SMTP', { error: err.message }));
}

const FROM = process.env.SMTP_FROM || `Club Jean Jaurès <${process.env.SMTP_USER || 'noreply@clubjeanjaures.fr'}>`;

// ─── Envoi principal ───
async function sendEmail(to, subject, html) {
  if (!transporter) {
    logger.warn(`Email non envoyé (SMTP non configuré)`, { to, subject });
    return { ok: false, error: 'Email non configuré. Ajoutez SMTP_USER et SMTP_PASS dans Railway.' };
  }

  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
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
