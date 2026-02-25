import { DependencyGraph, Module } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class EnhancedMetricsAnalyzer {
  
  /**
   * Calculate dependency depth - how deep dependency chains go
   */
  calculateDependencyDepth(graph: DependencyGraph): { average: number; maximum: number; deepestChain: string[] } {
    const modules = Array.from(graph.modules.values());
    const depths: number[] = [];
    let deepestChain: string[] = [];
    let maxDepth = 0;

    modules.forEach(module => {
      const { depth, chain } = this.getMaxDepthFromModule(module.path, graph, new Set());
      depths.push(depth);
      
      if (depth > maxDepth) {
        maxDepth = depth;
        deepestChain = chain;
      }
    });

    const average = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

    return {
      average: Math.round(average * 100) / 100,
      maximum: maxDepth,
      deepestChain
    };
  }

  private getMaxDepthFromModule(
    modulePath: string,
    graph: DependencyGraph,
    visited: Set<string>,
    currentChain: string[] = []
  ): { depth: number; chain: string[] } {
    if (visited.has(modulePath)) {
      return { depth: 0, chain: currentChain };
    }

    visited.add(modulePath);
    const module = graph.modules.get(modulePath);
    
    if (!module || module.dependencies.length === 0) {
      return { depth: 0, chain: [...currentChain, modulePath] };
    }

    let maxDepth = 0;
    let longestChain: string[] = [...currentChain, modulePath];

    module.dependencies.forEach(dep => {
      const result = this.getMaxDepthFromModule(dep, graph, new Set(visited), [...currentChain, modulePath]);
      if (result.depth + 1 > maxDepth) {
        maxDepth = result.depth + 1;
        longestChain = result.chain;
      }
    });

    return { depth: maxDepth, chain: longestChain };
  }

  /**
   * Detect code duplication using simple token-based comparison
   */
  detectDuplication(graph: DependencyGraph, projectPath: string): {
    percentage: number;
    duplicatedBlocks: number;
    duplicatedLines: number;
  } {
    const modules = Array.from(graph.modules.values());
    const fileContents: Map<string, string[]> = new Map();
    
    // Read all files
    modules.forEach(module => {
      try {
        const fullPath = path.join(projectPath, module.path);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*'));
        fileContents.set(module.path, lines);
      } catch (e) {
        // Skip files that can't be read
      }
    });

    let duplicatedBlocks = 0;
    let duplicatedLines = 0;
    const totalLines = Array.from(fileContents.values()).reduce((sum, lines) => sum + lines.length, 0);
    const minBlockSize = 6; // Minimum lines to consider as duplication

    const files = Array.from(fileContents.entries());
    
    // Compare each pair of files
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const [path1, lines1] = files[i];
        const [path2, lines2] = files[j];
        
        const duplicates = this.findDuplicateBlocks(lines1, lines2, minBlockSize);
        duplicatedBlocks += duplicates.blocks;
        duplicatedLines += duplicates.lines;
      }
    }

    const percentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

    return {
      percentage: Math.round(percentage * 100) / 100,
      duplicatedBlocks,
      duplicatedLines
    };
  }

  private findDuplicateBlocks(
    lines1: string[],
    lines2: string[],
    minSize: number
  ): { blocks: number; lines: number } {
    let blocks = 0;
    let lines = 0;

    for (let i = 0; i <= lines1.length - minSize; i++) {
      for (let j = 0; j <= lines2.length - minSize; j++) {
        let matchLength = 0;
        
        while (
          i + matchLength < lines1.length &&
          j + matchLength < lines2.length &&
          lines1[i + matchLength] === lines2[j + matchLength]
        ) {
          matchLength++;
        }

        if (matchLength >= minSize) {
          blocks++;
          lines += matchLength;
          i += matchLength - 1; // Skip matched lines
          break;
        }
      }
    }

    return { blocks, lines };
  }

  /**
   * Categorize modules based on their role in the architecture
   */
  categorizeModules(graph: DependencyGraph): {
    core: number;
    feature: number;
    utility: number;
    test: number;
    config: number;
  } {
    const modules = Array.from(graph.modules.values());
    const categories = {
      core: 0,
      feature: 0,
      utility: 0,
      test: 0,
      config: 0
    };

    modules.forEach(module => {
      const category = this.determineModuleCategory(module, graph);
      module.category = category;
      categories[category]++;
    });

    return categories;
  }

  private determineModuleCategory(module: Module, graph: DependencyGraph): 'core' | 'feature' | 'utility' | 'test' | 'config' {
    const pathLower = module.path.toLowerCase();
    
    // Test files
    if (module.hasTests || 
        pathLower.includes('test') || 
        pathLower.includes('spec') ||
        pathLower.includes('__tests__')) {
      return 'test';
    }

    // Config files
    if (pathLower.includes('config') ||
        pathLower.includes('settings') ||
        pathLower.includes('.config.') ||
        pathLower.endsWith('.json') ||
        pathLower.endsWith('.yml') ||
        pathLower.endsWith('.yaml')) {
      return 'config';
    }

    // Utility modules - high fan-out, low fan-in
    if (module.dependents.length > 5 && module.dependencies.length < 3) {
      return 'utility';
    }

    // Core modules - high centrality (many dependents and dependencies)
    if (module.dependents.length > 3 && module.dependencies.length > 3) {
      return 'core';
    }

    // Feature modules - moderate dependencies
    return 'feature';
  }

  /**
   * Calculate fan-in and fan-out metrics
   */
  calculateFanMetrics(graph: DependencyGraph): { fanIn: number; fanOut: number } {
    const modules = Array.from(graph.modules.values());
    
    if (modules.length === 0) {
      return { fanIn: 0, fanOut: 0 };
    }

    const totalFanIn = modules.reduce((sum, m) => sum + m.dependents.length, 0);
    const totalFanOut = modules.reduce((sum, m) => sum + m.dependencies.length, 0);

    return {
      fanIn: Math.round((totalFanIn / modules.length) * 100) / 100,
      fanOut: Math.round((totalFanOut / modules.length) * 100) / 100
    };
  }

  /**
   * Calculate Lack of Cohesion of Methods (LCOM)
   */
  calculateLCOM(graph: DependencyGraph): number {
    const modules = Array.from(graph.modules.values());
    let totalLCOM = 0;
    let classCount = 0;

    modules.forEach(module => {
      module.classes.forEach(cls => {
        if (cls.methods > 1) {
          // Simplified LCOM: ratio of methods to properties
          // Higher LCOM = lower cohesion
          const lcom = cls.properties > 0 ? cls.methods / cls.properties : cls.methods;
          totalLCOM += lcom;
          classCount++;
        }
      });
    });

    return classCount > 0 ? Math.round((totalLCOM / classCount) * 100) / 100 : 0;
  }

  /**
   * Calculate afferent and efferent coupling
   */
  calculateCouplingMetrics(graph: DependencyGraph): { afferent: number; efferent: number } {
    const modules = Array.from(graph.modules.values());
    
    if (modules.length === 0) {
      return { afferent: 0, efferent: 0 };
    }

    // Afferent coupling (Ca): number of modules that depend on this module
    const totalAfferent = modules.reduce((sum, m) => sum + m.dependents.length, 0);
    
    // Efferent coupling (Ce): number of modules this module depends on
    const totalEfferent = modules.reduce((sum, m) => sum + m.dependencies.length, 0);

    return {
      afferent: Math.round((totalAfferent / modules.length) * 100) / 100,
      efferent: Math.round((totalEfferent / modules.length) * 100) / 100
    };
  }
}
