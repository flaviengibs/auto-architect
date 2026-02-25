import { ArchitectureMetrics, AntiPattern, HealthScore, QualityGate } from '../types';

export class HealthScorer {
  calculateHealthScore(metrics: ArchitectureMetrics, antiPatterns: AntiPattern[]): HealthScore {
    const architecture = this.scoreArchitecture(metrics);
    const maintainability = this.scoreMaintainability(metrics);
    const testability = this.scoreTestability(metrics);
    const security = this.scoreSecurity(antiPatterns);
    const performance = this.scorePerformance(metrics);

    const overall = (architecture + maintainability + testability + security + performance) / 5;
    const grade = this.calculateGrade(overall);

    return {
      overall: Math.round(overall),
      architecture: Math.round(architecture),
      maintainability: Math.round(maintainability),
      testability: Math.round(testability),
      security: Math.round(security),
      performance: Math.round(performance),
      grade
    };
  }

  generateQualityGates(metrics: ArchitectureMetrics, antiPatterns: AntiPattern[]): QualityGate[] {
    const gates: QualityGate[] = [
      {
        name: 'Cyclomatic Complexity',
        passed: metrics.cyclomaticComplexity < 15,
        threshold: 15,
        actual: metrics.cyclomaticComplexity,
        severity: metrics.cyclomaticComplexity > 20 ? 'error' : 'warning'
      },
      {
        name: 'Coupling',
        passed: metrics.coupling < 30,
        threshold: 30,
        actual: metrics.coupling,
        severity: metrics.coupling > 40 ? 'error' : 'warning'
      },
      {
        name: 'Cohesion',
        passed: metrics.cohesion > 60,
        threshold: 60,
        actual: metrics.cohesion,
        severity: metrics.cohesion < 50 ? 'error' : 'warning'
      },
      {
        name: 'Test Coverage',
        passed: metrics.testCoverage > 70,
        threshold: 70,
        actual: metrics.testCoverage,
        severity: metrics.testCoverage < 50 ? 'error' : 'warning'
      },
      {
        name: 'Critical Anti-Patterns',
        passed: antiPatterns.filter(p => p.severity === 'critical').length === 0,
        threshold: 0,
        actual: antiPatterns.filter(p => p.severity === 'critical').length,
        severity: 'error'
      },
      {
        name: 'Maintainability Index',
        passed: metrics.maintainabilityIndex > 65,
        threshold: 65,
        actual: metrics.maintainabilityIndex,
        severity: metrics.maintainabilityIndex < 50 ? 'error' : 'warning'
      },
      {
        name: 'Technical Debt',
        passed: metrics.technicalDebt < 20,
        threshold: 20,
        actual: metrics.technicalDebt,
        severity: metrics.technicalDebt > 30 ? 'error' : 'warning'
      }
    ];

    // NEW: Add quality gates for enhanced metrics
    if (metrics.dependencyDepth) {
      gates.push({
        name: 'Dependency Depth',
        passed: metrics.dependencyDepth.maximum < 8,
        threshold: 8,
        actual: metrics.dependencyDepth.maximum,
        severity: metrics.dependencyDepth.maximum > 10 ? 'error' : 'warning'
      });
    }

    if (metrics.duplication) {
      gates.push({
        name: 'Code Duplication',
        passed: metrics.duplication.percentage < 10,
        threshold: 10,
        actual: metrics.duplication.percentage,
        severity: metrics.duplication.percentage > 20 ? 'error' : 'warning'
      });
    }

    if (metrics.lackOfCohesionMethods !== undefined) {
      gates.push({
        name: 'Lack of Cohesion (LCOM)',
        passed: metrics.lackOfCohesionMethods < 3,
        threshold: 3,
        actual: metrics.lackOfCohesionMethods,
        severity: metrics.lackOfCohesionMethods > 5 ? 'error' : 'warning'
      });
    }

    return gates;
  }

  private scoreArchitecture(metrics: ArchitectureMetrics): number {
    let score = 100;

    // Penalize high coupling
    if (metrics.coupling > 40) score -= 30;
    else if (metrics.coupling > 30) score -= 20;
    else if (metrics.coupling > 20) score -= 10;

    // Penalize low cohesion
    if (metrics.cohesion < 50) score -= 30;
    else if (metrics.cohesion < 60) score -= 20;
    else if (metrics.cohesion < 70) score -= 10;

    // Penalize poor modularity
    if (metrics.modularity < 50) score -= 20;
    else if (metrics.modularity < 70) score -= 10;

    // Reward good distance from main sequence
    if (metrics.distanceFromMainSequence < 0.2) score += 10;
    else if (metrics.distanceFromMainSequence > 0.5) score -= 20;

    // NEW: Penalize deep dependency chains
    if (metrics.dependencyDepth) {
      if (metrics.dependencyDepth.maximum > 10) score -= 20;
      else if (metrics.dependencyDepth.maximum > 7) score -= 10;
      else if (metrics.dependencyDepth.maximum > 5) score -= 5;
    }

    // NEW: Penalize high fan-out (too many dependencies)
    if (metrics.fanOut) {
      if (metrics.fanOut > 10) score -= 15;
      else if (metrics.fanOut > 7) score -= 10;
      else if (metrics.fanOut > 5) score -= 5;
    }

    // NEW: Reward balanced module categories
    if (metrics.moduleCategories) {
      const total = metrics.totalModules;
      const coreRatio = metrics.moduleCategories.core / total;
      const utilityRatio = metrics.moduleCategories.utility / total;
      
      // Ideal: 20-40% core, 20-40% utility
      if (coreRatio >= 0.2 && coreRatio <= 0.4) score += 5;
      if (utilityRatio >= 0.2 && utilityRatio <= 0.4) score += 5;
    }

    // NEW: Penalize high LCOM (lack of cohesion in methods)
    if (metrics.lackOfCohesionMethods) {
      if (metrics.lackOfCohesionMethods > 5) score -= 15;
      else if (metrics.lackOfCohesionMethods > 3) score -= 10;
      else if (metrics.lackOfCohesionMethods > 2) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreMaintainability(metrics: ArchitectureMetrics): number {
    let score = 100;

    // Use maintainability index as base
    score = metrics.maintainabilityIndex;

    // Adjust for complexity
    if (metrics.cyclomaticComplexity > 20) score -= 20;
    else if (metrics.cyclomaticComplexity > 15) score -= 10;

    // Adjust for technical debt
    score -= metrics.technicalDebt;

    // Adjust for code smells
    score -= Math.min(30, metrics.codeSmells * 2);

    // NEW: Penalize code duplication
    if (metrics.duplication) {
      if (metrics.duplication.percentage > 20) score -= 25;
      else if (metrics.duplication.percentage > 10) score -= 15;
      else if (metrics.duplication.percentage > 5) score -= 10;
    }

    // NEW: Consider cognitive complexity
    if (metrics.cognitiveComplexity) {
      if (metrics.cognitiveComplexity > 25) score -= 20;
      else if (metrics.cognitiveComplexity > 15) score -= 10;
      else if (metrics.cognitiveComplexity > 10) score -= 5;
    }

    // NEW: Penalize high efferent coupling
    if (metrics.efferentCoupling) {
      if (metrics.efferentCoupling > 8) score -= 15;
      else if (metrics.efferentCoupling > 5) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreTestability(metrics: ArchitectureMetrics): number {
    let score = metrics.testCoverage;

    // Penalize high coupling (makes testing harder)
    if (metrics.coupling > 30) score -= 20;
    else if (metrics.coupling > 20) score -= 10;

    // Penalize high complexity
    if (metrics.cyclomaticComplexity > 15) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private scoreSecurity(antiPatterns: AntiPattern[]): number {
    let score = 100;

    // Penalize based on anti-pattern severity
    antiPatterns.forEach(pattern => {
      switch (pattern.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private scorePerformance(metrics: ArchitectureMetrics): number {
    let score = 100;

    // Penalize complexity (affects runtime)
    if (metrics.cyclomaticComplexity > 20) score -= 25;
    else if (metrics.cyclomaticComplexity > 15) score -= 15;

    // Penalize tight coupling (affects load time)
    if (metrics.coupling > 40) score -= 20;
    else if (metrics.coupling > 30) score -= 10;

    // Hotspots indicate performance issues
    score -= Math.min(30, metrics.hotspots.length * 5);

    return Math.max(0, Math.min(100, score));
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
