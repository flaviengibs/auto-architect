import { Module, DependencyGraph, FunctionInfo, ClassInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentationOptions {
  includePrivate?: boolean;
  includeTests?: boolean;
  format?: 'markdown' | 'html';
  outputPath?: string;
}

export class DocumentationGenerator {
  generate(graph: DependencyGraph, options: DocumentationOptions = {}): string {
    const {
      includePrivate = false,
      includeTests = false,
      format = 'markdown'
    } = options;

    if (format === 'markdown') {
      return this.generateMarkdown(graph, includePrivate, includeTests);
    } else {
      return this.generateHTML(graph, includePrivate, includeTests);
    }
  }

  private generateMarkdown(graph: DependencyGraph, includePrivate: boolean, includeTests: boolean): string {
    let doc = '# Project documentation\n\n';
    doc += `Generated on: ${new Date().toISOString()}\n\n`;
    doc += '## Table of contents\n\n';

    // Generate TOC
    const modules = Array.from(graph.modules.values())
      .filter(m => includeTests || !m.hasTests)
      .sort((a, b) => a.name.localeCompare(b.name));

    modules.forEach(module => {
      doc += `- [${module.name}](#${this.slugify(module.name)})\n`;
    });

    doc += '\n## Modules\n\n';

    // Generate module documentation
    modules.forEach(module => {
      doc += this.generateModuleMarkdown(module, includePrivate);
    });

    // Generate dependency graph
    doc += '\n## Dependency graph\n\n';
    doc += '```mermaid\n';
    doc += 'graph TD\n';
    
    graph.edges.forEach(edge => {
      const from = this.sanitizeMermaidId(edge.from);
      const to = this.sanitizeMermaidId(edge.to);
      doc += `  ${from} --> ${to}\n`;
    });
    
    doc += '```\n\n';

    return doc;
  }

  private generateModuleMarkdown(module: Module, includePrivate: boolean): string {
    let doc = `### ${module.name}\n\n`;
    doc += `**Path:** \`${module.path}\`\n\n`;
    doc += `**Size:** ${module.size} lines\n\n`;
    doc += `**Complexity:** ${module.complexity}\n\n`;

    if (module.dependencies.length > 0) {
      doc += '**Dependencies:**\n\n';
      module.dependencies.forEach(dep => {
        doc += `- ${dep}\n`;
      });
      doc += '\n';
    }

    if (module.dependents.length > 0) {
      doc += '**Used by:**\n\n';
      module.dependents.forEach(dep => {
        doc += `- ${dep}\n`;
      });
      doc += '\n';
    }

    // Document classes
    if (module.classes.length > 0) {
      doc += '#### Classes\n\n';
      module.classes.forEach(cls => {
        if (includePrivate || cls.isExported) {
          doc += this.generateClassMarkdown(cls);
        }
      });
    }

    // Document functions
    if (module.functions.length > 0) {
      doc += '#### Functions\n\n';
      module.functions.forEach(func => {
        if (includePrivate || func.isExported) {
          doc += this.generateFunctionMarkdown(func);
        }
      });
    }

    // Document exports
    if (module.exports.length > 0) {
      doc += '#### Exports\n\n';
      module.exports.forEach(exp => {
        doc += `- \`${exp}\`\n`;
      });
      doc += '\n';
    }

    doc += '---\n\n';
    return doc;
  }

  private generateClassMarkdown(cls: ClassInfo): string {
    let doc = `##### ${cls.name}\n\n`;
    
    if (cls.extends) {
      doc += `Extends: \`${cls.extends}\`\n\n`;
    }

    if (cls.implements.length > 0) {
      doc += `Implements: ${cls.implements.map(i => `\`${i}\``).join(', ')}\n\n`;
    }

    doc += `- Methods: ${cls.methods}\n`;
    doc += `- Properties: ${cls.properties}\n`;
    doc += `- Exported: ${cls.isExported ? 'Yes' : 'No'}\n\n`;

    return doc;
  }

  private generateFunctionMarkdown(func: FunctionInfo): string {
    let doc = `##### ${func.name}\n\n`;
    doc += '```typescript\n';
    doc += `${func.isAsync ? 'async ' : ''}function ${func.name}(`;
    doc += `${func.parameters} parameters`;
    doc += ')\n';
    doc += '```\n\n';
    doc += `- Lines: ${func.lines}\n`;
    doc += `- Complexity: ${func.complexity}\n`;
    doc += `- Async: ${func.isAsync ? 'Yes' : 'No'}\n`;
    doc += `- Exported: ${func.isExported ? 'Yes' : 'No'}\n\n`;

    return doc;
  }

  private generateHTML(graph: DependencyGraph, includePrivate: boolean, includeTests: boolean): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .module {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .module h2 {
      margin-top: 0;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .meta {
      color: #7f8c8d;
      font-size: 0.9em;
    }
    .function, .class {
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.85em;
      margin-right: 5px;
    }
    .badge-exported { background: #27ae60; color: white; }
    .badge-async { background: #e74c3c; color: white; }
    .badge-complexity { background: #f39c12; color: white; }
    code {
      background: #ecf0f1;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .dependencies {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0;
    }
    .dep-badge {
      background: #3498db;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Project documentation</h1>
    <p class="meta">Generated on: ${new Date().toLocaleString()}</p>
    <p class="meta">Total modules: ${graph.modules.size}</p>
  </div>
`;

    const modules = Array.from(graph.modules.values())
      .filter(m => includeTests || !m.hasTests)
      .sort((a, b) => a.name.localeCompare(b.name));

    modules.forEach(module => {
      html += this.generateModuleHTML(module, includePrivate);
    });

    html += `
</body>
</html>`;

    return html;
  }

  private generateModuleHTML(module: Module, includePrivate: boolean): string {
    let html = `
  <div class="module">
    <h2>${module.name}</h2>
    <p class="meta">
      <strong>Path:</strong> <code>${module.path}</code><br>
      <strong>Size:</strong> ${module.size} lines<br>
      <strong>Complexity:</strong> ${module.complexity}
    </p>
`;

    if (module.dependencies.length > 0) {
      html += `
    <h3>Dependencies</h3>
    <div class="dependencies">
`;
      module.dependencies.forEach(dep => {
        html += `      <span class="dep-badge">${dep}</span>\n`;
      });
      html += `    </div>\n`;
    }

    if (module.classes.length > 0) {
      html += `    <h3>Classes</h3>\n`;
      module.classes.forEach(cls => {
        if (includePrivate || cls.isExported) {
          html += this.generateClassHTML(cls);
        }
      });
    }

    if (module.functions.length > 0) {
      html += `    <h3>Functions</h3>\n`;
      module.functions.forEach(func => {
        if (includePrivate || func.isExported) {
          html += this.generateFunctionHTML(func);
        }
      });
    }

    html += `  </div>\n`;
    return html;
  }

  private generateClassHTML(cls: ClassInfo): string {
    let html = `
    <div class="class">
      <h4>${cls.name}</h4>
`;
    if (cls.isExported) {
      html += `      <span class="badge badge-exported">Exported</span>\n`;
    }
    html += `      <p>Methods: ${cls.methods} | Properties: ${cls.properties}</p>\n`;
    if (cls.extends) {
      html += `      <p>Extends: <code>${cls.extends}</code></p>\n`;
    }
    if (cls.implements.length > 0) {
      html += `      <p>Implements: ${cls.implements.map(i => `<code>${i}</code>`).join(', ')}</p>\n`;
    }
    html += `    </div>\n`;
    return html;
  }

  private generateFunctionHTML(func: FunctionInfo): string {
    let html = `
    <div class="function">
      <h4>${func.name}</h4>
`;
    if (func.isExported) {
      html += `      <span class="badge badge-exported">Exported</span>\n`;
    }
    if (func.isAsync) {
      html += `      <span class="badge badge-async">Async</span>\n`;
    }
    html += `      <span class="badge badge-complexity">Complexity: ${func.complexity}</span>\n`;
    html += `      <p>Parameters: ${func.parameters} | Lines: ${func.lines}</p>\n`;
    html += `    </div>\n`;
    return html;
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private sanitizeMermaidId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  saveToFile(content: string, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
}
