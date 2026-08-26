import type { IncomingMessage, ServerResponse } from 'node:http';
import { runLazyApi, vercelNodeConfig } from '../src/server/lazy-api';

export const config = vercelNodeConfig;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await runLazyApi(
    req,
    res,
    async () => {
      const mod = await import('../src/server/bootstrap-http');
      return mod.handleBootstrap;
    },
    'Store bootstrap could not be loaded.'
  );
}
