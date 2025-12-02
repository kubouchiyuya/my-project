/**
 * API Usage Tracker - API使用量監視・制限システム
 * Anthropic Claude API の使用量をリアルタイムで追跡
 */

import * as fs from 'fs';
import * as path from 'path';

export interface APIUsageMetrics {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  requestId: string;
}

export interface APIUsageSummary {
  date: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  averageCostPerRequest: number;
  hourlyBreakdown: Record<string, { requests: number; costUSD: number }>;
}

export interface APIBudgetConfig {
  monthlyBudgetUSD: number;
  dailyBudgetUSD: number;
  warningThresholdPercent: number;
  emergencyThresholdPercent: number;
  costPerMTok: Record<string, number>; // Cost per 1M tokens by model
}

export class APIUsageTracker {
  private metricsDir: string;
  private currentMonth: string;
  private budgetConfig: APIBudgetConfig;
  private cache: APIUsageMetrics[] = [];

  constructor(
    metricsDir: string = '.ai/metrics/api-usage',
    budgetConfig: APIBudgetConfig = {
      monthlyBudgetUSD: 100,
      dailyBudgetUSD: 10,
      warningThresholdPercent: 70,
      emergencyThresholdPercent: 90,
      costPerMTok: {
        'claude-3-5-sonnet-20241022': 0.003, // Input: $3/1M, Output: $15/1M (avg)
        'claude-opus-4-20250514': 0.015, // Higher cost for Opus
        'claude-3-haiku-20250122': 0.00025, // Lower cost for Haiku
      },
    }
  ) {
    this.metricsDir = metricsDir;
    this.budgetConfig = budgetConfig;
    this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Ensure metrics directory exists
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    this.loadCacheFromDisk();
  }

  /**
   * Record a single API call
   */
  public recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    requestId: string
  ): void {
    const costPerMTok = this.budgetConfig.costPerMTok[model] || 0.003;
    const costUSD = (inputTokens + outputTokens) * (costPerMTok / 1000000);

    const metric: APIUsageMetrics = {
      timestamp: new Date().toISOString(),
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUSD,
      requestId,
    };

    this.cache.push(metric);
    this.saveToDisk(metric);
  }

  /**
   * Get usage summary for a specific date
   */
  public getUsageSummary(date: string = new Date().toISOString().slice(0, 10)): APIUsageSummary {
    const dayMetrics = this.cache.filter((m) => m.timestamp.startsWith(date));

    const hourlyBreakdown: Record<string, { requests: number; costUSD: number }> = {};

    for (const metric of dayMetrics) {
      const hour = metric.timestamp.slice(0, 13); // YYYY-MM-DDTHH
      if (!hourlyBreakdown[hour]) {
        hourlyBreakdown[hour] = { requests: 0, costUSD: 0 };
      }
      hourlyBreakdown[hour].requests += 1;
      hourlyBreakdown[hour].costUSD += metric.costUSD;
    }

    const totalCost = dayMetrics.reduce((sum, m) => sum + m.costUSD, 0);

    return {
      date,
      totalRequests: dayMetrics.length,
      totalInputTokens: dayMetrics.reduce((sum, m) => sum + m.inputTokens, 0),
      totalOutputTokens: dayMetrics.reduce((sum, m) => sum + m.outputTokens, 0),
      totalCostUSD: totalCost,
      averageCostPerRequest: dayMetrics.length > 0 ? totalCost / dayMetrics.length : 0,
      hourlyBreakdown,
    };
  }

  /**
   * Get monthly summary
   */
  public getMonthlyUsage(month: string = this.currentMonth): APIUsageSummary {
    const monthMetrics = this.cache.filter((m) => m.timestamp.startsWith(month));

    const hourlyBreakdown: Record<string, { requests: number; costUSD: number }> = {};

    for (const metric of monthMetrics) {
      const hour = metric.timestamp.slice(0, 13);
      if (!hourlyBreakdown[hour]) {
        hourlyBreakdown[hour] = { requests: 0, costUSD: 0 };
      }
      hourlyBreakdown[hour].requests += 1;
      hourlyBreakdown[hour].costUSD += metric.costUSD;
    }

    const totalCost = monthMetrics.reduce((sum, m) => sum + m.costUSD, 0);

    return {
      date: month,
      totalRequests: monthMetrics.length,
      totalInputTokens: monthMetrics.reduce((sum, m) => sum + m.inputTokens, 0),
      totalOutputTokens: monthMetrics.reduce((sum, m) => sum + m.outputTokens, 0),
      totalCostUSD: totalCost,
      averageCostPerRequest: monthMetrics.length > 0 ? totalCost / monthMetrics.length : 0,
      hourlyBreakdown,
    };
  }

  /**
   * Check if we're within budget
   */
  public checkBudgetStatus(): {
    status: 'OK' | 'WARNING' | 'EMERGENCY';
    monthlyUsed: number;
    monthlyBudget: number;
    percentUsed: number;
    remainingBudget: number;
  } {
    const monthlySummary = this.getMonthlyUsage();
    const percentUsed = (monthlySummary.totalCostUSD / this.budgetConfig.monthlyBudgetUSD) * 100;

    let status: 'OK' | 'WARNING' | 'EMERGENCY' = 'OK';
    if (percentUsed >= this.budgetConfig.emergencyThresholdPercent) {
      status = 'EMERGENCY';
    } else if (percentUsed >= this.budgetConfig.warningThresholdPercent) {
      status = 'WARNING';
    }

    return {
      status,
      monthlyUsed: monthlySummary.totalCostUSD,
      monthlyBudget: this.budgetConfig.monthlyBudgetUSD,
      percentUsed,
      remainingBudget: Math.max(0, this.budgetConfig.monthlyBudgetUSD - monthlySummary.totalCostUSD),
    };
  }

  /**
   * Check daily usage
   */
  public getDailyStatus(date: string = new Date().toISOString().slice(0, 10)): {
    status: 'OK' | 'WARNING' | 'EXCEEDED';
    dayUsed: number;
    dayBudget: number;
    percentUsed: number;
  } {
    const daySummary = this.getUsageSummary(date);
    const percentUsed = (daySummary.totalCostUSD / this.budgetConfig.dailyBudgetUSD) * 100;

    let status: 'OK' | 'WARNING' | 'EXCEEDED' = 'OK';
    if (percentUsed >= 100) {
      status = 'EXCEEDED';
    } else if (percentUsed >= this.budgetConfig.warningThresholdPercent) {
      status = 'WARNING';
    }

    return {
      status,
      dayUsed: daySummary.totalCostUSD,
      dayBudget: this.budgetConfig.dailyBudgetUSD,
      percentUsed,
    };
  }

  /**
   * Get formatted report
   */
  public getFormattedReport(): string {
    const budgetStatus = this.checkBudgetStatus();
    const dailyStatus = this.getDailyStatus();
    const monthlySummary = this.getMonthlyUsage();

    let report = '📊 API Usage Report\n';
    report += '═'.repeat(50) + '\n\n';

    report += '💰 Monthly Budget Status\n';
    report += `├─ Budget: $${budgetStatus.monthlyBudget.toFixed(2)}\n`;
    report += `├─ Used: $${budgetStatus.monthlyUsed.toFixed(2)} (${budgetStatus.percentUsed.toFixed(1)}%)\n`;
    report += `├─ Remaining: $${budgetStatus.remainingBudget.toFixed(2)}\n`;
    report += `└─ Status: ${this.getStatusEmoji(budgetStatus.status)} ${budgetStatus.status}\n\n`;

    report += '📅 Daily Budget Status (Today)\n';
    report += `├─ Budget: $${dailyStatus.dayBudget.toFixed(2)}\n`;
    report += `├─ Used: $${dailyStatus.dayUsed.toFixed(2)} (${dailyStatus.percentUsed.toFixed(1)}%)\n`;
    report += `└─ Status: ${this.getStatusEmoji(dailyStatus.status)} ${dailyStatus.status}\n\n`;

    report += '📈 Monthly Stats\n';
    report += `├─ Total Requests: ${monthlySummary.totalRequests}\n`;
    report += `├─ Input Tokens: ${monthlySummary.totalInputTokens.toLocaleString()}\n`;
    report += `├─ Output Tokens: ${monthlySummary.totalOutputTokens.toLocaleString()}\n`;
    report += `└─ Avg Cost/Request: $${monthlySummary.averageCostPerRequest.toFixed(4)}\n`;

    return report;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'OK':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'EMERGENCY':
      case 'EXCEEDED':
        return '🔴';
      default:
        return '❓';
    }
  }

  private saveToDisk(metric: APIUsageMetrics): void {
    const date = metric.timestamp.slice(0, 10);
    const filePath = path.join(this.metricsDir, `${date}.jsonl`);

    const line = JSON.stringify(metric) + '\n';
    fs.appendFileSync(filePath, line);
  }

  private loadCacheFromDisk(): void {
    const today = new Date().toISOString().slice(0, 10);
    const filePath = path.join(this.metricsDir, `${today}.jsonl`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (line.trim()) {
          try {
            this.cache.push(JSON.parse(line));
          } catch (e) {
            console.error(`Failed to parse metric line: ${line}`);
          }
        }
      }
    }
  }
}

// Singleton instance
let tracker: APIUsageTracker | null = null;

export function initializeTracker(
  metricsDir?: string,
  budgetConfig?: APIBudgetConfig
): APIUsageTracker {
  if (!tracker) {
    tracker = new APIUsageTracker(metricsDir, budgetConfig);
  }
  return tracker;
}

export function getTracker(): APIUsageTracker {
  if (!tracker) {
    tracker = new APIUsageTracker();
  }
  return tracker;
}
