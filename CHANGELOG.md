# Changelog

All notable changes to Auto-Architect will be documented in this file.

## [2.1.0] - 2026-02-25

### Enhanced CLI and output options

#### New CLI flags
- `--verbose`: detailed analysis output with debug information and extended lists
- `--quiet`: minimal output showing only critical issues and final score
- `--summary`: quick overview without detailed breakdowns
- `--include <pattern>`: filter files to include using glob patterns
- `--exclude <pattern>`: filter files to exclude using glob patterns
- `--config <file>`: load analysis configuration from JSON file

#### New output formats
- CSV export format for metrics and statistics
- Added to existing JSON, HTML, and Markdown formats
- Use `--format csv` to export data for spreadsheet analysis

#### Enhanced reporting
- Verbose mode shows all issues, proposals, and hotspots
- Verbose mode includes module size distribution analysis
- Verbose mode displays dependency analysis details
- Quiet mode only shows critical and high severity issues
- Summary mode provides condensed overview of key metrics
- All modes respect the new filtering options

#### Configuration file support
- JSON configuration file for persistent settings
- CLI options override config file values
- Supports all analysis options (security, thresholds, patterns)
- Example: `auto-architect analyze --config .autoarchitect.json`

#### Technical improvements
- Updated reporter with printSummary() and printQuiet() methods
- Added generateCSV() for metrics export
- Enhanced printReport() with verbose parameter
- Improved error handling with verbose stack traces
- Better output control for CI/CD integration

#### Usage examples
```bash
# Verbose analysis with all details
auto-architect analyze --verbose

# Quiet mode for CI/CD
auto-architect analyze --quiet --threshold 80

# Summary only
auto-architect analyze --summary

# Filter specific files
auto-architect analyze --include "src/**/*.ts" --exclude "**/*.test.ts"

# Export to CSV
auto-architect analyze --format csv --output metrics.csv

# Use config file
auto-architect analyze --config .autoarchitect.json
```

## [2.0.1] - 2026-02-25

### Complete integration release

#### Completed integrations
- Go language support (.go files)
  - Full integration into dependency parser
  - Function and struct extraction
  - Import/export detection
  - Complexity calculation
  - Test file detection (_test.go)
- C# language support (.cs files)
  - Full integration into dependency parser
  - Method and class extraction
  - Using statement detection
  - Complexity calculation
  - Test file detection (Tests.cs)
- Halstead metrics
  - Vocabulary (unique operators + operands)
  - Program length
  - Volume
  - Difficulty
  - Effort
  - Time to program
  - Estimated bugs
  - Integrated into metrics analyzer
  - Displayed in all report formats
- Cognitive complexity
  - Based on SonarSource's metric
  - Nesting level tracking
  - Control flow detection
  - Logical operator counting
  - Integrated into metrics analyzer
  - Displayed in all report formats

#### Example projects
- Created example-go/ with 3 Go files
- Created example-csharp/ with 3 C# files
- Both demonstrate real-world patterns

#### Technical improvements
- Updated dependency-parser.ts to support .go and .cs
- Updated metrics-analyzer.ts with Halstead and Cognitive Complexity
- Updated types.ts with new metric fields
- Updated reporter.ts to display new metrics
- Fixed file path resolution for metric calculation

#### Statistics
- Total languages: 6 (TypeScript, JavaScript, Python, Java, Go, C#)
- Total metrics: 22+ (including 7 Halstead sub-metrics)
- Total modules: 21 TypeScript files
- Lines of code: 3,600+

## [2.0.0] - 2026-02-25

### Major release - multi-language and security

#### New features

##### Multi-language support
- Python support (.py files)
  - Function and class extraction
  - Import/export detection
  - Complexity calculation
  - Test file detection
- Java support (.java files)
  - Method and class extraction
  - Package and import detection
  - Complexity calculation
  - Test file detection (src/test/java)
- Language-agnostic architecture
  - Extensible parser system
  - Easy to add new languages

##### Security analysis
- SQL injection detection
- XSS vulnerability detection
- Hardcoded secrets detection
- Insecure randomness detection
- Path traversal detection
- Command injection detection
- Optional `--security` flag

##### Trend analysis
- Temporal comparison
  - Compare with previous reports
  - Detect improvements
  - Detect regressions
  - Calculate metrics changes
- `--compare <file>` option
- Formatted trend reports

##### Watch mode
- Real-time analysis
  - Automatic re-analysis on file changes
  - Configurable debounce
  - Recursive directory watching
  - Smart filtering (skip node_modules, dist, etc.)
- `watch` command with options
- Graceful shutdown (Ctrl+C)

#### Enhancements

##### CLI improvements
- `--security` flag for security analysis
- `--compare <file>` for trend analysis
- `watch` command with `--debounce` and `--threshold`
- Better error messages
- Progress indicators

##### Architecture
- Modular parser system
- Optional feature activation
- Better separation of concerns
- Extensible detector system

#### New files
- `src/parser/python-parser.ts` (150+ lines)
- `src/parser/java-parser.ts` (180+ lines)
- `src/detector/security-detector.ts` (200+ lines)
- `src/analyzer/trend-analyzer.ts` (150+ lines)
- `src/cli/watcher.ts` (120+ lines)
- `example-python/` (3 files)

#### Statistics
- New lines of code: ~1,000+
- New classes: 4
- New methods: 50+
- Languages supported: 4 (TypeScript, JavaScript, Python, Java)
- Security checks: 6 types
- Total features: 150+ (was 100+)

#### Breaking changes
- None (fully backward compatible)

## [1.0.0] - 2026-02-25

### Initial release

#### Core features

##### Parsing and analysis
- Recursive directory scanning with smart filtering
- TypeScript/JavaScript support (.ts, .tsx, .js, .jsx)
- Dependency graph construction (bidirectional)
- AST parsing for functions and classes
- Import/export extraction
- Test file detection

##### Metrics (15+)
- Basic metrics: modules, LOC, dependencies, complexity
- Quality metrics: coupling, cohesion, modularity, MI
- Advanced metrics: instability, abstractness, distance from main sequence
- Health metrics: test coverage, technical debt, code smells
- Hotspot identification

##### Anti-pattern detection (17 types)
- Structural: god module, circular dependency, tight coupling, dead code
- Code smells: long parameter list, large class, lazy class, data clump
- Design: feature envy, shotgun surgery, inappropriate intimacy
- Others: divergent change, message chains, middle man

##### Health score and quality gates
- 5-dimensional health score (architecture, maintainability, testability, security, performance)
- Letter grade (A-F)
- 7 configurable quality gates
- Pass/fail status with severity levels

##### Refactoring proposals (10+ types)
- Extract service, split module, break cycle
- Extract class, move method, inline class
- Parameter object, extract interface
- Priority levels (critical/high/medium/low)
- Impact estimation (complexity, coupling, maintainability, effort, risk)
- Detailed steps and code examples
- Affected modules tracking

##### CLI and commands
- `analyze` command with multiple options
- `compare` command for report comparison
- `watch` command placeholder
- Exit codes for CI/CD integration
- Threshold and fail-on-critical options

##### Export formats
- Console (colored, formatted)
- JSON (complete data)
- Markdown (GitHub-compatible)
- HTML (standalone, styled)

##### Visualization
- Mermaid diagrams
- DOT/Graphviz diagrams
- Problem highlighting

#### Technical implementation

##### Architecture
- Modular design with clear separation of concerns
- Strategy pattern for detectors
- Factory pattern for proposals
- Facade pattern for main analyzer
- TypeScript with strict typing
- Comprehensive interfaces and types

##### Algorithms
- DFS for cycle detection (O(V + E))
- Graph traversal for metrics
- Efficient sorting and filtering
- Lazy evaluation where appropriate

##### Performance
- Linear complexity for most operations
- Smart directory filtering
- Result limiting (top N)
- Memory-efficient data structures

#### Documentation
- Comprehensive README
- Technical documentation (TECHNICAL.md)
- Feature list (FEATURES.md)
- Interview guide (INTERVIEW_GUIDE.md)
- Demo guide (DEMO.md)
- Changelog (this file)

#### Examples
- Example project with intentional anti-patterns
- Self-analysis capability
- Multiple output format examples

### Statistics

- Files: 13 TypeScript modules
- Lines of code: ~2,300
- Functions: 80+
- Classes: 10+
- Interfaces: 15+
- Anti-pattern types: 17
- Metrics: 15+
- Refactoring types: 10+
- Export formats: 4
- Quality gates: 7

### Known limitations

- Regex-based parsing (not full AST)
- Simulated test coverage (not real coverage data)
- TypeScript/JavaScript only
- No test suite yet
- Some heuristics may have false positives

## [Unreleased]

### Planned features

#### Short term (v1.1.0)
- [ ] Unit test suite
- [ ] Integration tests
- [ ] Real AST parsing with Tree-sitter
- [ ] Actual test coverage integration
- [ ] Python support
- [ ] Java support

#### Medium Term (v1.2.0)
- [ ] VS Code plugin
- [ ] GitHub Actions integration
- [ ] GitLab CI integration
- [ ] Web dashboard
- [ ] Trend analysis
- [ ] API REST

#### Long Term (v2.0.0)
- [ ] Machine Learning predictions
- [ ] Security vulnerability detection
- [ ] Performance analysis
- [ ] Multi-language support (Go, C#, Rust)
- [ ] Real-time analysis
- [ ] Collaborative features

### Potential improvements

#### Code quality
- [ ] Increase test coverage to 80%+
- [ ] Add property-based tests
- [ ] Implement benchmarks
- [ ] Add performance tests
- [ ] Improve error handling

#### Features
- [ ] Incremental analysis
- [ ] Parallel processing
- [ ] Caching system
- [ ] Plugin system
- [ ] Custom rules
- [ ] Configuration file

#### UX/DX
- [ ] Interactive mode
- [ ] Progress bars
- [ ] Better error messages
- [ ] Autocomplete
- [ ] Help system

#### Documentation
- [ ] API documentation
- [ ] Video tutorials
- [ ] Blog posts
- [ ] Case studies
- [ ] Best practices guide

## Version history

### Version numbering

We follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality (backwards compatible)
- PATCH version for bug fixes (backwards compatible)

### Release process

1. Update CHANGELOG.md
2. Update version in package.json
3. Run tests (when available)
4. Build: `npm run build`
5. Tag: `git tag v1.0.0`
6. Push: `git push --tags`
7. Publish: `npm publish` (if public)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when test suite exists)
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

Inspired by:
- Google's Tricorder
- Amazon's CodeGuru
- Meta's Infer
- Microsoft's Code Analysis
- SonarQube
- ESLint

Based on research by:
- Robert C. Martin (Clean Architecture, SOLID)
- Martin Fowler (Refactoring, Code Smells)
- Gang of Four (Design Patterns)
- Microsoft Research (Maintainability Index)

## Contact

For questions, suggestions, or issues:
- GitHub Issues: [link]
- Email: [your-email]
- Twitter: [@your-handle]

---

Thank you for using Auto-Architect!
