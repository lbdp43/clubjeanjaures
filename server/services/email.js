const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Club Jean Jaurès <noreply@clubjeanjaures.fr>';

// Créer le transporteur email
function getTransporter() {
  // Option 1 : Gmail SMTP (gratuit)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Option 2 : Resend API (via SMTP)
  if (process.env.EMAIL_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.EMAIL_API_KEY
      }
    });
  }

  // Option 3 : SMTP personnalisé
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
}

function getFromEmail() {
  if (process.env.GMAIL_USER) {
    return `Club Jean Jaurès <${process.env.GMAIL_USER}>`;
  }
  return FROM_EMAIL;
}

async function sendEmail(to, subject, html) {
  const transporter = getTransporter();

  if (!transporter) {
    // Mode développement : pas de service email configuré
    console.log(`\n=== EMAIL (dev) ===`);
    console.log(`À: ${to}`);
    console.log(`Sujet: ${subject}`);
    console.log(`====================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
    return false;
  }
}

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

async function sendBulkEmail(emails, subject, htmlContent) {
  let sent = 0;
  for (const email of emails) {
    const ok = await sendEmail(email, subject, htmlContent);
    if (ok) sent++;
  }
  if (sent < emails.length) {
    console.error(`Email groupé: ${emails.length - sent} échecs sur ${emails.length}`);
  }
  return sent;
}

module.exports = { sendMagicLink, sendInvitation, sendBulkEmail };
