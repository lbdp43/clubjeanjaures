const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { uploadImage, uploadFile } = require('../services/cloudinaryUpload');
const xss = require('xss');
const logger = require('../utils/logger');

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessayez plus tard' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Trop d\'uploads, réessayez plus tard' }
});

const router = express.Router();

// GET /api/members/public — annuaire public
router.get('/public', readLimiter, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const where = { user: { status: 'active', role: { not: 'visitor' } } };

    const total = await prisma.member.count({ where });
    res.set('X-Total-Count', total.toString());

    const members = await prisma.member.findMany({
      include: { user: { select: { id: true, email: true, role: true, status: true } } },
      where,
      take: limit,
      skip
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
        photoUrl: m.photoUrl,
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

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    logger.error('Erreur members/public', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members — annuaire complet (membres authentifiés)
router.get('/', readLimiter, requireAuth, requireMember, async (req, res) => {
  try {
    const { search } = req.query;
    if (search && search.length > 100) {
      return res.status(400).json({ error: 'Recherche trop longue' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    let where = { user: { status: 'active', role: { not: 'visitor' } } };

    if (search) {
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

    const total = await prisma.member.count({ where });
    res.set('X-Total-Count', total.toString());

    const members = await prisma.member.findMany({
      where,
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { companyName: 'asc' },
      take: limit,
      skip
    });

    res.set('Cache-Control', 'private, max-age=60');
    res.json(members);
  } catch (err) {
    logger.error('Erreur members', { error: err.message, stack: err.stack });
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
    logger.error('Erreur member detail', { error: err.message, stack: err.stack });
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

    if (data.latitude !== undefined && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
      return res.status(400).json({ error: 'Latitude invalide' });
    }
    if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
      return res.status(400).json({ error: 'Longitude invalide' });
    }
    if (data.website && data.website.length > 500) {
      return res.status(400).json({ error: 'URL trop longue' });
    }

    if (req.body.socialLinks) {
      if (typeof req.body.socialLinks !== 'object' || Array.isArray(req.body.socialLinks)) {
        return res.status(400).json({ error: 'Format socialLinks invalide' });
      }
      data.socialLinks = req.body.socialLinks;
    }

    if (req.body.visibility) {
      const vis = req.body.visibility;
      if (typeof vis !== 'object' || Array.isArray(vis)) {
        return res.status(400).json({ error: 'Format visibility invalide' });
      }
      const allowedValues = ['public', 'private', 'members'];
      if (vis.phone && !allowedValues.includes(vis.phone)) {
        return res.status(400).json({ error: 'Valeur visibility.phone invalide' });
      }
      if (vis.email && !allowedValues.includes(vis.email)) {
        return res.status(400).json({ error: 'Valeur visibility.email invalide' });
      }
      data.visibility = vis;
    }

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
    logger.error('Erreur update member', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/members/:id/photos
router.post('/:id/photos', requireAuth, uploadLimiter, upload.array('photos', 10), async (req, res) => {
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

    const photoType = req.body.type;
    if (photoType === 'logo') {
      await prisma.member.update({
        where: { id: req.params.id },
        data: { logoUrl: processedFiles[0] }
      });
    } else if (photoType === 'profile') {
      await prisma.member.update({
        where: { id: req.params.id },
        data: { photoUrl: processedFiles[0] }
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
    logger.error('Erreur upload photos', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/members/:id/photo/:type (profile or logo)
router.delete('/:id/photo/:type', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const { type } = req.params;
    if (type !== 'profile' && type !== 'logo') {
      return res.status(400).json({ error: 'Type invalide (profile ou logo)' });
    }

    const data = type === 'profile' ? { photoUrl: null } : { logoUrl: null };
    await prisma.member.update({ where: { id: req.params.id }, data });
    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur delete photo/logo', { error: err.message, stack: err.stack });
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
    logger.error('Erreur delete photo', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
