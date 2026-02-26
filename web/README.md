# Auto-architect web interface

A modern, drag-and-drop web interface for Auto-architect that allows you to analyze projects directly in your browser.

## Features

- Drag & drop project folders
- Interactive analysis options
- Real-time progress tracking
- Beautiful visual results
- Export in multiple formats (JSON, HTML, Markdown, CSV)
- Responsive design

## Quick start

### Option 1: open directly in browser (demo mode)

Simply open `index.html` in your web browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

**⚠️ This runs in demo mode with simulated results!**

### Option 2: run with backend (real analysis)

For real analysis of your code:

```bash
# 1. Build the CLI (from root directory)
cd ..
npm run build

# 2. Go to web directory
cd web

# 3. Install dependencies
npm install

# 4. Check setup (Windows)
check-setup.bat

# 4. Or check setup (Mac/Linux)
npm test

# 5. Start server
npm start

# 6. Open browser
# Go to http://localhost:3000
```

**✅ This will perform real analysis!**

See `SETUP.md` for detailed setup instructions and troubleshooting.

## How to use

1. **Upload project**
   - Drag and drop your project folder onto the upload area
   - Or click "Select project folder" to browse
   - Supported: 18 programming languages

2. **Configure options**
   - Select analysis features you want:
     - Security analysis
     - Performance analysis
     - Git history analysis
     - Documentation generation
     - Complexity heatmap
     - Quality trends
     - Team analytics
     - Industry comparison
     - Refactoring plan
   - Adjust quality thresholds

3. **Analyze**
   - Click "Start analysis"
   - Watch real-time progress
   - View results in interactive tabs

4. **Export results**
   - Download reports in your preferred format
   - JSON for programmatic access
   - HTML for sharing
   - Markdown for documentation
   - CSV for spreadsheet analysis

## Supported languages

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java)
- Go (.go)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Rust (.rs)
- Kotlin (.kt, .kts)
- Swift (.swift)
- C (.c, .h)
- C++ (.cpp, .cc, .cxx, .hpp)
- HTML (.html, .htm)
- Visual Basic (.vb)
- R (.R)
- SQL (.sql)
- Pascal (.pas, .pp)

## Current implementation

**Note:** This is a frontend-only demo by default. The current version:
- Full UI/UX implementation
- File upload and processing
- Options configuration
- Progress visualization
- Results display
- Export functionality
- Uses simulated analysis data in demo mode

**Important:** When you open `index.html` directly without the backend server:
- Results are **simulated/mock data** for demonstration
- File names from your project are used, but analysis is fake
- Issues and proposals are randomly generated
- Metrics are estimated, not calculated

**For real analysis:** Run the backend server (see below)

## Full implementation (backend required)

To connect this to the actual Auto-architect engine, you need:

1. **Backend API server**
   - Node.js/Express server
   - Receives uploaded files
   - Runs Auto-architect CLI
   - Returns analysis results

2. **File processing**
   - Save uploaded files temporarily
   - Run analysis with selected options
   - Stream progress updates
   - Return results as JSON

3. **WebSocket support** (optional)
   - Real-time progress updates
   - Live collaboration features

## Backend integration example

See `server.js` for a complete backend implementation that:
- Accepts file uploads
- Runs Auto-architect analysis
- Streams progress updates
- Returns results

## Browser compatibility

- Chrome/Edge: full support
- Firefox: full support
- Safari: full support
- Mobile browsers: responsive design

## Security notes

- Files are processed client-side (in demo mode)
- No data is sent to external servers
- For production, implement proper file validation
- Use HTTPS for file uploads
- Sanitize all user inputs

## Customization

### Styling
Edit `styles.css` to customize:
- Colors (CSS variables in `:root`)
- Layout and spacing
- Animations and transitions

### Features
Edit `app.js` to:
- Add new analysis options
- Customize result displays
- Add new export formats
- Integrate with backend API

## Future enhancements

- [ ] Real backend integration
- [ ] WebSocket for live updates
- [ ] Interactive dependency graphs
- [ ] Drill-down analysis views
- [ ] Comparison with previous analyses
- [ ] Team collaboration features
- [ ] Plugin system integration
- [ ] Dark/light theme toggle

## License

Same as Auto-architect main project (MIT)
