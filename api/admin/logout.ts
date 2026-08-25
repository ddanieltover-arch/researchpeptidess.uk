import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminLogout } from '../../src/server/admin-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleAdminLogout(req, res);
}
