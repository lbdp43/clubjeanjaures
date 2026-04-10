const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prisma = require('../prisma/db');

/**
 * Traite une image (redimensionne + WebP) puis la stocke en base de données.
 * Retourne une URL permanente /api/uploads/:id
 */
async function uploadImage(filePath) {
  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');

  await sharp(filePath)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpPath);

  // Supprimer l'original
  if (filePath !== webpPath) {
    try { fs.unlinkSync(filePath); } catch {}
  }

  // Lire le fichier WebP en binaire
  const data = fs.readFileSync(webpPath);

  // Stocker en base de données
  const upload = await prisma.upload.create({
    data: {
      data: data,
      mimeType: 'image/webp'
    }
  });

  // Supprimer le fichier local
  try { fs.unlinkSync(webpPath); } catch {}

  return `/api/uploads/${upload.id}`;
}

/**
 * Upload un fichier non-image (PDF, etc.) en base de données.
 */
async function uploadFile(filePath) {
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  const upload = await prisma.upload.create({
    data: {
      data: data,
      mimeType: mimeTypes[ext] || 'application/octet-stream'
    }
  });

  // Supprimer le fichier local
  try { fs.unlinkSync(filePath); } catch {}

  return `/api/uploads/${upload.id}`;
}

module.exports = { uploadImage, uploadFile };
