# Backend Setup Guide

Complete guide to set up the Auto-Architect web backend for real analysis.

## Prerequisites

- Node.js 16+ installed
- npm installed
- Auto-Architect project cloned

## Step-by-Step Setup

### 1. Build the CLI (from root directory)

First, you need to build the Auto-Architect CLI:

```bash
# Navigate to project root (parent of web/ directory)
cd ..

# Install dependencies
npm install

# Build the CLI
npm run build

# Verify build
ls dist/cli/index.js  # Should exist
```

### 2. Install Web Dependencies

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install
```

### 3. Test Setup

```bash
# Run test script
npm test
```

You should see:
```
✅ All checks passed! You can now run: npm start
```

### 4. Start Server

```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏗️  Auto-Architect Web Server                      ║
║                                                       ║
║   Server running on: http://localhost:3000           ║
║   Version: 3.2.0                                      ║
║                                                       ║
║   Open your browser and start analyzing!             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### 5. Open Browser

Open http://localhost:3000 in your browser.

### 6. Upload and Analyze

1. Drag and drop your project folder
2. Select analysis options
3. Click "Start Analysis"
4. Wait for real analysis to complete
5. View results (should show "✅ Real Analysis" banner)

## Troubleshooting

### Error: "CLI not found"

**Problem:** The Auto-Architect CLI hasn't been built.

**Solution:**
```bash
cd ..  # Go to root directory
npm run build
cd web
npm start
```

### Error: "Cannot find module 'express'"

**Problem:** Web dependencies not installed.

**Solution:**
```bash
cd web
npm install
npm start
```

### Error: "EADDRINUSE: address already in use"

**Problem:** Port 3000 is already in use.

**Solution:**
```bash
# Option 1: Stop other process using port 3000
# Option 2: Use different port
PORT=3001 npm start
```

Then open http://localhost:3001

### Error: "Analysis failed"

**Problem:** Various issues during analysis.

**Check:**
1. Are your files valid code files?
2. Is the project too large? (Try smaller subset)
3. Check server console for error details

### Still Shows "Demo Mode"

**Problem:** Frontend can't connect to backend.

**Check:**
1. Is server running? (Check terminal)
2. Is it on port 3000? (Check server output)
3. Open browser console (F12) - any errors?
4. Try: http://localhost:3000/api/health (should return `{"status":"ok"}`)

## Verification Checklist

Before reporting issues, verify:

- [ ] Node.js 16+ installed (`node --version`)
- [ ] In correct directory (`pwd` shows `.../web`)
- [ ] CLI built (`ls ../dist/cli/index.js` exists)
- [ ] Dependencies installed (`ls node_modules` has folders)
- [ ] Server running (terminal shows server message)
- [ ] Browser on http://localhost:3000
- [ ] No console errors (F12 in browser)

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

This uses nodemon to restart server on file changes.

## Production Deployment

For production deployment:

1. **Build CLI:**
   ```bash
   cd ..
   npm run build
   ```

2. **Install production dependencies:**
   ```bash
   cd web
   npm install --production
   ```

3. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

4. **Start with process manager:**
   ```bash
   # Using PM2
   pm2 start server.js --name auto-architect-web

   # Or using systemd, Docker, etc.
   ```

## Architecture

```
Root Directory/
├── dist/
│   └── cli/
│       └── index.js          ← Auto-Architect CLI (built)
├── src/                      ← Source code
├── web/
│   ├── node_modules/         ← Web dependencies
│   ├── uploads/              ← Temporary uploads (auto-created)
│   ├── server.js             ← Backend server
│   ├── index.html            ← Frontend
│   ├── app.js                ← Frontend logic
│   └── styles.css            ← Styles
└── package.json              ← Root dependencies
```

## How It Works

1. **Upload:** Browser sends files to `/api/analyze`
2. **Save:** Server saves files to `uploads/[timestamp]/`
3. **Analyze:** Server runs CLI: `node dist/cli/index.js analyze uploads/[timestamp]/ --format json`
4. **Return:** Server sends JSON results to browser
5. **Cleanup:** Server deletes uploaded files
6. **Display:** Browser shows real analysis results

## Security Notes

- Files are saved temporarily and deleted after analysis
- No files are stored permanently
- No data is sent to external servers
- For production, add authentication
- For production, add rate limiting
- For production, add file size limits

## Support

If you still have issues:

1. Run `npm test` and share output
2. Check server console for errors
3. Check browser console (F12) for errors
4. Share error messages
5. Report on GitHub with details

---

Last updated: 2026-02-26
