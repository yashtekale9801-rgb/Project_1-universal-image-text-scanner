import { isValidImageFile, getUnsupportedFileMessage } from './validation.js';

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const errorToast = document.getElementById('errorToast');
const uploadButton = document.getElementById('uploadButton');
const scanButton = document.getElementById('scanButton');
const autoEnhanceButton = document.getElementById('autoEnhanceButton');
const rotationSelect = document.getElementById('rotationSelect');
const contrastSlider = document.getElementById('contrastSlider');
const grayscaleToggle = document.getElementById('grayscaleToggle');
const maxDimension = document.getElementById('maxDimension');
const maxDimensionValue = document.getElementById('maxDimensionValue');
const contrastValue = document.getElementById('contrastValue');
const ocrStatus = document.getElementById('ocrStatus');
const processedCanvas = document.getElementById('processedCanvas');
const resultText = document.getElementById('resultText');
const copyButton = document.getElementById('copyButton');
const selectAllButton = document.getElementById('selectAllButton');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const summaryButton = document.getElementById('summaryButton');
const summaryOutput = document.getElementById('summaryOutput');

const state = {
  activePreviewUrl: '',
  currentImage: null,
  textHistory: [],
  historyIndex: -1,
};

let ocrLoaderPromise = null;

function showError(message) {
  errorToast.textContent = message;
  errorToast.classList.add('visible');
  window.clearTimeout(showError.timeoutId);
  showError.timeoutId = window.setTimeout(() => {
    errorToast.classList.remove('visible');
  }, 3500);
}

function setStatus(message, tone = 'idle') {
  ocrStatus.textContent = message;
  ocrStatus.dataset.tone = tone;
}

function updateSliderLabels() {
  maxDimensionValue.textContent = `${maxDimension.value}px`;
  contrastValue.textContent = `${Number(contrastSlider.value).toFixed(2)}x`;
}

function pushHistory(value) {
  const lastItem = state.textHistory[state.historyIndex];
  if (lastItem === value) {
    return;
  }

  state.textHistory = state.textHistory.slice(0, state.historyIndex + 1);
  state.textHistory.push(value);
  state.historyIndex = state.textHistory.length - 1;
  undoButton.disabled = state.historyIndex <= 0;
  redoButton.disabled = state.historyIndex >= state.textHistory.length - 1;
}

function updateTextHistoryFromEditor() {
  pushHistory(resultText.value);
}

function applyHistory(delta) {
  const nextIndex = state.historyIndex + delta;
  if (nextIndex < 0 || nextIndex >= state.textHistory.length) {
    return;
  }

  state.historyIndex = nextIndex;
  resultText.value = state.textHistory[nextIndex];
  undoButton.disabled = state.historyIndex <= 0;
  redoButton.disabled = state.historyIndex >= state.textHistory.length - 1;
}

function clearPreview() {
  if (state.activePreviewUrl) {
    URL.revokeObjectURL(state.activePreviewUrl);
    state.activePreviewUrl = '';
  }

  state.currentImage = null;
  previewImage.src = '';
  fileName.textContent = 'No image selected';
  preview.classList.remove('visible');
  processedCanvas.width = 0;
  processedCanvas.height = 0;
  resultText.value = '';
  summaryOutput.value = '';
  state.textHistory = [];
  state.historyIndex = -1;
  undoButton.disabled = true;
  redoButton.disabled = true;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read image file.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

function buildProcessedCanvas(image) {
  const maxAllowed = Number(maxDimension.value) || 1800;
  const contrast = Number(contrastSlider.value) || 1;
  const rotation = Number(rotationSelect.value) || 0;
  const grayscale = grayscaleToggle.checked;

  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  const scale = Math.min(1, maxAllowed / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  let baseWidth = width;
  let baseHeight = height;

  if (rotation === 90 || rotation === 270) {
    [baseWidth, baseHeight] = [height, width];
  }

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = baseHeight;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -width / 2, -height / 2, width, height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];

    let adjustedR = (red - 128) * contrast + 128;
    let adjustedG = (green - 128) * contrast + 128;
    let adjustedB = (blue - 128) * contrast + 128;

    if (grayscale) {
      const gray = (adjustedR + adjustedG + adjustedB) / 3;
      adjustedR = gray;
      adjustedG = gray;
      adjustedB = gray;
    }

    pixels[i] = Math.max(0, Math.min(255, adjustedR));
    pixels[i + 1] = Math.max(0, Math.min(255, adjustedG));
    pixels[i + 2] = Math.max(0, Math.min(255, adjustedB));
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function renderProcessedCanvas(canvas) {
  processedCanvas.width = canvas.width;
  processedCanvas.height = canvas.height;
  const context = processedCanvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(canvas, 0, 0);
}

async function ensureOcrIsReady() {
  if (!window.Tesseract) {
    if (!ocrLoaderPromise) {
      ocrLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => resolve(window.Tesseract);
        script.onerror = () => reject(new Error('OCR library failed to load.'));
        document.head.appendChild(script);
      });
    }

    try {
      await ocrLoaderPromise;
    } catch (error) {
      throw error;
    }
  }
}

async function handleFileSelection(file) {
  if (!file) {
    return;
  }

  if (!isValidImageFile(file)) {
    clearPreview();
    showError(getUnsupportedFileMessage(file));
    fileInput.value = '';
    return;
  }

  try {
    const image = await loadImageFromFile(file);

    if (state.activePreviewUrl) {
      URL.revokeObjectURL(state.activePreviewUrl);
    }

    state.currentImage = image;
    state.activePreviewUrl = URL.createObjectURL(file);
    previewImage.src = state.activePreviewUrl;
    fileName.textContent = file.name;
    preview.classList.add('visible');
    setStatus('Image loaded. You can adjust preprocessing and scan.', 'idle');
    renderProcessedCanvas(buildProcessedCanvas(image));
    errorToast.classList.remove('visible');
  } catch (error) {
    showError('Unable to load this image. Please try another file.');
    setStatus('Image load failed.', 'error');
  }
}

function openFilePicker() {
  fileInput.click();
}

function applyAutoEnhance() {
  if (!state.currentImage) {
    showError('Please choose an image first.');
    return;
  }

  rotationSelect.value = '0';
  contrastSlider.value = '1.75';
  grayscaleToggle.checked = true;
  maxDimension.value = '1800';
  updateSliderLabels();
  renderProcessedCanvas(buildProcessedCanvas(state.currentImage));
  setStatus('Auto enhancement applied to the image.', 'success');
}

async function performScan() {
  if (!state.currentImage) {
    showError('Please add an image before scanning.');
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    showError('Please choose an image file first.');
    return;
  }

  setStatus('OCR in progress...', 'processing');

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OCR failed.');
    }

    const cleanedText = (data.text || '').trim();
    if (!cleanedText) {
      resultText.value = 'No text detected. Please try a clearer image or adjust the preprocessing settings.';
      pushHistory(resultText.value);
      setStatus('No text detected.', 'error');
      return;
    }

    resultText.value = cleanedText;
    pushHistory(cleanedText);
    setStatus('OCR completed successfully.', 'success');
    return;
  } catch (backendError) {
    try {
      await ensureOcrIsReady();
      const processed = buildProcessedCanvas(state.currentImage);
      renderProcessedCanvas(processed);

      const result = await window.Tesseract.recognize(processed, 'eng+hin', {
        logger: (message) => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            const percentage = Math.round(message.progress * 100);
            setStatus(`OCR in progress: ${percentage}%`, 'processing');
          }
        },
      });

      const cleanedText = (result.data.text || '').trim();
      if (!cleanedText) {
        resultText.value = 'No text detected. Please try a clearer image or adjust the preprocessing settings.';
        pushHistory(resultText.value);
        setStatus('No text detected.', 'error');
        return;
      }

      resultText.value = cleanedText;
      pushHistory(cleanedText);
      setStatus('OCR completed successfully.', 'success');
    } catch (fallbackError) {
      setStatus('OCR failed. Please try again.', 'error');
      showError(fallbackError?.message || 'OCR could not run for this image. Please try a different image or processor settings.');
    }
  }
}

function copyText() {
  const text = resultText.value;
  if (!text.trim()) {
    showError('There is no text to copy yet.');
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => setStatus('Text copied to clipboard.', 'success'))
    .catch(() => showError('Unable to copy text. Please copy manually.'));
}

function selectAllText() {
  resultText.focus();
  resultText.select();
}

function searchText() {
  const query = searchInput.value.trim();
  const wholeText = resultText.value;

  if (!query) {
    showError('Enter a search term to find text.');
    return;
  }

  const index = wholeText.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    showError('The search term was not found in the extracted text.');
    return;
  }

  resultText.focus();
  resultText.setSelectionRange(index, index + query.length);
  resultText.scrollTop = 0;
  setStatus(`Found match for: ${query}`, 'success');
}

async function generateSummary() {
  const text = resultText.value.trim();

  if (!text) {
    showError('Please scan an image first to generate a summary.');
    return;
  }

  summaryButton.disabled = true;
  setStatus('Generating summary...', 'processing');

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const message = response.status === 404
        ? 'The summary API was not found on this site. Deploy the Flask backend and connect the frontend to it.'
        : `The summary API returned an invalid response (HTTP ${response.status}). Check that the Flask backend is running and reachable.`;
      throw new Error(message);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Summary generation failed.');
    }

    summaryOutput.value = data.summary || 'Summary unavailable.';
    setStatus(data.source === 'ai' ? 'AI summary generated.' : 'Summary generated.', 'success');
  } catch (error) {
    summaryOutput.value = '';
    setStatus('Summary failed.', 'error');
    showError(error?.message || 'Unable to generate a summary right now.');
  } finally {
    summaryButton.disabled = false;
  }
}

uploadButton.addEventListener('click', openFilePicker);
fileInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  handleFileSelection(file);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  const [file] = event.dataTransfer.files;
  handleFileSelection(file);
});

dropZone.addEventListener('click', openFilePicker);

rotationSelect.addEventListener('change', () => {
  if (!state.currentImage) {
    return;
  }
  renderProcessedCanvas(buildProcessedCanvas(state.currentImage));
});

contrastSlider.addEventListener('input', () => {
  updateSliderLabels();
  if (state.currentImage) {
    renderProcessedCanvas(buildProcessedCanvas(state.currentImage));
  }
});

grayscaleToggle.addEventListener('change', () => {
  if (state.currentImage) {
    renderProcessedCanvas(buildProcessedCanvas(state.currentImage));
  }
});

maxDimension.addEventListener('input', () => {
  updateSliderLabels();
  if (state.currentImage) {
    renderProcessedCanvas(buildProcessedCanvas(state.currentImage));
  }
});

updateSliderLabels();
scanButton.addEventListener('click', performScan);
autoEnhanceButton.addEventListener('click', applyAutoEnhance);
copyButton.addEventListener('click', copyText);
selectAllButton.addEventListener('click', selectAllText);
searchButton.addEventListener('click', searchText);
summaryButton.addEventListener('click', generateSummary);
resultText.addEventListener('input', updateTextHistoryFromEditor);
undoButton.addEventListener('click', () => applyHistory(-1));
redoButton.addEventListener('click', () => applyHistory(1));

undoButton.disabled = true;
redoButton.disabled = true;
clearPreview();
