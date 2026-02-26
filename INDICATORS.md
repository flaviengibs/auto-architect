# Analysis indicators guide

This document explains all metrics, scores, and indicators used in Auto-architect analysis reports.

## Health score

The overall health assessment of your codebase, ranging from 0 to 100.

### Overall score
- **Range:** 0-100
- **Grade:** A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
- **Description:** Weighted average of all health dimensions
- **Good value:** ≥ 80

### Architecture score
- **Range:** 0-100
- **Description:** Measures structural quality, modularity, and coupling
- **Factors:** Coupling, cohesion, modularity, instability
- **Good value:** ≥ 75

### Maintainability score
- **Range:** 0-100
- **Description:** How easy it is to maintain and modify the code
- **Factors:** Complexity, maintainability index, code smells
- **Good value:** ≥ 70

### Testability score
- **Range:** 0-100
- **Description:** How easy it is to test the code
- **Factors:** Test coverage, coupling, complexity
- **Good value:** ≥ 60

### Security score
- **Range:** 0-100
- **Description:** Security posture and vulnerability risk
- **Factors:** Security issues detected, unsafe patterns
- **Good value:** ≥ 90

### Performance score
- **Range:** 0-100
- **Description:** Code efficiency and performance characteristics
- **Factors:** Algorithmic complexity, performance anti-patterns
- **Good value:** ≥ 80

## Architecture metrics

Metrics that describe the structural properties of your codebase.

### Total modules
- **Description:** Number of files/modules in the project
- **Good value:** Depends on project size
- **Warning:** Very high values may indicate poor organization

### Total lines
- **Description:** Total lines of code across all modules
- **Good value:** Depends on project scope
- **Note:** Excludes comments and blank lines

### Average dependencies
- **Description:** Average number of dependencies per module
- **Good value:** < 5
- **Warning:** > 10 indicates high coupling

### Maximum dependencies
- **Description:** Highest number of dependencies in a single module
- **Good value:** < 10
- **Warning:** > 20 indicates a potential hub or god module

### Coupling
- **Range:** 0-100%
- **Description:** Degree of interdependence between modules
- **Good value:** < 30%
- **Warning:** > 50% indicates tight coupling

### Cohesion
- **Range:** 0-100%
- **Description:** How well module contents belong together
- **Good value:** > 70%
- **Warning:** < 50% indicates low cohesion

### Instability
- **Range:** 0-1
- **Description:** Ratio of efferent to total coupling (I = Ce / (Ce + Ca))
- **Good value:** 0.3-0.7 for most modules
- **Note:** 0 = maximally stable, 1 = maximally unstable

### Abstractness
- **Range:** 0-1
- **Description:** Ratio of abstract types to total types
- **Good value:** 0.3-0.7 for balanced design
- **Note:** 0 = fully concrete, 1 = fully abstract

### Distance from main sequence
- **Range:** 0-1
- **Description:** |A + I - 1| - measures balance between stability and abstractness
- **Good value:** < 0.3
- **Warning:** > 0.5 indicates architectural imbalance

### Modularity
- **Range:** 0-100%
- **Description:** How well the code is organized into independent modules
- **Good value:** > 70%
- **Warning:** < 50% indicates poor modularization

## Complexity metrics

Metrics that measure code complexity and cognitive load.

### Cyclomatic complexity
- **Description:** Number of independent paths through the code
- **Good value:** < 10 per function
- **Warning:** > 15 indicates high complexity
- **Critical:** > 30 requires immediate refactoring

### Cognitive complexity
- **Description:** Measure of how difficult code is to understand
- **Good value:** < 15 per function
- **Warning:** > 25 indicates difficult code
- **Note:** More human-centric than cyclomatic complexity

### Maintainability index
- **Range:** 0-100
- **Description:** Microsoft's maintainability index formula
- **Good value:** > 70
- **Warning:** < 50 indicates difficult maintenance
- **Formula:** 171 - 5.2 × ln(V) - 0.23 × G - 16.2 × ln(L)
  - V = Halstead volume
  - G = Cyclomatic complexity
  - L = Lines of code

## Halstead metrics

Software science metrics based on operators and operands.

### Vocabulary
- **Description:** Number of unique operators and operands (η = η₁ + η₂)
- **Good value:** Varies by module size
- **Note:** Larger vocabulary may indicate more complex logic

### Length
- **Description:** Total number of operators and operands (N = N₁ + N₂)
- **Good value:** Proportional to module size
- **Note:** Very high values indicate verbose code

### Volume
- **Description:** Size of implementation (V = N × log₂(η))
- **Good value:** < 1000 per function
- **Warning:** > 2000 indicates large, complex code
- **Unit:** Bits

### Difficulty
- **Description:** How difficult code is to write/understand (D = (η₁/2) × (N₂/η₂))
- **Good value:** < 20
- **Warning:** > 30 indicates difficult code

### Effort
- **Description:** Mental effort required (E = D × V)
- **Good value:** < 20000
- **Warning:** > 50000 indicates high effort code
- **Unit:** Elementary mental discriminations

### Time
- **Description:** Time to program (T = E / 18 seconds)
- **Good value:** Varies by module
- **Unit:** Seconds

### Bugs
- **Description:** Estimated number of bugs (B = V / 3000)
- **Good value:** < 0.5 per module
- **Warning:** > 1.0 indicates high bug risk

## Dependency metrics

Metrics about module dependencies and relationships.

### Dependency depth (average)
- **Description:** Average depth of dependency chains
- **Good value:** < 3
- **Warning:** > 5 indicates deep dependency trees

### Dependency depth (maximum)
- **Description:** Longest dependency chain in the project
- **Good value:** < 5
- **Warning:** > 8 indicates very deep dependencies

### Fan-in
- **Description:** Number of modules that depend on this module
- **Good value:** 2-5 for utility modules
- **Warning:** > 10 may indicate over-centralization

### Fan-out
- **Description:** Number of modules this module depends on
- **Good value:** < 7
- **Warning:** > 10 indicates high coupling

### Afferent coupling (Ca)
- **Description:** Number of modules that depend on this module
- **Good value:** Varies by module role
- **Note:** High for core/utility modules

### Efferent coupling (Ce)
- **Description:** Number of modules this module depends on
- **Good value:** < 10
- **Warning:** > 20 indicates excessive dependencies

## Quality metrics

Metrics related to code quality and technical debt.

### Technical debt
- **Description:** Estimated time to fix all issues (in hours)
- **Good value:** < 5% of total development time
- **Warning:** > 20% indicates significant debt
- **Unit:** Hours

### Test coverage
- **Range:** 0-100%
- **Description:** Percentage of code covered by tests
- **Good value:** > 80%
- **Warning:** < 60% indicates insufficient testing
- **Critical:** < 40% is high risk

### Code smells
- **Description:** Number of code smell instances detected
- **Good value:** 0
- **Warning:** > 10 indicates quality issues
- **Types:** Long methods, large classes, duplicate code, etc.

### Duplication percentage
- **Range:** 0-100%
- **Description:** Percentage of duplicated code
- **Good value:** < 3%
- **Warning:** > 10% indicates excessive duplication

### Duplicated blocks
- **Description:** Number of duplicated code blocks
- **Good value:** 0
- **Warning:** > 5 indicates copy-paste programming

### Duplicated lines
- **Description:** Total lines of duplicated code
- **Good value:** < 50
- **Warning:** > 200 indicates significant duplication

## Object-oriented metrics

Metrics specific to object-oriented design.

### Lack of cohesion of methods (LCOM)
- **Description:** Measure of class cohesion based on method relationships
- **Good value:** < 2.0
- **Warning:** > 3.0 indicates low cohesion
- **Note:** Lower is better; high LCOM suggests class should be split

## Module categories

Classification of modules by their role in the architecture.

### Core modules
- **Description:** Central business logic and domain modules
- **Typical:** 10-30% of codebase
- **Note:** Should be stable and well-tested

### Feature modules
- **Description:** Specific feature implementations
- **Typical:** 40-60% of codebase
- **Note:** Most active development area

### Utility modules
- **Description:** Helper functions and shared utilities
- **Typical:** 10-20% of codebase
- **Note:** Should have high fan-in, low fan-out

### Test modules
- **Description:** Test files and test utilities
- **Typical:** 20-40% of codebase
- **Note:** Should match or exceed production code

### Config modules
- **Description:** Configuration and setup files
- **Typical:** 5-10% of codebase
- **Note:** Should be minimal and simple

## Anti-patterns

Common design and implementation problems.

### Severity levels
- **Critical:** Requires immediate attention, high risk
- **High:** Should be fixed soon, significant impact
- **Medium:** Should be addressed, moderate impact
- **Low:** Nice to fix, minor impact

### Common anti-patterns
- **God module:** Module with too many responsibilities
- **Circular dependency:** Modules that depend on each other
- **Dead code:** Unused code that should be removed
- **Long method:** Methods that are too long and complex
- **Large class:** Classes with too many responsibilities
- **Feature envy:** Method using more features of another class
- **Data clump:** Same group of data appearing together
- **Primitive obsession:** Overuse of primitive types
- **Switch statements:** Complex conditional logic
- **Lazy class:** Class that doesn't do enough
- **Speculative generality:** Unused abstraction
- **Message chains:** Long chains of method calls
- **Middle man:** Class that only delegates to others
- **Inappropriate intimacy:** Classes too dependent on each other
- **Alternative classes:** Classes with different interfaces doing similar things
- **Incomplete library:** Missing functionality in libraries
- **Refused bequest:** Subclass not using inherited methods
- **Comments:** Excessive comments indicating unclear code

## Quality gates

Pass/fail checks for code quality standards.

### Cyclomatic complexity gate
- **Threshold:** < 15 per function
- **Purpose:** Ensure code is not too complex

### Maintainability index gate
- **Threshold:** > 65
- **Purpose:** Ensure code is maintainable

### Test coverage gate
- **Threshold:** > 70%
- **Purpose:** Ensure adequate testing

### Coupling gate
- **Threshold:** < 40%
- **Purpose:** Ensure loose coupling

### Duplication gate
- **Threshold:** < 5%
- **Purpose:** Minimize code duplication

### Security issues gate
- **Threshold:** 0 critical issues
- **Purpose:** Ensure no critical vulnerabilities

### Technical debt gate
- **Threshold:** < 10% of development time
- **Purpose:** Keep debt manageable

## Hotspots

Modules that require attention based on multiple factors.

### Hotspot criteria
- High complexity
- Many dependencies
- Frequent changes (if Git analysis enabled)
- Low test coverage
- Multiple anti-patterns

### Hotspot priority
- **Critical:** Multiple severe issues, high risk
- **High:** Several issues, should be addressed
- **Medium:** Some issues, monitor closely
- **Low:** Minor concerns, low priority

## Trends (if enabled)

Historical analysis of code quality over time.

### Trend indicators
- **Improving:** Metrics getting better over time
- **Stable:** Metrics staying consistent
- **Degrading:** Metrics getting worse over time

### Tracked metrics
- Health score over time
- Complexity trends
- Test coverage trends
- Technical debt accumulation
- Issue count trends

## Team analytics (if enabled)

Metrics about team contributions and collaboration.

### Contributor metrics
- Number of active contributors
- Contribution distribution
- Code ownership patterns
- Collaboration patterns

### Module ownership
- Primary owner (most commits)
- Secondary owners
- Shared ownership level
- Orphaned modules (no clear owner)

## Industry comparison (if enabled)

Comparison with industry benchmarks and standards.

### Benchmark categories
- **Excellent:** Top 10% of projects
- **Good:** Top 25% of projects
- **Average:** Middle 50% of projects
- **Below average:** Bottom 25% of projects
- **Poor:** Bottom 10% of projects

### Compared metrics
- Health score
- Test coverage
- Complexity
- Technical debt
- Code quality

## Refactoring proposals

Suggested improvements to address issues.

### Proposal types
- **Extract method:** Break down long methods
- **Extract class:** Split large classes
- **Move method:** Relocate misplaced methods
- **Rename:** Improve naming clarity
- **Remove duplication:** Eliminate duplicate code
- **Simplify conditional:** Reduce complex conditions
- **Introduce parameter object:** Group related parameters
- **Replace magic number:** Use named constants
- **Encapsulate field:** Add getters/setters
- **Remove dead code:** Delete unused code

### Proposal priority
- **High:** Addresses critical or high severity issues
- **Medium:** Improves code quality significantly
- **Low:** Minor improvements

### Effort estimation
- **Small:** < 1 hour
- **Medium:** 1-4 hours
- **Large:** > 4 hours

## Understanding your results

### Good health indicators
- Overall health score > 80
- Low coupling (< 30%)
- High cohesion (> 70%)
- Low complexity (< 10 per function)
- High test coverage (> 80%)
- Few or no anti-patterns
- Low technical debt

### Warning signs
- Health score < 70
- High coupling (> 50%)
- Low cohesion (< 50%)
- High complexity (> 15 per function)
- Low test coverage (< 60%)
- Multiple anti-patterns
- Growing technical debt

### Critical issues
- Health score < 60
- Circular dependencies
- Critical security issues
- Very high complexity (> 30)
- Very low test coverage (< 40%)
- Many critical anti-patterns
- Excessive technical debt

## Taking action

### Priority order
1. Fix critical security issues
2. Break circular dependencies
3. Address critical anti-patterns
4. Reduce high complexity
5. Improve test coverage
6. Reduce coupling
7. Eliminate duplication
8. Address medium/low issues

### Continuous improvement
- Run analysis regularly (weekly/monthly)
- Track trends over time
- Set quality gates in CI/CD
- Review hotspots in code reviews
- Allocate time for technical debt
- Celebrate improvements

## Additional resources

- See `DOCUMENTATION.md` for usage details
- See `TECHNICAL.md` for implementation details
- See `FEATURES.md` for feature descriptions
- See `web/README.md` for web interface guide
