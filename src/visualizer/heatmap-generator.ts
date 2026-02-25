import { Module, DependencyGraph } from '../types';
import * as fs from 'fs';

export interface HeatmapData {
  modules: HeatmapModule[];
  maxComplexity: number;
  maxSize: number;
  maxDependencies: number;
}

export interface HeatmapModule {
  name: string;
  complexity: number;
  size: number;
  dependencies: number;
  category: string;
  color: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export class HeatmapGenerator {
  generate(graph: DependencyGraph): HeatmapData {
    const modules: HeatmapModule[] = [];
    let maxComplexity = 0;
    let maxSize = 0;
    let maxDependencies = 0;

    for (const [name, module] of graph.modules) {
      maxComplexity = Math.max(maxComplexity, module.complexity);
      maxSize = Math.max(maxSize, module.size);
      maxDependencies = Math.max(maxDependencies, module.dependencies.length);

      const risk = this.calculateRisk(module);
      const color = this.getColorForRisk(risk);

      modules.push({
        name,
        complexity: module.complexity,
        size: module.size,
        dependencies: module.dependencies.length,
        category: module.category || 'feature',
        color,
        risk
      });
    }

    return {
      modules: modules.sort((a, b) => b.complexity - a.complexity),
      maxComplexity,
      maxSize,
      maxDependencies
    };
  }

  generateHTML(data: HeatmapData): string {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complexity heatmap</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #fff;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #3498db;
    }
    .stat-label {
      color: #95a5a6;
      font-size: 0.9em;
    }
    .heatmap {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 40px;
    }
    .module {
      aspect-ratio: 1;
      padding: 15px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      overflow: hidden;
    }
    .module:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      z-index: 10;
    }
    .module-name {
      font-weight: bold;
      font-size: 0.9em;
      word-break: break-word;
      margin-bottom: 10px;
    }
    .module-stats {
      font-size: 0.75em;
      opacity: 0.9;
    }
    .module-complexity {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.5);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: bold;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 40px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .legend-color {
      width: 30px;
      height: 30px;
      border-radius: 4px;
    }
    .tooltip {
      position: fixed;
      background: rgba(0,0,0,0.9);
      padding: 15px;
      border-radius: 8px;
      pointer-events: none;
      display: none;
      z-index: 1000;
      max-width: 300px;
    }
    .tooltip.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔥 Complexity heatmap</h1>
    <p>Visual representation of code complexity and risk</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${data.modules.length}</div>
      <div class="stat-label">Modules</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.maxComplexity}</div>
      <div class="stat-label">Max complexity</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.maxSize}</div>
      <div class="stat-label">Max size</div>
    </div>
  </div>

  <div class="heatmap">
${data.modules.map(module => `
    <div class="module" style="background: ${module.color};" 
         data-name="${module.name}"
         data-complexity="${module.complexity}"
         data-size="${module.size}"
         data-deps="${module.dependencies}"
         data-risk="${module.risk}">
      <div class="module-complexity">${module.complexity}</div>
      <div class="module-name">${this.getShortName(module.name)}</div>
      <div class="module-stats">
        ${module.size} lines<br>
        ${module.dependencies} deps
      </div>
    </div>
`).join('')}
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-color" style="background: #27ae60;"></div>
      <span>Low risk</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #f39c12;"></div>
      <span>Medium risk</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #e67e22;"></div>
      <span>High risk</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #e74c3c;"></div>
      <span>Critical risk</span>
    </div>
  </div>

  <div class="tooltip" id="tooltip"></div>

  <script>
    const modules = document.querySelectorAll('.module');
    const tooltip = document.getElementById('tooltip');

    modules.forEach(module => {
      module.addEventListener('mouseenter', (e) => {
        const name = module.dataset.name;
        const complexity = module.dataset.complexity;
        const size = module.dataset.size;
        const deps = module.dataset.deps;
        const risk = module.dataset.risk;

        tooltip.innerHTML = \`
          <strong>\${name}</strong><br>
          Complexity: \${complexity}<br>
          Size: \${size} lines<br>
          Dependencies: \${deps}<br>
          Risk: \${risk}
        \`;
        tooltip.classList.add('show');
      });

      module.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
      });

      module.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
    });
  </script>
</body>
</html>`;

    return html;
  }

  generateSVG(data: HeatmapData): string {
    const width = 1200;
    const height = 800;
    const padding = 40;
    const cellSize = 80;
    const cols = Math.floor((width - 2 * padding) / cellSize);

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f5f5f5"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-size="24" font-weight="bold">Complexity heatmap</text>
`;

    data.modules.forEach((module, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = padding + col * cellSize;
      const y = 60 + row * cellSize;

      svg += `
  <rect x="${x}" y="${y}" width="${cellSize - 5}" height="${cellSize - 5}" 
        fill="${module.color}" rx="4" opacity="0.9"/>
  <text x="${x + cellSize/2}" y="${y + cellSize/2}" text-anchor="middle" 
        font-size="10" fill="white" font-weight="bold">${module.complexity}</text>
`;
    });

    svg += '</svg>';
    return svg;
  }

  private calculateRisk(module: Module): 'low' | 'medium' | 'high' | 'critical' {
    const complexityScore = module.complexity > 20 ? 3 : module.complexity > 10 ? 2 : 1;
    const sizeScore = module.size > 500 ? 3 : module.size > 250 ? 2 : 1;
    const depScore = module.dependencies.length > 10 ? 3 : module.dependencies.length > 5 ? 2 : 1;

    const totalScore = complexityScore + sizeScore + depScore;

    if (totalScore >= 8) return 'critical';
    if (totalScore >= 6) return 'high';
    if (totalScore >= 4) return 'medium';
    return 'low';
  }

  private getColorForRisk(risk: string): string {
    switch (risk) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  }

  private getShortName(name: string): string {
    const parts = name.split('/');
    return parts[parts.length - 1];
  }

  saveToFile(content: string, outputPath: string): void {
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
}
