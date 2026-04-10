const express = require('express');
const prisma = require('../prisma/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { uploadImage, uploadFile } = require('../services/cloudinaryUpload');
const xss = require('xss');

const router = express.Router();

// GET /api/members/public — annuaire public
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      include: { user: { select: { id: true, email: true, role: true, status: true } } },
      where: { user: { status: 'active', role: { not: 'visitor' } } }
    });

    const isAuthenticated = !!req.user;
    const result = members.map(m => {
      const visibility = m.visibility || {};
      return {
        id: m.id,
        companyName: m.companyName,
        jobTitle: m.jobTitle,
        city: m.city,
        address: m.address,
        logoUrl: m.logoUrl,
        description: m.description,
        lookingFor: m.lookingFor,
        canOffer: m.canOffer,
        website: m.website,
        phone: (isAuthenticated || visibility.phone === 'public') ? m.phone : null,
        email: (isAuthenticated || visibility.email === 'public') ? m.user.email : null,
        latitude: m.latitude,
        longitude: m.longitude
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Erreur members/public:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members — annuaire complet (membres authentifiés)
router.get('/', requireAuth, requireMember, async (req, res) => {
  try {
    const { search } = req.query;
    let where = { user: { status: 'active', role: { not: 'visitor' } } };

    if (search) {
      const term = `%${search}%`;
      where = {
        user: { status: 'active', role: { not: 'visitor' } },
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { jobTitle: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const members = await prisma.member.findMany({
      where,
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { companyName: 'asc' }
    });

    res.json(members);
  } catch (err) {
    console.error('Erreur members:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true, role: true, status: true } } }
    });

    if (!member) return res.status(404).json({ error: 'Membre introuvable' });

    const isAuthenticated = !!req.user;
    const visibility = member.visibility || {};

    if (!isAuthenticated) {
      if (visibility.phone !== 'public') member.phone = null;
      if (visibility.email !== 'public') member.user.email = null;
    }

    res.json(member);
  } catch (err) {
    console.error('Erreur member detail:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/members/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const data = {};
    const fields = [
      'companyName', 'jobTitle', 'phone', 'address', 'city',
      'latitude', 'longitude', 'website', 'description',
      'lookingFor', 'canOffer'
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        data[field] = typeof req.body[field] === 'string' ? xss(req.body[field]) : req.body[field];
      }
    }

    if (req.body.socialLinks) data.socialLinks = req.body.socialLinks;
    if (req.body.visibility) data.visibility = req.body.visibility;

    // Upsert le profil membre
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

    // Promouvoir en member si encore visitor
    if (req.user.role === 'visitor') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'member' }
      });
    }

    res.json(member);
  } catch (err) {
    console.error('Erreur update member:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/members/:id/photos
router.post('/:id/photos', requireAuth, upload.array('photos', 10), async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Auto-créer le profil membre s'il n'existe pas encore
    let member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) {
      member = await prisma.member.create({
        data: { id: req.params.id, companyName: '', jobTitle: '', phone: '', address: '' }
      });
    }

    const processedFiles = [];
    for (const file of req.files) {
      if (file.mimetype.startsWith('image/')) {
        const url = await uploadImage(file.path);
        processedFiles.push(url);
      } else {
        const url = await uploadFile(file.path);
        processedFiles.push(url);
      }
    }

    const field = req.body.type === 'logo' ? 'logoUrl' : 'photos';
    if (field === 'logoUrl') {
      await prisma.member.update({
        where: { id: req.params.id },
        data: { logoUrl: processedFiles[0] }
      });
    } else {
      const currentPhotos = Array.isArray(member.photos) ? member.photos : [];
      await prisma.member.update({
        where: { id: req.params.id },
        data: { photos: [...currentPhotos, ...processedFiles] }
      });
    }

    res.json({ urls: processedFiles });
  } catch (err) {
    console.error('Erreur upload photos:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/members/:id/photos/:idx
router.delete('/:id/photos/:idx', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) return res.status(404).json({ error: 'Membre introuvable' });

    const photos = Array.isArray(member.photos) ? [...member.photos] : [];
    const idx = parseInt(req.params.idx);
    if (idx < 0 || idx >= photos.length) {
      return res.status(400).json({ error: 'Index invalide' });
    }

    photos.splice(idx, 1);
    await prisma.member.update({ where: { id: req.params.id }, data: { photos } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete photo:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
