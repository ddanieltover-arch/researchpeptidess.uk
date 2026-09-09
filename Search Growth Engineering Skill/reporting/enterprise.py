from __future__ import annotations

import html
import json
import re
import textwrap
from datetime import datetime, timezone
from typing import Any

from .model import canonical_report_model

REPORT_KINDS = (
    'executive',
    'technical',
    'content',
    'geo',
    'ai-visibility',
    'competitor',
    'growth',
)

FORMATS = ('json', 'markdown', 'html', 'pdf')


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _provenance_block(evidence: dict[str, Any]) -> str:
    meta = evidence.get('provenance') or {}
    if not meta:
        return 'Provenance was not attached to this payload.'
    return (
        f"- source: {meta.get('source')}\n"
        f"- collected_at: {meta.get('collected_at')}\n"
        f"- confidence: {meta.get('confidence')}\n"
        f"- evidence_type: {meta.get('evidence_type')}\n"
        'Observed, estimated, inferred and generated records are never mixed without this block.'
    )


def _section(title: str, body: str) -> str:
    return f'## {title}\n\n{body.strip()}\n'


def _md_item(item: Any) -> str:
    if not isinstance(item, dict):
        return f'- {item}'
    title = item.get('title') or item.get('message') or item.get('type') or 'item'
    extra = item.get('url') or item.get('connector') or ''
    score = item.get('priority_score')
    suffix = f' ({score})' if score is not None else ''
    where = f' — {extra}' if extra else ''
    return f'- {title}{where}{suffix}'


def _md_list(items: list[Any], empty: str = 'No observed items.') -> str:
    if not items:
        return empty
    return '\n'.join(_md_item(item) for item in items[:25])


def render_markdown(kind: str, evidence: dict[str, Any]) -> str:
    model = canonical_report_model(evidence)
    project = model.get('project') or {}
    title = {
        'executive': 'Executive Report',
        'technical': 'Technical Report',
        'content': 'Content Report',
        'geo': 'GEO Report',
        'ai-visibility': 'AI Visibility Report',
        'competitor': 'Competitor Report',
        'growth': 'Growth Report',
    }[kind]
    limitations = model.get('limitations') or {}
    parts = [
        f'# {title}',
        f"Generated: {model.get('generated_at') or _now()}",
        f"Workspace: {model.get('workspace') or 'n/a'}",
        f"Target: {model.get('target_url') or project.get('name') or 'n/a'}",
        '',
        _section('Summary', str(model.get('summary') or 'Evidence-backed summary only. Missing measurements were not estimated.')),
        _section('Evidence provenance', _provenance_block(evidence if evidence.get('provenance') else {**evidence, 'provenance': model.get('provenance')})),
        _section('Limitations', json.dumps(limitations, indent=2)[:3000] if limitations else 'None recorded.'),
    ]
    if kind == 'executive':
        parts.append(_section('Priorities', _md_list(model.get('priorities') or [])))
        parts.append(_section('Provisional strategy', str(model.get('provisional_strategy') or 'None.')))
        parts.append(_section('Unknown without more data', _md_list(model.get('unknown_opportunities') or [])))
        parts.append(_section('Required data', _md_list([{'title': name} for name in (model.get('required_data') or [])], empty='No additional connectors required.')))
        parts.append(_section('Risks', _md_list(evidence.get('risks') or [])))
    elif kind == 'technical':
        parts.append(_section('Audit findings', _md_list(model.get('findings') or [])))
        parts.append(_section('Crawl summary', json.dumps((evidence.get('audit') or {}).get('summary') or (evidence.get('evidence') or {}).get('audit', {}).get('summary') or {}, indent=2)))
    elif kind == 'content':
        content = (evidence.get('strategy') or {}).get('content_intelligence') or evidence.get('content_strategy') or {}
        parts.append(_section('Content strategy', json.dumps(content, indent=2)[:4000] if content else 'No content intelligence (often because keyword evidence was unavailable).'))
    elif kind == 'geo':
        entities = evidence.get('entity_platform') or evidence.get('entity_graph') or {}
        parts.append(_section('Entity platform', json.dumps(entities, indent=2)[:4000]))
        parts.append('No AI inclusion or citation is promised.\n')
    elif kind == 'ai-visibility':
        parts.append(_section('Observed engines', _md_list((evidence.get('ai_observations') or {}).get('observed_engines') if isinstance(evidence.get('ai_observations'), dict) else [])))
        parts.append(_section('Citation intelligence', json.dumps(evidence.get('citations') or {}, indent=2)[:4000]))
        parts.append('Visibility was not estimated. Only observed evidence is shown.\n')
    elif kind == 'competitor':
        market = evidence.get('market_map') or (evidence.get('strategy') or {}).get('market_map') or {}
        parts.append(_section('Market map', json.dumps(market, indent=2)[:4000] if market else 'No competitor evidence (SERP/GSC not connected).'))
    elif kind == 'growth':
        memory = evidence.get('growth_memory') or evidence.get('memory') or {}
        parts.append(_section('Growth memory', json.dumps(memory, indent=2)[:4000]))
        parts.append(_section('Monitoring', json.dumps(evidence.get('monitor') or {}, indent=2)[:4000]))
    return '\n'.join(parts).strip() + '\n'


def render_html(kind: str, evidence: dict[str, Any]) -> str:
    markdown = render_markdown(kind, evidence)
    escaped = html.escape(markdown)
    body = re.sub(r'^# (.+)$', r'<h1>\1</h1>', escaped, flags=re.M)
    body = re.sub(r'^## (.+)$', r'<h2>\1</h2>', body, flags=re.M)
    body = body.replace('\n', '<br>\n')
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{html.escape(kind)}</title></head><body>{body}</body></html>'


def render_pdf(kind: str, evidence: dict[str, Any]) -> bytes:
    text = render_markdown(kind, evidence)
    lines: list[str] = []
    for raw in text.splitlines():
        wrapped = textwrap.wrap(raw, 92) or ['']
        lines.extend(wrapped)
    lines = lines[:90]

    def escape(line: str) -> str:
        return line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    commands = ['BT', '/F1 10 Tf', '14 TL', '48 780 Td']
    for idx, line in enumerate(lines):
        op = f'({escape(line)}) Tj'
        commands.append(op if idx == 0 else f'T* {op}')
    commands.append('ET')
    stream = '\n'.join(commands).encode('latin-1', errors='replace')
    objects = [
        b'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
        b'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
        b'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
        b'4 0 obj << /Length ' + str(len(stream)).encode() + b' >> stream\n' + stream + b'\nendstream endobj\n',
        b'5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    ]
    header = b'%PDF-1.4\n'
    offsets = [0]
    body = bytearray(header)
    for obj in objects:
        offsets.append(len(body))
        body.extend(obj)
    xref_pos = len(body)
    xref = [f'xref\n0 {len(offsets)}\n', '0000000000 65535 f \n']
    for offset in offsets[1:]:
        xref.append(f'{offset:010d} 00000 n \n')
    trailer = f'trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n'
    body.extend(''.join(xref).encode('ascii'))
    body.extend(trailer.encode('ascii'))
    return bytes(body)


def generate_report(kind: str, evidence: dict[str, Any], *, formats: list[str] | None = None) -> dict[str, Any]:
    if kind not in REPORT_KINDS:
        raise ValueError(f'Unknown report kind: {kind}')
    selected = formats or ['json', 'markdown']
    artifacts: dict[str, Any] = {'kind': kind, 'generated_at': _now(), 'formats': {}}
    if 'json' in selected:
        artifacts['formats']['json'] = canonical_report_model(evidence)
    if 'markdown' in selected:
        artifacts['formats']['markdown'] = render_markdown(kind, evidence)
    if 'html' in selected:
        artifacts['formats']['html'] = render_html(kind, evidence)
    if 'pdf' in selected:
        artifacts['formats']['pdf_bytes'] = render_pdf(kind, evidence)
        artifacts['formats']['pdf'] = '<binary>'
    return artifacts


def write_reports(kind: str, evidence: dict[str, Any], dest, *, formats: list[str] | None = None) -> dict[str, str]:
    from pathlib import Path
    from intelligence.storage.json_store import write_json
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    payload = generate_report(kind, evidence, formats=formats or list(FORMATS))
    written = {}
    if 'json' in payload['formats']:
        path = dest / f'{kind}.json'
        write_json(path, {k: v for k, v in payload.items() if k != 'formats'} | {'body': payload['formats']['json']})
        written['json'] = str(path)
    if 'markdown' in payload['formats']:
        path = dest / f'{kind}.md'
        path.write_text(payload['formats']['markdown'], encoding='utf-8')
        written['markdown'] = str(path)
    if 'html' in payload['formats']:
        path = dest / f'{kind}.html'
        path.write_text(payload['formats']['html'], encoding='utf-8')
        written['html'] = str(path)
    if 'pdf_bytes' in payload['formats']:
        path = dest / f'{kind}.pdf'
        path.write_bytes(payload['formats']['pdf_bytes'])
        written['pdf'] = str(path)
    return written
