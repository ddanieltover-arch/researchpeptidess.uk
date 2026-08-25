import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleInventoryEvent } from '../src/server/order-http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleInventoryEvent(req, res);
}
