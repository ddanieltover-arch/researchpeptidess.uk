import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { handleApiRequest } from './api-router';

function attachApi(middlewares: Connect.Server): void {
  middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const path = (req.url || '').split('?')[0];
    if (!path.startsWith('/api/')) {
      next();
      return;
    }
    const handled = await handleApiRequest(req, res);
    if (!handled) next();
  });
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'research-peptides-api',
    configureServer(server) {
      attachApi(server.middlewares);
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares);
    },
  };
}
