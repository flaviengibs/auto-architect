import { ArchitectureMetrics, AnalysisReport } from '../types';

export interface BenchmarkData {
  projectType: 'web-app' | 'api' | 'library' | 'cli' | 'mobile' | 'microservice';
  language: string;
  teamSize: 'small' | 'medium' | 'large';
  metrics: ArchitectureMetrics;
}

export interface ComparisonResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  percentile: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparison: {
    metric: string;
    yourValue: number;
    industryAverage: number;
    difference: number;
    status: 'above' | 'at' | 'below';
  }[];
}

export class ArchitectureComparator {
  private benchmarks: Map<string, BenchmarkData[]> = new Map();

  constructor() {
    this.loadBenchmarks();
  }

  /**
   * Compare project against industry benchmarks
   */
  compare(report: AnalysisReport, projectType: BenchmarkData['projectType']): ComparisonResult {
    const benchmarks = this.getBenchmarksForType(projectType);
    
    if (benchmarks.length === 0) {
      return this.createDefaultComparison(report);
    }

    const averages = this.calculateAverages(benchmarks);
    const comparison = this.compareMetrics(report.metrics, averages);
    const score = this.calculateRelativeScore(comparison);
    const percentile = this.calculatePercentile(report.metrics, benchmarks);

    return {
      score,
      grade: this.scoreToGrade(score),
      percentile,
      strengths: this.identifyStrengths(comparison),
      weaknesses: this.identifyWeaknesses(comparison),
      recommendations: this.generateRecommendations(comparison),
      comparison
    };
  }

  /**
   * Add a benchmark
   */
  addBenchmark(benchmark: BenchmarkData): void {
    const key = `${benchmark.projectType}-${benchmark.language}`;
    const existing = this.benchmarks.get(key) || [];
    existing.push(benchmark);
    this.benchmarks.set(key, existing);
  }

  /**
   * Get benchmarks for project type
   */
  private getBenchmarksForType(projectType: string): BenchmarkData[] {
    const allBenchmarks: BenchmarkData[] = [];
    
    for (const [key, benchmarks] of this.benchmarks) {
      if (key.startsWith(projectType)) {
        allBenchmarks.push(...benchmarks);
      }
    }

    return allBenchmarks;
  }

  /**
   * Calculate average metrics from benchmarks
   */
  private calculateAverages(benchmarks: BenchmarkData[]): ArchitectureMetrics {
    const sum = benchmarks.reduce((acc, b) => ({
      totalModules: acc.totalModules + b.metrics.totalModules,
      totalLines: acc.totalLines + b.metrics.totalLines,
      avgDependencies: acc.avgDependencies + b.metrics.avgDependencies,
      maxDependencies: acc.maxDependencies + b.metrics.maxDependencies,
      cyclomaticComplexity: acc.cyclomaticComplexity + b.metrics.cyclomaticComplexity,
      coupling: acc.coupling + b.metrics.coupling,
      cohesion: acc.cohesion + b.metrics.cohesion,
      instability: acc.instability + b.metrics.instability,
      abstractness: acc.abstractness + b.metrics.abstractness,
      distanceFromMainSequence: acc.distanceFromMainSequence + b.metrics.distanceFromMainSequence,
      modularity: acc.modularity + b.metrics.modularity,
      maintainabilityIndex: acc.maintainabilityIndex + b.metrics.maintainabilityIndex,
      technicalDebt: acc.technicalDebt + b.metrics.technicalDebt,
      testCoverage: acc.testCoverage + b.metrics.testCoverage,
      codeSmells: acc.codeSmells + b.metrics.codeSmells,
      hotspots: []
    }), {
      totalModules: 0,
      totalLines: 0,
      avgDependencies: 0,
      maxDependencies: 0,
      cyclomaticComplexity: 0,
      coupling: 0,
      cohesion: 0,
      instability: 0,
      abstractness: 0,
      distanceFromMainSequence: 0,
      modularity: 0,
      maintainabilityIndex: 0,
      technicalDebt: 0,
      testCoverage: 0,
      codeSmells: 0,
      hotspots: []
    });

    const count = benchmarks.length;
    
    return {
      totalModules: Math.round(sum.totalModules / count),
      totalLines: Math.round(sum.totalLines / count),
      avgDependencies: sum.avgDependencies / count,
      maxDependencies: Math.round(sum.maxDependencies / count),
      cyclomaticComplexity: sum.cyclomaticComplexity / count,
      coupling: sum.coupling / count,
      cohesion: sum.cohesion / count,
      instability: sum.instability / count,
      abstractness: sum.abstractness / count,
      distanceFromMainSequence: sum.distanceFromMainSequence / count,
      modularity: sum.modularity / count,
      maintainabilityIndex: sum.maintainabilityIndex / count,
      technicalDebt: sum.technicalDebt / count,
      testCoverage: sum.testCoverage / count,
      codeSmells: Math.round(sum.codeSmells / count),
      hotspots: []
    };
  }

  /**
   * Compare metrics
   */
  private compareMetrics(
    actual: ArchitectureMetrics,
    average: ArchitectureMetrics
  ): ComparisonResult['comparison'] {
    const metrics = [
      { name: 'Cyclomatic complexity', actual: actual.cyclomaticComplexity, avg: average.cyclomaticComplexity, lowerIsBetter: true },
      { name: 'Coupling', actual: actual.coupling, avg: average.coupling, lowerIsBetter: true },
      { name: 'Cohesion', actual: actual.cohesion, avg: average.cohesion, lowerIsBetter: false },
      { name: 'Maintainability index', actual: actual.maintainabilityIndex, avg: average.maintainabilityIndex, lowerIsBetter: false },
      { name: 'Test coverage', actual: actual.testCoverage, avg: average.testCoverage, lowerIsBetter: false },
      { name: 'Technical debt', actual: actual.technicalDebt, avg: average.technicalDebt, lowerIsBetter: true },
      { name: 'Modularity', actual: actual.modularity, avg: average.modularity, lowerIsBetter: false }
    ];

    return metrics.map(m => {
      const difference = m.actual - m.avg;
      let status: 'above' | 'at' | 'below';

      if (Math.abs(difference) < 2) {
        status = 'at';
      } else if (m.lowerIsBetter) {
        status = difference < 0 ? 'above' : 'below';
      } else {
        status = difference > 0 ? 'above' : 'below';
      }

      return {
        metric: m.name,
        yourValue: Math.round(m.actual * 100) / 100,
        industryAverage: Math.round(m.avg * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        status
      };
    });
  }

  /**
   * Calculate relative score
   */
  private calculateRelativeScore(comparison: ComparisonResult['comparison']): number {
    const aboveCount = comparison.filter(c => c.status === 'above').length;
    const atCount = comparison.filter(c => c.status === 'at').length;
    
    return Math.round(((aboveCount * 100 + atCount * 70) / comparison.length));
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(metrics: ArchitectureMetrics, benchmarks: BenchmarkData[]): number {
    const scores = benchmarks.map(b => 
      (b.metrics.maintainabilityIndex + b.metrics.cohesion + (100 - b.metrics.coupling)) / 3
    );
    
    const yourScore = (metrics.maintainabilityIndex + metrics.cohesion + (100 - metrics.coupling)) / 3;
    
    const betterThan = scores.filter(s => yourScore > s).length;
    return Math.round((betterThan / scores.length) * 100);
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(comparison: ComparisonResult['comparison']): string[] {
    return comparison
      .filter(c => c.status === 'above')
      .map(c => `${c.metric}: ${c.yourValue} vs industry avg ${c.industryAverage}`);
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(comparison: ComparisonResult['comparison']): string[] {
    return comparison
      .filter(c => c.status === 'below')
      .map(c => `${c.metric}: ${c.yourValue} vs industry avg ${c.industryAverage}`);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(comparison: ComparisonResult['comparison']): string[] {
    const recommendations: string[] = [];

    comparison.forEach(c => {
      if (c.status === 'below') {
        if (c.metric === 'Test coverage') {
          recommendations.push('Increase test coverage to match industry standards');
        } else if (c.metric === 'Maintainability index') {
          recommendations.push('Improve code maintainability through refactoring');
        } else if (c.metric === 'Cohesion') {
          recommendations.push('Improve module cohesion by grouping related functionality');
        }
      }
    });

    return recommendations;
  }

  /**
   * Convert score to grade
   */
  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Create default comparison when no benchmarks available
   */
  private createDefaultComparison(report: AnalysisReport): ComparisonResult {
    return {
      score: report.healthScore.overall,
      grade: report.healthScore.grade,
      percentile: 50,
      strengths: [],
      weaknesses: [],
      recommendations: ['No benchmark data available for comparison'],
      comparison: []
    };
  }

  /**
   * Load default benchmarks
   */
  private loadBenchmarks(): void {
    // Web app benchmarks
    this.addBenchmark({
      projectType: 'web-app',
      language: 'typescript',
      teamSize: 'medium',
      metrics: {
        totalModules: 150,
        totalLines: 15000,
        avgDependencies: 4,
        maxDependencies: 12,
        cyclomaticComplexity: 8,
        coupling: 25,
        cohesion: 75,
        instability: 0.4,
        abstractness: 0.2,
        distanceFromMainSequence: 0.4,
        modularity: 70,
        maintainabilityIndex: 70,
        technicalDebt: 15,
        testCoverage: 75,
        codeSmells: 20,
        hotspots: []
      }
    });

    // API benchmarks
    this.addBenchmark({
      projectType: 'api',
      language: 'typescript',
      teamSize: 'small',
      metrics: {
        totalModules: 50,
        totalLines: 5000,
        avgDependencies: 3,
        maxDependencies: 8,
        cyclomaticComplexity: 6,
        coupling: 20,
        cohesion: 80,
        instability: 0.3,
        abstractness: 0.3,
        distanceFromMainSequence: 0.4,
        modularity: 75,
        maintainabilityIndex: 75,
        technicalDebt: 10,
        testCoverage: 80,
        codeSmells: 10,
        hotspots: []
      }
    });

    // Library benchmarks
    this.addBenchmark({
      projectType: 'library',
      language: 'typescript',
      teamSize: 'small',
      metrics: {
        totalModules: 30,
        totalLines: 3000,
        avgDependencies: 2,
        maxDependencies: 5,
        cyclomaticComplexity: 5,
        coupling: 15,
        cohesion: 85,
        instability: 0.2,
        abstractness: 0.4,
        distanceFromMainSequence: 0.4,
        modularity: 80,
        maintainabilityIndex: 80,
        technicalDebt: 5,
        testCoverage: 90,
        codeSmells: 5,
        hotspots: []
      }
    });
  }
}
