#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:5000';
const REQUESTS = Number(process.env.BENCH_REQUESTS || 50);
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY || 10);

const ENDPOINTS = [
  '/api/shop/items',
  '/api/shop/featured',
  '/api/dashboard-stats',
  '/player/browse-events'
];

async function timedFetch(url) {
  const start = process.hrtime.bigint();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;
  let cacheHeader = res.headers.get('x-cache') || 'N/A';
  try {
    await res.text();
  } catch (_) {
    // ignore parse/stream errors for benchmark mode
  }
  return { ms, status: res.status, cacheHeader };
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function runBatch(url, noCache) {
  const suffix = noCache ? (url.includes('?') ? '&nocache=1' : '?nocache=1') : '';
  const fullUrl = `${BASE_URL}${url}${suffix}`;

  // Warm-up for cached mode so subsequent calls are realistic cache-hit measurements.
  if (!noCache) {
    await timedFetch(fullUrl);
  }

  const jobs = Array.from({ length: REQUESTS }, () => fullUrl);
  const groups = chunk(jobs, CONCURRENCY);
  const samples = [];

  for (const group of groups) {
    const res = await Promise.all(group.map((u) => timedFetch(u)));
    samples.push(...res);
  }

  const avg = samples.reduce((s, x) => s + x.ms, 0) / samples.length;
  const p95 = samples
    .map((x) => x.ms)
    .sort((a, b) => a - b)[Math.floor(samples.length * 0.95) - 1] || avg;

  const hits = samples.filter((x) => x.cacheHeader === 'HIT').length;
  const misses = samples.filter((x) => x.cacheHeader === 'MISS').length;
  const ok = samples.filter((x) => x.status >= 200 && x.status < 300).length;

  return {
    url,
    mode: noCache ? 'nocache' : 'cache',
    requests: REQUESTS,
    concurrency: CONCURRENCY,
    avgMs: Number(avg.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    successRate: Number(((ok / samples.length) * 100).toFixed(2)),
    xCacheHit: hits,
    xCacheMiss: misses
  };
}

async function main() {
  const results = [];

  for (const endpoint of ENDPOINTS) {
    const noCache = await runBatch(endpoint, true);
    const cache = await runBatch(endpoint, false);
    const improvement = noCache.avgMs > 0
      ? Number((((noCache.avgMs - cache.avgMs) / noCache.avgMs) * 100).toFixed(2))
      : 0;

    results.push({ endpoint, noCache, cache, improvementPercent: improvement });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    requests: REQUESTS,
    concurrency: CONCURRENCY,
    results
  };

  const outDir = path.join(__dirname, '..', '..', 'docs', 'perf');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'redis-benchmark-latest.json'), JSON.stringify(payload, null, 2));

  const lines = [
    '# Redis Cache Benchmark (Reproducible)',
    '',
    `Generated at: ${payload.generatedAt}`,
    `Base URL: ${BASE_URL}`,
    `Requests per endpoint: ${REQUESTS}`,
    `Concurrency: ${CONCURRENCY}`,
    '',
    '| Endpoint | No Cache Avg (ms) | Cache Avg (ms) | Improvement % | HIT count | MISS count |',
    '|---|---:|---:|---:|---:|---:|',
    ...results.map((r) => `| ${r.endpoint} | ${r.noCache.avgMs} | ${r.cache.avgMs} | ${r.improvementPercent}% | ${r.cache.xCacheHit} | ${r.cache.xCacheMiss} |`),
    ''
  ];

  fs.writeFileSync(path.join(outDir, 'redis-benchmark-latest.md'), lines.join('\n'));

  console.log('Redis benchmark report generated at docs/perf/redis-benchmark-latest.md');
}

main().catch((err) => {
  console.error('Redis benchmark failed:', err);
  process.exit(1);
});
