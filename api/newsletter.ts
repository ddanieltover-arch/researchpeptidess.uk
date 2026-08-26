import type { IncomingMessage, ServerResponse } from 'node:http';
import { runLazyApi, vercelNodeConfig } from '../src/server/lazy-api';

export const config = vercelNodeConfig;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await runLazyApi(
    req,
    res,
    async () => {
      const { handleNewsletterUpsert } = await import('../src/server/newsletter-http');
      return handleNewsletterUpsert;
    },
    'The subscription could not be stored.'
  );
}
