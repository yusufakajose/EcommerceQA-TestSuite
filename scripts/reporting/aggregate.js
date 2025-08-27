#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  env: process.env.TEST_ENV || 'development',
  artifacts: [],
};

const candidates = [
  'reports/test-execution.json',
  'reports/performance-data.json',
  'reports/api-performance-data.json',
  'reports/load-test-data.json',
];

for (const file of candidates) {
  if (fs.existsSync(file)) {
    try {
      summary.artifacts.push({
        name: path.basename(file),
        data: JSON.parse(fs.readFileSync(file, 'utf8')),
      });
    } catch (e) {
      summary.artifacts.push({ name: path.basename(file), error: e.message });
    }
  }
}

fs.writeFileSync(path.join(outDir, 'test-metrics.json'), JSON.stringify(summary, null, 2));
console.log('Wrote reports/test-metrics.json');
