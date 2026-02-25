import { AnalysisReport } from '../types';
import { TrendAnalysis } from '../analyzer/trend-tracker';
import { ComparisonResult } from '../analyzer/architecture-comparator';
import * as fs from 'fs';

export interface DashboardData {
  report: AnalysisReport;
  trends?: TrendAnalysis;
  comparison?: ComparisonResult;
  teamAnalytics?: any;
  pluginResults?: Map<string, any>;
}

export class DashboardGenerator {
  /**
   * Generate interactive HTML dashboard
   */
  generateDashboard(data: DashboardData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-Architect Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .header h1 {
      color: #2d3748;
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header .subtitle {
      color: #718096;
      font-size: 1.1em;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.15);
    }

    .stat-label {
      color: #718096;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #2d3748;
    }

    .stat-change {
      font-size: 0.9em;
      margin-top: 5px;
    }

    .stat-change.positive {
      color: #48bb78;
    }

    .stat-change.negative {
      color: #f56565;
    }

    .grade {
      display: inline-block;
      width: 60px;
      height: 60px;
      line-height: 60px;
      text-align: center;
      border-radius: 50%;
      font-size: 1.8em;
      font-weight: bold;
      color: white;
    }

    .grade-A { background: #48bb78; }
    .grade-B { background: #4299e1; }
    .grade-C { background: #ed8936; }
    .grade-D { background: #f56565; }
    .grade-F { background: #e53e3e; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .chart-card h3 {
      color: #2d3748;
      margin-bottom: 20px;
      font-size: 1.3em;
    }

    .issues-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .issue-item {
      padding: 15px;
      border-left: 4px solid;
      margin-bottom: 10px;
      border-radius: 4px;
      background: #f7fafc;
    }

    .issue-critical { border-color: #e53e3e; }
    .issue-high { border-color: #f56565; }
    .issue-medium { border-color: #ed8936; }
    .issue-low { border-color: #4299e1; }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .tab {
      padding: 12px 24px;
      background: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1em;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tab:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .tab.active {
      background: #667eea;
      color: white;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .trend-indicator {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .trend-improving {
      background: #c6f6d5;
      color: #22543d;
    }

    .trend-stable {
      background: #bee3f8;
      color: #2c5282;
    }

    .trend-degrading {
      background: #fed7d7;
      color: #742a2a;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .comparison-table th {
      background: #f7fafc;
      font-weight: 600;
      color: #2d3748;
    }

    .status-above {
      color: #48bb78;
      font-weight: 600;
    }

    .status-below {
      color: #f56565;
      font-weight: 600;
    }

    .status-at {
      color: #4299e1;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Auto-Architect Dashboard</h1>
      <p class="subtitle">Project: ${data.report.projectPath}</p>
      <p class="subtitle">Generated: ${new Date(data.report.timestamp).toLocaleString()}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Health score</div>
        <div class="stat-value">
          <span class="grade grade-${data.report.healthScore.grade}">${data.report.healthScore.grade}</span>
          ${data.report.healthScore.overall}/100
        </div>
        ${this.generateTrendIndicator(data.trends?.trends.healthScore)}
      </div>

      <div class="stat-card">
        <div class="stat-label">Total modules</div>
        <div class="stat-value">${data.report.metrics.totalModules}</div>
        <div class="stat-change">Lines: ${data.report.metrics.totalLines.toLocaleString()}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Complexity</div>
        <div class="stat-value">${data.report.metrics.cyclomaticComplexity.toFixed(1)}</div>
        ${this.generateTrendIndicator(data.trends?.trends.complexity)}
      </div>

      <div class="stat-card">
        <div class="stat-label">Test coverage</div>
        <div class="stat-value">${data.report.metrics.testCoverage.toFixed(0)}%</div>
        ${this.generateTrendIndicator(data.trends?.trends.testCoverage)}
      </div>

      <div class="stat-card">
        <div class="stat-label">Issues</div>
        <div class="stat-value">${data.report.antiPatterns.length}</div>
        <div class="stat-change">
          Critical: ${data.report.antiPatterns.filter(p => p.severity === 'critical').length}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Technical debt</div>
        <div class="stat-value">${data.report.metrics.technicalDebt.toFixed(1)}%</div>
        ${this.generateTrendIndicator(data.trends?.trends.technicalDebt)}
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('overview')">Overview</button>
      <button class="tab" onclick="showTab('trends')">Trends</button>
      <button class="tab" onclick="showTab('comparison')">Comparison</button>
      <button class="tab" onclick="showTab('issues')">Issues</button>
    </div>

    <div id="overview" class="tab-content active">
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Health dimensions</h3>
          <canvas id="healthChart"></canvas>
        </div>

        <div class="chart-card">
          <h3>Quality metrics</h3>
          <canvas id="metricsChart"></canvas>
        </div>

        <div class="chart-card">
          <h3>Issues by severity</h3>
          <canvas id="issuesChart"></canvas>
        </div>

        <div class="chart-card">
          <h3>Module complexity</h3>
          <canvas id="complexityChart"></canvas>
        </div>
      </div>
    </div>

    <div id="trends" class="tab-content">
      ${this.generateTrendsSection(data.trends)}
    </div>

    <div id="comparison" class="tab-content">
      ${this.generateComparisonSection(data.comparison)}
    </div>

    <div id="issues" class="tab-content">
      ${this.generateIssuesSection(data.report)}
    </div>
  </div>

  <script>
    const dashboardData = ${JSON.stringify(data, null, 2)};

    function showTab(tabName) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    }

    // Health dimensions chart
    new Chart(document.getElementById('healthChart'), {
      type: 'radar',
      data: {
        labels: ['Architecture', 'Maintainability', 'Testability', 'Security', 'Performance'],
        datasets: [{
          label: 'Score',
          data: [
            dashboardData.report.healthScore.architecture,
            dashboardData.report.healthScore.maintainability,
            dashboardData.report.healthScore.testability,
            dashboardData.report.healthScore.security,
            dashboardData.report.healthScore.performance
          ],
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Quality metrics chart
    new Chart(document.getElementById('metricsChart'), {
      type: 'bar',
      data: {
        labels: ['Coupling', 'Cohesion', 'Modularity', 'MI'],
        datasets: [{
          label: 'Score',
          data: [
            100 - dashboardData.report.metrics.coupling,
            dashboardData.report.metrics.cohesion,
            dashboardData.report.metrics.modularity,
            dashboardData.report.metrics.maintainabilityIndex
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ]
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Issues chart
    const issuesBySeverity = {
      critical: dashboardData.report.antiPatterns.filter(p => p.severity === 'critical').length,
      high: dashboardData.report.antiPatterns.filter(p => p.severity === 'high').length,
      medium: dashboardData.report.antiPatterns.filter(p => p.severity === 'medium').length,
      low: dashboardData.report.antiPatterns.filter(p => p.severity === 'low').length
    };

    new Chart(document.getElementById('issuesChart'), {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [issuesBySeverity.critical, issuesBySeverity.high, issuesBySeverity.medium, issuesBySeverity.low],
          backgroundColor: [
            'rgba(229, 62, 62, 0.7)',
            'rgba(245, 101, 101, 0.7)',
            'rgba(237, 137, 54, 0.7)',
            'rgba(66, 153, 225, 0.7)'
          ]
        }]
      }
    });

    // Complexity chart
    const topModules = Array.from(dashboardData.report.graph.modules.values())
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);

    new Chart(document.getElementById('complexityChart'), {
      type: 'horizontalBar',
      data: {
        labels: topModules.map(m => m.name.split('/').pop()),
        datasets: [{
          label: 'Complexity',
          data: topModules.map(m => m.complexity),
          backgroundColor: 'rgba(118, 75, 162, 0.7)'
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Generate trend indicator HTML
   */
  private generateTrendIndicator(trend?: any): string {
    if (!trend) return '';

    const className = `trend-${trend.direction}`;
    const arrow = trend.direction === 'improving' ? '↗' : 
                  trend.direction === 'degrading' ? '↘' : '→';
    
    return `<div class="stat-change ${trend.changePercent > 0 ? 'positive' : 'negative'}">
      <span class="trend-indicator ${className}">${arrow} ${trend.changePercent.toFixed(1)}%</span>
    </div>`;
  }

  /**
   * Generate trends section
   */
  private generateTrendsSection(trends?: TrendAnalysis): string {
    if (!trends || trends.history.length === 0) {
      return '<div class="chart-card"><p>No trend data available yet. Run multiple analyses to see trends.</p></div>';
    }

    return `
      <div class="chart-card">
        <h3>📈 Quality trends over time</h3>
        <canvas id="trendChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>🔮 Predictions (30 days)</h3>
        <p><strong>Health score:</strong> ${trends.predictions.healthScoreIn30Days}/100</p>
        <p><strong>Complexity:</strong> ${trends.predictions.complexityIn30Days.toFixed(1)}</p>
        <p><strong>Recommendation:</strong> ${trends.predictions.recommendation}</p>
      </div>

      ${trends.alerts.length > 0 ? `
        <div class="issues-section">
          <h3>⚠️ Trend alerts</h3>
          ${trends.alerts.map(alert => `
            <div class="issue-item issue-${alert.type === 'critical' ? 'critical' : 'medium'}">
              <strong>${alert.metric}</strong>: ${alert.message}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <script>
        new Chart(document.getElementById('trendChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(trends.history.map(h => new Date(h.timestamp).toLocaleDateString()))},
            datasets: [{
              label: 'Health Score',
              data: ${JSON.stringify(trends.history.map(h => h.healthScore))},
              borderColor: 'rgba(102, 126, 234, 1)',
              tension: 0.4
            }, {
              label: 'Complexity',
              data: ${JSON.stringify(trends.history.map(h => h.metrics.cyclomaticComplexity))},
              borderColor: 'rgba(245, 101, 101, 1)',
              tension: 0.4
            }]
          }
        });
      </script>
    `;
  }

  /**
   * Generate comparison section
   */
  private generateComparisonSection(comparison?: ComparisonResult): string {
    if (!comparison || comparison.comparison.length === 0) {
      return '<div class="chart-card"><p>No comparison data available.</p></div>';
    }

    return `
      <div class="chart-card">
        <h3>🏆 Industry comparison</h3>
        <p><strong>Overall score:</strong> ${comparison.score}/100 (Grade ${comparison.grade})</p>
        <p><strong>Percentile:</strong> Better than ${comparison.percentile}% of similar projects</p>

        <table class="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Your value</th>
              <th>Industry avg</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${comparison.comparison.map(c => `
              <tr>
                <td>${c.metric}</td>
                <td>${c.yourValue}</td>
                <td>${c.industryAverage}</td>
                <td class="status-${c.status}">${c.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${comparison.strengths.length > 0 ? `
          <h4 style="margin-top: 20px; color: #48bb78;">✓ Strengths</h4>
          <ul>
            ${comparison.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        ` : ''}

        ${comparison.weaknesses.length > 0 ? `
          <h4 style="margin-top: 20px; color: #f56565;">⚠ Areas for improvement</h4>
          <ul>
            ${comparison.weaknesses.map(w => `<li>${w}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate issues section
   */
  private generateIssuesSection(report: AnalysisReport): string {
    const criticalIssues = report.antiPatterns.filter(p => p.severity === 'critical');
    const highIssues = report.antiPatterns.filter(p => p.severity === 'high');
    const mediumIssues = report.antiPatterns.filter(p => p.severity === 'medium');
    const lowIssues = report.antiPatterns.filter(p => p.severity === 'low');

    return `
      <div class="issues-section">
        <h3>🔴 Critical issues (${criticalIssues.length})</h3>
        ${criticalIssues.map(issue => `
          <div class="issue-item issue-critical">
            <strong>${issue.type}</strong> in ${issue.module}<br>
            ${issue.description}<br>
            <em>Impact: ${issue.impact}</em>
          </div>
        `).join('') || '<p>No critical issues</p>'}
      </div>

      <div class="issues-section">
        <h3>🟠 High priority issues (${highIssues.length})</h3>
        ${highIssues.slice(0, 10).map(issue => `
          <div class="issue-item issue-high">
            <strong>${issue.type}</strong> in ${issue.module}<br>
            ${issue.description}
          </div>
        `).join('') || '<p>No high priority issues</p>'}
        ${highIssues.length > 10 ? `<p>... and ${highIssues.length - 10} more</p>` : ''}
      </div>
    `;
  }

  /**
   * Save dashboard to file
   */
  saveDashboard(html: string, outputPath: string): void {
    fs.writeFileSync(outputPath, html);
  }
}
