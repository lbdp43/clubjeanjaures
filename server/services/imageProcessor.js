const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImage(filePath) {
  const ext = path.extname(filePath);
  const outputPath = filePath.replace(ext, '.webp');

  await sharp(filePath)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);

  // Supprimer l'original si différent du fichier de sortie
  if (filePath !== outputPath) {
    fs.unlinkSync(filePath);
  }

  return path.basename(outputPath);
}

module.exports = { processImage };
