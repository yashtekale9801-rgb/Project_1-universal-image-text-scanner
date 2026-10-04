# Universal Image Text Scanner

This project is a browser-based image-to-text OCR application. It currently implements the product roadmap through Phase 4 using a frontend-first stack and is designed to be extended for later phases such as multi-language OCR, export, and advanced image processing.

## Technology Stack

### Current implementation stack
- HTML
- CSS
- JavaScript
- Tesseract.js for OCR
- Canvas API for image preview and preprocessing
- Browser-based file validation

### Planned future stack (for more advanced/production features)
- Python
- Flask (backend API layer)
- OpenCV and Pillow for image enhancement
- Tesseract OCR or EasyOCR for backend OCR processing
- Optional database/storage for saved results, history, or exports

## Included functionality

### Phase 1: Project setup and basic UI
- Web app shell for the scanner
- Image upload button
- Drag-and-drop upload area
- Image preview panel
- Supported image validation
- Friendly error messages
- Responsive layout

### Phase 2: Image processing
- Rotation controls
- Contrast tuning
- Grayscale conversion
- Resize limit handling
- Auto-enhance preset
- Processed image preview

### Phase 3: Core OCR engine
- OCR through Tesseract.js
- Progress status indicator
- Automated recognition on the prepared image
- Result extraction from image text

### Phase 4: Results and text editor
- Readable extracted text panel
- Copy text action
- Select all support
- Undo/redo editing history
- Search within extracted text

## Run locally

From this project folder:

```bash
python -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Supported formats

- JPG
- JPEG
- PNG
- WEBP
- BMP
- TIFF

## Current status

Users can now:
- select or drag in an image
- preview the uploaded image
- process it with rotation, contrast, grayscale, and size adjustments
- run OCR extraction
- copy, search, and edit the output text

## Architecture note

This project is currently a frontend-first OCR app, not a Flask-based Python app. The Python + Flask + OpenCV + OCR stack is a future enhancement path for production-grade features, while the current implementation is simpler and faster to run in the browser.
