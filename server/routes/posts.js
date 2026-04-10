const express = require('express');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { processImage } = require('../services/imageProcessor');
const xss = require('xss');

const router = express.Router();

// GET /api/posts
router.get('/', requireAuth, requireMember, async (req, res) => {
  try {
    const { type, page = 1 } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;
    const where = type ? { type } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, email: true, member: { select: { companyName: true, logoUrl: true } } }
          },
          comments: {
            include: {
              author: {
                select: { id: true, email: true, member: { select: { companyName: true, logoUrl: true } } }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          likes: { select: { userId: true } },
          _count: { select: { likes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.post.count({ where })
    ]);

    res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / take) });
  } catch (err) {
    console.error('Erreur posts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/posts
router.post('/', requireAuth, requireMember, upload.array('attachments', 5), async (req, res) => {
  try {
    const { content, type = 'post' } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Contenu requis' });
    }

    const attachments = [];
    if (req.files) {
      for (const file of req.files) {
        if (file.mimetype.startsWith('image/')) {
          const filename = await processImage(file.path);
          attachments.push(`/uploads/${filename}`);
        } else {
          attachments.push(`/uploads/${file.filename}`);
        }
      }
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.user.id,
        type,
        content: xss(content),
        attachments
      },
      include: {
        author: {
          select: { id: true, email: true, member: { select: { companyName: true, logoUrl: true } } }
        },
        _count: { select: { likes: true, comments: true } }
      }
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('Erreur create post:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Publication introuvable' });

    const canDelete = post.authorId === req.user.id ||
      ['moderator', 'admin'].includes(req.user.role);
    if (!canDelete) return res.status(403).json({ error: 'Non autorisé' });

    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete post:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, requireMember, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Contenu requis' });
    }

    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Publication introuvable' });

    const comment = await prisma.comment.create({
      data: {
        postId: req.params.id,
        authorId: req.user.id,
        content: xss(content)
      },
      include: {
        author: {
          select: { id: true, email: true, member: { select: { companyName: true, logoUrl: true } } }
        }
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Erreur create comment:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/comments/:id
router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });

    const canDelete = comment.authorId === req.user.id ||
      ['moderator', 'admin'].includes(req.user.role);
    if (!canDelete) return res.status(403).json({ error: 'Non autorisé' });

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete comment:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/posts/:id/like (toggle)
router.post('/:id/like', requireAuth, requireMember, async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.user.id } }
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { postId: req.params.id, userId: req.user.id }
      });
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Erreur like:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
