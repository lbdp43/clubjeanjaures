const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ─── Envoi via Resend HTTP API (recommandé pour Railway) ───
async function sendViaResend(to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Club Jean Jaurès <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Resend erreur ${response.status}`);
  }
}

// ─── Envoi via Gmail SMTP (hors Railway) ───
async function sendViaGmail(to, subject, html) {
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
  // Priorité 1 : Resend HTTP API (fonctionne sur Railway)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html);
      console.log(`Email envoyé à ${to} via Resend`);
      return { ok: true };
    } catch (err) {
      console.error('Erreur Resend:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // Priorité 2 : Gmail SMTP (pour hébergement hors Railway)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendViaGmail(to, subject, html);
      console.log(`Email envoyé à ${to} via Gmail SMTP`);
      return { ok: true };
    } catch (err) {
      console.error('Erreur Gmail SMTP:', err.message);
      return { ok: false, error: `Gmail: ${err.message}` };
    }
  }

  // Aucun provider configuré
  console.log(`\n=== EMAIL (aucun provider) ===\nÀ: ${to}\nSujet: ${subject}\n==============================\n`);
  return { ok: false, error: 'Aucun service email configuré. Ajoutez RESEND_API_KEY dans Railway.' };
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
