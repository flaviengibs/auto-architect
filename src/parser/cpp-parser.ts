import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class CppParser {
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
    const functionRegex = /(?:virtual\s+)?(?:static\s+)?(?:inline\s+)?(?:\w+(?:::\w+)*\s*[*&]?\s+)+(\w+)\s*\(([^)]*)\)(?:\s+const)?(?:\s+override)?(?:\s+final)?\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      if (['if', 'while', 'for', 'switch', 'catch'].includes(name)) continue;
      
      const params = match[2].split(',').filter(p => p.trim() && p.trim() !== 'void').length;

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync: false,
        isExported: !match[0].includes('static')
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:template\s*<[^>]+>\s*)?class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+([\w:,\s]+))?/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const inheritance = match[2] ? match[2].split(',').map(i => i.trim()) : [];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/(?:virtual\s+)?(?:\w+\s+)+\w+\s*\([^)]*\)/g) || []).length;
      const properties = (classContent.match(/(?:public|private|protected):\s*\n\s*\w+\s+\w+;/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: inheritance[0],
        implements: inheritance.slice(1),
        isExported: true
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // #include statements
    const includeRegex = /#include\s+[<"]([^>"]+)[>"]/g;
    let match;

    while ((match = includeRegex.exec(content)) !== null) {
      const module = match[1];
      
      imports.push({
        module: module.replace(/\.(h|hpp)$/, ''),
        isExternal: match[0].includes('<'),
        items: []
      });
    }

    // using statements
    const usingRegex = /using\s+(?:namespace\s+)?(\w+(?:::\w+)*);/g;
    while ((match = usingRegex.exec(content)) !== null) {
      imports.push({
        module: match[1].replace(/::/g, '/'),
        isExternal: true,
        items: []
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Classes and non-static functions
    const classRegex = /class\s+(\w+)/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /\&\&/g, /\|\|/g, /\?/g];
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
    return /test|spec/i.test(filePath) || filePath.includes('tests/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.(cpp|cc|cxx|hpp|h)$/, '') || filePath;
  }
}
