import { DependencyGraph, AntiPattern, RefactoringProposal, ArchitectureMetrics } from '../types';

export class RefactoringOptimizer {
  generateProposals(
    graph: DependencyGraph,
    antiPatterns: AntiPattern[],
    metrics: ArchitectureMetrics
  ): RefactoringProposal[] {
    const proposals: RefactoringProposal[] = [];

    // Group anti-patterns by type for better proposals
    const patternsByType = new Map<string, AntiPattern[]>();
    antiPatterns.forEach(pattern => {
      if (!patternsByType.has(pattern.type)) {
        patternsByType.set(pattern.type, []);
      }
      patternsByType.get(pattern.type)!.push(pattern);
    });

    // Generate proposals for each pattern type
    patternsByType.forEach((patterns) => {
      patterns.slice(0, 3).forEach(pattern => { // Limit to top 3 per type
        switch (pattern.type) {
          case 'god-module':
            proposals.push(this.proposeModuleSplit(pattern, graph, metrics));
            break;
          case 'tight-coupling':
          case 'shotgun-surgery':
            proposals.push(this.proposeServiceExtraction(pattern, graph, metrics));
            break;
          case 'circular-dependency':
          case 'inappropriate-intimacy':
            proposals.push(this.proposeCycleBreaking(pattern, graph, metrics));
            break;
          case 'large-class':
            proposals.push(this.proposeClassExtraction(pattern, graph, metrics));
            break;
          case 'long-parameter-list':
            proposals.push(this.proposeParameterObject(pattern, graph, metrics));
            break;
          case 'feature-envy':
            proposals.push(this.proposeMoveMethod(pattern, graph, metrics));
            break;
          case 'lazy-class':
            proposals.push(this.proposeInlineClass(pattern, graph, metrics));
            break;
          case 'data-clump':
            proposals.push(this.proposeExtractClass(pattern, graph, metrics));
            break;
          case 'dead-code':
            proposals.push(this.proposeRemoveDeadCode(pattern, graph, metrics));
            break;
        }
      });
    });

    // NEW: Generate proposals based on metrics even without anti-patterns
    if (metrics.duplication && metrics.duplication.percentage > 10) {
      proposals.push(this.proposeConsolidateDuplication(metrics, graph));
    }

    if (metrics.dependencyDepth && metrics.dependencyDepth.maximum > 7) {
      proposals.push(this.proposeFlattenDependencies(metrics, graph));
    }

    if (metrics.lackOfCohesionMethods && metrics.lackOfCohesionMethods > 3) {
      proposals.push(this.proposeImproveCohesion(metrics, graph));
    }

    if (metrics.coupling > 30) {
      proposals.push(this.proposeReduceCoupling(metrics, graph));
    }

    // Sort by priority and estimated impact
    return proposals
      .sort((a, b) => {
        const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = priorityScore[a.priority] * a.estimatedImpact.maintainabilityGain;
        const bScore = priorityScore[b.priority] * b.estimatedImpact.maintainabilityGain;
        return bScore - aScore;
      })
      .slice(0, 15); // Top 15 proposals
  }

  private proposeModuleSplit(pattern: AntiPattern, graph: DependencyGraph, metrics: ArchitectureMetrics): RefactoringProposal {
    const module = graph.modules.get(pattern.module);
    const depCount = module?.dependencies.length || 0;
    const dependentCount = module?.dependents.length || 0;
    const affectedModules = module?.dependents || [];
    const moduleSize = module?.size || 0;

    // More accurate impact calculation
    const complexityFactor = Math.min(50, (depCount + dependentCount) * 1.5);
    const sizeFactor = Math.min(30, moduleSize / 10);
    const totalImpact = complexityFactor + sizeFactor;

    return {
      type: 'split-module',
      priority: depCount > 20 || moduleSize > 500 ? 'critical' : depCount > 15 ? 'high' : 'medium',
      target: [pattern.module],
      description: `Split "${pattern.module}" into smaller, focused modules (${moduleSize} lines, ${depCount} dependencies)`,
      estimatedImpact: {
        complexityReduction: Math.round(Math.min(50, totalImpact)),
        couplingReduction: Math.round(Math.min(40, depCount * 2)),
        maintainabilityGain: Math.round(Math.min(60, totalImpact * 0.8)),
        effortHours: Math.ceil((moduleSize / 100) + (depCount / 3)),
        riskLevel: affectedModules.length > 10 || dependentCount > 15 ? 'high' : 'medium'
      },
      steps: [
        `Analyze ${depCount} dependencies in "${pattern.module}" to identify cohesive groups`,
        `Identify ${module?.functions.length || 0} functions and ${module?.classes.length || 0} classes to reorganize`,
        `Create 3-5 new focused modules based on responsibility`,
        `Move related functions and classes to new modules`,
        `Update ${affectedModules.length} dependent modules with new imports`,
        `Run full test suite to verify functionality`,
        `Update documentation and API contracts`
      ],
      codeExample: this.generateSplitExample(pattern.module),
      affectedModules
    };
  }

  private proposeServiceExtraction(pattern: AntiPattern, graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    const dependentCount = graph.edges.filter(e => e.to === pattern.module).length;
    const module = graph.modules.get(pattern.module);
    const affectedModules = module?.dependents || [];

    return {
      type: 'extract-service',
      priority: dependentCount > 20 ? 'high' : 'medium',
      target: [pattern.module],
      description: `Extract "${pattern.module}" as an independent service`,
      estimatedImpact: {
        complexityReduction: 35,
        couplingReduction: Math.min(50, dependentCount * 3),
        maintainabilityGain: 40,
        effortHours: Math.ceil(dependentCount / 3),
        riskLevel: dependentCount > 15 ? 'high' : 'medium'
      },
      steps: [
        `Define clear API interface for "${pattern.module}"`,
        `Isolate module with dependency injection`,
        `Consider extracting as microservice if appropriate`,
        `Update ${dependentCount} dependent modules to use new interface`,
        `Add integration tests`,
        `Document the new service API`
      ],
      affectedModules
    };
  }

  private proposeCycleBreaking(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    const modules = pattern.module.split(' → ').filter(m => m !== '↔');

    return {
      type: 'break-cycle',
      priority: modules.length > 3 ? 'high' : 'medium',
      target: modules,
      description: `Break circular dependency: ${pattern.module}`,
      estimatedImpact: {
        complexityReduction: 30,
        couplingReduction: 40,
        maintainabilityGain: 45,
        effortHours: modules.length * 2,
        riskLevel: 'medium'
      },
      steps: [
        `Identify the weakest link in the cycle`,
        `Extract shared dependencies into a new common module`,
        `Use dependency inversion principle`,
        `Refactor imports to break the cycle`,
        `Verify no new cycles are introduced`
      ],
      affectedModules: modules
    };
  }

  private proposeClassExtraction(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'extract-class',
      priority: 'medium',
      target: [pattern.module],
      description: `Extract responsibilities from large class in "${pattern.module}"`,
      estimatedImpact: {
        complexityReduction: 30,
        couplingReduction: 20,
        maintainabilityGain: 40,
        effortHours: 4,
        riskLevel: 'medium'
      },
      steps: [
        'Identify groups of related methods and properties',
        'Create new class for each responsibility',
        'Move methods and properties to new classes',
        'Update references and inject dependencies',
        'Write tests for new classes'
      ],
      codeExample: `// Before: Large class with multiple responsibilities
class UserManager {
  validateEmail() { }
  sendEmail() { }
  hashPassword() { }
  saveToDatabase() { }
}

// After: Extracted classes
class EmailValidator { validateEmail() { } }
class EmailService { sendEmail() { } }
class PasswordHasher { hashPassword() { } }
class UserRepository { saveToDatabase() { } }`,
      affectedModules: []
    };
  }

  private proposeParameterObject(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'introduce-parameter-object',
      priority: 'low',
      target: [pattern.module],
      description: `Introduce parameter object for functions with long parameter lists`,
      estimatedImpact: {
        complexityReduction: 15,
        couplingReduction: 10,
        maintainabilityGain: 25,
        effortHours: 2,
        riskLevel: 'low'
      },
      steps: [
        'Create interface or class for parameter group',
        'Replace individual parameters with object',
        'Update all call sites',
        'Add validation to parameter object'
      ],
      codeExample: `// Before
function createUser(name: string, email: string, age: number, address: string, phone: string) { }

// After
interface UserData {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
}
function createUser(userData: UserData) { }`,
      affectedModules: []
    };
  }

  private proposeMoveMethod(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'move-method',
      priority: 'medium',
      target: [pattern.module],
      description: `Move methods to the class they use most`,
      estimatedImpact: {
        complexityReduction: 20,
        couplingReduction: 30,
        maintainabilityGain: 35,
        effortHours: 3,
        riskLevel: 'medium'
      },
      steps: [
        'Identify methods that primarily use another class',
        'Move method to the target class',
        'Update method signature if needed',
        'Replace with delegation or direct call',
        'Update tests'
      ],
      affectedModules: []
    };
  }

  private proposeInlineClass(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'inline-class',
      priority: 'low',
      target: [pattern.module],
      description: `Inline lazy class that doesn't do enough`,
      estimatedImpact: {
        complexityReduction: 10,
        couplingReduction: 15,
        maintainabilityGain: 20,
        effortHours: 1,
        riskLevel: 'low'
      },
      steps: [
        'Move all methods to the calling class',
        'Update all references',
        'Remove the lazy class',
        'Simplify the code'
      ],
      affectedModules: []
    };
  }

  private proposeExtractClass(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'extract-class',
      priority: 'medium',
      target: [pattern.module],
      description: `Extract data clump into a dedicated class`,
      estimatedImpact: {
        complexityReduction: 25,
        couplingReduction: 20,
        maintainabilityGain: 30,
        effortHours: 3,
        riskLevel: 'low'
      },
      steps: [
        'Create new class for the data group',
        'Move related fields to new class',
        'Replace parameter lists with new class',
        'Add behavior to the new class if appropriate'
      ],
      codeExample: `// Before: Data clump
function processOrder(customerId: string, customerName: string, customerEmail: string) { }
function sendInvoice(customerId: string, customerName: string, customerEmail: string) { }

// After: Extracted class
class Customer {
  constructor(public id: string, public name: string, public email: string) {}
}
function processOrder(customer: Customer) { }
function sendInvoice(customer: Customer) { }`,
      affectedModules: []
    };
  }

  private proposeRemoveDeadCode(pattern: AntiPattern, _graph: DependencyGraph, _metrics: ArchitectureMetrics): RefactoringProposal {
    return {
      type: 'split-module',
      priority: 'low',
      target: [pattern.module],
      description: `Remove unused code from "${pattern.module}"`,
      estimatedImpact: {
        complexityReduction: 15,
        couplingReduction: 5,
        maintainabilityGain: 20,
        effortHours: 1,
        riskLevel: 'low'
      },
      steps: [
        'Verify code is truly unused (check with search)',
        'Remove unused functions and classes',
        'Remove unused imports',
        'Run tests to ensure nothing breaks',
        'Commit with clear message for easy revert if needed'
      ],
      affectedModules: []
    };
  }

  private generateSplitExample(moduleName: string): string {
    return `// Before: God module
// ${moduleName}.ts
export class ${moduleName} {
  // 50+ methods handling multiple concerns
  authenticateUser() { }
  validateData() { }
  saveToDatabase() { }
  sendNotification() { }
  generateReport() { }
}

// After: Split into focused modules
// ${moduleName}-auth.ts
export class AuthService {
  authenticateUser() { }
}

// ${moduleName}-validation.ts
export class ValidationService {
  validateData() { }
}

// ${moduleName}-repository.ts
export class Repository {
  saveToDatabase() { }
}

// ${moduleName}-notification.ts
export class NotificationService {
  sendNotification() { }
}

// ${moduleName}-reporting.ts
export class ReportGenerator {
  generateReport() { }
}`;
  }

  // NEW: Proposal methods based on metrics
  private proposeConsolidateDuplication(metrics: ArchitectureMetrics, graph: DependencyGraph): RefactoringProposal {
    const dupPercentage = metrics.duplication?.percentage || 0;
    const dupBlocks = metrics.duplication?.duplicatedBlocks || 0;

    return {
      type: 'consolidate-duplicate-code',
      priority: dupPercentage > 20 ? 'high' : 'medium',
      target: ['multiple modules'],
      description: `Consolidate ${dupBlocks} duplicated code blocks (${dupPercentage.toFixed(1)}% duplication)`,
      estimatedImpact: {
        complexityReduction: Math.round(dupPercentage * 1.5),
        couplingReduction: 10,
        maintainabilityGain: Math.round(dupPercentage * 2),
        effortHours: Math.ceil(dupBlocks / 3),
        riskLevel: dupBlocks > 20 ? 'medium' : 'low'
      },
      steps: [
        `Identify ${dupBlocks} duplicated code blocks`,
        'Extract common logic into shared utility functions',
        'Create reusable components or services',
        'Replace duplicated code with function calls',
        'Add unit tests for extracted functions',
        'Verify all call sites work correctly'
      ],
      codeExample: `// Before: Duplicated validation logic
// module-a.ts
function validateUser(user) {
  if (!user.email || !user.email.includes('@')) return false;
  if (!user.name || user.name.length < 2) return false;
  return true;
}

// module-b.ts
function checkUser(user) {
  if (!user.email || !user.email.includes('@')) return false;
  if (!user.name || user.name.length < 2) return false;
  return true;
}

// After: Consolidated into shared utility
// validators.ts
export function validateUser(user) {
  if (!user.email || !user.email.includes('@')) return false;
  if (!user.name || user.name.length < 2) return false;
  return true;
}

// module-a.ts & module-b.ts
import { validateUser } from './validators';`,
      affectedModules: []
    };
  }

  private proposeFlattenDependencies(metrics: ArchitectureMetrics, graph: DependencyGraph): RefactoringProposal {
    const maxDepth = metrics.dependencyDepth?.maximum || 0;
    const deepestChain = metrics.dependencyDepth?.deepestChain || [];

    return {
      type: 'split-module',
      priority: maxDepth > 10 ? 'high' : 'medium',
      target: deepestChain.slice(0, 3),
      description: `Flatten dependency chain (current depth: ${maxDepth} levels)`,
      estimatedImpact: {
        complexityReduction: Math.round((maxDepth - 5) * 5),
        couplingReduction: Math.round((maxDepth - 5) * 4),
        maintainabilityGain: Math.round((maxDepth - 5) * 6),
        effortHours: Math.ceil(maxDepth / 2),
        riskLevel: maxDepth > 12 ? 'high' : 'medium'
      },
      steps: [
        `Analyze dependency chain: ${deepestChain.slice(0, 3).join(' → ')}...`,
        'Identify unnecessary intermediate dependencies',
        'Apply dependency inversion principle',
        'Extract interfaces for loose coupling',
        'Refactor to reduce chain depth to 5-6 levels',
        'Update imports and dependency injection'
      ],
      codeExample: `// Before: Deep dependency chain
// A → B → C → D → E → F → G → H

// After: Flattened with interfaces
// A → IService → Implementation
// Use dependency injection to skip intermediate layers`,
      affectedModules: deepestChain
    };
  }

  private proposeImproveCohesion(metrics: ArchitectureMetrics, graph: DependencyGraph): RefactoringProposal {
    const lcom = metrics.lackOfCohesionMethods || 0;

    return {
      type: 'extract-class',
      priority: lcom > 5 ? 'high' : 'medium',
      target: ['classes with low cohesion'],
      description: `Improve class cohesion (LCOM: ${lcom.toFixed(2)})`,
      estimatedImpact: {
        complexityReduction: Math.round(lcom * 5),
        couplingReduction: Math.round(lcom * 3),
        maintainabilityGain: Math.round(lcom * 8),
        effortHours: Math.ceil(lcom * 2),
        riskLevel: 'medium'
      },
      steps: [
        'Identify classes with high LCOM scores',
        'Group methods that use the same properties',
        'Extract cohesive groups into separate classes',
        'Apply Single Responsibility Principle',
        'Update dependencies and tests'
      ],
      codeExample: `// Before: Low cohesion (LCOM = 4)
class UserManager {
  name: string;
  email: string;
  reportData: any;
  
  validateEmail() { /* uses email */ }
  sendEmail() { /* uses email */ }
  generateReport() { /* uses reportData */ }
  exportReport() { /* uses reportData */ }
}

// After: High cohesion (LCOM = 1)
class User {
  name: string;
  email: string;
  validateEmail() { }
  sendEmail() { }
}

class ReportGenerator {
  reportData: any;
  generateReport() { }
  exportReport() { }
}`,
      affectedModules: []
    };
  }

  private proposeReduceCoupling(metrics: ArchitectureMetrics, graph: DependencyGraph): RefactoringProposal {
    const coupling = metrics.coupling;
    const totalModules = metrics.totalModules;

    return {
      type: 'extract-interface',
      priority: coupling > 40 ? 'high' : 'medium',
      target: ['tightly coupled modules'],
      description: `Reduce coupling from ${coupling.toFixed(1)}% to below 30%`,
      estimatedImpact: {
        complexityReduction: Math.round((coupling - 30) * 1.5),
        couplingReduction: Math.round(coupling - 25),
        maintainabilityGain: Math.round((coupling - 30) * 2),
        effortHours: Math.ceil(totalModules / 5),
        riskLevel: coupling > 50 ? 'high' : 'medium'
      },
      steps: [
        'Identify highly coupled module pairs',
        'Extract interfaces for dependencies',
        'Apply dependency inversion principle',
        'Use dependency injection',
        'Introduce facade pattern where appropriate',
        'Reduce direct dependencies between modules'
      ],
      codeExample: `// Before: Tight coupling
class OrderService {
  private emailService = new EmailService();
  private paymentService = new PaymentService();
  
  processOrder() {
    this.emailService.send();
    this.paymentService.charge();
  }
}

// After: Loose coupling with DI
interface IEmailService {
  send(): void;
}

interface IPaymentService {
  charge(): void;
}

class OrderService {
  constructor(
    private emailService: IEmailService,
    private paymentService: IPaymentService
  ) {}
  
  processOrder() {
    this.emailService.send();
    this.paymentService.charge();
  }
}`,
      affectedModules: []
    };
  }
}
