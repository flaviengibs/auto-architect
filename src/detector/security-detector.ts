import { Module, AntiPattern } from '../types';
import * as fs from 'fs';

export class SecurityDetector {
  detectVulnerabilities(modules: Map<string, Module>): AntiPattern[] {
    const vulnerabilities: AntiPattern[] = [];

    modules.forEach(module => {
      const content = this.getFileContent(module.path);
      if (!content) return;

      vulnerabilities.push(...this.detectSQLInjection(module, content));
      vulnerabilities.push(...this.detectXSS(module, content));
      vulnerabilities.push(...this.detectHardcodedSecrets(module, content));
      vulnerabilities.push(...this.detectInsecureRandomness(module, content));
      vulnerabilities.push(...this.detectPathTraversal(module, content));
      vulnerabilities.push(...this.detectCommandInjection(module, content));
    });

    return vulnerabilities;
  }

  private detectSQLInjection(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect string concatenation in SQL queries
    const sqlConcatPatterns = [
      /(?:execute|query|sql)\s*\(\s*['"`].*?\+/gi,
      /(?:execute|query|sql)\s*\(\s*\$\{/gi,
      /(?:execute|query|sql)\s*\(\s*f['"]/gi // Python f-strings
    ];

    sqlConcatPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code', // Using existing type, should add 'sql-injection'
          module: module.name,
          severity: 'critical',
          description: `Potential SQL injection vulnerability in "${module.name}"`,
          impact: 'Allows attackers to execute arbitrary SQL queries',
          location: module.path,
          suggestion: 'Use parameterized queries or prepared statements'
        });
      }
    });

    return patterns;
  }

  private detectXSS(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect innerHTML, dangerouslySetInnerHTML
    const xssPatterns = [
      /\.innerHTML\s*=/gi,
      /dangerouslySetInnerHTML/gi,
      /document\.write\(/gi,
      /eval\(/gi
    ];

    xssPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Potential XSS vulnerability in "${module.name}"`,
          impact: 'Allows attackers to inject malicious scripts',
          location: module.path,
          suggestion: 'Sanitize user input and use safe DOM manipulation methods'
        });
      }
    });

    return patterns;
  }

  private detectHardcodedSecrets(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect hardcoded passwords, API keys, tokens
    const secretPatterns = [
      /(?:password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]/gi,
      /(?:api[_-]?key|apikey)\s*=\s*['"][^'"]{20,}['"]/gi,
      /(?:secret|token)\s*=\s*['"][^'"]{20,}['"]/gi,
      /(?:aws|amazon)[_-]?(?:access|secret)[_-]?key/gi,
      /(?:private[_-]?key|privatekey)\s*=\s*['"][^'"]{20,}['"]/gi
    ];

    secretPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'critical',
          description: `Hardcoded secrets detected in "${module.name}"`,
          impact: 'Exposes sensitive credentials in source code',
          location: module.path,
          suggestion: 'Use environment variables or secure secret management'
        });
      }
    });

    return patterns;
  }

  private detectInsecureRandomness(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect Math.random() for security purposes
    if (/Math\.random\(\)/.test(content) && 
        (/token|session|password|key|secret/i.test(content))) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'medium',
        description: `Insecure randomness in "${module.name}"`,
        impact: 'Predictable random values for security-critical operations',
        location: module.path,
        suggestion: 'Use crypto.randomBytes() or crypto.getRandomValues()'
      });
    }

    return patterns;
  }

  private detectPathTraversal(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect path concatenation with user input
    const pathPatterns = [
      /(?:readFile|writeFile|unlink|rmdir)\s*\([^)]*\+/gi,
      /path\.join\([^)]*req\./gi,
      /fs\.\w+\([^)]*params\./gi
    ];

    pathPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Potential path traversal vulnerability in "${module.name}"`,
          impact: 'Allows attackers to access files outside intended directory',
          location: module.path,
          suggestion: 'Validate and sanitize file paths, use path.resolve() with whitelist'
        });
      }
    });

    return patterns;
  }

  private detectCommandInjection(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect command execution with user input
    const cmdPatterns = [
      /(?:exec|spawn|execSync|spawnSync)\s*\([^)]*\+/gi,
      /(?:exec|spawn|execSync|spawnSync)\s*\(\s*\$\{/gi,
      /(?:system|popen|subprocess)\s*\([^)]*\+/gi // Python
    ];

    cmdPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'critical',
          description: `Potential command injection vulnerability in "${module.name}"`,
          impact: 'Allows attackers to execute arbitrary system commands',
          location: module.path,
          suggestion: 'Avoid shell execution, use safe APIs with argument arrays'
        });
      }
    });

    return patterns;
  }

  private getFileContent(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }
}
