import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class VBParser {
  parse(filePath: string, content: string): Module {
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const hasTests = this.isTestFile(filePath);

    return {
      name: this.getModuleName(filePath),
      path: filePath,
      dependencies: imports.map(i => i.module),
      dependents: [],
      size: content.split('\n').length,
      complexity: this.calculateComplexity(content),
      functions,
      classes,
      exports,
      imports,
      hasTests
    };
  }

  private extractFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const functionRegex = /(?:Public|Private|Friend|Protected)?\s*(?:Shared\s+)?(?:Function|Sub)\s+(\w+)\s*\(([^)]*)\)/gi;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim()).length;
      const isExported = /Public/i.test(match[0]);

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync: /Async/i.test(match[0]),
        isExported
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:Public|Private)?\s*Class\s+(\w+)(?:\s+Inherits\s+(\w+))?(?:\s+Implements\s+([\w,\s]+))?/gi;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsClass = match[2];
      const implementsList = match[3] ? match[3].split(',').map(i => i.trim()) : [];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/(?:Function|Sub)\s+\w+/gi) || []).length;
      const properties = (classContent.match(/(?:Public|Private)\s+(?:Property|Dim)\s+\w+/gi) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: extendsClass,
        implements: implementsList,
        isExported: /Public/i.test(match[0])
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // Imports statements
    const importRegex = /Imports\s+([\w.]+)/gi;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const module = match[1];
      
      imports.push({
        module: module.replace(/\./g, '/'),
        isExternal: true,
        items: []
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Public classes and functions
    const publicRegex = /Public\s+(?:Class|Function|Sub)\s+(\w+)/gi;
    let match;

    while ((match = publicRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bIf\b/gi, /\bElseIf\b/gi, /\bFor\b/gi, /\bWhile\b/gi, /\bCase\b/gi, /\bCatch\b/gi, /\bAndAlso\b/gi, /\bOrElse\b/gi];
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });
    return complexity;
  }

  private calculateFunctionComplexity(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return this.calculateComplexity(functionContent);
  }

  private extractFunctionContent(content: string, startIndex: number): string {
    const lines = content.substring(startIndex).split('\n');
    let functionContent = '';
    let foundEnd = false;

    for (const line of lines) {
      functionContent += line + '\n';
      if (/End\s+(?:Function|Sub)/i.test(line)) {
        foundEnd = true;
        break;
      }
    }

    return foundEnd ? functionContent : '';
  }

  private extractClassContent(content: string, startIndex: number): string {
    const lines = content.substring(startIndex).split('\n');
    let classContent = '';

    for (const line of lines) {
      classContent += line + '\n';
      if (/End\s+Class/i.test(line)) break;
    }

    return classContent;
  }

  private getFunctionLines(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return functionContent.split('\n').length;
  }

  private isTestFile(filePath: string): boolean {
    return /test/i.test(filePath);
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.vb$/, '') || filePath;
  }
}
