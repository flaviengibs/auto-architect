# Auto-Architect

Professional automated software architecture optimization system. Analyzes your codebase, detects anti-patterns, calculates advanced metrics, and proposes intelligent refactorings with impact estimation.

## Features

### Comprehensive analysis
- Advanced AST parsing - Extract functions, classes, exports, imports
- Multi-language support - TypeScript, JavaScript, Python, Java, Go, C#
- Dependency graph - Bidirectional dependency analysis
- Test detection - Automatic test file identification
- Watch mode - Real-time analysis on file changes

### Architecture metrics (22+)
- **Basic**: Modules, lines, dependencies, cyclomatic complexity
- **Quality**: Coupling, cohesion, modularity, maintainability index
- **Advanced**: Instability, abstractness, distance from main sequence
- **Halstead**: Vocabulary, volume, difficulty, effort, time, bugs
- **Cognitive**: Cognitive complexity score
- **Health**: Test coverage, technical debt, code smells, hotspots

### Anti-pattern detection (23+)
- **Structural**: God modules, circular dependencies, tight coupling
- **Code smells**: Long parameter list, large class, lazy class, data clump
- **Design**: Feature envy, shotgun surgery, inappropriate intimacy
- **Maintenance**: Dead code, divergent change, message chains, middle man
- **Security**: SQL injection, XSS, hardcoded secrets, command injection, path traversal

### Health score and quality gates
- Overall score with A-F grade based on 5 dimensions
- 7 configurable quality gates with thresholds
- Tracking of improvements and regressions

### Refactoring proposals (10+ types)
- Extract service, split module, break cycle
- Extract class, move method, inline class
- Parameter object, extract interface
- **With**: Priority, estimated impact, effort (hours), risk level, code examples

### Multiple export formats
- **Console**: Colored and formatted report
- **JSON**: For CI/CD integration
- **Markdown**: For documentation
- **HTML**: Standalone visual report
- **Diagrams**: Mermaid and DOT/Graphviz
- **Trends**: Temporal comparison with previous reports

## Installation

```bash
npm install
npm run build

# Option 1: Use directly
node dist/cli/index.js analyze

# Option 2: Install globally
npm link
auto-architect analyze
```

## Usage

### Analyze command

```bash
# Analyze current project
node dist/cli/index.js analyze

# Analyze specific project
node dist/cli/index.js analyze ./my-project

# With security detection
node dist/cli/index.js analyze --security

# Compare with previous report
node dist/cli/index.js analyze --compare report-old.json

# Generate JSON report
node dist/cli/index.js analyze --output report.json --format json

# Generate Markdown report
node dist/cli/index.js analyze --format markdown --output report.md

# Generate HTML report
node dist/cli/index.js analyze --format html --output report.html

# Generate Mermaid diagram
node dist/cli/index.js analyze --diagram mermaid

# Generate DOT diagram (Graphviz)
node dist/cli/index.js analyze --diagram dot

# Set health score threshold (fail if below)
node dist/cli/index.js analyze --threshold 80

# Fail if critical issues detected
node dist/cli/index.js analyze --fail-on-critical

# Combine multiple options
node dist/cli/index.js analyze \
  --security \
  --compare previous-report.json \
  --format html \
  --output report.html \
  --diagram mermaid \
  --threshold 70
```

### Watch command

```bash
# Watch mode with automatic re-analysis
node dist/cli/index.js watch

# Watch with custom threshold
node dist/cli/index.js watch --threshold 80

# Watch with custom debounce (ms)
node dist/cli/index.js watch --debounce 5000

# Watch with JSON format
node dist/cli/index.js watch --format json
```

### Compare command

```bash
# Compare two reports to see evolution
node dist/cli/index.js compare report1.json report2.json
```

### CI/CD integration

```bash
# In your CI/CD pipeline
node dist/cli/index.js analyze \
  --format json \
  --output architecture-report.json \
  --threshold 70 \
  --fail-on-critical
```

## Example output

```
Health score

   Overall:          65/100 [D]
   Architecture:     60/100
   Maintainability:  99/100
   Testability:      0/100
   Security:         90/100
   Performance:      75/100

Architecture metrics

Basic metrics:
   Total modules:          42
   Total lines:            12,450
   Avg dependencies:       5.3
   Max dependencies:       18
   Cyclomatic complexity:  12.4

Quality metrics:
   Coupling:               23%
   Cohesion:               87%
   Modularity:             75%
   Maintainability index:  72

Advanced metrics:
   Instability:            0.42
   Abstractness:           0.15
   Distance from main seq: 0.43
   Test coverage:          68%
   Technical debt:         12%
   Code smells:            8

Halstead metrics:
   Vocabulary:             197
   Program length:         1067
   Volume:                 8301.89
   Difficulty:             37.66
   Effort:                 340489.65
   Time to program:        18916.09s
   Estimated bugs:         2.767

Cognitive complexity:
   Average score:          60.5

Hotspots (high complexity):
   god-module
   module-a
   module-b

Quality gates

   Status: 6/7 gates passed (86%)

   ✓ Cyclomatic complexity: PASS
   ✓ Coupling: PASS
   ✓ Cohesion: PASS
   ✗ Test coverage: FAIL (68% < 70%)
   ✓ Critical anti-patterns: PASS
   ✓ Maintainability index: PASS
   ✓ Technical debt: PASS

Anti-patterns detected

   [HIGH] god-module
      Module "auth/index" has 18 dependencies (avg: 5.3)
      Impact: High centrality increases build complexity
      Suggestion: Extract as independent service

   [MEDIUM] circular-dependency
      Circular dependency: auth → user → session → auth
      Impact: Prevents proper module isolation
      Suggestion: Use dependency inversion principle

Refactoring proposals

   1. [HIGH] Extract "auth/index" as an independent service
      Type: extract-service
      Estimated impact:
         • Complexity:      -35%
         • Coupling:        -42%
         • Maintainability: +40%
         • Effort:          ~8h
         • Risk:            medium
      Affected: 12 modules
```

## Quick test

An example project is included to test the tool:

```bash
node dist/cli/index.js analyze example-project --diagram mermaid
```

## Technologies

- **TypeScript** for strong typing and maintainability
- **Commander.js** for professional CLI
- **Chalk** for colors and formatting
- **Native AST parsing** with advanced regex patterns
- **Graph theory** for dependency analysis and cycle detection
- **Software metrics** (Maintainability Index, Distance from Main Sequence, Halstead, Cognitive Complexity)

## Advanced metrics explained

### Instability (I)
Ratio of outgoing dependencies to total. I = Ce / (Ce + Ca)
- 0 = Stable (many dependents)
- 1 = Unstable (many dependencies)

### Abstractness (A)
Ratio of abstractions (interfaces, abstract classes) to total
- 0 = Concrete
- 1 = Abstract

### Distance from main sequence (D)
D = |A + I - 1|
- 0 = Ideal (perfect balance)
- 1 = Zone of pain or uselessness

### Maintainability index (MI)
Microsoft formula: MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
- 100 = Excellent
- 0 = Very difficult to maintain

### Halstead metrics
- **Vocabulary**: Unique operators + operands
- **Volume**: Program length × log2(vocabulary)
- **Difficulty**: (unique operators / 2) × (total operands / unique operands)
- **Effort**: Difficulty × volume
- **Time**: Effort / 18 seconds
- **Bugs**: Volume / 3000

### Cognitive complexity
Based on SonarSource's metric, measures code understandability by tracking:
- Nesting levels
- Control flow structures
- Logical operators
- Recursion

## Why this project impresses FAANG recruiters

### Technical skills demonstrated

**Software architecture**
- Deep understanding of SOLID principles
- Mastery of design patterns and anti-patterns
- System vision and scalability

**Algorithms and data structures**
- Graph algorithms (DFS, cycle detection)
- Centrality and community analysis
- Complexity optimization

**Static analysis**
- AST parsing and metadata extraction
- Control flow analysis
- Complex metrics calculation

**Developer tooling**
- Professional CLI with advanced options
- Multiple export formats
- CI/CD integration

**Code quality**
- TypeScript with strict typing
- Modular and extensible architecture
- Comprehensive documentation

### Business impact

This type of tool is used internally at:
- **Google** (Tricorder, CodeHealth)
- **Amazon** (CodeGuru)
- **Meta** (Infer, Pyre)
- **Microsoft** (Code Analysis)

To maintain code quality at scale and reduce technical debt.

## Possible extensions

- Machine learning for predictions
- SonarQube integration
- VS Code plugin
- Real-time web dashboard
- Runtime performance analysis
- Git history analysis (code churn, bus factor)

## License

MIT

## Contributing

Contributions are welcome! This project demonstrates senior/staff engineer level skills.
