/**
 * Benchmark metrics collection utilities
 */

export class Metrics {
  constructor(name) {
    this.name = name;
    this.samples = [];
    this.memorySamples = [];
  }

  startSample() {
    return {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
    };
  }

  endSample(start, extra = {}) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    this.samples.push({
      duration: endTime - start.startTime,
      memoryDelta: endMemory.heapUsed - start.startMemory.heapUsed,
      ...extra,
    });
  }

  addSample(data) {
    this.samples.push(data);
  }

  getStats() {
    if (this.samples.length === 0) return null;

    const durations = this.samples.map((s) => s.duration).sort((a, b) => a - b);
    const payloadSizes = this.samples
      .filter((s) => s.payloadSize)
      .map((s) => s.payloadSize);

    return {
      name: this.name,
      count: this.samples.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        mean: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: durations[Math.floor(durations.length / 2)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
      },
      payloadSize:
        payloadSizes.length > 0
          ? {
              min: Math.min(...payloadSizes),
              max: Math.max(...payloadSizes),
              mean:
                payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length,
            }
          : null,
      memoryDelta: {
        mean:
          this.samples.reduce((a, b) => a + (b.memoryDelta || 0), 0) /
          this.samples.length,
      },
    };
  }

  toJSON() {
    return {
      ...this.getStats(),
      rawSamples: this.samples,
    };
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export async function warmup(fn, iterations = 10) {
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  global.gc?.();
}

export async function runBenchmark(name, fn, { iterations = 100, warmupIterations = 10 } = {}) {
  const metrics = new Metrics(name);

  await warmup(fn, warmupIterations);

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const result = await fn();
    metrics.endSample(start, {
      payloadSize: result?.payloadSize,
    });
  }

  return metrics;
}
