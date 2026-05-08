import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import minioClient, { getFileUrl } from '../config/minio';
import { config } from '../config';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    fieldSize: 2 * 1024 * 1024, // 2MB for non-file fields (JSON strings, etc)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Hanya file gambar yang diizinkan', 422) as any);
    }
  },
});

/**
 * Process uploaded image: resize, compress, upload to MinIO.
 * Returns the public URL.
 */
export async function processAndUploadImage(
  file: Express.Multer.File,
  folder: string = 'uploads',
  maxWidth: number = 800,
  quality: number = 85,
): Promise<string> {
  const buffer = await sharp(file.buffer)
    .resize(maxWidth, undefined, { withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const objectName = `${folder}/${uuid()}.webp`;

  await minioClient.putObject(config.minio.bucket, objectName, buffer, buffer.length, {
    'Content-Type': 'image/webp',
  });

  return getFileUrl(objectName);
}

/**
 * Upload multiple images.
 */
export async function processAndUploadImages(
  files: Express.Multer.File[],
  folder: string = 'uploads',
): Promise<string[]> {
  return Promise.all(files.map((f) => processAndUploadImage(f, folder)));
}
