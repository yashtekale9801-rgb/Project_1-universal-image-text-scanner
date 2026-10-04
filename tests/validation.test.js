import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidImageFile, getUnsupportedFileMessage } from '../src/validation.js';

test('accepts supported image formats', () => {
  assert.equal(isValidImageFile({ type: 'image/png', name: 'scan.png' }), true);
  assert.equal(isValidImageFile({ type: 'image/jpeg', name: 'scan.jpg' }), true);
  assert.equal(isValidImageFile({ type: 'image/webp', name: 'scan.webp' }), true);
});

test('rejects unsupported image formats', () => {
  assert.equal(isValidImageFile({ type: 'text/plain', name: 'notes.txt' }), false);
  assert.equal(getUnsupportedFileMessage({ name: 'notes.txt' }), 'Unsupported file type. Please upload a JPG, JPEG, PNG, WEBP, BMP, or TIFF image.');
});
