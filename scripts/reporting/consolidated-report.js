#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const execDashboard = path.join(reportsDir, 'executive-dashboard.html');
const consolidatedDir = path.join(reportsDir, 'consolidated');
if (!fs.existsSync(consolidatedDir)) fs.mkdirSync(consolidatedDir, { recursive: true });

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Consolidated Test Dashboard</title>
<style>
body{font-family:Arial, sans-serif;margin:20px;color:#222}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.card{border:1px solid #ddd;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.card h2{margin:0 0 8px 0;font-size:18px}
pre{background:#f8f8f8;border:1px solid #eee;padding:8px;border-radius:4px;max-height:240px;overflow:auto}
</style>
</head>
<body>
<h1>Consolidated Test Dashboard</h1>
<div class="grid">
  <div class="card"><h2>Executive Summary</h2><p>See executive-dashboard.html if available.</p></div>
  <div class="card"><h2>Performance Data</h2><pre id="perf"></pre></div>
  <div class="card"><h2>API Performance</h2><pre id="api"></pre></div>
  <div class="card"><h2>Load Test Data</h2><pre id="load"></pre></div>
</div>
<script>
(async function(){
  const load = async (p, el) => {
    try { const r = await fetch(p); if (!r.ok) throw new Error(r.status); el.textContent = await r.text(); }
    catch(e){ el.textContent = 'Not found: ' + p; }
  };
  await load('../performance-data.json', document.getElementById('perf'));
  await load('../api-performance-data.json', document.getElementById('api'));
  await load('../load-test-data.json', document.getElementById('load'));
})();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(consolidatedDir, 'index.html'), html);
console.log('Wrote reports/consolidated/index.html');
