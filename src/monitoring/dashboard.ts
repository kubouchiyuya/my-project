/**
 * Integrated Monitoring Dashboard
 * API使用量とメモリ使用量をリアルタイムで監視・制御
 */

import { APIUsageTracker, initializeTracker as initTracker } from './api-usage-tracker.js';
import { MemoryMonitor, initializeMonitor as initMonitor } from './memory-monitor.js';

export class MonitoringDashboard {
  private apiTracker: APIUsageTracker;
  private memoryMonitor: MemoryMonitor;
  private isRunning: boolean = false;
  private alertCallbacks: Array<(alert: Alert) => void> = [];

  constructor(apiTracker: APIUsageTracker, memoryMonitor: MemoryMonitor) {
    this.apiTracker = apiTracker;
    this.memoryMonitor = memoryMonitor;

    // Setup emergency callbacks
    this.memoryMonitor.onEmergency((status) => {
      this.emitAlert({
        type: 'CRITICAL',
        source: 'MEMORY',
        message: `System memory at ${status.percentUsed.toFixed(1)}% - CRITICAL!`,
        timestamp: new Date().toISOString(),
      });
    });

    this.memoryMonitor.onWarning((status) => {
      this.emitAlert({
        type: 'WARNING',
        source: 'MEMORY',
        message: `System memory at ${status.percentUsed.toFixed(1)}% - Warning threshold exceeded`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Start the dashboard
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Dashboard already running');
      return;
    }

    console.log('📊 Starting Monitoring Dashboard...');
    this.memoryMonitor.startMonitoring();
    this.isRunning = true;

    // Log initial report
    setTimeout(() => {
      console.log(this.memoryMonitor.getReport());
      console.log(this.apiTracker.getFormattedReport());
    }, 1000);
  }

  /**
   * Stop the dashboard
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ Stopping Monitoring Dashboard...');
    this.memoryMonitor.stopMonitoring();
    this.isRunning = false;
  }

  /**
   * Record an API call
   */
  public recordAPI(
    model: string,
    inputTokens: number,
    outputTokens: number,
    requestId: string
  ): void {
    this.apiTracker.recordUsage(model, inputTokens, outputTokens, requestId);

    const budgetStatus = this.apiTracker.checkBudgetStatus();
    if (budgetStatus.status === 'EMERGENCY') {
      this.emitAlert({
        type: 'CRITICAL',
        source: 'API_BUDGET',
        message: `API budget at ${budgetStatus.percentUsed.toFixed(1)}% - EMERGENCY!`,
        timestamp: new Date().toISOString(),
      });
    } else if (budgetStatus.status === 'WARNING') {
      this.emitAlert({
        type: 'WARNING',
        source: 'API_BUDGET',
        message: `API budget at ${budgetStatus.percentUsed.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get comprehensive status
   */
  public getFullStatus(): DashboardStatus {
    const memoryStatus = this.memoryMonitor.getStatus();
    const budgetStatus = this.apiTracker.checkBudgetStatus();
    const dailyStatus = this.apiTracker.getDailyStatus();

    return {
      timestamp: new Date().toISOString(),
      memory: {
        percentUsed: memoryStatus.percentUsed,
        status: memoryStatus.status,
        total: memoryStatus.totalMemory,
        used: memoryStatus.usedMemory,
        free: memoryStatus.freeMemory,
      },
      api: {
        monthly: {
          percentUsed: budgetStatus.percentUsed,
          status: budgetStatus.status,
          used: budgetStatus.monthlyUsed,
          budget: budgetStatus.monthlyBudget,
          remaining: budgetStatus.remainingBudget,
        },
        daily: {
          percentUsed: dailyStatus.percentUsed,
          status: dailyStatus.status,
          used: dailyStatus.dayUsed,
          budget: dailyStatus.dayBudget,
        },
      },
      isHealthy: memoryStatus.status === 'OK' && budgetStatus.status === 'OK',
    };
  }

  /**
   * Get formatted dashboard output
   */
  public getFormattedDashboard(): string {
    const status = this.getFullStatus();

    let dashboard = '🎋 MIYABI MONITORING DASHBOARD\n';
    dashboard += '═'.repeat(60) + '\n';
    dashboard += `📅 ${status.timestamp}\n\n`;

    dashboard += '💾 MEMORY STATUS\n';
    dashboard += '┌' + '─'.repeat(58) + '┐\n';
    dashboard += `│ ${this.getStatusBar('Memory', status.memory.percentUsed)} │\n`;
    dashboard += `│ ${this.padRight(`Usage: ${status.memory.percentUsed.toFixed(1)}% (${this.formatBytes(status.memory.used)} / ${this.formatBytes(status.memory.total)})`, 58)} │\n`;
    dashboard += `│ ${this.padRight(`Free: ${this.formatBytes(status.memory.free)}`, 58)} │\n`;
    dashboard += `│ ${this.padRight(`Status: ${this.getStatusEmoji(status.memory.status)} ${status.memory.status}`, 58)} │\n`;
    dashboard += '└' + '─'.repeat(58) + '┘\n\n';

    dashboard += '💰 API BUDGET (Monthly)\n';
    dashboard += '┌' + '─'.repeat(58) + '┐\n';
    dashboard += `│ ${this.getStatusBar('Budget', status.api.monthly.percentUsed)} │\n`;
    dashboard += `│ ${this.padRight(`Used: $${status.api.monthly.used.toFixed(2)} / $${status.api.monthly.budget.toFixed(2)} (${status.api.monthly.percentUsed.toFixed(1)}%)`, 58)} │\n`;
    dashboard += `│ ${this.padRight(`Remaining: $${status.api.monthly.remaining.toFixed(2)}`, 58)} │\n`;
    dashboard += `│ ${this.padRight(`Status: ${this.getStatusEmoji(status.api.monthly.status)} ${status.api.monthly.status}`, 58)} │\n`;
    dashboard += '└' + '─'.repeat(58) + '┘\n\n';

    dashboard += '📅 API BUDGET (Daily)\n';
    dashboard += '┌' + '─'.repeat(58) + '┐\n';
    dashboard += `│ ${this.getStatusBar('Daily', status.api.daily.percentUsed)} │\n`;
    dashboard += `│ ${this.padRight(`Used: $${status.api.daily.used.toFixed(2)} / $${status.api.daily.budget.toFixed(2)} (${status.api.daily.percentUsed.toFixed(1)}%)`, 58)} │\n`;
    dashboard += `│ ${this.padRight(`Status: ${this.getStatusEmoji(status.api.daily.status)} ${status.api.daily.status}`, 58)} │\n`;
    dashboard += '└' + '─'.repeat(58) + '┘\n\n';

    dashboard += `🏥 Overall Health: ${status.isHealthy ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}\n`;

    return dashboard;
  }

  /**
   * Register alert callback
   */
  public onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  private emitAlert(alert: Alert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (e) {
        console.error('Alert callback error:', e);
      }
    }
  }

  private getStatusBar(label: string, percent: number): string {
    const barWidth = 40;
    const filledWidth = Math.round((percent / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;

    let bar = `${label.padEnd(10)} │`;
    bar += '█'.repeat(filledWidth);
    bar += '░'.repeat(emptyWidth);
    bar += `│ ${percent.toFixed(1)}%`;

    return this.padRight(bar, 58);
  }

  private padRight(str: string, length: number): string {
    return str.padEnd(length);
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'OK':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'EMERGENCY':
      case 'EXCEEDED':
      case 'CRITICAL':
        return '🔴';
      default:
        return '❓';
    }
  }
}

export interface Alert {
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  source: 'MEMORY' | 'API_BUDGET';
  message: string;
  timestamp: string;
}

export interface DashboardStatus {
  timestamp: string;
  memory: {
    percentUsed: number;
    status: string;
    total: number;
    used: number;
    free: number;
  };
  api: {
    monthly: {
      percentUsed: number;
      status: string;
      used: number;
      budget: number;
      remaining: number;
    };
    daily: {
      percentUsed: number;
      status: string;
      used: number;
      budget: number;
    };
  };
  isHealthy: boolean;
}

/**
 * Initialize and get dashboard instance
 */
export function initializeDashboard(): MonitoringDashboard {
  const apiTracker = initTracker();
  const memoryMonitor = initMonitor();
  return new MonitoringDashboard(apiTracker, memoryMonitor);
}
