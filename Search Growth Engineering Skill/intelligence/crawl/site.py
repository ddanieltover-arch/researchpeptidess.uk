from __future__ import annotations

import collections
import json
import re
import time
from dataclasses import asdict, dataclass, field
from html.parser import HTMLParser
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from intelligence.audit.mime import classify_document

UA = "SearchGrowthEngineBot/1.1 (+evidence-first SEO audit)"
SKIP_TAGS = {"script", "style", "nav", "header", "footer", "noscript", "template"}
CHROME_TAGS = {"nav", "header", "footer"}


@dataclass
class PageEvidence:
    url: str
    status: int
    content_type: str
    title: str | None
    meta_description: str | None
    canonical: str | None
    robots_meta: str | None
    h1_count: int
    word_count: int
    internal_links: list[str]
    external_links: list[str]
    images_missing_alt: int
    images_total: int
    structured_data_types: list[str]
    lang: str | None
    bytes: int
    response_ms: int
    error: str | None = None
    requested_url: str | None = None
    final_url: str | None = None
    redirect_chain: list[dict[str, Any]] = field(default_factory=list)
    document_class: str = "html"
    jsonld: list[Any] = field(default_factory=list)
    body_word_count: int = 0
    chrome_word_count: int = 0
    identity_url: str | None = None


class RecordingRedirectHandler(HTTPRedirectHandler):
    def __init__(self) -> None:
        super().__init__()
        self.chain: list[dict[str, Any]] = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        location = headers.get("Location") or newurl
        self.chain.append({"status": int(code), "location": str(location)})
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Parser(HTMLParser):
    def __init__(self, base: str):
        super().__init__()
        self.base = base
        self.title = None
        self._in_title = False
        self.title_bits: list[str] = []
        self.meta: dict[str, str] = {}
        self.canonical = None
        self.robots = None
        self.h1 = 0
        self.words: list[str] = []
        self.body_words: list[str] = []
        self.chrome_words: list[str] = []
        self.links: list[str] = []
        self.external: list[str] = []
        self.img_total = 0
        self.img_missing_alt = 0
        self.schema: list[str] = []
        self.jsonld: list[Any] = []
        self.lang = None
        self._script_jsonld = False
        self._script_bits: list[str] = []
        self._skip_depth = 0
        self._chrome_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        tag = tag.lower()
        if tag == "html":
            self.lang = a.get("lang")
        if tag in SKIP_TAGS:
            self._skip_depth += 1
        if tag in CHROME_TAGS:
            self._chrome_depth += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key.lower()] = a.get("content")
        if tag == "link" and (a.get("rel") or "").lower() == "canonical":
            self.canonical = a.get("href")
        if tag == "link" and (a.get("rel") or "").lower() == "alternate" and a.get("hreflang"):
            self.meta[f"hreflang:{a.get('hreflang')}"] = a.get("href")
        if tag == "h1" and self._skip_depth == 0:
            self.h1 += 1
        if tag == "a" and a.get("href"):
            href = urldefrag(urljoin(self.base, a["href"]))[0]
            if urlparse(href).netloc == urlparse(self.base).netloc:
                self.links.append(href)
            elif urlparse(href).scheme in ("http", "https"):
                self.external.append(href)
        if tag == "img" and self._chrome_depth == 0 and self._skip_depth == 0:
            self.img_total += 1
            decorative = (a.get("role") or "").lower() == "presentation" or (a.get("aria-hidden") or "").lower() == "true"
            if not decorative and not (a.get("alt") or "").strip():
                self.img_missing_alt += 1
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._script_jsonld = True
            self._script_bits = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
            self.title = "".join(self.title_bits).strip() or None
        if tag == "script" and self._script_jsonld:
            raw = "".join(self._script_bits)
            self._ingest_jsonld(raw)
            self._script_jsonld = False
        if tag in SKIP_TAGS and self._skip_depth:
            self._skip_depth -= 1
        if tag in CHROME_TAGS and self._chrome_depth:
            self._chrome_depth -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title_bits.append(data)
        if self._script_jsonld:
            self._script_bits.append(data)
            return
        if self._skip_depth:
            return
        tokens = re.findall(r"\b[\w’'-]+\b", data)
        self.words.extend(tokens)
        if self._chrome_depth:
            self.chrome_words.extend(tokens)
        else:
            self.body_words.extend(tokens)

    def _ingest_jsonld(self, raw: str) -> None:
        for match in re.findall(r'"@type"\s*:\s*"([^"]+)"', raw):
            self.schema.append(match)
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return
        if isinstance(parsed, list):
            self.jsonld.extend(parsed)
        else:
            self.jsonld.append(parsed)
        for node in _walk_jsonld(parsed):
            types = node.get("@type")
            if isinstance(types, str):
                self.schema.append(types)
            elif isinstance(types, list):
                self.schema.extend(str(t) for t in types if t)


def _walk_jsonld(payload: Any) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    if isinstance(payload, list):
        for item in payload:
            nodes.extend(_walk_jsonld(item))
        return nodes
    if not isinstance(payload, dict):
        return nodes
    nodes.append(payload)
    if "@graph" in payload:
        nodes.extend(_walk_jsonld(payload["@graph"]))
    return nodes


def normalize_url(url: str | None) -> str:
    value = urldefrag(url or "")[0]
    if not value:
        return ""
    parsed = urlparse(value)
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    netloc = parsed.netloc.lower()
    return f"{parsed.scheme}://{netloc}{path}"


def resource_identity(page: dict[str, Any]) -> str:
    return normalize_url(page.get("canonical") or page.get("final_url") or page.get("url"))


def _fetch(url: str, timeout: int = 15) -> tuple[int, dict[str, str], bytes, int, str | None, str, list[dict[str, Any]]]:
    start = time.time()
    handler = RecordingRedirectHandler()
    opener = build_opener(handler)
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*"})
    try:
        with opener.open(req, timeout=timeout) as response:
            data = response.read(3_000_000)
            headers = dict(response.headers.items())
            final_url = response.geturl() or url
            status = int(getattr(response, "status", None) or 200)
            return status, headers, data, int((time.time() - start) * 1000), None, final_url, handler.chain
    except HTTPError as exc:
        try:
            data = exc.read(3_000_000)
        except Exception:
            data = b""
        headers = dict(getattr(exc, "headers", {}) or {})
        return int(exc.code or 0), headers, data, int((time.time() - start) * 1000), str(exc), url, handler.chain
    except (URLError, Exception) as exc:
        return 0, {}, b"", int((time.time() - start) * 1000), str(exc), url, handler.chain


def _empty_page(
    requested: str,
    status: int,
    content_type: str,
    document_class: str,
    data_len: int,
    ms: int,
    err: str | None,
    final_url: str,
    chain: list[dict[str, Any]],
) -> dict[str, Any]:
    identity = normalize_url(final_url or requested)
    return asdict(
        PageEvidence(
            url=requested,
            status=status,
            content_type=content_type,
            title=None,
            meta_description=None,
            canonical=None,
            robots_meta=None,
            h1_count=0,
            word_count=0,
            internal_links=[],
            external_links=[],
            images_missing_alt=0,
            images_total=0,
            structured_data_types=[],
            lang=None,
            bytes=data_len,
            response_ms=ms,
            error=err,
            requested_url=requested,
            final_url=final_url,
            redirect_chain=chain,
            document_class=document_class,
            jsonld=[],
            body_word_count=0,
            chrome_word_count=0,
            identity_url=identity,
        )
    )


def crawl_site(start_url: str, max_pages: int = 100, delay: float = 0.15) -> dict:
    start_url = urldefrag(start_url)[0].rstrip("/") or start_url
    host = urlparse(start_url).netloc
    queue: collections.deque[str] = collections.deque([start_url])
    seen: set[str] = set()
    identities: set[str] = set()
    pages: list[dict[str, Any]] = []
    while queue and len(pages) < max_pages:
        url = queue.popleft()
        if url in seen:
            continue
        seen.add(url)
        status, headers, data, ms, err, final_url, chain = _fetch(url)
        content_type = headers.get("Content-Type", headers.get("content-type", "")).split(";")[0].lower()
        document_class = classify_document(content_type, final_url or url, data)
        if err or document_class != "html":
            pages.append(_empty_page(url, status, content_type, document_class, len(data), ms, err, final_url, chain))
            continue
        try:
            parser = Parser(final_url or url)
            encoding = "utf-8"
            parser.feed(data.decode(encoding, errors="ignore"))
            canonical = urldefrag(urljoin(final_url or url, parser.canonical))[0] if parser.canonical else None
            identity = normalize_url(canonical or final_url or url)
            if identity in identities and normalize_url(url) != identity:
                alias = _empty_page(url, status, content_type, "redirect-alias", len(data), ms, None, final_url, chain)
                alias["canonical"] = canonical
                alias["identity_url"] = identity
                alias["title"] = parser.title
                pages.append(alias)
                time.sleep(delay)
                continue
            identities.add(identity)
            body_count = len(parser.body_words)
            chrome_count = len(parser.chrome_words)
            pages.append(
                asdict(
                    PageEvidence(
                        url=url,
                        status=status,
                        content_type=content_type,
                        title=parser.title,
                        meta_description=parser.meta.get("description"),
                        canonical=canonical,
                        robots_meta=parser.meta.get("robots"),
                        h1_count=parser.h1,
                        word_count=body_count,
                        internal_links=sorted(set(parser.links)),
                        external_links=sorted(set(parser.external)),
                        images_missing_alt=parser.img_missing_alt,
                        images_total=parser.img_total,
                        structured_data_types=sorted(set(parser.schema)),
                        lang=parser.lang,
                        bytes=len(data),
                        response_ms=ms,
                        error=None,
                        requested_url=url,
                        final_url=final_url,
                        redirect_chain=chain,
                        document_class=document_class,
                        jsonld=parser.jsonld,
                        body_word_count=body_count,
                        chrome_word_count=chrome_count,
                        identity_url=identity,
                    )
                )
            )
            for link in parser.links:
                parsed = urlparse(link)
                if parsed.netloc == host and link not in seen and link not in queue and len(queue) + len(pages) < max_pages * 3:
                    queue.append(link)
        except Exception as exc:
            pages.append(_empty_page(url, status, content_type, document_class, len(data), ms, str(exc), final_url, chain))
        time.sleep(delay)
    return {"start_url": start_url, "host": host, "max_pages": max_pages, "pages": pages, "crawled_pages": len(pages)}
