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
    patternsByType.forEach((patterns, type) => {
      patterns.slice(0, 3).forEach(pattern => { // Limit to top 3 per type
        switch (pattern.type) {
          case 'god-module':
            proposals.push(this.proposeModuleSplit(pattern, graph));
            break;
          case 'tight-coupling':
          case 'shotgun-surgery':
            proposals.push(this.proposeServiceExtraction(pattern, graph));
            break;
          case 'circular-dependency':
          case 'inappropriate-intimacy':
            proposals.push(this.proposeCycleBreaking(pattern, graph));
            break;
          case 'large-class':
            proposals.push(this.proposeClassExtraction(pattern, graph));
            break;
          case 'long-parameter-list':
            proposals.push(this.proposeParameterObject(pattern, graph));
            break;
          case 'feature-envy':
            proposals.push(this.proposeMoveMethod(pattern, graph));
            break;
          case 'lazy-class':
            proposals.push(this.proposeInlineClass(pattern, graph));
            break;
          case 'data-clump':
            proposals.push(this.proposeExtractClass(pattern, graph));
            break;
          case 'dead-code':
            proposals.push(this.proposeRemoveDeadCode(pattern, graph));
            break;
        }
      });
    });

    // Sort by priority and estimated impact
    return proposals
      .sort((a, b) => {
        const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = priorityScore[a.priority] * a.estimatedImpact.maintainabilityGain;
        const bScore = priorityScore[b.priority] * b.estimatedImpact.maintainabilityGain;
        return bScore - aScore;
      })
      .slice(0, 10); // Top 10 proposals
  }

  private proposeModuleSplit(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
    const module = graph.modules.get(pattern.module);
    const depCount = module?.dependencies.length || 0;
    const affectedModules = module?.dependents || [];

    return {
      type: 'split-module',
      priority: depCount > 20 ? 'critical' : depCount > 15 ? 'high' : 'medium',
      target: [pattern.module],
      description: `Split "${pattern.module}" into smaller, focused modules`,
      estimatedImpact: {
        complexityReduction: Math.min(40, depCount * 2),
        couplingReduction: 25,
        maintainabilityGain: 35,
        effortHours: Math.ceil(depCount / 2),
        riskLevel: affectedModules.length > 10 ? 'high' : 'medium'
      },
      steps: [
        `Analyze dependencies in "${pattern.module}" to identify cohesive groups`,
        `Create new modules for each logical group (e.g., ${pattern.module}-auth, ${pattern.module}-data)`,
        `Move related functions and classes to new modules`,
        `Update ${affectedModules.length} dependent modules`,
        `Run full test suite to verify functionality`,
        `Update documentation and imports`
      ],
      codeExample: this.generateSplitExample(pattern.module),
      affectedModules
    };
  }

  private proposeServiceExtraction(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeCycleBreaking(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeClassExtraction(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeParameterObject(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeMoveMethod(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeInlineClass(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeExtractClass(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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

  private proposeRemoveDeadCode(pattern: AntiPattern, graph: DependencyGraph): RefactoringProposal {
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
}
