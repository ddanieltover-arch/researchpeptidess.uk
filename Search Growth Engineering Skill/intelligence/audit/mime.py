from __future__ import annotations

from urllib.parse import urlparse


HTML_TYPES = {'text/html', 'application/xhtml+xml'}
PDF_TYPES = {'application/pdf'}
XML_TYPES = {'application/xml', 'text/xml', 'application/rss+xml', 'application/atom+xml'}
JSON_TYPES = {'application/json', 'application/ld+json'}


def classify_document(content_type: str | None, url: str = '', data: bytes | None = None) -> str:
    """Return a document class for audit branching. Not a new engine."""
    ct = (content_type or '').split(';')[0].strip().lower()
    path = urlparse(url or '').path.lower()
    blob = (data or b'').lstrip()[:64].lower()
    if ct in PDF_TYPES or path.endswith('.pdf'):
        return 'pdf'
    if ct.startswith('image/') or path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif')):
        return 'image'
    if ct in JSON_TYPES or path.endswith('.json'):
        return 'json'
    if path.endswith('robots.txt'):
        return 'text'
    if ct in XML_TYPES or path.endswith('.xml'):
        return 'xml'
    if ct.startswith('text/css') or path.endswith('.css'):
        return 'css'
    if 'javascript' in ct or path.endswith('.js'):
        return 'js'
    if ct in HTML_TYPES or path.endswith(('.html', '.htm')):
        return 'html'
    if blob.startswith(b'<!doctype') or blob.startswith(b'<html') or blob.startswith(b'<?xml'):
        return 'html' if b'<html' in blob or b'<!doctype' in blob else 'xml'
    if ct.startswith('text/'):
        return 'text'
    return 'other'


def is_html(document_class: str) -> bool:
    return document_class == 'html'
