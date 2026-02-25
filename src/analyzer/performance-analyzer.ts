import { Module, DependencyGraph } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceIssue {
  type: 'nested-loops' | 'recursive-call' | 'large-array-operation' | 'synchronous-io' | 'memory-leak-risk' | 'inefficient-regex';
  module: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  estimatedImpact: string;
}

export interface PerformanceMetrics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: PerformanceIssue[];
  hotspots: string[];
  score: number;
}

export class PerformanceAnalyzer {
  analyze(graph: DependencyGraph, projectPath: string): PerformanceMetrics {
    const issues: PerformanceIssue[] = [];

    for (const [moduleName, module] of graph.modules) {
      const moduleIssues = this.analyzeModule(module, projectPath);
      issues.push(...moduleIssues);
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    // Calculate performance score (0-100)
    const score = Math.max(0, 100 - (criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 2));

    // Identify hotspots (modules with most issues)
    const moduleIssueCount = new Map<string, number>();
    issues.forEach(issue => {
      moduleIssueCount.set(issue.module, (moduleIssueCount.get(issue.module) || 0) + 1);
    });

    const hotspots = Array.from(moduleIssueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([module]) => module);

    return {
      totalIssues: issues.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issues,
      hotspots,
      score
    };
  }

  private analyzeModule(module: Module, projectPath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const filePath = path.join(projectPath, module.path);

    if (!fs.existsSync(filePath)) {
      return issues;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Detect nested loops
    issues.push(...this.detectNestedLoops(content, module.name, lines));

    // Detect recursive calls
    issues.push(...this.detectRecursiveCalls(content, module.name, module.functions));

    // Detect large array operations
    issues.push(...this.detectLargeArrayOperations(content, module.name, lines));

    // Detect synchronous I/O
    issues.push(...this.detectSynchronousIO(content, module.name, lines));

    // Detect memory leak risks
    issues.push(...this.detectMemoryLeakRisks(content, module.name, lines));

    // Detect inefficient regex
    issues.push(...this.detectInefficientRegex(content, module.name, lines));

    return issues;
  }

  private detectNestedLoops(content: string, moduleName: string, lines: string[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const loopPatterns = /\b(for|while|forEach|map|filter|reduce)\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (loopPatterns.test(line)) {
        // Check for nested loops within next 20 lines
        let nestingLevel = 0;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (loopPatterns.test(lines[j])) {
            nestingLevel++;
          }
        }

        if (nestingLevel >= 2) {
          issues.push({
            type: 'nested-loops',
            module: moduleName,
            location: `Line ${i + 1}`,
            severity: nestingLevel >= 3 ? 'critical' : 'high',
            description: `Detected ${nestingLevel + 1}-level nested loops`,
            suggestion: 'Consider using hash maps, memoization, or breaking into separate functions',
            estimatedImpact: `O(n^${nestingLevel + 1}) complexity`
          });
        }
      }
    }

    return issues;
  }

  private detectRecursiveCalls(content: string, moduleName: string, functions: any[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    functions.forEach(func => {
      const funcPattern = new RegExp(`\\b${func.name}\\s*\\(`, 'g');
      const matches = content.match(funcPattern);

      if (matches && matches.length > 1) {
        // Function calls itself
        const hasMemoization = /memo|cache|Map|Set/.test(content);
        const hasBaseCase = /if.*return|switch.*return/.test(content);

        if (!hasMemoization && !hasBaseCase) {
          issues.push({
            type: 'recursive-call',
            module: moduleName,
            location: `Function ${func.name}`,
            severity: 'high',
            description: 'Recursive function without memoization or clear base case',
            suggestion: 'Add memoization or convert to iterative approach',
            estimatedImpact: 'Potential stack overflow or exponential time complexity'
          });
        }
      }
    });

    return issues;
  }

  private detectLargeArrayOperations(content: string, moduleName: string, lines: string[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const inefficientPatterns = [
      { pattern: /\.concat\(/g, name: 'concat in loop' },
      { pattern: /\.push\(.*\.shift\(\)/g, name: 'push/shift combination' },
      { pattern: /\.splice\(/g, name: 'splice operation' },
      { pattern: /\.sort\(.*\.sort\(/g, name: 'multiple sorts' }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      inefficientPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'large-array-operation',
            module: moduleName,
            location: `Line ${i + 1}`,
            severity: 'medium',
            description: `Inefficient array operation: ${name}`,
            suggestion: 'Use more efficient data structures or algorithms',
            estimatedImpact: 'O(n) or O(n²) operations on large arrays'
          });
        }
      });
    }

    return issues;
  }

  private detectSynchronousIO(content: string, moduleName: string, lines: string[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const syncIOPatterns = [
      'readFileSync',
      'writeFileSync',
      'readdirSync',
      'statSync',
      'existsSync'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      syncIOPatterns.forEach(pattern => {
        if (line.includes(pattern)) {
          issues.push({
            type: 'synchronous-io',
            module: moduleName,
            location: `Line ${i + 1}`,
            severity: 'high',
            description: `Synchronous I/O operation: ${pattern}`,
            suggestion: 'Use async/await with asynchronous I/O operations',
            estimatedImpact: 'Blocks event loop, reduces throughput'
          });
        }
      });
    }

    return issues;
  }

  private detectMemoryLeakRisks(content: string, moduleName: string, lines: string[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const leakPatterns = [
      { pattern: /setInterval\(/g, name: 'setInterval without clearInterval' },
      { pattern: /addEventListener\(/g, name: 'event listener without removal' },
      { pattern: /new\s+Array\(\d{6,}\)/g, name: 'large array allocation' },
      { pattern: /global\.|window\./g, name: 'global variable assignment' }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      leakPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          const hasClear = content.includes('clearInterval') || content.includes('removeEventListener');
          
          if (!hasClear && (name.includes('setInterval') || name.includes('event listener'))) {
            issues.push({
              type: 'memory-leak-risk',
              module: moduleName,
              location: `Line ${i + 1}`,
              severity: 'medium',
              description: `Potential memory leak: ${name}`,
              suggestion: 'Ensure proper cleanup of resources',
              estimatedImpact: 'Memory usage grows over time'
            });
          }
        }
      });
    }

    return issues;
  }

  private detectInefficientRegex(content: string, moduleName: string, lines: string[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const regexPattern = /\/(.+?)\/[gimuy]*/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(regexPattern);

      for (const match of matches) {
        const regex = match[1];
        
        // Check for catastrophic backtracking patterns
        if (/(\(.*\+.*\))+|\(.*\*.*\)+/.test(regex)) {
          issues.push({
            type: 'inefficient-regex',
            module: moduleName,
            location: `Line ${i + 1}`,
            severity: 'high',
            description: 'Regex with potential catastrophic backtracking',
            suggestion: 'Simplify regex or use atomic groups',
            estimatedImpact: 'Exponential time complexity on certain inputs'
          });
        }
      }
    }

    return issues;
  }
}
