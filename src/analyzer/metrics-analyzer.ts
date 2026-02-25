import { DependencyGraph, ArchitectureMetrics } from '../types';
import { AdvancedMetricsCalculator } from './advanced-metrics';
import { HalsteadAnalyzer } from './halstead-metrics';
import { CognitiveComplexityAnalyzer } from './cognitive-complexity';
import { EnhancedMetricsAnalyzer } from './enhanced-metrics';
import * as fs from 'fs';
import * as path from 'path';

export class MetricsAnalyzer {
  private advancedCalculator = new AdvancedMetricsCalculator();
  private halsteadAnalyzer = new HalsteadAnalyzer();
  private cognitiveAnalyzer = new CognitiveComplexityAnalyzer();
  private enhancedAnalyzer = new EnhancedMetricsAnalyzer();

  analyze(graph: DependencyGraph, projectPath?: string): ArchitectureMetrics {
    const modules = Array.from(graph.modules.values());
    const totalModules = modules.length;
    
    if (totalModules === 0) {
      return this.getEmptyMetrics();
    }

    const depCounts = modules.map(m => m.dependencies.length);
    const avgDependencies = depCounts.reduce((a, b) => a + b, 0) / totalModules;
    const maxDependencies = Math.max(...depCounts, 0);
    
    const totalComplexity = modules.reduce((sum, m) => sum + m.complexity, 0);
    const cyclomaticComplexity = totalComplexity / totalModules;
    
    const totalLines = modules.reduce((sum, m) => sum + m.size, 0);

    const coupling = this.calculateCoupling(graph);
    const cohesion = this.calculateCohesion(graph);
    
    // Advanced metrics
    const instability = this.calculateAverageInstability(graph);
    const abstractness = this.calculateAverageAbstractness(graph);
    const distanceFromMainSequence = this.advancedCalculator.calculateDistanceFromMainSequence(
      instability,
      abstractness
    );
    const modularity = this.advancedCalculator.calculateModularity(graph);
    
    const maintainabilityIndex = this.calculateAverageMaintainability(graph);
    const technicalDebt = this.advancedCalculator.calculateTechnicalDebt(graph.modules, 0);
    const testCoverage = this.advancedCalculator.calculateTestCoverage(graph.modules);
    const hotspots = this.advancedCalculator.identifyHotspots(graph.modules);
    
    // Calculate Halstead and Cognitive Complexity metrics
    const halsteadMetrics = projectPath ? this.calculateAverageHalstead(graph, projectPath) : null;
    const cognitiveComplexity = projectPath ? this.calculateAverageCognitiveComplexity(graph, projectPath) : null;
    
    // Calculate enhanced metrics
    const dependencyDepth = this.enhancedAnalyzer.calculateDependencyDepth(graph);
    const duplication = projectPath ? this.enhancedAnalyzer.detectDuplication(graph, projectPath) : null;
    const moduleCategories = this.enhancedAnalyzer.categorizeModules(graph);
    const fanMetrics = this.enhancedAnalyzer.calculateFanMetrics(graph);
    const lcom = this.enhancedAnalyzer.calculateLCOM(graph);
    const couplingMetrics = this.enhancedAnalyzer.calculateCouplingMetrics(graph);
    
    // Count code smells (will be updated by detector)
    const codeSmells = 0;

    return {
      totalModules,
      totalLines,
      avgDependencies: Math.round(avgDependencies * 100) / 100,
      maxDependencies,
      cyclomaticComplexity: Math.round(cyclomaticComplexity * 100) / 100,
      coupling: Math.round(coupling * 100) / 100,
      cohesion: Math.round(cohesion * 100) / 100,
      instability: Math.round(instability * 100) / 100,
      abstractness: Math.round(abstractness * 100) / 100,
      distanceFromMainSequence: Math.round(distanceFromMainSequence * 100) / 100,
      modularity: Math.round(modularity * 100) / 100,
      maintainabilityIndex: Math.round(maintainabilityIndex * 100) / 100,
      technicalDebt: Math.round(technicalDebt * 100) / 100,
      testCoverage: Math.round(testCoverage * 100) / 100,
      codeSmells,
      hotspots,
      halstead: halsteadMetrics ? {
        vocabulary: Math.round(halsteadMetrics.vocabulary),
        length: Math.round(halsteadMetrics.length),
        volume: Math.round(halsteadMetrics.volume * 100) / 100,
        difficulty: Math.round(halsteadMetrics.difficulty * 100) / 100,
        effort: Math.round(halsteadMetrics.effort * 100) / 100,
        time: Math.round(halsteadMetrics.time * 100) / 100,
        bugs: Math.round(halsteadMetrics.bugs * 1000) / 1000
      } : undefined,
      cognitiveComplexity: cognitiveComplexity ? Math.round(cognitiveComplexity * 100) / 100 : undefined,
      dependencyDepth,
      duplication: duplication || undefined,
      moduleCategories,
      fanIn: fanMetrics.fanIn,
      fanOut: fanMetrics.fanOut,
      lackOfCohesionMethods: lcom,
      afferentCoupling: couplingMetrics.afferent,
      efferentCoupling: couplingMetrics.efferent
    };
  }

  private getEmptyMetrics(): ArchitectureMetrics {
    return {
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
    };
  }

  private calculateAverageInstability(graph: DependencyGraph): number {
    const modules = Array.from(graph.modules.values());
    if (modules.length === 0) return 0;
    
    const totalInstability = modules.reduce((sum, module) => {
      return sum + this.advancedCalculator.calculateInstability(module, graph);
    }, 0);
    
    return totalInstability / modules.length;
  }

  private calculateAverageAbstractness(graph: DependencyGraph): number {
    const modules = Array.from(graph.modules.values());
    if (modules.length === 0) return 0;
    
    const totalAbstractness = modules.reduce((sum, module) => {
      return sum + this.advancedCalculator.calculateAbstractness(module);
    }, 0);
    
    return totalAbstractness / modules.length;
  }

  private calculateAverageMaintainability(graph: DependencyGraph): number {
    const modules = Array.from(graph.modules.values());
    if (modules.length === 0) return 0;
    
    const totalMI = modules.reduce((sum, module) => {
      return sum + this.advancedCalculator.calculateMaintainabilityIndex(module);
    }, 0);
    
    return totalMI / modules.length;
  }

  private calculateCoupling(graph: DependencyGraph): number {
    const n = graph.modules.size;
    if (n <= 1) return 0;
    
    const actualEdges = graph.edges.length;
    const maxPossibleEdges = n * (n - 1);
    
    return (actualEdges / maxPossibleEdges) * 100;
  }

  private calculateCohesion(graph: DependencyGraph): number {
    // Simplified cohesion: ratio of internal to external dependencies
    let internalDeps = 0;
    let totalDeps = 0;

    graph.modules.forEach(module => {
      totalDeps += module.dependencies.length;
      module.dependencies.forEach(dep => {
        if (graph.modules.has(dep)) {
          internalDeps++;
        }
      });
    });

    return totalDeps === 0 ? 100 : (internalDeps / totalDeps) * 100;
  }

  private calculateAverageHalstead(graph: DependencyGraph, projectPath: string): any {
    const modules = Array.from(graph.modules.values());
    if (modules.length === 0) return null;
    
    let totalVocabulary = 0;
    let totalLength = 0;
    let totalVolume = 0;
    let totalDifficulty = 0;
    let totalEffort = 0;
    let totalTime = 0;
    let totalBugs = 0;
    let count = 0;

    modules.forEach(module => {
      try {
        const fullPath = path.join(projectPath, module.path);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const metrics = this.halsteadAnalyzer.calculate(content);
        
        totalVocabulary += metrics.vocabulary;
        totalLength += metrics.length;
        totalVolume += metrics.volume;
        totalDifficulty += metrics.difficulty;
        totalEffort += metrics.effort;
        totalTime += metrics.time;
        totalBugs += metrics.bugs;
        count++;
      } catch (e) {
        // Skip files that can't be read
      }
    });

    if (count === 0) return null;

    return {
      vocabulary: totalVocabulary / count,
      length: totalLength / count,
      volume: totalVolume / count,
      difficulty: totalDifficulty / count,
      effort: totalEffort / count,
      time: totalTime / count,
      bugs: totalBugs / count
    };
  }

  private calculateAverageCognitiveComplexity(graph: DependencyGraph, projectPath: string): number | null {
    const modules = Array.from(graph.modules.values());
    if (modules.length === 0) return null;
    
    let totalComplexity = 0;
    let count = 0;

    modules.forEach(module => {
      try {
        const fullPath = path.join(projectPath, module.path);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const complexity = this.cognitiveAnalyzer.calculate(content);
        totalComplexity += complexity;
        count++;
      } catch (e) {
        // Skip files that can't be read
      }
    });

    return count === 0 ? null : totalComplexity / count;
  }
}
