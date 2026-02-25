import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class RParser {
  parse(filePath: string, content: string): Module {
    const functions = this.extractFunctions(content);
    const classes: ClassInfo[] = []; // R doesn't have traditional classes
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
    
    // Match function definitions: name <- function(params)
    const functionRegex = /(\w+)\s*<-\s*function\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim()).length;

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

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // library() and require() statements
    const libraryRegex = /(?:library|require)\s*\(\s*['"]?(\w+)['"]?\s*\)/g;
    let match;

    while ((match = libraryRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: true,
        items: []
      });
    }

    // source() statements
    const sourceRegex = /source\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = sourceRegex.exec(content)) !== null) {
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
    
    // All top-level function assignments are exported
    const functionRegex = /(\w+)\s*<-\s*function/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\brepeat\b/g, /\bifelse\b/g, /\&\&/g, /\|\|/g];
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

  private getFunctionLines(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return functionContent.split('\n').length;
  }

  private isTestFile(filePath: string): boolean {
    return /test/i.test(filePath) || filePath.includes('tests/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.R$/, '') || filePath;
  }
}
