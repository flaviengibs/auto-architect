# Quick start guide - Auto-architect web interface

Get started with the web interface in 3 easy steps!

## Step 1: choose your method

### Method A: simple (no backend)
Just open the HTML file - perfect for trying out the UI:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

**⚠️ Important:** This runs in **demo mode** with **simulated** results:
- Your files are detected correctly
- But the analysis is **fake** - randomly generated
- Issues shown (like "service.ts") are mock examples
- File names may not match your actual files
- Use this only to test the interface

**For real analysis, use method B below.**

### Method B: full features (with backend)
Run the server for real analysis:

```bash
# Install dependencies (first time only)
npm install

# Start server
npm start
```

Then open http://localhost:3000 in your browser.

## Step 2: upload your project

1. **Drag & drop**
   - Drag your project folder onto the upload area
   - All supported files will be detected automatically

2. **Or browse**
   - Click "Select project folder"
   - Choose your project directory
   - Click "Select folder"

## Step 3: analyze

1. **Select options** (optional)
   - Check features you want:
     - Security analysis
     - Performance analysis
     - Team analytics
     - And more...

2. **Click "Start analysis"**
   - Watch the progress bar
   - See each step complete
   - Wait for results

3. **View results**
   - Health score and grade
   - Detailed metrics
   - Issues found
   - Refactoring proposals
   - Visualizations

4. **Export** (optional)
   - Download as JSON, HTML, Markdown, or CSV
   - Share with your team
   - Track over time

## Supported file types

The interface automatically detects these languages:

- TypeScript/JavaScript
- Python
- Java
- Go
- C#
- PHP
- Ruby
- Rust
- Kotlin
- Swift
- C/C++
- HTML
- SQL
- And more!

## Tips

### For best results

1. **Upload complete projects** - include all source files
2. **Enable Git analysis** - if your project has Git history
3. **Set realistic thresholds** - default is 70, adjust as needed
4. **Export results** - keep track of improvements over time

### Troubleshooting

**Files not detected?**
- Make sure files have correct extensions
- Check that you uploaded the right folder

**Analysis taking too long?**
- Large projects (1000+ files) may take a few minutes
- Consider analyzing specific directories

**Results look wrong?**
- In demo mode (method A), results are simulated
- Use method B for real analysis

## What's next?

After your first analysis:

1. **Review issues** - check the Issues tab
2. **Read proposals** - see Refactoring tab
3. **Export report** - share with team
4. **Fix issues** - implement suggestions
5. **Re-analyze** - track improvements

## Need help?

- Check `README.md` for detailed documentation
- See `../README.md` for CLI usage
- Report issues on GitHub

## Example workflow

```
1. Upload project folder
   ↓
2. Enable "Security" and "Performance"
   ↓
3. Set threshold to 70
   ↓
4. Click "Start analysis"
   ↓
5. Review health score (e.g., 65/100 - grade C)
   ↓
6. Check Issues tab (e.g., 12 issues found)
   ↓
7. Read Refactoring proposals (e.g., 8 proposals)
   ↓
8. Export as HTML
   ↓
9. Fix top 3 critical issues
   ↓
10. Re-analyze to see improvement!
```

## Advanced usage

### Custom thresholds

Adjust the health score threshold based on your project:
- **Strict** (80+): production-critical code
- **Standard** (70): most projects
- **Lenient** (50): legacy code, prototypes

### Combining features

Enable multiple features for comprehensive analysis:
- Security + performance = production readiness
- Team + Git = collaboration insights
- Trends + compare = progress tracking

### Regular analysis

Run analysis regularly:
- **Daily**: during active development
- **Weekly**: for maintenance projects
- **Before releases**: quality gates
- **After refactoring**: verify improvements

---

Happy analyzing!
