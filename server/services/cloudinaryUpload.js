const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prisma = require('../prisma/db');

/**
 * Traite une image (redimensionne + WebP) puis la stocke en base de données.
 * Retourne une URL permanente /api/uploads/:id
 */
async function uploadImage(filePath, maxWidth = 1200) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier introuvable : ' + filePath);
  }

  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');

  try {
    await sharp(filePath)
      .rotate()
      .resize(maxWidth, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(webpPath);
  } finally {
    // Supprimer l'original même si sharp échoue
    if (filePath !== webpPath) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }

  const data = await fs.promises.readFile(webpPath);

  try {
    const upload = await prisma.upload.create({
      data: { data, mimeType: 'image/webp' }
    });
    return `/api/uploads/${upload.id}`;
  } finally {
    await fs.promises.unlink(webpPath).catch(() => {});
  }
}

/**
 * Upload un fichier non-image (PDF, etc.) en base de données.
 */
async function uploadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier introuvable : ' + filePath);
  }

  const data = await fs.promises.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  try {
    const upload = await prisma.upload.create({
      data: { data, mimeType: mimeTypes[ext] || 'application/octet-stream' }
    });
    return `/api/uploads/${upload.id}`;
  } finally {
    await fs.promises.unlink(filePath).catch(() => {});
  }
}

module.exports = { uploadImage, uploadFile };
