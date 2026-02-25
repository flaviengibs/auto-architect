# Technical documentation

## Project architecture

```
src/
├── analyzer/
│   ├── architecture-analyzer.ts    # Main orchestrator
│   ├── metrics-analyzer.ts         # Basic metrics calculation
│   ├── advanced-metrics.ts         # Advanced metrics (I, A, D, MI)
│   ├── halstead-metrics.ts         # Halstead metrics
│   ├── cognitive-complexity.ts     # Cognitive complexity
│   ├── health-scorer.ts            # Health score calculation
│   └── trend-analyzer.ts           # Temporal comparison
├── parser/
│   ├── dependency-parser.ts        # Dependency parsing
│   ├── ast-parser.ts               # AST extraction (functions, classes)
│   ├── python-parser.ts            # Python language support
│   ├── java-parser.ts              # Java language support
│   ├── go-parser.ts                # Go language support
│   └── csharp-parser.ts            # C# language support
├── detector/
│   ├── anti-pattern-detector.ts    # Structural anti-pattern detection
│   ├── code-smell-detector.ts      # Code smell detection
│   └── security-detector.ts        # Security vulnerability detection
├── optimizer/
│   └── refactoring-optimizer.ts    # Proposal generation
├── visualizer/
│   └── diagram-generator.ts        # Mermaid/DOT generation
├── cli/
│   ├── index.ts                    # Main CLI
│   ├── reporter.ts                 # Report formatting
│   └── watcher.ts                  # Watch mode
└── types.ts                        # TypeScript types
```

## Analysis flow

```
1. Parsing
   ├── Recursive project scan
   ├── Import/export extraction
   ├── AST parsing (functions, classes)
   └── Dependency graph construction

2. Metrics analysis
   ├── Basic metrics (LOC, complexity, dependencies)
   ├── Quality metrics (coupling, cohesion)
   ├── Advanced metrics (instability, abstractness)
   ├── Halstead metrics (vocabulary, volume, difficulty, effort)
   ├── Cognitive complexity
   └── Hotspot identification

3. Problem detection
   ├── Structural anti-patterns (god modules, cycles)
   ├── Code smells (long parameters, large classes)
   ├── Design issues (feature envy, shotgun surgery)
   └── Security vulnerabilities (SQL injection, XSS, etc.)

4. Scoring and quality gates
   ├── Health score calculation (5 dimensions)
   ├── Quality gate evaluation
   └── Grade generation (A-F)

5. Optimization
   ├── Anti-pattern analysis
   ├── Refactoring proposal generation
   ├── Impact and effort estimation
   └── Proposal prioritization

6. Reporting
   ├── Console formatting (colored)
   ├── JSON/Markdown/HTML export
   └── Diagram generation
```

## Key algorithms

### 1. Cycle detection (DFS)

```typescript
function detectCycles(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const module = graph.modules.get(node);
    if (module) {
      for (const dep of module.dependencies) {
        if (!visited.has(dep)) {
          dfs(dep, [...path]);
        } else if (recStack.has(dep)) {
          // Cycle detected
          const cycleStart = path.indexOf(dep);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }
    }

    recStack.delete(node);
  }

  graph.modules.forEach((_, moduleName) => {
    if (!visited.has(moduleName)) {
      dfs(moduleName, []);
    }
  });

  return cycles;
}
```

**Complexity**: O(V + E) where V = modules, E = dependencies

### 2. Instability calculation

```typescript
function calculateInstability(module: Module, graph: DependencyGraph): number {
  const Ce = module.dependencies.length;  // Efferent coupling
  const Ca = module.dependents.length;    // Afferent coupling
  
  if (Ce + Ca === 0) return 0;
  return Ce / (Ce + Ca);
}
```

**Interpretation**:
- I = 0: Stable (many dependents, few dependencies)
- I = 1: Unstable (few dependents, many dependencies)

### 3. Distance from main sequence

```typescript
function calculateDistance(instability: number, abstractness: number): number {
  return Math.abs(instability + abstractness - 1);
}
```

**Interpretation**:
- D = 0: Ideal balance
- D = 1: Zone of pain (concrete and stable) or uselessness (abstract and unstable)

### 4. Maintainability index

```typescript
function calculateMI(module: Module): number {
  const V = module.size * Math.log2(module.size || 1);  // Halstead volume
  const G = module.complexity;                           // Cyclomatic complexity
  const LOC = module.size;
  
  let MI = 171 - 5.2 * Math.log(V) - 0.23 * G - 16.2 * Math.log(LOC);
  return Math.max(0, Math.min(100, MI));
}
```

**Microsoft formula**: MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)

### 5. Halstead metrics

```typescript
interface HalsteadMetrics {
  vocabulary: number;        // n = n1 + n2
  length: number;           // N = N1 + N2
  volume: number;           // V = N * log2(n)
  difficulty: number;       // D = (n1/2) * (N2/n2)
  effort: number;           // E = D * V
  time: number;             // T = E / 18 seconds
  bugs: number;             // B = V / 3000
}
```

Where:
- n1 = unique operators
- n2 = unique operands
- N1 = total operators
- N2 = total operands

### 6. Cognitive complexity

Based on SonarSource's metric:
- +1 for each control flow structure (if, for, while, etc.)
- +1 for each nesting level
- +1 for logical operators (&&, ||) after the first
- +1 for recursion

## Design patterns used

### Strategy pattern
Different analyzers and detectors implement common interfaces:
```typescript
interface Detector {
  detect(graph: DependencyGraph): AntiPattern[];
}

class AntiPatternDetector implements Detector { }
class CodeSmellDetector implements Detector { }
class SecurityDetector implements Detector { }
```

### Factory pattern
Proposal generation based on anti-pattern type:
```typescript
class RefactoringOptimizer {
  generateProposal(antiPattern: AntiPattern): RefactoringProposal {
    switch (antiPattern.type) {
      case 'god-module': return this.createSplitModuleProposal();
      case 'circular-dependency': return this.createBreakCycleProposal();
      // ...
    }
  }
}
```

### Facade pattern
Main analyzer orchestrates all components:
```typescript
class ArchitectureAnalyzer {
  async analyze(projectPath: string): Promise<AnalysisReport> {
    const graph = await this.parser.parseProject(projectPath);
    const metrics = this.metricsAnalyzer.analyze(graph);
    const antiPatterns = this.antiPatternDetector.detect(graph);
    const proposals = this.optimizer.generateProposals(antiPatterns);
    const healthScore = this.healthScorer.calculate(metrics, antiPatterns);
    
    return { metrics, antiPatterns, proposals, healthScore };
  }
}
```

## Performance considerations

### Time complexity
- **Parsing**: O(n) where n = number of files
- **Cycle detection**: O(V + E) where V = modules, E = dependencies
- **Metrics calculation**: O(V)
- **Anti-pattern detection**: O(V + E)
- **Overall**: O(n + V + E) ≈ O(n) for typical projects

### Space complexity
- **Dependency graph**: O(V + E)
- **Module data**: O(V)
- **Overall**: O(V + E)

### Optimizations
- Smart directory filtering (skip node_modules, dist, etc.)
- Lazy evaluation where possible
- Result limiting (top N hotspots)
- Efficient data structures (Map, Set)

## Multi-language support

### Parser architecture
Each language has its own parser implementing a common interface:

```typescript
interface LanguageParser {
  parseFile(filePath: string, content: string, rootPath: string): Partial<Module>;
}

class PythonParser implements LanguageParser { }
class JavaParser implements LanguageParser { }
class GoParser implements LanguageParser { }
class CSharpParser implements LanguageParser { }
```

### Language-specific features

**Python**:
- Function and class extraction with decorators
- Import statement parsing (from/import)
- Test detection (test_*.py, *_test.py)

**Java**:
- Method and class extraction with annotations
- Package and import detection
- Test detection (src/test/java/)

**Go**:
- Function and struct extraction
- Exported symbol detection (uppercase naming)
- Test detection (*_test.go)

**C#**:
- Method and class extraction with attributes
- Using statement detection
- Test detection (*Tests.cs)

## Security detection

### Vulnerability types

1. **SQL Injection**
   - Pattern: String concatenation with SQL keywords
   - Example: `"SELECT * FROM users WHERE id = " + userId`

2. **XSS (Cross-Site Scripting)**
   - Pattern: innerHTML, dangerouslySetInnerHTML, eval
   - Example: `element.innerHTML = userInput`

3. **Hardcoded secrets**
   - Pattern: password, token, api_key in strings
   - Example: `const password = "admin123"`

4. **Insecure randomness**
   - Pattern: Math.random() for security purposes
   - Example: `const token = Math.random().toString()`

5. **Path traversal**
   - Pattern: File operations with ../ in paths
   - Example: `fs.readFile("../../" + filename)`

6. **Command injection**
   - Pattern: exec, spawn with user input
   - Example: `exec("ls " + userInput)`

## Testing strategy

### Current state
- Self-analysis capability (tool analyzes itself)
- Example projects with known issues
- Manual verification of outputs

### Planned improvements
- Unit tests with Jest
- Integration tests
- Property-based tests
- Performance benchmarks
- Coverage target: 80%+

## Extension points

### Adding a new language
1. Create parser in `src/parser/[language]-parser.ts`
2. Implement `LanguageParser` interface
3. Add to `dependency-parser.ts`
4. Add file extension to `isSourceFile()`
5. Add case in `parseFile()`

### Adding a new metric
1. Add to `ArchitectureMetrics` interface in `types.ts`
2. Implement calculation in `metrics-analyzer.ts`
3. Add to report display in `reporter.ts`

### Adding a new anti-pattern
1. Add type to `AntiPatternType` in `types.ts`
2. Implement detection in appropriate detector
3. Add proposal generation in `refactoring-optimizer.ts`

### Adding a new export format
1. Add method to `Reporter` class
2. Add CLI option in `index.ts`
3. Implement formatting logic

## Dependencies

### Production
- **commander**: CLI framework
- **chalk**: Terminal colors
- **chokidar**: File watching

### Development
- **typescript**: Type system
- **@types/node**: Node.js types

### Why these choices?
- Minimal dependencies for security and maintainability
- Well-established, stable libraries
- No heavy frameworks (React, Vue, etc.)
- Focus on core functionality

## Build and deployment

### Build process
```bash
npm run build  # Compiles TypeScript to JavaScript
```

Output: `dist/` directory with compiled .js files

### CI/CD integration
```bash
# Example GitHub Actions
- name: Analyze architecture
  run: |
    npm install
    npm run build
    node dist/cli/index.js analyze \
      --format json \
      --output report.json \
      --threshold 70 \
      --fail-on-critical
```

### Exit codes
- 0: Success (all checks passed)
- 1: Failure (threshold not met or critical issues found)

## Future improvements

### Short term
- Real AST parsing with Tree-sitter
- Actual test coverage integration
- Git metrics (code churn, bus factor)

### Medium term
- VS Code extension
- Web dashboard
- API REST
- Plugin system

### Long term
- Machine learning predictions
- Real-time collaboration
- Cloud deployment
- Multi-repository analysis

## References

### Research papers
- Robert C. Martin - "Clean Architecture"
- Martin Fowler - "Refactoring: Improving the Design of Existing Code"
- Microsoft Research - "Maintainability Index"
- SonarSource - "Cognitive Complexity"

### Tools inspiration
- Google Tricorder
- Amazon CodeGuru
- Meta Infer
- SonarQube
- ESLint

## License

MIT - See LICENSE file for details
