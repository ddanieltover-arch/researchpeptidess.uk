import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminCommerceRead } from '../../src/server/commerce-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleAdminCommerceRead(req, res);
}
