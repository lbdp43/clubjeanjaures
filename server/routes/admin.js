const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { uploadImage } = require('../services/cloudinaryUpload');
const { sendInvitation, sendBulkEmail } = require('../services/email');
const xss = require('xss');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  message: { error: 'Trop de requêtes, réessayez plus tard' }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Limite d\'envoi atteinte, réessayez plus tard' }
});

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
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { email: true, member: { select: { companyName: true } } } },
          _count: { select: { comments: true, likes: true } }
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

    res.set('Cache-Control', 'private, max-age=30');
    res.json({
      stats: { activeMembers, suspendedMembers, totalUsers, activeDemands },
      upcomingEvents,
      recentPosts,
      recentUsers
    });
  } catch (err) {
    logger.error('Erreur dashboard', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/members/export — export TXT list of all members
router.get('/members/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'visitor' } },
      include: { member: true },
      orderBy: { createdAt: 'asc' }
    });

    const lines = [];
    lines.push('LISTE DES MEMBRES — Club Jean Jaurès');
    lines.push(`Exportée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push(`Total : ${users.length} membre${users.length > 1 ? 's' : ''}`);
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push('');

    users.forEach((u, i) => {
      const m = u.member;
      lines.push(`${i + 1}. ${m?.companyName || '(sans nom)'}`);
      if (m?.jobTitle) lines.push(`   Fonction : ${m.jobTitle}`);
      lines.push(`   Email : ${u.email}`);
      if (m?.phone) lines.push(`   Téléphone : ${m.phone}`);
      if (m?.city) lines.push(`   Ville : ${m.city}`);
      if (m?.sector) lines.push(`   Secteur : ${m.sector}`);
      lines.push(`   Statut : ${u.status === 'active' ? 'actif' : 'suspendu'} | Rôle : ${u.role}`);
      lines.push('');
    });

    const txt = lines.join('\n');
    const today = new Date().toISOString().slice(0, 10);

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="membres-club-jean-jaures-${today}.txt"`);
    res.send(txt);
  } catch (err) {
    logger.error('Erreur export members', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/members
router.get('/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      include: { member: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });

    const safeUsers = users.map(({ magicToken, magicTokenExpires, ...u }) => u);
    res.json(safeUsers);
  } catch (err) {
    logger.error('Erreur admin members', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/role
router.put('/members/:id/role', requireAuth, requireAdmin, adminActionLimiter, async (req, res) => {
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
    logger.error('Erreur update role', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/status
router.put('/members/:id/status', requireAuth, requireAdmin, adminActionLimiter, async (req, res) => {
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
    logger.error('Erreur update status', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', requireAuth, requireAdmin, adminActionLimiter, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    const uid = req.params.id;
    // Nettoyer les données liées avant suppression
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: uid } }),
      prisma.event.updateMany({ where: { createdBy: uid }, data: { createdBy: null } }),
      prisma.favorite.deleteMany({ where: { OR: [{ userId: uid }, { memberId: uid }] } }),
      prisma.user.delete({ where: { id: uid } })
    ]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur delete member', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/settings
router.get('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    let settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.clubSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (err) {
    logger.error('Erreur get settings', { error: err.message, stack: err.stack });
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
    if (req.body.publicAgenda !== undefined) data.publicAgenda = !!req.body.publicAgenda;

    const settings = await prisma.clubSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });

    res.json(settings);
  } catch (err) {
    logger.error('Erreur update settings', { error: err.message, stack: err.stack });
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
    logger.error('Erreur upload logo', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/password — Reset password
router.put('/members/:id/password', requireAuth, requireAdmin, adminActionLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur reset password', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/members/:id/profile — Edit member profile
router.put('/members/:id/profile', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { companyName, jobTitle, phone, address, city, sector, website, description, lookingFor, canOffer } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { member: true } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const data = {};
    if (companyName !== undefined) data.companyName = xss(companyName);
    if (jobTitle !== undefined) data.jobTitle = xss(jobTitle);
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = xss(address);
    if (city !== undefined) data.city = xss(city);
    if (sector !== undefined) data.sector = sector ? xss(sector) : null;
    if (website !== undefined) data.website = website;
    if (description !== undefined) data.description = xss(description);
    if (lookingFor !== undefined) data.lookingFor = xss(lookingFor);
    if (canOffer !== undefined) data.canOffer = xss(canOffer);

    if (req.body.visibility) {
      const vis = req.body.visibility;
      if (typeof vis === 'object' && !Array.isArray(vis)) {
        data.visibility = vis;
      }
    }

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
    logger.error('Erreur edit profile', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/invite — Invite a new member by email
router.post('/invite', requireAuth, requireAdmin, emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const inviterName = req.user.member?.companyName || req.user.email;
    const result = await sendInvitation(email.toLowerCase().trim(), inviterName);

    if (!result.ok) {
      return res.status(500).json({ error: result.error || "Impossible d'envoyer l'email." });
    }
    res.json({ success: true, message: 'Invitation envoyée.' });
  } catch (err) {
    logger.error('Erreur invite', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/notify — Send email to all active members
router.post('/notify', requireAuth, requireAdmin, emailLimiter, async (req, res) => {
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

    // Instead of sequential for loop, use batched Promise.allSettled
    const batchSize = 10;
    let sent = 0;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(email => sendBulkEmail([email], subject, htmlContent))
      );
      sent += results.filter(r => r.status === 'fulfilled' && r.value >= 1).length;
    }
    res.json({ sent, total: emails.length, message: `Email envoyé à ${sent}/${emails.length} membres.` });
  } catch (err) {
    logger.error('Erreur notify', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
