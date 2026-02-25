import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class RubyParser {
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
    const functionRegex = /def\s+(\w+)(?:\(([^)]*)\))?/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2] ? match[2].split(',').filter(p => p.trim()).length : 0;

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync: false,
        isExported: true
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /class\s+(\w+)(?:\s*<\s*(\w+))?/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsClass = match[2];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/def\s+\w+/g) || []).length;
      const properties = (classContent.match(/@\w+\s*=/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: extendsClass,
        implements: [],
        isExported: true
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // require statements
    const requireRegex = /require\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: !match[1].startsWith('.'),
        items: []
      });
    }

    // require_relative
    const requireRelativeRegex = /require_relative\s+['"]([^'"]+)['"]/g;
    while ((match = requireRelativeRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: false,
        items: []
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Classes and modules
    const classRegex = /(?:class|module)\s+(\w+)/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belsif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\buntil\b/g, /\bcase\b/g, /\bwhen\b/g, /\brescue\b/g, /\&\&/g, /\|\|/g];
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
    let indentLevel = -1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('def ')) {
        indentLevel = line.search(/\S/);
        functionContent += line + '\n';
        continue;
      }

      if (indentLevel === -1) continue;

      const currentIndent = line.search(/\S/);
      if (currentIndent !== -1 && currentIndent <= indentLevel && trimmed.startsWith('end')) {
        functionContent += line + '\n';
        break;
      }

      functionContent += line + '\n';
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
    return /test|spec/i.test(filePath) || filePath.includes('spec/') || filePath.includes('test/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.rb$/, '') || filePath;
  }
}
