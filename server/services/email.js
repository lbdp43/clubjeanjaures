const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function sendMagicLink(email, token) {
  const link = `${APP_URL}/auth/verify?token=${token}`;

  // Si clé API Resend configurée, envoyer par Resend
  if (process.env.EMAIL_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Club Jean Jaurès <noreply@clubjeanjaures.fr>',
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
          </div>
        `
      })
    });
    return res.ok;
  }

  // Mode développement : afficher le lien dans la console
  console.log(`\n📧 Magic link pour ${email}:\n${link}\n`);
  return true;
}

async function sendInvitation(email, inviterName) {
  const link = `${APP_URL}/inscription`;

  if (process.env.EMAIL_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Club Jean Jaurès <noreply@clubjeanjaures.fr>',
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
    return res.ok;
  }

  console.log(`\n📧 Invitation pour ${email} de la part de ${inviterName}:\n${link}\n`);
  return true;
}

async function sendBulkEmail(emails, subject, htmlContent) {
  if (!process.env.EMAIL_API_KEY) {
    console.log(`\n📧 Email groupé à ${emails.length} destinataires: ${subject}\n`);
    return true;
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
          from: 'Club Jean Jaurès <noreply@clubjeanjaures.fr>',
          to: email,
          subject,
          html: htmlContent
        })
      })
    )
  );

  return results.filter(r => r.status === 'fulfilled').length;
}

module.exports = { sendMagicLink, sendInvitation, sendBulkEmail };
