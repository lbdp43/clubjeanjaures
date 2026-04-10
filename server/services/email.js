const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Club Jean Jaurès <onboarding@resend.dev>';

async function sendMagicLink(email, token) {
  const link = `${APP_URL}/auth/verify?token=${token}`;

  if (process.env.EMAIL_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: 'Votre lien de connexion — Club Jean Jaurès',
          html: `
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
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Erreur Resend:', err);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Erreur envoi email:', err);
      return false;
    }
  }

  // Mode développement : pas de clé API
  console.log(`\n=== MAGIC LINK (dev) ===`);
  console.log(`Email: ${email}`);
  console.log(`Lien:  ${link}`);
  console.log(`========================\n`);
  return true;
}

async function sendInvitation(email, inviterName) {
  const link = `${APP_URL}/inscription`;

  if (process.env.EMAIL_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: `${inviterName} vous invite au Club Jean Jaurès`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#2B5C8A;">Club Jean Jaurès</h2>
              <p>${inviterName} vous invite à rejoindre le Club Jean Jaurès, club d'affaires de Saint-Étienne.</p>
              <a href="${link}" style="display:inline-block;background:#2B5C8A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">
                Rejoindre le club
              </a>
            </div>
          `
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Erreur Resend invitation:', err);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Erreur envoi invitation:', err);
      return false;
    }
  }

  console.log(`\n=== INVITATION (dev) ===`);
  console.log(`Pour: ${email} — De: ${inviterName}`);
  console.log(`Lien: ${link}`);
  console.log(`========================\n`);
  return true;
}

async function sendBulkEmail(emails, subject, htmlContent) {
  if (!process.env.EMAIL_API_KEY) {
    console.log(`\n=== EMAIL GROUPÉ (dev) ===`);
    console.log(`${emails.length} destinataires — ${subject}`);
    console.log(`==========================\n`);
    return emails.length;
  }

  const results = await Promise.allSettled(
    emails.map(email =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: htmlContent
        })
      }).then(res => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res;
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) console.error(`Email groupé: ${failed} échecs sur ${emails.length}`);
  return sent;
}

module.exports = { sendMagicLink, sendInvitation, sendBulkEmail };
