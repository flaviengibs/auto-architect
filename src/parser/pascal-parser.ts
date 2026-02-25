import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class PascalParser {
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
    
    // Match function and procedure definitions
    const functionRegex = /(?:function|procedure)\s+(\w+)\s*\(([^)]*)\)/gi;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(';').filter(p => p.trim()).length;

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
    
    // Match class/object definitions
    const classRegex = /type\s+(\w+)\s*=\s*class\s*\(([^)]*)\)?/gi;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const parent = match[2];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/(?:function|procedure)\s+\w+/gi) || []).length;
      const properties = (classContent.match(/\w+\s*:\s*\w+;/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: parent,
        implements: [],
        isExported: true
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // uses clause
    const usesRegex = /uses\s+([\w,\s]+);/gi;
    let match;

    while ((match = usesRegex.exec(content)) !== null) {
      const units = match[1].split(',').map(u => u.trim());
      
      units.forEach(unit => {
        imports.push({
          module: unit,
          isExternal: true,
          items: []
        });
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Functions, procedures, and classes in interface section
    const interfaceMatch = content.match(/interface([\s\S]*?)implementation/i);
    if (interfaceMatch) {
      const interfaceContent = interfaceMatch[1];
      
      const exportRegex = /(?:function|procedure|type)\s+(\w+)/gi;
      let match;

      while ((match = exportRegex.exec(interfaceContent)) !== null) {
        exports.push(match[1]);
      }
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/gi, /\belse\b/gi, /\bfor\b/gi, /\bwhile\b/gi, /\bcase\b/gi, /\brepeat\b/gi, /\band\b/gi, /\bor\b/gi];
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
      if (/\bend\s*;/i.test(line)) {
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
      if (/\bend\s*;/i.test(line)) break;
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
    return filePath.split('/').pop()?.replace(/\.(pas|pp)$/, '') || filePath;
  }
}
