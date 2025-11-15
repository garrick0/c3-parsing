/**
 * PerformanceMonitor - Tracks and reports performance metrics
 */

export interface ParseMetrics {
  file: string;
  duration: number;
  nodeCount: number;
  edgeCount: number;
  cacheHit?: boolean;
  timestamp: number;
}

export interface PerformanceSummary {
  totalFiles: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalNodes: number;
  totalEdges: number;
  cacheHitRate: number;
  filesPerSecond: number;
}

export class PerformanceMonitor {
  private metrics: ParseMetrics[] = [];
  private startTime: number = 0;

  /**
   * Start monitoring session
   */
  start(): void {
    this.startTime = performance.now();
    this.metrics = [];
  }

  /**
   * Record a parse operation
   */
  recordParse(metrics: Omit<ParseMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Get performance summary
   */
  getSummary(): PerformanceSummary {
    if (this.metrics.length === 0) {
      return {
        totalFiles: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalNodes: 0,
        totalEdges: 0,
        cacheHitRate: 0,
        filesPerSecond: 0
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const totalNodes = this.metrics.reduce((sum, m) => sum + m.nodeCount, 0);
    const totalEdges = this.metrics.reduce((sum, m) => sum + m.edgeCount, 0);

    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheHits / this.metrics.length;

    const elapsedTime = (performance.now() - this.startTime) / 1000; // seconds
    const filesPerSecond = this.metrics.length / elapsedTime;

    return {
      totalFiles: this.metrics.length,
      totalDuration,
      averageDuration: totalDuration / this.metrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalNodes,
      totalEdges,
      cacheHitRate,
      filesPerSecond
    };
  }

  /**
   * Get metrics for a specific file
   */
  getFileMetrics(filePath: string): ParseMetrics | undefined {
    return this.metrics.find(m => m.file === filePath);
  }

  /**
   * Get slowest files
   */
  getSlowestFiles(count: number = 10): ParseMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  /**
   * Get fastest files
   */
  getFastestFiles(count: number = 10): ParseMetrics[] {
    return [...this.metrics]
      .sort((a, b) => a.duration - b.duration)
      .slice(0, count);
  }

  /**
   * Get metrics in time range
   */
  getMetricsInRange(startTime: number, endTime: number): ParseMetrics[] {
    return this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.startTime = 0;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      metrics: this.metrics
    }, null, 2);
  }

  /**
   * Get percentile duration
   */
  getPercentileDuration(percentile: number): number {
    if (this.metrics.length === 0) return 0;

    const sorted = [...this.metrics].sort((a, b) => a.duration - b.duration);
    const index = Math.floor((percentile / 100) * sorted.length);

    return sorted[index]?.duration || 0;
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const summary = this.getSummary();

    return `
Performance Report
==================
Files Parsed: ${summary.totalFiles}
Total Duration: ${summary.totalDuration.toFixed(2)}ms
Average Duration: ${summary.averageDuration.toFixed(2)}ms
Min Duration: ${summary.minDuration.toFixed(2)}ms
Max Duration: ${summary.maxDuration.toFixed(2)}ms
P50 Duration: ${this.getPercentileDuration(50).toFixed(2)}ms
P95 Duration: ${this.getPercentileDuration(95).toFixed(2)}ms
P99 Duration: ${this.getPercentileDuration(99).toFixed(2)}ms

Total Nodes: ${summary.totalNodes}
Total Edges: ${summary.totalEdges}
Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(2)}%
Throughput: ${summary.filesPerSecond.toFixed(2)} files/sec
    `.trim();
  }
}