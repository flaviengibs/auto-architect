import { Module, AntiPattern } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class SecurityDetector {
  detectVulnerabilities(modules: Map<string, Module>, projectPath?: string): AntiPattern[] {
    const vulnerabilities: AntiPattern[] = [];

    modules.forEach(module => {
      const fullPath = projectPath ? path.join(projectPath, module.path) : module.path;
      const content = this.getFileContent(fullPath);
      if (!content) return;

      vulnerabilities.push(...this.detectSQLInjection(module, content));
      vulnerabilities.push(...this.detectXSS(module, content));
      vulnerabilities.push(...this.detectHardcodedSecrets(module, content));
      vulnerabilities.push(...this.detectInsecureRandomness(module, content));
      vulnerabilities.push(...this.detectPathTraversal(module, content));
      vulnerabilities.push(...this.detectCommandInjection(module, content));
      
      // NEW: Additional security checks
      vulnerabilities.push(...this.detectInsecureDeserialization(module, content));
      vulnerabilities.push(...this.detectWeakCryptography(module, content));
      vulnerabilities.push(...this.detectInsecureHTTP(module, content));
      vulnerabilities.push(...this.detectOpenRedirect(module, content));
      vulnerabilities.push(...this.detectXMLExternalEntity(module, content));
      vulnerabilities.push(...this.detectLDAPInjection(module, content));
      vulnerabilities.push(...this.detectServerSideRequestForgery(module, content));
      vulnerabilities.push(...this.detectInsecureFileUpload(module, content));
      vulnerabilities.push(...this.detectMissingAuthentication(module, content));
      vulnerabilities.push(...this.detectInsecureCORS(module, content));
      vulnerabilities.push(...this.detectPrototypePollution(module, content));
      vulnerabilities.push(...this.detectRegexDOS(module, content));
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
      /(?:system|popen|subprocess)\s*\([^)]*\+/gi, // Python
      /shell\s*=\s*True/gi // Python subprocess with shell=True
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
          suggestion: 'Avoid shell execution, use safe APIs with argument arrays, never use shell=True with user input'
        });
      }
    });

    return patterns;
  }

  // NEW: Enhanced security detection methods
  private detectInsecureDeserialization(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const deserializePatterns = [
      /JSON\.parse\([^)]*req\./gi,
      /pickle\.loads?\(/gi, // Python pickle
      /yaml\.load\(/gi, // YAML without safe_load
      /unserialize\(/gi, // PHP
      /eval\([^)]*JSON/gi
    ];

    deserializePatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'critical',
          description: `Insecure deserialization in "${module.name}"`,
          impact: 'Can lead to remote code execution',
          location: module.path,
          suggestion: 'Validate and sanitize input before deserialization, use safe alternatives like yaml.safe_load()'
        });
      }
    });

    return patterns;
  }

  private detectWeakCryptography(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const weakCryptoPatterns = [
      /\bMD5\b/gi,
      /\bSHA1\b/gi,
      /\bDES\b/gi,
      /\bRC4\b/gi,
      /createCipher\(/gi, // Node.js deprecated
      /ECB/gi // ECB mode
    ];

    weakCryptoPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Weak cryptography detected in "${module.name}"`,
          impact: 'Vulnerable to cryptographic attacks',
          location: module.path,
          suggestion: 'Use strong algorithms: SHA-256, SHA-3, AES-256-GCM, bcrypt for passwords'
        });
      }
    });

    return patterns;
  }

  private detectInsecureHTTP(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    if (/http:\/\/(?!localhost|127\.0\.0\.1)/gi.test(content) &&
        (/api|token|password|secret|key/i.test(content))) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'high',
        description: `Insecure HTTP connection in "${module.name}"`,
        impact: 'Sensitive data transmitted without encryption',
        location: module.path,
        suggestion: 'Use HTTPS for all external connections, especially for sensitive data'
      });
    }

    return patterns;
  }

  private detectOpenRedirect(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const redirectPatterns = [
      /redirect\([^)]*req\./gi,
      /location\.href\s*=\s*[^'"]*req\./gi,
      /window\.location\s*=\s*[^'"]*params/gi
    ];

    redirectPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'medium',
          description: `Potential open redirect vulnerability in "${module.name}"`,
          impact: 'Can be used in phishing attacks',
          location: module.path,
          suggestion: 'Validate redirect URLs against whitelist, use relative URLs'
        });
      }
    });

    return patterns;
  }

  private detectXMLExternalEntity(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const xxePatterns = [
      /parseXML|DOMParser|XMLParser/gi
    ];

    xxePatterns.forEach(regex => {
      if (regex.test(content) && !/disallow.*ENTITY/i.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Potential XXE vulnerability in "${module.name}"`,
          impact: 'Can lead to file disclosure and SSRF',
          location: module.path,
          suggestion: 'Disable external entity processing in XML parser configuration'
        });
      }
    });

    return patterns;
  }

  private detectLDAPInjection(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    if (/ldap.*search|ldap.*query/gi.test(content) &&
        /\+|concat|\$\{/gi.test(content)) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'high',
        description: `Potential LDAP injection in "${module.name}"`,
        impact: 'Can bypass authentication and access unauthorized data',
        location: module.path,
        suggestion: 'Use parameterized LDAP queries, escape special characters'
      });
    }

    return patterns;
  }

  private detectServerSideRequestForgery(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const ssrfPatterns = [
      /(?:fetch|axios|request|http\.get)\([^)]*req\./gi,
      /(?:fetch|axios|request|http\.get)\([^)]*params\./gi,
      /(?:fetch|axios|request|http\.get)\([^)]*query\./gi
    ];

    ssrfPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Potential SSRF vulnerability in "${module.name}"`,
          impact: 'Attacker can make requests to internal services',
          location: module.path,
          suggestion: 'Validate and whitelist URLs, block internal IP ranges, use URL parsing'
        });
      }
    });

    return patterns;
  }

  private detectInsecureFileUpload(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    if (/multer|formidable|busboy|upload/gi.test(content) &&
        !/fileFilter|mimetype|extension/gi.test(content)) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'high',
        description: `Insecure file upload in "${module.name}"`,
        impact: 'Can lead to remote code execution via malicious files',
        location: module.path,
        suggestion: 'Validate file types, size limits, scan for malware, store outside webroot'
      });
    }

    return patterns;
  }

  private detectMissingAuthentication(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Check for routes without authentication middleware
    if ((/app\.(get|post|put|delete|patch)\(/gi.test(content) ||
         /router\.(get|post|put|delete|patch)\(/gi.test(content)) &&
        !/auth|authenticate|isAuthenticated|requireAuth|passport/gi.test(content) &&
        !/public|health|ping/gi.test(content)) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'medium',
        description: `Potential missing authentication in "${module.name}"`,
        impact: 'Unauthorized access to protected resources',
        location: module.path,
        suggestion: 'Add authentication middleware to protected routes'
      });
    }

    return patterns;
  }

  private detectInsecureCORS(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    if (/Access-Control-Allow-Origin.*\*/gi.test(content) ||
        /cors\(\s*\{[^}]*origin:\s*['"]?\*['"]?/gi.test(content)) {
      patterns.push({
        type: 'dead-code',
        module: module.name,
        severity: 'medium',
        description: `Insecure CORS configuration in "${module.name}"`,
        impact: 'Allows any origin to access resources',
        location: module.path,
        suggestion: 'Specify allowed origins explicitly, avoid wildcard (*) in production'
      });
    }

    return patterns;
  }

  private detectPrototypePollution(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    const pollutionPatterns = [
      /Object\.assign\([^)]*req\./gi,
      /\.\.\.[^}]*req\./gi, // Spread operator with user input
      /merge\([^)]*req\./gi,
      /extend\([^)]*req\./gi
    ];

    pollutionPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'high',
          description: `Potential prototype pollution in "${module.name}"`,
          impact: 'Can lead to property injection and RCE',
          location: module.path,
          suggestion: 'Validate object keys, use Object.create(null), freeze prototypes'
        });
      }
    });

    return patterns;
  }

  private detectRegexDOS(module: Module, content: string): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    
    // Detect potentially catastrophic backtracking patterns
    const dangerousRegexPatterns = [
      /\(.*\+.*\)\+/g, // (a+)+
      /\(.*\*.*\)\*/g, // (a*)*
      /\(.*\+.*\)\*/g, // (a+)*
      /\(.*\{.*,.*\}.*\)\+/g // (a{1,})+
    ];

    dangerousRegexPatterns.forEach(regex => {
      if (regex.test(content)) {
        patterns.push({
          type: 'dead-code',
          module: module.name,
          severity: 'medium',
          description: `Potential ReDoS vulnerability in "${module.name}"`,
          impact: 'Can cause denial of service through regex backtracking',
          location: module.path,
          suggestion: 'Simplify regex patterns, use non-backtracking engines, set timeouts'
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
