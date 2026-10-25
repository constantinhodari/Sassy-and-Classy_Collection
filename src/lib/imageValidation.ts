/**
 * Server-side image validation.
 *
 * We never trust the filename or the browser-supplied MIME type: the decoded
 * bytes are sniffed against known image signatures and the format is derived
 * from the content itself.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** File extension used when storing the file in GridFS. */
export const MIME_EXTENSION: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/** Maximum upload size in bytes, from MAX_IMAGE_UPLOAD_MB (default 5 MB). */
export function maxImageBytes(): number {
  const mb = Number(process.env.MAX_IMAGE_UPLOAD_MB);
  const safe = Number.isFinite(mb) && mb > 0 ? mb : 5;
  return Math.round(safe * 1024 * 1024);
}

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Inspect the leading bytes and return the real image MIME type,
 * or `null` when the content is not a supported image.
 */
export function detectImageMime(buffer: Buffer): AllowedImageMime | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  // WebP: "RIFF" .... "WEBP"
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }
  // AVIF: ISO-BMFF box "ftyp" followed by an avif brand.
  if (startsWith(buffer, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buffer.subarray(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

/**
 * Validate an uploaded buffer. Returns the detected MIME type or throws a
 * human-readable `ImageValidationError`.
 */
export function assertValidImage(buffer: Buffer): AllowedImageMime {
  if (!buffer || buffer.length === 0) {
    throw new ImageValidationError('The uploaded file is empty.');
  }
  const limit = maxImageBytes();
  if (buffer.length > limit) {
    throw new ImageValidationError(
      `Image is too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB). The limit is ${(
        limit / 1024 / 1024
      ).toFixed(1)} MB per image.`
    );
  }
  const mime = detectImageMime(buffer);
  if (!mime) {
    throw new ImageValidationError(
      'That file is not a valid image. Please upload a JPEG, PNG, WebP, GIF or AVIF image.'
    );
  }
  return mime;
}
