/**
 * Cognitive Complexity Calculator
 * Based on SonarSource's Cognitive Complexity metric
 * https://www.sonarsource.com/docs/CognitiveComplexity.pdf
 */

export class CognitiveComplexityAnalyzer {
  calculate(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith('//') || line.startsWith('/*') || !line) {
        continue;
      }

      // Increment for control flow structures
      if (this.isControlFlow(line)) {
        complexity += 1 + nestingLevel;
      }

      // Increment for logical operators (but not the first in a sequence)
      complexity += this.countLogicalOperators(line, nestingLevel);

      // Increment for recursion
      if (this.isRecursive(line, code)) {
        complexity += 1;
      }

      // Track nesting level
      nestingLevel += this.getNestingChange(line);
    }

    return complexity;
  }

  private isControlFlow(line: string): boolean {
    const controlFlowPatterns = [
      /\bif\s*\(/,
      /\belse\s+if\s*\(/,
      /\bfor\s*\(/,
      /\bwhile\s*\(/,
      /\bdo\s*{/,
      /\bswitch\s*\(/,
      /\bcatch\s*\(/,
      /\?\s*.*\s*:/  // Ternary operator
    ];

    return controlFlowPatterns.some(pattern => pattern.test(line));
  }

  private countLogicalOperators(line: string, nestingLevel: number): number {
    let count = 0;
    
    // Count && and || but not the first in a sequence
    const andMatches = line.match(/&&/g);
    const orMatches = line.match(/\|\|/g);
    
    if (andMatches && andMatches.length > 0) {
      count += (andMatches.length - 1) * (1 + nestingLevel);
    }
    
    if (orMatches && orMatches.length > 0) {
      count += (orMatches.length - 1) * (1 + nestingLevel);
    }

    return count;
  }

  private isRecursive(line: string, fullCode: string): boolean {
    // Simple heuristic: function calls itself
    const functionNameMatch = fullCode.match(/function\s+(\w+)/);
    if (functionNameMatch) {
      const functionName = functionNameMatch[1];
      return line.includes(functionName + '(');
    }
    return false;
  }

  private getNestingChange(line: string): number {
    let change = 0;
    
    // Opening braces increase nesting
    const openBraces = (line.match(/{/g) || []).length;
    change += openBraces;
    
    // Closing braces decrease nesting
    const closeBraces = (line.match(/}/g) || []).length;
    change -= closeBraces;
    
    return change;
  }

  calculateForFunction(functionCode: string): {
    score: number;
    rating: 'A' | 'B' | 'C' | 'D' | 'E';
    description: string;
  } {
    const score = this.calculate(functionCode);
    
    let rating: 'A' | 'B' | 'C' | 'D' | 'E';
    let description: string;

    if (score <= 5) {
      rating = 'A';
      description = 'Simple, easy to understand';
    } else if (score <= 10) {
      rating = 'B';
      description = 'More complex, but still manageable';
    } else if (score <= 20) {
      rating = 'C';
      description = 'Complex, consider refactoring';
    } else if (score <= 30) {
      rating = 'D';
      description = 'Very complex, should be refactored';
    } else {
      rating = 'E';
      description = 'Extremely complex, urgent refactoring needed';
    }

    return { score, rating, description };
  }
}
