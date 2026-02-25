import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class PHPParser {
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
    const functionRegex = /(?:public|private|protected)?\s*function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim()).length;
      const isExported = /public\s+function/.test(match[0]);

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync: false,
        isExported
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsClass = match[2];
      const implementsList = match[3] ? match[3].split(',').map(i => i.trim()) : [];

      const classContent = this.extractClassContent(content, match.index);
      const methods = (classContent.match(/function\s+\w+/g) || []).length;
      const properties = (classContent.match(/(?:public|private|protected)\s+\$\w+/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: extendsClass,
        implements: implementsList,
        isExported: true
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // use statements
    const useRegex = /use\s+([\w\\]+)(?:\s+as\s+(\w+))?;/g;
    let match;

    while ((match = useRegex.exec(content)) !== null) {
      const module = match[1];
      const alias = match[2];
      
      imports.push({
        module: module.replace(/\\/g, '/'),
        isExternal: !module.startsWith('.'),
        items: [alias || module.split('\\').pop() || module]
      });
    }

    // require/include
    const requireRegex = /(?:require|include)(?:_once)?\s*['"]([^'"]+)['"]/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: !match[1].startsWith('.'),
        items: []
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Public functions and classes
    const publicRegex = /(?:public\s+)?(?:class|function)\s+(\w+)/g;
    let match;

    while ((match = publicRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bforeach\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\?/g, /\&\&/g, /\|\|/g];
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
    return filePath.split('/').pop()?.replace(/\.php$/, '') || filePath;
  }
}
