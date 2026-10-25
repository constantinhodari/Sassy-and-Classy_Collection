import { ObjectId, type GridFSFile } from 'mongodb';
import { COLLECTIONS, getDb, getImageBucket } from '@/lib/mongodb';
import {
  assertValidImage,
  MIME_EXTENSION,
  type AllowedImageMime,
} from '@/lib/imageValidation';

/**
 * GridFS product-image storage.
 *
 * Only the file id, filename, MIME type, size and timestamp are kept as
 * metadata; the image bytes themselves live in the GridFS bucket
 * (`productImages` by default). Nothing is ever stored inside the product
 * document as base64.
 */

export interface StoredImage {
  fileId: string;
  url: string;
  filename: string;
  contentType: AllowedImageMime;
  size: number;
  uploadedAt: string;
}

export function isValidFileId(id: unknown): boolean {
  return typeof id === 'string' && ObjectId.isValid(id) && id.length === 24;
}

/** Public endpoint used to render a stored image. */
export function imageEndpoint(fileId: string): string {
  return `/api/images/${fileId}`;
}

function cleanFilename(name: string, mime: AllowedImageMime): string {
  const base = String(name || 'product-image')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'product-image'}.${MIME_EXTENSION[mime]}`;
}

/**
 * Validate the bytes, then store them in GridFS.
 * Throws `ImageValidationError` when the file is not an acceptable image.
 */
export async function saveProductImage(
  buffer: Buffer,
  options: { filename?: string; alt?: string } = {}
): Promise<StoredImage> {
  const contentType = assertValidImage(buffer);
  const filename = cleanFilename(options.filename || 'product-image', contentType);
  const bucket = await getImageBucket();

  const fileId = await new Promise<ObjectId>((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, {
      metadata: {
        contentType,
        alt: String(options.alt || ''),
        source: 'admin-upload',
      },
    });
    upload.on('error', reject);
    upload.on('finish', () => resolve(upload.id as ObjectId));
    upload.end(buffer);
  });

  return {
    fileId: fileId.toHexString(),
    url: imageEndpoint(fileId.toHexString()),
    filename,
    contentType,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
}

export async function getImageFile(fileId: string): Promise<GridFSFile | null> {
  if (!isValidFileId(fileId)) return null;
  const bucket = await getImageBucket();
  const file = await bucket.find({ _id: new ObjectId(fileId) }).limit(1).next();
  return file ?? null;
}

/** Download stream for a stored image, or `null` when it does not exist. */
export async function openImageStream(fileId: string) {
  if (!isValidFileId(fileId)) return null;
  const file = await getImageFile(fileId);
  if (!file) return null;
  const bucket = await getImageBucket();
  return { file, stream: bucket.openDownloadStream(new ObjectId(fileId)) };
}

/** The image MIME type recorded at upload time (stored in GridFS metadata). */
export function storedContentType(file: GridFSFile): string {
  const meta = (file.metadata ?? {}) as { contentType?: unknown };
  return typeof meta.contentType === 'string' ? meta.contentType : '';
}

/** Delete a stored image file unconditionally. */
export async function deleteImageFile(fileId: string): Promise<boolean> {
  if (!isValidFileId(fileId)) return false;
  const bucket = await getImageBucket();
  try {
    await bucket.delete(new ObjectId(fileId));
    return true;
  } catch {
    return false;
  }
}

/** How many product records still reference this GridFS file. */
export async function countImageReferences(fileId: string): Promise<number> {
  if (!isValidFileId(fileId)) return 0;
  const db = await getDb();
  return db
    .collection(COLLECTIONS.products)
    .countDocuments({ 'images.fileId': fileId }, { limit: 100 });
}

/**
 * Delete an uploaded image only when no product references it any more.
 * Returns `true` when the file was deleted.
 */
export async function deleteImageIfUnreferenced(fileId: string): Promise<boolean> {
  const references = await countImageReferences(fileId);
  if (references > 0) return false;
  return deleteImageFile(fileId);
}
