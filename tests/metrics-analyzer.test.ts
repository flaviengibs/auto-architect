import { MetricsAnalyzer } from '../src/analyzer/metrics-analyzer';
import { DependencyGraph, Module } from '../src/types';

describe('MetricsAnalyzer', () => {
  let analyzer: MetricsAnalyzer;

  beforeEach(() => {
    analyzer = new MetricsAnalyzer();
  });

  const createMockModule = (name: string, deps: string[] = [], size: number = 100): Module => ({
    name,
    path: `${name}.ts`,
    dependencies: deps,
    dependents: [],
    size,
    complexity: 10,
    functions: [],
    classes: [],
    exports: [],
    imports: [],
    hasTests: false
  });

  const createMockGraph = (modules: Module[]): DependencyGraph => {
    const moduleMap = new Map<string, Module>();
    const edges: Array<{ from: string; to: string }> = [];

    modules.forEach(module => {
      moduleMap.set(module.name, module);
      module.dependencies.forEach(dep => {
        edges.push({ from: module.name, to: dep });
      });
    });

    return { modules: moduleMap, edges };
  };

  describe('analyze', () => {
    it('should calculate basic metrics', () => {
      const modules = [
        createMockModule('a', ['b'], 100),
        createMockModule('b', [], 50),
        createMockModule('c', ['a', 'b'], 75)
      ];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.totalModules).toBe(3);
      expect(metrics.totalLines).toBe(225);
      expect(metrics.avgDependencies).toBeCloseTo(1, 1);
      expect(metrics.maxDependencies).toBe(2);
    });

    it('should calculate coupling', () => {
      const modules = [
        createMockModule('a', ['b', 'c']),
        createMockModule('b', ['c']),
        createMockModule('c', [])
      ];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.coupling).toBeGreaterThan(0);
      expect(metrics.coupling).toBeLessThanOrEqual(100);
    });

    it('should handle empty graph', () => {
      const graph: DependencyGraph = { modules: new Map(), edges: [] };

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.totalModules).toBe(0);
      expect(metrics.totalLines).toBe(0);
      expect(metrics.avgDependencies).toBe(0);
    });

    it('should calculate maintainability index', () => {
      const modules = [createMockModule('a', [], 100)];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.maintainabilityIndex).toBeGreaterThan(0);
      expect(metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
    });

    it('should identify hotspots', () => {
      const modules = [
        createMockModule('complex', [], 500),
        createMockModule('simple', [], 50)
      ];
      modules[0].complexity = 50;
      modules[1].complexity = 5;
      
      const graph = createMockGraph(modules);
      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.hotspots.length).toBeGreaterThan(0);
      expect(metrics.hotspots).toContain('complex');
    });
  });

  describe('edge cases', () => {
    it('should handle circular dependencies', () => {
      const modules = [
        createMockModule('a', ['b']),
        createMockModule('b', ['a'])
      ];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.totalModules).toBe(2);
      expect(metrics.coupling).toBeGreaterThan(0);
    });

    it('should handle isolated modules', () => {
      const modules = [
        createMockModule('isolated1', []),
        createMockModule('isolated2', []),
        createMockModule('isolated3', [])
      ];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.avgDependencies).toBe(0);
      expect(metrics.coupling).toBe(0);
    });

    it('should handle large dependency counts', () => {
      const deps = Array.from({ length: 50 }, (_, i) => `dep${i}`);
      const modules = [createMockModule('hub', deps)];
      const graph = createMockGraph(modules);

      const metrics = analyzer.analyze(graph, '/project');

      expect(metrics.maxDependencies).toBe(50);
    });
  });
});
