# Quick Start Guide - Auto-Architect Web Interface

Get started with the web interface in 3 easy steps!

## Step 1: Choose Your Method

### Method A: Simple (No Backend)
Just open the HTML file - perfect for trying out the UI:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

**⚠️ IMPORTANT:** This runs in **DEMO MODE** with **SIMULATED** results:
- Your files are detected correctly
- But the analysis is **FAKE** - randomly generated
- Issues shown (like "service.ts") are mock examples
- File names may not match your actual files
- Use this only to test the interface

**For real analysis, use Method B below.**

### Method B: Full Features (With Backend)
Run the server for real analysis:

```bash
# Install dependencies (first time only)
npm install

# Start server
npm start
```

Then open http://localhost:3000 in your browser.

## Step 2: Upload Your Project

1. **Drag & Drop**
   - Drag your project folder onto the upload area
   - All supported files will be detected automatically

2. **Or Browse**
   - Click "Select Project Folder"
   - Choose your project directory
   - Click "Select Folder"

## Step 3: Analyze

1. **Select Options** (optional)
   - Check features you want:
     - ✅ Security analysis
     - ✅ Performance analysis
     - ✅ Team analytics
     - ✅ And more...

2. **Click "Start Analysis"**
   - Watch the progress bar
   - See each step complete
   - Wait for results

3. **View Results**
   - Health score and grade
   - Detailed metrics
   - Issues found
   - Refactoring proposals
   - Visualizations

4. **Export** (optional)
   - Download as JSON, HTML, Markdown, or CSV
   - Share with your team
   - Track over time

## Supported File Types

The interface automatically detects these languages:

- 📘 TypeScript/JavaScript
- 🐍 Python
- ☕ Java
- 🐹 Go
- 🔷 C#
- 🐘 PHP
- 💎 Ruby
- 🦀 Rust
- 🎯 Kotlin
- 🦅 Swift
- ⚙️ C/C++
- 🌐 HTML
- 🗄️ SQL
- And more!

## Tips

### For Best Results

1. **Upload complete projects** - Include all source files
2. **Enable Git analysis** - If your project has Git history
3. **Set realistic thresholds** - Default is 70, adjust as needed
4. **Export results** - Keep track of improvements over time

### Troubleshooting

**Files not detected?**
- Make sure files have correct extensions
- Check that you uploaded the right folder

**Analysis taking too long?**
- Large projects (1000+ files) may take a few minutes
- Consider analyzing specific directories

**Results look wrong?**
- In demo mode (Method A), results are simulated
- Use Method B for real analysis

## What's Next?

After your first analysis:

1. **Review issues** - Check the Issues tab
2. **Read proposals** - See Refactoring tab
3. **Export report** - Share with team
4. **Fix issues** - Implement suggestions
5. **Re-analyze** - Track improvements

## Need Help?

- Check `README.md` for detailed documentation
- See `../README.md` for CLI usage
- Report issues on GitHub

## Example Workflow

```
1. Upload project folder
   ↓
2. Enable "Security" and "Performance"
   ↓
3. Set threshold to 70
   ↓
4. Click "Start Analysis"
   ↓
5. Review health score (e.g., 65/100 - Grade C)
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

## Advanced Usage

### Custom Thresholds

Adjust the health score threshold based on your project:
- **Strict** (80+): Production-critical code
- **Standard** (70): Most projects
- **Lenient** (50): Legacy code, prototypes

### Combining Features

Enable multiple features for comprehensive analysis:
- Security + Performance = Production readiness
- Team + Git = Collaboration insights
- Trends + Compare = Progress tracking

### Regular Analysis

Run analysis regularly:
- **Daily**: During active development
- **Weekly**: For maintenance projects
- **Before releases**: Quality gates
- **After refactoring**: Verify improvements

---

Happy analyzing! 🏗️
