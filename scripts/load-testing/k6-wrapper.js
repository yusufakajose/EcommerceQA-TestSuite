#!/usr/bin/env node
/**
 * k6 Wrapper CLI
 * Runs one or more k6 scenarios with consistent outputs and exit-code semantics.
 *
 * Features:
 * - --types: comma-separated list of test types to run (smoke,load,stress,spike,volume,baseline,capacity,endurance,breakpoint)
 * - --script: path to k6 script (defaults to automated-tests/load-tests/k6-load-tests.js)
 * - --base-url: override BASE_URL env for the script
 * - --vus/-u, --duration/-d, --iterations/-i: CLI overrides passed to k6
 * - --tag key=value (repeatable) or --tags key=val,key2=val2
 * - --out-dir: output directory for per-type results (default: reports/load-tests/k6)
 * - --parallel: run types concurrently
 * - --quiet: pass through to k6
 * - --no-thresholds: disable thresholds in k6 run
 * - --k6-args: additional raw args to pass through to k6 (quoted string)
 *
 * Outputs per type:
 * - JSONL stream: <out-dir>/<type>-results.json
 * - Summary JSON via handleSummary: <out-dir>/<type>-summary.json (using K6_SUMMARY_PATH)
 * - JUnit XML via handleSummary (if the script writes it): <out-dir>/<type>-results.junit.xml
 *
 * Exit codes:
 * - 0 if all runs exit 0
 * - 99 if any run exits 99 (threshold failure) and none exit with other non-zero codes
 * - first non-99 non-zero exit code if any run fails fatally
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { tags: [], types: [], parallel: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--types':
        args.types = String(next())
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case '--script':
        args.script = next();
        break;
      case '--base-url':
        args.baseUrl = next();
        break;
      case '--vus':
      case '-u':
        args.vus = String(next());
        break;
      case '--duration':
      case '-d':
        args.duration = String(next());
        break;
      case '--iterations':
      case '-i':
        args.iterations = String(next());
        break;
      case '--tag':
        args.tags.push(String(next()));
        break;
      case '--tags': {
        const val = String(next());
        if (val) {
          val.split(',').forEach((kv) => args.tags.push(kv.trim()));
        }
        break;
      }
      case '--out-dir':
        args.outDir = next();
        break;
      case '--parallel':
        args.parallel = true;
        break;
      case '--quiet':
        args.quiet = true;
        break;
      case '--no-thresholds':
        args.noThresholds = true;
        break;
      case '--k6-args': {
        const raw = String(next() || '').trim();
        // split by space but keep quoted segments intact
        args.k6Args = raw ? raw.match(/(?:"[^"]*"|\S)+/g).map((s) => s.replace(/^"|"$/g, '')) : [];
        break;
      }
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        // ignore unknown to allow pass-through future options
        break;
    }
  }
  return args;
}

function printHelp() {
  const msg = `k6-wrapper usage:
  node scripts/load-testing/k6-wrapper.js [--types=smoke,load] [--script <path>] [--base-url <url>]
                                          [--vus N] [--duration 30s] [--iterations N]
                                          [--tag key=val] [--tags k=v,k2=v2]
                                          [--out-dir <dir>] [--parallel] [--quiet]
                                          [--no-thresholds] [--k6-args "--summary-mode full"]

Defaults:
  --types=load (single run) | set to 'all' to run common types
  --script=automated-tests/load-tests/k6-load-tests.js
  --out-dir=reports/load-tests/k6

Notes:
  - Thresholds cannot be added via CLI, only disabled with --no-thresholds. To customize thresholds, change the k6 script or compose one that merges options.
  - Exit code 99 indicates threshold failure (k6). This wrapper will propagate 99 if any scenario fails thresholds and no other fatal error occurred.
`;
  console.log(msg);
}

const COMMON_TYPES = ['smoke', 'load', 'stress', 'spike', 'volume'];
const ADVANCED_TYPES = ['baseline', 'capacity', 'endurance', 'breakpoint'];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function buildK6Args(baseArgs) {
  const args = ['run'];
  if (baseArgs.quiet) args.push('--quiet');
  if (baseArgs.noThresholds) args.push('--no-thresholds');
  if (baseArgs.vus) args.push('--vus', String(baseArgs.vus));
  if (baseArgs.duration) args.push('--duration', String(baseArgs.duration));
  if (baseArgs.iterations) args.push('--iterations', String(baseArgs.iterations));
  // tags
  (baseArgs.tags || []).forEach((kv) => {
    if (!kv) return;
    const [k, v] = kv.split('=');
    if (k && typeof v !== 'undefined') {
      args.push('--tag', `${k}=${v}`);
    }
  });
  // pass-through k6 args
  if (Array.isArray(baseArgs.k6Args) && baseArgs.k6Args.length) {
    args.push(...baseArgs.k6Args);
  }
  return args;
}

function runOne({ type, script, outDir, env, baseArgs }) {
  return new Promise((resolve) => {
    const jsonStream = path.join(outDir, `${type}-results.json`);
    const summaryPath = path.join(outDir, `${type}-summary.json`);
    const args = buildK6Args(baseArgs);
    args.push('--out', `json=${jsonStream}`);
    args.push(script);

    const child = spawn('k6', args, {
      stdio: 'inherit',
      env: { ...process.env, ...env, TEST_TYPE: type, K6_SUMMARY_PATH: summaryPath },
    });

    child.on('close', (code) => {
      resolve({ type, code: code == null ? 1 : code, jsonStream, summaryPath });
    });
    child.on('error', (err) => {
      console.error(`Failed to start k6 for type '${type}':`, err.message);
      resolve({ type, code: 127, jsonStream, summaryPath, error: err });
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const script = args.script || 'automated-tests/load-tests/k6-load-tests.js';
  const outDir = args.outDir || 'reports/load-tests/k6';
  const env = {};
  if (args.baseUrl) env.BASE_URL = args.baseUrl;

  // Resolve types
  let types = args.types && args.types.length ? args.types : ['load'];
  if (types.length === 1 && types[0].toLowerCase() === 'all') {
    types = COMMON_TYPES; // keep advanced types explicit
  }

  await ensureDir(outDir);

  const baseArgs = {
    quiet: !!args.quiet,
    noThresholds: !!args.noThresholds,
    vus: args.vus,
    duration: args.duration,
    iterations: args.iterations,
    tags: args.tags,
    k6Args: args.k6Args || [],
  };

  // Run serially or in parallel
  const runners = types.map((t) => () => runOne({ type: t, script, outDir, env, baseArgs }));
  const results = [];
  if (args.parallel) {
    const res = await Promise.all(runners.map((fn) => fn()));
    results.push(...res);
  } else {
    for (const fn of runners) {
      results.push(await fn());
    }
  }

  // Compute wrapper exit code
  const nonZero = results.filter((r) => r.code !== 0);
  let exitCode = 0;
  if (nonZero.length) {
    const hasFatal = nonZero.find((r) => r.code !== 99);
    exitCode = hasFatal ? hasFatal.code : 99;
  }

  // Print minimal summary
  console.log('\nK6 wrapper results:');
  results.forEach((r) => {
    console.log(
      ` - ${r.type}: exit=${r.code} stream=${path.relative(process.cwd(), r.jsonStream)} summary=${path.relative(process.cwd(), r.summaryPath)}`
    );
  });
  console.log(`Wrapper exit code: ${exitCode}`);

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Wrapper error:', err);
  process.exit(1);
});
