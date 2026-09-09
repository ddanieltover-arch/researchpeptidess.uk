from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Any

from .base import ConnectorError
from .http import request_json

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

def service_account_access_token(credentials_path: str, scopes: list[str]) -> str:
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
    except ImportError as exc:
        raise ConnectorError('Install google-auth to use service-account authentication: pip install google-auth') from exc
    creds = service_account.Credentials.from_service_account_file(credentials_path, scopes=scopes)
    creds.refresh(Request())
    if not creds.token:
        raise ConnectorError('Google authentication returned no access token')
    return creds.token

def access_token_from_env(env_name: str, scopes: list[str], credentials_env: str = 'GOOGLE_APPLICATION_CREDENTIALS') -> str:
    direct = os.getenv(env_name)
    if direct:
        return direct
    credentials_path = os.getenv(credentials_env)
    if credentials_path:
        return service_account_access_token(credentials_path, scopes)
    raise ConnectorError(f'Missing {env_name} or {credentials_env}')

def google_json_get(url: str, token: str) -> Any:
    return request_json(url, headers={'Authorization': f'Bearer {token}'})

def google_json_post(url: str, token: str, body: dict[str, Any]) -> Any:
    return request_json(url, method='POST', headers={'Authorization': f'Bearer {token}'}, body=body)
