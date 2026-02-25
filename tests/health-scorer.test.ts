import { HealthScorer } from '../src/analyzer/health-scorer';
import { ArchitectureMetrics, AntiPattern } from '../src/types';

describe('HealthScorer', () => {
  let scorer: HealthScorer;

  beforeEach(() => {
    scorer = new HealthScorer();
  });

  const createMockMetrics = (overrides: Partial<ArchitectureMetrics> = {}): ArchitectureMetrics => ({
    totalModules: 10,
    totalLines: 1000,
    avgDependencies: 3,
    maxDependencies: 8,
    cyclomaticComplexity: 10,
    coupling: 20,
    cohesion: 80,
    instability: 0.5,
    abstractness: 0.3,
    distanceFromMainSequence: 0.2,
    modularity: 70,
    maintainabilityIndex: 75,
    technicalDebt: 10,
    testCoverage: 80,
    codeSmells: 5,
    hotspots: [],
    ...overrides
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score for good metrics', () => {
      const metrics = createMockMetrics();
      const antiPatterns: AntiPattern[] = [];

      const score = scorer.calculateHealthScore(metrics, antiPatterns);

      expect(score.overall).toBeGreaterThan(50);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.grade).toMatch(/[A-F]/);
    });

    it('should penalize high complexity', () => {
      const goodMetrics = createMockMetrics({ cyclomaticComplexity: 5 });
      const badMetrics = createMockMetrics({ cyclomaticComplexity: 30 });

      const goodScore = scorer.calculateHealthScore(goodMetrics, []);
      const badScore = scorer.calculateHealthScore(badMetrics, []);

      expect(goodScore.overall).toBeGreaterThan(badScore.overall);
    });

    it('should penalize high coupling', () => {
      const goodMetrics = createMockMetrics({ coupling: 10 });
      const badMetrics = createMockMetrics({ coupling: 80 });

      const goodScore = scorer.calculateHealthScore(goodMetrics, []);
      const badScore = scorer.calculateHealthScore(badMetrics, []);

      expect(goodScore.overall).toBeGreaterThan(badScore.overall);
    });

    it('should reward high test coverage', () => {
      const goodMetrics = createMockMetrics({ testCoverage: 90 });
      const badMetrics = createMockMetrics({ testCoverage: 10 });

      const goodScore = scorer.calculateHealthScore(goodMetrics, []);
      const badScore = scorer.calculateHealthScore(badMetrics, []);

      expect(goodScore.overall).toBeGreaterThan(badScore.overall);
    });

    it('should penalize critical anti-patterns', () => {
      const metrics = createMockMetrics();
      const criticalPatterns: AntiPattern[] = [
        {
          type: 'god-module',
          module: 'test',
          severity: 'critical',
          description: 'Test',
          impact: 'High'
        }
      ];

      const scoreWithoutPatterns = scorer.calculateHealthScore(metrics, []);
      const scoreWithPatterns = scorer.calculateHealthScore(metrics, criticalPatterns);

      expect(scoreWithoutPatterns.overall).toBeGreaterThan(scoreWithPatterns.overall);
    });

    it('should assign correct grade', () => {
      const excellentMetrics = createMockMetrics({
        cyclomaticComplexity: 5,
        coupling: 10,
        cohesion: 90,
        testCoverage: 95,
        maintainabilityIndex: 90
      });

      const poorMetrics = createMockMetrics({
        cyclomaticComplexity: 40,
        coupling: 90,
        cohesion: 20,
        testCoverage: 10,
        maintainabilityIndex: 30
      });

      const excellentScore = scorer.calculateHealthScore(excellentMetrics, []);
      const poorScore = scorer.calculateHealthScore(poorMetrics, []);

      expect(['A', 'B']).toContain(excellentScore.grade);
      expect(['D', 'F']).toContain(poorScore.grade);
    });

    it('should calculate all dimension scores', () => {
      const metrics = createMockMetrics();
      const score = scorer.calculateHealthScore(metrics, []);

      expect(score.architecture).toBeGreaterThanOrEqual(0);
      expect(score.architecture).toBeLessThanOrEqual(100);
      expect(score.maintainability).toBeGreaterThanOrEqual(0);
      expect(score.maintainability).toBeLessThanOrEqual(100);
      expect(score.testability).toBeGreaterThanOrEqual(0);
      expect(score.testability).toBeLessThanOrEqual(100);
      expect(score.security).toBeGreaterThanOrEqual(0);
      expect(score.security).toBeLessThanOrEqual(100);
      expect(score.performance).toBeGreaterThanOrEqual(0);
      expect(score.performance).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const metrics = createMockMetrics({
        totalModules: 0,
        totalLines: 0,
        testCoverage: 0
      });

      const score = scorer.calculateHealthScore(metrics, []);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should handle extreme values', () => {
      const metrics = createMockMetrics({
        cyclomaticComplexity: 1000,
        coupling: 100,
        cohesion: 0
      });

      const score = scorer.calculateHealthScore(metrics, []);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.grade).toBe('F');
    });

    it('should handle many anti-patterns', () => {
      const metrics = createMockMetrics();
      const manyPatterns: AntiPattern[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'dead-code',
        module: `module${i}`,
        severity: 'low',
        description: 'Test',
        impact: 'Low'
      }));

      const score = scorer.calculateHealthScore(metrics, manyPatterns);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });
});
