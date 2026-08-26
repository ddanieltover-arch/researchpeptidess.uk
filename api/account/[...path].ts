import type { IncomingMessage, ServerResponse } from 'node:http';
import { dispatchVercelApi } from '../../src/server/vercel-handler';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await dispatchVercelApi(req, res, 'The account request could not be completed.');
}
