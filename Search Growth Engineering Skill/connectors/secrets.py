from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Protocol
from urllib.parse import quote

from .protocol import ConnectorError


class SecretBackend(Protocol):
    name: str

    def get(self, key: str) -> str | None:
        ...


class SecretError(ConnectorError):
    pass


_ENV_LINE = re.compile(r'^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$')


def parse_dotenv(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        match = _ENV_LINE.match(raw)
        if not match:
            continue
        key, value = match.group(1), match.group(2).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key] = value
    return values


class EnvBackend:
    name = 'env'

    def get(self, key: str) -> str | None:
        value = os.environ.get(key)
        return value if value not in (None, '') else None


class DotEnvBackend:
    name = 'dotenv'

    def __init__(self, path: str | Path | None = None):
        self.path = Path(path or os.environ.get('SGE_ENV_FILE') or '.env')
        self._cache: dict[str, str] | None = None

    def _load(self) -> dict[str, str]:
        if self._cache is not None:
            return self._cache
        if not self.path.exists():
            self._cache = {}
            return self._cache
        self._cache = parse_dotenv(self.path.read_text(encoding='utf-8'))
        return self._cache

    def get(self, key: str) -> str | None:
        value = self._load().get(key)
        return value if value not in (None, '') else None


class MemoryBackend:
    name = 'memory'

    def __init__(self, values: dict[str, str] | None = None):
        self.values = dict(values or {})

    def get(self, key: str) -> str | None:
        value = self.values.get(key)
        return value if value not in (None, '') else None


class HttpJsonSecretBackend:
    """Testable HTTP secret backend. Used by Vault and local secret-store doubles."""

    name = 'http-json'

    def __init__(self, endpoint: str, *, headers: dict[str, str] | None = None, request_fn=None):
        if not endpoint:
            raise SecretError('HTTP secret backend requires an endpoint')
        self.endpoint = endpoint.rstrip('/')
        self.headers = headers or {}
        self._request = request_fn

    def get(self, key: str) -> str | None:
        request = self._request
        if request is None:
            from intelligence.connectors.http import request_json
            request = request_json
        url = f'{self.endpoint}/{quote(key, safe="")}'
        data = request(url, method='GET', headers=self.headers)
        if data is None:
            return None
        if isinstance(data, str):
            return data or None
        if isinstance(data, dict):
            for field in ('value', 'secret', 'data', key):
                item = data.get(field)
                if isinstance(item, str) and item:
                    return item
                if isinstance(item, dict) and isinstance(item.get('value'), str):
                    return item['value'] or None
        return None


class AwsSecretsManagerBackend:
    name = 'aws-secrets-manager'

    def __init__(self, *, request_fn=None, region: str | None = None):
        self.region = region or os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
        self._request = request_fn
        self._http = os.environ.get('SGE_SECRETS_HTTP_ENDPOINT')

    def get(self, key: str) -> str | None:
        if self._http:
            return HttpJsonSecretBackend(self._http, request_fn=self._request).get(key)
        try:
            import boto3  # type: ignore
        except ImportError as exc:
            raise SecretError('AWS Secrets Manager selected but boto3 is not installed') from exc
        client = boto3.client('secretsmanager', region_name=self.region)
        payload = client.get_secret_value(SecretId=key)
        text = payload.get('SecretString')
        if not text:
            return None
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return text
        if isinstance(parsed, dict) and 'value' in parsed:
            return str(parsed['value'])
        return text


class GoogleSecretManagerBackend:
    name = 'google-secret-manager'

    def __init__(self, *, request_fn=None, project: str | None = None):
        self.project = project or os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('GCP_PROJECT')
        self._request = request_fn
        self._http = os.environ.get('SGE_SECRETS_HTTP_ENDPOINT')

    def get(self, key: str) -> str | None:
        if self._http:
            return HttpJsonSecretBackend(self._http, request_fn=self._request).get(key)
        if not self.project:
            raise SecretError('Set GOOGLE_CLOUD_PROJECT for Google Secret Manager')
        try:
            from google.cloud import secretmanager  # type: ignore
        except ImportError as exc:
            raise SecretError('Google Secret Manager selected but google-cloud-secret-manager is not installed') from exc
        client = secretmanager.SecretManagerServiceClient()
        name = f'projects/{self.project}/secrets/{key}/versions/latest'
        response = client.access_secret_version(request={'name': name})
        return response.payload.data.decode('utf-8') or None


class AzureKeyVaultBackend:
    name = 'azure-key-vault'

    def __init__(self, *, request_fn=None, vault_url: str | None = None):
        self.vault_url = vault_url or os.environ.get('AZURE_KEY_VAULT_URL')
        self._request = request_fn
        self._http = os.environ.get('SGE_SECRETS_HTTP_ENDPOINT')

    def get(self, key: str) -> str | None:
        if self._http:
            return HttpJsonSecretBackend(self._http, request_fn=self._request).get(key)
        if not self.vault_url:
            raise SecretError('Set AZURE_KEY_VAULT_URL for Azure Key Vault')
        try:
            from azure.identity import DefaultAzureCredential  # type: ignore
            from azure.keyvault.secrets import SecretClient  # type: ignore
        except ImportError as exc:
            raise SecretError('Azure Key Vault selected but azure-identity/azure-keyvault-secrets are not installed') from exc
        client = SecretClient(vault_url=self.vault_url, credential=DefaultAzureCredential())
        bundle = client.get_secret(key)
        return bundle.value or None


class VaultBackend:
    name = 'vault'

    def __init__(self, *, request_fn=None, addr: str | None = None, token: str | None = None, mount: str | None = None):
        self.addr = (addr or os.environ.get('VAULT_ADDR') or os.environ.get('SGE_SECRETS_HTTP_ENDPOINT') or '').rstrip('/')
        self.token = token or os.environ.get('VAULT_TOKEN')
        self.mount = (mount or os.environ.get('VAULT_KV_MOUNT') or 'secret').strip('/')
        self._request = request_fn

    def get(self, key: str) -> str | None:
        if not self.addr:
            raise SecretError('Set VAULT_ADDR for HashiCorp Vault')
        headers = {'X-Vault-Token': self.token} if self.token else {}
        backend = HttpJsonSecretBackend(
            f'{self.addr}/v1/{self.mount}/data',
            headers=headers,
            request_fn=self._request,
        )
        return backend.get(key)


BACKENDS = {
    'env': EnvBackend,
    'dotenv': DotEnvBackend,
    'memory': MemoryBackend,
    'aws': AwsSecretsManagerBackend,
    'aws-secrets-manager': AwsSecretsManagerBackend,
    'gcp': GoogleSecretManagerBackend,
    'google': GoogleSecretManagerBackend,
    'google-secret-manager': GoogleSecretManagerBackend,
    'azure': AzureKeyVaultBackend,
    'azure-key-vault': AzureKeyVaultBackend,
    'vault': VaultBackend,
}


class SecretsManager:
    """Resolve named secrets from env/.env and optional cloud backends. Never logs secret values."""

    _current: 'SecretsManager | None' = None

    def __init__(self, backends: list[SecretBackend] | None = None):
        self.backends = backends or default_backends()

    @classmethod
    def current(cls) -> 'SecretsManager':
        if cls._current is None:
            cls._current = cls()
        return cls._current

    @classmethod
    def set_current(cls, manager: 'SecretsManager | None') -> None:
        cls._current = manager

    def get(self, name: str) -> str | None:
        if not name or not isinstance(name, str):
            raise SecretError('Secret names must be non-empty strings')
        for backend in self.backends:
            value = backend.get(name)
            if value not in (None, ''):
                return value
        return None


def default_backends() -> list[SecretBackend]:
    backends: list[SecretBackend] = [EnvBackend(), DotEnvBackend()]
    selected = (os.environ.get('SGE_SECRETS_BACKEND') or '').strip().lower()
    if selected and selected not in {'env', 'dotenv'}:
        factory = BACKENDS.get(selected)
        if not factory:
            raise SecretError(f'Unknown SGE_SECRETS_BACKEND={selected}')
        backends.append(factory())
    return backends


def secret(name: str) -> str | None:
    """Return a named secret. Orchestrator code should only request secrets by name."""
    return SecretsManager.current().get(name)
