#!/usr/bin/env node
/**
 * Aggregate k6 per-scenario JUnit XML files into a single suite for CI
 * - Scans reports/load-tests/k6/*-results.junit.xml
 * - Produces reports/load-tests/k6/combined-junit.xml
 */

const fs = require('fs');
const path = require('path');

function findJUnitFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('-results.junit.xml'))
    .map((f) => path.join(dir, f));
}

function parseAttributes(xml, tag) {
  const openTagIndex = xml.indexOf(`<${tag}`);
  if (openTagIndex === -1) return {};
  const endTagIndex = xml.indexOf('>', openTagIndex);
  const tagContent = xml.substring(openTagIndex + tag.length + 1, endTagIndex).trim();
  const attrs = {};
  // naive attribute parsing: key="value"
  for (const match of tagContent.matchAll(/(\w+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function stripXmlHeader(xml) {
  return xml.replace(/^<\?xml[^>]*>\s*/i, '');
}

function extractTestsuite(xml) {
  const start = xml.indexOf('<testsuite');
  const end = xml.lastIndexOf('</testsuite>');
  if (start === -1 || end === -1) return null;
  return xml.substring(start, end + '</testsuite>'.length);
}

function main() {
  const dir = path.resolve('reports/load-tests/k6');
  const outFile = path.join(dir, 'combined-junit.xml');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const files = findJUnitFiles(dir);
  if (files.length === 0) {
    console.log('No k6 JUnit files found to aggregate.');
    process.exit(0);
  }

  let totalTests = 0;
  let totalFailures = 0;
  const suites = [];

  for (const file of files) {
    const xml = fs.readFileSync(file, 'utf8');
    const cleaned = stripXmlHeader(xml);
    const suiteXml = extractTestsuite(cleaned);
    if (!suiteXml) continue;
    const attrs = parseAttributes(suiteXml, 'testsuite');
    const tests = parseInt(attrs.tests || '0', 10);
    const failures = parseInt(attrs.failures || '0', 10);
    totalTests += tests;
    totalFailures += failures;
    suites.push(suiteXml);
  }

  const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const rootOpen = `<testsuites name="k6" tests="${totalTests}" failures="${totalFailures}">`;
  const rootClose = '</testsuites>\n';
  const combined = header + rootOpen + suites.join('') + rootClose;
  fs.writeFileSync(outFile, combined, 'utf8');
  console.log(
    `Aggregated ${files.length} JUnit file(s) into ${outFile} (tests=${totalTests}, failures=${totalFailures}).`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Aggregation failed:', err);
    process.exit(1);
  }
}
