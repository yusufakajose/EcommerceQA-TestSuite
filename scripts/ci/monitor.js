#!/usr/bin/env node
/**
 * CI Monitor utility
 * Usage:
 *  - npm run ci:monitor init
 *  - npm run ci:monitor run
 *  - npm run ci:monitor report
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function getGitInfo() {
  const info = { branch: null, commit: null, remote: null };
  // Swallow errors in CI environments where git metadata may be unavailable
  try {
    info.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (e) {
    // ignore git metadata errors in CI environment (no-op)
    void 0;
  }
  try {
    info.commit = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    // ignore when not in git repository (no-op)
    void 0;
  }
  try {
    info.remote = execSync('git config --get remote.origin.url').toString().trim();
  } catch (e) {
    // best-effort capture only (no-op)
    void 0;
  }
  return info;
}

function init() {
  const outDir = path.resolve(process.cwd(), 'reports', 'ci');
  const execDir = path.resolve(process.cwd(), 'reports', 'test-execution');
  ensureDir(outDir);
  ensureDir(execDir);

  const meta = {
    createdAt: new Date().toISOString(),
    env: process.env.NODE_ENV || 'ci',
    git: getGitInfo(),
    project: 'EcommerceQA-TestSuite',
    notes:
      'Initialized CI monitor artifacts. Use `npm run ci:monitor run` to execute CI suites and `npm run ci:monitor report` to summarize.',
  };

  const file = path.join(outDir, 'ci-monitor.json');
  fs.writeFileSync(file, JSON.stringify(meta, null, 2));
  console.log(`Initialized CI monitor at: ${file}`);
}

function run() {
  // Run core CI tasks in parallel; adjust as needed per pipeline capacity
  const tasks = [
    ['npm', ['run', 'ci:health-check']],
    ['npm', ['run', 'ci:test']],
  ];

  const procs = tasks.map(
    ([cmd, args]) =>
      new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { stdio: 'inherit' });
        p.on('close', (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))
        );
      })
  );

  return Promise.allSettled(procs).then((results) => {
    const summary = {
      finishedAt: new Date().toISOString(),
      results: results.map((r, i) => ({
        task: tasks[i][1].join(' '),
        status: r.status,
        reason: r.status === 'rejected' ? String(r.reason) : undefined,
      })),
    };
    const out = path.resolve(process.cwd(), 'reports', 'ci');
    ensureDir(out);
    fs.writeFileSync(path.join(out, 'ci-run-summary.json'), JSON.stringify(summary, null, 2));
    const failed = results.some((r) => r.status === 'rejected');
    if (failed) process.exit(1);
  });
}

function report() {
  const out = path.resolve(process.cwd(), 'reports', 'ci');
  ensureDir(out);
  const aggregate = { generatedAt: new Date().toISOString(), sources: {}, notes: [] };

  const candidates = [
    path.resolve(process.cwd(), 'reports', 'test-metrics.json'),
    path.resolve(process.cwd(), 'reports', 'performance-data.json'),
    path.resolve(process.cwd(), 'reports', 'api-performance-data.json'),
    path.resolve(process.cwd(), 'reports', 'load-test-data.json'),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        aggregate.sources[path.basename(file)] = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        aggregate.notes.push(`Failed to parse ${file}: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(path.join(out, 'ci-aggregate.json'), JSON.stringify(aggregate, null, 2));
  console.log('CI aggregate report written to reports/ci/ci-aggregate.json');
}

async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'init':
      init();
      break;
    case 'run':
      await run();
      break;
    case 'report':
      report();
      break;
    default:
      console.log('Usage: npm run ci:monitor <init|run|report>');
      process.exit(cmd ? 1 : 0);
  }
}

main();
