import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class SwiftParser {
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
    const functionRegex = /(?:public|private|internal|fileprivate)?\s*(?:static\s+)?func\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim()).length;
      const isExported = !match[0].includes('private') && !match[0].includes('fileprivate');

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync: /async\s+func/.test(match[0]),
        isExported
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:public|private|internal|fileprivate)?\s*(class|struct|enum|protocol)\s+(\w+)(?:\s*:\s*([\w,\s]+))?/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const type = match[1];
      const name = match[2];
      const inheritance = match[3] ? match[3].split(',').map(i => i.trim()) : [];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/func\s+\w+/g) || []).length;
      const properties = (classContent.match(/(?:var|let)\s+\w+/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: inheritance[0],
        implements: inheritance.slice(1),
        isExported: !match[0].includes('private') && !match[0].includes('fileprivate')
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // import statements
    const importRegex = /import\s+(?:class|struct|enum|protocol|typealias|func|var|let)?\s*([\w.]+)/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const module = match[1];
      
      imports.push({
        module: module.replace(/\./g, '/'),
        isExternal: !module.startsWith('.'),
        items: [module.split('.').pop() || module]
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Public items
    const publicRegex = /(?:public|open)\s+(?:class|struct|enum|protocol|func|var|let)\s+(\w+)/g;
    let match;

    while ((match = publicRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\bguard\b/g, /\?\?/g, /\&\&/g, /\|\|/g];
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
    let braceCount = 0;
    let inFunction = false;
    let functionContent = '';

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      if (char === '{') {
        braceCount++;
        inFunction = true;
      }
      if (inFunction) functionContent += char;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inFunction) break;
      }
    }

    return functionContent;
  }

  private extractClassContent(content: string, startIndex: number): string {
    return this.extractFunctionContent(content, startIndex);
  }

  private getFunctionLines(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return functionContent.split('\n').length;
  }

  private isTestFile(filePath: string): boolean {
    return /test/i.test(filePath) || filePath.includes('Tests/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.swift$/, '') || filePath;
  }
}
