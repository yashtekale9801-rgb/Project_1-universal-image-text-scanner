export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/x-tiff',
]);

export const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff']);

export function isValidImageFile(file) {
  if (!file || typeof file !== 'object') {
    return false;
  }

  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';

  const mimeValid = fileType.startsWith('image/') && SUPPORTED_IMAGE_TYPES.has(fileType);
  const extensionValid = SUPPORTED_EXTENSIONS.has(extension);

  return mimeValid || extensionValid;
}

export function getUnsupportedFileMessage() {
  return 'Unsupported file type. Please upload a JPG, JPEG, PNG, WEBP, BMP, or TIFF image.';
}
