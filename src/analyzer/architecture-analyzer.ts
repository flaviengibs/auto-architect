import { DependencyParser } from '../parser/dependency-parser';
import { MetricsAnalyzer } from './metrics-analyzer';
import { AntiPatternDetector } from '../detector/anti-pattern-detector';
import { CodeSmellDetector } from '../detector/code-smell-detector';
import { SecurityDetector } from '../detector/security-detector';
import { RefactoringOptimizer } from '../optimizer/refactoring-optimizer';
import { HealthScorer } from './health-scorer';
import { TrendAnalyzer } from './trend-analyzer';
import { AnalysisReport } from '../types';

export class ArchitectureAnalyzer {
  private parser = new DependencyParser();
  private metricsAnalyzer = new MetricsAnalyzer();
  private antiPatternDetector = new AntiPatternDetector();
  private codeSmellDetector = new CodeSmellDetector();
  private securityDetector = new SecurityDetector();
  private optimizer = new RefactoringOptimizer();
  private healthScorer = new HealthScorer();
  private trendAnalyzer = new TrendAnalyzer();

  async analyze(projectPath: string, options: {
    includeSecurity?: boolean;
    compareWith?: string;
  } = {}): Promise<AnalysisReport> {
    console.log('🔍 Parsing project dependencies...');
    const graph = await this.parser.parseProject(projectPath);

    console.log('📊 Calculating architecture metrics...');
    let metrics = this.metricsAnalyzer.analyze(graph, projectPath);

    console.log('🚨 Detecting anti-patterns...');
    const antiPatterns = this.antiPatternDetector.detect(graph);
    
    console.log('🔬 Analyzing code smells...');
    const codeSmells = this.codeSmellDetector.detectSmells(graph.modules);
    
    // Combine all issues
    let allIssues = [...antiPatterns, ...codeSmells];
    
    // Optional security analysis
    if (options.includeSecurity) {
      console.log('🔒 Detecting security vulnerabilities...');
      const securityIssues = this.securityDetector.detectVulnerabilities(graph.modules, projectPath);
      allIssues = [...allIssues, ...securityIssues];
    }
    
    // Update metrics with code smell count
    metrics = { ...metrics, codeSmells: codeSmells.length };

    console.log('💡 Generating refactoring proposals...');
    const proposals = this.optimizer.generateProposals(graph, allIssues, metrics);

    console.log('🏥 Calculating health score...');
    const healthScore = this.healthScorer.calculateHealthScore(metrics, allIssues);
    const qualityGates = this.healthScorer.generateQualityGates(metrics, allIssues);

    const report: AnalysisReport = {
      projectPath,
      timestamp: new Date().toISOString(),
      metrics,
      antiPatterns: allIssues,
      proposals,
      graph,
      healthScore,
      qualityGates
    };

    // Optional trend analysis
    if (options.compareWith) {
      console.log('📈 Analyzing trends...');
      const trends = this.trendAnalyzer.analyzeTrends(report, options.compareWith);
      if (trends) {
        report.trends = trends;
      }
    }

    return report;
  }
}
