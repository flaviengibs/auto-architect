import { Module, AntiPattern } from '../types';

export class CodeSmellDetector {
  detectSmells(modules: Map<string, Module>): AntiPattern[] {
    const smells: AntiPattern[] = [];

    modules.forEach(module => {
      smells.push(...this.detectLongParameterList(module));
      smells.push(...this.detectLargeClass(module));
      smells.push(...this.detectLazyClass(module));
      smells.push(...this.detectDataClump(module));
      smells.push(...this.detectFeatureEnvy(module, modules));
      smells.push(...this.detectShotgunSurgery(module, modules));
      smells.push(...this.detectMessageChains(module));
      smells.push(...this.detectMiddleMan(module));
    });

    return smells;
  }

  private detectLongParameterList(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    module.functions.forEach(func => {
      if (func.parameters > 5) {
        smells.push({
          type: 'long-parameter-list',
          module: module.name,
          severity: func.parameters > 7 ? 'high' : 'medium',
          description: `Function "${func.name}" has ${func.parameters} parameters`,
          impact: 'Difficult to understand and maintain, prone to errors',
          location: `${module.path}::${func.name}`,
          suggestion: 'Consider using a parameter object or builder pattern'
        });
      }
    });

    return smells;
  }

  private detectLargeClass(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    module.classes.forEach(cls => {
      const totalMembers = cls.methods + cls.properties;
      
      if (totalMembers > 20) {
        smells.push({
          type: 'large-class',
          module: module.name,
          severity: totalMembers > 30 ? 'high' : 'medium',
          description: `Class "${cls.name}" has ${cls.methods} methods and ${cls.properties} properties`,
          impact: 'Violates Single Responsibility Principle, hard to maintain',
          location: `${module.path}::${cls.name}`,
          suggestion: 'Extract related methods into separate classes'
        });
      }
    });

    return smells;
  }

  private detectLazyClass(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    module.classes.forEach(cls => {
      const totalMembers = cls.methods + cls.properties;
      
      if (totalMembers < 3 && cls.methods < 2) {
        smells.push({
          type: 'lazy-class',
          module: module.name,
          severity: 'low',
          description: `Class "${cls.name}" has only ${totalMembers} members`,
          impact: 'Unnecessary abstraction, adds complexity without value',
          location: `${module.path}::${cls.name}`,
          suggestion: 'Consider inlining this class or merging with related class'
        });
      }
    });

    return smells;
  }

  private detectDataClump(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    // Detect functions with similar parameter patterns
    const parameterPatterns = new Map<string, string[]>();
    
    module.functions.forEach(func => {
      if (func.parameters >= 3) {
        const pattern = `params_${func.parameters}`;
        if (!parameterPatterns.has(pattern)) {
          parameterPatterns.set(pattern, []);
        }
        parameterPatterns.get(pattern)!.push(func.name);
      }
    });

    parameterPatterns.forEach((functions, pattern) => {
      if (functions.length >= 3) {
        smells.push({
          type: 'data-clump',
          module: module.name,
          severity: 'medium',
          description: `${functions.length} functions share similar parameter patterns`,
          impact: 'Indicates missing abstraction, duplicated parameter passing',
          location: module.path,
          suggestion: 'Extract parameters into a dedicated class or interface'
        });
      }
    });

    return smells;
  }

  private detectFeatureEnvy(module: Module, allModules: Map<string, Module>): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    // If a module depends heavily on another module's exports
    const dependencyUsage = new Map<string, number>();
    
    module.dependencies.forEach(dep => {
      const depModule = allModules.get(dep);
      if (depModule) {
        const usageCount = module.imports.filter(imp => imp.module === dep).length;
        dependencyUsage.set(dep, usageCount);
      }
    });

    dependencyUsage.forEach((count, dep) => {
      if (count > 5) {
        smells.push({
          type: 'feature-envy',
          module: module.name,
          severity: 'medium',
          description: `Module heavily uses features from "${dep}" (${count} imports)`,
          impact: 'Suggests functionality might belong in the other module',
          location: module.path,
          suggestion: `Consider moving related functionality to "${dep}" or extracting shared logic`
        });
      }
    });

    return smells;
  }

  private detectShotgunSurgery(module: Module, allModules: Map<string, Module>): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    // If many modules depend on this one
    if (module.dependents.length > 15) {
      smells.push({
        type: 'shotgun-surgery',
        module: module.name,
        severity: module.dependents.length > 25 ? 'high' : 'medium',
        description: `Module is used by ${module.dependents.length} other modules`,
        impact: 'Changes require modifications across many modules',
        location: module.path,
        suggestion: 'Consider creating a facade or adapter to reduce coupling'
      });
    }

    return smells;
  }

  private detectMessageChains(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    // Simple heuristic: count of chained property accesses
    const chainPattern = /\w+\.\w+\.\w+\.\w+/g;
    const content = module.path; // Would need actual file content
    
    // This is a simplified check - in real implementation would parse actual code
    if (module.dependencies.length > 3 && module.complexity > 10) {
      smells.push({
        type: 'message-chains',
        module: module.name,
        severity: 'low',
        description: 'Potential long chains of method calls detected',
        impact: 'Creates tight coupling and fragile code',
        location: module.path,
        suggestion: 'Use Law of Demeter - hide delegate or extract method'
      });
    }

    return smells;
  }

  private detectMiddleMan(module: Module): AntiPattern[] {
    const smells: AntiPattern[] = [];
    
    // If module mostly delegates to other modules
    const delegationRatio = module.dependencies.length / Math.max(module.functions.length, 1);
    
    if (delegationRatio > 0.8 && module.functions.length > 3) {
      smells.push({
        type: 'middle-man',
        module: module.name,
        severity: 'low',
        description: 'Module appears to mostly delegate to other modules',
        impact: 'Unnecessary indirection, adds complexity without value',
        location: module.path,
        suggestion: 'Consider removing this layer or adding more responsibility'
      });
    }

    return smells;
  }
}
