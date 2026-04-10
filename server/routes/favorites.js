const express = require('express');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/roles');

const router = express.Router();

// GET /api/favorites
router.get('/', requireAuth, requireMember, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        member: {
          select: {
            id: true, email: true,
            member: { select: { companyName: true, jobTitle: true, logoUrl: true, city: true } }
          }
        }
      }
    });

    res.json(favorites);
  } catch (err) {
    console.error('Erreur favorites:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/favorites/:memberId
router.post('/:memberId', requireAuth, requireMember, async (req, res) => {
  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_memberId: { userId: req.user.id, memberId: req.params.memberId } }
    });

    if (existing) {
      return res.status(400).json({ error: 'Déjà en favori' });
    }

    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, memberId: req.params.memberId }
    });

    res.status(201).json(favorite);
  } catch (err) {
    console.error('Erreur add favorite:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/favorites/:memberId
router.delete('/:memberId', requireAuth, requireMember, async (req, res) => {
  try {
    await prisma.favorite.delete({
      where: { userId_memberId: { userId: req.user.id, memberId: req.params.memberId } }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur remove favorite:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
