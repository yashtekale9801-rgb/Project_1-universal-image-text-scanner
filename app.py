import json
import os
import re
from urllib import request as urllib_request
from urllib import error as urllib_error

from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

DEFAULT_FRONTEND_ORIGINS = (
    'http://localhost:4173,http://localhost:4174,'
    'https://project1-universal-image-text-scann.vercel.app'
)
FRONTEND_ORIGINS = {
    origin.strip().rstrip('/')
    for origin in os.getenv('FRONTEND_ORIGINS', DEFAULT_FRONTEND_ORIGINS).split(',')
    if origin.strip()
}

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MAX_SUMMARY_INPUT_CHARS = int(os.getenv('MAX_SUMMARY_INPUT_CHARS', '3500'))
AI_SUMMARY_MAX_WORDS = int(os.getenv('AI_SUMMARY_MAX_WORDS', '80'))

try:
    import easyocr

    reader = easyocr.Reader(['en', 'hi'], gpu=False)
except Exception:
    reader = None


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '').rstrip('/')
    if origin in FRONTEND_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Vary'] = 'Origin'
    return response


def normalize_text_for_summary(raw_text):
    text = re.sub(r'\s+', ' ', raw_text or '').strip()
    if not text:
        return ''
    return text[:MAX_SUMMARY_INPUT_CHARS]


def local_summary(text):
    words = text.split()
    if len(words) <= AI_SUMMARY_MAX_WORDS:
        return text

    compact_summary = ' '.join(words[:AI_SUMMARY_MAX_WORDS]).rstrip('.')
    return f'{compact_summary}...'


def summarize_with_openai(text):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None

    endpoint = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1').rstrip('/')
    prompt = (
        'Summarize the text in 2 to 3 concise sentences or 3 short bullet points. Keep the main facts, '
        'numbers, dates, names, money values, and status. Keep the answer under 80 words and do not invent details.\n\n'
        f'Text:\n{text}'
    )

    payload = {
        'model': os.getenv('AI_MODEL_NAME', 'gpt-4o-mini'),
        'messages': [
            {
                'role': 'system',
                'content': 'You are a helpful document summarizer. Return only the summary text.',
            },
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.2,
        'max_tokens': 120,
    }

    req = urllib_request.Request(
        f'{endpoint}/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urllib_request.urlopen(req, timeout=25) as response:
            content = response.read().decode('utf-8')
        data = json.loads(content)
        return data['choices'][0]['message']['content'].strip()
    except (urllib_error.URLError, ValueError, KeyError, TypeError):
        return None


def summarize_text(text):
    normalized = normalize_text_for_summary(text)
    if not normalized:
        return '', 'empty'

    ai_summary = summarize_with_openai(normalized)
    if ai_summary:
        return ai_summary, 'ai'

    return local_summary(normalized), 'local'


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


@app.post('/api/ocr')
def ocr():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    uploaded_file = request.files['image']
    if uploaded_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if reader is None:
        return jsonify({'error': 'EasyOCR is not available. Please install dependencies.'}), 500

    file_path = os.path.join(UPLOAD_FOLDER, uploaded_file.filename)
    uploaded_file.save(file_path)

    try:
        results = reader.readtext(file_path, detail=0)
        text = '\n'.join(results).strip()
        return jsonify({'text': text})
    except Exception as exc:
        return jsonify({'error': f'OCR failed: {str(exc)}'}), 500


@app.post('/api/summarize')
def summarize_route():
    payload = request.get_json(silent=True) or {}
    text = (payload.get('text') or request.form.get('text') or '').strip()

    if not text:
        return jsonify({'error': 'No text provided for summary.'}), 400

    summary, source = summarize_text(text)
    if not summary:
        return jsonify({'error': 'Unable to summarize the provided text.'}), 400

    return jsonify({'summary': summary, 'source': source})


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_file(path):
    safe_path = path if path else 'index.html'

    if safe_path.startswith('src/') or safe_path in {'index.html', 'styles.css'}:
        return send_from_directory(os.getcwd(), safe_path)

    if safe_path.endswith('.js') or safe_path.endswith('.css') or safe_path.endswith('.png') or safe_path.endswith('.jpg') or safe_path.endswith('.jpeg') or safe_path.endswith('.webp') or safe_path.endswith('.bmp') or safe_path.endswith('.tif') or safe_path.endswith('.tiff'):
        return send_from_directory(os.getcwd(), safe_path)

    return send_from_directory(os.getcwd(), 'index.html')


if __name__ == '__main__':
    port = int(os.getenv('PORT', '4173'))
    app.run(host='0.0.0.0', port=port, debug=True)
