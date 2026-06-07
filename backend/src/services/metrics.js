/**
 * In-memory metrics store.
 * Replace with Prometheus/StatsD for production.
 */

const _counts = {};
const _latencies = {};
const MAX_SAMPLES = 1000;

function record(operation, latencyMs) {
  _counts[operation] = (_counts[operation] || 0) + 1;
  if (!_latencies[operation]) _latencies[operation] = [];
  _latencies[operation].push(latencyMs);
  // Keep last MAX_SAMPLES to prevent unbounded growth
  if (_latencies[operation].length > MAX_SAMPLES) {
    _latencies[operation] = _latencies[operation].slice(-MAX_SAMPLES);
  }
}

function getMetrics() {
  const avgLatency = {};
  const p95Latency = {};

  for (const [op, lats] of Object.entries(_latencies)) {
    if (!lats.length) continue;
    const sorted = [...lats].sort((a, b) => a - b);
    avgLatency[op] = parseFloat((lats.reduce((s, v) => s + v, 0) / lats.length).toFixed(2));
    p95Latency[op] = parseFloat(sorted[Math.floor(sorted.length * 0.95)].toFixed(2));
  }

  return {
    operationCounts: { ..._counts },
    averageLatencyMs: avgLatency,
    p95LatencyMs: p95Latency,
  };
}

/** Utility: returns elapsed ms since hrtime start */
function startTimer() {
  const start = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - start) / 1e6;
}

module.exports = { record, getMetrics, startTimer };
