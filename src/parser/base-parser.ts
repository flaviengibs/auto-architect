import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

/**
 * Base parser class with common functionality for all language parsers
 */
export abstract class BaseParser {
  protected abstract languageName: string;
  protected abstract fileExtensions: string[];

  /**
   * Parse a file and extract module information
   */
  abstract parse(filePath: string, content: string, projectPath: string): Module;

  /**
   * Common method to create a base module structure
   */
  protected createBaseModule(filePath: string, content: string): Partial<Module> {
    const lines = content.split('\n');
    return {
      name: this.getModuleName(filePath),
      path: filePath,
      dependencies: [],
      dependents: [],
      size: lines.length,
      complexity: 1,
      functions: [],
      classes: [],
      exports: [],
      imports: [],
      hasTests: this.isTestFile(filePath)
    };
  }

  /**
   * Extract module name from file path
   */
  protected getModuleName(filePath: string): string {
    return filePath
      .replace(/\\/g, '/')
      .replace(/\.(ts|tsx|js|jsx|py|java|go|cs|php|rb|rs|kt|kts|swift|c|h|cpp|cc|cxx|hpp|html|htm|vb|R|sql|pas|pp)$/, '');
  }

  /**
   * Check if file is a test file
   */
  protected isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /_test\./,
      /test_/,
      /\/tests?\//,
      /\/spec\//,
      /\/testthat\//,
      /Tests\.cs$/,
      /Test\.java$/
    ];
    return testPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Calculate cyclomatic complexity from content
   */
  protected calculateComplexity(content: string): number {
    const complexityPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*.*\s*:/g
    ];

    let complexity = 1;
    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Count parameters in a function signature
   */
  protected countParameters(signature: string): number {
    const paramMatch = signature.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1].trim()) {
      return 0;
    }
    return paramMatch[1].split(',').filter(p => p.trim()).length;
  }

  /**
   * Extract function name from signature
   */
  protected extractFunctionName(signature: string): string {
    const match = signature.match(/(?:function\s+)?(\w+)\s*\(/);
    return match ? match[1] : 'anonymous';
  }

  /**
   * Check if function is async
   */
  protected isAsyncFunction(signature: string): boolean {
    return /\basync\b/.test(signature) || /\bawait\b/.test(signature);
  }

  /**
   * Check if function/class is exported
   */
  protected isExported(line: string): boolean {
    return /\bexport\b/.test(line) || /\bpublic\b/.test(line);
  }

  /**
   * Extract imports from content
   */
  protected extractImports(content: string, importPattern: RegExp): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const matches = content.matchAll(importPattern);

    for (const match of matches) {
      const moduleName = match[1] || match[2] || '';
      if (moduleName) {
        imports.push({
          module: moduleName,
          isExternal: !moduleName.startsWith('.') && !moduleName.startsWith('/'),
          items: []
        });
      }
    }

    return imports;
  }

  /**
   * Extract exports from content
   */
  protected extractExports(content: string, exportPattern: RegExp): string[] {
    const exports: string[] = [];
    const matches = content.matchAll(exportPattern);

    for (const match of matches) {
      const exportName = match[1] || match[2] || '';
      if (exportName && !exports.includes(exportName)) {
        exports.push(exportName);
      }
    }

    return exports;
  }

  /**
   * Create a function info object
   */
  protected createFunctionInfo(
    name: string,
    signature: string,
    content: string,
    isExported: boolean
  ): FunctionInfo {
    return {
      name,
      complexity: this.calculateComplexity(content),
      lines: content.split('\n').length,
      parameters: this.countParameters(signature),
      isAsync: this.isAsyncFunction(signature),
      isExported
    };
  }

  /**
   * Create a class info object
   */
  protected createClassInfo(
    name: string,
    methods: number,
    properties: number,
    isExported: boolean,
    extendsClass?: string,
    implementsInterfaces: string[] = []
  ): ClassInfo {
    return {
      name,
      methods,
      properties,
      extends: extendsClass,
      implements: implementsInterfaces,
      isExported
    };
  }

  /**
   * Check if parser supports this file
   */
  canParse(filePath: string): boolean {
    return this.fileExtensions.some(ext => filePath.endsWith(ext));
  }
}
