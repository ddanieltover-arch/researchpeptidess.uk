from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from ...protocol import Connector, SyncResult, skipped_sync
from intelligence.connectors.base import EvidenceEnvelope


class ScreamingFrogConnector(Connector):
    """Ingest a local Screaming Frog export. This is not a live crawl of search-engine results."""

    connector_id = 'screamingfrog'
    display_name = 'Screaming Frog'
    capabilities = ('crawl-export', 'internal-html', 'response-codes')
    optional_secrets = ('SCREAMINGFROG_EXPORT_PATH',)

    def ready_requirements(self) -> list[str]:
        path = self.secret('SCREAMINGFROG_EXPORT_PATH') or self.config.get('export_path')
        return [] if path else ['SCREAMINGFROG_EXPORT_PATH']

    def sync(self, **kwargs: Any) -> SyncResult:
        path = kwargs.get('path') or self.config.get('export_path') or self.secret('SCREAMINGFROG_EXPORT_PATH')
        if not path:
            return skipped_sync(self.connector_id, reason='Provide a local Screaming Frog export path', source=self.connector_id)
        file_path = Path(path)
        if not file_path.exists():
            return skipped_sync(self.connector_id, reason=f'Export not found: {file_path}', source=self.connector_id)
        if file_path.suffix.lower() == '.json':
            data = json.loads(file_path.read_text(encoding='utf-8'))
        else:
            with file_path.open(encoding='utf-8', newline='') as handle:
                data = list(csv.DictReader(handle))
        envelope = EvidenceEnvelope.make('screamingfrog.export', data, notes=[f'path={file_path}'])
        return SyncResult(connector_id=self.connector_id, status='ok', source='screamingfrog.export', evidence=envelope.to_dict())
