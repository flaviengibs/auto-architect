import * as fs from 'fs';
import * as path from 'path';
import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class JavaParser {
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
    const methodRegex = /(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*(?:synchronized)?\s*(?:<[^>]+>)?\s*(\w+)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*{/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const returnType = match[1];
      const name = match[2];
      const params = match[3].split(',').filter(p => p.trim()).length;
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
        isAsync: false, // Java uses different async model
        isExported
      });
    }

    return functions;
  }

  private parseClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /(?:public|private|protected)?\s*(?:abstract)?\s*(?:final)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsClass = match[2];
      const implementsList = match[3] ? match[3].split(',').map(i => i.trim()) : [];
      const isExported = match[0].includes('public');
      
      const startIndex = match.index;
      const classBody = this.extractClassBody(content, startIndex);
      
      const methods = (classBody.match(/(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+\w+\s*\(/g) || []).length;
      const properties = (classBody.match(/(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?[\w<>]+\s+\w+\s*[;=]/g) || []).length;

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

    // Match import statements
    const importRegex = /import\s+(static\s+)?([\w.]+)(?:\.\*)?;/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[2];
      const isExternal = !importPath.startsWith('.');
      
      imports.push({
        module: importPath,
        isExternal,
        items: []
      });

      // Track local dependencies (same package)
      const packageMatch = content.match(/package\s+([\w.]+);/);
      const currentPackage = packageMatch ? packageMatch[1] : '';
      
      if (importPath.startsWith(currentPackage)) {
        const className = importPath.split('.').pop() || '';
        deps.add(className);
      }
    }

    return { dependencies: Array.from(deps), imports };
  }

  private parseExports(content: string): string[] {
    const exports = new Set<string>();
    
    // Public classes, interfaces, enums
    const publicRegex = /public\s+(?:class|interface|enum)\s+(\w+)/g;
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
      /\bfor\b/g, /\bwhile\b/g, /\bdo\b/g,
      /\bcase\b/g, /\bcatch\b/g,
      /\b&&\b/g, /\b\|\|\b/g, /\?\s*:/g
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
      .replace(/\.java$/, '')
      .replace(/\\/g, '/')
      .replace(/^src\/main\/java\//, '')
      .replace(/^src\//, '');
  }

  private checkForTests(filePath: string, rootPath: string): boolean {
    const testPath = filePath
      .replace(/src\/main\/java/, 'src/test/java')
      .replace(/\.java$/, 'Test.java');
    
    return fs.existsSync(testPath);
  }
}
