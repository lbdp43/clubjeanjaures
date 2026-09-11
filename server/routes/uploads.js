const express = require('express');
const sharp = require('sharp');
const prisma = require('../prisma/db');
const logger = require('../utils/logger');

const router = express.Router();

const ALLOWED_WIDTHS = [200, 400, 800];
const MAX_CACHE_ENTRIES = 300;
const resizedCache = new Map();

function cacheGet(key) {
  const hit = resizedCache.get(key);
  if (!hit) return null;
  resizedCache.delete(key);
  resizedCache.set(key, hit);
  return hit;
}

function cacheSet(key, value) {
  resizedCache.set(key, value);
  if (resizedCache.size > MAX_CACHE_ENTRIES) {
    resizedCache.delete(resizedCache.keys().next().value);
  }
}

// GET /api/uploads/:id?w=400 — servir une image stockée en base, redimensionnée à la demande
router.get('/:id', async (req, res) => {
  try {
    const width = ALLOWED_WIDTHS.includes(Number(req.query.w)) ? Number(req.query.w) : null;
    const cacheKey = `${req.params.id}:${width || 'orig'}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('Content-Type', cached.mimeType);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(cached.data);
    }

    const upload = await prisma.upload.findUnique({ where: { id: req.params.id } });
    if (!upload) return res.status(404).send('Not found');

    let data = upload.data;
    let mimeType = upload.mimeType;

    if (width && mimeType.startsWith('image/')) {
      try {
        data = await sharp(upload.data)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
        mimeType = 'image/webp';
      } catch (err) {
        logger.warn('Resize impossible, image originale servie', { id: req.params.id, error: err.message });
      }
    }

    cacheSet(cacheKey, { data, mimeType });
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(data);
  } catch (err) {
    logger.error('Erreur serve upload', { error: err.message, stack: err.stack });
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
