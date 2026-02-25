import * as fs from 'fs';
import * as path from 'path';
import { ArchitectureAnalyzer } from '../analyzer/architecture-analyzer';
import { Reporter } from './reporter';
import chalk from 'chalk';

export class ProjectWatcher {
  private analyzer = new ArchitectureAnalyzer();
  private reporter = new Reporter();
  private watchedFiles = new Set<string>();
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastAnalysis: Date | null = null;

  async watch(projectPath: string, options: {
    debounce?: number;
    threshold?: number;
    format?: string;
  } = {}): Promise<void> {
    const debounceMs = options.debounce || 2000;
    const fullPath = path.resolve(projectPath);

    console.log(chalk.cyan(`\n👀 Watching ${fullPath} for changes...\n`));
    console.log(chalk.gray(`Debounce: ${debounceMs}ms`));
    console.log(chalk.gray(`Press Ctrl+C to stop\n`));

    // Initial analysis
    await this.runAnalysis(fullPath, options);

    // Watch for changes
    this.watchDirectory(fullPath, () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        console.log(chalk.yellow('\n🔄 Changes detected, re-analyzing...\n'));
        await this.runAnalysis(fullPath, options);
      }, debounceMs);
    });
  }

  private async runAnalysis(projectPath: string, options: any): Promise<void> {
    try {
      const startTime = Date.now();
      const report = await this.analyzer.analyze(projectPath);
      const duration = Date.now() - startTime;

      console.log(chalk.gray(`Analysis completed in ${duration}ms\n`));

      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else {
        this.reporter.printReport(report);
      }

      // Check threshold
      if (options.threshold && report.healthScore.overall < options.threshold) {
        console.log(chalk.red(`\n⚠️  Health score ${report.healthScore.overall} is below threshold ${options.threshold}`));
      }

      this.lastAnalysis = new Date();
      console.log(chalk.gray(`\nLast analysis: ${this.lastAnalysis.toLocaleTimeString()}`));
      console.log(chalk.gray('Watching for changes...\n'));

    } catch (error) {
      console.error(chalk.red('Analysis failed:'), error);
    }
  }

  private watchDirectory(dir: string, onChange: () => void): void {
    try {
      const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(dir, filename);
        
        // Only watch source files
        if (this.isSourceFile(filename) && !this.shouldSkip(filename)) {
          onChange();
        }
      });

      // Handle process termination
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n👋 Stopping watcher...\n'));
        watcher.close();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('Failed to watch directory:'), error);
    }
  }

  private isSourceFile(filename: string): boolean {
    return /\.(ts|js|tsx|jsx|java|py)$/.test(filename);
  }

  private shouldSkip(filename: string): boolean {
    const skipPatterns = [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      '__pycache__',
      '.pytest_cache',
      'target' // Java
    ];

    return skipPatterns.some(pattern => filename.includes(pattern));
  }
}
