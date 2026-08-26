import type { IncomingMessage, ServerResponse } from 'node:http';
import { runLazyApi, vercelNodeConfig } from '../../src/server/lazy-api';

export const config = vercelNodeConfig;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await runLazyApi(
    req,
    res,
    async () => {
      const { handleOrderLifecycleUpdate } = await import('../../src/server/order-http');
      return handleOrderLifecycleUpdate;
    },
    'Order could not be updated.'
  );
}
