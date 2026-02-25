export interface HalsteadMetrics {
  vocabulary: number;        // n = n1 + n2
  length: number;           // N = N1 + N2
  calculatedLength: number; // N^ = n1*log2(n1) + n2*log2(n2)
  volume: number;           // V = N * log2(n)
  difficulty: number;       // D = (n1/2) * (N2/n2)
  effort: number;           // E = D * V
  time: number;             // T = E / 18 seconds
  bugs: number;             // B = V / 3000
}

export class HalsteadAnalyzer {
  calculate(code: string): HalsteadMetrics {
    const operators = this.extractOperators(code);
    const operands = this.extractOperands(code);

    const n1 = operators.unique.size;  // Unique operators
    const n2 = operands.unique.size;   // Unique operands
    const N1 = operators.total;        // Total operators
    const N2 = operands.total;         // Total operands

    const n = n1 + n2;  // Vocabulary
    const N = N1 + N2;  // Length

    const calculatedLength = n1 * Math.log2(n1 || 1) + n2 * Math.log2(n2 || 1);
    const volume = N * Math.log2(n || 1);
    const difficulty = (n1 / 2) * (N2 / (n2 || 1));
    const effort = difficulty * volume;
    const time = effort / 18; // seconds
    const bugs = volume / 3000;

    return {
      vocabulary: n,
      length: N,
      calculatedLength,
      volume,
      difficulty,
      effort,
      time,
      bugs
    };
  }

  private extractOperators(code: string): { unique: Set<string>; total: number } {
    const operators = new Set<string>();
    let total = 0;

    const operatorPatterns = [
      // Arithmetic
      /\+(?!=)/g, /-(?!=)/g, /\*(?!=)/g, /\/(?!=)/g, /%/g,
      // Comparison
      /===/g, /==/g, /!==/g, /!=/g, /<=/g, />=/g, /</g, />/g,
      // Logical
      /&&/g, /\|\|/g, /!/g,
      // Assignment
      /=/g, /\+=/g, /-=/g, /\*=/g, /\/=/g,
      // Other
      /\?/g, /:/g, /\./g, /,/g, /;/g,
      // Keywords as operators
      /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g,
      /\breturn\b/g, /\bfunction\b/g, /\bclass\b/g,
      /\bnew\b/g, /\bthis\b/g, /\bsuper\b/g
    ];

    operatorPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        matches.forEach(match => operators.add(match));
        total += matches.length;
      }
    });

    return { unique: operators, total };
  }

  private extractOperands(code: string): { unique: Set<string>; total: number } {
    const operands = new Set<string>();
    let total = 0;

    // Variables, function names, literals
    const operandPatterns = [
      // Identifiers
      /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g,
      // Numbers
      /\b\d+\.?\d*\b/g,
      // Strings
      /'[^']*'/g, /"[^"]*"/g, /`[^`]*`/g
    ];

    // Remove comments first
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    operandPatterns.forEach(pattern => {
      const matches = cleanCode.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Filter out keywords
          if (!this.isKeyword(match)) {
            operands.add(match);
            total++;
          }
        });
      }
    });

    return { unique: operands, total };
  }

  private isKeyword(word: string): boolean {
    const keywords = new Set([
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super',
      'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch',
      'finally', 'throw', 'typeof', 'instanceof', 'void', 'delete', 'in', 'of'
    ]);
    return keywords.has(word);
  }
}
