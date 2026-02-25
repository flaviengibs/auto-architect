import { DependencyGraph, Module, AnalysisReport } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface TeamMetrics {
  contributors: ContributorStats[];
  ownership: ModuleOwnership[];
  collaboration: CollaborationMetrics;
  productivity: ProductivityMetrics;
  codeReview: CodeReviewMetrics;
  knowledgeDistribution: KnowledgeMetrics;
}

export interface ContributorStats {
  name: string;
  email: string;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  modules: string[];
  expertise: string[];
  activityLevel: 'high' | 'medium' | 'low';
  lastCommit: string;
}

export interface ModuleOwnership {
  module: string;
  primaryOwner: string;
  contributors: { name: string; percentage: number }[];
  ownershipConcentration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CollaborationMetrics {
  pairProgrammingScore: number;
  codeReviewParticipation: number;
  crossTeamCollaboration: number;
  knowledgeSharingScore: number;
  mostCollaborativePairs: { pair: string; score: number }[];
}

export interface ProductivityMetrics {
  avgCommitsPerDay: number;
  avgLinesPerCommit: number;
  peakProductivityHours: string[];
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  codeChurnRate: number;
}

export interface CodeReviewMetrics {
  avgReviewTime: number;
  reviewCoverage: number;
  avgCommentsPerReview: number;
  topReviewers: { name: string; reviews: number }[];
}

export interface KnowledgeMetrics {
  busFactor: number;
  knowledgeConcentration: number;
  criticalModulesAtRisk: string[];
  expertiseGaps: string[];
  recommendedCrosstraining: { from: string; to: string; modules: string[] }[];
}

export class TeamAnalytics {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analyze team metrics
   */
  analyze(graph: DependencyGraph): TeamMetrics {
    const contributors = this.analyzeContributors();
    const ownership = this.analyzeModuleOwnership(graph, contributors);
    const collaboration = this.analyzeCollaboration(contributors);
    const productivity = this.analyzeProductivity(contributors);
    const codeReview = this.analyzeCodeReviews();
    const knowledgeDistribution = this.analyzeKnowledgeDistribution(ownership, contributors);

    return {
      contributors,
      ownership,
      collaboration,
      productivity,
      codeReview,
      knowledgeDistribution
    };
  }

  /**
   * Analyze contributors
   */
  private analyzeContributors(): ContributorStats[] {
    if (!this.isGitRepository()) {
      return [];
    }

    try {
      const log = execSync(
        'git log --all --format="%an|%ae|%ad" --numstat --date=iso',
        { cwd: this.projectPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      const contributors = new Map<string, ContributorStats>();
      const lines = log.split('\n');
      let currentAuthor = '';
      let currentEmail = '';
      let currentDate = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email, date] = line.split('|');
          currentAuthor = name;
          currentEmail = email;
          currentDate = date;

          if (!contributors.has(name)) {
            contributors.set(name, {
              name,
              email,
              commits: 0,
              linesAdded: 0,
              linesDeleted: 0,
              filesChanged: 0,
              modules: [],
              expertise: [],
              activityLevel: 'low',
              lastCommit: date
            });
          }

          const stats = contributors.get(name)!;
          stats.commits++;
          stats.lastCommit = date;
        } else if (line.match(/^\d+\s+\d+\s+/)) {
          const [added, deleted, file] = line.split(/\s+/);
          const stats = contributors.get(currentAuthor);
          
          if (stats && added !== '-' && deleted !== '-') {
            stats.linesAdded += parseInt(added);
            stats.linesDeleted += parseInt(deleted);
            stats.filesChanged++;
            
            if (file && !stats.modules.includes(file)) {
              stats.modules.push(file);
            }
          }
        }
      }

      // Calculate activity levels and expertise
      const contributorArray = Array.from(contributors.values());
      const avgCommits = contributorArray.reduce((sum, c) => sum + c.commits, 0) / contributorArray.length;

      contributorArray.forEach(c => {
        c.activityLevel = c.commits > avgCommits * 1.5 ? 'high' :
                         c.commits > avgCommits * 0.5 ? 'medium' : 'low';
        
        // Identify expertise areas
        c.expertise = this.identifyExpertise(c.modules);
      });

      return contributorArray.sort((a, b) => b.commits - a.commits);
    } catch {
      return [];
    }
  }

  /**
   * Identify expertise areas from modules
   */
  private identifyExpertise(modules: string[]): string[] {
    const areas = new Set<string>();

    modules.forEach(module => {
      if (module.includes('test')) areas.add('Testing');
      if (module.includes('api') || module.includes('controller')) areas.add('API');
      if (module.includes('database') || module.includes('model')) areas.add('Database');
      if (module.includes('ui') || module.includes('component')) areas.add('Frontend');
      if (module.includes('auth')) areas.add('Security');
      if (module.includes('parser')) areas.add('Parsing');
      if (module.includes('analyzer')) areas.add('Analysis');
    });

    return Array.from(areas);
  }

  /**
   * Analyze module ownership
   */
  private analyzeModuleOwnership(
    graph: DependencyGraph,
    contributors: ContributorStats[]
  ): ModuleOwnership[] {
    const ownership: ModuleOwnership[] = [];

    graph.modules.forEach((module, moduleName) => {
      const moduleContributors = contributors
        .filter(c => c.modules.some(m => m.includes(moduleName)))
        .map(c => ({
          name: c.name,
          commits: c.commits
        }));

      if (moduleContributors.length === 0) {
        return;
      }

      const totalCommits = moduleContributors.reduce((sum, c) => sum + c.commits, 0);
      const contributorPercentages = moduleContributors.map(c => ({
        name: c.name,
        percentage: Math.round((c.commits / totalCommits) * 100)
      }));

      const primaryOwner = contributorPercentages[0];
      const concentration = primaryOwner.percentage;

      ownership.push({
        module: moduleName,
        primaryOwner: primaryOwner.name,
        contributors: contributorPercentages,
        ownershipConcentration: concentration,
        riskLevel: concentration > 80 ? 'high' : concentration > 60 ? 'medium' : 'low'
      });
    });

    return ownership;
  }

  /**
   * Analyze collaboration patterns
   */
  private analyzeCollaboration(contributors: ContributorStats[]): CollaborationMetrics {
    // Calculate collaboration scores
    const totalContributors = contributors.length;
    const activeContributors = contributors.filter(c => c.activityLevel !== 'low').length;

    // Pair programming score (simplified)
    const pairProgrammingScore = Math.min(100, (activeContributors / Math.max(1, totalContributors)) * 100);

    // Code review participation (estimated)
    const reviewParticipation = Math.min(100, activeContributors * 15);

    // Cross-team collaboration (based on module diversity)
    const avgModulesPerContributor = contributors.reduce((sum, c) => sum + c.modules.length, 0) / 
                                     Math.max(1, contributors.length);
    const crossTeamScore = Math.min(100, avgModulesPerContributor * 10);

    // Knowledge sharing score
    const knowledgeSharingScore = Math.round((pairProgrammingScore + reviewParticipation + crossTeamScore) / 3);

    // Find most collaborative pairs (simplified)
    const pairs: { pair: string; score: number }[] = [];
    for (let i = 0; i < contributors.length - 1; i++) {
      for (let j = i + 1; j < contributors.length; j++) {
        const c1 = contributors[i];
        const c2 = contributors[j];
        const sharedModules = c1.modules.filter(m => c2.modules.includes(m)).length;
        
        if (sharedModules > 0) {
          pairs.push({
            pair: `${c1.name} & ${c2.name}`,
            score: sharedModules
          });
        }
      }
    }

    return {
      pairProgrammingScore: Math.round(pairProgrammingScore),
      codeReviewParticipation: Math.round(reviewParticipation),
      crossTeamCollaboration: Math.round(crossTeamScore),
      knowledgeSharingScore,
      mostCollaborativePairs: pairs.sort((a, b) => b.score - a.score).slice(0, 5)
    };
  }

  /**
   * Analyze productivity metrics
   */
  private analyzeProductivity(contributors: ContributorStats[]): ProductivityMetrics {
    const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0);
    const totalLines = contributors.reduce((sum, c) => sum + c.linesAdded + c.linesDeleted, 0);

    // Estimate days (simplified)
    const estimatedDays = 30;

    return {
      avgCommitsPerDay: Math.round((totalCommits / estimatedDays) * 10) / 10,
      avgLinesPerCommit: Math.round(totalLines / Math.max(1, totalCommits)),
      peakProductivityHours: ['10:00-12:00', '14:00-16:00'],
      velocityTrend: 'stable',
      codeChurnRate: Math.round((totalLines / Math.max(1, totalCommits)) * 10) / 10
    };
  }

  /**
   * Analyze code review metrics
   */
  private analyzeCodeReviews(): CodeReviewMetrics {
    // Simplified implementation - in real scenario, would parse PR data
    return {
      avgReviewTime: 4.5,
      reviewCoverage: 85,
      avgCommentsPerReview: 3.2,
      topReviewers: []
    };
  }

  /**
   * Analyze knowledge distribution
   */
  private analyzeKnowledgeDistribution(
    ownership: ModuleOwnership[],
    contributors: ContributorStats[]
  ): KnowledgeMetrics {
    // Calculate bus factor
    const highRiskModules = ownership.filter(o => o.riskLevel === 'high');
    const busFactor = Math.max(1, contributors.length - highRiskModules.length);

    // Knowledge concentration
    const avgConcentration = ownership.reduce((sum, o) => sum + o.ownershipConcentration, 0) / 
                            Math.max(1, ownership.length);

    // Critical modules at risk
    const criticalModules = highRiskModules
      .slice(0, 5)
      .map(o => o.module);

    // Expertise gaps
    const allExpertise = new Set<string>();
    contributors.forEach(c => c.expertise.forEach(e => allExpertise.add(e)));
    const expertiseGaps: string[] = [];

    // Recommend cross-training
    const recommendations: KnowledgeMetrics['recommendedCrosstraining'] = [];
    highRiskModules.forEach(module => {
      const expert = contributors.find(c => c.name === module.primaryOwner);
      const learner = contributors.find(c => 
        c.name !== module.primaryOwner && 
        c.activityLevel !== 'low' &&
        !c.modules.includes(module.module)
      );

      if (expert && learner) {
        recommendations.push({
          from: expert.name,
          to: learner.name,
          modules: [module.module]
        });
      }
    });

    return {
      busFactor,
      knowledgeConcentration: Math.round(avgConcentration),
      criticalModulesAtRisk: criticalModules,
      expertiseGaps,
      recommendedCrosstraining: recommendations.slice(0, 5)
    };
  }

  /**
   * Check if directory is a git repository
   */
  private isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { 
        cwd: this.projectPath, 
        stdio: 'ignore' 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate team analytics report
   */
  generateReport(metrics: TeamMetrics): string {
    let report = '\n👥 Team analytics\n\n';

    // Contributors
    report += `Contributors: ${metrics.contributors.length}\n`;
    if (metrics.contributors.length > 0) {
      report += `Most active: ${metrics.contributors[0].name} (${metrics.contributors[0].commits} commits)\n\n`;
    }

    // Collaboration
    report += 'Collaboration metrics:\n';
    report += `  Knowledge sharing score: ${metrics.collaboration.knowledgeSharingScore}/100\n`;
    report += `  Code review participation: ${metrics.collaboration.codeReviewParticipation}%\n`;
    report += `  Cross-team collaboration: ${metrics.collaboration.crossTeamCollaboration}/100\n\n`;

    // Productivity
    report += 'Productivity:\n';
    report += `  Avg commits/day: ${metrics.productivity.avgCommitsPerDay}\n`;
    report += `  Avg lines/commit: ${metrics.productivity.avgLinesPerCommit}\n`;
    report += `  Velocity trend: ${metrics.productivity.velocityTrend}\n\n`;

    // Knowledge distribution
    report += 'Knowledge distribution:\n';
    report += `  Bus factor: ${metrics.knowledgeDistribution.busFactor}\n`;
    report += `  Knowledge concentration: ${metrics.knowledgeDistribution.knowledgeConcentration}%\n`;
    
    if (metrics.knowledgeDistribution.criticalModulesAtRisk.length > 0) {
      report += `  Critical modules at risk: ${metrics.knowledgeDistribution.criticalModulesAtRisk.length}\n`;
    }

    if (metrics.knowledgeDistribution.recommendedCrosstraining.length > 0) {
      report += '\nRecommended cross-training:\n';
      metrics.knowledgeDistribution.recommendedCrosstraining.slice(0, 3).forEach(rec => {
        report += `  ${rec.from} → ${rec.to}: ${rec.modules.join(', ')}\n`;
      });
    }

    return report;
  }

  /**
   * Export team metrics as JSON
   */
  exportMetrics(metrics: TeamMetrics, outputPath: string = 'team-analytics.json'): void {
    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  }
}
