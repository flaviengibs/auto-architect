import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class SQLParser {
  parse(filePath: string, content: string): Module {
    const functions = this.extractFunctions(content);
    const classes = this.extractTables(content);
    const imports: ImportInfo[] = [];
    const exports = this.extractExports(content);
    const hasTests = false;

    return {
      name: this.getModuleName(filePath),
      path: filePath,
      dependencies: [],
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
    
    // Stored procedures and functions
    const procedureRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+(\w+)\s*\(([^)]*)\)/gi;
    let match;

    while ((match = procedureRegex.exec(content)) !== null) {
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

  private extractTables(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    // CREATE TABLE statements
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+)\)/gi;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const name = match[1];
      const tableContent = match[2];
      
      // Count columns
      const columns = tableContent.split(',').filter(c => c.trim()).length;

      classes.push({
        name,
        methods: 0,
        properties: columns,
        implements: [],
        isExported: true
      });
    }

    return classes;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Tables, procedures, and functions
    const createRegex = /CREATE\s+(?:TABLE|PROCEDURE|FUNCTION|VIEW)\s+(\w+)/gi;
    let match;

    while ((match = createRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    
    // SQL complexity factors
    const patterns = [
      /\bWHERE\b/gi,
      /\bJOIN\b/gi,
      /\bUNION\b/gi,
      /\bCASE\b/gi,
      /\bIF\b/gi,
      /\bEXISTS\b/gi,
      /\bIN\s*\(/gi,
      /\bAND\b/gi,
      /\bOR\b/gi
    ];
    
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
    // Extract until END or semicolon
    const remaining = content.substring(startIndex);
    const endMatch = remaining.match(/END;?/i);
    
    if (endMatch) {
      return remaining.substring(0, endMatch.index! + endMatch[0].length);
    }
    
    return remaining.substring(0, 500); // Fallback
  }

  private getFunctionLines(content: string, startIndex: number): number {
    const functionContent = this.extractFunctionContent(content, startIndex);
    return functionContent.split('\n').length;
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.sql$/, '') || filePath;
  }
}
