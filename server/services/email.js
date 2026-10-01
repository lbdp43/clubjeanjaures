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
      // Un seul mail pour toutes les adresses d'un même membre (principale + secondaires)
      to: (Array.isArray(to) ? to : [to]).map(email => ({ email })),
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo erreur ${res.status}`);
  }
}

// Toutes les adresses d'un membre : principale puis secondaires, sans doublon
function memberEmails(user) {
  return [...new Set([user.email, ...(user.secondaryEmails || [])].filter(Boolean).map(e => e.toLowerCase().trim()))];
}

// ─── Envoi principal ─── (to : une adresse ou la liste des adresses d'un même membre)
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
  const link = `${APP_URL}/api/auth/verify-redirect?token=${token}`;

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
async function sendInvitation(email, inviterName, token) {
  // Si un token est fourni → magic link qui connecte directement (et le compte est déjà en "member")
  // Sinon → fallback vers la page d'inscription classique
  const link = token
    ? `${APP_URL}/api/auth/verify-redirect?token=${token}`
    : `${APP_URL}/inscription`;

  return sendEmail(
    email,
    `${inviterName} vous invite au Club Jean Jaurès`,
    `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2B5C8A;">Club Jean Jaurès</h2>
        <p>${inviterName} vous invite à rejoindre le Club Jean Jaurès, club d'affaires de Saint-Étienne.</p>
        <p>Cliquez sur le bouton ci-dessous — vous serez directement connecté et enregistré comme membre du club :</p>
        <a href="${link}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Rejoindre le club
        </a>
        ${token ? `<p style="color:#6B7280;font-size:12px;">Ce lien est valable 7 jours.</p>` : ''}
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

// ─── Rappel d'événement ───
async function sendEventReminder(email, { event, daysBefore, customMessage, userId }) {
  const eventUrl = `${APP_URL}/agenda/${event.id}`;
  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const subject = daysBefore <= 5
    ? `Plus que ${daysBefore} jours — ${event.title}`
    : `Rappel : ${event.title} dans ${daysBefore} jours`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#2B5C8A;margin:0 0 16px;">Club Jean Jaurès</h2>
      <p>Bonjour,</p>
      <p>L'événement <strong>${event.title}</strong> aura lieu <strong>dans ${daysBefore} jours</strong>.</p>
      <div style="background:#F3F4F6;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px;"><strong>📅 ${dateStr}</strong></p>
        <p style="margin:0 0 6px;">🕐 ${event.timeStart}${event.timeEnd ? ` — ${event.timeEnd}` : ''}</p>
        <p style="margin:0;">📍 ${event.location}</p>
      </div>
      <p style="font-size:15px;">
        <strong>Pense à dire si tu participes ou si tu ne participes pas à l'événement.</strong>
      </p>
      ${customMessage ? `<p style="color:#374151;">${customMessage.replace(/\n/g, '<br>')}</p>` : ''}
      <a href="${eventUrl}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;font-weight:600;">
        Répondre maintenant
      </a>
      <p style="color:#6B7280;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
        Vous recevez cet email car vous n'avez pas encore indiqué votre participation.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

// ─── Relance manuelle (admin) : membre qui n'a pas encore répondu ───
const RSVP_REQUEST_TEXT = {
  pending: {
    subject: (t) => `${t} : es-tu dispo ?`,
    intro: (t) => `Tu n'as pas encore indiqué si tu participes à <strong>${t}</strong>.`,
    ask: "Merci de nous dire si tu es dispo ou pas dispo, ça nous aide à organiser l'événement.",
    cta: 'Je réponds'
  },
  declined: {
    subject: (t) => `${t} : toujours pas dispo ?`,
    intro: (t) => `Tu avais indiqué ne pas être disponible pour <strong>${t}</strong>.`,
    ask: "Si ton planning a changé, tu peux encore t'inscrire en un clic.",
    cta: "Voir l'événement"
  },
  going: {
    subject: (t) => `Rappel : ${t}`,
    intro: (t) => `Tu es inscrit·e à <strong>${t}</strong>, merci !`,
    ask: "Petit rappel des infos pratiques. Si tu ne peux plus venir, pense à passer en « Pas dispo ».",
    cta: "Voir l'événement"
  }
};

async function sendRsvpRequest(email, { event, message, status = 'pending' }) {
  const text = RSVP_REQUEST_TEXT[status] || RSVP_REQUEST_TEXT.pending;
  const eventUrl = `${APP_URL}/agenda/${event.id}`;
  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
  const subject = text.subject(event.title);

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#2B5C8A;margin:0 0 16px;">Club Jean Jaurès</h2>
      <p>Bonjour,</p>
      <p>${text.intro(event.title)}</p>
      <div style="background:#F3F4F6;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px;"><strong>📅 ${dateStr}</strong></p>
        <p style="margin:0 0 6px;">🕐 ${event.timeStart}${event.timeEnd ? ` — ${event.timeEnd}` : ''}</p>
        <p style="margin:0;">📍 ${event.location}</p>
      </div>
      <p style="font-size:15px;"><strong>${text.ask}</strong></p>
      ${message ? `<p style="color:#374151;">${message.replace(/\n/g, '<br>')}</p>` : ''}
      <a href="${eventUrl}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;font-weight:600;">
        ${text.cta}
      </a>
      <p style="color:#6B7280;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
        Un clic sur « Je participe » ou « Pas dispo » dans l'application suffit.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

module.exports = { memberEmails, sendMagicLink, sendInvitation, sendBulkEmail, sendEventReminder, sendRsvpRequest };
