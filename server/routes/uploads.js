const express = require('express');
const prisma = require('../prisma/db');

const router = express.Router();

// GET /api/uploads/:id — servir une image stockée en base de données
router.get('/:id', async (req, res) => {
  try {
    const upload = await prisma.upload.findUnique({
      where: { id: req.params.id }
    });

    if (!upload) return res.status(404).send('Not found');

    res.set('Content-Type', upload.mimeType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(upload.data);
  } catch (err) {
    console.error('Erreur serve upload:', err);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
