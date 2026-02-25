import * as fs from 'fs';
import * as path from 'path';
import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class CSharpParser {
  parseFile(filePath: string, content: string, rootPath: string): Partial<Module> {
    const relativePath = path.relative(rootPath, filePath);
    const moduleName = this.getModuleName(relativePath);

    const functions = this.parseMethods(content);
    const classes = this.parseClasses(content);
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

  private parseMethods(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Match method declarations
    const methodRegex = /(?:public|private|protected|internal)?\s*(?:static)?\s*(?:async)?\s*(?:virtual|override|abstract)?\s*(?:<[^>]+>)?\s*(\w+)\s+(\w+)\s*\(([^)]*)\)\s*{/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const returnType = match[1];
      const name = match[2];
      const params = match[3].split(',').filter(p => p.trim()).length;
      const isAsync = match[0].includes('async');
      const isExported = match[0].includes('public');
      
      const startIndex = match.index;
      const body = this.extractMethodBody(content, startIndex);
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

    return functions;
  }

  private parseClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:public|private|protected|internal)?\s*(?:abstract|sealed|static)?\s*(?:partial)?\s*class\s+(\w+)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const inheritance = match[2] ? match[2].split(',').map(i => i.trim()) : [];
      const extendsClass = inheritance.find(i => !i.startsWith('I')) || undefined;
      const implementsList = inheritance.filter(i => i.startsWith('I'));
      const isExported = match[0].includes('public');
      
      const startIndex = match.index;
      const classBody = this.extractClassBody(content, startIndex);
      
      const methods = (classBody.match(/(?:public|private|protected)\s+(?:static\s+)?(?:async\s+)?\w+\s+\w+\s*\(/g) || []).length;
      const properties = (classBody.match(/(?:public|private|protected)\s+(?:static\s+)?(?:readonly\s+)?\w+\s+\w+\s*[{;]/g) || []).length;

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

  private extractDependencies(content: string, filePath: string, rootPath: string): {
    dependencies: string[];
    imports: ImportInfo[];
  } {
    const deps = new Set<string>();
    const imports: ImportInfo[] = [];

    // Match using statements
    const usingRegex = /using\s+([\w.]+);/g;
    let match;

    while ((match = usingRegex.exec(content)) !== null) {
      const importPath = match[1];
      const isExternal = !importPath.includes(path.basename(rootPath, path.extname(rootPath)));
      
      imports.push({
        module: importPath,
        isExternal,
        items: []
      });

      // Track local dependencies
      if (!isExternal) {
        const className = importPath.split('.').pop() || '';
        deps.add(className);
      }
    }

    return { dependencies: Array.from(deps), imports };
  }

  private parseExports(content: string): string[] {
    const exports = new Set<string>();
    
    // Public classes, interfaces, enums
    const publicRegex = /public\s+(?:class|interface|enum|struct)\s+(\w+)/g;
    let match;
    while ((match = publicRegex.exec(content)) !== null) {
      exports.add(match[1]);
    }

    return Array.from(exports);
  }

  private extractMethodBody(content: string, startIndex: number): string {
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

  private extractClassBody(content: string, startIndex: number): string {
    return this.extractMethodBody(content, startIndex);
  }

  private calculateComplexity(code: string): number {
    const controlFlow = [
      /\bif\b/g, /\belse\b/g,
      /\bfor\b/g, /\bforeach\b/g, /\bwhile\b/g, /\bdo\b/g,
      /\bswitch\b/g, /\bcase\b/g,
      /\bcatch\b/g, /\?\?/g,
      /&&/g, /\|\|/g, /\?/g
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
      .replace(/\.cs$/, '')
      .replace(/\\/g, '/');
  }

  private checkForTests(filePath: string, rootPath: string): boolean {
    const testPath = filePath.replace(/\.cs$/, 'Tests.cs');
    return fs.existsSync(testPath) || filePath.includes('Tests');
  }
}
