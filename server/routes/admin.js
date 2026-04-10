const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { uploadImage } = require('../services/cloudinaryUpload');
const { sendInvitation, sendBulkEmail } = require('../services/email');
const xss = require('xss');

const SALT_ROUNDS = 10;

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      activeMembers,
      suspendedMembers,
      totalUsers,
      upcomingEvents,
      recentPosts,
      activeDemands,
      recentUsers
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'active', role: { not: 'visitor' } } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count(),
      prisma.event.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 5
      }),
      prisma.post.findMany({
        include: {
          author: { select: { email: true, member: { select: { companyName: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.post.count({ where: { type: 'demande' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, role: true, createdAt: true }
      })
    ]);

    res.json({
      stats: { activeMembers, suspendedMembers, totalUsers, activeDemands },
      upcomingEvents,
      recentPosts,
      recentUsers
    });
  } catch (err) {
    console.error('Erreur dashboard:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/members
router.get('/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { member: true },
      orderBy: { createdAt: 'desc' }
    });

    const safeUsers = users.map(({ magicToken, magicTokenExpires, ...u }) => u);
    res.json(safeUsers);
  } catch (err) {
    console.error('Erreur admin members:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/role
router.put('/members/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['visitor', 'member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });

    res.json({ id: user.id, role: user.role });
  } catch (err) {
    console.error('Erreur update role:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/status
router.put('/members/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json({ id: user.id, status: user.status });
  } catch (err) {
    console.error('Erreur update status:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    const uid = req.params.id;
    // Nettoyer les données liées avant suppression
    await prisma.session.deleteMany({ where: { userId: uid } });
    await prisma.event.updateMany({ where: { createdBy: uid }, data: { createdBy: null } });
    await prisma.favorite.deleteMany({ where: { OR: [{ userId: uid }, { memberId: uid }] } });
    await prisma.user.delete({ where: { id: uid } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete member:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.clubSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (err) {
    console.error('Erreur get settings:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/settings
router.put('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, contactEmail, contactPhone, address } = req.body;
    const data = {};
    if (name) data.name = xss(name);
    if (description !== undefined) data.description = xss(description);
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (address !== undefined) data.address = xss(address);

    const settings = await prisma.clubSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });

    res.json(settings);
  } catch (err) {
    console.error('Erreur update settings:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/settings/logo
router.post('/settings/logo', requireAuth, requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier requis' });

    const logoUrl = await uploadImage(req.file.path);

    await prisma.clubSettings.upsert({
      where: { id: 1 },
      update: { logoUrl },
      create: { id: 1, logoUrl }
    });

    res.json({ logoUrl });
  } catch (err) {
    console.error('Erreur upload logo:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/password — Reset password
router.put('/members/:id/password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Erreur reset password:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/profile — Edit member profile
router.put('/members/:id/profile', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { companyName, jobTitle, phone, address, city, website, description, lookingFor, canOffer } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { member: true } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const data = {};
    if (companyName !== undefined) data.companyName = xss(companyName);
    if (jobTitle !== undefined) data.jobTitle = xss(jobTitle);
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = xss(address);
    if (city !== undefined) data.city = xss(city);
    if (website !== undefined) data.website = website;
    if (description !== undefined) data.description = xss(description);
    if (lookingFor !== undefined) data.lookingFor = xss(lookingFor);
    if (canOffer !== undefined) data.canOffer = xss(canOffer);

    const member = await prisma.member.upsert({
      where: { id: req.params.id },
      update: data,
      create: {
        id: req.params.id,
        companyName: data.companyName || '',
        jobTitle: data.jobTitle || '',
        phone: data.phone || '',
        address: data.address || '',
        ...data
      }
    });

    res.json(member);
  } catch (err) {
    console.error('Erreur edit profile:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/invite — Invite a new member by email
router.post('/invite', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const inviterName = req.user.member?.companyName || req.user.email;
    const sent = await sendInvitation(email.toLowerCase().trim(), inviterName);

    if (!sent) {
      return res.status(500).json({ error: "Impossible d'envoyer l'email. Vérifiez la configuration Gmail." });
    }
    res.json({ success: true, message: 'Invitation envoyée.' });
  } catch (err) {
    console.error('Erreur invite:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/notify — Send email to all active members
router.post('/notify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Sujet et message requis.' });
    }

    const members = await prisma.user.findMany({
      where: { status: 'active', role: { not: 'visitor' } },
      select: { email: true }
    });

    const emails = members.map(m => m.email);
    if (emails.length === 0) {
      return res.json({ sent: 0, message: 'Aucun membre actif trouvé.' });
    }

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#2B5C8A;">Club Jean Jaurès</h2>
        <h3>${xss(subject)}</h3>
        <div>${xss(message).replace(/\n/g, '<br>')}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="color:#6B7280;font-size:12px;">Vous recevez cet email en tant que membre du Club Jean Jaurès.</p>
      </div>
    `;

    const sent = await sendBulkEmail(emails, subject, htmlContent);
    res.json({ sent, total: emails.length, message: `Email envoyé à ${sent}/${emails.length} membres.` });
  } catch (err) {
    console.error('Erreur notify:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
