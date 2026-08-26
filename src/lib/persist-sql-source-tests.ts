import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TestResult } from './commerce-tests';

const PERSIST_FILES = ['contact.ts', 'newsletter.ts', 'commerce.ts', 'settings.ts', 'shipping.ts', 'merchandising.ts'];
const HOBBY_FUNCTION_LIMIT = 12;

function listApiFunctionFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listApiFunctionFiles(full));
      continue;
    }
    if (entry.endsWith('.ts') && !entry.startsWith('_')) files.push(full);
  }
  return files;
}

export function runPersistSqlSourceTests(): TestResult[] {
  const persistStart = performance.now();
  const hits = PERSIST_FILES.filter((file) => {
    const source = readFileSync(resolve(process.cwd(), 'src/server/persist', file), 'utf8');
    return /drizzle-orm|from ['"]\.\.\/\.\.\/db\//.test(source);
  });

  const functionStart = performance.now();
  const apiFiles = listApiFunctionFiles(resolve(process.cwd(), 'api'));
  return [
    {
      category: 'PERSISTENCE',
      name: 'Store persist modules talk to Neon over SQL, not Drizzle',
      passed: hits.length === 0,
      expected: 'No drizzle-orm or src/db imports in persist modules',
      actual: hits.length ? hits.join(', ') : 'clean',
      durationMs: Math.round((performance.now() - persistStart) * 100) / 100,
    },
    {
      category: 'PERSISTENCE',
      name: 'Vercel Hobby deployments stay at or under 12 serverless functions',
      passed: apiFiles.length <= HOBBY_FUNCTION_LIMIT,
      expected: `<= ${HOBBY_FUNCTION_LIMIT} files in api/`,
      actual: String(apiFiles.length),
      durationMs: Math.round((performance.now() - functionStart) * 100) / 100,
    },
  ];
}
