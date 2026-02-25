import * as fs from 'fs';
import * as path from 'path';
import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class PythonParser {
  parseFile(filePath: string, content: string, rootPath: string): Partial<Module> {
    const relativePath = path.relative(rootPath, filePath);
    const moduleName = this.getModuleName(relativePath);

    const functions = this.parseFunctions(content);
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

  private parseFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Match function definitions: def function_name(params):
    const funcRegex = /(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->.*?)?:/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2].split(',').filter(p => p.trim() && p.trim() !== 'self').length;
      const isAsync = match[0].includes('async');
      const isExported = !name.startsWith('_');
      
      const startIndex = match.index;
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

    return functions;
  }

  private parseClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classRegex = /class\s+(\w+)(?:\(([^)]*)\))?:/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      const inheritance = match[2] ? match[2].split(',').map(i => i.trim()).filter(i => i) : [];
      const extendsClass = inheritance[0];
      const isExported = !name.startsWith('_');
      
      const startIndex = match.index;
      const classBody = this.extractClassBody(content, startIndex);
      
      const methods = (classBody.match(/def\s+\w+\s*\(/g) || []).length;
      const properties = (classBody.match(/self\.\w+\s*=/g) || []).length;

      classes.push({
        name,
        methods,
        properties,
        extends: extendsClass,
        implements: [], // Python doesn't have explicit interfaces
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
    const patterns = [
      /from\s+([\w.]+)\s+import/g,
      /import\s+([\w.]+)/g
    ];

    patterns.forEach(regex => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        const isExternal = !importPath.startsWith('.');
        
        imports.push({
          module: importPath,
          isExternal,
          items: []
        });

        // Track local dependencies
        if (importPath.startsWith('.')) {
          try {
            const resolvedPath = path.resolve(path.dirname(filePath), importPath.replace(/\./g, '/') + '.py');
            const relativePath = path.relative(rootPath, resolvedPath);
            const moduleName = this.getModuleName(relativePath);
            
            if (moduleName && !moduleName.startsWith('..')) {
              deps.add(moduleName);
            }
          } catch (e) {
            // Skip invalid paths
          }
        }
      }
    });

    return { dependencies: Array.from(deps), imports };
  }

  private parseExports(content: string): string[] {
    const exports = new Set<string>();
    
    // __all__ = ['export1', 'export2']
    const allMatch = content.match(/__all__\s*=\s*\[(.*?)\]/s);
    if (allMatch) {
      const items = allMatch[1].match(/['"](\w+)['"]/g);
      if (items) {
        items.forEach(item => {
          const name = item.replace(/['"]/g, '');
          exports.add(name);
        });
      }
    }

    // Public functions and classes (not starting with _)
    const publicRegex = /(?:def|class)\s+([A-Za-z]\w+)/g;
    let match;
    while ((match = publicRegex.exec(content)) !== null) {
      exports.add(match[1]);
    }

    return Array.from(exports);
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    const lines = content.substring(startIndex).split('\n');
    const defLine = lines[0];
    const baseIndent = defLine.match(/^\s*/)?.[0].length || 0;
    
    let body = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.match(/^\s*/)?.[0].length || 0;
      
      if (line.trim() && indent <= baseIndent) {
        break;
      }
      body += line + '\n';
    }
    
    return body;
  }

  private extractClassBody(content: string, startIndex: number): string {
    return this.extractFunctionBody(content, startIndex);
  }

  private calculateComplexity(code: string): number {
    const controlFlow = [
      /\bif\b/g, /\belif\b/g, /\belse\b/g,
      /\bfor\b/g, /\bwhile\b/g,
      /\btry\b/g, /\bexcept\b/g,
      /\band\b/g, /\bor\b/g,
      /\blambda\b/g
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
      .replace(/\.py$/, '')
      .replace(/\\/g, '/')
      .replace(/\/__init__$/, '');
  }

  private checkForTests(filePath: string, rootPath: string): boolean {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, '.py');
    
    const testPatterns = [
      `test_${basename}.py`,
      `${basename}_test.py`,
      `tests/test_${basename}.py`
    ];
    
    return testPatterns.some(pattern => {
      const testPath = path.join(dir, pattern);
      return fs.existsSync(testPath);
    });
  }
}
