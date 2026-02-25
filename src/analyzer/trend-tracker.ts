import { AnalysisReport, ArchitectureMetrics } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface TrendData {
  timestamp: string;
  metrics: ArchitectureMetrics;
  healthScore: number;
  issueCount: number;
}

export interface TrendAnalysis {
  current: TrendData;
  history: TrendData[];
  trends: {
    healthScore: TrendDirection;
    complexity: TrendDirection;
    coupling: TrendDirection;
    testCoverage: TrendDirection;
    technicalDebt: TrendDirection;
  };
  predictions: {
    healthScoreIn30Days: number;
    complexityIn30Days: number;
    recommendation: string;
  };
  alerts: TrendAlert[];
}

export interface TrendDirection {
  direction: 'improving' | 'stable' | 'degrading';
  change: number;
  changePercent: number;
}

export interface TrendAlert {
  type: 'warning' | 'critical';
  metric: string;
  message: string;
  threshold: number;
  actual: number;
}

export class TrendTracker {
  private historyFile: string;
  private maxHistorySize: number = 100;

  constructor(historyFile: string = '.auto-architect-history.json') {
    this.historyFile = historyFile;
  }

  /**
   * Save current analysis to history
   */
  saveToHistory(report: AnalysisReport): void {
    const history = this.loadHistory();
    
    const trendData: TrendData = {
      timestamp: new Date().toISOString(),
      metrics: report.metrics,
      healthScore: report.healthScore.overall,
      issueCount: report.antiPatterns.length
    };

    history.push(trendData);

    // Keep only last N entries
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  /**
   * Load history from file
   */
  loadHistory(): TrendData[] {
    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.historyFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Analyze trends
   */
  analyzeTrends(currentReport: AnalysisReport): TrendAnalysis {
    const history = this.loadHistory();
    
    if (history.length === 0) {
      return this.createInitialAnalysis(currentReport);
    }

    const current: TrendData = {
      timestamp: new Date().toISOString(),
      metrics: currentReport.metrics,
      healthScore: currentReport.healthScore.overall,
      issueCount: currentReport.antiPatterns.length
    };

    const trends = this.calculateTrends(current, history);
    const predictions = this.makePredictions(current, history);
    const alerts = this.generateAlerts(current, history);

    return {
      current,
      history,
      trends,
      predictions,
      alerts
    };
  }

  /**
   * Calculate trend directions
   */
  private calculateTrends(current: TrendData, history: TrendData[]): TrendAnalysis['trends'] {
    const previous = history[history.length - 1];
    
    return {
      healthScore: this.calculateTrendDirection(
        current.healthScore,
        previous.healthScore
      ),
      complexity: this.calculateTrendDirection(
        previous.metrics.cyclomaticComplexity,
        current.metrics.cyclomaticComplexity // Inverted: lower is better
      ),
      coupling: this.calculateTrendDirection(
        previous.metrics.coupling,
        current.metrics.coupling // Inverted: lower is better
      ),
      testCoverage: this.calculateTrendDirection(
        current.metrics.testCoverage,
        previous.metrics.testCoverage
      ),
      technicalDebt: this.calculateTrendDirection(
        previous.metrics.technicalDebt,
        current.metrics.technicalDebt // Inverted: lower is better
      )
    };
  }

  /**
   * Calculate trend direction for a metric
   */
  private calculateTrendDirection(current: number, previous: number): TrendDirection {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    let direction: 'improving' | 'stable' | 'degrading';
    
    if (Math.abs(changePercent) < 2) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'improving';
    } else {
      direction = 'degrading';
    }

    return {
      direction,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100
    };
  }

  /**
   * Make predictions using simple linear regression
   */
  private makePredictions(current: TrendData, history: TrendData[]): TrendAnalysis['predictions'] {
    const recentHistory = history.slice(-10); // Last 10 data points
    
    const healthScorePrediction = this.predictValue(
      recentHistory.map(h => h.healthScore),
      30 // 30 days ahead
    );

    const complexityPrediction = this.predictValue(
      recentHistory.map(h => h.metrics.cyclomaticComplexity),
      30
    );

    let recommendation = 'Continue current practices';
    
    if (healthScorePrediction < current.healthScore - 10) {
      recommendation = '⚠️ Quality is predicted to decline. Consider increasing test coverage and addressing technical debt.';
    } else if (healthScorePrediction > current.healthScore + 10) {
      recommendation = '✓ Quality is improving! Keep up the good work.';
    }

    return {
      healthScoreIn30Days: Math.round(healthScorePrediction),
      complexityIn30Days: Math.round(complexityPrediction * 100) / 100,
      recommendation
    };
  }

  /**
   * Simple linear regression prediction
   */
  private predictValue(values: number[], daysAhead: number): number {
    if (values.length < 2) {
      return values[values.length - 1] || 0;
    }

    // Calculate slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict
    const futureX = n + daysAhead;
    return slope * futureX + intercept;
  }

  /**
   * Generate alerts based on trends
   */
  private generateAlerts(current: TrendData, history: TrendData[]): TrendAlert[] {
    const alerts: TrendAlert[] = [];
    const recent = history.slice(-5);

    // Alert if health score is declining consistently
    if (recent.length >= 3) {
      const declining = recent.every((data, i) => 
        i === 0 || data.healthScore < recent[i - 1].healthScore
      );

      if (declining) {
        alerts.push({
          type: 'warning',
          metric: 'Health Score',
          message: 'Health score has been declining for the last 5 analyses',
          threshold: recent[0].healthScore,
          actual: current.healthScore
        });
      }
    }

    // Alert if complexity is increasing rapidly
    if (history.length > 0) {
      const previous = history[history.length - 1];
      const complexityIncrease = 
        ((current.metrics.cyclomaticComplexity - previous.metrics.cyclomaticComplexity) / 
        previous.metrics.cyclomaticComplexity) * 100;

      if (complexityIncrease > 20) {
        alerts.push({
          type: 'critical',
          metric: 'Cyclomatic Complexity',
          message: 'Complexity increased by more than 20% since last analysis',
          threshold: previous.metrics.cyclomaticComplexity,
          actual: current.metrics.cyclomaticComplexity
        });
      }
    }

    // Alert if test coverage is dropping
    if (history.length > 0) {
      const previous = history[history.length - 1];
      const coverageDrop = previous.metrics.testCoverage - current.metrics.testCoverage;

      if (coverageDrop > 10) {
        alerts.push({
          type: 'warning',
          metric: 'Test Coverage',
          message: `Test coverage dropped by ${coverageDrop.toFixed(1)}%`,
          threshold: previous.metrics.testCoverage,
          actual: current.metrics.testCoverage
        });
      }
    }

    return alerts;
  }

  /**
   * Create initial analysis when no history exists
   */
  private createInitialAnalysis(report: AnalysisReport): TrendAnalysis {
    const current: TrendData = {
      timestamp: new Date().toISOString(),
      metrics: report.metrics,
      healthScore: report.healthScore.overall,
      issueCount: report.antiPatterns.length
    };

    return {
      current,
      history: [],
      trends: {
        healthScore: { direction: 'stable', change: 0, changePercent: 0 },
        complexity: { direction: 'stable', change: 0, changePercent: 0 },
        coupling: { direction: 'stable', change: 0, changePercent: 0 },
        testCoverage: { direction: 'stable', change: 0, changePercent: 0 },
        technicalDebt: { direction: 'stable', change: 0, changePercent: 0 }
      },
      predictions: {
        healthScoreIn30Days: current.healthScore,
        complexityIn30Days: current.metrics.cyclomaticComplexity,
        recommendation: 'First analysis - no trend data available yet'
      },
      alerts: []
    };
  }

  /**
   * Generate trend report
   */
  generateTrendReport(analysis: TrendAnalysis): string {
    let report = '\n📈 Code quality trends\n\n';

    // Current status
    report += `Current health score: ${analysis.current.healthScore}/100\n`;
    report += `Total issues: ${analysis.current.issueCount}\n\n`;

    // Trends
    report += 'Trends:\n';
    report += `  Health score: ${this.formatTrend(analysis.trends.healthScore)}\n`;
    report += `  Complexity: ${this.formatTrend(analysis.trends.complexity)}\n`;
    report += `  Coupling: ${this.formatTrend(analysis.trends.coupling)}\n`;
    report += `  Test coverage: ${this.formatTrend(analysis.trends.testCoverage)}\n`;
    report += `  Technical debt: ${this.formatTrend(analysis.trends.technicalDebt)}\n\n`;

    // Predictions
    if (analysis.history.length > 0) {
      report += 'Predictions (30 days):\n';
      report += `  Health score: ${analysis.predictions.healthScoreIn30Days}/100\n`;
      report += `  Complexity: ${analysis.predictions.complexityIn30Days}\n`;
      report += `  ${analysis.predictions.recommendation}\n\n`;
    }

    // Alerts
    if (analysis.alerts.length > 0) {
      report += 'Alerts:\n';
      analysis.alerts.forEach(alert => {
        const icon = alert.type === 'critical' ? '🔴' : '⚠️';
        report += `  ${icon} ${alert.message}\n`;
      });
    }

    return report;
  }

  /**
   * Format trend for display
   */
  private formatTrend(trend: TrendDirection): string {
    const arrow = trend.direction === 'improving' ? '↗' : 
                  trend.direction === 'degrading' ? '↘' : '→';
    const sign = trend.change > 0 ? '+' : '';
    return `${arrow} ${sign}${trend.change} (${sign}${trend.changePercent}%)`;
  }
}
