import unittest

from src.validation import is_valid_image_file, get_unsupported_file_message


class ValidationTests(unittest.TestCase):
    def test_accepts_supported_image_formats(self):
        self.assertTrue(is_valid_image_file({'type': 'image/png', 'name': 'scan.png'}))
        self.assertTrue(is_valid_image_file({'type': 'image/jpeg', 'name': 'scan.jpg'}))
        self.assertTrue(is_valid_image_file({'type': 'image/webp', 'name': 'scan.webp'}))

    def test_rejects_unsupported_image_formats(self):
        self.assertFalse(is_valid_image_file({'type': 'text/plain', 'name': 'notes.txt'}))
        self.assertEqual(
            get_unsupported_file_message({'name': 'notes.txt'}),
            'Unsupported file type. Please upload a JPG, JPEG, PNG, WEBP, BMP, or TIFF image.'
        )


if __name__ == '__main__':
    unittest.main()
