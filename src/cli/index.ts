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
  .version('3.2.0');

program
  .command('analyze')
  .description('Analyze project architecture')
  .argument('[path]', 'Project path to analyze', '.')
  .option('-o, --output <file>', 'Output report to file')
  .option('-d, --diagram <format>', 'Generate diagram (mermaid|dot)')
  .option('-f, --format <type>', 'Output format (json|html|markdown|csv)', 'console')
  .option('--threshold <score>', 'Minimum health score threshold', '70')
  .option('--fail-on-critical', 'Exit with error if critical issues found')
  .option('--compare <file>', 'Compare with previous report for trends')
  .option('--security', 'Include security vulnerability detection')
  .option('--performance', 'Include performance analysis')
  .option('--git', 'Include Git history analysis')
  .option('--docs', 'Generate documentation')
  .option('--heatmap', 'Generate complexity heatmap')
  .option('--trends', 'Track code quality trends over time')
  .option('--compare-industry', 'Compare against industry benchmarks')
  .option('--refactoring-plan', 'Generate smart refactoring plan')
  .option('--team', 'Analyze team metrics and collaboration')
  .option('--dashboard', 'Generate interactive HTML dashboard')
  .option('--plugins <dir>', 'Load and execute plugins from directory')
  .option('--verbose', 'Show detailed analysis output with debug information')
  .option('--quiet', 'Only show critical issues and final score')
  .option('--summary', 'Show only summary without detailed breakdowns')
  .option('--include <pattern>', 'Include files matching pattern (glob)')
  .option('--exclude <pattern>', 'Exclude files matching pattern (glob)')
  .option('--config <file>', 'Load configuration from file')
  .action(async (projectPath: string, options) => {
    try {
      const fullPath = path.resolve(projectPath);
      
      if (!fs.existsSync(fullPath)) {
        console.error(chalk.red(`Error: Path "${fullPath}" does not exist`));
        process.exit(1);
      }

      // Load config file if provided
      let config: any = {};
      if (options.config && fs.existsSync(options.config)) {
        config = JSON.parse(fs.readFileSync(options.config, 'utf-8'));
        if (!options.quiet) {
          console.log(chalk.cyan(`📋 Loaded configuration from ${options.config}`));
        }
      }

      // Merge CLI options with config file (CLI takes precedence)
      const analysisOptions = {
        includeSecurity: options.security ?? config.security ?? false,
        includePerformance: options.performance ?? config.performance ?? false,
        includeGit: options.git ?? config.git ?? false,
        generateDocs: options.docs ?? config.docs ?? false,
        generateHeatmap: options.heatmap ?? config.heatmap ?? false,
        includeTrends: options.trends ?? config.trends ?? false,
        compareIndustry: options.compareIndustry ?? config.compareIndustry ?? false,
        generateRefactoringPlan: options.refactoringPlan ?? config.refactoringPlan ?? false,
        includeTeam: options.team ?? config.team ?? false,
        generateDashboard: options.dashboard ?? config.dashboard ?? false,
        pluginsDir: options.plugins ?? config.plugins,
        compareWith: options.compare ?? config.compareWith,
        includePattern: options.include ?? config.include,
        excludePattern: options.exclude ?? config.exclude,
        verbose: options.verbose ?? config.verbose ?? false,
        quiet: options.quiet ?? config.quiet ?? false,
        summary: options.summary ?? config.summary ?? false,
        threshold: options.threshold ? parseInt(options.threshold) : (config.threshold ?? 70)
      };

      if (!options.quiet) {
        console.log(chalk.cyan(`\n🏗️  Analyzing architecture: ${fullPath}\n`));
        
        if (options.verbose) {
          console.log(chalk.gray('Analysis options:'));
          console.log(chalk.gray(`  - Security scan: ${analysisOptions.includeSecurity}`));
          console.log(chalk.gray(`  - Performance analysis: ${analysisOptions.includePerformance}`));
          console.log(chalk.gray(`  - Git analysis: ${analysisOptions.includeGit}`));
          console.log(chalk.gray(`  - Generate docs: ${analysisOptions.generateDocs}`));
          console.log(chalk.gray(`  - Generate heatmap: ${analysisOptions.generateHeatmap}`));
          console.log(chalk.gray(`  - Track trends: ${analysisOptions.includeTrends}`));
          console.log(chalk.gray(`  - Compare industry: ${analysisOptions.compareIndustry}`));
          console.log(chalk.gray(`  - Refactoring plan: ${analysisOptions.generateRefactoringPlan}`));
          console.log(chalk.gray(`  - Team analytics: ${analysisOptions.includeTeam}`));
          console.log(chalk.gray(`  - Dashboard: ${analysisOptions.generateDashboard}`));
          console.log(chalk.gray(`  - Plugins: ${analysisOptions.pluginsDir || 'none'}`));
          console.log(chalk.gray(`  - Include pattern: ${analysisOptions.includePattern || 'all files'}`));
          console.log(chalk.gray(`  - Exclude pattern: ${analysisOptions.excludePattern || 'none'}`));
          console.log(chalk.gray(`  - Threshold: ${analysisOptions.threshold}\n`));
        }
      }

      const analyzer = new ArchitectureAnalyzer();
      const report = await analyzer.analyze(fullPath, analysisOptions);

      // Performance analysis
      if (analysisOptions.includePerformance && !options.quiet) {
        const { PerformanceAnalyzer } = await import('../analyzer/performance-analyzer');
        const perfAnalyzer = new PerformanceAnalyzer();
        const perfMetrics = perfAnalyzer.analyze(report.graph, fullPath);
        report.performance = perfMetrics;
        
        console.log(chalk.cyan('\n⚡ Performance analysis\n'));
        console.log(`Score: ${perfMetrics.score}/100`);
        console.log(`Total issues: ${perfMetrics.totalIssues} (Critical: ${perfMetrics.criticalIssues}, High: ${perfMetrics.highIssues})`);
        if (perfMetrics.hotspots.length > 0) {
          console.log(`Hotspots: ${perfMetrics.hotspots.slice(0, 3).join(', ')}`);
        }
      }

      // Git analysis
      if (analysisOptions.includeGit && !options.quiet) {
        const { GitAnalyzer } = await import('../analyzer/git-analyzer');
        const gitAnalyzer = new GitAnalyzer(fullPath);
        const gitMetrics = gitAnalyzer.analyze();
        
        if (gitMetrics) {
          report.git = gitMetrics;
          console.log(chalk.cyan('\n📊 Git analysis\n'));
          console.log(`Total commits: ${gitMetrics.totalCommits}`);
          console.log(`Contributors: ${gitMetrics.contributors}`);
          console.log(`Bus factor: ${gitMetrics.busFactor}`);
          console.log(`Code churn rate: ${gitMetrics.codeChurn.churnRate.toLocaleString()} lines`);
          if (gitMetrics.hotFiles.length > 0) {
            console.log(`Most changed file: ${gitMetrics.hotFiles[0].path} (${gitMetrics.hotFiles[0].commits} commits)`);
          }
        }
      }

      // Generate documentation
      if (analysisOptions.generateDocs) {
        const { DocumentationGenerator } = await import('../generator/documentation-generator');
        const docGen = new DocumentationGenerator();
        const docs = docGen.generate(report.graph, { format: 'markdown' });
        const docsPath = 'ARCHITECTURE.md';
        docGen.saveToFile(docs, docsPath);
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Documentation saved to ${docsPath}`));
        }
      }

      // Generate heatmap
      if (analysisOptions.generateHeatmap) {
        const { HeatmapGenerator } = await import('../visualizer/heatmap-generator');
        const heatmapGen = new HeatmapGenerator();
        const heatmapData = heatmapGen.generate(report.graph);
        const heatmapHTML = heatmapGen.generateHTML(heatmapData);
        const heatmapPath = 'complexity-heatmap.html';
        heatmapGen.saveToFile(heatmapHTML, heatmapPath);
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Heatmap saved to ${heatmapPath}`));
        }
      }

      // Track trends
      if (analysisOptions.includeTrends) {
        const { TrendTracker } = await import('../analyzer/trend-tracker');
        const trendTracker = new TrendTracker();
        const trendAnalysis = trendTracker.analyzeTrends(report);
        report.trendAnalysis = trendAnalysis;
        
        if (!options.quiet) {
          console.log(trendTracker.generateTrendReport(trendAnalysis));
        }
        
        // Save to history
        trendTracker.saveToHistory(report);
      }

      // Compare against industry benchmarks
      if (analysisOptions.compareIndustry) {
        const { ArchitectureComparator } = await import('../analyzer/architecture-comparator');
        const comparator = new ArchitectureComparator();
        const comparison = comparator.compare(report, 'web-app');
        report.industryComparison = comparison;
        
        if (!options.quiet) {
          console.log(chalk.cyan('\n🏆 Industry comparison\n'));
          console.log(`Score: ${comparison.score}/100 (Grade: ${comparison.grade})`);
          console.log(`Percentile: ${comparison.percentile}th`);
          
          if (comparison.strengths.length > 0) {
            console.log(`\nStrengths:`);
            comparison.strengths.slice(0, 3).forEach(s => console.log(`  ✓ ${s}`));
          }
          
          if (comparison.weaknesses.length > 0) {
            console.log(`\nWeaknesses:`);
            comparison.weaknesses.slice(0, 3).forEach(w => console.log(`  ✗ ${w}`));
          }
        }
      }

      // Generate refactoring plan
      if (analysisOptions.generateRefactoringPlan) {
        const { SmartRefactoringAssistant } = await import('../optimizer/smart-refactoring');
        const assistant = new SmartRefactoringAssistant();
        const plan = assistant.generateRefactoringPlan(report.proposals, report.metrics);
        report.refactoringPlan = plan;
        
        if (!options.quiet) {
          console.log(chalk.cyan('\n🔧 Smart refactoring plan\n'));
          console.log(`Total effort: ${plan.estimatedTotalEffort} hours`);
          console.log(`Expected health score gain: +${plan.expectedImpact.healthScoreGain}`);
          console.log(`Phases: ${plan.phases.length}`);
          console.log(`Risks: ${plan.risks.length}`);
        }
        
        // Save plan to file
        const planPath = 'refactoring-plan.md';
        assistant.savePlan(plan, planPath);
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Refactoring plan saved to ${planPath}`));
        }
      }

      // Team analytics
      if (analysisOptions.includeTeam) {
        const { TeamAnalytics } = await import('../analyzer/team-analytics');
        const teamAnalytics = new TeamAnalytics(fullPath);
        const teamMetrics = teamAnalytics.analyze(report.graph);
        report.teamMetrics = teamMetrics;
        
        if (!options.quiet) {
          console.log(teamAnalytics.generateReport(teamMetrics));
        }
        
        // Export team metrics
        const teamPath = 'team-analytics.json';
        teamAnalytics.exportMetrics(teamMetrics, teamPath);
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Team analytics saved to ${teamPath}`));
        }
      }

      // Plugin system
      let pluginResults: Map<string, any> | undefined;
      if (analysisOptions.pluginsDir) {
        const { PluginManager } = await import('../plugin/plugin-system');
        const pluginManager = new PluginManager(analysisOptions.pluginsDir);
        
        if (!options.quiet) {
          console.log(chalk.cyan('\n🔌 Loading plugins\n'));
        }
        
        await pluginManager.loadPlugins();
        
        // Execute lifecycle hooks
        const context = {
          report,
          graph: report.graph,
          projectPath: fullPath,
          config: config
        };
        
        await pluginManager.executeHook('onBeforeAnalysis', context);
        
        // Run custom analyzers
        pluginResults = await pluginManager.runCustomAnalyzers(context);
        
        // Collect and apply custom rules
        const customRules = pluginManager.collectCustomRules();
        if (customRules.length > 0 && !options.quiet) {
          console.log(chalk.cyan(`\n✓ Loaded ${customRules.length} custom rules from plugins`));
        }
        
        await pluginManager.executeHook('onAfterAnalysis', context);
      }

      // Generate dashboard
      if (analysisOptions.generateDashboard) {
        const { DashboardGenerator } = await import('../dashboard/dashboard-generator');
        const dashboardGen = new DashboardGenerator();
        
        const dashboardData = {
          report,
          trends: report.trendAnalysis,
          comparison: report.industryComparison,
          teamAnalytics: report.teamMetrics,
          pluginResults
        };
        
        const dashboardHTML = dashboardGen.generateDashboard(dashboardData);
        const dashboardPath = 'dashboard.html';
        dashboardGen.saveDashboard(dashboardHTML, dashboardPath);
        
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Dashboard saved to ${dashboardPath}`));
        }
      }

      const reporter = new Reporter();
      
      // Show trends if available
      if (report.trends && !options.quiet) {
        const { TrendAnalyzer } = await import('../analyzer/trend-analyzer');
        const trendAnalyzer = new TrendAnalyzer();
        const trendReport = trendAnalyzer.generateTrendReport(report.trends);
        console.log(trendReport);
      }
      
      if (options.format === 'console') {
        if (options.quiet) {
          reporter.printQuiet(report);
        } else if (options.summary) {
          reporter.printSummary(report);
        } else {
          reporter.printReport(report, options.verbose);
        }
      } else if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else if (options.format === 'markdown') {
        const md = reporter.generateMarkdown(report);
        console.log(md);
      } else if (options.format === 'html') {
        const html = reporter.generateHTML(report);
        console.log(html);
      } else if (options.format === 'csv') {
        const csv = reporter.generateCSV(report);
        console.log(csv);
      }

      if (options.output) {
        const content = options.format === 'json' 
          ? JSON.stringify(report, null, 2)
          : options.format === 'markdown'
          ? reporter.generateMarkdown(report)
          : options.format === 'html'
          ? reporter.generateHTML(report)
          : options.format === 'csv'
          ? reporter.generateCSV(report)
          : JSON.stringify(report, null, 2);
        
        fs.writeFileSync(options.output, content);
        if (!options.quiet) {
          console.log(chalk.green(`\n✓ Report saved to ${options.output}`));
        }
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
        
        if (!options.quiet) {
          console.log(chalk.green(`✓ Diagram saved to ${diagramPath}\n`));
        }
      }

      // Check thresholds
      const threshold = analysisOptions.threshold;
      if (report.healthScore.overall < threshold) {
        if (!options.quiet) {
          console.log(chalk.red(`\n❌ Health score ${report.healthScore.overall} is below threshold ${threshold}`));
        }
        process.exit(1);
      }

      // Check for critical issues
      if (options.failOnCritical) {
        const criticalIssues = report.antiPatterns.filter(p => p.severity === 'critical');
        if (criticalIssues.length > 0) {
          if (!options.quiet) {
            console.log(chalk.red(`\n❌ Found ${criticalIssues.length} critical issues`));
          }
          process.exit(1);
        }
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Analysis failed:'), error);
      if (options.verbose) {
        console.error(error);
      }
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
