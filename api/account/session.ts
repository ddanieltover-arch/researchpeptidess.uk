import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleCustomerSession } from '../../src/server/customer-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleCustomerSession(req, res);
}
