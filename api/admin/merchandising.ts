import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminMerchandising } from '../../src/server/admin-persist-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleAdminMerchandising(req, res);
}
