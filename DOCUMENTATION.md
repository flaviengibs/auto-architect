# Documentation

Complete documentation for Auto-Architect.

## Quick links

- [README.md](README.md) - Main documentation and usage guide
- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [TECHNICAL.md](TECHNICAL.md) - Technical architecture and algorithms
- [FEATURES.md](FEATURES.md) - Complete feature list

## Documentation structure

### Essential files (root)
- **README.md** - Main documentation (English version)
- **CHANGELOG.md** - Version history
- **TECHNICAL.md** - Technical documentation
- **FEATURES.md** - Feature list and status
- **LICENSE** - MIT License

### Example projects
- **example-project/** - TypeScript example with anti-patterns
- **example-python/** - Python example with security issues
- **example-go/** - Go example
- **example-csharp/** - C# example

### Reports
Generated reports are excluded from git (see .gitignore):
- `*-report.json` - JSON reports
- `*-report.md` - Markdown reports
- `*-report.html` - HTML reports

## For different audiences

### For developers
1. Read [README.md](README.md) for installation and usage
2. Check [FEATURES.md](FEATURES.md) for complete feature list
3. Review [TECHNICAL.md](TECHNICAL.md) for architecture details

### For recruiters
1. Quick overview: [README.md](README.md) (5 min)
2. Technical depth: [TECHNICAL.md](TECHNICAL.md) (10 min)
3. Feature scope: [FEATURES.md](FEATURES.md) (5 min)

### For contributors
1. Understand architecture: [TECHNICAL.md](TECHNICAL.md)
2. Check current features: [FEATURES.md](FEATURES.md)
3. Review recent changes: [CHANGELOG.md](CHANGELOG.md)

## Project statistics

- Languages supported: 6 (TypeScript, JavaScript, Python, Java, Go, C#)
- Metrics calculated: 22+
- Anti-patterns detected: 23+
- Lines of code: 3,600+
- Modules: 21 TypeScript files

## Quick start

```bash
# Install dependencies
npm install

# Build project
npm run build

# Analyze example project
node dist/cli/index.js analyze example-project

# Analyze with security checks
node dist/cli/index.js analyze example-python --security

# Generate HTML report
node dist/cli/index.js analyze --format html --output report.html
```

## CI/CD integration

```bash
# In your pipeline
node dist/cli/index.js analyze \
  --format json \
  --output architecture-report.json \
  --threshold 70 \
  --fail-on-critical
```

## License

MIT - See LICENSE file for details
