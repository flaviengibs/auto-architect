import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class RustParser {
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
    const functionRegex = /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)(?:<[^>]+>)?\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim() && !p.includes('self')).length;
      const isAsync = /async\s+fn/.test(match[0]);
      const isExported = /pub\s+/.test(match[0]);

      functions.push({
        name,
        complexity: this.calculateFunctionComplexity(content, match.index),
        lines: this.getFunctionLines(content, match.index),
        parameters: params,
        isAsync,
        isExported
      });
    }

    return functions;
  }

  private extractClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    // Structs
    const structRegex = /(?:pub\s+)?struct\s+(\w+)(?:<[^>]+>)?/g;
    let match;

    while ((match = structRegex.exec(content)) !== null) {
      const name = match[1];
      const isExported = /pub\s+struct/.test(match[0]);

      const structContent = this.extractStructContent(content, match.index);
      const properties = (structContent.match(/\w+\s*:\s*\w+/g) || []).length;

      // Find impl blocks for this struct
      const implRegex = new RegExp(`impl(?:<[^>]+>)?\\s+${name}`, 'g');
      const implMatches = content.match(implRegex) || [];
      const methods = implMatches.length > 0 ? this.countMethodsInImpl(content, name) : 0;

      classes.push({
        name,
        methods,
        properties,
        implements: [],
        isExported
      });
    }

    // Traits (interfaces)
    const traitRegex = /(?:pub\s+)?trait\s+(\w+)/g;
    while ((match = traitRegex.exec(content)) !== null) {
      const name = match[1];
      const traitContent = this.extractStructContent(content, match.index);
      const methods = (traitContent.match(/fn\s+\w+/g) || []).length;

      classes.push({
        name,
        methods,
        properties: 0,
        implements: [],
        isExported: /pub\s+trait/.test(match[0])
      });
    }

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // use statements
    const useRegex = /use\s+([\w:]+)(?:::\{([^}]+)\})?;/g;
    let match;

    while ((match = useRegex.exec(content)) !== null) {
      const module = match[1];
      const items = match[2] ? match[2].split(',').map(i => i.trim()) : [module.split('::').pop() || module];
      
      imports.push({
        module: module.replace(/::/g, '/'),
        isExternal: !module.startsWith('crate::') && !module.startsWith('super::') && !module.startsWith('self::'),
        items
      });
    }

    // mod statements
    const modRegex = /mod\s+(\w+);/g;
    while ((match = modRegex.exec(content)) !== null) {
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
    
    // pub items
    const pubRegex = /pub\s+(?:fn|struct|enum|trait|const|static)\s+(\w+)/g;
    let match;

    while ((match = pubRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bloop\b/g, /\bmatch\b/g, /\bif let\b/g, /\bwhile let\b/g, /\?\?/g, /\&\&/g, /\|\|/g];
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

  private extractStructContent(content: string, startIndex: number): string {
    return this.extractFunctionContent(content, startIndex);
  }

  private countMethodsInImpl(content: string, structName: string): number {
    const implRegex = new RegExp(`impl(?:<[^>]+>)?\\s+${structName}\\s*\\{`, 'g');
    const match = implRegex.exec(content);
    if (!match) return 0;

    const implContent = this.extractFunctionContent(content, match.index);
    return (implContent.match(/fn\s+\w+/g) || []).length;
  }

  private getFunctionLines(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return functionContent.split('\n').length;
  }

  private isTestFile(filePath: string): boolean {
    return /test/i.test(filePath) || filePath.includes('tests/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.rs$/, '') || filePath;
  }
}
