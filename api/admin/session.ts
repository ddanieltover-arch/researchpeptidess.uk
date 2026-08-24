import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminSession } from '../../src/server/admin-http';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleAdminSession(req, res);
}
