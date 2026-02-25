import * as fs from 'fs';
import * as path from 'path';
import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class GoParser {
  parseFile(filePath: string, content: string, rootPath: string): Partial<Module> {
    const relativePath = path.relative(rootPath, filePath);
    const moduleName = this.getModuleName(relativePath);

    const functions = this.parseFunctions(content);
    const classes = this.parseStructs(content); // Go uses structs instead of classes
    const { dependencies, imports } = this.extractDependencies(content, filePath, rootPath);
    const exports = this.parseExports(content);
    const size = content.split('\n').length;
    const complexity = this.estimateComplexity(content);

    return {
      name: moduleName,
      path: relativePath,
      dependencies,
      dependents: [],
      size,
      complexity,
      functions,
      classes,
      exports,
      imports,
      hasTests: this.checkForTests(filePath, rootPath),
      testCoverage: 0
    };
  }

  private parseFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Match function declarations: func name(params) returnType { }
    const funcRegex = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(([^)]*)\)(?:\s*\([^)]*\)|\s*\w+)?\s*{/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim()).length;
      const isExported = name[0] === name[0].toUpperCase(); // Go exports start with uppercase
      
      const startIndex = match.index;
      const body = this.extractFunctionBody(content, startIndex);
      const complexity = this.calculateComplexity(body);
      const lines = body.split('\n').length;

      functions.push({
        name,
        complexity,
        lines,
        parameters: params,
        isAsync: false, // Go uses goroutines differently
        isExported
      });
    }

    return functions;
  }

  private parseStructs(content: string): ClassInfo[] {
    const structs: ClassInfo[] = [];
    const structRegex = /type\s+(\w+)\s+struct\s*{/g;
    let match;

    while ((match = structRegex.exec(content)) !== null) {
      const name = match[1];
      const isExported = name[0] === name[0].toUpperCase();
      
      const startIndex = match.index;
      const structBody = this.extractStructBody(content, startIndex);
      
      // Count methods (functions with receiver)
      const methodRegex = new RegExp(`func\\s+\\([^)]*${name}[^)]*\\)\\s+\\w+`, 'g');
      const methods = (content.match(methodRegex) || []).length;
      
      // Count fields
      const properties = (structBody.match(/\w+\s+\w+/g) || []).length;

      structs.push({
        name,
        methods,
        properties,
        extends: undefined, // Go uses composition, not inheritance
        implements: [], // Go uses interfaces implicitly
        isExported
      });
    }

    return structs;
  }

  private extractDependencies(content: string, filePath: string, rootPath: string): {
    dependencies: string[];
    imports: ImportInfo[];
  } {
    const deps = new Set<string>();
    const imports: ImportInfo[] = [];

    // Match import statements
    const importRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importBlock = match[1] || match[2];
      const importLines = importBlock.split('\n');
      
      importLines.forEach(line => {
        const importMatch = line.match(/"([^"]+)"/);
        if (importMatch) {
          const importPath = importMatch[1];
          const isExternal = !importPath.startsWith('.');
          
          imports.push({
            module: importPath,
            isExternal,
            items: []
          });

          // Track local dependencies
          if (importPath.startsWith('.')) {
            const moduleName = importPath.replace(/^\.\//, '');
            deps.add(moduleName);
          }
        }
      });
    }

    return { dependencies: Array.from(deps), imports };
  }

  private parseExports(content: string): string[] {
    const exports = new Set<string>();
    
    // Exported functions (start with uppercase)
    const funcRegex = /func\s+([A-Z]\w*)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      exports.add(match[1]);
    }
    
    // Exported types
    const typeRegex = /type\s+([A-Z]\w*)/g;
    while ((match = typeRegex.exec(content)) !== null) {
      exports.add(match[1]);
    }

    return Array.from(exports);
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    let braceCount = 0;
    let i = content.indexOf('{', startIndex);
    const start = i;
    
    while (i < content.length) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) break;
      i++;
    }
    
    return content.substring(start, i);
  }

  private extractStructBody(content: string, startIndex: number): string {
    return this.extractFunctionBody(content, startIndex);
  }

  private calculateComplexity(code: string): number {
    const controlFlow = [
      /\bif\b/g, /\belse\b/g,
      /\bfor\b/g, /\bswitch\b/g,
      /\bcase\b/g, /\bselect\b/g,
      /\bgo\b/g, /\bdefer\b/g,
      /&&/g, /\|\|/g
    ];
    
    let complexity = 1;
    controlFlow.forEach(regex => {
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  private estimateComplexity(content: string): number {
    return this.calculateComplexity(content);
  }

  private getModuleName(relativePath: string): string {
    return relativePath
      .replace(/\.go$/, '')
      .replace(/\\/g, '/');
  }

  private checkForTests(filePath: string, rootPath: string): boolean {
    const testPath = filePath.replace(/\.go$/, '_test.go');
    return fs.existsSync(testPath);
  }
}
