import path from 'node:path';
import { config } from 'dotenv';
import { buildEnvDiagnostic } from '../src/server/env-status';

config({ path: path.join(process.cwd(), '.env') });

const diagnostic = buildEnvDiagnostic();
for (const [name, status] of Object.entries(diagnostic)) {
  console.log(`${name}: ${status}`);
}
