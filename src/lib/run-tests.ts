import { runAllCommerceTests } from './commerce-tests';
import { runPersistSqlSourceTests } from './persist-sql-source-tests';

const report = runAllCommerceTests();
report.results.push(...runPersistSqlSourceTests());
report.totalTests = report.results.length;
report.passedTests = report.results.filter((result) => result.passed).length;
report.failedTests = report.totalTests - report.passedTests;
report.overallPassed = report.failedTests === 0;
report.durationMs = Number(report.results.reduce((acc, result) => acc + result.durationMs, 0).toFixed(2));
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
