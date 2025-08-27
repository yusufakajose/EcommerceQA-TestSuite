/**
 * JMeter JTL Streaming Parser with SLO evaluation
 * - Streams CSV JTL files
 * - Aggregates per-label and overall metrics
 * - Computes p90/p95/p99 via TDigest
 * - Evaluates against SLO config (JSON)
 * - Emits a plan summary JSON structure
 */

/* eslint-disable no-empty */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { TDigest } = require('tdigest');

// Known CSV headers from JMeter docs (12.4 CSV Log format)
const DEFAULT_COLUMNS = [
  'timeStamp',
  'elapsed',
  'label',
  'responseCode',
  'responseMessage',
  'threadName',
  'dataType',
  'success',
  'failureMessage',
  'bytes',
  'sentBytes',
  'grpThreads',
  'allThreads',
  'URL',
  'Latency',
  'IdleTime',
  'Connect',
  // Additional optional fields may appear after these; csv-parse with relax_column_count will keep extras as undefined unless columns are provided.
];

function safeNumber(x) {
  if (x === undefined || x === null || x === '') return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function initAgg() {
  return {
    count: 0,
    errors: 0,
    sumElapsed: 0,
    minElapsed: Number.POSITIVE_INFINITY,
    maxElapsed: 0,
    bytes: 0,
    sentBytes: 0,
    firstTs: Number.POSITIVE_INFINITY,
    lastTs: 0,
    digest: new TDigest(),
  };
}

function updateAgg(agg, rec) {
  const ts = safeNumber(rec.timeStamp);
  const elapsed = safeNumber(rec.elapsed);
  const success = String(rec.success).toLowerCase() === 'true';
  const bytes = safeNumber(rec.bytes);
  const sentBytes = safeNumber(rec.sentBytes);

  agg.count += 1;
  if (!success) agg.errors += 1;
  agg.sumElapsed += elapsed;
  if (elapsed < agg.minElapsed) agg.minElapsed = elapsed;
  if (elapsed > agg.maxElapsed) agg.maxElapsed = elapsed;
  agg.bytes += bytes;
  agg.sentBytes += sentBytes;
  if (ts && ts < agg.firstTs) agg.firstTs = ts;
  if (ts && ts > agg.lastTs) agg.lastTs = ts;
  if (Number.isFinite(elapsed)) agg.digest.push(elapsed);
}

function finalizeAgg(name, agg) {
  // Avoid zero/inf
  const durationSec = agg.lastTs > agg.firstTs ? (agg.lastTs - agg.firstTs) / 1000 : null;
  const throughput = durationSec && durationSec > 0 ? agg.count / durationSec : 0;
  const avg = agg.count > 0 ? agg.sumElapsed / agg.count : 0;
  // t-digest percentile accepts [0..1]
  const p = (q) => {
    const v =
      agg.digest && typeof agg.digest.percentile === 'function'
        ? agg.digest.percentile(q)
        : undefined;
    return Number.isFinite(v) ? Math.round(v) : null;
  };
  const p90 = p(0.9);
  const p95 = p(0.95);
  const p99 = p(0.99);
  const recvKBs = durationSec && durationSec > 0 ? agg.bytes / 1024 / durationSec : 0;
  const sentKBs = durationSec && durationSec > 0 ? agg.sentBytes / 1024 / durationSec : 0;

  return {
    name,
    samples: agg.count,
    errors: agg.errors,
    error_percentage: agg.count > 0 ? +((agg.errors / agg.count) * 100).toFixed(2) : 0,
    average_response_time: Math.round(avg),
    min_response_time: Number.isFinite(agg.minElapsed) ? agg.minElapsed : null,
    max_response_time: agg.maxElapsed || null,
    p90_response_time: p90,
    p95_response_time: p95,
    p99_response_time: p99,
    throughput: +throughput.toFixed(2),
    received_kb_per_sec: +recvKBs.toFixed(2),
    sent_kb_per_sec: +sentKBs.toFixed(2),
    duration_seconds: durationSec ? Math.round(durationSec) : null,
  };
}

function loadSloConfig(sloPath) {
  try {
    if (sloPath && fs.existsSync(sloPath)) {
      return JSON.parse(fs.readFileSync(sloPath, 'utf8'));
    }
  } catch (e) {
    // fallback to default SLO config when file cannot be read/parsed (no-op)
    void 0;
  }
  // Defaults
  return {
    global: {
      error_rate_pct: { lte: 5 },
      p95_ms: { lte: 1500 },
      throughput_rps: { gte: 5 },
    },
    labels: {},
  };
}

function evalConstraint(value, cons) {
  if (value == null || cons == null) return true; // ignore missing
  if (typeof cons.gte === 'number' && !(value >= cons.gte)) return false;
  if (typeof cons.lte === 'number' && !(value <= cons.lte)) return false;
  if (typeof cons.gt === 'number' && !(value > cons.gt)) return false;
  if (typeof cons.lt === 'number' && !(value < cons.lt)) return false;
  return true;
}

function evaluateSLOs(slo, overall, byLabel) {
  const breaches = [];
  // Global
  if (!evalConstraint(overall.error_percentage, slo.global?.error_rate_pct))
    breaches.push({
      scope: 'global',
      metric: 'error_rate_pct',
      value: overall.error_percentage,
      rule: slo.global?.error_rate_pct,
    });
  if (!evalConstraint(overall.p95_response_time, slo.global?.p95_ms))
    breaches.push({
      scope: 'global',
      metric: 'p95_ms',
      value: overall.p95_response_time,
      rule: slo.global?.p95_ms,
    });
  if (!evalConstraint(overall.throughput, slo.global?.throughput_rps))
    breaches.push({
      scope: 'global',
      metric: 'throughput_rps',
      value: overall.throughput,
      rule: slo.global?.throughput_rps,
    });

  // Per label
  Object.entries(slo.labels || {}).forEach(([label, rules]) => {
    const m = byLabel[label];
    if (!m) return;
    if (!evalConstraint(m.error_percentage, rules.error_rate_pct))
      breaches.push({
        scope: 'label',
        label,
        metric: 'error_rate_pct',
        value: m.error_percentage,
        rule: rules.error_rate_pct,
      });
    if (!evalConstraint(m.p95_response_time, rules.p95_ms))
      breaches.push({
        scope: 'label',
        label,
        metric: 'p95_ms',
        value: m.p95_response_time,
        rule: rules.p95_ms,
      });
    if (!evalConstraint(m.throughput, rules.throughput_rps))
      breaches.push({
        scope: 'label',
        label,
        metric: 'throughput_rps',
        value: m.throughput,
        rule: rules.throughput_rps,
      });
  });

  const status = breaches.length === 0 ? 'PASS' : 'FAIL';
  return { status, breaches };
}

async function parseJtl(filePath, options = {}) {
  const sloPath =
    options.sloPath || path.resolve(process.cwd(), 'config/performance/jmeter-slo.json');
  const slo = loadSloConfig(sloPath);

  // We may need to detect header presence. We'll do a small peek.
  const firstBytes =
    fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).split(/\r?\n/)[0] || '';
  const hasHeader =
    firstBytes.toLowerCase().includes('timestamp') ||
    firstBytes.toLowerCase().includes('timeStamp'.toLowerCase());

  const parserOptsBase = {
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    rtrim: true,
    ltrim: true,
    relax_column_count: true,
  };

  const parser = parse({
    ...parserOptsBase,
    columns: hasHeader ? true : DEFAULT_COLUMNS,
  });

  const rs = fs.createReadStream(filePath);
  const overallAgg = initAgg();
  const perLabelAgg = new Map();

  await new Promise((resolve, reject) => {
    parser.on('readable', () => {
      let rec;
      while ((rec = parser.read())) {
        // Normalize record keys if no header present (csv-parse will map by DEFAULT_COLUMNS)
        const label = rec.label || rec.lbl || 'UNNAMED';
        updateAgg(overallAgg, rec);
        if (!perLabelAgg.has(label)) perLabelAgg.set(label, initAgg());
        updateAgg(perLabelAgg.get(label), rec);
      }
    });
    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve());
    rs.pipe(parser);
  });

  const overall = finalizeAgg('OVERALL', overallAgg);
  const byLabel = {};
  for (const [label, agg] of perLabelAgg.entries()) {
    byLabel[label] = finalizeAgg(label, agg);
  }

  const sloEval = evaluateSLOs(slo, overall, byLabel);

  const summary = {
    testPlan: path
      .basename(filePath)
      .replace(/-results\.jtl$/i, '')
      .replace(/\.jtl$/i, ''),
    summary: {
      total_samples: overall.samples,
      error_count: overall.errors,
      error_percentage: overall.error_percentage,
      average_response_time: overall.average_response_time,
      min_response_time: overall.min_response_time,
      max_response_time: overall.max_response_time,
      p90_response_time: overall.p90_response_time,
      p95_response_time: overall.p95_response_time,
      p99_response_time: overall.p99_response_time,
      throughput: overall.throughput,
      received_kb_per_sec: overall.received_kb_per_sec,
      sent_kb_per_sec: overall.sent_kb_per_sec,
      duration_seconds: overall.duration_seconds,
      status: sloEval.status,
    },
    transactions: Object.values(byLabel).map((m) => ({
      name: m.name,
      samples: m.samples,
      errors: m.errors,
      error_percentage: m.error_percentage,
      avg_time: m.average_response_time,
      min_time: m.min_response_time,
      max_time: m.max_response_time,
      p90: m.p90_response_time,
      p95: m.p95_response_time,
      p99: m.p99_response_time,
      throughput: m.throughput,
      received_kb_per_sec: m.received_kb_per_sec,
      sent_kb_per_sec: m.sent_kb_per_sec,
      duration_seconds: m.duration_seconds,
    })),
    slo: {
      status: sloEval.status,
      breaches: sloEval.breaches,
      config: slo,
    },
  };

  return summary;
}

module.exports = { parseJtl };
