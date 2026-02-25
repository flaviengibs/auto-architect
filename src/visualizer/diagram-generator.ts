import { DependencyGraph, AntiPattern } from '../types';

export class DiagramGenerator {
  generateMermaid(graph: DependencyGraph, antiPatterns: AntiPattern[]): string {
    const problematicModules = new Set(antiPatterns.map(p => p.module));
    
    let diagram = 'graph TD\n';
    
    graph.modules.forEach(module => {
      const nodeId = this.sanitizeId(module.name);
      const style = problematicModules.has(module.name) ? ':::problem' : '';
      diagram += `  ${nodeId}["${module.name}"]${style}\n`;
    });

    graph.edges.forEach(edge => {
      const fromId = this.sanitizeId(edge.from);
      const toId = this.sanitizeId(edge.to);
      diagram += `  ${fromId} --> ${toId}\n`;
    });

    diagram += '\n  classDef problem fill:#ff6b6b,stroke:#c92a2a,color:#fff\n';

    return diagram;
  }

  generateDOT(graph: DependencyGraph): string {
    let dot = 'digraph Architecture {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    graph.modules.forEach(module => {
      const depCount = module.dependencies.length;
      const color = depCount > 10 ? 'red' : depCount > 5 ? 'orange' : 'lightblue';
      dot += `  "${module.name}" [fillcolor=${color}, style=filled];\n`;
    });

    dot += '\n';

    graph.edges.forEach(edge => {
      dot += `  "${edge.from}" -> "${edge.to}";\n`;
    });

    dot += '}\n';

    return dot;
  }

  private sanitizeId(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }
}
