import { runAllCommerceTests } from './commerce-tests';

const report = runAllCommerceTests();
for (const result of report.results) {
  const mark = result.passed ? 'PASS' : 'FAIL';
  console.log(`${mark} [${result.category}] ${result.name}`);
  if (!result.passed) {
    console.log(`  expected: ${result.expected}`);
    console.log(`  actual: ${result.actual}`);
  }
}
console.log(`TOTAL ${report.passedTests}/${report.totalTests} passed`);
if (!report.overallPassed) {
  process.exit(1);
}
