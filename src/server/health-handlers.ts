/**
 * Lightweight health/ready responses. Keep this module free of catalogue imports.
 */

import type { ServerResponse } from 'node:http';
import { pingDatabase } from '../db/index';
import { buildEnvDiagnostic, storageStatus } from './env-status';
import { sendJson } from './http';

export async function writeHealthResponse(res: ServerResponse, correlationId: string): Promise<void> {
  try {
    const database = await pingDatabase();
    const storage = storageStatus();
    const status = database === 'unavailable' ? 'degraded' : 'healthy';
    sendJson(
      res,
      200,
      {
        status,
        database,
        storage,
      },
      { 'x-correlation-id': correlationId }
    );
  } catch {
    sendJson(
      res,
      200,
      {
        status: 'degraded',
        database: 'unavailable',
        storage: 'unconfigured',
      },
      { 'x-correlation-id': correlationId }
    );
  }
}

export async function writeReadyResponse(res: ServerResponse, correlationId: string): Promise<void> {
  try {
    const variables = buildEnvDiagnostic();
    const database = variables.DATABASE_URL;
    const ready = database === 'PRESENT';
    sendJson(
      res,
      ready ? 200 : 503,
      {
        ready,
        variables,
      },
      { 'x-correlation-id': correlationId }
    );
  } catch {
    sendJson(
      res,
      503,
      {
        ready: false,
        variables: {},
      },
      { 'x-correlation-id': correlationId }
    );
  }
}
