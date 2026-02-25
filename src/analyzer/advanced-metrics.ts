import { DependencyGraph, Module } from '../types';

export class AdvancedMetricsCalculator {
  calculateInstability(module: Module, graph: DependencyGraph): number {
    const efferent = module.dependencies.length; // Outgoing dependencies
    const afferent = module.dependents.length;   // Incoming dependencies
    
    const total = efferent + afferent;
    return total === 0 ? 0 : efferent / total;
  }

  calculateAbstractness(module: Module): number {
    const totalTypes = module.classes.length + module.functions.length;
    if (totalTypes === 0) return 0;
    
    // Count abstract elements (interfaces, abstract classes)
    const abstractCount = module.classes.filter(c => 
      c.implements.length > 0 || c.name.startsWith('I') || c.name.includes('Abstract')
    ).length;
    
    return abstractCount / totalTypes;
  }

  calculateDistanceFromMainSequence(instability: number, abstractness: number): number {
    // D = |A + I - 1|
    // Ideal is 0, worst is 1
    return Math.abs(abstractness + instability - 1);
  }

  calculateModularity(graph: DependencyGraph): number {
    // Based on community detection - simplified version
    const modules = Array.from(graph.modules.values());
    const totalModules = modules.length;
    
    if (totalModules === 0) return 100;

    // Calculate internal vs external edges
    let internalEdges = 0;
    let externalEdges = 0;

    graph.edges.forEach(edge => {
      const fromModule = graph.modules.get(edge.from);
      const toModule = graph.modules.get(edge.to);
      
      if (fromModule && toModule) {
        // Check if they're in the same "logical" group (simplified)
        const fromGroup = this.getModuleGroup(edge.from);
        const toGroup = this.getModuleGroup(edge.to);
        
        if (fromGroup === toGroup) {
          internalEdges++;
        } else {
          externalEdges++;
        }
      }
    });

    const totalEdges = internalEdges + externalEdges;
    return totalEdges === 0 ? 100 : (internalEdges / totalEdges) * 100;
  }

  calculateMaintainabilityIndex(module: Module): number {
    // Microsoft's Maintainability Index formula (simplified)
    const volume = Math.log2(module.size + 1) * module.size;
    const complexity = module.complexity;
    const linesOfCode = module.size;

    // MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
    const mi = 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode);
    
    // Normalize to 0-100
    return Math.max(0, Math.min(100, mi));
  }

  calculateTechnicalDebt(modules: Map<string, Module>, antiPatternCount: number): number {
    // Estimate in percentage of total codebase
    const totalLines = Array.from(modules.values()).reduce((sum, m) => sum + m.size, 0);
    const avgComplexity = Array.from(modules.values()).reduce((sum, m) => sum + m.complexity, 0) / modules.size;
    
    // Debt factors
    const complexityDebt = Math.max(0, (avgComplexity - 10) * 0.5);
    const antiPatternDebt = antiPatternCount * 0.3;
    const sizeDebt = totalLines > 10000 ? (totalLines - 10000) / 1000 : 0;

    return Math.min(100, complexityDebt + antiPatternDebt + sizeDebt);
  }

  identifyHotspots(modules: Map<string, Module>): string[] {
    const hotspots: Array<{ name: string; score: number }> = [];

    modules.forEach(module => {
      // Hotspot score based on complexity, size, and dependencies
      const score = 
        module.complexity * 2 +
        module.size / 10 +
        module.dependencies.length * 3 +
        module.dependents.length * 2;

      hotspots.push({ name: module.name, score });
    });

    // Return top 5 hotspots
    return hotspots
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(h => h.name);
  }

  calculateTestCoverage(modules: Map<string, Module>): number {
    const modulesArray = Array.from(modules.values());
    const testedModules = modulesArray.filter(m => m.hasTests).length;
    
    if (modulesArray.length === 0) return 0;
    
    // Simplified coverage calculation
    const basicCoverage = (testedModules / modulesArray.length) * 100;
    
    // Adjust based on actual coverage data if available
    const avgCoverage = modulesArray
      .filter(m => m.testCoverage !== undefined)
      .reduce((sum, m) => sum + (m.testCoverage || 0), 0) / modulesArray.length;

    return avgCoverage || basicCoverage;
  }

  private getModuleGroup(moduleName: string): string {
    // Extract logical group from module path
    const parts = moduleName.split('/');
    return parts[0] || 'root';
  }
}
