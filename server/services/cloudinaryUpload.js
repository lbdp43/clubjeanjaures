const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration Cloudinary via variable d'environnement
// CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// (Railway: ajouter la variable CLOUDINARY_URL dans les settings)
cloudinary.config();

const CLOUDINARY_CONFIGURED = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

/**
 * Traite et upload une image.
 * Si Cloudinary est configuré → upload vers le cloud (URL permanente).
 * Sinon → fallback local /uploads/ (perdu au redéploiement).
 */
async function uploadImage(filePath, folder = 'members') {
  // Convertir en WebP et redimensionner
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

  if (CLOUDINARY_CONFIGURED) {
    try {
      const result = await cloudinary.uploader.upload(webpPath, {
        folder: `club-jean-jaures/${folder}`,
        format: 'webp',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      });

      // Supprimer le fichier local après upload cloud
      try { fs.unlinkSync(webpPath); } catch {}

      return result.secure_url;
    } catch (err) {
      console.error('Erreur Cloudinary upload:', err.message);
      // Fallback local en cas d'erreur
      return `/uploads/${path.basename(webpPath)}`;
    }
  }

  // Fallback local
  return `/uploads/${path.basename(webpPath)}`;
}

/**
 * Upload un fichier non-image (PDF, etc.)
 */
async function uploadFile(filePath, folder = 'files') {
  if (CLOUDINARY_CONFIGURED) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `club-jean-jaures/${folder}`,
        resource_type: 'raw'
      });

      try { fs.unlinkSync(filePath); } catch {}
      return result.secure_url;
    } catch (err) {
      console.error('Erreur Cloudinary file upload:', err.message);
      return `/uploads/${path.basename(filePath)}`;
    }
  }

  return `/uploads/${path.basename(filePath)}`;
}

module.exports = { uploadImage, uploadFile, CLOUDINARY_CONFIGURED };
