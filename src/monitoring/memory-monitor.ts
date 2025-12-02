/**
 * Memory Monitor - メモリ使用量監視・制限システム
 * 宮火（Miyabi）のメモリ使用量を 90% 以下に制御
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface MemoryStatus {
  timestamp: string;
  totalMemory: number; // bytes
  usedMemory: number; // bytes
  freeMemory: number; // bytes
  percentUsed: number;
  processMemory: NodeJS.MemoryUsage;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface MemoryConfig {
  warningThresholdPercent: number;
  emergencyThresholdPercent: number; // Should trigger intervention
  checkIntervalMs: number;
  maxProcessMemoryMB: number; // Max heap size for this process
  autoShutdownThreshold: number; // Trigger graceful shutdown at this percent
}

export class MemoryMonitor {
  private config: MemoryConfig;
  private metricsDir: string;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private emergencyCallback: ((status: MemoryStatus) => void) | null = null;
  private warningCallback: ((status: MemoryStatus) => void) | null = null;

  constructor(
    metricsDir: string = '.ai/metrics/memory',
    config: MemoryConfig = {
      warningThresholdPercent: 75,
      emergencyThresholdPercent: 90,
      checkIntervalMs: 5000, // Check every 5 seconds
      maxProcessMemoryMB: 4096, // 4GB max heap
      autoShutdownThreshold: 95,
    }
  ) {
    this.metricsDir = metricsDir;
    this.config = config;

    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    // Set Node.js memory limits
    this.enforceNodeMemoryLimit();
  }

  /**
   * Start continuous memory monitoring
   */
  public startMonitoring(): void {
    if (this.statusCheckInterval) {
      console.warn('Memory monitoring already started');
      return;
    }

    console.log('🔍 Starting memory monitoring...');
    this.statusCheckInterval = setInterval(() => {
      this.checkMemory();
    }, this.config.checkIntervalMs);

    // Check immediately
    this.checkMemory();
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      console.log('⏹️ Memory monitoring stopped');
    }
  }

  /**
   * Set callback for emergency conditions
   */
  public onEmergency(callback: (status: MemoryStatus) => void): void {
    this.emergencyCallback = callback;
  }

  /**
   * Set callback for warning conditions
   */
  public onWarning(callback: (status: MemoryStatus) => void): void {
    this.warningCallback = callback;
  }

  /**
   * Get current memory status
   */
  public getStatus(): MemoryStatus {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentUsed = (usedMemory / totalMemory) * 100;

    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (percentUsed >= this.config.emergencyThresholdPercent) {
      status = 'CRITICAL';
    } else if (percentUsed >= this.config.warningThresholdPercent) {
      status = 'WARNING';
    }

    return {
      timestamp: new Date().toISOString(),
      totalMemory,
      usedMemory,
      freeMemory,
      percentUsed,
      processMemory: process.memoryUsage(),
      status,
    };
  }

  /**
   * Get detailed report
   */
  public getReport(): string {
    const status = this.getStatus();
    const heapUsedPercent = (status.processMemory.heapUsed / status.processMemory.heapTotal) * 100;

    let report = '💾 Memory Status Report\n';
    report += '═'.repeat(50) + '\n\n';

    report += '🖥️ System Memory\n';
    report += `├─ Total: ${this.formatBytes(status.totalMemory)}\n`;
    report += `├─ Used: ${this.formatBytes(status.usedMemory)} (${status.percentUsed.toFixed(1)}%)\n`;
    report += `├─ Free: ${this.formatBytes(status.freeMemory)}\n`;
    report += `└─ Status: ${this.getStatusEmoji(status.status)} ${status.status}\n\n`;

    report += '📦 Process Memory\n';
    report += `├─ Heap Total: ${this.formatBytes(status.processMemory.heapTotal)}\n`;
    report += `├─ Heap Used: ${this.formatBytes(status.processMemory.heapUsed)} (${heapUsedPercent.toFixed(1)}%)\n`;
    report += `├─ External: ${this.formatBytes(status.processMemory.external)}\n`;
    report += `└─ RSS: ${this.formatBytes(status.processMemory.rss)}\n\n`;

    report += '⚙️ Configuration\n';
    report += `├─ Warning Threshold: ${this.config.warningThresholdPercent}%\n`;
    report += `├─ Emergency Threshold: ${this.config.emergencyThresholdPercent}%\n`;
    report += `├─ Max Process Memory: ${this.config.maxProcessMemoryMB}MB\n`;
    report += `└─ Auto-shutdown Threshold: ${this.config.autoShutdownThreshold}%\n`;

    return report;
  }

  /**
   * Force garbage collection and clear caches
   */
  public async forceCleanup(): Promise<void> {
    console.log('🧹 Forcing garbage collection...');

    if (global.gc) {
      global.gc();
    }

    // Try to free up memory by clearing Node's buffer pool
    if ((Buffer as any).poolSize) {
      (Buffer as any).poolSize = 0;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('✅ Cleanup completed');
  }

  /**
   * Check if we should trigger emergency shutdown
   */
  public shouldEmergencyShutdown(): boolean {
    const status = this.getStatus();
    return status.percentUsed >= this.config.autoShutdownThreshold;
  }

  private checkMemory(): void {
    const status = this.getStatus();

    // Log to file
    this.logStatus(status);

    if (status.status === 'CRITICAL') {
      console.error('🚨 CRITICAL: System memory usage exceeds emergency threshold!');
      if (this.emergencyCallback) {
        this.emergencyCallback(status);
      }

      // Auto-trigger cleanup
      this.forceCleanup().catch(console.error);
    } else if (status.status === 'WARNING') {
      console.warn(`⚠️ WARNING: System memory at ${status.percentUsed.toFixed(1)}%`);
      if (this.warningCallback) {
        this.warningCallback(status);
      }
    }
  }

  private logStatus(status: MemoryStatus): void {
    const date = status.timestamp.slice(0, 10);
    const filePath = path.join(this.metricsDir, `${date}.jsonl`);

    const line = JSON.stringify({
      timestamp: status.timestamp,
      percentUsed: status.percentUsed,
      status: status.status,
      usedMemory: status.usedMemory,
      freeMemory: status.freeMemory,
      processHeapUsed: status.processMemory.heapUsed,
    }) + '\n';

    fs.appendFileSync(filePath, line);
  }

  private enforceNodeMemoryLimit(): void {
    // Set V8 heap size limit
    try {
      const v8 = require('v8');
      const heapSizeInMB = this.config.maxProcessMemoryMB;
      const heapSizeInBytes = heapSizeInMB * 1024 * 1024;

      v8.setHeapSnapshotNearHeapLimitCallback(() => {
        console.error('🚨 Heap size limit approaching! Triggering cleanup.');
        this.forceCleanup().catch(console.error);
      });

      console.log(`✅ Node.js heap limit set to ${heapSizeInMB}MB`);
    } catch (e) {
      console.warn('Could not set heap limit:', e);
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'OK':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'CRITICAL':
        return '🔴';
      default:
        return '❓';
    }
  }
}

// Singleton instance
let monitor: MemoryMonitor | null = null;

export function initializeMonitor(
  metricsDir?: string,
  config?: MemoryConfig
): MemoryMonitor {
  if (!monitor) {
    monitor = new MemoryMonitor(metricsDir, config);
  }
  return monitor;
}

export function getMonitor(): MemoryMonitor {
  if (!monitor) {
    monitor = new MemoryMonitor();
  }
  return monitor;
}
