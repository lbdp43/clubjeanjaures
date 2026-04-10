const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prisma = require('../prisma/db');

/**
 * Traite une image (redimensionne + WebP) puis la stocke en base de données.
 * Retourne une URL permanente /api/uploads/:id
 */
async function uploadImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier introuvable : ' + filePath);
  }

  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');

  try {
    await sharp(filePath)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(webpPath);
  } finally {
    // Supprimer l'original même si sharp échoue
    if (filePath !== webpPath) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }

  const data = fs.readFileSync(webpPath);

  try {
    const upload = await prisma.upload.create({
      data: { data, mimeType: 'image/webp' }
    });
    return `/api/uploads/${upload.id}`;
  } finally {
    try { fs.unlinkSync(webpPath); } catch {}
  }
}

/**
 * Upload un fichier non-image (PDF, etc.) en base de données.
 */
async function uploadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier introuvable : ' + filePath);
  }

  const data = fs.readFileSync(filePath);
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
    try { fs.unlinkSync(filePath); } catch {}
  }
}

module.exports = { uploadImage, uploadFile };
