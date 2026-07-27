const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS_SRC = path.join(ROOT, 'assets-src');
const ASSETS_GALLERY = path.join(ROOT, 'assets', 'gallery');

async function buildImages() {
  if (!fs.existsSync(ASSETS_SRC)) {
    console.log('No assets-src directory found, skipping image build');
    return;
  }

  fs.rmSync(ASSETS_GALLERY, { recursive: true, force: true });
  fs.mkdirSync(ASSETS_GALLERY, { recursive: true });

  const files = fs.readdirSync(ASSETS_SRC).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  for (const file of files) {
    const basename = path.basename(file, path.extname(file));
    const srcPath = path.join(ASSETS_SRC, file);

    console.log(`Processing ${basename}...`);

    const image = sharp(srcPath);
    const metadata = await image.metadata();
    const width = metadata.width;

    const thumbHeight = Math.round(900 * metadata.height / metadata.width);
    await image
      .resize(900, thumbHeight, { withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(path.join(ASSETS_GALLERY, `${basename}-thumb.jpg`));

    const fullHeight = Math.round(2400 * metadata.height / metadata.width);
    await sharp(srcPath)
      .resize(2400, fullHeight, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(ASSETS_GALLERY, `${basename}-full.jpg`));
  }

  console.log(`Generated ${files.length * 2} image variants in assets/gallery/`);
}

buildImages().catch(err => {
  console.error('Image build failed:', err);
  process.exit(1);
});
