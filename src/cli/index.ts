#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { ArchitectureAnalyzer } from '../analyzer/architecture-analyzer';
import { DiagramGenerator } from '../visualizer/diagram-generator';
import { Reporter } from './reporter';
import chalk from 'chalk';

const program = new Command();

program
  .name('auto-architect')
  .description('Automatic software architecture optimization system')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze project architecture')
  .argument('[path]', 'Project path to analyze', '.')
  .option('-o, --output <file>', 'Output report to file')
  .option('-d, --diagram <format>', 'Generate diagram (mermaid|dot)')
  .option('-f, --format <type>', 'Output format (json|html|markdown)', 'console')
  .option('--threshold <score>', 'Minimum health score threshold', '70')
  .option('--fail-on-critical', 'Exit with error if critical issues found')
  .option('--compare <file>', 'Compare with previous report for trends')
  .option('--security', 'Include security vulnerability detection')
  .action(async (projectPath: string, options) => {
    try {
      const fullPath = path.resolve(projectPath);
      
      if (!fs.existsSync(fullPath)) {
        console.error(chalk.red(`Error: Path "${fullPath}" does not exist`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n🏗️  Analyzing architecture: ${fullPath}\n`));

      const analyzer = new ArchitectureAnalyzer();
      const report = await analyzer.analyze(fullPath, {
        includeSecurity: options.security,
        compareWith: options.compare
      });

      const reporter = new Reporter();
      
      // Show trends if available
      if (report.trends) {
        const { TrendAnalyzer } = await import('../analyzer/trend-analyzer');
        const trendAnalyzer = new TrendAnalyzer();
        const trendReport = trendAnalyzer.generateTrendReport(report.trends);
        console.log(trendReport);
      }
      
      if (options.format === 'console') {
        reporter.printReport(report);
      } else if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else if (options.format === 'markdown') {
        const md = reporter.generateMarkdown(report);
        console.log(md);
      } else if (options.format === 'html') {
        const html = reporter.generateHTML(report);
        console.log(html);
      }

      if (options.output) {
        const content = options.format === 'json' 
          ? JSON.stringify(report, null, 2)
          : options.format === 'markdown'
          ? reporter.generateMarkdown(report)
          : options.format === 'html'
          ? reporter.generateHTML(report)
          : JSON.stringify(report, null, 2);
        
        fs.writeFileSync(options.output, content);
        console.log(chalk.green(`\n✓ Report saved to ${options.output}`));
      }

      if (options.diagram) {
        const generator = new DiagramGenerator();
        const diagramPath = `architecture.${options.diagram}`;
        
        if (options.diagram === 'mermaid') {
          const diagram = generator.generateMermaid(report.graph, report.antiPatterns);
          fs.writeFileSync(diagramPath, diagram);
        } else if (options.diagram === 'dot') {
          const diagram = generator.generateDOT(report.graph);
          fs.writeFileSync(diagramPath, diagram);
        }
        
        console.log(chalk.green(`✓ Diagram saved to ${diagramPath}\n`));
      }

      // Check thresholds
      const threshold = parseInt(options.threshold);
      if (report.healthScore.overall < threshold) {
        console.log(chalk.red(`\n❌ Health score ${report.healthScore.overall} is below threshold ${threshold}`));
        process.exit(1);
      }

      // Check for critical issues
      if (options.failOnCritical) {
        const criticalIssues = report.antiPatterns.filter(p => p.severity === 'critical');
        if (criticalIssues.length > 0) {
          console.log(chalk.red(`\n❌ Found ${criticalIssues.length} critical issues`));
          process.exit(1);
        }
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Analysis failed:'), error);
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare two analysis reports')
  .argument('<report1>', 'First report file (JSON)')
  .argument('<report2>', 'Second report file (JSON)')
  .action((report1Path: string, report2Path: string) => {
    try {
      const report1 = JSON.parse(fs.readFileSync(report1Path, 'utf-8'));
      const report2 = JSON.parse(fs.readFileSync(report2Path, 'utf-8'));

      console.log(chalk.cyan('\n📊 COMPARISON REPORT\n'));
      
      const healthDiff = report2.healthScore.overall - report1.healthScore.overall;
      const healthColor = healthDiff > 0 ? chalk.green : chalk.red;
      console.log(`Health Score: ${report1.healthScore.overall} → ${report2.healthScore.overall} ${healthColor(`(${healthDiff > 0 ? '+' : ''}${healthDiff})`)}`);
      
      const complexityDiff = report2.metrics.cyclomaticComplexity - report1.metrics.cyclomaticComplexity;
      const complexityColor = complexityDiff < 0 ? chalk.green : chalk.red;
      console.log(`Complexity: ${report1.metrics.cyclomaticComplexity} → ${report2.metrics.cyclomaticComplexity} ${complexityColor(`(${complexityDiff > 0 ? '+' : ''}${complexityDiff.toFixed(2)})`)}`);
      
      const issuesDiff = report2.antiPatterns.length - report1.antiPatterns.length;
      const issuesColor = issuesDiff < 0 ? chalk.green : chalk.red;
      console.log(`Issues: ${report1.antiPatterns.length} → ${report2.antiPatterns.length} ${issuesColor(`(${issuesDiff > 0 ? '+' : ''}${issuesDiff})`)}\n`);

    } catch (error) {
      console.error(chalk.red('Error comparing reports:'), error);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch project and re-analyze on changes')
  .argument('[path]', 'Project path to watch', '.')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '2000')
  .option('--threshold <score>', 'Minimum health score threshold', '70')
  .option('-f, --format <type>', 'Output format (console|json)', 'console')
  .action(async (projectPath: string, options) => {
    const { ProjectWatcher } = await import('./watcher');
    const watcher = new ProjectWatcher();
    
    await watcher.watch(projectPath, {
      debounce: parseInt(options.debounce),
      threshold: parseInt(options.threshold),
      format: options.format
    });
  });

program.parse();
