import { FunctionInfo, ClassInfo } from '../types';

export class ASTParser {
  parseFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Match function declarations and expressions
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
      /(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)\s*=>/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const params = match[2].split(',').filter(p => p.trim()).length;
        const isAsync = match[0].includes('async');
        const isExported = match[0].includes('export');
        
        // Extract function body to calculate complexity
        const startIndex = match.index + match[0].length;
        const body = this.extractFunctionBody(content, startIndex);
        const complexity = this.calculateComplexity(body);
        const lines = body.split('\n').length;

        functions.push({
          name,
          complexity,
          lines,
          parameters: params,
          isAsync,
          isExported
        });
      }
    });

    return functions;
  }

  parseClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsClass = match[2];
      const implementsList = match[3] ? match[3].split(',').map(i => i.trim()) : [];
      const isExported = match[0].includes('export');
      
      const startIndex = match.index + match[0].length;
      const classBody = this.extractClassBody(content, startIndex);
      
      const methods = (classBody.match(/\w+\s*\([^)]*\)\s*{/g) || []).length;
      const properties = (classBody.match(/(?:private|public|protected)?\s+\w+\s*[:=]/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: extendsClass,
        implements: implementsList,
        isExported
      });
    }

    return classes;
  }

  parseExports(content: string): string[] {
    const exports = new Set<string>();
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.add(match[1]);
    }
    
    // Export statements
    const exportStatementRegex = /export\s+{\s*([^}]+)\s*}/g;
    while ((match = exportStatementRegex.exec(content)) !== null) {
      match[1].split(',').forEach(item => {
        const name = item.trim().split(/\s+as\s+/)[0];
        exports.add(name);
      });
    }
    
    return Array.from(exports);
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    let braceCount = 1;
    let i = startIndex;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(startIndex, i - 1);
  }

  private extractClassBody(content: string, startIndex: number): string {
    return this.extractFunctionBody(content, startIndex);
  }

  private calculateComplexity(code: string): number {
    const controlFlowKeywords = [
      /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g,
      /\bcase\b/g, /\bcatch\b/g, /\b\?\?/g, /\|\|/g, /&&/g,
      /\bswitch\b/g, /\bdo\b/g, /\bbreak\b/g, /\bcontinue\b/g
    ];
    
    let complexity = 1;
    controlFlowKeywords.forEach(regex => {
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }
}
