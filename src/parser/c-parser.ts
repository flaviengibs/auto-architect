import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class CParser {
  parse(filePath: string, content: string): Module {
    const functions = this.extractFunctions(content);
    const classes = this.extractStructs(content);
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
    // Match function definitions: return_type function_name(params)
    const functionRegex = /(?:static\s+)?(?:inline\s+)?(?:\w+\s+\*?\s*)+(\w+)\s*\(([^)]*)\)\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      // Skip common keywords that might match
      if (['if', 'while', 'for', 'switch', 'return'].includes(name)) continue;
      
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

  private extractStructs(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    // Match struct and union definitions
    const structRegex = /(?:typedef\s+)?(?:struct|union)\s+(\w+)?\s*{([^}]*)}/g;
    let match;

    while ((match = structRegex.exec(content)) !== null) {
      const name = match[1] || 'anonymous';
      const structContent = match[2];
      
      // Count members (fields)
      const members = (structContent.match(/\w+\s+\w+\s*;/g) || []).length;

      classes.push({
        name,
        methods: 0,
        properties: members,
        implements: [],
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
        module: module.replace(/\.h$/, ''),
        isExternal: match[0].includes('<'),
        items: []
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Non-static functions are exported
    const functionRegex = /(?:extern\s+)?(?:\w+\s+\*?\s*)+(\w+)\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      if (!match[0].includes('static')) {
        exports.push(match[1]);
      }
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bdo\b/g, /\&\&/g, /\|\|/g, /\?/g];
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
    return /test|spec/i.test(filePath) || filePath.includes('tests/');
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.(c|h)$/, '') || filePath;
  }
}
