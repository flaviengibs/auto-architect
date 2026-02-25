import { Module, FunctionInfo, ClassInfo, ImportInfo } from '../types';

export class HTMLParser {
  parse(filePath: string, content: string): Module {
    const functions = this.extractScriptFunctions(content);
    const classes = this.extractComponents(content);
    const imports = this.extractImports(content);
    const exports: string[] = [];
    const hasTests = false;

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

  private extractScriptFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Extract script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;

    while ((scriptMatch = scriptRegex.exec(content)) !== null) {
      const scriptContent = scriptMatch[1];
      
      // Extract functions from script content
      const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
      let match;

      while ((match = functionRegex.exec(scriptContent)) !== null) {
        const name = match[1];
        const params = match[2].split(',').filter(p => p.trim()).length;

        functions.push({
          name,
          complexity: 1,
          lines: 10,
          parameters: params,
          isAsync: false,
          isExported: false
        });
      }
    }

    return functions;
  }

  private extractComponents(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    // Count major HTML elements as "components"
    const componentTags = ['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'];
    
    componentTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'gi');
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        classes.push({
          name: `${tag}-component`,
          methods: 0,
          properties: matches.length,
          implements: [],
          isExported: false
        });
      }
    });

    return classes;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // Link tags (CSS)
    const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: match[1].startsWith('http'),
        items: []
      });
    }

    // Script tags (JS)
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    while ((match = scriptRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        isExternal: match[1].startsWith('http'),
        items: []
      });
    }

    return imports;
  }

  private calculateComplexity(content: string): number {
    // Count nesting depth and conditional rendering
    let complexity = 1;
    
    // Count nested elements
    const depth = this.calculateNestingDepth(content);
    complexity += Math.floor(depth / 3);
    
    // Count forms and inputs (interaction complexity)
    complexity += (content.match(/<form/gi) || []).length * 2;
    complexity += (content.match(/<input/gi) || []).length;
    
    return complexity;
  }

  private calculateNestingDepth(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    const tagRegex = /<\/?[\w-]+[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      if (!match[0].startsWith('</') && !match[0].endsWith('/>')) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (match[0].startsWith('</')) {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  private isTestFile(filePath: string): boolean {
    return false;
  }

  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.html?$/, '') || filePath;
  }
}
