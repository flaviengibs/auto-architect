import { DependencyGraph, AntiPattern } from '../types';

export class AntiPatternDetector {
  detect(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    patterns.push(...this.detectGodModules(graph));
    patterns.push(...this.detectCircularDependencies(graph));
    patterns.push(...this.detectTightCoupling(graph));
    patterns.push(...this.detectDeadCode(graph));
    patterns.push(...this.detectDivergentChange(graph));
    patterns.push(...this.detectInappropriateIntimacy(graph));

    return patterns.sort((a, b) => this.severityScore(b.severity) - this.severityScore(a.severity));
  }

  private detectGodModules(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    const avgDeps = Array.from(graph.modules.values())
      .reduce((sum, m) => sum + m.dependencies.length, 0) / graph.modules.size;

    graph.modules.forEach(module => {
      const depCount = module.dependencies.length;
      
      if (depCount > avgDeps * 2.5 && depCount > 8) {
        const severity = depCount > 20 ? 'critical' : depCount > 15 ? 'high' : 'medium';
        patterns.push({
          type: 'god-module',
          module: module.name,
          severity,
          description: `Module "${module.name}" has ${depCount} dependencies (avg: ${avgDeps.toFixed(1)})`,
          impact: `High centrality increases build complexity and maintenance burden`
        });
      }
    });

    return patterns;
  }

  private detectCircularDependencies(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const module = graph.modules.get(node);
      if (module) {
        for (const dep of module.dependencies) {
          if (!visited.has(dep)) {
            dfs(dep, [...path]);
          } else if (recStack.has(dep)) {
            const cycleStart = path.indexOf(dep);
            if (cycleStart !== -1) {
              cycles.push(path.slice(cycleStart));
            }
          }
        }
      }

      recStack.delete(node);
    };

    graph.modules.forEach((_, moduleName) => {
      if (!visited.has(moduleName)) {
        dfs(moduleName, []);
      }
    });

    cycles.forEach(cycle => {
      patterns.push({
        type: 'circular-dependency',
        module: cycle.join(' → '),
        severity: cycle.length > 3 ? 'high' : 'medium',
        description: `Circular dependency detected: ${cycle.join(' → ')}`,
        impact: `Prevents proper module isolation and complicates testing`
      });
    });

    return patterns;
  }

  private detectTightCoupling(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    const dependencyCount = new Map<string, number>();

    graph.edges.forEach(edge => {
      dependencyCount.set(edge.to, (dependencyCount.get(edge.to) || 0) + 1);
    });

    dependencyCount.forEach((count, moduleName) => {
      if (count > 10) {
        patterns.push({
          type: 'tight-coupling',
          module: moduleName,
          severity: count > 20 ? 'high' : 'medium',
          description: `Module "${moduleName}" is depended upon by ${count} other modules`,
          impact: `Changes to this module will ripple across ${count} dependents`
        });
      }
    });

    return patterns;
  }

  private severityScore(severity: string): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[severity as keyof typeof scores] || 0;
  }

  private detectDeadCode(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    graph.modules.forEach(module => {
      // Module with no dependents and not exported
      if (module.dependents.length === 0 && module.exports.length === 0) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'medium',
          description: `Module "${module.name}" is not used anywhere`,
          impact: `Increases codebase size and maintenance burden without providing value`,
          location: module.path,
          suggestion: 'Consider removing this module if it\'s truly unused'
        });
      }
      
      // Functions that are not exported and not used
      const unusedFunctions = module.functions.filter(f => !f.isExported);
      if (unusedFunctions.length > 3) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'low',
          description: `${unusedFunctions.length} private functions may be unused`,
          impact: `Dead code increases complexity and confusion`,
          location: module.path,
          suggestion: 'Review and remove unused private functions'
        });
      }
    });

    return patterns;
  }

  private detectDivergentChange(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    graph.modules.forEach(module => {
      // Module with many different types of dependencies suggests multiple responsibilities
      const externalDeps = module.imports.filter(imp => imp.isExternal);
      const uniqueCategories = new Set(externalDeps.map(dep => dep.module.split('/')[0]));
      
      if (uniqueCategories.size > 5 && module.functions.length > 10) {
        patterns.push({
          type: 'divergent-change',
          module: module.name,
          severity: 'medium',
          description: `Module uses ${uniqueCategories.size} different external library categories`,
          impact: `Module likely has multiple reasons to change, violating SRP`,
          location: module.path,
          suggestion: 'Split module by responsibility/concern'
        });
      }
    });

    return patterns;
  }

  private detectInappropriateIntimacy(graph: DependencyGraph): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    // Detect bidirectional dependencies (not circular, but mutual)
    const checked = new Set<string>();
    
    graph.modules.forEach(moduleA => {
      moduleA.dependencies.forEach(depName => {
        const moduleB = graph.modules.get(depName);
        if (moduleB && moduleB.dependencies.includes(moduleA.name)) {
          const pair = [moduleA.name, depName].sort().join('::');
          if (!checked.has(pair)) {
            checked.add(pair);
            patterns.push({
              type: 'inappropriate-intimacy',
              module: `${moduleA.name} ↔ ${depName}`,
              severity: 'medium',
              description: `Bidirectional dependency between "${moduleA.name}" and "${depName}"`,
              impact: `Modules are too tightly coupled, changes ripple between them`,
              suggestion: 'Extract shared logic to a third module or use dependency inversion'
            });
          }
        }
      });
    });

    return patterns;
  }

}
