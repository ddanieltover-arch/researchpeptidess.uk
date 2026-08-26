import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TestResult } from './commerce-tests';

const PERSIST_FILES = ['contact.ts', 'newsletter.ts', 'commerce.ts', 'settings.ts', 'shipping.ts', 'merchandising.ts'];

export function runPersistSqlSourceTests(): TestResult[] {
  const start = performance.now();
  const hits = PERSIST_FILES.filter((file) => {
    const source = readFileSync(resolve(process.cwd(), 'src/server/persist', file), 'utf8');
    return /drizzle-orm|from ['"]\.\.\/\.\.\/db\//.test(source);
  });
  return [
    {
      category: 'PERSISTENCE',
      name: 'Store persist modules talk to Neon over SQL, not Drizzle',
      passed: hits.length === 0,
      expected: 'No drizzle-orm or src/db imports in persist modules',
      actual: hits.length ? hits.join(', ') : 'clean',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    },
  ];
}
