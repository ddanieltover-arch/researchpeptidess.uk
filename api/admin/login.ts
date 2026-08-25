import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminLogin } from '../../src/server/admin-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleAdminLogin(req, res);
}
