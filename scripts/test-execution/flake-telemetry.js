// @ts-check
/*
  Flake Telemetry: parses Playwright JSON results to detect flaky/retried tests
  - Input: reports/test-execution/${TEST_ENV||development}/test-results.json
  - Output:
      reports/test-execution/${env}/flakes.json (latest run)
      reports/test-execution/${env}/flakes-history.json (append last N=50)
*/
const fs = require('fs');
const path = require('path');

/** @param {string} p */
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** @template T @param {string} p @returns {T|null} */
function readJSON(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  return null;
}

/**
 * @param {any} root
 * @param {(spec: any) => void} cb
 */
function walkSuites(root, cb) {
  const stack = Array.isArray(root) ? root.slice() : [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.suites && Array.isArray(node.suites)) {
      for (const s of node.suites) stack.push(s);
    }
    if (node.specs && Array.isArray(node.specs)) {
      for (const spec of node.specs) cb(spec);
    }
  }
}

function main() {
  const env = process.env.TEST_ENV || 'development';
  const baseDir = path.join('reports', 'test-execution', env);
  const inputPath = path.join(baseDir, 'test-results.json');
  const outLatest = path.join(baseDir, 'flakes.json');
  const outHistory = path.join(baseDir, 'flakes-history.json');

  ensureDir(baseDir);
  const data = readJSON(inputPath);
  if (!data || !Array.isArray(data.suites)) {
    // Write empty telemetry to avoid step failures
    const empty = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || null,
      runId: process.env.GITHUB_RUN_ID || null,
      totals: { total: 0, retried: 0, flaky: 0 },
      flakyTests: [],
    };
    fs.writeFileSync(outLatest, JSON.stringify(empty, null, 2));
    // Maintain history
    const hist = readJSON(outHistory) || [];
    hist.push(empty);
    while (hist.length > 50) hist.shift();
    fs.writeFileSync(outHistory, JSON.stringify(hist, null, 2));
    return;
  }

  /** @type {Array<{key:string,title:string,file:string,project:string|null,attempts:number,statuses:string[]}>} */
  const flaky = [];
  /** @type {{ total: number; retried: number; flaky: number }} */
  const totals = { total: 0, retried: 0, flaky: 0 };

  walkSuites({ suites: data.suites }, (spec) => {
    for (const test of spec.tests || []) {
      totals.total++;
      const results = Array.isArray(test.results) ? test.results : [];
      const attempts = results.length || (test.status ? 1 : 0);
      if (attempts > 1) totals.retried++;
      const hadPass = results.some((r) => r && r.status === 'passed');
      const hadFailLike = results.some(
        (r) => r && (r.status === 'failed' || r.status === 'timedOut')
      );
      const isFlaky = hadPass && hadFailLike;
      if (isFlaky) {
        totals.flaky++;
        const key = `${spec.file}::${spec.title}::${test.projectName || test.projectId || ''}`;
        flaky.push({
          key,
          title: spec.title,
          file: spec.file,
          project: test.projectName || test.projectId || null,
          attempts,
          statuses: results.map((r) => r && r.status).filter(Boolean),
        });
      }
    }
  });

  // Build output
  const latest = {
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null,
    totals,
    flakyTests: flaky.sort((a, b) => b.attempts - a.attempts).slice(0, 50),
  };

  fs.writeFileSync(outLatest, JSON.stringify(latest, null, 2));

  // Update history (cap at 50 entries)
  const history = readJSON(outHistory) || [];
  history.push(latest);
  while (history.length > 50) history.shift();
  fs.writeFileSync(outHistory, JSON.stringify(history, null, 2));
}

main();
