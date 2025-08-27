const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseJtl } = require('../jmeter-jtl-parser');

function writeTempJtl(rows) {
  const header =
    'timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect';
  const content = [header, ...rows].join('\n');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jtl-'));
  const file = path.join(dir, 'sample.jtl');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

function writeTempSlo(overrides = {}) {
  // Default: no gating so PASS tests are deterministic; tests that need FAIL pass strict overrides
  const defaultSlo = { global: {}, labels: {} };
  const slo = { ...defaultSlo, ...overrides };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slo-'));
  const file = path.join(dir, 'slo.json');
  fs.writeFileSync(file, JSON.stringify(slo, null, 2), 'utf8');
  return file;
}

describe('JMeter JTL Streaming Parser', () => {
  test('parses a small JTL and returns PASS when under SLOs', async () => {
    const baseTs = 1724760000000; // fixed epoch for determinism
    const rows = [
      `${baseTs},250,01 - Load Homepage,200,OK,Thread Group 1-1,text,true,,1024,256,1,1,https://example/,,0,89`,
      `${baseTs + 100},320,01 - Load Homepage,200,OK,Thread Group 1-1,text,true,,1024,256,1,1,https://example/,,0,80`,
      `${baseTs + 200},580,02 - Login,200,OK,Thread Group 1-1,text,true,,2048,512,1,1,https://example/login,,0,12`,
      `${baseTs + 300},420,03 - Browse Products,200,OK,Thread Group 1-1,text,true,,4096,256,1,1,https://example/inventory,,0,8`,
      `${baseTs + 400},650,04 - Add Product to Cart,200,OK,Thread Group 1-1,text,true,,1536,384,1,1,https://example/item,,0,15`,
      `${baseTs + 500},455,05 - View Cart,200,OK,Thread Group 1-1,text,true,,2560,256,1,1,https://example/cart,,0,5`,
    ];
    const file = writeTempJtl(rows);
    // Pass explicit no-gating SLO to guarantee PASS
    const summary = await parseJtl(file, { slo: { global: {}, labels: {} } });
    expect(summary).toBeTruthy();
    expect(summary.summary.total_samples).toBe(6);
    expect(summary.summary.error_count).toBe(0);
    expect(summary.summary.status).toBe('PASS');
    expect(summary.transactions.find((t) => t.name === '01 - Load Homepage')).toBeTruthy();
    // p95 should be <= 650 here
    expect(summary.summary.p95_response_time).toBeGreaterThanOrEqual(580);
    expect(summary.summary.p95_response_time).toBeLessThanOrEqual(700);
  });

  test('flags FAIL when p95 exceeds global SLO and per-label SLO', async () => {
    const baseTs = 1724761000000;
    const rows = [
      `${baseTs},1800,01 - Load Homepage,200,OK,Thread Group 1-1,text,true,,1024,256,1,1,https://example/,,0,89`,
      `${baseTs + 1000},2000,01 - Load Homepage,200,OK,Thread Group 1-1,text,true,,1024,256,1,1,https://example/,,0,80`,
      `${baseTs + 2000},2100,02 - Login,200,OK,Thread Group 1-1,text,true,,2048,512,1,1,https://example/login,,0,12`,
    ];
    const file = writeTempJtl(rows);
    // Strict overrides to trigger FAIL: tight global and per-label p95 bounds
    const sloPath = writeTempSlo({
      global: { p95_ms: { lte: 1000 } },
      labels: { '01 - Load Homepage': { p95_ms: { lte: 500 } } },
    });
    const summary = await parseJtl(file, { sloPath });
    expect(summary.summary.status).toBe('FAIL');
    const breaches = summary.slo.breaches || [];
    // Expect at least global p95 breach
    expect(breaches.some((b) => b.scope === 'global' && b.metric === 'p95_ms')).toBe(true);
    // Expect homepage per-label breach against 800ms p95
    expect(
      breaches.some(
        (b) => b.scope === 'label' && b.label === '01 - Load Homepage' && b.metric === 'p95_ms'
      )
    ).toBe(true);
  });
});
