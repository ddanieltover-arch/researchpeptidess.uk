import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleCreateOrder } from '../src/server/order-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleCreateOrder(req, res);
}
