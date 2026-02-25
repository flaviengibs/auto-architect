import { AnalysisReport } from '../types';
import chalk from 'chalk';

export class Reporter {
  printReport(report: AnalysisReport, verbose: boolean = false): void {
    console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════'));
    console.log(chalk.bold.cyan('   Auto-architect analysis report'));
    console.log(chalk.bold.cyan('═══════════════════════════════════════════════════\n'));

    this.printHealthScore(report);
    this.printMetrics(report, verbose);
    this.printQualityGates(report);
    this.printAntiPatterns(report, verbose);
    this.printProposals(report, verbose);
    
    if (verbose) {
      this.printVerboseDetails(report);
    }
  }

  printSummary(report: AnalysisReport): void {
    console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════'));
    console.log(chalk.bold.cyan('   Analysis summary'));
    console.log(chalk.bold.cyan('═══════════════════════════════════════════════════\n'));

    const h = report.healthScore;
    const gradeColor = this.getGradeColor(h.grade);
    
    console.log(chalk.bold.white('Health score\n'));
    console.log(`   Overall: ${gradeColor(`${h.overall}/100 [${h.grade}]`)}\n`);
    
    const m = report.metrics;
    console.log(chalk.bold.yellow('Key metrics\n'));
    console.log(`   Modules: ${chalk.white(m.totalModules)} | Lines: ${chalk.white(m.totalLines.toLocaleString())} | Complexity: ${this.colorizeMetric(m.cyclomaticComplexity, 15, 10)}`);
    console.log(`   Coupling: ${this.colorizeMetric(m.coupling, 30, 15)}% | Cohesion: ${chalk.green(m.cohesion)}% | MI: ${this.colorizeScore(m.maintainabilityIndex)}\n`);
    
    const passed = report.qualityGates.filter(g => g.passed).length;
    const total = report.qualityGates.length;
    console.log(chalk.bold.blue('Quality gates\n'));
    console.log(`   ${passed}/${total} passed (${this.colorizeScore(Math.round((passed / total) * 100))}%)\n`);
    
    console.log(chalk.bold.red('Issues\n'));
    const critical = report.antiPatterns.filter(p => p.severity === 'critical').length;
    const high = report.antiPatterns.filter(p => p.severity === 'high').length;
    const medium = report.antiPatterns.filter(p => p.severity === 'medium').length;
    const low = report.antiPatterns.filter(p => p.severity === 'low').length;
    
    console.log(`   Critical: ${chalk.red(critical)} | High: ${chalk.red(high)} | Medium: ${chalk.yellow(medium)} | Low: ${chalk.green(low)}\n`);
    
    console.log(chalk.bold.green('Proposals\n'));
    console.log(`   ${report.proposals.length} refactoring suggestions available\n`);
  }

  printQuiet(report: AnalysisReport): void {
    const h = report.healthScore;
    const gradeColor = this.getGradeColor(h.grade);
    
    console.log(`\nHealth score: ${gradeColor(`${h.overall}/100 [${h.grade}]`)}`);
    
    const critical = report.antiPatterns.filter(p => p.severity === 'critical');
    if (critical.length > 0) {
      console.log(chalk.red(`\n⚠️  ${critical.length} critical issue${critical.length > 1 ? 's' : ''}:`));
      critical.forEach(issue => {
        console.log(chalk.red(`   • ${issue.type} in ${issue.module}`));
      });
    }
    
    const high = report.antiPatterns.filter(p => p.severity === 'high');
    if (high.length > 0) {
      console.log(chalk.red(`\n⚠️  ${high.length} high severity issue${high.length > 1 ? 's' : ''}:`));
      high.slice(0, 3).forEach(issue => {
        console.log(chalk.red(`   • ${issue.type} in ${issue.module}`));
      });
      if (high.length > 3) {
        console.log(chalk.gray(`   ... and ${high.length - 3} more`));
      }
    }
    
    if (critical.length === 0 && high.length === 0) {
      console.log(chalk.green('\n✓ No critical or high severity issues detected'));
    }
    console.log();
  }

  private printVerboseDetails(report: AnalysisReport): void {
    console.log(chalk.bold.magenta('🔍 Verbose details\n'));
    
    console.log(chalk.underline('Module size distribution:'));
    const modulesArray = Array.from(report.graph.modules.values());
    const moduleSizes = modulesArray.map(m => ({
      name: m.path,
      lines: m.size || 0
    })).sort((a, b) => b.lines - a.lines);
    
    const totalLines = moduleSizes.reduce((sum, m) => sum + m.lines, 0);
    const avgLines = totalLines / moduleSizes.length;
    
    console.log(`   Average module size: ${chalk.white(avgLines.toFixed(0))} lines`);
    console.log(`   Largest module: ${chalk.white(moduleSizes[0]?.name)} (${moduleSizes[0]?.lines} lines)`);
    console.log(`   Smallest module: ${chalk.white(moduleSizes[moduleSizes.length - 1]?.name)} (${moduleSizes[moduleSizes.length - 1]?.lines} lines)`);
    
    console.log(chalk.underline('\nDependency analysis:'));
    const depCounts = modulesArray.map(m => m.dependencies.length);
    const maxDeps = Math.max(...depCounts);
    const avgDeps = depCounts.reduce((a, b) => a + b, 0) / depCounts.length;
    
    console.log(`   Average dependencies per module: ${chalk.white(avgDeps.toFixed(2))}`);
    console.log(`   Maximum dependencies: ${this.colorizeMetric(maxDeps, 15, 10)}`);
    
    const isolated = modulesArray.filter(m => m.dependencies.length === 0 && m.dependents.length === 0);
    if (isolated.length > 0) {
      console.log(`   Isolated modules: ${chalk.yellow(isolated.length)}`);
    }
    
    console.log();
  }

  private printHealthScore(report: AnalysisReport): void {
    const h = report.healthScore;
    const gradeColor = this.getGradeColor(h.grade);
    
    console.log(chalk.bold.white('🏥 Health score\n'));
    console.log(`   Overall:          ${gradeColor(`${h.overall}/100`)} ${gradeColor(`[${h.grade}]`)}`);
    console.log(`   Architecture:     ${this.colorizeScore(h.architecture)}/100`);
    console.log(`   Maintainability:  ${this.colorizeScore(h.maintainability)}/100`);
    console.log(`   Testability:      ${this.colorizeScore(h.testability)}/100`);
    console.log(`   Security:         ${this.colorizeScore(h.security)}/100`);
    console.log(`   Performance:      ${this.colorizeScore(h.performance)}/100`);
    console.log();
  }

  private printMetrics(report: AnalysisReport, verbose: boolean = false): void {
    const m = report.metrics;
    
    console.log(chalk.bold.yellow('📊 Architecture metrics\n'));
    console.log(chalk.underline('Basic metrics:'));
    console.log(`   Total modules:          ${chalk.white(m.totalModules)}`);
    console.log(`   Total lines:            ${chalk.white(m.totalLines.toLocaleString())}`);
    console.log(`   Average dependencies:   ${chalk.white(m.avgDependencies)}`);
    console.log(`   Max dependencies:       ${this.colorizeMetric(m.maxDependencies, 15, 10)}`);
    console.log(`   Cyclomatic complexity:  ${this.colorizeMetric(m.cyclomaticComplexity, 15, 10)}`);
    
    console.log(chalk.underline('\nQuality metrics:'));
    console.log(`   Coupling:               ${this.colorizeMetric(m.coupling, 30, 15)}%`);
    console.log(`   Cohesion:               ${chalk.green(m.cohesion)}%`);
    console.log(`   Modularity:             ${this.colorizeScore(m.modularity)}%`);
    console.log(`   Maintainability index:  ${this.colorizeScore(m.maintainabilityIndex)}`);
    
    console.log(chalk.underline('\nAdvanced metrics:'));
    console.log(`   Instability:            ${chalk.white(m.instability.toFixed(2))}`);
    console.log(`   Abstractness:           ${chalk.white(m.abstractness.toFixed(2))}`);
    console.log(`   Distance from main seq: ${this.colorizeMetric(m.distanceFromMainSequence, 0.5, 0.3)}`);
    console.log(`   Test coverage:          ${this.colorizeScore(m.testCoverage)}%`);
    console.log(`   Technical debt:         ${this.colorizeMetric(m.technicalDebt, 30, 20)}%`);
    console.log(`   Code smells:            ${this.colorizeMetric(m.codeSmells, 10, 5)}`);
    
    if (m.halstead) {
      console.log(chalk.underline('\nHalstead metrics:'));
      console.log(`   Vocabulary:             ${chalk.white(m.halstead.vocabulary)}`);
      console.log(`   Program length:         ${chalk.white(m.halstead.length)}`);
      console.log(`   Volume:                 ${chalk.white(m.halstead.volume.toFixed(2))}`);
      console.log(`   Difficulty:             ${chalk.white(m.halstead.difficulty.toFixed(2))}`);
      console.log(`   Effort:                 ${chalk.white(m.halstead.effort.toFixed(2))}`);
      console.log(`   Time to program:        ${chalk.white(m.halstead.time.toFixed(2))}s`);
      console.log(`   Estimated bugs:         ${this.colorizeMetric(m.halstead.bugs, 1, 0.5)}`);
    }
    
    if (m.cognitiveComplexity !== undefined) {
      console.log(chalk.underline('\nCognitive complexity:'));
      console.log(`   Average score:          ${this.colorizeMetric(m.cognitiveComplexity, 20, 10)}`);
    }
    
    if (m.hotspots.length > 0) {
      console.log(chalk.underline('\nHotspots (high complexity):'));
      const limit = verbose ? m.hotspots.length : 3;
      m.hotspots.slice(0, limit).forEach(h => console.log(`   🔥 ${chalk.red(h)}`));
      if (!verbose && m.hotspots.length > 3) {
        console.log(chalk.gray(`   ... and ${m.hotspots.length - 3} more`));
      }
    }
    console.log();
  }

  private printQualityGates(report: AnalysisReport): void {
    console.log(chalk.bold.blue('🚦 Quality gates\n'));
    
    const passed = report.qualityGates.filter(g => g.passed).length;
    const total = report.qualityGates.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`   Status: ${passed}/${total} gates passed (${this.colorizeScore(passRate)}%)\n`);
    
    report.qualityGates.forEach(gate => {
      const icon = gate.passed ? '✓' : '✗';
      const color = gate.passed ? chalk.green : (gate.severity === 'error' ? chalk.red : chalk.yellow);
      const status = gate.passed ? 'PASS' : 'FAIL';
      
      console.log(`   ${color(icon)} ${gate.name}: ${color(status)}`);
      console.log(`      Threshold: ${gate.threshold}, Actual: ${gate.actual.toFixed(2)}`);
    });
    console.log();
  }

  private printAntiPatterns(report: AnalysisReport, verbose: boolean = false): void {
    console.log(chalk.bold.red('🚨 Anti-patterns detected\n'));

    if (report.antiPatterns.length === 0) {
      console.log(chalk.green('   ✓ No critical anti-patterns detected!\n'));
      return;
    }

    const limit = verbose ? report.antiPatterns.length : 5;
    report.antiPatterns.slice(0, limit).forEach((pattern) => {
      const icon = this.getSeverityIcon(pattern.severity);
      const color = this.getSeverityColor(pattern.severity);
      
      console.log(`   ${icon} ${color(`[${pattern.severity}]`)} ${pattern.type}`);
      console.log(`      ${chalk.gray(pattern.description)}`);
      console.log(`      ${chalk.italic.gray('Impact:')} ${pattern.impact}`);
      if (verbose && pattern.suggestion) {
        console.log(`      ${chalk.italic.gray('Suggestion:')} ${pattern.suggestion}`);
      }
      console.log();
    });

    if (!verbose && report.antiPatterns.length > 5) {
      console.log(chalk.gray(`   ... and ${report.antiPatterns.length - 5} more\n`));
    }
  }

  private printProposals(report: AnalysisReport, verbose: boolean = false): void {
    console.log(chalk.bold.green('💡 Refactoring proposals\n'));

    if (report.proposals.length === 0) {
      console.log(chalk.gray('   No proposals generated.\n'));
      return;
    }

    const limit = verbose ? report.proposals.length : 5;
    report.proposals.slice(0, limit).forEach((proposal, i) => {
      const priorityColor = this.getPriorityColor(proposal.priority);
      
      console.log(`   ${chalk.bold(`${i + 1}.`)} ${priorityColor(`[${proposal.priority}]`)} ${chalk.cyan(proposal.description)}`);
      console.log(`      ${chalk.gray('Type:')} ${proposal.type}`);
      console.log(`      ${chalk.gray('Target:')} ${proposal.target.join(', ')}`);
      console.log(`      ${chalk.gray('Estimated impact:')}`);
      console.log(`         • Complexity:      ${chalk.green(`-${proposal.estimatedImpact.complexityReduction}%`)}`);
      console.log(`         • Coupling:        ${chalk.green(`-${proposal.estimatedImpact.couplingReduction}%`)}`);
      console.log(`         • Maintainability: ${chalk.green(`+${proposal.estimatedImpact.maintainabilityGain}%`)}`);
      console.log(`         • Effort:          ${chalk.yellow(`~${proposal.estimatedImpact.effortHours}h`)}`);
      console.log(`         • Risk:            ${this.getRiskColor(proposal.estimatedImpact.riskLevel)(proposal.estimatedImpact.riskLevel)}`);
      
      if (proposal.affectedModules.length > 0) {
        console.log(`      ${chalk.gray('Affected:')} ${proposal.affectedModules.length} modules`);
      }
      
      if (verbose && proposal.steps && proposal.steps.length > 0) {
        console.log(`      ${chalk.gray('Steps:')}`);
        proposal.steps.slice(0, 3).forEach((step, idx) => {
          console.log(`         ${idx + 1}. ${step}`);
        });
      }
      console.log();
    });

    if (!verbose && report.proposals.length > 5) {
      console.log(chalk.gray(`   ... and ${report.proposals.length - 5} more proposals\n`));
    }
  }

  private colorizeScore(score: number): string {
    if (score >= 80) return chalk.green(score);
    if (score >= 60) return chalk.yellow(score);
    return chalk.red(score);
  }

  private getGradeColor(grade: string): (text: string) => string {
    const colors = { A: chalk.green, B: chalk.green, C: chalk.yellow, D: chalk.red, F: chalk.red };
    return colors[grade as keyof typeof colors] || chalk.white;
  }

  private getPriorityColor(priority: string): (text: string) => string {
    const colors = { critical: chalk.red, high: chalk.red, medium: chalk.yellow, low: chalk.green };
    return colors[priority as keyof typeof colors] || chalk.white;
  }

  private getRiskColor(risk: string): (text: string) => string {
    const colors = { high: chalk.red, medium: chalk.yellow, low: chalk.green };
    return colors[risk as keyof typeof colors] || chalk.white;
  }

  private colorizeMetric(value: number, high: number, medium: number): string {
    if (value >= high) return chalk.red(value);
    if (value >= medium) return chalk.yellow(value);
    return chalk.green(value);
  }

  private getSeverityIcon(severity: string): string {
    const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    return icons[severity as keyof typeof icons] || '⚪';
  }

  private getSeverityColor(severity: string): (text: string) => string {
    const colors = { critical: chalk.red, high: chalk.red, medium: chalk.yellow, low: chalk.green };
    return colors[severity as keyof typeof colors] || chalk.white;
  }

  generateMarkdown(report: AnalysisReport): string {
    let md = '# Architecture analysis report\n\n';
    md += `**Project:** ${report.projectPath}\n`;
    md += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    md += `## Health score: ${report.healthScore.overall}/100 [${report.healthScore.grade}]\n\n`;
    md += `- Architecture: ${report.healthScore.architecture}/100\n`;
    md += `- Maintainability: ${report.healthScore.maintainability}/100\n`;
    md += `- Testability: ${report.healthScore.testability}/100\n`;
    md += `- Security: ${report.healthScore.security}/100\n`;
    md += `- Performance: ${report.healthScore.performance}/100\n\n`;
    
    md += '## Metrics\n\n';
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total modules | ${report.metrics.totalModules} |\n`;
    md += `| Total lines | ${report.metrics.totalLines.toLocaleString()} |\n`;
    md += `| Average dependencies | ${report.metrics.avgDependencies} |\n`;
    md += `| Cyclomatic complexity | ${report.metrics.cyclomaticComplexity} |\n`;
    md += `| Coupling | ${report.metrics.coupling}% |\n`;
    md += `| Cohesion | ${report.metrics.cohesion}% |\n`;
    md += `| Maintainability index | ${report.metrics.maintainabilityIndex} |\n`;
    md += `| Test coverage | ${report.metrics.testCoverage}% |\n`;
    md += `| Technical debt | ${report.metrics.technicalDebt}% |\n\n`;
    
    md += '## Quality gates\n\n';
    const passed = report.qualityGates.filter(g => g.passed).length;
    md += `**Status:** ${passed}/${report.qualityGates.length} gates passed\n\n`;
    report.qualityGates.forEach(gate => {
      const status = gate.passed ? '✅' : '❌';
      md += `${status} **${gate.name}**: ${gate.actual.toFixed(2)} (threshold: ${gate.threshold})\n`;
    });
    md += '\n';
    
    md += '## Anti-patterns and code smells\n\n';
    if (report.antiPatterns.length === 0) {
      md += 'No issues detected\n\n';
    } else {
      report.antiPatterns.slice(0, 10).forEach(pattern => {
        const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[pattern.severity];
        md += `### ${emoji} ${pattern.type} [${pattern.severity}]\n`;
        md += `**Module:** ${pattern.module}\n\n`;
        md += `${pattern.description}\n\n`;
        md += `**Impact:** ${pattern.impact}\n\n`;
        if (pattern.suggestion) {
          md += `**Suggestion:** ${pattern.suggestion}\n\n`;
        }
      });
    }
    
    md += '## Top refactoring proposals\n\n';
    report.proposals.slice(0, 5).forEach((proposal, i) => {
      md += `### ${i + 1}. ${proposal.description}\n\n`;
      md += `**Priority:** ${proposal.priority} | **Type:** ${proposal.type}\n\n`;
      md += `**Estimated impact:**\n`;
      md += `- Complexity reduction: ${proposal.estimatedImpact.complexityReduction}%\n`;
      md += `- Coupling reduction: ${proposal.estimatedImpact.couplingReduction}%\n`;
      md += `- Maintainability gain: ${proposal.estimatedImpact.maintainabilityGain}%\n`;
      md += `- Effort: ~${proposal.estimatedImpact.effortHours}h\n`;
      md += `- Risk: ${proposal.estimatedImpact.riskLevel}\n\n`;
      
      if (proposal.codeExample) {
        md += '**Example:**\n```typescript\n' + proposal.codeExample + '\n```\n\n';
      }
    });
    
    return md;
  }

  generateHTML(report: AnalysisReport): string {
    const gradeColor = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' }[report.healthScore.grade];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Architecture analysis report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .health-score { font-size: 48px; font-weight: bold; color: ${gradeColor}; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-critical { background: #fee; color: #c00; }
    .badge-high { background: #ffe; color: #c60; }
    .badge-medium { background: #ffc; color: #960; }
    .badge-low { background: #efe; color: #060; }
    .proposal { border-left: 4px solid #667eea; padding-left: 15px; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-weight: 600; }
    .pass { color: #22c55e; }
    .fail { color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Architecture analysis report</h1>
    <p><strong>Project:</strong> ${report.projectPath}</p>
    <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
  </div>

  <div class="card">
    <h2>Health score</h2>
    <div class="health-score">${report.healthScore.overall}/100 [${report.healthScore.grade}]</div>
    <table>
      <tr><td>Architecture</td><td>${report.healthScore.architecture}/100</td></tr>
      <tr><td>Maintainability</td><td>${report.healthScore.maintainability}/100</td></tr>
      <tr><td>Testability</td><td>${report.healthScore.testability}/100</td></tr>
      <tr><td>Security</td><td>${report.healthScore.security}/100</td></tr>
      <tr><td>Performance</td><td>${report.healthScore.performance}/100</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>Key metrics</h2>
    <div class="metric"><span>Total modules</span><strong>${report.metrics.totalModules}</strong></div>
    <div class="metric"><span>Total lines</span><strong>${report.metrics.totalLines.toLocaleString()}</strong></div>
    <div class="metric"><span>Cyclomatic complexity</span><strong>${report.metrics.cyclomaticComplexity}</strong></div>
    <div class="metric"><span>Coupling</span><strong>${report.metrics.coupling}%</strong></div>
    <div class="metric"><span>Cohesion</span><strong>${report.metrics.cohesion}%</strong></div>
    <div class="metric"><span>Test coverage</span><strong>${report.metrics.testCoverage}%</strong></div>
    <div class="metric"><span>Technical debt</span><strong>${report.metrics.technicalDebt}%</strong></div>
  </div>

  <div class="card">
    <h2>Quality gates</h2>
    <p><strong>Status:</strong> ${report.qualityGates.filter(g => g.passed).length}/${report.qualityGates.length} passed</p>
    <table>
      <tr><th>Gate</th><th>Threshold</th><th>Actual</th><th>Status</th></tr>
      ${report.qualityGates.map(gate => `
        <tr>
          <td>${gate.name}</td>
          <td>${gate.threshold}</td>
          <td>${gate.actual.toFixed(2)}</td>
          <td class="${gate.passed ? 'pass' : 'fail'}">${gate.passed ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="card">
    <h2>Issues (${report.antiPatterns.length})</h2>
    ${report.antiPatterns.slice(0, 10).map(pattern => `
      <div style="margin: 15px 0;">
        <span class="badge badge-${pattern.severity}">${pattern.severity}</span>
        <strong>${pattern.type}</strong> in ${pattern.module}
        <p>${pattern.description}</p>
        ${pattern.suggestion ? `<p><em>${pattern.suggestion}</em></p>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="card">
    <h2>Top refactoring proposals</h2>
    ${report.proposals.slice(0, 5).map((proposal, i) => `
      <div class="proposal">
        <h3>${i + 1}. ${proposal.description}</h3>
        <p><span class="badge badge-${proposal.priority}">${proposal.priority}</span> ${proposal.type}</p>
        <p><strong>Impact:</strong> -${proposal.estimatedImpact.complexityReduction}% complexity, 
           +${proposal.estimatedImpact.maintainabilityGain}% maintainability</p>
        <p><strong>Effort:</strong> ~${proposal.estimatedImpact.effortHours}h | 
           <strong>Risk:</strong> ${proposal.estimatedImpact.riskLevel}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  generateCSV(report: AnalysisReport): string {
    let csv = 'Metric,Value\n';
    
    // Health scores
    csv += `Health Score Overall,${report.healthScore.overall}\n`;
    csv += `Health Score Grade,${report.healthScore.grade}\n`;
    csv += `Health Score Architecture,${report.healthScore.architecture}\n`;
    csv += `Health Score Maintainability,${report.healthScore.maintainability}\n`;
    csv += `Health Score Testability,${report.healthScore.testability}\n`;
    csv += `Health Score Security,${report.healthScore.security}\n`;
    csv += `Health Score Performance,${report.healthScore.performance}\n`;
    
    // Basic metrics
    csv += `Total Modules,${report.metrics.totalModules}\n`;
    csv += `Total Lines,${report.metrics.totalLines}\n`;
    csv += `Average Dependencies,${report.metrics.avgDependencies}\n`;
    csv += `Max Dependencies,${report.metrics.maxDependencies}\n`;
    csv += `Cyclomatic Complexity,${report.metrics.cyclomaticComplexity}\n`;
    
    // Quality metrics
    csv += `Coupling,${report.metrics.coupling}\n`;
    csv += `Cohesion,${report.metrics.cohesion}\n`;
    csv += `Modularity,${report.metrics.modularity}\n`;
    csv += `Maintainability Index,${report.metrics.maintainabilityIndex}\n`;
    csv += `Instability,${report.metrics.instability}\n`;
    csv += `Abstractness,${report.metrics.abstractness}\n`;
    csv += `Distance From Main Sequence,${report.metrics.distanceFromMainSequence}\n`;
    csv += `Test Coverage,${report.metrics.testCoverage}\n`;
    csv += `Technical Debt,${report.metrics.technicalDebt}\n`;
    csv += `Code Smells,${report.metrics.codeSmells}\n`;
    
    // Halstead metrics
    if (report.metrics.halstead) {
      csv += `Halstead Vocabulary,${report.metrics.halstead.vocabulary}\n`;
      csv += `Halstead Length,${report.metrics.halstead.length}\n`;
      csv += `Halstead Volume,${report.metrics.halstead.volume}\n`;
      csv += `Halstead Difficulty,${report.metrics.halstead.difficulty}\n`;
      csv += `Halstead Effort,${report.metrics.halstead.effort}\n`;
      csv += `Halstead Time,${report.metrics.halstead.time}\n`;
      csv += `Halstead Bugs,${report.metrics.halstead.bugs}\n`;
    }
    
    // Cognitive complexity
    if (report.metrics.cognitiveComplexity !== undefined) {
      csv += `Cognitive Complexity,${report.metrics.cognitiveComplexity}\n`;
    }
    
    // Quality gates
    csv += `\nQuality Gate,Threshold,Actual,Status\n`;
    report.qualityGates.forEach(gate => {
      csv += `${gate.name},${gate.threshold},${gate.actual.toFixed(2)},${gate.passed ? 'Pass' : 'Fail'}\n`;
    });
    
    // Issues summary
    csv += `\nIssue Severity,Count\n`;
    const severityCounts = {
      critical: report.antiPatterns.filter(p => p.severity === 'critical').length,
      high: report.antiPatterns.filter(p => p.severity === 'high').length,
      medium: report.antiPatterns.filter(p => p.severity === 'medium').length,
      low: report.antiPatterns.filter(p => p.severity === 'low').length
    };
    csv += `Critical,${severityCounts.critical}\n`;
    csv += `High,${severityCounts.high}\n`;
    csv += `Medium,${severityCounts.medium}\n`;
    csv += `Low,${severityCounts.low}\n`;
    csv += `Total Issues,${report.antiPatterns.length}\n`;
    
    // Proposals summary
    csv += `\nProposal Priority,Count\n`;
    const priorityCounts = {
      critical: report.proposals.filter(p => p.priority === 'critical').length,
      high: report.proposals.filter(p => p.priority === 'high').length,
      medium: report.proposals.filter(p => p.priority === 'medium').length,
      low: report.proposals.filter(p => p.priority === 'low').length
    };
    csv += `Critical,${priorityCounts.critical}\n`;
    csv += `High,${priorityCounts.high}\n`;
    csv += `Medium,${priorityCounts.medium}\n`;
    csv += `Low,${priorityCounts.low}\n`;
    csv += `Total Proposals,${report.proposals.length}\n`;
    
    return csv;
  }
}
