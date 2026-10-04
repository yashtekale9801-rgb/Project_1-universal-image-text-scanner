# Universal Image Text Scanner

This app reads text from an image and puts the result in an editor. A user can upload an image, improve it for reading, edit or copy the recognized text, and request a short summary.

## How to explain the app

The **frontend** is the part in the browser. HTML builds the page, CSS styles it, and JavaScript handles image selection, preview, image adjustments, and the text editor. The frontend sends the image to the **backend**. The backend is a Python Flask server; EasyOCR reads the image and sends the text back. If the backend OCR is unavailable, the browser can use Tesseract.js as a fallback.

The summary is optional. If an OpenAI-compatible API key is configured, the backend asks that model for a summary. Without a key, it uses a simple local fallback. That fallback is not AI.

## Technology Stack

- **Python:** Backend programming language. See [app.py](app.py).
- **Flask (backend):** Serves the app and handles its OCR and summary requests. See [app.py](app.py).
- **HTML, CSS, JavaScript (frontend):** Build the page and its browser behavior. See [index.html](index.html), [styles.css](styles.css), and [src/app.js](src/app.js).
- **EasyOCR and Tesseract.js (text extraction):** EasyOCR is the main backend OCR engine; Tesseract.js is the browser fallback. See [app.py](app.py), [src/app.js](src/app.js), and [index.html](index.html).
- **Pillow, NumPy, and OpenCV (image-processing dependencies):** Installed for the backend OCR stack from [requirements.txt](requirements.txt). Browser image adjustments use the Canvas API in [src/app.js](src/app.js).
- **Optional AI summary:** The backend API call is in [app.py](app.py); its button and browser request are in [index.html](index.html) and [src/app.js](src/app.js).

## Project structure

```text
Project1_Scan_Image/
|-- app.py                  Flask server and API routes
|-- index.html              Page structure
|-- styles.css              Page appearance and responsive layout
|-- package.json            JavaScript test/start commands
|-- requirements.txt        Python packages for the backend
|-- src/
|   |-- app.js              Browser behavior and API calls
|   `-- validation.js       Supported image file checks
|-- tests/
|   |-- test_summary.py     Summary API tests
|   `-- validation.test.js  JavaScript file-validation tests
|-- README.md               This guide
|-- universal_image_text_scanner_prd.md
`-- universal_image_text_scanner_implementation_plan.md
```

The two long Markdown files are planning documents. They are not needed to run the app.

## What happens when someone scans

1. The browser checks the selected file and shows a preview.
2. JavaScript uses the Canvas API to prepare the image.
3. The browser sends the prepared image to Flask at `/api/ocr`.
4. EasyOCR returns the recognized text. Tesseract.js is the browser fallback.
5. The user can edit, search, copy, undo, or redo the result.
6. The summary button sends the text to `/api/summarize`.

## Run on Windows

Open PowerShell in this project folder. Create the Python 3.12 environment and install the packages:

```powershell
py -3.12 -m venv .venv312
.\.venv312\Scripts\python.exe -m pip install -r requirements.txt
```

Start the app:

```powershell
.\.venv312\Scripts\python.exe app.py
```

Open `http://localhost:4173`. If that port is already in use, start it on another port:

```powershell
$env:PORT = "4174"
.\.venv312\Scripts\python.exe app.py
```

EasyOCR downloads its language models the first time it starts, so its first launch may take longer.

## Optional AI summary

Set an API key in PowerShell before starting the app:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
.\.venv312\Scripts\python.exe app.py
```

The key stays on the backend and should never be added to browser JavaScript or committed to Git. Without the key, the app returns a short local fallback summary.

## Supported image formats

JPG, JPEG, PNG, WEBP, BMP, and TIFF.

## Tests

Install Node.js to run the JavaScript validation tests with `npm test`. The Python summary tests use `pytest`.
