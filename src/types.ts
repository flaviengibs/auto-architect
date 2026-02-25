export interface Module {
  name: string;
  path: string;
  dependencies: string[];
  dependents: string[];
  size: number;
  complexity: number;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  exports: string[];
  imports: ImportInfo[];
  hasTests: boolean;
  testCoverage?: number;
  category?: 'core' | 'feature' | 'utility' | 'test' | 'config';
  duplicationScore?: number;
}

export interface FunctionInfo {
  name: string;
  complexity: number;
  lines: number;
  parameters: number;
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassInfo {
  name: string;
  methods: number;
  properties: number;
  extends?: string;
  implements: string[];
  isExported: boolean;
}

export interface ImportInfo {
  module: string;
  isExternal: boolean;
  items: string[];
}

export interface DependencyGraph {
  modules: Map<string, Module>;
  edges: Array<{ from: string; to: string }>;
}

export interface ArchitectureMetrics {
  totalModules: number;
  totalLines: number;
  avgDependencies: number;
  maxDependencies: number;
  cyclomaticComplexity: number;
  coupling: number;
  cohesion: number;
  instability: number;
  abstractness: number;
  distanceFromMainSequence: number;
  modularity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage: number;
  codeSmells: number;
  hotspots: string[];
  halstead?: {
    vocabulary: number;
    length: number;
    volume: number;
    difficulty: number;
    effort: number;
    time: number;
    bugs: number;
  };
  cognitiveComplexity?: number;
  // New enhanced metrics
  dependencyDepth?: {
    average: number;
    maximum: number;
    deepestChain: string[];
  };
  duplication?: {
    percentage: number;
    duplicatedBlocks: number;
    duplicatedLines: number;
  };
  moduleCategories?: {
    core: number;
    feature: number;
    utility: number;
    test: number;
    config: number;
  };
  fanIn?: number;  // Average number of modules depending on each module
  fanOut?: number; // Average number of modules each module depends on
  lackOfCohesionMethods?: number; // LCOM metric
  afferentCoupling?: number; // Ca - incoming dependencies
  efferentCoupling?: number; // Ce - outgoing dependencies
}

export interface AntiPattern {
  type: AntiPatternType;
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  location?: string;
  suggestion?: string;
}

export type AntiPatternType = 
  | 'god-module'
  | 'circular-dependency'
  | 'tight-coupling'
  | 'dead-code'
  | 'shotgun-surgery'
  | 'feature-envy'
  | 'data-clump'
  | 'long-parameter-list'
  | 'large-class'
  | 'lazy-class'
  | 'speculative-generality'
  | 'inappropriate-intimacy'
  | 'message-chains'
  | 'middle-man'
  | 'divergent-change'
  | 'parallel-inheritance'
  | 'refused-bequest';

export interface RefactoringProposal {
  type: RefactoringType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target: string[];
  description: string;
  estimatedImpact: {
    complexityReduction: number;
    couplingReduction: number;
    maintainabilityGain: number;
    effortHours: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  steps: string[];
  codeExample?: string;
  affectedModules: string[];
}

export type RefactoringType =
  | 'extract-service'
  | 'split-module'
  | 'merge-modules'
  | 'break-cycle'
  | 'extract-interface'
  | 'move-method'
  | 'extract-class'
  | 'inline-class'
  | 'introduce-parameter-object'
  | 'replace-conditional-with-polymorphism'
  | 'decompose-conditional'
  | 'consolidate-duplicate-code';

export interface AnalysisReport {
  projectPath: string;
  timestamp: string;
  metrics: ArchitectureMetrics;
  antiPatterns: AntiPattern[];
  proposals: RefactoringProposal[];
  graph: DependencyGraph;
  healthScore: HealthScore;
  qualityGates: QualityGate[];
  trends?: TrendAnalysis;
  performance?: any;
  git?: any;
}

export interface HealthScore {
  overall: number;
  architecture: number;
  maintainability: number;
  testability: number;
  security: number;
  performance: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface QualityGate {
  name: string;
  passed: boolean;
  threshold: number;
  actual: number;
  severity: 'info' | 'warning' | 'error';
}

export interface TrendAnalysis {
  previousReport?: AnalysisReport;
  improvements: string[];
  regressions: string[];
  metricsChange: Record<string, number>;
}
