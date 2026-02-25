import { AnalysisReport, TrendAnalysis } from '../types';
import * as fs from 'fs';

export class TrendAnalyzer {
  analyzeTrends(currentReport: AnalysisReport, previousReportPath?: string): TrendAnalysis | undefined {
    if (!previousReportPath || !fs.existsSync(previousReportPath)) {
      return undefined;
    }

    try {
      const previousReport: AnalysisReport = JSON.parse(fs.readFileSync(previousReportPath, 'utf-8'));
      
      const improvements = this.findImprovements(currentReport, previousReport);
      const regressions = this.findRegressions(currentReport, previousReport);
      const metricsChange = this.calculateMetricsChange(currentReport, previousReport);

      return {
        previousReport,
        improvements,
        regressions,
        metricsChange
      };
    } catch (error) {
      console.warn('Could not load previous report for trend analysis');
      return undefined;
    }
  }

  private findImprovements(current: AnalysisReport, previous: AnalysisReport): string[] {
    const improvements: string[] = [];

    // Health score improvement
    if (current.healthScore.overall > previous.healthScore.overall) {
      const diff = current.healthScore.overall - previous.healthScore.overall;
      improvements.push(`Health score improved by ${diff} points (${previous.healthScore.overall} → ${current.healthScore.overall})`);
    }

    // Fewer anti-patterns
    if (current.antiPatterns.length < previous.antiPatterns.length) {
      const diff = previous.antiPatterns.length - current.antiPatterns.length;
      improvements.push(`Reduced ${diff} anti-patterns (${previous.antiPatterns.length} → ${current.antiPatterns.length})`);
    }

    // Better metrics
    if (current.metrics.coupling < previous.metrics.coupling) {
      const diff = (previous.metrics.coupling - current.metrics.coupling).toFixed(2);
      improvements.push(`Coupling reduced by ${diff}% (${previous.metrics.coupling.toFixed(2)}% → ${current.metrics.coupling.toFixed(2)}%)`);
    }

    if (current.metrics.cohesion > previous.metrics.cohesion) {
      const diff = (current.metrics.cohesion - previous.metrics.cohesion).toFixed(2);
      improvements.push(`Cohesion improved by ${diff}% (${previous.metrics.cohesion.toFixed(2)}% → ${current.metrics.cohesion.toFixed(2)}%)`);
    }

    if (current.metrics.testCoverage > previous.metrics.testCoverage) {
      const diff = (current.metrics.testCoverage - previous.metrics.testCoverage).toFixed(2);
      improvements.push(`Test coverage increased by ${diff}% (${previous.metrics.testCoverage.toFixed(2)}% → ${current.metrics.testCoverage.toFixed(2)}%)`);
    }

    if (current.metrics.technicalDebt < previous.metrics.technicalDebt) {
      const diff = (previous.metrics.technicalDebt - current.metrics.technicalDebt).toFixed(2);
      improvements.push(`Technical debt reduced by ${diff}% (${previous.metrics.technicalDebt.toFixed(2)}% → ${current.metrics.technicalDebt.toFixed(2)}%)`);
    }

    return improvements;
  }

  private findRegressions(current: AnalysisReport, previous: AnalysisReport): string[] {
    const regressions: string[] = [];

    // Health score regression
    if (current.healthScore.overall < previous.healthScore.overall) {
      const diff = previous.healthScore.overall - current.healthScore.overall;
      regressions.push(`Health score decreased by ${diff} points (${previous.healthScore.overall} → ${current.healthScore.overall})`);
    }

    // More anti-patterns
    if (current.antiPatterns.length > previous.antiPatterns.length) {
      const diff = current.antiPatterns.length - previous.antiPatterns.length;
      regressions.push(`Added ${diff} new anti-patterns (${previous.antiPatterns.length} → ${current.antiPatterns.length})`);
    }

    // Worse metrics
    if (current.metrics.coupling > previous.metrics.coupling) {
      const diff = (current.metrics.coupling - previous.metrics.coupling).toFixed(2);
      regressions.push(`Coupling increased by ${diff}% (${previous.metrics.coupling.toFixed(2)}% → ${current.metrics.coupling.toFixed(2)}%)`);
    }

    if (current.metrics.cohesion < previous.metrics.cohesion) {
      const diff = (previous.metrics.cohesion - current.metrics.cohesion).toFixed(2);
      regressions.push(`Cohesion decreased by ${diff}% (${previous.metrics.cohesion.toFixed(2)}% → ${current.metrics.cohesion.toFixed(2)}%)`);
    }

    if (current.metrics.cyclomaticComplexity > previous.metrics.cyclomaticComplexity) {
      const diff = (current.metrics.cyclomaticComplexity - previous.metrics.cyclomaticComplexity).toFixed(2);
      regressions.push(`Complexity increased by ${diff} (${previous.metrics.cyclomaticComplexity.toFixed(2)} → ${current.metrics.cyclomaticComplexity.toFixed(2)})`);
    }

    if (current.metrics.technicalDebt > previous.metrics.technicalDebt) {
      const diff = (current.metrics.technicalDebt - previous.metrics.technicalDebt).toFixed(2);
      regressions.push(`Technical debt increased by ${diff}% (${previous.metrics.technicalDebt.toFixed(2)}% → ${current.metrics.technicalDebt.toFixed(2)}%)`);
    }

    return regressions;
  }

  private calculateMetricsChange(current: AnalysisReport, previous: AnalysisReport): Record<string, number> {
    return {
      healthScore: current.healthScore.overall - previous.healthScore.overall,
      coupling: current.metrics.coupling - previous.metrics.coupling,
      cohesion: current.metrics.cohesion - previous.metrics.cohesion,
      complexity: current.metrics.cyclomaticComplexity - previous.metrics.cyclomaticComplexity,
      maintainability: current.metrics.maintainabilityIndex - previous.metrics.maintainabilityIndex,
      testCoverage: current.metrics.testCoverage - previous.metrics.testCoverage,
      technicalDebt: current.metrics.technicalDebt - previous.metrics.technicalDebt,
      antiPatterns: current.antiPatterns.length - previous.antiPatterns.length,
      codeSmells: current.metrics.codeSmells - previous.metrics.codeSmells
    };
  }

  generateTrendReport(trends: TrendAnalysis): string {
    let report = '\n📈 TREND ANALYSIS\n\n';

    if (trends.improvements.length > 0) {
      report += '✅ Improvements:\n';
      trends.improvements.forEach(imp => {
        report += `   • ${imp}\n`;
      });
      report += '\n';
    }

    if (trends.regressions.length > 0) {
      report += '⚠️  Regressions:\n';
      trends.regressions.forEach(reg => {
        report += `   • ${reg}\n`;
      });
      report += '\n';
    }

    if (trends.improvements.length === 0 && trends.regressions.length === 0) {
      report += '   No significant changes detected.\n\n';
    }

    return report;
  }
}
