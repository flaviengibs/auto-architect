import { DependencyGraph, Module, AntiPattern, RefactoringProposal, ArchitectureMetrics } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface RefactoringPlan {
  id: string;
  name: string;
  description: string;
  proposals: RefactoringProposal[];
  estimatedTotalEffort: number;
  expectedImpact: {
    healthScoreGain: number;
    complexityReduction: number;
    couplingReduction: number;
  };
  phases: RefactoringPhase[];
  risks: Risk[];
}

export interface RefactoringPhase {
  phase: number;
  name: string;
  proposals: string[];
  duration: string;
  dependencies: number[];
}

export interface Risk {
  type: 'technical' | 'business' | 'timeline';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface AutoRefactoringResult {
  module: string;
  refactoringType: string;
  changes: CodeChange[];
  success: boolean;
  message: string;
}

export interface CodeChange {
  file: string;
  lineStart: number;
  lineEnd: number;
  oldCode: string;
  newCode: string;
  description: string;
}

export class SmartRefactoringAssistant {
  /**
   * Generate a comprehensive refactoring plan
   */
  generateRefactoringPlan(
    proposals: RefactoringProposal[],
    metrics: ArchitectureMetrics
  ): RefactoringPlan {
    const sortedProposals = this.prioritizeProposals(proposals);
    const phases = this.createPhases(sortedProposals);
    const risks = this.identifyRisks(sortedProposals, metrics);

    const totalEffort = sortedProposals.reduce((sum, p) => sum + p.estimatedImpact.effortHours, 0);
    const expectedImpact = this.calculateExpectedImpact(sortedProposals);

    return {
      id: `plan-${Date.now()}`,
      name: 'Architecture refactoring plan',
      description: 'Comprehensive plan to improve code quality and architecture',
      proposals: sortedProposals,
      estimatedTotalEffort: totalEffort,
      expectedImpact,
      phases,
      risks
    };
  }

  /**
   * Prioritize proposals using weighted scoring
   */
  private prioritizeProposals(proposals: RefactoringProposal[]): RefactoringProposal[] {
    return proposals
      .map(p => ({
        proposal: p,
        score: this.calculateProposalScore(p)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.proposal);
  }

  /**
   * Calculate proposal priority score
   */
  private calculateProposalScore(proposal: RefactoringProposal): number {
    const priorityWeight = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    const riskPenalty = {
      low: 0,
      medium: 10,
      high: 25
    };

    const impactScore = 
      proposal.estimatedImpact.complexityReduction * 2 +
      proposal.estimatedImpact.couplingReduction * 2 +
      proposal.estimatedImpact.maintainabilityGain * 1.5;

    const effortPenalty = proposal.estimatedImpact.effortHours / 10;

    return (
      priorityWeight[proposal.priority] +
      impactScore -
      riskPenalty[proposal.estimatedImpact.riskLevel] -
      effortPenalty
    );
  }

  /**
   * Create refactoring phases
   */
  private createPhases(proposals: RefactoringProposal[]): RefactoringPhase[] {
    const phases: RefactoringPhase[] = [];
    const proposalsPerPhase = 3;

    for (let i = 0; i < proposals.length; i += proposalsPerPhase) {
      const phaseProposals = proposals.slice(i, i + proposalsPerPhase);
      const totalHours = phaseProposals.reduce((sum, p) => sum + p.estimatedImpact.effortHours, 0);

      phases.push({
        phase: phases.length + 1,
        name: `Phase ${phases.length + 1}: ${this.getPhaseDescription(phaseProposals)}`,
        proposals: phaseProposals.map(p => p.description),
        duration: this.formatDuration(totalHours),
        dependencies: phases.length > 0 ? [phases.length] : []
      });
    }

    return phases;
  }

  /**
   * Get phase description based on proposals
   */
  private getPhaseDescription(proposals: RefactoringProposal[]): string {
    const types = proposals.map(p => p.type);
    
    if (types.some(t => t.includes('cycle'))) {
      return 'Break circular dependencies';
    } else if (types.some(t => t.includes('split') || t.includes('extract'))) {
      return 'Decompose large modules';
    } else if (types.some(t => t.includes('merge') || t.includes('inline'))) {
      return 'Consolidate small modules';
    } else {
      return 'Code quality improvements';
    }
  }

  /**
   * Format duration in human-readable form
   */
  private formatDuration(hours: number): string {
    if (hours < 8) {
      return `${hours} hours`;
    } else if (hours < 40) {
      return `${Math.ceil(hours / 8)} days`;
    } else {
      return `${Math.ceil(hours / 40)} weeks`;
    }
  }

  /**
   * Identify risks
   */
  private identifyRisks(proposals: RefactoringProposal[], metrics: ArchitectureMetrics): Risk[] {
    const risks: Risk[] = [];

    // High complexity risk
    if (metrics.cyclomaticComplexity > 15) {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: 'High code complexity may make refactoring error-prone',
        mitigation: 'Increase test coverage before refactoring, use incremental changes'
      });
    }

    // Low test coverage risk
    if (metrics.testCoverage < 50) {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: 'Low test coverage increases risk of introducing bugs',
        mitigation: 'Add tests for critical paths before refactoring'
      });
    }

    // Large scope risk
    const totalEffort = proposals.reduce((sum, p) => sum + p.estimatedImpact.effortHours, 0);
    if (totalEffort > 160) {
      risks.push({
        type: 'timeline',
        severity: 'medium',
        description: 'Large refactoring scope may impact delivery timelines',
        mitigation: 'Break into smaller phases, prioritize critical issues'
      });
    }

    // High-risk proposals
    const highRiskCount = proposals.filter(p => p.estimatedImpact.riskLevel === 'high').length;
    if (highRiskCount > 3) {
      risks.push({
        type: 'business',
        severity: 'medium',
        description: 'Multiple high-risk refactorings may disrupt development',
        mitigation: 'Schedule refactorings during low-activity periods'
      });
    }

    return risks;
  }

  /**
   * Calculate expected impact
   */
  private calculateExpectedImpact(proposals: RefactoringProposal[]): RefactoringPlan['expectedImpact'] {
    const totalComplexityReduction = proposals.reduce(
      (sum, p) => sum + p.estimatedImpact.complexityReduction, 0
    );
    const totalCouplingReduction = proposals.reduce(
      (sum, p) => sum + p.estimatedImpact.couplingReduction, 0
    );
    const totalMaintainabilityGain = proposals.reduce(
      (sum, p) => sum + p.estimatedImpact.maintainabilityGain, 0
    );

    // Estimate health score gain (simplified formula)
    const healthScoreGain = Math.min(
      30,
      Math.round(
        (totalComplexityReduction * 0.3 +
        totalCouplingReduction * 0.3 +
        totalMaintainabilityGain * 0.4) / proposals.length
      )
    );

    return {
      healthScoreGain,
      complexityReduction: Math.round(totalComplexityReduction),
      couplingReduction: Math.round(totalCouplingReduction)
    };
  }

  /**
   * Suggest quick wins (low effort, high impact)
   */
  suggestQuickWins(proposals: RefactoringProposal[]): RefactoringProposal[] {
    return proposals
      .filter(p => 
        p.estimatedImpact.effortHours <= 8 &&
        (p.estimatedImpact.complexityReduction >= 5 || 
         p.estimatedImpact.maintainabilityGain >= 5)
      )
      .slice(0, 5);
  }

  /**
   * Generate code preview for a refactoring
   */
  generateCodePreview(
    proposal: RefactoringProposal,
    projectPath: string
  ): { before: string; after: string } | null {
    if (!proposal.codeExample) {
      return null;
    }

    // In a real implementation, this would read the actual file
    // and generate a proper before/after comparison
    return {
      before: '// Current code structure',
      after: proposal.codeExample
    };
  }

  /**
   * Validate refactoring safety
   */
  validateRefactoringSafety(
    proposal: RefactoringProposal,
    graph: DependencyGraph,
    metrics: ArchitectureMetrics
  ): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check test coverage
    if (metrics.testCoverage < 70) {
      warnings.push('Low test coverage may make refactoring risky');
    }

    // Check affected modules
    if (proposal.affectedModules.length > 10) {
      warnings.push(`Affects ${proposal.affectedModules.length} modules - consider smaller scope`);
    }

    // Check for circular dependencies
    const affectedModules = proposal.affectedModules.map(name => 
      graph.modules.get(name)
    ).filter(m => m !== undefined) as Module[];

    const hasCircularDeps = affectedModules.some(m => 
      m.dependencies.some(dep => m.dependents.includes(dep))
    );

    if (hasCircularDeps) {
      warnings.push('Circular dependencies detected in affected modules');
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  /**
   * Export refactoring plan as markdown
   */
  exportPlanAsMarkdown(plan: RefactoringPlan): string {
    let md = `# ${plan.name}\n\n`;
    md += `${plan.description}\n\n`;
    md += `**Estimated effort:** ${plan.estimatedTotalEffort} hours\n`;
    md += `**Expected health score gain:** +${plan.expectedImpact.healthScoreGain}\n\n`;

    md += `## Expected impact\n\n`;
    md += `- Complexity reduction: ${plan.expectedImpact.complexityReduction}\n`;
    md += `- Coupling reduction: ${plan.expectedImpact.couplingReduction}\n`;
    md += `- Health score gain: +${plan.expectedImpact.healthScoreGain}\n\n`;

    md += `## Phases\n\n`;
    plan.phases.forEach(phase => {
      md += `### ${phase.name}\n`;
      md += `**Duration:** ${phase.duration}\n\n`;
      phase.proposals.forEach(p => {
        md += `- ${p}\n`;
      });
      md += '\n';
    });

    md += `## Risks\n\n`;
    plan.risks.forEach(risk => {
      const icon = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
      md += `### ${icon} ${risk.type} - ${risk.severity}\n`;
      md += `**Description:** ${risk.description}\n`;
      md += `**Mitigation:** ${risk.mitigation}\n\n`;
    });

    md += `## Detailed proposals\n\n`;
    plan.proposals.forEach((p, i) => {
      md += `### ${i + 1}. ${p.description}\n`;
      md += `**Type:** ${p.type}\n`;
      md += `**Priority:** ${p.priority}\n`;
      md += `**Effort:** ${p.estimatedImpact.effortHours} hours\n`;
      md += `**Risk:** ${p.estimatedImpact.riskLevel}\n\n`;
      md += `**Steps:**\n`;
      p.steps.forEach(step => {
        md += `1. ${step}\n`;
      });
      md += '\n';
    });

    return md;
  }

  /**
   * Save refactoring plan to file
   */
  savePlan(plan: RefactoringPlan, outputPath: string = 'refactoring-plan.md'): void {
    const markdown = this.exportPlanAsMarkdown(plan);
    fs.writeFileSync(outputPath, markdown);
  }
}
