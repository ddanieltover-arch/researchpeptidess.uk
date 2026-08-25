import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleCustomerRegister } from '../../src/server/customer-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleCustomerRegister(req, res);
}
