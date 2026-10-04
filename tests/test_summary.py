import pytest

from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_summarize_text_returns_summary(client):
    payload = {
        'text': (
            'The invoice shows a total amount of $245.60. It was issued on 12 March 2024 and '
            'covers product delivery for three items: a laptop, a monitor, and a keyboard. '
            'The payment was made via bank transfer and the order is marked as completed.'
        )
    }

    response = client.post('/api/summarize', json=payload)

    assert response.status_code == 200
    data = response.get_json()
    assert 'summary' in data
    assert len(data['summary']) > 0


def test_summarize_text_requires_text(client):
    response = client.post('/api/summarize', json={})

    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_api_allows_configured_vercel_origin(client):
    response = client.options(
        '/api/summarize',
        headers={
            'Origin': 'https://project1-universal-image-text-scann.vercel.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        },
    )

    assert response.status_code == 200
    assert response.headers['Access-Control-Allow-Origin'] == 'https://project1-universal-image-text-scann.vercel.app'
    assert 'POST' in response.headers['Access-Control-Allow-Methods']


def test_api_does_not_allow_unconfigured_origin(client):
    response = client.options(
        '/api/summarize',
        headers={
            'Origin': 'https://untrusted.example',
            'Access-Control-Request-Method': 'POST',
        },
    )

    assert 'Access-Control-Allow-Origin' not in response.headers
