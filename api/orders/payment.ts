import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlePaymentUpdate } from '../../src/server/order-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handlePaymentUpdate(req, res);
}
