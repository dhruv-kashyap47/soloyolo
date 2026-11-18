/**
 * Logo handling, entirely in the browser.
 *
 * A logo is the one image a document can carry, so it has to be small enough
 * to keep in local storage and safe enough to render. The file is never
 * uploaded: it is read with the File API, drawn onto a canvas, scaled down
 * and turned into a data URL that stays in this browser.
 */

export const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** The largest source file that is read at all. */
export const MAX_LOGO_SOURCE_BYTES = 5 * 1024 * 1024;

/** The widest the stored logo is drawn. Bigger images are scaled down. */
export const LOGO_MAX_WIDTH = 640;

/** The tallest the stored logo is drawn. */
export const LOGO_MAX_HEIGHT = 320;

/**
 * The longest data URL the profile will store.
 *
 * A saved profile is read back through `parseProfile`, which rejects a logo
 * longer than this. A stored logo that is bigger than the limit would be
 * dropped on the next visit, taking the rest of the profile with it, so the
 * encoder has to stay under the same ceiling.
 */
export const MAX_STORED_LOGO_CHARS = 256 * 1024 * 2;

export type LogoResult = { ok: true; dataUrl: string } | { ok: false; message: string };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded.'));
    image.src = source;
  });
}

/**
 * Reads a logo file and returns a data URL small enough to store.
 *
 * The image is scaled down when it is larger than the stored size, so a
 * visitor who picks a 4000 pixel wide logo still gets a document that fits in
 * local storage instead of a storage quota error. A very detailed image can
 * still exceed the stored budget after scaling, so the encoder falls back to
 * JPEG and then halves the image rather than handing back something the
 * profile will reject on the next visit.
 */
export async function readLogoFile(file: File): Promise<LogoResult> {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    return { ok: false, message: 'Use a PNG, JPEG or WebP image.' };
  }

  if (file.size > MAX_LOGO_SOURCE_BYTES) {
    return { ok: false, message: 'That image is larger than 5 MB. Pick a smaller file.' };
  }

  let source: string;
  try {
    source = await readAsDataUrl(file);
  } catch {
    return { ok: false, message: 'That file could not be read. Try another one.' };
  }

  let image: HTMLImageElement;
  try {
    image = await loadImage(source);
  } catch {
    return { ok: false, message: 'That image could not be opened. Try another one.' };
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    return { ok: false, message: 'That image has no size. Try another one.' };
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return { ok: false, message: 'This browser cannot resize images. Try another one.' };
  }

  let scale = Math.min(1, LOGO_MAX_WIDTH / width, LOGO_MAX_HEIGHT / height);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, targetWidth, targetHeight);
    // JPEG has no alpha: fill white first so a transparent logo does not get
    // a black box when the PNG is too heavy to keep.
    if (attempt > 0 || file.type === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, targetWidth, targetHeight);
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const mimeType = attempt === 0 && file.type !== 'image/jpeg' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, 0.92);

    if (!dataUrl.startsWith('data:image/')) {
      return { ok: false, message: 'That image could not be prepared. Try another one.' };
    }

    if (dataUrl.length <= MAX_STORED_LOGO_CHARS) {
      return { ok: true, dataUrl };
    }

    // Too heavy to keep: a JPEG, then a smaller one.
    scale *= 0.6;
  }

  return {
    ok: false,
    message: 'That image is too detailed to keep. Try a smaller or simpler logo.',
  };
}
