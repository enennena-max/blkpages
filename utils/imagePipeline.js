import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';

const ROOT = process.env.UPLOAD_ROOT || path.resolve('uploads/businesses');
const SIZES = { thumb: 200, small: 480, medium: 960, large: 1600 };
const FORMATS = ['webp', 'avif', 'jpg']; // jpg as fallback

export async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function filePaths(businessId, hash, variant = 'original', ext = 'jpg') {
  const base = path.join(ROOT, businessId, variant);
  const filename = `${hash}.${ext}`;
  const rel = `/uploads/businesses/${businessId}/${variant}/${filename}`;
  return {
    abs: path.join(base, filename),
    rel,
    base,
    filename
  };
}

export function detectExt(mimetype) {
  const ext = mime.extension(mimetype);
  return ext === 'jpeg' ? 'jpg' : ext;
}

export async function getOrCreateHash(buffer) {
  return await sha256(buffer);
}

export async function writeOriginal({ businessId, hash, buffer, ext }) {
  const { abs, base } = filePaths(businessId, hash, 'original', ext);
  await ensureDir(base);
  await fs.writeFile(abs, buffer);
  return { abs, rel: filePaths(businessId, hash, 'original', ext).rel };
}

export async function generateDerivatives({ businessId, hash, originalBuffer }) {
  const variants = {};
  const lqip = { dataUri: null };
  
  // Generate LQIP (Low Quality Image Placeholder)
  const lqipBuffer = await sharp(originalBuffer)
    .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 20 })
    .toBuffer();
  lqip.dataUri = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;
  
  // Generate variants for each size
  for (const [sizeName, width] of Object.entries(SIZES)) {
    variants[sizeName] = {};
    
    for (const format of FORMATS) {
      const { abs, rel, base } = filePaths(businessId, hash, sizeName, format);
      await ensureDir(base);
      
      let pipeline = sharp(originalBuffer)
        .resize(width, null, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .rotate() // Auto-rotate based on EXIF
        .strip(); // Remove EXIF data
      
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 85, effort: 6 });
      } else if (format === 'avif') {
        pipeline = pipeline.avif({ quality: 80, effort: 4 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
      }
      
      await pipeline.toFile(abs);
      variants[sizeName][format] = rel;
    }
  }
  
  return { variants, lqip };
}

export async function dimensions(buffer) {
  const metadata = await sharp(buffer).metadata();
  return { width: metadata.width, height: metadata.height };
}

export async function deleteImageFiles({ businessId, hash }) {
  const variants = ['original', 'thumb', 'small', 'medium', 'large'];
  const formats = ['jpg', 'webp', 'avif'];
  
  for (const variant of variants) {
    for (const format of formats) {
      try {
        const { abs } = filePaths(businessId, hash, variant, format);
        await fs.unlink(abs);
      } catch (err) {
        // File might not exist, ignore
      }
    }
  }
}
