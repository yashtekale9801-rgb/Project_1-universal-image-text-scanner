SUPPORTED_IMAGE_TYPES = {
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/x-tiff',
}

SUPPORTED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'}


def is_valid_image_file(file):
    if not file or not isinstance(file, dict):
        return False

    file_type = (file.get('type') or '').lower()
    file_name = (file.get('name') or '').lower()
    extension = file_name.rsplit('.', 1)[-1] if '.' in file_name else ''

    mime_valid = file_type.startswith('image/') and file_type in SUPPORTED_IMAGE_TYPES
    extension_valid = extension in SUPPORTED_EXTENSIONS

    return mime_valid or extension_valid


def get_unsupported_file_message(file=None):
    return 'Unsupported file type. Please upload a JPG, JPEG, PNG, WEBP, BMP, or TIFF image.'
