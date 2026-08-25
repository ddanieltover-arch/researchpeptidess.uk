import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleCustomerLogin } from '../../src/server/customer-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleCustomerLogin(req, res);
}
